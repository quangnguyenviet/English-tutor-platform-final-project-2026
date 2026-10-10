---
title: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: active
created: 2026-08-31
updated: 2026-10-10
---

# PRD: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## 0. Document Purpose

Tài liệu PRD này định nghĩa các yêu cầu nghiệp vụ và kỹ thuật chuẩn hóa cho hệ thống hỗ trợ vận hành và giảng dạy gia sư tiếng Anh 1-1 có tích hợp AI (LLM) và Phương pháp Ôn tập Ngắt quãng (Spaced Repetition tinh gọn). Tài liệu làm cơ sở cho thiết kế UX/UI, kiến trúc hệ thống backend/frontend và phân rã các user story cho các nhóm phát triển.

## 1. Vision

Nền tảng Web **single-tenant** thiết kế riêng để hỗ trợ vận hành mô hình gia sư tiếng Anh 1-1, tổ chức theo **5 cổng người dùng (Phụ huynh, Gia sư, Học sinh, Lễ tân, Quản trị viên)**.

Sản phẩm kết hợp giữa công nghệ Web hiện đại, Trí tuệ nhân tạo (LLM) và phương pháp ôn tập ngắt quãng (Spaced Repetition):
- **Phụ huynh**: Tìm gia sư nhanh qua Form tìm gia sư trên Landing Page, đăng ký học thử đơn giản và xem báo cáo **Nhật ký bài học (Public Class Log Work)** từng buổi cùng các tệp bài tập/tài liệu đính kèm để theo dõi sự tiến bộ định lượng của con.
- **Gia sư**: Nhận lớp, quản lý Khung chương trình học (Curriculum Roadmap Master Plan 2 cấp), quản lý các **Buổi học thực tế (Daily Lesson Sessions)** với 1 ô **Nhật ký bài học (Public Class Log Work)** công khai 3 bên và các **Tài liệu & Bài tập đính kèm (Uploaded Attachments)** (Word/PDF/Slides cho các dạng bài tự luận, viết lại câu, đọc hiểu...). Chủ trì việc sinh Quiz ôn tập bám sát bối cảnh bài học và **Student Knowledge Profile (SKP)** qua **AI Workspace** (Direct AI Generation hoặc Import File 0 Token Cost) để củng cố nhanh kiến thức, không đóng vai trò giao toàn bộ bài tập về nhà.
- **Học sinh**: Mở từng Buổi học tải file bài tập đính kèm do gia sư giao, làm **Quiz ôn tập trực tuyến**, nhận chấm điểm tức thì kèm **Lời giải thích chi tiết (AI Explanation)** và tự động củng cố kiến thức ngắt quãng (Spaced Repetition tinh gọn: các câu làm sai tự động lưu vào **Danh sách luyện tập / Wrong Question Review Bank** để ôn lại ở các buổi sau).
- **Lễ tân**: Quản lý ghép lớp (Match Request Management), gọi điện tư vấn, tạo Match Offer gửi gia sư, duyệt thanh toán phí nhận lớp qua minh chứng chuyển khoản (QR Proof) và tiếp nhận xử lý khiếu nại ban đầu.
- **Quản trị viên (Admin)**: Phê duyệt minh chứng chuyển khoản phí nhận lớp (QR Proof) của gia sư để mở khóa đầy đủ thông tin liên hệ phụ huynh, xử lý khiếu nại cấp cao (`REMATCH`, `REFUND`), xuất báo cáo đối soát tài chính và quản trị hệ thống.

---

## 2. Target User

### 2.1 Jobs To Be Done (JTBD)

* **Phụ huynh (Người chi trả)**:
  * *Functional*: Muốn tìm kiếm gia sư tiếng Anh phù hợp qua Form tìm gia sư và đăng ký học thử nhanh chóng. Muốn xem nhật ký bài học thực tế từng buổi (Public Class Log Work) và các tệp bài tập đính kèm để nắm rõ con học gì mỗi ngày. Muốn theo dõi sát sao chỉ số chăm chỉ và biểu đồ năng lực tiến bộ của con.
  * *Emotional*: Cảm thấy yên tâm, tin tưởng vào sự minh bạch và chất lượng dịch vụ của trung tâm; hào hứng khi thấy con tiến bộ rõ rệt.
* **Gia sư (Người dạy)**:
  * *Functional*: Muốn xây dựng khung chương trình master plan dài hạn, quản lý các buổi học thực tế linh hoạt kèm file đính kèm bài tập (tự luận, đọc hiểu, viết lại câu...). Muốn sinh nhanh **Quiz ôn tập bám sát SKP** qua **AI Workspace** gắn tại từng buổi học chỉ trong 1-3 phút để giúp học sinh củng cố kiến thức.
  * *Emotional*: Tự tin, giữ vững uy tín chuyên nghiệp trước phụ huynh mà không tốn nhiều thời gian cho các công việc hành chính hay soạn bài tập trắc nghiệm thủ công.
* **Học sinh (Người học)**:
  * *Functional*: Muốn xem thông tin Buổi học N, tải file bài tập đính kèm và làm Quiz ôn tập online tiện lợi trên thiết bị cá nhân. Muốn biết ngay kết quả bài làm và đọc Lời giải thích chi tiết AI cho từng câu làm chưa đúng. Muốn được tự động lưu câu làm sai vào Danh sách luyện tập để ôn lại ngắt quãng mà không bị hổng kiến thức.
  * *Emotional*: Cảm thấy việc học nhẹ nhàng, không bị nản lòng hay áp lực vì bài tập vừa sức và luôn có giải thích AI rõ ràng.
* **Quản trị viên (Admin - Người vận hành)**:
  * *Functional*: Muốn điều phối ghép lớp, kiểm tra phê duyệt phí nhận lớp qua QR proof của gia sư để mở khóa thông tin liên hệ phụ huynh. Muốn quản lý lễ tân, giám sát và đối soát tài chính khiếu nại (`REMATCH`, `REFUND`) cân đối với doanh thu.
  * *Emotional*: Cảm thấy quy trình vận hành trung tâm diễn ra trơn tru, chuẩn xác, giảm thiểu tranh chấp và tối ưu hiệu quả doanh thu.
