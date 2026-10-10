# TÀI LIỆU ĐẶC TẢ TRƯỜNG HỢP SỬ DỤNG (USE CASE): PHÂN HỆ GIA SƯ
**Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Đồ án Tốt nghiệp**  
**Đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition  

---

# PHẦN I: TỔNG QUAN PHÂN HỆ GIA SƯ & PHẠM VI MVP

Phân hệ Gia sư được thiết kế tinh gọn, tập trung tối đa vào 2 giá trị cốt lõi: **tối ưu vận hành nhận lớp** và **trợ lý giảng dạy cá nhân hóa AI bám sát Hồ sơ Kiến thức Học sinh (SKP)**.

> [!NOTE]  
> **Ghi chú phạm vi MVP:** Tính năng *Đổi lịch học / Báo nghỉ buổi học* đã được **loại bỏ khỏi phạm vi MVP** nhằm tập trung nguồn lực phát triển các tính năng giảng dạy AI cốt lõi và đảm bảo tiến độ triển khai. Lịch dạy học của gia sư và học sinh vận hành theo khung thời khóa biểu cố định hàng tuần được chốt sau khi nhận lớp thành công.

---

# PHẦN II: ĐẶC TẢ CHI TIẾT TỪNG USE CASE PHÂN HỆ GIA SƯ

---

### UC - T01. Thiết lập Hồ sơ Gia sư

**Mã Use Case**  
UC-T01

**Tên Use Case**  
Thiết lập Hồ sơ Gia sư

**Mô tả**  
Cho phép Gia sư lần đầu đăng ký/đăng nhập vào hệ thống thực hiện khai báo và hoàn thiện Hồ sơ năng lực cá nhân. Hồ sơ bao gồm: thông tin cá nhân, trình độ học vấn, chứng chỉ tiếng Anh (IELTS/TOEIC/VSTEP... kèm tệp minh chứng), kinh nghiệm giảng dạy, video giới thiệu bản thân (đường dẫn Youtube/Vimeo hoặc tải tệp video), môn/khối lớp nhận dạy, thiết lập Bảng giá học phí mong muốn (theo giờ phân loại theo hình thức Online/Tại nhà), hình thức dạy và khung thời gian rảnh dự kiến. Sau khi gửi, hồ sơ sẽ chuyển sang trạng thái Chờ duyệt (`PENDING_APPROVAL`) để Admin/Lễ tân xác thực trước khi Gia sư chính thức được ghép lớp.

**Tác nhân**  
Gia sư mới (Tác nhân chính), Admin / Lễ tân (Tác nhân phụ)

**Độ ưu tiên**  
Rất cao (Bắt buộc hoàn thành trước khi tham gia vận hành nhận lớp)

**Sự kiện kích hoạt**  
Gia sư hoàn tất đăng ký tài khoản / đăng nhập lần đầu tiên vào Cổng Gia sư và được hệ thống tự động điều hướng tới màn hình "Thiết lập Hồ sơ Gia sư".

**Tiền điều kiện**  
- Gia sư đã xác thực tài khoản (Email / Số điện thoại).
- Tài khoản Gia sư ở trạng thái Chưa hoàn thiện hồ sơ (`PROFILE_INCOMPLETE`).

**Hậu điều kiện**  
- Dữ liệu Hồ sơ Gia sư, tệp chứng chỉ minh chứng, video giới thiệu và Bảng giá học phí đề xuất được lưu an toàn trong cơ sở dữ liệu.
- Trạng thái hồ sơ chuyển sang Chờ duyệt (`PENDING_APPROVAL`) và thông báo nộp hồ sơ được gửi tới Admin/Lễ tân.

**Luồng chính**  
1. Gia sư đăng nhập lần đầu vào Cổng Gia sư. Hệ thống tự động chuyển hướng đến màn hình **"Thiết lập Hồ sơ Gia sư"**.
2. Hệ thống hiển thị biểu mẫu từng bước (Multi-step Form):
   - **Bước 1: Thông tin cá nhân & Liên hệ:** Ảnh đại diện (Avatar), Họ và tên, Ngày sinh, Giới tính, Số điện thoại, Địa chỉ cư trú.
   - **Bước 2: Trình độ học vấn & Chứng chỉ:** Trường đại học/chuyên ngành, Trạng thái (Sinh viên/Đã tốt nghiệp/Giảng viên), Loại chứng chỉ Tiếng Anh (IELTS, TOEIC, VSTEP...), Điểm số/Overall, Ngày cấp và Nút tải tệp đính kèm bản chụp/scan Chứng chỉ (PDF, JPG, PNG).
   - **Bước 3: Năng lực, Kinh nghiệm & Video giới thiệu:** Số năm kinh nghiệm gia sư, Thế mạnh giảng dạy (IELTS Speaking, Ngữ pháp THPT, Tiếng Anh Giao tiếp...), Bài giới thiệu bản thân (Bio), Video giới thiệu bản thân (Nhập đường dẫn Youtube/Vimeo hoặc tải tệp video ngắn .mp4/.mov).
   - **Bước 4: Thiết lập Bảng giá học phí & Hình thức dạy:** 
     * Mức học phí mong muốn (đơn vị: VNĐ/giờ) thiết lập riêng cho từng hình thức dạy (*Online* và *Tại nhà / Offline*) hoặc theo nhóm chương trình (luyện thi IELTS/TOEIC, Tiếng Anh Giao tiếp, Tiếng Anh Phổ thông...).
     * Hình thức dạy nhận lớp (*Online*, *Tại nhà*, hoặc *Cả hai*), Khu vực nhận dạy (danh sách Quận/Huyện chọn nếu dạy Tại nhà).
   - **Bước 5: Thiết lập Khung thời gian rảnh:** Đăng ký các ca dạy rảnh cố định trong tuần (Sáng/Chiều/Tối các Thứ) để hệ thống/Admin sử dụng làm căn cứ gợi ý ghép lớp.
