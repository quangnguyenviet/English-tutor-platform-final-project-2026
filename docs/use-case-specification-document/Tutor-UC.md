# TÀI LIỆU ĐẶC TẢ USE CASE: PHÂN HỆ GIA SƯ (TUTOR PORTAL)
**Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Đồ án Tốt nghiệp**  
**Đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition  

---

# PHẦN I: TỔNG QUAN PHÂN HỆ GIA SƯ & PHẠM VI MVP

Phân hệ Gia sư (Tutor Portal) được thiết kế tinh gọn, tập trung tối đa vào 2 giá trị cốt lõi: **tối ưu vận hành nhận lớp** và **trợ lý giảng dạy cá nhân hóa AI bám sát Student Knowledge Profile (SKP)**.

> [!NOTE]  
> **Ghi chú phạm vi MVP:** Tính năng *Đổi lịch học / Báo nghỉ buổi học* đã được **loại bỏ khỏi phạm vi MVP** nhằm tập trung nguồn lực phát triển các tính năng giảng dạy AI cốt lõi và đảm bảo tiến độ triển khai. Lịch dạy học của gia sư và học sinh vận hành theo khung thời khóa biểu cố định hàng tuần được chốt sau khi nhận lớp thành công.

---

# PHẦN II: ĐẶC TẢ CHI TIẾT TỪNG USE CASE PHÂN HỆ GIA SƯ

---

### 1. UC - T01. Nhận đề nghị ghép lớp & Xem thông tin liên hệ Phụ huynh (Match Offer Acceptance)

**Mã Use Case**  
UC-T01

**Tên Use Case**  
Nhận đề nghị ghép lớp & Xem thông tin liên hệ Phụ huynh (Match Offer Acceptance)

**Mô tả**  
Cho phép gia sư xem thông báo đề nghị ghép lớp (`Match Offer`) do Admin / Lễ tân gửi đến thông qua giao diện Quản lý Lớp học. Thông tin đề nghị hiển thị đầy đủ nhu cầu của học sinh (khối lớp, trình độ khởi điểm, mục tiêu học tập, yêu cầu cụ thể, khung thời gian học đề xuất và mức học phí/buổi). Gia sư có thể chọn **"Đồng ý nhận lớp"** hoặc **"Từ chối"**. Khi gia sư bấm đồng ý, hệ thống tự động mở khóa (unlock) Số điện thoại và Địa chỉ nhà phụ huynh, cho phép gia sư chủ động gọi điện trao đổi và sắp xếp lịch học thử miễn phí.

