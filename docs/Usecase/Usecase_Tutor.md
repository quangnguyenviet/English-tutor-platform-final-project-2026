# TÀI LIỆU ĐẶC TẢ TRƯỜNG HỢP SỬ DỤNG (USE CASE): PHÂN HỆ GIA SƯ
**Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Đồ án Tốt nghiệp**  
**Đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition  

---

# PHẦN I: TỔNG QUAN PHÂN HỆ GIA SƯ & PHẠM VI MVP

Phân hệ Gia sư được thiết kế tinh gọn, tập trung tối đa vào 2 giá trị cốt lõi: **tối ưu vận hành nhận lớp** và **trợ lý giảng dạy cá nhân hóa AI bám sát Hồ sơ Kiến thức Học sinh (SKP)**.

> [!NOTE]  
> **Ghi chú phạm vi MVP:** Tính năng *Đổi lịch học / Báo nghỉ buổi học* đã được loại bỏ khỏi phạm vi MVP ban đầu; sau đó tính năng này được triển khai trở lại dưới dạng **Ngoại lệ lịch dạy (exception overlay)** — Gia sư ghi báo nghỉ (`CANCELLED`) / đổi lịch (`RESCHEDULED`) cho từng ô ca cụ thể trên lưới Thời khóa biểu tuần (UC-T07), thay vì sửa khung lịch cố định. Lịch dạy học của gia sư và học sinh vận hành theo khung thời khóa biểu cố định hàng tuần được chốt sau khi nhận lớp thành công.

---

# PHẦN II: ĐẶC TẢ CHI TIẾT TỪNG USE CASE PHÂN HỆ GIA SƯ

---

### UC - T01. Thiết lập Hồ sơ Gia sư

**Mã Use Case**  
UC-T01

**Tên Use Case**  
Thiết lập Hồ sơ Gia sư

**Mô tả**  
Cho phép Gia sư lần đầu đăng ký/đăng nhập vào hệ thống (hỗ trợ Email, Số điện thoại hoặc Google-Login) thực hiện khai báo và hoàn thiện Hồ sơ năng lực cá nhân. Hồ sơ bao gồm: thông tin cá nhân, trình độ học vấn, chứng chỉ tiếng Anh (IELTS/TOEIC/VSTEP... kèm tệp minh chứng), kinh nghiệm giảng dạy, video giới thiệu bản thân (dán đường dẫn YouTube/TikTok, không tải tệp video), môn/khối lớp nhận dạy, thiết lập Bảng giá học phí mong muốn (theo giờ phân loại theo hình thức Online/Tại nhà), hình thức dạy và khung thời gian rảnh dự kiến. Sau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ duyệt (`PENDING`) để Admin/Lễ tân xác thực trước khi Gia sư chính thức được ghép lớp.

**Tác nhân**  
Gia sư mới (Tác nhân chính), Admin / Lễ tân (Tác nhân phụ)

**Độ ưu tiên**  
Rất cao (Bắt buộc hoàn thành trước khi tham gia vận hành nhận lớp)

**Sự kiện kích hoạt**  
Gia sư hoàn tất đăng ký tài khoản / đăng nhập lần đầu tiên vào Cổng Gia sư và được hệ thống tự động điều hướng tới màn hình "Thiết lập Hồ sơ Gia sư".

**Tiền điều kiện**  
- Gia sư đã xác thực tài khoản (Email / Số điện thoại).
- Tài khoản Gia sư ở trạng thái Chưa hoàn thiện hồ sơ (`INCOMPLETE`).

**Hậu điều kiện**  
- Dữ liệu Hồ sơ Gia sư, tệp chứng chỉ minh chứng và Bảng giá học phí đề xuất được lưu an toàn trong cơ sở dữ liệu.
- Trạng thái hồ sơ chuyển sang Chờ duyệt (`PENDING`) và thông báo nộp hồ sơ được gửi tới Admin/Lễ tân.

**Luồng chính**  
1. Gia sư đăng nhập lần đầu vào Cổng Gia sư (Email/Số điện thoại hoặc Google-Login). Hệ thống tự động chuyển hướng đến màn hình **"Thiết lập Hồ sơ Gia sư"**.
2. Hệ thống hiển thị biểu mẫu nhiều phần (Multi-section Form) chia các tab thành phần riêng, gia sư điền tuần tự theo các nhóm thông tin:
   - **Thông tin cá nhân & Liên hệ:** Ảnh đại diện (Avatar), Họ và tên, Ngày sinh, Giới tính, Số điện thoại, Địa chỉ cư trú.
   - **Trình độ học vấn & Chứng chỉ:** Trường đại học/chuyên ngành, Trạng thái (Sinh viên/Đã tốt nghiệp/Giảng viên), Loại chứng chỉ Tiếng Anh (IELTS, TOEIC, VSTEP...), Điểm số/Overall, Ngày cấp và Nút tải tệp đính kèm bản chụp/scan Chứng chỉ (PDF, JPG, PNG).
   - **Năng lực, Kinh nghiệm & Video giới thiệu:** Số năm kinh nghiệm gia sư, Thế mạnh giảng dạy (IELTS Speaking, Ngữ pháp THPT, Tiếng Anh Giao tiếp...), Bài giới thiệu bản thân (Bio), Video giới thiệu bản thân (dán đường dẫn YouTube/TikTok).
   - **Thiết lập Bảng giá học phí & Hình thức dạy:** 
     * Mức học phí mong muốn (đơn vị: VNĐ/giờ) thiết lập riêng cho từng hình thức dạy (*Online* và *Tại nhà / Offline*) hoặc theo nhóm chương trình (luyện thi IELTS/TOEIC, Tiếng Anh Giao tiếp, Tiếng Anh Phổ thông...).
     * Hình thức dạy nhận lớp (*Online*, *Tại nhà*, hoặc *Cả hai*), Khu vực nhận dạy (danh sách Quận/Huyện chọn nếu dạy Tại nhà).
     * Cờ **"Đang mở nhận lớp"** (mặc định bật): Gia sư có thể tự bật/tắt trên hồ sơ. Khi tắt, Gia sư không thấy các lớp cần gia sư đang đăng và không ứng tuyển được, nhưng các lớp đang dạy vẫn được giữ nguyên không bị ảnh hưởng. Cờ có thể bật lại bất kỳ lúc nào.
   - **Thiết lập Khung thời gian rảnh:** Đăng ký các ca dạy rảnh cố định trong tuần (Sáng/Chiều/Tối các Thứ) để hệ thống/Admin sử dụng làm căn cứ gợi ý ghép lớp.
3. Gia sư điền đầy đủ thông tin, tải tệp minh chứng chứng chỉ, dán link video giới thiệu và cấu hình Bảng giá học phí đề xuất tại từng phần của biểu mẫu (dữ liệu được lưu dần, gia sư có thể rời đi và quay lại tiếp tục).
4. Gia sư nhấp nút **"Gửi duyệt hồ sơ"** (endpoint `POST /me/profile/submit`).
5. Hệ thống kiểm tra tính hợp lệ của thông tin (các trường bắt buộc, mức học phí hợp lệ > 0, định dạng tệp tải lên).
6. Hệ thống lưu toàn bộ dữ liệu hồ sơ vào cơ sở dữ liệu, chuyển trạng thái hồ sơ sang Chờ duyệt (`PENDING`).
7. Hệ thống gửi thông báo xác nhận: *"Hồ sơ của bạn đã được gửi thành công và đang chờ Admin/Lễ tân phê duyệt trong vòng 24-48h."* Use Case kết thúc.

**Luồng thay thế**  
3a. Gia sư lưu hồ sơ để hoàn thiện sau (Lưu nháp):  
3a1. Tại bất kỳ phần nào của biểu mẫu, Gia sư nhấp nút **"Lưu hồ sơ"** (không gửi duyệt).  
3a2. Hệ thống lưu các thông tin đã điền, hồ sơ vẫn giữ trạng thái Chưa hoàn thiện (`INCOMPLETE`).  
3a3. Khi Gia sư đăng nhập lại lần sau, hệ thống khôi phục các thông tin đã lưu để tiếp tục hoàn thiện.  
Use Case tiếp tục bước 3.

