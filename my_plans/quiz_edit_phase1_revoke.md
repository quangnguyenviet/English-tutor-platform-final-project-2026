# Kế hoạch Phase 1: Chỉnh sửa quiz đã giao khi chưa làm + Thu hồi & Tạo phiên bản mới

> Phase 2 (sửa khi đã làm + lưu phiên bản + chấm lại) xem `my_plans/quiz_edit_phase2_rescore.md`.
> Yêu cầu gốc (đã chốt với user): "Cho phép GV sửa bài sau khi giao nếu chưa có HS làm"; "Muốn đổi toàn bộ đề → tạo phiên bản mới hoặc thu hồi bài cũ và giao lại".

## Context

State machine quiz hiện tại (API_DESIGN §2, `quizzes.status`): `DRAFT → ASSIGNED → COMPLETED/EXPIRED`.
Guard `requireDraft()` trong `QuizService` chặn mọi sửa/giao khi không còn DRAFT. Vấn đề thực tế: gia sư giao xong mới phát hiện lỗi đề → không có lối thoát, phải để học sinh làm đề sai.

Phase 1 mở 2 lối thoát **an toàn** (không đụng điểm số/Elo):
1. **Sửa quiz đã giao khi học sinh CHƯA trả lời câu nào** (0 hàng trong `quiz_answers` của quiz đó).
2. **Thu hồi** quiz (`REVOKED`) khi học sinh chưa làm + **Tạo phiên bản mới** (duplicate nội dung sang DRAFT mới).

Ngoài phạm vi Phase 1: sửa quiz khi học sinh đã làm (chấm lại điểm, lưu revision) → Phase 2.

## Quyết định thiết kế chính

| Điểm | Quyết định | Lý do |
|---|---|---|
| Điều kiện sửa | `DRAFT`, hoặc `ASSIGNED` + `answeredCount = 0` | Có ≥1 câu trả lời → sửa sẽ phá điểm/Elo/ôn tập → cấm ở Phase 1, Phase 2 xử lý riêng |
| Cách ghi khi sửa | Giữ nguyên cách delete-all + insert (đường cũ `updateQuiz`) | An toàn vì đã guard 0 câu trả lời — FK cascade `quiz_answers → quiz_questions` (V5) không chạm dữ liệu gì |
| Thu hồi | Status mới `REVOKED`, chỉ từ `ASSIGNED` + 0 câu trả lời | Sau khi học sinh đã làm, không thu hồi (điểm đã tính, SRS đã vào hàng) — muốn đổi đề thì dùng "phiên bản mới" và để bài cũ tự hoàn tất/hết hạn |
| Dư hạn khi REVOKED | Không cần scheduler — expiry hiện là lazy (`QuizExpiryService`), REVOKED không bao giờ qua được guard của student | — |
| Duplicate | Endpoint BE (1 transaction), copy câu hỏi sang quiz DRAFT mới cùng lesson | FE không cần giữ danh sách câu để gọi `createQuiz` riêng; ownership check tập trung ở BE |

## 1. Database — migration `V23__quiz_status_revoked.sql`

- `ALTER TABLE quizzes DROP CONSTRAINT chk_quizzes_status;`
- `ALTER TABLE quizzes ADD CONSTRAINT chk_quizzes_status CHECK (status IN ('DRAFT','ASSIGNED','COMPLETED','EXPIRED','REVOKED'));`
- Không bảng mới, không index mới.

## 2. Backend (`backend/`)

### ErrorCode mới (`shared/exception/ErrorCode.java`, block quiz 1400–1420 đã dùng)
> **Đích danh (2026-06-14):** 1421/1422 đã bị `REVIEW_ATTEMPT_NOT_FOUND`/mã ôn tập chiếm — dùng **1424–1426** thay vì 1421–1423 (FE handle code 1426 cho REVOKED).
- `QUIZ_HAS_ANSWERS(1424, "Học sinh đã trả lời một số câu hỏi nên không thể chỉnh sửa đề bài này", HttpStatus.CONFLICT)`
- `QUIZ_NOT_REVOCABLE(1425, "Không thể thu hồi quiz này", HttpStatus.CONFLICT)` (msg động khi cần: "học sinh đã trả lời câu hỏi" / "quiz không ở trạng thái Đã giao")
- `QUIZ_REVOKED(1426, "Quiz này đã bị gia sư thu hồi", HttpStatus.GONE)` — guard phía học sinh khi try start/answer.

