# TÀI LIỆU ĐẶC TẢ USE CASE: PHÂN HỆ PHỤ HUYNH VÀ HỌC SINH
**Học viện Công nghệ Bưu chính Viễn thông (PTIT) - Đồ án Tốt nghiệp**  
**Đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition  

---

# PHẦN I: ĐẶC TẢ USE CASE PHÂN HỆ PHỤ HUYNH (TÀI KHOẢN KHÁCH - PARENT / GUEST)

---

### 1. UC - P01. Tìm kiếm gia sư qua biểu mẫu thông minh (Smart-Match Form)

**Mã Use Case**  
UC-P01

**Tên Use Case**  
Tìm kiếm gia sư qua biểu mẫu thông minh (Smart-Match Form)

**Mô tả**  
Cho phép phụ huynh chưa đăng nhập điền biểu mẫu đa bước (Smart-Match Form 4 bước) trên website bằng cách cung cấp thông tin học sinh, trình độ hiện tại, mục tiêu học tập, tiêu chí về gia sư (giới tính, mức học phí, phong cách giảng dạy) và lịch rảnh chi tiết từng ngày trong tuần. Sau bước xác nhận lại hồ sơ hoàn chỉnh, hệ thống gửi trực tiếp yêu cầu về trung tâm vận hành và hiển thị Popup thông báo tiếp nhận thành công. Chuyên viên trung tâm sẽ chủ động liên hệ lại phụ huynh trong vòng 12 giờ để tư vấn chọn gia sư phù hợp nhất cho con.

