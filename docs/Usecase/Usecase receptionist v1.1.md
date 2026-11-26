**ĐẶC TẢ USE CASE**  
  **LỄ TÂN (RECEPTIONIST)**

Phiên bản: v1.2 (18/12/2026) — bản v1.1 cập nhật 08/11.

Nội dung cập nhật v1.2 (chỉnh khớp với mã nguồn tại dev, 18/12/2026):

- UC-REC-01: viết lại 4 thẻ KPI và 6 thẻ thao tác nhanh theo dashboard Lễ tân hiện tại (khiếu nại, phí chưa nộp minh chứng, thông báo; không còn KPI "tổng gia sư đang hoạt động" và không có lời chào kèm mã nhân viên).
- UC-REC-02: bỏ trường "Gia sư chỉ định (tùy chọn)" khỏi form tạo lớp.
- UC-REC-03: bỏ tiền điều kiện "không có gia sư chỉ định" (chức năng đã loại).
- UC-REC-05: viết lại thành "Bổ sung thông tin và đăng lớp"; bỏ nút "Xác nhận đơn" và các bước đổi gia sư chỉ định.
- UC-REC-06: đánh dấu "Đã loại khỏi hệ thống — 20/11, V27" (chức năng gia sư chỉ định đã bỏ, cột `class_requests.requested_tutor_id` đã DROP).
- UC-REC-07: sửa ngoại lệ 7.1 — lớp đang ghép lại hiển thị với gia sư như lớp đăng tuyển bình thường, không bị ẩn; bỏ nhánh "Xác nhận đơn" khỏi bước 7.
- UC-REC-08 / UC-REC-09: danh sách tab Quản lý Gia sư khớp thực tế (Tất cả / Chờ duyệt / Đang hoạt động / Ngưng hoạt động); bổ sung quy định lý do bắt buộc khi từ chối hồ sơ.
- UC-REC-10: viết lại theo phân công hiện tại — Lễ tân thu hộ tại quầy, chỉnh tỷ lệ phí, nộp biên lai thay; xác nhận (duyệt) khoản phí do Kế toán thực hiện (tham chiếu UC-ACC-03); sửa tên tab theo trạng thái hệ thống (Chưa nộp minh chứng / Yêu cầu gửi lại / Chờ xác nhận / Đã xác nhận).
- UC-REC-11: sửa tab quản lý học sinh (Chờ duyệt / Đã duyệt, gồm "Đã tạo account" / Tất cả); ghi chú trang đang chạy trên dữ liệu mock và tài khoản học sinh thật được tạo tự động tại UC-REC-03.
- UC-REC-14/15/16: bổ sung dòng ghi chú phạm vi — khiếu nại đã loại khỏi phạm vi triển khai (mốc 23/11) nhưng module giữ nguyên trong codebase.
- §1.1, §1.2, §1.3: cập nhật phân quyền phí (Lễ tân thu hộ / Kế toán xác nhận) và trách nhiệm quản lý nhân sự thuộc Admin; cập nhật luồng REC-1 (không còn nhánh gia sư chỉ định).

# **PHẦN I. MÔ TẢ VAI TRÒ RECEPTIONIST TRONG HỆ THỐNG**

## **1.1 Định nghĩa vai trò**

Receptionist (Lễ tân trung tâm) là nhân sự thường trực tại văn phòng trung tâm gia sư, đóng vai trò cửa ngõ tiếp xúc trực tiếp (front-desk & first point of contact) với khách hàng — bao gồm cả Phụ huynh và Gia sư.

Trong mô hình vận hành thực tế, Quản trị viên (Admin) không thể trực tiếp xử lý tất cả các nghiệp vụ phát sinh hàng ngày. Lễ tân được phân quyền để giảm tải cho Admin, đảm trách:

•     Tiếp nhận và xử lý nhanh các yêu cầu ghép lớp mới từ trang chủ.

•     Thu hộ phí nhận lớp tại quầy (tiền mặt hoặc chuyển khoản), chỉnh tỷ lệ phí và nộp biên lai thay gia sư; khoản phí do Kế toán xác nhận sau đối chiếu (xem UC-REC-10).

•     Hỗ trợ tra cứu, cập nhật thông tin hồ sơ gia sư và học sinh.

•     Đặc biệt: Là đầu mối trực tiếp tiếp nhận, lập biên bản ghi nhận và xử lý các vụ khiếu nại trực tiếp tại quầy (Hoàn tiền với lớp Online, hoặc Không hoàn tiền: hủy lớp hoặc ghép lại gia sư cho lớp cần gia sư).

## **1.2 Trách nhiệm chính**

| Trách nhiệm | Mô tả  |
| :---- | :---- |
| Quản lý Lớp cần gia sư | Tiếp nhận yêu cầu đăng ký học từ Phụ huynh trên một trang duy nhất, đăng lớp để gia sư ứng tuyển và chọn gia sư từ danh sách ứng tuyển. Theo dõi dạy thử, xác nhận ghép thành công, ghép lại, hủy lớp. |
| Quản lý hồ sơ Gia sư | Duyệt hồ sơ gia sư đăng ký mới, quản lý trạng thái hoạt động, chỉnh sửa thông tin |
| Quản lý hồ sơ Học sinh | Tra cứu, cập nhật thông tin hồ sơ học sinh; tài khoản học sinh được tạo tự động khi lớp được ghép gia sư (UC-REC-03) |
| Phí nhận lớp (QR Proof) | Thu hộ tại quầy (tiền mặt/chuyển khoản), chỉnh tỷ lệ phí, nộp biên lai thay gia sư; việc đối chiếu và xác nhận khoản phí do Kế toán thực hiện (UC-REC-10) |
| Giám sát vận hành & báo cáo | Theo dõi doanh thu, tỷ lệ ghép lớp, số lượng gia sư/học sinh mới, xuất báo cáo |
| Quản lý thông báo | Nhận & xử lý thông báo từ gia sư, phụ huynh, hệ thống |
| Kiểm soát nhật ký hoạt động | Giám sát audit trail, theo dõi mọi thao tác quan trọng trong hệ thống |
| Quản lý nhân sự Lễ tân | Trách nhiệm thuộc Admin (UC-ADM-11, UC-ADM-12): thêm mới, đổi trạng thái nhân viên. Lễ tân không có quyền quản lý nhân sự. |
| Xử lý khiếu nại & Đối soát tài chính | Giám sát toàn bộ khiếu nại (Hoàn tiền / Không hoàn tiền) do Lễ tân tiếp nhận, duyệt xử lý và đối soát dòng tiền thu \- chi |