7a. Hồ sơ đang chờ duyệt, Gia sư muốn rút hồ sơ về chỉnh sửa:  
7a1. Gia sư nhấp nút **"Hủy duyệt hồ sơ"** (endpoint `POST /me/profile/cancel`).  
7a2. Hệ thống chuyển trạng thái hồ sơ từ Chờ duyệt (`PENDING`) về Chưa hoàn thiện (`INCOMPLETE`), cho phép Gia sư chỉnh sửa tự do; muốn chờ duyệt lại thì gửi duyệt (bước 4).  
Use Case tiếp tục bước 3.

8a. Hồ sơ bị Admin Từ chối (`REJECTED`) và Gia sư cập nhật lại:  
8a1. Gia sư đăng nhập vào Cổng Gia sư, hệ thống hiển thị thông báo hồ sơ bị từ chối kèm Lý do từ chối từ Admin (ví dụ: *"Ảnh chụp chứng chỉ IELTS bị mờ, vui lòng tải lại"*).  
8a2. Gia sư nhấp **"Cập nhật lại hồ sơ"**.  
8a3. Gia sư điều chỉnh thông tin hoặc tải lại tệp chứng chỉ mới theo yêu cầu.  
8a4. Gia sư nhấp **"Gửi lại hồ sơ"**.  
Use Case tiếp tục bước 5.

9a. Widget gói lưu trữ tài liệu buổi học (V30):  
9a1. Trên hồ sơ gia sư, widget hiển thị gói lưu trữ hiện tại và dung lượng đã dùng/dung lượng được phép, lấy dữ liệu từ endpoint `GET /tutors/me/storage` (catalog `storage_tiers` trong CSDL: `FREE` 1GB, `PRO` 10GB, `PREMIUM` 50GB; ghi lịch sử qua bảng `tutor_storage_subscriptions`).  
9a2. Khi dung lượng sử dụng chạm/quá mức quota của gói, hệ thống chặn việc tải thêm tài liệu bài giảng (lỗi "vượt quota" hoặc "gói đã hết hạn" nếu gói trả phí đã quá hạn) và gợi ý gia sư nâng cấp gói.  
Use Case tiếp tục bước 3.

**Luồng ngoại lệ**  
5a. Tệp đính kèm không hợp lệ hoặc quá dung lượng:  
5a1. Tệp chứng chỉ vượt quá hạn dung lượng chung 50MB của hệ thống (avatar/chứng chỉ dùng chung một giới hạn) hoặc tệp tài liệu bài giảng vượt quá 20MB / không đúng định dạng được hỗ trợ / link video không hợp lệ.  
5a2. Hệ thống báo lỗi: *"Tệp không hợp lệ hoặc quá dung lượng. Vui lòng tải tệp chứng chỉ/ảnh < 50MB, tệp tài liệu bài giảng < 20MB hoặc kiểm tra lại đường dẫn video."*  
5a3. Gia sư chọn lại tệp hoặc điều chỉnh liên kết video hợp lệ.  
Use Case quay lại bước 3.

5b. Thiếu các trường thông tin bắt buộc hoặc mức học phí không hợp lệ:  
5b1. Gia sư bỏ trống thông tin bắt buộc (như Mức học phí đề xuất, Điểm chứng chỉ, Tệp đính kèm chứng chỉ...) hoặc nhập mức học phí $\le$ 0.  
5b2. Hệ thống đánh dấu đỏ các ô thông tin bị thiếu/sai và thông báo: *"Vui lòng điền đầy đủ thông tin bắt buộc và mức học phí hợp lệ trước khi gửi duyệt."*  
Use Case quay lại bước 3.

---

### UC - T02. Xem danh sách & Ứng tuyển Lớp cần gia sư

**Mã Use Case**  
UC-T02

**Tên Use Case**  
Xem danh sách & Ứng tuyển Lớp cần gia sư

**Mô tả**  
Cho phép Gia sư xem danh sách các lớp học đang có nhu cầu tìm gia sư được đăng công khai trên **Bảng tin Lớp cần gia sư**. Các lớp này do Admin/Lễ tân cập nhật công khai để tất cả gia sư đã phê duyệt hồ sơ cùng tiếp cận. Gia sư có thể lọc danh sách theo từ khóa (tìm kiếm chung), hình thức (Online/Tại nhà), nhóm khối lớp, và sắp xếp theo mức học phí, sau đó nhấp xem chi tiết yêu cầu lớp và gửi đơn ứng tuyển. Đơn ứng tuyển sau khi gửi thành công sẽ được lưu ở trạng thái Chờ duyệt (`APPLIED`) để Admin/Lễ tân xem xét ghép lớp.

**Tác nhân**  
Gia sư (Tác nhân chính), Admin / Lễ tân (Tác nhân phụ)

**Độ ưu tiên**  
Rất cao (Nghiệp vụ vận hành nhận lớp cốt lõi)

**Sự kiện kích hoạt**  
Gia sư nhấp chọn mục **"Bảng tin Lớp cần gia sư"** trên Cổng Gia sư.

**Tiền điều kiện**  
- Gia sư đã đăng nhập thành công vào Cổng Gia sư.
- Hồ sơ Gia sư ở trạng thái đã được Admin phê duyệt (`ACTIVE`).
- Gia sư đang bật cờ **"Đang mở nhận lớp"** trên hồ sơ.

**Hậu điều kiện**  
- Đơn ứng tuyển của Gia sư được lưu vào cơ sở dữ liệu ở trạng thái Chờ duyệt (`APPLIED`).
- Thông báo đơn ứng tuyển mới được gửi tới Admin/Lễ tân để duyệt chọn gia sư.

**Luồng chính**  
1. Gia sư truy cập Cổng Gia sư và chọn mục **"Bảng tin Lớp cần gia sư"**.
2. Hệ thống hiển thị danh sách các lớp học đang đăng tuyển công khai (gồm các thẻ tóm tắt: Mã lớp, Chương trình học *(IELTS, TOEIC, Giao tiếp, Phổ thông...)*, Khối lớp / Độ tuổi, Trình độ hiện tại & Mục tiêu, Mức học phí/buổi, Hình thức Online/Tại nhà, Khu vực Quận/Huyện, Khung giờ học dự kiến).
3. Gia sư nhấp chọn một lớp học để xem **Chi tiết Lớp học** (xem Yêu cầu cụ thể từ Phụ huynh, Trình độ chi tiết của học sinh, Địa chỉ nhà học sinh nếu học tại nhà, Số buổi/tuần).
4. Gia sư nhấp nút **"Ứng tuyển nhận lớp"**.
5. Hệ thống hiển thị cửa sổ Modal xác nhận ứng tuyển (cho phép Gia sư xác nhận khả năng đáp ứng khung giờ và nhập Ghi chú/Lời nhắn giới thiệu bản thân tới Admin/Trung tâm).
6. Gia sư nhấp **"Xác nhận gửi đơn ứng tuyển"**.
7. Hệ thống kiểm tra điều kiện (Hồ sơ gia sư đã được duyệt, chưa ứng tuyển lớp này trước đó, lớp học còn mở nhận ứng tuyển).
8. Hệ thống lưu bản ghi đơn ứng tuyển ở trạng thái Chờ duyệt (`APPLIED`), đồng thời gửi thông báo tới Admin/Lễ tân.
9. Hệ thống hiển thị thông báo: *"Đơn ứng tuyển của bạn đã được gửi thành công. Trung tâm sẽ xem xét và thông báo kết quả trong vòng 24h."* Use Case kết thúc.

**Luồng thay thế**  
2a. Gia sư lọc/sắp xếp danh sách lớp theo tiêu chí:  
2a1. Gia sư sử dụng bộ lọc: từ khóa tìm kiếm (*tên lớp, chương trình...*), Hình thức (*Online / Tại nhà*), Nhóm khối lớp, và nút sắp xếp theo Mức học phí (thấp → cao / cao → thấp).  
2a2. Hệ thống tải và hiển thị danh sách các lớp khớp với tiêu chí lọc (endpoint `GET /open-requests` chỉ hỗ trợ từ khóa, hình thức, nhóm khối và sắp xếp học phí — không lọc theo khu vực).  
Use Case tiếp tục bước 3.

6a. Gia sư Hủy đơn ứng tuyển (khi đơn đang chờ duyệt):  
6a1. Tại danh sách **"Lớp đã ứng tuyển"**, Gia sư nhấp nút **"Hủy ứng tuyển"** đối với đơn đang ở trạng thái `APPLIED`.  
6a2. Hệ thống hiển thị hộp thoại xác nhận. Gia sư đồng ý.  
6a3. Hệ thống xóa bản ghi ứng tuyển và cập nhật lại trạng thái nút thành "Ứng tuyển nhận lớp".  
Use Case kết thúc.