* **Lễ tân (Receptionist - Người hỗ trợ vận hành)**:
  * *Functional*: Muốn tiếp nhận Form tìm gia sư từ phụ huynh, tạo Match Offer gửi tới gia sư phù hợp, duyệt minh chứng chuyển khoản (QR proof) và tiếp nhận ghi nhận khiếu nại trực tiếp tại trung tâm.
  * *Emotional*: Cảm thấy tác vụ hỗ trợ vận hành minh bạch, có luồng xử lý rõ ràng và không bỏ sót yêu cầu của khách hàng.

### 2.2 Non-Users (v1)

* Học sinh học theo nhóm lớn hoặc lớp học tập trung (hệ thống chỉ phục vụ mô hình gia sư 1-1).
* Tương tác học trực tuyến qua video call tích hợp (sử dụng công cụ bên thứ ba như Zoom/Meet).

### 2.3 Key User Journeys

* **UJ-1. Chị Lan (Phụ huynh) tìm gia sư qua Form, đăng ký học thử và xem Báo cáo Nhật ký bài học của con**
  * **Persona + Context**: Chị Lan cần tìm gia sư nữ dạy kèm tiếng Anh cho bé Nam (10 tuổi) phát âm yếu và hay quên bài.
  * **Entry State**: Chưa đăng nhập, truy cập Landing Page của trung tâm.
  * **Path**:
    1. Chị Lan điền Form tìm gia sư 4 bước (Mục tiêu học tập ➔ Yêu cầu gia sư & Học phí ➔ Lịch học & Liên hệ ➔ Xác nhận hồ sơ).
    2. Hệ thống tạo bản ghi Match Request trạng thái `PENDING` và hiển thị Popup thông báo tiếp nhận thành công.
    3. Sau khi được Lễ tân tư vấn và xếp lớp, chị Lan nhận tài khoản Phụ huynh.
    4. Sau mỗi buổi dạy, chị Lan đăng nhập Cổng Phụ huynh, xem **Buổi học thực tế N** để đọc báo cáo **Nhật ký bài học (Public Class Log Work)** và kiểm tra các tài liệu/bài tập đính kèm do gia sư upload.
    5. Chị Lan xem **Báo cáo tiến bộ cá nhân** của Nam (tỷ lệ hoàn thành Quiz & Biểu đồ năng lực Student Elo).
  * **Climax**: Chị Lan hoàn toàn yên tâm vì nắm được nội dung học thực tế từng buổi của con một cách công khai, minh bạch.
  * **Resolution**: Chị Lan duy trì việc cho Nam học lâu dài tại trung tâm.

* **UJ-2. Minh (Gia sư) nhận Match Offer, nộp phí nhận lớp qua QR Proof, tạo Khung chương trình master plan, quản lý Buổi học thực tế & sinh Quiz ôn tập qua AI Workspace**
  * **Persona + Context**: Minh, sinh viên đại học chuyên ngành Tiếng Anh, làm gia sư 1-1.
  * **Entry State**: Đã đăng nhập Cổng Gia sư.
  * **Path**:
    1. Minh xem Match Offer đề xuất lớp dạy bé Nam. Minh bấm "Chấp nhận" ➔ Hệ thống yêu cầu nộp phí nhận lớp kèm mã VietQR động.
    2. Minh chuyển khoản và upload ảnh biên lai (QR proof) ➔ Lễ tân/Admin bấm "Phê duyệt" ➔ Hệ thống **tự động mở khóa SĐT & Địa chỉ Phụ huynh**.
    3. Minh khởi tạo **Khung chương trình học (Curriculum Roadmap Master Plan)** 2 cấp (*Chủ đề/Chương ➔ Bài học*) bằng cách nhập thủ công hoặc chọn mẫu lộ trình có sẵn.
    4. **Quản lý Buổi học N & Bài tập đính kèm**:
       - Minh mở **Buổi học thực tế N** (độc lập với Roadmap).
       - Minh upload các file đính kèm bài tập về nhà (Word/PDF bài đọc hiểu, viết lại câu, tự luận) và gõ 1-2 câu vào ô **Nhật ký bài học (Public Class Log Work)** để báo cáo nội dung hôm nay đã dạy.
    5. **Sinh Quiz ôn tập qua AI Workspace**:
       - Tại màn hình Chi tiết Buổi học N, Minh bấm **"Tạo Quiz với AI"** ➔ Mở giao diện **AI Workspace (Split-Screen)**.
       - **Dock Phải (Assistance Dock - Tab 1 Form Config)**: Hệ thống tự động **Auto-load Context** từ Buổi N (Tài liệu đính kèm & Log Work) gộp cùng dữ liệu **SKP** của Nam. Minh chọn số câu Quiz, độ khó và bấm `⚡ Sinh bài tập với AI` (Direct AI Gen 3-5s hoặc Import Structured File 0 Token Cost).
       - **Canvas Trái (Main Canvas)**: Hiển thị thẻ câu hỏi Quiz. Minh thực hiện **Inline Editing** trực tiếp (câu hỏi, đáp án, lời giải thích AI). Minh có thể dùng **Tab 2 (Chat Freestyle Co-pilot)** để chỉnh sửa linh hoạt theo ý muốn.
    6. Minh rà soát và bấm **"Giao Quiz"** cho Nam.
  * **Climax**: Bài tập đính kèm tự luận được upload nhanh chóng và Quiz ôn tập cá nhân hóa chuẩn SKP được khởi tạo trong chưa đầy 2 phút.
  * **Resolution**: Minh hoàn thành công tác giảng dạy trơn tru và nhận được đánh giá cao từ phụ huynh.

