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
| Quản lý Lớp cần gia sư | Tiếp nhận yêu cầu đăng ký học từ Phụ huynh, trường hợp Phụ huynh chưa xác định được gia sư nào phù hợp, cần trung tâm hỗ trợ tìm giúp. Tạo các lớp cần gia sư để các gia sư tham gia đăng ký. |
| Quản lý Đơn ghép lớp | Tiếp nhận yêu cầu đăng ký học từ Phụ huynh, trường hợp Phụ huynh xác định được gia sư phù hợp. Đơn ghép lớp là các lớp đã xác định được gia sư. |
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
| REC-1 | Tạo lớp cần gia sư, đơn ghép lớp | Từ yêu cầu PH → Tư vấn (\<12h) → Tạo Offer → GS chấp nhận → Lớp ACTIVE (nếu dạy thử thất bại: Phụ huynh chọn ghép lại → Đơn REMATCH → chọn gia sư mới) |
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
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại yêu cầu tìm gia sư từ phụ huynh (Điền form, liên hệ) tới trung tâm, phụ huynh chưa biết cần chọn gia sư nào. |
| **Hậu điều kiện** | Tạo ra lớp cần gia sư, đăng lên trên trang gia sư để họ vào đăng ký lớp. |
| **Kịch bản chính** | 1\. Lễ tân chọn mục “Lớp cần gia sư” từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách lớp cần gia sư (Sắp xếp theo thời gian đăng sớm nhất, số lượng gia sư ứng tuyển nhiều nhất), phân thành 5 mục: Chờ xử lý, Đã đăng, Đang ghép lại (REMATCH), Đã xử lý, Đã hủy và nút Tạo mới lớp. 3\. Lễ tân nhấn vào nút Tạo mới lớp. 4\. Hệ thống hiển thị ra form tạo lớp gồm các ô input: Họ tên PH (Chưa public), SDT (Chưa public), Họ tên HS (Chưa public), yêu cầu lớp học, hình thức học, mức phí theo buổi, số buổi/ tuần, thời gian học, yêu cầu gia sư. Và 2 nút Tạo lớp, Hủy. 5\. Lễ tân điền thông tin và bấm nút  “Tạo lớp”. 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận tạo lớp học này chứ?" kèm 2 nút Đồng ý/Hủy 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, đồng thời chuyển trạng thái đơn thành "Chưa đủ thời gian”. |
| **Ngoại lệ** | 4.1. Lễ tân bấm nút “Hủy lớp” 4.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy tạo lớp này?” và 2 nút “Đồng ý”, “Hủy”. 4.1.1.1. Lễ tân bấm nút “Đồng ý”. 4.1.1.1.1. Hệ thống thông báo đã hủy yêu cầu ghép lớp và quay lại trang Lớp cần gia sư. 4.1.1.2. Lễ tân bấm nút “Hủy” 4.1.1.2.1. Hệ thống quay lại với form tạo lớp. 7.1. Lễ tân bấm "Hủy" tại popup xác nhận. 7.1.1. Hệ thống quay trở lại form tạo lớp. |

## **UC-REC-03: Chọn gia sư từ danh sách đăng ký** 

| Mã UC | UC-REC-03 |
| :---- | :---- |
| **Tên UC** | Chọn gia sư từ danh sách đăng ký trên hệ thống |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | Lễ tân đã đăng nhập, đang ở trang Lớp cần gia sư. Lớp cần gia sư đã đủ thời gian và có gia sư đăng ký lớp này. Lễ tân đã trao đổi với phụ huynh và chọn ra được 1 bạn gia sư phù hợp. Bạn gia sư đã được trung tâm liên hệ, cung cấp thông tin phụ huynh để liên hệ. Bạn gia sư liên hệ với phụ huynh xong, chốt được lịch dạy thử thì liên hệ lại với trung tâm để thông báo. |
| **Hậu điều kiện** | Tự động tạo mới 1 đơn ghép lớp, ở trạng thái “Đang dạy thử”. |
| **Kịch bản chính** | Lễ tân bấm nút "Danh sách gia sư” để xem list gia sư đã đăng ký lớp ở trong 1 lớp cần gia sư. Hệ thống mở modal hiển thị danh sách gia sư đã đăng ký apply, gồm: Tên GS, Thời gian đăng ký, Lời nhắn của GS và 2 nút “Chọn gia sư”, “Hủy”. Lễ tân chọn gia sư mà phụ huynh đã chọn từ trong danh sách và bấm nút "Chọn gia sư". Hệ thống hiển thị popup xác nhận: "Bạn xác nhận chọn gia sư chứ?" kèm 2 nút Đồng ý/Hủy Lễ tân bấm "Đồng ý". Hệ thống thông báo thao tác thành công, tự động tạo mới 1 đơn ghép lớp, ở trạng thái “Đang dạy thử”. |
| **Ngoại lệ** | 1.1. Không có gia sư nào đăng ký, hệ thống không cho bấm nút “Danh sách gia sư”  5.1. Lễ tân chọn gia sư nhưng ấn nút Hủy. 5.1.1. Hệ thống quay lại trang “Danh sách gia sư”.  |

