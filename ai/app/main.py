import logging
import time
from datetime import datetime

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .llm import LLMError, generate
from .schemas import QuizChatRequest, QuizChatResponse

log = logging.getLogger(__name__)

app = FastAPI(
    title="English Tutor AI Service",
    description="AI Service powered by Python & FastAPI for Quiz Generation and Validation",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "Welcome to English Tutor AI Service API",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "timestamp": datetime.now().isoformat(),
    }


@app.post("/api/v1/ai/quiz/chat", response_model=QuizChatResponse)
def quiz_chat(req: QuizChatRequest) -> QuizChatResponse:
    """Một lượt hội thoại soạn/sửa quiz (AD-2, AD-4).

    Chỉ backend gọi (mạng nội bộ) — không phải endpoint công khai.
    Provider: ``openai`` (LLM_API_KEY) hoặc ``mock`` (key trống / LLM_PROVIDER=mock).
    Lỗi LLM → 502 để backend map ``AI_SERVICE_UNAVAILABLE``.
    """
    start = time.monotonic()
    try:
        result = generate(req)
    except LLMError as exc:
        raise HTTPException(status_code=502, detail=f"LLM không khả dụng: {exc}") from exc
    log.info(
        "quiz/chat student=%s cefr=%s msgs=%d draft=%d out_q=%d elapsed=%.1fs",
        req.student_code,
        req.cefr_hint or "-",
        len(req.recent_messages),
        len(req.current_draft or []),
        len(result.questions),
        time.monotonic() - start,
    )
    return result
