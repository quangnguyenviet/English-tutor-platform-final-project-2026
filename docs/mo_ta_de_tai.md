# Mô tả đề tài

## Tên đề tài đề xuất

**Xây dựng nền tảng dạy kèm tiếng Anh 1-1 ứng dụng LLM, Student Knowledge Profile và Spaced Repetition**

## 1. Đặt vấn đề

Mô hình dạy kèm tiếng Anh 1-1 đang ngày càng phổ biến, tuy nhiên các nền tảng tìm gia sư hiện nay chủ yếu tập trung vào việc kết nối học sinh với gia sư, trong khi quá trình dạy và học sau đó vẫn phụ thuộc nhiều vào công việc thủ công của gia sư. Gia sư phải tự soạn nội dung, tạo bài tập và theo dõi năng lực của từng học sinh, trong khi học sinh thường phải chờ đến buổi học tiếp theo để được giải thích và sửa lỗi.

Hệ thống của nhóm ứng dụng AI để hỗ trợ quá trình dạy và học. Gia sư có thể nhanh chóng xây dựng nội dung và tạo bài tập cá nhân hóa dựa trên năng lực của từng học sinh. Hệ thống đồng thời lưu trữ Student Knowledge Profile để theo dõi kiến thức đã học, mức độ thành thạo và những điểm còn yếu. Dựa trên dữ liệu này, hệ thống sử dụng Spaced Repetition để tự động lựa chọn và lập lịch các nội dung cần ôn tập.

Đối với học sinh, hệ thống cung cấp bài tập phù hợp với năng lực, phản hồi và giải thích lỗi sai ngay sau khi làm bài, đồng thời nhắc ôn lại những kiến thức còn yếu đúng thời điểm. Đối với gia sư, hệ thống giảm thời gian chuẩn bị bài và cung cấp dữ liệu chi tiết về quá trình học của từng học sinh, giúp gia sư có thêm thời gian tập trung vào việc giảng dạy và hỗ trợ những điểm học sinh còn yếu.

## 2. Các chức năng chính dự định phát triển

Hệ thống được thiết kế theo 5 cổng người dùng (Parent, Tutor, Student, Admin, Receptionist) phục vụ đầy đủ quy trình vận hành và giảng dạy:

### Cổng Phụ huynh

- **Tìm kiếm & Xem hồ sơ gia sư phù hợp (Smart-Match Form):** Phụ huynh chọn các tiêu chí (độ tuổi/trình độ/mục tiêu của con, yêu cầu gia sư, khung giờ rảnh trong tuần), hệ thống tự động trả về danh sách các hồ sơ gia sư phù hợp nhất kèm thông tin kinh nghiệm và video tự giới thiệu.
- **Đăng ký học thử đơn giản:** Phụ huynh chọn gia sư ưng ý và hoàn tất đăng ký học thử nhanh chóng qua tin nhắn xác thực SĐT.
- **Tra cứu thông tin & Xem Báo cáo Nhật ký bài học từng buổi (Public Class Log Work):** Phụ huynh dễ dàng tra cứu FAQ trung tâm và xem minh bạch Nhật ký dạy học từng buổi do Gia sư ghi nhận (kiến thức đã học, dặn dò, thái độ học tập) giúp theo dõi tiến bộ thực chất của con mà không làm phiền giờ học.

### Cổng Gia sư

- **Nhận lớp & Liên hệ phụ huynh ngay:** Tiếp nhận và phản hồi đề nghị nhận lớp từ trung tâm. Ngay khi đồng ý nhận lớp, gia sư sẽ thấy thông tin liên hệ của phụ huynh để chủ động gọi điện sắp xếp buổi học thử.
- **Quản lý lịch học thử & Lịch dạy cố định:** Nhập thời gian học thử và chốt lịch dạy cố định hàng tuần sau khi nhận lớp thành công (`ACTIVE`). Lịch dạy tự động hiển thị trên thời khóa biểu.
- **Quản lý Khung chương trình học 2 cấp (Curriculum Roadmap Master Plan):** Tạo và sắp xếp lộ trình bài học tinh gọn 2 cấp (Chủ đề/Chương ➔ Bài học). Gia sư có thể tự nhập thủ công hoặc dùng AI sinh khung lộ trình 2 cấp (Option A) hoặc Import file JSON/Text từ ChatGPT ngoài với **0 Token Cost** (Option B).
- **Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Log Work):** Dòng thời gian quản lý từng buổi học thực tế độc lập với Khung chương trình. Gia sư ghi nhận thông tin buổi học, đính kèm tài liệu S3, và điền 1 vùng văn bản **Public Class Log Work** dùng chung minh bạch giữa 3 bên (Gia sư, Học sinh, Phụ huynh).
- **Soạn & Giao bài tập qua AI Split-Screen Workspace:** Tích hợp trực tiếp tại màn hình Chi tiết Buổi học N. Giao diện dạng chia đôi màn hình:
  - **Main Canvas (Trái - 65%):** Hiển thị danh sách câu hỏi xem trước, hỗ trợ chỉnh sửa inline trực tiếp nội dung/đáp án/giải thích trước khi bấm "Duyệt & Giao bài".
  - **Assistance Dock (Phải - 35%):** Gồm Tab 1 (Form cấu hình tham số, tự động nạp Context của Buổi học N & SKP học sinh để AI sinh bài tập) và Tab 2 (Chat Freestyle Co-pilot cho phép gia sư ra lệnh điều chỉnh, làm khó/dễ hoặc đổi chủ đề câu hỏi). Hỗ trợ chế độ Import File 0 Token Cost (Option B).
