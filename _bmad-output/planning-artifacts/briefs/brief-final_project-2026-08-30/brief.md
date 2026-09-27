---
title: Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-30
updated: 2026-09-27
---

# Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Executive Summary

Hệ thống là nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1, tổ chức theo 4 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân & Quản trị viên). Phạm vi sản phẩm được thiết kế tinh gọn, tập trung 100% giá trị đổi mới sáng tạo vào quy trình vận hành và giảng dạy thực tế sau khi nhận lớp (Giai đoạn B).

Sản phẩm kết hợp giữa công nghệ Web hiện đại, Trí tuệ nhân tạo (LLM) và Khoa học nhận thức (Spaced Repetition):
1. **Quy trình ghép lớp & Vận hành trung tâm (Phụ huynh - Lễ tân - Admin)**: Phụ huynh chọn tiêu chí qua Form tìm gia sư; Lễ tân/Admin tạo Match Offer, chuyển lớp cho gia sư và phê duyệt phí nhận lớp qua minh chứng chuyển khoản (QR Proof).
2. **Bộ công cụ cá nhân hóa giảng dạy & Quản lý Buổi học (Gia sư - Học sinh - Phụ huynh - Trọng tâm cốt lõi)**: 
   - Gia sư thiết lập **Khung chương trình (Curriculum Roadmap)** đóng vai trò là Kế hoạch tổng quan tĩnh (Master Plan), đồng thời quản lý **Buổi học thực tế (Daily Lesson Sessions)** như một Dòng thời gian linh hoạt (Dynamic Timeline) độc lập hoàn toàn với lộ trình tĩnh.
   - Mỗi buổi học bao gồm 1 ô **Nhật ký dạy học (Public Class Log Work)** minh bạch 3 bên (Gia sư - Học sinh - Phụ huynh) và danh sách tài liệu đính kèm.
   - Gia sư chủ trì việc **sinh bài tập cá nhân hóa dựa trên Student Knowledge Profile (SKP)** gắn trực tiếp tại từng Buổi học qua **AI Split-Screen Workspace** (Direct AI Generation hoặc Import File 0 Token Cost).
   - Học sinh làm bài trên ứng dụng, nhận chấm điểm tức thì kèm lời giải thích AI chi tiết, đồng thời được tự động củng cố kiến thức ngắt quãng theo thuật toán **Spaced Repetition (SM-2)** mà **không tốn chi phí LLM (Zero LLM Overhead)** khi nộp bài.

## The Problem

Thị trường gia sư tiếng Anh 1-1 hiện tại đang đối mặt với các nút thắt lớn trong quy trình vận hành và giảng dạy thực tế sau khi nhận lớp:

* **Gia sư**: Phần lớn là sinh viên hoặc giáo viên dạy thêm, gặp nhiều khó khăn trong việc thiết kế bài tập cá nhân hóa phù hợp chính xác với năng lực và điểm yếu của từng học sinh do thiếu công cụ phân tích và số liệu thống kê định lượng. Ngoài ra, việc ghi nhận tiến độ học tập thực tế rải rác, gò ép vào khung chương trình cứng khiến gia sư khó điều chỉnh nhịp dạy linh hoạt theo tình hình thực tế từng buổi.
* **Học sinh**: Thiếu động lực và không được giải thích lỗi sai kịp thời khi làm bài tập trực tuyến. Nếu không có thời gian ôn tập định kỳ đúng thời điểm, kiến thức sẽ nhanh chóng bị quên đi theo đường cong quên lãng (Ebbinghaus curve).
* **Phụ huynh**: Thiếu thông tin giám sát tiến độ thực tế theo từng buổi dạy (hôm nay con học gì, gia sư dặn dò ra sao). Các báo cáo từ gia sư thường mang tính định tính cảm tính mà không có số liệu định lượng bài tập, nhật ký dạy học minh bạch và đánh giá kỹ năng rõ ràng.
* **Trung tâm / Admin**: Quản lý ghép lớp và đối soát phí thủ công qua Zalo/Messenger rải rác, khó theo dõi tình trạng lớp học và giải quyết các khiếu nại đổi gia sư/hoàn tiền.

## The Solution

Sản phẩm cung cấp giải pháp web tích hợp gồm 4 cổng người dùng hoạt động đồng bộ với Backend Spring Boot (API Gateway, phân quyền RLS theo `Enrollment`) và AI Service (Python):