* **UJ-3. Nam (Học sinh) làm bài tập Buổi N, nộp Quiz ôn tập, đọc Lời giải thích AI và Ôn tập Ngắt quãng (Spaced Repetition tinh gọn)**
  * **Persona + Context**: Nam, 10 tuổi, học sinh 1-1.
  * **Entry State**: Đã đăng nhập Cổng Học sinh.
  * **Path**:
    1. Nam mở **Buổi học N**, tải file tài liệu & bài tập đính kèm (tự luận, đọc hiểu...) để làm bài theo dặn dò của gia sư.
    2. Nam làm **Quiz ôn tập trực tuyến** (trắc nghiệm) gắn tại Buổi N và bấm "Nộp bài".
    3. Hệ thống **tự động chấm điểm tức thì** và hiển thị **Lời giải thích chi tiết (AI Explanation)** cho từng câu làm chưa đúng.
    4. Backend sử dụng metadata của Quiz (CEFR difficulty A1-C2) để tự động cập nhật điểm **Student Elo Rating** (tách biệt hoàn toàn khỏi tags). Đồng thời, các câu làm sai tự động được đưa vào **Danh sách luyện tập (Wrong Question Review Bank)**.
    5. Hàng ngày, Nam vào mục **"Ôn tập ngắt quãng"** để luyện tập lại các câu hỏi trong Ngân hàng câu sai cho đến khi thành thạo.
  * **Climax**: Nam hiểu sâu lỗi sai ngay lập tục qua Lời giải thích AI và chủ động khắc phục điểm yếu qua Spaced Repetition tinh gọn.
  * **Resolution**: Trình độ tiếng Anh của Nam tiến bộ rõ rệt qua từng tuần.

* **UJ-4. Anh Bình (Admin) & Lễ tân tư vấn ghép lớp, phê duyệt phí nhận lớp qua QR Proof và quản lý khiếu nại đối soát tài chính**
  * **Persona + Context**: Anh Bình (Admin) và Lễ tân trung tâm gia sư.
  * **Entry State**: Đã đăng nhập Admin Dashboard / Receptionist Portal.
  * **Path**:
    1. Lễ tân tiếp nhận Form tìm gia sư từ chị Lan ➔ Gọi điện tư vấn ➔ Bấm **"Tạo Match Offer"** gửi tới Cổng Gia sư của Minh.
    2. Gia sư Minh chấp nhận và upload minh chứng chuyển khoản (QR proof).
    3. Lễ tân/Admin kiểm tra ảnh biên lai khớp số tiền và bấm **"Phê duyệt phí"** ➔ Trạng thái chuyển `PAID` và hệ thống tự động **mở khóa thông tin liên hệ phụ huynh** cho gia sư.
    4. Khi phát sinh khiếu nại (`REMATCH` hoặc `REFUND`), Lễ tân tiếp nhận đơn và chuyển Admin phê duyệt đối soát tài chính cân đối doanh thu.
  * **Climax**: Lớp học được kết nối nhanh chóng, minh bạch tài chính và kiểm soát khiếu nại chặt chẽ.
  * **Resolution**: Vận hành trung tâm đạt hiệu suất cao và dữ liệu tài chính luôn cân đối.

---

## 3. Glossary

* **Student Knowledge Profile (SKP - Hồ sơ tri thức người học)**: Bộ nhớ dài hạn lưu trữ trạng thái năng lực có cấu trúc của học sinh theo thời gian, gồm: Skill Mastery (0-100), Confidence Score, Top 5 điểm mạnh/điểm yếu và **Student Elo Rating tổng thể**.
* **Student Elo Rating (CEFR A1 - C2)**: Thuật toán đánh giá trình độ năng lực học sinh dựa trên các câu hỏi Quiz phân cấp theo chuẩn CEFR (A1, A2, B1, B2, C1, C2). Điểm Elo được tính toán độc lập hoàn toàn với các tags chủ điểm, loại bỏ cơ chế trừ điểm Elo trùng lặp khi 1 câu có nhiều tag.
* **Question Tags & Error Statistics (Tags chủ điểm & Thống kê lỗi sai)**: Các nhãn phân loại nội dung câu hỏi (VD: *Past Simple, Pronoun, Listening Keyword*). Các tags được lưu giữ độc lập để phục vụ báo cáo thống kê (VD: các dạng bài hay làm sai nhiều nhất trong 2 tuần qua, các chủ điểm đã ôn tập gần đây).
* **Spaced Repetition tinh gọn (Wrong Question Review Bank - Ngân hàng câu hỏi làm sai)**: Tính năng tự động lưu trữ tất cả các câu hỏi Quiz học sinh trả lời sai vào một danh sách luyện tập tập trung. Hệ thống nhắc nhở học sinh làm lại các câu này ở các buổi tiếp theo cho đến khi trả lời đúng.
* **Curriculum Roadmap (Khung chương trình học Master Plan)**: Lộ trình bài học 2 cấp (*Chủ đề/Chương ➔ Bài học*) đóng vai trò là Kế hoạch tổng quan định hướng toàn bộ khóa học, được gia sư khởi tạo thủ công hoặc chọn từ mẫu lộ trình có sẵn.
* **Daily Lesson Sessions & Public Class Log Work (Buổi học thực tế & Nhật ký bài học)**: Dòng thời gian giảng dạy thực tế từng ngày, **độc lập kiến trúc hoàn toàn với Roadmap**. Bao gồm: Tiêu đề & Ngày giờ, **Uploaded Attachments (Tài liệu & bài tập đính kèm)** và **Public Class Log Work** (1 ô văn bản tự do minh bạch 3 bên).
* **Uploaded Attachments (Tài liệu & Bài tập đính kèm)**: Các tệp tin (PDF, Word, Slides...) do gia sư upload trực tiếp tại từng Buổi học N phục vụ bài tập về nhà đa dạng định dạng (tự luận, đọc hiểu, viết lại câu...).
* **AI Revision Quiz Generator & AI Workspace**: Công cụ sinh Quiz ôn tập bám sát bối cảnh Buổi N (Log Work & Attachments) và SKP học sinh gắn tại Chi tiết Buổi học N. Giao diện chia đôi màn hình Split-Screen (Main Canvas 65% Inline Edit + Right Dock 35% Config Form Option A/B & AI Co-pilot).
* **Match Offer & VietQR Proof**: Luồng ghép lớp trong đó Admin/Lễ tân gửi đề xuất lớp cho gia sư. Gia sư chấp nhận ➔ nộp minh chứng chuyển khoản (QR proof) ➔ Lễ tân/Admin duyệt ➔ mở khóa SĐT & Địa chỉ phụ huynh.
* **Enrollment (Liên kết lớp học)**: Thực thể dữ liệu liên kết gia sư - học sinh - phụ huynh trong một lớp học, làm căn cứ phân quyền bảo mật dữ liệu Backend (Row-Level Security).