### `QuizRepository.java` (module/quiz/repository)
- `int countAnswers(Long quizId)` — `SELECT COUNT(*) FROM quiz_answers a JOIN quiz_questions qq ON qq.id = a.question_id WHERE qq.quiz_id = ?`.
- `Optional<Long> revokeQuiz(Long quizId)` — `UPDATE quizzes SET status='REVOKED', updated_at=NOW() WHERE id=? AND status='ASSIGNED'` (sau khi đã lock).
- `void insertQuizRevokedNotification(Long studentId, String quizTitle, Long classId)` — insert `notifications` (title "Quiz đã được thu hồi", content "Quiz {title} đã bị thu hồi. Vui lòng kiểm tra các bài tập khác.", link CLASS) — pattern sao chép `insertQuizAssignedNotification` (QuizRepository.java:291).
- `Long duplicateQuiz(Long sourceQuizId, Long lessonId, String newTitle)` — insert quiz DRAFT (mượn `insertQuiz`) rồi copy từng câu từ quiz nguồn sang quiz mới (insert `quiz_questions` như trong `createQuizForLesson`). Trong 1 transaction của service.
- `Integer answeredCountForLessonQuizzes(...)` / thêm cột `answeredCount` vào query `findLessonQuizzes` và `findQuiz` (JOIN/COUNT DISTINCT subquery từ `quiz_answers`).

### `QuizService.java`
- `updateQuiz`: thay guard `requireDraft(quiz)` bằng `requireEditable(quiz)`:
  - DRAFT → OK (đường hiện tại).
  - ASSIGNED và `countAnswers == 0` → OK (đường mới, cùng delete-all).
  - ASSIGNED và có câu trả lời → throw `QUIZ_HAS_ANSWERS` (Phase 2 sẽ thay bằng đường in-place).
  - COMPLETED/EXPIRED/REVOKED → `QUIZ_INVALID_STATE` (trạng thái hiện có).
- `revokeQuiz(quizId)` (mới, `@Transactional`): `lockQuiz` → `requireOwnedQuiz` → status phải `ASSIGNED` (không thì `QUIZ_NOT_REVOCABLE`) → `countAnswers == 0` (không thì `QUIZ_NOT_REVOCABLE`) → `revokeQuiz` update + notification học sinh + `audit_log` action `REVOKE_QUIZ`.
- `duplicateQuiz(quizId)` (mới, `@Transactional`): `lockQuiz` (đọc đủ) → `requireOwnedQuiz` (mọi status đều duplicate được) → đọc câu hỏi nguồn → tạo quiz DRAFT mới cùng `lesson_id`, title = `{title cũ} (phiên bản mới)` → copy câu (skill_id giữ nguyên) → audit `DUPLICATE_QUIZ` → trả `QuizDetailResponse` mới.

### `QuizController.java`
- `POST /api/v1/quizzes/{id}/revoke` (TUTOR).
- `POST /api/v1/quizzes/{id}/duplicate` (TUTOR) → trả quiz mới.
- `PUT /api/v1/quizzes/{id}` giữ nguyên, chỉ thay guard (trên).

### DTO
- `QuizDetailResponse`, `QuizListItemResponse`: thêm `Integer answeredCount` (0 nếu chưa ai làm).
- `QuizQuestionResponse`: thêm `Boolean answeredByStudent` — **trì hoãn sang Phase 2** (Phase 1 không cần vì sửa chỉ xảy ra khi 0 câu). Không làm ở phase này.

### Phía học sinh (`module/student`)
- `StudentPortalService.requireOwnedQuiz` (l.494–507): thêm nhánh — `quiz.status()` là `REVOKED` → throw `QUIZ_REVOKED`. Guard này phủ `getQuizDetail`/`startAttempt`/`answer`/`getResult` (tất cả đi qua `requireOwnedQuiz`).
- `findQuizzes` (danh sách theo status) không đổi — tab REVOKED phía FE lọc bằng status trả về.

