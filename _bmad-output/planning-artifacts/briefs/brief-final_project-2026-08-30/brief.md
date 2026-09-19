---
title: Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-30
updated: 2026-09-19
---

# Product Brief: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Executive Summary

Hệ thống là nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1, tổ chức theo 4 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân & Quản trị viên). Phạm vi sản phẩm được thiết kế tinh gọn, tập trung 100% giá trị đổi mới sáng tạo vào quy trình vận hành và giảng dạy thực tế sau khi nhận lớp (Giai đoạn B).

Sản phẩm kết hợp giữa công nghệ Web hiện đại, Trí tuệ nhân tạo (LLM) và Khoa học nhận thức (Spaced Repetition):
1. **Quy trình ghép lớp & Vận hành trung tâm (Phụ huynh - Lễ tân - Admin)**: Phụ huynh chọn tiêu chí qua Form tìm gia sư; Lễ tân/Admin tạo Match Offer, chuyển lớp cho gia sư và phê duyệt phí nhận lớp qua minh chứng chuyển khoản (QR Proof).
2. **Bộ công cụ cá nhân hóa giảng dạy (Gia sư - Học sinh - Trọng tâm cốt lõi)**: Gia sư chủ trì việc **sinh bài tập cá nhân hóa dựa trên Student Knowledge Profile (SKP)** của từng học sinh qua cơ chế **Tutor Assistant Dual-Mode** (Direct AI Generation hoặc Import File 0 Token Cost từ ChatGPT/Claude ngoài). Học sinh làm bài trên ứng dụng, nhận chấm điểm tức thì kèm lời giải thích AI chi tiết, đồng thời được tự động củng cố kiến thức ngắt quãng theo thuật toán **Spaced Repetition (SM-2)**.

## The Problem

Thị trường gia sư tiếng Anh 1-1 hiện tại đang đối mặt với các nút thắt lớn trong quy trình vận hành và giảng dạy thực tế sau khi nhận lớp:

* **Gia sư**: Phần lớn là sinh viên hoặc giáo viên dạy thêm, gặp nhiều khó khăn trong việc thiết kế bài tập cá nhân hóa phù hợp chính xác với năng lực và điểm yếu của từng học sinh do thiếu công cụ phân tích và số liệu thống kê định lượng. Việc theo dõi toàn bộ tiến trình học tập, sự cải thiện các kỹ năng yếu cũng như các dạng lỗi sai hay mắc của từng học sinh chủ yếu dựa trên ghi nhớ thủ công, tốn nhiều thời gian và công sức.
* **Học sinh**: Thiếu động lực và không được giải thích lỗi sai kịp thời khi làm bài tập trực tuyến. Nếu không có thời gian ôn tập định kỳ đúng thời điểm, kiến thức sẽ nhanh chóng bị quên đi theo đường cong quên lãng (Ebbinghaus curve).
* **Phụ huynh**: Thiếu thông tin giám sát tiến độ thực tế của con. Các báo cáo từ gia sư thường mang tính định tính cảm tính mà không có số liệu định lượng bài tập và kỹ năng rõ ràng.
* **Trung tâm / Admin**: Quản lý ghép lớp và đối soát phí thủ công qua Zalo/Messenger rải rác, khó theo dõi tình trạng lớp học và giải quyết các khiếu nại đổi gia sư/hoàn tiền.

## The Solution

Sản phẩm cung cấp giải pháp web tích hợp gồm 4 cổng người dùng hoạt động đồng bộ với Backend Spring Boot (API Gateway, phân quyền RLS theo `Enrollment`) và AI Service (Python):

### 1. Form Tìm Gia Sư & Đăng ký Học thử (Cổng Phụ huynh)
* Phụ huynh chọn tiêu chí qua Form tìm gia sư trực quan (Lớp/Mục tiêu của con, Yêu cầu gia sư, Khung giờ rảnh).
* Hệ thống hiển thị danh sách gia sư phù hợp kèm thông tin kinh nghiệm và video tự giới thiệu.
* Phụ huynh chọn gia sư và bấm **"Đăng ký học thử"** (xác thực nhanh qua SĐT).

