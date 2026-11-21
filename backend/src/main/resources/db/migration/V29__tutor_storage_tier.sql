-- V29: Gói lưu trữ tài liệu buổi học theo gói thuê bao gia sư (FREE / PRO / PREMIUM).
-- Quota được tính bằng SUM(lesson_materials.file_size) qua lessons.class_id -> classes.tutor_id.
-- storage_tier_expires_at = thời điểm gói trả phí (PRO/PREMIUM) hết hạn; NULL = gói FREE (vô thời hạn).
-- Gói trả phí qua hạn sẽ bị hạ về FREE khi kiểm tra upload kế tiếp (không cần scheduled job).
-- Mặc định FREE: DEFAULT tự backfill mọi hàng có sẵn.
ALTER TABLE tutors
    ADD COLUMN storage_tier VARCHAR(10) NOT NULL DEFAULT 'FREE',
    ADD COLUMN storage_tier_expires_at TIMESTAMPTZ NULL;

ALTER TABLE tutors
    ADD CONSTRAINT chk_tutors_storage_tier CHECK (storage_tier IN ('FREE', 'PRO', 'PREMIUM'));
