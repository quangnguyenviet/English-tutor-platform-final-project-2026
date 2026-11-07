**ĐẶC TẢ USE CASE**  
  **LỄ TÂN (RECEPTIONIST)**

# **PHẦN I. MÔ TẢ VAI TRÒ RECEPTIONIST TRONG HỆ THỐNG**

## **1.1 Định nghĩa vai trò**

Receptionist (Lễ tân trung tâm) là nhân sự thường trực tại văn phòng trung tâm gia sư, đóng vai trò cửa ngõ tiếp xúc trực tiếp (front-desk & first point of contact) với khách hàng — bao gồm cả Phụ huynh và Gia sư.

Trong mô hình vận hành thực tế, Quản trị viên (Admin) không thể trực tiếp xử lý tất cả các nghiệp vụ phát sinh hàng ngày. Lễ tân được phân quyền để giảm tải cho Admin, đảm trách:

•     Tiếp nhận và xử lý nhanh các yêu cầu ghép lớp mới từ trang chủ.

•     Kiểm tra và phê duyệt minh chứng nộp phí nhận lớp từ gia sư.

•     Hỗ trợ tra cứu, cập nhật thông tin hồ sơ gia sư và học sinh.

•     Đặc biệt: Là đầu mối trực tiếp tiếp nhận, lập biên bản ghi nhận và xử lý các vụ khiếu nại trực tiếp tại quầy (Hoàn tiền cho gia sư hoặc Ghép lại lớp cho phụ huynh).

## **1.2 Trách nhiệm chính**

| Trách nhiệm | Mô tả  |
| :---- | :---- |
| Quản lý Lớp cần gia sư | Tiếp nhận yêu cầu đăng ký học từ Phụ huynh trên một trang duy nhất. Phụ huynh đã chọn gia sư thì trao đổi và xác nhận chuyển dạy thử; chưa chọn thì đăng lớp cho gia sư ứng tuyển. Theo dõi dạy thử, xác nhận ghép thành công, ghép lại, hủy lớp. |
| Quản lý hồ sơ Gia sư | Duyệt hồ sơ gia sư đăng ký mới, quản lý trạng thái hoạt động, chỉnh sửa thông tin |
| Quản lý hồ sơ Học sinh | Duyệt hồ sơ học sinh, tạo tài khoản học sinh sau khi thanh toán được xác nhận |
| Phê duyệt phí nhận lớp (QR Proof) | Kiểm tra minh chứng chuyển khoản (ảnh biên lai), duyệt/yêu cầu gửi lại minh chứng |
| Giám sát vận hành & báo cáo | Theo dõi doanh thu, tỷ lệ ghép lớp, số lượng gia sư/học sinh mới, xuất báo cáo |
| Quản lý thông báo | Nhận & xử lý thông báo từ gia sư, phụ huynh, hệ thống |
| Kiểm soát nhật ký hoạt động | Giám sát audit trail, theo dõi mọi thao tác quan trọng trong hệ thống |
| Quản lý nhân sự Lễ tân | Thêm mới, chỉnh sửa thông tin, phân quyền và quản lý trạng thái hoạt động của nhân viên Lễ tân |
| Xử lý khiếu nại & Đối soát tài chính | Giám sát toàn bộ khiếu nại (Hoàn tiền / Ghép lại lớp) do Lễ tân tiếp nhận, duyệt xử lý và đối soát dòng tiền thu \- chi |

##  

## **1.3 Các luồng nghiệp vụ chính**

Tóm tắt các luồng nghiệp vụ Lễ tân:

| Luồng | Tên luồng | Mô tả ngắn |
| :---- | :---- | :---- |
| REC-1 | Quản lý lớp cần gia sư | Từ yêu cầu PH → Tư vấn (\<12h) → Có gia sư chỉ định thì xác nhận, chưa có thì đăng lớp và chọn gia sư ứng tuyển → Đang dạy thử → Ghép thành công (nếu dạy thử thất bại: Phụ huynh chọn ghép lại → Đang ghép lại → chọn gia sư mới) |
| REC-2 | Duyệt phí nhận lớp (QR Proof) | Sau 1 tháng dạy → GS nộp MC → Duyệt / Yêu cầu gửi lại |
| REC-3 | Quản lý Gia sư | Duyệt hồ sơ mới → Quản lý trạng thái → Sửa/Xóa thông tin |
| REC-4 | Quản lý Học sinh | Duyệt hồ sơ → Tạo tài khoản sau khi thanh toán OK |
| REC-5 | Giám sát & Báo cáo vận hành | Dashboard thống kê, biểu đồ doanh thu, xuất báo cáo |
| REC-6 | Giám sát khiếu nại & Đối soát thu chi | Tiếp nhận khiếu nại tại quầy → Phân loại hoàn tiền/đổi lớp → Đối soát doanh thu thực |

 

