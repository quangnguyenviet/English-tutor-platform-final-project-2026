---
title: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: final
created: 2026-08-31
updated: 2026-09-19
---
# PRD: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## 0. Document Purpose

Tài liệu PRD này định nghĩa các yêu cầu nghiệp vụ và kỹ thuật cho hệ thống hỗ trợ vận hành và giảng dạy gia sư tiếng Anh 1-1 có tích hợp AI. Tài liệu làm cơ sở cho thiết kế UX, kiến trúc hệ thống và phân rã các user story cho các nhóm phát triển.

## 1. Vision

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1, với AI là công cụ giúp gia sư **tiết kiệm thời gian soạn bài** và học sinh **tự học hiệu quả hơn**.

**Giá trị cốt lõi:**

- **Gia sư**: nhận lớp, soạn chương trình, giao bài tập cá nhân hóa — tất cả trên di động, trong vài phút.
- **Học sinh**: làm bài, được chấm tức thì, và tự hiểu lý do sai qua lời giải thích AI.
- **Phụ huynh**: đăng ký học thử nhanh, xem tiến bộ con bằng biểu đồ.
- **Admin**: ghép lớp, duyệt phí nhận lớp (sau 1 tháng dạy), quản lý lễ tân, xử lý khiếu nại và quản lý vận hành trung tâm tập trung tại một nơi.
- **Lễ tân**: hỗ trợ Admin xử lý yêu cầu ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, tiếp nhận và ghi nhận khiếu nại tại trung tâm.

## 2. Target User

### 2.1 Jobs To Be Done (JTBD)

* **Phụ huynh (Người chi trả)**:
  * *Functional*: Muốn tìm kiếm và lựa chọn gia sư tiếng Anh phù hợp với tính cách, lịch học và trình độ của con một cách nhanh chóng, minh bạch. Muốn dễ dàng gửi yêu cầu kết nối học thử mà không trải qua các thủ tục rườm rà. Muốn nắm bắt và theo dõi sát sao mức độ chăm chỉ cũng như sự tiến bộ thực chất về năng lực học tập của con theo thời gian.
  * *Emotional*: Cảm thấy yên tâm, tin tưởng vào sự minh bạch và chất lượng dịch vụ của trung tâm; tự hào khi thấy con tiến bộ.
* **Gia sư (Người dạy)**:
  * *Functional*: Muốn chủ động xây dựng và quản lý lộ trình bài giảng rõ ràng, khoa học cho từng học sinh. Muốn chuẩn bị và giao bài tập luyện tập cá nhân hóa bám sát nội dung vừa dạy trong thời gian ngắn nhất mà không tốn nhiều công sức soạn bài thủ công.
  * *Emotional*: Cảm thấy tự tin, giữ vững uy tín và thể hiện phong cách làm việc chuyên nghiệp, tận tâm trước phụ huynh mà không bị áp lực hay tốn thời gian bởi các công việc hành chính rườm rà.
* **Học sinh (Người học)**:
  * *Functional*: Muốn làm bài tập về nhà thuận tiện trên thiết bị cá nhân. Muốn ngay lập tức biết kết quả bài làm và hiểu rõ lý do vì sao mình làm đúng/sai ở từng câu để tự củng cố kiến thức mà không phải chờ đến buổi học tiếp theo.
  * *Emotional*: Cảm thấy việc làm bài tập nhẹ nhàng, không bị nản hay áp lực vì luôn có hướng dẫn/giải thích rõ ràng ngay khi gặp câu khó hoặc làm sai.
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

* **UJ-1. Chị Lan (Phụ huynh) tìm gia sư và đăng ký học thử qua Form Tìm Gia Sư**

  * **Persona + Context**: Chị Lan, nhân viên văn phòng bận rộn, có con trai Nam (10 tuổi) nhút nhát và phát âm kém. Chị cần tìm một gia sư nữ kiên nhẫn dạy vào tối Thứ 3 và Thứ 5.
  * **Entry State**: Chưa đăng nhập, truy cập trang chủ công khai của trung tâm, nhấn nút "Tìm Gia Sư Nhanh" hoặc vào xem chi tiết từng gia sư.
  * **Path 1** (Tìm gia sư chung — Matching mở rộng):
    1. Chị Lan điền Form tìm gia sư trực quan rồi nhấn gửi.
    2. Trung tâm nhận được thông tin, đẩy thông tin tìm lớp gia sư lên hệ thống chung.
    3. Các gia sư vào apply lớp.
    4. Trung tâm gọi điện lại cho phụ huynh trong vòng 12h, đưa ra list gia sư để phụ huynh lựa chọn.
    5. Phụ huynh đồng ý, chọn gia sư.
    6. Trung tâm gửi đề nghị tới gia sư.
    7. Gia sư đồng ý nhận lớp và nhận được thông tin, SĐT của phụ huynh.
    8. Sau 30 ngày gia sư sẽ trả tiền cho trung tâm.
  * **Path 2** (Chỉ đích gia sư — Matching trực tiếp):
    1. Chị Lan điền form chỉ đích gia sư (chọn trực tiếp gia sư mong muốn).
    2. Trung tâm match với gia sư được chỉ định.
    3. Nếu gia sư đồng ý thì nhận lớp ➔ Gia sư nhận thông tin liên hệ phụ huynh.
    4. Nếu gia sư không đồng ý, trung tâm liên hệ lại phụ huynh, và lại đăng lên cho gia sư apply (chuyển về Path 1).
  * **Climax**: Chị Lan được kết nối với gia sư phù hợp thông qua quy trình tư vấn chủ động của Trung tâm.
  * **Resolution**: Hệ thống tạo bản ghi Match Request, gia sư nhận lớp thành công. Sau 30 ngày dạy chính thức, gia sư nộp phí nhận lớp cho trung tâm.