##  

## **1.3 Các luồng nghiệp vụ chính**

Tóm tắt các luồng nghiệp vụ Lễ tân:

| Luồng | Tên luồng | Mô tả ngắn |
| :---- | :---- | :---- |
| REC-1 | Quản lý lớp cần gia sư | Từ yêu cầu PH → Tư vấn → Đăng lớp cho gia sư ứng tuyển (chọn gia sư từ danh sách ứng tuyển) → Đang dạy thử → Ghép thành công (nếu dạy thử thất bại: Phụ huynh chọn ghép lại → Đang ghép lại → chọn gia sư mới) |
| REC-2 | Phí nhận lớp (QR Proof) | GS nộp minh chứng (Lễ tân có thể thu hộ tại quầy, chỉnh tỷ lệ, nộp thay) → Kế toán đối chiếu và xác nhận / yêu cầu gửi lại (UC-ACC-03) |
| REC-3 | Quản lý Gia sư | Duyệt hồ sơ mới → Quản lý trạng thái → Sửa/Xóa thông tin |
| REC-4 | Quản lý Học sinh | Tra cứu, cập nhật hồ sơ học sinh; tài khoản học sinh được tạo tự động khi lớp được ghép gia sư (UC-REC-03) |
| REC-5 | Giám sát & Báo cáo vận hành | Dashboard thống kê, biểu đồ doanh thu, xuất báo cáo |
| REC-6 | Giám sát khiếu nại & Đối soát thu chi | Tiếp nhận khiếu nại tại quầy → Phân loại hoàn tiền/không hoàn tiền → Đối soát doanh thu thực |

 

# **PHẦN II. BẢNG MÔ TẢ USE CASE CHI TIẾT**

## **UC-REC-01: Xem Receptionist Dashboard tổng quan**

| Mã UC | UC-REC-01 |
| :---- | :---- |
| **Tên UC** | Xem Receptionist Dashboard tổng quan |
| **Actor** | Receptionist (Lễ tân) |
| **Tiền điều kiện** | Lễ tân đã đăng nhập vào hệ thống với tài khoản vai trò receptionist |
| **Hậu điều kiện** | Lễ tân nắm được toàn bộ khối lượng công việc cần xử lý trong ca trực: số yêu cầu ghép lớp đang chờ, số khoản phí chưa nộp minh chứng, số khiếu nại chưa xử lý và số thông báo mới chưa đọc |
| **Kịch bản chính** | 1\. Lễ tân đăng nhập và truy cập trang Tổng quan (/receptionist). 2\. Hệ thống hiển thị tiêu đề "Bảng điều khiển lễ tân" (thông điệp mô tả ngắn, không có lời chào kèm tên hay mã nhân viên), nút "Đồng bộ" để làm mới dữ liệu và các thẻ KPI: (a) Yêu cầu ghép lớp — tổng số đơn và số đơn "Chờ xử lý"; (b) Phí chưa nộp minh chứng — số khoản phí trạng thái "Chưa nộp minh chứng" (NOT\_SUBMITTED); (c) Khiếu nại chưa xử lý — số khiếu nại "Chờ xử lý" kèm số khiếu nại "Chờ hoàn tiền"; (d) Thông báo mới — số thông báo chưa đọc. 3\. Hệ thống hiển thị khối thao tác nhanh gồm 6 thẻ: Ghép lớp, Phí nhận lớp, Quản lý Gia sư, Quản lý Học sinh, Xử lý khiếu nại, Thông báo; mỗi thẻ kèm số liệu tóm tắt (đơn chờ xử lý, khoản phí chưa nộp, số gia sư, số học sinh, khiếu nại chưa xử lý, tin mới). 4\. Nếu có khiếu nại gần đây, hệ thống hiển thị khối tóm tắt các khiếu nại mới nhất. |
| **Ngoại lệ** |  |

## **UC-REC-02: Tạo lớp cần gia sư**

