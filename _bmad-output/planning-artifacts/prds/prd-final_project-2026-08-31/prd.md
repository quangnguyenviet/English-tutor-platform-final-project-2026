---
title: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: final
created: 2026-08-31
updated: 2026-09-27
---
# PRD: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## 0. Document Purpose

Tài liệu PRD này định nghĩa các yêu cầu nghiệp vụ và kỹ thuật cho hệ thống hỗ trợ vận hành và giảng dạy gia sư tiếng Anh 1-1 có tích hợp AI và Spaced Repetition. Tài liệu làm cơ sở cho thiết kế UX, kiến trúc hệ thống và phân rã các user story cho các nhóm phát triển.

## 1. Vision

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1, với AI và Spaced Repetition đóng vai trò đòn bẩy giúp gia sư **tiết kiệm thời gian soạn bài cá nhân hóa** và học sinh **tự học, ghi nhớ lâu dài hiệu quả hơn**.

**Giá trị cốt lõi:**

- **Gia sư**: Nhận lớp, quản lý Khung chương trình (Roadmap Master Plan), quản lý **Buổi học thực tế (Daily Lesson Sessions & Log Work)** minh bạch 3 bên, và giao bài tập cá nhân hóa dựa trên **Student Knowledge Profile (SKP)** gắn tại từng Buổi học qua **AI Split-Screen Workspace** (Direct AI Generation hoặc Import File 0 Token Cost).
- **Học sinh**: Mở từng Buổi học xem tài liệu đính kèm, làm bài tập trực tuyến, nhận chấm điểm tức thì kèm lời giải thích AI chi tiết và được hệ thống tự động nhắc ôn lại các kiến thức sắp quên theo thuật toán **Spaced Repetition (SM-2)** mà **không tốn chi phí LLM (Zero LLM Overhead)** khi nộp bài.
- **Phụ huynh**: Tìm gia sư nhanh qua Form trực quan, đăng ký học thử đơn giản, và theo dõi nhật ký bài học thực tế từng buổi (Public Log Work) cùng sự tiến bộ của con bằng biểu đồ định lượng.
- **Admin**: Ghép lớp, duyệt phí nhận lớp (sau 1 tháng dạy), quản lý lễ tân, xử lý khiếu nại (`REMATCH`, `REFUND`) và đối soát tài chính trung tâm tại một nơi.
- **Lễ tân**: Hỗ trợ Admin xử lý yêu cầu ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, tiếp nhận và ghi nhận khiếu nại trực tiếp tại trung tâm.

## 2. Target User

### 2.1 Jobs To Be Done (JTBD)

* **Phụ huynh (Người chi trả)**:
  * *Functional*: Muốn tìm kiếm và lựa chọn gia sư tiếng Anh phù hợp với tính cách, lịch học và trình độ của con một cách nhanh chóng, minh bạch. Muốn xem nhật ký bài học thực tế từng buổi (Log Work) để biết hôm nay con học gì và dặn dò bài tập ra sao. Muốn nắm bắt và theo dõi sát sao mức độ chăm chỉ cũng như sự tiến bộ thực chất về năng lực học tập của con theo thời gian.
  * *Emotional*: Cảm thấy yên tâm, tin tưởng vào sự minh bạch và chất lượng dịch vụ của trung tâm; tự hào khi thấy con tiến bộ.
* **Gia sư (Người dạy)**:
  * *Functional*: Muốn chủ động xây dựng lộ trình master plan dài hạn, đồng thời linh hoạt cập nhật nhật ký buổi dạy thực tế (Log Work) từng ngày. Muốn chuẩn bị và giao bài tập luyện tập cá nhân hóa bằng **AI Split-Screen Workspace** bám sát nội dung vừa dạy và điểm yếu thực tế (SKP) của học sinh mà không tốn nhiều công sức soạn bài thủ công.
  * *Emotional*: Cảm thấy tự tin, giữ vững uy tín và thể hiện phong cách làm việc chuyên nghiệp, tận tâm trước phụ huynh mà không bị áp lực hay tốn thời gian bởi các công việc hành chính rườm rà.
* **Học sinh (Người học)**:
  * *Functional*: Muốn xem thông tin bài học và làm bài tập về nhà thuận tiện trên thiết bị cá nhân. Muốn ngay lập tức biết kết quả bài làm và hiểu rõ lý do vì sao mình làm đúng/sai ở từng câu. Muốn được nhắc ôn tập lại những kiến thức sắp quên đúng thời điểm để không bị hổng kiến thức.
  * *Emotional*: Cảm thấy việc học nhẹ nhàng, không bị nản hay áp lực vì luôn có hướng dẫn/giải thích rõ ràng và bài tập vừa sức với trình độ.
* **Quản trị viên (Admin - Người vận hành)**:
  * *Functional*: Muốn tiếp nhận và xử lý nhanh chóng các yêu cầu học thử từ phụ huynh, ghép nối gia sư phù hợp với nhu cầu của từng học sinh. Muốn kiểm soát và đối soát các khoản phí nhận lớp minh bạch, chính xác sau khi gia sư hoàn thành 1 tháng dạy chính thức. Muốn quản lý nhân sự lễ tân và giám sát xử lý khiếu nại để ghi nhận đúng số tiền thu vào/chi ra.
  * *Emotional*: Cảm thấy quy trình vận hành trung tâm diễn ra trơn tru, chuyên nghiệp, giảm thiểu sai sót thủ công và đảm bảo sự hài lòng cho cả gia sư lẫn phụ huynh.