# **PHẦN II. BẢNG MÔ TẢ USE CASE CHI TIẾT**

## **UC-REC-01: Xem Receptionist Dashboard tổng quan**

| Mã UC | UC-REC-01 |
| :---- | :---- |
| **Tên UC** | Xem Receptionist Dashboard tổng quan |
| **Actor** | Receptionist (Lễ tân) |
| **Tiền điều kiện** | Lễ tân đã đăng nhập vào hệ thống với tài khoản vai trò receptionist |
| **Hậu điều kiện** | Lễ tân nắm được toàn bộ khối lượng công việc cần xử lý trong ca trực: số yêu cầu ghép lớp đang chờ, số thanh toán chờ duyệt, và số khiếu nại chưa xử lý |
| **Kịch bản chính** | 1\. Lễ tân đăng nhập và truy cập trang Tổng quan (/receptionist) 2\. Hệ thống hiển thị lời chào kèm tên và mã nhân viên lễ tân, hiển thị các thẻ KPI thống kê nhiệm vụ trọng tâm: Yêu cầu ghép lớp chờ xử lý (số lượng match request trạng thái "Chờ xử lý") Thanh toán phí chờ duyệt (số lượng payment proof trạng thái SUBMITTED) Khiếu nại chưa xử lý (số đơn khiếu nại tại quầy trạng thái Chưa xử lí) Tổng số gia sư đang hoạt động trong hệ thống Danh sách các lối tắt (Quick Actions): "Xử lý khiếu nại ngay", "Duyệt yêu cầu ghép lớp", "Kiểm tra thanh toán", "Danh sách gia sư" |
| **Ngoại lệ** |  |

## **UC-REC-02: Tạo lớp cần gia sư**

| Mã UC | UC-REC-02 |
| :---- | :---- |
| **Tên UC** | Tạo lớp cần gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Phụ huynh liên hệ trung tâm để tìm gia sư, có thể đã chọn sẵn gia sư hoặc chưa. Yêu cầu phụ huynh gửi trên website tự tạo lớp ở "Chờ xử lý", không cần Lễ tân tạo lại. |
| **Hậu điều kiện** | Xuất hiện lớp cần gia sư mới ở trạng thái "Chờ xử lý". |
| **Kịch bản chính** | 1\. Lễ tân chọn mục "Quản lý lớp cần gia sư". 2\. Hệ thống hiển thị danh sách lớp với các tab: Tất cả, Chờ xử lý, Đã đăng, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy; có tìm kiếm, sắp xếp theo thời gian và số gia sư ứng tuyển, và nút "Tạo mới lớp". 3\. Lễ tân bấm "Tạo mới lớp". 4\. Hệ thống hiển thị form gồm: Họ tên phụ huynh, SĐT, Họ tên học sinh, Khối lớp, Trường học, Gia sư chỉ định (tùy chọn, mặc định không chỉ định), Yêu cầu lớp học, Mục tiêu học tập, Hình thức học, Học phí/buổi, Số buổi/tuần, Tỷ lệ phí nhận lớp, Lịch học mong muốn, Yêu cầu đối với gia sư; và 2 nút "Tạo lớp", "Hủy". Thông tin phụ huynh và học sinh không công khai với gia sư. 5\. Lễ tân nhập thông tin và bấm "Tạo lớp". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống thông báo thành công, lớp xuất hiện ở tab "Chờ xử lý". Chưa tạo tài khoản học sinh ở bước này. |
| **Ngoại lệ** | 4.1. Lễ tân bấm "Hủy": hệ thống đóng form, không tạo lớp. 5.1. Thiếu thông tin bắt buộc hoặc SĐT sai định dạng: hệ thống báo lỗi, giữ nguyên dữ liệu đã nhập. 7.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại form. |

## **UC-REC-03: Chọn gia sư từ danh sách ứng tuyển**

