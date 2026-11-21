-- V29: Gói lưu trữ tài liệu buổi học theo thuê bao gia sư (FREE / PRO / PREMIUM).
--
-- Thiết kế (mô hình subscription + tự hạ FREE khi hết hạn):
--   * tutors.storage_tier + tutors.storage_tier_expires_at = gói HIỆN HÀNH
--     (source of truth cho quota gate: gói trả phí qua expires_at → tự hạ về FREE
--     tại thời điểm upload/widget kế tiếp, không cần scheduled job).
--   * tutor_storage_subscriptions = LỊCH SỬ các lần mua/gia hạn gói (mỗi hành 1 lần
--     lễ tân gán), chuẩn bị sẵn cho nối online billing về sau (số hóa từng chu kỳ).
-- Quota = SUM(lesson_materials.file_size) qua lessons.class_id -> classes.tutor_id.
-- Mặc định FREE: DEFAULT tự backfill mọi hàng có sẵn.

ALTER TABLE tutors
    ADD COLUMN storage_tier VARCHAR(10) NOT NULL DEFAULT 'FREE',
    ADD COLUMN storage_tier_expires_at TIMESTAMPTZ NULL;

ALTER TABLE tutors
    ADD CONSTRAINT chk_tutors_storage_tier CHECK (storage_tier IN ('FREE', 'PRO', 'PREMIUM'));

CREATE TABLE tutor_storage_subscriptions (
    id             BIGSERIAL    PRIMARY KEY,
    tutor_id       BIGINT       NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    tier           VARCHAR(10)  NOT NULL,
    duration_months SMALLINT    NOT NULL,
    granted_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at     TIMESTAMPTZ  NOT NULL,
    granted_by     BIGINT       REFERENCES users(id),

    CONSTRAINT chk_tutor_storage_subs_tier CHECK (tier IN ('FREE', 'PRO', 'PREMIUM')),
    CONSTRAINT chk_tutor_storage_subs_duration CHECK (duration_months IN (1, 3, 12))
);

CREATE INDEX idx_tutor_storage_subscriptions_tutor_id ON tutor_storage_subscriptions(tutor_id);
