# Tóm tắt Định hướng Thiết kế Tính năng AI Sinh bài tập (Coursera-style)

## 1. Định vị & Ngữ cảnh Sư phạm
- **SKP (Student Knowledge Profile)**: Đóng vai trò là **Background Context** (Trình độ chung, phong cách học, độ khó phù hợp). SKP **không** bắt buộc phải xoáy vào điểm yếu cho mọi loại bài tập.
- **Phân định 2 phạm vi giao bài**:
  1. **Bài tập theo Bài học (Lesson Homework)**: Lấy mục tiêu & nội dung bài học làm ngữ cảnh chính. Bài tập bám sát kiến thức bài đó.
  2. **Bài tập Ôn tập / Kiểm tra (Chapter Review / Assessment)**: Lấy SKP (lỗ hổng kiến thức, micro-skills thấp, error patterns) làm ngữ cảnh chính để xoáy sâu vào điểm yếu & ôn tập ngắt quãng.

## 2. Luồng UX & Bố cục Giao diện (Lesson-bound Split Screen - Coursera Style)

### Luồng tương tác:
`Khung chương trình (Curriculum)` ➔ `Chi tiết Bài học (Lesson Detail)` ➔ `Bấm nút "Tạo bài tập với AI"` ➔ `Chuyển sang Màn hình Workspace riêng biệt`.

### Bố cục Màn hình Workspace (Split-Screen):
- **Cột TRÁI (Main Canvas - 65% màn hình)**:
  - Hiển thị danh sách câu hỏi / bài tập dạng thẻ trực quan.
  - Cho phép **Sửa tay trực tiếp (Inline Editing)** trên văn bản (câu hỏi, phương án A/B/C/D, Lời giải thích AI).
  - Tự động cập nhật trực quan (Live Update) khi AI sinh hoặc chỉnh sửa câu hỏi.
- **Cột PHẢI (Right Assistance Dock - 35% màn hình)** với **2 Tabs**:
  - **TAB 1: Form / Content (Cấu hình & Tạo ban đầu)**:
    - Yêu cầu trọng tâm bài tập.
    - **Tài liệu đính kèm**: Tự động Auto-load các tài liệu có sẵn trong Lesson (ví dụ `Lesson_Material.pdf`), có nút **`(X)`** để gỡ bỏ đính kèm nếu không muốn dùng làm context.
    - Tùy chọn số lượng câu, dạng bài, độ khó.
    - Nút `⚡ Sinh bài tập với AI` + Tùy chọn `Import File (0 Token Cost)`.
  - **TAB 2: Chat Freestyle (AI Co-pilot Tinh chỉnh)**:
    - Khung chat ngôn ngữ tự nhiên với AI Co-pilot.
    - Gia sư chat yêu cầu AI chỉnh sửa câu hỏi, đổi dạng câu, tăng/giảm độ khó...
    - AI phản hồi trong chat và tự động cập nhật trực tiếp (Live Update) lên Main Canvas bên trái.

## 3. Sinh Metadata & Cập nhật SKP (Pre-generated Metadata by AI)
- **AI sinh sẵn khi tạo bài tập**:
  - Ngay khi gia sư sinh bài tập bằng AI, AI sẽ **sinh sẵn đầy đủ**:
    - Nội dung câu hỏi + các lựa chọn A/B/C/D + Đáp án đúng.
    - **Lời giải thích AI (AI Explanation)**.
    - **Mức độ khó (`difficulty`: 1-100)**.
    - **Thẻ kỹ năng nhỏ (`micro_skill_tags`)**.
  - Các dữ liệu này được lưu cố định vào CSDL trong bảng `questions` khi bài tập được lưu/giao.
- **Nộp bài tập (Zero LLM Overhead on Submission)**:
  - Khi học sinh nộp bài, hệ thống **không gọi LLM**.
  - Backend Spring Boot lấy trực tiếp `difficulty` & `micro_skill_tags` đã lưu sẵn từ CSDL để tính toán công thức **Elo Rating** và cập nhật `mastery_score` vào SKP của học sinh tức thì.