| Mã UC | UC-REC-03 |
| :---- | :---- |
| **Tên UC** | Chọn gia sư từ danh sách ứng tuyển |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | Lễ tân đã đăng nhập. Lớp ở "Đã đăng", hoặc "Đang ghép lại" và không có gia sư chỉ định. Có gia sư ứng tuyển. Lễ tân đã trao đổi với phụ huynh và gia sư, hai bên đồng ý. |
| **Hậu điều kiện** | Lớp chuyển "Đang dạy thử". Lớp học `TRIAL` và khoản phí nháp được tạo. Tài khoản học sinh được tạo nếu chưa có. Các gia sư còn lại được thông báo không được chọn. |
| **Kịch bản chính** | 1\. Lễ tân bấm "Danh sách ứng tuyển" tại lớp tương ứng. 2\. Hệ thống mở modal gồm: Tên gia sư, Thời gian ứng tuyển, Lời nhắn, nút "Chọn gia sư", "Xem chi tiết". 3\. Lễ tân bấm "Chọn gia sư". 4\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 5\. Lễ tân bấm "Đồng ý". 6\. Hệ thống thông báo thành công và hiển thị tài khoản học sinh, mật khẩu mặc định nếu vừa tạo để bàn giao cho gia đình. |
| **Ngoại lệ** | 1.1. Chưa có gia sư ứng tuyển: nút "Danh sách ứng tuyển" bị khóa. 5.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại danh sách ứng tuyển. 6.1. Chưa có họ tên học sinh hoặc gia sư không còn hoạt động: hệ thống báo lỗi, không đổi dữ liệu. |

## **UC-REC-04: Hủy lớp cần gia sư**

| Mã UC | UC-REC-04 |
| :---- | :---- |
| **Tên UC** | Hủy lớp cần gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở bất kỳ trạng thái nào trừ "Đã hủy". 3\. Lớp "Ghép thành công" phải còn trong 7 ngày kể từ ngày lớp chính thức (Quy định website I.3). |
| **Hậu điều kiện** | Lớp chuyển "Đã hủy" và gỡ khỏi trang gia sư. Lớp học đang `TRIAL`/`ACTIVE` bị hủy, gia sư đang dạy bị loại khỏi lớp. Gia sư đã ứng tuyển, gia sư đang dạy và học sinh nhận được thông báo kèm lý do. Tiền dạy do phụ huynh và gia sư tự thanh toán, khoản phí nhận lớp đã kích hoạt không tự hủy. |
| **Kịch bản chính** | 1\. Hệ thống hiển thị danh sách lớp kèm nút "Hủy lớp". Lớp "Ghép thành công" hiển thị đếm ngược "Còn N ngày để hủy lớp, đến hết ngày dd/mm/yyyy". 2\. Lễ tân bấm "Hủy lớp". 3\. Hệ thống hiển thị ô nhập lý do. 4\. Lễ tân nhập lý do và bấm "Đồng ý hủy". 5\. Hệ thống hiển thị popup xác nhận kèm 2 nút. 6\. Lễ tân bấm "Đồng ý hủy". 7\. Hệ thống cập nhật trạng thái, gửi thông báo và báo thành công. |
| **Ngoại lệ** | 1.1. Lớp "Ghép thành công" đã quá 7 ngày: nút "Hủy lớp" bị làm mờ, hệ thống hiển thị "Đã hết hạn hủy lớp", nếu vẫn gửi yêu cầu thì từ chối. 4.1. Để trống lý do: nút xác nhận bị khóa. 6.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại, không thay đổi. |

## **UC-REC-05: Bổ sung thông tin, đổi gia sư chỉ định và đăng lớp**