* **UJ-2. Minh (Gia sư) nhận lớp, lập Khung chương trình, giao bài tập qua Tutor Assistant Dual-Mode và nộp phí QR proof sau 1 tháng dạy**

  * **Persona + Context**: Minh, sinh viên năm 3 chuyên ngành Tiếng Anh, đi dạy thêm bằng điện thoại di động.
  * **Entry State**: Đã đăng nhập tài khoản Gia sư trên di động.
  * **Path**:
    1. Minh nhận thông báo đề xuất nhận lớp Nam (10 tuổi). Minh bấm "Chấp nhận" ➔ Hệ thống tự động **Mở khóa (Unlock) SĐT & Địa chỉ của Phụ huynh** (chị Lan) để Minh chủ động liên hệ chốt lịch học thử.
    2. Minh liên hệ chị Lan, chốt ngày giờ học thử thành công, sau buổi học thử nhập **Lịch dạy cố định hàng tuần** và bấm chọn **"Kích hoạt lớp học chính thức"** (`ACTIVE`).
    3. Minh khởi tạo **Khung chương trình học tinh gọn (Curriculum Management)** cho lớp Nam bằng **Dual-Mode AI Curriculum Generation**: Minh có thể chọn Option A (nhập mô tả lớp *"Tiếng Anh 10 tuổi - Nhút nhát"* ➔ AI tự động sinh nháp khung 2 cấp trong hệ thống) hoặc Option B (Tải Prompt Mẫu dán vào ChatGPT ngoài ➔ Import JSON/Text kết quả vào hệ thống với 0 Token Cost), sau đó tinh chỉnh thêm Chủ đề 1 *"Family & Hobbies"* ➔ Bài 1 *"Present Simple & Daily Routines"*.
    4. Sau buổi dạy đầu tiên thuộc Bài 1, Minh chuẩn bị bài tập cho Nam bằng **Tutor Assistant Dual-Mode**:
       * *Option A (Direct AI Generation)*: Minh nhập/chat ghi chú nội dung bài dạy kèm yêu cầu bằng giọng văn tự nhiên: *"Tạo 5 câu trắc nghiệm ôn tập Thì hiện tại đơn và Từ vựng chủ đề Thói quen cho học sinh 10 tuổi"* ➔ Nhấn "Sinh bài tập AI".
       * *Option B (Import Structured File)*: Nếu muốn tiết kiệm token (0 Token Cost), Minh bấm "Tải Prompt Mẫu", dán vào ChatGPT/Claude ở ngoài ➔ Upload file JSON kết quả vào hệ thống để parse tự động.
    5. AI (`gpt-4o-mini` / `Gemini Flash`) tự động sinh bộ bài tập 5 câu (trắc nghiệm, điền từ, sửa lỗi) kèm Đáp án đúng và Lời giải thích chi tiết cho từng câu. Minh kiểm tra và bấm nút **"Giao bài"**.
    6. **Nộp phí nhận lớp sau 1 tháng dạy**: Khi lớp học chính thức tròn 1 tháng (30 ngày), hệ thống gửi thông báo yêu cầu nộp phí nhận lớp kèm mã VietQR chuyển khoản động. Minh chuyển khoản qua ngân hàng, chụp màn hình biên lai và tải ảnh minh chứng (QR proof) lên Cổng Gia sư để gửi Admin duyệt.
  * **Climax**: Bài tập chuyển thẳng sang Cổng Học sinh của Nam trong chưa đầy 2 phút, và yêu cầu nộp phí nhận lớp được hoàn tất sau 1 tháng dạy.
  * **Resolution**: Minh giảng dạy trơn tru, nộp phí nhận lớp đúng hạn sau 1 tháng dạy chính thức và Admin phê duyệt phí thành công.
* **UJ-3. Nam (Học sinh) hoàn thành bài tập online và tự học qua Lời giải thích AI**

  * **Persona + Context**: Nam, 10 tuổi, được gia sư giao bài tập về nhà sau buổi học để củng cố kiến thức.
  * **Entry State**: Đã đăng nhập tài khoản Học sinh.
  * **Path**:
    1. Nam mở bài tập mới do thầy Minh giao và tiến hành làm 5 câu trực tuyến (trắc nghiệm, điền từ).
    2. Đến câu số 4 (phát âm đuôi /t/ và /d/), Nam chọn nhầm đáp án.
  * **Climax**: Nam nhấn nút "Nộp bài".
  * **Resolution**: Hệ thống **tự động chấm điểm** (đạt 4/5 câu đúng). Ngay lập tức, màn hình hiển thị kết quả chi tiết từng câu kèm **Lời giải thích chi tiết do AI sinh sẵn** (ví dụ: *"Từ 'cat' kết thúc bằng âm bật hơi nhẹ ở đầu lưỡi /t/, trong khi 'dog' kết thúc bằng âm /d/..."*). Nam đọc lời giải thích và hiểu ngay lý do sai.
