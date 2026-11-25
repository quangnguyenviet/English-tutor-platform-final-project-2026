# Kế hoạch Phase 2: Sửa câu hỏi/đáp án khi học sinh đã làm + Lưu phiên bản + Chấm điểm lại

> Phase 1 (sửa khi chưa làm + thu hồi + phiên bản mới) xem `my_plans/quiz_edit_phase1_revoke.md`. Phase 2 **bổ sung** trên Phase 1, giả định Phase 1 đã merge.

## Context

Phase 1 mở đường sửa cho quiz `ASSIGNED` khi học sinh chưa trả lời. Phase 2 xử lý phần còn lại: **gia sư phát hiện lỗi câu/đáp án SAU khi học sinh đã làm** (quiz có ≥1 hàng trong `quiz_answers`). Rủi ro lớn nhất: đường `updateQuiz` hiện tại (delete-all + insert) + FK `quiz_answers → quiz_questions ON DELETE CASCADE` (V5) sẽ **xóa sạch bài làm + chuỗi Elo + lịch sử ôn tập**. Phase 2 thay bằng cập nhật in-place và thêm cơ chế chấm lại.

Yêu cầu gốc (đã chốt): "Nếu đã có HS làm, cho phép sửa lỗi câu hỏi hoặc đáp án nhưng thông báo rõ ảnh hưởng đến điểm số. Lưu phiên bản đề cũ. Có chức năng chấm lại khi thay đổi đáp án đúng."

## Quyết định thiết kế chính

| Điểm | Quyết định | Lý do |
|---|---|---|
| Trạng thái được sửa (đã làm) | `ASSIGNED` và `COMPLETED` (không `EXPIRED`/`REVOKED`) | EXPIRED = đã hết hạn, muốn đổi đề → dùng phiên bản mới (Phase 1) |
| Cách ghi khi có answer | **In-place theo `questionId`** (UPDATE giữ nguyên `question_id`) + append câu mới + chỉ xóa câu 0 answer | Giữ `question_id` để không cascade xóa `quiz_answers`; thêm `questionId` vào request/response |
| Xóa câu đã có học sinh làm | Cấm (409) — bắt buộc dùng phiên bản mới | Xóa làm mất article của SRS + chuỗi Elo + UNIQUE (student,question) |
| Chấm lại (re-score) | **Replay toàn bộ chuỗi answer của học sinh** trong cùng transaction, đồng bộ (không async) | `students.elo = elo_after` hàng gần nhất (invariant), hàm Elo thuần theo `EloCalculator` — replay từ đầu chuỗi mới giữ đúng invariant; 1-1 nên O(N) nhỏ |
| SRS khi re-score | Câu chuyển `FALSE→TRUE`: tự rời hàng đợi (query filter `is_correct=FALSE`); câu chuyển `TRUE→FALSE`: ghi `next_review = NOW()` để vào hàng; giữ nguyên lịch sử `spaced_repetition_reviews` | Không phá audit, không trùng pending index (uq_spaced_review_pending trên rating IS NULL) |
| Thêm câu mới | Chỉ khi `ASSIGNED` (chưa COMPLETED); COMPLETED muốn thêm → phiên bản mới | Tránh mở lại quiz đã "hoàn thành" |
| Phiên bản đề cũ | Table `quiz_question_revisions` (snapshot old+new theo từng câu) | Đáp ứng "lưu phiên bản đề thi cũ"; self-contained |

## 1. Database — migration `V24__quiz_question_revisions.sql`

```sql
CREATE TABLE quiz_question_revisions (
    id                 BIGSERIAL PRIMARY KEY,
    quiz_id            BIGINT       NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_id        BIGINT       REFERENCES quiz_questions(id) ON DELETE SET NULL,
    -- snapshot CŨ (trước khi sửa)
    old_question_text  TEXT,
    old_option_a       VARCHAR(500),
    old_option_b       VARCHAR(500),
    old_option_c       VARCHAR(500),
    old_option_d       VARCHAR(500),
    old_correct_answer CHAR(1),
    old_cefr_level     VARCHAR(5),
    old_skill_id       BIGINT,
    -- snapshot MỚI
    new_question_text  TEXT,
    new_option_a       VARCHAR(500),
    new_option_b       VARCHAR(500),
    new_option_c       VARCHAR(500),
    new_option_d       VARCHAR(500),
    new_correct_answer CHAR(1),
    new_cefr_level     VARCHAR(5),
    new_skill_id       BIGINT,
    -- meta
    reason             VARCHAR(500),           -- lý do gia sư nhập (optional)
    changed_by         BIGINT       NOT NULL REFERENCES users(id),
    created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_quiz_revisions_quiz ON quiz_question_revisions(quiz_id);
CREATE INDEX idx_quiz_revisions_q    ON quiz_question_revisions(question_id);
```
- `quiz_questions`: thêm cột `last_revised_at TIMESTAMPTZ` (NULL nếu chưa bao giờ sửa) để FE badge "đã chỉnh sửa sau khi giao".
- Không đổi cấu trúc `quiz_answers` (chỉ UPDATE giá trị, không thêm cột).

