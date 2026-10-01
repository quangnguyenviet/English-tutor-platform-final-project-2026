---
title: Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-30
updated: 2026-10-01
---

# Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Executive Summary

Hệ thống là nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1, tổ chức theo **5 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân, Quản trị viên)**. Phạm vi sản phẩm được thiết kế tinh gọn, tập trung 100% giá trị đổi mới sáng tạo vào quy trình vận hành và giảng dạy thực tế sau khi nhận lớp (Giai đoạn B).

Sản phẩm kết hợp giữa công nghệ Web hiện đại, Trí tuệ nhân tạo (LLM) và phương pháp ôn tập ngắt quãng (Spaced Repetition):
1. **Quy trình ghép lớp & Vận hành trung tâm (Phụ huynh - Lễ tân - Admin)**: Phụ huynh chọn tiêu chí qua Form tìm gia sư; Lễ tân/Admin tạo Match Offer, chuyển lớp cho gia sư và phê duyệt phí nhận lớp qua minh chứng chuyển khoản (QR Proof).
2. **Bộ công cụ soạn bài & Quản lý Buổi học (Gia sư - Học sinh - Phụ huynh - Trọng tâm cốt lõi)**:
   - Gia sư thiết lập **Khung chương trình (Curriculum Roadmap)** đóng vai trò là Kế hoạch tổng quan (Master Plan), đồng thời quản lý **Buổi học thực tế (Daily Lesson Sessions)** như một Dòng thời gian linh hoạt (Dynamic Timeline) độc lập hoàn toàn với lộ trình bài học.
   - Mỗi buổi học bao gồm 1 ô **Nhật ký dạy học (Public Class Log Work)** minh bạch 3 bên (Gia sư - Học sinh - Phụ huynh) và danh sách **tài liệu & bài tập đính kèm (Uploaded Attachments)**. Đối với các bài tập về nhà đa dạng định dạng (tự luận, viết lại câu, đọc hiểu...), gia sư sẽ upload trực tiếp file đính kèm để học sinh làm bài.
   - Gia sư chủ trì việc **sinh Quiz ôn tập (AI Revision Quiz Generator)** có tích hợp bối cảnh bài học và thông tin học sinh (bao gồm Student Knowledge Profile - SKP) gắn trực tiếp tại từng Buổi học qua **AI Split-Screen Workspace** (Direct AI Generation hoặc Import File 0 Token Cost) để sinh bài tập phù hợp và củng cố nhanh kiến thức, không đóng vai trò giao toàn bộ bài tập về nhà.
   - Học sinh làm Quiz ôn tập trên ứng dụng, nhận chấm điểm trắc nghiệm/ngắn tức thì kèm lời giải thích AI chi tiết, đồng thời được tự động củng cố kiến thức ngắt quãng theo thuật toán **Spaced Repetition (SM-2)**.

## The Problem

Thị trường gia sư tiếng Anh 1-1 hiện tại đang đối mặt với các nút thắt lớn trong quy trình vận hành và giảng dạy thực tế sau khi nhận lớp:

* **Gia sư**: Phần lớn là sinh viên hoặc giáo viên dạy thêm, gặp khó khăn do thiếu một không gian quản lý lớp học tập trung. Việc đánh giá mức độ tiếp thu bài học và củng cố kiến thức cũ chủ yếu diễn ra cảm tính và thiếu hệ thống, do thiếu công cụ định lượng giúp gia sư biết chính xác học sinh đã nắm vững dạng kiến thức nào và đang còn hổng ở đâu. Đồng thời, nhật ký buổi học và các tài liệu/bài tập đính kèm (Word, PDF, tự luận...) phải gửi rải rác qua Zalo, Messenger hay Google Drive, khiến thông tin dễ bị trôi và gia sư khó theo dõi mạch học tập dài hạn.
* **Học sinh**: Thường gặp tình trạng "học trước quên sau" do thiếu phương pháp ôn tập gợi nhớ định kỳ giữa các buổi học. Đồng thời, khi làm sai bài tập/quiz, học sinh chỉ biết mình làm sai câu đó mà không nhận biết được câu đó thuộc dạng kiến thức hay chủ điểm nào để tập trung củng cố, dẫn đến việc lặp lại cùng một dạng lỗi sai mà không sửa được dứt điểm.
* **Phụ huynh**: Thiếu thông tin giám sát tiến độ thực tế theo từng buổi dạy (hôm nay con học gì, gia sư dặn dò ra sao). Các báo cáo từ gia sư thường mang tính định tính cảm tính mà không có số liệu định lượng bài tập, nhật ký dạy học minh bạch và đánh giá kỹ năng rõ ràng.
* **Trung tâm / Admin / Lễ tân**: Quản lý ghép lớp và đối soát phí thủ công qua Zalo/Messenger rải rác, khó theo dõi tình trạng lớp học và giải quyết các khiếu nại đổi gia sư/hoàn tiền.