6b. Danh sách "Lớp đã ứng tuyển" hiển thị trạng thái các đơn:  
6b1. Đơn đang chờ Admin/Lễ tân xem xét hiển thị trạng thái `APPLIED` ("Chờ duyệt").  
6b2. Đơn bị Admin/Lễ tân từ chối hiển thị trạng thái `REJECTED` ("Đã từ chối").  
6b3. Đơn được chọn ghép lớp hiển thị trạng thái `SELECTED` ("Đã được chọn").  
6b4. Đơn bị loại sau dạy thử thất bại hiển thị trạng thái `TERMINATED` — *"Đã loại – dạy thử không thành công, không thể ứng tuyển lại đơn này"* (do mỗi Gia sư chỉ có một bản ghi ứng tuyển cho mỗi đơn).  
6b5. Gia sư nhấp "Ứng tuyển nhận lớp" cho đơn ở trạng thái `TERMINATED` sẽ bị chặn kèm thông báo nêu rõ lý do.  
Use Case tiếp tục bước 2.

**Luồng ngoại lệ**  
7a. Gia sư đã ứng tuyển lớp này trước đó:  
7a1. Hệ thống phát hiện Gia sư đã gửi đơn ứng tuyển cho mã lớp này.  
7a2. Hệ thống thông báo: *"Bạn đã gửi đơn ứng tuyển cho lớp học này rồi. Vui lòng chờ phản hồi từ Trung tâm."*  
Use Case quay lại bước 2.

7b. Lớp học đã chốt gia sư khác hoặc đã ngưng nhận ứng tuyển:  
7b1. Hệ thống phát hiện lớp học (đơn yêu cầu lớp `class_requests`) không còn ở trạng thái `NEW`/`OPEN` — đã chuyển sang `MATCHED` (đã ghép gia sư), `REMATCH` (tìm gia sư khác) hoặc `CANCELLED` (đã hủy).  
7b2. Hệ thống thông báo: *"Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển."*  
Use Case quay lại bước 2.

7c. Hồ sơ Gia sư chưa được duyệt (`PENDING` hoặc `INCOMPLETE`):  
7c1. Gia sư chưa hoàn thiện hồ sơ hoặc hồ sơ đang trong quá trình chờ Admin xác thực.  
7c2. Hệ thống chặn và thông báo: *"Hồ sơ của bạn chưa được phê duyệt. Vui lòng hoàn tất và chờ Admin xác thực hồ sơ trước khi ứng tuyển nhận lớp."*  
Use Case kết thúc.

---

### UC - T04. Quản lý Khung chương trình

**Mã Use Case**  
UC-T04

**Tên Use Case**  
Quản lý Khung chương trình

> [!WARNING]  
> **Trạng thái triển khai:** *(Chưa triển khai — frontend prototype mock, chưa có API backend)*. Giao diện hiện tại là bản prototype dùng dữ liệu mẫu (mock) phía frontend, chưa kết nối với module backend quản lý khung chương trình.

**Mô tả**  
Cho phép Gia sư xây dựng và quản lý lộ trình học tập tổng thể cấu trúc 2 cấp (Cấp 1: Chủ đề/Chương $\rightarrow$ Cấp 2: Bài học/Chủ đề con) cho lớp học. Gia sư có thể khởi tạo nhanh bằng cách **áp dụng Khung chương trình mẫu sẵn có** trên hệ thống (IELTS, TOEIC, Giao tiếp, THPT...) hoặc **tự khởi tạo và chỉnh sửa thủ công** từng chủ đề/bài học.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư chọn thẻ "Khung chương trình" tại màn hình Quản lý Lớp học.

**Tiền điều kiện**  
Lớp học đang ở trạng thái Đang hoạt động (`ACTIVE`).

**Hậu điều kiện**  
Khung chương trình được lưu trữ trong CSDL; Học sinh và Phụ huynh có thể xem lộ trình bài học công khai trên Portal.

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học và chọn thẻ **"Khung chương trình"**.
2. Hệ thống hiển thị giao diện Khung chương trình. (Nếu lớp học chưa có dữ liệu, hiển thị 2 lựa chọn: **"Dùng khung mẫu"** và **"Tạo thủ công"**).
3. Gia sư nhấp nút **"Dùng khung mẫu"**.
4. Hệ thống hiển thị danh sách Khung chương trình mẫu phân theo chứng chỉ/trình độ.
5. Gia sư chọn một khung mẫu phù hợp và xem trước cấu trúc Chủ đề & Bài học.
6. Gia sư nhấp nút **"Áp dụng mẫu"**.
7. Hệ thống tự động nạp toàn bộ cấu trúc Chủ đề và Bài học mẫu vào khung chương trình của lớp học.
8. Cấu trúc khung chương trình hiển thị đầy đủ trên màn hình làm việc dưới dạng danh sách thu gọn/mở rộng (Accordion View).
9. Gia sư tinh chỉnh thủ công nội dung (sửa tiêu đề, thêm/xóa chủ đề, đổi thứ tự bài học nếu cần).
10. Gia sư nhấp nút **"Lưu & Xuất bản"**.
11. Hệ thống lưu dữ liệu vào cơ sở dữ liệu và hiển thị thông báo: *"Đã lưu khung chương trình học thành công."* Use Case kết thúc.

**Luồng thay thế**  
3b. Gia sư chọn Tự tạo thủ công từ đầu:  
3b1. Tại bước 2, gia sư nhấp nút **"Tạo thủ công"**.  
3b2. Gia sư nhấp **"+ Thêm chủ đề"** (Cấp 1), nhập tên Chủ đề và mô tả.  
3b3. Tại từng Chủ đề, gia sư nhấp **"+ Thêm bài học"** (Cấp 2), nhập tên và mục tiêu bài học.  
Use Case tiếp tục bước 8.

9a. Thay đổi thứ tự các Chủ đề / Bài học (Reorder):  
9a1. Gia sư kéo-thả hoặc nhấp biểu tượng di chuyển lên/xuống bên cạnh từng chủ đề/bài học.  
9a2. Hệ thống cập nhật lại thứ tự hiển thị.  
Use Case tiếp tục bước 10.

9b. Xóa một Chủ đề hoặc Bài học:  
9b1. Gia sư nhấp biểu tượng Thùng rác tại Chủ đề hoặc Bài học cần xóa.  
9b2. Hệ thống hiển thị hộp thoại xác nhận.  
9b3. Gia sư xác nhận. Hệ thống xóa mục tương ứng.  
Use Case tiếp tục bước 10.

**Luồng ngoại lệ**  
6a. Lỗi tải dữ liệu Khung mẫu:  
6a1. Hệ thống hiển thị thông báo: "Không thể tải khung mẫu. Vui lòng kiểm tra lại kết nối mạng".  
6a2. Gia sư nhấp "Thử lại".  
Use Case quay lại bước 4.

---

### UC - T05. Quản lý Nhật ký buổi học

**Mã Use Case**  
UC-T05

**Tên Use Case**  
Quản lý Nhật ký buổi học

> [!NOTE]  
> **Cập nhật mô hình (V16):** Không còn thực thể "Buổi học N / ClassSession" với trạng thái `COMPLETED`. Thay vào đó: (1) **Bài giảng (lessons)** — tài liệu giảng dạy nhúng vào lớp, không gắn ngày/giờ, trạng thái `PUBLISHED` / `HIDDEN`; (2) **Nhật ký dạy học (teaching_logs)** — ghi trên lưới thời khóa biểu tuần của lớp theo ô ca (class, log_date, start_time).