| Mã UC | UC-REC-05 |
| :---- | :---- |
| **Tên UC** | Bổ sung thông tin, đổi gia sư chỉ định và đăng lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Chờ xử lý". Đổi gia sư chỉ định còn áp dụng cho lớp "Đang ghép lại" (xem UC-REC-07). 3\. Lễ tân đã gọi tư vấn phụ huynh. |
| **Hậu điều kiện** | Thông tin lớp được cập nhật. Lớp có gia sư chỉ định chờ xác nhận (UC-REC-06), lớp không có gia sư chỉ định có thể đăng lên, chuyển "Đã đăng". |
| **Kịch bản chính** | 1\. Lễ tân mở tab "Chờ xử lý" và bấm "Bổ sung thông tin". 2\. Hệ thống hiển thị form thông tin phụ huynh, học sinh, yêu cầu lớp, hình thức, học phí, tỷ lệ phí, lịch học, yêu cầu gia sư. SĐT không sửa được. 3\. Lễ tân nhập và lưu. 4\. Để đổi gia sư, Lễ tân bấm "Gia sư chỉ định". 5\. Hệ thống hiển thị danh sách gia sư đang hoạt động và lựa chọn "Không". 6\. Lễ tân chọn gia sư B thay gia sư A khi gia sư A không dạy được, hoặc chọn "Không" khi phụ huynh muốn trung tâm tìm hộ, rồi bấm "Lưu". 7\. Với lớp không có gia sư chỉ định, Lễ tân bấm "Đăng lớp". 8\. Hệ thống hiển thị popup xác nhận. 9\. Lễ tân bấm "Đăng lớp". 10\. Lớp chuyển "Đã đăng", hiển thị trên trang gia sư và trang công khai. |
| **Ngoại lệ** | 3.1. Thiếu họ tên phụ huynh, họ tên học sinh hoặc email sai định dạng: hệ thống báo lỗi. 6.1. Gia sư đã ngưng hoạt động hoặc đã bị loại khỏi lớp: hệ thống báo lỗi, không đổi. 9.1. Lớp thiếu họ tên học sinh, yêu cầu lớp, hình thức hoặc học phí: hệ thống báo chưa đủ thông tin để đăng. |

## **UC-REC-06: Xác nhận lớp có gia sư chỉ định**

| Mã UC | UC-REC-06 |
| :---- | :---- |
| **Tên UC** | Xác nhận lớp có gia sư chỉ định |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Chờ xử lý" hoặc "Đang ghép lại" và có gia sư chỉ định. 3\. Lễ tân đã trao đổi, phụ huynh và gia sư đồng ý. |
| **Hậu điều kiện** | Lớp chuyển "Đang dạy thử". Lớp học `TRIAL` và khoản phí nháp được tạo. Tài khoản học sinh được tạo nếu chưa có. Các gia sư đang ứng tuyển (nếu có) được thông báo không được chọn. |
| **Kịch bản chính** | 1\. Lễ tân bấm "Xác nhận đơn" tại lớp tương ứng. 2\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 3\. Lễ tân bấm "Đồng ý". 4\. Hệ thống thông báo thành công, gửi thông báo tới gia sư, hiển thị tài khoản học sinh và mật khẩu mặc định nếu vừa tạo. |
| **Ngoại lệ** | 1.1. Chưa có họ tên học sinh: hệ thống yêu cầu bổ sung và mở form thông tin. 3.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại, không thay đổi. 4.1. Gia sư không còn hoạt động: hệ thống báo lỗi, Lễ tân đổi gia sư theo UC-REC-05. |

## **UC-REC-06.1: Xác nhận ghép thành công**

| Mã UC | UC-REC-06.1 |
| :---- | :---- |
| **Tên UC** | Xác nhận ghép thành công |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Đang dạy thử". 3\. Gia sư đã hoàn thành buổi dạy thử và hai bên thống nhất học chính thức. |
| **Hậu điều kiện** | 1\. Lớp chuyển "Ghép thành công". 2\. Lớp học chuyển từ `TRIAL` sang `ACTIVE`, ghi ngày chính thức. 3\. Khoản phí nhận lớp được kích hoạt. 4\. Bắt đầu đếm ngược 7 ngày được hủy lớp. |
| **Kịch bản chính** | 1\. Lễ tân mở tab "Đang dạy thử". 2\. Hệ thống hiển thị danh sách lớp kèm nút "Xác nhận ghép thành công", "Ghép lại", "Hủy lớp", "Xem chi tiết". 3\. Lễ tân bấm "Xác nhận ghép thành công". 4\. Hệ thống hiển thị modal gồm số buổi/tuần, học phí/buổi, tỷ lệ phí và số phí tính được. 5\. Lễ tân bổ sung thông tin còn thiếu và xác nhận. 6\. Hệ thống thông báo thành công và chuyển lớp sang tab "Ghép thành công". |
| **Ngoại lệ** | 2.1. Lễ tân bấm "Ghép lại": chuyển sang UC-REC-07. 2.2. Lễ tân bấm "Hủy lớp": chuyển sang UC-REC-04. 5.1. Thiếu số buổi/tuần hoặc học phí: hệ thống báo lỗi, không kích hoạt. |

