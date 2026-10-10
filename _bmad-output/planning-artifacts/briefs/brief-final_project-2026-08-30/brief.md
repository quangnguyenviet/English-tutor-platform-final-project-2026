---
title: Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-30
updated: 2026-10-09
---

# Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Executive Summary

Hệ thống là nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1, tổ chức theo **5 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân, Quản trị viên)**.

Sản phẩm kết hợp giữa công nghệ Web hiện đại, Trí tuệ nhân tạo (LLM) và phương pháp ôn tập ngắt quãng (Spaced Repetition):
1. **Quy trình ghép lớp & Vận hành trung tâm (Phụ huynh - Lễ tân - Admin)**: Phụ huynh chọn tiêu chí qua Form tìm gia sư; Lễ tân/Admin tạo Match Offer, chuyển lớp cho gia sư và phê duyệt phí nhận lớp qua minh chứng chuyển khoản (QR Proof).
2. **Bộ công cụ soạn bài & Quản lý Buổi học (Gia sư - Học sinh - Phụ huynh - Trọng tâm cốt lõi)**:
   - Gia sư thiết lập **Khung chương trình học (Curriculum Roadmap)** và quản lý các **Buổi học thực tế (Daily Lesson Sessions)** linh hoạt theo tiến độ của học sinh.
   - Mỗi buổi học bao gồm 1 ô **Nhật ký bài học (Public Class Log Work)** và danh sách **tài liệu & bài tập đính kèm (Uploaded Attachments)**. Đối với các bài tập về nhà đa dạng định dạng (tự luận, viết lại câu, đọc hiểu...), gia sư sẽ upload trực tiếp file đính kèm để học sinh làm bài.
   - Gia sư chủ trì việc **sinh Quiz ôn tập (AI Revision Quiz Generator)** có tích hợp bối cảnh bài học và thông tin học sinh (bao gồm Student Knowledge Profile - SKP) gắn trực tiếp tại từng Buổi học qua **AI Workspace** (Direct AI Generation hoặc Import File 0 Token Cost) để sinh bài tập phù hợp và củng cố nhanh kiến thức, không đóng vai trò giao toàn bộ bài tập về nhà.
   - Học sinh làm Quiz ôn tập trên ứng dụng, nhận chấm điểm trắc nghiệm/ngắn tức thì kèm lời giải thích AI chi tiết, đồng thời được tự động củng cố kiến thức ngắt quãng (Spaced Repetition tinh gọn: các câu hỏi làm sai sẽ tự động được đưa vào danh sách luyện tập để ôn lại trong các buổi sau).

## The Problem

Thị trường gia sư tiếng Anh 1-1 hiện tại đang đối mặt với các nút thắt lớn trong quy trình vận hành và giảng dạy thực tế:

* **Gia sư (Quản lý phân tán & Đánh giá cảm tính)**: Quản lý lịch dạy, tiến độ bài học và nhật ký giảng dạy hoàn toàn thủ công trên ghi chép cá nhân, khiến thông tin không thống nhất; việc theo dõi lỗ hổng kiến thức của học sinh chủ yếu dựa vào trí nhớ và cảm tính, thiếu dữ liệu đo lường cụ thể.
* **Học sinh (Học trước quên sau & Mất định hướng)**: Dễ quên tới **60–70% kiến thức mới** sau 3–5 ngày; thường cảm thấy nản lòng và chán học vì không biết rõ mình đang yếu phần nào và cần tự ôn luyện những gì.
* **Phụ huynh (Thiếu thông tin giám sát)**: Khoảng **85–90% phụ huynh** không nắm rõ chi tiết con mình học gì và làm bài tập ra sao sau mỗi buổi; trao đổi với gia sư chủ yếu là nhận xét chung chung, thiếu nhật ký học tập rõ ràng.
* **Trung tâm / Admin / Lễ tân (Vận hành thủ công rời rạc)**: Quy trình ghép lớp, trao đổi với gia sư, xác minh đóng phí và xử lý khiếu nại (đổi gia sư/hoàn tiền) đều thực hiện thủ công qua tin nhắn, tốn thời gian và dễ xảy ra tranh chấp.

## The Solution

Sản phẩm cung cấp giải pháp web tích hợp gồm **5 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân, Quản trị viên)** hoạt động đồng bộ với hệ thống Backend phân quyền RLS theo `Enrollment` và dịch vụ AI Service tích hợp:

### 1. Form Tìm Gia Sư & Đăng ký Học thử (Cổng Phụ huynh)
* Phụ huynh chọn tiêu chí qua Form tìm gia sư (Lớp/Mục tiêu của con, Yêu cầu gia sư, Khung giờ rảnh).
* Hệ thống hiển thị danh sách gia sư phù hợp kèm thông tin gia sư đã xác thực.
* Phụ huynh chọn gia sư và bấm **"Đăng ký học thử"** (xác thực nhanh qua SĐT).