* **Lễ tân (Receptionist - Người hỗ trợ vận hành)**:
  * *Functional*: Muốn hỗ trợ Admin xử lý các tác vụ vận hành hàng ngày: tiếp nhận yêu cầu ghép lớp, duyệt thanh toán phí nhận lớp, quản lý thông tin gia sư & học sinh, gửi thông báo. Đặc biệt, muốn tiếp nhận và ghi nhận khiếu nại từ phụ huynh/gia sư đến trực tiếp trung tâm một cách nhanh chóng, chính xác.
  * *Emotional*: Cảm thấy công việc tiếp nhận khiếu nại và hỗ trợ vận hành được hệ thống hóa rõ ràng, không bỏ sót thông tin, đảm bảo xử lý kịp thời và chuyên nghiệp.

### 2.2 Non-Users (v1)

* Học sinh học theo nhóm lớn hoặc lớp học tập trung (hệ thống chỉ phục vụ mô hình 1-1).
* Gia sư và học sinh tương tác học trực tuyến qua video call tích hợp (sử dụng công cụ bên thứ ba như Zoom/Meet).

### 2.3 Key User Journeys

* **UJ-1. Chị Lan (Phụ huynh) tìm gia sư, đăng ký học thử qua Form Tìm Gia Sư và xem Báo cáo Nhật ký bài học của con**

  * **Persona + Context**: Chị Lan, nhân viên văn phòng bận rộn, có con trai Nam (10 tuổi) nhút nhát và phát âm kém. Chị cần tìm một gia sư nữ kiên nhẫn dạy vào tối Thứ 3 và Thứ 5.
  * **Entry State**: Chưa đăng nhập, truy cập trang chủ công khai của trung tâm, nhấn nút "Tìm Gia Sư Nhanh" hoặc vào xem chi tiết từng gia sư.
  * **Path 1** (Tìm gia sư chung — Smart-Match Form & Tư vấn kết nối):
    1. Chị Lan mở Smart-Match Form trên trang chủ và hoàn thành 4 bước trực quan.
    2. Hệ thống tạo bản ghi Match Request trạng thái `PENDING` và hiển thị Popup "Tiếp nhận yêu cầu thành công".
    3. Trung tâm tư vấn kết nối gia sư phù hợp.
    4. Gia sư nhận lớp thành công và tiến hành giảng dạy.
    5. Sau mỗi buổi học, chị Lan mở ứng dụng, truy cập vào mục **Buổi học thực tế N** để đọc báo cáo **Nhật ký bài học (Public Class Log Work)** giúp nắm chính xác hôm nay con đã học gì và bài tập gia sư dặn dò.
  * **Climax**: Chị Lan hoàn toàn yên tâm vì nắm bắt được tiến độ học tập thực tế của con từng ngày một cách minh bạch.
  * **Resolution**: Chị Lan theo dõi sự tiến bộ thực chất của Nam và duy trì liên kết lớp học chính thức với trung tâm.

* **UJ-2. Minh (Gia sư) nhận lớp, quản lý Khung chương trình master plan, ghi nhận Nhật ký dạy học & giao bài tập cá nhân hóa qua AI Split-Screen Workspace tại Buổi học N**

  * **Persona + Context**: Minh, sinh viên năm 3 chuyên ngành Tiếng Anh, đi dạy thêm bằng điện thoại/laptop.
  * **Entry State**: Đã đăng nhập tài khoản Gia sư.
  * **Path**:
    1. Minh nhận thông báo đề xuất nhận lớp Nam (10 tuổi). Minh bấm "Chấp nhận" ➔ Hệ thống tự động **Mở khóa SĐT & Địa chỉ Phụ huynh**.
    2. Minh chốt ngày giờ học thử thành công, nhập lịch dạy cố định và kích hoạt lớp chính thức (`ACTIVE`).
    3. Minh khởi tạo **Khung chương trình học (Curriculum Roadmap Master Plan)** cho lớp Nam bằng **Dual-Mode AI Curriculum Generation**.
    4. **Quản lý Buổi học N & Viết Nhật ký dạy học**: 
       - Minh mở **Buổi học thực tế N** (độc lập với Roadmap master plan).
       - Minh upload tài liệu bài học (file PDF/Slides) và gõ 1-2 câu vào ô **Nhật ký dạy học (Public Class Log Work)** để báo cáo nội dung hôm nay đã dạy.
    5. **Tạo bài tập cá nhân hóa với AI Split-Screen Workspace**:
       - Tại màn hình Chi tiết Buổi học N, Minh bấm **"Tạo bài tập với AI"** ➔ Hệ thống mở giao diện chia đôi màn hình **Split-Screen Workspace**.
       - **Dock Phải (Assistance Dock - Tab 1 Form Config)**: Hệ thống tự động **Auto-load Context** từ Buổi N (Tài liệu đính kèm & Log Work) gộp cùng dữ liệu **SKP** của Nam. Minh chọn số câu, độ khó và bấm `⚡ Sinh bài tập với AI` (Direct AI Gen 3-5s hoặc Import Structured File 0 Token Cost).
       - **Canvas Trái (Main Canvas)**: Hiển thị các câu hỏi vừa sinh. Minh thực hiện **Inline Editing** trực tiếp câu hỏi/đáp án. Minh có thể chuyển sang **Tab 2 (Chat Freestyle Co-pilot)** gõ yêu cầu *"Đổi câu 3 sang dạng bài sửa lỗi sai"*, AI Co-pilot phản hồi và **Live Update** trực tiếp lên Canvas trái.
    6. Minh rà soát lại và bấm **"Giao bài"** cho Nam.
    7. **Nộp phí nhận lớp sau 1 tháng dạy**: Tròn 30 ngày dạy chính thức, Minh upload ảnh biên lai (QR proof) để Admin phê duyệt.
  * **Climax**: Bài tập cá nhân hóa bám sát buổi dạy N và SKP của Nam được giao trong chưa đầy 2 phút với giao diện tương tác trực quan.
  * **Resolution**: Minh giảng dạy hiệu quả, nộp phí nhận lớp đúng hạn và được Admin phê duyệt `PAID`.