### 1. Form Tìm Gia Sư & Đăng ký Học thử (Cổng Phụ huynh)
* Phụ huynh chọn tiêu chí qua Form tìm gia sư trực quan (Lớp/Mục tiêu của con, Yêu cầu gia sư, Khung giờ rảnh).
* Hệ thống hiển thị danh sách gia sư phù hợp kèm thông tin kinh nghiệm và video tự giới thiệu.
* Phụ huynh chọn gia sư và bấm **"Đăng ký học thử"** (xác thực nhanh qua SĐT).

### 2. Bộ công cụ Soạn bài cá nhân hóa, Quản lý Khung chương trình & Buổi học thực tế (Cổng Gia sư)
* **Quản lý Khung chương trình học (Curriculum Roadmap - Master Plan)**: Tạo lộ trình bài học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) thủ công hoặc sử dụng AI sinh nháp trong 3-5s (Option A) / Import file JSON/Text từ ChatGPT ngoài (Option B - 0 Token Cost). Khung chương trình đóng vai trò định hướng kế hoạch tĩnh dài hạn.
* **Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Log Work)**: 
  * Quản lý dòng thời gian dạy học thực tế (Dynamic Timeline) của từng ngày dạy, **tách biệt kiến trúc hoàn toàn** với Roadmap (không tự động ràng buộc cứng, giúp gia sư linh hoạt dạy nhanh/chậm tiến độ).
  * Mỗi buổi học gồm: Tiêu đề buổi học (VD: *Buổi 5 - Grammar & Listening*), Tài liệu đính kèm (PDF/Word/Slides/Link) và **Báo cáo Nội dung Buổi học (Public Class Log Work)** – 1 ô văn bản tự do minh bạch 3 bên (Gia sư, Học sinh, Phụ huynh).
  * Tối giản tối đa (Frictionless): Loại bỏ nút bấm thả icon hay nút xác nhận "Đã xem" từ phụ huynh để tránh rườm rà.
* **Sinh Bài Tập Cá Nhân Hóa Dựa Trên SKP tại Chi tiết Buổi học (AI Split-Screen Workspace)**:
  * Bộ công cụ AI Sinh bài tập được gắn trực tiếp tại **Chi tiết Buổi học N** với giao diện chia đôi màn hình **Split-Screen Workspace**:
    * **Cột TRÁI (Main Canvas - 65%)**: Hiển thị thẻ câu hỏi trực quan, cho phép **Inline Editing** trực tiếp trên văn bản (câu hỏi, đáp án, lời giải thích AI) và Live Update.
    * **Cột PHẢI (Assistance Dock - 35%)** với 2 Tabs:
      * **TAB 1: Form / Content (Cấu hình & Tạo ban đầu)**: Auto-load bối cảnh Buổi N (Tài liệu đính kèm & Log Work), cấu hình số câu, dạng bài, độ khó. Hỗ trợ **Option A (Direct AI Generation 3-5s)** và **Option B (Import Structured File 0 Token Cost)**.
      * **TAB 2: Chat Freestyle (AI Co-pilot Tinh chỉnh)**: Chat ngôn ngữ tự nhiên với AI Co-pilot để yêu cầu điều chỉnh, AI tự động cập nhật Live Update lên Canvas bên trái.
  * **Zero LLM Overhead khi nộp bài**: AI sinh sẵn metadata (đáp án, lời giải thích AI, `difficulty` 1-100, `micro_skill_tags`). Backend chấm điểm, cập nhật điểm Elo Rating trong SKP và lập lịch Spaced Repetition (SM-2) **hoàn toàn tự động không gọi LLM** khi học sinh nộp bài.

### 3. Trình làm bài tập & Ôn tập Ngắt quãng Spaced Repetition (Cổng Học sinh)
* **Làm bài & Chấm điểm tức thì**: Học sinh xem thông tin Buổi học N, tài liệu học tập, làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi, viết lại câu), biết ngay kết quả và đọc **Lời giải thích chi tiết (AI Explanation)** cho từng câu làm sai.
* **Tính năng Ôn tập kiến thức ngắt quãng (Spaced Repetition)**: Áp dụng thuật toán **SM-2** tự động lựa chọn và lập lịch các câu hỏi/kiến thức sắp đến hạn ôn tập (`next_review`) dựa trên lịch sử làm bài trước đó (câu làm sai, lỗi hay mắc, kiến thức lâu chưa ôn) giúp học sinh ghi nhớ dài hạn.
* **Vòng lặp cá nhân hóa khép kín (Closed Loop)**:
  $$\text{Học sinh làm bài Buổi N} \xrightarrow{} \text{Cập nhật SKP (Elo rating, Error patterns)} \xrightarrow{} \text{Cập nhật Spaced Repetition (SM-2)} \xrightarrow{} \text{Daily Job chọn ôn tập} \xrightarrow{} \text{AI Workspace sinh bài Buổi N+1 chuẩn SKP}$$