---

## 4. Features

### 4.1 Parent Portal & Smart Registration Form

**Description:** Giao diện công khai cho phụ huynh tìm gia sư qua Form, tra cứu hồ sơ gia sư verified, gửi đăng ký học thử và xem Nhật ký bài học công khai của con. (Thực hiện UJ-1)

**Functional Requirements:**

#### FR-1: Form tìm gia sư (Smart-Match Form 4 bước)
Phụ huynh chưa đăng nhập có thể thực hiện tìm gia sư qua Form đa bước trên trang chủ.
* **Consequences (testable):**
  * *Bước 1 - Mục tiêu & Trình độ học sinh:* Nhập tên con (tùy chọn), chọn/gõ Khối lớp/Độ tuổi, Trình độ hiện tại, Mục tiêu học tập ưu tiên.
  * *Bước 2 - Yêu cầu gia sư & Học phí:* Chọn/gõ Mức học phí mong muốn/buổi, Giới tính gia sư, Phong cách/tính cách gia sư.
  * *Bước 3 - Lịch học linh hoạt & Liên hệ:* Chọn số buổi học/tuần; chọn các ngày rảnh trong tuần (T2-CN) với ca học cài đặt độc lập riêng từng ngày & Họ tên, SĐT phụ huynh (xác thực SĐT Việt Nam 10 chữ số).
  * *Bước 4 - Xác nhận hồ sơ (Profile Confirmation):* Hiển thị bảng tổng hợp toàn bộ thông tin đã điền để phụ huynh rà soát; hỗ trợ nút "Quay lại" chỉnh sửa hoặc nút "Xác nhận & Gửi yêu cầu".
  * *Popup tiếp nhận thành công (Dedicated Success Modal):* Tạo bản ghi Match Request trạng thái `PENDING` và hiển thị Popup thông báo thành công.

#### FR-2: Khám phá, lọc danh sách Gia sư chuyên môn Tiếng Anh và xem Hồ sơ chi tiết
Hệ thống cung cấp giao diện khám phá danh sách gia sư chuyên môn tiếng Anh tinh gọn, hỗ trợ bộ lọc đa chiều dạng dropdown (khối lớp, khu vực, mức học phí) và hiển thị chi tiết hồ sơ gia sư đã xác thực.

#### FR-3: Đăng ký học thử & Liên hệ gia sư chỉ định (Direct Match Request Modal)
Phụ huynh gửi yêu cầu liên hệ và đăng ký học thử 01 buổi miễn phí với gia sư chỉ định ngay trên trang chi tiết gia sư thông qua biểu mẫu tương tác `HireTutorModal`.

#### FR-4: Tra cứu FAQ và Thông tin trung tâm & FR-5: Xem Báo cáo Nhật ký bài học (Public Class Log Work)
Phụ huynh đăng nhập tài khoản có thể truy cập danh sách Buổi học của con, xem chi tiết báo cáo **Public Class Log Work** (nội dung đã dạy, dặn dò) và danh sách bài tập/tài liệu đính kèm để giám sát tiến độ thực tế minh bạch.

---

### 4.2 Tutor Portal, Session Management & AI Revision Quiz Generator (AI Workspace)

**Description:** Cung cấp cổng thông tin cho Gia sư, hỗ trợ quản lý lớp, quản lý Khung chương trình master plan (Curriculum Roadmap 2 cấp), quản lý **Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Log Work)** kèm file đính kèm bài tập, và sinh Quiz ôn tập bám sát SKP qua **AI Workspace**. (Thực hiện UJ-2)

**Functional Requirements:**

#### FR-30: Quản lý Khung chương trình học master plan (Curriculum Roadmap)
Gia sư khởi tạo và quản lý khung chương trình học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) đóng vai trò là Kế hoạch tổng quan (Master Plan) định hướng giảng dạy.
* **Consequences (testable):**
  * Gia sư khởi tạo khung chương trình bằng cách **nhập thủ công** các Chủ đề/Chương và Bài học hoặc **lựa chọn các mẫu lộ trình học tập có sẵn** trong hệ thống.
  * Hỗ trợ chỉnh sửa, thêm, xóa các Chủ đề/Chương và Bài học linh hoạt.

#### FR-40: Quản lý Buổi học thực tế, Nhật ký bài học & File đính kèm (Daily Lesson Sessions, Log Work & Uploaded Attachments)
Gia sư tạo và quản lý Dòng thời gian thực tế (Dynamic Timeline) của từng buổi dạy học.
* **Consequences (testable):**
  * **Tính Độc lập Hoàn toàn (Architectural Separation):** Buổi học thực tế không tự động ràng buộc cứng (hard binding) với các bài học trong Roadmap master plan, đảm bảo gia sư linh hoạt điều chỉnh tiến độ dạy nhanh/chậm so với kế hoạch ban đầu.
  * **Cấu trúc từng Buổi học:**
    1. *Thông tin chung:* Tiêu đề buổi học (VD: *Buổi 5 - Grammar & Listening*), Số thứ tự buổi và Ngày giờ học.
    2. *Tài liệu & Bài tập đính kèm (Uploaded Attachments):* Gia sư upload file PDF/Word/Slides trực tiếp dùng làm bài tập về nhà đa dạng (tự luận, viết lại câu, đọc hiểu...) hoặc tài liệu tham khảo cho học sinh.
    3. *Báo cáo Nội dung Buổi học (Public Class Log Work):* 01 ô văn bản tự do (Text/Markdown Area) duy nhất cho gia sư viết báo cáo ngắn gọn hôm nay đã dạy gì và dặn dò bài tập. Quyền xem minh bạch 3 bên: Gia sư, Phụ huynh và Học sinh.
    4. *Thiết kế tối giản (Frictionless):* Giữ giao diện nhật ký báo cáo bài học tinh gọn.