## 3. Frontend (`frontend/`)

### Tutor
- `lib/quizApi.js`:
  - `apiRevokeQuiz(token, quizId)` → POST revoke; `apiDuplicateQuiz(token, quizId)` → POST duplicate.
  - `QUIZ_STATUS_META` (l.158): thêm `REVOKED: { label: "Đã thu hồi", tone: "rose" }`.
- `pages/tutor/manage/QuizAuthoring.jsx`:
  - Điều kiện khóa hiện dựa `isDraft` (title, "Thêm câu", "Lưu nháp", "Giao bài"…). Thay bằng `editable = isDraft || (status === "ASSIGNED" && answeredCount === 0)`; nút "Giao bài" vẫn chỉ enable khi DRAFT.
  - Banner mới khi `status === "ASSIGNED"`: answeredCount = 0 → amber "Quiz đã giao nhưng học sinh chưa trả lời câu nào — bạn vẫn chỉnh sửa được cho đến khi học sinh làm." ; answeredCount > 0 → blue/rose "Quiz đã được học sinh làm — không thể chỉnh sửa đề (sẽ có chức năng sửa có chấm lại trong giai đoạn sau)."
  - Nút "Thu hồi bài" (variant `danger`, hiện khi ASSIGNED + answeredCount = 0): modal xác nhận (lấy pattern confirmation hiện có trong app) → gọi revoke → toast "Đã thu hồi quiz" → refetch detail (status REVOKED).
  - Nút "Tạo phiên bản mới" (variant `secondary`, hiện với mọi status trừ DRAFT): gọi duplicate → `navigate` sang trang authoring quiz mới (mở DRAFT copy) + toast.
  - Trạng thái REVOKED: form read-only, banner "Quiz đã bị thu hồi", ẩn nút giao, giữ nút "Tạo phiên bản mới".
  - Ai-chat (FE toast "không thể thêm câu từ AI"): giữ `isDraft` — thêm câu AI vào quiz đã giao không hợp lý, để đúng Phase 2 nếu cần.
- `pages/tutor/manage/ManageAssignments.jsx` / `ManageSessions.jsx` / `classroomApi.js` (chỗ hiển thị badge status quiz): dùng `QUIZ_STATUS_META` mới (đủ nếu đã dùng map này).

### Student
- `lib/studentModel.js`:
  - `quizWorkState` (l.179–181): thêm `if (quiz?.status === "REVOKED") return "REVOKED";` (đặt trước các nhánh khác).
  - `QUIZ_WORK_STATE_META` (l.170): thêm `REVOKED: { label: "Đã thu hồi", tone: "rose", icon: Archive }` (icon lucide, không emoji).
- `pages/student/StudentExercises.jsx` (và `StudentClassExercises.jsx`): thêm tab `REVOKED` "Đã thu hồi" (icon `Archive`) vào TABS; card ở tab này không hiện nút "Làm bài", hiện note "Gia sư đã thu hồi bài tập này."
- `pages/student/ExerciseTaking.jsx`: guard đầu trang — workState REVOKED → panel thông tin "Quiz đã bị thu hồi" (thay vì list câu hỏi). Handle API error code **1423** (410) khi gọi start/answer: chuyển card/tab sang REVOKED + message tương ứng (pattern xử lý 410 hiện có tại `studentModel.js:159` — mở rộng cho cả 1423).
- `components/student/StudentSessionDetail.jsx` / `components/student/SessionDetailModal.jsx` (chỗ hiển thị status quiz): thêm nhánh REVOKED (badge rose "Đã thu hồi").

## 4. Tài liệu
- `backend/API_DESIGN.md` §2 (bảng state machine quiz, l.208–215): thêm hàng `REVOKED`; cập nhật mô tả endpoint `PUT /quizzes/{id}` (sửa khi ASSIGNED chưa làm), thêm `POST /quizzes/{id}/revoke`, `POST /quizzes/{id}/duplicate`; ghi chú "sửa khi đã làm + chấm lại: Phase 2".

## Mapping đọc/ghi bảng CSDL theo từng thao tác (bắt buộc)

