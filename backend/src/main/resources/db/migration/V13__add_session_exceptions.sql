-- =============================================================================
-- V13: session_exceptions — tầng overlay cho ô ảo (lần diễn) của lịch cố định.
--
-- Mỗi ca (class_schedules) x từng ngày trong khoảng hiệu lực là 1 ô ảo;
-- bảng này ghi ngoại lệ cho MỘT lần diễn cụ thể mà không tạo session thật:
--   CANCELLED   : ẩn lần diễn ("Đã hủy")
--   RESCHEDULED : dời lần diễn sang new_date + giờ mới
--   MODIFIED    : override chi tiết (hình thức / link / địa chỉ), giờ giữ nguyên
--
-- Mỗi (schedule_id, exception_date) tối đa 1 ngoại lệ (uq_session_exceptions,
-- ghi đè bằng INSERT ... ON CONFLICT DO UPDATE — idempotent).
--
-- schedule_id ON DELETE CASCADE: xóa ca cố định (ghi đè lịch) tự dọn ngoại lệ
-- của ca đó — nhất quán với nguyên tắc "session ngoài khoảng hiệu lực không
-- tồn tại" của fixed-schedule.
-- =============================================================================

CREATE TABLE session_exceptions (
    id                 BIGSERIAL PRIMARY KEY,
    class_id           BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    schedule_id        BIGINT NOT NULL REFERENCES class_schedules(id) ON DELETE CASCADE,
    exception_date     DATE NOT NULL,
    exception_type     VARCHAR(20) NOT NULL,
    new_date           DATE,
    new_start_time     TIME,
    new_end_time       TIME,
    new_teaching_mode  VARCHAR(20),
    new_meeting_url    VARCHAR(500),
    new_location       VARCHAR(500),
    reason             TEXT,
    created_by         BIGINT REFERENCES users(id),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_session_exceptions UNIQUE (schedule_id, exception_date),
    CONSTRAINT chk_session_exception_type CHECK (
        exception_type IN ('CANCELLED', 'RESCHEDULED', 'MODIFIED')
    )
);

-- Query lattice tuần: ca của lớp trong khoảng ngày (mục 2 kế hoạch class-sessions).
CREATE INDEX idx_session_exceptions_class_date
    ON session_exceptions(class_id, exception_date);