## 2. Backend (`backend/`)

### ErrorCode mới
- `QUIZ_QUESTION_HAS_ANSWERS(1424, "Không thể xóa câu hỏi này vì học sinh đã trả lời", HttpStatus.CONFLICT)`
- `QUIZ_NO_RESCORE_NEEDED(1425, "Đáp án không thay đổi nên không cần chấm lại", HttpStatus.BAD_REQUEST)` (nếu client gọi re-score khi không có câu đổi đáp án)
- `QUIZ_ADD_QUESTION_NOT_ALLOWED(1426, "Không thể thêm câu hỏi mới vào quiz đã hoàn thành", HttpStatus.CONFLICT)`

### `QuizQuestionRequest` (module/quiz/api/request)
- Thêm `Long questionId` (nullable — null = câu mới). Giữ nguyên các validation hiện có.

### `QuizQuestionResponse` (module/quiz/api/response)
- Thêm `Long questionId` và `Boolean answeredByStudent` (liên quan Phase 1 deferred) và `OffsetDateTime lastRevisedAt`. FE dùng `questionId` để echo khi sửa, dùng `answeredByStudent` để disable ô "xóa câu" với câu đã làm.

### `QuizRepository` (module/quiz/repository)
- `List<QuizQuestionRow> findQuestionsWithIds(Long quizId)` — trả `(id, question_number, content fields, cefr, skill_id, last_revised_at)`.
- `int countAnsweredByQuestion(Long questionId)` — `SELECT COUNT(*) FROM quiz_answers WHERE question_id = ?` (để chặn xóa câu đã làm).
- `void updateQuestionInPlace(Long questionId, ...content fields..., OffsetDateTime now)` — `UPDATE quiz_questions SET ... , last_revised_at = NOW() WHERE id = ?`.
- `void insertNewQuestion(Long quizId, int number, QuizQuestionRequest q, Long skillId)` (tái dụng logic insert hiện có).
- `int deleteQuestionById(Long questionId)` (chỉ gọi khi countAnsweredByQuestion = 0).
- `void updateQuizTotalQuestions(Long quizId, int n)` + `revertStatusToAssignedIfCompleted(Long quizId)` (khi thêm câu vào quiz ASSIGNED không đổi gì; COMPLETED không thêm được).
- `List<RevisionRow> findRevisions(Long quizId)` — đọc lịch sử để FE xem.
- `void insertRevision(...)` — ghi snapshot.

### Re-score (module/quiz/repository + service mới)
Mở rộng đọc `quiz_answers` + `students`:
- `List<AnswerReplayRow> loadAnswerChainForQuiz(Long quizId, Long studentId)` — tất cả hàng `quiz_answers` của quiz, `ORDER BY answered_at, id`; mỗi hàng: `(question_id, selected_answer, is_correct, elo_before, elo_after, elo_change)`.
- `List<QuestionKeyRow> currentAnswerKeys(Long quizId)` — `question_id, correct_answer, cefr_level` (giá trị HIỆN TẠI sau khi sửa) để tính lại `is_correct`.
- `void rewriteAnswerRow(Long answerId, boolean correct, int before, int after, int change, OffsetDateTime nextReviewOrNull)` — `UPDATE quiz_answers SET is_correct=?, elo_before=?, elo_after=?, elo_change=?, next_review=? WHERE id=?`.
- `void setStudentElo(Long studentId, int elo)` (tái dụng `updateElo`).
- `Integer lockStudentElo(Long studentId)` (tái dụng `lockElo`) — serialize với answer đang chạy.

