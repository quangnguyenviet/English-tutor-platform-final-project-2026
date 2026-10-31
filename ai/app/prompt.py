"""Gom prompt cho AI service soạn quiz (AD-2: chỉ dữ liệu ẩn danh).

Prompt được dựng từ: thông tin học sinh ẩn danh, thống kê kỹ năng (SKP),
bản nháp câu hỏi hiện tại (nếu đang sửa), tin hội thoại gần nhất và yêu
cầu của gia sư. Đầu ra yêu cầu JSON đúng QuizDraftSchema (AD-4).
"""
import json

from .schemas import QuizChatRequest, CEFR_LEVELS

SYSTEM_PROMPT = """\
Bạn là trợ lý soạn quiz cho gia sư tiếng Anh của trung tâm EnglishPath.
Nhiệm vụ: dựa vào yêu cầu của gia sư và hồ sơ kỹ năng (SKP) của học sinh,
soạn hoặc chỉnh sửa bộ câu hỏi trắc nghiệm A/B/C/D tiếng Anh.

Nguyên tắc:
1. Câu hỏi và 4 phương án (A, B, C, D) bằng TIẾNG ANH, phù hợp cấp độ CEFR
   được yêu cầu (một trong {cefr_levels}).
2. Lời giải thích (explanation) bằng TIẾNG VIỆT, ngắn gọn (1-2 câu),
   chỉ rõ vì sao đáp án đúng đúng và các phương án khác sai ở điểm nào.
3. Ưu tiên kỹ năng học sinh hay sai nhất (error_rate cao) và kỹ năng lâu
   chưa ôn (last_practiced_at xa nhất).skill: dùng skill_code đúng từ
   danh sách kỹ năng được cung cấp; nếu không khớp thì để null.
4. Câu hỏi phải nguyên bản, sát ngữ cảnh học sinh (trường, khối lớp,
   mục tiêu học), không lấy nguyên văn đề thi.
5. Chỉ trả JSON hợp lệ, KHÔNG kèm giải thích văn bản bên ngoài khối JSON.

Định dạng JSON trả về (bắt buộc đúng cấu trúc này):
{
  "reply": "<nhận xét ngắn bằng tiếng Việt về bộ câu hỏi vừa soạn/sửa>",
  "questions": [
    {
      "content": "...",
      "options": {"A": "...", "B": "...", "C": "...", "D": "..."},
      "correct": "A|B|C|D",
      "explanation": "...",
      "cefr": "A1|A2|B1|B2|C1|C2",
      "skill": "<skill_code hoặc null>"
    }
  ]
}
Số lượng câu: theo yêu cầu của gia sư (mặc định 5 nếu không nói rõ).
Khi gia sư yêu cầu sửa câu hiện có, chỉ trả các câu bị sửa/cộng mới kèm
note trong "reply", không lặp lại các câu giữ nguyên.
"""

SKILL_CATALOG_NOTE = (
    "Danh sách kỹ năng hợp lệ (skill_code → tên):\n"
    "{catalog}\n"
)


def build_catalog_note(catalog) -> str:
    """catalog: list[dict(skill_code, skill_name, ...)] hoặc rỗng."""
    lines = []
    for c in catalog or []:
        d = c if isinstance(c, dict) else c.model_dump()
        code = d.get("skill_code")
        if code:
            lines.append(f"- {code}: {d.get('skill_name') or ''}")
    if not lines:
        return ""
    return SKILL_CATALOG_NOTE.format(catalog="\n".join(lines))


def build_user_prompt(req: QuizChatRequest) -> str:
    """Gom toàn bộ ngữ cảnh thành 1 prompt phía user (không PII — AD-2)."""
    parts = []
    parts.append(
        f"Học sinh (ẩn danh): {req.student_code}"
        + (f", khối {req.grade}" if req.grade else "")
        + (f", mục tiêu: {req.learning_goal}" if req.learning_goal else "")
        + (f", độ khó mục tiêu CEFR: {req.cefr_hint}" if req.cefr_hint else "")
    )

    if req.skill_profile:
        lines = []
        for s in req.skill_profile:
            d = s if isinstance(s, dict) else s.model_dump()
            rate = d.get("error_rate")
            last = d.get("last_practiced_at")
            lines.append(
                f"- {d.get('skill_code')}: tỷ lệ sai "
                + ("chưa có dữ liệu" if rate is None else f"{rate:.0%}")
                + ("" if not last else f", gần nhất ôn {last[:10]}")
            )
        parts.append("Hồ sơ kỹ năng của học sinh:\n" + "\n".join(lines))

    if req.current_draft:
        draft = [
            q if isinstance(q, dict) else q.model_dump() for q in req.current_draft
        ]
        parts.append("Bản nháp câu hỏi hiện tại:\n" + json.dumps(draft, ensure_ascii=False))

    if req.recent_messages:
        msgs = []
        for m in req.recent_messages:
            d = m if isinstance(m, dict) else m.model_dump()
            who = "Gia sư" if d.get("role") == "user" else "Trợ lý"
            msgs.append(f"{who}: {d.get('content')}")
        parts.append("Lượt hội thoại gần nhất:\n" + "\n".join(msgs))

    parts.append(f"Yêu cầu lần này: {req.message}")
    return "\n\n".join(parts)


def build_messages(req: QuizChatRequest, catalog_note: str = ""):
    """Bộ messages [system, user] cho LLM."""
    system = SYSTEM_PROMPT.format(cefr_levels=", ".join(CEFR_LEVELS))
    if catalog_note:
        system += "\n" + catalog_note
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": build_user_prompt(req)},
    ]