* **UJ-4. Anh Bình (Admin) tư vấn Phụ huynh, tạo Match Offer và phê duyệt phí nhận lớp sau 1 tháng dạy cho Gia sư**

  * **Persona + Context**: Anh Bình, quản trị viên vận hành trung tâm gia sư.
  * **Entry State**: Đã đăng nhập Admin Dashboard.
  * **Path**:
    1. Anh Bình xem màn hình **Match Request Management**, thấy yêu cầu đăng ký học thử của chị Lan cho học sinh Nam với cô Mai (95% Match).
    2. Anh Bình gọi điện/nhắn tin cho chị Lan để chốt lịch học thử và báo giá ➔ Bấm **"Tạo Match Offer"** gửi tới Cổng Gia sư của cô Mai (kèm thông tin số tiền phí nhận lớp dự kiến thu sau 1 tháng dạy).
    3. Cô Mai nhận thông báo Offer, bấm "Chấp nhận" ➔ Hệ thống tự động **Mở khóa (Unlock) SĐT & Địa chỉ của chị Lan trên Cổng Gia sư của cô Mai**.
    4. Cô Mai gọi điện cho chị Lan chốt ngày/giờ học thử ➔ Cập nhật **Lịch học thử** lên Cổng Gia sư (gửi thông báo nhắc lịch cho các bên).
    5. Sau khi hoàn thành buổi học thử, Cô Mai bấm chọn **"Hoàn thành buổi học thử"**.
    6. Cô Mai nhập **Lịch dạy cố định hàng tuần** (Thứ 3 & Thứ 5 từ 19:00 - 21:00) và chọn **"Kích hoạt lớp học chính thức"** (Trạng thái liên kết lớp chuyển sang `ACTIVE`).
    7. Sau 1 tháng dạy chính thức (30 ngày từ ngày kích hoạt lớp), hệ thống tự động sinh Yêu cầu nộp phí nhận lớp tới Cổng Gia sư của cô Mai. Cô Mai chuyển khoản và upload ảnh biên lai (QR proof).
    8. Màn hình Admin hiển thị thông báo phê duyệt phí kèm ảnh biên lai của cô Mai. Anh Bình kiểm tra ảnh chuyển khoản khớp số tiền và bấm **"Phê duyệt phí"** ➔ Trạng thái phí chuyển `PAID`.
  * **Climax**: Lớp học vận hành ổn định và khoản phí nhận lớp được đối soát phê duyệt thành công sau 1 tháng.
  * **Resolution**: Hệ thống tự động sinh Lịch dạy Calendar trên ứng dụng của Cô Mai và Học sinh Nam, theo dõi tiến độ lớp học và ghi nhận phí nhận lớp đã thanh toán `PAID`.

---

## 3. Glossary

* **Curriculum Management (Quản lý Khung chương trình học tinh gọn Dual-Mode)**: Tính năng cho phép Gia sư tạo và quản lý cấu trúc bài giảng 2 cấp (Chủ đề/Chương ➔ Bài học) theo chế độ Dual-Mode (Option A: Direct AI Generation trực tiếp trên hệ thống; Option B: Import File/Prompt Mẫu từ Web AI ngoài như ChatGPT/Claude với 0 Token Cost), hỗ trợ gán lộ trình bài học minh bạch cho Học sinh/Phụ huynh và làm ngữ cảnh định hướng nội dung khi sinh bài tập AI.
* **Form Tìm Gia Sư & Đăng ký Học thử**: Form tìm gia sư trực quan dành cho phụ huynh tại trang chủ, kết hợp nút Đăng ký học thử gửi yêu cầu ghép lớp tới Admin.
* **Tutor Assistant Dual-Mode**: Bộ công cụ AI hỗ trợ gia sư soạn bài tập cá nhân hóa với 2 chế độ: Option A (Direct AI Generation từ ghi chú bài dạy/tài liệu) và Option B (Import file bài tập cấu trúc từ ChatGPT/Claude ngoài với 0 token cost).
* **AI Explanation (Lời giải thích chi tiết AI)**: Đoạn văn bản giải thích kiến thức và lý do đáp án đúng/sai do AI tự động sinh sẵn cho từng câu hỏi, hiển thị ngay cho học sinh sau khi nộp bài.
* **Enrollment (Liên kết lớp học)**: Thực thể dữ liệu liên kết một gia sư với một học sinh cụ thể, làm cơ sở phân quyền bảo mật dữ liệu ở Backend (Gia sư chỉ được truy cập dữ liệu học sinh trong liên kết của mình).
* **Practice Homework (Bài tập về nhà / Luyện tập)**: Nội dung giao sau buổi dạy nhằm rèn luyện và củng cố kiến thức, cho phép chọn chế độ xem lời giải thích từng câu. Kết quả dùng để đo lường Chỉ số Chăm chỉ (không tính vào điểm tiến bộ năng lực).
* **Periodic Assessment / Quiz (Bài kiểm tra định kỳ)**: Bài test đánh giá năng lực làm trong điều kiện độc lập (xem kết quả sau khi nộp toàn bộ bài). Điểm số chính thức dùng để ghi nhận vào Biểu đồ Tiến bộ Năng lực.
* **Personal Progress Log (Báo cáo tiến bộ cá nhân)**: Dashboard phân tách rõ 2 thành phần: (1) *Chỉ số Chăm chỉ* (Tỷ lệ nộp & hoàn thành bài tập về nhà); và (2) *Biểu đồ Năng lực* (Điểm số trung bình từ các Bài kiểm tra định kỳ theo thời gian).
* **Matching Score (Điểm tương thích)**: Điểm số phần trăm (%) thể hiện mức độ phù hợp giữa hồ sơ gia sư và các tiêu chí yêu cầu của phụ huynh do thuật toán Backend tính toán.
* **Tutor Rate Card (Bảng giá Gia sư)**: Bảng định giá học phí theo từng khối lớp/trình độ do chính gia sư chủ động cấu hình trên hồ sơ cá nhân.
* **Ghi chú riêng tư (Private Notes)**: Ghi chú bảo mật do gia sư ghi chép về từng học sinh, chỉ hiển thị với Gia sư phụ trách và Admin.

---

## 4. Features

### 4.1 Parent Portal & Smart Registration Form

**Description:** Cung cấp giao diện công khai cho phụ huynh tìm gia sư qua Form trực quan, tra cứu danh sách gia sư phù hợp và gửi đăng ký học thử. (Thực hiện UJ-1)

**Functional Requirements:**

#### FR-1: Form tìm gia sư (Smart-Match Form)

Phụ huynh chưa đăng nhập có thể thực hiện tìm gia sư qua Form trực quan trên trang chủ.

* **Consequences (testable):**
  * *Mục tiêu học sinh:* Chọn đối tượng học sinh (Lớp/Độ tuổi), Trình độ hiện tại, Mục tiêu học tập.
  * *Yêu cầu gia sư:* Chọn giới tính, Mức học phí mong muốn, Tính cách ưu tiên.
  * *Khung giờ rảnh:* Chọn khung giờ rảnh trong tuần.

