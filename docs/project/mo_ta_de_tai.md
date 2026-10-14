# Mô tả đề tài

## Tên đề tài

**Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh 1-1 ứng dụng LLM và Spaced Repetition**

> Nguồn đối chiếu: bộ đặc tả use case tại `docs/Usecase/` (`Usecase_Receptionist_Admin.md`, `Usecase_Accountant.md`, `Usecase_Tutor.md`, `Usecase_Student_Parent.md`). Use case có thì mô tả ở đây, use case không có thì không đưa vào. Khi tài liệu này mâu thuẫn với use case, lấy use case làm chuẩn.

## 1. Đặt vấn đề

Dạy kèm tiếng Anh 1-1 đang phổ biến, nhưng một trung tâm gia sư nhỏ thường gặp hai nhóm khó khăn.

**Về vận hành.** Phụ huynh liên hệ qua điện thoại hoặc form, lễ tân ghi chép thủ công, tự ghép gia sư, theo dõi lịch học thử, thu phí nhận lớp bằng ảnh chuyển khoản và xử lý khiếu nại bằng giấy tờ hoặc tin nhắn. Kế toán phải dò sao kê thủ công để biết khoản nào đã về, hoàn tiền không có quy trình duyệt, và cuối tháng tổng hợp doanh thu bằng bảng tính. Thông tin phân tán, dễ sót, khó đối soát, và không có dấu vết thao tác để kiểm tra lại.

**Về giảng dạy.** Gia sư phải tự soạn bài tập cho từng học sinh, tự nhớ học sinh yếu kỹ năng nào, và học sinh chỉ biết mình sai ở đâu khi đến buổi sau. Phụ huynh không có kênh nào để biết con đã học gì sau mỗi buổi.

Đề tài xây dựng một nền tảng Web **single-tenant** cho một trung tâm gia sư, giải quyết cả hai nhóm vấn đề trên:

- Số hóa toàn bộ quy trình từ **yêu cầu của phụ huynh → ghép gia sư → học thử → lớp chính thức → thu phí nhận lớp → xử lý khiếu nại**, có audit log.
- Tách riêng **nghiệp vụ tài chính cho Kế toán**: đối chiếu số tiền thực nhận trước khi xác nhận phí, chi hoàn tiền có biên lai, thống kê doanh thu và xuất báo cáo; người thu tiền và người xác nhận luôn là hai người khác nhau.
- Hỗ trợ gia sư **soạn quiz cá nhân hóa** bằng AI, bám sát hồ sơ kỹ năng của từng học sinh và thang CEFR (A1–C2).
- Cho học sinh **làm quiz và nhận phản hồi ngay** (đáp án, lời giải thích), điểm **Elo** cập nhật theo từng câu, câu sai được đưa vào danh sách ôn tập.
- Cho học sinh và phụ huynh xem **nhật ký dạy học** sau mỗi buổi.

## 2. Đối tượng sử dụng

| Vai trò | Truy cập | Mục đích chính |
| --- | --- | --- |
| **Phụ huynh (khách)** | Trang công khai, không cần đăng nhập | Tìm gia sư, xem hồ sơ, gửi yêu cầu tìm gia sư hoặc đăng ký gia sư chỉ định |
| **Gia sư** | Cổng Gia sư | Hoàn thiện hồ sơ, ứng tuyển lớp, thiết lập lịch dạy, ghi nhật ký buổi học, soạn và giao quiz, nộp phí nhận lớp |
| **Học sinh** (và phụ huynh dùng tài khoản của con) | Cổng Học sinh (tài khoản do trung tâm cấp) | Xem lịch và buổi học, tải tài liệu, làm quiz, xem thông báo. Phụ huynh muốn theo dõi việc học của con thì đăng nhập bằng tài khoản này |
| **Lễ tân** | Cổng Lễ tân | Vận hành hằng ngày: lớp cần gia sư, đơn ghép lớp, duyệt hồ sơ gia sư, thu hộ minh chứng phí tại quầy, quản lý học sinh, tiếp nhận khiếu nại và chuyển yêu cầu hoàn tiền cho Kế toán |
| **Kế toán** | Cổng Kế toán | Quản lý khoản phí nhận lớp, đối chiếu và xác nhận số tiền thực nhận, xử lý hoàn tiền, thống kê tài chính và xuất báo cáo |
| **Quản trị viên (Admin)** | Cổng Lễ tân và Cổng Kế toán, thêm quyền quản lý nhân sự | Có toàn bộ use case của lễ tân và kế toán, thêm quản lý nhân sự lễ tân và kế toán (xem, chỉnh trạng thái, thêm tài khoản) |

## 3. Chức năng chính

