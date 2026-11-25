# Kế hoạch: Chuyển ôn tập ngắt quãng sang bảng snapshot `review_cards`

> Yêu cầu gốc (đã chốt với user):
> - "spaced-repetition không dùng bảng quiz_answers nữa, tạo 1 bảng mới lưu nội dung câu hỏi cần ôn (không join qua question)"
> - Mục tiêu: "sắp tới làm tính năng xóa 1 bài quiz thì câu hỏi trong danh sách ôn tập không bị ảnh hưởng"
> - Không lưu `source_quiz_id`, không lưu `quiz_title` (user chốt: "không cần lưu quiz_title luôn")
> - Interval giữ nguyên mặc định (AGAIN 1p / HARD 6p / GOOD 10p / EASY 5 ngày, không ladder)

## 1. Context — tại sao phải làm

FR-22 hiện lưu trạng thái ôn tập trên `quiz_answers` (trạng thái thẻ) + `spaced_repetition_reviews` (lịch sử), nội dung câu **JOIN trực tiếp** qua `quiz_questions` → `quizzes` / `skills`. Hệ quả:
1. Xóa quiz (tính năng sắp làm) → cascade xóa lịch sử ôn tập của học sinh.
2. Tutor sửa quiz (phase 2 rescore) → nội dung câu ôn của học sinh tự đổi theo bản mới, trong khi lịch ôn được tính theo bản cũ.

Giải pháp: bảng `review_cards` snapshot nội dung tại thời điểm học sinh trả lời sai → ôn tập độc lập với vòng đời quiz.

## 2. Nhánh

- Tách `feature/review-cards-snapshot` từ `dev` (đặt tên trùng `feature/review-cards-snapshot` như đã tạo). Không trộn vào `feature/quiz-edit-after-assign-p1`.

## 3. Database — migration mới `V24__review_cards.sql`

### 3.1 Bảng mới `review_cards`

```sql
CREATE TABLE review_cards (
    id                      BIGSERIAL   PRIMARY KEY,
    student_id              BIGINT      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    -- snapshot nội dung (đóng băng tại thời điểm trả lời sai)
    question_text           TEXT        NOT NULL,
    option_a                VARCHAR(500) NOT NULL,
    option_b                VARCHAR(500) NOT NULL,
    option_c                VARCHAR(500) NOT NULL,
    option_d                VARCHAR(500) NOT NULL,
    correct_answer          CHAR(1)     NOT NULL,
    explanation             TEXT,
    skill_name              VARCHAR(100),
    cefr_level              VARCHAR(10),
    -- trạng thái thẻ (rút từ quiz_answers)
    next_review             TIMESTAMPTZ,
    review_count            SMALLINT    NOT NULL DEFAULT 0,
    last_reviewed_at        TIMESTAMPTZ,
    last_rating             VARCHAR(10),
    review_interval_seconds  INTEGER,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_review_card_rating CHECK (
        last_rating IS NULL OR last_rating IN ('AGAIN','HARD','GOOD','EASY')),
    CONSTRAINT chk_review_card_interval CHECK (
        review_interval_seconds IS NULL OR review_interval_seconds > 0),
    UNIQUE (student_id, question_text, cefr_level)  -- cùng nội dung sai trong 2 quiz → 1 thẻ
);
CREATE INDEX idx_review_card_due
    ON review_cards(student_id, next_review) WHERE next_review IS NOT NULL;
```

### 3.2 Sửa `spaced_repetition_reviews`

- `DROP COLUMN quiz_answer_id, question_id`.
- `ADD COLUMN card_id BIGINT NOT NULL REFERENCES review_cards(id) ON DELETE CASCADE` (thay FK cũ).
- Unique index pending: đổi từ `(student_id, question_id) WHERE rating IS NULL` → `(student_id, card_id) WHERE rating IS NULL` (giữ invariant "mỗi học sinh tối đa 1 lượt chưa chấm / thẻ").

### 3.3 Backfill (chạy trong cùng migration)