#### FR-6: Phản hồi Lời mời nhận lớp & Nộp minh chứng phí (QR Proof)
Gia sư xem danh sách Match Offer được đề xuất ➔ Bấm "Chấp nhận" ➔ Chuyển khoản phí nhận lớp và upload ảnh biên lai (QR proof) ➔ Khi Admin/Lễ tân phê duyệt `PAID`, hệ thống **tự động mở khóa (Unlock) SĐT & Địa chỉ Phụ huynh**.

#### FR-8: AI Sinh Quiz Ôn Tập (AI Revision Quiz Generator) qua AI Workspace tại Chi tiết Buổi học
Do bài tập về nhà đa dạng định dạng (tự luận, đọc hiểu, viết lại câu...) đã được gia sư giao qua file đính kèm, công cụ AI tập trung hỗ trợ gia sư **sinh Quiz ôn tập (AI Revision Quiz Generator)** gắn trực tiếp tại Chi tiết Buổi học N:
* **Consequences (testable):**
  * **Luồng khởi tạo:** `[Danh sách Buổi học] ➔ [Chi tiết Buổi học N] ➔ [Bấm "Tạo Quiz với AI"] ➔ [Mở AI Workspace]`
  * **Bố cục Màn hình AI Workspace (Split-Screen):**
    - **Cột TRÁI (Main Canvas - 65% màn hình):** Hiển thị danh sách câu hỏi Quiz dạng thẻ trực quan. Cho phép **Inline Editing** trực tiếp văn bản (câu hỏi, phương án A/B/C/D, Lời giải thích AI). Tự động **Live Update** khi AI sinh hoặc tinh chỉnh.
    - **Cột PHẢI (Right Assistance Dock - 35% màn hình)** với 2 Tabs:
      - **TAB 1: Form / Content (Cấu hình & Sinh Quiz):** Auto-load context của Buổi N (Log Work & Attachments) gộp dữ liệu SKP học sinh; cấu hình số câu Quiz, chủ đề, cấp độ khó (CEFR A1, A2, B1, B2, C1, C2); nút `⚡ Sinh bài tập với AI` (**Option A Direct AI Gen 3-5s** và **Option B Import Structured File 0 Token Cost**).
      - **TAB 2: Chat Freestyle (AI Co-pilot Tinh chỉnh):** Khung chat ngôn ngữ tự nhiên với AI Co-pilot (VD: *"Đổi câu 2 sang dạng chọn từ đúng"*), AI phản hồi và tự động củng cố Live Update lên Main Canvas bên trái.
  * **Sinh Metadata & Phân cấp CEFR:** AI sinh sẵn metadata (đáp án đúng, AI Explanation chi tiết, độ khó CEFR A1-C2, tags chủ điểm). Backend dùng dữ liệu này để tính toán Student Elo Rating và Spaced Repetition tinh gọn khi học sinh nộp Quiz.

#### FR-9: Duyệt và Giao Quiz ôn tập
Gia sư rà soát các câu Quiz trên Canvas và bấm nút **"Giao Quiz"** (chuyển sang Cổng Học sinh trong dưới 1s).

#### FR-21: Quản lý bài giảng video và tài liệu học tập theo từng bài học
Gia sư upload bài giảng video, tài liệu PDF/Word đính kèm trực tiếp vào từng Bài học trong Khung chương trình hoặc đính kèm vào từng Buổi học qua S3 storage.

#### FR-25: Quản lý danh sách học sinh & Ghi chú riêng tư (Private Notes)
Gia sư ghi chép Ghi chú riêng tư cho từng học sinh (bảo mật RLS API trả về `403 Forbidden` nếu sai phân quyền).

#### FR-26: Xem Lịch dạy & FR-28: Đổi lịch dạy và Báo nghỉ
Gia sư xem Calendar view; thực hiện báo nghỉ/đổi lịch dạy (tự động cập nhật Calendar và báo cáo ghi nhận cho Admin).

#### FR-29: Cấu hình Lịch học thử & Chốt Lịch dạy cố định hàng tuần
Gia sư nhập ngày học thử và chốt lịch học cố định hàng tuần sau khi học thử thành công để kích hoạt trạng thái lớp `ACTIVE`.

#### FR-27: Quản lý Bảng giá Hồ sơ Gia sư (Tutor Rate Card)
Gia sư cấu hình bảng giá học phí theo khối lớp/chương trình học làm căn cứ tính phí.

---

### 4.3 Student Portal, Personalization Core & Spaced Repetition tinh gọn

**Description:** Giao diện xem Buổi học thực tế, làm Quiz ôn tập online và tải file bài tập đính kèm cho học sinh, tự động chấm điểm, hiển thị Lời giải thích AI, cập nhật **Student Elo Rating (CEFR A1-C2)** và tự động lưu câu sai vào **Danh sách luyện tập (Spaced Repetition tinh gọn)**. (Thực hiện UJ-3)

**Functional Requirements:**

#### FR-11: Mở Buổi học N, Tải bài tập đính kèm & Làm Quiz online
Học sinh truy cập **Buổi học N**, tải file tài liệu & bài tập đính kèm (tự luận, đọc hiểu, viết lại câu...) để làm bài, đồng thời thực hiện làm **Quiz ôn tập trực tuyến** (trắc nghiệm) và lưu kết quả.

#### FR-12: Tự động chấm điểm Quiz tức thì
Hệ thống tự động chấm điểm Quiz ngay khi nhấn "Nộp bài", hiển thị tỷ lệ đúng/sai tức thì bằng metadata lưu sẵn.

#### FR-13: Hiển thị Lời giải thích chi tiết AI (AI Explanation)
Hệ thống hiển thị kết quả đúng/sai kèm **Lời giải thích chi tiết (AI Explanation)** cho từng câu Quiz làm chưa đúng để học sinh nắm rõ lý do và củng cố kiến thức ngay lập tức.