**Mô tả**  
Cho phép Gia sư quản lý nội dung giảng dạy của lớp học qua 2 phần làm việc tách biệt:  
- **Bài giảng (lessons):** danh sách chủ đề bài giảng nhúng vào lớp học (không gắn lịch ngày/giờ), mỗi bài giảng kèm tài liệu học tập đính kèm (.pdf, .docx, ảnh, âm thanh) và bộ Quiz ôn tập (UC-T06). Bài giảng có thể công khai (`PUBLISHED`) hoặc ẩn (`HIDDEN`) đối với Học sinh.  
- **Nhật ký dạy học (teaching logs):** Gia sư ghi nhận "Kiến thức đã hoàn thành" và "Dặn dò" cho từng ô ca dạy trên Lưới thời khóa biểu tuần của lớp (cùng 1 ô ca chỉ có 1 nhật ký — upsert theo class, log_date, start_time). Các ô ca đã có nhật ký được hiển thị rõ trên lưới để Gia sư, Học sinh và Phụ huynh cùng theo dõi.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư điều hướng từ Lưới thời khóa biểu tuần của lớp (UC-T07) HOẶC nhấp chọn tab "Bài giảng" / tab "Nhật ký buổi học" trong trang Chi tiết Lớp học.

**Tiền điều kiện**  
- Lớp học đang ở trạng thái Đang hoạt động (`ACTIVE`) hoặc Đang dạy thử (`TRIAL`).
- Với Nhật ký dạy học: lớp đã được chốt lịch cố định (có khung ca dạy tuần để hiển thị trên lưới).

**Hậu điều kiện**  
- Các Bài giảng (tiêu đề, tài liệu đính kèm, trạng thái `PUBLISHED`/`HIDDEN`) và bộ Quiz (UC-T06) được lưu trữ gắn với lớp học.
- Bản ghi Nhật ký dạy học được lưu/upsert trên lưới thời khóa biểu; ô ca có nhật ký hiển thị trạng thái "Đã có nhật ký" cho cả Gia sư, Học sinh và Phụ huynh (không có trạng thái "Đã hoàn thành" cho ca dạy — ca có nhật ký là ca đã được ghi nhận).

**Luồng chính**  
*(Phần A — Bài giảng / Tài liệu)*  
1. Gia sư truy cập trang Chi tiết Lớp học và chọn tab **"Bài giảng"**.
2. Hệ thống hiển thị danh sách Bài giảng của lớp (sắp theo thời gian tạo); nếu chưa có dữ liệu, hiển thị nút **"+ Tạo bài giảng"**.
3. Gia sư nhấp **"+ Tạo bài giảng"** (endpoint `POST /classes/{id}/lessons`), nhập tiêu đề bài giảng.
4. Hệ thống lưu Bài giảng mới với trạng thái công khai (`PUBLISHED`) mặc định.
5. Gia sư nhấp nút **"Đính kèm tài liệu"** trên Bài giảng (endpoint `POST /lessons/{id}/materials`):
   - Gia sư chọn tệp từ máy tính (PDF, Word, ảnh, âm thanh — mỗi tệp tối đa 20MB).
   - Hệ thống kiểm tra quota lưu trữ gói của gia sư (V30) trước khi tải lên; nếu vượt quota sẽ chặn và báo lỗi.
   - Hệ thống tạo liên kết tải an toàn (ký sẵn) cho tài liệu.
6. Gia sư có thể **"Ẩn bài giảng"** (đổi trạng thái sang `HIDDEN` — Học sinh & Phụ huynh không thấy) hoặc **"Hiện lại"** (`PUBLISHED`) tại `PUT /lessons/{id}`; xóa Bài giảng sẽ xóa kèm toàn bộ tài liệu và Quiz con (CASCADE).
7. Tại Bài giảng, gia sư có thể nhấp **"Soạn & Giao bài Quiz"** (UC-T06) — Quiz được gắn trực tiếp vào Bài giảng (không gắn vào ca dạy).

*(Phần B — Nhật ký dạy học trên lưới ca dạy)*  
8. Gia sư mở Lưới thời khóa biểu tuần của lớp (UC-T07) và chọn một ô ca dạy đã kết thúc.
9. Hệ thống hiển thị nút **"Ghi nhật ký"** (hoặc **"Xem / Cập nhật nhật ký"** nếu ô đã có nhật ký).
10. Gia sư nhấp **"Ghi nhật ký"**; hệ thống mở form nhật ký với 2 mục:
   - *Kiến thức đã hoàn thành trong buổi:* cấu trúc ngữ pháp, từ vựng hoặc kỹ năng đã giảng.
   - *Dặn dò:* bài tập cần làm, yêu cầu ôn tập.
11. Gia sư nhấp **"Lưu nhật ký"** (endpoint `POST /classes/{id}/logs` — upsert theo class, log_date, start_time: ghi đè nếu cùng ô ca đã có nhật ký).
12. Hệ thống lưu bản ghi, hiển thị trạng thái "Đã có nhật ký" trên ô ca tương ứng trong Lưới thời khóa biểu và đồng bộ dữ liệu cho Phụ huynh & Học sinh.
13. Hệ thống hiển thị thông báo: *"Đã lưu nhật ký dạy học. Phụ huynh và Học sinh đã có thể xem báo cáo này."* Use Case kết thúc.

**Luồng thay thế**  
11a. Gia sư chỉnh sửa lại một nhật ký dạy học đã lưu:  
11a1. Tại ô ca đã có nhật ký trên lưới, gia sư nhấp **"Xem / Cập nhật nhật ký"**.  
11a2. Gia sư chỉnh sửa nội dung (Kiến thức / Dặn dò) và nhấp **"Lưu lại"** — hệ thống ghi đè (upsert) chính bản ghi của ô ca đó.  
Use Case kết thúc.

11b. Gia sư xóa một nhật ký dạy học:  
11b1. Gia sư nhấp biểu tượng Xóa trên bản ghi nhật ký và xác nhận.  
11b2. Hệ thống xóa bản ghi (endpoint `DELETE /classes/{id}/logs/{logId}`); ô ca trên lưới quay về trạng thái "Chưa có nhật ký".  
Use Case kết thúc.

**Lưu ý (đã loại khỏi mô hình hiện tại — R9, V16):** Không còn tính năng "Thêm buổi học phát sinh / ad-hoc" — việc ghi ca dạy ngoài lịch cố định được xử lý bằng lớp ghi Ngoại lệ lịch dạy (exception overlay, UC-T07) thay vì khởi tạo bản ghi buổi học mới.

**Luồng ngoại lệ**  
5a. Tải tệp tài liệu đính kèm thất bại (sự cố mạng, vượt 20MB/tệp, hoặc vượt quota gói lưu trữ V30):  
5a1. Hệ thống hiển thị thông báo lỗi tương ứng (vượt dung lượng tệp / vượt quota gói / sự cố mạng).  
5a2. Gia sư bấm nút "Thử lại" (hoặc giảm dung lượng tệp / nâng cấp gói lưu trữ trước khi thử lại).  
Use Case tiếp tục bước 5.

---

### UC - T06. Soạn & Giao Quiz ôn tập qua Trợ lý AI

**Mã Use Case**  
UC-T06

**Tên Use Case**  
Soạn & Giao Quiz ôn tập qua Trợ lý AI

**Mô tả**  
Cho phép Gia sư tạo và giao bài trắc nghiệm ôn tập cho học sinh, gắn trực tiếp vào một **Bài giảng (Lesson)** của lớp (không gắn vào ca dạy, theo mô hình V16 — endpoint `POST /lessons/{lessonId}/quizzes` và `POST /lessons/{lessonId}/quizzes/ai-chat`). Thông qua tương tác hội thoại với Trợ lý AI kết hợp dữ liệu hồ sơ kỹ năng của học sinh, gia sư có thể nhanh chóng sinh bộ câu hỏi bám sát chuẩn CEFR, đính kèm tài liệu tham khảo, tinh chỉnh trực tiếp nội dung và thiết lập hạn nộp bài.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Rất cao (Tính năng cốt lõi)

**Sự kiện kích hoạt**  
Gia sư nhấp nút **"Soạn Quiz"** tại màn hình chi tiết một Bài giảng (Lesson) của lớp học.

**Tiền điều kiện**  
- Gia sư đã đăng nhập và đang ở màn hình chi tiết một Bài giảng của lớp học đang hoạt động (`ACTIVE`).

**Hậu điều kiện**  
- Bộ câu hỏi trắc nghiệm, đáp án chuẩn, độ khó chuẩn CEFR (A1 - C2), thẻ kỹ năng và giải thích được lưu trữ ở trạng thái Bản nháp (`DRAFT`) hoặc Đã giao (`ASSIGNED`) kèm hạn nộp (`deadline`).