3. Gia sư điền đầy đủ thông tin, tải tệp minh chứng chứng chỉ, nhập/tải video giới thiệu và cấu hình Bảng giá học phí đề xuất tại từng bước.
4. Gia sư nhấp nút **"Gửi duyệt hồ sơ"**.
5. Hệ thống kiểm tra tính hợp lệ của thông tin (các trường bắt buộc, mức học phí hợp lệ > 0, định dạng tệp tải lên).
6. Hệ thống lưu toàn bộ dữ liệu hồ sơ vào cơ sở dữ liệu, chuyển trạng thái hồ sơ sang Chờ duyệt (`PENDING_APPROVAL`).
7. Hệ thống gửi thông báo xác nhận: *"Hồ sơ của bạn đã được gửi thành công và đang chờ Admin/Lễ tân phê duyệt trong vòng 24-48h."* Use Case kết thúc.

**Luồng thay thế**  
3a. Gia sư muốn Lưu nháp để điền sau:  
3a1. Tại bất kỳ bước nào, Gia sư nhấp nút **"Lưu nháp"**.  
3a2. Hệ thống lưu các thông tin đã điền ở trạng thái Bản nháp (`DRAFT`).  
3a3. Khi Gia sư đăng nhập lại lần sau, hệ thống khôi phục các thông tin đã lưu nháp để tiếp tục hoàn thiện.  
Use Case tiếp tục bước 3.

7a. Hồ sơ bị Admin Từ chối (`REJECTED`) và Gia sư cập nhật lại:  
7a1. Gia sư đăng nhập vào Cổng Gia sư, hệ thống hiển thị thông báo hồ sơ bị từ chối kèm Lý do từ chối từ Admin (ví dụ: *"Ảnh chụp chứng chỉ IELTS bị mờ, vui lòng tải lại"*).  
7a2. Gia sư nhấp **"Cập nhật lại hồ sơ"**.  
7a3. Gia sư điều chỉnh thông tin hoặc tải lại tệp chứng chỉ/video/bảng giá mới theo yêu cầu.  
7a4. Gia sư nhấp **"Gửi lại hồ sơ"**.  
Use Case tiếp tục bước 5.

**Luồng ngoại lệ**  
5a. Tệp đính kèm/video không hợp lệ hoặc quá dung lượng:  
5a1. Tệp chứng chỉ vượt quá 10MB hoặc tệp video vượt quá 50MB / không đúng định dạng (.mp4, .mov) / liên kết Youtube không hợp lệ.  
5a2. Hệ thống báo lỗi: *"Tệp hoặc liên kết video không hợp lệ. Vui lòng tải tệp chứng chỉ PDF/JPG < 10MB, tệp video MP4/MOV < 50MB hoặc kiểm tra lại đường dẫn Youtube/Vimeo."*  
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
Cho phép Gia sư xem danh sách các lớp học đang có nhu cầu tìm gia sư được đăng công khai trên **Bảng tin Lớp cần gia sư**. Các lớp này do Admin/Lễ tân cập nhật công khai để tất cả gia sư đã phê duyệt hồ sơ cùng tiếp cận. Gia sư có thể lọc danh sách theo Chương trình học (IELTS, TOEIC, Tiếng Anh Giao tiếp, Tiếng Anh Phổ thông...), hình thức (Online/Tại nhà), khu vực (Quận/Huyện) và mức học phí, sau đó nhấp xem chi tiết yêu cầu lớp và gửi đơn ứng tuyển. Đơn ứng tuyển sau khi gửi thành công sẽ được lưu ở trạng thái Chờ duyệt (`APPLIED`) để Admin/Lễ tân xem xét ghép lớp.

**Tác nhân**  
Gia sư (Tác nhân chính), Admin / Lễ tân (Tác nhân phụ)

**Độ ưu tiên**  
Rất cao (Nghiệp vụ vận hành nhận lớp cốt lõi)

