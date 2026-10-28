**ĐẶC TẢ USE CASE**  
  **QUẢN TRỊ VIÊN (ADMMIN)**

# **PHẦN I. MÔ TẢ VAI TRÒ ADMMIN TRONG HỆ THỐNG**

## **1.1 Định nghĩa vai trò**

Admin (Quản trị viên) là người vận hành trung tâm gia sư, chịu trách nhiệm điều phối toàn bộ quy trình từ khi phụ huynh gửi yêu cầu tìm gia sư cho đến khi lớp học vận hành ổn định và phí nhận lớp được đối soát thành công. Admin đóng vai trò trung gian kết nối Phụ huynh — Gia sư — Học sinh, đảm bảo chất lượng dịch vụ, giám sát vận hành và duy trì tính minh bạch tài chính của trung tâm.

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
| Quản lý nhân sự Lễ tân, Kế toán | Thêm mới, chỉnh sửa thông tin, phân quyền và quản lý trạng thái hoạt động của nhân viên trung tâm. |
| Xử lý khiếu nại & Đối soát tài chính | Giám sát toàn bộ khiếu nại (Hoàn tiền / Ghép lại lớp) do Lễ tân tiếp nhận, duyệt xử lý và đối soát dòng tiền thu \- chi |

 

## **1.3 Các luồng nghiệp vụ chính**

Tóm tắt 7 luồng nghiệp vụ chính:

| Luồng | Tên | Mô tả ngắn |
| :---- | :---- | :---- |
| LN-1 | Tạo lớp cần gia sư, đơn ghép lớp | Từ yêu cầu PH → Tư vấn (\<12h) → Tạo Offer → GS chấp nhận → Lớp ACTIVE (nếu dạy thử thất bại: Phụ huynh chọn ghép lại → Đơn REMATCH → chọn gia sư mới) |
| LN-2 | Duyệt phí nhận lớp (QR Proof) | Sau 1 tháng dạy → GS nộp MC → Duyệt / Yêu cầu gửi lại |
| LN-3 | Quản lý Gia sư | Duyệt hồ sơ mới → Quản lý trạng thái → Sửa/Xóa thông tin |
| LN-4 | Quản lý Học sinh | Duyệt hồ sơ → Tạo tài khoản sau khi thanh toán OK |
| LN-5 | Giám sát & Báo cáo vận hành | Dashboard thống kê, biểu đồ doanh thu, xuất báo cáo |
| LN-6 | Quản lý nhân sự  | CRUD, cấp quyền, theo dõi hoạt động và trạng thái nhân sự |
| LN-7 | Giám sát khiếu nại & Đối soát thu chi | Tiếp nhận khiếu nại tại quầy → Phân loại hoàn tiền/đổi lớp → Đối soát doanh thu thực |

 

# **PHẦN II. BẢNG MÔ TẢ USE CASE CHI TIẾT**

## **UC-ADM-01: Tạo lớp cần gia sư**

| Mã UC | UC-ADM-01 |
| :---- | :---- |
| **Tên UC** | Tạo lớp cần gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại yêu cầu tìm gia sư từ phụ huynh (Điền form, liên hệ) tới trung tâm, phụ huynh chưa biết cần chọn gia sư nào. |
| **Hậu điều kiện** | Tạo ra lớp cần gia sư, đăng lên trên trang gia sư để họ vào đăng ký lớp. |
| **Kịch bản chính** | 1\. Admin chọn mục “Lớp cần gia sư” từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách lớp cần gia sư (Sắp xếp theo thời gian đăng sớm nhất, số lượng gia sư ứng tuyển nhiều nhất), phân thành 5 mục: Chờ xử lý, Đã đăng, Đang ghép lại (REMATCH), Đã xử lý, Đã hủy và nút Tạo mới lớp. 3\. Admin nhấn vào nút Tạo mới lớp. 4\. Hệ thống hiển thị ra form tạo lớp gồm các ô input: Họ tên PH (Chưa public), SDT (Chưa public), Họ tên HS (Chưa public), yêu cầu lớp học, hình thức học, mức phí theo buổi, số buổi/ tuần, thời gian học, yêu cầu gia sư. Và 2 nút Tạo lớp, Hủy. 5\. Admin điền thông tin và bấm nút  “Tạo lớp”. 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận tạo lớp học này chứ?" kèm 2 nút Đồng ý/Hủy 7\. Admin bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, đồng thời chuyển trạng thái đơn thành "Chưa đủ thời gian”. |
| **Ngoại lệ** | 4.1. Admin bấm nút “Hủy lớp” 4.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy tạo lớp này?” và 2 nút “Đồng ý”, “Hủy”. 4.1.1.1. Admin bấm nút “Đồng ý”. 4.1.1.1.1. Hệ thống thông báo đã hủy yêu cầu ghép lớp và quay lại trang Lớp cần gia sư. 4.1.1.2. Admin bấm nút “Hủy” 4.1.1.2.1. Hệ thống quay lại với form tạo lớp. 7.1. Admin bấm "Hủy" tại popup xác nhận. 7.1.1. Hệ thống quay trở lại form tạo lớp. |

## **UC-ADM-02: Chọn gia sư từ danh sách đăng ký** 

| Mã UC | UC-ADM-02 |
| :---- | :---- |
| **Tên UC** | Chọn gia sư từ danh sách đăng ký trên hệ thống |
| **Actor** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập, đang ở trang Lớp cần gia sư. Lớp cần gia sư đã đủ thời gian và có gia sư đăng ký lớp này. Admin đã trao đổi với phụ huynh và chọn ra được 1 bạn gia sư phù hợp. Bạn gia sư đã được trung tâm liên hệ, cung cấp thông tin phụ huynh để liên hệ. Bạn gia sư liên hệ với phụ huynh xong, chốt được lịch dạy thử thì liên hệ lại với trung tâm để thông báo. |
| **Hậu điều kiện** | Tự động tạo mới 1 đơn ghép lớp, ở trạng thái “Đang dạy thử”. |
| **Kịch bản chính** | Admin bấm nút "Danh sách gia sư” để xem list gia sư đã đăng ký lớp ở trong 1 lớp cần gia sư. Hệ thống mở modal hiển thị danh sách gia sư đã đăng ký apply, gồm: Tên GS, Thời gian đăng ký, Lời nhắn của GS và 2 nút “Chọn gia sư”, “Hủy”. Admin chọn gia sư mà phụ huynh đã chọn từ trong danh sách và bấm nút "Chọn gia sư". Hệ thống hiển thị popup xác nhận: "Bạn xác nhận chọn gia sư chứ?" kèm 2 nút Đồng ý/Hủy Admin bấm "Đồng ý". Hệ thống thông báo thao tác thành công, tự động tạo mới 1 đơn ghép lớp, ở trạng thái “Đang dạy thử”. |
| **Ngoại lệ** | 1.1. Không có gia sư nào đăng ký, hệ thống không cho bấm nút “Danh sách gia sư”  5.1. Admin chọn gia sư nhưng ấn nút Hủy. 5.1.1. Hệ thống quay lại trang “Danh sách gia sư”.  |