- **Xem báo cáo Student Knowledge Profile & Private Notes:** Theo dõi chi tiết điểm thành thạo Elo (`mastery_score`), các dạng lỗi hay mắc và ghi chú riêng bảo mật về thói quen học sinh.
- **Quản lý thời khóa biểu, Rate Card & Nộp phí 30 ngày:** Quản lý lịch dạy cố định, cập nhật Rate Card và nộp ảnh chụp QR proof chuyển khoản phí nhận lớp sau 30 ngày dạy chính thức.

### Cổng Học sinh

- **Mở Buổi học N & Xem tài liệu/nhật ký:** Học sinh mở đúng Buổi học N để xem nhật ký dặn dò của gia sư và xem/tải tài liệu học tập đính kèm S3.
- **Làm bài trực tuyến & Chấm điểm Zero-LLM:** Làm bài tập trực tuyến (trắc nghiệm, điền từ, sửa lỗi, viết lại câu). Ngay khi nộp bài, hệ thống Backend tự động chấm điểm và cập nhật Elo SKP tức thì bằng thuật toán thuần Java/Postgres mà **không tốn chi phí gọi LLM API (Zero LLM Overhead)**.
- **Xem Lời giải thích AI chi tiết:** Hệ thống hiển thị hướng dẫn giải chi tiết do AI sinh từ trước cho từng câu hỏi để học sinh hiểu sâu lỗi sai.
- **Ôn tập ngắt quãng Spaced Repetition (SM-2):** Daily Session 5 phút hiển thị các câu hỏi đến hạn ôn tập (`next_review`) giúp củng cố kiến thức sắp quên theo thuật toán SM-2.
- **Theo dõi tiến bộ cá nhân:** Biểu đồ định lượng phân tách *Chỉ số chăm chỉ* (tỷ lệ hoàn thành bài tập) và *Biểu đồ tiến bộ năng lực* (điểm Elo rating theo thời gian).

### Cổng Quản trị (Admin) & Cổng Lễ tân (Receptionist)

- **Cổng Admin:** Quản lý Match Request, tạo Match Offer, tính phí tự động, duyệt phí QR proof (sau 30 ngày dạy), phân quyền RBAC theo Enrollment, xem Audit log, quản lý nhân sự Lễ tân, xử lý khiếu nại & đối soát tài chính trung tâm (`REFUND`/`REMATCH`).
- **Cổng Lễ tân:** Tiếp nhận và gửi yêu cầu ghép lớp, duyệt ảnh QR proof thanh toán tại trung tâm, tra cứu quản lý gia sư & học sinh, phát thông báo trung tâm, và tiếp nhận/ghi nhận khiếu nại trực tiếp từ phụ huynh.

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

### 3.4. AI Split-Screen Workspace & Zero-LLM Submission Architecture

Để vừa giải quyết bài toán tối ưu chi phí LLM, vừa mang lại trải nghiệm tiện nghi tối đa cho Gia sư và Học sinh, hệ thống triển khai 2 cơ chế kiến trúc đột phá:

1. **AI Split-Screen Workspace (tại Chi tiết Buổi học N):**
   - **Giao diện Split-Screen:** Main Canvas (Trái 65%) hiển thị danh sách câu hỏi AI sinh ra kèm nút Inline Edit; Assistance Dock (Phải 35%) gồm Tab 1 Form Config nạp sẵn bối cảnh Buổi học N & SKP và Tab 2 Chat Co-pilot điều chỉnh freestyle.
   - **Dual-Mode Sinh nội dung:** Option A (Direct AI Generation qua FastAPI/LangGraph trong 3–5 giây) và Option B (Import File JSON/Text từ ChatGPT ngoài với **0 Token Cost**).

2. **Zero-LLM Submission Engine (khi Học sinh nộp bài):**
   - Toàn bộ metadata câu hỏi (đáp án, `difficulty`, nhãn `error_tags`, lời giải thích AI chi tiết) đã được AI chuẩn hóa và lưu trữ sẵn tại CSDL PostgreSQL khi gia sư duyệt bài tập.
   - Khi Học sinh nộp bài, hệ thống Backend Spring Boot thực hiện chấm điểm tự động, tính lại điểm Elo SKP (`mastery_score`) và cập nhật lịch ôn tập ngắt quãng SM-2 (`next_review`) hoàn toàn bằng code Java/SQL thuần **mà không gọi bất kỳ LLM API nào (0 LLM Token Cost khi nộp bài)**, đảm bảo thời gian phản hồi tức thì (<100ms) và kiểm soát 100% chi phí vận hành.

## 4. Kỹ thuật và công nghệ dự định áp dụng

- **Backend:** Spring Boot, đóng vai trò API Gateway duy nhất, áp dụng cơ chế phân quyền RBAC theo thực thể `Enrollment` (row-level security), xác thực bằng JWT (hạn 24h), chạy Zero-LLM Submission Engine.
- **Cơ sở dữ liệu:** PostgreSQL (lưu trữ SKP, `review_schedule`, `student_errors`, `questions`, `enrollments`, `daily_sessions`, `class_log_works`, `complaints`, `receptionists`, `audit_logs`...).
- **AI Service:** Python FastAPI + LangGraph Agent tích hợp mô hình ngôn ngữ chi phí thấp (`gpt-4o-mini`, `Gemini Flash`) qua REST API nội bộ để sinh khung chương trình 2 cấp và sinh bài tập tại AI Split-Screen Workspace; áp dụng bộ lọc kiểm duyệt nội dung (Content Moderation), Validation Pipeline và trích xuất dữ liệu Import (Option B 0 Token Cost).
- **Lưu trữ file:** Amazon S3 (hoặc S3-compatible storage) cho bài giảng video và tài liệu học tập PDF/Word đính kèm tại Buổi học N.
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