-- =============================================================================
-- V4: Thêm cột submitted_at vào bảng tutors
-- Lý do: updated_at được khai báo insertable=false, updatable=false nên không
--        thay đổi khi cập nhật hồ sơ. Cần một mốc thời gian riêng cho thời điểm
--        gia sư gửi duyệt để lễ tân/admin xếp hàng duyệt.
-- =============================================================================

ALTER TABLE tutors ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ;

-- Backfill: hồ sơ đang chờ duyệt từ trước khi thêm cột sẽ lấy updated_at
-- (giá trị thời điểm tạo/đăng ký) làm mốc gửi duyệt tạm thời.
UPDATE tutors
SET submitted_at = updated_at
WHERE submitted_at IS NULL
  AND profile_status = 'PENDING';

CREATE INDEX IF NOT EXISTS idx_tutors_pending ON tutors(profile_status, submitted_at);
