-- Cấu hình riêng của học sinh (mở rộng được khi thêm setting mới).
-- Chưa có row = mọi cột dùng giá trị mặc định khai báo (tương đương hành vi cũ).
CREATE TABLE student_settings (
    student_id        BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
    -- Tự động thêm câu trả lời sai vào danh sách ôn tập (review_cards).
    auto_review_wrong BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