**Luồng chính**  
1. Tại màn hình chi tiết Bài giảng, gia sư nhấp nút **"Soạn Quiz"**.
2. Hệ thống hiển thị không gian làm việc chia đôi:
   - *Khu vực bên trái:* Khung xem trước danh sách câu hỏi trắc nghiệm (ban đầu trống).
   - *Khu vực bên phải:* Khung Chatbot AI tích hợp ô nhập lệnh và nút đính kèm tài liệu.
   - *Thanh phụ trợ:* Nút mở/ngăn kéo xem **"Bảng Thống kê Hồ sơ Học sinh"** hiển thị toàn bộ kỹ năng học sinh đã học, mặc định sắp xếp theo tỷ lệ sai từ cao xuống thấp và thời gian chưa ôn tập.
3. Gia sư tham khảo bảng kỹ năng, nhập yêu cầu vào khung Chat (ví dụ: *"Tạo 5 câu trắc nghiệm tập trung vào các thì quá khứ mà học sinh hay sai, độ khó cấp độ B1"*), có thể đính kèm tài liệu bài học (PDF/ảnh) và gửi cho AI.
4. AI tiếp nhận yêu cầu cùng hồ sơ năng lực học sinh, sinh bộ câu hỏi và tự động hiển thị trực tiếp lên khu vực bên trái.
5. Gia sư kiểm tra các câu hỏi ở khu vực bên trái (nội dung, phương án A/B/C/D, đáp án đúng, thẻ kỹ năng, độ khó CEFR A1 - C2, giải thích).
6. Gia sư có thể tinh chỉnh bài quiz:
   - *Cách 1:* Nhấp trực tiếp vào câu hỏi/đáp án/độ khó ở bên trái để sửa văn bản.
   - *Cách 2:* Chat tiếp với AI ở bên phải để yêu cầu sửa đổi (ví dụ: *"Nâng câu 3 lên B2"*, *"Đổi câu 1 sang câu hỏi tình huống"*).
7. Gia sư chọn **"Giao bài"** (hoặc chọn **"Lưu nháp"** nếu chưa muốn giao ngay).
8. Hệ thống hiển thị hộp thoại xác nhận và yêu cầu chọn Hạn nộp bài (`deadline`).
9. Gia sư thiết lập hạn nộp và xác nhận.
10. Hệ thống lưu bộ câu hỏi vào cơ sở dữ liệu, kích hoạt trạng thái Đã giao (`ASSIGNED`) kèm hạn nộp cho học sinh (endpoint `POST /quizzes/{id}/assign`) và thông báo thành công. Use Case kết thúc.

**Luồng thay thế**  
- **2a. Sắp xếp lại Bảng Thống kê Hồ sơ Học sinh:** Gia sư đổi tiêu chí sắp xếp (theo thời gian chưa ôn tập, theo bảng chữ cái A-Z, theo nhóm chủ điểm). Hệ thống cập nhật lại thứ tự hiển thị. Use Case tiếp tục bước 3.
- **5a. Xóa câu hỏi:** Gia sư bấm biểu tượng Thùng rác để loại bỏ câu hỏi không ưng ý. Use Case tiếp tục bước 6.
- **7a. Lưu nháp:** Gia sư nhấp "Lưu nháp", hệ thống lưu bộ quiz với trạng thái `DRAFT` tại Bài giảng để chỉnh sửa hoặc giao sau (chỉ chỉnh sửa được khi quiz đang ở trạng thái `DRAFT`). Use Case kết thúc.

**Luồng ngoại lệ**  
- **4a. Dịch vụ AI gặp lỗi kết nối hoặc phản hồi quá 15 giây:** Hệ thống báo lỗi và gợi ý gia sư bấm "Thử lại".

---

### UC - T06b. Import Quiz từ công cụ ngoài

**Mã Use Case**  
UC-T06b

**Tên Use Case**  
Import Quiz từ công cụ ngoài

> [!WARNING]  
> **Trạng thái triển khai:** *(Chưa triển khai)*. Tính năng này (FR-14) chưa có endpoint backend (chưa có import JSON); hiện mới dừng ở yêu cầu thiết kế.

**Mô tả**  
Cho phép gia sư sử dụng các công cụ AI bên ngoài (như ChatGPT, Claude, Gemini) để tạo bộ câu hỏi trắc nghiệm nhằm tiết kiệm chi phí token của hệ thống. Tính năng hỗ trợ trích xuất **câu lệnh chuẩn hóa (Prompt template)** đã tích hợp sẵn hồ sơ năng lực học sinh và thang đo CEFR (A1 - C2), sau đó cho phép gia sư dán kết quả trả về để hệ thống tự động kiểm định cấu trúc và nạp thành bài quiz gắn vào một Bài giảng (Lesson) của lớp học.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Trung bình - Cao

**Sự kiện kích hoạt**  
Gia sư nhấp nút **"Import Quiz"** tại màn hình Soạn Quiz của một Bài giảng (Lesson).

**Tiền điều kiện**  
- Gia sư đang ở màn hình Soạn Quiz của một Bài giảng thuộc lớp học đang hoạt động (`ACTIVE`).

**Hậu điều kiện**  
- Dữ liệu trắc nghiệm sau khi kiểm định hợp lệ được nạp thành bộ Quiz hoàn chỉnh trên hệ thống ở trạng thái Bản nháp (`DRAFT`) hoặc Đã giao (`ASSIGNED`).

**Luồng chính**  
1. Tại màn hình Soạn Quiz của một Bài giảng, gia sư nhấp nút **"Import Quiz"**.
2. Hệ thống hiển thị hộp thoại Import kèm nút **"Sao chép Prompt"** (đã tích hợp danh sách kỹ năng cần củng cố của học sinh và quy chuẩn định dạng JSON theo thang CEFR A1 - C2).
3. Gia sư nhấp **"Sao chép Prompt"**; hệ thống lưu câu lệnh mẫu vào bộ nhớ tạm.
4. Gia sư mở công cụ AI bên ngoài (ChatGPT / Claude / Gemini...), dán prompt để sinh bộ câu hỏi.
5. Gia sư sao chép kết quả từ AI bên ngoài, quay lại hệ thống và dán vào khung **"Dán dữ liệu Quiz"**.
6. Gia sư nhấp **"Kiểm tra & Nạp dữ liệu"**.
7. Hệ thống kiểm định tính hợp lệ của cấu trúc (câu hỏi, phương án A/B/C/D, đáp án đúng, độ khó CEFR, thẻ kỹ năng).
8. Dữ liệu hợp lệ được hiển thị trực tiếp lên không gian làm việc của Bài giảng để gia sư xem lại.
9. Gia sư chọn **"Giao bài"** hoặc **"Lưu nháp"**. Use Case kết thúc.

**Luồng ngoại lệ**  
- **7a. Dữ liệu dán vào sai cấu trúc:** Hệ thống báo lỗi cụ thể (ví dụ: *"Định dạng JSON không hợp lệ hoặc thiếu đáp án đúng tại câu 2"*) và cho phép gia sư chỉnh sửa lại văn bản trước khi nạp lại.

---


### UC - T07. Xem & Tra cứu Lịch dạy

**Mã Use Case**  
UC-T07

**Tên Use Case**  
Xem & Tra cứu Lịch dạy

**Mô tả**  
Cho phép Gia sư xem toàn bộ ca dạy của các lớp đang phụ trách dưới dạng Thời khóa biểu trực quan (Lịch tuần — hiển thị dạng lưới 7 ngày trong tuần, không có chế độ xem lịch tháng). Ca dạy hiển thị trên lưới là dữ liệu **tính toán theo thời gian thực** (lattice): kết hợp các ca cố định từ khung lịch tuần của lớp, các Ngoại lệ lịch (báo nghỉ / đổi ngày) và các ca đã có Nhật ký dạy học; hệ thống không lưu sẵn từng bản ghi ca dạy. Gia sư có thể lọc lịch theo từng lớp học, ghi/xem Nhật ký dạy học cho từng ô ca, đồng thời ghi các Ngoại lệ lịch (báo nghỉ / đổi lịch 1 buổi cụ thể).

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Trung bình - Cao

**Sự kiện kích hoạt**  
Gia sư chọn mục "Lịch dạy" hoặc "Thời khóa biểu" trên thanh điều hướng Cổng Gia sư.

**Tiền điều kiện**  
Gia sư đã đăng nhập thành công vào hệ thống.