## **UC-REC-07: Ghép lại lớp**

| Mã UC | UC-REC-07 |
| :---- | :---- |
| **Tên UC** | Ghép lại lớp khi dạy thử không thành công |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Đang dạy thử". 3\. Dạy thử không thành công, Lễ tân đã hỏi ý kiến phụ huynh. |
| **Hậu điều kiện** | Lớp chuyển "Đang ghép lại", gia sư cũ bị loại và không ứng tuyển lại được. Các gia sư trước đó không được chọn tự quay lại danh sách ứng tuyển và nhận thông báo. Gia sư và khách thấy lớp như lớp đăng tuyển bình thường. |
| **Kịch bản chính** | 1\. Lễ tân bấm "Ghép lại". 2\. Hệ thống hiển thị 2 lựa chọn "Tìm gia sư khác", "Không tìm nữa" và ô nhập lý do. 3\. Lễ tân chọn "Tìm gia sư khác", nhập lý do và bấm "Chuyển sang ghép lại". 4\. Hệ thống hiển thị popup xác nhận. 5\. Lễ tân bấm "Đồng ý". 6\. Hệ thống hủy lớp dạy thử, thông báo gia sư cũ và học sinh, chuyển lớp sang tab "Đang ghép lại". 7\. Lễ tân chọn gia sư từ danh sách ứng tuyển (UC-REC-03), hoặc khi phụ huynh tự chọn được gia sư thì bấm "Gia sư chỉ định" rồi "Xác nhận đơn" (UC-REC-06). |
| **Ngoại lệ** | 3.1. Phụ huynh chọn "Không tìm nữa": chuyển sang UC-REC-04, điền sẵn lý do. 7.1. Lớp đang có gia sư chỉ định thì tạm ẩn khỏi trang gia sư, không nhận ứng tuyển; đổi về "Không" thì lớp hiển thị lại. 7.2. Lễ tân bấm "Sửa thông tin": chỉ sửa được học phí, yêu cầu lớp, mục tiêu học tập, yêu cầu gia sư; gia sư đang ứng tuyển nhận thông báo thay đổi. Lớp chuyển "Đang dạy thử" với học phí đã sửa. |

## **UC-REC-08: Duyệt hồ sơ Gia sư đăng ký mới**

| Mã UC | UC-REC-08 |
| :---- | :---- |
| **Tên UC** | Duyệt hồ sơ Gia sư đăng ký mới |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ Gia sư ở trạng thái Chờ duyệt |
| **Hậu điều kiện** | 1\. Nếu Duyệt: Hồ sơ GS chuyển trạng thái → Đang hoạt động, GS có thể nhận Match Offer 2\. Nếu Từ chối: Hồ sơ bị loại, GS nhận thông báo từ chối |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Gia sư", chọn tab "Chờ duyệt" 2\. Hệ thống hiển thị danh sách Gia sư chờ duyệt. 3\. Lễ tân bấm vào một hồ sơ GS. 4\. Hệ thống hiển thị thông tin chi tiết: họ tên, SĐT, ngày tháng năm sinh, quê quán, email, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Duyệt, Không duyệt. 5\. Lễ tân bấm nút "Duyệt". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống cập nhật trạng thái GS, ghi Audit Log. |
| **Ngoại lệ** | 5.1. Lễ tân bấm nút “Không duyệt”. 5.1.1. Hệ thống hiển thị pop up xác nhận và 2 nút Đồng ý/ Hủy. 5.1.1.1. Lễ tân bấm nút Đồng ý. 5.1.1.1.1. Hệ thống hiển thị thông báo đã từ chối hồ sơ của Gia sư. 5.1.1.2. Lễ tân bấm nút Hủy. 5.1.1.2.1. Hệ thống quay trở lại trang cũ. (Trang chờ duyệt) 7.1. Gia sư bấm nút Hủy 7.1.1. Hệ thống quay trở lại trang cũ (Trang chờ duyệt). |

## **UC-REC-09: Quản lý thông tin gia sư**

