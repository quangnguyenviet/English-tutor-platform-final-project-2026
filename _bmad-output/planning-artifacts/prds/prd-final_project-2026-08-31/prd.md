---
title: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: final
created: 2026-08-31
updated: 2026-09-19
---
# PRD: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## 0. Document Purpose

Tài liệu PRD này định nghĩa các yêu cầu nghiệp vụ và kỹ thuật cho hệ thống hỗ trợ vận hành và giảng dạy gia sư tiếng Anh 1-1 có tích hợp AI và Spaced Repetition. Tài liệu làm cơ sở cho thiết kế UX, kiến trúc hệ thống và phân rã các user story cho các nhóm phát triển.

## 1. Vision

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1, với AI và Spaced Repetition đóng vai trò đòn bẩy giúp gia sư **tiết kiệm thời gian soạn bài cá nhân hóa** và học sinh **tự học, ghi nhớ lâu dài hiệu quả hơn**.

**Giá trị cốt lõi:**

- **Gia sư**: Nhận lớp, quản lý lộ trình bài dạy, giao bài tập cá nhân hóa tự động dựa trên **Student Knowledge Profile (SKP)** qua cơ chế **Tutor Assistant Dual-Mode** (Direct AI Generation hoặc Import File 0 Token Cost).
- **Học sinh**: Làm bài trực tuyến, được tự động chấm điểm tức thì, xem lời giải thích AI chi tiết và được hệ thống tự động nhắc ôn lại các kiến thức sắp quên theo thuật toán **Spaced Repetition (SM-2)**.
- **Phụ huynh**: Tìm gia sư nhanh qua Form trực quan, đăng ký học thử đơn giản, và theo dõi tiến bộ thực chất của con bằng biểu đồ định lượng.
- **Admin**: Ghép lớp, duyệt phí nhận lớp (sau 1 tháng dạy), quản lý lễ tân, xử lý khiếu nại (`REMATCH`, `REFUND`) và đối soát tài chính trung tâm tại một nơi.
- **Lễ tân**: Hỗ trợ Admin xử lý yêu cầu ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, tiếp nhận và ghi nhận khiếu nại trực tiếp tại trung tâm.

## 2. Target User

### 2.1 Jobs To Be Done (JTBD)

* **Phụ huynh (Người chi trả)**:
  * *Functional*: Muốn tìm kiếm và lựa chọn gia sư tiếng Anh phù hợp với tính cách, lịch học và trình độ của con một cách nhanh chóng, minh bạch. Muốn dễ dàng gửi yêu cầu kết nối học thử mà không trải qua các thủ tục rườm rà. Muốn nắm bắt và theo dõi sát sao mức độ chăm chỉ cũng như sự tiến bộ thực chất về năng lực học tập của con theo thời gian.
  * *Emotional*: Cảm thấy yên tâm, tin tưởng vào sự minh bạch và chất lượng dịch vụ của trung tâm; tự hào khi thấy con tiến bộ.
* **Gia sư (Người dạy)**:
  * *Functional*: Muốn chủ động xây dựng và quản lý lộ trình bài giảng rõ ràng, khoa học cho từng học sinh. Muốn chuẩn bị và giao bài tập luyện tập cá nhân hóa bám sát nội dung vừa dạy và điểm yếu thực tế của từng học sinh mà không tốn nhiều công sức soạn bài thủ công.
  * *Emotional*: Cảm thấy tự tin, giữ vững uy tín và thể hiện phong cách làm việc chuyên nghiệp, tận tâm trước phụ huynh mà không bị áp lực hay tốn thời gian bởi các công việc hành chính rườm rà.
* **Học sinh (Người học)**:
  * *Functional*: Muốn làm bài tập về nhà thuận tiện trên thiết bị cá nhân. Muốn ngay lập tức biết kết quả bài làm và hiểu rõ lý do vì sao mình làm đúng/sai ở từng câu. Muốn được nhắc ôn tập lại những kiến thức sắp quên đúng thời điểm để không bị hổng kiến thức.
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

