-- Khiếu nại luôn gắn một lớp cần gia sư. Lớp chưa có gia sư không có bản ghi classes,
-- nên class_id chuyển sang nullable và thêm class_request_id. request_outcome lưu kết quả
-- xử lý lớp (Hủy lớp / Ghép lại) vì trạng thái class_requests còn đổi tiếp sau đó.

-- 1. Loại khiếu nại: REMATCH cũ gộp vào NON_REFUND
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS chk_complaints_type;
UPDATE complaints SET complaint_type = 'NON_REFUND' WHERE complaint_type = 'REMATCH';
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_type
    CHECK (complaint_type IN ('REFUND', 'NON_REFUND'));

-- 2. Lớp cần gia sư bị khiếu nại và kết quả xử lý
ALTER TABLE complaints
    ADD COLUMN class_request_id BIGINT REFERENCES class_requests(id),
    ADD COLUMN request_outcome  VARCHAR(20);

UPDATE complaints c
SET class_request_id = cl.class_request_id
FROM classes cl
WHERE cl.id = c.class_id;

ALTER TABLE complaints
    ALTER COLUMN class_request_id SET NOT NULL,
    ALTER COLUMN class_id DROP NOT NULL;

-- 3. Ràng buộc (ERD C-17)
ALTER TABLE complaints ADD CONSTRAINT chk_complaints_refund_class
    CHECK (complaint_type <> 'REFUND' OR class_id IS NOT NULL);

ALTER TABLE complaints ADD CONSTRAINT chk_complaints_outcome CHECK (
    request_outcome IS NULL
    OR (request_outcome IN ('REMATCH', 'CANCELLED')
        AND complaint_type = 'NON_REFUND'
        AND status = 'RESOLVED')
);

CREATE INDEX idx_complaints_class_request_id ON complaints(class_request_id);
