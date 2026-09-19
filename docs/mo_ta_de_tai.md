
# Mô tả đề tài

## Tên đề tài đề xuất

**Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition**

## 1. Đặt vấn đề

Mô hình dạy kèm tiếng Anh 1-1 đang ngày càng phổ biến, tuy nhiên các nền tảng tìm gia sư hiện nay chủ yếu tập trung vào việc kết nối học sinh với gia sư, trong khi quá trình dạy và học sau đó vẫn phụ thuộc nhiều vào công việc thủ công của gia sư. Gia sư phải tự soạn nội dung, tạo bài tập và theo dõi năng lực của từng học sinh, trong khi học sinh thường phải chờ đến buổi học tiếp theo để được giải thích và sửa lỗi.

Hệ thống của nhóm ứng dụng AI để hỗ trợ quá trình dạy và học. Gia sư có thể nhanh chóng xây dựng nội dung và tạo bài tập cá nhân hóa dựa trên năng lực của từng học sinh. Hệ thống đồng thời lưu trữ Student Knowledge Profile để theo dõi kiến thức đã học, mức độ thành thạo và những điểm còn yếu. Dựa trên dữ liệu này, hệ thống sử dụng Spaced Repetition để tự động lựa chọn và lập lịch các nội dung cần ôn tập.

Đối với học sinh, hệ thống cung cấp bài tập phù hợp với năng lực, phản hồi và giải thích lỗi sai ngay sau khi làm bài, đồng thời nhắc ôn lại những kiến thức còn yếu đúng thời điểm. Đối với gia sư, hệ thống giảm thời gian chuẩn bị bài và cung cấp dữ liệu chi tiết về quá trình học của từng học sinh, giúp gia sư có thêm thời gian tập trung vào việc giảng dạy và hỗ trợ những điểm học sinh còn yếu.

## 2. Các chức năng chính dự định phát triển

Hệ thống được thiết kế theo 4 cổng người dùng dành cho 4 nhóm đối tượng:

### Cổng Phụ huynh

- **Tìm kiếm & Xem hồ sơ gia sư phù hợp:** Phụ huynh chọn các tiêu chí (độ tuổi/trình độ/mục tiêu của con, yêu cầu về gia sư, khung giờ rảnh trong tuần), hệ thống tự động trả về danh sách các hồ sơ gia sư phù hợp nhất (kèm thông tin kinh nghiệm và video tự giới thiệu) để phụ huynh tham khảo và lựa chọn.
- **Đăng ký học thử đơn giản:** Phụ huynh chọn gia sư ưng ý và hoàn tất đăng ký học thử nhanh chóng qua tin nhắn xác thực SĐT.
- **Tra cứu thông tin minh bạch:** Dễ dàng tìm hiểu thông tin trung tâm cùng các giải đáp thường gặp về chính sách học thử và bảo đảm chất lượng.

### Cổng Gia sư

- **Nhận lớp & Liên hệ phụ huynh ngay:** Tiếp nhận và phản hồi các đề nghị nhận lớp từ trung tâm. Ngay khi đồng ý nhận lớp, gia sư sẽ thấy thông tin liên hệ của phụ huynh để chủ động gọi điện sắp xếp buổi học thử.
- **Quản lý lịch học thử & Lịch dạy cố định:** Nhập thời gian học thử và chốt lịch dạy cố định hàng tuần sau khi nhận lớp thành công. Lịch dạy sẽ tự động hiển thị trên thời khóa biểu.
- **Xây dựng khung chương trình học nhanh chóng (Curriculum Management Dual-Mode):** Dễ dàng tạo và sắp xếp lộ trình bài học tinh gọn 2 cấp (Chủ đề/Chương ➔ Bài học). Gia sư có thể tự nhập thủ công hoặc linh hoạt sử dụng cơ chế **Dual-Mode**:
  - **Option A (Direct AI Generation):** Nhập trình độ, mục tiêu của học sinh để AI sinh trực tiếp nháp khung bài giảng 2 cấp trên hệ thống chỉ trong 3–5 giây.
  - **Option B (Import Structured File):** Tải Prompt Mẫu dán vào các Web AI ngoài (ChatGPT, Claude...) và import file JSON/Text kết quả vào hệ thống với **0 Token Cost**.