## **UC-ADM-03: Hủy lớp cần gia sư**

| Mã UC | UC-ADM-03 |
| :---- | :---- |
| **Tên UC** | Hủy lớp cần gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập, đang ở trang Lớp cần gia sư. Phụ huynh gọi điện thông báo là không còn nhu cầu tìm gia sư nữa. |
| **Hậu điều kiện** | Lớp cần gia sư chuyển sang trạng thái "Đã hủy". Lớp cần gia sư hiển thị ở trên trang gia sư cũng bị gỡ xuống, thông báo cho các gia sư đã apply lớp về sự việc.  |
| **Kịch bản chính** | 1\. Hệ thống đang hiển thị danh sách các lớp cần gia sư.  2\. Admin bấm nút "Hủy lớp”. 3\. Hệ thống hiển thị input để nhập lí do hủy và xác nhận: "Bạn chắc chắn muốn hủy lớp này?" kèm 2 nút Hủy/Đồng ý 4\. Admin nhập lí do và bấm "Đồng ý". 5\. Hệ thống cập nhật trạng thái → "Đã hủy", gửi lí do hủy tới các gia sư (nếu đã đăng ký lớp). |
| **Ngoại lệ** | 4.1. Admin bấm "Hủy" tại popup 4.1.1. Hệ thống quay lại trang cũ, không thay đổi |

## **UC-ADM-04: Tạo Đơn ghép lớp** 

| Mã UC | UC-ADM-04 |
| :---- | :---- |
| **Tên UC** | Tạo đơn ghép lớp |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại yêu cầu ghép lớp chỉ đích danh gia sư từ phụ huynh.  |
| **Hậu điều kiện** | Xuất hiện đơn ghép lớp mới |
| **Kịch bản chính** | Admin chọn mục Đơn ghép lớp từ trang chủ Admin. Hệ thống hiển thị danh sách yêu cầu với 6 tab trạng thái: Chờ xử lý, Đã gửi lên hệ thống, Đang dạy thử, Đã ghép thành công, Đang ghép lại, Đã hủy. Và nút Tạo mới đơn ghép lớp. Admin click nút Tạo mới đơn ghép lớp. Hệ thống hiển thị form đăng ký lớp: Họ tên phụ huynh, SDT, họ tên học sinh, mã gia sư, họ tên gia sư, Tên lớp, số buổi/ tuần, thời gian mỗi buổi, hình thức học, học phí. Và 2 nút Tạo đơn, Hủy. Admin nhập thông tin vào form, sau đó ấn nút Tạo đơn. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ?" kèm 2 nút Đồng ý/Hủy. Admin bấm "Đồng ý". Hệ thống hiển thị thông báo thao tác thành công, đồng thời tạo mới đơn ghép lớp. |
| **Ngoại lệ** | 5.1. Admin bấm nút “Hủy” 5.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy tạo đơn ghép lớp này?” và 2 nút “Đồng ý”, “Hủy”. 5.1.1.1. Admin bấm nút “Đồng ý”. 5.1.1.1.1. Hệ thống quay trở lại trang Đơn ghép lớp. 5.1.1.2. Admin bấm nút “Hủy” 5.1.1.2.1. Hệ thống quay lại form tạo đơn ghép lớp 7.1. Admin bấm "Hủy" tại popup xác nhận 7.1.1. Hệ thống quay lại form tạo đơn ghép lớp. |

## **UC-ADM-05: Duyệt Đơn ghép lớp** 

| Mã UC | UC-ADM-05 |
| :---- | :---- |
| **Tên UC** | Duyệt đơn ghép lớp |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại đơn ghép lớp ở trạng thái “Chờ xử lý”. 3\. Gia sư đã nhận được offer khi phụ huynh đăng ký. 4\. Trung tâm đã trao đổi với gia sư và nhận được sự đồng ý nhận lớp. |
| **Hậu điều kiện** | Yêu cầu chuyển "Chờ xử lý" → "Đang dạy thử" |
| **Kịch bản chính** | 1\. Admin chọn mục Đơn ghép lớp từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách yêu cầu với 5 tab trạng thái: Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Admin chọn vào mục Chờ xử lý. 4\. Hệ thống hiển thị ra list danh sách đơn ghép lớp và nút "Xác nhận đơn",  “Hủy đơn”. 5\. Admin đọc thông tin đơn và bấm nút  "Xác nhận đơn". 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ?" kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, đồng thời chuyển trạng thái đơn thành "Đang dạy thử”. |
| **Ngoại lệ** | 5.1. Admin bấm nút “Hủy đơn” 5.1.1. Hệ thống hiển thị thông báo xác nhận: “Bạn muốn hủy đơn ghép lớp này?” và 2 nút “Đồng ý”, “Hủy”. 5.1.1.1. Admin bấm nút “Đồng ý”. 5.1.1.1.1. Hệ thống thông báo đã hủy yêu cầu ghép lớp và chuyển đơn sang mục “Đã hủy”. 5.1.1.2. Admin bấm nút “Hủy” 5.1.1.2.1. Hệ thống quay lại trang “Chờ xử lý”. 7.1. Admin bấm "Hủy" tại popup xác nhận 7.1.1. Hệ thống quay lại trang yêu cầu, không có thay đổi. |

## **UC-ADM-05.1: Duyệt đơn ghép lớp từ dạy thử sang ghép thành công** 

| Mã UC | UC-ADM-05.1 |
| :---- | :---- |
| **Tên UC** | Duyệt đơn ghép lớp từ dạy thử sang ghép thành công |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Tồn tại đơn ghép lớp ở trạng thái “Đang dạy thử”. 3\. Gia sư đã hoàn thành buổi dạy thử và hai bên (phụ huynh, gia sư) thống nhất tiếp tục học chính thức. |
| **Hậu điều kiện** | 1\. Đơn ghép lớp chuyển từ "Đang dạy thử" → "Ghép thành công". 2\. Lớp học tương ứng chuyển từ `TRIAL` sang `ACTIVE`. |
| **Kịch bản chính** | 1\. Admin chọn mục Quản lý đơn ghép lớp từ menu điều hướng. 2\. Hệ thống hiển thị danh sách yêu cầu với các tab: Tất cả, Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Admin chọn tab “Đang dạy thử”. 4\. Hệ thống hiển thị danh sách đơn đang dạy thử kèm nút "Xác nhận ghép thành công", "Ghép lại", "Hủy đơn", "Xem chi tiết". 5\. Admin bấm nút "Xác nhận ghép thành công". 6\. Hệ thống hiển thị popup xác nhận: "Bạn xác nhận thao tác của mình chứ? Xác nhận hoàn tất dạy thử và chuyển đơn sang trạng thái Ghép thành công?" kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống hiển thị thông báo thao tác thành công, chuyển đơn sang tab "Ghép thành công" và cập nhật lớp học sang trạng thái chính thức (ACTIVE). |
| **Ngoại lệ** | 5.1. Admin bấm nút “Hủy đơn”. 5.1.1. Hệ thống chuyển sang luồng UC-ADM-06 (Hủy đơn ghép lớp). 5.2. Dạy thử thất bại, Admin bấm nút “Ghép lại”. 5.2.1. Hệ thống hỏi ý phụ huynh: nếu phụ huynh chọn tìm gia sư khác thì đơn chuyển trạng thái “Đang ghép lại” (REMATCH), mở lại vòng ứng tuyển với gia sư mới; khi ghép được gia sư mới thì đơn chuyển “Đã ghép” (MATCHED). Nếu phụ huynh không muốn tìm gia sư nữa thì chuyển sang luồng UC-ADM-06 (Hủy đơn ghép lớp). 7.1. Admin bấm "Hủy" tại popup xác nhận. 7.1.1. Hệ thống quay lại trang danh sách, không có thay đổi. |