| Mã UC | UC-REC-02 |
| :---- | :---- |
| **Tên UC** | Tạo lớp cần gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Phụ huynh liên hệ trung tâm để tìm gia sư. Yêu cầu phụ huynh gửi trên website tự tạo lớp ở "Chờ xử lý", không cần Lễ tân tạo lại. |
| **Hậu điều kiện** | Xuất hiện lớp cần gia sư mới ở trạng thái "Chờ xử lý". |
| **Kịch bản chính** | 1\. Lễ tân chọn mục "Quản lý lớp cần gia sư". 2\. Hệ thống hiển thị danh sách lớp với các tab: Tất cả, Chờ xử lý, Đã đăng, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy; có tìm kiếm, sắp xếp theo thời gian và số gia sư ứng tuyển, và nút "Tạo mới lớp". 3\. Lễ tân bấm "Tạo mới lớp". 4\. Hệ thống hiển thị form gồm: Họ tên phụ huynh, SĐT, Họ tên học sinh, Khối lớp, Trường học, Yêu cầu lớp học, Mục tiêu học tập, Hình thức học, Học phí/buổi, Số buổi/tuần, Tỷ lệ phí nhận lớp, Lịch học mong muốn, Yêu cầu đối với gia sư; và 2 nút "Tạo lớp", "Hủy". Thông tin phụ huynh và học sinh không công khai với gia sư. 5\. Lễ tân nhập thông tin và bấm "Tạo lớp". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống thông báo thành công, lớp xuất hiện ở tab "Chờ xử lý". Chưa tạo tài khoản học sinh ở bước này. |
| **Ngoại lệ** | 4.1. Lễ tân bấm "Hủy": hệ thống đóng form, không tạo lớp. 5.1. Thiếu thông tin bắt buộc hoặc SĐT sai định dạng: hệ thống báo lỗi, giữ nguyên dữ liệu đã nhập. 7.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại form. 5.2. Số điện thoại thuộc về phụ huynh khác tên: hệ thống hiện cảnh báo kèm tên phụ huynh đó và khóa nút "Tạo lớp". Lễ tân xác nhận lại với phụ huynh: nhầm số thì đổi số điện thoại, cùng gia đình thì bấm "Dùng phụ huynh [tên]". Đúng họ tên và số điện thoại đã có thì không cảnh báo, lớp mới gắn với phụ huynh đó. |

## **UC-REC-03: Chọn gia sư từ danh sách ứng tuyển**

| Mã UC | UC-REC-03 |
| :---- | :---- |
| **Tên UC** | Chọn gia sư từ danh sách ứng tuyển |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | Lễ tân đã đăng nhập. Lớp ở "Đã đăng" hoặc "Đang ghép lại". Có gia sư ứng tuyển. Lễ tân đã trao đổi với phụ huynh và gia sư, hai bên đồng ý. |
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

## **UC-REC-05: Bổ sung thông tin và đăng lớp**

| Mã UC | UC-REC-05 |
| :---- | :---- |
| **Tên UC** | Bổ sung thông tin và đăng lớp |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Chờ xử lý". Lễ tân đã gọi tư vấn phụ huynh. |
| **Hậu điều kiện** | Thông tin lớp được cập nhật. Lớp đủ thông tin được đăng lên trang gia sư, chuyển "Đã đăng". |
| **Kịch bản chính** | 1\. Lễ tân mở tab "Chờ xử lý" và bấm "Đăng lớp" (không còn nút "Xác nhận đơn" hay "Bổ sung thông tin" riêng). 2\. Hệ thống hiển thị form bổ sung thông tin phụ huynh, học sinh, yêu cầu lớp, hình thức, học phí, tỷ lệ phí, lịch học, yêu cầu gia sư. SĐT không sửa được. 3\. Lễ tân nhập thông tin rồi bấm "Lưu và đăng lớp"; bấm "Chỉ lưu" nếu chưa đủ thông tin để chuyển trạng thái. 4\. Hệ thống hiển thị popup xác nhận "Lưu thông tin và đăng lớp" kèm 2 nút Đồng ý/Hủy. 5\. Lễ tân bấm "Đồng ý". 6\. Hệ thống lưu thông tin và đăng lớp, lớp chuyển "Đã đăng", hiển thị trên trang gia sư và trang công khai. |
| **Ngoại lệ** | 3.1. Thiếu họ tên phụ huynh, họ tên học sinh hoặc email sai định dạng: hệ thống báo lỗi. 5.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại form. 6.1. Lớp thiếu họ tên học sinh, yêu cầu lớp, hình thức hoặc học phí: hệ thống báo chưa đủ thông tin để đăng. |

## **UC-REC-06: Xác nhận lớp có gia sư chỉ định** (Đã loại khỏi hệ thống — 20/11, V27)

> **Lưu ý v1.2:** Chức năng "gia sư chỉ định" đã được loại bỏ hoàn toàn (migration V27: DROP COLUMN `class_requests.requested_tutor_id`; nút "Xác nhận đơn" và modal tương ứng đã xóa khỏi trang Lớp cần gia sư; không còn endpoint xác nhận đơn chỉ định). Khi phụ huynh đã chọn sẵn gia sư, gia sư được ghép qua UC-REC-03 (từ danh sách ứng tuyển). Nội dung dưới đây chỉ còn giá trị tham khảo, không mô tả luồng hiện tại.

| Mã UC | UC-REC-06 |
| :---- | :---- |
| **Tên UC** | Xác nhận lớp có gia sư chỉ định |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Chờ xử lý" hoặc "Đang ghép lại" và có gia sư chỉ định. 3\. Lễ tân đã trao đổi, phụ huynh và gia sư đồng ý. |
| **Hậu điều kiện** | Lớp chuyển "Đang dạy thử". Lớp học `TRIAL` và khoản phí nháp được tạo. Tài khoản học sinh được tạo nếu chưa có. Các gia sư đang ứng tuyển (nếu có) được thông báo không được chọn. |
| **Kịch bản chính** | 1\. Lễ tân bấm "Xác nhận đơn" tại lớp tương ứng. 2\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 3\. Lễ tân bấm "Đồng ý". 4\. Hệ thống thông báo thành công, gửi thông báo tới gia sư, hiển thị tài khoản học sinh và mật khẩu mặc định nếu vừa tạo. |
| **Ngoại lệ** | 1.1. Chưa có họ tên học sinh hoặc học phí: hệ thống yêu cầu bổ sung và mở form thông tin. 3.1. Lễ tân bấm "Hủy" tại popup: hệ thống quay lại, không thay đổi. 4.1. Gia sư không còn hoạt động: hệ thống báo lỗi, Lễ tân đổi gia sư theo UC-REC-05. |

## **UC-REC-06.1: Xác nhận ghép thành công**

