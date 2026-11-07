-- Gộp Đơn ghép lớp vào Lớp cần gia sư: tài khoản học sinh chỉ được tạo khi vào dạy thử,
-- nên lớp đang đăng tuyển (OPEN) có thể chưa có student_id, thông tin học sinh nằm ở class_requests.student_*.
ALTER TABLE class_requests DROP CONSTRAINT IF EXISTS chk_class_requests_ready;
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_ready CHECK (
    (status IN ('NEW', 'CANCELLED') OR class_requirement IS NOT NULL)
    AND (status IN ('NEW', 'OPEN', 'CANCELLED') OR student_id IS NOT NULL)
);