| Mã UC | UC-REC-09 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 Gia sư trong hệ thống |
| **Hậu điều kiện** | 1\. Hồ sơ gia sư sẽ không thay đổi nếu chỉ xem.2\. Hồ sơ gia sư sẽ được cập nhật thay đổi khi Lễ tân chỉnh sửa. |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Gia sư" từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách GS với 3 tab: Chờ duyệt / Đang hoạt động / Ngưng hoạt động và 2 button Xem GS. 3\. Lễ tân bấm button “Xem GS" ở 1 hồ sơ gia sư bất kỳ. 4\. Hệ thống hiển thị modal thông tin chi tiết GS gồm:  họ tên, SĐT, ngày tháng năm sinh, quê quán, email, trạng thái hoạt động, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Lưu, Đóng. 5\. Lễ tân xem chi tiết được thông tin GS, đồng thời cũng có thể chỉnh sửa thông tin GS ở trường như trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của gia sư không?” và 2 nút Đồng ý/ Hủy. 7\. Lễ tân ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin gia sư” và quay lại trang Quản lý GS. |
| **Ngoại lệ** | 7.1. Lễ tân bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết GS. |

## **UC-REC-10: Tạo đơn xác minh phí nhận lớp** 

| Mã UC | UC-REC-10 |
| :---- | :---- |
| **Tên UC** | Tạo đơn xác minh phí nhận lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Phụ huynh đóng tiền trước cho lớp Onine và đã gửi ảnh minh chứng chuyển khoản hoặc đến tận nơi đóng tiền mặt.  |
| **Hậu điều kiện** | Đơn đang ở trạng thái “Chờ duyệt” |
| **Kịch bản chính** | 1\. Lễ tân chọn mục "Quản lý phí ghép lớp" từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách thanh toán với các tab: Chưa nộp minh chứng, Chờ duyệt, Đã duyệt, Yêu cầu nộp lại và nút tạo đơn. 3\. Lễ tân nhấn nút tạo đơn. 4\. Hệ thống hiển thị form để nhập minh chứng vào:  \- Thông tin lớp học: Mã lớp, Tên môn/khối lớp, Hình thức dạy, Địa chỉ. \- Thông tin các bên: Gia sư phụ trách, Học sinh, Phụ huynh. \- Lịch học cố định đã chốt: Các thứ trong tuần, khung giờ học, ngày bắt đầu. \- Tỷ lệ phí: Hiển thị tỷ lệ phí của lớp cần gia sư này (mặc định 40%, chỉnh được trong khoảng 0–50% trước khi lớp có gia sư được chọn; sau đó chỉ đọc). \- Học phí mỗi buổi: Số tiền VNĐ. \- Số buổi mỗi tuần: Số lượng buổi. \- Tổng số tiền phải nộp: Được tính tự động và hiển thị cố định dạng chữ và số. \- Thông tin minh chứng (nếu có): Ảnh biên lai, người tải lên, thời điểm tải lên. \- 2 nút Gửi, Hủy. 5\. Lễ tân điền đầy đủ thông tin vào và ấn nút Gửi 6\. Hệ thống hiển thị popup xác nhận: "Bạn chắc chắn muốn gửi minh chứng thanh toán này không?” kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm nút Đồng ý 8\. Hệ thống thông báo duyệt thành công, cập nhật trạng thái phí thành "Đã duyệt" và ghi Audit Log. (Gia sư đã xem được SĐT phụ huynh từ khi ghép lớp thành công, không phụ thuộc bước này.) |
| **Ngoại lệ** | 5.1. Lễ tân điền thiếu thông tin và bấm nút Gửi. 5.1.1. Hệ thống yêu cầu gia sư nhập đầy đủ thông tin trước khi gửi. |

## **UC-REC-11: Quản lý thông tin Học sinh** 

| Mã UC | UC-REC-11 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Học sinh |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ học sinh trong hệ thống. |
| **Hậu điều kiện** | Lễ tân nắm được chi tiết hồ sơ học sinh, thông tin phụ huynh và gia sư phụ trách hiện tại. |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Học sinh".  2\. Hệ thống hiển thị danh sách học sinh (phân thành Đang hoạt động và Dừng hoạt động), thanh tìm kiếm/bộ lọc và nút Xem chi tiết. 3\. Lễ tân bấm nút Xem chi tiết của 1 học sinh cần xem. 4\. Hệ thống hiển thị modal chi tiết gồm: Họ tên học sinh, ngày tháng năm sinh, địa chỉ, trường đang theo học, tên phụ huynh, SDT, Email, các lớp đã tham gia, các lớp đang tham gia, thời gian tạo account, trạng thái hoạt động. Và 2 nút Lưu, Đóng. 5\. Lễ tân xem chi tiết được thông tin Học sinh, đồng thời cũng có thể chỉnh sửa thông tin HS như trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của HS không?” và 2 nút Đồng ý/ Hủy. 7\. Lễ tân ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin HS” và quay lại trang Quản lý HS.  |
| **Ngoại lệ** | 7.1. Lễ tân bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết HS. |