* **UJ-2. Minh (Gia sư) nhận lớp, lập Khung chương trình, giao bài tập cá nhân hóa dựa trên SKP qua Tutor Assistant Dual-Mode và nộp phí QR proof sau 1 tháng dạy**

  * **Persona + Context**: Minh, sinh viên năm 3 chuyên ngành Tiếng Anh, đi dạy thêm bằng điện thoại di động.
  * **Entry State**: Đã đăng nhập tài khoản Gia sư trên di động.
  * **Path**:
    1. Minh nhận thông báo đề xuất nhận lớp Nam (10 tuổi). Minh bấm "Chấp nhận" ➔ Hệ thống tự động **Mở khóa (Unlock) SĐT & Địa chỉ của Phụ huynh** (chị Lan) để Minh chủ động liên hệ chốt lịch học thử.
    2. Minh liên hệ chị Lan, chốt ngày giờ học thử thành công, sau buổi học thử nhập **Lịch dạy cố định hàng tuần** và bấm chọn **"Kích hoạt lớp học chính thức"** (`ACTIVE`).
    3. Minh khởi tạo **Khung chương trình học tinh gọn (Curriculum Management)** cho lớp Nam bằng **Dual-Mode AI Curriculum Generation** (Option A: AI sinh nháp 3-5s hoặc Option B: Import file 0 token cost).
    4. Sau buổi dạy, Minh giao bài tập cá nhân hóa cho Nam bằng **Tutor Assistant Dual-Mode**:
       * Minh chọn bài vừa dạy và nhập yêu cầu câu hỏi. Hệ thống tự động truy xuất dữ liệu từ **Student Knowledge Profile (SKP)** của Nam (gồm điểm Elo rating micro-skill, dạng lỗi hay mắc, kỹ năng yếu) để làm **Adaptive Input Context**.
       * *Option A (Direct AI Generation)*: Minh bấm "Sinh bài tập AI" ➔ AI sinh nháp bộ bài tập cá nhân hóa trong 3-5s.
       * *Option B (Import Structured File)*: Bấm "Tải Prompt Mẫu nhúng SKP", dán vào ChatGPT/Claude ngoài ➔ Upload file JSON kết quả (0 Token Cost).
    5. Minh kiểm tra câu hỏi/lời giải thích và bấm **"Giao bài"**.
    6. **Nộp phí nhận lớp sau 1 tháng dạy**: Khi lớp học chính thức tròn 30 ngày, hệ thống gửi thông báo kèm VietQR. Minh chuyển khoản và upload ảnh biên lai (QR proof) để Admin phê duyệt.
  * **Climax**: Bài tập chuyển sang Cổng Học sinh của Nam trong chưa đầy 2 phút, bám sát điểm yếu của Nam.
  * **Resolution**: Minh giảng dạy hiệu quả, nộp phí nhận lớp đúng hạn và được Admin phê duyệt `PAID`.

* **UJ-3. Nam (Học sinh) hoàn thành bài tập online, đọc Lời giải thích AI và Ôn tập Ngắt quãng (Spaced Repetition)**

  * **Persona + Context**: Nam, 10 tuổi, làm bài tập về nhà và tự ôn tập theo nhắc nhở của hệ thống.
  * **Entry State**: Đã đăng nhập tài khoản Học sinh.
  * **Path**:
    1. Nam làm 5 câu bài tập về nhà do thầy Minh giao (trắc nghiệm, điền từ, sửa lỗi). Hệ thống **tự động chấm điểm** và hiển thị **Lời giải thích AI chi tiết** cho từng câu làm sai.
    2. Sau khi nộp bài, điểm `mastery_score` cho kỹ năng tương ứng trong **Student Knowledge Profile (SKP)** của Nam tự động cập nhật theo **Thuật toán Elo Rating**.
    3. Mỗi ngày truy cập ứng dụng, Nam thấy mục **"Ôn tập kiến thức ngắt quãng (Spaced Repetition)"** gợi ý các câu hỏi/kiến thức sắp đến hạn ôn (`next_review`) dựa trên thuật toán **SM-2**. Nam hoàn thành phiên ôn tập ngắt quãng 5 phút.
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
* **Vòng lặp cá nhân hóa khép kín (Closed Loop)**: Chu trình tự động: Học sinh làm bài $\rightarrow$ Cập nhật SKP (Elo rating) $\rightarrow$ Cập nhật SM-2 $\rightarrow$ Daily Job chọn câu hỏi ôn $\rightarrow$ Tutor Assistant sinh bài mới chuẩn SKP.
* **Curriculum Management Dual-Mode**: Tính năng cho phép Gia sư quản lý cấu trúc bài giảng 2 cấp (Chủ đề/Chương ➔ Bài học) theo chế độ Dual-Mode (Option A: Direct AI Generation; Option B: Import File 0 Token Cost).
* **Form Tìm Gia Sư & Đăng ký Học thử**: Form tìm gia sư trực quan dành cho phụ huynh tại trang chủ, gửi yêu cầu ghép lớp tới Admin.
* **Tutor Assistant Dual-Mode**: Bộ công cụ AI hỗ trợ gia sư soạn bài tập cá nhân hóa dựa trên SKP với 2 chế độ: Option A (Direct AI Generation) và Option B (Import File 0 Token Cost từ ChatGPT/Claude ngoài).
* **AI Explanation (Lời giải thích chi tiết AI)**: Đoạn văn bản giải thích kiến thức và lý do đáp án đúng/sai do AI tự động sinh sẵn cho từng câu hỏi, hiển thị ngay cho học sinh sau khi nộp bài.
* **Enrollment (Liên kết lớp học)**: Thực thể dữ liệu liên kết một gia sư với một học sinh cụ thể, làm cơ sở phân quyền bảo mật dữ liệu ở Backend (Row-level security).

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
  * Frontend hiển thị danh sách gia sư xếp theo Matching Score giảm dần kèm Điểm Đánh giá trung bình, video giới thiệu bản thân và nút **"Đăng ký học thử"**.