Thuộc `student` module nhưng thao tác trên `quiz_answers`/`students` — đặt service trong `module/quiz` nhưng reuse method của `StudentPortalRepository`, hoặc thêm repository riêng trong quiz module trỏ vào cùng 2 bảng (tránh phụ thuộc ngược module). **Quyết định: thêm `RescoreRepository` trong quiz module** (read-only + write trên `quiz_answers`, `students.elo`) để module quiz tự chứa, không import repository của student.

### `QuizService.java`
- `updateQuiz` (thay hoàn toàn delete-all+insert bằng in-place):
  1. `lockQuiz` → `requireOwnedQuiz` → guard trạng thái (DRAFT, hoặc ASSIGNED/COMPLETED nếu ≥1 answer; EXPIRED/REVOKED → `QUIZ_INVALID_STATE`).
  2. Load câu hiện có (map `questionId → row`).
  3. Với mỗi entry trong request:
     - có `questionId` thuộc quiz → **UPDATE in-place**; so sánh từng trường, nếu có khác → `insertRevision` (snapshot cũ + mới + reason).
     - không có / id lạ → **INSERT câu mới**; nếu quiz `COMPLETED` → `QUIZ_ADD_QUESTION_NOT_ALLOWED`.
  4. Câu hiện có không nằm trong request → xóa; nếu `countAnsweredByQuestion > 0` → `QUIZ_QUESTION_HAS_ANSWERS` (cấm); không thì `deleteQuestionById` (cascade an toàn vì 0 answer).
  5. `updateQuizTotalQuestions`.
  6. **Re-score** (chỉ khi quiz ASSIGNED/COMPLETED và có ≥1 câu đổi `correct_answer` hoặc đổi options khiến đáp án học sinh chọn không còn đúng):
     - `studentId = quiz.studentId()` (1-1: lấy từ ownership row).
     - `lockStudentElo` (serialize).
     - Replay: đọc `loadAnswerChainForQuiz`; `base = elo_before` hàng đầu (hoặc `findElo` nếu không có hàng); với mỗi hàng theo thứ tự: `correctNew = (selected == currentKey[questionId])`; chỉ đổi `is_correct` nếu câu này nằm trong tập "đổi đáp án" (khác giữ nguyên); `res = EloCalculator.apply(base, cefr[questionId], correctNew)`; ghi lại hàng; `base = res.after`. Câu chuyển `TRUE→FALSE` → `next_review = NOW()`; `FALSE→TRUE` → `next_review = NULL`; khác giữ `next_review`.
     - `setStudentElo(studentId, base)`.
     - Thông báo học sinh (notification "kết quả & Elo có thể thay đổi").
  7. `audit_log` action `UPDATE_QUIZ` (ghi `changedCorrectAnswers` số câu đổi đáp án, `rescored` true/false).