* **UJ-3. Nam (Học sinh) làm bài tập Buổi N, đọc Lời giải thích AI và Ôn tập Ngắt quãng (Spaced Repetition)**

  * **Persona + Context**: Nam, 10 tuổi, làm bài tập về nhà và tự ôn tập theo nhắc nhở của hệ thống.
  * **Entry State**: Đã đăng nhập tài khoản Học sinh.
  * **Path**:
    1. Nam mở **Buổi học N**, xem tài liệu học tập và làm 5 câu bài tập về nhà do thầy Minh giao.
    2. Nam bấm "Nộp bài", hệ thống **tự động chấm điểm tức thì** và hiển thị **Lời giải thích AI chi tiết** cho từng câu làm sai.
    3. Backend lấy metadata sinh sẵn của bài tập để tự động cập nhật điểm `mastery_score` trong **SKP** theo **Thuật toán Elo Rating** và lập lịch **Spaced Repetition (SM-2)** mà **không gọi LLM (Zero LLM Overhead)**.
    4. Hàng ngày, Nam vào mục **"Ôn tập ngắt quãng"** hoàn thành các câu hỏi đến hạn ôn tập (`next_review`).
  * **Climax**: Nam hiểu sâu lý do sai và tự củng cố lại kiến thức sắp quên mà không thấy áp lực.
  * **Resolution**: SKP và lịch trình SM-2 của Nam được cập nhật liên tục, đảm bảo năng lực tăng trưởng bền vững.

* **UJ-4. Anh Bình (Admin) tư vấn Phụ huynh, tạo Match Offer và phê duyệt phí nhận lớp sau 1 tháng dạy cho Gia sư**

  * **Persona + Context**: Anh Bình, quản trị viên vận hành trung tâm gia sư.
  * **Entry State**: Đã đăng nhập Admin Dashboard.
  * **Path**:
    1. Anh Bình xem màn hình **Match Request Management**, thấy yêu cầu đăng ký học thử của chị Lan cho học sinh Nam.
    2. Anh Bình gọi điện xác nhận & báo giá ➔ Bấm **"Tạo Match Offer"** gửi tới Cổng Gia sư.
    3. Gia sư bấm "Chấp nhận" ➔ Hệ thống tự động **Mở khóa SĐT & Địa chỉ Phụ huynh**.
    4. Sau 1 tháng dạy chính thức (30 ngày từ ngày kích hoạt lớp), hệ thống sinh Yêu cầu nộp phí. Gia sư chuyển khoản và upload ảnh biên lai (QR proof).
    5. Anh Bình kiểm tra ảnh biên lai khớp số tiền và bấm **"Phê duyệt phí"** ➔ Trạng thái phí chuyển `PAID`.
  * **Climax**: Lớp học vận hành trơn tru và đối soát phí hoàn tất sau 1 tháng.
  * **Resolution**: Hệ thống ghi nhận trạng thái phí `PAID`, theo dõi tiến độ và xuất báo cáo vận hành.

---

## 3. Glossary