#### FR-3: Đăng ký học thử
Phụ huynh bấm đăng ký học thử trực tiếp trên thẻ gia sư mong muốn.
* **Consequences (testable):**
  * Hệ thống tạo bản ghi Match Request trên PostgreSQL với trạng thái `PENDING`.
  * Yêu cầu phụ huynh nhập SĐT và xác thực OTP SMS để hoàn tất đăng ký.

#### FR-4: Tra cứu FAQ và Thông tin trung tâm
Trang chủ hiển thị danh mục câu hỏi thường gặp (FAQ) về chính sách học thử, học phí và bảo lãnh lớp.

---

### 4.2 Tutor Portal, Curriculum Management & Dual-Mode AI Homework Generator

**Description:** Cung cấp cổng thông tin cho Gia sư trên di động, hỗ trợ quản lý lớp, quản lý khung chương trình học tinh gọn (Curriculum Management), và soạn bài tập cá nhân hóa dựa trên SKP qua **Tutor Assistant Dual-Mode**. (Thực hiện UJ-2)

**Functional Requirements:**

#### FR-30: Quản lý Khung chương trình học tinh gọn bằng AI Dual-Mode (Curriculum Management Dual-Mode)
Gia sư khởi tạo và quản lý khung chương trình học tinh gọn 2 cấp (*Chủ đề/Chương ➔ Bài học*) cho từng liên kết lớp học.
* **Consequences (testable):**
  * **Option A (Direct AI Generation):** Gia sư nhập thông tin lớp/trình độ học sinh ➔ Backend gọi API AI (`gpt-4o-mini`/`Gemini Flash`) tự động sinh nháp khung chương trình 2 cấp tinh gọn trong dưới 5 giây.
  * **Option B (Import Structured File):** Gia sư tải Prompt Mẫu dán vào Web AI ngoài ➔ Upload file JSON/Text kết quả vào hệ thống để trích xuất tự động (0 Token Cost).
  * **Tạo & Chỉnh sửa thủ công:** Thêm/xóa/sửa các Chủ đề/Chương và Bài học.

#### FR-6: Tiếp nhận và phản hồi lời mời nhận lớp
Gia sư xem danh sách lớp được đề xuất và thực hiện Chấp nhận hoặc Từ chối.
* **Consequences (testable):**
  * Bấm "Chấp nhận" ➔ Hệ thống tự động **mở khóa (Unlock) SĐT & Địa chỉ Phụ huynh** trên Cổng Gia sư.

#### FR-8: Tự động soạn bài tập cá nhân hóa dựa trên SKP bằng AI Dual-Mode (Tutor Assistant)
Hỗ trợ gia sư soạn nháp bộ bài tập cá nhân hóa (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) kèm đáp án & lời giải thích AI chi tiết:
* **Consequences (testable):**
  * **Adaptive Input Context:** Backend tự động trích xuất dữ liệu từ **Student Knowledge Profile (SKP)** của học sinh (Skill Mastery theo Elo rating, Error Patterns, điểm yếu/mạnh, mục tiêu) gộp cùng nội dung bài vừa dạy làm bối cảnh đầu vào cho AI.
  * **Option A (Direct AI Generation):** Gia sư nhập nội dung vừa dạy ➔ Backend gọi API AI (`gpt-4o-mini`/`Gemini Flash`) sinh nháp bộ bài tập cá nhân hóa trong dưới 5 giây.
  * **Option B (Import Structured File):** Tải Prompt Mẫu đã đóng gói sẵn cấu trúc SKP ➔ Dán vào ChatGPT/Claude ngoài ➔ Upload file JSON/Text kết quả vào hệ thống (0 Token Cost).
  * **Phân loại bài:** Chọn thẻ phân loại bài luyện tập (`PRACTICE`) hoặc bài kiểm tra (`ASSESSMENT`).

#### FR-9: Duyệt và Giao bài tập
Gia sư xem trước, sửa đổi câu hỏi/đáp án/lời giải thích trực tiếp trên di động và bấm nút "Giao bài" (chuyển sang Cổng Học sinh trong dưới 1s).

#### FR-21: Quản lý bài giảng video và tài liệu học tập theo từng bài học
Gia sư upload bài giảng video, tài liệu PDF/Word đính kèm trực tiếp vào từng Bài học trong Khung chương trình qua S3 storage.