```sql
INSERT INTO review_cards (student_id, question_text, option_a, option_b, option_c, option_d,
                         correct_answer, explanation, skill_name, cefr_level,
                         next_review, review_count, last_reviewed_at, last_rating, review_interval_seconds)
SELECT DISTINCT ON (a.student_id, qq.question_text, qq.cefr_level)
       a.student_id, qq.question_text, qq.option_a, qq.option_b, qq.option_c, qq.option_d,
       qq.correct_answer, qq.explanation, sk.skill_name, qq.cefr_level,
       a.next_review, a.review_count, a.last_reviewed_at, a.last_rating, a.review_interval_seconds
FROM quiz_answers a
JOIN quiz_questions qq ON qq.id = a.question_id
LEFT JOIN skills sk ON sk.id = qq.skill_id
WHERE a.is_correct = FALSE
ORDER BY a.student_id, qq.question_text, qq.cefr_level, a.next_review;

-- Map lịch sử review sang card mới (tìm card theo student + nội dung câu)
UPDATE spaced_repetition_reviews rr SET card_id = c.id
FROM quiz_answers a
JOIN quiz_questions qq ON qq.id = a.question_id
JOIN review_cards c
       ON c.student_id = rr.student_id
      AND c.question_text = qq.question_text
      AND c.cefr_level = qq.cefr_level
WHERE a.id = rr.quiz_answer_id;
```

### 3.4 `quiz_answers` — KHÔNG xóa cột

Các cột V21 thêm (`next_review`, `last_rating`, `review_interval_seconds`) và V5 (`review_count`, `next_review`) **giữ nguyên** để không phá phase 2 rescore (nó đang đọc/ghi các cột này). Chỉ ngừng ghi mới (xem mục 4.1). Dọn cột này là việc của phase sau.

> Ghi chú: `V23__quiz_status_revoked.sql` đang ở nhánh quiz-edit (chưa merge dev) → migration mới đặt tên `V24` trên dev, số `V23` trên nhánh kia không đụng.

## 4. Backend — module/student

### 4.1 Chỗ sinh thẻ mới: `StudentPortalService.answer()` (l.346–390)

Hiện tại `insertAnswer` tự set `next_review = NOW()` khi `is_correct=FALSE` (SQL `CASE WHEN ? THEN NULL ELSE NOW() END`). Chuyển logic sang sinh `review_cards`:

- Repository mới: `insertReviewCardOnWrong(studentId, questionId, ...)` — đọc snapshot từ `quiz_questions` + `skills` (JOIN lúc trả lời, không giữ FK), INSERT vào `review_cards` với `next_review = NOW()`, `ON CONFLICT (student_id, question_text, cefr_level) DO NOTHING`.
- Gọi sau `insertAnswer` thành công (cùng transaction) khi `correct == false`.
- `insertAnswer`: **bỏ set `next_review`** (cột còn nhưng không dùng) để tránh state mồ côi trên `quiz_answers`.

### 4.2 Mapping đọc/ghi bảng theo từng thao tác

| Thao tác (endpoint / service method) | Đọc | Viết | Ghi chú |
|---|---|---|---|
| `POST /quizzes/{id}/questions/{qid}/answer`<br>`StudentPortalService.answer` | `quizzes` (guard), `quiz_questions` (snapshot + correct), `quiz_answers` (idempotency), `students` (Elo) | `quiz_answers` (bỏ `next_review`), `students` (Elo), `quizzes` (status khi hết), **`review_cards` (INSERT snapshot nếu sai)** | Sinh thẻ trong cùng transaction |
| `GET /students/me/review-list`<br>`findReviewList` | **`review_cards`** | — | Bỏ JOIN `quiz_questions/quizzes/skills`; trả `cardId` thay `questionId/quizId/quizTitle` |
| `GET /students/me/reviews/due`<br>`findDueReviews` | **`review_cards`** (due: `next_review<=NOW()` OR có attempt pending), LEFT JOIN `spaced_repetition_reviews` (lấy pending attempt) | — | Bỏ `quiz_answers.is_correct=FALSE` (thẻ đã là câu sai), bỏ JOIN questions/quizzes/skills |
| `GET /students/me/reviews/stats`<br>`findReviewStats` | **`review_cards`** (dueCount = COUNT next_review<=NOW(), nextReview = MIN next_review>NOW()), `spaced_repetition_reviews` (reviewedToday) | — | |
| `POST /students/me/reviews/{cardId}/answer`<br>`answerReview` | **`review_cards`** (`findReviewCard` — đổi từ quiz_answers sang review_cards, trả `cardId` + correct/explanation/next_review), `spaced_repetition_reviews` (pending attempt) | `spaced_repetition_reviews` (INSERT attempt rating NULL) | Path param đổi `{questionId}` → `{cardId}` |
| `POST /students/me/reviews/{cardId}/rate`<br>`rateReview` | `spaced_repetition_reviews` (lock attempt, JOIN review_cards để lấy correct/explanation) | `spaced_repetition_reviews` (rating/rated_at/next_review/interval), **`review_cards`** (`updateReviewCardSchedule` — next_review, review_count+1, last_*) | Lock vẫn giữ: `FOR UPDATE OF rr, c` |