### 2. Bộ công cụ Soạn bài cá nhân hóa & Quản lý Chương trình (Cổng Gia sư)
* **Quản lý Khung chương trình học (Curriculum Management Dual-Mode)**: Tạo lộ trình bài học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) thủ công hoặc sử dụng AI sinh nháp trong 3-5s (Option A) / Import file JSON/Text từ ChatGPT ngoài (Option B - 0 Token Cost).
* **Sinh Bài Tập Cá Nhân Hóa Dựa Trên Student Knowledge Profile (Tutor Assistant Dual-Mode)**:
  * **Ai sinh & Như thế nào**: Gia sư là người trực tiếp khởi tạo bài tập trên Cổng Gia sư bằng cách nhập nội dung vừa dạy hoặc chủ đề cần giao. Hệ thống Backend tự động truy xuất dữ liệu từ **Student Knowledge Profile (SKP)** của học sinh (gồm: Điểm thành thạo micro-skill cập nhật qua thuật toán **Elo Rating**, Confidence Score, Error Patterns mapped với kho nhãn lỗi, điểm mạnh/yếu và mục tiêu học tập) để làm bối cảnh đầu vào thích ứng (**Adaptive Input Context**). AI sẽ sinh bộ bài tập cá nhân hóa (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) tập trung chính xác vào điểm yếu và trình độ của học sinh đó, kèm đáp án và lời giải thích chi tiết.
  * **Option A — Direct AI Generation (1-Click trong App)**: Backend đóng gói SKP context và gọi REST API sang Python AI Service (`gpt-4o-mini` / `Gemini Flash`) để sinh bài tập nháp chuẩn xác chỉ trong 3–5 giây.
  * **Option B — Import Structured File (0 Token Cost)**: Gia sư tải Prompt Mẫu đã đóng gói sẵn cấu trúc SKP từ hệ thống, dán vào ChatGPT/Claude/DeepSeek miễn phí ở ngoài, rồi upload file JSON/Text kết quả lên hệ thống để trích xuất bài tập tự động với **0 chi phí API token**.
* **Duyệt & Giao bài tức thì**: Gia sư xem lại nháp, tùy chỉnh câu hỏi/đáp án ngay trên điện thoại và bấm **"Giao bài"** để chuyển sang Cổng Học sinh.

### 3. Trình làm bài tập & Ôn tập Ngắt quãng Spaced Repetition (Cổng Học sinh)
* **Làm bài & Chấm điểm tức thì**: Học sinh làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi, viết lại câu), biết ngay kết quả và đọc **Lời giải thích chi tiết (AI Explanation)** cho từng câu làm sai.
* **Tính năng Ôn tập kiến thức ngắt quãng (Spaced Repetition)**: Áp dụng thuật toán **SM-2** tự động lựa chọn và lập lịch các câu hỏi/kiến thức sắp đến hạn ôn tập (`next_review`) dựa trên lịch sử làm bài trước đó (câu làm sai, lỗi hay mắc, kiến thức lâu chưa ôn) giúp học sinh ghi nhớ dài hạn.
* **Vòng lặp cá nhân hóa khép kín (Closed Loop)**:
  $$\text{Học sinh làm bài} \xrightarrow{} \text{Cập nhật SKP (Elo rating, Error patterns)} \xrightarrow{} \text{Cập nhật Spaced Repetition (SM-2)} \xrightarrow{} \text{Daily Job chọn ôn tập} \xrightarrow{} \text{Tutor Assistant sinh bài mới chuẩn SKP}$$
* **Báo cáo tiến bộ cá nhân**: Phân tách minh bạch giữa **Chỉ số Chăm chỉ** (tỷ lệ hoàn thành bài về nhà đúng hạn) và **Biểu đồ Năng lực** (kết quả bài kiểm tra định kỳ).