## **UC-ADM-06: Hủy đơn ghép lớp**

| Mã UC | UC-ADM-06 |
| :---- | :---- |
| **Tên UC** | Hủy đơn ghép lớp |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Tồn tại yêu cầu ghép lớp ở trạng thái "Chờ xử lý" hoặc “Đang dạy thử” hoặc “Ghép thành công”. 3\. Gia sư hoặc Phụ huynh yêu cầu ghép lại lớp. |
| **Hậu điều kiện** | 1\. Đơn ghép lớp bị đổi trạng thái sang “Đã hủy”. 2\. Thông báo hủy lớp được thông báo đến các bên liên quan. (Ngoài ra, khi dạy thử thất bại mà phụ huynh chọn tìm gia sư khác thì đơn không hủy mà chuyển “Đang ghép lại” (REMATCH) — xem nhánh 5.2 của UC-ADM-05.1 và kịch bản 5a dưới đây.) |
| **Kịch bản chính** | 1\. Admin chọn mục Đơn ghép lớp từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách yêu cầu với 5 tab trạng thái: Chờ xử lý, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy. 3\. Admin mở yêu cầu ghép lớp ở mục “Chờ xử lý” hoặc "Đang dạy thử" hoặc “Ghép thành công”. 4\. Hệ thống hiển thị ra danh sách các đơn và nút “Xác nhận đơn”, “Hủy đơn”. 5\. Admin bấm nút "Hủy đơn". 6\. Hệ thống hiển thị ô input nhập lí do hủy và popup xác nhận: "Bạn chắc chắn hủy đơn ghép lớp này chứ?" kèm 2 nút Hủy/Đồng ý 7\. Admin nhập lí do hủy và bấm "Đồng ý". 8\. Hệ thống hiển thị kết quả thao tác thành công, gửi thông báo tới gia sư. 5a. Khi lớp đang dạy thử thất bại và phụ huynh không muốn tìm gia sư khác nữa: Admin xử lý hủy đơn tại đây — đơn chuyển “Đã hủy” (CANCELLED), lượt ứng tuyển SELECTED của gia sư cũ chuyển TERMINATED. Nếu phụ huynh chọn tìm gia sư khác thì không hủy đơn mà chuyển nhánh “Ghép lại” tại UC-ADM-05.1 (đơn REMATCH, gia sư cũ bị loại khỏi đơn do ràng buộc UNIQUE nên không thể ứng tuyển lại đơn đó). |
| **Ngoại lệ** | 7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống quay lại giao diện trang Đơn ghép lớp. |

## **UC-ADM-07: Duyệt hồ sơ Gia sư đăng ký mới**

| Mã UC | UC-ADM-07 |
| :---- | :---- |
| **Tên UC** | Duyệt hồ sơ Gia sư đăng ký mới |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ Gia sư ở trạng thái Chờ duyệt |
| **Hậu điều kiện** | 1\. Nếu Duyệt: Hồ sơ GS chuyển trạng thái → Đang hoạt động, GS có thể nhận Match Offer 2\. Nếu Từ chối: Hồ sơ bị loại, GS nhận thông báo từ chối (Lưu ý: trạng thái hoạt động (profile_status) là riêng với cờ "Đang mở nhận lớp" (is_open_to_teaching) do gia sư tự bật/tắt trên hồ sơ — tắt cờ thì gia sư không thấy đơn ghép lớp đang mở và không ứng tuyển, nhưng vẫn giữ các lớp đang dạy.) |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Gia sư", chọn tab "Chờ duyệt" 2\. Hệ thống hiển thị danh sách Gia sư chờ duyệt. 3\. Admin bấm vào một hồ sơ GS. 4\. Hệ thống hiển thị thông tin chi tiết: họ tên, SĐT, ngày tháng năm sinh, quê quán, email, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Duyệt, Không duyệt. 5\. Admin bấm nút "Duyệt". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống cập nhật trạng thái GS, ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin bấm nút “Không duyệt”. 5.1.1. Hệ thống hiển thị pop up xác nhận và 2 nút Đồng ý/ Hủy. 5.1.1.1. Admin bấm nút Đồng ý. 5.1.1.1.1. Hệ thống hiển thị thông báo đã từ chối hồ sơ của Gia sư. 5.1.1.2. Admin bấm nút Hủy. 5.1.1.2.1. Hệ thống quay trở lại trang cũ. (Trang chờ duyệt) 7.1. Gia sư bấm nút Hủy 7.1.1. Hệ thống quay trở lại trang cũ (Trang chờ duyệt). |

## **UC-ADM-08: Quản lý thông tin gia sư**

| Mã UC | UC-ADM-08 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại ít nhất 1 Gia sư trong hệ thống |
| **Hậu điều kiện** | 1\. Hồ sơ gia sư sẽ không thay đổi nếu chỉ xem.2\. Hồ sơ gia sư sẽ được cập nhật thay đổi khi Admin chỉnh sửa. (Lưu ý: trạng thái hoạt động (profile_status) là riêng với cờ "Đang mở nhận lớp" (is_open_to_teaching) do gia sư tự bật/tắt trên hồ sơ — tắt cờ thì gia sư không thấy đơn ghép lớp đang mở và không ứng tuyển, nhưng vẫn giữ các lớp đang dạy.) |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Gia sư" từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách GS với 3 tab: Chờ duyệt / Đang hoạt động / Ngưng hoạt động và 2 button Xem GS. 3\. Admin bấm button “Xem GS" ở 1 hồ sơ gia sư bất kỳ. 4\. Hệ thống hiển thị modal thông tin chi tiết GS gồm:  họ tên, SĐT, ngày tháng năm sinh, quê quán, email, trạng thái hoạt động, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Lưu, Đóng. 5\. Admin xem chi tiết được thông tin GS, đồng thời cũng có thể chỉnh sửa thông tin GS ở trường như trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của gia sư không?” và 2 nút Đồng ý/ Hủy. 7\. Admin ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin gia sư” và quay lại trang Quản lý GS. |
| **Ngoại lệ** | 7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết GS. |

## **UC-ADM-09: Tạo đơn xác minh phí nhận lớp** 

