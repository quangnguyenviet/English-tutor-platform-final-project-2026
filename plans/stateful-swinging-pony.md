# Kế hoạch: Rebase `feature/tutor-quiz-authoring` lên `origin/dev` (V16) và fix conflict

## Context

- Nhánh `feature/tutor-quiz-authoring` (5 commit cục bộ: `9c10bdb` feat FR-13 AI quiz → `fa918e0` checkpoint) rẽ ra từ merge-base `ffe28f6`. Dev đã đi trước **16 commit**, gồm **refactor V16: `sessions` → `lessons` + `teaching_logs`** và V17.
- Do đó module quiz của dev đã đổi scope từ *buổi học (sessions)* sang *bài giảng (lessons)*: `quizzes.lesson_id`, `LessonOwnershipRow`, endpoint `/api/v1/lessons/{lessonId}/quizzes`. Code AI quiz của feature vẫn bám `sessions` → sau rebase **bắt buộc** phải chuyển AI sang scope `lesson` (bảng `sessions` đã không còn).
- `origin/dev` đã fetch. Remote feature branch đang tụt 23 commit → sau rebase sẽ phải **force-with-lease** push (bước cuối, chờ user xác nhận).

### Các file conflict (hai phía cùng sửa)

| File | Feature (FR-13 AI) | Dev (V16) | Chiến lược |
|---|---|---|---|
| `.gitignore` | thêm `bao_cao_de_an.md` | nội dung **trùng hệt** | giữ dev |
| `backend/API_DESIGN.md` | sửa §3.7 AI (body JSON, stateless, table AI service, LLM_BASE_URL) | viết lại V16: quiz theo lesson, xóa AI rows | **lấy dev làm nền + ghép feature**: giữ ai-chat row nhưng đổi path sang `/lessons/{lessonId}/quizzes/ai-chat`; create-quiz row thêm trường `source` (`AI_DIRECT`/`IMPORTED`); khôi phục section table AI Service (dev ghi "chưa có AI" — nay đã có) |
| `QuizController.java` | thêm 2 endpoint `ai-chat` + `skill-profile` | đổi 4 endpoint session→lesson | lấy dev + thêm 2 endpoint; **`ai-chat` đổi path sang `/lessons/{lessonId}/quizzes/ai-chat`**, param `lessonId`; `skill-profile` (class-level) giữ nguyên |
| `QuizRepository.java` | chỉ sửa Javadoc `insertQuiz` (source AI_DIRECT) | rename mọi thứ sang lesson | lấy dev + áp lại comment của feature |
| `QuizService.java` | logic `source` từ request (`AI_DIRECT`/`IMPORTED`, default IMPORTED) | rename `createQuizForSession`→`createQuizForLesson`… | lấy dev + áp logic source của feature vào `createQuizForLesson`; cập nhật comment `SOURCE_MANUAL` |
| `ErrorCode.java` | thêm `AI_SERVICE_UNAVAILABLE(1406)`, `AI_CHAT_MESSAGE_REQUIRED(1407)`, `AI_CHAT_INPUT_TOO_LONG(1415)` | sửa message 1155 (bỏ MODIFIED) | **LƯU Ý: 1406/1407 đã bị ocupied** (`QUIZ_NOT_AVAILABLE(1406)`, `QUESTION_NOT_FOUND(1407)` — trùng ngay trên feature). Đổi số: `AI_SERVICE_UNAVAILABLE=1416`, `AI_CHAT_MESSAGE_REQUIRED=1417`, `AI_CHAT_INPUT_TOO_LONG=1418` (1414 là code lớn nhất hiện có; chỉ đổi **số**, giữ tên constant nên không phải sửa nơi tham chiếu) |
| `frontend/src/lib/quizApi.js` | thêm `apiAiChatQuiz(sessionId)`, `apiGetSkillProfile(classId)` | rename `apiCreateLessonQuiz`/`apiGetLessonQuizzes` + path `/lessons/` | lấy dev + thêm 2 hàm; `apiAiChatQuiz` đổi param thành `lessonId`, path `/api/v1/lessons/{lessonId}/quizzes/ai-chat`; `apiGetSkillProfile` (class-level) giữ nguyên |
| `QuizAuthoring.jsx` | kèm AI assistant: `QuizAiAssistant`, `SkillProfileDrawer`, `aiDrafts`, cờ `hasAiContent` → `source: AI_DIRECT` | rename `sessionId`→`lessonId`, labels "bài giảng", `navigate(basePath/lessons)` | lấy dev + ghép khối AI của feature; **truyền `lessonId` (thay `sessionId`) cho `<QuizAiAssistant>`**, giữ `classId` prop cho drawer SKP |
| `QuizAuthoringRoute.jsx` | thêm `classId` vào outlet context | chỉ sửa comment (wording lesson) | hợp nhất: `classId` + wording dev |

### File không conflict nhưng SẼ LỖI BIÊN DỊCH (do dev đổi API, phải sửa tay sau rebase)