**Sự kiện kích hoạt**  
Gia sư nhấp chọn mục **"Bảng tin Lớp cần gia sư"** trên Cổng Gia sư.

**Tiền điều kiện**  
- Gia sư đã đăng nhập thành công vào Cổng Gia sư.
- Hồ sơ Gia sư ở trạng thái đã được Admin phê duyệt (`APPROVED` / Hoạt động).

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
2a. Gia sư lọc danh sách lớp theo tiêu chí:  
2a1. Gia sư sử dụng bộ lọc: Chương trình học (*IELTS, TOEIC, Giao tiếp, Tiếng Anh Phổ thông...*), Hình thức (*Online / Tại nhà*), Khu vực (*Quận/Huyện*), Mức học phí.  
2a2. Hệ thống tải và hiển thị danh sách các lớp khớp với tiêu chí lọc.  
Use Case tiếp tục bước 3.

6a. Gia sư Hủy đơn ứng tuyển (khi đơn đang chờ duyệt):  
6a1. Tại danh sách **"Lớp đã ứng tuyển"**, Gia sư nhấp nút **"Hủy ứng tuyển"** đối với đơn đang ở trạng thái `APPLIED`.  
6a2. Hệ thống hiển thị hộp thoại xác nhận. Gia sư đồng ý.  
6a3. Hệ thống xóa bản ghi ứng tuyển và cập nhật lại trạng thái nút thành "Ứng tuyển nhận lớp".  
Use Case kết thúc.

**Luồng ngoại lệ**  
7a. Gia sư đã ứng tuyển lớp này trước đó:  
7a1. Hệ thống phát hiện Gia sư đã gửi đơn ứng tuyển cho mã lớp này.  
7a2. Hệ thống thông báo: *"Bạn đã gửi đơn ứng tuyển cho lớp học này rồi. Vui lòng chờ phản hồi từ Trung tâm."*  
Use Case quay lại bước 2.

7b. Lớp học đã chốt gia sư khác hoặc đã ngưng nhận ứng tuyển:  
7b1. Hệ thống phát hiện lớp học đã chuyển sang trạng thái Đã đóng/Đã ghép (`FILLED` / `CLOSED`).  
7b2. Hệ thống thông báo: *"Lớp học này đã chọn được gia sư phù hợp và ngưng nhận đơn ứng tuyển."*  
Use Case quay lại bước 2.

7c. Hồ sơ Gia sư chưa được duyệt (`PENDING_APPROVAL` hoặc `PROFILE_INCOMPLETE`):  
7c1. Gia sư chưa hoàn thiện hồ sơ hoặc hồ sơ đang trong quá trình chờ Admin xác thực.  
7c2. Hệ thống chặn và thông báo: *"Hồ sơ của bạn chưa được phê duyệt. Vui lòng hoàn tất và chờ Admin xác thực hồ sơ trước khi ứng tuyển nhận lớp."*  
Use Case kết thúc.

---

### UC - T04. Quản lý Khung chương trình

**Mã Use Case**  
UC-T04

**Tên Use Case**  
Quản lý Khung chương trình

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

### UC - T05. Quản lý Buổi học thực tế & Nhật ký dạy học

**Mã Use Case**  
UC-T05

**Tên Use Case**  
Quản lý Buổi học thực tế & Nhật ký dạy học

**Mô tả**  
Cho phép gia sư quản lý dòng thời gian từng buổi học thực tế độc lập với Khung chương trình tổng thể. Tại màn hình làm việc của Buổi học N, gia sư ghi nhận thông tin bài giảng, đính kèm bài giảng/tài liệu ôn tập (.pdf, .docx) và điền vùng văn bản **Nhật ký dạy học** sau khi buổi học kết thúc. Vùng văn bản này hiển thị công khai cho cả Gia sư, Học sinh và Phụ huynh cùng xem, dùng để ghi lại kiến thức trọng tâm đã học và dặn dò.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư chọn thẻ "Buổi học thực tế" trong lớp học và nhấp vào "Buổi học N" hoặc bấm "+ Thêm buổi học mới".

**Tiền điều kiện**  
Lớp học đang ở trạng thái Đang hoạt động (`ACTIVE`).

**Hậu điều kiện**  
Thông tin Buổi học N, tài liệu đính kèm và nội dung Nhật ký dạy học được lưu trữ; Phụ huynh và Học sinh có thể truy cập xem báo cáo nhật ký bài học này ngay lập tức.

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học và chọn thẻ **"Buổi học thực tế"**.
2. Hệ thống hiển thị danh sách các buổi học thực tế được đánh số thứ tự tăng dần (Buổi 1, Buổi 2... Buổi N) kèm ngày diễn ra và trạng thái hoàn thành.
3. Gia sư nhấp chọn **"Buổi học N"** (hoặc nhấp "+ Tạo buổi học tiếp theo").
4. Hệ thống hiển thị Màn hình Chi tiết Buổi học N bao gồm các khu vực:
   - **Thông tin chung buổi học:** Tiêu đề buổi học, Ngày dạy thực tế, Thời lượng.
   - **Tài liệu học tập đính kèm:** Danh sách tệp đính kèm.
   - **Bài Quiz:** Bộ bài trắc nghiệm đã soạn/giao cho buổi học (nếu có), kèm nút "Soạn & Giao bài Quiz".
   - **Nhật ký dạy học:** Vùng nhập văn bản lớn.
