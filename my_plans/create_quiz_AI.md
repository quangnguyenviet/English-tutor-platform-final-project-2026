# Kế hoạch: Soạn quiz với Trợ lý AI (UC-T06 / FR-13)

## Context

Module quiz **thủ công** đã có sẵn (merge PR #62): gia sư tạo DRAFT, sửa, giao bài, đọc catalog kỹ năng — backend `module/quiz` (JdbcTemplate), frontend `QuizAuthoring.jsx`. Chưa có **chế độ AI**: AI service (FastAPI) mới chỉ có `/health`; frontend chưa có chatbot thật (chỉ mock `TutorAiAssistant.jsx`).

Phạm vi đã chốt với user:
- **Chỉ chat AI (FR-13)** — không làm import JSON (FR-14), không làm đính kèm file ở lượt này.
- **Có** drawer "Bảng thống kê hồ sơ học sinh" (SKP từ view `v_student_skill_stats`) — hiển thị rỗng được (chưa có `quiz_answers`).
- Quyết định kỹ thuật tôi chốt (ghi trong plan, user có thể bác khi approve):
  - **Không thêm MongoDB ở lượt này** (ERD có collection `ai_chat_messages` nhưng compose không có Mongo service; backend chưa có mongo-starter). Chat **stateless**: frontend gửi kèm N tin gần nhất trong mỗi request; backend ghép prompt = SKP ẩn danh + draft quiz + tin gần nhất. Lưu lịch sử MongoDB để task sau.
  - **AI service chạy chế độ mock khi `LLM_API_KEY` trống** (`LLM_PROVIDER=mock`): sinh bộ câu hỏi mẫu từ đúng skill catalog + CEFR trong yêu cầu, không tốn token → demo end-to-end được.

## Contract chung (backend ↔ AI service)

Theo ARCHITECTURE.md AD-2 + AD-4 (ai/README.md khớp 2 nguồn này; `API_DESIGN.md §3.7` ghi sai tiền tố — cập nhật tài liệu cuối task, không sửa ngược).

- **AI endpoint**: `POST /api/v1/ai/quiz/chat` (nội bộ, chỉ backend gọi)
  - Request: `{ studentCode, grade, learningGoal, skillProfile: [{skillCode, skillName, errorRate, lastPracticedAt}], currentDraft?: questions[], recentMessages: [{role, content}], cefrHint?, message }` — **không gửi PII** (AD-2: chỉ mã ẩn danh + thống kê kỹ năng).
  - Response: `{ reply: string, questions: QuizDraftSchema[] }`, trong đó `QuizDraftSchema = { content, options: {A,B,C,D}, correct: A|B|C|D, explanation, cefr: A1–C2, skill: skill_code }` (AD-4).
  - Lỗi: 502/504 khi provider gọi thất bại hoặc hết budget → backend map `AI_SERVICE_UNAVAILABLE`.
- **Timeout**: 60s đặt ở backend (`RestClient`), retry 1 lần (theo API_DESIGN.md l.406).

## 1. AI Service (`ai/`)

File mới/sửa:
- `ai/app/schemas.py` — Pydantic: `QuizChatRequest`, `DraftQuestion` (AD-4), `QuizChatResponse`.
- `ai/app/prompt.py` — system prompt: vai trò gia sư chấm điểm, schema JSON đầu ra, CEFR A1–C2, danh sách skill_code hợp lệ (backend gửi `skillProfile` + `skillCatalog`).
- `ai/app/llm.py` — gọi OpenAI (SDK, thêm `openai` vào `ai/requirements.txt`); **provider `mock`** (đặc biệt khi `LLM_API_KEY` trống): dựng 3–5 câu hỏi mẫu theo `cefr` + skill có errorRate cao nhất từ `skillProfile` (template câu hỏi tiếng Anh, đúng 4 phương án, có explanation), `reply` tóm tắt logic chọn câu.
- `ai/app/main.py` — thêm router `POST /api/v1/ai/quiz/chat` (giữ `/`, `/health`).
- **Tính chi phí LLM bỏ qua ở giai đoạn này** (không thực hiện cơ chế budget/threshold trong task hiện tại; `LLM_MONTHLY_BUDGET_USD` vẫn giữ trong `.env.example` để dùng ở task sau).

Verify: `curl -X POST localhost:8000/api/v1/ai/quiz/chat -d '{...}'` — mock trả JSON hợp lệ; provider openai có key trả câu hỏi thật; key trống không crash.

## 2. Backend (`backend/`) — module quiz

Bản mẫu có sẵn cần tái dụng:
- Quyền sở hữu: `QuizService.requireOwnedSession` + `findSessionOwnership` (QuizRepository.java:77-95, 202-206); `getCurrentUserId()` (l.291) — copy pattern.
- Lỗi: `AppException(ErrorCode, msg)`; block quiz 1400–1405 đã dùng → **thêm 1406 `AI_SERVICE_UNAVAILABLE`, 1407 `AI_CHAT_MESSAGE_REQUIRED`** (ErrorCode.java).
- Test: `QuizServiceTest.java` (Mockito thuần, SecurityContextHolder giả lập, `assertErrorCode`).

File mới/sửa:
- `infrastructure/config/AiProperties.java` + block config `application.yaml`: `app.ai.service-url: ${AI_SERVICE_URL:http://localhost:8000}`, `app.ai.timeout-seconds: ${AI_TIMEOUT_SECONDS:60}` — pattern như `s3.endpoint` (application.yaml l.41-49).
- `module/quiz/ai/AiClient.java` — `RestClient` (Spring Boot 3.2 có sẵn, không thêm dep), timeout read 60s, retry 1 lần, map mọi lỗi mạng/5xx → `AppException(AI_SERVICE_UNAVAILABLE)`.
- `module/quiz/service/AiQuizService.java`:
  1. `requireOwnedSession(sessionId)` (pattern có sẵn);
  2. Đọc SKP: `SkillProfileRepository.queryClassSkillProfile(classId)` (JdbcTemplate: `SELECT ... FROM v_student_skill_stats s JOIN skills k ON k.id = s.skill_id`);
  3. Đọc ngữ cảnh ẩn danh: `students.grade`, `learning_goal`, mã học sinh (không tên/SĐT), hiện `quiz` draft + `quiz_questions` nếu có `quizId` trong request;
  4. Gọi `AiClient` (payload theo contract, `recentMessages` do FE gửi, giới hạn 10 tin cuối);
  5. Trả `AiChatResponse { reply, draftQuestions }` — `draftQuestions` map về shape form hiện có của FE: `questionText, optionA..optionD, correctAnswer, explanation, cefrLevel, skillCode` (tương thích `QuizQuestionResponse`).
- `module/quiz/controller/QuizController.java` — thêm:
  - `POST /sessions/{sessionId}/quizzes/ai-chat` (body JSON `{ message, quizId?, recentMessages[] }`) — không multipart (scope loại file).
  - `GET /classes/{classId}/skill-profile` (TUTOR sở hữu lớp, trả list SKP hoặc `[]`) — endpoint này API_DESIGN đã dự kiến nhưng chưa có.
- `api/request/CreateQuizRequest.java` — thêm trường `source` (optional, default giữ hiện trạng). Luồng AI: FE gọi API tạo quiz có sẵn (`POST /sessions/{id}/quizzes`) với `source = "AI_DIRECT"` (ERD: `quizzes.source` ∈ `AI_DIRECT`/`IMPORTED`) — **không cần endpoint tạo-quiz-riêng cho AI**.
- Tests: `AiQuizServiceTest` (mock AiClient + repos, theo pattern QuizServiceTest), test `AiClient` (mock RestClient, timeout/retry).

## 3. Frontend (`frontend/`)

Tái dụng: lib `quizApi.js` (pattern `request(token, path, opts)`), component `TutorAiAssistant.jsx` (hình dạng message list, thinking state — KHÔNG dùng logic mock `aiAssistant.js`), UI kit `Card/Badge/Button/Toast` + Skeleton (`animate-pulse`), icon `lucide-react`.

File sửa:
- `frontend/src/lib/quizApi.js` — thêm:
  - `apiAiChatQuiz(token, sessionId, { message, quizId, recentMessages })` → `POST /sessions/{id}/quizzes/ai-chat`;
  - `apiGetSkillProfile(token, classId)` → `GET /classes/{id}/skill-profile`.
- `frontend/src/pages/tutor/manage/QuizAuthoring.jsx` — bố cục mới (giữ `lg:grid-cols-5`):
  - **Cột trái (col-span-3)**: giữ form câu hỏi hiện tại + khu **mới** "Câu hỏi do AI đề xuất" (Card: list `draftQuestions` từ chat, mỗi câu có nút *Thêm vào bài* / *Gộp tất cả* / *Loại* — thêm vào state `questions` theo mapping shape form; CEFR/skill hiển thị dạng Badge).
  - **Cột phải (col-span-2)**: thay panel "Xem trước" bằng:
    - **Panel chat AI**: message list (user/assistant), ô nhập + nút *Gửi* (`Send`), trạng thái thinking (`Loader2` spin) với timeout 60s → lỗi hiện nút **Thử lại** (UC-T06 luồng 4a); giữ nút *Lưu nháp* / *Giao bài* (modal deadline) như hiện tại.
    - **Drawer "Bảng thống kê hồ sơ học sinh"** (ngăn kéo/collapse phía trên chat): bảng kỹ năng (tên, error rate %, thời gian chưa ôn), mặc định sắp theo tỷ lệ sai giảm dần + sort theo A-Z / nhóm chủ điểm (UC-T06 luồng 2a); **trạng thái rỗng**: "Chưa có dữ liệu trả lời quiz — học sinh chưa làm quiz nào."
  - `QuizAuthoringRoute.jsx` — nhận thêm `classId` từ outlet context để gọi skill-profile.
- Tuân thủ AGENTS.md: không emoji, light+dark `dark:` đầy đủ, button có `active:scale-[0.98]`, bo góc `rounded-xl/2xl`, layout mobile không tràn.

## 4. Hạ tầng

- `docker-compose.yml`: **bỏ comment** khối service `ai` (l.80–101) + khối `networks: app-network` (l.122–124). Không bật `backend`/`frontend` (chạy local: backend `mvn spring-boot:run` 8080, FE `npm run dev` 5173, DB/MinIO/AI qua compose). Mặc định `AI_SERVICE_URL=http://localhost:8000` trong application.yaml (chạy local); khi chạy full docker dùng `http://ai:8000` (env sẵn có).
- `.env.example` đã đủ biến LLM_* / AI_* (để trống `LLM_API_KEY` = chạy chế độ mock).

## 5. Tài liệu

- `ai/README.md`: đánh dấu `POST /api/v1/ai/quiz/chat` đã cài (mock mode), mô tả biến `LLM_PROVIDER=mock`.
- `backend/API_DESIGN.md §3.7`: sửa đường dẫn AI service cho khớp ARCHITECTURE (`/api/v1/ai/quiz/chat`), cập nhật signature ai-chat (JSON không multipart), thêm `GET /classes/{classId}/skill-profile`, thêm trường `source` của create quiz; ghi chú chat stateless (không `ai_chat_messages` ở lượt này).

## Mapping đọc/ghi bảng CSDL theo từng thao tác (bắt buộc)

| Thao tác | Đọc (reads) | Ghi (writes) |
|---|---|---|
| `GET /api/v1/classes/{classId}/skill-profile` | `classes` (quyền sở hữu), `students`, view `v_student_skill_stats` (dưới view: `quiz_answers`, `quiz_questions`), `skills` (JOIN tên) | — |
| `POST /sessions/{sessionId}/quizzes/ai-chat` | `sessions`, `classes` (sở hữu + grade/mục tiêu HS), `students`, `v_student_skill_stats` + `skills`; `quizzes` + `quiz_questions` (nếu có `quizId`) | — (stateless, không lưu lịch sử) |
| `POST /sessions/{sessionId}/quizzes` (có `source=AI_DIRECT`) | `sessions`, `classes`, `skills` (check `skill_code` tồn tại) | `quizzes`, `quiz_questions` |
| `PUT /api/v1/quizzes/{id}` (sửa sau khi gộp AI) | `quizzes`, `quiz_questions`, `skills` | `quizzes`, `quiz_questions` (ghi đè, chỉ DRAFT) |
| `POST /api/v1/quizzes/{id}/assign` | `quizzes`, `classes` | `quizzes` (status, deadline), `notifications` |
| FE drawer SKP (gọi skill-profile) | xem dòng 1 | — |

→ **Không thêm migration mới**, không thêm bảng.

## Thứ tự thực hiện

1. **AI service**: schemas → prompt → llm (mock + openai) → endpoint → requirements; verify bằng curl.
2. **Backend**: `AiProperties` + config → `AiClient` → `SkillProfileRepository` + service → `AiQuizService` + endpoint (ai-chat, skill-profile) → `source` trong `CreateQuizRequest` → ErrorCode 1406/1407 → tests.
3. **Frontend**: hàm API → Drawer SKP → panel chat + khu gộp câu AI → `QuizAuthoringRoute`.
4. **Infra**: bỏ comment khối `ai` + `networks` trong docker-compose.yml.
5. **Docs**: ai/README.md, API_DESIGN.md §3.7.
6. **Git**: commit theo `GIT_CONVENTION.md` (`feat: trợ lý AI soạn quiz (chat + hồ sơ kỹ năng)`, `docs: cập nhật API_DESIGN …`), không kèm dòng Co-Authored-By.

## Verify end-to-end

1. `docker compose up --build` (postgres, minio, ai) — `ai/health` OK.
2. Chạy backend (8080) + frontend (5173) local; `AI_SERVICE_URL` mặc định localhost:8000.
3. `curl` kiểm tra: `POST localhost:8000/api/v1/ai/quiz/chat` (mock trả JSON AD-4 đúng schema).
4. Login gia sư → vào lớp ACTIVE → chi tiết buổi học → nút **Soạn Quiz** → gõ "Tạo 5 câu thì quá khứ đơn cấp B1" → câu hỏi AI hiện ở khu đề xuất → **Gộp tất cả** → form có đủ 5 câu (CEFR, skill badge) → **Giao bài** chọn deadline.
5. Kiểm tra DB: `quizzes.source = 'AI_DIRECT'`, `quiz_questions` đủ 5 câu; `notifications` có dòng mới cho học sinh.
6. Drawer SKP: hiển thị trạng thái rỗng (chưa có `quiz_answers`); chạy test Mockito (`mvn test -Dtest=AiQuizServiceTest`).
7. Checklist UI theo AGENTS.md §6 (dark mode, icon lucide, không emoji, mobile không tràn).