## The Solution

Sản phẩm cung cấp giải pháp web tích hợp gồm **5 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân, Quản trị viên)** hoạt động đồng bộ với Backend Spring Boot (API Gateway, phân quyền RLS theo `Enrollment`) và AI Service (Python):

### 1. Form Tìm Gia Sư & Đăng ký Học thử (Cổng Phụ huynh)
* Phụ huynh chọn tiêu chí qua Form tìm gia sư (Lớp/Mục tiêu của con, Yêu cầu gia sư, Khung giờ rảnh).
* Hệ thống hiển thị danh sách gia sư phù hợp kèm thông tin gia sư.
* Phụ huynh chọn gia sư và bấm **"Đăng ký học thử"** (xác thực nhanh qua SĐT).

### 2. Bộ công cụ Soạn bài, Quản lý Khung chương trình & Buổi học thực tế (Cổng Gia sư)
* **Quản lý Khung chương trình học (Curriculum Roadmap - Master Plan)**: Tạo lộ trình bài học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) thủ công hoặc chọn các mẫu lộ trình có sẵn trong hệ thống nhằm định hướng kế hoạch giảng dạy cho toàn bộ khóa học.
* **Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Log Work)**: 
  * Quản lý dòng thời gian dạy học thực tế (Dynamic Timeline) của từng ngày dạy, **tách biệt kiến trúc hoàn toàn** với Roadmap (không tự động ràng buộc cứng, giúp gia sư linh hoạt dạy nhanh/chậm tiến độ).
  * Mỗi buổi học gồm: Tiêu đề buổi học (VD: *Buổi 5 - Grammar & Listening*), **Tài liệu & Bài tập đính kèm (Uploaded Attachments)** (Gia sư upload file Word/PDF/Slides cho các dạng bài tập tự luận, viết lại câu, đọc hiểu...) và **Báo cáo Nội dung Buổi học (Public Class Log Work)** – 1 ô văn bản tự do minh bạch 3 bên (Gia sư, Học sinh, Phụ huynh).
* **Sinh Quiz Ôn Tập Phù Hợp với Context Học Sinh tại Chi tiết Buổi học (AI Split-Screen Workspace)**:
  * Do nhu cầu giao bài tập về nhà của gia sư mang tính tự luận, đọc hiểu và viết lại câu cao (thực hiện qua upload file đính kèm), công cụ AI không đóng vai trò tạo bài tập về nhà chính mà chuyển thành **AI Sinh Quiz Ôn Tập (AI Revision Quiz Generator)** gắn tại **Chi tiết Buổi học N** với giao diện chia đôi màn hình **Split-Screen Workspace**:
    * **Cột TRÁI (Main Canvas - 65%)**: Hiển thị các thẻ câu hỏi Quiz ôn tập trực quan, cho phép **Inline Editing** trực tiếp trên văn bản (câu hỏi, đáp án, lời giải thích AI) và Live Update.
    * **Cột PHẢI (Assistance Dock - 35%)** với 2 Tabs:
      * **TAB 1: Form / Content (Cấu hình & Tạo ban đầu)**: Auto-load bối cảnh Buổi N (Tài liệu đính kèm & Log Work), cấu hình số câu Quiz ôn tập, chủ đề, độ khó. Hỗ trợ **Option A (Direct AI Generation 3-5s)** và **Option B (Import Structured File 0 Token Cost)**.
      * **TAB 2: Chat Freestyle (AI Co-pilot Tinh chỉnh)**: Chat ngôn ngữ tự nhiên với AI Co-pilot để yêu cầu điều chỉnh Quiz, AI tự động cập nhật Live Update lên Canvas bên trái.
  * **Tự động chấm điểm & Cập nhật SKP**: AI sinh sẵn metadata (đáp án, lời giải thích AI, `difficulty` 1-100, `micro_skill_tags`). Backend tự động chấm điểm Quiz, cập nhật điểm Elo Rating trong SKP và lập lịch Spaced Repetition (SM-2) ngay khi học sinh nộp Quiz.