- **Tạo bài tập cá nhân hóa dựa trên Student Knowledge Profile (Tutor Assistant Dual-Mode):** Nhập nội dung bài vừa dạy, AI sẽ tự động truy xuất dữ liệu từ **Student Knowledge Profile** của học sinh (mức độ thành thạo micro-skill, các dạng lỗi sai thường gặp, điểm yếu và mục tiêu) để sinh bộ bài tập cá nhân hóa (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) kèm đáp án và lời giải thích chi tiết. Hỗ trợ 2 chế độ **Dual-Mode**:
  - **Option A (Direct AI Generation):** Sinh bài tập trực tiếp từ ứng dụng, tự động đóng gói dữ liệu SKP làm bối cảnh đầu vào (Adaptive Input Context) để AI sinh bài tập cá nhân hóa chuẩn xác trong 3–5 giây.
  - **Option B (Import Structured File):** Tải Prompt Mẫu đã đóng gói sẵn cấu trúc SKP để chạy trên Web AI ngoài (ChatGPT, Claude...) và import file kết quả vào hệ thống với **0 Token Cost**.
- **Duyệt và giao bài tập tức thì:** Kiểm tra, tùy chỉnh nội dung câu hỏi/đáp án ngay trên điện thoại và gửi bài tập cho học sinh chỉ với một thao tác.
- **Xem báo cáo Student Knowledge Profile:** Theo dõi chi tiết về điểm thành thạo, các dạng lỗi sai hay mắc, điểm mạnh, điểm yếu và sự tiến bộ của học sinh qua từng thời kỳ.
- **Ghi chú riêng về học sinh:** Ghi chép lưu ý cá nhân về tính cách, thói quen của từng học sinh để giảng dạy tốt hơn (thông tin này bảo mật, chỉ gia sư và trung tâm thấy).
- **Đính kèm tài liệu & bài giảng:** Tải lên bài giảng video và tài liệu học tập (PDF, Word) tương ứng với từng bài học để học sinh ôn thêm ở nhà.
- **Quản lý thời khóa biểu & Báo nghỉ/Đổi lịch:** Xem lịch dạy hàng tuần; chủ động báo nghỉ hoặc hẹn lịch dạy bù khi có việc bận (hệ thống tự động cập nhật lịch cho học sinh và báo cho trung tâm).
- **Quản lý bảng học phí:** Tự cập nhật các mức học phí của bản thân theo từng khối lớp và chương trình học.
- **Nộp phí nhận lớp tiện lợi:** Sau 1 tháng dạy chính thức, gia sư nhận thông tin chuyển khoản phí nhận lớp và tải ảnh chụp hóa đơn lên hệ thống để trung tâm phê duyệt.

### Cổng Học sinh

- **Làm bài tập trực tuyến mọi lúc mọi nơi:** Làm bài tập về nhà hoặc bài kiểm tra (trắc nghiệm, điền từ, sửa lỗi, viết lại câu) ngay trên điện thoại hoặc máy tính.
- **Chấm điểm tức thì:** Hệ thống tự động chấm điểm và hiển thị kết quả đúng/sai ngay sau khi nộp bài.
- **Xem lời giải thích chi tiết do AI soạn sẵn:** Hệ thống cung cấp hướng dẫn giải chi tiết cho từng câu để học sinh tự hiểu lỗi sai.
- **Bài tập cá nhân hóa & Ôn tập ngắt quãng:** Bài tập được thiết kế tự động dựa trên Student Knowledge Profile (tập trung vào kỹ năng yếu nhất, độ khó phù hợp). Hệ thống tự động nhắc lại các câu hỏi/kiến thức sắp quên vào các phiên ôn tập hàng ngày để giúp học sinh ghi nhớ lâu hơn.
- **Xem tài liệu và video bài giảng:** Dễ dàng mở xem bài giảng video và tài liệu đính kèm do gia sư gửi theo từng bài học.
- **Theo dõi biểu đồ tiến bộ cá nhân:** Phân tách rõ ràng giữa *Chỉ số chăm chỉ* (tỷ lệ làm bài tập về nhà đúng hạn) và *Biểu đồ năng lực* (kết quả các bài kiểm tra định kỳ theo thời gian).

### Cổng Lễ tân