| Mã UC | UC-ADM-09 |
| :---- | :---- |
| **Tên UC** | Tạo đơn xác minh phí nhận lớp |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Phụ huynh đóng tiền trước cho lớp Onine và đã gửi ảnh minh chứng chuyển khoản hoặc đến tận nơi đóng tiền mặt.  |
| **Hậu điều kiện** | Đơn đang ở trạng thái “Chờ duyệt” |
| **Kịch bản chính** | 1\. Admin chọn mục "Quản lý phí ghép lớp" từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách thanh toán với các tab: Chưa nộp minh chứng, Chờ duyệt, Đã duyệt, Yêu cầu nộp lại và nút tạo đơn. 3\. Admin nhấn nút tạo đơn. 4\. Hệ thống hiển thị form để nhập minh chứng vào:  \- Thông tin lớp học: Mã lớp, Tên môn/khối lớp, Hình thức dạy, Địa chỉ. \- Thông tin các bên: Gia sư phụ trách, Học sinh, Phụ huynh. \- Lịch học cố định đã chốt: Các thứ trong tuần, khung giờ học, ngày bắt đầu. \- Tỷ lệ phí: Hiển thị tỷ lệ phí của đơn ghép lớp này (mặc định 40%, chỉnh được trong khoảng 0–50% trước khi lớp có gia sư được chọn; sau đó chỉ đọc). \- Học phí mỗi buổi: Số tiền VNĐ. \- Số buổi mỗi tuần: Số lượng buổi. \- Tổng số tiền phải nộp: Được tính tự động và hiển thị cố định dạng chữ và số. \- Thông tin minh chứng (nếu có): Ảnh biên lai, người tải lên, thời điểm tải lên. \- 2 nút Gửi, Hủy. 5\. Admin điền đầy đủ thông tin vào và ấn nút Gửi 6\. Hệ thống hiển thị popup xác nhận: "Bạn chắc chắn muốn gửi minh chứng thanh toán này không?” kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm nút Đồng ý 8\. Hệ thống thông báo duyệt thành công, cập nhật trạng thái phí thành "Đã duyệt", mở khóa liên hệ và ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin điền thiếu thông tin và bấm nút Gửi. 5.1.1. Hệ thống yêu cầu gia sư nhập đầy đủ thông tin trước khi gửi. |

## **UC-ADM-10: Quản lý thông tin Học sinh** 

| Mã UC | UC-ADM-10 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Học sinh |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ học sinh trong hệ thống. |
| **Hậu điều kiện** | Admin nắm được chi tiết hồ sơ học sinh, thông tin phụ huynh và gia sư phụ trách hiện tại. |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Học sinh".  2\. Hệ thống hiển thị danh sách học sinh (phân thành Đang hoạt động và Dừng hoạt động), thanh tìm kiếm/bộ lọc và nút Xem chi tiết. 3\. Admin bấm nút Xem chi tiết của 1 học sinh cần xem. 4\. Hệ thống hiển thị modal chi tiết gồm: Họ tên học sinh, ngày tháng năm sinh, địa chỉ, trường đang theo học, tên phụ huynh, SDT, Email, các lớp đã tham gia, các lớp đang tham gia, thời gian tạo account, trạng thái hoạt động. Và 2 nút Lưu, Đóng. 5\. Admin xem chi tiết được thông tin Học sinh, đồng thời cũng có thể chỉnh sửa thông tin HS như trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của HS không?” và 2 nút Đồng ý/ Hủy. 7\. Admin ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin HS” và quay lại trang Quản lý HS.  |
| **Ngoại lệ** | 7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết HS. |

## **UC-ADM-11: Quản lý nhân sự** 

| Mã UC | UC-ADM-11 |
| :---- | :---- |
| **Tên UC** | Quản lý nhân sự  |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống 2\. Tồn tại nhân sự Admin trong hệ thống. |
| **Hậu điều kiện** | Admin nắm được danh sách, thông tin công tác, trạng thái làm việc và số khiếu nại, duyệt thanh toán đã tiếp nhận của từng Admin |
| **Kịch bản chính** | 1\. Admin chọn mục "Quản lý Admin" từ menu Admin 2\. Hệ thống hiển thị danh sách nhân sự Admin kèm các tab lọc trạng thái: Tất cả, Đang hoạt động, Ngưng hoạt động, thanh tìm kiếm/ lọc và nút "Thêm nhân sự". 3\. Admin ấn vào nút Xem chi tiết để xem chi tiết lễ tân muốn xem. 4\. Hệ thống hiển thị Modal chi tiết từng nhân viên: Mã NV, Họ tên, Email, Số điện thoại, Vai trò (Role), Ngày vào làm, Trạng thái hoạt động cùng các nút Lưu và Đóng. 5\. Admin xem chi tiết được thông tin nhân sự, đồng thời cũng có thể chỉnh sửa thông tin nhân sự như  trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của nhân sự này không?” và 2 nút Đồng ý/ Hủy. 7\. Admin ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin nhân sự” và quay lại trang Quản lý Admin. |
| **Ngoại lệ** |  7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết Admin. |

## **UC-ADM-12: Thêm mới nhân sự**

| Mã UC | UC-ADM-12 |
| :---- | :---- |
| **Tên UC** | Thêm mới nhân sự Admin |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống 2\. Trung tâm có nhu cầu cấp tài khoản làm việc cho nhân viên mới |
| **Hậu điều kiện** | Tài khoản nhân sự mới được tạo trong hệ thống (role: ADMEPTIONIST, ADMOUNTANT) có thể đăng nhập làm việc |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý nhân sự". 2\. Hệ thống hiển thị danh sách nhân sự và nút "+ Thêm nhân sự". 3\. Admin bấm nút "Thêm nhân sự". 4\. Hệ thống hiển thị modal thêm mới gồm các trường: Họ tên, Email, Số điện thoại, Ngày vào làm, Trạng thái (mặc định Đang hoạt động) và 2 nút "Tạo tài khoản", "Hủy". 5\. Admin nhập đầy đủ thông tin nhân viên và bấm "Tạo tài khoản". 6\. Hệ thống hiển thị popup xác nhận: "Bạn có chắc chắn muốn tạo tài khoản nhân sự này?" kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống tạo tài khoản mới với tài khoản, mật khẩu giống với quy tắc tạo cho học sinh hiển thị thông báo tạo nhân sự thành công và ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin để trống Họ tên hoặc Email. 5.1.1. Hệ thống hiển thị cảnh báo "Vui lòng điền đầy đủ họ tên và email" và không cho phép tạo. 5.2. Admin bấm nút “Hủy” tại modal thêm mới. 5.2.1. Hệ thống đóng modal và không lưu dữ liệu. 5.3. Email hoặc Số điện thoại đã trùng với tài khoản khác trong hệ thống. 5.3.1. Hệ thống hiển thị thông báo lỗi "Email hoặc Số điện thoại đã được đăng ký". 7.1. Admin bấm "Hủy" tại popup xác nhận. 7.1.1. Hệ thống quay lại modal nhập thông tin. |

## **UC-ADM-13: Tạo đơn khiếu nại** 

