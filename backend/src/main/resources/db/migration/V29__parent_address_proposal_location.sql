-- Phụ huynh phải có địa chỉ mặc định (cột parents.address đã có từ V5) trước khi nhắn tin;
-- đề xuất lớp học offline (AT_HOME) chốt địa chỉ học theo địa chỉ này tại thời điểm gia sư tạo đề xuất.
ALTER TABLE proposal_messages
    ADD COLUMN learning_address VARCHAR(500);
