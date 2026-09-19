---
title: Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-30
updated: 2026-09-19
---

# Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Executive Summary

Hệ thống là nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1. Phạm vi sản phẩm được thiết kế tinh gọn, tập trung 100% giá trị đổi mới sáng tạo vào quy trình vận hành và giảng dạy thực tế sau khi nhận lớp (Giai đoạn B).

Sản phẩm kết hợp giữa công nghệ Web hiện đại và Trí tuệ nhân tạo (AI): (A) **Form Tìm Gia Sư & Đăng ký Học thử (Parent Portal)** giúp phụ huynh tra cứu danh sách gia sư, chọn tiêu chí và gửi đăng ký học thử mượt mà; và (B) **Bộ công cụ hỗ trợ giảng dạy tích hợp AI (Trọng tâm cốt lõi)** dành cho Gia sư với **Tutor Assistant Dual-Mode** (Soạn bài tập cá nhân hóa siêu tốc qua Direct AI Generation hoặc Import File từ ChatGPT ngoài) và **Hệ thống chấm điểm tự động kèm Lời giải thích chi tiết AI cho Học sinh**.

## The Problem

Thị trường gia sư tiếng Anh 1-1 hiện tại đang đối mặt với nút thắt lớn nhất nằm ở **quy trình vận hành & giảng dạy thực tế sau khi nhận lớp**:

* **Gia sư**: Phần lớn là sinh viên hoặc giáo viên dạy thêm, tốn nhiều thời gian soạn giáo án và bài tập cá nhân hóa sau mỗi buổi dạy. Việc dùng ChatGPT ngoài yêu cầu nhiều thao tác thủ công rườm rà (copy prompt, định dạng câu hỏi, tạo file, gửi file, chấm tay).
* **Học sinh**: Thiếu động lực và không có lời giải thích ngay khi làm bài tập trực tuyến. Khi làm sai, học sinh không hiểu vì sao sai nếu gia sư không có thời gian sửa chi tiết từng câu.
* **Phụ huynh**: Thiếu thông tin giám sát tiến độ thực tế của con. Các báo cáo từ gia sư thường mang tính cảm tính mà không có số liệu định lượng bài tập rõ ràng.

## The Solution

Sản phẩm cung cấp một giải pháp web tích hợp gồm các thành phần chính hoạt động đồng bộ: Frontend React SPA, Backend Spring Boot và AI Service (Python / LangGraph):

1. **Form Tìm Gia Sư & Đăng ký Học thử (Parent Portal)**:
   * Phụ huynh chọn tiêu chí qua Form tìm gia sư trực quan (Lớp/Mục tiêu học sinh, Yêu cầu gia sư, Khung giờ học).
   * Hệ thống hiển thị danh sách gia sư phù hợp kèm nút **"Đăng ký học thử"** (gửi yêu cầu đăng ký tới Admin mà không cần điền lại thông tin rườm rà).

2. **Trợ lý soạn bài Kép & Quản lý Khung chương trình (Tutor Portal)**:
   * **Quản lý Khung chương trình học (Curriculum Management)**: Gia sư tạo và quản lý khung chương trình học tinh gọn (tối đa 2 cấp: Ví dụ *Chủ đề/Chương ➔ Bài học*), hỗ trợ sinh nháp lộ trình siêu tốc bằng AI hoặc khởi tạo thủ công, giúp xây dựng lộ trình rõ ràng và định hướng nội dung cho bài tập AI.
   * **Option A — Direct AI Generation (Tích hợp AI Trực tiếp)**: Gia sư nhập/chat ghi chú kiến thức vừa dạy (hoặc đính kèm tài liệu) cùng yêu cầu bài tập bằng ngôn ngữ tự nhiên (ví dụ: *"Sinh 10 câu trắc nghiệm ôn tập Thì quá khứ đơn và từ vựng chủ đề Du lịch"*) ➔ AI (`gpt-4o-mini` / `Gemini Flash`) tự động tạo nháp bộ bài tập kèm Đáp án & Lời giải thích chi tiết trong 3-5 giây ➔ Gia sư xem/chỉnh sửa nháp và bấm **"Giao bài"** (hệ thống tự động chuyển bài tập sang Cổng Học sinh tức thì).
   * **Option B — Import Structured File (0 Token Cost)**: Gia sư lấy Prompt Template mẫu trên hệ thống ➔ Dán vào ChatGPT/Claude/DeepSeek miễn phí ở ngoài ➔ Upload file kết quả (JSON/Text) lên hệ thống để trích xuất bài tập tự động.

3. **Trình làm bài tập & Chấm điểm tự động kèm Giải thích AI (Student Portal)**:
   * Phân định rõ 2 loại nội dung do Gia sư giao: **Bài tập về nhà (Luyện tập)** và **Bài kiểm tra định kỳ (Đánh giá)**.
   * Cho phép cấu hình linh hoạt thời điểm xem đáp án & Lời giải thích chi tiết (AI Explanation): **Xem ngay sau khi hoàn thành từng câu** (chế độ luyện tập) hoặc **Xem sau khi nộp toàn bộ bài** (chế độ kiểm tra).
   * Báo cáo tiến bộ phân tách minh bạch: **Chỉ số Chăm chỉ (Homework Completion Rate)** đo đếm ý thức làm bài về nhà, và **Biểu đồ Tiến bộ Năng lực (Assessment Score Trend)** ghi nhận điểm số thực chất từ các bài kiểm tra định kỳ.

