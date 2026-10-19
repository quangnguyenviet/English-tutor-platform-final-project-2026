-- V3: Bỏ trường current_address khỏi bảng tutors (không còn dùng)
ALTER TABLE tutors DROP COLUMN IF EXISTS current_address;