#### FR-2: Hiển thị danh sách Gia sư phù hợp

Backend nhận dữ liệu từ Form tìm gia sư và hiển thị danh sách gia sư phù hợp với mốc Matching Score (%).

* **Consequences (testable):**
  * Frontend hiển thị danh sách gia sư xếp theo Matching Score giảm dần kèm Điểm Đánh giá trung bình (Rating ★), số lượt Đánh giá sau học thử từ các phụ huynh trước, video giới thiệu bản thân và nút **"Đăng ký học thử"**.

#### FR-3: Đăng ký học thử

Phụ huynh bấm đăng ký học thử trực tiếp trên thẻ gia sư mong muốn mà không cần điền lại thông tin rườm rà.

* **Consequences (testable):**
  * Hệ thống tạo bản ghi Match Request trên PostgreSQL với trạng thái `PENDING`.
  * Yêu cầu phụ huynh nhập SĐT và xác thực OTP SMS để hoàn tất đăng ký.

#### FR-4: Tra cứu FAQ và Thông tin trung tâm

Trang chủ hiển thị danh mục câu hỏi thường gặp (FAQ) về chính sách học thử, học phí và bảo lãnh lớp.

* **Consequences (testable):**
  * Phụ huynh có thể tra cứu nhanh các thông tin chính sách mà không cần gọi tổng đài.

---

### 4.2 Tutor Portal, Curriculum Management & Dual-Mode AI Homework Generator

**Description:** Cung cấp cổng thông tin cho Gia sư trên di động, hỗ trợ quản lý lớp, quản lý khung chương trình học tinh gọn (Curriculum Management), và soạn bài tập cá nhân hóa siêu tốc qua **Tutor Assistant Dual-Mode** (Direct AI Generation hoặc Import Structured File). (Thực hiện UJ-2)

**Functional Requirements:**

#### FR-30: Quản lý Khung chương trình học tinh gọn bằng AI Dual-Mode (Curriculum Management Dual-Mode)

Gia sư khởi tạo và quản lý khung chương trình học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) cho từng liên kết lớp học, hỗ trợ tạo thủ công và sinh tự động nháp lộ trình bằng **AI Dual-Mode** (Direct AI Generation hoặc Import từ Web AI ngoài).

* **Consequences (testable):**
  * **Option A (Direct AI Generation):** Gia sư nhập thông tin lớp/trình độ học sinh hoặc mục tiêu khóa học (ví dụ: *"Tiếng Anh Lớp 5 - Mục tiêu luyện phát âm & giao tiếp"*) ➔ Backend gọi API AI (`gpt-4o-mini`/`Gemini Flash`) tự động sinh nháp khung chương trình 2 cấp tinh gọn trong dưới 5 giây. Gia sư có thể tùy chỉnh hoặc bấm duyệt lưu.
  * **Option B (Import Structured File / External Web AI):** Gia sư bấm "Tải Prompt Mẫu khung chương trình" để dán vào Web AI ngoài (ChatGPT/Claude/DeepSeek...) ➔ Upload file JSON hoặc dán đoạn văn bản kết quả lên hệ thống để trích xuất và khởi tạo khung chương trình tự động (0 Token Cost).
  * **Tạo & Chỉnh sửa thủ công:** Gia sư có thể tự tạo, thêm/xóa/sửa các Chủ đề/Chương và Bài học theo ý muốn.
  * **Theo dõi tiến độ lộ trình:** Khung chương trình hiển thị trạng thái tiến độ bài học (Đã hoàn thành / Đang học / Chưa học) giúp Phụ huynh & Học sinh nắm rõ lộ trình.
  * **Tích hợp Ngữ cảnh AI:** Khi sinh bài tập AI (FR-8), Gia sư có thể chọn gán theo một Bài học cụ thể trong Khung chương trình để làm định hướng nội dung cho AI.

#### FR-6: Tiếp nhận và phản hồi lời mời nhận lớp

Gia sư xem danh sách lớp được đề xuất và thực hiện Chấp nhận hoặc Từ chối.

* **Consequences (testable):**
  * Khi gia sư bấm "Chấp nhận", hệ thống tự động **mở khóa (Unlock) hiển thị SĐT & Địa chỉ Phụ huynh** trên Cổng Gia sư để Gia sư chủ động gọi điện liên hệ xếp lịch học thử.
  * Phí nhận lớp được tính toán và ghi nhận ở trạng thái chờ nộp sau khi lớp dạy tròn 1 tháng chính thức.

#### FR-8: Tự động soạn bài tập bằng AI Dual-Mode (Tutor Assistant)

Hỗ trợ gia sư soạn nháp bộ bài tập về nhà hoặc bài kiểm tra cá nhân hóa với phân loại rõ ràng (`PRACTICE` hoặc `ASSESSMENT`):

* **Consequences (testable):**
  * **Option A (Direct AI Generation):** Gia sư nhập/chat nội dung kiến thức bài dạy (hoặc chọn Bài học từ Khung chương trình) kèm yêu cầu câu hỏi bằng ngôn ngữ tự nhiên (hoặc upload file PDF/ảnh tài liệu). Backend gọi API AI (`gpt-4o-mini`/`Gemini Flash`) tự động sinh nháp bộ bài tập kèm Đáp án đúng và Lời giải thích chi tiết trong dưới 5 giây.
  * **Option B (Import Structured File):** Gia sư bấm "Tải Prompt Mẫu" để dán vào ChatGPT/Claude/DeepSeek ngoài ➔ Upload file JSON/Text kết quả lên hệ thống để trích xuất bài tập tự động (0 Token Cost).
  * **Phân loại bài:** Gia sư chọn thẻ phân loại trước khi giao: **Bài tập luyện tập** (`PRACTICE`) hoặc **Bài kiểm tra định kỳ** (`ASSESSMENT`).