### 3.1. Cổng công khai (Phụ huynh)

- **Tìm gia sư** theo tỉnh/thành, quận/huyện, chuyên môn, cấp lớp, hình thức học (online/tại nhà), giới tính, thành tích.
- **Xem hồ sơ gia sư** đã duyệt: học vấn, chứng chỉ đã xác thực, kinh nghiệm, video giới thiệu, lịch rảnh tham khảo.
- **Đăng ký gia sư chỉ định**: chỉ cần họ tên và số điện thoại, hệ thống tạo đơn ghép lớp "Chờ xử lý".
- **Gửi yêu cầu tìm gia sư** khi chưa chọn được ai: hệ thống tạo "lớp cần gia sư", trung tâm liên hệ trong vòng 12 giờ.

### 3.2. Cổng Gia sư

- **Thiết lập hồ sơ** qua form 5 bước (cá nhân, học vấn và chứng chỉ, năng lực và video, bảng giá theo hình thức dạy, lịch rảnh), gửi duyệt và chờ lễ tân phê duyệt trong 24–48 giờ.
- **Ứng tuyển lớp cần gia sư** do trung tâm đăng.
- **Thiết lập lịch dạy thử** (một buổi, kiểm tra trùng ca) và **chốt lịch học cố định** hằng tuần để chuyển lớp sang chính thức.
- **Xem lịch dạy** dạng tuần hoặc tháng, khởi tạo buổi học từ ca dạy.
- **Quản lý buổi học thực tế**: tài liệu đính kèm và nhật ký dạy học (kiến thức đã học, dặn dò) hiển thị cho học sinh và phụ huynh.
- **Soạn và giao quiz** theo hai cách:
  - *Trợ lý AI trong hệ thống*: màn hình chia đôi, bên trái xem trước câu hỏi, bên phải chat với AI, có bảng thống kê kỹ năng của học sinh để tham khảo.
  - *Import từ AI ngoài* (ChatGPT, Claude, Gemini): sao chép prompt mẫu đã nhúng hồ sơ kỹ năng và chuẩn CEFR, dán kết quả JSON về để hệ thống kiểm định và nạp. Cách này không tốn token của hệ thống.
- **Nộp minh chứng phí nhận lớp** (ảnh biên lai) sau 30 ngày dạy chính thức. Phí nhận lớp bằng **35 - 40% học phí tháng đầu** của lớp.

### 3.3. Cổng Học sinh

- Đăng nhập bằng tài khoản trung tâm cấp, **bắt buộc đổi mật khẩu mặc định** ở lần đầu.
- **Dashboard**: lịch học sắp tới, buổi học gần nhất, bài tập cần làm, điểm Elo, thông báo.
- **Xem gia sư** phụ trách và **lịch học** (tuần và lịch sử buổi học, lọc theo gia sư).
- **Chi tiết buổi học**: tài liệu (xem trực tiếp hoặc tải về), quiz, nhật ký dạy học.
- **Làm quiz từng câu**: khóa lựa chọn sau khi chọn, hiện ngay đúng/sai và lời giải thích, cập nhật Elo, tổng kết cuối bài. Câu sai tự vào danh sách ôn tập.
- **Thông báo** qua biểu tượng chuông.

### 3.4. Cổng Lễ tân / Quản trị

- **Lớp cần gia sư**: tạo lớp từ yêu cầu của phụ huynh, đăng cho gia sư ứng tuyển, chọn gia sư từ danh sách ứng tuyển, hủy lớp kèm lý do.
- **Đơn ghép lớp**: tạo đơn cho trường hợp chỉ định gia sư, xác nhận (chuyển sang dạy thử), hủy kèm lý do.
- **Hồ sơ gia sư**: duyệt hoặc từ chối hồ sơ mới, xem và chỉnh trạng thái hoạt động.
- **Hồ sơ học sinh**: xem chi tiết (thông tin cá nhân, phụ huynh, lớp đã và đang học), chỉnh trạng thái.
- **Thu hộ minh chứng phí nhận lớp**: khi gia sư hoặc phụ huynh nộp tiền mặt hay mang biên lai đến quầy, lễ tân tải phiếu thu hoặc biên lai lên và chuyển cho kế toán xác nhận. Lễ tân không tự xác nhận tiền.
- **Khiếu nại tại quầy**: tạo đơn, xem và sửa, giải quyết. Khiếu nại ghép lại lớp do lễ tân đóng đơn; khiếu nại hoàn tiền thì lễ tân chốt số tiền và tài khoản nhận với người khiếu nại rồi gửi yêu cầu cho kế toán, đơn tự đóng khi kế toán hoàn tiền xong.
- **Dashboard**: số đơn ghép lớp chờ xử lý, khiếu nại chờ xử lý, khiếu nại chờ hoàn tiền, số gia sư đang hoạt động.