* **Student Knowledge Profile (SKP - Hồ sơ tri thức người học)**: Bộ nhớ dài hạn lưu trữ trạng thái học tập có cấu trúc của học sinh theo thời gian, gồm: Skill Mastery (0-100), Confidence Score, Error Patterns, Strengths & Weaknesses (Top 5), và Goals. SKP là đầu vào bắt buộc cho mọi quyết định cá nhân hóa.
* **Elo Rating System trong Giáo dục**: Thuật toán cập nhật điểm `mastery_score` của học sinh và điểm `difficulty` của câu hỏi theo thời gian thực dựa trên kết quả trả lời đúng/sai ($\text{Expected} = \frac{1}{1 + 10^{\frac{\text{difficulty} - \text{mastery}}{400}}}$).
* **Spaced Repetition (SM-2 Algorithm)**: Tính năng gợi ý và lập lịch ôn tập ngắt quãng các kiến thức/câu hỏi đến hạn (`next_review`) nhằm giúp học sinh ghi nhớ dài hạn theo đường cong quên lãng Ebbinghaus.
* **Curriculum Roadmap (Khung chương trình học)**: Lộ trình bài học tĩnh 2 cấp (*Chủ đề/Chương ➔ Bài học*) đóng vai trò là Kế hoạch tổng quan (Master Plan) định hướng dài hạn cho liên kết lớp học.
* **Daily Lesson Sessions & Log Work (Buổi học thực tế & Nhật ký dạy học)**: Dòng thời gian thực tế (Dynamic Timeline) của từng ngày dạy, **tách biệt kiến trúc hoàn toàn** với Roadmap. Bao gồm: Tiêu đề & Ngày giờ, Tài liệu đính kèm (Session Attachments) và Báo cáo Nội dung Buổi học (Public Class Log Work) – 1 ô văn bản tự do minh bạch 3 bên (Gia sư, Học sinh, Phụ huynh), thiết kế tinh gọn frictionless.
* **AI Split-Screen Workspace**: Giao diện soạn và tinh chỉnh bài tập cá nhân hóa dựa trên SKP gắn tại Chi tiết Buổi học N (Left Canvas 65% inline edit, Right Dock 35% Tab 1 Form Config auto-load context & Tab 2 Chat Freestyle Co-pilot).
* **Zero LLM Overhead on Submission**: Cơ chế pre-generate metadata (đáp án, AI Explanation, Elo difficulty, micro_skill_tags) khi tạo bài tập, giúp hệ thống tự động chấm điểm và cập nhật SKP / SM-2 mà không cần gọi LLM khi học sinh nộp bài.
* **Form Tìm Gia Sư & Đăng ký Học thử**: Form tìm gia sư trực quan dành cho phụ huynh tại trang chủ, gửi yêu cầu ghép lớp tới Admin.
* **AI Explanation (Lời giải thích chi tiết AI)**: Đoạn văn bản giải thích kiến thức và lý do đáp án đúng/sai do AI tự động sinh sẵn cho từng câu hỏi, hiển thị ngay cho học sinh sau khi nộp bài.
* **Enrollment (Liên kết lớp học)**: Thực thể dữ liệu liên kết một gia sư với một học sinh cụ thể, làm cơ sở phân quyền bảo mật dữ liệu ở Backend (Row-level security).

---

## 4. Features

### 4.1 Parent Portal & Smart Registration Form

**Description:** Cung cấp giao diện công khai cho phụ huynh tìm gia sư qua Form trực quan, tra cứu danh sách gia sư phù hợp, gửi đăng ký học thử và xem Nhật ký bài học của con. (Thực hiện UJ-1)

**Functional Requirements:**

#### FR-1: Form tìm gia sư (Smart-Match Form 4 bước)
Phụ huynh chưa đăng nhập có thể thực hiện tìm gia sư qua Form trực quan đa bước trên trang chủ.
* **Consequences (testable):**
  * *Bước 1 - Mục tiêu & Trình độ học sinh:* Nhập tên con (tùy chọn), chọn/gõ Khối lớp/Độ tuổi, Trình độ hiện tại, Mục tiêu học tập ưu tiên.
  * *Bước 2 - Yêu cầu gia sư & Học phí:* Chọn/gõ Mức học phí mong muốn/buổi, Giới tính gia sư, Phong cách/tính cách gia sư.
  * *Bước 3 - Lịch học linh hoạt & Liên hệ:* Chọn số buổi học/tuần; chọn các ngày rảnh trong tuần (T2-CN) với ca học cài đặt độc lập riêng từng ngày & Họ tên, SĐT phụ huynh (xác thực SĐT Việt Nam 10 chữ số).
  * *Bước 4 - Xác nhận hồ sơ (Profile Confirmation):* Hiển thị bảng tổng hợp toàn bộ thông tin đã điền để phụ huynh rà soát; hỗ trợ nút "Quay lại" chỉnh sửa hoặc nút "Xác nhận & Gửi yêu cầu".
  * *Popup tiếp nhận thành công (Dedicated Success Modal):* Tạo bản ghi Match Request trạng thái `PENDING` và hiển thị Popup thông báo thành công.

#### FR-2: Khám phá, lọc danh sách Gia sư chuyên môn Tiếng Anh và xem Hồ sơ chi tiết
Hệ thống cung cấp giao diện khám phá danh sách gia sư chuyên môn tiếng Anh tinh gọn, hỗ trợ bộ lọc đa chiều dạng dropdown và hiển thị chi tiết hồ sơ năng lực xác thực.

#### FR-3: Đăng ký học thử & Liên hệ gia sư chỉ định (Direct Match Request Modal)
Phụ huynh gửi yêu cầu liên hệ và đăng ký học thử 01 buổi miễn phí với gia sư chỉ định ngay trên trang chi tiết gia sư thông qua biểu mẫu tương tác `HireTutorModal`.

#### FR-4: Tra cứu FAQ và Thông tin trung tâm & FR-5: Xem Báo cáo Nhật ký bài học (Public Class Log Work)
Phụ huynh đăng nhập tài khoản có thể truy cập danh sách Buổi học của con, xem chi tiết báo cáo **Public Class Log Work** (nội dung đã dạy, bài tập dặn dò) và các tài liệu đính kèm để giám sát tiến độ thực tế minh bạch.

---

### 4.2 Tutor Portal, Session Management & AI Split-Screen Workspace

**Description:** Cung cấp cổng thông tin cho Gia sư, hỗ trợ quản lý lớp, quản lý Khung chương trình master plan (Curriculum Roadmap), quản lý **Buổi học thực tế & Nhật ký dạy học (Daily Lesson Session & Log Work)**, và soạn bài tập cá nhân hóa dựa trên SKP qua **AI Split-Screen Workspace**. (Thực hiện UJ-2)

**Functional Requirements:**

