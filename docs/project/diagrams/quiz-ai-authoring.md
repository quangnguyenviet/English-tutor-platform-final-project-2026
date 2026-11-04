# Sequence Diagram — Trợ lý AI soạn quiz (FR-13, UC-T06)

Phạm vi: 1 lượt hội thoại với trợ lý AI (gồm cả nhánh tạo mới và sửa quiz DRAFT có sẵn),
kết thúc bằng việc gia sư lưu quiz. Nguồn code: `QuizController`, `AiQuizService`,
`AiClient` (backend), `ai/app/main.py`, `ai/app/prompt.py`, `ai/app/llm.py` (AI Service),
`QuizAuthoring.jsx`, `QuizAiAssistant.jsx`, `quizApi.js` (frontend).

## Diagram chính — 1 lượt chat

```mermaid
sequenceDiagram
    autonumber
    actor T as Gia sư (Tutor UI)
    participant QP as QuizAuthoring.jsx
    participant QA as QuizAiAssistant.jsx
    participant API as quizApi.js
    participant CTL as QuizController
    participant SVC as AiQuizService
    participant REPO as Repos (PostgreSQL)
    participant CL as AiClient (RestClient)
    participant AIS as AI Service (FastAPI)
    participant LLM as LLM (OpenAI / mock)

    Note over T,QA: Mỗi lượt, UI gửi kèm tối đa 10 tin gần nhất (chat stateless)
    T->>QA: gõ yêu cầu, ví dụ "Tạo 5 câu thì quá khứ, B1"
    QA->>API: apiAiChatQuiz(token, sessionId, { message, quizId?, recentMessages })
    API->>CTL: POST /api/v1/sessions/{sessionId}/quizzes/ai-chat (Bearer JWT)

    rect rgba(255,255,255,0.4)
        Note over CTL,REPO: Kiểm tra quyền + gom ngữ cảnh ẩn danh (AD-2)
        CTL->>SVC: aiChatQuiz(sessionId, request)
        SVC->>SVC: lấy currentUserId từ SecurityContext (users)
        SVC->>REPO: sessions JOIN classes → kiểm tra tutor_id (sở hữu buổi học)
        REPO-->>SVC: SessionOwnershipRow / SESSION_NOT_OWNED (403)
        SVC->>REPO: học sinh + khối + mục tiêu của lớp (AD-2: không tên/SĐT)
        SVC->>REPO: thống kê kỹ năng học sinh (view v_student_skill_stats)
        SVC->>REPO: catalog kỹ năng chung (bảng skills)
        opt Đang sửa quiz có sẵn (quizId khác null)
            SVC->>REPO: đọc câu hỏi hiện tại của quiz (guard sở hữu lần 2)
            REPO-->>SVC: currentDraft (bản nháp A–D, đáp án, CEFR, skill)
        end
        SVC->>SVC: dựng AiChatPayload: HS-{studentId}, grade, goal, SKP,<br/>catalog, draft, ≤10 tin, message
    end

    rect rgba(255,255,255,0.4)
        Note over CL,LLM: Backend là cổng duy nhất (timeout 60s, retry 1 lần)
        CL->>AIS: POST /api/v1/ai/quiz/chat (payload JSON, mạng nội bộ)
        AIS->>AIS: validate Pydantic QuizChatRequest (mất PII)
        AIS->>AIS: build_messages(): system prompt + catalog skill<br/>+ user prompt (SKP, draft, lịch chat, yêu cầu)
        AIS->>LLM: chat.completions (openai) — hoặc mock bank khi key trống
        alt LLM lỗi / parse JSON thất bại
            LLM-x AIS: lỗi
            AIS-->>CL: 502 (LLM không khả dụng)
            CL->>CL: retry lần 2 (chỉ với 5xx / lỗi mạng)
            CL-x SVC: AppException AI_SERVICE_UNAVAILABLE (sai lần 2)
        else Thành công
            LLM-->>AIS: JSON { reply, questions[] } (QuizDraftSchema AD-4)
            AIS-->>CL: 200 QuizChatResponse
            CL-->>SVC: AiChatResult (reply + draft questions)
        end
    end

    SVC-->>CTL: AiChatQuizResponse { reply, draftQuestions[] }
    CTL-->>API: 200 ApiResponse
    API-->>QA: { reply, draftQuestions }
    QA->>QP: onDrafts(draftQuestions) — lưu vào state aiDrafts
    QP-->>T: hiện nhận xét của AI + khối câu đề xuất<br/>(nút "Thêm toàn bộ" / "Thêm từng câu")

    Note over T: Nhánh lỗi (UC-T06 bước 4a):
    Note over QA,T: timeout 60s / lỗi mạng → UI hiện tin lỗi + nút "Thử lại"<br/>(gửi lại tin user gần nhất, stateless nên không mất ngữ cảnh)
```