**Riêng Quản trị viên** (ngoài toàn bộ các mục trên và mục 3.5):

- **Quản lý nhân sự**: xem danh sách và chi tiết lễ tân, kế toán; chỉnh trạng thái; thêm nhân sự mới và chọn vai trò (tài khoản tạo theo cùng quy tắc với tài khoản học sinh).

### 3.5. Cổng Kế toán

- **Dashboard**: khoản phí chờ xác nhận, yêu cầu hoàn tiền chờ xử lý, tiền thu và tiền hoàn trong tháng, công nợ, biểu đồ thu - hoàn 6 tháng.
- **Quản lý khoản phí nhận lớp**: hệ thống tự tạo khoản phí khi gia sư chốt lịch cố định (tỷ lệ mặc định 40%); kế toán xem theo trạng thái, chỉnh tỷ lệ trong khoảng 35 - 40% khi khoản phí chưa có minh chứng.
- **Xác nhận khoản phí đã nhận**: đối chiếu ảnh biên lai hoặc phiếu thu với sao kê ngân hàng, nhập số tiền thực nhận; đủ tiền thì xác nhận (mở khóa liên hệ cho gia sư), thiếu hoặc chưa thấy tiền thì yêu cầu gửi lại kèm lý do.
- **Xử lý hoàn tiền**: nhận yêu cầu từ lễ tân, chốt số tiền hoàn (không vượt số tiền đã thu), chuyển khoản, tải biên lai; hoặc từ chối kèm lý do để lễ tân xử lý lại.
- **Thống kê tài chính**: tiền thu, tiền hoàn, doanh thu thuần, công nợ theo tháng, quý, năm; chia theo gia sư, người nộp, hình thức dạy; xuất Excel.

## 4. Luồng nghiệp vụ cốt lõi

```
Phụ huynh                      Trung tâm (Lễ tân)                        Gia sư

Gửi yêu cầu tìm gia sư ─────►  Tạo "Lớp cần gia sư" ──đăng──────────►  Ứng tuyển
                               Chọn gia sư (theo ý phụ huynh) ◄───────
                                     │
Chọn gia sư chỉ định ───────►  Tạo "Đơn ghép lớp" (Chờ xử lý)
                                     │  xác nhận đơn
                                     ▼
                               Lớp TRIAL (Đang dạy thử) ───────────►  Đặt lịch dạy thử
                                                                       Dạy thử 1 buổi
                                                                       Chốt lịch cố định
                                     ▼
                               Lớp ACTIVE ◄───────────────────────────  Dạy, ghi nhật ký, giao quiz
                                     │  sau 30 ngày
                                     ▼
                               Khoản phí nhận lớp (tự tạo) ◄──────────  Nộp ảnh biên lai
                               (hoặc lễ tân thu hộ tại quầy)
                                     │
                                     ▼
                               Kế toán đối chiếu số tiền, xác nhận
```

Khiếu nại (hoàn tiền hoặc ghép lại lớp) có thể phát sinh ở bất kỳ bước nào sau khi lớp được ghép, do lễ tân tiếp nhận. Khiếu nại ghép lại lớp do lễ tân xử lý; khiếu nại hoàn tiền được lễ tân chuyển thành yêu cầu hoàn tiền, kế toán chi tiền và đơn tự đóng.

## 5. Thành phần kỹ thuật cốt lõi

### 5.1. Hồ sơ kỹ năng và điểm Elo

Mỗi câu hỏi quiz mang một **thẻ kỹ năng** và **độ khó theo CEFR (A1–C2)**. Sau mỗi câu trả lời, hệ thống:

1. Lưu đáp án đã chọn, kết quả đúng/sai, thời điểm trả lời.
2. Cập nhật **điểm Elo** của học sinh theo độ khó câu hỏi:

   `Expected = 1 / (1 + 10^((difficulty − elo) / 400))`
   `elo_mới = elo_cũ + K × (actual − Expected)`  (actual = 1 nếu đúng, 0 nếu sai)

3. Cập nhật thống kê theo kỹ năng (số câu đúng, số câu sai, lần ôn gần nhất).

Gia sư dùng bảng thống kê này (sắp theo tỷ lệ sai giảm dần và thời gian chưa ôn) để chọn trọng tâm khi soạn quiz, và hệ thống nhúng chính dữ liệu đó vào prompt cho AI.

### 5.2. Danh sách ôn tập