- **Xử lý yêu cầu ghép lớp (Match Request Management):** Tiếp nhận danh sách đăng ký học thử từ phụ huynh qua Match Form; gọi điện thoại tư vấn, xác nhận nhu cầu và tạo đề nghị nhận lớp (Match Offer) gửi tới gia sư phù hợp.
- **Duyệt thanh toán phí nhận lớp qua QR proof:** Tiếp nhận và kiểm tra ảnh biên lai chuyển khoản phí nhận lớp (sau 1 tháng dạy) do gia sư tải lên; đối soát số tiền khớp lệnh và thực hiện phê duyệt phí hoặc gửi yêu cầu tải lại minh chứng nếu sai lệch.
- **Quản lý Gia sư & Học sinh:** Xem danh sách, tra cứu, lọc hồ sơ gia sư và học sinh trong trung tâm; cập nhật trạng thái hoạt động của tài khoản gia sư để phục vụ điều phối lớp học.
- **Tiếp nhận & Ghi nhận khiếu nại (Complaint Management):** Tiếp nhận khiếu nại trực tiếp từ phụ huynh hoặc gia sư đến trung tâm và tạo đơn ghi nhận lên hệ thống:
- **Nhận thông báo vận hành:** Tiếp nhận và theo dõi các thông báo biến động hệ thống liên quan đến vận hành trung tâm (yêu cầu học thử mới, gia sư báo đổi lịch/nghỉ dạy, minh chứng thanh toán mới...).

### Cổng Quản trị viên

- **Quản lý ghép lớp và Điều phối tổng thể:** Giám sát toàn bộ luồng yêu cầu ghép lớp từ phụ huynh.
- **Phê duyệt phí nhận lớp và Đối soát tài chính tập trung:** Kiểm tra minh chứng chuyển khoản (QR proof) của gia sư sau 1 tháng dạy chính thức, bấm phê duyệt chuyển trạng thái phí sang `PAID` và theo dõi dòng tiền thu vào của trung tâm.
- **Giám sát và Xử lý khiếu nại tổng thể (Complaint Oversight và Financial Reconciliation):** Xem danh sách toàn bộ khiếu nại do các Lễ tân tiếp nhận kèm bộ lọc trạng thái; giám sát tiến độ xử lý khiếu nại đổi gia sư (`REMATCH`) và hoàn tiền (`REFUND`); tổng hợp số tiền hoàn trả (chi ra) để đối soát cân đối tài chính với doanh thu thu vào.
- **Quản lý nhân sự (Lễ tân, học sinh, gia sư) :** Quản lý toàn diện danh sách đối tượng tham gia hệ thống.
- **Báo cáo vận hành & Xuất dữ liệu trung tâm:** Theo dõi biểu đồ trực quan về doanh thu, số lượng lớp học đang hoạt động, tỷ lệ ghép lớp thành công; hỗ trợ xuất báo cáo định kỳ dưới định dạng Excel hoặc PDF.
- **Bảo mật phân quyền & Nhật ký kiểm toán (Audit Log):** Kiểm soát phân quyền Row-level security nghiêm ngặt theo bảng `Enrollment` (đảm bảo gia sư chỉ truy cập được dữ liệu lớp phụ trách); hệ thống tự động ghi nhật ký kiểm toán (Audit Log) chi tiết cho các thao tác trọng yếu (tạo Match Offer, duyệt phí, xử lý khiếu nại, duyệt giao bài...).

## 3. Các thành phần kỹ thuật cốt lõi

### 3.1. Student Knowledge Profile (Hồ sơ tri thức người học)

Student Knowledge Profile (SKP) là bộ nhớ dài hạn của hệ thống, lưu trữ có cấu trúc toàn bộ trạng thái học tập của học sinh theo thời gian. SKP là đầu vào bắt buộc cho mọi quyết định cá nhân hóa — thay vì gửi prompt chung chung cho AI.

#### Các thành phần dữ liệu:

| Nhóm                            | Nội dung                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Skill Mastery**          | Điểm thành thạo 0–100 cho từng micro-skill (ví dụ:`past_simple`, `third_person_s`, `travel_vocabulary`), cập nhật theo thuật toán Elo |
| **Confidence Score**       | Độ tin cậy điểm số dựa trên tổng số lần thử, độ đa dạng câu hỏi, độ mới và độ ổn định kết quả                              |
| **Error Patterns**         | Các dạng lỗi sai thường gặp, tần suất, mức độ nghiêm trọng, xu hướng cải thiện (map về Error Pattern Catalog)                         |
| **Strengths & Weaknesses** | Top 5 skill mạnh nhất và yếu nhất, tính tự động từ Skill Mastery & Batch Job phân tích                                                      |
| **Goals**                  | Mục tiêu học tập (IELTS, giao tiếp...), hạn chót, kỹ năng ưu tiên                                                                            |

