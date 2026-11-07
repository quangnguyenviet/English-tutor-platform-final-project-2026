# Sequence Diagram — Trợ lý AI soạn quiz (FR-13, UC-T06)

Phạm vi: 1 lượt hội thoại với trợ lý AI (gồm cả nhánh tạo mới và sửa quiz DRAFT có sẵn),
kết thúc bằng việc gia sư lưu quiz. Nguồn code: `QuizController`, `AiQuizService`,
`AiClient` (backend), `ai/app/main.py`, `ai/app/prompt.py`, `ai/app/llm.py` (AI Service),
`QuizAuthoring.jsx`, `QuizAiAssistant.jsx`, `quizApi.js`, `quizMergeModel.js` (frontend).

> **Thay đổi 2026-XX (gộp tự động):** AI trả về câu hỏi được **gộp thẳng** vào
> form gia sư — không còn bước "xem trước → bấm Gộp". Gia sư xem đủ 4 lựa chọn
> + đáp án đúng ngay trong chat, và mọi thao tác gộp đều **Hoàn tác** được.

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

    Note over T,QA: Mỗi lượt, UI gửi kèm tối đa 10 tin gần nhất (chat stateless)<br/>+ pendingQuestions = trọn bộ câu đang có trên form
    T->>QA: gõ yêu cầu, ví dụ "Tạo 5 câu thì quá khứ, B1"
    QA->>API: apiAiChatQuiz(token, lessonId, { message, quizId?, recentMessages?, pendingQuestions? })
    API->>CTL: POST /api/v1/lessons/{lessonId}/quizzes/ai-chat (Bearer JWT)

    rect rgba(255,255,255,0.4)
        Note over CTL,REPO: Kiểm tra quyền + gom ngữ cảnh ẩn danh (AD-2)
        CTL->>SVC: aiChatQuiz(lessonId, request)
        SVC->>SVC: lấy currentUserId từ SecurityContext (users)
        SVC->>REPO: lessons JOIN classes → kiểm tra tutor_id (sở hữu bài giảng)
        REPO-->>SVC: LessonOwnershipRow / SESSION_NOT_OWNED (403)
        SVC->>REPO: học sinh + khối + mục tiêu của lớp (AD-2: không tên/SĐT)
        SVC->>REPO: thống kê kỹ năng học sinh (view v_student_skill_stats)
        SVC->>REPO: catalog kỹ năng chung (bảng skills)
        alt FE gửi kèm pendingQuestions (bài đang soạn trên form)
            SVC->>SVC: map pendingQuestions → currentDraft (đánh số 1..N)<br/>KHÔNG đọc DB quizzes/quiz_questions
        else Không có pendingQuestions → fallback đọc DB theo quizId
            SVC->>REPO: đọc câu hỏi hiện tại của quiz (guard sở hữu lần 2)
            REPO-->>SVC: currentDraft (bản nháp A–D, đáp án, CEFR, skill)
        end
        SVC->>SVC: dựng AiChatPayload: HS-{studentId}, grade, goal, SKP,<br/>catalog, draft, ≤10 tin, message
    end

    rect rgba(255,255,255,0.4)
        Note over CL,LLM: Backend là cổng duy nhất (timeout 60s, retry 1 lần)
        CL->>AIS: POST /api/v1/ai/quiz/chat (payload JSON, mạng nội bộ)
        AIS->>AIS: validate Pydantic QuizChatRequest (mất PII)
        AIS->>AIS: build_messages(): system prompt + catalog skill<br/>+ user prompt (SKP, draft đánh số 1..N, lịch chat, yêu cầu)
        AIS->>LLM: chat.completions (openai) — hoặc mock bank khi key trống
        alt LLM lỗi / parse JSON thất bại
            LLM-x AIS: lỗi
            AIS-->>CL: 502 (LLM không khả dụng)
            CL->>CL: retry lần 2 (chỉ với 5xx / lỗi mạng)
            CL-x SVC: AppException AI_SERVICE_UNAVAILABLE (sai lần 2)
        else Thành công
            LLM-->>AIS: JSON { reply, questions[] } (QuizDraftSchema AD-4)<br/>questions[].index = vị trí câu cần THAY (null = câu mới)
            AIS-->>CL: 200 QuizChatResponse
            CL-->>SVC: AiChatResult (reply + draft questions + index)
        end
    end

    SVC-->>CTL: AiChatQuizResponse { reply, draftQuestions[] }
    CTL-->>API: 200 ApiResponse
    API-->>QA: { reply, draftQuestions }
    QA->>QP: onDrafts(draftQuestions)
    QA-->>T: hiện nhận xét của AI + thẻ câu hỏi đầy đủ<br/>(4 lựa chọn A–D, đáp án đúng tô emerald)
    QP->>QP: applyDrafts(questions, drafts) — index hợp lệ → THAY in-place,<br/>index null/lệch → thêm cuối + cảnh báo
    QP->>QP: đẩy snapshot câu hỏi cũ vào undoStack, hasAiContent = true
    QP-->>T: câu hỏi ĐÃ nằm trong form (cột trái) + toast "AI đã cập nhật bài"

    Note over T: Nhánh lỗi (UC-T06 bước 4a):
    Note over QA,T: timeout 60s / lỗi mạng → UI hiện tin lỗi + nút "Thử lại"<br/>(gửi lại tin user gần nhất, stateless nên không mất ngữ cảnh)
