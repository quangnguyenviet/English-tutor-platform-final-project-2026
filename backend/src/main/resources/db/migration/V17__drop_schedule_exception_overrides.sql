-- =============================================================================
-- V17: Bỏ 3 cột override chi tiết của schedule_exceptions
-- (new_teaching_mode, new_meeting_url, new_location) + thu hẹp CHECK loại ngoại lệ.
--
-- Cột MODIFIED (override hình thức / link / địa chỉ, giờ giữ nguyên ca gốc) đã
-- được gỡ khỏi code; 3 cột này là phần schema còn sót. CANCELLED / RESCHEDULED
-- không dùng chúng: RESCHEDULED chỉ thay ngày + khung giờ mới, hình thức / link
-- / địa chỉ giữ theo ca gốc của lớp.
--
-- DEV reset (đề án sinh viên): không backfill, 3 cột thuần túy drop.
-- =============================================================================

ALTER TABLE schedule_exceptions
    DROP COLUMN new_teaching_mode,
    DROP COLUMN new_meeting_url,
    DROP COLUMN new_location;

-- MODIFIED không còn ý nghĩa (đã mất các cột override) -> thu hẹp CHECK lại
-- đúng 2 loại đang dùng trong code (CANCELLED | RESCHEDULED).
ALTER TABLE schedule_exceptions
    DROP CONSTRAINT chk_schedule_exception_type;
ALTER TABLE schedule_exceptions
    ADD CONSTRAINT chk_schedule_exception_type CHECK (
        exception_type IN ('CANCELLED', 'RESCHEDULED')
    );