## Ghi chú các mốc quan trọng

| Mốc | Vị trí | Ghi chú thiết kế |
| :--- | :--- | :--- |
| Quyền sở hữu | `AiQuizService.aiChatQuiz` | Guard kép: buổi học phải thuộc `currentUserId` qua `sessions → classes.tutor_id`; quiz (nếu có) guard thêm tầng `QUIZ_NOT_OWNED` |
| Ẩn danh (AD-2) | `AiQuizService` → payload | Chỉ gửi mã `HS-{studentId}`, cấp, mục tiêu học, thống kê kỹ năng — không có tên/SĐT học sinh |
| Stateless (AD-?) | Frontend + `AiRecentMessage` | Lịch hội thoại do UI giữ và gửi kèm (≤10 tin), backend/AI không lưu MongoDB |
| Sửa quiz DRAFT | `currentDraftQuestions` | Câu hiện có được nhúng thẳng vào prompt → LLM chỉ trả các câu bị sửa/cộng mới |
| Retry | `AiClient.quizChat` | Tối đa 2 lần (5xx hoặc lỗi mạng), sau đó map `AI_SERVICE_UNAVAILABLE` → UI nút "Thử lại" |
| Provider LLM | `ai/app/llm.py:generate` | `openai` (mặc định, `LLM_API_KEY`) hoặc `mock` (key trống → chọn 5 câu mẫu từ bank theo SKP + cefr_hint) |

## Diagram phụ — từ draft AI đến lưu quiz (gia sư gộp câu vào form)

```mermaid
sequenceDiagram
    participant T as Gia sư (Tutor UI)
    participant QP as QuizAuthoring.jsx
    participant API as quizApi.js
    participant QS as QuizService
    participant REPO as Repos (PostgreSQL)

    T->>QP: bấm "Thêm toàn bộ câu AI vào bài"
    QP->>QP: gộp aiDrafts vào form, đặt cờ hasAiContent = true
    T->>QP: bấm Lưu (tạo mới) hoặc Sửa (quiz DRAFT)
    alt Tạo mới (POST /sessions/{id}/quizzes)
        QP->>API: apiCreateSessionQuiz({ title, questions, source: "AI_DIRECT" })
        API->>QS: createQuizForSession (1 transaction)
        QS->>REPO: insert quiz (source = AI_DIRECT nếu có câu AI,<br/>IMPORTED nếu nhập tay) + insert từng câu hỏi
        REPO-->>QS: quizId
        QS-->>API: QuizDetailResponse (trạng thái DRAFT)
    else Sửa quiz có sẵn (PUT /quizzes/{id})
        QP->>API: apiUpdateQuiz({ title, questions }) — chỉ khi DRAFT
        API->>QS: updateQuiz (ghi đè câu hỏi, giữ nguyên source đã lưu)
    end
    API-->>QP: quiz chi tiết
    QP-->>T: toast thành công (quiz DRAFT, chưa giao bài)

    Note over T,QP: Bước kế tiếp (không thuộc luồng AI chat):
    T->>QP: bấm "Giao bài" + chọn deadline
    QP->>API: apiAssignQuiz → POST /quizzes/{id}/assign (DRAFT → ASSIGNED)<br/>thông báo học sinh
```

## Tóm tắt điểm kiểm soát trong luồng

1. **Guard quyền** (2 tầng): buổi học phải của gia sư đăng nhập; quiz (nếu có) cũng phải của chính họ.
2. **AD-2 (ẩn danh)**: AI Service chỉ nhận dữ liệu đã gom phía backend, không truy cập DB, không nhận PII.
3. **AD-4 (schema cứng)**: LLM ép trả JSON `QuizChatSchema` (4 phương án A–D, CEFR, skill_code hợp lệ từ catalog); parse fail → 502 → retry.
4. **Stateless chat**: lịch hội thoại sống ở UI, gửi ≤10 tin/lần — AI Service không giữ session.
5. **Truy vấn DB (theo operation)**:
   - `ai-chat` (read-only): `sessions+classes` (sở hữu), `classes` (ngữ cảnh học sinh), view `v_student_skill_stats`, `skills`, `quiz_questions` (nếu quizId).
   - `createQuizForSession`: INSERT `quizzes` + `quiz_questions` (1 transaction, `quizzes.source` = AI_DIRECT/IMPORTED).
   - `updateQuiz`: UPDATE `quizzes` + thay `quiz_questions` (chỉ DRAFT).
   - `assignQuiz`: UPDATE `quizzes` (DRAFT→ASSIGNED, deadline) + thông báo học sinh.