4. **Dashboard Quản lý Yêu cầu & Phê duyệt Phí (Admin Dashboard)**:
   * Admin tiếp nhận yêu cầu đăng ký học thử từ Phụ huynh ➔ Gọi điện xác nhận & báo giá ➔ Tạo **Match Offer** gửi tới Cổng Gia sư.
   * Gia sư chấp nhận Offer, nộp Phí nhận lớp qua VietQR và upload ảnh minh chứng biên lai.
   * Admin kiểm tra và bấm "Phê duyệt phí" ➔ Hệ thống tự động **Mở khóa (Unlock) SĐT & Địa chỉ Phụ huynh** trên Cổng Gia sư.
   * Gia sư liên hệ Phụ huynh chốt **Ngày học thử** (cập nhật lên hệ thống) ➔ Sau buổi học thử thành công, Gia sư nhập **Lịch dạy cố định hàng tuần** để hệ thống chính thức kích hoạt lớp học (`ACTIVE`) và sinh Lịch dạy Calendar.
   * Quản lý hồ sơ gia sư và báo cáo tổng quan.

## What Makes This Different

* **Vượt xa mô hình kết nối gia sư truyền thống**: Hệ thống không dừng lại ở bước ghép lớp ban đầu giữa Phụ huynh và Gia sư, mà trực tiếp đóng vai trò là bộ công cụ vận hành & trợ lý giảng dạy AI trong suốt quá trình học. Việc này giúp gia sư nâng cao chất lượng giảng dạy, duy trì tính chuyên nghiệp và gia tăng uy tín bền vững với Phụ huynh.
* **Soạn & Giao bài tập AI siêu tốc cho Gia sư (Tutor Assistant)**: Gia sư dễ dàng tạo bộ bài tập cá nhân hóa chuẩn cấu trúc chỉ trong vài giây (qua Direct AI Generation hoặc Import file ngoài 0 token cost) và giao trực tiếp cho học sinh, loại bỏ hoàn toàn các thao tác thủ công rườm rà (copy-paste, chỉnh sửa file, chấm tay).
* **Luyện tập tiện lợi kèm Giải thích AI tức thì cho Học sinh**: Học sinh làm bài tập trực tuyến tiện lợi, biết ngay kết quả và xem được Lời giải thích chi tiết (AI Explanation) cho từng câu làm sai ngay tại thời điểm luyện tập mà không cần chờ đến buổi học tiếp theo.

## Who This Serves

* **Phụ huynh**: Tìm gia sư và đăng ký học thử nhanh chóng qua Form tìm gia sư tinh gọn, đồng thời dễ dàng theo dõi báo cáo tiến độ định lượng của con.
* **Gia sư**: Soạn và giao bài tập cá nhân hóa siêu tốc trong 1-3 phút trên điện thoại/máy tính, duy trì hình ảnh chuyên nghiệp.
* **Học sinh**: Làm bài tập online tiện lợi, biết ngay điểm số và đọc lời giải thích chi tiết cho từng câu sai.
* **Admin**: Duyệt ghép lớp nhanh chóng, quản lý gia sư và phê duyệt phí nhận lớp minh bạch.

## Success Criteria

*(Ghi chú: Section này tạm thời ghi nhận và sẽ được rà soát, chuẩn hóa thành các chỉ số đo lường/nghiệm thu cụ thể [TBD] sau)*

* **Tốc độ đăng ký học thử**: Phụ huynh hoàn thành Form tìm gia sư và gửi yêu cầu đăng ký học thử dễ dàng, tinh gọn.
* **Thời gian chuẩn bị bài của Gia sư**: Giảm thời gian soạn và giao bài tập cá nhân hóa xuống dưới 3 phút/buổi dạy.
* **Trải nghiệm học tập**: 100% bài tập có đáp án và lời giải thích chi tiết giúp học sinh nắm vững lỗ hổng kiến thức.

## Scope

### Nằm trong phạm vi (In-Scope):
* Trang Phụ huynh: Landing Page, Form Tìm Gia Sư & Đăng ký Học thử, Nút Đăng ký học thử.
* Cổng Admin: Quản lý hồ sơ gia sư, Quản lý yêu cầu ghép lớp (Match Request Management), Phê duyệt phí nhận lớp (QR proof upload).
* Cổng Gia sư: Quản lý lớp, Quản lý khung chương trình học tinh gọn (Syllabus/Topics - tối đa 2 cấp: Chủ đề/Chương ➔ Bài học), Lịch dạy, **Tutor Assistant Dual-Mode** (Direct AI Generation + Import Structured File), Giao bài tức thì.
* Cổng Học sinh: Làm bài tập online (Trắc nghiệm, Điền từ, Sửa lỗi), Chấm điểm tự động, Xem lời giải thích chi tiết AI từng câu, Báo cáo tiến độ.
* Hạ tầng Backend & Auth: Phân quyền Spring Boot theo `Enrollment`, Docker deployment.

### Nằm ngoài phạm vi (Out-of-Scope):
* Không hỗ trợ khung chương trình học đa cấp phức tạp >2 cấp (chỉ thiết kế tinh gọn tối đa 2 cấp: Chủ đề/Chương ➔ Bài học).
* Không AI Advisor Chatbot tư vấn trên trang chủ (thay bằng Form tìm gia sư trực quan).
* Không Admin Live Chat Monitor & Takeover Mode.
* Không Student Socratic Chat Assistant (thay bằng Auto-Grade + AI Explanations).
* Không tích hợp cuộc gọi video trực tuyến (dạy qua Zoom/Meet bên ngoài).
* Không thanh toán học phí trực tuyến tự động (duyệt minh chứng chuyển khoản thủ công).

## Vision

Trở thành nền tảng vận hành và tối ưu chất lượng giảng dạy tiêu chuẩn cho các trung tâm gia sư tiếng Anh thế hệ mới, nơi công nghệ AI đóng vai trò làm đòn bẩy nâng cao hiệu suất của gia sư và minh bạch hóa tiến độ học tập cho phụ huynh.