Chi tiết repository (method đổi tên/đổi SQL):
- `ReviewCardStateRow`: `answerId, questionId` → `cardId` (+ giữ correctAnswer/explanation/nextReview).
- `ReviewAttemptRow`: `answerId, questionId` → `cardId`; bỏ JOIN `quiz_answers` (lấy review_count từ `review_cards`).
- `findPendingReviewAttempt(studentId, cardId)` — WHERE `rr.card_id = ?`.
- `insertReviewAttempt(cardId, studentId, ...)` — INSERT (card_id, student_id, selected_answer, is_correct).
- `lockReviewAttempt` — SELECT ... FROM spaced_repetition_reviews rr JOIN review_cards c ON c.id = rr.card_id WHERE rr.card_id = ? FOR UPDATE OF rr, c.
- `rateReviewAttempt` — không đổi (UPDATE theo attemptId).
- `updateReviewCardSchedule(cardId, ...)` — UPDATE `review_cards` thay `quiz_answers`.

### 4.3 DTO (`StudentPortalResponses.java`)

- `ReviewItem`: bỏ `quizId`, `quizTitle`; `questionId` → `cardId`.
- `DueReviewItem`: bỏ `quizId`, `quizTitle`; `questionId` → `cardId`.
- `ReviewFeedback`, `ReviewScheduleResponse`, `ReviewStatsResponse`: không đổi.
- `ReviewAnswerRequest` / `ReviewRateRequest`: không đổi (chỉ selectedAnswer / rating + attemptId).

### 4.4 Controller

- `POST /students/me/reviews/{cardId}/answer`, `POST /students/me/reviews/{cardId}/rate` — đổi path param (breaking change nội bộ, FE gọi cùng lúc).
- GET 3 endpoint không đổi.

### 4.5 `module/quiz` — không đổi trong plan này

Xóa quiz làm sau; khi đó cascade `quiz_answers → quiz_questions → quizzes` không còn chạm `review_cards` / `spaced_repetition_reviews` → ôn tập tự động an toàn.

## 5. Frontend

| File | Thay đổi |
|---|---|
| `lib/studentApi.js` | `apiAnswerReview`/`apiRateReview` nhận `cardId` (URL `/reviews/{cardId}/...`); `apiGetReviewList` trả card mới (không quizTitle) |
| `lib/studentModel.js` + test | `normalizeQuestion(item)` đọc snapshot: `content = item.questionText`, optionA..D từ `item.optionA..optionD` (camelCase JSON), `skillName`, `cefrLevel` — bỏ trường hợp từ quiz detail |
| `pages/student/SpacedRepetitionSession.jsx` | Key câu theo `current.cardId`; bỏ badge `quizTitle` (dòng 283); `apiAnswerReview(token, current.cardId, ...)` (dòng 144), `apiRateReview(token, current.cardId, ...)` (dòng 160); dependency effect (dòng 137) |
| `pages/student/StudentExercises.jsx` + nút sidebar (AppShell) | Không đổi (vẫn trỏ `/student/spaced-repetition`) |

## 6. Test

| File | Thay đổi |
|---|---|
| `SpacedRepetitionSchedulerTest` | Không đổi (interval giữ nguyên) |
| `StudentPortalQuizServiceTest` (phần review) | Chuyển expectation từ `quiz_answers.next_review` → `review_cards`; thêm case: "trả lời sai quiz A và quiz B (cùng nội dung) → 1 thẻ", "xóa quiz+question+answer → thẻ + lịch sử review vẫn còn" |
| `StudentPortalServiceTest` (mới nếu chưa có cho review) | `answerReview`: card chưa due → `REVIEW_NOT_DUE`; trả lời đúng → attempt `is_correct=true` + không sinh card mới; pending attempt → trả feedback cũ, không insert trùng |
| `SpacedRepetition` integration (nếu có test DB) | Chạy V24 trên dữ liệu V21: backfill đúng, unique index không vỡ |