#### FR-9: Duyệt và Giao bài tập

Gia sư xem trước, sửa đổi câu hỏi/đáp án/lời giải thích trực tiếp trên giao diện mobile và bấm nút "Giao bài".

* **Consequences (testable):**
  * Gia sư có thể chỉnh sửa bất kỳ văn bản câu hỏi hoặc đáp án nào trước khi giao.
  * Bấm nút **"Giao bài"** ➔ Bài tập được lưu vào DB và gửi thông báo chuyển ngay sang Cổng Học sinh trong dưới 1 giây (phê duyệt và chuyển bài tức thì).

#### FR-21: Quản lý bài giảng video và tài liệu học tập theo từng bài học

Gia sư có thể upload và đính kèm bài giảng video, tài liệu PDF/Word vào trực tiếp từng Bài học trong Khung chương trình (Curriculum) cho học sinh thông qua S3-compatible storage.

* **Consequences (testable):**
  * Cho phép gia sư chọn một Bài học cụ thể trong Khung chương trình ➔ Upload video hoặc tài liệu PDF/Word đính kèm trực tiếp vào bài học đó.
  * Dữ liệu tài liệu/video được lưu trữ an toàn trên S3-compatible storage và phân quyền truy cập theo liên kết lớp (`Enrollment`).

#### FR-25: Quản lý danh sách học sinh & Ghi chú riêng tư (Private Notes)

Gia sư xem danh sách học sinh thuộc liên kết `Enrollment` và ghi chép Ghi chú riêng tư cho từng học sinh.

* **Consequences (testable):**
  * Private Notes chỉ hiển thị cho Gia sư phụ trách (thuộc `Enrollment` của học sinh đó) và Admin.
  * Ẩn hoàn toàn Private Notes khỏi Cổng Phụ huynh & Cổng Học sinh.
  * Spring Boot RBAC API kiểm tra quyền truy cập: Trả về HTTP 403 Forbidden nếu Gia sư khác hoặc Phụ huynh/Học sinh gọi API lấy dữ liệu ghi chú.

#### FR-26: Xem Lịch dạy

Gia sư xem lịch dạy dạng Calendar View (phân loại ca đã dạy, chưa dạy, đổi lịch).

#### FR-28: Đổi lịch dạy và Báo nghỉ

Gia sư chủ động thực hiện Báo nghỉ hoặc Đổi lịch dạy trực tiếp trên app để báo cáo ghi nhận cho Trung tâm (Admin) và tự động cập nhật Lịch dạy.

* **Consequences (testable):**
  * **Báo nghỉ / Đổi lịch:** Gia sư chọn ca nghỉ hoặc ngày/giờ dạy bù mới ➔ Hệ thống tự động cập nhật ca dạy trên Calendar của Gia sư và Học sinh.
  * **Báo cáo Trung tâm (Admin):** Hệ thống sinh thông báo và lưu bản ghi lịch sử thay đổi lịch dạy trên Admin Dashboard để Admin giám sát vận hành trung tâm. Không yêu cầu Phụ huynh phải bấm phê duyệt trên app.

#### FR-29: Cấu hình Lịch học thử & Chốt Lịch dạy cố định hàng tuần

Gia sư nhập ngày/giờ học thử và chốt lịch học cố định sau khi buổi học thử thành công.

* **Consequences (testable):**
  * Sau khi mở khóa thông tin liên hệ, Gia sư nhập **Ngày & Giờ học thử** ➔ Hệ thống gửi thông báo nhắc lịch cho Admin, Phụ huynh và Gia sư.
  * Sau buổi học thử thành công, Gia sư chọn **"Học thử Thành công"** và thiết lập **Lịch dạy cố định hàng tuần** (ví dụ: Thứ 3 & Thứ 5 từ 19:00 - 21:00) ➔ Trạng thái lớp chuyển sang `ACTIVE`, tự động render các ca dạy tương lai lên Calendar của Gia sư và Học sinh.

#### FR-27: Quản lý Bảng giá Hồ sơ Gia sư (Tutor Rate Card)

Gia sư chủ động thiết lập bảng giá học phí của bản thân phân loại theo khối lớp và chương trình học trên Cổng Gia sư.

* **Consequences (testable):**
  * Cho phép gia sư cấu hình các mức học phí khác nhau theo khối lớp (ví dụ: Tiểu học 150k/buổi, THCS 200k/buổi, THPT/IELTS 300k/buổi). Mức giá này làm căn cứ hiển thị cho phụ huynh và tính phí nhận lớp.

---

### 4.3 Student Portal & Auto-Grading with AI Explanations

**Description:** Giao diện làm bài tập trực tuyến cho học sinh, tự động chấm điểm và hỗ trợ cấu hình hiển thị Lời giải thích chi tiết AI linh hoạt (xem ngay sau từng câu hoặc sau khi hoàn thành toàn bài). (Thực hiện UJ-3)

**Functional Requirements:**

#### FR-11: Làm bài tập online và Lưu lịch sử bài làm

Học sinh thực hiện làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi) và lưu kết quả vào lịch sử làm bài.

* **Consequences (testable):**
  * Tự động ghi nhận thời gian hoàn thành và kết quả làm bài vào Lịch sử tiến bộ cá nhân của học sinh.

#### FR-12: Tự động chấm điểm tức thì

Hệ thống tự động chấm điểm bài làm của học sinh ngay khi nhấn nút "Nộp bài".

* **Consequences (testable):**
  * Điểm số và tỷ lệ câu đúng/sai hiển thị ngay lập tức trên màn hình kết quả.

#### FR-13: Cấu hình và Hiển thị Lời giải thích chi tiết AI (AI Explanation)

Hệ thống hỗ trợ 2 chế độ hiển thị đáp án và lời giải thích AI linh hoạt dựa trên cấu hình khi gia sư giao bài:

* **Consequences (testable):**
  * **Chế độ xem tức thì (Per-question mode):** Ngay khi chọn đáp án cho 1 câu, màn hình phản hồi ngay đúng/sai kèm Lời giải thích AI chi tiết cho câu đó (thích hợp cho bài luyện tập).
  * **Chế độ nộp toàn bài (Submit-all mode):** Màn hình hiển thị tổng điểm và lời giải thích AI chi tiết cho từng câu sau khi học sinh nhấn "Nộp bài" toàn bộ bài tập (thích hợp cho bài kiểm tra).

#### FR-15: Báo cáo Tiến bộ Cá nhân (Personal Progress Report)

Hệ thống tổng hợp tiến độ học tập và phân tách báo cáo thành 2 thành phần độc lập:

* **Consequences (testable):**
  * **Chỉ số Chăm chỉ (Homework Completion Rate):** Thống kê tổng số bài tập về nhà (`PRACTICE`) đã làm, tỷ lệ hoàn thành đúng hạn (%) và mức độ chuyên cần.
  * **Biểu đồ Tiến bộ Năng lực (Assessment Score Trend):** Vẽ biểu đồ đường thể hiện điểm số trung bình qua các bài Kiểm tra định kỳ (`ASSESSMENT`) theo tuần/tháng để phụ huynh và gia sư theo dõi sự tiến bộ năng lực thực chất.

#### FR-22: Học tập qua video bài giảng & tài liệu theo lộ trình bài học

Học sinh truy cập Khung chương trình học để xem và tải các bài giảng video, tài liệu PDF/Word được gia sư đính kèm tương ứng theo từng bài học.

---

### 4.4 Admin Dashboard & Class Assignment Management

**Description:** Màn hình quản trị cho Admin quản lý các đăng ký học thử từ Phụ huynh, duyệt ghép lớp nhanh chóng, quản lý hồ sơ gia sư, phê duyệt phí nhận lớp qua QR proof, quản lý nhân sự lễ tân, và giám sát xử lý khiếu nại để đối soát doanh thu (thu vào/chi ra). (Thực hiện UJ-4)

**Functional Requirements:**

#### FR-16: Quản lý Yêu cầu ghép lớp & Tạo Match Offer (Match Request Management)

Admin Dashboard hiển thị danh sách các đăng ký học thử từ Phụ huynh qua Smart-Match Form.

* **Consequences (testable):**
  * Hệ thống tự động tính Học phí tháng theo Bảng giá của Gia sư chọn đúng khối lớp: `Học phí tháng = (Học phí/buổi do Gia sư đặt cho khối lớp đó) x (Số buổi/tuần) x 4`.
  * Hệ thống tự động tính `Phí nhận lớp = Học phí tháng x Tỷ lệ phí %` (mặc định 30%).
  * Admin gọi điện xác nhận nhu cầu & báo giá cho Phụ huynh ➔ Bấm **"Tạo Match Offer"** để gửi đề xuất nhận lớp (kèm thông tin số tiền phí nhận lớp dự kiến thu sau 1 tháng dạy) tới Cổng Gia sư.

#### FR-19: Phân quyền bảo mật Backend dựa trên Enrollment

Spring Boot kiểm soát phân quyền Row-level security dựa trên bảng `Enrollment`.

* **Consequences (testable):**
  * Gia sư chỉ được gọi API dữ liệu học sinh có liên kết `ACTIVE`. Yêu cầu khác trả về HTTP `403 Forbidden`.

#### FR-20: Audit Log hệ thống

Hệ thống ghi log chi tiết các thao tác quan trọng: `Gia sư duyệt giao bài`, `Admin tạo Match Offer`, `Admin duyệt phí`.

#### FR-23: Quản lý nộp phí QR proof và Phê duyệt phí nhận lớp sau 1 tháng dạy

Hệ thống quản lý việc phát sinh yêu cầu nộp phí nhận lớp sau khi Gia sư dạy chính thức tròn 1 tháng (30 ngày) và xử lý đối soát phê duyệt phí qua ảnh biên lai chuyển khoản (QR proof).

* **Consequences (testable):**
  * **Kích hoạt Yêu cầu nộp phí sau 1 tháng dạy**: Khi lớp học chính thức (`ACTIVE`) hoạt động đủ 30 ngày kể từ ngày kích hoạt, hệ thống gửi thông báo yêu cầu Gia sư nộp phí nhận lớp kèm mã VietQR chuyển khoản động.
  * **Nộp và Phê duyệt phí**: Gia sư thực hiện chuyển khoản và upload ảnh minh chứng chuyển khoản (QR proof). Admin kiểm tra ảnh biên lai khớp số tiền và bấm "Phê duyệt phí" ➔ Trạng thái phí chuyển sang `PAID`.
  * **Mở khóa thông tin liên hệ độc lập với việc thu phí**: Thông tin SĐT & Địa chỉ Phụ huynh đã được mở khóa ngay khi Gia sư bấm "Chấp nhận" Match Offer (FR-6), không bị giữ khóa chờ thu phí.

#### FR-24: Báo cáo vận hành Admin

Hiển thị biểu đồ doanh thu trung tâm, Tỷ lệ ghép lớp thành công và xuất file Excel/PDF.

#### FR-31: Quản lý nhân sự Lễ tân (Receptionist Management)

Admin quản lý danh sách nhân viên Lễ tân của trung tâm.

* **Consequences (testable):**
  * Admin có thể thực hiện CRUD (Tạo mới / Xem / Sửa / Xóa) tài khoản Lễ tân trên Admin Dashboard.
  * Mỗi Lễ tân có thông tin: Mã lễ tân, Họ tên, Email, SĐT, Ngày vào làm, Trạng thái (Đang hoạt động / Ngưng hoạt động).
  * Admin có thể lọc danh sách theo trạng thái và tìm kiếm theo tên/email/SĐT.

#### FR-32: Xử lý khiếu nại & Đối soát tài chính (Complaint Management)