| Mã UC | UC-ADM-13 |
| :---- | :---- |
| **Tên UC** | Tạo đơn khiếu nại |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống 2\. Phụ huynh/ gia sư có yêu cầu khiếu nại |
| **Hậu điều kiện** | Khiếu nại chuyển trạng thái sang "Chưa xử lý", lưu nội dung cần xử lý, người tạo đơn và thời điểm tạo đơn |
| **Kịch bản chính** | Admin truy cập trang "Xử lý khiếu nại" Hệ thống hiển thị danh sách các khiếu nại chia thành 3 loại: “Chờ xử lý”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Admin bấm nút “Tạo đơn” để tạo những khiếu nại mới.. Hệ thống hiển thị modal đơn khiếu nại gồm thông tin đơn: Họ tên người khiếu nại, SDT, Role, Mã lớp đang tham gia, Lí do khiếu nại và 2 nút "Tạo khiếu nại", "Hủy". Admin nhập các thông tin vào, và ấn nút “Tạo khiếu nại”. Hệ thống hiển thị thông báo đã tạo khiếu nại thành công, chuyển đơn về trạng thái “Chờ xử lý” |
| **Ngoại lệ** | 5.1. Admin click nút Hủy. 5.1.1. Hệ thống hiển thị thông báo “Bạn xác nhận hủy đi đơn khiếu nại này chứ?” và 2 nút Đồng ý, Hủy. 5.1.1.1. Admin click nút Đồng ý. 5.1.1.1.1. Hệ thống quay trở lại trang Quản lý đơn khiếu nại. 5.1.1.2. Admin click nút Hủy 5.1.1.2.1. Hệ thống quay trở lại Modal đơn khiếu nại. |

## **UC-ADM-14: Xem, sửa các đơn khiếu nại**

| Mã UC | UC-ADM-14 |
| :---- | :---- |
| **Tên UC** | Xem, sửa các đơn khiếu nại |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống 2\. Tồn tại khiếu nại được tiếp nhận bởi Admin tại quầy |
| **Hậu điều kiện** | 1\. Admin nắm được toàn bộ chi tiết đơn khiếu nại. 2\. Đơn khiếu nại có thể bị thay đổi khi admin thay đổi nó. |
| **Kịch bản chính** | Admin chọn mục "Xử lý khiếu nại" từ menu Admin. Hệ thống hiển thị danh sách các khiếu nại chia thành 2 loại: “Chờ xử lý”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Admin bấm nút "Xem chi tiết" ở một đơn khiếu nại. Hệ thống hiển thị modal chi tiết gồm: Mã đơn khiếu nại, loại khiếu nại,họ tên người gửi, vai trò, SĐT, mã lớp khiếu nại, Admin tiếp nhận, ngày giờ tiếp nhận, số tiền hoàn (nếu là hoàn tiền), nội dung chi tiết và trạng thái hiện tại.  Admin xem xong bấm nút "Đóng" hoặc icon "X". Hoặc có thể chỉnh sửa về nội dung, trạng thái hiện tại, sau đó bấm nút Lưu. Hệ thống hiển thị thông báo: “Bạn xác nhận thay đổi thông tin đơn khiếu nại này chứ?” và 2 nút Đồng ý/ Hủy. Admin bấm nút Đồng ý. Hệ thống hiển thị thông báo thao tác thành công, chuyển về trang “Xử lý khiếu nại”. |
| **Ngoại lệ** | 2.1. Không có khiếu nại nào trong hệ thống. 2.1.1. Hệ thống hiển thị thông báo "Chưa có khiếu nại nào". |

## **UC-ADM-15: Xác nhận giải quyết khiếu nại** 

| Mã UC | UC-ADM-15 |
| :---- | :---- |
| **Tên UC** | Xác nhận giải quyết khiếu nại |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống 2\. Tồn tại khiếu nại ở trạng thái "Chưa xử lý" |
| **Hậu điều kiện** | Khiếu nại chuyển trạng thái sang "Đã xử lý" (resolved), lưu nội dung kết quả xử lý và thời điểm giải quyết |
| **Kịch bản chính** | 1\. Admin truy cập trang "Xử lý khiếu nại", chọn tab "Chưa xử lý". 2\. Hệ thống hiển thị danh sách các khiếu nại cần giải quyết. 3\. Admin bấm nút "Giải quyết" tại dòng khiếu nại tương ứng. 4\. Hệ thống hiển thị modal giải quyết khiếu nại gồm thông tin đơn và ô nhập "Kết quả xử lý & Ghi chú", “Đính kèm minh chứng” kèm 2 nút "Xác nhận đã xử lí", "Hủy". 5\. Admin nhập chi tiết kết quả giải quyết (ví dụ: "Đã hoàn trả 450.000₫ qua ngân hàng MB Bank ngày 20/09/2026" hoặc "Đã ghép gia sư Nguyễn Lan Anh thay thế cho học sinh") kèm theo ảnh minh chứng rồi bấm nút "Xác nhận đã xử lí". 6\. Hệ thống hiển thị thông báo đã đánh dấu khiếu nại là "Đã xử lí", cập nhật trạng thái đơn, lưu thời gian giải quyết và ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin để trống ô "Kết quả xử lý". 5.1.1. Hệ thống hiển thị cảnh báo "Vui lòng nhập kết quả xử lý." và không cho phép xác nhận. 5.2. Admin đóng modal bằng icon "X". 5.2.1. Hệ thống quay lại trang danh sách khiếu nại. 5.3. Admin bấm nút “Hủy” tại modal giải quyết. 5.3.1. Hệ thống đóng modal và giữ nguyên trạng thái "Chưa xử lý". |

## **UC-ADM-16: Quản lý và theo dõi khoản phí nhận lớp**