## 7. Trạng thái biên / rủi ro (đã chốt)

- **Trùng nội dung 2 quiz** → gộp 1 thẻ (unique key). Ôn đúng nội dung, không cần biết quiz nào.
- **Rescore (phase 2)**: tutor sửa câu + chấm lại → câu "đúng" trên bản mới nhưng học sinh từng sai → thẻ vẫn tồn tại nội dung cũ. Invalidating thẻ khi rescore để plan phase 2 xử lý.
- **Cột thừa trên quiz_answers** giữ lại (không xóa cột trong V24) để không đụng phase 2 đang code.
- **Breaking API nội bộ** `{questionId}` → `{cardId}`: FE + BE đổi cùng 1 PR, không có client ngoài.
- **ORDER BY due**: cũ `next_review NULLS FIRST` (câu chưa có lịch trước) → mới giữ nguyên: pending attempt (rr.id NOT NULL) trước, rồi `next_review NULLS FIRST`, rồi `card_id`.

## 8. Trật tự thực hiện (mỗi bước 1 commit, kiểm tra sau mỗi bước)

1. Migration V24 (create table + alter reviews + backfill) — chạy test schema.
2. Repository: records + 5 method review đổi SQL + `insertReviewCardOnWrong` + bỏ `next_review` khỏi `insertAnswer`.
3. DTO + Controller (path param cardId).
4. Service: `answer()` sinh thẻ; `answerReview`/`rateReview` theo card.
5. Frontend: studentApi + studentModel + SpacedRepetitionSession.
6. Test: sửa + bổ sung theo mục 6.
7. Build + test toàn bộ, commit theo `feat: ...`.

---

## 9. Feature bổ sung (bổ sung sau khi review xong): setting tắt auto + thêm thủ công

> Chốt với user: "có tính năng cài đặt tự động thêm câu sai, học sinh có thể bật/tắt,
> mỗi question học sinh cũng có thể chủ động thêm vào" — giải quyết cả 2 hướng:
> câu đoán bừa đúng mà muốn ôn (thủ công thêm) và câu sai không muốn ôn (tắt auto).

### 9.1 Migration `V25__student_settings.sql`

```sql
CREATE TABLE student_settings (
    student_id        BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    auto_review_wrong BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
Không backfill — chưa có row = mặc định TRUE (hành vi cũ).

### 9.2 Mapping thao tác / bảng (RULE.md)

| Thao tác | Đọc | Viết |
|---|---|---|
| `GET /students/me/review-settings` | `student_settings` | — (null → `autoReviewWrong: true`) |
| `PUT /students/me/review-settings` | `student_settings` | `student_settings` (upsert `ON CONFLICT (student_id)`) |
| `POST /students/me/review-cards` body `{quizId, questionId}` | `quizzes` (guard sở hữu), `quiz_questions` (guard tồn tại), `quiz_answers` (guard **đã trả lời** → không thì `REVIEW_CARD_ANSWER_REQUIRED` 1422), `review_cards` (EXISTS unique key) | `review_cards` (INSERT snapshot, `ON CONFLICT DO NOTHING` → `{cardId, created:false}`, không đụng lịch) |
| `POST /quizzes/{id}/questions/{qid}/answer` (sửa) | + `student_settings`, `review_cards` (EXISTS) | `review_cards` **chỉ khi** `!correct && autoReviewWrong`; response thêm `inReview` |

Repository: `insertReviewCardOnWrong` → `insertReviewCardSnapshot` (dùng chung auto/thủ công),
+ `existsReviewCardForQuestion`, `findAutoReviewWrongSetting`, `upsertReviewSetting`.

Frontend:
- `studentApi`: + `apiGetReviewSettings` / `apiUpdateReviewSettings` / `apiAddReviewCard`.
- `SettingsPage` (tab `student`): + tab **"Ôn tập"** — toggle "Tự động thêm câu trả lời sai" + nút Lưu.
- `ExerciseTaking` panel feedback: `inReview` → label "Đã trong danh sách ôn tập";
  ngược lại → Button outline `BookmarkPlus` "Thêm vào danh sách ôn" (câu đúng lẫn câu sai khi auto tắt).

Test: `answer` auto-off không sinh thẻ; `inReview` đúng; `addReviewCard` (đã trả lời / chưa trả lời / quiz người khác / card đã có → no-op).