**Hậu điều kiện**  
- Giao diện Thời khóa biểu hiển thị chính xác toàn bộ ca dạy của gia sư theo thời gian thực (lattice tính từ khung lịch tuần + ngoại lệ + nhật ký).
- Nhật ký dạy học chỉ được ghi vào cơ sở dữ liệu khi gia sư chủ động điền nội dung nhật ký và lưu (upsert cho ô ca) — không có bước "khởi tạo trước" bản ghi buổi học.

**Luồng chính**  
1. Gia sư truy cập Cổng Gia sư và chọn mục **"Lịch dạy"** (hoặc **"Thời khóa biểu"**).
2. Hệ thống tải dữ liệu các ca dạy theo tuần (mốc tuần `weekStart`) và hiển thị giao diện Thời khóa biểu cá nhân dưới dạng Lịch tuần — lưới 7 ngày (Thứ 2 → Chủ nhật), chế độ duy nhất (endpoint `GET /classes/{id}/schedule?weekStart=...`, trả về ClassScheduleResponse gồm ô ca cố định + ngoại lệ + nhật ký + ca thử).
3. Mỗi ca dạy trên thời khóa biểu hiển thị: Tên lớp/Học sinh, Khung giờ dạy và Hình thức học (*Online / Tại nhà*).
4. Gia sư nhấp vào một ca dạy bất kỳ trên thời khóa biểu.
5. Hệ thống hiển thị hộp thoại Chi tiết ca dạy bao gồm: Tên học sinh, lớp học, ngày và khung giờ học, hình thức học (Online/Tại nhà), địa chỉ nhà học sinh (nếu học Tại nhà) hoặc liên kết phòng học trực tuyến Zoom/Meet (nếu học Online). Hệ thống kiểm tra tình trạng nhật ký của ca dạy này:
   - **Trường hợp A (Đã có nhật ký dạy học):** Hiển thị nút **"Xem / Cập nhật nhật ký"**.
   - **Trường hợp B (Chưa có nhật ký dạy học):** Hiển thị trạng thái *"Chưa có nhật ký"* kèm nút **"+ Ghi nhật ký dạy học"**.
6. Gia sư thực hiện hành động:
   - *Nếu là Trường hợp A:* Gia sư nhấp **"Xem / Cập nhật nhật ký"** $\rightarrow$ Hệ thống hiển thị nội dung nhật ký hiện có để xem/sửa (upsert) hoặc điều hướng tới luồng Nhật ký buổi học (UC-T05). Use Case kết thúc.
   - *Nếu là Trường hợp B:* Gia sư nhấp nút **"+ Ghi nhật ký dạy học"**.
7. Hệ thống hiển thị form nhập nhật ký cho ca học ngày [DD/MM/YYYY] (Kiến thức đã hoàn thành / Dặn dò).
8. Gia sư điền nội dung và nhấp **"Lưu nhật ký"**.
9. Hệ thống kiểm tra dữ liệu, lưu/upsert bản ghi nhật ký dạy học cho ô ca (class, log_date, start_time) trong cơ sở dữ liệu — đây là thời điểm duy nhất bản ghi được tạo.
10. Hệ thống điều hướng gia sư về lưới Thời khóa biểu, ô ca vừa lưu hiển thị trạng thái "Đã có nhật ký" và cập nhật dữ liệu cho Phụ huynh & Học sinh. Use Case kết thúc.

**Luồng thay thế**  
2a. Gia sư chuyển thời gian xem (tuần trước/tuần sau):  
2a1. Gia sư bấm nút mũi tên chuyển tuần trước/tuần sau (không có chế độ xem lịch tháng — hệ thống chỉ hiển thị theo tuần).  
2a2. Hệ thống tải và hiển thị dữ liệu ca dạy theo khung tuần đã chọn.  
Use Case tiếp tục bước 3.

2b. Gia sư lọc thời khóa biểu theo 01 Lớp học cụ thể:  
2b1. Gia sư chọn một lớp học từ danh sách Dropdown bộ lọc lớp.  
2b2. Hệ thống chỉ hiển thị các ca dạy của lớp đã chọn trên Thời khóa biểu.  
Use Case tiếp tục bước 3.

5a. Gia sư ghi Ngoại lệ lịch cho 1 buổi cụ thể (Báo nghỉ / Đổi lịch):  
5a1. Tại hộp thoại Chi tiết ca dạy, gia sư chọn **"Báo nghỉ"** (loại `CANCELLED`) hoặc **"Đổi lịch"** (loại `RESCHEDULED`, kèm ngày/giờ mới) — endpoint `POST /classes/{id}/exceptions` (chỉ gia sư của lớp được thao tác; ô ca đã có nhật ký bị chặn ghi ngoại lệ).  
5a2. Hệ thống lưu ngoại lệ cho đúng ô ca (class, schedule, exception_date) và cập nhật lưới hiển thị (ô ca gốc được đánh dấu đã hủy/dời đi, ca dời hiển thị tại ngày/giờ mới).  
5a3. Khi cần hủy thao tác, gia sư dùng endpoint `DELETE /classes/{id}/exceptions/{scheduleId}/{exceptionDate}` để gỡ ngoại lệ của ô ca đó.  
Use Case tiếp tục bước 3.

8a. Gia sư hủy thao tác ghi nhật ký:  
8a1. Tại form nhật ký (bước 7), gia sư nhấp "Hủy" hoặc đóng form.  
8a2. Hệ thống giữ nguyên giao diện, không phát sinh bất kỳ bản ghi nào trong cơ sở dữ liệu.  
Use Case quay lại bước 5.

**Luồng ngoại lệ**  
2a1. Không có ca dạy nào trong khoảng thời gian được chọn:  
2a1.1. Hệ thống hiển thị thông điệp: "Bạn không có ca dạy nào trong tuần này".  
Use Case kết thúc.

5b. Gia sư chọn Đổi lịch nhưng khung giờ mới trùng ca dạy khác:  
5b1. Hệ thống phát hiện xung đột trùng ca và từ chối lưu ngoại lệ.  
5b2. Gia sư chọn lại ngày/giờ không bị xung đột.  
Use Case quay lại bước 5a.

---

### UC - T08. Thiết lập Lịch dạy thử

**Mã Use Case**  
UC-T08

**Tên Use Case**  
Thiết lập Lịch dạy thử

**Mô tả**  
Cho phép Gia sư thiết lập thông tin cho 01 buổi dạy thử duy nhất (gồm ngày diễn ra cụ thể, khung giờ bắt đầu - kết thúc, hình thức học Online/Tại nhà) cho lớp học sau khi nhận lớp thành công và liên hệ trao đổi sơ bộ với Phụ huynh. Lớp học lúc này ở trạng thái Đang dạy thử (`TRIAL`). Việc thiết lập lịch dạy thử giúp hệ thống kiểm tra xung đột trùng ca dạy cá nhân của Gia sư tại mốc thời gian đó và tự động hiển thị 01 ca học thử trên Lưới Thời khóa biểu tuần của lớp (UC-T07) cho cả Gia sư, Học sinh và Phụ huynh cùng theo dõi.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Thiết lập lịch dạy thử" tại trang Chi tiết Lớp học đang ở trạng thái Đang dạy thử (`TRIAL`).

**Tiền điều kiện**  
- Gia sư đã đăng nhập thành công vào Cổng Gia sư.
- Lớp học đã được ghép cho Gia sư và đang ở trạng thái Đang dạy thử (`TRIAL`).

**Hậu điều kiện**  
- Thông tin lịch dạy thử (ngày, giờ, hình thức) được lưu vào thuộc tính của lớp học (các cột `trial_*` trên bảng `classes`, trạng thái lớp vẫn giữ nguyên là `TRIAL`).
- Hệ thống tự động hiển thị 01 ca học thử trên Lưới Thời khóa biểu tuần của chính lớp học đó (qua `ClassScheduleResponse` — ca thử là một phần của lưới tuần, không phải bảng thời gian biểu cá nhân riêng) kèm nhãn nhận diện `[Học thử]`.

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học và chọn lớp học đang ở trạng thái **Đang dạy thử (`TRIAL`)**.
2. Gia sư nhấp nút **"Thiết lập lịch dạy thử"**.
3. Hệ thống hiển thị biểu mẫu Thiết lập Lịch dạy thử bao gồm:
   - **Ngày dạy thử:** Chọn ngày diễn ra buổi học thử (DatePicker: DD/MM/YYYY).
   - **Khung giờ dạy:** Nhập giờ bắt đầu và giờ kết thúc (VD: 19:30 - 21:00).
   - **Hình thức học:** Chọn *Online* (nhập/gắn liên kết phòng học Zoom/Google Meet) hoặc *Tại nhà* (xác nhận địa chỉ nhà học sinh).
