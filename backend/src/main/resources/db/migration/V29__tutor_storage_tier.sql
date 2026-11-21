-- V29: Quota lưu trữ tài liệu buổi học theo gói thuê bao gia sư (FREE / PRO / PREMIUM).
--
-- Thiết kế "catalog + fact" (chốt với user, chuẩn production):
--   * storage_tiers = CATALOG 3 gói (quota là DỮ LIỆU trong DB, không hardcode trong code)
--     — sửa quota được; sẵn sàng thêm cột giá khi làm billing thật.
--   * tutors.storage_tier_id (FK) + storage_tier_expires_at = gói HIỆN HÀNH (fast read cho
--     quota gate). Gói trả phí (is_paid) qua expires_at → tự hạ về gói mặc định (FREE)
--     tại thời điểm upload/widget kế tiếp, không cần scheduled job.
--   * tutor_storage_subscriptions = LỊCH SỬ các lần mua/gia hạn (1 dòng/lần, FK tier_id
--     trỏ catalog), chuẩn bị sẵn cho online billing về sau.
-- Quota = SUM(lesson_materials.file_size) qua lessons.class_id -> classes.tutor_id.
-- Mặc định FREE: DEFAULT 1 (id của hàng FREE seed dưới) tự backfill mọi tutors có sẵn.

-- 1. Catalog gói (seed id 1/2/3 cố định để DEFAULT 1 của tutors luôn trỏ FREE).
CREATE TABLE storage_tiers (
    id          BIGSERIAL   PRIMARY KEY,
    code        VARCHAR(10) NOT NULL UNIQUE,
    name        VARCHAR(50) NOT NULL,
    quota_bytes BIGINT      NOT NULL CHECK (quota_bytes >= 0),
    is_default  BOOLEAN     NOT NULL DEFAULT FALSE,
    is_paid     BOOLEAN     NOT NULL DEFAULT FALSE
);

INSERT INTO storage_tiers (id, code, name, quota_bytes, is_default, is_paid) VALUES
    (1, 'FREE',    'Miễn phí', 1073741824,  TRUE,  FALSE),  -- 1 GB
    (2, 'PRO',     'Pro',      10737418240, FALSE, TRUE),   -- 10 GB
    (3, 'PREMIUM', 'Premium',  53687091200, FALSE, TRUE);   -- 50 GB
SELECT setval('storage_tiers_id_seq', (SELECT MAX(id) FROM storage_tiers));

-- 2. Gói hiện hành trên tutors (fast read cho quota gate) + hạn gói trả phí.
ALTER TABLE tutors
    ADD COLUMN storage_tier_id BIGINT NOT NULL DEFAULT 1 REFERENCES storage_tiers(id),
    ADD COLUMN storage_tier_expires_at TIMESTAMPTZ NULL;

-- 3. Lịch sử các lần cấp/gia hạn gói (tutor không có dòng nào = FREE mặc định).
CREATE TABLE tutor_storage_subscriptions (
    id              BIGSERIAL    PRIMARY KEY,
    tutor_id        BIGINT       NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    tier_id         BIGINT       NOT NULL REFERENCES storage_tiers(id),
    duration_months SMALLINT,
    granted_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ,
    granted_by      BIGINT       REFERENCES users(id),

    CONSTRAINT chk_tutor_storage_subscriptions_duration
        CHECK (duration_months IS NULL OR duration_months IN (1, 3, 12))
);

CREATE INDEX idx_tutor_storage_subscriptions_tutor_id ON tutor_storage_subscriptions(tutor_id);
