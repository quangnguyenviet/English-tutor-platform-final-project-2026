---
title: PRD — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: draft-v2
created: 2026-08-31
updated: 2026-10-13
nguồn đối chiếu: docs/Usecase/*.md
---
# PRD: Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## 0. Mục đích tài liệu

Tài liệu định nghĩa yêu cầu nghiệp vụ và kỹ thuật của hệ thống, làm cơ sở cho thiết kế UX, kiến trúc, ERD và phân rã công việc cho nhóm 3 thành viên.

Phiên bản này **viết lại theo bộ đặc tả use case** trong `docs/Usecase/` (4 file: `Usecase_Tutor.md`, `Usecase_Student_Parent.md`, `Usecase_Receptionist_Admin.md`, `Usecase_Accountant.md`). **Nguyên tắc: use case có thì đưa vào, use case không có thì bỏ.** Mỗi yêu cầu chức năng (FR) ghi rõ use case nguồn. Mã `UC-REC-xx` là use case của Lễ tân, `UC-ACC-xx` là use case của Kế toán, `UC-ADM-xx` là use case riêng của Admin (Admin còn có toàn bộ use case của Lễ tân và Kế toán).

Các thay đổi so với PRD v1 (2026-09-19):

| Nội dung | v1 | v2 (theo use case) |
| --- | --- | --- |
| Số cổng | 5 cổng, Admin tách khỏi Lễ tân | 5 cổng: công khai, Gia sư, Học sinh, Lễ tân, Kế toán; Admin có toàn bộ use case của Lễ tân và Kế toán, thêm quản lý nhân sự |
| Phụ huynh | Cổng riêng, có theo dõi biểu đồ tiến bộ | Không có tài khoản riêng: xem tiến trình học bằng **tài khoản của con** |
| Vai trò Kế toán (bổ sung 13/10/2026) | Không có, Lễ tân duyệt phí | **Thêm vai trò `ACCOUNTANT`**: quản lý khoản phí, đối chiếu và xác nhận số tiền thực nhận, chi hoàn tiền, thống kê và xuất báo cáo (UC-ACC-01 đến UC-ACC-05). Lễ tân chỉ thu hộ minh chứng và chuyển yêu cầu hoàn tiền |
| Báo cáo doanh thu, đối soát | Có | **Có lại, do Kế toán làm** (UC-ACC-03, UC-ACC-05): đối soát thủ công với sao kê, thống kê và xuất Excel |
| Xem audit log, tạo tài khoản học sinh | Có | **Bỏ** (không có use case). Audit log vẫn được ghi ngầm khi thao tác quan trọng |
| Khung chương trình (Curriculum) | Có, 2 cấp, Dual-Mode AI | **Bỏ**. Buổi học thực tế độc lập, không gắn khung chương trình |
| Nhật ký buổi dạy | Ngoài phạm vi | **Trong phạm vi** (nhật ký công khai cho học sinh và phụ huynh) |
| Bài tập | Nhiều dạng (điền từ, sửa lỗi, viết lại câu) | Chỉ **quiz trắc nghiệm A/B/C/D**, gắn với buổi học |
| Chấm điểm | Nộp cả bài rồi chấm | **Từng câu**: khóa đáp án, hiện giải thích và cập nhật Elo ngay |
| AI sinh bài | Gọi một lần theo form | **Chat với trợ lý AI** trong màn hình chia đôi, hoặc **import** JSON từ AI ngoài |
| Xác thực SĐT phụ huynh | Đã bỏ OTP | Giữ nguyên: chỉ họ tên và SĐT |
| Tài khoản học sinh | Không nêu | Trung tâm cấp, **đổi mật khẩu bắt buộc** ở lần đầu |
| Lịch học | Lịch dạy cố định | Thêm **lịch dạy thử** (một buổi) trước khi chốt lịch cố định |
| Ôn tập ngắt quãng | SM-2 là tính năng chính | Chỉ còn **danh sách ôn tập** từ câu sai (UC-ST-08). **Bỏ lập lịch SM-2** vì không có use case |
| Phí nhận lớp | Hệ thống tự tính, quy tắc chưa rõ | Mặc định **40% học phí tháng đầu** của lớp, Lễ tân chỉnh trong 0 - 50% |
| Trạng thái lớp cần gia sư | Có "Chưa đủ thời gian" | **Bỏ**. Sau khi lễ tân tạo lớp thì lớp ở "Đã đăng" |
| Trạng thái khiếu nại | "Chưa xử lý" và "Chờ xử lý" lẫn lộn | Thống nhất **"Chờ xử lý"** |

## 1. Tầm nhìn

Nền tảng Web **single-tenant** cho một trung tâm gia sư tiếng Anh 1-1, với hai trụ cột:

1. **Vận hành có kiểm soát**: mọi bước từ yêu cầu của phụ huynh đến thu phí và khiếu nại đều có trạng thái rõ ràng, có thông báo và có audit log.
2. **Giảng dạy cá nhân hóa**: AI giúp gia sư soạn quiz bám sát điểm yếu của từng học sinh; học sinh được phản hồi tức thì và ôn lại câu sai.

**Giá trị theo từng đối tượng**

- **Phụ huynh**: tìm và chọn gia sư nhanh, đăng ký không cần tài khoản; muốn theo dõi nhật ký buổi học và quiz của con thì đăng nhập bằng tài khoản của con.
- **Gia sư**: nhận lớp minh bạch, lịch dạy rõ, soạn quiz nhanh (hoặc import miễn phí token), không phải tự nhớ điểm yếu của học sinh.
- **Học sinh**: biết ngay đúng/sai và lý do, thấy điểm Elo và kỹ năng yếu của mình.
- **Lễ tân**: một nơi để ghép lớp, duyệt hồ sơ gia sư, thu hộ minh chứng phí, quản lý học sinh và xử lý khiếu nại tại quầy.
- **Kế toán**: biết chính xác khoản nào đã về tài khoản, hoàn tiền có căn cứ, có số liệu doanh thu và công nợ mà không cần tổng hợp bằng bảng tính.
- **Admin**: làm được mọi việc của lễ tân và kế toán, và quản lý thêm nhân sự.

## 2. Người dùng mục tiêu

### 2.1. Jobs To Be Done

| Vai trò | Việc cần làm (functional) | Cảm nhận mong muốn (emotional) |
| --- | --- | --- |
| **Phụ huynh** | Tìm gia sư hợp với con, gửi yêu cầu mà không phải lập tài khoản, biết con học gì sau mỗi buổi (đăng nhập bằng tài khoản của con) | Yên tâm, thấy trung tâm minh bạch |
| **Gia sư** | Nhận lớp rõ ràng, đặt lịch, ghi nhật ký, soạn quiz nhanh, nộp phí đúng hạn | Chuyên nghiệp, không mất thời gian vào thủ tục |
| **Học sinh** | Xem lịch, tải tài liệu, làm quiz và hiểu lỗi sai ngay | Việc học nhẹ nhàng, bài vừa sức |
| **Lễ tân** | Xử lý yêu cầu ghép lớp, duyệt hồ sơ gia sư, thu hộ minh chứng, tiếp nhận khiếu nại tại quầy mà không sót | Công việc có hệ thống, ít nhầm lẫn |
| **Kế toán** | Đối chiếu tiền về với minh chứng, xác nhận phí, chi hoàn tiền đúng số, xem doanh thu và công nợ theo kỳ, xuất báo cáo | Số liệu khớp, không bị nhầm hay chi trùng |
| **Admin** | Làm được mọi việc của lễ tân và kế toán; thêm, xem và chỉnh trạng thái nhân sự | Kiểm soát được đội ngũ vận hành và dòng tiền |

### 2.2. Không phải người dùng (v1)

- Học sinh học nhóm hoặc lớp tập trung (chỉ phục vụ 1-1).
- Người dùng cần học video call tích hợp (dùng Zoom/Meet ngoài, hệ thống chỉ lưu liên kết phòng học).

### 2.3. Hành trình người dùng chính

**UJ-1. Chị Lan (phụ huynh) cần tìm gia sư và chưa biết chọn ai**
1. Chị Lan mở form "Tìm gia sư" trên trang chủ, nhập tên, SĐT, tên con (tùy chọn), khối lớp, rồi gửi.
2. Hệ thống tạo **lớp cần gia sư** ở trạng thái "Chờ xử lý", báo "trung tâm sẽ liên hệ trong 12 giờ" và thông báo cho lễ tân.
3. Lễ tân gọi tư vấn, bổ sung chi tiết (hình thức học, mức phí/buổi, số buổi/tuần, thời gian, yêu cầu gia sư) và **tạo lớp**: lớp chuyển "Đã đăng" cho gia sư ứng tuyển.
4. Các gia sư ứng tuyển kèm lời nhắn. Lễ tân trao đổi với chị Lan và **chọn gia sư**.
5. Hệ thống tự tạo **đơn ghép lớp** "Đang dạy thử" và lớp học ở trạng thái TRIAL.
6. Gia sư liên hệ chị Lan, **đặt lịch dạy thử**, dạy thử, rồi **chốt lịch cố định**. Lớp chuyển ACTIVE.
7. Khi gia sư chốt lịch, hệ thống tạo khoản phí nhận lớp (mặc định 40% học phí tháng đầu). Sau 30 ngày dạy chính thức, gia sư nộp minh chứng chuyển khoản, kế toán đối chiếu sao kê và xác nhận.

**UJ-2. Anh Hùng (phụ huynh) đã chọn sẵn gia sư**
1. Anh xem hồ sơ gia sư trong kết quả tìm kiếm và bấm "Đăng ký", nhập họ tên và SĐT.
2. Hệ thống tạo **đơn ghép lớp** "Chờ xử lý" và thông báo cho trung tâm.
3. Lễ tân trao đổi với gia sư, được gia sư đồng ý, rồi **xác nhận đơn**: đơn chuyển "Đang dạy thử". Từ đây đi tiếp như UJ-1 bước 6.
4. Nếu gia sư từ chối, lễ tân liên hệ lại phụ huynh và chuyển yêu cầu sang luồng lớp cần gia sư.

**UJ-3. Minh (gia sư) vào dạy và giao quiz**
1. Minh đăng nhập lần đầu, hoàn thiện hồ sơ qua form 5 bước, gửi duyệt. Lễ tân duyệt, Minh bắt đầu ứng tuyển lớp.
2. Sau khi được chọn, Minh thiết lập lịch dạy thử, rồi chốt lịch cố định.
3. Đến ca dạy, Minh khởi tạo buổi học từ thời khóa biểu, đính kèm tài liệu.
4. Minh bấm "Soạn Quiz", xem bảng kỹ năng của học sinh, chat với AI ("5 câu về thì quá khứ, B1"), tinh chỉnh câu hỏi, chọn hạn nộp và **giao bài**.
5. Sau buổi học, Minh điền **nhật ký dạy học** (kiến thức đã học, dặn dò). Học sinh và phụ huynh xem ngay.
6. Nếu muốn tiết kiệm chi phí, Minh dùng **Import Quiz**: sao chép prompt mẫu, chạy ở ChatGPT/Claude, dán JSON về.

**UJ-4. Nam (học sinh) làm quiz và ôn lại câu sai**
1. Nam đăng nhập bằng tài khoản trung tâm cấp, đổi mật khẩu mặc định ở lần đầu.
2. Trên dashboard, Nam thấy buổi học sắp tới, bài tập cần làm, điểm Elo.
3. Nam mở quiz, chọn đáp án từng câu. Mỗi câu hiện ngay đúng/sai, đáp án, lời giải thích; Elo cập nhật.
4. Câu sai tự vào danh sách ôn tập. Cuối bài Nam xem tổng kết (số câu đúng, thay đổi Elo), gia sư nhận thông báo.
5. Nam mở chi tiết buổi học để đọc nhật ký dạy học và tải tài liệu.
6. Chị Lan (phụ huynh của Nam) muốn biết con học gì thì đăng nhập bằng tài khoản của Nam để xem lịch, nhật ký dạy học và kết quả quiz.

**UJ-5. Chị Hoa (lễ tân) xử lý ca trực**
1. Dashboard hiện số đơn ghép lớp chờ xử lý, khiếu nại chưa xử lý, khiếu nại chờ hoàn tiền, số gia sư đang hoạt động.
2. Chị duyệt hồ sơ gia sư mới. Một gia sư đến quầy nộp phí bằng tiền mặt: chị lập phiếu thu, tải ảnh lên và gửi kế toán.
3. Phụ huynh đến quầy khiếu nại: chị tạo đơn. Nếu ghép gia sư khác, chị ghi kết quả kèm ảnh minh chứng và đóng đơn. Nếu hoàn tiền, chị thống nhất số tiền và tài khoản nhận với phụ huynh rồi gửi yêu cầu cho kế toán; đơn chuyển "Chờ hoàn tiền".

**UJ-6. Anh Bình (Admin) thêm nhân sự**
1. Anh Bình đăng nhập, làm được mọi việc như lễ tân (UJ-5) và kế toán (UJ-7).
2. Anh vào "Quản lý nhân sự", bấm "Thêm nhân sự", chọn vai trò Lễ tân hoặc Kế toán, nhập họ tên, email, SĐT, ngày vào làm, xác nhận.
3. Hệ thống tạo tài khoản role RECEPTIONIST hoặc ACCOUNTANT theo cùng quy tắc tạo tài khoản học sinh. Khi nhân viên nghỉ việc, anh mở chi tiết và chuyển trạng thái sang "Ngưng hoạt động".

**UJ-7. Chị Mai (kế toán) đối soát và hoàn tiền**
1. Dashboard hiện số khoản phí chờ xác nhận, yêu cầu hoàn tiền chờ xử lý, tiền thu và tiền hoàn trong tháng.
2. Chị mở khoản phí chờ xác nhận, so ảnh biên lai với sao kê ngân hàng, nhập số tiền thực nhận và xác nhận. Một khoản chưa thấy tiền về, chị yêu cầu gia sư gửi lại kèm lý do.
3. Chị mở yêu cầu hoàn tiền chị Hoa gửi (UJ-5), kiểm tra số tiền không vượt khoản đã thu, chuyển khoản cho phụ huynh, tải biên lai và xác nhận. Khiếu nại tự chuyển "Đã xử lý".
4. Cuối tháng, chị xem thống kê tiền thu, tiền hoàn, doanh thu thuần, công nợ theo gia sư và xuất Excel gửi Admin.

## 3. Thuật ngữ

| Thuật ngữ | Ý nghĩa |
| --- | --- |
| **Lớp cần gia sư** (`tutor_requests`) | Yêu cầu của phụ huynh chưa chọn được gia sư; trung tâm đăng lên để gia sư ứng tuyển |
| **Đơn ghép lớp** (`match_requests`) | Yêu cầu đã xác định được gia sư (phụ huynh chỉ định, hoặc chọn từ danh sách ứng tuyển) |
| **Lớp học** (`classes`) | Quan hệ dạy học 1 gia sư - 1 học sinh. Trạng thái TRIAL (dạy thử) rồi ACTIVE (chính thức) |
| **Buổi học** (`sessions`) | Một buổi dạy thực tế, đánh số tăng dần. Do gia sư chủ động khởi tạo từ ca dạy |
| **Nhật ký dạy học** | Văn bản gia sư ghi sau buổi học (kiến thức đã học, dặn dò), học sinh và phụ huynh xem được |
| **QR Proof** | Ảnh biên lai chuyển khoản nộp làm minh chứng (hoặc ảnh phiếu thu tiền mặt khi lễ tân thu hộ) |
| **Số tiền thực nhận** | Số tiền kế toán thấy về tài khoản (hoặc vào quỹ) sau khi đối chiếu sao kê. Chỉ xác nhận khoản phí khi số này không nhỏ hơn số phải nộp; là cơ sở tính doanh thu |
| **Yêu cầu hoàn tiền** | Lễ tân tạo từ khiếu nại hoàn tiền (số tiền đề xuất, tài khoản nhận); kế toán chốt số tiền, chuyển khoản, tải biên lai hoặc từ chối |
| **Công nợ** | Tổng số tiền của các khoản phí chưa nộp hoặc bị yêu cầu gửi lại |
| **Phí nhận lớp** | Khoản gia sư nộp cho trung tâm sau 30 ngày dạy chính thức, bằng **40% học phí tháng đầu** của lớp (mặc định, Lễ tân chỉnh trong 0 - 50%). Với lớp online, phụ huynh đóng tiền trước |
| **Thẻ kỹ năng** | Nhãn kỹ năng gắn với câu hỏi (ví dụ thì quá khứ đơn, từ vựng du lịch) |
| **CEFR** | Thang A1, A2, B1, B2, C1, C2 dùng làm độ khó câu hỏi |
| **Elo** | Điểm năng lực của học sinh, thay đổi sau mỗi câu trả lời theo độ khó |
| **Hồ sơ kỹ năng** | Thống kê theo kỹ năng của học sinh: số đúng, số sai, lần ôn gần nhất |
| **Danh sách ôn tập** | Tập các câu học sinh đã làm sai, dùng để ôn lại |
| **Audit log** | Nhật ký các thao tác quan trọng, hệ thống ghi ngầm khi lễ tân, kế toán hoặc admin thao tác |

## 4. Yêu cầu chức năng

Tổng cộng 44 yêu cầu, **mỗi yêu cầu bám một use case**. Ưu tiên: **M** = bắt buộc cho bản demo, **S** = nên có, làm sau khi các mục M xong. FR-40 đến FR-44 (Kế toán) bổ sung ngày 13/10/2026, đánh số tiếp để không đổi mã các FR cũ.

Hai yêu cầu FR-08 (gia sư ứng tuyển lớp) và FR-15 (gia sư nộp minh chứng phí) có use case riêng là UC-T07 và UC-T08 trong `Usecase_Tutor.md`, khớp với điều kiện của UC-REC-03 và UC-ACC-03.

### 4.1. Cổng công khai (Phụ huynh, khách)

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-01 | Tìm gia sư đang hoạt động theo tỉnh/quận, chuyên môn tiếng Anh, cấp lớp, hình thức học, giới tính, thành tích; có phân trang. Kết quả hiện ảnh, họ tên, trường và chuyên ngành, khu vực, chuyên môn, thành tích. Không công khai học phí | UC-PA-01 | M |
| FR-02 | Xem hồ sơ công khai của gia sư (giới thiệu, bằng cấp và chứng chỉ đã xác thực, kinh nghiệm, khu vực, hình thức dạy, video, lịch rảnh). Mục chưa có thì ẩn, không hiện trường rỗng. Gia sư ngừng hoạt động thì báo hồ sơ không khả dụng | UC-PA-02 | M |
| FR-03 | Đăng ký gia sư chỉ định bằng họ tên và SĐT. Kiểm tra SĐT 10 số đầu 03/05/07/08/09 hoặc +84/84. Tạo đơn ghép lớp "Chờ xử lý" kèm mã yêu cầu, thông báo trung tâm | UC-PA-03 | M |
| FR-04 | Gửi yêu cầu tìm gia sư (chỉ họ tên và SĐT phụ huynh; thông tin của con do Lễ tân hỏi khi gọi lại). Tạo lớp cần gia sư "Chờ xử lý", báo "liên hệ trong 12 giờ", thông báo lễ tân | UC-PA-04 | M |

### 4.2. Đăng nhập

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-05 | Đăng nhập bằng tên đăng nhập và mật khẩu; từ chối tài khoản bị khóa hoặc ngừng hoạt động và hướng dẫn liên hệ trung tâm. **Phụ huynh không có tài khoản riêng: đăng nhập bằng tài khoản của con** để xem lịch, nhật ký dạy học và kết quả quiz | UC-ST-01 | M |
| FR-06 | Lần đăng nhập đầu bằng mật khẩu mặc định thì bắt buộc đặt mật khẩu mới (đạt yêu cầu độ mạnh, không trùng mật khẩu mặc định) | UC-ST-01 | M |

### 4.3. Cổng Gia sư

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-07 | Thiết lập hồ sơ qua form 5 bước: cá nhân, học vấn và chứng chỉ, năng lực và video, bảng giá theo hình thức, lịch rảnh. Kiểm tra bắt buộc, học phí > 0, chứng chỉ ≤ 10 MB (PDF/JPG/PNG), video ≤ 50 MB (MP4/MOV) hoặc liên kết YouTube/Vimeo hợp lệ. Gửi duyệt chuyển "Chờ duyệt", báo chờ 24-48 giờ | UC-T01 | M |
| FR-08 | Xem danh sách lớp cần gia sư đã đăng, xem chi tiết và ứng tuyển kèm lời nhắn; rút lại ứng tuyển khi lớp chưa chọn gia sư | UC-T07 | M |
| FR-09 | Thiết lập lịch dạy thử: ngày, giờ, hình thức (online kèm liên kết, tại nhà kèm địa chỉ). Báo lỗi nếu trùng ca với lịch khác của gia sư. Lớp vẫn ở TRIAL, hiện ca "[Học thử]" trên thời khóa biểu | UC-T05 | M |
| FR-10 | Chốt lịch học cố định hằng tuần: chọn thứ, khung giờ từng ca, hình thức, ngày bắt đầu. Kiểm tra trùng với các lớp ACTIVE khác (báo rõ thứ, giờ, tên học sinh trùng), lớp chuyển ACTIVE, sinh chuỗi ca dạy lặp tuần, thông báo phụ huynh và học sinh | UC-T06 | M |
| FR-11 | Xem lịch dạy dạng tuần (mặc định) và tháng, mỗi ca hiện học sinh, giờ, hình thức. Mở chi tiết ca (địa chỉ hoặc liên kết phòng học). Ca chưa có buổi học thì có nút khởi tạo, hệ thống hỏi xác nhận rồi tạo bản ghi buổi học | UC-T04 | M |
| FR-12 | Quản lý buổi học thực tế: danh sách buổi đánh số tăng dần; trang chi tiết gồm thông tin chung, tài liệu đính kèm, quiz, nhật ký dạy học. Tải tài liệu (.pdf, .docx, âm thanh), báo lỗi và cho tải lại khi mất mạng. Lưu nhật ký thì học sinh và phụ huynh xem được ngay | UC-T02 | M |
| FR-13 | Soạn quiz với trợ lý AI: màn hình chia đôi (xem trước câu hỏi / chat AI), đính kèm tài liệu PDF hoặc ảnh, ngăn kéo "Bảng thống kê hồ sơ học sinh" (sắp theo tỷ lệ sai và thời gian chưa ôn). Sửa trực tiếp câu hỏi hoặc chat để AI sửa. Lưu nháp hoặc giao bài kèm hạn nộp. AI quá 60 giây thì báo lỗi và cho thử lại | UC-T03 | M |
| FR-14 | Import quiz từ công cụ AI ngoài: sao chép prompt mẫu (đã nhúng kỹ năng cần củng cố và chuẩn JSON CEFR), dán kết quả, hệ thống kiểm định cấu trúc và báo lỗi cụ thể (ví dụ "thiếu đáp án đúng tại câu 2"), cho sửa rồi nạp lại | UC-T03b | M |
| FR-15 | Xem khoản phí nhận lớp (mặc định 40% học phí tháng đầu) theo 4 tab (Chưa nộp minh chứng, Yêu cầu gửi lại, Chờ xác nhận, Đã xác nhận), nộp ảnh biên lai khi tròn 30 ngày dạy chính thức để kế toán xác nhận; nộp lại khi kế toán yêu cầu gửi lại kèm lý do | UC-T08 | M |

### 4.4. Cổng Học sinh

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-16 | Xem và sửa hồ sơ cá nhân: chỉ sửa ảnh đại diện, trường, lớp hiện tại, mục tiêu học tập, mật khẩu. Thông tin định danh và liên hệ chỉ xem. Đổi mật khẩu cần mật khẩu hiện tại | UC-ST-02 | S |
| FR-17 | Dashboard: thông tin học sinh và gia sư, buổi học sắp tới và gần nhất, bài tập cần làm và hạn nộp, điểm Elo, thông báo. Một khu vực lỗi hoặc rỗng không làm hỏng cả trang | UC-ST-03 | M |
| FR-18 | Xem danh sách gia sư đang dạy và thông tin quá trình học (môn, ngày bắt đầu, lịch cố định, số buổi đã học) | UC-ST-04 | S |
| FR-19 | Xem lịch học theo tuần (T2-CN) với trạng thái buổi (sắp diễn ra, đang diễn ra, đã học, đã đổi lịch, vắng, hủy) và lịch sử buổi học đánh số giảm dần, lọc theo gia sư | UC-ST-05 | M |
| FR-20 | Chi tiết buổi học: thông tin chung, tài liệu, quiz và kết quả, nhật ký dạy học. Chưa có thì hiện "Chưa có"; học xong mà gia sư chưa công bố thì báo "Gia sư chưa gửi nhật ký buổi học"; buổi vắng/hủy/đổi lịch thì hiện lý do và lịch mới. Chỉ xem được buổi của chính mình | UC-ST-06 | M |
| FR-21 | Xem trực tiếp (PDF, ảnh, âm thanh) hoặc tải về tài liệu qua liên kết an toàn; định dạng không hỗ trợ xem thì chỉ cho tải; tệp đã gỡ thì báo không còn khả dụng | UC-ST-07 | M |
| FR-22 | Làm quiz từng câu: bắt đầu hoặc làm tiếp, hiện từng câu A/B/C/D kèm thanh tiến độ; chọn xong thì khóa, hiện đúng/sai, đáp án, lời giải thích, lưu câu trả lời và Elo mới; **câu sai tự vào danh sách ôn tập**; cuối bài tổng kết số đúng/sai, điểm, thay đổi Elo và thông báo gia sư. Thoát giữa chừng thì câu đã chọn vẫn tính, câu chưa chọn không đổi Elo. Quiz hết hạn thì không mở | UC-ST-08 | M |
| FR-23 | Xem thông báo qua biểu tượng chuông, thông báo chưa đọc nổi bật, mở thì đánh dấu đã đọc, có liên kết điều hướng đến buổi học hoặc bài tập; nội dung đã bị xóa thì báo rõ | UC-ST-09 | M |

### 4.5. Cổng Lễ tân

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-24 | Dashboard: lời chào kèm mã nhân viên, thẻ KPI (đơn ghép lớp chờ xử lý, khiếu nại chờ xử lý, khiếu nại chờ hoàn tiền, gia sư đang hoạt động), lối tắt đến các tác vụ chính | UC-REC-01 | M |
| FR-25 | Quản lý lớp cần gia sư: danh sách 4 mục (Chờ xử lý, Đã đăng, Đã xử lý, Đã hủy), sắp theo thời gian đăng và số gia sư ứng tuyển. Tạo lớp (thông tin phụ huynh và học sinh chưa công khai; yêu cầu lớp, hình thức, phí/buổi, số buổi/tuần, thời gian, yêu cầu gia sư) kèm xác nhận; tạo xong lớp ở trạng thái "Đã đăng" | UC-REC-02 | M |
| FR-26 | Xem danh sách gia sư ứng tuyển (tên, thời gian, lời nhắn) và chọn gia sư. Không có ai ứng tuyển thì khóa nút. Chọn xong tự tạo đơn ghép lớp "Đang dạy thử" | UC-REC-03 | M |
| FR-27 | Hủy lớp cần gia sư: bắt buộc nhập lý do, gỡ lớp khỏi trang gia sư, thông báo lý do cho các gia sư đã ứng tuyển | UC-REC-04 | M |
| FR-28 | Tạo đơn ghép lớp cho trường hợp chỉ định gia sư (phụ huynh, học sinh, gia sư, tên lớp, số buổi/tuần, thời gian mỗi buổi, hình thức, học phí) | UC-REC-05 | M |
| FR-29 | Duyệt đơn ghép lớp: Chờ xử lý → Đang dạy thử, hoặc hủy. Xem theo tab trạng thái | UC-REC-06 | M |
| FR-30 | Hủy đơn ghép lớp ở trạng thái Chờ xử lý, Đang dạy thử hoặc Ghép thành công: nhập lý do, đổi sang "Đã hủy", thông báo các bên liên quan | UC-REC-07 | M |
| FR-31 | Duyệt hồ sơ gia sư mới: xem chi tiết đầy đủ (chứng chỉ, ảnh, bảng giá...), Duyệt chuyển "Đang hoạt động", Không duyệt thì gia sư nhận thông báo từ chối. Ghi audit log | UC-REC-08 | M |
| FR-32 | Quản lý gia sư: 3 tab (Chờ duyệt, Đang hoạt động, Ngưng hoạt động), xem chi tiết, chỉnh trạng thái và thông tin, xác nhận trước khi lưu | UC-REC-09 | M |
| FR-33 | Thu hộ minh chứng phí tại quầy: tìm khoản phí theo mã lớp, tên gia sư hoặc SĐT phụ huynh; chọn cách nộp (tiền mặt hoặc chuyển khoản), tải ảnh phiếu thu hoặc biên lai (≤ 10 MB); khoản phí chuyển "Chờ xác nhận", thông báo kế toán, ghi audit log. Lễ tân không xác nhận tiền | UC-REC-10 | M |
| FR-34 | Quản lý học sinh: danh sách (Đang hoạt động, Dừng hoạt động), tìm kiếm và lọc, xem chi tiết (thông tin cá nhân, phụ huynh, lớp đã và đang học), chỉnh trạng thái | UC-REC-11 | M |
| FR-35 | Tạo đơn khiếu nại tại quầy (người khiếu nại, SĐT, vai trò, mã lớp, loại khiếu nại, lý do) ở trạng thái "Chờ xử lý" | UC-REC-12 | M |
| FR-36 | Xem và sửa đơn khiếu nại: mã đơn, loại (hoàn tiền hoặc ghép lại lớp), người gửi, lớp, lễ tân tiếp nhận, thời điểm, yêu cầu hoàn tiền gần nhất (số đề xuất, số đã hoàn, trạng thái, lý do từ chối), nội dung, trạng thái. Danh sách chia Chờ xử lý, Chờ hoàn tiền, Đã xử lý, Đã hủy; đơn "Chờ hoàn tiền" chỉ xem; rỗng thì hiện "Chưa có khiếu nại nào" | UC-REC-13 | M |
| FR-37 | Giải quyết khiếu nại. **Ghép lại lớp**: bắt buộc nhập kết quả xử lý, có thể đính kèm ảnh minh chứng; chuyển "Đã xử lý", ghi audit log. **Hoàn tiền**: chọn khoản phí đã được kế toán xác nhận của lớp, nhập số tiền đề xuất (không vượt số còn có thể hoàn) và tài khoản nhận, gửi kế toán; đơn chuyển "Chờ hoàn tiền". Kế toán từ chối thì đơn quay về "Chờ xử lý" kèm lý do | UC-REC-14 | M |

### 4.6. Cổng Admin (thêm so với Lễ tân và Kế toán)

Admin có toàn bộ FR-24 đến FR-37 của Lễ tân và FR-40 đến FR-44 của Kế toán, và thêm:

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-38 | Quản lý nhân sự (lễ tân, kế toán): danh sách lọc theo vai trò và trạng thái, tìm kiếm, xem chi tiết (mã nhân viên, họ tên, email, SĐT, vai trò, ngày vào làm, trạng thái, số liệu công việc theo vai trò), chỉnh trạng thái, xác nhận trước khi lưu. Không đổi vai trò trên tài khoản đang có | UC-ADM-01 | S |
| FR-39 | Thêm nhân sự mới: chọn vai trò (Lễ tân/Kế toán), họ tên, email, SĐT, ngày vào làm; kiểm tra bắt buộc và trùng email/SĐT; tạo tài khoản role RECEPTIONIST hoặc ACCOUNTANT và mã nhân viên theo cùng quy tắc tạo tài khoản học sinh, ghi audit log | UC-ADM-02 | S |

### 4.7. Cổng Kế toán

| FR | Yêu cầu | UC nguồn | Ưu tiên |
| --- | --- | --- | --- |
| FR-40 | Dashboard kế toán: lời chào kèm mã nhân viên, thẻ chỉ số (khoản phí chờ xác nhận, yêu cầu hoàn tiền chờ xử lý, tiền thu và tiền hoàn trong tháng, công nợ), biểu đồ thu - hoàn 6 tháng, lối tắt. Khối nào lỗi thì báo riêng | UC-ACC-01 | S |
| FR-41 | Quản lý khoản phí nhận lớp: 4 tab (Chưa nộp minh chứng, Chờ xác nhận, Đã xác nhận, Yêu cầu gửi lại), tìm kiếm và lọc theo người nộp, tháng; xem chi tiết kèm cách tính phí; Lễ tân hoặc Admin chỉnh tỷ lệ phí (mặc định 40%, trong khoảng 0 - 50%) khi khoản phí chưa có minh chứng, số tiền tính lại, thông báo người nộp, ghi audit log | UC-REC-10, UC-ACC-02 | S |
| FR-42 | Xác nhận khoản phí đã nhận: xem ảnh biên lai hoặc phiếu thu, nhập số tiền thực nhận. Đủ tiền thì "Đã xác nhận", mở khóa liên hệ, thông báo, ghi audit log; thiếu tiền thì không cho xác nhận. **Yêu cầu gửi lại** bắt buộc nhập lý do, thông báo người nộp hoặc lễ tân đã thu hộ. Người tải minh chứng không được tự xác nhận | UC-ACC-03 | M |
| FR-43 | Xử lý yêu cầu hoàn tiền: 3 tab (Chờ xử lý, Đã hoàn tiền, Đã từ chối); xem khiếu nại, khoản bị hoàn (thực nhận, đã hoàn, còn lại), tài khoản nhận; nhập số tiền hoàn (không vượt số còn lại), tải biên lai (bắt buộc) rồi xác nhận: khiếu nại tự "Đã xử lý". **Từ chối** bắt buộc nhập lý do, khiếu nại về "Chờ xử lý". Người tạo yêu cầu không được tự xử lý | UC-ACC-04 | M |
| FR-44 | Thống kê tài chính: lọc theo tháng, quý, năm hoặc khoảng ngày, người nộp, hình thức dạy; thẻ tổng hợp (tiền thu, tiền hoàn, doanh thu thuần, số khoản đã xác nhận, công nợ), biểu đồ theo tháng, bảng theo gia sư, danh sách giao dịch có phân trang; xuất Excel theo bộ lọc, ghi audit log. Không có dữ liệu thì khóa nút xuất | UC-ACC-05 | M |

### 4.8. Quy tắc nghiệp vụ xuyên suốt

- **QT-1.** Mọi thao tác thay đổi dữ liệu của lễ tân, kế toán và admin đều có hộp thoại xác nhận trước khi thực hiện; hủy thì quay về màn hình trước, không đổi gì.
- **QT-2.** Hủy lớp hoặc hủy đơn luôn bắt buộc nhập lý do và thông báo cho bên liên quan.
- **QT-3.** Thông tin liên hệ của phụ huynh chỉ mở cho gia sư sau khi trung tâm chọn gia sư. Thông tin phụ huynh và học sinh trong lớp cần gia sư đã đăng thì ẩn.
- **QT-4.** Phí nhận lớp mặc định **40% học phí tháng đầu** của lớp, Lễ tân hoặc Admin chỉnh được trong 0 - 50%. Phí được kế toán xác nhận thì mở khóa liên hệ.
- **QT-5.** Bản ghi buổi học chỉ tạo khi gia sư chủ động khởi tạo, không sinh tự động từ lịch cố định.
- **QT-6.** Một gia sư không được có hai ca trùng giờ: kiểm tra khi đặt lịch dạy thử và khi chốt lịch cố định.
- **QT-7.** Quiz chỉ mở cho học sinh khi ở trạng thái `assigned` và còn hạn. Mỗi câu chỉ chọn một lần.
- **QT-8.** Phụ huynh không có tài khoản riêng; mọi thao tác xem của phụ huynh đi qua tài khoản học sinh.
- **QT-9.** Kiểm soát chéo tiền: người tải minh chứng không được xác nhận khoản phí đó; người tạo yêu cầu hoàn tiền không được chi khoản hoàn đó. Áp dụng cả với Admin.
- **QT-10.** Tổng tiền hoàn của một khoản phí không vượt số tiền thực nhận của khoản đó. Hoàn tiền phải có ảnh biên lai.
- **QT-11.** Doanh thu ghi nhận theo ngày kế toán xác nhận khoản phí; tiền hoàn ghi nhận theo ngày kế toán xác nhận đã hoàn.

## 5. Máy trạng thái của các đối tượng chính

| Đối tượng | Các trạng thái và chuyển đổi |
| --- | --- |
| Hồ sơ gia sư | Chưa hoàn thiện → Chờ duyệt → Đang hoạt động ⇄ Ngưng hoạt động; Chờ duyệt → Bị từ chối |
| Lớp cần gia sư | Chờ xử lý (phụ huynh gửi) → Đã đăng (lễ tân tạo lớp) → Đã xử lý (đã chọn gia sư); Chờ xử lý hoặc Đã đăng → Đã hủy |
| Đơn ghép lớp | Chờ xử lý → Đang dạy thử → Ghép thành công; Chờ xử lý, Đang dạy thử hoặc Ghép thành công → Đã hủy |
| Lớp học | TRIAL → ACTIVE → kết thúc hoặc hủy |
| Phí nhận lớp | Chưa nộp minh chứng → Chờ xác nhận (gia sư nộp hoặc lễ tân thu hộ) → Đã xác nhận (kế toán); Chờ xác nhận → Yêu cầu gửi lại → Chờ xác nhận |
| Khiếu nại | Chờ xử lý → Đã xử lý (ghép lại lớp); Chờ xử lý → Chờ hoàn tiền → Đã xử lý (hoàn tiền); Chờ hoàn tiền → Chờ xử lý (kế toán từ chối); Chờ xử lý → Đã hủy |
| Yêu cầu hoàn tiền | Chờ xử lý → Đã hoàn tiền; Chờ xử lý → Đã từ chối |
| Quiz | draft → assigned → Đã hoàn thành; assigned → hết hạn |
| Buổi học (hiển thị với học sinh) | Sắp diễn ra, Đang diễn ra, Đã học, Đã đổi lịch, Vắng, Hủy |

## 6. Ngoài phạm vi (Non-Goals)

Những mục không có trong use case, nên không làm:

- Xem audit log trên giao diện, đối soát tự động với ngân hàng, kế toán tổng hợp (sổ sách, thuế, lương gia sư, hóa đơn), xuất báo cáo dạng PDF (chỉ xuất Excel).
- Tạo tài khoản học sinh từ giao diện lễ tân (tài khoản do trung tâm cấp, chưa có use case).
- Tài khoản phụ huynh riêng, biểu đồ tiến bộ cho phụ huynh.
- Lập lịch ôn tập theo SM-2 (chỉ có danh sách ôn tập từ câu sai).
- Khung chương trình học nhiều cấp.
- Các dạng bài tập ngoài trắc nghiệm A/B/C/D.
- Thanh toán trực tuyến tự động. Chỉ chuyển khoản thủ công kèm ảnh biên lai.
- Dạy học trực tuyến tích hợp (chỉ lưu liên kết Zoom/Meet).
- Chatbot tư vấn trên trang chủ, gamification, đánh giá gia sư sau học thử, ứng dụng di động riêng.

## 7. Phạm vi MVP

**Bắt buộc (M):** FR-01 đến FR-15, FR-17, FR-19 đến FR-37, FR-42 đến FR-44 (38 yêu cầu).

**Làm sau khi xong phần bắt buộc (S):** FR-16, FR-18, FR-38 đến FR-41 (6 yêu cầu).

## 8. Chỉ số thành công

### 8.1. Chỉ số chính

| Mã | Chỉ số | Mục tiêu |
| --- | --- | --- |
| SM-1 | Thời gian từ lúc phụ huynh gửi yêu cầu đến khi trung tâm liên hệ lại | Dưới 12 giờ |
| SM-2 | Tỷ lệ phụ huynh mở form tìm gia sư và gửi thành công | Từ 60% |
| SM-3 | Thời gian gia sư soạn và giao một quiz so với soạn tay | Giảm rõ rệt (đo trong buổi UAT) |
| SM-4 | Quiz giao ra có đủ đáp án đúng, lời giải thích, độ khó CEFR và thẻ kỹ năng | 100% |

### 8.2. Chỉ số phụ

| Mã | Chỉ số | Mục tiêu |
| --- | --- | --- |
| SM-5 | Quiz được học sinh hoàn thành trước hạn | Từ 75% |
| SM-6 | Buổi học đã dạy có nhật ký được công bố | Từ 80% |
| SM-7 | Khoản phí nhận lớp đến hạn có minh chứng được kế toán xác nhận đúng hạn | Từ 90% |
| SM-8 | Thời gian từ khi lễ tân gửi yêu cầu hoàn tiền đến khi kế toán xử lý xong | Dưới 2 ngày làm việc |
| SM-9 | Số liệu thống kê khớp với tổng các khoản đã xác nhận và đã hoàn trong kỳ (kiểm tra khi UAT) | 100% |

### 8.3. Chỉ số kiểm soát rủi ro

| Mã | Chỉ số | Ngưỡng |
| --- | --- | --- |
| SM-C1 | Chi phí gọi LLM cho mỗi quiz (soạn bằng trợ lý AI) | Không quá 0,005 USD |
| SM-C2 | Câu hỏi AI sinh ra được gia sư giữ nguyên hoặc chỉ sửa nhỏ | Từ 85% |
| SM-C3 | Thời gian AI phản hồi | Dưới 60 giây (giới hạn cứng), mục tiêu dưới 10 giây |

## 9. Yêu cầu phi chức năng

### 9.1. Hiệu năng và độ tin cậy
- API backend phản hồi dưới 500 ms với thao tác thường (không tính AI và tải tệp).
- Lỗi mạng hoặc máy chủ: giao diện báo rõ, giữ lại dữ liệu đã nhập và cho thử lại.
- Dashboard chịu được lỗi từng phần: khu vực nào lỗi thì báo riêng, không làm hỏng cả trang.

### 9.2. Bảo mật và riêng tư
- HTTPS, JWT hết hạn sau 24 giờ, mật khẩu băm một chiều.
- Kiểm tra quyền ở backend theo vai trò (Admin, Lễ tân, Kế toán, Gia sư, Học sinh) và theo quan hệ lớp học: gia sư chỉ thấy học sinh mình phụ trách, học sinh chỉ thấy buổi học của mình. Chức năng quản lý nhân sự chỉ mở cho Admin. Chức năng xác nhận phí, hoàn tiền và thống kê tài chính chỉ mở cho Kế toán và Admin; Lễ tân không xem được thống kê doanh thu.
- Liên kết tải tài liệu và minh chứng là liên kết có kiểm soát, không công khai.
- AI Service không nhận dữ liệu định danh: chỉ nhận mã ẩn danh, mô tả bài học và thống kê kỹ năng.
- Giới hạn tệp: chứng chỉ ≤ 10 MB, video ≤ 50 MB, kiểm tra định dạng ở backend.

### 9.3. AI
- Có bộ lọc kiểm duyệt nội dung và kiểm định cấu trúc đầu ra (câu hỏi, 4 phương án, đáp án đúng, CEFR, thẻ kỹ năng).
- Giới hạn chi phí hằng tháng; chế độ import không tốn token.
- Gia sư luôn xem và sửa được trước khi giao bài.

### 9.4. Giao diện
- Toàn bộ giao diện bằng tiếng Việt, hỗ trợ sáng và tối, hiển thị tốt trên điện thoại (dưới 768 px không tràn ngang).
- Tuân thủ `frontend/AGENTS.md` và `frontend/DESIGN.md`.

### 9.5. Audit log
Hệ thống ghi nhận (không có giao diện xem) các thao tác mà use case yêu cầu ghi: duyệt hoặc từ chối hồ sơ gia sư, thu hộ minh chứng, chỉnh tỷ lệ phí, xác nhận hoặc yêu cầu gửi lại minh chứng, tạo, chi hoặc từ chối yêu cầu hoàn tiền, xuất báo cáo tài chính, thêm và sửa nhân sự, giải quyết khiếu nại. Mỗi bản ghi có người thực hiện, hành động, đối tượng, thời điểm.

### 9.6. Triển khai
`docker compose up --build` chạy được đủ 5 dịch vụ (frontend, backend, AI, database, kho tệp MinIO); GitHub Actions CI xanh trước khi merge vào `dev`.

## 10. Các quyết định tạm

Những điểm use case chưa nêu rõ. Nhóm đã chọn một phương án mặc định để làm tiếp, có thể đổi nếu cần (ghi chú ảnh hưởng để biết sửa ở đâu).

| Mã | Vấn đề | Quyết định tạm | Ảnh hưởng nếu đổi |
| --- | --- | --- | --- |
| QĐ-1 | Học sinh có nhiều gia sư cùng lúc không (UC-ST-04, UC-ST-05 cho lọc theo gia sư) | Có. Mỗi cặp gia sư - học sinh là một lớp học. **Elo và hồ sơ kỹ năng theo học sinh** (dùng chung giữa các gia sư), không tách theo gia sư | `student_skill_stats`, `students.elo` |
| QĐ-2 | Tham số Elo | Elo khởi đầu 1000, K = 32, độ khó A1 = 800, A2 = 1000, B1 = 1200, B2 = 1400, C1 = 1600, C2 = 1800. Cấu hình trong `application.yml` | Chỉ cấu hình |
| QĐ-3 | Use case cho gia sư ứng tuyển lớp và nộp minh chứng phí | **Đã bổ sung** `UC-T07` và `UC-T08` vào `Usecase_Tutor.docx`; FR-08 và FR-15 bám hai use case này | Không |
| QĐ-4 | Ai chọn tỷ lệ phí | Hệ thống tạo khoản phí với tỷ lệ **mặc định 40%**; **Lễ tân hoặc Admin** chỉnh trong khoảng 0 - 50% khi khoản phí chưa có minh chứng; **kế toán không được chỉnh** (theo use case kế toán v1.1). Số tiền = tỷ lệ × số ca/tuần (số dòng `class_schedules`) × 4 × học phí mỗi buổi, làm tròn đến nghìn đồng | `payments.fee_percentage`, UC-ACC-02 |
| QĐ-5 | Lớp online phụ huynh đóng trước | Cùng công thức. Khoản phí tạo khi gia sư chốt lịch cố định (lớp chuyển ACTIVE) cho mọi lớp; lớp tại nhà thì gia sư nộp khi tròn 30 ngày dạy chính thức | Thời điểm tạo `payments` |
| QĐ-6 | Lỗi tham chiếu và tên gọi trong `Usecase_Tutor.docx` | **Đã sửa**: UC-T04 trỏ tới màn hình chi tiết buổi học (UC-T02), và bỏ cụm "Lễ tân/Lễ tân" | Không |
| QĐ-7 | Tài khoản học sinh được cấp thế nào khi chưa có use case tạo tài khoản | Lễ tân không tạo tài khoản trên giao diện. Dữ liệu ban đầu do script khởi tạo (seed) theo quy tắc chung: tên đăng nhập sinh từ họ tên và mã học sinh, mật khẩu mặc định dùng một lần (FR-06). Khi cần tạo tài khoản trên giao diện thì viết thêm use case | `auth`, dữ liệu mẫu |
| QĐ-8 | Ai quyết số tiền hoàn | Lễ tân thống nhất với người khiếu nại và đề xuất; kế toán chốt số cuối (có thể thấp hơn đề xuất, không vượt số đã thu) hoặc từ chối kèm lý do. Hoàn tiền chuyển khoản ngoài hệ thống, hệ thống chỉ lưu biên lai | `refunds`, UC-REC-14, UC-ACC-04 |

## 11. Giả định

- **GĐ-1.** Phụ huynh sẵn sàng điền form ngắn (khoảng 30 giây) để trung tâm tư vấn lại.
- **GĐ-2.** Gia sư dùng điện thoại hoặc máy tính; giao diện web responsive là đủ.
- **GĐ-3.** Học sinh dùng tài khoản do trung tâm cấp, mật khẩu mặc định chỉ dùng một lần. Phụ huynh dùng chung tài khoản đó để xem.
- **GĐ-4.** Kế toán đối chiếu thủ công ảnh biên lai với sao kê ngân hàng (hoặc sổ quỹ với tiền mặt), không cần đối soát tự động với ngân hàng.
- **GĐ-5.** Trung tâm có ít nhất một kế toán và một lễ tân khác người, để quy tắc kiểm soát chéo (QT-9) luôn có người xác nhận.