### 2. Bộ công cụ Soạn bài, Quản lý Khung chương trình & Buổi học thực tế (Cổng Gia sư)
* **Quản lý Khung chương trình học (Curriculum Roadmap - Master Plan)**: Tạo lộ trình bài học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) thủ công hoặc chọn các mẫu lộ trình có sẵn trong hệ thống nhằm định hướng kế hoạch giảng dạy cho toàn bộ khóa học.
* **Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Log Work)**: 
  * Quản lý các Buổi học thực tế linh hoạt theo tiến độ giảng dạy từng ngày mà không bị gò bó.
  * Mỗi buổi học gồm: Tiêu đề buổi học (VD: *Buổi 5 - Grammar & Listening*), **Tài liệu & Bài tập đính kèm (Uploaded Attachments)** (Gia sư upload file Word/PDF/Slides cho các dạng bài tập tự luận, viết lại câu, đọc hiểu...) và **Nhật ký bài học (Public Class Log Work)** – 1 ô văn bản tự do công khai.
* **AI Revision Quiz Generator tại Chi tiết Buổi học (AI Workspace)**:
  * Do nhu cầu giao bài tập về nhà của gia sư mang tính tự luận, đọc hiểu và viết lại câu cao (thực hiện qua upload file đính kèm), công cụ AI không đóng vai trò tạo bài tập về nhà chính mà chuyển thành **AI Sinh Quiz Ôn Tập (AI Revision Quiz Generator)** gắn tại từng Buổi học N:
    * **Tương tác Canvas & Inline Editing**: Hiển thị các thẻ câu hỏi Quiz ôn tập trực quan, hỗ trợ gia sư xem trước, chỉnh sửa trực tiếp nội dung (câu hỏi, đáp án, lời giải thích AI) trước khi xuất bản.
    * **Bối cảnh & Tinh chỉnh linh hoạt**: Tự động nạp bối cảnh Buổi N (Tài liệu đính kèm & Log Work), cấu hình số câu Quiz, chủ đề, cấp độ khó (A1, A2, B1, B2, C1, C2). Hỗ trợ **Option A (Direct AI Generation)**, **Option B (Import Structured File 0 Token Cost)**, cùng trợ lý **AI Co-pilot** hỗ trợ tinh chỉnh câu hỏi theo yêu cầu tự nhiên.
  * **Tự động chấm điểm & Cập nhật SKP (Student Elo Rating)**: AI sinh sẵn metadata (đáp án, lời giải thích AI, độ khó theo cấp độ CEFR: A1, A2, B1, B2, C1, C2, chủ điểm/tags). Backend tự động chấm điểm Quiz, cập nhật điểm **Elo Rating tổng thể của Học sinh** dựa trên cấp độ CEFR của các câu hỏi (tách biệt hoàn toàn khỏi tags). **Các tags/chủ điểm câu hỏi vẫn được lưu giữ độc lập để phục vụ thống kê báo cáo** (VD: thống kê dạng lỗi sai học sinh mắc nhiều nhất trong 2 tuần qua, các dạng bài đã ôn tập gần đây), loại bỏ hoàn toàn cơ chế trừ điểm Elo trùng lặp khi 1 câu có nhiều tag. Tự động ghi nhận các câu làm sai vào danh sách luyện tập ngay khi học sinh nộp Quiz.

### 3. Trình làm bài tập & Ôn tập Ngắt quãng Spaced Repetition (Cổng Học sinh)
* **Làm Quiz ôn tập & Tải file bài tập**: Học sinh xem thông tin Buổi học N, tải file tài liệu & bài tập đính kèm (tự luận, đọc hiểu, viết lại câu) do gia sư giao, đồng thời làm **Quiz ôn tập trực tuyến** (trắc nghiệm), biết ngay kết quả và đọc **Lời giải thích chi tiết (AI Explanation)** cho từng câu Quiz làm chưa đúng.
* **Tính năng Ôn tập kiến thức ngắt quãng (Spaced Repetition tinh gọn)**: Tự động ghi nhận các câu hỏi học sinh làm sai và đưa vào **Danh sách luyện tập (Wrong Question Review Bank)** để học sinh ôn tập lại ở các lần làm Quiz tiếp theo cho đến khi thành thạo.
* **Vòng lặp học tập khép kín (Closed Loop)**:
  $$\text{Học sinh làm sai câu Quiz Buổi N} \xrightarrow{} \text{Tự động lưu vào Danh sách luyện tập \& Cập nhật Student Elo Rating (CEFR A1-C2)} \xrightarrow{} \text{Học sinh ôn tập lại các câu làm sai trong Ngân hàng câu sai}$$