5. Gia sư điền thông tin tiêu đề và nội dung trọng tâm giảng dạy trong buổi học N.
6. Gia sư nhấp nút **"Đính kèm tài liệu"** (nếu có tài liệu bài giảng PDF, Word hoặc âm thanh):
   - Gia sư chọn tệp từ máy tính.
   - Hệ thống tự động tải tệp lên hệ thống và gắn liên kết tải an toàn tại Buổi học N.
7. Gia sư điền vùng văn bản **Nhật ký dạy học**:
   - *Kiến thức đã hoàn thành trong buổi:* Các cấu trúc ngữ pháp/từ vựng đã giảng.
   - *Dặn dò:* Bài tập cần làm, yêu cầu học từ vựng.
8. Gia sư nhấp nút **"Lưu nhật ký bài học"**.
9. Hệ thống lưu dữ liệu vào cơ sở dữ liệu và cập nhật báo cáo Nhật ký dạy học (Học sinh và Phụ huynh có thể xem nội dung ngay).
10. Hệ thống hiển thị thông báo: *"Đã lưu nhật ký Buổi học N. Phụ huynh và Học sinh đã có thể xem báo cáo này."* Use Case kết thúc.

**Luồng thay thế**  
7a. Gia sư muốn tạm ẩn buổi học (không cho Phụ huynh & Học sinh thấy):  
7a1. Gia sư nhấp nút **"Ẩn buổi học"**.  
7a2. Hệ thống chuyển trạng thái buổi học sang Trạng thái ẩn (`HIDDEN`) (thẻ buổi học bị làm mờ, chỉ riêng Gia sư xem và chỉnh sửa được).  
7a3. Khi muốn công khai lại, gia sư nhấp **"Hiện buổi học"**.  
Use Case tiếp tục bước 9.

**Luồng ngoại lệ**  
6a. Tải tệp tài liệu đính kèm thất bại do sự cố mạng:  
6a1. Hệ thống hiển thị thông báo lỗi: "Không thể tải tệp lên hệ thống. Vui lòng kiểm tra lại kết nối mạng và thử lại".  
6a2. Gia sư bấm nút "Tải lại tệp".  
Use Case tiếp tục bước 6.

---

### UC - T06. Soạn & Giao Quiz ôn tập

**Mã Use Case**  
UC-T06

**Tên Use Case**  
Soạn & Giao Quiz ôn tập

**Mô tả**  
Tích hợp trực tiếp tại màn hình Chi tiết Buổi học N với giao diện làm việc chia đôi tích hợp Trợ lý AI (**Giao diện làm việc chia đôi AI**):
- **Khu vực làm việc chính (Bên trái - 65%):** Hiển thị danh sách các câu hỏi trắc nghiệm nhiều lựa chọn (MCQ) do AI tạo ra hoặc nhập từ bên ngoài vào. Hỗ trợ tính năng Chỉnh sửa trực tiếp trên giao diện câu hỏi, các phương án đáp án (A/B/C/D), đáp án đúng, thẻ kỹ năng và lời giải thích chi tiết từ AI trước khi bấm giao bài.
- **Khu vực hỗ trợ (Bên phải - 35%):** Gồm Thẻ 1 (**Cấu hình biểu mẫu:** thiết lập các tham số tạo bài trắc nghiệm như số lượng câu hỏi, mức độ khó do Gia sư chọn, mô tả yêu cầu bổ sung và tệp đính kèm) và Thẻ 2 (**Trợ lý AI hội thoại linh hoạt:** cho phép gia sư ra lệnh cho AI tinh chỉnh bài trắc nghiệm như *"làm khó hơn câu 3"*, *"thêm 2 câu trắc nghiệm về thì quá khứ đơn"*).

Khi tạo bài trắc nghiệm tự động qua AI (Lựa chọn A), tại màn hình Cấu hình biểu mẫu (Cột bên phải), hệ thống tự động hiển thị **Bảng Thống kê Phân tích Hồ sơ Học sinh (Chế độ chỉ đọc)** gồm: 5 kỹ năng chi tiết có tần suất làm sai cao nhất trong 14 ngày gần nhất (tính trên tỷ lệ câu sai / tổng số câu đã làm) và 5 kỹ năng chi tiết lâu nhất chưa ôn tập lại (dựa trên thời điểm luyện tập gần nhất) để gợi ý cho Gia sư tham khảo khi thiết lập yêu cầu tạo bài trắc nghiệm. Ngữ cảnh đầu vào nạp cho AI bao gồm: các tham số độ khó, số lượng câu, **nội dung yêu cầu do Gia sư thiết lập tại khung nhập câu lệnh** và tài liệu đính kèm (nếu có). Ngoài ra, hệ thống hỗ trợ tính năng Nhập dữ liệu từ AI bên ngoài (Lựa chọn B - Không tốn chi phí Token) thông qua Luồng thay thế. Sau khi duyệt, gia sư bấm **"Duyệt & Giao bài trắc nghiệm"**, toàn bộ câu hỏi trắc nghiệm, đáp án chuẩn và lời giải thích được lưu vào cơ sở dữ liệu để phục vụ việc tự động chấm điểm khi học sinh nộp bài.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Rất cao (Tính năng cốt lõi)

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Soạn Quiz" tại màn hình Chi tiết Buổi học N.

