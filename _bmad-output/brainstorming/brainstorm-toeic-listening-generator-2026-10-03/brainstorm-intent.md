# Intent Spec: Feature Bài Tập Nghe Tiếng Anh Dạng TOEIC (Listening Exercise Feature)

## 🎯 1. Tổng Quan Mục Tiêu & Định Hướng
Tính năng cho phép **Gia sư chọn 1 hoặc nhiều bài nghe từ Ngân hàng Bài nghe của Trung tâm để gộp thành 1 đề bài tập nghe (Listening Homework) giao cho học sinh**, đồng thời cung cấp giao diện làm bài & xem đáp án mượt mà chuẩn **Lingoland TOEIC** (`toeic.lingolandedu.com`).

---

## 🏗️ 2. Phân Vai Hệ Thống (Role-Based Architecture)

### 👑 A. Admin CMS (Nạp Dữ Liệu Ngân Hàng Bài Nghe)
- **Nhiệm vụ:** Quản trị viên Trung tâm sử dụng trang Admin CMS để đưa các bài nghe chuẩn vào hệ thống.
- **Dữ liệu mỗi bài nghe (Listening Item) bao gồm:**
  1. File Audio âm thanh (`.mp3`/`.wav`)
  2. Hình ảnh đính kèm (Tùy chọn - `.png`/`.jpg` cho dạng mô tả ảnh/sơ đồ)
  3. **Transcript Song Ngữ:** Transcript gốc (Tiếng Anh) + Bản dịch nghĩa (Tiếng Việt)
  4. Bộ câu hỏi trắc nghiệm (MCQ): Câu hỏi, 4 lựa chọn A/B/C/D, Đáp án đúng, Giải thích ngắn (Explanation)
  5. Metadata nhãn: **Chủ đề (Topic)** (Công sở, Giao tiếp, Du lịch, v.v.) & **Dạng bài (Format)**. *(Bỏ nhãn Độ khó)*
- **AI Helper cho Admin:** Khi Admin dán Transcript vào CMS, AI hỗ trợ quét văn bản và **tự động gợi ý nháp bộ câu hỏi MCQ & đáp án**, giúp Admin nạp bài nhanh gấp 10 lần.

### 👩‍🏫 B. Màn Hình Gia Sư (Tutor Interface - Khai Thác & Tạo Bài Tập)
- **Nhiệm vụ:** Gia sư gom bài nghe và giao bài cho học sinh nhanh gọn trong 15-30 giây.
- **Luồng thao tác (Creation & Assignment Flow):**
  1. **Duyệt Kho Bài Nghe:** Gia sư vào Ngân hàng Bài nghe của Trung tâm, lọc theo Chủ đề & Dạng bài.
  2. **Chọn Bài (Select Multiple Items):** Gia sư bấm chọn **1 hoặc NHIỀU bài nghe** (ví dụ: chọn 3 bài nghe khác chủ đề để tạo thành 1 bài tập tuần).
  3. **Đặt Tên & Giao Bài:** Gia sư đặt tên Bài tập (ví dụ: *"Bài tập nghe tuần 3 - Chuyện công sở"*), chọn Học sinh/Lớp học + Cài đặt Hạn nộp (Due Date) → Bấm **"Giao bài tập"**.

### 🎓 C. Trình Phát Bài Nghe Cho Học Sinh (Student Player UX - chuẩn Lingoland)
- **Danh sách Bài nghe trong Bài tập (Playlist Navigation):** Nếu bài tập gồm nhiều bài nghe (ví dụ 3 bài), màn hình hiển thị danh sách các Phần nghe (Passage 1, Passage 2, Passage 3) để học sinh dễ dàng chuyển đổi qua lại.
- **Sticky Audio Control Bar (Thanh Audio cố định):**
  - Luôn ghim ở đầu/cuối màn hình khi cuộn.
  - Nút điều khiển: Play/Pause, tua lùi 5 giây, chọn tốc độ phát (**0.75x, 1.0x, 1.25x, 1.5x**).
- **Màn hình LÀM BÀI (Testing Mode):**
  - Khóa Transcript & Bản dịch trong khi đang làm bài.
  - Giao diện câu hỏi trắc nghiệm A-B-C-D dạng card rõ ràng.
- **Màn hình XEM ĐÁP ÁN (Review Mode - Sau khi nộp bài):**
  - Điểm số tự động + Trạng thái Đúng (Xanh) / Sai (Đỏ).
  - **Hiển thị Transcript Song Ngữ (Anh - Việt):** Cho phép bật/tắt đối chiếu kịch bản bài nghe.
  - **Giải thích chi tiết (Explanation):** Highlight từ vựng/câu thoại chứa từ khóa chốt đáp án đúng.

---

## 🚫 3. Các Quyết Định Đã Loại Bỏ (Out of Scope)
- ❌ **Không dùng AI TTS sinh giọng đọc tự động:** Tránh rủi ro giọng đọc thiếu tự nhiên hoặc sai ngữ điệu. Dùng 100% file âm thanh chuẩn upload từ Admin.
- ❌ **Không mô phỏng từng Part TOEIC 1-4 phức tạp:** Giữ cấu trúc 1 bài nghe tiêu chuẩn đơn giản: `Audio + (Ảnh) + N Câu Hỏi MCQ + Transcript Song Ngữ`.
- ❌ **Không làm tính năng Dictation (Chép chính tả).**
- ❌ **Không làm tính năng Gia sư tự gõ bài thủ công ở MVP:** Tập trung toàn bộ vào Ngân hàng Bài nghe của Trung tâm để mượt mà nhất.
- ❌ **Không dùng nhãn Độ khó (TOEIC 350, 600, 800):** Tránh cảm tính, tập trung phân loại theo Chủ đề & Dạng bài.

---

## 📌 4. Hướng Phát Triển Tiếp Theo (Next Steps)
- Tiến hành tạo SPEC kỹ thuật / PRD (bằng `bmad-spec` hoặc `bmad-prd`) để chuyển giao cho Đội ngũ Lập trình (Developer).
