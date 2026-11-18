-- Bộ thẻ ôn tập (deck) kiểu Anki: mỗi học sinh nhiều deck, 1 deck mặc định
-- (hệ thống tự tạo, không xóa được) chứa câu sai tự động. Thẻ ôn có thể
-- trùng nội dung giữa các deck — mỗi thẻ một lịch SRS riêng.

CREATE TABLE review_decks (
    id           BIGSERIAL   PRIMARY KEY,
    student_id   BIGINT      NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    name         VARCHAR(60) NOT NULL,
    is_default   BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_review_deck_name UNIQUE (student_id, name)
);

CREATE INDEX idx_review_decks_student ON review_decks(student_id);

-- Deck mặc định cho mọi học sinh hiện có (học sinh sau này do trigger).
INSERT INTO review_decks (student_id, name, is_default)
SELECT s.id, 'Câu sai tự động', TRUE
FROM students s;

-- Học sinh mới (INSERT INTO students khi lễ tân tạo tài khoản) tự có deck mặc định.
CREATE FUNCTION create_default_review_deck() RETURNS trigger AS $$
BEGIN
    INSERT INTO review_decks (student_id, name, is_default)
    VALUES (NEW.id, 'Câu sai tự động', TRUE);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_student_default_review_deck
    AFTER INSERT ON students
    FOR EACH ROW
    EXECUTE FUNCTION create_default_review_deck();

-- Gắn deck vào thẻ: nullable trước, backfill bằng deck mặc định, rồi NOT NULL.
ALTER TABLE review_cards
    ADD COLUMN deck_id BIGINT REFERENCES review_decks(id) ON DELETE CASCADE;

UPDATE review_cards c
SET deck_id = d.id
FROM review_decks d
WHERE d.student_id = c.student_id
  AND d.is_default;

ALTER TABLE review_cards
    ALTER COLUMN deck_id SET NOT NULL;

-- Trùng thẻ theo (học sinh, deck, nội dung): cùng câu được phép nằm nhiều deck.
DROP INDEX uq_review_card_content;
CREATE UNIQUE INDEX uq_review_card_deck
    ON review_cards(student_id, deck_id, question_text, cefr_level);