* **Báo cáo tiến bộ cá nhân & Thống kê Thói quen/Lỗi sai**: Phân tách rõ ràng giữa **Chỉ số Chăm chỉ** (tỷ lệ hoàn thành Quiz ôn tập & nộp bài đính kèm đúng hạn) và **Biểu đồ Năng lực** (kết quả bài kiểm tra & biến động Student Elo), bổ sung **Thống kê Lỗi sai theo Tags** (phân tích các dạng câu hỏi hay làm sai nhiều nhất trong 2 tuần qua, các chủ điểm đã ôn tập gần đây).

### 4. Quản lý ghép lớp & Tiếp nhận khiếu nại (Cổng Lễ tân)
* **Xử lý ghép lớp (Match Request Management)**: Tiếp nhận Form tìm gia sư từ phụ huynh ➔ Gọi điện tư vấn ➔ Tạo **Match Offer** gửi tới Gia sư phù hợp.
* **Tiếp nhận & Hỗ trợ khiếu nại**: Tiếp nhận yêu cầu đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`) từ phụ huynh/gia sư và hỗ trợ tư vấn ban đầu.

### 5. Quản lý Phê duyệt Tài chính & Giám sát Hệ thống (Cổng Quản trị viên / Admin)
* **Phê duyệt phí nhận lớp qua QR Proof**: Phê duyệt minh chứng chuyển khoản phí nhận lớp (QR proof) của gia sư để mở khóa đầy đủ thông tin liên hệ của phụ huynh.
* **Quản lý & Đối soát Khiếu nại (Financial Reconciliation)**: Phê duyệt khiếu nại đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`), giám sát đối soát tài chính cân đối với doanh thu thu vào.
* **Bảo mật & Audit Log**: Phân quyền Row-level security nghiêm ngặt theo bảng `Enrollment` và tự động ghi **Audit Log** chi tiết cho các thao tác trọng yếu.

## What Makes This Different

* **Nhật ký bài học công khai (Public Class Log Work)**: Giúp phụ huynh nắm chính xác nội dung học và bài tập dặn dò của con sau mỗi buổi dạy một cách tinh gọn, frictionless.
* **AI Revision Quiz Generator hỗ trợ sinh Quiz ôn tập gắn tại Buổi học**: Không gian làm việc AI tương tác với khả năng chỉnh sửa trực quan (Inline Editing), auto-load context bài học thực tế giúp gia sư tạo Quiz ôn tập chuẩn SKP siêu tốc; bài tập về nhà đa dạng (tự luận, đọc hiểu, viết lại câu...) được đính kèm linh hoạt dạng file.
* **Vòng lặp học tập khép kín**: Kết hợp Student Knowledge Profile (Điểm Elo tổng thể của Học sinh dựa trên phân cấp độ khó CEFR A1-C2) và Spaced Repetition tinh gọn (Ngân hàng câu hỏi làm sai), AI sinh sẵn metadata giúp hệ thống tự động chấm điểm và cập nhật tri thức người học sau mỗi bài nộp.

## Who This Serves

* **Phụ huynh**: Tìm gia sư phù hợp và gửi đăng ký học thử dễ dàng; xem nhật ký bài học từng buổi (Public Log Work), các tài liệu/bài tập đính kèm và theo dõi báo cáo tiến bộ định lượng thực chất của con.
* **Gia sư**: Soạn khung chương trình master plan, quản lý buổi học thực tế linh hoạt, upload file bài tập đính kèm (tự luận, đọc hiểu, viết lại câu...) và tạo Quiz ôn tập chuẩn SKP qua AI Workspace chỉ trong 1-3 phút.
* **Học sinh**: Mở từng Buổi học tải file bài tập/tài liệu đính kèm và làm Quiz ôn tập online tiện lợi, biết ngay kết quả và đọc lời giải thích chi tiết AI; tự động ôn tập lại các câu làm sai qua Danh sách luyện tập (Spaced Repetition tinh gọn).
* **Lễ tân**: Quản lý ghép lớp (Match Request), gọi điện tư vấn, tạo Match Offer gửi gia sư và tiếp nhận xử lý khiếu nại ban đầu.
* **Quản trị viên (Admin)**: Phê duyệt thanh toán phí nhận lớp qua QR proof, xử lý khiếu nại cấp cao (`REMATCH`, `REFUND`), xuất báo cáo đối soát tài chính và quản trị hệ thống.

## Success Criteria

Các chỉ số đo lường thành công cốt lõi của sản phẩm (KPIs / Metrics):

