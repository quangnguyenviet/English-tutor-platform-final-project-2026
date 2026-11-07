-- Một SĐT là một phụ huynh. Mọi SĐT quy về dạng 0xxxxxxxxx, số trùng gộp về bản ghi cũ nhất.

-- 1. Quy SĐT về dạng 0xxxxxxxxx
UPDATE parents
SET phone = regexp_replace(regexp_replace(phone, '[^0-9]', '', 'g'), '^84', '0'),
    updated_at = NOW()
WHERE phone !~ '^0[0-9]{9}$';

-- 2. Gộp phụ huynh trùng số về bản ghi cũ nhất
WITH dup AS (
    SELECT id, MIN(id) OVER (PARTITION BY phone) AS keep_id FROM parents
)
UPDATE students s
SET parent_id = dup.keep_id
FROM dup
WHERE s.parent_id = dup.id AND dup.id <> dup.keep_id;

WITH dup AS (
    SELECT id, MIN(id) OVER (PARTITION BY phone) AS keep_id FROM parents
)
UPDATE class_requests cr
SET parent_id = dup.keep_id
FROM dup
WHERE cr.parent_id = dup.id AND dup.id <> dup.keep_id;

DELETE FROM parents p
USING parents older
WHERE older.phone = p.phone AND older.id < p.id;

-- 3. Ràng buộc UNIQUE đã kèm index nên bỏ index cũ
DROP INDEX IF EXISTS idx_parents_phone;
ALTER TABLE parents ADD CONSTRAINT uq_parents_phone UNIQUE (phone);
