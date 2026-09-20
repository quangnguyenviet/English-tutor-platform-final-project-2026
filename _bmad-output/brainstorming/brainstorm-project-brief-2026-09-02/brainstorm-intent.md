# Brainstorming Intent: Tái Định Hình Project Brief Đồ Án Tốt Nghiệp

> **Tên đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition  
> **Phiên brainstorming:** 02/09/2026  
> **Mục tiêu phiên:** Đánh giá & thách thức các giả định trong Project Brief cũ, cắt bỏ các phần dư thừa/tiềm ẩn rủi ro vỡ tiến độ, tinh gọn phạm vi để đảm bảo 100% hoàn thành đúng hạn với chất lượng tối ưu.

---

## 1. Tóm Tắt Các Quyết Định Thay Đổi Phạm Vi (MoSCoW Matrix)

### 🔴 CẮT BỎ (Won't Have — Loại bỏ để bảo vệ tiến độ & ngân sách token):
1. **AI Advisor Chatbot (Trang Phụ huynh):** Cắt bỏ hoàn toàn chatbot hội thoại tự nhiên, loại bỏ hạ tầng SSE streaming token-by-token phức tạp và xử lý session ẩn danh ở Giai đoạn A.
2. **Live Chat Monitor & Takeover Mode (Admin Dashboard):** Cắt bỏ màn hình giám sát chat real-time và nút can thiệp thủ công của Admin.
3. **Student Socratic Chat Assistant (Cổng Học sinh):** Cắt bỏ trợ lý chat gợi mở tư duy khi làm bài. Bài tập sau khi nộp sẽ hiển thị trực tiếp Đáp án đúng + Lời giải thích chi tiết (Explanation) do AI tự động sinh sẵn ở bước Gia sư soạn bài.

---

### 🟢 GIỮ & TỐI ƯU HÓA (Must Have — Phạm vi cốt lõi siêu tinh gọn):

#### A. Trang Phụ huynh & Tìm Gia sư (Parent Portal):
* **Dynamic Smart-Match Questionnaire 3 Bước:** Thay thế chatbot bằng một Wizard khảo sát tương tác 3 bước trực quan:
  * *Bước 1:* Mục tiêu & thông tin học sinh (Lớp, trình độ, mục tiêu học).
  * *Bước 2:* Yêu cầu gia sư (Giới tính, khu vực, học phí, khung giờ rảnh).
  * *Bước 3:* Hệ thống Backend lọc và render danh sách Gia sư phù hợp nhất kèm nút **"Đăng ký học thử 1-Click"**.

#### B. Admin Dashboard:
* **Match Request Management:** Nhận thông tin đăng ký học thử từ Phụ huynh ➔ Duyệt ghép gia sư 1-click.
* **Phê duyệt Phí nhận lớp:** Kiểm tra minh chứng chuyển khoản QR ➔ Phê duyệt trạng thái `PAID`.
* **Quản lý tài khoản & Hệ thống:** Duyệt gia sư, xem báo cáo tổng quan.

#### C. Cổng Gia sư (Tutor Portal) — **Tutor Assistant Dual-Mode**:
Gia sư soạn bài tập cá nhân hóa siêu tốc với **Chế độ Kép (Dual-Mode)**:
* **Option A — Direct AI Generation (Tích hợp AI Trực tiếp - 1 Click):**
  * Gia sư nhập/chat ghi chú kiến thức vừa dạy trong buổi học + chọn độ khó (Dễ/TB/Khó), số câu, dạng bài (Trắc nghiệm, Điền từ, Sửa lỗi sai).
  * Backend gọi API AI (`gpt-4o-mini` / `Gemini Flash`) sinh bài tập kèm Đáp án + Lời giải thích chi tiết trong 3 giây.
  * Gia sư duyệt/chỉnh sửa ➔ Bấm **1-Click Giao bài** sang Cổng Học sinh.
* **Option B — Import Structured File (0 Token Cost):**
  * Gia sư lấy Prompt Template mẫu trên hệ thống ➔ Dán vào ChatGPT / Claude / DeepSeek miễn phí ở ngoài.
  * Tải file kết quả (JSON/Text) lên hệ thống ➔ Hệ thống trích xuất bài tập tự động ➔ Giao bài cho học sinh.

#### D. Cổng Học sinh (Student Portal):
* **Làm bài tập online:** Hỗ trợ các dạng trắc nghiệm, điền từ, sửa lỗi.
* **Chấm điểm & Giải thích tự động:** Hệ thống tự chấm điểm ngay khi nộp bài + Hiển thị ngay Lời giải thích chi tiết cho từng câu từ AI.
* **Báo cáo tiến bộ:** Theo dõi lịch sử làm bài và biểu đồ điểm số.

---

## 2. Chiến Lược Giải Trình Khi Bảo Vệ Đồ Án (Thesis Defense Strategy)

1. **Về giá trị khác biệt của Hệ thống:**
   * Hệ thống mang lại giá trị cốt lõi ở **Quy trình tích hợp tự động khép kín (End-to-End Integrated Workflow)**: *Soạn bài nhanh ➔ Giao 1-click ➔ Chấm điểm tự động ➔ Báo cáo tiến bộ*.
   * Giải quyết hoàn toàn việc gia sư phải copy-paste cồng kềnh nếu chỉ dùng ChatGPT riêng lẻ.

2. **Về bài toán Chi phí API Token:**
   * Sử dụng model thế hệ mới tiết kiệm (`gpt-4o-mini` / `Gemini Flash`) với chi phí cực rẻ (~50–100 VNĐ / bài tập).
   * Chi phí do Trung tâm (Admin) đài thọ từ phí nhận lớp.
   * Áp dụng cơ chế Quota limit theo ngày + Hỗ trợ Option B (Import file từ ChatGPT free) để đảm bảo 0% rủi ro lãng phí token.

---

## 3. Bước Tiếp Theo Trong Hệ Thống BMad

File Intent này sẵn sàng làm đầu vào cho các bước tiếp theo:
* Cập nhật **Product Brief** (`bmad-product-brief` / `bmad-prd`).
* Chuyển tiếp sang thiết kế SPEC kỹ thuật (`bmad-spec`) hoặc Kiến trúc CSDL & API (`bmad-architecture`).