**Tác nhân**  
Gia sư (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhận thông báo có lời mời nhận lớp mới và nhấp chọn thông báo hoặc truy cập mục "Đề nghị nhận lớp" (`/tutor/match-offers`).

**Tiền điều kiện**  
Gia sư đã đăng nhập tài khoản hợp lệ, có trạng thái hoạt động (`ACTIVE`) và trung tâm đã tạo một bản ghi `Match Offer` gửi tới gia sư.

**Hậu điều kiện**  
Bản ghi `Match Offer` chuyển sang trạng thái `ACCEPTED` (hoặc `REJECTED` nếu từ chối); Số điện thoại và Địa chỉ phụ huynh được hiển thị giải mã; bản ghi `Enrollment` khởi tạo ở trạng thái `TRIAL_PENDING`.

**Luồng chính**  
1. Gia sư đăng nhập vào Cổng gia sư và chọn mục "Danh sách đề nghị nhận lớp" (`/tutor/match-offers`).
2. Hệ thống hiển thị danh sách các thẻ `Match Offer` đang ở trạng thái chờ phản hồi (`PENDING`), mỗi thẻ bao gồm:
   - Tên/biệt danh học sinh và Khối lớp.
   - Trình độ hiện tại & Mục tiêu học tập ưu tiên.
   - Mức học phí/buổi và lịch học mong muốn.
   - Ghi chú thêm từ phụ huynh/trung tâm.
3. Gia sư nhấp nút **"Xem chi tiết đề nghị"**.
4. Hệ thống mở cửa sổ Modal hiển thị chi tiết hồ sơ yêu cầu ghép lớp.
5. Gia sư cân nhắc lịch cá nhân và chuyên môn, sau đó nhấp nút **"Đồng ý nhận lớp"**.
6. Hệ thống kiểm tra và cập nhật trạng thái bản ghi `Match Offer` thành `ACCEPTED`.
7. Hệ thống tự động mở khóa (unlock) vùng thông tin liên hệ bảo mật:
   - Họ và tên phụ huynh.
   - Số điện thoại liên hệ / Zalo (có nút bấm gọi điện hoặc copy nhanh).
   - Địa chỉ học tại nhà (nếu hình thức học là Tại nhà) hoặc liên kết phòng học online.
8. Hệ thống khởi tạo lớp học ở trạng thái `TRIAL_PENDING` và hiển thị thông báo hướng dẫn: *"Vui lòng liên hệ Phụ huynh trong vòng 24 giờ để chốt thời gian học thử 01 buổi miễn phí"*.
9. Gia sư nhấp **"Đã hiểu & Gọi cho Phụ huynh"**. Use Case kết thúc.

**Luồng thay thế**  
5a. Gia sư không phù hợp với lịch dạy hoặc mức học phí và chọn **"Từ chối nhận lớp"**:  
5a1. Hệ thống hiển thị hộp thoại yêu cầu gia sư chọn lý do từ chối (Trùng lịch dạy, Học phí chưa phù hợp, Khoảng cách địa lý xa, Khác...).  
5a2. Gia sư chọn lý do và nhấp "Xác nhận từ chối".  
5a3. Hệ thống cập nhật trạng thái `Match Offer` thành `REJECTED`, thông báo gửi về Admin / Lễ tân để điều phối gia sư khác.  
Use Case kết thúc.

**Luồng ngoại lệ**  
6a. Đề nghị ghép lớp đã bị Admin hủy hoặc gia sư khác đã được nhận trước đó (hết hạn offer):  
6a1. Hệ thống hiển thị cảnh báo: "Yêu cầu ghép lớp này không còn hiệu lực hoặc đã được xử lý bởi trung tâm".  
6a2. Hệ thống tự động làm mới danh sách đề nghị.  
Use Case kết thúc.

---

### 2. UC - T02. Nhập lịch học thử & Chốt lịch dạy cố định hàng tuần (Trial & Fixed Schedule Management)

**Mã Use Case**  
UC-T02

**Tên Use Case**  
Nhập lịch học thử & Chốt lịch dạy cố định hàng tuần (Trial & Fixed Schedule Management)

**Mô tả**  
Cho phép gia sư quản lý giai đoạn chuyển tiếp từ học thử sang lớp chính thức. Sau khi liên hệ phụ huynh, gia sư nhập ngày và ca học cho 01 buổi học thử miễn phí (`Trial Session`). Sau khi hoàn thành buổi học thử và phụ huynh xác nhận đồng ý học tiếp, gia sư thực hiện thao tác **"Chốt lịch dạy cố định hàng tuần"** (chọn các thứ trong tuần + ca học cố định). Hệ thống chuyển trạng thái lớp sang chính thức (`ACTIVE`), tự động sinh thời khóa biểu hàng tuần lặp lại cho cả Gia sư và Học sinh.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Cài đặt lịch học" tại thẻ lớp học ở trạng thái `TRIAL_PENDING` hoặc `TRIAL_DONE`.

**Tiền điều kiện**  
Gia sư đã nhận lớp thành công (UC-T01) và đang liên lạc với Phụ huynh.

**Hậu điều kiện**  
Lịch học thử hoặc lịch dạy cố định được lưu vào cơ sở dữ liệu; lớp học chuyển sang trạng thái chính thức (`ACTIVE`); thời khóa biểu tự động cập nhật.

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học (`/tutor/classes`) và chọn lớp học tương ứng.
2. Gia sư nhấp nút **"Lên lịch học thử"**.
3. Hệ thống hiển thị bộ chọn ngày giờ học thử (Chọn Ngày + Chọn Ca học: Sáng/Chiều/Tối hoặc giờ cụ thể).
4. Gia sư chọn thời gian và bấm **"Lưu lịch học thử"**.
5. Hệ thống gửi thông báo xác nhận lịch học thử tới tài khoản Học sinh và hiển thị lên Bảng điều khiển của Gia sư.
6. *(Sau khi buổi học thử diễn ra thành công)* Phụ huynh đồng ý đăng ký học chính thức. Gia sư truy cập lại chi tiết lớp học và chọn nút **"Chốt lịch dạy cố định"**.
7. Hệ thống hiển thị biểu mẫu thiết lập Lịch dạy cố định hàng tuần:
   - Chọn số buổi/tuần (ví dụ: 2 buổi/tuần).
   - Chọn Thứ trong tuần (ví dụ: Thứ 3, Thứ 6).
   - Chọn Ca học cố định tương ứng từng thứ (ví dụ: Thứ 3: 19h30 - 21h00; Thứ 6: 19h30 - 21h00).
8. Gia sư nhấp nút **"Xác nhận kích hoạt lớp chính thức"**.
9. Hệ thống kiểm tra trùng lịch dạy của gia sư:
   - Nếu không trùng: Cập nhật trạng thái `Enrollment` thành `ACTIVE`, tự động khởi tạo chuỗi lịch học cố định hiển thị trên Thời khóa biểu của Gia sư và Học sinh.
10. Hệ thống hiển thị thông báo thành công: *"Lớp học đã chuyển sang trạng thái ACTIVE chính thức. Lịch dạy cố định đã được cập nhật vào thời khóa biểu."* Use Case kết thúc.

**Luồng thay thế**  
6a. Sau buổi học thử, Phụ huynh không đồng ý học tiếp:  
6a1. Gia sư nhấp nút "Báo cáo kết quả học thử" ➔ Chọn "Phụ huynh không đồng ý tiếp tục".  
6a2. Gia sư nhập lý do ngắn (Học sinh chưa phù hợp, Phụ huynh đổi ý...).  
6a3. Hệ thống chuyển trạng thái lớp sang `CANCELLED` và thông báo cho Lễ tân xử lý khiếu nại/rematch nếu có.  
Use Case kết thúc.

**Luồng ngoại lệ**  
9a. Khung giờ cố định vừa chốt bị trùng với một lịch dạy cố định khác của gia sư trong hệ thống:  
9a1. Hệ thống cảnh báo đỏ: "Khung giờ Thứ 3 (19h30 - 21h00) bị trùng với lớp học của học sinh [Tên HS khác]".  
9a2. Hệ thống yêu cầu gia sư điều chỉnh lại thứ hoặc ca học không bị trùng.  
9a3. Gia sư chọn ca học khác hợp lệ và bấm xác nhận lại.  
Use Case tiếp tục bước 9.

---

### 3. UC - T03. Nộp minh chứng phí QR Proof chuyển khoản phí nhận lớp sau 30 ngày dạy (Tutor Fee Payment Proof)

**Mã Use Case**  
UC-T03

**Tên Use Case**  
Nộp minh chứng phí QR Proof chuyển khoản phí nhận lớp sau 30 ngày dạy (Tutor Fee Payment Proof)

**Mô tả**  
Theo quy định vận hành của trung tâm, gia sư dạy lớp chính thức được miễn phí nhận lớp ban đầu và chỉ phải nộp khoản phí dịch vụ duy nhất sau khi lớp học đã vận hành ổn định tròn **30 ngày dạy chính thức**. Khi đến hạn 30 ngày, hệ thống tự động gửi thông báo nhắc nộp phí kèm mã VietQR chuyển khoản (ngân hàng Techcombank của trung tâm). Gia sư quét mã thanh toán, chụp ảnh màn hình chuyển khoản (QR proof) và tải ảnh lên hệ thống để Admin / Lễ tân kiểm duyệt đối soát.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Lớp học chính thức `ACTIVE` cán mốc 30 ngày kể từ ngày bắt đầu dạy, hệ thống phát thông báo thanh toán phí nhận lớp hoặc gia sư nhấp nút "Nộp phí 30 ngày" tại chi tiết lớp học.

**Tiền điều kiện**  
Lớp học đang ở trạng thái `ACTIVE` và đã hoạt động đủ 30 ngày; bản ghi thanh toán `Payment` khởi tạo ở trạng thái `PENDING_PROOF`.

**Hậu điều kiện**  
Ảnh biên lai VietQR proof được tải lên hệ thống và lưu vào hệ thống; trạng thái khoản phí chuyển sang `WAITING_APPROVAL` (Chờ Admin/Lễ tân duyệt).

**Luồng chính**  
1. Gia sư nhấp vào thông báo "Đến hạn nộp phí nhận lớp 30 ngày" hoặc chọn mục "Thanh toán & Phí nhận lớp" (`/tutor/payments`).
2. Hệ thống hiển thị thông tin khoản phí:
   - Mã lớp học & Tên học sinh.
   - Số tiền phí nhận lớp phải nộp (được tính tự động theo quy chế trung tâm).
   - Hạn nộp phí (ví dụ: trong vòng 3 ngày làm việc).
   - Mã QR chuyển khoản VietQR tự động sinh kèm Số tài khoản Techcombank trung tâm và Nội dung chuyển khoản chuẩn hóa (`PHY [MaLop] [SDT GiaSu]`).
3. Gia sư sử dụng ứng dụng ngân hàng quét mã QR để chuyển khoản thành công và thực hiện chụp ảnh màn hình biên lai chuyển khoản.
4. Gia sư nhấp nút **"Tải lên ảnh chụp biên lai (QR Proof)"**.
5. Hệ thống mở bộ chọn file ảnh (hỗ trợ định dạng `.png, .jpg, .jpeg`, dung lượng < 5MB).
6. Gia sư chọn tệp ảnh biên lai và bấm **"Gửi minh chứng thanh toán"**.
7. Hệ thống tải ảnh lên hệ thống và cập nhật bản ghi thanh toán sang trạng thái `WAITING_APPROVAL`.
8. Hệ thống hiển thị thông báo: *"Đã tải minh chứng thành công. Lễ tân / Admin sẽ kiểm tra và đối soát trong vòng 24 giờ làm việc."* Use Case kết thúc.

**Luồng thay thế**  
8a. Admin / Lễ tân từ chối biên lai (ảnh mờ, sai số tiền, sai nội dung):  
8a1. Hệ thống gửi thông báo kèm lý do từ chối cho Gia sư.  
8a2. Gia sư nhấp vào thông báo, xem lý do từ chối và nhấp nút "Tải lại ảnh biên lai mới".  
8a3. Gia sư thực hiện lại các bước 5 đến 7.  
Use Case kết thúc.

**Luồng ngoại lệ**  
5a. File minh chứng tải lên vượt quá dung lượng 5MB hoặc sai định dạng file:  
5a1. Hệ thống báo lỗi: "Vui lòng chọn file hình ảnh (JPG, PNG) dung lượng không quá 5MB".  
5a2. Gia sư chọn lại tệp ảnh hợp lệ.  
Use Case tiếp tục bước 6.

---

### 4. UC - T04. Quản lý Khung chương trình học 2 cấp (Curriculum Roadmap Master Plan - Dual Mode)

**Mã Use Case**  
UC-T04

**Tên Use Case**  
Quản lý Khung chương trình học 2 cấp (Curriculum Roadmap Master Plan - Dual Mode)

**Mô tả**  
Cho phép gia sư tạo, sắp xếp và quản lý Khung chương trình học tổng thể 2 cấp (Cấp 1: Chủ đề / Chương ➔ Cấp 2: Bài học chi tiết) dành riêng cho từng học sinh. Để tiết kiệm tối đa thời gian chuẩn bị bài, hệ thống hỗ trợ cơ chế **Dual-Mode** linh hoạt:
- **Option A (Direct AI Generation):** Gia sư chọn tham số mục tiêu/trình độ, hệ thống FastAPI/LangGraph sinh tự động toàn bộ khung 2 cấp chuẩn hóa trong 3–5 giây.
- **Option B (Import File từ bên ngoài):** Gia sư tải file JSON hoặc dán văn bản lộ trình đã tham khảo từ ChatGPT/Claude ngoài hệ thống, qua bộ Parser kiểm tra hợp lệ và nạp trực tiếp vào hệ thống.
Ngoài ra, gia sư có thể tự do thêm, sửa, xóa hoặc thay đổi thứ tự từng chương/bài học thủ công.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp chọn tab "Khung chương trình" (`Curriculum Roadmap`) tại giao diện chi tiết lớp học.

**Tiền điều kiện**  
Lớp học đang ở trạng thái `ACTIVE` hoặc `TRIAL_PENDING`.

**Hậu điều kiện**  
Bộ khung chương trình 2 cấp được lưu trữ hoàn chỉnh trong CSDL, làm cơ sở gợi ý nội dung giảng dạy cho các buổi học.

**Luồng chính**  
1. Gia sư truy cập trang Chi tiết Lớp học và chọn tab **"Khung chương trình học"**.
2. Hệ thống hiển thị danh sách các Chủ đề/Chương và Bài học hiện có (hoặc giao diện trống nếu chưa khởi tạo).
3. Gia sư nhấp nút **"Tạo khung chương trình mới"**.
4. Hệ thống hiển thị cửa sổ lựa chọn phương thức khởi tạo Dual-Mode:
   - **Lựa chọn 1 (Option A - Sinh tự động qua AI):**
     - Gia sư chọn mục tiêu (IELTS, Foundation, THPT...), trình độ hiện tại, số tuần học dự kiến.
     - Gia sư nhấp "Khởi tạo qua AI".
     - Hệ thống gọi AI Service (LangGraph Agent) sinh khung lộ trình 2 cấp chuẩn cấu hình JSON trong 3–5 giây và hiển thị xem trước lên màn hình.
   - **Lựa chọn 2 (Option B - Import File từ bên ngoài):**
     - Gia sư chọn "Import từ bên ngoài".
     - Gia sư dán văn bản định dạng JSON hoặc dán prompt text kết quả từ ChatGPT ngoài.
     - Hệ thống chạy bộ Parser chuẩn hóa và kiểm định dữ liệu.
5. Gia sư xem trước Khung chương trình 2 cấp vừa sinh/import trên giao diện cây cấu trúc (Tree View):
   - *Cấp 1 (Chủ đề):* Tiêu đề chủ đề, mô tả ngắn, mục tiêu kỹ năng.
   - *Cấp 2 (Bài học):* Danh sách các bài học thuộc chủ đề (Tên bài học, trọng tâm ngữ pháp/từ vựng).
6. Gia sư thực hiện điều chỉnh thủ công nếu muốn (kéo thả đổi thứ tự bài, chỉnh sửa tên bài, thêm bài học mới hoặc xóa bài học không cần thiết).
7. Gia sư nhấp nút **"Lưu Khung chương trình Master Plan"**.
8. Hệ thống lưu toàn bộ cấu trúc 2 cấp vào CSDL PostgreSQL và thông báo: *"Đã lưu Khung chương trình thành công."* Use Case kết thúc.

**Luồng thay thế**  
3a. Gia sư muốn tự soạn Khung chương trình thủ công hoàn toàn từ đầu:  
3a1. Gia sư chọn "Tự tạo thủ công".  
3a2. Gia sư nhấp nút "+ Thêm chủ đề mới" ➔ Nhập tên chủ đề.  
3a3. Dưới chủ đề, gia sư nhấp "+ Thêm bài học" ➔ Nhập tên bài học và nội dung trọng tâm.  
3a4. Gia sư lặp lại quy trình và bấm Lưu.  
Use Case tiếp tục bước 8.

**Luồng ngoại lệ**  
4b1. File hoặc đoạn text Import ở Option B bị sai định dạng cấu trúc JSON/Text:  
4b2. Bộ Parser phát hiện lỗi và hiển thị thông báo đỏ: "Định dạng dữ liệu Import chưa đúng chuẩn. Vui lòng kiểm tra lại cấu trúc JSON hoặc dán lại văn bản chuẩn".  
4b3. Gia sư sửa lại đoạn văn bản hoặc dán đúng định dạng mẫu.  
4b4. Hệ thống kiểm định lại thành công.  
Use Case tiếp tục bước 5.

---

### 5. UC - T05. Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Public Class Log Work)

**Mã Use Case**  
UC-T05

**Tên Use Case**  
Quản lý Buổi học thực tế & Nhật ký dạy học (Daily Lesson Sessions & Public Class Log Work)

**Mô tả**  
Cho phép gia sư quản lý dòng thời gian từng buổi học thực tế độc lập với Khung chương trình tổng thể (`Daily Lesson Sessions`). Tại màn hình làm việc của Buổi học N, gia sư ghi nhận thông tin bài giảng, đính kèm bài giảng/tài liệu ôn tập (.pdf, .docx) và điền vùng văn bản **Public Class Log Work** sau khi buổi học kết thúc. Vùng văn bản này hiển thị công khai cho cả Gia sư, Học sinh và Phụ huynh cùng xem, dùng để ghi lại kiến thức trọng tâm đã học và dặn dò bài tập về nhà.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư chọn tab "Buổi học thực tế" (`Daily Sessions`) trong lớp học và nhấp vào "Buổi học N" hoặc bấm "+ Thêm buổi học mới".

**Tiền điều kiện**  
Lớp học đang ở trạng thái `ACTIVE`.

**Hậu điều kiện**  
Thông tin Buổi học N, tài liệu đính kèm và nội dung Public Log Work được lưu trữ; Phụ huynh và Học sinh có thể truy cập xem báo cáo nhật ký bài học này ngay lập tức.

**Luồng chính**  
1. Gia sư truy cập trang Quản lý Lớp học và chọn tab **"Buổi học thực tế"** (`Daily Sessions`).
2. Hệ thống hiển thị danh sách các buổi học thực tế được đánh số thứ tự tăng dần (Buổi 1, Buổi 2... Buổi N) kèm ngày diễn ra và trạng thái hoàn thành.
3. Gia sư nhấp chọn **"Buổi học N"** (hoặc nhấp "+ Tạo buổi học tiếp theo").
4. Hệ thống hiển thị Màn hình Chi tiết Buổi học N bao gồm các khu vực:
   - **Thông tin chung buổi học:** Tiêu đề buổi học, Ngày dạy thực tế, Thời lượng.
   - **Tài liệu học tập đính kèm (File Attachments):** Danh sách tệp đính kèm.
   - **Quiz trắc nghiệm:** Bộ Quiz đã soạn/giao cho buổi học (nếu có), kèm nút "Soạn & Giao AI Quiz".
   - **Nhật ký dạy học (Public Class Log Work):** Vùng nhập văn bản lớn (Rich-text editor).
5. Gia sư điền thông tin tiêu đề và nội dung trọng tâm giảng dạy trong buổi học N.
6. Gia sư nhấp nút **"Đính kèm tài liệu"** (nếu có tài liệu bài giảng PDF/Word/Audio):
   - Gia sư chọn tệp từ máy tính.
   - Hệ thống tự động tải file lên hệ thống và gắn liên kết tải an toàn tại Buổi học N.
7. Gia sư điền vùng văn bản **Public Class Log Work**:
   - *Kiến thức đã hoàn thành trong buổi:* Các cấu trúc ngữ pháp/từ vựng đã giảng.
   - *Dặn dò về nhà:* Bài tập cần làm, yêu cầu học từ vựng.
8. Gia sư nhấp nút **"Lưu & Xuất bản Nhật ký bài học"**.
9. Hệ thống lưu dữ liệu vào CSDL PostgreSQL và cập nhật báo cáo Public Log Work.
10. Hệ thống hiển thị thông báo: *"Đã lưu nhật ký Buổi học N. Phụ huynh và Học sinh đã có thể xem báo cáo này."* Use Case kết thúc.

**Luồng thay thế**  
7a. Gia sư muốn lưu nháp nhật ký buổi học để chỉnh sửa sau trước khi xuất bản cho phụ huynh xem:  
7a1. Gia sư điền nội dung và nhấp nút "Lưu bản nháp".  
7a2. Hệ thống lưu bản ghi ở trạng thái `DRAFT` (chỉ gia sư xem được).  
7a3. Khi kết thúc buổi học, gia sư mở lại và bấm "Xuất bản".  
Use Case tiếp tục bước 9.

**Luồng ngoại lệ**  
6a. Tải file tài liệu đính kèm thất bại do sự cố mạng:  
6a1. Hệ thống hiển thị thông báo lỗi: "Không thể tải file lên hệ thống. Vui lòng kiểm tra lại kết nối mạng và thử lại".  
6a2. Gia sư bấm nút "Tải lại file".  
Use Case tiếp tục bước 6.

---

### 6. UC - T06. Soạn & Giao Quiz trắc nghiệm

**Mã Use Case**  
UC-T06

**Tên Use Case**  
Soạn & Giao Quiz trắc nghiệm

**Mô tả**  
Tích hợp trực tiếp tại màn hình Chi tiết Buổi học N với giao diện làm việc chia đôi (**AI Split-Screen Workspace**):
- **Main Canvas (Trái - 65%):** Hiển thị danh sách các câu hỏi Quiz trắc nghiệm (Multiple Choice Questions - MCQ) do AI sinh ra hoặc import vào. Hỗ trợ tính năng Inline Edit trực tiếp câu hỏi, các phương án đáp án (A/B/C/D), đáp án đúng, nhãn kỹ năng (skill tag) và Lời giải thích AI chi tiết trước khi bấm giao bài.
- **Assistance Dock (Phải - 35%):** Gồm Tab 1 (**Form Config:** biểu mẫu thiết lập các tham số sinh Quiz như số lượng câu hỏi, mô tả yêu cầu bổ sung và đính kèm tài liệu) và Tab 2 (**Chat Freestyle Co-pilot:** cho phép gia sư ra lệnh cho AI tinh chỉnh Quiz trắc nghiệm như *"làm khó hơn câu 3"*, *"thêm 2 câu trắc nghiệm về quá khứ đơn"*).

Khi sinh Quiz qua AI (Option A), hệ thống tự động tổng hợp bối cảnh đầu vào (AI Input Context) bao gồm: thông số hồ sơ SKP học sinh (điểm Elo rating, các dạng lỗi sai hay mắc) kết hợp với cấu hình từ Form Config. Đối với Option B (0 Token Cost), sau khi điền Form Config, gia sư nhấp nút **"Sao chép Prompt"** để nhận đoạn Prompt đã đóng gói sẵn bối cảnh + JSON Schema chuẩn, dán vào công cụ AI bên ngoài (ChatGPT/Claude), rồi dán đoạn kết quả thu được về hệ thống để Import. Tính năng này tập trung chuyên sâu hỗ trợ sinh Quiz trắc nghiệm (4 phương án lựa chọn A/B/C/D) nhằm tối ưu cho việc kiểm tra đánh giá kiến thức nhanh và tự động chấm điểm. Sau khi duyệt, gia sư bấm **"Duyệt & Giao Quiz"**, toàn bộ câu hỏi trắc nghiệm, đáp án chuẩn và lời giải thích được lưu vào PostgreSQL để phục vụ việc tự động chấm điểm khi học sinh nộp bài.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Rất cao (Core Feature)

**Sự kiện kích hoạt**  
Gia sư nhấp nút "Soạn Quiz AI" (hoặc "Giao Quiz AI") tại màn hình Chi tiết Buổi học N.

**Tiền điều kiện**  
Gia sư đang ở màn hình Chi tiết Buổi học N

**Hậu điều kiện**  
Bộ câu hỏi Quiz trắc nghiệm được lưu vào PostgreSQL ở một trong hai trạng thái: `draft` (gia sư lưu nháp, chưa giao) hoặc `assigned` (đã giao cho học sinh); câu hỏi kèm metadata (đáp án đúng A/B/C/D, độ khó `difficulty`, nhãn `skill_tags`, giải thích AI) được lưu trữ hoàn chỉnh để phục vụ chấm điểm tự động khi bài ở trạng thái `assigned`.

**Luồng chính**  
1. Tại màn hình Chi tiết Buổi học N, gia sư nhấp nút **"Soạn & Giao AI Quiz Workspace"**.
2. Hệ thống mở giao diện **AI Split-Screen Workspace** toàn màn hình:
   - **Cột Trái (Main Canvas - 65%):** Màn hình xem trước bộ câu hỏi Quiz trắc nghiệm (hiện tại trống).
   - **Cột Phải (Assistance Dock - 35%):** Tab 1 (Form Config tham số) đang kích hoạt.
3. Hệ thống tự động kiểm tra và nạp bối cảnh (Auto-load context):
   - *Hồ sơ tri thức SKP học sinh:* Điểm mạnh, yếu, các kiến thức đã học, mục tiêu học tập, các lỗi học sinh hay mắc gần đây, trình độ.
4. Gia sư lựa chọn chế độ sinh Quiz trắc nghiệm trên Assistance Dock (Cột Phải):
   - **Trường hợp Option A (Sinh trực tiếp qua AI Agent):**
     - Gia sư chọn số lượng câu hỏi Quiz cần sinh.
     - Gia sư nhập mô tả yêu cầu nội dung Quiz mong muốn tại ô Input (ví dụ: *"Tập trung vào cấu trúc đảo ngữ và từ vựng chủ đề Du lịch"* hoặc *"Cho Quiz trắc nghiệm kiểm tra thì quá khứ đơn"*).
     - Gia sư có thể tải lên thêm tài liệu đính kèm (tệp PDF, Word hoặc ảnh chụp bài tập/tài liệu tham khảo bổ sung) để AI phân tích làm căn cứ sinh câu hỏi trắc nghiệm.
     - Gia sư nhấp nút **"Sinh AI Quiz (Option A)"**.
     - Hệ thống gọi AI Service (Python FastAPI / LangGraph Agent) kết hợp bối cảnh Buổi học N + dữ liệu SKP học sinh + yêu cầu nhập & tài liệu đính kèm của gia sư để sinh bộ câu hỏi Quiz trắc nghiệm.
     - Bộ câu hỏi Quiz trắc nghiệm hiển thị trực tiếp lên Main Canvas (Cột Trái).
   - **Trường hợp Option B (Copy Prompt & Import từ AI bên ngoài - 0 Token Cost):**
     - Gia sư điền các thông số trên Form Config (số lượng câu hỏi, mô tả yêu cầu nội dung, đính kèm tài liệu).
     - Gia sư nhấp nút **"Sao chép Prompt chuẩn hóa"**.
     - Hệ thống tự động đóng gói bối cảnh + thông số Form Config + định dạng JSON Schema chuẩn thành đoạn Prompt hoàn chỉnh và lưu vào bộ nhớ tạm (Clipboard).
     - Gia sư mở công cụ AI bên ngoài (ChatGPT / Claude / Gemini...), dán Prompt để sinh bộ Quiz trắc nghiệm.
     - Gia sư dán văn bản kết quả (dạng JSON hoặc đoạn text Quiz chuẩn) vào ô nhập Import trên hệ thống và nhấp **"Kiểm tra & Import"**.
     - Bộ Parser kiểm định cấu trúc Quiz trắc nghiệm và đẩy toàn bộ câu hỏi lên Main Canvas.
5. Gia sư xem trước toàn bộ danh sách câu hỏi Quiz trắc nghiệm trên Main Canvas (Cột Trái):
   - Mỗi thẻ câu hỏi hiển thị: Nội dung câu hỏi trắc nghiệm, 4 phương án đáp án (A/B/C/D), Đáp án đúng, Nhãn kỹ năng, Độ khó difficulty và Lời giải thích AI chi tiết.
6. Gia sư tinh chỉnh Quiz qua 2 cách linh hoạt:
   - *Cách 1 (Chỉnh sửa trực tiếp Inline Edit):* Gia sư nhấp đúp vào văn bản câu hỏi hoặc phương án đáp án bất kỳ trên Canvas để gõ chỉnh sửa văn bản trực tiếp.
   - *Cách 2 (Sử dụng Chat Co-pilot tại Dock Phải):* Gia sư chuyển sang Tab 2 (Chat Freestyle Co-pilot) và gõ lệnh điều chỉnh (ví dụ: *"Đổi câu 2 sang chủ đề từ vựng Du lịch"*, *"Cho câu 4 khó hơn nữa"*). AI Agent thực hiện tinh chỉnh và cập nhật lại câu hỏi trắc nghiệm tương ứng trên Canvas.
7. Gia sư chọn một trong hai hành động:
   - Nhấp nút **"Lưu nháp"** để lưu bộ Quiz tạm thời mà chưa giao cho học sinh (xem Luồng thay thế 7a).
   - Nhấp nút **"Duyệt & Giao Quiz cho Học sinh"** để tiến hành giao bài ngay.
8. Khi gia sư nhấp **"Duyệt & Giao Quiz cho Học sinh"**, hệ thống yêu cầu gia sư xác nhận Hạn nộp bài (`deadline`) và hiển thị hộp thoại xác nhận: *"Bạn có chắc muốn giao bộ Quiz này cho [Tên HS]?"*.
9. Gia sư xác nhận. Hệ thống thực hiện:
   - Lưu (hoặc cập nhật) bộ câu hỏi Quiz trắc nghiệm, đáp án chuẩn, nhãn `skill_tags`, độ khó câu hỏi và lời giải thích AI chi tiết vào PostgreSQL.
   - Tạo (hoặc chuyển trạng thái) bản ghi bài tập `Quiz` gán cho Học sinh sang trạng thái `assigned`.
10. Hệ thống hiển thị thông báo thành công: *"Đã giao Quiz trắc nghiệm cá nhân hóa thành công cho học sinh [Tên HS] tại Buổi học N."* Use Case kết thúc.

**Luồng thay thế**  
6a. Gia sư muốn xóa bớt một câu hỏi trắc nghiệm không ưng ý khỏi Quiz:  
6a1. Gia sư nhấp vào biểu tượng Thùng rác trên thẻ câu hỏi tại Main Canvas.  
6a2. Hệ thống loại bỏ câu hỏi đó khỏi danh sách xem trước và cập nhật lại tổng số câu.  
Use Case tiếp tục bước 6.

7a. Gia sư chưa muốn giao ngay và nhấp nút **"Lưu nháp"**:  
7a1. Hệ thống lưu toàn bộ bộ câu hỏi Quiz hiện tại (bao gồm đáp án, `skill_tags`, độ khó, lời giải thích AI) vào PostgreSQL ở trạng thái `draft`.  
7a2. Hệ thống hiển thị thông báo: *"Đã lưu nháp Quiz thành công. Bạn có thể mở lại và chỉnh sửa hoặc giao bài sau."*  
7a3. Bộ Quiz nháp xuất hiện trong danh sách **"Quiz đang soạn thảo (Nháp)"** tại màn hình Chi tiết Buổi học N, với nhãn trạng thái `Nháp` và nút **"Tiếp tục chỉnh sửa / Giao bài"**.  
Use Case kết thúc.

**Luồng ngoại lệ**  
4a1. AI Service gặp sự cố quá tải hoặc phản hồi chậm quá 5 giây:  
4a2. Hệ thống hiển thị thông báo: "Hệ thống AI đang bận. Bạn có thể chuyển sang chế độ Import File 0 Token Cost (Option B) hoặc thử lại".  
4a3. Gia sư chọn thử lại hoặc chuyển sang Option B.  
Use Case quay lại bước 4.

---

### 7. UC - T07. Theo dõi báo cáo Student Knowledge Profile (SKP) & Quản lý Private Notes bảo mật (SKP Report & Private Notes)

**Mã Use Case**  
UC-T07

**Tên Use Case**  
Theo dõi báo cáo Student Knowledge Profile (SKP) & Quản lý Private Notes bảo mật (SKP Report & Private Notes)

**Mô tả**  
Cho phép gia sư truy cập hồ sơ tri thức chuyên sâu của học sinh (Student Knowledge Profile - SKP) để hiểu rõ năng lực thực chất của con theo thời gian. Màn hình báo cáo cung cấp các chỉ số định lượng: bảng điểm thành thạo Elo (`mastery_score`) theo từng micro-skill, biểu đồ xu hướng các dạng lỗi hay mắc (Error Pattern Catalog), và danh sách Top 5 điểm mạnh / điểm yếu. Ngoài ra, gia sư được cung cấp 1 vùng văn bản **Private Notes** (Ghi chú riêng bảo mật). Vùng ghi chú này chỉ duy nhất gia sư xem và chỉnh sửa được (Phụ huynh và Học sinh hoàn toàn không thấy), dùng để lưu trữ các quan sát riêng về tính cách, thói quen học tập, tâm lý hoặc phương pháp sư phạm hiệu quả riêng với học sinh đó.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Gia sư nhấp chọn tab "Hồ sơ tri thức SKP" (`Student Knowledge Profile`) tại trang Chi tiết Lớp học hoặc chọn xem hồ sơ học sinh.

**Tiền điều kiện**  
Học sinh đã có lớp học chính thức với gia sư và phát sinh dữ liệu làm bài tập / kiểm tra.

**Hậu điều kiện**  
Gia sư nắm bắt chính xác điểm yếu của học sinh để điều chỉnh bài giảng; nội dung Private Notes được lưu trữ bảo mật riêng cho gia sư.

**Luồng chính**  
1. Gia sư nhấp vào tab **"Hồ sơ tri thức SKP"** (`SKP Report`) tại màn hình quản lý học sinh.
2. Hệ thống kiểm tra quyền truy cập `Enrollment` và truy xuất dữ liệu SKP của học sinh từ cơ sở dữ liệu PostgreSQL.
3. Hệ thống hiển thị Bảng điều khiển Báo cáo SKP toàn diện:
   - **Điểm tinh thông Kỹ năng (Skill Mastery - Elo Rating):** Bảng chi tiết từng micro-skill (ví dụ: `past_simple`: 75/100, `third_person_s`: 42/100, `relative_clause`: 60/100) kèm mức độ tin cậy `Confidence Score`.
   - **Phân tích Xu hướng Lỗi sai (Error Patterns):** Biểu đồ thể hiện các dạng lỗi sai tần suất cao (ví dụ: *Quên chia động từ ngôi thứ 3 số ít*, *Dùng sai giới từ chỉ thời gian*).
   - **Top Điểm mạnh & Điểm yếu:** Thẻ tóm tắt Top 5 kỹ năng thành thạo nhất và Top 5 kỹ năng yếu nhất cần cải thiện.
   - **Lịch sử biến động năng lực:** Biểu đồ đường thể hiện sự tăng trưởng điểm Elo rating qua các bài tập và bài kiểm tra định kỳ.
4. Bên dưới Báo cáo SKP, hệ thống hiển thị khu vực **"Ghi chú riêng bảo mật của Gia sư (Private Notes)"**:
   - Nhãn bảo mật: *"🔒 Ghi chú riêng tư - Chỉ có bạn (Gia sư) mới có quyền xem nội dung này. Phụ huynh và Học sinh không thể nhìn thấy."*
   - Ô nhập văn bản Rich-text.
5. Gia sư đọc báo cáo SKP để nắm bắt tình hình và nhập/cập nhật ghi chú riêng (ví dụ: *"Học sinh hay mất tập trung sau 45 phút đầu, cần cho nghỉ giải lao 3 phút. Học sinh tiếp thu nhanh qua ví dụ hình ảnh, ngại nói tự do"*).
6. Gia sư nhấp nút **"Lưu Ghi chú riêng"**.
7. Hệ thống lưu nội dung Private Notes vào bảng dữ liệu bảo mật liên kết với thực thể `Enrollment`.
8. Hệ thống hiển thị thông báo nhẹ: *"Đã lưu ghi chú riêng bảo mật."* Use Case kết thúc.

**Luồng thay thế**  
3a. Học sinh mới nhận lớp và chưa có lịch sử làm bài tập:  
3a1. Hệ thống hiển thị điểm Elo mặc định (Baseline = 50 điểm) cho các kỹ năng và đưa ra thông báo: "Chưa có đủ dữ liệu bài tập. Hãy giao bài tập đầu tiên để AI bắt đầu phân tích SKP học sinh".  
Use Case tiếp tục bước 4.

---

### 8. UC - T08. Quản lý Thời khóa biểu cố định & Thẻ thông tin Rate Card Gia sư (Schedule & Rate Card Management)

**Mã Use Case**  
UC-T08

**Tên Use Case**  
Quản lý Thời khóa biểu cố định & Thẻ thông tin Rate Card Gia sư (Schedule & Rate Card Management)

**Mô tả**  
Cho phép gia sư quản lý thông tin hoạt động tổng thể trên Cổng gia sư. Gia sư xem Thời khóa biểu dạy học cố định tuần (tổng hợp từ tất cả các lớp đang phụ trách), xem danh sách các học sinh đang dạy, cập nhật ảnh đại diện, video tự giới thiệu, bằng cấp chứng chỉ đã được trung tâm xác thực và điều chỉnh **Thẻ Rate Card** (mức học phí mong muốn/buổi, các môn chuyên môn trọng tâm, khu vực địa lý dạy tại nhà).  
*(Lưu ý: Tính năng Đổi lịch học / Báo nghỉ buổi học đã được loại bỏ khỏi phạm vi MVP; thời khóa biểu vận hành cố định theo lịch đã chốt tại UC-T02)*.

**Tác nhân**  
Gia sư

**Độ ưu tiên**  
Trung bình

**Sự kiện kích hoạt**  
Gia sư chọn mục "Thời khóa biểu" (`/tutor/schedule`) hoặc "Hồ sơ cá nhân & Rate Card" (`/tutor/profile`) trên thanh điều hướng.

**Tiền điều kiện**  
Gia sư đã đăng nhập tài khoản Cổng gia sư.

**Hậu điều kiện**  
Thông tin hồ sơ cá nhân và Rate Card được cập nhật; Thời khóa biểu dạy học hiển thị chính xác các ca học cố định.

**Luồng chính**  
1. Gia sư truy cập trang **"Thời khóa biểu & Hồ sơ gia sư"**.
2. Hệ thống hiển thị 2 tab làm việc chính:
   - **Tab 1: Thời khóa biểu cố định hàng tuần (Weekly Schedule View):**
     - Hiển thị ma trận thời gian từ Thứ 2 đến Chủ Nhật theo 3 ca: Sáng, Chiều, Tối.
     - Các ô có lịch dạy cố định hiển thị thẻ lớp học (Tên học sinh, Môn học, Hình thức Online/Tại nhà kèm liên kết nhanh mở Buổi học hôm nay).
     - Gia sư xem được lịch dạy trong ngày và kế hoạch dạy học cả tuần.
   - **Tab 2: Hồ sơ năng lực & Rate Card (Tutor Profile & Rate Card):**
     - Hiển thị thông tin trường đại học, chuyên ngành, bằng cấp chứng chỉ (IELTS, TESOL).
     - Ô chỉnh sửa Mức học phí đề xuất theo buổi (Rate Card).
     - Ô chọn khu vực địa bàn dạy tại nhà (Tỉnh/Thành phố ➔ Quận/Huyện).
     - Link video tự giới thiệu bản thân (Youtube/Drive link).
3. Gia sư thực hiện cập nhật mức học phí đề xuất mới hoặc cập nhật video giới thiệu mới trên Tab Rate Card.
4. Gia sư nhấp nút **"Cập nhật hồ sơ Rate Card"**.
5. Hệ thống kiểm tra dữ liệu và lưu cập nhật vào CSDL PostgreSQL.
6. Hệ thống hiển thị thông báo: *"Hồ sơ cá nhân và Rate Card của bạn đã được cập nhật thành công."* Use Case kết thúc.

**Luồng thay thế**  
2a. Gia sư nhấp trực tiếp vào một thẻ ca học cố định trên Thời khóa biểu:  
2a1. Hệ thống mở cửa sổ xem nhanh thông tin lớp học và học sinh tương ứng.  
2a2. Gia sư nhấp nút "Mở Buổi học thực tế hôm nay".  
2a3. Hệ thống điều hướng thẳng đến màn hình Chi tiết Buổi học N (UC-T05).  
Use Case kết thúc.

---

# PHẦN III: BẢNG TRUY XUẤT YÊU CẦU & MA TRẬN USE CASE (TRACEABILITY MATRIX)

Bảng tổng hợp đối chiếu toàn bộ Use Case Phân hệ Gia sư với mã Yêu cầu Chức năng (PRD FR) và các Luồng hành trình người dùng (User Journey):

| Mã Use Case | Tên Use Case | Tác nhân chính | Yêu cầu PRD tương ứng (PRD FR) | User Journey PRD |
| :--- | :--- | :---: | :---: | :---: |
| **UC-T01** | Nhận đề nghị ghép lớp & Xem thông tin liên hệ Phụ huynh | Gia sư | **FR-6**: Match Offer acceptance & Unlock contact | UJ-2 (Path 1) |
| **UC-T02** | Nhập lịch học thử & Chốt lịch dạy cố định hàng tuần | Gia sư | **FR-25, FR-29**: Schedule setup & Fixed ACTIVE status | UJ-2 |
| **UC-T03** | Nộp minh chứng phí QR Proof sau 30 ngày dạy | Gia sư | **FR-23**: Payment proof submission after 30 days | UJ-2 |
| **UC-T04** | Quản lý Khung chương trình học 2 cấp (Master Plan) | Gia sư | **FR-30**: Roadmap Master Plan (Dual-Mode Option A/B) | UJ-2 |
| **UC-T05** | Quản lý Buổi học thực tế & Nhật ký dạy học 3 bên | Gia sư | **FR-40**: Daily Sessions & Public Class Log Work (S3) | UJ-2 |
| **UC-T06** | Soạn & Giao Quiz trắc nghiệm | Gia sư | **FR-8, FR-9**: AI Split-Screen Workspace & Dual-Mode | UJ-2 (Core AI) |
| **UC-T07** | Xem báo cáo Student Knowledge Profile (SKP) & Private Notes | Gia sư | **FR-38, FR-21**: SKP Elo Rating & Private Notes | UJ-2, Glossary |
| **UC-T08** | Quản lý Thời khóa biểu cố định & Thẻ Rate Card gia sư | Gia sư | **FR-21, FR-25, FR-27**: Tutor Profile & Rate Card | UJ-2 |

---
*Tài liệu Đặc tả Use Case Phân hệ Gia sư được biên soạn chuẩn hóa theo PRD v1.6 và Kế hoạch triển khai dự án Học viện Công nghệ Bưu chính Viễn thông (PTIT).*