### 4. Quản lý Vận hành & Phê duyệt Tài chính (Cổng Lễ tân & Cổng Admin)
* **Xử lý ghép lớp (Match Request Management)**: Lễ tân/Admin tiếp nhận Form từ phụ huynh ➔ Gọi điện tư vấn ➔ Tạo **Match Offer** gửi tới Gia sư.
* **Phê duyệt phí nhận lớp qua QR Proof**: Gia sư nhận lớp, chuyển khoản phí nhận lớp sau 1 tháng dạy và tải ảnh biên lai (QR proof) ➔ Lễ tân/Admin đối soát khớp lệnh và bấm "Phê duyệt phí" để mở khóa đầy đủ thông tin liên hệ của phụ huynh.
* **Quản lý & Giám sát Khiếu nại (Complaint Management & Financial Reconciliation)**: Tiếp nhận khiếu nại đổi gia sư (`REMATCH`) hoặc hoàn tiền (`REFUND`), giám sát tiến độ xử lý và tổng hợp số tiền hoàn trả để đối soát tài chính cân đối với doanh thu thu vào.
* **Bảo mật & Audit Log**: Phân quyền Row-level security nghiêm ngặt theo bảng `Enrollment` (Gia sư chỉ xem được dữ liệu lớp mình phụ trách) và tự động ghi **Audit Log** chi tiết cho các thao tác trọng yếu (tạo Offer, duyệt phí, xử lý khiếu nại, giao bài).

## What Makes This Different

* **Vòng lặp cá nhân hóa khép kín nhờ Student Knowledge Profile & Elo Rating**: Không gửi prompt chung chung cho AI mà xây dựng "bộ nhớ dài hạn" SKP cập nhật điểm thành thạo năng động theo thuật toán Elo Rating sau từng câu trả lời.
* **Tutor Assistant Dual-Mode tích hợp SKP**: Giúp gia sư sinh bài tập cá nhân hóa siêu tốc trong 3-5 giây (Option A) hoặc sử dụng Prompt Mẫu nhúng SKP chạy trên ChatGPT ngoài để import vào hệ thống với **0 Token Cost** (Option B).
* **Kết hợp Spaced Repetition (SM-2)**: Đảm bảo học sinh không chỉ làm bài tập mới mà còn được nhắc ôn lại những kiến thức sắp quên đúng thời điểm theo khoa học ghi nhớ.
* **Giải pháp vận hành toàn diện cho trung tâm**: Bao quát trọn vẹn từ khâu phụ huynh tìm gia sư ➔ lễ tân ghép lớp ➔ admin duyệt phí nhận lớp / xử lý khiếu nại ➔ gia sư giảng dạy & giao bài AI ➔ học sinh làm bài & ôn tập ngắt quãng.

## Who This Serves

* **Phụ huynh**: Tìm gia sư phù hợp và gửi đăng ký học thử dễ dàng; theo dõi báo cáo tiến bộ định lượng thực chất của con.
* **Gia sư**: Soạn khung chương trình và bài tập cá nhân hóa chuẩn SKP siêu tốc trong 1-3 phút trên điện thoại/máy tính; nhận lớp và quản lý thời khóa biểu minh bạch.
* **Học sinh**: Làm bài tập online tiện lợi, biết ngay kết quả và đọc lời giải thích chi tiết AI; tự động ôn tập kiến thức sắp quên qua Spaced Repetition.
* **Lễ tân & Quản trị viên (Admin)**: Quản lý ghép lớp, duyệt thanh toán phí nhận lớp qua QR proof, xử lý khiếu nại đổi gia sư/hoàn tiền và xuất báo cáo đối soát tài chính.

## Success Criteria

*(Ghi chú: Section này tạm thời ghi nhận và sẽ được rà soát, chuẩn hóa thành các chỉ số đo lường/nghiệm thu cụ thể [TBD] sau)*