**Tiền điều kiện**  
Gia sư đang ở màn hình Chi tiết Buổi học N

**Hậu điều kiện**  
Bộ câu hỏi trắc nghiệm được lưu vào cơ sở dữ liệu ở một trong hai trạng thái: Bản nháp (`draft` - gia sư lưu nháp, chưa giao) hoặc Đã giao (`assigned` - đã giao cho học sinh); câu hỏi kèm thông tin bổ sung (đáp án đúng A/B/C/D, độ khó `difficulty`, thẻ kỹ năng `skill_tags`, lời giải thích) được lưu trữ hoàn chỉnh để phục vụ chấm điểm tự động khi bài tập ở trạng thái Đã giao (`assigned`).

**Luồng chính**  
1. Tại màn hình Chi tiết Buổi học N, gia sư nhấp nút **"Soạn Quiz"**.
2. Hệ thống mở giao diện **Không gian làm việc chia đôi AI** toàn màn hình:
   - **Cột bên trái (Khu vực làm việc chính - 65%):** Màn hình xem trước bộ câu hỏi (hiện tại trống).
   - **Cột bên phải (Khu vực hỗ trợ - 35%):** Thẻ 1 (Cấu hình biểu mẫu tham số) đang kích hoạt.
3. Hệ thống tự động nạp và hiển thị thông tin hỗ trợ:
   - *Bảng Thống kê Phân tích Hồ sơ Học sinh (Chế độ chỉ đọc):* Hiển thị danh sách 5 kỹ năng chi tiết có tần suất làm sai cao nhất trong 14 ngày qua và 5 kỹ năng chi tiết lâu nhất chưa ôn tập lại của học sinh để gợi ý cho Gia sư.
4. Gia sư thiết lập tham số và tạo bài trắc nghiệm qua AI (Lựa chọn A - Luồng chính):
   - Gia sư xem thông tin thống kê gợi ý, chọn số lượng câu hỏi, mức độ khó mong muốn và nhập mô tả yêu cầu nội dung bài trắc nghiệm tại khung nhập câu lệnh.
   - Gia sư có thể tải lên thêm tài liệu đính kèm (tệp PDF, Word hoặc ảnh chụp bài tập/tài liệu tham khảo bổ sung) để AI phân tích làm căn cứ tạo câu hỏi trắc nghiệm (hệ thống tự động trích xuất nội dung văn bản từ tệp đính kèm).
   - Gia sư nhấp nút **"Tạo bài trắc nghiệm AI (Lựa chọn A)"** *(Nếu muốn dùng công cụ AI bên ngoài, xem Luồng thay thế 4b)*.
   - Hệ thống gọi Dịch vụ AI kết hợp yêu cầu do Gia sư nhập cùng cấu hình biểu mẫu để tạo bộ câu hỏi trắc nghiệm.
   - Bộ câu hỏi trắc nghiệm hiển thị trực tiếp lên Khu vực làm việc chính (Cột bên trái).
5. Gia sư xem trước toàn bộ danh sách câu hỏi trắc nghiệm trên Khu vực làm việc chính (Cột bên trái):
   - Mỗi thẻ câu hỏi hiển thị: Nội dung câu hỏi trắc nghiệm, 4 phương án đáp án (A/B/C/D), Đáp án đúng, Thẻ kỹ năng chi tiết (`micro_skill_tag`), Độ khó (`difficulty`) và Lời giải thích chi tiết từ AI.
6. Gia sư tinh chỉnh bài trắc nghiệm qua 2 cách linh hoạt:
   - *Cách 1 (Chỉnh sửa văn bản trực tiếp):* Gia sư nhấp đúp vào văn bản câu hỏi hoặc phương án đáp án bất kỳ trên khung làm việc để gõ chỉnh sửa văn bản trực tiếp.
   - *Cách 2 (Sử dụng Trợ lý AI hội thoại tại Cột bên phải):* Gia sư chuyển sang Thẻ 2 (Trợ lý AI hội thoại linh hoạt) và gõ lệnh điều chỉnh (ví dụ: *"Đổi câu 2 sang chủ đề từ vựng Du lịch"*, *"Cho câu 4 khó hơn nữa"*). Dịch vụ AI thực hiện tinh chỉnh và cập nhật lại câu hỏi trắc nghiệm tương ứng trên khung làm việc.