#### FR-30: Quản lý Khung chương trình học master plan bằng AI Dual-Mode (Curriculum Roadmap Dual-Mode)
Gia sư khởi tạo và quản lý khung chương trình học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) đóng vai trò là Kế hoạch tổng quan (Master Plan) tĩnh mang tính định hướng dài hạn.
* **Consequences (testable):**
  * **Option A (Direct AI Generation):** Gia sư nhập thông tin lớp/trình độ ➔ AI tự động sinh nháp khung chương trình 2 cấp tinh gọn trong dưới 5 giây.
  * **Option B (Import Structured File):** Upload file JSON/Text trích xuất từ Prompt Mẫu trên ChatGPT/Claude ngoài (0 Token Cost).
  * **Tạo & Chỉnh sửa thủ công:** Thêm/xóa/sửa các Chủ đề/Chương và Bài học.

#### FR-40: Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Session & Log Work)
Gia sư tạo và quản lý Dòng thời gian thực tế (Dynamic Timeline) của từng buổi dạy học.
* **Consequences (testable):**
  * **Tính Độc lập Hoàn toàn (Architectural Separation):** Buổi học thực tế không tự động ràng buộc cứng (hard binding) với các bài học trong Roadmap master plan, đảm bảo gia sư linh hoạt điều chỉnh tiến độ dạy nhanh/chậm so với kế hoạch ban đầu.
  * **Cấu trúc từng Buổi học:**
    1. *Thông tin chung:* Tiêu đề buổi học (VD: *Buổi 5 - Grammar & Listening*), Số thứ tự buổi và Ngày giờ học.
    2. *Tài liệu & Bài tập đính kèm (Session Attachments):* Upload file PDF/Word/Slides hoặc đường dẫn liên kết dùng cho buổi học đó.
    3. *Báo cáo Nội dung Buổi học (Public Class Log Work):* 01 ô văn bản tự do (Text/Markdown Area) duy nhất cho gia sư viết báo cáo ngắn gọn hôm nay đã dạy gì và dặn dò bài tập. Quyền xem minh bạch 3 bên: Gia sư, Phụ huynh và Học sinh.
    4. *Thiết kế tối giản (Frictionless):* Loại bỏ các ghi chú riêng phức tạp và loại bỏ nút bấm thả icon hay nút xác nhận "Đã xem" từ phụ huynh.

#### FR-6: Tiếp nhận và phản hồi lời mời nhận lớp
Gia sư xem danh sách lớp được đề xuất và thực hiện Chấp nhận ➔ Hệ thống tự động **mở khóa (Unlock) SĐT & Địa chỉ Phụ huynh**.

#### FR-8: Tự động soạn bài tập cá nhân hóa dựa trên SKP qua AI Split-Screen Workspace tại Chi tiết Buổi học
Hỗ trợ gia sư soạn bài tập cá nhân hóa dựa trên SKP gắn trực tiếp tại Chi tiết Buổi học N:
* **Consequences (testable):**
  * **Luồng khởi tạo:** `[Danh sách Buổi học] ➔ [Chi tiết Buổi học N] ➔ [Bấm "Tạo bài tập với AI"] ➔ [Mở Split-Screen Workspace]`
  * **Bố cục Màn hình Workspace (Split-Screen):**
    - **Cột TRÁI (Main Canvas - 65% màn hình):** Hiển thị danh sách câu hỏi dạng thẻ trực quan. Cho phép **Inline Editing** trực tiếp trên văn bản (câu hỏi, phương án A/B/C/D, Lời giải thích AI). Tự động **Live Update** khi AI sinh hoặc tinh chỉnh.
    - **Cột PHẢI (Right Assistance Dock - 35% màn hình)** với 2 Tabs:
      - **TAB 1: Form / Content (Cấu hình & Tạo ban đầu):** Auto-load context của Buổi N (Tài liệu đính kèm & Log Work) có nút `(X)` gỡ nhãn context; cấu hình số câu, dạng bài, độ khó; nút `⚡ Sinh bài tập với AI` (**Option A Direct AI Gen 3-5s** và **Option B Import Structured File 0 Token Cost**).
      - **TAB 2: Chat Freestyle (AI Co-pilot Tinh chỉnh):** Khung chat ngôn ngữ tự nhiên với AI Co-pilot. Gia sư chat yêu cầu AI chỉnh sửa câu hỏi/tăng độ khó... AI phản hồi và tự động cập nhật Live Update lên Main Canvas bên trái.
  * **Sinh Metadata & Zero LLM Overhead khi nộp bài:** AI sinh sẵn metadata (đáp án đúng, AI Explanation chi tiết, `difficulty` 1-100, `micro_skill_tags`). Backend dùng dữ liệu này để tính toán Elo rating và lập lịch Spaced Repetition (SM-2) mà **không gọi LLM** khi học sinh nộp bài.

#### FR-9: Duyệt và Giao bài tập
Gia sư rà soát bài tập trên Canvas và bấm nút **"Giao bài"** (chuyển sang Cổng Học sinh trong dưới 1s).

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

### 4.3 Student Portal, Personalization Core & Spaced Repetition

**Description:** Giao diện xem Buổi học thực tế, làm bài tập trực tuyến cho học sinh, tự động chấm điểm, hiển thị Lời giải thích chi tiết AI, cập nhật **Student Knowledge Profile (SKP)** qua Elo rating và tự động lập lịch **Spaced Repetition (SM-2)**. (Thực hiện UJ-3)

**Functional Requirements:**

#### FR-11: Mở Buổi học N, Làm bài tập online và Lưu lịch sử bài làm
Học sinh truy cập **Buổi học N**, xem tài liệu đính kèm, làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) và lưu kết quả bài làm.