## **UC-REC-14: Tạo đơn khiếu nại** 

| Mã UC | UC-REC-14 |
| :---- | :---- |
| **Tên UC** | Tạo đơn khiếu nại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập hệ thống 2\. Phụ huynh/ gia sư có yêu cầu khiếu nại |
| **Hậu điều kiện** | Khiếu nại chuyển trạng thái sang "Chưa xử lý", lưu nội dung cần xử lý, người tạo đơn và thời điểm tạo đơn |
| **Kịch bản chính** | Lễ tân truy cập trang "Xử lý khiếu nại" Hệ thống hiển thị danh sách các khiếu nại chia thành 3 loại: “Chờ xử lý”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Lễ tân bấm nút “Tạo đơn” để tạo những khiếu nại mới.. Hệ thống hiển thị modal đơn khiếu nại gồm thông tin đơn: Họ tên người khiếu nại, SDT, Role, Mã lớp đang tham gia, Lí do khiếu nại và 2 nút "Tạo khiếu nại", "Hủy". Lễ tân nhập các thông tin vào, và ấn nút “Tạo khiếu nại”. Hệ thống hiển thị thông báo đã tạo khiếu nại thành công, chuyển đơn về trạng thái “Chờ xử lý” |
| **Ngoại lệ** | 5.1. Lễ tân click nút Hủy. 5.1.1. Hệ thống hiển thị thông báo “Bạn xác nhận hủy đi đơn khiếu nại này chứ?” và 2 nút Đồng ý, Hủy. 5.1.1.1. Lễ tân click nút Đồng ý. 5.1.1.1.1. Hệ thống quay trở lại trang Quản lý đơn khiếu nại. 5.1.1.2. Lễ tân click nút Hủy 5.1.1.2.1. Hệ thống quay trở lại Modal đơn khiếu nại. |

## **UC-REC-15: Xem, sửa các đơn khiếu nại**

| Mã UC | UC-REC-15 |
| :---- | :---- |
| **Tên UC** | Xem, sửa các đơn khiếu nại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập hệ thống 2\. Tồn tại khiếu nại được tiếp nhận bởi Lễ tân tại quầy |
| **Hậu điều kiện** | 1\. Lễ tân nắm được toàn bộ chi tiết đơn khiếu nại. 2\. Đơn khiếu nại có thể bị thay đổi khi admin thay đổi nó. |
| **Kịch bản chính** | Lễ tân chọn mục "Xử lý khiếu nại" từ menu Lễ tân. Hệ thống hiển thị danh sách các khiếu nại chia thành 2 loại: “Chờ xử lý”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Lễ tân bấm nút "Xem chi tiết" ở một đơn khiếu nại. Hệ thống hiển thị modal chi tiết gồm: Mã đơn khiếu nại, loại khiếu nại,họ tên người gửi, vai trò, SĐT, mã lớp khiếu nại, Lễ tân tiếp nhận, ngày giờ tiếp nhận, số tiền hoàn (nếu là hoàn tiền), nội dung chi tiết và trạng thái hiện tại.  Lễ tân xem xong bấm nút "Đóng" hoặc icon "X". Hoặc có thể chỉnh sửa về nội dung, trạng thái hiện tại, sau đó bấm nút Lưu. Hệ thống hiển thị thông báo: “Bạn xác nhận thay đổi thông tin đơn khiếu nại này chứ?” và 2 nút Đồng ý/ Hủy. Lễ tân bấm nút Đồng ý. Hệ thống hiển thị thông báo thao tác thành công, chuyển về trang “Xử lý khiếu nại”. |
| **Ngoại lệ** | 2.1. Không có khiếu nại nào trong hệ thống. 2.1.1. Hệ thống hiển thị thông báo "Chưa có khiếu nại nào". |