7. Gia sư chọn một trong hai hành động:
   - Nhấp nút **"Lưu nháp"** để lưu bộ bài trắc nghiệm tạm thời mà chưa giao cho học sinh (xem Luồng thay thế 7a).
   - Nhấp nút **"Giao bài"** để tiến hành giao bài ngay.
8. Khi gia sư nhấp **"Giao bài"**, hệ thống yêu cầu gia sư xác nhận Hạn nộp bài (`deadline`) và hiển thị hộp thoại xác nhận: *"Bạn có chắc chắn muốn giao bộ bài trắc nghiệm này cho [Tên HS]?"*.
9. Gia sư xác nhận. Hệ thống thực hiện:
   - Lưu (hoặc cập nhật) bộ câu hỏi trắc nghiệm, đáp án chuẩn, thẻ kỹ năng (`skill_tags`), độ khó câu hỏi và lời giải thích chi tiết từ AI vào cơ sở dữ liệu.
   - Tạo (hoặc chuyển trạng thái) bản ghi bài tập trắc nghiệm gán cho Học sinh sang trạng thái Đã giao (`assigned`).
10. Hệ thống hiển thị thông báo thành công: *"Đã giao bài trắc nghiệm cá nhân hóa thành công cho học sinh [Tên HS] tại Buổi học N."* Use Case kết thúc.

**Luồng thay thế**  
4b. Gia sư chọn chế độ Sao chép câu lệnh & Nhập dữ liệu từ AI bên ngoài (Lựa chọn B - Không tốn chi phí Token):  
4b1. Gia sư điền các thông số trên Cấu hình biểu mẫu (số lượng câu hỏi, mô tả yêu cầu nội dung).  
4b2. Gia sư nhấp nút **"Sao chép câu lệnh chuẩn hóa"**.  
4b3. Hệ thống tự động đóng gói Yêu cầu nội dung do gia sư nhập kết hợp với các thông số cấu hình biểu mẫu, danh mục thẻ kỹ năng hợp lệ và cấu hình định dạng JSON chuẩn thành một đoạn câu lệnh hoàn chỉnh và lưu vào bộ nhớ tạm.  
4b4. Hệ thống hiển thị hướng dẫn: *"Đã sao chép câu lệnh! Bạn chỉ cần dán câu lệnh này vào ChatGPT/Claude và đính kèm tệp/ảnh tài liệu của bạn (nếu có) để tạo bài trắc nghiệm."*  
4b5. Gia sư mở công cụ AI bên ngoài (ChatGPT, Claude, Gemini...), dán câu lệnh (và tải tệp/ảnh lên nếu có) để tạo bộ bài trắc nghiệm.  
4b6. Gia sư dán văn bản kết quả (dạng JSON hoặc đoạn văn bản bài trắc nghiệm chuẩn) vào ô nhập trên hệ thống và nhấp **"Kiểm tra & Nhập dữ liệu"**.  
4b7. Hệ thống kiểm định cấu trúc bài trắc nghiệm và hiển thị toàn bộ câu hỏi lên Khu vực làm việc chính.  
Use Case tiếp tục bước 5.

6a. Gia sư muốn xóa bớt một câu hỏi trắc nghiệm không ưng ý khỏi bài trắc nghiệm:  
6a1. Gia sư nhấp vào biểu tượng Thùng rác trên thẻ câu hỏi tại Khu vực làm việc chính.  
6a2. Hệ thống loại bỏ câu hỏi đó khỏi danh sách xem trước và cập nhật lại tổng số câu.  
Use Case tiếp tục bước 6.

7a. Gia sư chưa muốn giao ngay và nhấp nút **"Lưu nháp"**:  
7a1. Hệ thống lưu toàn bộ bộ câu hỏi trắc nghiệm hiện tại (bao gồm đáp án, thẻ kỹ năng `skill_tags`, độ khó, lời giải thích AI) vào cơ sở dữ liệu ở trạng thái Bản nháp (`draft`).  
7a2. Hệ thống hiển thị thông báo: *"Đã lưu nháp bài trắc nghiệm thành công. Bạn có thể mở lại để chỉnh sửa hoặc giao bài sau."*  
7a3. Bài trắc nghiệm nháp xuất hiện trong danh sách **"Bài trắc nghiệm đang soạn thảo (Nháp)"** tại màn hình Chi tiết Buổi học N, với nhãn trạng thái `Nháp` và nút **"Tiếp tục chỉnh sửa / Giao bài"**.  
Use Case kết thúc.

**Luồng ngoại lệ**  
4a1. Dịch vụ AI gặp sự cố quá tải hoặc phản hồi chậm quá 15 giây:  
4a2. Hệ thống hiển thị thông báo: "Hệ thống AI đang bận. Bạn có thể chuyển sang chế độ Nhập tệp từ AI bên ngoài (Lựa chọn B) hoặc bấm Thử lại".  
4a3. Gia sư chọn thử lại hoặc chuyển sang Lựa chọn B.  
Use Case quay lại bước 4.

