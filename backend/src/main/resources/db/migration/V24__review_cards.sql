-- FR-22 (refactor): chuyển thẻ ôn tập sang bảng snapshot review_cards.
-- Nội dung câu hỏi được đóng băng tại thời điểm học sinh trả lời sai,
-- giúp ôn tập độc lập với vòng đời quiz (xóa/sửa quiz không chạm ôn tập).

CREATE TABLE review_cards (
    id                     BIGSERIAL   PRIMARY KEY,
    student_id             BIGINT      NOT NULL REFERENCES students(id) ON DELETE CASCADE,

    -- Snapshot nội dung câu hỏi (không join quiz_questions/quizzes/skills nữa)
    question_text          TEXT        NOT NULL,
    option_a               VARCHAR(500) NOT NULL,
    option_b               VARCHAR(500) NOT NULL,
    option_c               VARCHAR(500) NOT NULL,
    option_d               VARCHAR(500) NOT NULL,
    correct_answer         CHAR(1)     NOT NULL,
    explanation            TEXT,
    skill_name             VARCHAR(100),
    cefr_level             VARCHAR(10),

    -- Trạng thái thẻ ôn tập (rút từ quiz_answers)
    next_review            TIMESTAMPTZ,
    review_count           SMALLINT    NOT NULL DEFAULT 0,
    last_reviewed_at       TIMESTAMPTZ,
    last_rating            VARCHAR(10),
    review_interval_seconds INTEGER,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_review_card_rating CHECK (
        last_rating IS NULL OR last_rating IN ('AGAIN', 'HARD', 'GOOD', 'EASY')
    ),
    CONSTRAINT chk_review_card_interval CHECK (
        review_interval_seconds IS NULL OR review_interval_seconds > 0
    ),
    CONSTRAINT chk_review_card_review_count CHECK (review_count >= 0)
);

-- Cùng học sinh + cùng nội dung câu (kể cả từ 2 quiz khác nhau) chỉ có một thẻ.
CREATE UNIQUE INDEX uq_review_card_content
    ON review_cards(student_id, question_text, cefr_level);

CREATE INDEX idx_review_card_due
    ON review_cards(student_id, next_review) WHERE next_review IS NOT NULL;

-- Backfill: câu sai lịch sử trong quiz_answers (đã có next_review từ V21)
-- trở thành thẻ. Trùng nội dung thì lấy thẻ có next_review sớm nhất (NULL là sau cùng).
INSERT INTO review_cards (
    student_id, question_text, option_a, option_b, option_c, option_d,
    correct_answer, explanation, skill_name, cefr_level,
    next_review, review_count, last_reviewed_at, last_rating, review_interval_seconds
)
SELECT DISTINCT ON (a.student_id, qq.question_text, qq.cefr_level)
    a.student_id,
    qq.question_text,
    qq.option_a, qq.option_b, qq.option_c, qq.option_d,
    qq.correct_answer,
    qq.explanation,
    sk.skill_name,
    qq.cefr_level,
    a.next_review,
    a.review_count,
    a.last_reviewed_at,
    a.last_rating,
    a.review_interval_seconds
FROM quiz_answers a
JOIN quiz_questions qq ON qq.id = a.question_id
LEFT JOIN skills sk ON sk.id = qq.skill_id
WHERE a.is_correct = FALSE
ORDER BY a.student_id, qq.question_text, qq.cefr_level,
         a.next_review NULLS LAST;

-- Lịch sử ôn tập chuyển trỏ sang thẻ; bỏ liên kết quiz_answer_id/question_id.
ALTER TABLE spaced_repetition_reviews
    ADD COLUMN card_id BIGINT;

UPDATE spaced_repetition_reviews rr
SET card_id = c.id
FROM quiz_answers a
JOIN quiz_questions qq ON qq.id = a.question_id
JOIN review_cards c
       ON c.student_id = a.student_id
      AND c.question_text = qq.question_text
      AND c.cefr_level = qq.cefr_level
WHERE a.id = rr.quiz_answer_id;

ALTER TABLE spaced_repetition_reviews
    ALTER COLUMN card_id SET NOT NULL,
    ADD CONSTRAINT fk_review_review_card
        FOREIGN KEY (card_id) REFERENCES review_cards(id) ON DELETE CASCADE,
    DROP COLUMN quiz_answer_id,
    DROP COLUMN question_id;

-- Index pending cũ (student_id, question_id) tự bị xóa theo DROP COLUMN question_id bên trên;
-- IF EXISTS giữ migration chạy được trên mọi trạng thái.
DROP INDEX IF EXISTS uq_spaced_review_pending;

CREATE UNIQUE INDEX uq_spaced_review_pending
    ON spaced_repetition_reviews(student_id, card_id)
    WHERE rating IS NULL;