Admin xem tổng hợp toàn bộ khiếu nại do Lễ tân ghi nhận để giám sát và đối soát thu chi.

* **Consequences (testable):**
  * Admin xem danh sách toàn bộ khiếu nại từ các Lễ tân kèm filter trạng thái (Chưa xử lí / Đã xử lí).
  * Mỗi đơn khiếu nại ghi rõ: Mã khiếu nại, Loại khiếu nại (Hoàn tiền cho gia sư / Ghép lại lớp cho phụ huynh), Mã & Họ tên người khiếu nại (gia sư/phụ huynh), Mã & Họ tên lễ tân tiếp nhận, Nội dung khiếu nại chi tiết, Thời gian tiếp nhận, Mã lớp liên quan, Số tiền hoàn (nếu có), Trạng thái xử lý, Ghi chú xử lý & kết quả.
  * Admin có thể đánh dấu trạng thái xử lý (Chưa xử lí ➔ Đã xử lí).
  * Admin xem tổng hợp tài chính: Tổng tiền đã hoàn trả (chi ra), Tổng khiếu nại ghép lại lớp, để đối soát với doanh thu thu vào.

---

### 4.5 Receptionist Portal & Complaint Management

**Description:** Cổng thông tin dành cho Lễ tân hỗ trợ vận hành trung tâm: xử lý yêu cầu ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, gửi thông báo, và đặc biệt tiếp nhận & ghi nhận khiếu nại từ phụ huynh/gia sư đến trực tiếp trung tâm.

**Functional Requirements:**

#### FR-33: Yêu cầu ghép lớp (Receptionist)

Lễ tân có quyền xem và xử lý danh sách yêu cầu ghép lớp từ phụ huynh, tương tự Admin (FR-16).

* **Consequences (testable):**
  * Lễ tân xem danh sách Match Request, gọi điện xác nhận phụ huynh, và tạo Match Offer gửi tới Gia sư.

#### FR-34: Duyệt thanh toán (Receptionist)

Lễ tân có quyền xem và duyệt các minh chứng thanh toán phí nhận lớp từ gia sư, tương tự Admin (FR-23).

* **Consequences (testable):**
  * Lễ tân kiểm tra ảnh biên lai chuyển khoản và bấm "Phê duyệt phí" hoặc "Yêu cầu gửi lại".

#### FR-35: Quản lý Gia sư & Học sinh (Receptionist)

Lễ tân có quyền xem danh sách gia sư và học sinh, cập nhật trạng thái hoạt động.

* **Consequences (testable):**
  * Lễ tân xem danh sách, lọc và tìm kiếm gia sư/học sinh.
  * Lễ tân cập nhật trạng thái hoạt động gia sư (không có quyền xóa).

#### FR-36: Thông báo (Receptionist)

Lễ tân nhận và xem các thông báo hệ thống liên quan đến vận hành trung tâm, tương tự Admin.

#### FR-37: Xử lý khiếu nại (Complaint Management)

Lễ tân tiếp nhận và ghi nhận khiếu nại từ phụ huynh hoặc gia sư đến trực tiếp trung tâm.

* **Consequences (testable):**
  * **Hai loại khiếu nại:**
    * *Hoàn tiền cho gia sư*: Gia sư yêu cầu hoàn lại phí nhận lớp đã nộp (ví dụ: do phụ huynh đơn phương hủy lớp sớm).
    * *Ghép lại lớp cho phụ huynh*: Phụ huynh yêu cầu đổi gia sư mới (ví dụ: không hài lòng chất lượng giảng dạy).
  * **Thông tin trên đơn khiếu nại:**
    * Mã khiếu nại (tự động sinh, ví dụ: `KN-20260918-001`)
    * Loại khiếu nại: `REFUND` (Hoàn tiền) hoặc `REMATCH` (Ghép lại lớp)
    * Người khiếu nại: Mã, Họ tên, Vai trò (Gia sư / Phụ huynh), SĐT
    * Lễ tân tiếp nhận: Mã lễ tân, Họ tên
    * Thời gian tiếp nhận khiếu nại
    * Mã lớp / Enrollment liên quan
    * Số tiền yêu cầu hoàn (nếu là loại `REFUND`)
    * Nội dung khiếu nại chi tiết
    * Trạng thái: `Chưa xử lí` / `Đã xử lí`
    * Ghi chú xử lý và kết quả (cập nhật khi xử lý xong)
  * Lễ tân tạo mới đơn khiếu nại, đánh dấu trạng thái `Chưa xử lí` → `Đã xử lí`.
  * Danh sách khiếu nại hiển thị với filter trạng thái và tìm kiếm.

---

## 5. Non-Goals (Explicit)

* **Không xây dựng tính năng Nhật ký buổi dạy (Lesson Log)**: Loại bỏ việc ghi chép nhật ký hành chính thủ công sau mỗi buổi học để tinh gọn thao tác cho gia sư 1-1, tập trung hoàn toàn vào Quản lý Khung chương trình và Giao bài tập AI.
* **Không xây dựng tính năng Đánh giá Gia sư sau buổi Học thử (Trial Lesson Review)**: Tạm thời chưa triển khai phần đánh giá sao và nhận xét từ phụ huynh sau buổi học thử — cần suy nghĩ thêm về thiết kế và quy trình.
* **Không hỗ trợ Khung chương trình học đa cấp**: Chỉ thiết kế tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) để tránh cồng kềnh quản lý cho gia sư 1-1.
* **Không xây dựng Gamification cồng kềnh (EXP, Streak, Bảng xếp hạng)**: Mô hình gia sư 1-1 tập trung vào sự tiến bộ cá nhân và sự tương tác giữa Gia sư - Học sinh - Phụ huynh. Tránh cơ chế bảng xếp hạng/EXP làm gia tăng áp lực hoặc so sánh khập khễnh giữa các trình độ khác nhau.
* **Không AI Chatbot tư vấn trên trang chủ**: Thay thế chatbot bằng Form tìm gia sư trực quan để tránh rủi ro hallucination và cồng kềnh hạ tầng SSE streaming.
* **Không Admin Live Chat Monitor & Takeover Mode**: Loại bỏ màn hình giám sát chat real-time của Admin.
* **Không Student Socratic Chatbot**: Loại bỏ khung chat AI rườm rà ở cổng học sinh, thay bằng tính năng tự động hiển thị Lời giải thích chi tiết AI cho từng câu ngay sau khi nộp bài.
* **Không dạy học trực tuyến tích hợp**: Học qua Zoom/Meet bên ngoài.
* **Không thanh toán trực tuyến tự động**: Phụ huynh/Gia sư chuyển khoản thủ công và Admin duyệt bằng tay trên hệ thống.