Câu làm sai được tự động thêm vào **danh sách ôn tập** của học sinh. Hệ thống ghi nhận lần ôn gần nhất theo từng kỹ năng, và bảng thống kê của gia sư sắp theo thời gian chưa ôn để ưu tiên nội dung đã lâu không củng cố. Use case chưa có cơ chế tự lập lịch ôn (như SM-2), nên không đưa vào phạm vi.

### 5.3. AI Service: hai chế độ sinh quiz

| | Chế độ A: Trợ lý AI trong hệ thống | Chế độ B: Import từ AI ngoài |
| --- | --- | --- |
| Cách dùng | Chat trực tiếp, yêu cầu sửa bằng hội thoại | Sao chép prompt mẫu, dán JSON kết quả |
| Chi phí token | Tính vào hệ thống | Không tốn |
| Đầu vào | Yêu cầu của gia sư, tài liệu đính kèm, hồ sơ kỹ năng học sinh | Prompt mẫu đã nhúng sẵn hồ sơ kỹ năng và chuẩn JSON |
| Kiểm định | Kiểm tra cấu trúc đầu ra của AI | Kiểm tra cấu trúc JSON, báo lỗi theo từng câu |
| Kết quả | Quiz ở trạng thái `draft` hoặc `assigned` | Giống chế độ A |

Gia sư luôn xem lại và sửa được từng câu trước khi giao. Hệ thống giới hạn thời gian phản hồi AI (60 giây, quá hạn thì cho thử lại) và giới hạn chi phí hằng tháng.

## 6. Kỹ thuật và công nghệ

| Thành phần | Công nghệ |
| --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4, React Router, Recharts |
| Backend | Java 17, Spring Boot 3.2, Spring Data JPA, xác thực JWT, phân quyền theo vai trò và theo quan hệ lớp học |
| AI Service | Python 3.11, FastAPI, LangGraph |
| Cơ sở dữ liệu | PostgreSQL 16 (thiết kế ERD tại `docs/New_ERD.md`) |
| Lưu trữ file | Hệ thống lưu trữ tương thích S3 cho chứng chỉ, tài liệu, minh chứng chuyển khoản |
| Triển khai | Docker Compose, GitHub Actions CI |

Backend là cổng duy nhất mà frontend gọi tới. Frontend không gọi trực tiếp AI Service.

## 7. Cơ sở lý thuyết và thực tiễn

**Lý thuyết**
- *Học tập thích ứng (adaptive learning)*: nội dung bám trình độ và điểm yếu của từng học sinh.
- *Phản hồi tức thì*: học sinh thấy đáp án và lời giải thích ngay sau khi chọn.
- *Elo rating trong giáo dục*: ước lượng năng lực người học và độ khó câu hỏi trên cùng một thang.
- *Ôn tập lại câu sai*: củng cố kiến thức dựa trên các lỗi mà học sinh thực sự mắc.
- *CEFR*: thang chuẩn A1–C2 để gắn độ khó và trình độ.
- *Prompt engineering*: nhúng ngữ cảnh học sinh vào prompt để AI sinh nội dung đúng trọng tâm.

**Thực tiễn.** Hệ thống mô phỏng quy trình mà trung tâm gia sư đang làm thủ công (tư vấn, ghép lớp, thu phí, đối soát và hoàn tiền, khiếu nại), áp dụng nguyên tắc tách người thu tiền và người xác nhận tiền như trong kiểm soát nội bộ, rồi thêm AI ở các bước có giá trị cao nhất là soạn quiz và cá nhân hóa. Phạm vi vì vậy đủ nhỏ để hoàn thành trong thời gian đồ án mà vẫn thể hiện được giá trị của AI.

## 8. Phạm vi của đề tài

**Trong phạm vi:** toàn bộ chức năng ở mục 3, quiz trắc nghiệm A/B/C/D, Elo, danh sách ôn tập, thu phí bằng ảnh chuyển khoản hoặc tiền mặt tại quầy, kế toán đối chiếu thủ công với sao kê, hoàn tiền có biên lai, thống kê tài chính và xuất Excel, khiếu nại tại quầy.

**Ngoài phạm vi** (không có trong use case): đối soát tự động với ngân hàng, kế toán tổng hợp (sổ sách, thuế, lương gia sư, xuất hóa đơn), xem audit log trên giao diện, tài khoản phụ huynh riêng, lập lịch ôn tập SM-2, khung chương trình học, thanh toán trực tuyến tự động, dạy học trực tuyến tích hợp (dùng Zoom/Meet bên ngoài), chatbot tư vấn trên trang chủ, gamification (streak, bảng xếp hạng), đánh giá gia sư sau buổi học thử, các dạng bài ngoài trắc nghiệm, ứng dụng di động riêng.
