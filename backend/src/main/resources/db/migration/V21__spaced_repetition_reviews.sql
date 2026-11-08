-- FR-22: phiên ôn tập câu sai theo mô hình lặp lại ngắt quãng.
-- quiz_answers giữ trạng thái hiện tại của thẻ; bảng mới giữ lịch sử từng lượt ôn.

ALTER TABLE quiz_answers
    ADD COLUMN last_reviewed_at TIMESTAMPTZ,
    ADD COLUMN last_rating VARCHAR(10),
    ADD COLUMN review_interval_seconds INTEGER;

ALTER TABLE quiz_answers
    ADD CONSTRAINT chk_quiz_answers_last_rating CHECK (
        last_rating IS NULL OR last_rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY')
    ),
    ADD CONSTRAINT chk_quiz_answers_review_interval CHECK (
        review_interval_seconds IS NULL OR review_interval_seconds > 0
    );

CREATE TABLE spaced_repetition_reviews (
    id               BIGSERIAL   PRIMARY KEY,
    quiz_answer_id   BIGINT      NOT NULL REFERENCES quiz_answers(id) ON DELETE CASCADE,
    student_id       BIGINT      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    question_id      BIGINT      NOT NULL REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer  CHAR(1)     NOT NULL,
    is_correct       BOOLEAN     NOT NULL,
    rating           VARCHAR(10),
    answered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    rated_at         TIMESTAMPTZ,
    next_review      TIMESTAMPTZ,
    interval_seconds INTEGER,

    CONSTRAINT chk_spaced_review_selected CHECK (selected_answer IN ('A', 'B', 'C', 'D')),
    CONSTRAINT chk_spaced_review_rating CHECK (
        rating IS NULL OR rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY')
    ),
    CONSTRAINT chk_spaced_review_interval CHECK (
        interval_seconds IS NULL OR interval_seconds > 0
    ),
    CONSTRAINT chk_spaced_review_rated_state CHECK (
        (rating IS NULL AND rated_at IS NULL AND next_review IS NULL AND interval_seconds IS NULL)
        OR
        (rating IS NOT NULL AND rated_at IS NOT NULL AND next_review IS NOT NULL AND interval_seconds IS NOT NULL)
    )
);

-- Một học sinh chỉ có tối đa một lượt đã trả lời nhưng chưa tự đánh giá cho mỗi câu.
CREATE UNIQUE INDEX uq_spaced_review_pending
    ON spaced_repetition_reviews(student_id, question_id)
    WHERE rating IS NULL;

CREATE INDEX idx_spaced_review_student_rated
    ON spaced_repetition_reviews(student_id, rated_at DESC);

CREATE INDEX idx_spaced_review_answer
    ON spaced_repetition_reviews(quiz_answer_id, answered_at DESC);

-- Câu sai lịch sử chưa có lịch được đưa vào hàng đợi ngay sau migration.
UPDATE quiz_answers
SET next_review = COALESCE(answered_at, NOW())
WHERE is_correct = FALSE
  AND next_review IS NULL;

