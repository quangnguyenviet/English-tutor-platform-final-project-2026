-- V31: Bảng trial_reports — báo cáo kết quả dạy thử của gia sư
-- Không unique constraint (cho phép nộp lại nhiều lần; "báo cáo mới nhất" = ORDER BY created_at DESC, id DESC LIMIT 1)

CREATE TABLE trial_reports (
    id          BIGSERIAL PRIMARY KEY,
    class_id    BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    reported_by BIGINT NOT NULL REFERENCES users(id),
    outcome     VARCHAR(10) NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trial_reports_outcome CHECK (outcome IN ('SUCCESS','FAILED')),
    CONSTRAINT chk_trial_reports_failed_note CHECK (outcome <> 'FAILED' OR note IS NOT NULL)
);

CREATE INDEX idx_trial_reports_class_created ON trial_reports(class_id, created_at DESC);