### 3. Trình làm bài tập & Ôn tập Ngắt quãng Spaced Repetition (Cổng Học sinh)
* **Làm Quiz ôn tập & Tải file bài tập**: Học sinh xem thông tin Buổi học N, tải file tài liệu & bài tập đính kèm (tự luận, đọc hiểu, viết lại câu) do gia sư giao, đồng thời làm **Quiz ôn tập trực tuyến** (trắc nghiệm), biết ngay kết quả và đọc **Lời giải thích chi tiết (AI Explanation)** cho từng câu Quiz làm chưa đúng.
* **Tính năng Ôn tập kiến thức ngắt quãng (Spaced Repetition)**: Áp dụng thuật toán **SM-2** tự động lựa chọn và lập lịch các câu hỏi Quiz/kiến thức sắp đến hạn ôn tập (`next_review`) dựa trên lịch sử làm bài trước đó (câu làm sai, lỗi hay mắc, kiến thức lâu chưa ôn) giúp học sinh ghi nhớ dài hạn.
* **Vòng lặp học tập khép kín (Closed Loop)**:
  $$\text{Học sinh hoàn thành Quiz Buổi N} \xrightarrow{} \text{Cập nhật SKP (Elo rating, Error patterns)} \xrightarrow{} \text{Cập nhật Spaced Repetition (SM-2)} \xrightarrow{} \text{Daily Job chọn ôn tập} \xrightarrow{} \text{AI Workspace sinh Quiz ôn tập Buổi N+1 phù hợp context học sinh}$$
* **Báo cáo tiến bộ cá nhân**: Phân tách minh bạch giữa **Chỉ số Chăm chỉ** (tỷ lệ hoàn thành Quiz ôn tập & nộp bài đính kèm đúng hạn) và **Biểu đồ Năng lực** (kết quả bài kiểm tra & Quiz định kỳ).

### 4. Quản lý ghép lớp & Tiếp nhận khiếu nại (Cổng Lễ tân)
* **Xử lý ghép lớp (Match Request Management)**: Tiếp nhận Form tìm gia sư từ phụ huynh ➔ Gọi điện tư vấn ➔ Tạo **Match Offer** gửi tới Gia sư phù hợp.
* **Tiếp nhận & Hỗ trợ khiếu nại**: Tiếp nhận yêu cầu đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`) từ phụ huynh/gia sư và hỗ trợ tư vấn ban đầu.

### 5. Quản lý Phê duyệt Tài chính & Giám sát Hệ thống (Cổng Quản trị viên / Admin)
* **Phê duyệt phí nhận lớp qua QR Proof**: Phê duyệt minh chứng chuyển khoản phí nhận lớp (QR proof) của gia sư để mở khóa đầy đủ thông tin liên hệ của phụ huynh.
* **Quản lý & Đối soát Khiếu nại (Financial Reconciliation)**: Phê duyệt khiếu nại đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`), giám sát đối soát tài chính cân đối với doanh thu thu vào.
* **Bảo mật & Audit Log**: Phân quyền Row-level security nghiêm ngặt theo bảng `Enrollment` và tự động ghi **Audit Log** chi tiết cho các thao tác trọng yếu.