- `rescoreQuiz(quizId)` (endpoint riêng, để gia sư chủ động "chấm lại" sau khi sửa đáp án — requirement #4):
  - Guard ownership + trạng thái + quiz phải có ≥1 answer.
  - Chạy đúng block re-score trên (không cần kèm sửa câu) → trả `{ rescored: true, eloBefore, eloAfter, answersChanged: n }`.

### `QuizController.java`
- `PUT /api/v1/quizzes/{id}` — đổi body semantics: danh sách câu giờ có `questionId`. (Tương thích ngược: entry không id vẫn = câu mới.)
- `POST /api/v1/quizzes/{id}/rescore` (TUTOR) → trigger chấm lại.
- `GET /api/v1/quizzes/{id}/revisions` (TUTOR) → lịch sử sửa (đáp ứng "lưu phiên bản đề cũ" + cho gia sư xem lại).

### Phía học sinh (`module/student`)
- Không đổi guard (Phase 1). Chỉ cần: khi trả lời câu, đọc `correct_answer` HIỆN TẠI (đã được update) — đã đúng vì `findQuestion` đọc DB. Nếu học sinh xem lại kết quả sau re-score, `getResult`/`replay` tự lấy giá trị mới (invariant giữ).
- Notification học sinh mới khi re-score (pattern `notifications`).

## 3. Frontend (`frontend/`)

### Tutor
- `lib/quizApi.js`:
  - `apiUpdateQuiz` — payload câu giờ kèm `questionId` (từ detail) + `reason` (optional, 1 ô "lý do sửa" chung cho lần lưu).
  - `apiRescoreQuiz(token, quizId)` → POST rescore.
  - `apiGetQuizRevisions(token, quizId)` → GET revisions.
- `pages/tutor/manage/QuizAuthoring.jsx`:
  - Mỗi câu hiển thị `questionId`; ô nội dung giữ value; với câu `answeredByStudent === true`, **nút "xóa câu" bị disable** (tooltip: "Học sinh đã trả lời, không thể xóa — dùng 'Tạo phiên bản mới'").
  - Khi quiz ASSIGNED/COMPLETED và có ≥1 câu đã làm: banner rose "Học sinh đã làm N câu. Sửa đáp án sẽ chấm lại điểm & Elo — xem chi tiết trước khi lưu."
  - Nút mới "**Chấm điểm lại**" (variant `secondary`, hiện khi có ≥1 câu đổi đáp án hoặc sau khi đã sửa): gọi rescore → modal kết quả "Elo trước → sau, X câu đổi kết quả".
  - Panel "Lịch sử chỉnh sửa" (accordion, đọc từ revisions): list câu đổi + thời gian + người sửa + snapshot cũ/sau (read-only).
  - `reason` field (input ngắn) bên cạnh nút lưu để ghi vào revision (optional).

### Student
- Không đổi flow trả lời (đọc đáp án hiện tại tự động). Nếu quiz bị re-score, kết quả hiển thị trong "Xem kết quả" tự cập nhật theo DB.
- Notification "gia sư đã cập nhật bảng đáp án, điểm có thể thay đổi" hiển thị trong trung tâm thông báo (đã có UI notification).

## 4. Tài liệu
- `backend/API_DESIGN.md` §3.7: cập nhật `PUT /quizzes/{id}` (questionId + in-place + rule cấm xóa câu đã làm), thêm `POST /quizzes/{id}/rescore`, `GET /quizzes/{id}/revisions`; mô tả cơ chế re-score (replay chuỗi Elo) và tác động SRS; note "đề thi được giữ phiên bản qua quiz_question_revisions".

## Mapping đọc/ghi bảng CSDL theo từng thao tác (bắt buộc)

| Thao tác | Đọc (reads) | Ghi (writes) |
|---|---|---|
| `PUT /quizzes/{id}` (in-place, đã làm) | `quizzes` (lock), `quiz_questions` (câu hiện có + id), `skills`, `quiz_answers` (count theo câu để chặn xóa), `classes` (sở hữu) | `quiz_questions` (UPDATE câu, append câu mới), `quiz_question_revisions` (1 hàng/câu đổi), `quizzes` (total_questions, status) |
| Re-score (trong PUT hoặc rescore) | `quiz_answers` (chuỗi của quiz+student), `quiz_questions` (đáp án/cefr hiện tại), `students` (lockElo) | `quiz_answers` (is_correct, elo_*, next_review), `students.elo`, `notifications` (học sinh), `audit_logs` |
| `POST /quizzes/{id}/rescore` | như Re-score | như Re-score |
| `GET /quizzes/{id}/revisions` | `quiz_question_revisions` | — |

→ 1 migration mới (V24): bảng `quiz_question_revisions` + cột `quiz_questions.last_revised_at`.

## Thuật toán re-score (ghi rõ để code đúng)

```
studentId  = quiz.studentId()            // 1-1: 1 học sinh/quiz
lockStudentElo(studentId)                // serialize với answer chạy song song
chain      = loadAnswerChainForQuiz(quizId, studentId)   // ORDER BY answered_at, id
if chain empty: return {rescored:false}
keys       = currentAnswerKeys(quizId)   // map questionId -> {correct, cefr}
base       = chain.first.elo_before
changedCorrect = 0
for row in chain:
    key      = keys[row.questionId]
    newC     = (row.selected_answer == key.correct)
    if newC != row.is_correct:
        row.is_correct = newC
        changedCorrect++
        if newC == FALSE: row.next_review = NOW()   // TRUE->FALSE: vào hàng SRS
        else:             row.next_review = NULL     // FALSE->TRUE: ra khỏi hàng SRS
    res      = EloCalculator.apply(base, key.cefr, row.is_correct)
    row.elo_before = base; row.elo_after = res.after; row.elo_change = res.after - base
    base = res.after
for row in chain: rewriteAnswerRow(row)
setStudentElo(studentId, base)
notify(studentId, "Bảng đáp án quiz ... đã cập nhật — kết quả/Elo có thể thay đổi")
return {rescored:true, eloAfter:base, answersChanged:changedCorrect}
```
Lưu ý: chỉ re-score khi có ≥1 câu đổi `correct_answer` (hoặc options thay đổi làm `is_correct` thay đổi). Nếu không → trả `QUIZ_NO_RESCORE_NEEDED`.

## Tests
- `QuizServiceTest`:
  - update in-place giữ nguyên `question_id` (không cascade xóa `quiz_answers`).
  - cấm xóa câu đã có answer → `QUIZ_QUESTION_HAS_ANSWERS` (1424).
  - thêm câu vào quiz COMPLETED → `QUIZ_ADD_QUESTION_NOT_ALLOWED` (1426).
  - revision được ghi khi đổi nội dung; không ghi khi không đổi.
- `RescoreTest` (mới, module quiz):
  - Quiz 3 câu, học sinh trả lời, đổi đáp án câu 2 → replay: `is_correct` câu 2 flip, Elo các câu sau câu 2 dịch chuyển, `students.elo` = elo_after cuối, hàng câu 2 (TRUE→FALSE) có `next_review` set.
  - Đổi đáp án khiến câu "sai" thành "đúng" → `next_review = NULL`, rời hàng SRS (verify bằng query `findDueReviews`).
  - Re-score khi không đổi đáp án → `QUIZ_NO_RESCORE_NEEDED`.
  - Idempotent: chạy re-score 2 lần liên tiếp → cùng kết quả (chạy 1 lần, lần 2 không đổi gì vì đáp án đã bằng).
- Regression: `QuizServiceTest` Phase 1 (update ASSIGNED 0 answer, revoke, duplicate) vẫn pass.

## Thứ tự thực hiện (bước nhỏ, kiểm tra sau mỗi bước — CLAUDE.md)
1. Migration V24 (bảng + cột) → verify constraint.
2. ErrorCode 1424–1426.
3. `questionId` vào `QuizQuestionRequest`/`Response` + `answeredByStudent`, `lastRevisedAt`.
4. Repository in-place (findWithIds, countAnsweredBy, updateInPlace, revision, total/status).
5. `RescoreRepository` + thuật toán replay + test thuần (chưa nối service).
6. `QuizService.updateQuiz` đổi sang in-place + gọi re-score khi cần + test.
7. `rescoreQuiz` + `findRevisions` service + controller 2 endpoint.
8. Notification học sinh re-score.
9. FE tutor: quizApi + QuizAuthoring (banner, disable xóa câu đã làm, nút re-score, panel revision, ô reason).
10. Tài liệu API_DESIGN.
11. Chạy full: `mvn test`, `npm test`, `docker compose up --build`.

## Branch & commit
- Nhánh: `feature/quiz-rescore-p2`, PR vào `dev`, squash.
- Commit gợi ý:
  - `feat: cập nhật quiz in-place theo questionId, cấm xóa câu đã trả lời`
  - `feat: lưu phiên bản câu hỏi qua quiz_question_revisions`
  - `feat: chấm điểm lại (re-score) Elo khi thay đổi đáp án`
  - `test: test in-place, re-score, SRS và regression Phase 1`
  - `docs: cập nhật PUT/quizzes + rescore + revisions trong API_DESIGN`

## Rủi ro / biên
- **Re-score đồng bộ khi học sinh đang làm giữa chừng**: `lockStudentElo` serialize; answer mới của học sinh trong cùng txn được tính (re-read chain sau lock). Chấp nhận.
- **Replay O(N toàn bộ chuỗi answer của học sinh)**: quy mô 1-1 → vài nghìn hàng, 1 transaction, `EloCalculator` thuần → negligible. Nếu sau này nhiều, tách async (không làm ở đây).
- **Options đổi nhưng `correct_answer` giữ nguyên mà học sinh chọn option bị đổi nội dung**: thuật toán so `selected_answer` (chữ A–D) với `correct_answer` → nếu tutor đổi thứ tự options (B↔D) mà đúng chữ cái đáp án, kết quả có thể đổi không đúng ý đồ → **ghi rõ trong UI**: đổi options = re-score; khuyến nghị đổi text chứ không đổi thứ tự, hoặc chấp nhận re-score. (Giới hạn có chủ đích của scope.)
- **COMPLETED + thêm câu**: cấm (1426), bắt buộc phiên bản mới — khớp requirement #5.