4. Gia sư nhấp nút **"Lưu lịch dạy thử"**.
5. Hệ thống kiểm tra xung đột/trùng lịch ca dạy cá nhân của Gia sư với các ca dạy khác trong ngày và khung giờ đã chọn.
6. Hệ thống lưu thông tin lịch dạy thử vào thuộc tính của lớp học (trạng thái lớp vẫn duy trì là `TRIAL`).
7. Hệ thống tự động hiển thị 01 ca học thử trên Lưới Thời khóa biểu tuần của lớp (qua `ClassScheduleResponse`, UC-T07) với nhãn `[Học thử]` và hiển thị thông báo: *"Đã thiết lập lịch dạy thử thành công cho ngày [DD/MM/YYYY]."* Use Case kết thúc.

**Luồng thay thế**  
4a. Gia sư điều chỉnh/dời lịch dạy thử (khi buổi dạy thử chưa diễn ra):  
4a1. Tại trang Chi tiết Lớp học (`TRIAL`), Gia sư nhấp chọn "Chỉnh sửa lịch dạy thử".  
4a2. Gia sư điều chỉnh lại Ngày học, Khung giờ hoặc Hình thức học và nhấp "Lưu thay đổi".  
4a3. Hệ thống kiểm tra trùng lịch (bước 5) và cập nhật lại thông tin buổi học thử trên Thời khóa biểu (UC-T07).  
Use Case kết thúc.

**Luồng ngoại lệ**  
5a. Trùng ca dạy cá nhân của Gia sư:  
5a1. Hệ thống phát hiện ngày và khung giờ vừa chọn bị trùng với một ca dạy khác của Gia sư.  
5a2. Hệ thống cảnh báo: *"Khung giờ bạn chọn bị trùng với ca dạy khác vào ngày [DD/MM/YYYY]. Vui lòng chọn khung giờ khác."*  
5a3. Gia sư điều chỉnh lại ngày hoặc giờ dạy không bị xung đột.  
Use Case quay lại bước 4.

5b. Buổi dạy thử không thành công:  
5b1. Gia sư mở khu vực **Báo cáo kết quả dạy thử**, chọn "Không thành công", nhập lý do tối thiểu 5 ký tự và gửi báo cáo theo UC-T09b. Hệ thống ghi báo cáo, chuyển lớp sang `TRIAL_FAIL`, tạo một task `PENDING` cho Lễ tân/Admin và gửi thông báo cho nhân sự vận hành. Gia sư không tự chuyển lớp sang `REMATCH` hoặc `CANCELLED`.  
Use Case kết thúc.

---

### UC - T09b. Báo cáo kết quả dạy thử

**Mã Use Case**  
UC-T09b

**Tên Use Case**  
Báo cáo kết quả dạy thử

**Tác nhân**  
Gia sư

**Mô tả**  
Cho phép Gia sư gửi kết quả chính thức sau khi ca dạy thử đã diễn ra. Mỗi lớp chỉ có một báo cáo chính thức.

**Tiền điều kiện**
- Gia sư đã đăng nhập và là người phụ trách lớp.
- Lớp đang ở trạng thái `TRIAL` và ca dạy thử đã được thiết lập, đã diễn ra.
- Lớp chưa có báo cáo kết quả chính thức.

**Hậu điều kiện**
- Chọn **Thành công (`SUCCESS`)**: hệ thống kích hoạt lớp sang `ACTIVE` và tạo/kích hoạt khoản phí nhận lớp theo luồng hiện có.
- Chọn **Không thành công (`FAILED`)**: hệ thống lưu lý do, chuyển lớp sang `TRIAL_FAIL`, tạo một task `PENDING` và thông báo cho Lễ tân/Admin.

**Luồng chính**
1. Gia sư mở chi tiết lớp `TRIAL` sau khi ca dạy thử kết thúc.
2. Gia sư chọn **Báo cáo kết quả dạy thử**.
3. Hệ thống hiển thị hai lựa chọn: **Thành công** và **Không thành công**.
4. Gia sư chọn kết quả; nếu chọn `FAILED`, nhập lý do tối thiểu 5 ký tự.
5. Gia sư bấm **Gửi báo cáo**.
6. Hệ thống ghi `trial_reports` và khóa báo cáo của lớp để không nhận thêm báo cáo chính thức.
7. Với `SUCCESS`, hệ thống chuyển lớp từ `TRIAL` sang `ACTIVE`. Với `FAILED`, hệ thống chuyển lớp sang `TRIAL_FAIL`, tạo task vận hành ở trạng thái `PENDING` và gửi thông báo cho Lễ tân/Admin.

**Luồng ngoại lệ**
- 3.1. Không chọn kết quả: hệ thống yêu cầu chọn kết quả.
- 4.1. `FAILED` thiếu lý do hoặc lý do dưới 5 ký tự: hệ thống không gửi báo cáo.
- 5.1. Lớp đã có báo cáo chính thức: hệ thống từ chối báo cáo bổ sung.
- 5.2. Lớp không còn ở `TRIAL` hoặc chưa có ca thử hợp lệ: hệ thống từ chối thao tác.

---

### UC - T09. Thiết lập Lịch học cố định

**Mã Use Case**  
UC-T09

**Tên Use Case**  
Thiết lập Lịch học cố định

**Mô tả**  
Cho phép Gia sư thiết lập khung thời khóa biểu lặp hàng tuần (gồm các Thứ trong tuần, khung giờ dạy từng ca, hình thức học Online/Tại nhà và ngày bắt đầu áp dụng) cho lớp học sau khi buổi dạy thử kết thúc thành công và hai bên thống nhất học chính thức lâu dài. Lưu ý: việc chuyển lớp từ Đang dạy thử (`TRIAL`) sang Đang hoạt động (`ACTIVE`) được kích hoạt bởi **báo cáo dạy thử `SUCCESS` của Gia sư** (UC-T09b, endpoint `POST /api/v1/classes/{id}/trial-report` — kích hoạt qua `tutorActivateTrial`); với lớp chưa có báo cáo, Lễ tân/Admin vẫn xác nhận được qua endpoint `POST /api/v1/class-requests/{id}/complete-match`. Sau khi lớp đã ở trạng thái `ACTIVE`, Gia sư mới được phép chốt lịch cố định (endpoint `POST /classes/{id}/finalize-schedule` yêu cầu lớp đang `ACTIVE` và chưa có khung lịch tồn tại). Việc thiết lập lịch cố định giúp hệ thống kiểm tra xung đột trùng lịch tuần của gia sư và tự động sinh chuỗi thời khóa biểu lặp tuần trên giao diện Lịch dạy (UC-T07) cho Gia sư, Học sinh và Phụ huynh.

**Tác nhân**  
Gia sư (báo cáo kết quả và chốt lịch cố định), Lễ tân / Admin (xác nhận ghép thành công thay thế, chuyển `TRIAL` → `ACTIVE`)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Chốt lịch học cố định" tại trang Chi tiết Lớp học — nút chỉ khả dụng sau khi lớp chuyển sang trạng thái Đang hoạt động (`ACTIVE`) (qua báo cáo `SUCCESS` của Gia sư hoặc xác nhận của Lễ tân/Admin).

**Tiền điều kiện**  
- Gia sư đã đăng nhập thành công vào Cổng Gia sư.
- Buổi học thử đã kết thúc thành công; Gia sư đã báo cáo kết quả dạy thử `SUCCESS` (UC-T09b) hoặc Lễ tân/Admin xác nhận ghép lớp (`complete-match`) và lớp học đang ở trạng thái Đang hoạt động (`ACTIVE`).

**Hậu điều kiện**  
- Khung thời gian dạy cố định hàng tuần được lưu vào lớp học.
- Chuỗi ca dạy lặp tuần được sinh tự động và đồng bộ trên giao diện Lịch dạy (UC-T07).

