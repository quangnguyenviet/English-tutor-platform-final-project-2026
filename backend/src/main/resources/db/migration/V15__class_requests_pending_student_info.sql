-- Thông tin học sinh lễ tân nhập khi đơn ghép lớp (phụ huynh không có tài khoản, đăng ký gia sư chỉ định)
-- còn ở trạng thái NEW: học sinh chưa có tài khoản nên chưa có dòng users/students để lưu.
-- Khi chuyển sang dạy thử, hệ thống tạo tài khoản học sinh từ các cột này.
ALTER TABLE class_requests
    ADD COLUMN IF NOT EXISTS student_name          VARCHAR(100),
    ADD COLUMN IF NOT EXISTS student_grade         VARCHAR(20),
    ADD COLUMN IF NOT EXISTS student_school        VARCHAR(200),
    ADD COLUMN IF NOT EXISTS student_learning_goal TEXT;