#### FR-25: Quản lý danh sách học sinh & Ghi chú riêng tư (Private Notes)
Gia sư ghi chép Ghi chú riêng tư cho từng học sinh. Phân quyền API trả về `403 Forbidden` nếu bên ngoài gọi truy cập.

#### FR-26: Xem Lịch dạy & FR-28: Đổi lịch dạy và Báo nghỉ
Gia sư xem Calendar view; thực hiện báo nghỉ/đổi lịch dạy (tự động cập nhật Calendar và báo cáo ghi nhận cho Admin).

#### FR-29: Cấu hình Lịch học thử & Chốt Lịch dạy cố định hàng tuần
Gia sư nhập ngày học thử và chốt lịch học cố định hàng tuần sau khi học thử thành công để kích hoạt trạng thái lớp `ACTIVE`.

#### FR-27: Quản lý Bảng giá Hồ sơ Gia sư (Tutor Rate Card)
Gia sư cấu hình bảng giá học phí theo khối lớp/chương trình học để làm căn cứ tính phí và hiển thị.

---

### 4.3 Student Portal, Personalization Core & Spaced Repetition

**Description:** Giao diện làm bài tập trực tuyến cho học sinh, tự động chấm điểm, hiển thị Lời giải thích chi tiết AI, cập nhật **Student Knowledge Profile (SKP)** qua Elo rating và tự động lập lịch **Spaced Repetition (SM-2)**. (Thực hiện UJ-3)

**Functional Requirements:**

#### FR-11: Làm bài tập online và Lưu lịch sử bài làm
Học sinh làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) và lưu kết quả bài làm.

#### FR-12: Tự động chấm điểm tức thì
Hệ thống tự động chấm điểm bài làm ngay khi nhấn "Nộp bài", hiển thị tỷ lệ đúng/sai tức thì.

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

#### FR-22: Học tập qua video bài giảng & tài liệu theo lộ trình bài học
Học sinh mở xem video bài giảng và tài liệu PDF/Word do gia sư đính kèm theo từng bài học.

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

* **Không xây dựng tính năng Nhật ký buổi dạy (Lesson Log)**: Loại bỏ ghi chép hành chính thủ công sau từng buổi học, tập trung vào Khung chương trình và Giao bài tập AI.
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

* Parent Portal: Landing Page, Form tìm gia sư trực quan, Nút Đăng ký học thử.
* Admin Dashboard: Match Request Management, Phê duyệt ghép lớp, Duyệt phí nhận lớp (QR proof), Quản lý lễ tân, Xử lý khiếu nại & Đối soát tài chính, Báo cáo vận hành.
* Receptionist Portal: Yêu cầu ghép lớp, Duyệt thanh toán, Quản lý gia sư & học sinh, Thông báo, Xử lý khiếu nại (Hoàn tiền / Ghép lại lớp).
* Tutor Portal: Quản lý lớp, Curriculum Management Dual-Mode 2 cấp, Lịch dạy, **Tutor Assistant Dual-Mode** (Sinh bài tập cá nhân hóa dựa trên SKP qua Direct AI Gen hoặc Import Structured File 0 Token Cost), Giao bài tức thì, Upload tài liệu S3.
* Student Portal: Làm bài tập online, Tự động chấm điểm, Xem lời giải thích AI từng câu, **Student Knowledge Profile (SKP) với Elo Rating**, **Ôn tập ngắt quãng Spaced Repetition (SM-2)**, Báo cáo tiến bộ cá nhân.
* Backend Spring Boot RBAC theo `Enrollment`, Postgres DB, Docker deployment.

### 6.2 Out of Scope for MVP

* Nhật ký buổi dạy (Lesson Log).
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
* **SM-3 (Tutor Prep Time - Thời gian chuẩn bị bài của Gia sư)**: Thời gian gia sư soạn và giao bài tập cá nhân hóa giảm đáng kể nhờ Tutor Assistant Dual-Mode (so với soạn thủ công từ đầu).
* **SM-4 (Knowledge Retention Rate - Tỷ lệ ghi nhớ dài hạn)**: Ít nhất **70%** số câu hỏi ôn tập ngắt quãng Spaced Repetition (SM-2) được học sinh trả lời đúng trong các phiên ôn tập định kỳ.

### 7.2 Secondary Metrics

* **SM-5 (Student Homework Completion Rate)**: Ít nhất **75%** bài tập về nhà được học sinh hoàn thành trong vòng 48 giờ.
* **SM-6 (Explanation Utility Rate)**: 100% câu hỏi bài tập đều có lời giải thích chi tiết do AI tự động sinh sẵn.

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
* PostgreSQL lưu trữ có cấu trúc các bảng dữ liệu trọng yếu (`student_knowledge_profile`, `spaced_repetition_schedules`, `error_patterns`, `questions`, `enrollments`, `audit_logs`...).

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