**Luồng chính**  
1. Sau khi buổi dạy thử thành công, Gia sư gửi báo cáo `SUCCESS` theo UC-T09b; hệ thống chuyển lớp học từ Đang dạy thử (`TRIAL`) sang Đang hoạt động (`ACTIVE`), kích hoạt khoản phí nhận lớp và gửi thông báo tới Gia sư, Phụ huynh & Học sinh. Với lớp chưa có báo cáo, Lễ tân/Admin có thể xác nhận tương đương qua endpoint `POST /api/v1/class-requests/{id}/complete-match`.
2. Gia sư truy cập trang Quản lý Lớp học và chọn lớp học đang ở trạng thái `ACTIVE`.
3. Gia sư nhấp nút **"Chốt lịch học cố định"**.
4. Hệ thống hiển thị biểu mẫu Thiết lập Khung lịch dạy cố định hàng tuần:
   - **Các Thứ trong tuần:** Chọn các ngày học trong tuần (VD: Thứ 2, Thứ 5).
   - **Khung giờ dạy:** Nhập khung giờ bắt đầu - kết thúc cho từng ca dạy (VD: 19:30 - 21:00).
   - **Hình thức học:** *Online* (nhập/gắn liên kết phòng học Zoom/Google Meet) hoặc *Tại nhà* (xác nhận địa chỉ dạy học).
   - **Ngày bắt đầu áp dụng:** Chọn ngày bắt đầu khóa học chính thức.
5. Gia sư nhấp nút **"Lưu & Kích hoạt lịch cố định"** (endpoint `POST /classes/{id}/finalize-schedule` — hệ thống yêu cầu lớp đang `ACTIVE` và chưa có khung lịch tồn tại).
6. Hệ thống kiểm tra xung đột trùng lịch tuần của Gia sư với các lớp học khác đang hoạt động (`ACTIVE`).
7. Hệ thống lưu cấu hình lịch cố định vào lớp học và gửi thông báo lịch học chính thức tới Phụ huynh & Học sinh.
8. Hệ thống tự động sinh chuỗi ca dạy lặp tuần trên Thời khóa biểu của Gia sư (UC-T07).
9. Hệ thống hiển thị thông báo thành công: *"Đã chốt lịch học cố định thành công."* Use Case kết thúc.

**Luồng thay thế**  
4a. Gia sư cập nhật/điều chỉnh lại khung lịch cố định của lớp đang hoạt động (`ACTIVE`):  
4a1. Gia sư mở Cài đặt lớp học đang `ACTIVE`, chọn "Chỉnh sửa lịch cố định".  
4a2. Gia sư điều chỉnh lại Thứ, Khung giờ hoặc Hình thức học và bấm "Cập nhật".  
4a3. Hệ thống kiểm tra trùng lịch (bước 6) và lưu cấu hình lịch mới (endpoint `PUT /classes/{id}/schedules` — chỉ lớp `ACTIVE`, ghi đè khung lịch hiện có).  
4a4. Hệ thống cập nhật thời khóa biểu và gửi thông báo thay đổi cho Phụ huynh & Học sinh.  
Use Case kết thúc.

4b. Buổi dạy thử kết quả không thành công (thay vì chốt lịch cố định):  
4b1. Gia sư gửi báo cáo kết quả dạy thử "Không thành công" kèm lý do (UC-T09b). Hệ thống chuyển lớp sang `TRIAL_FAIL`, tạo task vận hành `PENDING` và thông báo Lễ tân/Admin; lớp **không** tự chuyển `REMATCH`/`CANCELLED` ở bước này.  
4b2. Lễ tân/Admin tiếp nhận task, liên hệ phụ huynh xin ý kiến và xử lý trong hàng đợi dạy thử thất bại. **Nếu phụ huynh chọn "Tìm gia sư khác":** staff bấm **Ghép lại** — yêu cầu lớp (nếu có `class_request_id`) mở lại (idempotent, không đổi trạng thái task); gia sư cũ bị loại khỏi đơn khi đơn chính thức chuyển `REMATCH`. Gia sư mới ứng tuyển và khi ghép xong, lớp dạy thử mới chuyển "Đang dạy thử" và lặp lại luồng dạy thử.  
4b3. **Nếu phụ huynh chọn "Không tìm nữa":** staff hủy lớp theo UC hủy lớp (chuyển `CANCELLED`), lớp dạy thử bị hủy; các lớp đang dạy khác của Gia sư không bị ảnh hưởng.  
Use Case kết thúc.

**Luồng ngoại lệ**  
5a. Trùng ca dạy trong tuần của Gia sư:  
5a1. Hệ thống phát hiện một trong các khung giờ lặp tuần vừa chọn bị trùng với ca dạy của một lớp `ACTIVE` khác mà Gia sư đang dạy.  
5a2. Hệ thống cảnh báo: *"Khung giờ Thứ 2 (19:30 - 21:00) bị trùng với ca dạy của học sinh [Tên HS]. Vui lòng chọn khung giờ khác."*  
5a3. Gia sư điều chỉnh lại khung giờ hoặc Thứ học không bị xung đột.  
Use Case quay lại bước 4.

---

# PHẦN III: BẢNG TRUY XUẤT YÊU CẦU & MA TRẬN USE CASE (TRACEABILITY MATRIX)

Bảng tổng hợp đối chiếu Use Case Phân hệ Gia sư hiện có với mã Yêu cầu Chức năng (PRD FR) và các Hành trình người dùng (User Journey):

| Mã Use Case | Tên Use Case | Tác nhân chính | Yêu cầu PRD tương ứng | Hành trình người dùng |
| :--- | :--- | :--- | :---: | :---: |
| **UC-T01** | Thiết lập Hồ sơ Gia sư | Gia sư | **FR-27**: Đăng ký & Thiết lập Hồ sơ Gia sư | UJ-1 |
| **UC-T02** | Xem danh sách & Ứng tuyển Lớp cần gia sư | Gia sư | **FR-28**: Tìm lớp & Chấp nhận ghép lớp (Unlock SĐT) | UJ-2 |
| **UC-T04** | Quản lý Khung chương trình | Gia sư | **FR-30**: Quản lý Khung chương trình (Mẫu & Thủ công) | UJ-2 |
| **UC-T05** | Quản lý Nhật ký buổi học | Gia sư | **FR-40**: Quản lý Nhật ký buổi học (S3) | UJ-2 |
| **UC-T06** | Soạn & Giao Quiz ôn tập qua Trợ lý AI | Gia sư | **FR-8, FR-9**: Không gian làm việc chia đôi màn hình AI | UJ-2 (AI Cốt lõi) |
| **UC-T06b** | Import Quiz từ công cụ ngoài | Gia sư | **FR-9**: Chế độ kép & Nhập dữ liệu BYO-AI — *Chưa triển khai* | UJ-2 |
| **UC-T07** | Xem & Tra cứu Lịch dạy | Gia sư | **FR-26**: Xem Lịch dạy (Lưới thời khóa biểu tuần) | UJ-2 |
| **UC-T08** | Thiết lập Lịch dạy thử | Gia sư | **FR-29**: Cấu hình Lịch học thử | UJ-2 |
| **UC-T09b** | Báo cáo kết quả dạy thử | Gia sư | **FR-29**: Báo cáo kết quả dạy thử (`SUCCESS`/`FAILED`) | UJ-2 |
| **UC-T09** | Thiết lập Lịch học cố định | Gia sư | **FR-29**: Chốt Lịch dạy cố định (`ACTIVE`) | UJ-2 |

> [!NOTE]  
> **Tính năng phát sinh sau tài liệu (V16 – V32):** *Đăng nhập Google* cho tài khoản Gia sư, *Quota lưu trữ gói* (V30, `storage_tiers`: FREE/PRO/PREMIUM — widget `GET /tutors/me/storage`, chặn tải tài liệu khi vượt quota), *Báo cáo kết quả dạy thử* (V31) và *Hàng đợi xử lý dạy thử thất bại* (V32) được phát triển sau bản mô tả ban đầu; chi tiết báo cáo được bổ sung tại UC-T09b. Mô hình Bài giảng / Nhật ký dạy học (V16) được mô tả tại UC-T05; ngoại lệ lịch dạy (V13) được mô tả tại UC-T07.

---
*Tài liệu Đặc tả Use Case Phân hệ Gia sư được biên soạn chuẩn hóa theo PRD v1.6 và Kế hoạch triển khai dự án Học viện Công nghệ Bưu chính Viễn thông (PTIT). Lần cập nhật đối chiếu mã nguồn: sau migration V16 (lessons & teaching_logs), V30 (quota lưu trữ theo gói) và Google-Login cho Gia sư.*