#### FR-12: Tự động chấm điểm tức thì (Zero LLM Overhead)
Hệ thống tự động chấm điểm bài làm ngay khi nhấn "Nộp bài", hiển thị tỷ lệ đúng/sai tức thì bằng metadata lưu sẵn mà không tốn chi phí gọi LLM.

#### FR-13: Cấu hình và Hiển thị Lời giải thích chi tiết AI (AI Explanation)
Hỗ trợ 2 chế độ hiển thị:
* **Chế độ xem tức thì (Per-question mode):** Phản hồi kết quả đúng/sai và lời giải thích AI ngay sau từng câu (bài luyện tập).
* **Chế độ nộp toàn bài (Submit-all mode):** Hiển thị tổng điểm và lời giải thích AI từng câu sau khi nộp toàn bộ bài (bài kiểm tra).

#### FR-38: Student Knowledge Profile (SKP) & Thuật toán Elo Rating
Hệ thống tự động duy trì và cập nhật Hồ sơ tri thức người học (SKP) sau mỗi câu trả lời của học sinh.
* **Consequences (testable):**
  * Điểm `mastery_score` (0-100) cho từng micro-skill được tự động cập nhật theo Thuật toán **Elo Rating**:
    $$\text{Expected} = \frac{1}{1 + 10^{\frac{\text{difficulty} - \text{mastery}}{400}}}$$
    $$\text{mastery}_{\text{new}} = \text{mastery}_{\text{old}} + K \times (\text{actual} - \text{Expected})$$
  * Điểm `difficulty` (1-100) của câu hỏi được đánh giá bằng **Rubric-based Assessment** của AI.
  * Tự động tổng hợp Top 5 skill mạnh nhất/yếu nhất và mapping câu sai vào `Error Pattern Catalog`.

#### FR-39: Ôn tập kiến thức ngắt quãng (Spaced Repetition - SM-2)
Hệ thống cung cấp tính năng Ôn tập ngắt quãng dựa trên Thuật toán **SM-2**.
* **Consequences (testable):**
  * Tự động tính toán mốc thời gian ôn tập tiếp theo (`next_review`) cho từng kiến thức/câu hỏi dựa trên lịch sử làm bài.
  * Hiển thị danh sách câu hỏi đến hạn ôn tập hàng ngày trên Cổng Học sinh. Kết quả ôn tập được cập nhật ngược lại vào SM-2 và SKP.

#### FR-15: Báo cáo Tiến bộ Cá nhân (Personal Progress Report)
Phân tách rõ 2 thành phần: **Chỉ số Chăm chỉ** (tỷ lệ nộp bài `PRACTICE` đúng hạn) và **Biểu đồ Tiến bộ Năng lực** (điểm bài `ASSESSMENT` theo thời gian).

#### FR-22: Học tập qua video bài giảng & tài liệu theo Buổi học / Lộ trình
Học sinh mở xem video bài giảng và tài liệu PDF/Word do gia sư đính kèm theo từng bài học hoặc buổi học thực tế.

---

### 4.4 Admin Dashboard & Class Assignment Management

**Description:** Màn hình quản trị cho Admin quản lý yêu cầu học thử, duyệt ghép lớp, quản lý hồ sơ gia sư, phê duyệt phí nhận lớp qua QR proof, quản lý nhân sự lễ tân, và giám sát xử lý khiếu nại đối soát doanh thu. (Thực hiện UJ-4)

**Functional Requirements:**

#### FR-16: Quản lý Yêu cầu ghép lớp & Tạo Match Offer (Match Request Management)
Admin tiếp nhận Form từ Phụ huynh ➔ Gọi điện tư vấn & báo giá ➔ Bấm **"Tạo Match Offer"** gửi Cổng Gia sư. Tự động tính `Học phí tháng = Rate x Sessions x 4` và `Phí nhận lớp = Học phí tháng x Tỷ lệ %`.

#### FR-19: Phân quyền bảo mật Backend dựa trên Enrollment
Spring Boot RLS kiểm soát phân quyền dựa trên `Enrollment`. Gia sư chỉ xem dữ liệu học sinh thuộc liên kết `ACTIVE` của mình (trả về `403 Forbidden` nếu sai phân quyền).

#### FR-20: Audit Log hệ thống
Ghi nhật ký chi tiết các thao tác quan trọng: `Gia sư duyệt giao bài`, `Admin tạo Match Offer`, `Admin duyệt phí`.

#### FR-23: Quản lý nộp phí QR proof và Phê duyệt phí nhận lớp sau 1 tháng dạy
* **Kích hoạt sau 30 ngày:** Khi lớp học chính thức hoạt động đủ 30 ngày, hệ thống gửi thông báo yêu cầu nộp phí kèm mã VietQR động.
* **Phê duyệt:** Gia sư upload ảnh biên lai (QR proof), Admin kiểm tra khớp tiền và bấm "Phê duyệt phí" (`PAID`).

#### FR-24: Báo cáo vận hành Admin
Hiển thị biểu đồ doanh thu, tỷ lệ ghép lớp thành công và xuất dữ liệu Excel/PDF.

#### FR-31: Quản lý nhân sự Lễ tân (Receptionist Management)
Admin thực hiện CRUD danh sách tài khoản Lễ tân của trung tâm.