| Thuộc tính | Nội dung đặc tả |
| :---- | :---- |
| **Mã UC** | **UC-ADM-16** |
| **Tên UC** | **Quản lý và theo dõi khoản phí nhận lớp** |
| **Actor** | Admin  |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Tồn tại ít nhất một khoản phí trong hệ thống. Khoản phí được hệ thống tự động sinh ra khi gia sư hoàn thành chốt lịch học cố định (UC-T09), số tiền được tính theo công thức: Số tiền phải nộp \= Tỷ lệ phí (%) × Số buổi/tuần × 4 × Học phí mỗi buổi. |
| **Hậu điều kiện** | 1\. Admin nắm bắt đầy đủ thông tin chi tiết của khoản phí. 2\. **Tỷ lệ phí nhận lớp và số tiền phải nộp được bảo toàn nguyên vẹn** khi đã có minh chứng; trước đó (lớp chưa có gia sư được chọn), Lễ tân/Admin được chỉnh tỷ lệ phí (0–50%) và số tiền phải nộp sẽ được tính lại. |
| **Kịch bản chính** | 1\. Admin chọn mục **"Khoản phí nhận lớp"**. 2\. Hệ thống hiển thị danh sách các khoản phí được phân loại rõ ràng theo 4 tab trạng thái: \- Tab 1: **Chưa nộp minh chứng** (NOT\_SUBMITTED) — Gia sư/Phụ huynh chưa nộp ảnh biên lai. \- Tab 2: **Chờ xác nhận** (SUBMITTED) — Đã có ảnh biên lai chuyển khoản hoặc phiếu thu tiền mặt, chờ Admin đối chiếu. \- Tab 3: **Đã xác nhận** (APPROVED) — Admin đã đối soát khớp tiền và xác nhận thành công. \- Tab 4: **Yêu cầu nộp lại** (RESUBMIT\_REQUIRED) — Admin hoặc Lễ tân đã từ chối minh chứng nghi ngờ và yêu cầu gửi lại. \- Thanh lọc tìm kiếm (theo mã lớp, tên/SĐT gia sư, tên học sinh/phụ huynh)  \- Mỗi dòng trong bảng danh sách hiển thị: Mã lớp, Người nộp, Học phí/buổi, Số buổi/tuần, **Tỷ lệ phí (Hiển thị dạng % của từng đơn ghép lớp, trong khoảng 0–50%, mặc định 40%)**, Số tiền phải nộp, Ngày tạo khoản phí, Trạng thái hiện tại và nút **"Xem chi tiết"** (kèm nút *"Đối chiếu"* nếu ở tab Chờ xác nhận). 3\. Admin bấm nút **"Xem chi tiết"** tại một khoản phí bất kỳ. 4\. Hệ thống hiển thị modal **"Chi tiết khoản phí nhận lớp"** gồm: \- Thông tin lớp học: Mã lớp, Tên môn/khối lớp, Hình thức dạy, Địa chỉ. \- Thông tin các bên: Gia sư phụ trách, Học sinh, Phụ huynh. \- Lịch học cố định đã chốt: Các thứ trong tuần, khung giờ học, ngày bắt đầu. \- **Công thức và giá trị tính phí (CHỈ ĐỌC \- READ ONLY)**: \+ Tỷ lệ phí: Hiển thị tỷ lệ phí của đơn ghép lớp (mặc định 40%, trong khoảng 0–50%; Admin/Lễ tân chỉnh được trước khi lớp có gia sư được chọn, sau đó chỉ đọc). \+ Học phí mỗi buổi: Số tiền VNĐ. \+ Số buổi mỗi tuần: Số lượng buổi. \+ Tổng số tiền phải nộp: Được tính tự động và hiển thị cố định dạng chữ và số. \- Trạng thái nộp phí hiện tại. \- Thông tin minh chứng (nếu có): Ảnh biên lai, người tải lên, thời điểm tải lên. \- Lịch sử xử lý: Người duyệt/yêu cầu nộp lại, thời điểm, lý do yêu cầu nộp lại (nếu trạng thái là RESUBMIT\_REQUIRED). \- Nút thao tác: Nút **"Đóng"** (và nút **"Chuyển sang đối chiếu"** nếu khoản phí đang ở trạng thái SUBMITTED). 5\. Admin xem xong thông tin và bấm nút "Đóng". Modal đóng lại, không có dữ liệu nào bị thay đổi. |
| **Ngoại lệ** | **2.1. Không có khoản phí nào phù hợp với bộ lọc:** 2.1.1. Hệ thống hiển thị thông báo "Không tìm thấy khoản phí nào phù hợp". |

## **UC-ADM-17: Đối chiếu và xác nhận khoản phí nhận lớp**

