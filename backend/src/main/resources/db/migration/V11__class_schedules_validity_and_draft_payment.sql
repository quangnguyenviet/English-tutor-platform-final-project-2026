-- =============================================================================
-- V11: class_schedules bổ sung valid_from / valid_to (ERD v2.5) +
--      classes.sessions_per_week (dùng cho tính phí) +
--      payments cho phép trạng thái NEW / CANCELLED, amount NULL khi NEW
--
-- 1. class_schedules: khoảng hiệu lực TỪNG CA (valid_from DATE NOT NULL,
--    valid_to DATE NULL = không giới hạn) — FE render lịch và kiểm tra
--    session on-demand theo khoảng hiệu lực, thay thế vai trò render của
--    classes.active_from (trường này chỉ còn ghi nhận ngày kích hoạt lớp).
--    Dữ liệu cũ: backfill valid_from từ classes.active_from (fallback hôm nay).
-- 2. classes: sessions_per_week (SMALLINT) — số buổi/tuần do lễ tân quyết định
--    cho lớp cụ thể, nguồn duy nhất tính phí nhận lớp
--    (fee_percentage × sessions_per_week × 4 × price_per_session).
-- 3. sessions: unique index (class_id, session_date, start_time) cho
--    session chính thức (is_trial = FALSE) — tạo buổi on-demand idempotent,
--    bấm "Tạo buổi học" 2 lần cùng ca không nhân đôi session.
-- 4. payments: nới constraint status thêm NEW (đơn phí tạo khi ghép lớp TRIAL,
--    snapshot fee_percentage + price_per_session, amount = NULL) và
--    CANCELLED (lớp TRIAL bị hủy / đơn REMATCH); amount chuyển nullable
--    (CHỈ NOT NULL khi status != NEW — enforced ở backend, C-13).
-- =============================================================================

-- 1. class_schedules: khoảng hiệu lực từng ca
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS valid_from DATE;
ALTER TABLE class_schedules ADD COLUMN IF NOT EXISTS valid_to   DATE;

-- Backfill dữ liệu cũ TRƯỚC khi set NOT NULL:
-- lấy từ classes.active_from (ngày kích hoạt lớp), fallback hôm nay.
UPDATE class_schedules
SET valid_from = COALESCE(c.active_from, CURRENT_DATE)
FROM classes c
WHERE c.id = class_schedules.class_id
  AND class_schedules.valid_from IS NULL;

ALTER TABLE class_schedules ALTER COLUMN valid_from SET NOT NULL;

ALTER TABLE class_schedules
    DROP CONSTRAINT IF EXISTS chk_class_schedules_valid_range;
ALTER TABLE class_schedules ADD CONSTRAINT chk_class_schedules_valid_range
    CHECK (valid_to IS NULL OR valid_to >= valid_from);

-- 2. classes: số buổi/tuần dùng cho tính phí (do lễ tân quyết định cho lớp)
ALTER TABLE classes ADD COLUMN IF NOT EXISTS sessions_per_week SMALLINT;
ALTER TABLE classes
    DROP CONSTRAINT IF EXISTS chk_classes_sessions_per_week;
ALTER TABLE classes ADD CONSTRAINT chk_classes_sessions_per_week
    CHECK (sessions_per_week IS NULL OR sessions_per_week > 0);

-- 3. sessions: unique index phục vụ create-on-demand idempotent (chỉ buổi chính thức)
CREATE UNIQUE INDEX IF NOT EXISTS uq_sessions_class_date_start
    ON sessions (class_id, session_date, start_time)
    WHERE is_trial = FALSE;

-- 4. payments: trạng thái NEW / CANCELLED + amount nullable khi NEW
ALTER TABLE payments DROP CONSTRAINT chk_payments_status;
ALTER TABLE payments ADD CONSTRAINT chk_payments_status CHECK (
    status IN ('NEW', 'NOT_SUBMITTED', 'SUBMITTED', 'APPROVED',
               'RESUBMIT_REQUIRED', 'CANCELLED')
);

ALTER TABLE payments DROP CONSTRAINT chk_payments_amount;
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (
    amount IS NULL OR amount >= 0
);