#### Cơ chế cập nhật — Thuật toán Elo Rating:

Điểm `mastery_score` được cập nhật sau mỗi câu trả lời:

$$
\text{Expected} = \frac{1}{1 + 10^{\frac{\text{difficulty} - \text{mastery}}{400}}}
$$

$$
\text{mastery}_{\text{new}} = \text{mastery}_{\text{old}} + K \times (\text{actual} - \text{Expected})
$$

Trong đó:

- `actual = 1` nếu đúng, `0` nếu sai.
- `Difficulty Score` thể hiện mức độ khó của câu hỏi theo thang 1–100. Điểm càng cao, câu hỏi càng khó.
- Cách xác định: AI sử dụng **Rubric-based Assessment** để đánh giá câu hỏi dựa trên các tiêu chí như độ phức tạp ngữ pháp, từ vựng, số bước xử lý, độ dài và mức độ suy luận, sau đó tổng hợp thành điểm difficulty.
  - Ví dụ:
    - *"She ___ to school every day."* $\rightarrow$ Difficulty $\approx$ 25
    - *"If I ___ you, I would have ___ the offer."* $\rightarrow$ Difficulty $\approx$ 75
- `K`: quyết định rating thay đổi nhanh hay chậm. K lớn $\rightarrow$ rating biến động mạnh hơn.

Cách này đảm bảo:

- Làm đúng câu khó $\rightarrow$ điểm tăng vọt
- Làm sai câu khó hơn trình độ $\rightarrow$ điểm giảm mạnh
- Điểm phản ánh đúng năng lực thực tế, không chỉ là tỷ lệ đúng

#### Cơ chế phát hiện lỗi sai:

- **Rule-based & AI Mapping:** Câu hỏi trắc nghiệm/điền từ gán nhãn `error_tags` khi tạo. Bài tự luận/viết lại câu được AI chấm và map về kho nhãn chuẩn hóa trong `Error Pattern Catalog` để theo dõi tần suất và xu hướng lỗi.

### 3.2. Tính năng ôn tập kiến thức (Spaced Repetition)

Hệ thống cung cấp tính năng Ôn tập kiến thức dựa trên thuật toán **SM-2** giúp học sinh củng cố lại những nội dung đã học và những kiến thức còn chưa nắm vững.

Khi truy cập vào tính năng này, học sinh sẽ được hiển thị các câu hỏi đến hạn ôn tập (`next_review`). Các câu hỏi được lựa chọn dựa trên quá trình làm bài trước đó của học sinh (câu làm sai, lỗi thường gặp, kiến thức đã lâu chưa ôn).

#### Quy trình ôn tập:

```
Làm bài trước đó ──> Hệ thống ghi nhận kết quả ──> Xác định kiến thức cần ôn ──> Hiển thị câu hỏi ôn tập ──> Học sinh làm lại ──> Cập nhật kết quả ôn tập (SM-2)
```

### 3.3. Vòng lặp cá nhân hóa khép kín

SKP và Spaced Repetition Scheduler không hoạt động độc lập mà tạo thành vòng lặp:

```
Học sinh làm bài
    ↓
Cập nhật SKP (mastery, confidence, error patterns)
    ↓
Cập nhật Spaced Repetition (SM-2: next_review)
    ↓
Daily job chọn ôn tập dựa trên SKP + SRS
    ↓
Adaptive Homework Generator (Dual-Mode) sinh bài tập mới phù hợp SKP
    ↓
Quay lại bước đầu
```

Vòng lặp này đảm bảo:

1. Mọi quyết định cá nhân hóa đều dựa trên dữ liệu SKP thực tế
2. Hệ thống ngày càng hiểu học sinh hơn theo thời gian
3. Gia sư có báo cáo chi tiết để can thiệp đúng lúc

### 3.4. Cơ chế AI Dual-Mode (Curriculum & Homework Generation)