* **Tốc độ đăng ký học thử**: Phụ huynh hoàn thành Form tìm gia sư và gửi yêu cầu đăng ký học thử dễ dàng, tinh gọn.
* **Thời gian chuẩn bị bài của Gia sư**: Giảm thời gian soạn và giao bài tập cá nhân hóa xuống dưới 3 phút/buổi dạy.
* **Trải nghiệm học tập & Ghi nhớ**: 100% bài tập có đáp án và lời giải thích chi tiết AI; tính năng Spaced Repetition gợi ý chính xác các câu hỏi cần ôn tập đến hạn.
* **Tốc độ xử lý vận hành trung tâm**: Phê duyệt phí nhận lớp QR Proof và điều phối khiếu nại mượt mà, ghi vết Audit Log đầy đủ.

## Scope

### Nằm trong phạm vi (In-Scope):
* **Cổng Phụ huynh**: Landing Page, Form Tìm Gia Sư & Đăng ký Học thử, Xem hồ sơ gia sư verified.
* **Cổng Gia sư**: Quản lý lớp & thời khóa biểu, Curriculum Management Dual-Mode (tinh gọn tối đa 2 cấp: Chủ đề/Chương ➔ Bài học), **Tutor Assistant Dual-Mode** (Sinh bài tập cá nhân hóa dựa trên SKP qua Direct AI Generation hoặc Import File 0 Token Cost), Duyệt & Giao bài tức thì, Xem báo cáo SKP học sinh.
* **Cổng Học sinh**: Làm bài tập online (Trắc nghiệm, Điền từ, Sửa lỗi, Viết lại câu), Chấm điểm tự động, Xem lời giải thích chi tiết AI từng câu, **Ôn tập kiến thức ngắt quãng Spaced Repetition (Thuật toán SM-2)**, Xem báo cáo tiến độ (Chăm chỉ & Năng lực).
* **Cổng Lễ tân**: Quản lý yêu cầu ghép lớp (Match Request Management), Duyệt thanh toán phí nhận lớp (QR Proof upload), Quản lý danh sách Gia sư & Học sinh, Tiếp nhận khiếu nại (Complaint Management).
* **Cổng Quản trị viên**: Giám sát ghép lớp & điều phối tổng thể, Phê duyệt phí nhận lớp & Đối soát tài chính tập trung, Giám sát và xử lý khiếu nại tổng thể (`REMATCH`, `REFUND`), Báo cáo vận hành & Xuất dữ liệu (Excel/PDF), Phân quyền RLS theo `Enrollment` & Audit Log.
* **Hạ tầng Backend & Auth**: Phân quyền Spring Boot theo `Enrollment`, PostgreSQL (lưu SKP, SM-2 schedules, errors, audit logs), Docker deployment.

### Nằm ngoài phạm vi (Out-of-Scope):
* Không hỗ trợ khung chương trình học đa cấp phức tạp >2 cấp.
* Không AI Advisor Chatbot tư vấn tự do trên trang chủ (thay bằng Form tìm gia sư trực quan).
* Không Admin Live Chat Monitor & Takeover Mode.
* Không Student Socratic Chat Assistant (thay bằng Auto-Grade + AI Explanations + Spaced Repetition).
* Không tích hợp cuộc gọi video trực tuyến (dạy qua Zoom/Meet bên ngoài).
* Không thanh toán học phí trực tuyến tự động qua cổng thanh toán (duyệt minh chứng chuyển khoản QR Proof thủ công).

## Vision

Trở thành nền tảng vận hành và tối ưu chất lượng giảng dạy tiêu chuẩn cho các trung tâm gia sư tiếng Anh thế hệ mới, nơi công nghệ AI và Spaced Repetition đóng vai trò đòn bẩy nâng cao hiệu suất của gia sư, giúp học sinh ghi nhớ sâu sắc và minh bạch hóa tiến độ học tập cho phụ huynh.