**Tác nhân**  
Phụ huynh (Khách truy cập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Phụ huynh có nhu cầu tìm gia sư tiếng Anh cho con và nhấp chọn "Tìm gia sư nhanh" hoặc "Đăng ký học thử" trên trang chủ website.

**Tiền điều kiện**  
Phụ huynh truy cập được website và chức năng Biểu mẫu thông minh (Smart-Match Form) đang hoạt động bình thường.

**Hậu điều kiện**  
Yêu cầu tìm gia sư được ghi nhận thành công trong hệ thống với trạng thái `PENDING` (Chờ tiếp nhận); phụ huynh nhận được Popup thông báo tiếp nhận thành công; trung tâm tiếp nhận thông tin để liên hệ tư vấn trong 12 giờ.

**Luồng chính**  
1. Phụ huynh nhấn nút "Đăng ký học thử" hoặc "Tìm gia sư nhanh" trên trang chủ website.
2. Hệ thống hiển thị biểu mẫu Smart-Match Form (Bước 1: Nhu cầu & Trình độ của học sinh).
3. Phụ huynh nhập/chọn thông tin học sinh (toàn bộ các ô chọn đều hỗ trợ dạng Combobox: vừa click chọn nhanh từ danh sách thả xuống, vừa có thể click trực tiếp vào ô để gõ nội dung tùy chỉnh):
   - Tên hoặc biệt danh của con (tùy chọn, mặc định hiển thị "Bé" nếu để trống).
   - Khối lớp / Độ tuổi (Tiểu học: Lớp 4-5, Lớp 6 - 9, THPT: Lớp 10-12, Đại học / Người đi làm... hoặc tự nhập).
   - Trình độ hiện tại (Mất gốc hoàn toàn, Trung bình, Khá, Foundation IELTS 4.0 - 5.0, Giao tiếp cơ bản... hoặc tự nhập).
   - Mục tiêu học tập ưu tiên hàng đầu (Lấy lại gốc & Tự tin nói, Thi chứng chỉ IELTS 6.0+, Luyện thi vào 10 / Đại học, Cải thiện điểm số... hoặc tự nhập).
4. Phụ huynh nhấn "Tiếp tục: Tiêu chí gia sư".
5. Hệ thống hiển thị Bước 2: Yêu cầu về Gia sư & Mức học phí.
6. Phụ huynh nhập/chọn các tiêu chí gia sư (hỗ trợ Combobox linh hoạt):
   - Mức học phí mong muốn theo buổi (Sinh viên giỏi: 150k - 200k, Cử nhân Sư phạm: 220k - 300k, Giảng viên / IELTS 8.0+: 350k - 500k... hoặc tự nhập ngân sách riêng).
   - Giới tính gia sư mong muốn (Bất kỳ, Gia sư Nữ, Gia sư Nam).
   - Phong cách / Tính cách gia sư ưu tiên (Kiên nhẫn & Ân cần, Nghiêm khắc & Kỷ luật, Trẻ trung & Truyền cảm hứng, Chuyên gia học thuật & Chiến thuật thi... hoặc tự nhập).
7. Phụ huynh nhấn "Tiếp tục: Lịch học & Liên hệ".
8. Hệ thống hiển thị Bước 3: Khung giờ rảnh linh hoạt & Thông tin liên hệ.
9. Phụ huynh thiết lập lịch học chi tiết:
   - Chọn số buổi học mong muốn trong tuần (2 buổi, 3 buổi, 4 buổi, 5 buổi/tuần).
   - Chọn các ngày rảnh trong tuần (Thứ 2 đến Chủ Nhật).
   - Với từng ngày được chọn, hệ thống cho phép cài đặt ca học riêng biệt độc lập (ví dụ: Thứ 2 học Tối, Thứ 7 học Sáng): Buổi Sáng (8h - 11h), Buổi Chiều (14h - 17h), Buổi Tối (19h - 21h30) hoặc chọn Tự nhập giờ cụ thể.
10. Phụ huynh nhập Họ và tên phụ huynh cùng Số điện thoại liên hệ.
11. Hệ thống tự động kiểm tra định dạng Số điện thoại chuẩn Việt Nam thời gian thực (đủ 10 chữ số, đúng đầu số các nhà mạng Viettel, Vina, Mobi, Vietnamobile: `03, 05, 07, 08, 09`).
12. Phụ huynh nhấn nút "Kiểm tra lại hồ sơ yêu cầu" (nút chỉ kích hoạt khi số điện thoại hợp lệ).
13. Hệ thống hiển thị Bước 4: Bản tóm tắt hồ sơ hoàn chỉnh (Profile Confirmation) tổng hợp toàn diện các thông tin:
    - Hồ sơ học sinh: Tên, khối lớp, trình độ hiện tại, mục tiêu học tập.
    - Tiêu chí gia sư & ngân sách: Giới tính gia sư, phong cách giảng dạy, mức học phí mong muốn.
    - Lịch học chi tiết: Số buổi/tuần và ca học cụ thể của từng ngày đã chọn.
    - Thông tin liên hệ: Họ tên phụ huynh và số điện thoại nhận tư vấn.
14. Phụ huynh rà soát lại thông tin và nhấn "Xác nhận & Gửi yêu cầu".
15. Hệ thống gửi hồ sơ về trung tâm, khởi tạo bản ghi yêu cầu ghép lớp (Match Request) ở trạng thái `PENDING`.
16. Hệ thống hiển thị Popup thông báo tiếp nhận thành công chuyên nghiệp (Dedicated Success Modal):
    - Biểu tượng thành công với hiệu ứng phát sáng nhẹ.
    - Huy hiệu căn giữa: "Tiếp nhận yêu cầu thành công".
    - Lời thông báo: "Trung tâm EnglishPath đã ghi nhận hồ sơ và sẽ liên hệ trực tiếp đến quý phụ huynh trong vòng 12 giờ để tư vấn chọn gia sư phù hợp nhất cho con."
    - Nút hành động: "Xác nhận".
17. Phụ huynh nhấn "Xác nhận", hệ thống đóng popup và tự động làm mới form dữ liệu. Use Case kết thúc.

**Luồng thay thế**  
3a. Phụ huynh muốn xem toàn bộ hồ sơ gia sư trên hệ thống thay vì điền biểu mẫu:  
3a1. Phụ huynh nhấn vào mục "Tìm gia sư" trên thanh điều hướng Header.  
3a2. Hệ thống chuyển hướng phụ huynh sang trang Khám phá gia sư (`/tutors`).  
Use Case kết thúc.

13a. Phụ huynh muốn chỉnh sửa thông tin khi đang xem bản tóm tắt hồ sơ (Bước 4):  
13a1. Phụ huynh nhấn nút "Quay lại" tại Bước 4.  
13a2. Hệ thống quay về các bước điền trước đó với toàn bộ thông tin đã nhập được giữ nguyên vẹn.  
13a3. Phụ huynh thực hiện chỉnh sửa và tiếp tục đến Bước 4.  
Use Case tiếp tục bước 14.

**Luồng ngoại lệ**  
10a. Phụ huynh để trống thông tin bắt buộc (Họ tên hoặc Số điện thoại):  
10a1. Nút "Kiểm tra lại hồ sơ yêu cầu" ở trạng thái bị vô hiệu hóa (disabled).  
10a2. Hệ thống hiển thị nhắc nhở người dùng hoàn thiện thông tin bắt buộc.  
10a3. Phụ huynh nhập đầy đủ thông tin hợp lệ.  
Use Case tiếp tục bước 11.  

11a. Số điện thoại nhập không đúng định dạng số điện thoại Việt Nam (chưa đủ 10 chữ số hoặc sai đầu số nhà mạng):  
11a1. Hệ thống hiển thị cảnh báo đỏ trực tiếp dưới ô nhập: "Số điện thoại không hợp lệ (cần đúng 10 chữ số)".  
11a2. Nút bấm tiếp tục bị vô hiệu hóa để ngăn chặn gửi dữ liệu sai sót.  
11a3. Phụ huynh điều chỉnh lại số điện thoại đúng chuẩn.  
11a4. Cảnh báo lỗi biến mất và nút bấm được kích hoạt trở lại.  
Use Case tiếp tục bước 12.

15a. Lỗi kết nối mạng hoặc lỗi máy chủ khi gửi hồ sơ:  
15a1. Hệ thống hiển thị thông báo lỗi: "Không thể gửi hồ sơ, vui lòng kiểm tra kết nối mạng và thử lại".  
15a2. Hệ thống giữ nguyên dữ liệu trong form để phụ huynh không phải nhập lại.  
15a3. Phụ huynh nhấn gửi lại khi đường truyền ổn định.

---

### 2. UC - P02. Khám phá, lọc danh sách gia sư và xem chi tiết hồ sơ gia sư

**Mã Use Case**  
UC-P02

**Tên Use Case**  
Khám phá, lọc danh sách gia sư và xem chi tiết hồ sơ gia sư

**Mô tả**  
Cho phép phụ huynh tra cứu danh sách toàn bộ gia sư tiếng Anh của trung tâm thông qua giao diện khám phá trực quan, sử dụng thanh công cụ lọc dạng dropdown tiện ích (lọc theo khu vực động 2 cấp Tỉnh/Thành phố ➔ Quận/Huyện, chuyên môn tiếng Anh trọng tâm như IELTS, TOEIC, Giao tiếp, Cấp 2, Cấp 3, Chuyên Anh, Foundation, cấp lớp học, hình thức học Online/Tại nhà, giới tính, đặc điểm nổi bật) và sắp xếp linh hoạt. Danh sách hiển thị theo chuẩn 6 gia sư/trang kèm phân trang. Thẻ gia sư tập trung vào năng lực thực chất (trường đại học, giới tính, học phí, chuyên môn nổi bật) và đã loại bỏ hoàn toàn các thông số sao rating, huy hiệu lịch rảnh hay số giờ dạy tích lũy. Trang chi tiết cung cấp hồ sơ năng lực toàn diện, phương pháp sư phạm, lịch rảnh tham khảo và nút "Liên hệ ngay" mở biểu mẫu đăng ký học trực tiếp.

**Tác nhân**  
Phụ huynh (Khách truy cập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Phụ huynh nhấn vào mục "Tìm gia sư" trên thanh điều hướng hoặc nhấn "Xem chi tiết" trên thẻ gia sư.

**Tiền điều kiện**  
Phụ huynh truy cập website và trang danh mục gia sư hoạt động bình thường.

**Hậu điều kiện**  
Phụ huynh nắm rõ thông tin chuyên môn tiếng Anh, bằng cấp chứng chỉ, phương pháp sư phạm và phản hồi thực tế của gia sư, sẵn sàng nhấn nút "Liên hệ ngay" để đăng ký học thử.

**Luồng chính**  
1. Phụ huynh truy cập trang Khám phá gia sư (`/tutors`).
2. Hệ thống hiển thị giao diện khám phá tinh gọn (đã lược bỏ thanh tìm kiếm lớn ở hero và chữ "Bộ lọc nhanh" để tối ưu không gian hiển thị), gồm bảng bộ lọc dropdown bên trái (Filter Sidebar) và lưới danh sách 6 gia sư/trang kèm phân trang (tab 1, 2, 3...).
3. Phụ huynh thiết lập các tiêu chí lọc thông qua các hộp chọn (Dropdown):
   - **Địa điểm động 2 cấp:** Chọn Tỉnh/Thành phố (Hà Nội, TP.HCM) ➔ Hộp chọn Quận/Huyện tự động cập nhật danh sách các quận/huyện tương ứng của thành phố đã chọn.
   - **Môn học / Chuyên môn tiếng Anh:** Chuyên biệt hóa 100% môn tiếng Anh (IELTS, TOEIC, Tiếng Anh Giao tiếp, Tiếng Anh THCS, Tiếng Anh THPT, Luyện thi Chuyên Anh, Ngữ pháp & Từ vựng, Phát âm chuẩn IPA, Tiếng Anh Mất gốc / Foundation).
   - **Cấp lớp học:** Lớp 1 - 12, Luyện thi Đại học, Người đi làm / Sinh viên.
   - **Hình thức học:** Online, Tại nhà.
   - **Giới tính & Điểm nổi bật:** Chọn gia sư Nam/Nữ, điểm nổi bật (Học sinh giỏi Quốc gia, Du học sinh, Thủ khoa, IELTS 8.0+...).
   - **Sắp xếp danh sách:** Phù hợp nhất, Học phí thấp đến cao, Học phí cao đến thấp, Mới nhất.
4. Hệ thống tự động lọc và cập nhật danh sách gia sư tương ứng theo thời gian thực (hỗ trợ dữ liệu kiểm thử mock data chuẩn cho cả Hà Nội và TP.HCM).
5. Mỗi thẻ gia sư (TutorCard) hiển thị: Ảnh đại diện/Initials, Họ tên, Trường đại học & chuyên ngành, Giới tính (hiển thị trực tiếp dưới tên trường), Mức học phí/buổi, Hình thức dạy, Địa bàn hoạt động và các thẻ chuyên môn/thành tích (đã loại bỏ hoàn toàn điểm đánh giá sao, huy hiệu rảnh/full lịch và số giờ dạy tích lũy).
6. Phụ huynh nhấn vào thẻ gia sư hoặc nút "Xem hồ sơ" để xem chi tiết.
7. Hệ thống chuyển hướng sang trang Hồ sơ chi tiết gia sư (`/tutors/:tutorId`) (đã lược bỏ breadcrumb mã lớp dài dòng để giao diện gọn gàng).
8. Hệ thống hiển thị đầy đủ thông tin:
   - Thông tin học vấn, trường đại học, giới tính, thành tích nổi bật.
   - Bằng cấp & Chứng chỉ quốc tế (IELTS 8.0 - 8.5, TESOL, Nghiệp vụ sư phạm) có xác thực từ trung tâm.
   - Triết lý & phương pháp giảng dạy, danh sách các lớp đã/đang phụ trách.
   - Khung giờ dạy có thể đáp ứng trong tuần (lịch rảnh tham khảo).
   - Nhận xét, phản hồi thực tế từ các học sinh/phụ huynh khóa trước.
9. Phụ huynh nhấn nút **"Liên hệ ngay"**.
10. Hệ thống mở biểu mẫu liên hệ / đăng ký học thử trực tiếp gắn kèm thông tin gia sư được chỉ định (chuyển sang Use Case UC-P03).

**Luồng thay thế**  
3a. Phụ huynh không chọn tiêu chí lọc nào:  
3a1. Hệ thống mặc định hiển thị danh sách gia sư tiêu biểu của trung tâm (6 gia sư/trang).  
Use Case tiếp tục bước 5.  

3b. Phụ huynh chuyển trang phân trang:  
3b1. Phụ huynh nhấn vào số trang 1, 2, 3...  
3b2. Hệ thống tải và hiển thị 6 gia sư của trang tương ứng.  
Use Case tiếp tục bước 5.

**Luồng ngoại lệ**  
4a. Không tìm thấy gia sư nào phù hợp với điều kiện lọc:  
4a1. Hệ thống hiển thị thông báo "Không tìm thấy gia sư phù hợp với tiêu chí lọc của bạn".  
4a2. Hệ thống hiển thị nút "Đặt lại bộ lọc" để phụ huynh khôi phục tìm kiếm.  
Use Case quay lại bước 3.

---

### 3. UC - P03. Đăng ký học thử & Liên hệ gia sư chỉ định (Direct Match Request)

**Mã Use Case**  
UC-P03

**Tên Use Case**  
Đăng ký học thử & Liên hệ gia sư chỉ định (Direct Match Request)

**Mô tả**  
Cho phép phụ huynh hoàn tất quy trình liên hệ và đăng ký một buổi học thử miễn phí cho con với gia sư tiếng Anh cụ thể ngay trên trang hồ sơ gia sư thông qua cửa sổ tương tác chuyên dụng (`HireTutorModal`). Biểu mẫu thu thập đầy đủ nhu cầu học tập (tên học sinh, lớp, trình độ hiện tại, mục tiêu), hình thức học (Online hoặc Tại nhà kèm địa chỉ), công cụ chọn lịch học trực quan theo 2 bước (Chọn Thứ ➔ Chọn Buổi: Sáng, Chiều, Tối không cần giờ chi tiết) và thông tin phụ huynh. Số điện thoại phụ huynh được xác thực thời gian thực theo định dạng chuẩn số điện thoại Việt Nam (10 chữ số). Sau khi gửi thành công, hệ thống thông báo tức thời và ghi nhận yêu cầu ghép lớp ở trạng thái `PENDING` để chuyên viên trung tâm điều phối, liên hệ tư vấn.

**Tác nhân**  
Phụ huynh (Khách truy cập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Phụ huynh nhấn nút "Liên hệ ngay" trên trang chi tiết hồ sơ gia sư (`/tutors/:tutorId`).

**Tiền điều kiện**  
Phụ huynh đang ở trang chi tiết gia sư và nhấn nút "Liên hệ ngay".

**Hậu điều kiện**  
Yêu cầu học thử được hệ thống ghi nhận thành công với trạng thái `PENDING`, hiển thị màn hình thông báo xác nhận thành công và phụ huynh hoàn tất quy trình.

**Luồng chính**  
1. Phụ huynh nhấn nút **"Liên hệ ngay"** trên trang hồ sơ gia sư.
2. Hệ thống mở cửa sổ Modal liên hệ (`HireTutorModal`) hiển thị thẻ tóm tắt gia sư (Tên, Trường đại học, Giới tính, Học phí/buổi).
3. Phụ huynh điền **Phần 1: Thông tin học sinh & Nhu cầu học tập**:
   - Nhập Tên học sinh (*Bắt buộc*).
   - Chọn Lớp học (*Bắt buộc* - Dropdown từ Lớp 1 - 12, Luyện thi ĐH, Người đi làm).
   - Chọn Trình độ hiện tại (*Bắt buộc* - Mất gốc, Cơ bản, Khá, Giỏi, Đang luyện thi chứng chỉ).
   - Chọn Mục tiêu học tập (*Bắt buộc* - Lấy lại gốc, Ôn thi vào 10, ĐH 8.5+, IELTS, TOEIC, Phát âm IPA...).
   - **Thiết lập Lịch học mong muốn:**
     - Phụ huynh xem danh sách thẻ lịch đã chọn (mặc định hoặc đã thêm).
     - Phụ huynh nhấn nút **"+ Thêm lịch"** để mở bảng chọn lịch tương tác.
     - **Bước 1 (Chọn thứ):** Phụ huynh bấm chọn thứ trong tuần (`Thứ 2` đến `Chủ Nhật`).
     - **Bước 2 (Chọn buổi):** Hệ thống hiển thị 3 lựa chọn buổi học: `Buổi Sáng`, `Buổi Chiều`, `Buổi Tối` (không cần chọn giờ chi tiết).
     - Phụ huynh chọn buổi, hệ thống tạo nhãn thẻ lịch tương ứng (Ví dụ: `Thứ 2 - Buổi Tối`). Phụ huynh có thể nhấn nút `X` trên từng thẻ để xóa lịch không mong muốn.
     - Phụ huynh nhấn nút **"Xong"** để thu gọn bảng chọn lịch.
   - **Chọn Hình thức học:** Chọn `Online` hoặc `Tại nhà`. Nếu chọn `Tại nhà`, hệ thống hiển thị thêm ô nhập Địa chỉ nhà học sinh.
4. Phụ huynh điền **Phần 2: Thông tin phụ huynh liên hệ**:
   - Nhập Tên phụ huynh (*Bắt buộc*).
   - Nhập Số điện thoại / Zalo phụ huynh (*Bắt buộc*).
   - Hệ thống tự động kiểm tra định dạng Số điện thoại Việt Nam thời gian thực (chuẩn 10 chữ số, đầu số hợp lệ `03, 05, 07, 08, 09` hoặc `+84/84`).
     - Nếu đúng: Viền xanh (`border-emerald-500`) kèm icon tích xanh `✓`.
     - Nếu sai: Viền đỏ (`border-rose-500`) kèm thông báo lỗi *"Vui lòng nhập đúng số điện thoại."*.
   - Nhập Ghi chú thêm gửi riêng cho gia sư (tùy chọn).
5. Phụ huynh xem thông tin cam kết học thử 01 buổi miễn phí và nhấn nút **"Gửi thông tin liên hệ"**.
6. Hệ thống kiểm tra tính hợp lệ của biểu mẫu (các trường bắt buộc đã điền và số điện thoại đúng chuẩn):
   - Tạo bản ghi yêu cầu ghép lớp (Match Request) trạng thái `PENDING` kèm thông tin học sinh, lịch học, phụ huynh và mã gia sư chỉ định (`tutorId`).
7. Hệ thống chuyển sang màn hình thành công (Success Screen):
   - Hiển thị icon tích xanh thành công.
   - Tiêu đề: "Gửi yêu cầu liên hệ thành công!".
   - Thông điệp: "Yêu cầu đã được gửi đến gia sư [Tên gia sư]".
   - Nút hành động: "Hoàn tất".
8. Phụ huynh nhấn **"Hoàn tất"** để đóng modal và quay lại trang hồ sơ gia sư. Use Case kết thúc.

**Luồng thay thế**  
3a. Phụ huynh muốn hủy bỏ thao tác đăng ký:  
3a1. Phụ huynh nhấn nút `X` ở góc trên bên phải modal.  
3a2. Hệ thống đóng modal và giữ nguyên trang chi tiết gia sư.  
Use Case kết thúc.

**Luồng ngoại lệ**  
4a. Phụ huynh nhập số điện thoại chưa đúng định dạng:  
4a1. Hệ thống hiển thị viền đỏ và dòng thông báo *"Vui lòng nhập đúng số điện thoại."*.  
4a2. Nút "Gửi thông tin liên hệ" từ chối submit biểu mẫu.  
4a3. Phụ huynh sửa lại số điện thoại đúng 10 chữ số.  
Use Case tiếp tục bước 5.

6a. Phụ huynh bỏ trống các trường bắt buộc (Tên học sinh, Tên phụ huynh, Số điện thoại):  
6a1. Trình duyệt và hệ thống cảnh báo yêu cầu điền đầy đủ thông tin bắt buộc.  
Use Case quay lại bước 3 hoặc 4.

---

### 4. UC - P04. Tra cứu thông tin trung tâm, cẩm nang Phụ huynh - Gia sư và câu hỏi thường gặp (FAQ)

**Mã Use Case**  
UC-P04

**Tên Use Case**  
Tra cứu thông tin trung tâm, cẩm nang Phụ huynh - Gia sư và câu hỏi thường gặp (FAQ)

**Mô tả**  
Cho phép phụ huynh và gia sư tra cứu các thông tin vận hành cốt lõi, chính sách bảo vệ quyền lợi, quy trình học thử miễn phí, cách thức nhận lớp, tính phí minh bạch và giải đáp toàn diện các thắc mắc thông qua hệ thống Câu hỏi thường gặp (FAQ) và hai cẩm nang tri thức chuyên biệt: **"Phụ huynh cần biết"** (6 chủ đề) và **"Gia sư cần biết"** (9 chủ đề). Hệ thống loại bỏ bảng giá cố định trên trang chủ để tập trung vào cơ chế học phí linh hoạt theo năng lực và nhu cầu thực tế; mỗi chủ đề được thiết kế trực quan thành các mục nhỏ, khi nhấn vào sẽ hiển thị Popup Modal xem nội dung chi tiết.

**Tác nhân**  
Phụ huynh học sinh, Gia sư (Khách truy cập)

**Độ ưu tiên**  
Trung bình

**Sự kiện kích hoạt**  
Người dùng nhấp vào mục "Hỏi đáp & Cần biết" hoặc liên kết "FAQ" trên thanh điều hướng hoặc chân trang website.

**Tiền điều kiện**  
Người dùng truy cập vào website trung tâm và khu vực FAQ / Cẩm nang thông tin hoạt động bình thường.

**Hậu điều kiện**  
Phụ huynh và gia sư nắm vững quy trình tìm gia sư, điều kiện nhận lớp, chính sách học phí, tài khoản ngân hàng ký quỹ an toàn và quy chế hoạt động của trung tâm EnglishPath.

**Luồng chính**  
1. Người dùng chọn mục "Hỏi đáp & Cần biết" (`/faq`) trên thanh menu Header hoặc cuộn đến phần FAQ tại trang chủ.
2. Hệ thống hiển thị giao diện Trung tâm Hỏi đáp & Cẩm nang Tri thức gồm:
   - **Thanh chuyển đổi danh mục linh hoạt:**
     - Tab 1:**Phụ huynh học sinh cần biết** (6 chủ đề chuyên sâu).
     - Tab 2:**Gia sư cần biết** (9 chủ đề quy chế & vận hành).
     - Tab 3:**Câu hỏi thường gặp (FAQ nhanh)** (Học phí, đổi gia sư REMATCH, công nghệ AI & Spaced Repetition).
3. Hệ thống hiển thị danh sách các thẻ chủ đề nhỏ gọn, hiện đại (gồm số thứ tự, biểu tượng nhận diện, tiêu đề câu hỏi và tóm tắt ngắn).
4. Người dùng nhấp vào một mục bất kỳ mà mình quan tâm.
5. Hệ thống hiển thị **Popup Modal chi tiết (KnowledgeDetailModal)**:
   - Huy hiệu phân hệ (Phụ huynh học sinh cần biết / Gia sư cần biết) và số thứ tự mục.
   - Tiêu đề đầy đủ của câu hỏi/chủ đề.
   - Nội dung chi tiết chuẩn hóa theo thương hiệu EnglishPath (giải thích minh bạch, các bước thực hiện, thông tin tài khoản chuyển khoản Techcombank chính thức của trung tâm, cảnh báo an toàn...).
   - Nút hành động liên quan (Ví dụ: "Đăng ký học thử ngay" đối với phụ huynh hoặc "Đăng ký nhận lớp" đối với gia sư) và nút "Đóng".
6. Người dùng đọc xong và bấm nút Đóng (hoặc phím ESC, click ra ngoài màn hình mờ) để đóng Popup.
7. Tại tab "Câu hỏi thường gặp", người dùng có thể nhấp trực tiếp vào từng câu hỏi để xem bung mở nhanh dạng Accordion. Use Case kết thúc.

**Luồng thay thế**  
2a. Người dùng muốn chuyển đổi nhanh giữa cẩm nang Phụ huynh và Gia sư:  
2a1. Người dùng bấm chọn tab danh mục tương ứng.  
2a2. Hệ thống cập nhật danh sách các thẻ mục nhỏ tương ứng mượt mà không cần tải lại trang.  
Use Case tiếp tục bước 3.

4a. Người dùng từ Popup chi tiết muốn thực hiện hành động liên quan ngay:  
4a1. Người dùng nhấn nút "Đăng ký tìm gia sư ngay" trong Popup cẩm nang phụ huynh.  
4a2. Hệ thống đóng popup và mở biểu mẫu Smart-Match Form (UC-P01).  
Use Case kết thúc.

**Luồng ngoại lệ**  
5a. Trình duyệt gặp sự cố hiển thị nội dung:  
5a1. Hệ thống hỗ trợ xem nội dung dự phòng hoặc hiển thị số Hotline 1900 6868 để phụ huynh/gia sư gọi điện thoại trực tiếp.  
Use Case kết thúc.

---

### 5. UC - P05. Tra cứu tiến độ và kết quả học tập định lượng của con (Parent Progress View) *(Tạm ẩn trên giao diện - Triển khai sau)*

**Mã Use Case**  
UC-P05

**Tên Use Case**  
Tra cứu tiến độ và kết quả học tập định lượng của con (Parent Progress View) *(Tạm ẩn trên giao diện)*

**Mô tả**  
Cung cấp cổng thông tin minh bạch dành riêng cho phụ huynh để tra cứu mức độ chăm chỉ (tỷ lệ hoàn thành bài tập về nhà, chuỗi ngày ôn tập) và sự tăng trưởng thực chất về năng lực học tập của con (điểm Elo Rating theo micro-skills, điểm kiểm tra định kỳ) mà không cần đăng nhập tài khoản phức tạp, chỉ cần nhập số điện thoại hoặc mã tra cứu học sinh.

**Tác nhân**  
Phụ huynh (Người chi trả dịch vụ)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Phụ huynh nhấp vào liên kết "Phụ huynh theo dõi" (`/parent-view`) trên thanh điều hướng hoặc truy cập từ đường link SMS do trung tâm gửi định kỳ.

**Tiền điều kiện**  
Học sinh đã có lớp học chính thức đang hoạt động (`ACTIVE`) trong hệ thống và đã phát sinh dữ liệu làm bài tập / kiểm tra.

**Hậu điều kiện**  
Phụ huynh xem được các biểu đồ định lượng và nhận xét chuyên môn từ gia sư về tiến độ của con.

**Luồng chính**  
1. Phụ huynh truy cập trang "Phụ huynh theo dõi tiến độ" (`/parent-view`).
2. Hệ thống hiển thị ô tra cứu nhanh kèm hướng dẫn: "Nhập số điện thoại phụ huynh đăng ký hoặc mã học sinh".
3. Phụ huynh nhập số điện thoại đã đăng ký với trung tâm và nhấn "Tra cứu".
4. Hệ thống kiểm tra và đối chiếu thông tin trong cơ sở dữ liệu.
5. Hệ thống tìm thấy thông tin học sinh liên kết và hiển thị Dashboard báo cáo tiến độ gồm:
   - **Thông tin học sinh & lớp học:** Tên con, khối lớp, trình độ khởi điểm, mục tiêu học tập, gia sư phụ trách.
   - **Chỉ số Chăm chỉ & Nề nếp học tập (Effort Metrics):**
     - Tỷ lệ nộp bài tập về nhà (`PRACTICE`) đúng hạn (%).
     - Chuỗi ngày tự giác ôn tập Spaced Repetition liên tục (Streak ngày).
     - Tỷ lệ hoàn thành khối lượng bài luyện tập được giao trong tuần.
   - **Chỉ số Tăng trưởng Năng lực (Mastery Growth Metrics):**
     - Điểm tinh thông tổng thể (**Overall Elo Rating** / 100).
     - Điểm bài kiểm tra định kỳ gần nhất so với điểm khởi điểm (Baseline).
     - Biểu đồ tăng trưởng các kỹ năng thành phần.
   - **Phân tích Điểm mạnh & Điểm yếu:** Top kỹ năng con tiếp thu tốt và các dạng lỗi sai gia sư đang tập trung khắc phục cho con.
   - **Nhận xét định kỳ từ Gia sư:** Lời nhắn gửi thực tế từ gia sư về thái độ học tập và lưu ý dành cho gia đình.
6. Phụ huynh theo dõi chi tiết và có thể lưu ảnh hoặc đóng màn hình tra cứu.

**Luồng thay thế**  
3a. Một số điện thoại phụ huynh đăng ký cho từ 2 con trở lên học tại trung tâm:  
3a1. Hệ thống hiển thị danh sách các con tương ứng với số điện thoại.  
3a2. Phụ huynh nhấp chọn người con muốn xem báo cáo.  
Use Case tiếp tục bước 5.

**Luồng ngoại lệ**  
4a. Không tìm thấy dữ liệu ứng với số điện thoại tra cứu:  
4a1. Hệ thống thông báo: "Không tìm thấy hồ sơ học sinh liên kết với số điện thoại này. Vui lòng kiểm tra lại số điện thoại hoặc liên hệ bộ phận CSKH".  
4a2. Phụ huynh nhập lại số điện thoại chính xác.  
Use Case quay lại bước 3.

---

### 6. UC - P06. Gửi yêu cầu đổi gia sư (Rematch) hoặc khiếu nại chất lượng *(Tạm ẩn trên giao diện - Triển khai sau)*

**Mã Use Case**  
UC-P06

**Tên Use Case**  
Gửi yêu cầu đổi gia sư (Rematch) hoặc khiếu nại chất lượng *(Tạm ẩn trên giao diện)*

**Mô tả**  
Cho phép phụ huynh gửi yêu cầu đổi gia sư khác (`REMATCH`) khi nhận thấy tính cách hoặc phương pháp giảng dạy của gia sư không phù hợp với con sau buổi học thử hoặc trong quá trình học chính thức, hoặc gửi khiếu nại về chất lượng dịch vụ tới Lễ tân / Quản trị viên để được hỗ trợ giải quyết kịp thời.

**Tác nhân**  
Phụ huynh

**Độ ưu tiên**  
Trung bình

**Sự kiện kích hoạt**  
Phụ huynh không hài lòng về gia sư hiện tại hoặc có sự cố phát sinh cần trung tâm can thiệp giải quyết.

**Tiền điều kiện**  
Lớp học của con đã được tạo liên kết trên hệ thống và chức năng tiếp nhận khiếu nại đang hoạt động.

**Hậu điều kiện**  
Đơn khiếu nại / yêu cầu REMATCH được ghi nhận vào hệ thống quản lý khiếu nại của Lễ tân (`Complaint Management`) ở trạng thái `Chưa xử lý`.

**Luồng chính**  
1. Phụ huynh truy cập trang Liên hệ / Phản ánh dịch vụ hoặc mục Khiếu nại trên cổng phụ huynh.
2. Hệ thống hiển thị biểu mẫu "Gửi yêu cầu hỗ trợ & Khiếu nại".
3. Phụ huynh nhập thông tin xác nhận: Họ tên phụ huynh, Số điện thoại, Tên học sinh, Mã lớp học (nếu có).
4. Phụ huynh chọn loại yêu cầu:
   - `REMATCH`: Yêu cầu đổi gia sư khác (Học sinh không hợp phong cách, lịch dạy không khớp...).
   - `FEEDBACK_QUALITY`: Phản ánh chất lượng giảng dạy hoặc thái độ của gia sư.
   - `SCHEDULE_ISSUE`: Khiếu nại về lịch dạy hoặc gia sư báo nghỉ nhiều lần.
5. Phụ huynh nhập nội dung chi tiết lý do và mong muốn cụ thể (ví dụ: cần đổi sang gia sư nữ kiên nhẫn hơn, điều chỉnh giờ học...).
6. Phụ huynh chọn "Gửi khiếu nại".
7. Hệ thống kiểm tra tính hợp lệ của thông tin được nhập.
8. Hệ thống tạo bản ghi khiếu nại trong cơ sở dữ liệu (`Complaint Ticket`) với trạng thái `Chưa xử lý` và chuyển thông báo tới màn hình làm việc của Lễ tân và Quản trị viên.
9. Hệ thống hiển thị thông báo xác nhận: "Trung tâm đã tiếp nhận phản ánh của quý phụ huynh. Bộ phận chăm sóc khách hàng sẽ liên hệ lại qua điện thoại trong vòng 4 giờ làm việc để giải quyết".
10. Phụ huynh xác nhận và hoàn tất gửi phản ánh.

**Luồng thay thế**  
4a. Phụ huynh yêu cầu đổi gia sư và đã chọn trước được một gia sư ưng ý trên website:  
4a1. Phụ huynh nhập mã hoặc tên gia sư mong muốn chuyển sang tại ô "Gia sư đề xuất (nếu có)".  
4a2. Hệ thống ghi nhận thêm thông tin gia sư đích vào đơn REMATCH.  
Use Case tiếp tục bước 5.

**Luồng ngoại lệ**  
7a. Phụ huynh để trống nội dung chi tiết lý do khiếu nại:  
7a1. Hệ thống hiển thị thông báo lỗi "Vui lòng nhập chi tiết lý do khiếu nại để trung tâm có căn cứ xử lý".  
7a2. Phụ huynh bổ sung nội dung mô tả.  
7a3. Hệ thống kiểm tra lại thông tin.  
Use Case tiếp tục bước 6.  

8a. Không thể ghi nhận hoặc lưu trữ yêu cầu khiếu nại do lỗi hệ thống:  
8a1. Hệ thống thông báo: "Không thể gửi yêu cầu lúc này. Vui lòng thử lại sau hoặc gọi hotline khẩn cấp 1900-xxxx".  
8a2. Yêu cầu khiếu nại không được ghi nhận.  
Use Case kết thúc.

---
---

# PHẦN II: ĐẶC TẢ USE CASE PHÂN HỆ HỌC SINH (NGƯỜI HỌC TRONG HỆ THỐNG - STUDENT)

---

### 7. UC - S01. Xem bảng điều khiển và lịch học cá nhân (Student Dashboard)

**Mã Use Case**  
UC-S01

**Tên Use Case**  
Xem bảng điều khiển và lịch học cá nhân (Student Dashboard)

**Mô tả**  
Cung cấp màn hình trung tâm sau khi học sinh đăng nhập, hiển thị tổng quan tình trạng các buổi học sắp tới trong tuần, danh sách các gia sư đang ghép đôi, cảnh báo số lượng bài tập cần làm, widget nhắc nhở phiên ôn tập ngắt quãng Spaced Repetition hôm nay và liên kết tham gia phòng học trực tuyến (Meet/Zoom).

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Học sinh đăng nhập thành công vào hệ thống hoặc nhấp chuyển về trang chủ học sinh (`/student`).

**Tiền điều kiện**  
Học sinh có tài khoản hợp lệ với vai trò `student` và đã đăng nhập thành công.

**Hậu điều kiện**  
Học sinh nắm bắt đầy đủ kế hoạch học tập trong ngày/tuần và các nhiệm vụ học tập cần hoàn thành.

**Luồng chính**  
1. Học sinh truy cập trang Bảng điều khiển (`/student` hoặc `/dashboard`).
2. Hệ thống kiểm tra phiên đăng nhập JWT hợp lệ và truy xuất dữ liệu của học sinh từ cơ sở dữ liệu.
3. Hệ thống hiển thị giao diện Bảng điều khiển gồm:
   - **Thanh chỉ số nhanh (Metrics Bar):** Số gia sư đang học cùng, tổng số buổi học trong tuần, số lượng bài tập còn hạn cần nộp, số câu hỏi ôn tập ngắt quãng đến hạn hôm nay.
   - **Widget Ôn tập Ngắt quãng (Spaced Repetition SM-2):** Hiển thị chuỗi ngày học liên tục (Streak), số câu hỏi cần ôn trong ngày và nút kích hoạt nhanh *"Bắt đầu ôn 5 phút ngay"*.
   - **Banner Lộ trình Học Cá nhân hóa AI:** Tóm tắt tiến độ các giai đoạn học tập và nút xem chi tiết lộ trình.
   - **Danh sách Gia sư Cá nhân:** Thẻ thông tin từng gia sư đang dạy (môn phụ trách, ngày giờ buổi học tiếp theo, nút vào phòng học trực tuyến, hộp thư trao đổi).
   - **Thời khóa biểu tuần:** Lịch học chi tiết từng ngày, trạng thái buổi học (*Sắp tới, Đang diễn ra LIVE, Đã hoàn thành*).
   - **Danh sách bài tập cần làm gấp:** Hiển thị các bài tập đến hạn nộp gần nhất kèm nhãn phân loại bài Luyện tập (`PRACTICE`) hay Kiểm tra (`ASSESSMENT`).
4. Học sinh nhấn vào một tác vụ mong muốn (ví dụ: làm bài tập, vào phòng học trực tuyến hoặc bắt đầu ôn tập SM-2).
5. Hệ thống điều hướng học sinh đến màn hình chức năng tương ứng.

**Luồng thay thế**  
3a. Học sinh có buổi học đang ở trạng thái LIVE (Đang diễn ra):  
3a1. Thẻ buổi học hiển thị hiệu ứng viền đỏ nhấp nháy nổi bật và nút "Vào phòng học ngay".  
3a2. Học sinh nhấn "Vào phòng học ngay".  
3a3. Hệ thống mở liên kết phòng học trực tuyến (Meet/Zoom) trong một tab mới.  
Use Case kết thúc.

**Luồng ngoại lệ**  
2a. Phiên đăng nhập JWT của học sinh đã hết hạn:  
2a1. Hệ thống tự động chuyển hướng người dùng về trang Đăng nhập (`/login`) kèm thông báo "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại".  
2a2. Người dùng thực hiện đăng nhập lại.  
Use Case kết thúc.

---

### 8. UC - S02. Làm bài tập trực tuyến chế độ Luyện tập có phản hồi AI tức thì (Practice Mode)

**Mã Use Case**  
UC-S02

**Tên Use Case**  
Làm bài tập trực tuyến chế độ Luyện tập có phản hồi AI tức thì (Practice Mode)

**Mô tả**  
Cho phép học sinh thực hiện các bài luyện tập (`PRACTICE`) do gia sư giao hoặc hệ thống tạo tự động dựa trên SKP. Bài tập hỗ trợ 4 định dạng chuẩn (Trắc nghiệm, Điền từ, Sửa lỗi sai, Viết lại câu). Ở chế độ này (Per-question mode), sau khi học sinh làm từng câu hỏi và bấm "Kiểm tra câu này", hệ thống phản hồi đúng/sai tức thì và tự động hiển thị hộp thoại Lời giải thích chi tiết AI (AI Explanation) bao gồm quy tắc ngữ pháp, phân tích tại sao đáp án đúng và chỉ ra bẫy sai thường gặp.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Học sinh chọn một bài tập có nhãn `PRACTICE` trong danh sách bài tập (`/student/exercises`).

**Tiền điều kiện**  
Học sinh đã đăng nhập và bài tập đang ở trạng thái chưa hoàn thành (`assigned`).

**Hậu điều kiện**  
Kết quả làm bài từng câu được ghi nhận; điểm tinh thông micro-skill tương ứng trong Hồ sơ tri thức (SKP) được cập nhật theo thuật toán Elo Rating; bài tập chuyển sang trạng thái đã hoàn thành.

**Luồng chính**  
1. Học sinh chọn bài tập luyện tập từ danh sách bài tập.
2. Hệ thống tải nội dung bài tập và hiển thị giao diện làm bài ở chế độ **Luyện tập (Per-question mode)**.
3. Hệ thống hiển thị thanh thông tin: Tiêu đề bài, Kỹ năng trọng tâm, Độ khó, Gia sư giao bài và Huy hiệu `PRACTICE MODE`.
4. Học sinh đọc câu hỏi thứ nhất (thuộc 1 trong 4 định dạng):
   - *Dạng 1 (Trắc nghiệm MCQ):* Chọn 1 trong 4 đáp án A/B/C/D.
   - *Dạng 2 (Điền từ Fill-in):* Nhập từ vựng/giới từ/dạng động từ chính xác vào ô input.
   - *Dạng 3 (Sửa lỗi sai):* Nhập từ cần sửa đúng vào ô thay thế.
   - *Dạng 4 (Viết lại câu):* Nhập câu hoàn chỉnh bắt đầu bằng từ gợi ý cho trước.
5. Học sinh nhấn nút "Kiểm tra câu này & Xem giải thích AI".
6. Hệ thống đối chiếu câu trả lời với đáp án chuẩn:
   - Nếu đúng: Hiển thị nhãn xanh "✓ Chính xác".
   - Nếu sai: Hiển thị nhãn đỏ "✗ Chưa chính xác" và hiển thị đáp án chuẩn.
7. Hệ thống tự động mở rộng hộp thoại **"Lời Giải Thích Chi Tiết AI (AI Explanation)"** bên dưới câu hỏi:
   - *Quy tắc ngữ pháp / Kiến thức trọng tâm:* Trình bày công thức, cấu trúc câu hoặc ngữ nghĩa collocation.
   - *Vì sao đáp án này đúng:* Phân tích ngữ cảnh câu và dấu hiệu nhận biết.
   - *Phân tích bẫy sai:* Giải thích lý do vì sao các phương án khác lại sai và lỗi tư duy học sinh hay mắc.
8. Hệ thống tự động ghi nhận kết quả và tính toán lại điểm `mastery_score` cho micro-skill tương ứng trong SKP theo công thức Elo Rating.
9. Học sinh tiếp tục thực hiện tương tự cho các câu hỏi tiếp theo từ bước 4 đến bước 8.
10. Sau khi hoàn thành toàn bộ các câu hỏi trong bài, học sinh nhấn "Hoàn tất buổi luyện tập & Trở về".
11. Hệ thống cập nhật trạng thái bài tập thành đã hoàn thành (`submitted`) và cập nhật chỉ số chăm chỉ của học sinh.

**Luồng thay thế**  
7a. Học sinh muốn thu gọn hoặc mở lại hộp thoại Lời giải thích AI để đọc lại:  
7a1. Học sinh nhấn vào thanh tiêu đề "Lời Giải Thích Chi Tiết AI".  
7a2. Hộp thoại thu gọn hoặc bung mở linh hoạt.  
Use Case tiếp tục bước 9.

**Luồng ngoại lệ**  
5a. Học sinh nhấn nút kiểm tra khi chưa nhập hoặc chọn câu trả lời:  
5a1. Hệ thống hiển thị cảnh báo: "Vui lòng chọn hoặc nhập câu trả lời trước khi kiểm tra".  
5a2. Học sinh nhập câu trả lời.  
Use Case quay lại bước 5.

---

### 9. UC - S03. Làm bài kiểm tra năng lực định kỳ chế độ Nộp toàn bài (Assessment Mode)

**Mã Use Case**  
UC-S03

**Tên Use Case**  
Làm bài kiểm tra năng lực định kỳ chế độ Nộp toàn bài (Assessment Mode)

**Mô tả**  
Cho phép học sinh làm các bài kiểm tra năng lực định kỳ hoặc bài Placement Test đầu vào (`ASSESSMENT`). Khác với bài luyện tập, chế độ Kiểm tra (Submit-all mode) có đồng hồ đếm ngược thời gian, không hiển thị đáp án hay giải thích trong lúc làm bài. Chỉ sau khi học sinh nhấn "Nộp toàn bộ bài kiểm tra", hệ thống mới tự động chấm điểm toàn diện, hiển thị bảng tổng kết điểm số, cập nhật điểm Elo Rating và cung cấp danh sách review chi tiết từng câu kèm Lời giải thích AI.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Học sinh chọn bài kiểm tra năng lực hoặc bài đánh giá đầu vào Placement Test trong danh sách bài tập.

**Tiền điều kiện**  
Học sinh đã đăng nhập và bài kiểm tra đang mở quyền làm bài.

**Hậu điều kiện**  
Bài kiểm tra được chấm điểm tức thì; bảng điểm tổng kết (Scorecard) và lịch sử làm bài được lưu; điểm Elo Rating toàn diện được cập nhật; gia sư nhận được thông báo kết quả bài nộp.

**Luồng chính**  
1. Học sinh truy cập bài kiểm tra từ danh sách bài tập hoặc thông báo.
2. Hệ thống tải bộ câu hỏi kiểm tra và kích hoạt đồng hồ đếm ngược thời gian làm bài (ví dụ: 15 phút cho Mini-test / Placement test).
3. Hệ thống hiển thị huy hiệu `ASSESSMENT MODE` và danh sách toàn bộ các câu hỏi thuộc 4 định dạng chuẩn (MCQ, Điền từ, Sửa lỗi sai, Viết lại câu).
4. Học sinh lần lượt hoàn thành các câu hỏi mà không nhận được gợi ý hay phản hồi đúng/sai tức thì.
5. Thanh điều khiển ghim dưới màn hình hiển thị số lượng câu đã làm (ví dụ: 4/4 câu).
6. Học sinh kiểm tra lại bài và nhấn nút "Nộp Toàn Bộ Bài Kiểm Tra".
7. Hệ thống hiển thị hộp thoại xác nhận: "Bạn có chắc chắn muốn nộp bài? Bài làm sẽ được chấm điểm ngay".
8. Học sinh xác nhận nộp bài.
9. Hệ thống tự động chấm điểm toàn bộ bài làm trong thời gian dưới 1 giây.
10. Hệ thống hiển thị Card Kết Quả Kiểm Tra Năng Lực (Scorecard):
    - Tổng điểm đạt được trên thang điểm 10 (ví dụ: 8/10).
    - Số câu đúng/sai và tỷ lệ phần trăm (%).
    - Chỉ số biến động năng lực Elo Rating (ví dụ: `+6 Điểm Elo`).
11. Bên dưới Scorecard, hệ thống hiển thị danh sách review từng câu hỏi với huy hiệu Đúng/Sai rõ ràng và bung toàn bộ Lời giải thích chi tiết AI cho từng câu.
12. Kết quả bài kiểm tra được tự động lưu vào Lịch sử điểm kiểm tra và cập nhật vào Biểu đồ Tăng trưởng Năng lực.

**Luồng thay thế**  
4a. Đồng hồ đếm ngược về 00:00 trước khi học sinh bấm nộp bài:  
4a1. Hệ thống tự động khóa quyền chỉnh sửa các câu trả lời.  
4a2. Hệ thống hiển thị thông báo "Hết giờ làm bài! Hệ thống đang tự động nộp bài của bạn".  
4a3. Hệ thống tự động thu thập các câu đã làm và chuyển tiếp sang bước 9.  

10a. Đối với bài khảo sát đầu vào Placement Test:  
10a1. Sau khi hiển thị Scorecard, hệ thống tự động điều hướng kết quả về khung chat với gia sư (`/student/chat`).  
10a2. Hệ thống sinh lộ trình học cá nhân hóa 3 giai đoạn dựa trên kết quả bài test.  
Use Case kết thúc.

**Luồng ngoại lệ**  
8a. Mất kết nối internet khi đang bấm nộp bài:  
8a1. Hệ thống lưu tạm các câu trả lời vào bộ nhớ LocalStorage của trình duyệt và hiển thị thông báo "Mất kết nối mạng. Đang tự động thử kết nối lại...".  
8a2. Khi có mạng trở lại, hệ thống tự động hoàn tất quá trình nộp bài.  
Use Case tiếp tục bước 9.

---

### 10. UC - S04. Thực hiện phiên ôn tập kiến thức ngắt quãng 5 phút hàng ngày (Spaced Repetition SM-2 Session)

**Mã Use Case**  
UC-S04

**Tên Use Case**  
Thực hiện phiên ôn tập kiến thức ngắt quãng 5 phút hàng ngày (Spaced Repetition SM-2 Session)

**Mô tả**  
Cung cấp phiên ôn tập ngắt quãng nhanh (5 phút) mỗi ngày dựa trên thuật toán SM-2. Hệ thống tự động truy xuất các câu hỏi / kiến thức sắp quên đã đến hạn ôn tập (`next_review`). Học sinh xem câu hỏi, lật mở đáp án kèm Lời giải thích AI, sau đó tự đánh giá mức độ ghi nhớ qua 4 mức (Quên hẳn, Khó nhớ, Nhớ tốt, Rất dễ). Thuật toán SM-2 lập tức tính toán khoảng thời gian giãn cách tiếp theo (`intervalDays`, `easeFactor`) và cập nhật Streak chuyên cần.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Học sinh bấm nút "Bắt đầu ôn 5 phút ngay" trên Widget Spaced Repetition ở Dashboard hoặc truy cập đường dẫn `/student/spaced-repetition`.

**Tiền điều kiện**  
Hệ thống có các mục kiến thức đến hạn ôn tập trong ngày hôm nay (`dueTodayCount > 0`).

**Hậu điều kiện**  
Lịch ôn tập tiếp theo (`next_review`) của các câu hỏi được cập nhật theo thuật toán SM-2; chuỗi ngày học Streak tăng thêm 1 ngày; tỷ lệ ghi nhớ (Retention Rate) được ghi nhận vào SKP.

**Luồng chính**  
1. Học sinh nhấn nút "Bắt đầu ôn 5 phút ngay" từ Dashboard.
2. Hệ thống điều hướng sang giao diện Phiên ôn tập Spaced Repetition (`/student/spaced-repetition`).
3. Hệ thống tải danh sách câu hỏi cần ôn trong ngày (Deck gồm 5-7 câu) và hiển thị thanh tiến trình câu hỏi cùng chuỗi Streak hiện tại (ví dụ: Chuỗi 5 ngày).
4. Hệ thống hiển thị câu hỏi đầu tiên ở dạng thẻ tương tác (Flashcard):
   - Micro-skill tương ứng (ví dụ: *Mệnh đề quan hệ*, *Câu điều kiện loại 3*).
   - Nội dung câu hỏi và các phương án / ô điền từ thử sức.
5. Học sinh suy nghĩ, chọn phương án hoặc nhập câu trả lời nháp.
6. Học sinh nhấn nút "Hiện Đáp Án & Lời Giải Thích AI".
7. Thẻ lật mở, hiển thị đáp án chính xác kèm hộp thoại AI Explanation (*Quy tắc ngữ pháp, Lý do đúng, Phân tích bẫy sai*).
8. Bên dưới giải thích, hệ thống hiển thị 4 nút đánh giá mức độ ghi nhớ theo chuẩn SM-2:
   - 🔴 **Quên hẳn (Again):** Chất lượng = 1, ôn lại sau 1 ngày.
   - 🟠 **Khó nhớ (Hard):** Chất lượng = 2, ôn lại sau 2 ngày.
   - 🟢 **Nhớ tốt (Good):** Chất lượng = 4, ôn lại sau 4 ngày.
   - 🔵 **Rất dễ (Easy):** Chất lượng = 5, ôn lại sau 7 ngày.
9. Học sinh trung thực nhấp chọn mức độ ghi nhớ phù hợp với bản thân.
10. Hệ thống chạy thuật toán SM-2 cập nhật lại `interval` và `ease_factor` của câu hỏi, đồng thời cập nhật điểm Elo micro-skill tương ứng.
11. Hệ thống tự động chuyển sang câu hỏi tiếp theo trong Deck và lặp lại từ bước 4 đến bước 10.
12. Khi hoàn thành toàn bộ câu hỏi trong ngày, hệ thống hiển thị màn hình chúc mừng "Ghi nhớ Xuất sắc!":
    - Tổng số câu đã ôn trong phiên.
    - Tỷ lệ ghi nhớ thành công (Retention Rate %).
    - Huy hiệu cập nhật chuỗi Streak mới (+1 ngày).
    - Danh sách các micro-skills vừa được gia hạn mốc ôn tập tiếp theo.
13. Học sinh chọn "Về Bảng điều khiển" hoặc "Xem Hồ sơ Tri thức (SKP)".

**Luồng thay thế**  
3a. Học sinh truy cập khi không còn câu hỏi nào đến hạn trong ngày (`dueTodayCount = 0`):  
3a1. Hệ thống hiển thị màn hình thông báo: "Tuyệt vời! Bạn đã hoàn thành tất cả câu ôn tập hôm nay. Hãy quay lại vào ngày mai để tiếp tục duy trì chuỗi Streak nhé!".  
3a2. Học sinh nhấn "Quay lại Bảng điều khiển".  
Use Case kết thúc.

**Luồng ngoại lệ**  
5a. Học sinh nhấn nút "Thoát phiên ôn tập" giữa chừng khi chưa hoàn thành hết Deck:  
5a1. Hệ thống lưu lại tiến độ của các câu đã hoàn thành đánh giá.  
5a2. Các câu chưa đánh giá giữ nguyên trạng thái đến hạn (`due`) để học sinh tiếp tục làm sau.  
5a3. Hệ thống điều hướng học sinh về trang Dashboard.  
Use Case kết thúc.

---

### 11. UC - S05. Theo dõi Hồ sơ tri thức người học (SKP), điểm Elo Rating và phân tích dạng lỗi sai

**Mã Use Case**  
UC-S05

**Tên Use Case**  
Theo dõi Hồ sơ tri thức người học (SKP), điểm Elo Rating và phân tích dạng lỗi sai

**Mô tả**  
Cho phép học sinh truy cập vào trung tâm dữ liệu tri thức của bản thân (Student Knowledge Profile - SKP). Tại đây, học sinh theo dõi trực quan điểm tinh thông (Elo Mastery Score 0-100) của từng micro-skill cụ thể, nhận biết danh sách Top 5 Điểm mạnh (Strengths), Top 5 Điểm yếu (Weaknesses) và tra cứu Danh mục dạng lỗi sai thường gặp (Error Pattern Catalog) kèm các khuyến nghị chiến thuật từ gia sư và AI.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Cao

**Sự kiện kích hoạt**  
Học sinh nhấp vào tab "🧠 Hồ sơ Tri thức (SKP) & Elo Rating" trên trang Tiến độ học tập (`/student/progress`).

**Tiền điều kiện**  
Học sinh đã đăng nhập và tài khoản đã có dữ liệu làm bài tập để hình thành hồ sơ tri thức SKP.

**Hậu điều kiện**  
Học sinh thấu hiểu sâu sắc năng lực hiện tại của mình, nhận thức rõ các điểm yếu và bẫy sai cần tập trung khắc phục trong các buổi học tiếp theo.

**Luồng chính**  
1. Học sinh truy cập trang Tiến độ (`/student/progress`) và chọn tab "🧠 Hồ sơ Tri thức (SKP) & Elo Rating".
2. Hệ thống truy xuất thực thể `studentKnowledgeProfile` liên kết với học sinh.
3. Hệ thống hiển thị khối tổng quan:
   - **Chỉ số Tinh thông Tổng thể (Overall Elo Score):** Hiển thị điểm số Elo trung bình (ví dụ: 74/100 Elo) và trạng thái tiếp thu (*Bứt phá nhanh / Đạt chuẩn*).
   - Mô tả thuật toán Elo Rating áp dụng trong giáo dục để tính toán độ tinh thông thực chất sau mỗi câu làm bài.
4. Hệ thống hiển thị **Bảng Theo Dõi Micro-Skills (Elo Rating 0 - 100):**
   - Lưới hiển thị 8 kỹ năng vi mô cốt lõi (ví dụ: *Thì Quá khứ đơn, Mệnh đề quan hệ, Câu điều kiện loại 2&3, Collocations Môi trường, Cohesion Task 2, Phát âm nguyên âm đôi, Skimming/Scanning, Bẫy nghe Section 3*).
   - Mỗi kỹ năng gồm: Danh mục, Tên kỹ năng, Điểm số Elo (0-100), Thanh đo tiến độ ProgressBar có màu sắc phân cấp (*Xanh lá: Thành thạo; Xanh dương: Đang luyện; Đỏ: Yếu*), và Độ tự tin (%).
5. Hệ thống hiển thị lưới so sánh hai cột **Top 5 Điểm Mạnh & Top 5 Điểm Yếu:**
   - **Top 5 Điểm Mạnh:** Xếp hạng 5 kỹ năng đạt điểm Elo cao nhất, tạo động lực tự tin cho học sinh.
   - **Top 5 Điểm Yếu:** Xếp hạng 5 kỹ năng có điểm Elo thấp nhất hoặc hay làm sai nhất, kèm mức độ ưu tiên (*Cấp thiết / Cần cải thiện*) và khuyến nghị giải pháp cụ thể của gia sư.
6. Hệ thống hiển thị bảng **Danh Mục Dạng Lỗi Thường Gặp (Error Pattern Catalog):**
   - Danh sách các nhóm lỗi ngữ pháp / từ vựng học sinh hay lặp lại (ví dụ: *Nhầm lẫn between which và where, Chia sai thì câu điều kiện loại 3, Dùng sai giới từ interested on*).
   - Tần suất mắc lỗi (số lần lặp lại).
   - Ví dụ câu sai thực tế của học sinh so với câu sửa đúng.
   - Giải pháp / mẹo ghi nhớ khắc phục triệt để.
7. Học sinh xem chi tiết các thông tin để định hướng nội dung thảo luận với gia sư trong buổi học tới.

**Luồng thay thế**  
4a. Học sinh muốn lọc danh sách micro-skills theo từng phân môn cụ thể:  
4a1. Học sinh nhấp chọn phân môn (Ngữ pháp, Từ vựng, Nghe, Đọc, Nói, Viết).  
4a2. Hệ thống lọc và chỉ hiển thị các micro-skills thuộc phân môn được chọn.  
Use Case tiếp tục bước 5.

**Luồng ngoại lệ**  
2a. Học sinh mới chưa làm bài tập nào, chưa có dữ liệu hình thành SKP:  
2a1. Hệ thống hiển thị giao diện rỗng (Empty state) kèm thông báo: "Bạn chưa có dữ liệu hồ sơ tri thức. Hãy hoàn thành bài khảo sát Placement Test hoặc bài tập đầu tiên để kích hoạt SKP nhé!".  
2a2. Hệ thống hiển thị nút bấm dẫn sang bài làm khảo sát đầu vào.  
Use Case kết thúc.

---

### 12. UC - S06. Xem báo cáo tiến độ cá nhân phân tách Chỉ số chăm chỉ và Năng lực

**Mã Use Case**  
UC-S06

**Tên Use Case**  
Xem báo cáo tiến độ cá nhân phân tách Chỉ số chăm chỉ và Năng lực

**Mô tả**  
Cho phép học sinh xem báo cáo tiến độ học tập toàn diện được phân tách rành mạch thành 2 trụ cột độc lập: (1) **Chỉ số Chăm chỉ (Effort Metrics)** đo lường tính chuyên cần và kỷ luật nộp bài tập; và (2) **Biểu đồ Tiến bộ Năng lực (Mastery Growth Chart)** đo lường sự tăng trưởng điểm số bài kiểm tra qua các tuần học.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Trung bình

**Sự kiện kích hoạt**  
Học sinh chọn tab "📈 Báo cáo Tiến bộ (Chăm chỉ vs Năng lực)" trên trang `/student/progress`.

**Tiền điều kiện**  
Học sinh đã đăng nhập và đã có quá trình học tập phát sinh lịch sử điểm.

**Hậu điều kiện**  
Học sinh đánh giá được sự tương quan giữa độ chăm chỉ làm bài tập và kết quả bứt phá năng lực thực tế.

**Luồng chính**  
1. Học sinh truy cập trang Tiến độ và chọn tab "📈 Báo cáo Tiến bộ".
2. Hệ thống hiển thị khối **Chỉ số Chăm chỉ & Nề nếp học tập (Effort Metrics):**
   - Thẻ Tỷ lệ nộp bài tập đúng hạn (% On-time Submission).
   - Thẻ Chuỗi ngày ôn tập Spaced Repetition liên tục (Streak).
   - Thẻ Tỷ lệ hoàn thành khối lượng bài luyện tập (`PRACTICE`).
   - Thẻ Tổng thời lượng tích lũy giờ học và tự ôn (Hours).
3. Hệ thống hiển thị khối **Khởi điểm khảo sát (Placement Baseline Card):** Điểm số ban đầu phân bổ theo 6 kỹ năng tại buổi Placement Test đầu vào.
4. Hệ thống hiển thị thanh chuyển đổi xem tiến độ theo từng gia sư hoặc xem tổng hợp tất cả gia sư đang học cùng.
5. Hệ thống hiển thị các thẻ đối chiếu mục tiêu điểm số (Score Milestones): Khởi điểm $\rightarrow$ Hiện tại $\rightarrow$ Mục tiêu phấn đấu (Band IELTS hoặc CEFR).
6. Hệ thống hiển thị **Biểu Đồ Tăng Trưởng Kỹ Năng Qua Các Tuần (ProgressChart):**
   - Trục hoành: Các tuần học từ Tuần 1 đến Tuần hiện tại.
   - Trục tung: Thang điểm năng lực từ 0 đến 10.
   - Các đường biểu diễn đa màu sắc theo từng phân môn (Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp) thể hiện rõ xu hướng tăng trưởng đi lên.
7. Hệ thống hiển thị danh sách **Lịch sử các bài tập & bài kiểm tra đã chấm điểm:**
   - Tên bài, gia sư phụ trách chấm, phân môn, ngày nộp.
   - Điểm số đạt được trên thang điểm tối đa (ví dụ: 9/10, 8.5/10).
   - Nhận xét đánh giá chuyên môn chi tiết của gia sư.
8. Học sinh có thể bấm vào từng bài đã chấm để xem lại toàn bộ bài làm và lời giải thích AI.

**Luồng thay thế**  
4a. Học sinh chuyển đổi chế độ lọc tiến độ theo từng gia sư:  
4a1. Học sinh bấm chọn gia sư cụ thể trên thanh phân loại.  
4a2. Hệ thống cập nhật biểu đồ và bảng điểm theo phạm vi môn học của gia sư đó.  
Use Case tiếp tục bước 6.

**Luồng ngoại lệ**  
6a. Học sinh mới học tuần đầu tiên, chưa có dữ liệu điểm nhiều tuần:  
6a1. Biểu đồ hiển thị điểm số tuần đầu đơn lẻ kèm chú thích "Hệ thống đang tích lũy dữ liệu các tuần tiếp theo để vẽ biểu đồ xu hướng".  
Use Case tiếp tục bước 7.

---

### 13. UC - S07. Khai thác kho học liệu số hóa (Video bài giảng xem lại và Tài liệu đính kèm)

**Mã Use Case**  
UC-S07

**Tên Use Case**  
Khai thác kho học liệu số hóa (Video bài giảng xem lại và Tài liệu đính kèm)

**Mô tả**  
Cho phép học sinh truy cập kho tài liệu số hóa cá nhân hóa gắn liền với từng bài học trong Khung chương trình 2 cấp do gia sư cung cấp. Học sinh có thể xem lại video ghi hình buổi dạy, tài liệu PDF, Slide thuyết trình hoặc Ebook để tự ôn bài tại nhà.

**Tác nhân**  
Học sinh (Đã đăng nhập)

**Độ ưu tiên**  
Trung bình

**Sự kiện kích hoạt**  
Học sinh truy cập mục "Tài liệu & Video" trên menu chính (`/student/materials`) hoặc nhấp vào liên kết tài liệu trong chi tiết buổi học.

**Tiền điều kiện**  
Học sinh đã đăng nhập và gia sư đã tải lên tài liệu/video bài giảng liên kết với buổi học.

**Hậu điều kiện**  
Học sinh mở xem được video bài giảng trực tuyến hoặc tải về máy tệp tài liệu PDF/Word phục vụ việc ôn tập.

**Luồng chính**  
1. Học sinh chọn mục "Tài liệu" (`/student/materials`) trên thanh điều hướng.
2. Hệ thống hiển thị danh sách tài liệu và video bài giảng được phân loại theo gia sư phụ trách.
3. Học sinh có thể sử dụng bộ lọc:
   - Lọc theo Gia sư phụ trách (Tất cả gia sư, Cô Lan Anh, Thầy Minh Quân...).
   - Lọc theo định dạng học liệu (*Tất cả loại, Video bài giảng, Tài liệu / Slide PDF*).
4. Hệ thống hiển thị danh sách các tài liệu thỏa mãn bộ lọc kèm thông tin: Tên tài liệu, Chủ đề kỹ năng, Ngày đính kèm, Thời lượng video hoặc Số trang tài liệu.
5. Học sinh thực hiện một trong hai thao tác:
   - **Thao tác A (Xem video bài giảng):** Nhấn nút "Xem video" trên thẻ học liệu. Hệ thống mở cửa sổ Modal phát video trình chiếu trực tiếp không cần rời trang.
   - **Thao tác B (Tải tài liệu PDF):** Nhấn nút "Tải tài liệu". Hệ thống tải file về máy và hiển thị thông báo Toast: *"Đã bắt đầu tải xuống tài liệu [Tên tài liệu]!"*.
6. Học sinh kết thúc xem tài liệu và đóng cửa sổ popup xem video.

**Luồng thay thế**  
3a. Học sinh tìm kiếm tài liệu bằng từ khóa:  
3a1. Học sinh nhập từ khóa (tên bài học, chủ đề) vào thanh tìm kiếm.  
3a2. Hệ thống lọc danh sách tài liệu tương ứng.  
Use Case tiếp tục bước 4.

**Luồng ngoại lệ**  
5a. Tệp tài liệu hoặc liên kết video bị lỗi không mở được:  
5a1. Hệ thống hiển thị thông báo: "Không thể mở tệp tài liệu hoặc video này. Vui lòng liên hệ gia sư để được cấp lại quyền truy cập".  
5a2. Tác vụ tải / xem video bị hủy.  
Use Case kết thúc.

---
---

# PHẦN III: MA TRẬN TRUY VẾT YÊU CẦU (TRACEABILITY MATRIX: PRD ➔ USE CASES)

| Mã Use Case | Tên Use Case | Phân hệ | Yêu cầu PRD tương ứng (PRD FR) | User Journey PRD |
| :--- | :--- | :---: | :---: | :---: |
| **UC-P01** | Tìm kiếm gia sư qua Smart-Match Form | Phụ huynh | **FR-1**: Smart-Match Form đa bước | UJ-1 (Path 1) |
| **UC-P02** | Khám phá, lọc & xem hồ sơ gia sư | Phụ huynh | **FR-2**: Danh sách gia sư phù hợp tiêu chí (Lọc Dropdown, Phân trang) | UJ-1 (Path 2) |
| **UC-P03** | Đăng ký học thử & Liên hệ gia sư chỉ định | Phụ huynh | **FR-3**: Đăng ký học thử & Match Request (Validate SĐT) | UJ-1 |
| **UC-P04** | Tra cứu thông tin, Bảng giá & FAQ | Phụ huynh | **FR-4**: Tra cứu FAQ và Thông tin trung tâm | Vision, JTBD |
| **UC-P05** | Tra cứu tiến độ định lượng của con | Phụ huynh | **FR-15, Vision**: Báo cáo định lượng phụ huynh | Section 1, JTBD 2.1 |
| **UC-P06** | Gửi yêu cầu đổi gia sư (Rematch)/Khiếu nại | Phụ huynh | **FR-37**: Xử lý khiếu nại (Receptionist/Parent) | UJ-1, FR-37 |
| **UC-S01** | Bảng điều khiển & Lịch học cá nhân | Học sinh | **FR-26, FR-28**: Lịch học & Đổi lịch | UJ-3 |
| **UC-S02** | Làm bài tập Luyện tập + Giải thích AI | Học sinh | **FR-11, FR-12, FR-13**: Per-question mode | UJ-3 |
| **UC-S03** | Làm bài kiểm tra năng lực định kỳ | Học sinh | **FR-11, FR-12, FR-13**: Submit-all mode | UJ-3 |
| **UC-S04** | Ôn tập ngắt quãng Spaced Repetition | Học sinh | **FR-39**: Spaced Repetition (SM-2 Algorithm) | UJ-3 |
| **UC-S05** | Hồ sơ tri thức SKP & Điểm Elo Rating | Học sinh | **FR-38**: SKP & Thuật toán Elo Rating | UJ-3, Glossary |
| **UC-S06** | Báo cáo tiến bộ Chăm chỉ & Năng lực | Học sinh | **FR-15**: Personal Progress Report | UJ-3 |
| **UC-S07** | Khai thác kho tài liệu & video bài giảng | Học sinh | **FR-22**: Học qua video & tài liệu số hóa | UJ-2, UJ-3 |

---
*Tài liệu được biên soạn đồng bộ với mã nguồn Frontend Prototype và tài liệu PRD hệ thống theo mẫu chuẩn Đồ án tốt nghiệp Học viện Công nghệ Bưu chính Viễn thông.*