Để giải quyết bài toán tối ưu chi phí API LLM và tạo sự linh hoạt tối đa cho gia sư, các tính năng AI cốt lõi (Khung chương trình học và Sinh bài tập cá nhân hóa) đều được thiết kế theo cơ chế **Dual-Mode**:

- **Option A — Direct AI Generation (Sinh trực tiếp trên hệ thống):**

  - Gia sư thao tác 1-click trực tiếp trên giao diện Cổng Gia sư.
  - Hệ thống Backend tự động đóng gói dữ liệu bối cảnh (Context) — bao gồm thông tin lộ trình học hoặc Student Knowledge Profile (năng lực micro-skill, các lỗi sai hay mắc, độ khó mục tiêu) — và gọi REST API sang Python AI Service (`gpt-4o-mini` / `Gemini Flash`) để sinh nháp nội dung trong dưới 5 giây.
  - Trải nghiệm mượt mà, tiện lợi trực tiếp trên ứng dụng di động.
- **Option B — Import Structured File (Sử dụng Web AI ngoài — 0 Token Cost):**

  - Gia sư tải **Prompt Mẫu** có sẵn từ hệ thống (đã được nhúng cấu trúc SKP context hoặc yêu cầu chuẩn hóa).
  - Gia sư dán prompt vào các công cụ Web AI ngoài (ChatGPT, Claude, DeepSeek...).
  - Upload file JSON hoặc dán đoạn văn bản kết quả vào hệ thống để Python AI Service trích xuất và khởi tạo dữ liệu tự động.
  - Tối ưu chi phí **0 Token Cost** cho hệ thống trung tâm và đảm bảo tính liên tục của dịch vụ.

## 4. Kỹ thuật và công nghệ dự định áp dụng

- **Backend:** Spring Boot, đóng vai trò API Gateway duy nhất, áp dụng cơ chế phân quyền theo thực thể `Enrollment` (row-level security), xác thực bằng JWT (hạn 24h).
- **Cơ sở dữ liệu:** PostgreSQL (lưu trữ SKP, `review_schedule`, `student_errors`, `questions`, `enrollments`, `audit_logs`...).
- **AI Service:** Tích hợp các mô hình ngôn ngữ chi phí thấp (`gpt-4o-mini`, `Gemini Flash`) qua REST API nội bộ trong VPC để sinh khung chương trình học và bài tập cá nhân hóa kèm lời giải thích; áp dụng bộ lọc kiểm duyệt nội dung (Content Moderation), Validation Pipeline và giới hạn chi phí (hard cost limit + Option B Import File 0 Token Cost).
- **Lưu trữ file:** Amazon S3 (hoặc S3-compatible storage) cho bài giảng video và tài liệu học tập PDF/Word.
- **Triển khai:** Docker containerization.

## 5. Cơ sở lý thuyết và thực tiễn

### Về mặt lý thuyết

Đề tài vận dụng:

- **Adaptive/Personalized Learning:** Cá nhân hóa nội dung học theo trình độ và mục tiêu từng học sinh dựa trên Student Knowledge Profile.
- **Lý thuyết phản hồi tức thì (Immediate Feedback):** Học sinh nhận lời giải thích AI chi tiết ngay sau khi làm bài giúp củng cố kiến thức hiệu quả hơn so với phản hồi trễ.
- **Spaced Repetition:** Dựa trên đường cong quên lãng của Ebbinghaus và thuật toán SM-2, đảm bảo kiến thức được ôn đúng thời điểm để ghi nhớ dài hạn.
- **Elo Rating System:** Áp dụng trong giáo dục để đánh giá biến động năng lực người học (`mastery_score`) và độ khó câu hỏi (`difficulty`) theo thời gian thực.
- **Prompt Engineering & Dual-Mode AI:** Định hướng AI sinh nội dung dựa trên context đầy đủ từ SKP (Option A) hoặc hỗ trợ Prompt Mẫu Import file (Option B - 0 Token Cost).

### Về mặt thực tiễn

Hệ thống mô phỏng quy trình tư vấn – ghép lớp – nhận lớp – dạy học thường được vận hành thủ công, sau đó bổ sung công cụ AI tại các bước có giá trị cao. Cách tiếp cận này giúp phạm vi đồ án rõ ràng, có khả năng triển khai trong thời gian giới hạn và vẫn thể hiện được giá trị của AI trong giáo dục.