## **UC-REC-04: Hủy lớp cần gia sư**

| Mã UC | UC-REC-04 |
| :---- | :---- |
| **Tên UC** | Hủy lớp cần gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | Lễ tân đã đăng nhập, đang ở trang Lớp cần gia sư. Phụ huynh gọi điện thông báo là không còn nhu cầu tìm gia sư nữa. |
| **Hậu điều kiện** | Lớp cần gia sư chuyển sang trạng thái "Đã hủy". Lớp cần gia sư hiển thị ở trên trang gia sư cũng bị gỡ xuống, thông báo cho các gia sư đã apply lớp về sự việc.  |
| **Kịch bản chính** | 1\. Hệ thống đang hiển thị danh sách các lớp cần gia sư.  2\. Lễ tân bấm nút "Hủy lớp”. 3\. Hệ thống hiển thị input để nhập lí do hủy và xác nhận: "Bạn chắc chắn muốn hủy lớp này?" kèm 2 nút Hủy/Đồng ý 4\. Lễ tân nhập lí do và bấm "Đồng ý". 5\. Hệ thống cập nhật trạng thái → "Đã hủy", gửi lí do hủy tới các gia sư (nếu đã đăng ký lớp). |
| **Ngoại lệ** | 4.1. Lễ tân bấm "Hủy" tại popup 4.1.1. Hệ thống quay lại trang cũ, không thay đổi |

## **UC-REC-05: Tạo Đơn ghép lớp** 

| Mã UC | UC-REC-05 |
| :---- | :---- |
| **Tên UC** | Tạo đơn ghép lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại yêu cầu ghép lớp chỉ đích danh gia sư từ phụ huynh.  |
| **Hậu điều kiện** | Xuất hiện đơn ghép lớp mới |
| **Kịch bản chính** | Lễ tân chọn mục Đơn ghép lớp từ trang chủ Lễ tân. Hệ thống hiển thị danh sách yêu cầu với 6 tab trạng thái: Chờ xử lý, Đã gửi lên hệ thống, Đang dạy thử, Đã ghép thành công, Đang ghép lại, Đã hủy. Và nút Tạo mới đơn ghép lớp. Lễ tân click nút Tạo mới đơn ghép lớp. Hệ thống hiển thị form đăng ký lớp: Họ tên phụ huynh, SDT, họ tên học sinh, mã gia sư, họ tên gia sư, Tên lớp, số buổi/ tuần, thời gian mỗi buổi, hình thức học, học phí. Và 2 nút Tạo đơn, Hủy. Lễ tân nhập thông tin vào form, sau đó ấn nút Tạo đơn. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ?" kèm 2 nút Đồng ý/Hủy. Lễ tân bấm "Đồng ý". Hệ thống hiển thị thông báo thao tác thành công, đồng thời tạo mới đơn ghép lớp. |
| **Ngoại lệ** | 5.1. Lễ tân bấm nút “Hủy” 5.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy tạo đơn ghép lớp này?” và 2 nút “Đồng ý”, “Hủy”. 5.1.1.1. Lễ tân bấm nút “Đồng ý”. 5.1.1.1.1. Hệ thống quay trở lại trang Đơn ghép lớp. 5.1.1.2. Lễ tân bấm nút “Hủy” 5.1.1.2.1. Hệ thống quay lại form tạo đơn ghép lớp 7.1. Lễ tân bấm "Hủy" tại popup xác nhận 7.1.1. Hệ thống quay lại form tạo đơn ghép lớp. |