```

## Ghi chú các mốc quan trọng

| Mốc | Vị trí | Ghi chú thiết kế |
| :--- | :--- | :--- |
| Quyền sở hữu | `AiQuizService.aiChatQuiz` | Guard kép: bài giảng phải thuộc `currentUserId` qua `lessons → classes.tutor_id`; quiz (nếu có) guard thêm tầng `QUIZ_NOT_OWNED` |
| Ẩn danh (AD-2) | `AiQuizService` → payload | Chỉ gửi mã `HS-{studentId}`, cấp, mục tiêu học, thống kê kỹ năng — không có tên/SĐT học sinh |
| Stateless (AD-?) | Frontend + `AiRecentMessage` | Lịch hội thoại do UI giữ và gửi kèm (≤10 tin), backend/AI không lưu MongoDB |
| `pendingQuestions` | FE `buildPendingQuestions` → BE | Trọn bộ câu đang có trên form (đã loại câu rỗng) → LLM đánh số 1..N theo đúng thứ tự mảng để hiểu "câu số k". Ưu tiên cao hơn việc đọc DB |
| `index` (thay câu) | AI Service → BE → FE | `index = k` (1 ≤ k ≤ N câu không rỗng) → thay in-place câu k; `null` → câu mới (thêm cuối); lệch → thêm cuối kèm cảnh báo cho gia sư |
| Gộp tự động | `QuizAuthoring.handleAiDrafts` + `quizMergeModel.applyDrafts` | Không còn bước "xem trước → bấm Gộp". Mỗi lần gộp đẩy snapshot vào `undoStack` (tối đa 10 bước) → nút **Hoàn tác** ở footer hành động |
| Retry | `AiClient.quizChat` | Tối đa 2 lần (5xx hoặc lỗi mạng), sau đó map `AI_SERVICE_UNAVAILABLE` → UI nút "Thử lại" |
| Provider LLM | `ai/app/llm.py:generate` | `openai` (mặc định, `LLM_API_KEY`) hoặc `mock` (key trống → chọn 5 câu mẫu từ bank theo SKP + cefr_hint) |

## Diagram phụ — gộp câu AI vào form → lưu quiz

```mermaid
sequenceDiagram
    participant T as Gia sư (Tutor UI)
    participant QP as QuizAuthoring.jsx
    participant MM as quizMergeModel.js
    participant API as quizApi.js
    participant QS as QuizService
    participant REPO as Repos (PostgreSQL)

    QA->>QP: onDrafts(draftQuestions) — đã gộp xong (diagram chính)
    T->>QP: (tuỳ chọn) bấm "Hoàn tác"
    QP->>QP: khôi phục questions từ undoStack, bật cờ hasAiContent

    T->>QP: bấm Lưu (tạo mới) hoặc Sửa (quiz DRAFT)
    alt Tạo mới (POST /lessons/{lessonId}/quizzes)
        QP->>API: apiCreateLessonQuiz({ title, questions, source: "AI_DIRECT" })
        API->>QS: createQuizForLesson (1 transaction)
        QS->>REPO: INSERT quizzes (source = AI_DIRECT nếu có câu AI,<br/>IMPORTED nếu nhập tay) + INSERT từng câu hỏi
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

1. **Guard quyền** (2 tầng): bài giảng phải của gia sư đăng nhập; quiz (nếu có) cũng phải của chính họ.
2. **AD-2 (ẩn danh)**: AI Service chỉ nhận dữ liệu đã gom phía backend, không truy cập DB, không nhận PII.
3. **AD-4 (schema cứng)**: LLM ép trả JSON `QuizChatSchema` (4 phương án A–D, CEFR, skill_code hợp lệ từ catalog); parse fail → 502 → retry.
4. **Stateless chat**: lịch hội thoại sống ở UI, gửi ≤10 tin/lần — AI Service không giữ session.
5. **Gộp có kiểm soát**: không có bước duyệt thủ công, nhưng (a) AI phải trả `index` hợp lệ để thay đúng câu, (b) lệch → append kèm cảnh báo, (c) luôn có **Hoàn tác**, (d) quiz không còn DRAFT thì không gộp.
6. **Truy vấn DB (theo operation)**:
   - `ai-chat` (read-only): `lessons+classes` (sở hữu), `classes` (ngữ cảnh học sinh), view `v_student_skill_stats`, `skills`; `quizzes`+`quiz_questions` **chỉ khi** không có `pendingQuestions`.
   - `createQuizForLesson`: INSERT `quizzes` + `quiz_questions` (1 transaction, `quizzes.source` = AI_DIRECT/IMPORTED).
   - `updateQuiz`: UPDATE `quizzes` + thay `quiz_questions` (chỉ DRAFT).
   - `assignQuiz`: UPDATE `quizzes` (DRAFT→ASSIGNED, deadline) + thông báo học sinh.
