"""Gọi LLM cho endpoint quiz/chat.

Hai provider (chọn bằng LLM_PROVIDER, mặc định "openai"), cùng dùng LLM_BASE_URL
và LLM_API_KEY:
- openai: OpenAI-compatible bằng SDK OpenAI (LLM_BASE_URL trống → api.openai.com),
  LLM_MODEL.
- anthropic: Messages API native bằng thư viện `requests` — dùng khi endpoint
  trả định dạng Anthropic native (append /v1/messages vào LLM_BASE_URL tự
  động; LLM_BASE_URL trống → api.anthropic.com).

Lỗi gọi/parse → raise LLMError (service map HTTP 502, backend map
AI_SERVICE_UNAVAILABLE).
"""
import json
import logging
import os

import requests

from .prompt import build_catalog_note, build_messages
from .schemas import DraftQuestion, QuizChatRequest, QuizChatResponse

log = logging.getLogger(__name__)


def generate_openai(req: QuizChatRequest, catalog_note: str = "") -> QuizChatResponse:
    """Gọi OpenAI (LLM_MODEL), ép JSON ra QuizChatSchema. Lỗi → raise LLMError."""
    from openai import OpenAI

    base_url = os.environ.get("LLM_BASE_URL", "").strip() or None
    client = OpenAI(api_key=os.environ.get("LLM_API_KEY"), base_url=base_url)
    messages = build_messages(req, catalog_note)
    resp = client.chat.completions.create(
        model=os.environ.get("LLM_MODEL", "gpt-4o-mini"),
        messages=messages,
        temperature=0.4,
    )
    raw = resp.choices[0].message.content or ""

    # LLM có thể bọc JSON trong markdown fence — bóc ra rồi parse.
    text = raw.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    payload = json.loads(text)

    questions = [DraftQuestion.model_validate(q) for q in payload.get("questions", [])]
    return QuizChatResponse(
        reply=payload.get("reply", "Đã soạn bộ câu hỏi theo yêu cầu."),
        questions=questions,
    )


def generate_anthropic(req: QuizChatRequest, catalog_note: str = "") -> QuizChatResponse:
    """Gọi Messages API native (Anthropic hoặc proxy trả định dạng native).

    Endpoint lấy từ LLM_BASE_URL (vd https://api.anthropic.com) — tự
    append /v1/messages nếu thiếu, xác thực bằng LLM_API_KEY (header
    x-api-key). Content trả về dạng mảng block — chỉ lấy block type=text
    (bỏ block thinking). Lỗi → raise LLMError.
    """
    base = os.environ.get("LLM_BASE_URL", "").strip()
    if not base:
        base = "https://api.anthropic.com"
    if not base.endswith("/v1/messages"):
        base = base.rstrip("/") + "/v1/messages"
    body = {
        "model": os.environ.get("LLM_MODEL", "claude-sonnet-5-5"),
        "max_tokens": 8192,
        "temperature": 0.4,
        "messages": build_messages(req, catalog_note),
    }
    resp = requests.post(
        base,
        json=body,
        headers={
            "x-api-key": os.environ.get("LLM_API_KEY"),
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        timeout=120,
    )
    if resp.status_code >= 400:
        raise LLMError(f"LLM API {resp.status_code}: {resp.text[:300]}")
    data = resp.json()

    content = data.get("content") or []
    if isinstance(content, str):  # proxy biến thể: trả string thô
        raw = content
    else:
        raw = "".join(
            b.get("text", "") for b in content if isinstance(b, dict) and b.get("type") == "text"
        )
    return _parse_payload(raw)


def _parse_payload(raw: str) -> QuizChatResponse:
    """Ép chuỗi LLM ra JSON QuizDraftSchema (gỡ markdown fence nếu có)."""
    text = (raw or "").strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    payload = json.loads(text)
    questions = [DraftQuestion.model_validate(q) for q in payload.get("questions", [])]
    return QuizChatResponse(
        reply=payload.get("reply", "Đã soạn bộ câu hỏi theo yêu cầu."),
        questions=questions,
    )


class LLMError(RuntimeError):
    """LLM không khả dụng (thiếu key, gọi API thất bại...) — backend map AI_SERVICE_UNAVAILABLE."""


def generate(req: QuizChatRequest, catalog_note: str = "") -> QuizChatResponse:
    """Điểm vào: gọi LLM theo LLM_PROVIDER (mặc định openai; lỗi → LLMError).

    LLM_API_KEY bắt buộc với mọi provider. LLM_PROVIDER=anthropic → gọi
    Messages API native (dùng khi endpoint trả định dạng Anthropic native).
    """
    if not os.environ.get("LLM_API_KEY", "").strip():
        raise LLMError("LLM_API_KEY chưa cấu hình")

    if not catalog_note:
        catalog_note = build_catalog_note(req.skill_catalog)

    provider = os.environ.get("LLM_PROVIDER", "openai").strip().lower() or "openai"
    if provider == "anthropic":
        runner = generate_anthropic
    elif provider == "openai":
        runner = generate_openai
    else:
        raise LLMError(f"LLM_PROVIDER không hợp lệ: {provider!r} (cho phép: openai, anthropic)")

    try:
        return runner(req, catalog_note)
    except LLMError:
        raise
    except Exception as exc:  # lỗi API/parse → để service quyết định response 502
        log.warning("Gọi LLM thất bại: %s", exc)
        raise LLMError(str(exc)) from exc