#### FR-38: Student Knowledge Profile (SKP) & Thuật toán Student Elo Rating (CEFR A1 - C2)
Hệ thống tự động duy trì và cập nhật SKP sau mỗi bài Quiz nộp của học sinh.
* **Consequences (testable):**
  * Điểm **Student Elo Rating** của học sinh được tự động cập nhật dựa trên độ khó CEFR (A1, A2, B1, B2, C1, C2) của các câu hỏi Quiz:
    $$\text{Expected} = \frac{1}{1 + 10^{\frac{\text{difficulty}_{\text{CEFR}} - \text{Elo}_{\text{Student}}}{400}}}$$
    $$\text{Elo}_{\text{new}} = \text{Elo}_{\text{old}} + K \times (\text{actual} - \text{Expected})$$
  * **Tách biệt hoàn toàn khỏi Tags:** Cập nhật điểm Elo chỉ dựa vào cấp độ CEFR của câu hỏi. **Các tags chủ điểm vẫn được lưu trữ độc lập** để xuất báo cáo thống kê dạng bài hay làm sai trong 2 tuần qua, loại bỏ hoàn toàn việc trừ điểm Elo trùng lặp khi 1 câu có nhiều tags.

#### FR-39: Ôn tập ngắt quãng Spaced Repetition tinh gọn (Wrong Question Review Bank)
Hệ thống tự động vận hành cơ chế Ôn tập ngắt quãng tinh gọn:
* **Consequences (testable):**
  * Tự động lưu tất cả các câu hỏi Quiz học sinh làm sai vào **Danh sách luyện tập (Wrong Question Review Bank)** ngay khi nộp bài.
  * Hiển thị danh sách câu hỏi làm sai trên Cổng Học sinh để học sinh chủ động ôn tập lại ở các lần tiếp theo cho đến khi trả lời đúng.

#### FR-15: Báo cáo Tiến bộ Cá nhân & Thống kê Lỗi sai theo Tags
Phân tách rõ 3 thành phần báo cáo:
1. **Chỉ số Chăm chỉ**: Tỷ lệ hoàn thành Quiz ôn tập đúng hạn & nộp bài tập đính kèm.
2. **Biểu đồ Năng lực**: Biến động điểm Student Elo Rating (CEFR) qua từng tuần.
3. **Thống kê Lỗi sai theo Tags**: Phân tích biểu đồ các dạng câu hỏi/chủ điểm học sinh mắc lỗi sai nhiều nhất trong 2 tuần qua và danh sách các chủ điểm đã ôn tập gần đây.

#### FR-22: Học tập qua video bài giảng & tài liệu theo Buổi học / Lộ trình
Học sinh mở xem video bài giảng và tài liệu PDF/Word do gia sư đính kèm theo từng bài học hoặc buổi học thực tế.

---

### 4.4 Admin Dashboard & Class Assignment Management

**Description:** Màn hình quản trị cho Admin quản lý yêu cầu ghép lớp, duyệt Match Offer, kiểm tra phê duyệt phí nhận lớp qua QR proof để mở khóa thông tin phụ huynh, quản lý Lễ tân, xử lý khiếu nại (`REMATCH`, `REFUND`) và đối soát tài chính. (Thực hiện UJ-4)

**Functional Requirements:**

#### FR-16: Quản lý Yêu cầu ghép lớp & Tạo Match Offer (Match Request Management)
Admin/Lễ tân tiếp nhận Form từ Phụ huynh ➔ Gọi điện tư vấn & báo giá ➔ Bấm **"Tạo Match Offer"** gửi Cổng Gia sư. Tự động tính `Học phí tháng = Rate x Sessions x 4` và `Phí nhận lớp = Học phí tháng x Tỷ lệ %`.

#### FR-19: Phân quyền bảo mật Backend dựa trên Enrollment
Spring Boot RLS kiểm soát phân quyền dựa trên `Enrollment`. Gia sư chỉ xem dữ liệu học sinh thuộc liên kết `ACTIVE` của mình (trả về `403 Forbidden` nếu sai phân quyền).

#### FR-20: Audit Log hệ thống
Ghi nhật ký chi tiết các thao tác quan trọng: `Gia sư duyệt giao Quiz`, `Admin tạo Match Offer`, `Admin/Lễ tân duyệt phí QR proof`, `Admin duyệt khiếu nại` (kèm ID tài khoản & thời gian).

#### FR-23: Phê duyệt minh chứng nộp phí (QR Proof) & Mở khóa thông tin liên hệ
Gia sư chấp nhận Match Offer ➔ Upload ảnh biên lai chuyển khoản (QR proof) ➔ Admin/Lễ tân kiểm tra khớp số tiền và bấm **"Phê duyệt phí"** (`PAID`) ➔ Hệ thống tự động **mở khóa thông tin SĐT & Địa chỉ Phụ huynh** cho gia sư.

#### FR-24: Báo cáo vận hành Admin
Hiển thị biểu đồ doanh thu, tỷ lệ ghép lớp thành công và xuất dữ liệu báo cáo đối soát (Excel/PDF).

#### FR-31: Quản lý nhân sự Lễ tân (Receptionist Management)
Admin thực hiện CRUD danh sách tài khoản Lễ tân của trung tâm.

#### FR-32: Xử lý khiếu nại & Đối soát tài chính (Complaint Management)
Admin xem tổng hợp toàn bộ khiếu nại từ Lễ tân, phê duyệt các yêu cầu hoàn tiền (`REFUND`) hoặc đổi gia sư (`REMATCH`), giám sát đối soát tài chính cân đối với doanh thu thu vào.

---

### 4.5 Receptionist Portal & Complaint Management

**Description:** Cổng thông tin cho Lễ tân hỗ trợ vận hành trung tâm: xử lý ghép lớp, duyệt thanh toán QR proof, quản lý gia sư & học sinh, thông báo, và tiếp nhận & ghi nhận khiếu nại từ phụ huynh/gia sư.

**Functional Requirements:**

#### FR-33: Yêu cầu ghép lớp & FR-34: Duyệt thanh toán QR Proof (Receptionist)
Lễ tân xử lý danh sách Match Request, hỗ trợ gọi điện tư vấn và kiểm tra phê duyệt ảnh biên lai chuyển khoản QR proof từ gia sư.