## What Makes This Different

* **Tách biệt Kiến trúc giữa Roadmap Master Plan & Buổi học thực tế Dynamic Timeline**: Giúp gia sư lập kế hoạch tổng thể dài hạn nhưng hoàn toàn linh hoạt trong thực thi dạy học từng ngày mà không bị gò bó.
* **Nhật ký bài học 3 bên minh bạch (Public Class Log Work)**: Giúp phụ huynh nắm chính xác nội dung học và bài tập dặn dò của con sau mỗi buổi dạy một cách tinh gọn, frictionless.
* **AI Split-Screen Workspace hỗ trợ sinh Quiz ôn tập gắn tại Buổi học**: Màn hình làm việc chia đôi với Canvas chỉnh sửa inline trực quan và Co-pilot chat tinh chỉnh, auto-load context bài học thực tế để gia sư tạo Quiz ôn tập chuẩn SKP siêu tốc; bài tập về nhà đa dạng (tự luận, đọc hiểu, viết lại câu...) được đính kèm linh hoạt dạng file.
* **Vòng lặp học tập khép kín**: Kết hợp Student Knowledge Profile (Elo Rating) và Spaced Repetition (SM-2), AI sinh sẵn metadata giúp hệ thống tự động chấm điểm và cập nhật tri thức người học sau mỗi bài nộp.

## Who This Serves

* **Phụ huynh**: Tìm gia sư phù hợp và gửi đăng ký học thử dễ dàng; xem nhật ký bài học từng buổi (Public Log Work), các tài liệu/bài tập đính kèm và theo dõi báo cáo tiến bộ định lượng thực chất của con.
* **Gia sư**: Soạn khung chương trình master plan, quản lý buổi học thực tế linh hoạt, upload file bài tập đính kèm (tự luận, đọc hiểu, viết lại câu...) và tạo Quiz ôn tập chuẩn SKP qua AI Split-Screen Workspace chỉ trong 1-3 phút.
* **Học sinh**: Mở từng Buổi học tải file bài tập/tài liệu đính kèm và làm Quiz ôn tập online tiện lợi, biết ngay kết quả và đọc lời giải thích chi tiết AI; tự động ôn tập kiến thức sắp quên qua Spaced Repetition.
* **Lễ tân**: Quản lý ghép lớp (Match Request), gọi điện tư vấn, tạo Match Offer gửi gia sư và tiếp nhận xử lý khiếu nại ban đầu.
* **Quản trị viên (Admin)**: Phê duyệt thanh toán phí nhận lớp qua QR proof, xử lý khiếu nại cấp cao (`REMATCH`, `REFUND`), xuất báo cáo đối soát tài chính và quản trị hệ thống.

## Success Criteria

*(Ghi chú: Section này tạm thời ghi nhận và sẽ được rà soát, chuẩn hóa thành các chỉ số đo lường/nghiệm thu cụ thể [TBD] sau)*

* **Tốc độ đăng ký học thử**: Phụ huynh hoàn thành Form tìm gia sư và gửi yêu cầu đăng ký học thử dễ dàng, tinh gọn.
* **Thời gian chuẩn bị bài của Gia sư**: Giảm thời gian soạn nhật ký buổi học, đính kèm file bài tập và tạo Quiz ôn tập bám sát SKP xuống dưới 3 phút/buổi dạy nhờ AI Split-Screen Workspace.
* **Trải nghiệm học tập & Ghi nhớ**: 100% Quiz ôn tập có đáp án và lời giải thích chi tiết AI; tính năng Spaced Repetition gợi ý chính xác các câu hỏi cần ôn tập đến hạn.
* **Tốc độ xử lý vận hành trung tâm**: Phê duyệt phí nhận lớp QR Proof và điều phối khiếu nại mượt mà, ghi vết Audit Log đầy đủ.

## Scope