| Thuộc tính | Nội dung đặc tả |
| :---- | :---- |
| **Mã UC** | **UC-ADM-17** |
| **Tên UC** | **Đối chiếu và xác nhận khoản phí nhận lớp** |
| **Actor** | Admin  |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Tồn tại khoản phí ở trạng thái **"Chờ xác nhận"** (SUBMITTED), đã có ảnh minh chứng do Gia sư tải lên qua Cổng Gia sư, Phụ huynh nộp lớp Online, hoặc Lễ tân lập phiếu thu tiền mặt tại quầy. |
| **Hậu điều kiện** | 1\. **Nếu xác nhận hợp lệ**: Khoản phí chuyển sang trạng thái APPROVED ("Đã xác nhận"); lưu số tiền thực nhận, ID Admin duyệt (reviewed\_by), thời điểm duyệt (reviewed\_at); hệ thống tự động mở khóa thông tin liên hệ phụ huynh cho gia sư; gửi thông báo thành công cho người nộp; cộng tiền vào doanh thu; ghi audit\_logs (APPROVE\_PAYMENT). 2\. **Nếu yêu cầu nộp lại minh chứng nghi ngờ**: Khoản phí chuyển sang trạng thái RESUBMIT\_REQUIRED ("Yêu cầu nộp lại"); lưu lý do nghi ngờ (reject\_reason), ID Admin (reviewed\_by), thời điểm (reviewed\_at); hệ thống gửi thông báo kèm lý do chi tiết tới người nộp (Gia sư/Phụ huynh/Lễ tân) yêu cầu tải lại minh chứng; ghi audit\_logs (REQUEST\_RESUBMIT\_PAYMENT\_PROOF). |
| **Kịch bản chính** | 1\. Admin chọn tab **"Chờ xác nhận"** tại màn hình Quản lý khoản phí nhận lớp. 2\. Hệ thống hiển thị danh sách các khoản phí chờ xác nhận gồm: Mã lớp, Người nộp, Phương thức thanh toán (Chuyển khoản ngân hàng qua QR / Tiền mặt tại quầy), Số tiền phải nộp, Thời gian nộp minh chứng, Người tải minh chứng và nút **"Đối chiếu"**. 3\. Admin bấm nút **"Đối chiếu"** tại một khoản phí cần xử lý. 4\. Hệ thống hiển thị màn hình không gian làm việc Đối chiếu chứng từ chia 2 phần trực quan: \- **Phía bên trái (Khu vực soi chứng từ)**: Hiển thị ảnh biên lai chuyển khoản (QR Proof) hoặc phiếu thu tiền mặt; tích hợp công cụ phóng to/thu nhỏ (Zoom), xoay ảnh (Rotate), mở ảnh kích thước gốc trong tab mới để kiểm tra chi tiết các góc ảnh, con dấu, mã giao dịch, font chữ. \- **Phía bên phải (Khu vực thông tin & thao tác)**: \+ Thông tin người nộp: Họ tên, vai trò, số điện thoại. \+ Thông tin lớp: Mã lớp, môn học, gia sư, học sinh. \+ Cú pháp chuyển khoản mong đợi: Mã lớp kèm cú pháp chuẩn của trung tâm. \+ Số tiền quy định phải nộp: Hiển thị cố định (VNĐ). \+ Ô nhập: **"Số tiền thực nhận"** (VNĐ) — Mặc định gợi ý bằng số tiền phải nộp. \+ Các nút hành động: **"Xác nhận đã nhận"**, **"Yêu cầu nộp lại minh chứng"**, **"Đóng"**. 5\. Admin mở màn hình sao kê tài khoản ngân hàng của trung tâm (Internet Banking / phần mềm ngân hàng), tra cứu biến động số dư theo mã giao dịch, thời gian và nội dung. 6\. **Trường hợp thông tin khớp hoàn toàn và tiền đã vào tài khoản**: Admin kiểm tra số tiền thực tế ghi có, nhập giá trị vào ô "Số tiền thực nhận" và bấm nút **"Xác nhận đã nhận"**. 7\. Hệ thống hiển thị popup xác nhận: *"Bạn xác nhận trung tâm đã nhận thực tế \[Số tiền thực nhận\]₫ cho khoản phí lớp \[Mã lớp\] từ \[Tên người nộp\]?"* kèm 2 nút **Đồng ý** / **Hủy**. 8\. Admin bấm **"Đồng ý"**. 9\. Hệ thống thực hiện chuỗi xử lý tự động: \- Cập nhật trạng thái khoản phí thành APPROVED ("Đã xác nhận"). \- Lưu số tiền thực nhận, ID Admin (reviewed\_by), thời điểm duyệt (reviewed\_at). \- Mở khóa đầy đủ quyền truy cập thông tin liên hệ và lớp học cho Gia sư trên Cổng Gia sư. \- Gửi thông báo chuông và thông báo đẩy (Push/Email) tới người nộp với nội dung: *"Khoản phí nhận lớp \[Mã lớp\] số tiền \[X\]₫ đã được kế toán xác nhận thành công."* \- Ghi nhận nhật ký hệ thống: Action APPROVE\_PAYMENT, Entity PAYMENT. \- Hiển thị thông báo "Xác nhận khoản phí thành công" và điều hướng Admin quay lại danh sách Chờ xác nhận. |
| **Luồng rẽ nhánh: Xử lý minh chứng nghi ngờ (Yêu cầu nộp lại)** | **5a. Admin phát hiện minh chứng có dấu hiệu nghi ngờ hoặc sai lệch (tương tự quy trình của Lễ tân):** 5a.1. Admin kiểm tra và phát hiện một trong các dấu hiệu nghi vấn / không hợp lệ: \- *Nghi ngờ làm giả/photoshop*: Biên lai chuyển khoản có vết cắt ghép, font chữ sai lệch so với ứng dụng ngân hàng chuẩn, số tiền hoặc mã tham chiếu bị chỉnh sửa. \- *Chứng từ mờ/không hợp lệ*: Ảnh chụp bị mờ nhòe, tối, mất góc, chụp không thấy mã giao dịch hoặc không thấy thời gian chuyển tiền. \- *Chưa có tiền về tài khoản*: Đối chiếu sao kê ngân hàng tại mốc thời gian trên biên lai không hề có biến động số dư tăng. \- *Số tiền chuyển không đủ*: Số tiền trên biên lai hoặc thực nhận nhỏ hơn số tiền phải nộp theo quy định. \- *Sai thông tin nhận*: Chuyển tiền vào tài khoản cá nhân khác không phải tài khoản chính thức của trung tâm, hoặc sai nội dung chuyển khoản không rõ lớp nào. 5a.2. Admin bấm nút **"Yêu cầu nộp lại minh chứng"**. 5a.3. Hệ thống hiển thị modal **"Yêu cầu nộp lại minh chứng"** gồm: \- Tóm tắt thông tin khoản phí: Mã lớp, Tên người nộp, Số tiền phải nộp. \- **Danh sách lý do mẫu (Checklist gợi ý nhanh)**: \[ \] *Minh chứng bị mờ, mất góc, không đọc được mã giao dịch hoặc thời gian chuyển.* \[ \] *Chưa nhận được tiền vào tài khoản ngân hàng của trung tâm tại mốc thời gian trên.* \[ \] *Nghi ngờ biên lai chỉnh sửa/làm giả thông tin, yêu cầu gửi lại sao kê chuẩn từ app ngân hàng.* \[ \] *Số tiền chuyển khoản không đủ so với mức phí quy định.* \[ \] *Chuyển nhầm thông tin tài khoản thụ hưởng hoặc sai cú pháp chuyển khoản.* \[ \] *Lý do khác.* \- **Ô văn bản nhập chi tiết lý do (BẮT BUỘC NHẬP)**: Admin nhập giải thích cụ thể điểm nghi ngờ để người nộp hiểu rõ (Ví dụ: *"Biên lai ngân hàng lúc 15:30 ngày 12/10 có dấu hiệu chỉnh sửa số tiền; sao kê ngân hàng trung tâm không có giao dịch 400.000₫ từ tài khoản này. Vui lòng chụp lại màn hình lịch sử giao dịch từ app ngân hàng hoặc sao kê có mã giao dịch rõ ràng."*). \- Hai nút thao tác: **"Gửi yêu cầu"** và **"Hủy"**. 5a.4. Admin tích chọn lý do mẫu (hệ thống tự điền gợi ý vào ô nhập) và bổ sung nội dung chi tiết vào ô lý do, sau đó bấm **"Gửi yêu cầu"**. 5a.5. Hệ thống hiển thị popup xác nhận: *"Bạn có chắc chắn muốn gửi yêu cầu nộp lại minh chứng cho khoản phí lớp \[Mã lớp\] với lý do đã nhập?"* kèm 2 nút **Xác nhận** / **Hủy**. 5a.6. Admin bấm **"Xác nhận"**. 5a.7. Hệ thống thực hiện chuỗi xử lý tự động: \- Cập nhật trạng thái khoản phí thành RESUBMIT\_REQUIRED ("Yêu cầu nộp lại"). \- Lưu nội dung lý do vào trường reject\_reason. \- Lưu ID Admin xử lý (reviewed\_by) và thời điểm (reviewed\_at). \- Gửi thông báo khẩn tới người nộp (Cổng Gia sư / Phụ huynh / Lễ tân đã thu hộ) kèm lý do chi tiết từ Admin: *"Minh chứng nộp phí lớp \[Mã lớp\] của bạn cần được nộp lại. Lý do: \[Nội dung lý do\]. Vui lòng tải lại ảnh minh chứng hợp lệ."* \- Ghi nhận nhật ký hệ thống: Action REQUEST\_RESUBMIT\_PAYMENT\_PROOF, Entity PAYMENT. \- Hiển thị thông báo "Đã gửi yêu cầu nộp lại minh chứng thành công" và quay lại danh sách Chờ xác nhận. |
| **Ngoại lệ** | **6.1. Admin để trống ô "Số tiền thực nhận":** 6.1.1. Hệ thống báo lỗi: *"Vui lòng nhập số tiền thực nhận."* và không cho bấm xác nhận. **5a.3.1. Admin để trống ô lý do khi yêu cầu nộp lại:** 5a.3.1.1. Hệ thống báo lỗi đỏ: *"Vui lòng nhập lý do cụ thể để người nộp biết và gửi lại minh chứng hợp lệ."* và khóa nút Gửi yêu cầu. **5a.3.2. Admin bấm "Hủy" tại modal yêu cầu nộp lại:** 5a.3.2.1. Hệ thống đóng modal và quay lại màn hình đối chiếu, trạng thái khoản phí vẫn giữ nguyên là SUBMITTED. **8.1. Admin bấm "Hủy" tại popup xác nhận hoàn tất:** 8.1.1. Hệ thống đóng popup và giữ nguyên giao diện đối chiếu để Admin kiểm tra lại. |

## **UC-ADM-18: Xử lý yêu cầu hoàn tiền**