| Mã UC | UC-REC-06.1 |
| :---- | :---- |
| **Tên UC** | Xác nhận ghép thành công |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Lớp ở "Đang dạy thử". 3\. Gia sư đã hoàn thành buổi dạy thử và hai bên thống nhất học chính thức. |
| **Hậu điều kiện** | 1\. Lớp chuyển "Ghép thành công". 2\. Lớp học chuyển từ `TRIAL` sang `ACTIVE`, ghi ngày chính thức. 3\. Khoản phí nhận lớp được kích hoạt. 4\. Bắt đầu đếm ngược 7 ngày được hủy lớp. |
| **Kịch bản chính** | 1\. Ưu tiên chính (V31): Gia sư tự gửi **báo cáo kết quả dạy thử** "Thành công" (`POST /classes/{id}/trial-report`); hệ thống tự kích hoạt lớp `TRIAL` → `ACTIVE`, không cần Lễ tân thao tác. Modal "Xác nhận ghép thành công" chỉ hiển thị lý do đã báo (nếu có) ở dạng tham khảo. 2\. Trường hợp lớp chưa có báo cáo (lớp tạo từ đề xuất trực tiếp, chưa đi qua luồng báo cáo): Lễ tân mở chi tiết lớp ở tab "Đang dạy thử", bấm "Xác nhận ghép thành công", nhập số buổi/tuần, học phí/buổi và xác nhận (endpoint `complete-match`). 3\. Hệ thống thông báo thành công và chuyển lớp sang tab "Ghép thành công". |
| **Ngoại lệ** | 2.1. Lễ tân bấm "Ghép lại": chuyển sang UC-REC-07. 2.2. Lễ tân bấm "Hủy lớp": chuyển sang UC-REC-04. 3.1. Lớp đã có báo cáo chính thức: hệ thống không kích hoạt lại (báo cáo đóng một lần cho mỗi lớp); với kết quả "Không thành công" lớp ở `TRIAL_FAIL`, xử lý theo UC-REC-17. 5.1. Thiếu số buổi/tuần hoặc học phí: hệ thống báo lỗi, không kích hoạt. |

## **UC-REC-07: Ghép lại lớp**

| Mã UC | UC-REC-07 |
| :---- | :---- |
| **Tên UC** | Ghép lại lớp khi dạy thử không thành công |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập. 2\. Dạy thử không thành công, gia sư đã báo cáo kết quả "Không thành công" (lớp chuyển `TRIAL_FAIL`, hệ thống tạo task trong hàng đợi). 3\. Lễ tân đã xử lý task và hỏi ý kiến phụ huynh. |
| **Hậu điều kiện** | Đơn `class_request` chuyển "Đang ghép lại" (`REMATCH`), gia sư cũ bị loại và không ứng tuyển lại được (lượt ứng tuyển `TERMINATED`). Các gia sư trước đó không được chọn tự quay lại danh sách ứng tuyển và nhận thông báo. Lớp cũ giữ `TRIAL_FAIL`. Gia sư và khách thấy đơn như đơn đăng tuyển bình thường. |
| **Kịch bản chính** | 1\. Lễ tân mở task "Dạy thử thất bại cần xử lý" (UC-REC-17) và xử lý trạng thái task. 2\. Phụ huynh đồng ý tìm gia sư khác (Lễ tân hỏi ý kiến ngoài hệ thống). 3\. Lễ tân bấm **"Ghép lại"** tại chi tiết task (hệ thống mở lại đơn `class_request`, đưa đơn về `REMATCH` — thao tác an toàn lặp lại nếu đơn đã `OPEN`/`REMATCH`; thao tác này không đổi trạng thái task). 4\. Đơn hiển thị trong tab "Đang ghép lại"; nếu phụ huynh không muốn tìm nữa, Lễ tân hủy đơn theo UC-REC-04 (đơn `CANCELLED`, điền sẵn lý do). 5\. Lễ tân chọn gia sư từ danh sách ứng tuyển (UC-REC-03); nếu phụ huynh tự liên hệ được gia sư, gia sư đó ứng tuyển vào đơn rồi Lễ tân chọn theo UC-REC-03. |
| **Ngoại lệ** | 3.1. Phụ huynh chọn "Không tìm nữa": chuyển sang UC-REC-04, điền sẵn lý do. 3.2. Lớp không có đơn (tạo từ nhắn tin trực tiếp, không có `class_request_id`): không thể ghép lại qua task; phụ huynh liên hệ gia sư khác qua tin nhắn trực tiếp. 5.1. Đơn "Đang ghép lại" hiển thị với gia sư và khách như đơn đăng tuyển bình thường (trạng thái "Đã đăng"), mọi gia sư đang hoạt động đều có thể ứng tuyển; không có cơ chế ẩn đơn theo gia sư chỉ định (chức năng đã loại khỏi hệ thống theo UC-REC-06). 5.2. Lễ tân bấm "Sửa thông tin": chỉ sửa được học phí, yêu cầu lớp, mục tiêu học tập, yêu cầu gia sư; gia sư đang ứng tuyển nhận thông báo thay đổi. |

## **UC-REC-08: Duyệt hồ sơ Gia sư đăng ký mới**