## **UC-REC-06: Duyệt Đơn ghép lớp** 

| Mã UC | UC-REC-06 |
| :---- | :---- |
| **Tên UC** | Duyệt đơn ghép lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại đơn ghép lớp ở trạng thái “Chờ xử lý”. 3\. Gia sư đã nhận được offer khi phụ huynh đăng ký. 4\. Trung tâm đã trao đổi với gia sư và nhận được sự đồng ý nhận lớp. |
| **Hậu điều kiện** | Yêu cầu chuyển "Chờ xử lý" → "Đang dạy thử" |
| **Kịch bản chính** | 1\. Lễ tân chọn mục Đơn ghép lớp từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách yêu cầu với 5 tab trạng thái: Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Lễ tân chọn vào mục Chờ xử lý. 4\. Hệ thống hiển thị ra list danh sách đơn ghép lớp và nút "Xác nhận đơn",  “Hủy đơn”. 5\. Lễ tân đọc thông tin đơn và bấm nút  "Xác nhận đơn". 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ?" kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, đồng thời chuyển trạng thái đơn thành "Đang dạy thử”. |
| **Ngoại lệ** | 5.1. Lễ tân bấm nút “Hủy đơn” 5.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy đơn ghép lớp này?” và 2 nút “Đồng ý”, “Hủy”. 5.1.1.1. Lễ tân bấm nút “Đồng ý”. 5.1.1.1.1. Hệ thống thông báo đã hủy yêu cầu ghép lớp và chuyển đơn sang mục “Đã hủy”. 5.1.1.2. Lễ tân bấm nút “Hủy” 5.1.1.2.1. Hệ thống quay lại trang “Chờ xử lý”. 7.1. Lễ tân bấm "Hủy" tại popup xác nhận 7.1.1. Hệ thống quay lại trang yêu cầu, không có thay đổi. |

## **UC-REC-06.1: Duyệt đơn ghép lớp từ dạy thử sang ghép thành công** 

| Mã UC | UC-REC-06.1 |
| :---- | :---- |
| **Tên UC** | Duyệt đơn ghép lớp từ dạy thử sang ghép thành công |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Tồn tại đơn ghép lớp ở trạng thái “Đang dạy thử”. 3\. Gia sư đã hoàn thành buổi dạy thử và hai bên (phụ huynh, gia sư) thống nhất tiếp tục học chính thức. |
| **Hậu điều kiện** | 1\. Đơn ghép lớp chuyển từ "Đang dạy thử" → "Ghép thành công". 2\. Lớp học tương ứng chuyển từ `TRIAL` sang `ACTIVE`. |
| **Kịch bản chính** | 1\. Lễ tân chọn mục Quản lý đơn ghép lớp từ menu điều hướng. 2\. Hệ thống hiển thị danh sách yêu cầu với các tab: Tất cả, Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Lễ tân chọn tab “Đang dạy thử”. 4\. Hệ thống hiển thị danh sách đơn đang dạy thử kèm nút "Xác nhận ghép thành công", "Ghép lại", "Hủy đơn", "Xem chi tiết". 5\. Lễ tân bấm nút "Xác nhận ghép thành công". 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ? Xác nhận hoàn tất dạy thử và chuyển đơn sang trạng thái Ghép thành công?" kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, chuyển đơn sang tab "Ghép thành công" và cập nhật lớp học sang trạng thái chính thức (ACTIVE). |
| **Ngoại lệ** | 5.1. Lễ tân bấm nút “Hủy đơn”. 5.1.1. Hệ thống chuyển sang luồng UC-REC-07 (Hủy đơn ghép lớp). 5.2. Dạy thử thất bại, Lễ tân bấm nút “Ghép lại”. 5.2.1. Hệ thống hỏi ý phụ huynh: nếu phụ huynh chọn tìm gia sư khác thì đơn chuyển trạng thái “Đang ghép lại” (REMATCH), mở lại vòng ứng tuyển với gia sư mới; khi ghép được gia sư mới thì đơn chuyển “Đã ghép” (MATCHED). Nếu phụ huynh không muốn tìm gia sư nữa thì chuyển sang luồng UC-REC-07 (Hủy đơn ghép lớp). 7.1. Lễ tân bấm "Hủy" tại popup xác nhận. 7.1.1. Hệ thống quay lại trang danh sách, không có thay đổi. |

## **UC-REC-07: Hủy đơn ghép lớp**