| Thao tác | Đọc (reads) | Ghi (writes) |
|---|---|---|
| `PUT /quizzes/{id}` — DRAFT | `quizzes` (lock), `skills` (validate skill_code) | `quizzes` (title), `quiz_questions` (xóa + chèn lại) |
| `PUT /quizzes/{id}` — ASSIGNED, chưa làm | + `quiz_answers` (count, phải = 0) | như DRAFT (an toàn: không có `quiz_answers` để cascade) |
| `POST /quizzes/{id}/revoke` | `quizzes` (lock), `quiz_answers` (count = 0), `classes` (sở hữu) | `quizzes.status`, `notifications` (1 hàng cho học sinh), `audit_logs` |
| `POST /quizzes/{id}/duplicate` | `quizzes` (lock), `quiz_questions` (nguồn), `lessons`/`classes` (sở hữu) | `quizzes` (hàng mới, DRAFT), `quiz_questions` (bản copy), `audit_logs` |
| Student start/answer/detail trên quiz REVOKED | `quizzes` (access row) | — (guard 1423, không ghi) |

→ 1 migration mới (V23, chỉ sửa CHECK constraint `quizzes.status`), không bảng mới.

## Tests
- `QuizServiceTest`:
  - update ASSIGNED + 0 answers → OK (đề/câu giữ nguyên, `answeredCount` trong response = 0).
  - update ASSIGNED + có answers → `QUIZ_HAS_ANSWERS` (1421).
  - revoke ASSIGNED + 0 answers → status REVOKED + 1 notification + audit.
  - revoke ASSIGNED + có answers → 1422; revoke DRAFT/COMPLETED/EXPIRED/REVOKED → 1422.
  - duplicate mọi status → quiz mới DRAFT, đúng số câu, skill_id giữ nguyên; ownership sai → `QUIZ_NOT_OWNED`.
- `StudentPortalQuizServiceTest` (hoặc test có sẵn của module student):
  - start/answer quiz REVOKED → 1423; quiz ASSIGNED vẫn hoạt động như cũ (regression).

## Thứ tự thực hiện (mỗi bước nhỏ, kiểm tra sau mỗi bước — theo CLAUDE.md)
1. Migration V23 → chạy `docker compose up` DB, verify constraint.
2. ErrorCode 1421–1423.
3. Repository: countAnswers + answeredCount trong query có sẵn + revoke/duplicate/notifications + tests.
4. Service: `requireEditable` + `revokeQuiz` + `duplicateQuiz` + tests.
5. Controller 2 endpoint mới + swagger.
6. Student guard 1423 + test.
7. FE tutor: quizApi + QuizAuthoring (banner, 2 nút, read-only REVOKED).
8. FE student: studentModel + tab REVOKED + guard ExerciseTaking + modal/session detail.
9. Tài liệu API_DESIGN.
10. Chạy full: `mvn test`, `npm test`, `docker compose up --build` (DoD GIT_CONVENTION).

## Branch & commit (theo GIT_CONVENTION.md)
- Nhánh: `feature/quiz-edit-after-assign-p1`, merge PR vào `dev`, squash.
- Commit gợi ý:
  - `feat: cho phép sửa quiz đã giao khi học sinh chưa trả lời`
  - `feat: thu hồi quiz và tạo phiên bản mới từ quiz hiện có`
  - `test: test guard sửa/thu hồi/duplicate quiz`
  - `docs: cập nhật state machine quiz (REVOKED) trong API_DESIGN`

## Rủi ro / biên
- **Học sinh đang xem quiz mà gia sư sửa** (0 câu trả lời, chưa chấm gì): nội dung có thể thay đổi giữa chừng khi họ đọc câu kế tiếp — chấp nhận được vì chưa có điểm nào được tính; audit log có `UPDATE_QUIZ` sau assign.
- **REVOKED không hủy deadline**: quiz hết hạn tự động (lazy expiry) không còn ý nghĩa sau revoke; guard 1423 chặn trước khi tới bước expiry.
- **Duplicate quiz đã có học sinh làm**: cho phép (copy nội dung), quiz cũ tiếp tục chu trình COMPLETED/EXPIRED — gia sư tự cân nhắc khi giao bản mới (ghi rõ trong tooltip nút).