| Thuộc tính | Nội dung đặc tả |
| :---- | :---- |
| **Mã UC** | **UC-ADM-18** |
| **Tên UC** | **Xử lý yêu cầu hoàn tiền** |
| **Actor** | Admin  |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Tồn tại ít nhất một yêu cầu hoàn tiền ở trạng thái **"Chờ xử lý"** (PENDING) do Lễ tân chuyển sang từ một khiếu nại khách hàng loại Hoàn tiền (complaint\_type \= REFUND). |
| **Hậu điều kiện** | 1\. **Nếu chấp thuận hoàn tiền**: Yêu cầu hoàn tiền chuyển sang REFUNDED ("Đã hoàn tiền"); lưu số tiền hoàn thực tế, ảnh biên lai chuyển khoản hoàn tiền, ID Admin hoàn (resolved\_by), thời điểm (resolved\_at); khiếu nại liên quan tự động chuyển sang RESOLVED ("Đã xử lý"); gửi thông báo tới Lễ tân và người khiếu nại; ghi audit\_logs (PROCESS\_REFUND). 2\. **Nếu từ chối hoàn tiền**: Yêu cầu hoàn tiền chuyển sang REJECTED ("Đã từ chối") kèm lý do; gửi thông báo kèm lý do cho Lễ tân tiếp nhận để xử lý lại với khách hàng; ghi audit\_logs (REJECT\_REFUND). |
| **Kịch bản chính** | 1\. Admin chọn mục **"Hoàn tiền"** từ thanh điều hướng Admin. 2\. Hệ thống hiển thị danh sách các yêu cầu hoàn tiền được chia 3 tab: \- Tab 1: **Chờ xử lý** (PENDING) \- Tab 2: **Đã hoàn tiền** (REFUNDED) \- Tab 3: **Đã từ chối** (REJECTED) \- Mỗi dòng hiển thị: Mã khiếu nại, Mã lớp, Người khiếu nại (Gia sư/Phụ huynh), Số tiền đề xuất hoàn, Lễ tân đề xuất, Ngày tạo, Trạng thái và nút **"Xử lý"**. 3\. Admin bấm **"Xử lý"** tại một yêu cầu ở tab "Chờ xử lý". 4\. Hệ thống hiển thị modal **"Xử lý yêu cầu hoàn tiền"** gồm: \- Thông tin khiếu nại: Người khiếu nại, SĐT, vai trò, nội dung khiếu nại ban đầu, lý do Lễ tân đề xuất hoàn tiền. \- Bảng đối soát tài chính của lớp: \+ Tổng số tiền trung tâm đã thực nhận từ khoản phí của lớp: \[A\]₫. \+ Tổng số tiền đã hoàn trong các lần trước (nếu có): \[B\]₫. \+ **Số tiền tối đa còn có thể hoàn**: \[A \- B\]₫. \- Thông tin tài khoản thụ hưởng của người nhận: Tên chủ tài khoản, Tên ngân hàng, Số tài khoản. \- Ô nhập: **"Số tiền hoàn thực tế"** (VNĐ) (cho phép Admin điều chỉnh nhưng không được vượt quá số tiền tối đa còn có thể hoàn). \- Khung tải lên: **"Đính kèm biên lai chuyển khoản hoàn tiền"** (chấp nhận JPG, PNG, PDF). \- Các nút hành động: **"Xác nhận đã hoàn tiền"**, **"Từ chối hoàn tiền"**, **"Đóng"**. 5\. Admin thực hiện lệnh chuyển khoản hoàn tiền qua tài khoản ngân hàng của trung tâm (thao tác ngoài hệ thống) tới đúng số tài khoản thụ hưởng. Sau đó chụp/lưu lại ảnh biên lai chuyển khoản thành công, tải tệp ảnh lên khung đính kèm, kiểm tra số tiền hoàn thực tế và bấm nút **"Xác nhận đã hoàn tiền"**. 6\. Hệ thống hiển thị popup xác nhận: *"Bạn xác nhận đã hoàn trả số tiền \[X\]₫ cho chủ tài khoản \[Tên chủ tài khoản\] \- STK \[Số TK\] \- Ngân hàng \[Tên NH\]?"* kèm 2 nút **Đồng ý** / **Hủy**. 7\. Admin bấm **"Đồng ý"**. 8\. Hệ thống thực hiện chuỗi xử lý tự động: \- Lưu trạng thái yêu cầu hoàn tiền là REFUNDED. \- Lưu số tiền hoàn, URL ảnh biên lai, ID Admin (resolved\_by), thời điểm (resolved\_at). \- Cập nhật trạng thái khiếu nại tương ứng thành RESOLVED kèm kết quả tự động: *"Đã hoàn trả \[X\]₫ qua ngân hàng \[Tên NH\] ngày \[DD/MM/YYYY\] bởi Admin \[Họ tên\]."* \- Gửi thông báo cho Lễ tân tiếp nhận khiếu nại và người khiếu nại. \- Ghi nhật ký hệ thống: Action PROCESS\_REFUND, Entity COMPLAINT. \- Hiển thị thông báo "Đã hoàn tất thủ tục hoàn tiền" và đóng modal. |
| **Luồng rẽ nhánh: Admin từ chối yêu cầu hoàn tiền** | **5a. Admin phát hiện yêu cầu hoàn tiền không hợp lệ:** 5a.1. Admin kiểm tra và phát hiện một trong các lý do không thể duyệt hoàn tiền: Thông tin số tài khoản thụ hưởng bị sai/không chính chủ, khiếu nại chưa đủ căn cứ, phát hiện gian lận,... 5a.2. Admin bấm nút **"Từ chối hoàn tiền"**. 5a.3. Hệ thống hiển thị modal **"Từ chối yêu cầu hoàn tiền"** gồm ô nhập lý do từ chối (Bắt buộc) kèm 2 nút **"Xác nhận từ chối"** và **"Hủy"**. 5a.4. Admin nhập lý do cụ thể và bấm **"Xác nhận từ chối"**. 5a.5. Hệ thống cập nhật yêu cầu hoàn tiền thành REJECTED, c gửi thông báo kèm lý do từ chối tới Lễ tân đã lập đề xuất để làm việc lại với khách hàng, ghi audit\_logs (REJECT\_REFUND), hiển thị thông báo thao tác thành công và quay lại danh sách. |
| **Ngoại lệ** | **5.1. Số tiền hoàn thực tế vượt quá số tiền tối đa còn có thể hoàn của lớp:** 5.1.1. Hệ thống báo lỗi: *"Số tiền hoàn (\[X\]₫) vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: \[Y\]₫)."* và khóa nút Xác nhận. **5.2. Admin chưa tải tệp biên lai chuyển khoản hoàn tiền:** *5.2.1. Hệ thống báo lỗi: "Vui lòng đính kèm ảnh biên lai chuyển khoản hoàn tiền trước khi xác nhận."* và không cho tiếp tục. **5a.4.1. Admin để trống ô lý do từ chối:** 5a.4.1.1. Hệ thống báo lỗi: *"Vui lòng nhập lý do từ chối hoàn tiền để Lễ tân nắm được thông tin."* và không cho gửi. **7.1. Admin bấm "Hủy" tại popup xác nhận:** 7.1.1. Hệ thống đóng popup và giữ nguyên dữ liệu trong modal để Admin rà soát lại. |