#### FR-35: Quản lý Gia sư & Học sinh & FR-36: Thông báo
Lễ tân tra cứu, lọc hồ sơ gia sư/học sinh, cập nhật trạng thái hoạt động và xem thông báo vận hành trung tâm.

#### FR-37: Xử lý khiếu nại (Complaint Management)
Lễ tân tiếp nhận và ghi nhận khiếu nại từ phụ huynh hoặc gia sư đến trực tiếp trung tâm:
* **Hai loại khiếu nại:** `REFUND` (Hoàn tiền cho gia sư) hoặc `REMATCH` (Ghép lại lớp cho phụ huynh).
* **Tạo đơn khiếu nại:** Lưu mã khiếu nại, loại khiếu nại, người khiếu nại, lễ tân tiếp nhận, mã lớp, số tiền yêu cầu hoàn, nội dung chi tiết và chuyển trạng thái `Chưa xử lý` ➔ `Đã xử lý` (sau khi Admin phê duyệt).

---

## 5. Non-Goals (Explicit)

* **Không AI sinh toàn bộ bài tập về nhà phức tạp**: Hệ thống không dùng AI để sinh các bài tập tự luận dài, viết bài đọc hiểu phức tạp hay viết lại câu — gia sư thực hiện qua tính năng upload file tài liệu/bài tập đính kèm (Uploaded Attachments); AI tập trung hỗ trợ sinh Quiz ôn tập (AI Revision Quiz Generator).
* **Không tự động ràng buộc cứng (hard binding) giữa Buổi học thực tế và Bài học trong Roadmap**: Gia sư hoàn toàn linh hoạt điều chỉnh tiến độ dạy học từng ngày.
* **Không các tính năng tương tác rườm rà trong Nhật ký bài học**: Giữ ô Nhật ký bài học (Public Class Log Work) tinh gọn, không thả reaction hay ghi chú phức tạp.
* **Không hỗ trợ Khung chương trình học đa cấp >2 cấp**: Chỉ thiết kế tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*).
* **Không xây dựng Gamification cồng kềnh (EXP, Streak, Bảng xếp hạng)**: Tập trung vào chỉ số chăm chỉ và sự tiến bộ thực chất về năng lực (Student Elo).
* **Không AI Advisor Chatbot tư vấn trên trang chủ**: Thay thế bằng Form tìm gia sư 4 bước.
* **Không Admin Live Chat Monitor & Takeover Mode**.
* **Không Student Socratic Chatbot**: Thay bằng tính năng Tự động chấm điểm + Lời giải thích AI + Spaced Repetition tinh gọn.
* **Không dạy học trực tuyến tích hợp**: Học qua Zoom/Meet bên ngoài.
* **Không thanh toán trực tuyến tự động qua cổng thanh toán**: Chuyển khoản thủ công VietQR và duyệt bằng ảnh biên lai QR proof.

---

## 6. MVP Scope

### 6.1 In Scope

* **Parent Portal**: Landing Page, Form tìm gia sư 4 bước, Popup tiếp nhận thành công, Xem hồ sơ gia sư verified, Nút Đăng ký học thử (`HireTutorModal`), Xem **Public Class Log Work** & File đính kèm từng buổi, Báo cáo tiến bộ cá nhân của con.
* **Tutor Portal**: Quản lý lớp & thời khóa biểu, Khung chương trình học (Curriculum Roadmap 2 cấp), **Quản lý Buổi học thực tế (FR-40)** với 1 ô **Public Class Log Work** và **Uploaded Attachments** (file bài tập tự luận, đọc hiểu, viết lại câu...), **AI Revision Quiz Generator qua AI Workspace (FR-8)** tại Chi tiết Buổi học (sinh Quiz ôn tập bám sát bối cảnh buổi N & SKP, Inline Editing Canvas 65%, Dock 35% Option A/B + AI Co-pilot), Giao Quiz tức thì.
* **Student Portal**: Xem Buổi học N, tải file bài tập đính kèm, Làm Quiz ôn tập online, Chấm điểm tự động tức thì, Xem Lời giải thích AI chi tiết từng câu, **Student Knowledge Profile (SKP & Student Elo Rating CEFR A1-C2)**, **Ôn tập ngắt quãng Spaced Repetition tinh gọn (Ngân hàng câu hỏi làm sai / Wrong Question Review Bank)**, Báo cáo tiến bộ cá nhân & Thống kê lỗi sai theo Tags (2 tuần qua).
* **Receptionist Portal**: Quản lý ghép lớp (Match Request Management), Gọi điện tư vấn, Tạo Match Offer, Duyệt thanh toán minh chứng chuyển khoản (QR proof), Quản lý gia sư & học sinh, Tiếp nhận khiếu nại (`REMATCH`, `REFUND`).
* **Admin Dashboard**: Quản lý ghép lớp & Match Offer, Phê duyệt phí nhận lớp qua QR proof (mở khóa SĐT/Địa chỉ phụ huynh), Quản lý nhân sự Lễ tân, Xử lý khiếu nại & Đối soát tài chính tập trung, Báo cáo vận hành & Xuất dữ liệu (Excel/PDF), Phân quyền RLS theo `Enrollment` & Audit Log.
* **Hạ tầng Backend & Auth**: Spring Boot REST API, Postgres DB (SKP, Wrong Question Bank, Daily Sessions, Log Works, Audit Logs), Docker deployment, tích hợp AI Service (OpenAI/Gemini).

### 6.2 Out of Scope for MVP

* AI sinh bài tập tự luận dài / bài đọc hiểu phức tạp (gia sư làm qua file upload đính kèm).
* Ràng buộc cứng giữa Buổi học thực tế và Roadmap.
* Khung chương trình đa cấp >2 cấp.
* AI Advisor Chatbot & Live Chat Takeover.
* Student Socratic Chatbot.
* Gamification (EXP, Streak, Bảng xếp hạng).
* Thanh toán tự động qua cổng thanh toán online.
* Tích hợp video call trực tuyến.

---