---

### UC - T07. Xem & Tra cứu Lịch dạy

**Mã Use Case**  
UC-T07

**Tên Use Case**  
Xem & Tra cứu Lịch dạy

**Mô tả**  
Cho phép Gia sư xem toàn bộ ca dạy của các lớp đang phụ trách theo dạng Thời khóa biểu trực quan (Lịch tuần / Lịch tháng). Gia sư có thể lọc lịch theo từng lớp học và xem thông tin chi tiết từng ca dạy (tên học sinh, lớp học, khung giờ, hình thức học Online/Tại nhà, địa chỉ dạy học hoặc liên kết phòng học trực tuyến Zoom/Meet).

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Trung bình - Cao

**Sự kiện kích hoạt**  
Gia sư chọn mục "Lịch dạy" hoặc "Thời khóa biểu" trên thanh điều hướng Cổng Gia sư.

**Tiền điều kiện**  
Gia sư đã đăng nhập thành công vào hệ thống.

**Hậu điều kiện**  
Giao diện Thời khóa biểu hiển thị chính xác toàn bộ ca dạy cố định của gia sư theo thời gian thực.

**Luồng chính**  
1. Gia sư truy cập Cổng Gia sư và chọn mục **"Lịch dạy"** (hoặc **"Thời khóa biểu"**).
2. Hệ thống tải dữ liệu các ca dạy và hiển thị giao diện Thời khóa biểu cá nhân dưới dạng Lịch tuần (chế độ mặc định).
3. Mỗi ca dạy trên thời khóa biểu hiển thị thông tin tóm tắt bao gồm: Tên lớp/Học sinh, Khung giờ dạy, Hình thức học (Online hoặc Tại nhà).
4. Gia sư nhấp vào một ca dạy bất kỳ trên thời khóa biểu.
5. Hệ thống hiển thị thẻ/hộp thoại Chi tiết ca dạy bao gồm: Tên học sinh, lớp học, khung giờ học, hình thức học (Online/Tại nhà), địa chỉ nhà học sinh (nếu học Tại nhà) hoặc liên kết phòng học trực tuyến (nếu học Online).
6. Gia sư xem xong thông tin và đóng hộp thoại Chi tiết ca dạy. Use Case kết thúc.

**Luồng thay thế**  
2a. Gia sư chuyển đổi chế độ hiển thị lịch hoặc thời gian xem (tuần/tháng):  
2a1. Gia sư chọn chế độ xem "Lịch tháng" hoặc bấm nút mũi tên chuyển tuần trước/tuần sau.  
2a2. Hệ thống tải và hiển thị dữ liệu ca dạy theo khung thời gian đã chọn.  
Use Case tiếp tục bước 3.

2b. Gia sư lọc thời khóa biểu theo 01 Lớp học cụ thể:  
2b1. Gia sư chọn một lớp học từ danh sách Dropdown bộ lọc lớp.  
2b2. Hệ thống chỉ hiển thị các ca dạy của lớp đã chọn trên Thời khóa biểu.  
Use Case tiếp tục bước 3.

**Luồng ngoại lệ**  
2a1. Không có ca dạy nào trong khoảng thời gian được chọn:  
2a1.1. Hệ thống hiển thị thông điệp: "Bạn không có ca dạy nào trong tuần/tháng này".  
Use Case kết thúc.

---

### UC - T08. Cấu hình & Thiết lập Lịch dạy

**Mã Use Case**  
UC-T08

**Tên Use Case**  
Cấu hình & Thiết lập Lịch dạy

**Mô tả**  
Cho phép Gia sư thiết lập khung thời gian dạy học cố định hàng tuần (gồm các Thứ trong tuần, khung giờ dạy, hình thức học Online/Tại nhà) cho lớp học sau khi đơn ghép lớp được Admin/Lễ tân phê duyệt. Buổi học đầu tiên diễn ra theo khung lịch cố định này sẽ đồng thời đóng vai trò là buổi học thử. Việc thiết lập lịch dạy giúp hệ thống kiểm tra xung đột trùng lịch ca dạy cá nhân của gia sư và hiển thị Thời khóa biểu cố định cho Gia sư, Học sinh và Phụ huynh.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Thiết lập lịch dạy" tại trang Chi tiết Lớp học sau khi Admin/Lễ tân chuyển đơn ghép lớp sang trạng thái sẵn sàng xếp lịch.

**Tiền điều kiện**  
- Gia sư đã đăng nhập thành công vào Cổng Gia sư.
- Đơn ghép lớp đã được Admin/Lễ tân phê duyệt và phân công cho Gia sư.

