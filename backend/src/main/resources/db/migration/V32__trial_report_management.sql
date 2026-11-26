-- V32: Quản lý lớp dạy thử không thành công (trial_report_management)
-- 1) Mở rộng classes.status thêm TRIAL_FAIL
-- 2) Bảng trial_report_tasks — việc vận hành xử lý report FAILED
-- 3) Bảng trial_report_task_histories — lịch sử thao tác trên task
-- 4) Một lớp tối đa một report chính thức (đóng lại "báo cáo một lần")

ALTER TABLE classes DROP CONSTRAINT IF EXISTS chk_classes_status;
ALTER TABLE classes ADD CONSTRAINT chk_classes_status
    CHECK (status IN ('TRIAL', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'TRIAL_FAIL'));

CREATE TABLE trial_report_tasks (
    id              BIGSERIAL PRIMARY KEY,
    trial_report_id BIGINT NOT NULL UNIQUE REFERENCES trial_reports(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to     BIGINT REFERENCES users(id),
    resolved_by     BIGINT REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolution      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trial_report_tasks_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED'))
);

CREATE INDEX idx_trial_report_tasks_queue
    ON trial_report_tasks(status, created_at DESC);
CREATE INDEX idx_trial_report_tasks_assigned_to
    ON trial_report_tasks(assigned_to, status);

CREATE TABLE trial_report_task_histories (
    id         BIGSERIAL PRIMARY KEY,
    task_id    BIGINT NOT NULL REFERENCES trial_report_tasks(id) ON DELETE CASCADE,
    actor_id   BIGINT NOT NULL REFERENCES users(id),
    action     VARCHAR(40) NOT NULL,
    details    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trial_report_task_histories_task
    ON trial_report_task_histories(task_id, created_at DESC);

ALTER TABLE trial_reports ADD CONSTRAINT uq_trial_reports_class UNIQUE (class_id);