| Mã UC | UC-REC-07 |
| :---- | :---- |
| **Tên UC** | Hủy đơn ghép lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Tồn tại yêu cầu ghép lớp ở trạng thái "Chờ xử lý" hoặc “Đang dạy thử” hoặc “Ghép thành công”. 3\. Gia sư hoặc Phụ huynh yêu cầu ghép lại lớp. |
| **Hậu điều kiện** | 1\. Đơn ghép lớp bị đổi trạng thái sang “Đã hủy”. 2\. Thông báo hủy lớp được thông báo đến các bên liên quan. (Ngoài ra, khi dạy thử thất bại mà phụ huynh chọn tìm gia sư khác thì đơn không hủy mà chuyển “Đang ghép lại” (REMATCH) — xem nhánh 5.2 của UC-REC-06.1 và kịch bản 5a dưới đây.) |
| **Kịch bản chính** | 1\. Lễ tân chọn mục Đơn ghép lớp từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách yêu cầu với 5 tab trạng thái: Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Lễ tân mở yêu cầu ghép lớp ở mục “Chờ xử lý” hoặc "Đang dạy thử" hoặc “Ghép thành công”. 4\. Hệ thống hiển thị ra danh sách các đơn và nút “Xác nhận đơn”, “Hủy đơn”. 5\. Lễ tân bấm nút "Hủy đơn". 6\. Hệ thống hiển thị ô input nhập lí do hủy và popup xác nhận: "Bạn chắc chắn hủy đơn ghép lớp này chứ?" kèm 2 nút Hủy/Đồng ý 7\. Lễ tân nhập lí do hủy và bấm "Đồng ý". 8\. Hệ thống hiển thị kết quả thao tác thành công, gửi thông báo tới gia sư. 5a. Khi lớp đang dạy thử thất bại và phụ huynh không muốn tìm gia sư khác nữa: Lễ tân xử lý hủy đơn tại đây — đơn chuyển “Đã hủy” (CANCELLED), lượt ứng tuyển SELECTED của gia sư cũ chuyển TERMINATED. Nếu phụ huynh chọn tìm gia sư khác thì không hủy đơn mà chuyển nhánh “Ghép lại” tại UC-REC-06.1 (đơn REMATCH, gia sư cũ bị loại khỏi đơn do ràng buộc UNIQUE nên không thể ứng tuyển lại đơn đó). |
| **Ngoại lệ** | 7.1. Lễ tân bấm nút Hủy. 7.1.1. Hệ thống quay lại giao diện trang Đơn ghép lớp. |

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
| **Kịch bản chính** | 1\. Lễ tân chọn mục "Quản lý phí ghép lớp" từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách thanh toán với các tab: Chưa nộp minh chứng, Chờ duyệt, Đã duyệt, Yêu cầu nộp lại và nút tạo đơn. 3\. Lễ tân nhấn nút tạo đơn. 4\. Hệ thống hiển thị form để nhập minh chứng vào:  \- Thông tin lớp học: Mã lớp, Tên môn/khối lớp, Hình thức dạy, Địa chỉ. \- Thông tin các bên: Gia sư phụ trách, Học sinh, Phụ huynh. \- Lịch học cố định đã chốt: Các thứ trong tuần, khung giờ học, ngày bắt đầu. \- Tỷ lệ phí: Hiển thị tỷ lệ phí của đơn ghép lớp này (mặc định 40%, chỉnh được trong khoảng 0–50% trước khi lớp có gia sư được chọn; sau đó chỉ đọc). \- Học phí mỗi buổi: Số tiền VNĐ. \- Số buổi mỗi tuần: Số lượng buổi. \- Tổng số tiền phải nộp: Được tính tự động và hiển thị cố định dạng chữ và số. \- Thông tin minh chứng (nếu có): Ảnh biên lai, người tải lên, thời điểm tải lên. \- 2 nút Gửi, Hủy. 5\. Lễ tân điền đầy đủ thông tin vào và ấn nút Gửi 6\. Hệ thống hiển thị popup xác nhận: "Bạn chắc chắn muốn gửi minh chứng thanh toán này không?” kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm nút Đồng ý 8\. Hệ thống thông báo duyệt thành công, cập nhật trạng thái phí thành "Đã duyệt", mở khóa liên hệ và ghi Audit Log. |
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