* **Báo cáo tiến bộ cá nhân**: Phân tách minh bạch giữa **Chỉ số Chăm chỉ** (tỷ lệ hoàn thành bài về nhà đúng hạn) và **Biểu đồ Năng lực** (kết quả bài kiểm tra định kỳ).

### 4. Quản lý Vận hành & Phê duyệt Tài chính (Cổng Lễ tân & Cổng Admin)
* **Xử lý ghép lớp (Match Request Management)**: Lễ tân/Admin tiếp nhận Form từ phụ huynh ➔ Gọi điện tư vấn ➔ Tạo **Match Offer** gửi tới Gia sư.
* **Phê duyệt phí nhận lớp qua QR Proof**: Gia sư nhận lớp, chuyển khoản phí nhận lớp sau 1 tháng dạy và tải ảnh biên lai (QR proof) ➔ Lễ tân/Admin đối soát khớp lệnh và bấm "Phê duyệt phí" để mở khóa đầy đủ thông tin liên hệ của phụ huynh.
* **Quản lý & Giám sát Khiếu nại (Complaint Management & Financial Reconciliation)**: Tiếp nhận khiếu nại đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`), giám sát tiến độ xử lý và tổng hợp số tiền hoàn trả để đối soát tài chính cân đối với doanh thu thu vào.
* **Bảo mật & Audit Log**: Phân quyền Row-level security nghiêm ngặt theo bảng `Enrollment` (Gia sư chỉ xem được dữ liệu lớp mình phụ trách) và tự động ghi **Audit Log** chi tiết cho các thao tác trọng yếu (tạo Offer, duyệt phí, xử lý khiếu nại, giao bài).

## What Makes This Different

* **Tách biệt Kiến trúc giữa Roadmap Master Plan & Buổi học thực tế Dynamic Timeline**: Giúp gia sư lập kế hoạch tổng thể dài hạn nhưng hoàn toàn linh hoạt trong thực thi dạy học từng ngày mà không bị gò bó.
* **Nhật ký bài học 3 bên minh bạch (Public Class Log Work)**: Giúp phụ huynh nắm chính xác nội dung học và bài tập dặn dò của con sau mỗi buổi dạy một cách tinh gọn, frictionless.
* **AI Split-Screen Workspace gắn tại Buổi học**: Màn hình làm việc chia đôi với Canvas chỉnh sửa inline trực quan và Co-pilot chat tinh chỉnh, auto-load context bài học thực tế để sinh bài tập chuẩn SKP siêu tốc.
* **Vòng lặp cá nhân hóa khép kín & Zero LLM Overhead khi nộp bài**: Kết hợp Student Knowledge Profile (Elo Rating) và Spaced Repetition (SM-2), AI sinh sẵn metadata giúp hệ thống tự động chấm điểm và cập nhật tri thức người học với chi phí API tối ưu tuyệt đối.

## Who This Serves

* **Phụ huynh**: Tìm gia sư phù hợp và gửi đăng ký học thử dễ dàng; xem nhật ký bài học từng buổi (Public Log Work) và theo dõi báo cáo tiến bộ định lượng thực chất của con.
* **Gia sư**: Soạn khung chương trình master plan, quản lý buổi học thực tế linh hoạt, gõ nhanh Log Work và tạo bài tập cá nhân hóa chuẩn SKP qua AI Split-Screen Workspace chỉ trong 1-3 phút.
* **Học sinh**: Mở từng Buổi học xem tài liệu và làm bài tập online tiện lợi, biết ngay kết quả và đọc lời giải thích chi tiết AI; tự động ôn tập kiến thức sắp quên qua Spaced Repetition.
* **Lễ tân & Quản trị viên (Admin)**: Quản lý ghép lớp, duyệt thanh toán phí nhận lớp qua QR proof, xử lý khiếu nại đổi gia sư/hoàn tiền và xuất báo cáo đối soát tài chính.

## Success Criteria

*(Ghi chú: Section này tạm thời ghi nhận và sẽ được rà soát, chuẩn hóa thành các chỉ số đo lường/nghiệm thu cụ thể [TBD] sau)*

* **Tốc độ đăng ký học thử**: Phụ huynh hoàn thành Form tìm gia sư và gửi yêu cầu đăng ký học thử dễ dàng, tinh gọn.
* **Thời gian chuẩn bị bài của Gia sư**: Giảm thời gian soạn nhật ký buổi học và giao bài tập cá nhân hóa xuống dưới 3 phút/buổi dạy nhờ AI Split-Screen Workspace.
* **Trải nghiệm học tập & Ghi nhớ**: 100% bài tập có đáp án và lời giải thích chi tiết AI; tính năng Spaced Repetition gợi ý chính xác các câu hỏi cần ôn tập đến hạn.
* **Tốc độ xử lý vận hành trung tâm**: Phê duyệt phí nhận lớp QR Proof và điều phối khiếu nại mượt mà, ghi vết Audit Log đầy đủ.

## Scope

### Nằm trong phạm vi (In-Scope):
* **Cổng Phụ huynh**: Landing Page, Form Tìm Gia Sư & Đăng ký Học thử, Xem hồ sơ gia sư verified, Xem nhật ký bài học từng buổi (Public Class Log Work) và báo cáo tiến bộ của con.
* **Cổng Gia sư**: Quản lý lớp & thời khóa biểu, Khung chương trình học tĩnh (Curriculum Roadmap tinh gọn 2 cấp), **Quản lý Buổi học thực tế & Nhật ký dạy học tinh gọn (Daily Lesson Sessions & Log Work)**, **Tutor Assistant Dual-Mode qua AI Split-Screen Workspace** tại Chi tiết Buổi học (sinh bài tập cá nhân hóa dựa trên SKP, auto-load context buổi học, zero-LLM submission), Duyệt & Giao bài tức thì, Xem báo cáo SKP học sinh.
* **Cổng Học sinh**: Xem Buổi học N & tài liệu đính kèm, Làm bài tập online (Trắc nghiệm, Điền từ, Sửa lỗi, Viết lại câu), Chấm điểm tự động, Xem lời giải thích chi tiết AI từng câu, **Ôn tập kiến thức ngắt quãng Spaced Repetition (Thuật toán SM-2)**, Xem báo cáo tiến độ (Chăm chỉ & Năng lực).
* **Cổng Lễ tân**: Quản lý yêu cầu ghép lớp (Match Request Management), Duyệt thanh toán phí nhận lớp (QR Proof upload), Quản lý danh sách Gia sư & Học sinh, Tiếp nhận khiếu nại (Complaint Management).
* **Cổng Quản trị viên**: Giám sát ghép lớp & điều phối tổng thể, Phê duyệt phí nhận lớp & Đối soát tài chính tập trung, Giám sát và xử lý khiếu nại tổng thể (`REMATCH`, `REFUND`), Báo cáo vận hành & Xuất dữ liệu (Excel/PDF), Phân quyền RLS theo `Enrollment` & Audit Log.
* **Hạ tầng Backend & Auth**: Phân quyền Spring Boot theo `Enrollment`, PostgreSQL (lưu SKP, SM-2 schedules, daily sessions, log work, errors, audit logs), Docker deployment.

### Nằm ngoài phạm vi (Out-of-Scope):
* Không tự động ràng buộc cứng (hard binding) giữa Buổi học thực tế và Bài học trong Roadmap.
* Không các tính năng tương tác rườm rà trong Nhật ký buổi học (như nút xác nhận phụ huynh "Đã xem", thả icon reaction, ghi chú riêng tư phức tạp).
* Không hỗ trợ khung chương trình học đa cấp phức tạp >2 cấp.
* Không AI Advisor Chatbot tư vấn tự do trên trang chủ (thay bằng Form tìm gia sư trực quan).
* Không Admin Live Chat Monitor & Takeover Mode.
* Không Student Socratic Chat Assistant (thay bằng Auto-Grade + AI Explanations + Spaced Repetition).
* Không tích hợp cuộc gọi video trực tuyến (dạy qua Zoom/Meet bên ngoài).
* Không thanh toán học phí trực tuyến tự động qua cổng thanh toán (duyệt minh chứng chuyển khoản QR Proof thủ công).

## Vision

Trở thành nền tảng vận hành và tối ưu chất lượng giảng dạy tiêu chuẩn cho các trung tâm gia sư tiếng Anh thế hệ mới, nơi công nghệ AI và Spaced Repetition đóng vai trò đòn bẩy nâng cao hiệu suất của gia sư, giúp học sinh ghi nhớ sâu sắc và minh bạch hóa tiến độ học tập cho phụ huynh qua nhật ký bài học thực tế.

