-- =============================================================================
-- V10: Mở rộng bảng class_requests / class_applications / tutors
-- 1. class_requests: thêm sessions_per_week (số buổi/tuần) và fee_percentage
--    (tỷ lệ phí nhận lớp, DEFAULT 40, cho phép 0-50 theo V9 của payments)
--    để lễ tân hoàn thiện đơn đủ thông tin tính phí trước khi ghép lớp;
--    thêm trạng thái REMATCH (ghép lại gia sư khác sau khi dạy thử thất bại).
-- 2. class_applications: cho phép trạng thái TERMINATED (gia sư được chọn,
--    dạy thử không thành công, loại khỏi danh sách ứng viên).
-- 3. tutors: thêm is_open_to_teaching — chỉ gia sư đang mở mới thấy và
--    ứng tuyển đơn ghép lớp (OPEN); gia sư đang dạy vẫn giữ các lớp hiện có.
-- =============================================================================

-- 1. class_requests: số buổi/tuần + tỷ lệ phí nhận lớp
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS sessions_per_week SMALLINT;
ALTER TABLE class_requests ADD COLUMN IF NOT EXISTS fee_percentage DECIMAL(5,2) NOT NULL DEFAULT 40;

ALTER TABLE class_requests
    DROP CONSTRAINT IF EXISTS chk_class_requests_sessions_per_week;
ALTER TABLE class_requests
    DROP CONSTRAINT IF EXISTS chk_class_requests_fee_percentage;
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_sessions_per_week
    CHECK (sessions_per_week IS NULL OR sessions_per_week > 0);
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_fee_percentage
    CHECK (fee_percentage BETWEEN 0 AND 50);

-- 1b. class_requests: thêm trạng thái REMATCH (nới constraint trạng thái)
ALTER TABLE class_requests
    DROP CONSTRAINT IF EXISTS chk_class_requests_status;
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_status CHECK (
    status IN ('NEW', 'OPEN', 'MATCHED', 'REMATCH', 'CANCELLED')
);

-- 2. class_applications: thêm trạng thái TERMINATED
ALTER TABLE class_applications
    DROP CONSTRAINT IF EXISTS chk_class_applications_status;
ALTER TABLE class_applications ADD CONSTRAINT chk_class_applications_status CHECK (
    status IN ('APPLIED', 'SELECTED', 'REJECTED', 'TERMINATED')
);

-- 3. tutors: cờ mở sẵn sàng nhận lớp (mặc định TRUE để không ảnh hưởng GS hiện có)
ALTER TABLE tutors ADD COLUMN IF NOT EXISTS is_open_to_teaching BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_tutors_open_teaching
    ON tutors(is_open_to_teaching) WHERE is_open_to_teaching = TRUE;