#### FR-32: Xử lý khiếu nại & Đối soát tài chính (Complaint Management)
Admin xem tổng hợp toàn bộ khiếu nại từ Lễ tân, giám sát tiến độ xử lý và tổng hợp số tiền hoàn trả (`REFUND`) để đối soát cân đối tài chính với doanh thu thu vào.

---

### 4.5 Receptionist Portal & Complaint Management

**Description:** Cổng thông tin cho Lễ tân hỗ trợ vận hành trung tâm: xử lý ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, thông báo, và tiếp nhận & ghi nhận khiếu nại từ phụ huynh/gia sư.

**Functional Requirements:**

#### FR-33: Yêu cầu ghép lớp & FR-34: Duyệt thanh toán (Receptionist)
Lễ tân xử lý danh sách Match Request và kiểm tra phê duyệt ảnh biên lai QR proof từ gia sư.

#### FR-35: Quản lý Gia sư & Học sinh & FR-36: Thông báo
Lễ tân tra cứu, lọc hồ sơ gia sư/học sinh, cập nhật trạng thái hoạt động và xem thông báo vận hành trung tâm.

#### FR-37: Xử lý khiếu nại (Complaint Management)
Lễ tân tiếp nhận và ghi nhận khiếu nại từ phụ huynh hoặc gia sư đến trực tiếp trung tâm:
* **Hai loại khiếu nại:** `REFUND` (Hoàn tiền cho gia sư) hoặc `REMATCH` (Ghép lại lớp cho phụ huynh).
* **Tạo đơn khiếu nại:** Lưu mã khiếu nại, loại khiếu nại, người khiếu nại, lễ tân tiếp nhận, mã lớp, số tiền yêu cầu hoàn, nội dung chi tiết và chuyển trạng thái `Chưa xử lí` ➔ `Đã xử lí`.

---

## 5. Non-Goals (Explicit)

* **Không tự động ràng buộc cứng (hard binding) giữa Buổi học thực tế và Bài học trong Roadmap**: Đảm bảo gia sư hoàn toàn linh hoạt dạy nhanh/chậm tiến độ so với kế hoạch master plan ban đầu.
* **Không xây dựng các tính năng tương tác rườm rà trong Nhật ký buổi học**: Loại bỏ nút thả icon, nút xác nhận "Đã xem" từ phụ huynh hay các ghi chú riêng tư rắc rối để giữ trải nghiệm frictionless.
* **Không xây dựng tính năng Đánh giá Gia sư sau buổi Học thử**: Tạm thời chưa triển khai đánh giá sao sau học thử.
* **Không hỗ trợ Khung chương trình học đa cấp**: Chỉ thiết kế tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*).
* **Không xây dựng Gamification cồng kềnh (EXP, Streak, Bảng xếp hạng)**: Tập trung vào sự tiến bộ cá nhân và tương tác thực chất giữa Gia sư - Học sinh - Phụ huynh.
* **Không AI Chatbot tư vấn trên trang chủ**: Thay thế chatbot bằng Form tìm gia sư trực quan.
* **Không Admin Live Chat Monitor & Takeover Mode**.
* **Không Student Socratic Chatbot**: Thay bằng tính năng tự động chấm điểm và hiển thị Lời giải thích AI cho từng câu.
* **Không dạy học trực tuyến tích hợp**: Học qua Zoom/Meet bên ngoài.
* **Không thanh toán trực tuyến tự động qua cổng thanh toán**: Chuyển khoản thủ công và duyệt bằng ảnh biên lai QR proof.

---

## 6. MVP Scope

### 6.1 In Scope

* Parent Portal: Landing Page, Form tìm gia sư trực quan, Nút Đăng ký học thử, Xem Báo cáo Nhật ký bài học từng buổi (Public Class Log Work).
* Admin Dashboard: Match Request Management, Phê duyệt ghép lớp, Duyệt phí nhận lớp (QR proof), Quản lý lễ tân, Xử lý khiếu nại & Đối soát tài chính, Báo cáo vận hành.
* Receptionist Portal: Yêu cầu ghép lớp, Duyệt thanh toán, Quản lý gia sư & học sinh, Thông báo, Xử lý khiếu nại (Hoàn tiền / Ghép lại lớp).
* Tutor Portal: Quản lý lớp, Khung chương trình tĩnh (Curriculum Roadmap Master Plan 2 cấp), **Quản lý Buổi học thực tế & Nhật ký dạy học (FR-40)**, **Tutor Assistant AI Split-Screen Workspace (FR-8)** tại Chi tiết Buổi học (sinh bài tập cá nhân hóa dựa trên SKP, auto-load context buổi N, zero-LLM submission), Giao bài tức thì, Upload tài liệu S3.
* Student Portal: Xem Buổi học N & tài liệu đính kèm, Làm bài tập online, Tự động chấm điểm (Zero LLM Overhead), Xem lời giải thích AI từng câu, **Student Knowledge Profile (SKP) với Elo Rating**, **Ôn tập ngắt quãng Spaced Repetition (SM-2)**, Báo cáo tiến bộ cá nhân.
* Backend Spring Boot RBAC theo `Enrollment`, Postgres DB, Docker deployment.

### 6.2 Out of Scope for MVP