| Mã UC | UC-REC-08 |
| :---- | :---- |
| **Tên UC** | Duyệt hồ sơ Gia sư đăng ký mới |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ Gia sư ở trạng thái Chờ duyệt |
| **Hậu điều kiện** | 1\. Nếu Duyệt: Hồ sơ GS chuyển trạng thái → Đang hoạt động, GS có thể nhận Match Offer 2\. Nếu Từ chối: Hồ sơ bị loại, GS nhận thông báo từ chối |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Gia sư", chọn tab "Chờ duyệt" 2\. Hệ thống hiển thị danh sách Gia sư chờ duyệt. 3\. Lễ tân bấm vào một hồ sơ GS. 4\. Hệ thống hiển thị thông tin chi tiết: họ tên, SĐT, ngày tháng năm sinh, quê quán, email, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Duyệt, Không duyệt. 5\. Lễ tân bấm nút "Duyệt". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Lễ tân bấm "Đồng ý". 8\. Hệ thống cập nhật trạng thái GS, ghi Audit Log. |
| **Ngoại lệ** | 5.1. Lễ tân bấm nút “Không duyệt”. 5.1.1. Hệ thống hiển thị modal từ chối, yêu cầu nhập lý do (bắt buộc) và 2 nút Đồng ý/Hủy. 5.1.1.1. Lễ tân bấm nút Đồng ý: hồ sơ GS chuyển "Bị từ chối" (REJECTED), hệ thống hiển thị thông báo đã từ chối hồ sơ của Gia sư. 5.1.1.2. Lễ tân bấm nút Hủy: hệ thống quay trở lại trang cũ (Trang chờ duyệt). 7.1. Lễ tân bấm nút Hủy tại popup xác nhận duyệt: hệ thống quay trở lại trang cũ (Trang chờ duyệt). |

## **UC-REC-09: Quản lý thông tin gia sư**

| Mã UC | UC-REC-09 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Gia sư |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 Gia sư trong hệ thống |
| **Hậu điều kiện** | 1\. Hồ sơ gia sư sẽ không thay đổi nếu chỉ xem.2\. Hồ sơ gia sư sẽ được cập nhật thay đổi khi Lễ tân chỉnh sửa. |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Gia sư" từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách GS với 4 tab: Tất cả / Chờ duyệt / Đang hoạt động / Ngưng hoạt động và nút Xem GS; hồ sơ đã từ chối hiển thị nhãn "Bị từ chối" (REJECTED) khi xem tại tab Tất cả. 3\. Lễ tân bấm button “Xem GS" ở 1 hồ sơ gia sư bất kỳ. 4\. Hệ thống hiển thị modal thông tin chi tiết GS gồm:  họ tên, SĐT, ngày tháng năm sinh, quê quán, email, trạng thái hoạt động, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Lưu, Đóng. 5\. Lễ tân xem chi tiết được thông tin GS, đồng thời cũng có thể chỉnh sửa thông tin GS ở trường như trạng thái hoạt động. Sau đó ấn nút Lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn có xác nhận thay đổi thông tin của gia sư không?” và 2 nút Đồng ý/ Hủy. 7\. Lễ tân ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã lưu thông tin gia sư” và quay lại trang Quản lý GS. |
| **Ngoại lệ** | 7.1. Lễ tân bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết GS. |

## **UC-REC-10: Thu hộ phí nhận lớp và chỉnh tỷ lệ phí** 

| Mã UC | UC-REC-10 |
| :---- | :---- |
| **Tên UC** | Thu hộ phí nhận lớp và chỉnh tỷ lệ phí |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại khoản phí nhận lớp: hệ thống tự tạo bản nháp khi ghép lớp dạy thử (trạng thái "Chưa nộp minh chứng" khi lớp chính thức) và kích hoạt khi xác nhận ghép thành công; gia sư tự nộp biên lai hoặc đến tận nơi thanh toán tiền mặt.  |
| **Hậu điều kiện** | Biên lai được ghi nhận kèm hình thức thu; khoản phí chuyển "Chờ xác nhận" chờ Kế toán đối chiếu (xem UC-ACC-03). Lễ tân không có quyền tự xác nhận/duyệt khoản phí đã thu hộ. |
| **Kịch bản chính** | 1\. Lễ tân chọn mục "Phí nhận lớp" từ trang chủ Lễ tân. 2\. Hệ thống hiển thị danh sách khoản phí với 4 tab theo trạng thái: Chưa nộp minh chứng / Yêu cầu gửi lại / Chờ xác nhận / Đã xác nhận, kèm ô tìm kiếm (mã lớp, tên gia sư, SĐT phụ huynh). 3\. Lễ tân bấm nút "Thu hộ" tại khoản phí "Chưa nộp minh chứng". 4\. Hệ thống hiển thị modal "Thu hộ tại quầy": thông tin khoản phí (lớp, gia sư, số tiền), lựa chọn hình thức thu (Tiền mặt / Chuyển khoản), ô tải ảnh phiếu thu hoặc biên lai. 5\. Lễ tân chọn hình thức, tải tệp minh chứng và bấm "Xác nhận thu hộ". 6\. Hệ thống ghi nhận minh chứng, chuyển khoản phí sang "Chờ xác nhận" và thông báo "Đã thu hộ và gửi biên lai cho Kế toán đối chiếu". Khoản "Yêu cầu gửi lại" cũng thao tác tương tự (gia sư nộp lại hoặc Lễ tân thu hộ thay). 7\. Khi khoản phí "Chưa nộp minh chứng", Lễ tân có thể bấm "Chỉnh tỷ lệ" để điều chỉnh tỷ lệ phí (mặc định 40%, khoảng 0–50%) rồi lưu. 8\. Bước xác nhận (đối chiếu số tiền thực nhận, xác nhận đã nhận tiền hoặc yêu cầu nộp lại) được Kế toán thực hiện theo UC-ACC-03; Lễ tân chỉ được xem kết quả ở tab "Đã xác nhận". |
| **Ngoại lệ** | 5.1. Lễ tân chọn tệp không hợp lệ (không phải JPG/PNG/PDF hoặc lớn hơn 5MB): hệ thống báo lỗi, không gửi minh chứng. 6.1. Lễ tân không thể tự xác nhận khoản phí mình đã thu hộ: hệ thống yêu cầu Kế toán thực hiện bước xác nhận (UC-ACC-03). |

## **UC-REC-11: Quản lý thông tin Học sinh** (chạy trên dữ liệu mock)