**Hậu điều kiện**  
- Khung thời gian dạy cố định hàng tuần được lưu vào cơ sở dữ liệu.
- Thời khóa biểu cố định của Gia sư được đồng bộ tự động trên giao diện Lịch dạy (UC-T07).

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học và chọn lớp học vừa được Admin/Lễ tân phê duyệt đơn ghép lớp.
2. Gia sư nhấp nút **"Thiết lập lịch dạy"**.
3. Hệ thống hiển thị biểu mẫu Thiết lập Khung lịch dạy cố định hàng tuần.
4. Gia sư chọn các **Thứ trong tuần** (VD: Thứ 2, Thứ 5) và nhập **Khung giờ bắt đầu - kết thúc** cho từng ca dạy (VD: 19:30 - 21:00).
5. Gia sư chọn **Hình thức học**: *Online* (nhập/gắn liên kết phòng học Zoom/Google Meet) hoặc *Tại nhà* (xác nhận địa chỉ dạy học).
6. Gia sư nhấp nút **"Lưu & Thiết lập lịch dạy"**.
7. Hệ thống kiểm tra xung đột/trùng lịch ca dạy cá nhân của Gia sư với các lớp học khác mà Gia sư đang đảm nhận.
8. Hệ thống lưu dữ liệu khung thời khóa biểu cố định vào cơ sở dữ liệu và cập nhật trạng thái lớp học (buổi học diễn ra đầu tiên theo lịch này đóng vai trò là buổi học thử).
9. Hệ thống hiển thị thông báo thành công: *"Đã thiết lập lịch dạy cố định thành công."* Use Case kết thúc.

**Luồng thay thế**  
8a. Gia sư cập nhật/điều chỉnh lại khung lịch cố định của lớp đang hoạt động (`ACTIVE`):  
8a1. Gia sư mở Cài đặt lớp học đang `ACTIVE`, chọn "Chỉnh sửa lịch cố định".  
8a2. Gia sư điều chỉnh lại Thứ, Khung giờ hoặc Hình thức học và bấm "Cập nhật".  
8a3. Hệ thống kiểm tra trùng lịch (bước 7) và lưu cấu hình lịch mới.  
8a4. Hệ thống cập nhật thời khóa biểu và gửi thông báo thay đổi cho Phụ huynh & Học sinh.  
Use Case kết thúc.

**Luồng ngoại lệ**  
7a. Trùng ca dạy cá nhân của Gia sư:  
7a1. Hệ thống phát hiện khung giờ vừa chọn trùng với ca dạy của một lớp `ACTIVE` khác mà Gia sư đang dạy.  
7a2. Hệ thống cảnh báo: *"Khung giờ Thứ 2 (19:30 - 21:00) bị trùng với ca dạy của học sinh [Tên HS]. Vui lòng chọn khung giờ khác."*  
7a3. Gia sư điều chỉnh lại khung giờ hoặc Thứ học không bị xung đột.  
Use Case quay lại bước 6.

---

# PHẦN III: BẢNG TRUY XUẤT YÊU CẦU & MA TRẬN USE CASE (TRACEABILITY MATRIX)

Bảng tổng hợp đối chiếu Use Case Phân hệ Gia sư hiện có với mã Yêu cầu Chức năng (PRD FR) và các Hành trình người dùng (User Journey):

| Mã Use Case | Tên Use Case | Tác nhân chính | Yêu cầu PRD tương ứng | Hành trình người dùng |
| :--- | :--- | :---: | :---: | :---: |
| **UC-T01** | Thiết lập Hồ sơ Gia sư | Gia sư | **FR-27**: Đăng ký & Thiết lập Hồ sơ Gia sư | UJ-1 |
| **UC-T02** | Xem danh sách & Ứng tuyển Lớp cần gia sư | Gia sư | **FR-28**: Tìm lớp & Chấp nhận ghép lớp (Unlock SĐT) | UJ-2 |
| **UC-T04** | Quản lý Khung chương trình | Gia sư | **FR-30**: Quản lý Khung chương trình (Mẫu & Thủ công) | UJ-2 |
| **UC-T05** | Quản lý Buổi học thực tế & Nhật ký dạy học | Gia sư | **FR-40**: Quản lý Buổi học thực tế & Nhật ký dạy học (S3) | UJ-2 |
| **UC-T06** | Soạn & Giao Bài trắc nghiệm | Gia sư | **FR-8, FR-9**: Không gian làm việc chia đôi màn hình AI & Chế độ kép | UJ-2 (AI Cốt lõi) |
| **UC-T07** | Xem & Tra cứu Lịch dạy | Gia sư | **FR-26**: Xem Lịch dạy (Thời khóa biểu cá nhân) | UJ-2 |
| **UC-T08** | Cấu hình & Thiết lập Lịch dạy | Gia sư | **FR-29**: Cấu hình Lịch học thử & Chốt Lịch dạy cố định | UJ-2 |

---
*Tài liệu Đặc tả Use Case Phân hệ Gia sư được biên soạn chuẩn hóa theo PRD v1.6 và Kế hoạch triển khai dự án Học viện Công nghệ Bưu chính Viễn thông (PTIT).*