* Tự động ràng buộc cứng (hard binding) giữa Buổi học thực tế và Bài học trong Roadmap.
* Nút bấm xác nhận "Đã xem" / thả icon reaction trong Nhật ký buổi học.
* Đánh giá định kỳ sau mỗi buổi học chính thức hoặc học thử.
* Khung chương trình đa cấp phức tạp >2 cấp.
* AI Advisor Chatbot & Live Chat Takeover.
* Student Socratic Chatbot.
* Gamification (EXP, Streak, Bảng xếp hạng).
* Thanh toán tự động qua cổng thanh toán.

---

## 7. Success Metrics

### 7.1 Primary Metrics

* **SM-1 (Matching Speed - Tốc độ ghép lớp)**: Thời gian từ lúc phụ huynh gửi đăng ký học thử qua Form đến khi gia sư bấm Chấp nhận lời mời nhận lớp giảm xuống dưới **12 giờ**.
* **SM-2 (Smart-Match Conversion Rate - Tỷ lệ chuyển đổi)**: Ít nhất **60%** số phụ huynh hoàn thành form tìm gia sư thực hiện gửi đăng ký học thử.
* **SM-3 (Tutor Prep Time - Thời gian chuẩn bị bài của Gia sư)**: Thời gian gia sư ghi nhật ký buổi học và giao bài tập cá nhân hóa giảm xuống dưới **3 phút/buổi** nhờ AI Split-Screen Workspace.
* **SM-4 (Knowledge Retention Rate - Tỷ lệ ghi nhớ dài hạn)**: Ít nhất **70%** số câu hỏi ôn tập ngắt quãng Spaced Repetition (SM-2) được học sinh trả lời đúng trong các phiên ôn tập định kỳ.

### 7.2 Secondary Metrics

* **SM-5 (Student Homework Completion Rate)**: Ít nhất **75%** bài tập về nhà được học sinh hoàn thành trong vòng 48 giờ.
* **SM-6 (Explanation Utility Rate)**: 100% câu hỏi bài tập đều có lời giải thích chi tiết do AI tự động sinh sẵn.

### 7.3 Counter-metrics (Chỉ số kiểm soát rủi ro)

* **SM-C1 (API Cost per Homework - Chi phí API trên mỗi bài tập)**: Chi phí API gọi LLM (`gpt-4o-mini` / `Gemini Flash`) cho tính năng Tutor Assistant không vượt quá **$0.005 / bài tập** (~100 VNĐ) nhờ cơ chế Zero LLM Overhead khi học sinh nộp bài.
* **SM-C2 (Tutor Question Modification Rate - Tỷ lệ sửa đổi câu hỏi)**: Ít nhất **85%** số câu hỏi do AI Tutor Assistant tạo ra được gia sư giữ nguyên hoặc chỉ sửa đổi nhỏ (dưới 10% ký tự) trên Canvas.

---

## 8. Cross-Cutting NFRs & Guardrails

### 8.1 Cross-Cutting NFRs

* **Performance**: API Backend Spring Boot response time < 500ms; AI Service sinh bài tập < 5s.
* **Security**: HTTPS/TLS 1.3, JWT Authentication (24h expiry), Row-level security theo `Enrollment`.
* **Observability**: APM monitoring đo lường độ trễ dịch vụ AI và ghi log lỗi hệ thống.

### 8.2 Constraints and Guardrails

* **Safety**: Bộ lọc Content Moderation API ngăn chặn nội dung không phù hợp.
* **Privacy**: AI Service không nhận dữ liệu định danh cá nhân của học sinh (chỉ nhận ID ẩn danh & mô tả bài học).
* **Cost**: Cấu hình Hard limit chi tiêu API hàng tháng + Hỗ trợ Option B Import File (0 Token Cost) cho cả Sinh bài tập AI và Tạo khung chương trình AI.

### 8.3 Integration and Dependencies

* Backend Spring Boot đóng vai trò là **API Gateway duy nhất**. Giao tiếp Backend ↔ AI Service sử dụng REST API nội bộ trong VPC.
* PostgreSQL lưu trữ có cấu trúc các bảng dữ liệu trọng yếu (`student_knowledge_profile`, `spaced_repetition_schedules`, `daily_lesson_sessions`, `class_log_works`, `error_patterns`, `questions`, `enrollments`, `audit_logs`...).

### 8.4 Audit Trail

* Nhật ký hệ thống ghi log chi tiết các thao tác quan trọng: `Gia sư duyệt giao bài`, `Admin tạo Match Offer`, `Admin duyệt phí` (kèm ID tài khoản).

---

## 9. Open Questions

1. **Tiêu chí lọc gia sư phù hợp**: Quy tắc ưu tiên danh sách gia sư gợi ý dựa trên các tiêu chí phụ huynh lựa chọn (ưu tiên khung giờ rảnh, môn học/kỹ năng, mức học phí).
2. **Định dạng Import Bài tập (Option B)**: Định dạng file chuẩn (JSON hay Markdown) để gia sư upload từ ChatGPT ngoài vào hệ thống?
3. **Tương tác lịch dạy**: Gia sư gửi yêu cầu đổi lịch/báo nghỉ thì hệ thống tự động thông báo qua Zalo/SMS hay ứng dụng?

---

## 10. Assumptions Index

* **[ASSUMPTION-1]**: Giả định rằng phụ huynh sẵn sàng điền Form tìm gia sư ngắn (mất khoảng 30 giây) để nhận danh sách gia sư ghép cặp chính xác.
* **[ASSUMPTION-2]**: Giả định rằng gia sư có thiết bị di động/máy tính để viết nhật ký dạy học và dùng AI Split-Screen Workspace giao bài tập.