| Mã UC | UC-REC-11 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Học sinh |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ học sinh trong hệ thống. Trang hiện chạy trên dữ liệu mock (chưa có backend quản lý hồ sơ học sinh của Admin/Lễ tân); trong khi đó, tài khoản học sinh thật được hệ thống tạo tự động khi lớp được ghép gia sư (UC-REC-03), không phải thao tác thủ công tại đây. |
| **Hậu điều kiện** | Lễ tân nắm được chi tiết hồ sơ học sinh, thông tin phụ huynh và gia sư phụ trách hiện tại. |
| **Kịch bản chính** | 1\. Lễ tân truy cập trang "Quản lý Học sinh".  2\. Hệ thống hiển thị danh sách học sinh với các thẻ thống kê (Tổng số học sinh, Chờ duyệt, Đã duyệt, Đã tạo account), 3 tab theo trạng thái duyệt: Chờ duyệt / Đã duyệt (gồm "Đã tạo account") / Tất cả, cùng thanh tìm kiếm và bộ lọc theo gia sư phụ trách. 3\. Lễ tân bấm nút Xem chi tiết của 1 học sinh cần xem. 4\. Hệ thống hiển thị modal chi tiết gồm: Họ tên học sinh, trình độ/khối lớp, mục tiêu, lịch học, ghi chú, thông tin phụ huynh (họ tên, SĐT/Zalo, Telegram, tỉnh/quận), gia sư phụ trách và tiến độ học tập. 5\. Đối với học sinh đã duyệt nhưng chưa có tài khoản, nút "Tạo account" chỉ đánh dấu trạng thái "Đã tạo account" trên dữ liệu mock (username = SĐT phụ huynh, mật khẩu mặc định 123456789). Lễ tân cũng có thể chỉnh sửa thông tin học sinh (form modal) và lưu. 6\. Hệ thống hiển thị xác nhận: “Bạn xác nhận lưu thay đổi thông tin học sinh này chứ?” và 2 nút Lưu thay đổi/Hủy. 7\. Lễ tân bấm nút Đồng ý. 8\. Hệ thống hiển thị thông báo “Đã cập nhật thông tin học sinh” và quay lại trang Quản lý Học sinh.  |
| **Ngoại lệ** | 7.1. Lễ tân bấm nút Hủy. 7.1.1. Hệ thống quay lại trang/modal chi tiết, giữ nguyên dữ liệu. 4.1. Học sinh đang ở tab Chờ duyệt: không có nút chỉnh sửa/xóa/tạo account, chỉ xem chi tiết. |

## **UC-REC-14: Tạo đơn khiếu nại** 

> Ghi chú phạm vi (v1.2): tính năng khiếu nại đã được loại khỏi phạm vi triển khai còn lại (mốc 23/11, WBS 6.1) nhưng module backend và 2 trang Admin/Lễ tân vẫn giữ nguyên trong codebase; các UC khiếu nại dưới đây mô tả chức năng hiện có trong mã nguồn, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-REC-14 |
| :---- | :---- |
| **Tên UC** | Tạo đơn khiếu nại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập hệ thống 2\. Phụ huynh/ gia sư có yêu cầu khiếu nại |
| **Hậu điều kiện** | Khiếu nại chuyển trạng thái sang "Chờ xử lý", lưu nội dung cần xử lý, người tạo đơn và thời điểm tạo đơn. Trạng thái lớp cần gia sư và lớp học chưa thay đổi. |
| **Kịch bản chính** | Lễ tân truy cập trang "Xử lý khiếu nại" Hệ thống hiển thị danh sách các khiếu nại chia thành 4 tab: “Chờ xử lý”, “Chờ hoàn tiền”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Lễ tân bấm nút “Tạo đơn” để tạo những khiếu nại mới.. Hệ thống hiển thị modal đơn khiếu nại gồm thông tin đơn: Họ tên người khiếu nại, SĐT, Role, Loại khiếu nại (Hoàn tiền, Không hoàn tiền). Lớp cần gia sư bị khiếu nại (tìm theo mã lớp hoặc tên học sinh, SĐT phụ huynh). Nếu chọn Hoàn tiền: chỉ chọn được lớp Online đã có lớp học. Nếu chọn Không hoàn tiền: chọn được lớp ở mọi trạng thái trừ Đã hủy; lớp Ghép thành công hiển thị số ngày còn được khiếu nại. Cuối cùng là Lí do khiếu nại và 2 nút "Tạo khiếu nại", "Hủy". Lễ tân nhập các thông tin vào, và ấn nút “Tạo khiếu nại”. Hệ thống hiển thị thông báo đã tạo khiếu nại thành công, chuyển đơn về trạng thái “Chờ xử lý” |
| **Ngoại lệ** | 4.1. Lớp đã ghép thành công quá 7 ngày và Lễ tân chọn Không hoàn tiền. 4.1.1. Hệ thống hiển thị cảnh báo "Lớp đã ghép thành công quá 7 ngày, không thể tiếp nhận khiếu nại hủy lớp hoặc ghép lại." và không cho tạo đơn. 5.1. Lễ tân click nút Hủy. 5.1.1. Hệ thống hiển thị thông báo “Bạn xác nhận hủy đi đơn khiếu nại này chứ?” và 2 nút Đồng ý, Hủy. 5.1.1.1. Lễ tân click nút Đồng ý. 5.1.1.1.1. Hệ thống quay trở lại trang Quản lý đơn khiếu nại. 5.1.1.2. Lễ tân click nút Hủy 5.1.1.2.1. Hệ thống quay trở lại Modal đơn khiếu nại. |

## **UC-REC-15: Xem, sửa các đơn khiếu nại**

