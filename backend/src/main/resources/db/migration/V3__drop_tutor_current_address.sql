-- =============================================================================
-- V3: Bỏ cột current_address khỏi bảng tutors
-- Lý do: Chỉ cần giữ address, không cần current_address riêng
-- =============================================================================

ALTER TABLE tutors DROP COLUMN IF EXISTS current_address;