1. **Hiệu suất soạn bài & Vận hành của Gia sư**:
   * **< 3 phút/buổi dạy**: Thời gian trung bình để gia sư cập nhật Nhật ký dạy học (Log Work), đính kèm file bài tập và khởi tạo Quiz ôn tập bám sát SKP thông qua AI Workspace.
2. **Tỷ lệ tiếp thu & Ghi nhớ của Học sinh**:
   * **100%**: Tất cả các câu hỏi Quiz ôn tập đều có đáp án và Lời giải thích chi tiết từ AI.
   * **100% câu làm sai**: Được hệ thống tự động lưu vào Ngân hàng câu hỏi làm sai (Wrong Question Review Bank) để học sinh chủ động xem lại và luyện tập lại.
   * **> 85%**: Tỷ lệ hoàn thành Quiz ôn tập đúng hạn của học sinh giữa các buổi học.
3. **Khả năng theo dõi & Đánh giá đối với Phụ huynh**:
   * **100% buổi dạy**: Đều có Nhật ký bài học công khai (Public Class Log Work) và danh sách bài tập/tài liệu đính kèm đầy đủ.
   * **> 90%**: Phụ huynh phản hồi hài lòng về khả năng theo dõi tiến độ và chỉ số năng lực định lượng (Student Elo Rating & Biểu đồ lỗi sai theo Tags).
4. **Tốc độ xử lý vận hành & Kiểm soát bảo mật**:
   * **< 24 giờ**: Thời gian xử lý phê duyệt minh chứng phí nhận lớp (QR Proof) và giải quyết các khiếu nại (`REMATCH`, `REFUND`).
   * **100%**: Thao tác tài chính và phân quyền truy cập dữ liệu được kiểm soát nghiêm ngặt qua phân quyền RLS theo `Enrollment` và lưu vết Audit Log đầy đủ.

## Scope

### Nằm trong phạm vi (In-Scope):
* **Cổng Phụ huynh**: Landing Page, Form Tìm Gia Sư & Đăng ký Học thử, Xem hồ sơ gia sư verified, Xem nhật ký bài học từng buổi (Public Class Log Work) và báo cáo tiến bộ của con.
* **Cổng Gia sư**: Quản lý lớp & thời khóa biểu, Khung chương trình học (Curriculum Roadmap tinh gọn 2 cấp), **Quản lý Buổi học thực tế & Nhật ký dạy học tinh gọn (Daily Lesson Sessions & Log Work)**, Upload file tài liệu & bài tập đính kèm (tự luận, đọc hiểu, viết lại câu...), **Tutor Assistant qua AI Workspace** tại Chi tiết Buổi học (sinh Quiz ôn tập bám sát context buổi học, tự động chấm điểm & cập nhật SKP), Xem báo cáo SKP học sinh.
* **Cổng Học sinh**: Xem Buổi học N, tải tài liệu & file bài tập đính kèm, Làm Quiz ôn tập online (Trắc nghiệm, Điền từ, Phản xạ nhanh), Chấm điểm Quiz tự động, Xem lời giải thích chi tiết AI từng câu Quiz, **Ôn tập kiến thức ngắt quãng Spaced Repetition tinh gọn (Ngân hàng câu hỏi làm sai / Wrong Question Review Bank)**, Xem báo cáo tiến độ (Chăm chỉ & Năng lực).
* **Cổng Lễ tân**: Quản lý yêu cầu ghép lớp (Match Request Management), Duyệt thanh toán phí nhận lớp (QR Proof upload), Quản lý danh sách Gia sư & Học sinh, Tiếp nhận khiếu nại (Complaint Management).
* **Cổng Quản trị viên**: Giám sát ghép lớp & điều phối tổng thể, Phê duyệt phí nhận lớp & Đối soát tài chính tập trung, Giám sát và xử lý khiếu nại tổng thể (`REMATCH`, `REFUND`), Báo cáo vận hành & Xuất dữ liệu (Excel/PDF), Phân quyền RLS theo `Enrollment` & Audit Log.
* **Hạ tầng Backend & Auth**: Cơ chế phân quyền truy cập nâng cao theo `Enrollment`, CSDL lưu trữ thông tin nghiệp vụ (SKP, Wrong Question Bank, Sessions, Audit Logs) và tích hợp AI Service.

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

Trở thành nền tảng vận hành và tối ưu chất lượng giảng dạy tiêu chuẩn cho các trung tâm gia sư tiếng Anh thế hệ mới, nơi công nghệ AI và Spaced Repetition đóng vai trò đòn bẩy nâng cao hiệu suất của gia sư, giúp học sinh ghi nhớ sâu sắc và cập nhật tiến độ học tập cho phụ huynh qua nhật ký bài học thực tế.
