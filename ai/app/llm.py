"""Gọi LLM OpenAI-compatible cho endpoint quiz/chat.

Cấu hình qua biến môi trường: LLM_API_KEY (bắt buộc), LLM_BASE_URL (endpoint
OpenAI-compatible; trống → api.openai.com), LLM_MODEL. Lỗi gọi/parse →
raise LLMError (service map HTTP 502, backend map AI_SERVICE_UNAVAILABLE).
"""
import json
import logging
import os

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


class LLMError(RuntimeError):
    """LLM không khả dụng (thiếu key, gọi API thất bại...) — backend map AI_SERVICE_UNAVAILABLE."""


def generate(req: QuizChatRequest, catalog_note: str = "") -> QuizChatResponse:
    """Điểm vào: gọi LLM thật (LLM_API_KEY bắt buộc; lỗi → LLMError)."""
    if not os.environ.get("LLM_API_KEY", "").strip():
        raise LLMError("LLM_API_KEY chưa cấu hình")

    if not catalog_note:
        catalog_note = build_catalog_note(req.skill_catalog)

    try:
        return generate_openai(req, catalog_note)
    except LLMError:
        raise
    except Exception as exc:  # lỗi API/parse → để service quyết định response 502
        log.warning("Gọi LLM thất bại: %s", exc)
        raise LLMError(str(exc)) from exc