## 7. Success Metrics

### 7.1 Primary Metrics

* **SM-1 (Tốc độ soạn bài & Giao bài của Gia sư)**: Thời gian trung bình để gia sư cập nhật Nhật ký bài học (Public Class Log Work), upload file bài tập đính kèm và khởi tạo Quiz ôn tập bám sát SKP thông qua AI Workspace **< 3 phút/buổi dạy**.
* **SM-2 (Tỷ lệ tiếp thu & Ghi nhớ của Học sinh)**:
  * **100%** câu hỏi Quiz ôn tập đều có đáp án và Lời giải thích chi tiết AI.
  * **100%** câu làm sai được tự động lưu vào Ngân hàng câu hỏi làm sai (Wrong Question Review Bank) để học sinh luyện tập lại.
  * **> 85%** tỷ lệ học sinh hoàn thành Quiz ôn tập đúng hạn giữa các buổi học.
* **SM-3 (Khả năng theo dõi của Phụ huynh)**:
  * **100%** buổi dạy đều có Nhật ký bài học công khai (Public Class Log Work) và danh sách bài tập/tài liệu đính kèm đầy đủ.
  * **> 90%** phụ huynh hài lòng về khả năng theo dõi tiến độ và chỉ số năng lực định lượng (Student Elo Rating & Biểu đồ lỗi sai theo Tags).
* **SM-4 (Tốc độ xử lý vận hành & Bảo mật)**:
  * **< 24 giờ** thời gian xử lý phê duyệt minh chứng phí nhận lớp (QR Proof) và giải quyết các khiếu nại (`REMATCH`, `REFUND`).
  * **100%** thao tác tài chính và phân quyền truy cập được kiểm soát qua RLS theo `Enrollment` và lưu vết Audit Log đầy đủ.

### 7.2 Secondary Metrics

* **SM-5 (Tỷ lệ chuyển đổi Form ghép lớp)**: Ít nhất **60%** số phụ huynh hoàn thành Form tìm gia sư thực hiện gửi đăng ký học thử.
* **SM-6 (Tỷ lệ làm bài tập đính kèm)**: Ít nhất **75%** bài tập đính kèm (tự luận, đọc hiểu...) được học sinh nộp/hoàn thành đúng hạn.

### 7.3 Counter-metrics (Chỉ số kiểm soát rủi ro)

* **SM-C1 (Chi phí API trên mỗi Quiz)**: Chi phí API gọi LLM (`gpt-4o-mini` / `Gemini Flash`) cho tính năng AI Revision Quiz Generator không vượt quá **$0.005 / lượt sinh Quiz** nhờ auto-load context và sử dụng metadata sinh sẵn.
* **SM-C2 (Tỷ lệ giữ nguyên câu hỏi AI)**: Ít nhất **85%** số câu Quiz do AI sinh ra được gia sư giữ nguyên hoặc chỉ sửa đổi nhỏ (dưới 10% ký tự) trên Canvas.

---

## 8. Cross-Cutting NFRs & Guardrails

### 8.1 Cross-Cutting NFRs

* **Performance**: API Backend Spring Boot response time < 500ms; AI Service sinh Quiz < 5s.
* **Security**: HTTPS/TLS 1.3, JWT Authentication (24h expiry), Row-Level Security theo `Enrollment` (trả về `403 Forbidden` nếu sai quyền).
* **Observability**: APM monitoring đo lường độ trễ dịch vụ AI và ghi log lỗi hệ thống chi tiết.

### 8.2 Constraints and Guardrails

* **Safety**: Bộ lọc Content Moderation API ngăn chặn nội dung không phù hợp trong bài tập và ghi chú.
* **Privacy**: AI Service không nhận dữ liệu định danh cá nhân của học sinh (chỉ nhận ID ẩn danh & bối cảnh bài học).
* **Cost**: Cấu hình Hard Limit chi tiêu API hàng tháng + Hỗ trợ Option B Import File (0 Token Cost) cho cả Sinh Quiz AI và Tạo khung chương trình AI.

### 8.3 Integration and Dependencies

* Backend Spring Boot đóng vai trò là **API Gateway duy nhất**. Giao tiếp Backend ↔ AI Service sử dụng REST API nội bộ trong VPC.
* PostgreSQL lưu trữ có cấu trúc các bảng dữ liệu trọng yếu (`student_knowledge_profile`, `wrong_question_review_bank`, `daily_lesson_sessions`, `class_log_works`, `uploaded_attachments`, `questions`, `enrollments`, `complaints`, `audit_logs`...).

### 8.4 Audit Trail

* Nhật ký hệ thống ghi log chi tiết các thao tác quan trọng: `Gia sư duyệt giao Quiz`, `Admin/Lễ tân tạo Match Offer`, `Admin/Lễ tân duyệt phí QR proof`, `Admin duyệt khiếu nại` (kèm ID tài khoản & thời gian).

---

## 9. Open Questions

1. **Tiêu chí lọc gia sư phù hợp**: Quy tắc ưu tiên danh sách gia sư gợi ý dựa trên các tiêu chí phụ huynh lựa chọn (khung giờ rảnh, môn học/kỹ năng, mức học phí).
2. **Định dạng Import Quiz (Option B)**: Định dạng file chuẩn (JSON hay Markdown) để gia sư upload Quiz từ ChatGPT ngoài vào hệ thống với 0 token cost?
3. **Kênh thông báo đổi lịch dạy**: Gia sư gửi yêu cầu đổi lịch/báo nghỉ thì hệ thống tự động gửi thông báo qua Zalo OA, SMS hay Push Notification trên ứng dụng?

---

## 10. Assumptions Index

* **[ASSUMPTION-1]**: Giả định rằng phụ huynh sẵn sàng điền Form tìm gia sư 4 bước (mất khoảng 30-45 giây) để nhận danh sách gia sư ghép cặp chính xác.
* **[ASSUMPTION-2]**: Giả định rằng gia sư có thiết bị di động/máy tính để viết nhật ký bài học (Public Class Log Work), upload file bài tập đính kèm và sử dụng AI Workspace để sinh Quiz ôn tập.