> Ghi chú phạm vi (v1.2): tính năng khiếu nại đã loại khỏi phạm vi triển khai còn lại (mốc 23/11, WBS 6.1); module vẫn giữ nguyên trong codebase — UC này mô tả chức năng hiện có, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-REC-15 |
| :---- | :---- |
| **Tên UC** | Xem, sửa các đơn khiếu nại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập hệ thống 2\. Tồn tại khiếu nại được tiếp nhận bởi Lễ tân tại quầy |
| **Hậu điều kiện** | 1\. Lễ tân nắm được toàn bộ chi tiết đơn khiếu nại. 2\. Đơn khiếu nại có thể bị thay đổi khi admin thay đổi nó. |
| **Kịch bản chính** | Lễ tân chọn mục "Xử lý khiếu nại" từ menu Lễ tân. Hệ thống hiển thị danh sách các khiếu nại chia thành 4 tab: “Chờ xử lý”, “Chờ hoàn tiền”, “Đã xử lý”, “Đã hủy” và cả nút Tạo đơn. Lễ tân bấm nút "Xem chi tiết" ở một đơn khiếu nại. Hệ thống hiển thị modal chi tiết gồm: Mã đơn khiếu nại, loại khiếu nại, lớp cần gia sư bị khiếu nại, họ tên người gửi, vai trò, SĐT, Lễ tân tiếp nhận, ngày giờ tiếp nhận, yêu cầu hoàn tiền gần nhất (nếu là hoàn tiền: số đề xuất, số đã hoàn, trạng thái, lý do từ chối), nội dung chi tiết và trạng thái hiện tại.  Lễ tân xem xong bấm nút "Đóng" hoặc icon "X". Khi đơn còn "Chờ xử lý", Lễ tân có thể chỉnh sửa họ tên, SĐT, vai trò, nội dung, sau đó bấm nút Lưu; trạng thái đơn chỉ đổi qua thao tác giải quyết. Đơn "Chờ hoàn tiền", "Đã xử lý", "Đã hủy" chỉ xem. Hệ thống hiển thị thông báo: “Bạn xác nhận thay đổi thông tin đơn khiếu nại này chứ?” và 2 nút Đồng ý/ Hủy. Lễ tân bấm nút Đồng ý. Hệ thống hiển thị thông báo thao tác thành công, chuyển về trang “Xử lý khiếu nại”. |
| **Ngoại lệ** | 2.1. Không có khiếu nại nào trong hệ thống. 2.1.1. Hệ thống hiển thị thông báo "Chưa có khiếu nại nào". 4a. Người khiếu nại rút yêu cầu khi đơn còn "Chờ xử lý". 4a.1. Lễ tân bấm "Hủy khiếu nại". 4a.2. Hệ thống hiển thị thông báo xác nhận và 2 nút Đồng ý, Hủy. 4a.3. Lễ tân bấm Đồng ý. 4a.4. Khiếu nại chuyển "Đã hủy", lớp cần gia sư và lớp học giữ nguyên trạng thái. |

## **UC-REC-16: Xác nhận giải quyết khiếu nại**

