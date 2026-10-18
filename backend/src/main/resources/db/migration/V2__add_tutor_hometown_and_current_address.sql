-- =============================================================================
-- V2: Thêm 2 trường mới vào bảng tutors (UC-T01 bổ sung)
--   - hometown VARCHAR(100): quê quán, text tự do
--   - current_address VARCHAR(500): địa chỉ hiện tại (khác serviceAreas là khu vực nhận lớp)
-- Cả 2 đều NULL được vì form cho phép để trống.
-- =============================================================================

ALTER TABLE tutors
    ADD COLUMN hometown        VARCHAR(100),
    ADD COLUMN current_address VARCHAR(500);

-- Index phục vụ filter theo quê quán (VD admin lọc gia sư cùng tỉnh)
CREATE INDEX idx_tutors_hometown ON tutors(hometown);
