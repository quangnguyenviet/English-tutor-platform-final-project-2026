"""Gọi LLM cho endpoint quiz/chat.

Hai provider (biến LLM_PROVIDER):
- ``openai`` (mặc định): gọi OpenAI bằng SDK; bắt buộc LLM_API_KEY.
- ``mock``: không tốn token — dùng đúng ``skill_catalog`` + ``cefr_hint``
  của request để dựng 3-5 câu hỏi mẫu có sẵn. Tự bật khi LLM_API_KEY
  trống (kể cả khi LLM_PROVIDER=openai) để demo end-to-end.
"""
import json
import logging
import os

from .prompt import build_catalog_note, build_messages
from .schemas import DraftQuestion, QuizChatRequest, QuizChatResponse

log = logging.getLogger(__name__)

MAX_DRAFT_QUESTIONS = 5


def _selected_skills(req: QuizChatRequest):
    """Kỹ năng ưu tiên: error_rate cao nhất trong SKP, fallback catalog."""
    stats = []
    for s in req.skill_profile:
        d = s if isinstance(s, dict) else s.model_dump()
        if d.get("error_rate") is not None:
            stats.append((d["error_rate"], d.get("skill_code"), d.get("skill_name")))
    if stats:
        stats.sort(reverse=True)
        return [(code, name) for _, code, name in stats][:MAX_DRAFT_QUESTIONS]

    catalog = []
    for c in req.skill_catalog:
        d = c if isinstance(c, dict) else c.model_dump()
        if d.get("skill_code"):
            catalog.append((d["skill_code"], d.get("skill_name")))
    return catalog[:MAX_DRAFT_QUESTIONS]


# Bộ mẫu câu hỏi dùng cho provider mock — mỗi entry đủ ngắn, luôn đúng
# schema AD-4 (4 phương án A-D, explanation tiếng Việt). Mock chấm điểm entry
# theo (skill trọng tâm của học sinh, cefr khớp gợi ý) rồi lấy top 5.
_MOCK_BANK = [
    {
        "content": "She ____ to school by bus every morning.",
        "options": {"A": "go", "B": "goes", "C": "going", "D": "gone"},
        "correct": "B",
        "explanation": "Ngôi thứ ba số ít ở thì hiện tại đơn (she/he/it) động từ thêm -s/-es nên đáp án là \"goes\".",
        "cefr": "A1",
        "skill": "present_simple",
    },
    {
        "content": "Which sentence uses the Present Simple correctly for a habit?",
        "options": {
            "A": "I am play football on Sundays.",
            "B": "I plays football every Sunday.",
            "C": "I play football every Sunday.",
            "D": "I played football every Sunday now.",
        },
        "correct": "C",
        "explanation": "Thói quen lặp lại dùng thì hiện tại đơn; chủ ngữ I không thêm -s nên \"I play\" là đúng.",
        "cefr": "A2",
        "skill": "present_simple",
    },
    {
        "content": "Yesterday, I ____ my grandmother at the market.",
        "options": {"A": "helps", "B": "helped", "C": "helping", "D": "have helped"},
        "correct": "B",
        "explanation": "Kể lại sự việc quá khứ có mốc \"yesterday\" dùng quá khứ đơn (V-ed) → \"helped\".",
        "cefr": "A1",
        "skill": "narrative_tense",
    },
    {
        "content": "Put the verbs in brackets into the correct past tense: \"Last week, we (visit) ____ our teacher and she (explain) ____ the new lesson.\"",
        "options": {
            "A": "visited / explained",
            "B": "visit / explain",
            "C": "were visiting / were explaining",
            "D": "have visited / has explained",
        },
        "correct": "A",
        "explanation": "Hành động hoàn tất ở quá khứ có mốc \"last week\" → quá khứ đơn cho cả hai động từ.",
        "cefr": "B1",
        "skill": "narrative_tense",
    },
    {
        "content": "This year, our class ____ an English competition twice.",
        "options": {"A": "joined", "B": "has joined", "C": "joining", "D": "was joining"},
        "correct": "B",
        "explanation": "\"This year\" + twice liên kết quá khứ và hiện tại → thì hiện tại hoàn thành (has/have + V3).",
        "cefr": "B1",
        "skill": "present_perfect",
    },
    {
        "content": "I have lived in Hanoi ____ 2019.",
        "options": {"A": "since", "B": "for", "C": "from", "D": "at"},
        "correct": "A",
        "explanation": "Hiện tại hoàn thành dùng \"since\" + mốc thời gian (2019); \"for\" dùng với khoảng thời gian.",
        "cefr": "B1",
        "skill": "present_perfect",
    },
]


def mock_questions(req: QuizChatRequest) -> list[DraftQuestion]:
    """Chọn tới 5 câu từ bank, ưu tiên skill trọng tâm + cefr khớp gợi ý."""
    hint = req.cefr_hint
    focus = [code for code, _ in _selected_skills(req)]

    scored = []
    for entry in _MOCK_BANK:
        score = 0
        if entry.get("skill") in focus:
            score += 3
        if hint and entry["cefr"] == hint:
            score += 2
        elif not hint:
            score += 1
        scored.append((score, entry))

    scored.sort(key=lambda p: p[0], reverse=True)
    picked = [entry for _, entry in scored[:MAX_DRAFT_QUESTIONS]]
    return [DraftQuestion.model_validate(p) for p in picked]


def _mock_reply(req: QuizChatRequest, questions: list[DraftQuestion]) -> str:
    cefs = ", ".join(sorted({q.cefr for q in questions})) or (req.cefr_hint or "A2")
    skills = [q.skill for q in questions if q.skill]
    note = (
        " (trọng tâm kỹ năng: " + ", ".join(skills) + ")" if skills else ""
    )
    return (
        f"Tôi đã soạn {len(questions)} câu trắc nghiệm cấp độ {cefs}{note}. "
        "Đây là chế độ mô phỏng (LLM_API_KEY chưa cấu hình) — câu hỏi được chọn "
        "từ bộ mẫu theo hồ sơ kỹ năng của học sinh. Gia sư nên rà soát lại nội dung "
        "trước khi giao bài."
    )


def generate_openai(req: QuizChatRequest, catalog_note: str = "") -> QuizChatResponse:
    """Gọi OpenAI (LLM_MODEL), ép JSON ra QuizChatSchema. Lỗi → raise LLMError."""
    from openai import OpenAI

    client = OpenAI(api_key=os.environ.get("LLM_API_KEY"))
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
    """Điểm vào chung: chọn provider theo LLM_PROVIDER / LLM_API_KEY."""
    provider = os.environ.get("LLM_PROVIDER", "openai").lower()
    api_key = os.environ.get("LLM_API_KEY", "").strip()

    if not catalog_note:
        catalog_note = build_catalog_note(req.skill_catalog)

    if provider == "mock" or not api_key:
        log.info("LLM provider=mock (key trống: %s) — dùng bộ câu hỏi mẫu", bool(api_key))
        questions = mock_questions(req)
        return QuizChatResponse(reply=_mock_reply(req, questions), questions=questions)

    try:
        return generate_openai(req, catalog_note)
    except LLMError:
        raise
    except Exception as exc:  # lỗi API/parse → để service quyết định response 502
        log.warning("Gọi LLM thất bại: %s", exc)
        raise LLMError(str(exc)) from exc