---

## 6. MVP Scope

### 6.1 In Scope

* Parent Portal: Landing Page, Form tìm gia sư trực quan, Nút Đăng ký học thử.
* Admin Dashboard: Match Request Management, Phê duyệt ghép lớp nhanh chóng, Duyệt phí nhận lớp (QR proof), Quản lý nhân sự lễ tân, Xử lý khiếu nại & Đối soát tài chính, Báo cáo vận hành.
* Receptionist Portal: Yêu cầu ghép lớp, Duyệt thanh toán, Quản lý gia sư & học sinh, Thông báo, Xử lý khiếu nại (Hoàn tiền / Ghép lại lớp).
* Tutor Portal: Quản lý lớp, Quản lý khung chương trình học tinh gọn 2 cấp (Chủ đề/Chương ➔ Bài học), Lịch dạy, **Tutor Assistant Dual-Mode** (Direct AI Generation + Import Structured File), Giao bài tức thì, Upload video/tài liệu S3.
* Student Portal: Làm bài tập online (Trắc nghiệm, Điền từ, Sửa lỗi), Tự động chấm điểm, Xem lời giải thích chi tiết AI từng câu, Báo cáo tiến bộ cá nhân.
* Backend Spring Boot RBAC theo `Enrollment`, Postgres DB, Docker deployment.

### 6.2 Out of Scope for MVP

* Tính năng Nhật ký buổi dạy (Lesson Log).
* Đánh giá định kỳ sau mỗi buổi học chính thức hoặc đánh giá học sinh bằng Emoticon.
* Khung chương trình học đa cấp phức tạp.
* AI Advisor Chatbot & Live Chat Takeover.
* Student Socratic Chatbot.
* Hệ thống Gamification phức tạp (EXP, Streak, Bảng xếp hạng).
* Thanh toán trực tuyến tự động.
* Báo cáo email tự động định kỳ cho phụ huynh.

---

## 7. Success Metrics

### 7.1 Primary Metrics

* **SM-1 (Matching Speed - Tốc độ ghép lớp)**: Thời gian từ lúc phụ huynh gửi đăng ký học thử qua Form đến khi gia sư bấm Chấp nhận lời mời nhận lớp giảm xuống dưới **12 giờ**.
* **SM-2 (Smart-Match Conversion Rate - Tỷ lệ chuyển đổi)**: Ít nhất **60%** số phụ huynh hoàn thành form tìm gia sư thực hiện gửi đăng ký học thử.
* **SM-3 (Tutor Prep Time - Thời gian chuẩn bị bài của Gia sư)**: Thời gian gia sư soạn và giao bài tập cá nhân hóa giảm đáng kể nhờ Tutor Assistant Dual-Mode (so với soạn thủ công từ đầu).

### 7.2 Secondary Metrics

* **SM-4 (Student Homework Completion Rate - Tỷ lệ hoàn thành bài)**: Ít nhất **75%** bài tập về nhà được học sinh hoàn thành trong vòng 48 giờ.
* **SM-5 (Explanation Utility Rate - Độ hữu ích của lời giải thích AI)**: 100% câu hỏi trong bài tập đều có lời giải thích chi tiết do AI tự động sinh sẵn.

### 7.3 Counter-metrics (Chỉ số kiểm soát rủi ro)

* **SM-C1 (API Cost per Homework - Chi phí API trên mỗi bài tập)**: Chi phí API gọi LLM (`gpt-4o-mini` / `Gemini Flash`) cho tính năng Tutor Assistant không vượt quá **$0.005 / bài tập** (~100 VNĐ).
* **SM-C2 (Tutor Question Modification Rate - Tỷ lệ sửa đổi câu hỏi)**: Ít nhất **85%** số câu hỏi do AI Tutor Assistant tạo ra được gia sư giữ nguyên hoặc chỉ sửa đổi nhỏ (dưới 10% ký tự).

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

### 8.4 Audit Trail

* Nhật ký hệ thống ghi log chi tiết các thao tác quan trọng: `Gia sư duyệt giao bài`, `Admin tạo Match Offer`, `Admin duyệt phí` (kèm ID tài khoản).

---

## 9. Open Questions

1. **Thuật toán Matching Score**: Cách thức tính điểm tương thích gia sư dựa trên những trọng số cụ thể (ưu tiên khung giờ rảnh 40%, kỹ năng 30%, giới tính/học phí 30%).
2. **Định dạng Import Bài tập (Option B)**: Định dạng file chuẩn (JSON hay Markdown) để gia sư upload từ ChatGPT ngoài vào hệ thống?
3. **Tương tác lịch dạy**: Gia sư gửi yêu cầu đổi lịch/báo nghỉ thì hệ thống tự động thông báo qua Zalo/SMS hay ứng dụng?

---

## 10. Assumptions Index

* **[ASSUMPTION-1]**: Giả định rằng phụ huynh sẵn sàng điền Form tìm gia sư ngắn (mất khoảng 30 giây) để nhận danh sách gia sư ghép cặp chính xác.
* **[ASSUMPTION-2]**: Giả định rằng gia sư có điện thoại thông minh để xem thông báo nhận lớp và bấm Giao bài tức thì.