### Nằm trong phạm vi (In-Scope):
* **Cổng Phụ huynh**: Landing Page, Form Tìm Gia Sư & Đăng ký Học thử, Xem hồ sơ gia sư verified, Xem nhật ký bài học từng buổi (Public Class Log Work) và báo cáo tiến bộ của con.
* **Cổng Gia sư**: Quản lý lớp & thời khóa biểu, Khung chương trình học (Curriculum Roadmap tinh gọn 2 cấp), **Quản lý Buổi học thực tế & Nhật ký dạy học tinh gọn (Daily Lesson Sessions & Log Work)**, Upload file tài liệu & bài tập đính kèm (tự luận, đọc hiểu, viết lại câu...), **Tutor Assistant Dual-Mode qua AI Split-Screen Workspace** tại Chi tiết Buổi học (sinh Quiz ôn tập bám sát context buổi học, tự động chấm điểm & cập nhật SKP), Xem báo cáo SKP học sinh.
* **Cổng Học sinh**: Xem Buổi học N, tải tài liệu & file bài tập đính kèm, Làm Quiz ôn tập online (Trắc nghiệm, Điền từ, Phản xạ nhanh), Chấm điểm Quiz tự động, Xem lời giải thích chi tiết AI từng câu Quiz, **Ôn tập kiến thức ngắt quãng Spaced Repetition (Thuật toán SM-2)**, Xem báo cáo tiến độ (Chăm chỉ & Năng lực).
* **Cổng Lễ tân**: Quản lý yêu cầu ghép lớp (Match Request Management), Duyệt thanh toán phí nhận lớp (QR Proof upload), Quản lý danh sách Gia sư & Học sinh, Tiếp nhận khiếu nại (Complaint Management).
* **Cổng Quản trị viên**: Giám sát ghép lớp & điều phối tổng thể, Phê duyệt phí nhận lớp & Đối soát tài chính tập trung, Giám sát và xử lý khiếu nại tổng thể (`REMATCH`, `REFUND`), Báo cáo vận hành & Xuất dữ liệu (Excel/PDF), Phân quyền RLS theo `Enrollment` & Audit Log.
* **Hạ tầng Backend & Auth**: Phân quyền Spring Boot theo `Enrollment`, PostgreSQL (lưu SKP, SM-2 schedules, daily sessions, log work, errors, audit logs), Docker deployment.

### Nằm ngoài phạm vi (Out-of-Scope):
* Không hỗ trợ AI sinh toàn bộ bài tập về nhà phức tạp (tự luận, bài đọc hiểu dài, viết lại câu...) – gia sư thực hiện qua tính năng upload file tài liệu/bài tập đính kèm; AI chỉ tập trung hỗ trợ sinh Quiz ôn tập.
* Không tự động ràng buộc cứng (hard binding) giữa Buổi học thực tế và Bài học trong Roadmap.
* Không các tính năng tương tác rườm rà (thả icon reaction, ghi chú riêng tư phức tạp) trong Nhật ký buổi học.
* Không hỗ trợ khung chương trình học đa cấp phức tạp >2 cấp.
* Không AI Advisor Chatbot tư vấn tự do trên trang chủ (thay bằng Form tìm gia sư).
* Không Admin Live Chat Monitor & Takeover Mode.
* Không Student Socratic Chat Assistant (thay bằng Auto-Grade + AI Explanations + Spaced Repetition).
* Không tích hợp cuộc gọi video trực tuyến (dạy qua Zoom/Meet bên ngoài).
* Không thanh toán học phí trực tuyến tự động qua cổng thanh toán (duyệt minh chứng chuyển khoản QR Proof thủ công).

## Vision

Trở thành nền tảng vận hành và tối ưu chất lượng giảng dạy tiêu chuẩn cho các trung tâm gia sư tiếng Anh thế hệ mới, nơi công nghệ AI và Spaced Repetition đóng vai trò đòn bẩy nâng cao hiệu suất của gia sư, giúp học sinh ghi nhớ sâu sắc và minh bạch hóa tiến độ học tập cho phụ huynh qua nhật ký bài học thực tế.

