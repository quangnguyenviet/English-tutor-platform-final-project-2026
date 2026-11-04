"""Schema Pydantic cho endpoint /api/v1/ai/quiz/chat (AD-2, AD-4).

Không nhận dữ liệu định danh học sinh (AD-2): chỉ mã ẩn danh, cấp độ,
mục tiêu học và thống kê kỹ năng đã gom sẵn phía backend.
"""
from typing import Literal, Optional

from pydantic import BaseModel, Field

CEFR_LEVELS = ("A1", "A2", "B1", "B2", "C1", "C2")
ANSWER_LETTERS = ("A", "B", "C", "D")


class SkillStat(BaseModel):
    """Một dòng của view v_student_skill_stats (đã JOIN tên kỹ năng)."""

    skill_code: str
    skill_name: Optional[str] = None
    category: Optional[str] = None
    error_rate: Optional[float] = Field(
        default=None, description="Tỷ lệ sai (0..1). NULL nếu chưa có dữ liệu."
    )
    last_practiced_at: Optional[str] = Field(
        default=None, description="ISO-8601, NULL nếu chưa ôn."
    )


class RecentMessage(BaseModel):
    """Tin hội thoại gần nhất do frontend gửi kèm (chat stateless — không lưu phía AI service)."""

    role: Literal["user", "assistant"]
    content: str = Field(max_length=2000)


class DraftQuestion(BaseModel):
    """Câu hỏi theo QuizDraftSchema (AD-4) — dùng chung cho chế độ chat và import.

    ``index`` (tuỳ chọn, chỉ chế độ chat) định vị câu trả về trong "bản nháp hiện
    tại" mà backend đã đánh số 1..N:
    - ``index = k`` (1 ≤ k ≤ N) → câu này THAY câu thứ k trong bản nháp (giải nghĩa
      "sửa câu số k" của gia sư).
    - ``index = None`` → câu MỚI (cộng thêm, append).
    """

    content: str = Field(description="Nội dung câu hỏi tiếng Anh.")
    options: dict = Field(
        description="Bốn phương án: {'A': ..., 'B': ..., 'C': ..., 'D': ...}."
    )
    correct: Literal["A", "B", "C", "D"] = Field(description="Chữ cái đáp án đúng.")
    explanation: str = Field(description="Lời giải thích ngắn bằng tiếng Việt.")
    cefr: Literal["A1", "A2", "B1", "B2", "C1", "C2"]
    skill: Optional[str] = Field(
        default=None, description="skill_code trong bảng skills, NULL nếu không gắn."
    )
    index: Optional[int] = Field(
        default=None,
        ge=1,
        description="Vị trí (1-based) trong bản nháp hiện tại cần THAY, nếu câu này"
        " sửa một câu có sẵn; null nếu là câu mới.",
    )


class QuizChatRequest(BaseModel):
    """Đầu vào của 1 lượt hội thoại soạn/sửa quiz (AD-2: không PII)."""

    student_code: str = Field(
        description="Mã ẩn danh học sinh (vd HS-1024), KHÔNG phải tên/SĐT."
    )
    grade: Optional[str] = Field(default=None, description="Lớp/khối đang học.")
    learning_goal: Optional[str] = Field(
        default=None, description="Mục tiêu học tập (IELTS, giao tiếp...)."
    )
    skill_profile: list = Field(
        default_factory=list,
        description="Danh sách SkillStat của học sinh này (có thể rỗng).",
    )
    skill_catalog: list = Field(
        default_factory=list,
        description="Danh mục kỹ năng hợp lệ: [{skill_code, skill_name}] (bảng skills).",
    )
    current_draft: Optional[list] = Field(
        default=None,
        description="Câu hỏi hiện có của quiz đang sửa (quizId != null), nếu có.",
    )
    recent_messages: list = Field(
        default_factory=list,
        description="Các tin hội thoại gần nhất (giới hạn bởi backend, tối đa 10).",
    )
    message: str = Field(
        min_length=1, max_length=1000, description="Yêu cầu của gia sư lần này."
    )
    cefr_hint: Optional[Literal["A1", "A2", "B1", "B2", "C1", "C2"]] = None


class QuizChatResponse(BaseModel):
    """Đầu ra: nhận xét + bộ câu hỏi mới (AD-4)."""

    reply: str
    questions: list = Field(
        default_factory=list,
        description="Mảng DraftQuestion; rỗng nếu lượt này chỉ là trao đổi, chưa sinh câu mới.",
    )