> Ghi chú phạm vi (v1.2): tính năng khiếu nại đã loại khỏi phạm vi triển khai còn lại (mốc 23/11, WBS 6.1); module vẫn giữ nguyên trong codebase — UC này mô tả chức năng hiện có, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-REC-16 |
| :---- | :---- |
| **Tên UC** | Xác nhận giải quyết khiếu nại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1\. Lễ tân đã đăng nhập hệ thống 2\. Tồn tại khiếu nại ở trạng thái "Chờ xử lý" 3\. Với khiếu nại không hoàn tiền, Lễ tân đã liên hệ bên còn lại (gia sư hoặc phụ huynh) để xác nhận yêu cầu |
| **Hậu điều kiện** | 1\. **Không hoàn tiền:** khiếu nại chuyển "Đã xử lý", lưu kết quả xử lý, kết quả với lớp (Hủy lớp hoặc Ghép lại), minh chứng, người xử lý và thời điểm giải quyết; lớp cần gia sư đổi trạng thái theo kết quả nếu chưa được xử lý trước đó. 2\. **Hoàn tiền:** khiếu nại chuyển "Chờ hoàn tiền", tạo yêu cầu hoàn tiền chờ Kế toán; trạng thái khiếu nại tự cập nhật khi Kế toán xử lý. |
| **Kịch bản chính: Không hoàn tiền** | 1\. Lễ tân truy cập trang "Xử lý khiếu nại", chọn tab "Chờ xử lý". 2\. Hệ thống hiển thị danh sách các khiếu nại cần giải quyết. 3\. Lễ tân liên hệ bên còn lại để xác nhận yêu cầu (thao tác ngoài hệ thống). 4\. Lễ tân bấm nút "Giải quyết" tại khiếu nại tương ứng. 5\. Hệ thống hiển thị modal giải quyết gồm thông tin đơn, thông tin lớp cần gia sư bị khiếu nại (trạng thái hiện tại, gia sư, số ngày còn được xử lý nếu đã ghép thành công), ô "Kết quả với lớp" gồm "Hủy lớp" và "Ghép lại", ô nhập "Kết quả xử lý & Ghi chú", "Đính kèm minh chứng" và 2 nút "Xác nhận", "Hủy". Lớp chưa có gia sư (Chờ xử lý, Đã đăng, Đang ghép lại) chỉ có "Hủy lớp" và được chọn sẵn. Lớp Đang dạy thử hoặc Ghép thành công bắt buộc chọn một trong hai. 6\. Lễ tân nhập thông tin rồi bấm "Xác nhận". 7\. Hệ thống hiển thị popup xác nhận theo trường hợp, Lễ tân bấm "Đồng ý". 8\. Hệ thống thực hiện chuỗi xử lý tự động: \- **Hủy lớp:** lớp cần gia sư và lớp đang học (nếu có) bị hủy, gia sư đang dạy bị loại. \- **Ghép lại:** lớp chuyển "Đang ghép lại" (REMATCH), lớp đang học bị hủy, gia sư cũ bị loại khỏi lớp. \- Khiếu nại chuyển "Đã xử lý", lưu thời gian giải quyết, gửi thông báo tới các bên và ghi Audit Log (RESOLVE\_COMPLAINT). |
| **Kịch bản thay thế: Xử lý thủ công** | 3a. Lễ tân tự thao tác hủy hoặc ghép lại tại trang Lớp cần gia sư. 3a.1. Sau đó Lễ tân quay lại khiếu nại, bấm "Giải quyết", chọn kết quả tương ứng và nhập kết quả xử lý. 3a.2. Hệ thống nhận ra lớp đã được xử lý, hiển thị nhãn "Đã xử lý thủ công" và yêu cầu đính kèm minh chứng đã xử lý (bắt buộc ít nhất 1 tệp). 3a.3. Lễ tân đính kèm minh chứng và xác nhận. Hệ thống chỉ đóng khiếu nại, không thao tác lại trên lớp và không gửi lại thông báo. |
| **Kịch bản chính: Hoàn tiền** | 1\. Lễ tân thống nhất số tiền hoàn đề xuất và tài khoản nhận với người khiếu nại. 2\. Lễ tân bấm nút "Gửi yêu cầu hoàn tiền" tại khiếu nại tương ứng. 3\. Hệ thống hiển thị modal gồm các khoản phí đã được kế toán xác nhận của lớp, số tiền còn có thể hoàn, ô nhập số tiền đề xuất, tên chủ tài khoản, ngân hàng, số tài khoản. 4\. Lễ tân nhập thông tin và bấm "Gửi". 5\. Hệ thống tạo yêu cầu hoàn tiền, chuyển khiếu nại sang "Chờ hoàn tiền", thông báo cho Kế toán và ghi Audit Log (REQUEST\_REFUND). 6\. Kế toán xử lý theo UC-ACC-04. Khi Kế toán xác nhận hoàn tiền, khiếu nại tự chuyển "Đã xử lý"; khi Kế toán từ chối, khiếu nại quay về "Chờ xử lý" kèm lý do để Lễ tân xử lý lại. |
| **Ngoại lệ** | 6.1. Lễ tân để trống ô "Kết quả xử lý". 6.1.1. Hệ thống hiển thị cảnh báo "Vui lòng nhập kết quả xử lý." và không cho phép xác nhận. 6.2. Lễ tân chưa chọn ô "Kết quả với lớp" khi lớp đang dạy thử hoặc ghép thành công. 6.2.1. Hệ thống hiển thị cảnh báo "Vui lòng chọn Hủy lớp hoặc Ghép lại." 6.3. Lớp chưa có gia sư. 6.3.1. Hệ thống không cho chọn "Ghép lại". 6.4. Lớp đã được xử lý thủ công nhưng chưa có minh chứng. 6.4.1. Hệ thống hiển thị cảnh báo "Lớp đã được xử lý trước đó. Vui lòng đính kèm minh chứng đã xử lý." 6.5. Lớp đã ghép thành công quá 7 ngày và chưa được xử lý. 6.5.1. Hệ thống báo "Lớp đã ghép thành công quá 7 ngày, không thể hủy lớp hoặc ghép lại.", Lễ tân hủy khiếu nại và giải thích với người khiếu nại. 8.1. Lớp không còn ở trạng thái có thể xử lý. 8.1.1. Hệ thống báo lỗi và không thay đổi dữ liệu. 4.1 (Hoàn tiền). Số tiền đề xuất vượt số tiền còn có thể hoàn. 4.1.1. Hệ thống báo lỗi và không cho gửi. 5.1. Lễ tân bấm "Hủy" hoặc icon "X" tại modal. 5.1.1. Hệ thống đóng modal và giữ nguyên trạng thái "Chờ xử lý". |

---

## **UC-REC-17: Xử lý hàng đợi dạy thử thất bại**

| Mã UC | UC-REC-17 |
| :---- | :---- |
| **Tên UC** | Xử lý hàng đợi dạy thử thất bại |
| **Actor** | Lễ tân |
| **Tiền điều kiện** | 1. Lễ tân đã đăng nhập. 2. Tồn tại task từ báo cáo `FAILED` của gia sư. |
| **Hậu điều kiện** | Task được theo dõi qua `PENDING`, `IN_PROGRESS`, `RESOLVED`. Khi vào `RESOLVED`, hệ thống ghi `resolved_by`/`resolved_at`; khi mở lại thì xóa hai trường này. Lớp cũ giữ `TRIAL_FAIL`. |
| **Kịch bản chính** | 1. Lễ tân mở **Quản lý lớp học → Dạy thử thất bại cần xử lý**. 2. Hệ thống hiển thị thống kê, danh sách phân trang và bộ lọc trạng thái/người phụ trách. 3. Lễ tân xem chi tiết lớp, học viên, gia sư, ca thử, lý do báo cáo và lịch sử. 4. Lễ tân gán cho mình/bỏ gán; gán không tự đổi trạng thái. 5. Lễ tân đổi trạng thái bằng dropdown ba trạng thái. 6. Lễ tân liên hệ phụ huynh ngoài hệ thống. 7. Nếu phụ huynh muốn tìm gia sư khác, Lễ tân bấm **Ghép lại**. 8. Hệ thống mở lại `class_request` và đưa request về `REMATCH` theo lifecycle, thao tác lặp lại an toàn nếu request đã `OPEN`/`REMATCH`. |
| **Ngoại lệ** | 3.1. Lớp không có `class_request_id`: không cho Ghép lại. 5.1. Trạng thái ngoài ba giá trị cho phép: từ chối. 7.1. Task không tồn tại: báo lỗi. Nếu phụ huynh không muốn tìm nữa, chuyển sang UC-REC-04. |