Đây là phần quan trọng nhất — các file **chỉ có trên feature** (git auto-merge sạch nhưng tham chiếu API đã bị dev rename):

- `AiQuizService.java` — dùng `SessionOwnershipRow`, `findSessionOwnership(...)`, `quiz.sessionId()` → đổi thành `LessonOwnershipRow`, `findLessonOwnership(...)`, `quiz.lessonId()`; comment/doc "qua sessions → classes" → "qua lessons → classes". Exception giữ `SESSION_NOT_FOUND` (dev vẫn dùng code này trong `QuizService`).
- `AiClient.java`, các `Ai*Payload/dto`, `AiChatQuizRequest.java` — kiểm tra & đổi tên field tham chiếu session (nếu có) sang lesson.
- `SkillProfileRepository.java` — class-level, dự kiến không cần sửa (chỉ verify).
- Test `AiQuizServiceTest.java`, `AiPayloadSerializationTest.java` — cập nhật theo rename (mock `findSessionOwnership` → `findLessonOwnership`, `SessionOwnershipRow` → `LessonOwnershipRow`).
- `frontend/src/components/tutor/QuizAiAssistant.jsx` — prop `sessionId` → `lessonId`, gọi `apiAiChatQuiz(token, lessonId, …)`; comment.
- `QuizDetailResponse.java`/`QuizListItemResponse.java` (dev đổi `sessionId`→`lessonId`) — check code feature có tham chiếu `quiz.sessionId()` nào khác.

> **DB tables đọc/ghi sau khi merge (không có thay đổi DDL trong task này — migration V16/V17 đến từ dev):**
> - AI chat (`POST /lessons/{id}/quizzes/ai-chat`, read-only): **đọc** `lessons`, `classes`, `students` (ownership + ngữ cảnh ẩn danh), view `v_student_skill_stats` (SKP), `skills` (catalog); quiz draft hiện có: đọc `quizzes`, `quiz_questions` (theo `quizId`).
> - Skill profile (`GET /classes/{id}/skill-profile`): **đọc** `classes`, view `v_student_skill_stats`.
> - Tạo/sửa quiz (source `AI_DIRECT`): **ghi** `quizzes` (cột `lesson_id`, `source`), `quiz_questions`.

## Các bước thực hiện

1. **Sao lưu trước khi rebase**: `git branch backup/feature-tutor-quiz-pre-rebase` (nhánh cục bộ, có thể xóa sau khi xong).
2. **`git rebase origin/dev`** — replay 5 commit. Conflict tập trung ở commit đầu `9c10bdb` (9 file trong bảng trên). Resolve từng file theo chiến lược đã ghi, `git add` + `git rebase --continue`.
   - Commit `c95f4e6` (.gitignore), `1c71ae5`, `f824824`, `fa918e0`: khả năng xung đột nhẹ/trùng — resolve tương tự (lấy nội dung đúng của feature, điều chỉnh nếu đụng chỗ dev đã sửa).
3. **Sau khi rebase sạch**: sửa tay nhóm file "lỗi biên dịch" ở trên (AiQuizService, AiClient/dtos, tests, QuizAiAssistant).
4. **Verify**:
   - Backend: `cd backend && mvn -q test` (project dùng Maven, không có gradlew) — kiểm tra test `QuizServiceTest` (dev), `AiQuizServiceTest`, `AiPayloadSerializationTest` (feature) đều xanh.
   - Grep còn sót: `findSessionOwnership|SessionOwnershipRow|sessionId` trong `backend/src/main/java/.../quiz/` và `frontend/src/**/quiz*` phải sạch (trừ `SESSION_NOT_FOUND` code).
   - Verify không còn trùng code trong `ErrorCode.java`.
   - Frontend: `npm run build` trong `frontend/`.
5. **Commit message (nếu có commit sửa tay bổ sung)**: `fix: chuyển trợ lý AI quiz sang scope lesson sau rebase V16` (tiếng Việt, không có Co-Authored-By line theo memory rule).
6. **Force push** (chờ user xác nhận trước khi chạy): `git push --force-with-lease origin feature/tutor-quiz-authoring`.

## Rủi ro & điểm cần lưu ý

- **Chuyển ai-chat sang lesson**: ngữ cảnh AI (SKP, mã HS) vẫn lấy theo `classId` nên không đổi; chỉ scope ownership đổi từ session→lesson. FE route dev đã đổi param `:lessonId` (`App.jsx`) nên khớp sẵn.
- **Trùng code ErrorCode (1406/1407)** là lỗi có sẵn từ feature (không phải do rebase) — nhân cơ hội sửa luôn trong plan này; thay đổi số code không phá FE (FE nhận error theo message/HTTP status, chưa hard-code 1406/1407 — sẽ grep verify).
- Rebase 5 commit giữ nguyên history; nếu muốn history gọn hơn có thể chọn squash 4 commit sau vào `9c10bdb` (interactive rebase) — tùy user, mặc định **giữ nguyên 5 commit**.
