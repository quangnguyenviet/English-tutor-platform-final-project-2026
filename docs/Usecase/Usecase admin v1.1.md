**ĐẶC TẢ USE CASE**  
  **QUẢN TRỊ VIÊN (ADMMIN)**

Phiên bản: v1.2 (18/12/2026) — bản v1.1 cập nhật 08/11.

Nội dung cập nhật v1.2 (chỉnh khớp với mã nguồn tại dev, 18/12/2026):

- UC-ADM-01: bỏ trường "Gia sư chỉ định (tùy chọn)" khỏi form tạo lớp (chức năng gia sư chỉ định đã loại, V27 — 20/11).
- UC-ADM-04: viết lại theo luồng hiện tại — lớp "Chờ xử lý" có nút "Đăng lớp" (bổ sung thông tin rồi đăng, "Lưu và đăng lớp"/"Chỉ lưu"); lớp "Đang ghép lại" có nút "Sửa thông tin" (chỉ sửa học phí/buổi, yêu cầu lớp học, mục tiêu học tập, yêu cầu đối với gia sư); không còn nút "Xác nhận đơn" và các bước đổi gia sư chỉ định.
- UC-ADM-05: đánh dấu "Đã loại khỏi hệ thống (20/11, V27 — thay thế bằng luồng MSG)" — cột `class_requests.requested_tutor_id` đã DROP, không còn endpoint xác nhận đơn chỉ định; phụ huynh đã chọn sẵn gia sư thì đăng tin qua MSG (`POST /api/v1/parent/postings`, Lễ tân duyệt), gia sư được ghép qua chọn từ danh sách ứng tuyển (UC-ADM-02) hoặc đề xuất MSG. Nội dung giữ lại chỉ làm tham khảo.
- UC-ADM-06: cập nhật bước 7 — không còn nhánh "Gia sư chỉ định / Xác nhận đơn" (đã loại); ngoại lệ 7.1 sửa theo API_DESIGN (lớp ghép lại hiển thị với gia sư như lớp đăng tuyển bình thường, không bị tạm ẩn).
- UC-ADM-07: bổ sung quy định bắt buộc — từ chối hồ sơ gia sư phải nhập lý do (rejectionReason; thiếu thì API trả 400 MISSING_REJECTION_REASON).
- UC-ADM-08: sửa danh sách tab thành 4 tab (Tất cả / Chờ duyệt / Đang hoạt động / Ngưng hoạt động; backend còn nhận giá trị REJECTED); bổ sung tính năng quản lý gói lưu trữ tài liệu buổi học (V30): chọn gói FREE (1 GB, vô thời hạn) / PRO (10 GB) / PREMIUM (50 GB) kèm thời hạn 1/3/12 tháng ở form sửa, xem gói hiện hành + lịch sử thuê bao trong modal chi tiết (GET /tutors/{id}/storage-subscriptions).
- UC-ADM-09: viết lại thành "Tiếp nhận và thu hộ minh chứng phí nhận lớp" — trang phí không có nút "Tạo đơn" (PaymentReviewPage không có button tạo); khoản phí do hệ thống tự sinh (bản nháp NEW khi ghép TRIAL, kích hoạt NOT_SUBMITTED khi ghép thành công); minh chứng do Gia sư tải lên hoặc Lễ tân/Admin thu hộ tại quầy (POST /payments/{id}/collect-proof); Admin chỉnh tỷ lệ phí khi khoản chưa có minh chứng.
- UC-ADM-10: sửa mô hình danh sách học sinh — 4 thẻ chỉ số và tab Chờ duyệt / Đã duyệt (gồm "Đã tạo account") / Tất cả; trang chạy trên dữ liệu mock, chưa có API quản lý hồ sơ học sinh; nút "Tạo account" chỉ cập nhật trạng thái mock (username = SĐT phụ huynh, mật khẩu mặc định) — tài khoản học sinh thật được tạo tự động tại bước ghép lớp/chọn gia sư (UC-ADM-02).
- UC-ADM-11: sửa hậu điều kiện — danh sách không có "số khiếu nại của từng Admin" (EmployeeSummaryResponse chỉ gồm mã NV, họ tên, email, SĐT, vai trò, ngày vào làm, trạng thái); thống kê công việc chỉ hiện trong chi tiết theo vai trò.
- UC-ADM-12: sửa tên vai trò thành RECEPTIONIST / ACCOUNTANT (bản v1.1 ghi sai "ADMEPTIONIST, ADMOUNTANT"); bổ sung trường "Vai trò" (Lễ tân / Kế toán, bắt buộc) vào modal thêm nhân sự; cập nhật bước tạo thành modal bàn giao thông tin đăng nhập.
- UC-ADM-13: làm rõ vai trò người tạo (Lễ tân hoặc Admin tại quầy — POST /api/v1/complaints cho phép RECEPTIONIST/ADMIN); trường "Vai trò" trong đơn (complainantRole) mặc định "Phụ huynh", có thể chuyển "Gia sư"; bổ sung ghi chú phạm vi khiếu nại (WBS 6.1 loại khỏi kế hoạch 23/11, module giữ nguyên).
- UC-ADM-14: bổ sung ghi chú phạm vi; làm rõ thao tác sửa chỉ được khi đơn còn "Chờ xử lý" và loại khiếu nại/lớp bị khiếu nại không đổi được sau khi tạo (kèm ngoại lệ 409 COMPLAINT_INVALID_STATE).
- UC-ADM-15: sửa actor — gửi yêu cầu hoàn tiền do Lễ tân (hoặc Admin) thực hiện, xử lý hoàn tiền do Kế toán (hoặc Admin); thêm ghi chú phạm vi.
- UC-ADM-17: viết lại — 1 hành động "Xác nhận" với ô "Số tiền thực nhận"; nếu thực nhận nhỏ hơn phải nộp, hệ thống TỰ ĐỘNG chuyển "Yêu cầu nộp lại" kèm lý do tự sinh; "Yêu cầu gửi lại" là nhánh riêng (lý do tự nhập, không có checklist lý do mẫu); thêm ràng buộc PAYMENT_SAME_ACTOR (người nộp/thu hộ không được tự xác nhận); bỏ mục "Cú pháp chuyển khoản mong đợi" (không có trong UI); bổ sung ghi chú công cụ zoom/xoay ảnh và checklist lý do mẫu chưa có trong UI.
- UC-ADM-18: sửa actor thành Kế toán (hoặc Admin) — mọi endpoint RefundController cho phép hasAnyRole('ACCOUNTANT','ADMIN'); trang "Hoàn tiền" dùng chung AccountantRefunds cho cả /accountant/refunds và /admin/refunds; tham chiếu UC-ACC-04; bổ sung ràng buộc REFUND_SAME_ACTOR (người lập đề xuất không tự xử lý) và điều kiện chuyển khiếu nại về PENDING chỉ khi đang PROCESSING.
- §1.2 / §1.3: bổ sung ghi chú — dashboard, phân tích và nhật ký hoạt động hiện chạy dữ liệu mock (chưa có endpoint đọc audit_logs).


# **PHẦN I. MÔ TẢ VAI TRÒ ADMMIN TRONG HỆ THỐNG**

## **1.1 Định nghĩa vai trò**

Admin (Quản trị viên) là người vận hành trung tâm gia sư, chịu trách nhiệm điều phối toàn bộ quy trình từ khi phụ huynh gửi yêu cầu tìm gia sư cho đến khi lớp học vận hành ổn định và phí nhận lớp được đối soát thành công. Admin đóng vai trò trung gian kết nối Phụ huynh — Gia sư — Học sinh, đảm bảo chất lượng dịch vụ, giám sát vận hành và duy trì tính minh bạch tài chính của trung tâm.

## **1.2 Trách nhiệm chính**

| Trách nhiệm | Mô tả  |
| :---- | :---- |
| Quản lý Lớp cần gia sư | Tiếp nhận yêu cầu đăng ký học từ Phụ huynh trên một trang duy nhất. Phụ huynh đã chọn gia sư thì trao đổi và xác nhận chuyển dạy thử; chưa chọn thì đăng lớp cho gia sư ứng tuyển. Theo dõi dạy thử, xác nhận ghép thành công, ghép lại, hủy lớp. |
| Quản lý hồ sơ Gia sư | Duyệt hồ sơ gia sư đăng ký mới, quản lý trạng thái hoạt động, chỉnh sửa thông tin |
| Quản lý hồ sơ Học sinh | Duyệt hồ sơ học sinh, tạo tài khoản học sinh sau khi thanh toán được xác nhận |
| Phê duyệt phí nhận lớp (QR Proof) | Kiểm tra minh chứng chuyển khoản (ảnh biên lai), duyệt/yêu cầu gửi lại minh chứng |
| Giám sát vận hành & báo cáo | Theo dõi doanh thu, tỷ lệ ghép lớp, số lượng gia sư/học sinh mới, xuất báo cáo (chạy trên dữ liệu mock — chưa nối API, xem §1.3 ghi chú) |
| Quản lý thông báo | Nhận & xử lý thông báo từ gia sư, phụ huynh, hệ thống |
| Kiểm soát nhật ký hoạt động | Giám sát audit trail, theo dõi mọi thao tác quan trọng trong hệ thống (chạy trên dữ liệu mock — chưa có endpoint đọc audit_logs, xem §1.3 ghi chú) |
| Quản lý nhân sự Lễ tân, Kế toán | Thêm mới, chỉnh sửa thông tin, phân quyền và quản lý trạng thái hoạt động của nhân viên trung tâm. |
| Xử lý khiếu nại & Đối soát tài chính | Giám sát toàn bộ khiếu nại (Hoàn tiền / Không hoàn tiền) do Lễ tân tiếp nhận, duyệt xử lý và đối soát dòng tiền thu \- chi |

 

## **1.3 Các luồng nghiệp vụ chính**

Tóm tắt 7 luồng nghiệp vụ chính:

| Luồng | Tên | Mô tả ngắn |
| :---- | :---- | :---- |
| LN-1 | Quản lý lớp cần gia sư | Từ yêu cầu PH (tin đăng MSG hoặc form website, V27) → Tư vấn (\<12h) → Đăng lớp và chọn gia sư ứng tuyển (gia sư do phụ huynh chọn sẵn đến từ đề xuất MSG, không phải "gia sư chỉ định" đã loại) → Đang dạy thử → Ghép thành công (nếu dạy thử thất bại: Phụ huynh chọn ghép lại → Đang ghép lại → chọn gia sư mới) |
| LN-2 | Duyệt phí nhận lớp (QR Proof) | Sau 1 tháng dạy → GS nộp MC → Duyệt / Yêu cầu gửi lại |
| LN-3 | Quản lý Gia sư | Duyệt hồ sơ mới → Quản lý trạng thái → Sửa/Xóa thông tin |
| LN-4 | Quản lý Học sinh | Duyệt hồ sơ → Tạo tài khoản sau khi thanh toán OK |
| LN-5 | Giám sát & Báo cáo vận hành | Dashboard thống kê, biểu đồ doanh thu, xuất báo cáo (dữ liệu mock — chưa nối API) |
| LN-6 | Quản lý nhân sự  | CRUD, cấp quyền, theo dõi hoạt động và trạng thái nhân sự |
| LN-7 | Giám sát khiếu nại & Đối soát thu chi | Tiếp nhận khiếu nại tại quầy → Phân loại hoàn tiền/không hoàn tiền → Đối soát doanh thu thực |

> **Trạng thái LN-5 (v1.2):** Dashboard thống kê (AdminDashboard), phân tích doanh thu (AdminAnalytics) và trang Nhật ký hoạt động (AdminLogs) hiện chạy trên dữ liệu mock (`data/mockData`: activityLogs, revenueData) — chưa nối API; phía backend có bảng `audit_logs` và service ghi nhận nhưng chưa có endpoint nào để Admin đọc. Phần "Giám sát & báo cáo" ở trên mô tả thiết kế mục tiêu, chưa phải tính năng hoạt động thực tế.

 

# **PHẦN II. BẢNG MÔ TẢ USE CASE CHI TIẾT**

## **UC-ADM-01: Tạo lớp cần gia sư**

| Mã UC | UC-ADM-01 |
| :---- | :---- |
| **Tên UC** | Tạo lớp cần gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Phụ huynh liên hệ trung tâm để tìm gia sư, có thể đã chọn sẵn gia sư hoặc chưa. Yêu cầu phụ huynh gửi trên website tự tạo lớp ở "Chờ xử lý", không cần Admin tạo lại. |
| **Hậu điều kiện** | Xuất hiện lớp cần gia sư mới ở trạng thái "Chờ xử lý". |
| **Kịch bản chính** | 1\. Admin chọn mục "Quản lý lớp cần gia sư". 2\. Hệ thống hiển thị danh sách lớp với các tab: Tất cả, Chờ xử lý, Đã đăng, Đang dạy thử, Ghép thành công, Đang ghép lại, Đã hủy; có tìm kiếm, sắp xếp theo thời gian và số gia sư ứng tuyển, và nút "Tạo mới lớp". 3\. Admin bấm "Tạo mới lớp". 4\. Hệ thống hiển thị form gồm: Họ tên phụ huynh, SĐT, Họ tên học sinh, Khối lớp, Trường học, Yêu cầu lớp học, Mục tiêu học tập, Hình thức học, Học phí/buổi, Số buổi/tuần, Tỷ lệ phí nhận lớp, Lịch học mong muốn, Yêu cầu đối với gia sư; và 2 nút "Tạo lớp", "Hủy". Thông tin phụ huynh và học sinh không công khai với gia sư. 5\. Admin nhập thông tin và bấm "Tạo lớp". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống thông báo thành công, lớp xuất hiện ở tab "Chờ xử lý". Chưa tạo tài khoản học sinh ở bước này. |
| **Ngoại lệ** | 4.1. Admin bấm "Hủy": hệ thống đóng form, không tạo lớp. 5.1. Thiếu thông tin bắt buộc hoặc SĐT sai định dạng: hệ thống báo lỗi, giữ nguyên dữ liệu đã nhập. 7.1. Admin bấm "Hủy" tại popup: hệ thống quay lại form. 5.2. Số điện thoại thuộc về phụ huynh khác tên: hệ thống hiện cảnh báo kèm tên phụ huynh đó và khóa nút "Tạo lớp". Admin xác nhận lại với phụ huynh: nhầm số thì đổi số điện thoại, cùng gia đình thì bấm "Dùng phụ huynh [tên]". Đúng họ tên và số điện thoại đã có thì không cảnh báo, lớp mới gắn với phụ huynh đó. |

## **UC-ADM-02: Chọn gia sư từ danh sách ứng tuyển**

| Mã UC | UC-ADM-02 |
| :---- | :---- |
| **Tên UC** | Chọn gia sư từ danh sách ứng tuyển |
| **Actor** | Admin |
| **Tiền điều kiện** | Admin đã đăng nhập. Lớp ở "Đã đăng" hoặc "Đang ghép lại". Có gia sư ứng tuyển. Admin đã trao đổi với phụ huynh và gia sư, hai bên đồng ý. |
| **Hậu điều kiện** | Lớp chuyển "Đang dạy thử". Lớp học `TRIAL` và khoản phí nháp được tạo. Tài khoản học sinh được tạo nếu chưa có. Các gia sư còn lại được thông báo không được chọn. |
| **Kịch bản chính** | 1\. Admin bấm "Danh sách ứng tuyển" tại lớp tương ứng. 2\. Hệ thống mở modal gồm: Tên gia sư, Thời gian ứng tuyển, Lời nhắn, nút "Chọn gia sư", "Xem chi tiết". 3\. Admin bấm "Chọn gia sư". 4\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 5\. Admin bấm "Đồng ý". 6\. Hệ thống thông báo thành công và hiển thị tài khoản học sinh, mật khẩu mặc định nếu vừa tạo để bàn giao cho gia đình. |
| **Ngoại lệ** | 1.1. Chưa có gia sư ứng tuyển: nút "Danh sách ứng tuyển" bị khóa. 5.1. Admin bấm "Hủy" tại popup: hệ thống quay lại danh sách ứng tuyển. 6.1. Chưa có họ tên học sinh hoặc gia sư không còn hoạt động: hệ thống báo lỗi, không đổi dữ liệu. |

## **UC-ADM-03: Hủy lớp cần gia sư**

| Mã UC | UC-ADM-03 |
| :---- | :---- |
| **Tên UC** | Hủy lớp cần gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Lớp ở bất kỳ trạng thái nào trừ "Đã hủy". 3\. Lớp "Ghép thành công" phải còn trong 7 ngày kể từ ngày lớp chính thức (Quy định website I.3). |
| **Hậu điều kiện** | Lớp chuyển "Đã hủy" và gỡ khỏi trang gia sư. Lớp học đang `TRIAL`/`ACTIVE` bị hủy, gia sư đang dạy bị loại khỏi lớp. Gia sư đã ứng tuyển, gia sư đang dạy và học sinh nhận được thông báo kèm lý do. Tiền dạy do phụ huynh và gia sư tự thanh toán, khoản phí nhận lớp đã kích hoạt không tự hủy. |
| **Kịch bản chính** | 1\. Hệ thống hiển thị danh sách lớp kèm nút "Hủy lớp". Lớp "Ghép thành công" hiển thị đếm ngược "Còn N ngày để hủy lớp, đến hết ngày dd/mm/yyyy". 2\. Admin bấm "Hủy lớp". 3\. Hệ thống hiển thị ô nhập lý do. 4\. Admin nhập lý do và bấm "Đồng ý hủy". 5\. Hệ thống hiển thị popup xác nhận kèm 2 nút. 6\. Admin bấm "Đồng ý hủy". 7\. Hệ thống cập nhật trạng thái, gửi thông báo và báo thành công. |
| **Ngoại lệ** | 1.1. Lớp "Ghép thành công" đã quá 7 ngày: nút "Hủy lớp" bị làm mờ, hệ thống hiển thị "Đã hết hạn hủy lớp", nếu vẫn gửi yêu cầu thì từ chối. 4.1. Để trống lý do: nút xác nhận bị khóa. 6.1. Admin bấm "Hủy" tại popup: hệ thống quay lại, không thay đổi. |

## **UC-ADM-04: Bổ sung thông tin và đăng lớp**

| Mã UC | UC-ADM-04 |
| :---- | :---- |
| **Tên UC** | Bổ sung thông tin và đăng lớp (v1.2: nút "Xác nhận đơn" và các bước đổi gia sư chỉ định đã loại khỏi hệ thống — 20/11, V27; xem UC-ADM-05) |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Lớp ở "Chờ xử lý" (luồng đăng lớp) hoặc "Đang ghép lại" (luồng sửa thông tin — xem UC-ADM-06). 3\. Với lớp "Chờ xử lý": Admin đã gọi tư vấn phụ huynh. |
| **Hậu điều kiện** | Thông tin lớp được cập nhật. Với luồng đăng lớp: lớp chuyển "Đã đăng", hiển thị trên trang gia sư và trang công khai. Với luồng đang ghép lại: chỉ lưu thông tin đã sửa (học phí/buổi, yêu cầu lớp học, mục tiêu học tập, yêu cầu đối với gia sư — không sửa được thông tin phụ huynh/học sinh), gia sư đang ứng tuyển nhận thông báo thay đổi. |
| **Kịch bản chính** | 1\. Admin mở tab "Chờ xử lý" và bấm "Đăng lớp" (hoặc tab "Đang ghép lại" và bấm "Sửa thông tin"). 2\. Hệ thống hiển thị form thông tin lớp: họ tên phụ huynh, SĐT, email, địa chỉ; họ tên học sinh, khối lớp, trường học; yêu cầu lớp học, mục tiêu học tập, hình thức học, học phí/buổi, số buổi/tuần, tỷ lệ phí nhận lớp, lịch học mong muốn, yêu cầu đối với gia sư. Khi đăng lớp, SĐT phụ huynh không sửa được; khi đang ghép lại chỉ sửa được học phí, mục tiêu học tập, yêu cầu đối với gia sư và yêu cầu lớp học. 3\. Admin nhập thông tin rồi bấm "Lưu và đăng lớp" (đang ghép lại: "Lưu thay đổi"); bấm "Chỉ lưu" nếu chưa đủ thông tin để chuyển trạng thái (chỉ có ở luồng đăng lớp). 4\. Hệ thống hiển thị popup xác nhận ("Lưu thông tin và đăng lớp [mã lớp] lên trang gia sư chứ?" / "Xác nhận cập nhật lớp"). 5\. Admin bấm "Đồng ý". 6\. Hệ thống lưu thông tin và đăng lớp lên trang gia sư, lớp chuyển "Đã đăng"; khi đang ghép lại, gia sư đang ứng tuyển nhận thông báo thay đổi; hệ thống báo thành công. |
| **Ngoại lệ** | 3.1. Thiếu thông tin bắt buộc hoặc sai định dạng (họ tên phụ huynh, họ tên học sinh, SĐT, email sai định dạng, học phí thiếu hoặc nhỏ hơn 10.000₫): hệ thống báo lỗi và giữ nguyên dữ liệu đã nhập. 3.2. Đăng lớp (nút "Lưu và đăng lớp") khi thiếu yêu cầu lớp học hoặc hình thức học: hệ thống báo "Vui lòng nhập yêu cầu lớp học trước khi đăng lớp." / "Vui lòng chọn hình thức học trước khi đăng lớp." (nút "Chỉ lưu" thì bỏ qua 2 điều kiện này). 4.1. Admin bấm "Hủy" tại popup: hệ thống quay lại form, không thay đổi. |

## **UC-ADM-05: Xác nhận lớp có gia sư chỉ định** (Đã loại khỏi hệ thống — 20/11, V27)

> **Lưu ý v1.2 (Tính năng đã bị loại — không còn trong hệ thống):** Chức năng "gia sư chỉ định" đã được loại bỏ hoàn toàn (migration V27: DROP COLUMN `class_requests.requested_tutor_id`; nút "Xác nhận đơn" đã xóa khỏi trang Lớp cần gia sư; backend không còn endpoint xác nhận đơn chỉ định). Khi phụ huynh đã chọn sẵn gia sư, gia sư được ghép qua đề xuất MSG (`POST /api/v1/parent/postings`, Lễ tân duyệt tin đăng) hoặc qua chọn từ danh sách ứng tuyển (UC-ADM-02). Nội dung bên dưới chỉ còn giá trị tham khảo, không mô tả luồng hiện tại.

| Mã UC | UC-ADM-05 |
| :---- | :---- |
| **Tên UC** | Xác nhận lớp có gia sư chỉ định |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Lớp ở "Chờ xử lý" hoặc "Đang ghép lại" và có gia sư chỉ định. 3\. Admin đã trao đổi, phụ huynh và gia sư đồng ý. |
| **Hậu điều kiện** | Lớp chuyển "Đang dạy thử". Lớp học `TRIAL` và khoản phí nháp được tạo. Tài khoản học sinh được tạo nếu chưa có. Các gia sư đang ứng tuyển (nếu có) được thông báo không được chọn. |
| **Kịch bản chính** | 1\. Admin bấm "Xác nhận đơn" tại lớp tương ứng. 2\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 3\. Admin bấm "Đồng ý". 4\. Hệ thống thông báo thành công, gửi thông báo tới gia sư, hiển thị tài khoản học sinh và mật khẩu mặc định nếu vừa tạo. |
| **Ngoại lệ** | 1.1. Chưa có họ tên học sinh hoặc học phí: hệ thống yêu cầu bổ sung và mở form thông tin. 3.1. Admin bấm "Hủy" tại popup: hệ thống quay lại, không thay đổi. 4.1. Gia sư không còn hoạt động: hệ thống báo lỗi, Admin đổi gia sư theo UC-ADM-04. |

## **UC-ADM-05.1: Xác nhận ghép thành công**

| Mã UC | UC-ADM-05.1 |
| :---- | :---- |
| **Tên UC** | Xác nhận ghép thành công |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Lớp ở "Đang dạy thử". 3\. Gia sư đã hoàn thành buổi dạy thử và hai bên thống nhất học chính thức. |
| **Hậu điều kiện** | 1\. Lớp chuyển "Ghép thành công". 2\. Lớp học chuyển từ `TRIAL` sang `ACTIVE`, ghi ngày chính thức. 3\. Khoản phí nhận lớp được kích hoạt. 4\. Bắt đầu đếm ngược 7 ngày được hủy lớp. |
| **Kịch bản chính** | 1\. Admin mở tab "Đang dạy thử". 2\. Hệ thống hiển thị danh sách lớp kèm nút "Xác nhận ghép thành công", "Ghép lại", "Hủy lớp", "Xem chi tiết". 3\. Admin bấm "Xác nhận ghép thành công". 4\. Hệ thống hiển thị modal gồm số buổi/tuần, học phí/buổi, tỷ lệ phí và số phí tính được. 5\. Admin bổ sung thông tin còn thiếu và xác nhận. 6\. Hệ thống thông báo thành công và chuyển lớp sang tab "Ghép thành công". |
| **Ngoại lệ** | 2.1. Admin bấm "Ghép lại": chuyển sang UC-ADM-06. 2.2. Admin bấm "Hủy lớp": chuyển sang UC-ADM-03. 5.1. Thiếu số buổi/tuần hoặc học phí: hệ thống báo lỗi, không kích hoạt. |

## **UC-ADM-06: Ghép lại lớp**

| Mã UC | UC-ADM-06 |
| :---- | :---- |
| **Tên UC** | Ghép lại lớp khi dạy thử không thành công |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Lớp ở "Đang dạy thử". 3\. Dạy thử không thành công, Admin đã hỏi ý kiến phụ huynh. |
| **Hậu điều kiện** | Lớp chuyển "Đang ghép lại", gia sư cũ bị loại và không ứng tuyển lại được. Các gia sư trước đó không được chọn tự quay lại danh sách ứng tuyển và nhận thông báo. Gia sư và khách thấy lớp như lớp đăng tuyển bình thường. |
| **Kịch bản chính** | 1\. Admin bấm "Ghép lại". 2\. Hệ thống hiển thị 2 lựa chọn "Tìm gia sư khác", "Không tìm nữa" và ô nhập lý do. 3\. Admin chọn "Tìm gia sư khác", nhập lý do và bấm "Chuyển sang ghép lại". 4\. Hệ thống hiển thị popup xác nhận. 5\. Admin bấm "Đồng ý". 6\. Hệ thống hủy lớp dạy thử, thông báo gia sư cũ và học sinh, chuyển lớp sang tab "Đang ghép lại". 7\. Admin chọn gia sư từ danh sách ứng tuyển (UC-ADM-02); nếu phụ huynh tự chọn được gia sư qua tin nhắn (đề xuất MSG), lớp được ghép thành công khi gia sư chấp nhận đề xuất. |
| **Ngoại lệ** | 3.1. Phụ huynh chọn "Không tìm nữa": chuyển sang UC-ADM-03, điền sẵn lý do. 7.1. Lớp đang ghép lại (REMATCH) được API gia sư trả về như trạng thái "Đã đăng": gia sư và khách thấy lớp như đơn đăng tuyển bình thường và nhận ứng tuyển bình thường (V27: không còn cơ chế tạm ẩn lớp). 7.2. Admin bấm "Sửa thông tin" (UC-ADM-04): chỉ sửa được học phí, mục tiêu học tập, yêu cầu đối với gia sư; gia sư đang ứng tuyển nhận thông báo thay đổi. Lớp chuyển "Đang dạy thử" khi gia sư mới được chọn (UC-ADM-02 / đề xuất MSG), không phải sau bước sửa thông tin. |

## **UC-ADM-07: Duyệt hồ sơ Gia sư đăng ký mới**

| Mã UC | UC-ADM-07 |
| :---- | :---- |
| **Tên UC** | Duyệt hồ sơ Gia sư đăng ký mới |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại ít nhất 1 hồ sơ Gia sư ở trạng thái Chờ duyệt |
| **Hậu điều kiện** | 1\. Nếu Duyệt: Hồ sơ GS chuyển trạng thái → Đang hoạt động, GS có thể nhận Match Offer 2\. Nếu Từ chối: Hồ sơ bị loại, GS nhận thông báo từ chối (Lưu ý: trạng thái hoạt động (profile_status) là riêng với cờ "Đang mở nhận lớp" (is_open_to_teaching) do gia sư tự bật/tắt trên hồ sơ — tắt cờ thì gia sư không thấy đơn ghép lớp đang mở và không ứng tuyển, nhưng vẫn giữ các lớp đang dạy.) |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Gia sư", chọn tab "Chờ duyệt" 2\. Hệ thống hiển thị danh sách Gia sư chờ duyệt. 3\. Admin bấm vào một hồ sơ GS. 4\. Hệ thống hiển thị thông tin chi tiết: họ tên, SĐT, ngày tháng năm sinh, quê quán, email, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm. Và 2 nút Duyệt, Không duyệt. 5\. Admin bấm nút "Duyệt". 6\. Hệ thống hiển thị popup xác nhận kèm 2 nút Đồng ý/Hủy. 7\. Admin bấm "Đồng ý". 8\. Hệ thống cập nhật trạng thái GS, ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin bấm nút “Không duyệt” (nút “Từ chối” trên danh sách): hệ thống mở modal “Lý do từ chối” bắt buộc nhập (ô văn bản “Lý do từ chối *”, kèm các gợi ý lý do nhanh tự điền vào ô; để trống thì hệ thống chặn với thông báo “Vui lòng nhập lý do từ chối cụ thể!”; thiếu lý do khi gọi API thì hệ thống trả 400 MISSING_REJECTION_REASON) và 2 nút “Hủy bỏ” / “Xác nhận từ chối”. 5.1.1. Admin nhập lý do (hoặc bấm 1 gợi ý nhanh) và bấm “Xác nhận từ chối”. 5.1.1.1. Hệ thống cập nhật hồ sơ về trạng thái “Bị từ chối”, gửi thông báo từ chối kèm lý do tới Gia sư và ghi Audit Log. 5.1.2. Admin bấm “Hủy bỏ” tại modal: hệ thống quay trở lại trang cũ. 7.1. Admin bấm nút Hủy tại popup xác nhận Duyệt: hệ thống quay trở lại trang cũ (Trang chờ duyệt). |

## **UC-ADM-08: Quản lý thông tin gia sư**

| Mã UC | UC-ADM-08 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Gia sư |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập 2\. Tồn tại ít nhất 1 Gia sư trong hệ thống |
| **Hậu điều kiện** | 1\. Hồ sơ gia sư sẽ không thay đổi nếu chỉ xem.2\. Hồ sơ gia sư sẽ được cập nhật khi Admin chỉnh sửa, bao gồm cả gói lưu trữ tài liệu buổi học (V30). (Lưu ý: trạng thái hoạt động (profile_status) là riêng với cờ "Đang mở nhận lớp" (is_open_to_teaching) do gia sư tự bật/tắt trên hồ sơ — tắt cờ thì gia sư không thấy đơn ghép lớp đang mở và không ứng tuyển, nhưng vẫn giữ các lớp đang dạy.) |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Gia sư" từ trang chủ Admin. 2\. Hệ thống hiển thị danh sách GS với 4 tab: Tất cả / Chờ duyệt / Đang hoạt động / Ngưng hoạt động (backend còn nhận giá trị REJECTED — hồ sơ "Bị từ chối" — không có tab riêng trong UI) và nút xem chi tiết từng hồ sơ. 3\. Admin bấm nút "Chi tiết" ở 1 hồ sơ gia sư bất kỳ. 4\. Hệ thống hiển thị modal thông tin chi tiết GS gồm: họ tên, SĐT, ngày tháng năm sinh, quê quán, email, trạng thái hoạt động, chuyên môn, kinh nghiệm, khu vực dạy, bảng giá, bằng cấp/chứng chỉ, ảnh đính kèm; kèm khối "Gói lưu trữ tài liệu buổi học" (V30): gói hiện hành (FREE/PRO/PREMIUM), ngày hết hạn (gói miễn phí là vô thời hạn) và lịch sử các lần cấp/gia hạn gói trả phí. Nút thao tác theo trạng thái: hồ sơ "Chờ duyệt" có "Duyệt" và "Không duyệt" (từ chối bắt buộc kèm lý do — UC-ADM-07), "Đang hoạt động" có "Ngưng hoạt động" và nút "Sửa", "Ngưng hoạt động" có "Kích hoạt lại". 5\. Với hồ sơ "Đang hoạt động", Admin bấm nút "Sửa": form chỉnh sửa gồm thông tin hồ sơ và khối gói lưu trữ (V30) — chọn gói: FREE "Miễn phí (1 GB)", PRO "Pro (10 GB)", PREMIUM "Premium (50 GB)"; nếu chọn gói trả phí thì chọn thời hạn (1, 3 hoặc 12 tháng), qua hạn gói tự về Miễn phí. Sau đó ấn nút "Lưu thay đổi". 6\. Hệ thống hiển thị xác nhận: "Bạn có xác nhận thay đổi thông tin của gia sư không?" và 2 nút Đồng ý/ Hủy. 7\. Admin ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo "Đã lưu thông tin gia sư" và quay lại trang Quản lý GS. |
| **Ngoại lệ** | 7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống quay lại trang modal thông tin chi tiết GS. |

## **UC-ADM-09: Tiếp nhận và thu hộ minh chứng phí nhận lớp**

| Mã UC | UC-ADM-09 |
| :---- | :---- |
| **Tên UC** | Tiếp nhận và thu hộ minh chứng phí nhận lớp (v1.2: viết lại — trang phí không có nút "Tạo đơn"; khoản phí do hệ thống tự sinh) |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Tồn tại khoản phí nhận lớp do hệ thống tự sinh: bản nháp `NEW` khi lớp ghép thành công `TRIAL` (chưa có số tiền), chuyển `NOT_SUBMITTED` ("Chưa nộp minh chứng") khi lớp kích hoạt `ACTIVE` (số tiền được tính). 3\. Chưa có người nào tải minh chứng cho khoản phí này. |
| **Hậu điều kiện** | Minh chứng được lưu kèm khoản phí, khoản chuyển "Chờ xác nhận" (SUBMITTED); khoản được Kế toán/Admin đối chiếu theo UC-ADM-17. |
| **Kịch bản chính** | 1\. Minh chứng nộp theo 1 trong 2 đường (không có nút tạo đơn trên trang Admin): Gia sư tự tải ảnh biên lai chuyển khoản (QR Proof) trên Cổng Gia sư, hoặc Lễ tân/Admin thu hộ tại quầy (tiền mặt hoặc chuyển khoản) và tải ảnh phiếu thu/biên lai (POST /payments/{id}/collect-proof). 2\. Admin chọn mục "Khoản phí nhận lớp" (trang Đối chiếu phí nhận lớp, dùng chung với Kế toán) từ menu Admin. 3\. Hệ thống hiển thị danh sách khoản phí với 4 tab: Chưa nộp minh chứng / Yêu cầu gửi lại / Chờ xác nhận / Đã xác nhận, 4 thẻ chỉ số cùng nội dung và thanh tìm kiếm theo mã lớp, tên gia sư, SĐT phụ huynh; với khoản "Chưa nộp minh chứng", dòng hiển thị nút "Chỉnh tỷ lệ" (chỉ Admin). 4\. Với khoản "Chưa nộp minh chứng", Admin có thể chỉnh tỷ lệ phí nhận lớp (0–50%, mặc định 40%) trước khi có minh chứng; số tiền phải nộp được tính lại theo công thức (tỷ lệ × số buổi/tuần × 4 × học phí/buổi). 5\. Khi minh chứng được tải lên (Gia sư hoặc Lễ tân thu hộ), khoản phí chuyển "Chờ xác nhận" kèm thông tin minh chứng: ảnh, người tải lên, thời điểm. 6\. Admin xem chi tiết khoản phí (modal theo UC-ADM-16): thông tin lớp, các bên, lịch học cố định, công thức và giá trị tính phí, trạng thái nộp, thông tin minh chứng và lịch sử xử lý; đối chiếu khoản "Chờ xác nhận" theo UC-ADM-17. |
| **Ngoại lệ** | 4.1. Chỉnh tỷ lệ phí khi khoản đã có minh chứng: hệ thống không cho chỉnh (trường chỉ đọc), báo lỗi. 5.1. Lễ tân thu hộ khoản phí: khoản chuyển "Chờ xác nhận" nhưng người thu hộ không được tự xác nhận (ràng buộc PAYMENT_SAME_ACTOR — xem UC-ADM-17), phải do Kế toán hoặc người khác đối chiếu. |

## **UC-ADM-10: Quản lý thông tin Học sinh** 

| Mã UC | UC-ADM-10 |
| :---- | :---- |
| **Tên UC** | Quản lý thông tin Học sinh (chạy trên dữ liệu mock — chưa có API quản lý hồ sơ học sinh phía backend) |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập. 2\. Tồn tại ít nhất 1 hồ sơ học sinh (hiện trang dùng danh sách mẫu trong hệ thống, chưa nối API). |
| **Hậu điều kiện** | Admin nắm được chi tiết hồ sơ học sinh, thông tin phụ huynh và gia sư phụ trách hiện tại (trên dữ liệu mock). |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý Học sinh". 2\. Hệ thống hiển thị 4 thẻ chỉ số (Tổng số học sinh, Chờ duyệt, Đã duyệt, Đã tạo account), danh sách học sinh phân theo 3 tab duyệt: Chờ duyệt / Đã duyệt (gồm cả "Đã tạo account") / Tất cả, cùng thanh tìm kiếm (tên, mục tiêu, phụ huynh, trình độ) và bộ lọc gia sư phụ trách. 3\. Admin bấm nút Xem chi tiết (icon mắt) của 1 học sinh cần xem. 4\. Hệ thống hiển thị modal chi tiết: banner trạng thái duyệt (Chờ duyệt thanh toán phí kết nối / Đã duyệt / Đã cấp tài khoản), thông tin phụ huynh (họ tên, SĐT/Zalo, tỉnh thành), thông tin học sinh (trình độ, khối lớp, mục tiêu, lịch học), lớp đang tham gia và gia sư phụ trách. 5\. Với học sinh "Đã duyệt" (chưa có tài khoản), nút "Tạo account" hiện nổi bật: Admin bấm, hệ thống xác nhận rồi đánh dấu học sinh "Đã tạo account" (username = SĐT phụ huynh, mật khẩu mặc định) — thao tác này hiện chỉ cập nhật dữ liệu mock. 6\. Với học sinh "Đã duyệt"/"Đã tạo account", Admin chỉnh sửa thông tin (nút bút) hoặc xóa hồ sơ (nút thùng rác) trên dữ liệu mock. |
| **Ngoại lệ** | 5.1. Học sinh ở tab "Chờ duyệt": nút "Tạo account", "Chỉnh sửa" và "Xóa" không hiển thị (chỉ xem chi tiết). |

## **UC-ADM-11: Quản lý nhân sự** 

| Mã UC | UC-ADM-11 |
| :---- | :---- |
| **Tên UC** | Quản lý nhân sự Lễ tân / Kế toán |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Tồn tại nhân sự Lễ tân/Kế toán trong hệ thống. |
| **Hậu điều kiện** | Admin nắm được danh sách nhân sự (Mã NV, họ tên, email, SĐT, vai trò, ngày vào làm, trạng thái hoạt động) và thông tin công tác chi tiết (kèm số liệu công việc theo vai trò); trạng thái hoạt động của nhân sự có thể được đổi. |
| **Kịch bản chính** | 1\. Admin chọn mục "Quản lý nhân sự" (menu "Nhân sự"; tên trang quản lý Lễ tân và Kế toán) từ menu Admin. 2\. Hệ thống hiển thị danh sách nhân sự kèm bộ lọc vai trò (Tất cả vai trò / Lễ tân / Kế toán) và 3 tab trạng thái: Tất cả / Đang hoạt động / Ngưng hoạt động, thanh tìm kiếm (tên, email, SĐT, mã NV) và nút "Thêm nhân sự". 3\. Admin bấm nút xem chi tiết của 1 nhân viên. 4\. Hệ thống hiển thị modal chi tiết: Họ tên, Mã NV, Email, Số điện thoại, Vai trò (Lễ tân / Kế toán), Ngày vào làm, Trạng thái hoạt động, kèm số liệu công việc theo vai trò (Lễ tân: lớp đã xử lý, khiếu nại đã tiếp nhận, khoản phí đã duyệt; Kế toán: khoản phí đã duyệt, hoàn tiền đã xử lý) cùng ô đổi trạng thái và nút Đóng. 5\. Admin đổi trạng thái hoạt động (Đang hoạt động ↔ Ngưng hoạt động) tại ô chọn trong modal và bấm "Lưu thay đổi" (API chỉ cho phép đổi trạng thái, không chỉnh sửa các trường khác — tài khoản "Ngưng hoạt động" bị khóa quyền đăng nhập). 6\. Hệ thống hiển thị xác nhận: "Bạn có chắc chắn muốn thay đổi trạng thái của nhân sự này không?" và 2 nút Đồng ý / Hủy. 7\. Admin ấn nút Đồng ý. 8\. Hệ thống hiển thị thông báo "Đã lưu thông tin nhân sự." và cập nhật lại danh sách. |
| **Ngoại lệ** | 7.1. Admin bấm nút Hủy. 7.1.1. Hệ thống giữ nguyên trạng thái cũ và quay lại modal chi tiết nhân sự. |

## **UC-ADM-12: Thêm mới nhân sự**

| Mã UC | UC-ADM-12 |
| :---- | :---- |
| **Tên UC** | Thêm mới nhân sự Lễ tân / Kế toán |
| **Actor** | Admin |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Trung tâm có nhu cầu cấp tài khoản làm việc cho nhân viên mới |
| **Hậu điều kiện** | Tài khoản nhân sự mới được tạo trong hệ thống (role: RECEPTIONIST — Lễ tân, hoặc ACCOUNTANT — Kế toán) có thể đăng nhập làm việc; nhân sự mới ở trạng thái "Đang hoạt động". |
| **Kịch bản chính** | 1\. Admin truy cập trang "Quản lý nhân sự". 2\. Hệ thống hiển thị danh sách nhân sự và nút "Thêm nhân sự". 3\. Admin bấm nút "Thêm nhân sự". 4\. Hệ thống hiển thị modal thêm mới gồm các trường: Vai trò (Lễ tân / Kế toán, bắt buộc), Họ và tên, Email làm việc, Số điện thoại, Ngày vào làm (để trống hệ thống lấy ngày hôm nay) và 2 nút "Tạo tài khoản", "Hủy bỏ"; kèm ghi chú hệ thống tự sinh Mã nhân viên (NV-xxxx), tên đăng nhập (lt_/kt_ theo SĐT) và mật khẩu mặc định. 5\. Admin chọn vai trò và nhập đầy đủ thông tin nhân viên, bấm "Tạo tài khoản". 6\. Hệ thống hiển thị modal bàn giao thông tin đăng nhập (tài khoản, mật khẩu mặc định — nhân viên bắt buộc đổi mật khẩu lần đầu) và ghi Audit Log. |
| **Ngoại lệ** | 5.1. Admin để trống Họ tên hoặc Email. 5.1.1. Hệ thống hiển thị cảnh báo (vui lòng nhập họ và tên / email đúng định dạng) và không cho phép tạo. 5.2. Admin bấm nút "Hủy bỏ" tại modal thêm mới. 5.2.1. Hệ thống đóng modal và không lưu dữ liệu. 5.3. Email hoặc Số điện thoại đã trùng với tài khoản khác trong hệ thống. 5.3.1. Hệ thống hiển thị thông báo lỗi "Email hoặc Số điện thoại đã được đăng ký trong hệ thống". |

## **UC-ADM-13: Tạo đơn khiếu nại**

> **Ghi chú phạm vi (v1.2):** Tính năng khiếu nại đã được loại khỏi phạm vi triển khai (WBS 6.1, commit 1624a9f) nhưng module backend và trang Admin/Lễ tân giữ nguyên trong codebase — UC này mô tả chức năng hiện có trong mã nguồn, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-ADM-13 |
| :---- | :---- |
| **Tên UC** | Tạo đơn khiếu nại (khiếu nại tại quầy — API cho phép cả Lễ tân và Admin) |
| **Actor** | Admin (hoặc Lễ tân) |
| **Tiền điều kiện** | 1\. Admin (hoặc Lễ tân) đã đăng nhập hệ thống. 2\. Phụ huynh / gia sư có yêu cầu khiếu nại tại quầy |
| **Hậu điều kiện** | Khiếu nại ở trạng thái "Chờ xử lý" (PENDING), lưu nội dung cần xử lý, người tạo đơn và thời điểm tạo đơn; người khiếu nại được gắn vai trò (mặc định "Phụ huynh"). Trạng thái lớp cần gia sư và lớp học chưa thay đổi. |
| **Kịch bản chính** | 1\. Admin (hoặc Lễ tân) truy cập trang "Xử lý khiếu nại". 2\. Hệ thống hiển thị danh sách các khiếu nại chia thành 4 tab: "Chờ xử lý", "Chờ hoàn tiền", "Đã xử lý", "Đã hủy" và nút "Tạo đơn". 3\. Admin bấm nút "Tạo đơn" để tạo khiếu nại mới. 4\. Hệ thống hiển thị modal đơn khiếu nại gồm: Họ tên người khiếu nại, SĐT, Vai trò (complainantRole — mặc định "Phụ huynh" theo ROLE_LABEL, có thể chuyển "Gia sư"), Loại khiếu nại (Hoàn tiền, Không hoàn tiền), lớp cần gia sư bị khiếu nại (tìm theo mã lớp hoặc tên học sinh, SĐT phụ huynh) và Lí do khiếu nại; 2 nút "Tạo khiếu nại", "Hủy". Nếu chọn Hoàn tiền: chỉ chọn được lớp Online đã có lớp học. Nếu chọn Không hoàn tiền: chọn được lớp ở mọi trạng thái trừ Đã hủy; lớp Ghép thành công hiển thị số ngày còn được khiếu nại (quá 7 ngày thì chặn). 5\. Admin nhập thông tin và ấn "Tạo khiếu nại". 6\. Hệ thống hiển thị thông báo đã tạo khiếu nại thành công, đơn ở trạng thái "Chờ xử lý". |
| **Ngoại lệ** | 4.1. Lớp đã ghép thành công quá 7 ngày: hệ thống chặn (COMPLAINT_WINDOW_EXPIRED) — "Lớp đã ghép thành công quá 7 ngày, không thể tiếp nhận khiếu nại hủy lớp hoặc ghép lại." 5.1. Admin bấm nút Hủy. 5.1.1. Hệ thống hiển thị thông báo "Bạn xác nhận hủy đi đơn khiếu nại này chứ?" và 2 nút Đồng ý, Hủy. 5.1.1.1. Admin bấm Đồng ý: hệ thống quay trở lại danh sách khiếu nại. 5.1.1.2. Admin bấm Hủy: hệ thống quay trở lại modal đơn khiếu nại. |

## **UC-ADM-14: Xem, sửa các đơn khiếu nại**

> **Ghi chú phạm vi (v1.2):** Tính năng khiếu nại đã được loại khỏi phạm vi triển khai (WBS 6.1, commit 1624a9f) nhưng module backend và trang Admin/Lễ tân giữ nguyên trong codebase — UC này mô tả chức năng hiện có trong mã nguồn, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-ADM-14 |
| :---- | :---- |
| **Tên UC** | Xem, sửa các đơn khiếu nại |
| **Actor** | Admin (hoặc Lễ tân) |
| **Tiền điều kiện** | 1\. Admin (hoặc Lễ tân) đã đăng nhập hệ thống. 2\. Tồn tại khiếu nại được tiếp nhận tại quầy |
| **Hậu điều kiện** | 1\. Admin nắm được toàn bộ chi tiết đơn khiếu nại. 2\. Khi đơn còn "Chờ xử lý", có thể sửa thông tin người khiếu nại và nội dung; loại khiếu nại, lớp bị khiếu nại và trạng thái đơn không đổi qua thao tác sửa (chỉ đổi qua giải quyết/hủy). |
| **Kịch bản chính** | 1\. Admin chọn mục "Xử lý khiếu nại" từ menu Admin. 2\. Hệ thống hiển thị danh sách các khiếu nại chia thành 4 tab: "Chờ xử lý", "Chờ hoàn tiền", "Đã xử lý", "Đã hủy" và nút "Tạo đơn". 3\. Admin bấm nút "Xem chi tiết" ở một đơn khiếu nại. 4\. Hệ thống hiển thị modal chi tiết gồm: Mã đơn, loại khiếu nại, lớp cần gia sư bị khiếu nại, mục "Người khiếu nại" (họ tên, vai trò — hiển thị theo ROLE_LABEL, SĐT), nội dung chi tiết, ngày giờ tiếp nhận; với khiếu nại hoàn tiền: mục "Yêu cầu hoàn tiền gần nhất" (số đề xuất, số đã hoàn, tài khoản nhận, trạng thái, lý do từ chối nếu Kế toán từ chối, biên lai) và các khoản phí có thể hoàn; mục "Kết quả xử lý" nếu đơn đã giải quyết. 5\. Khi đơn còn "Chờ xử lý", Admin bấm "Sửa": modal sửa (theo UC-ADM-13) cho chỉnh họ tên, SĐT, vai trò (Phụ huynh / Gia sư), nội dung; loại khiếu nại và lớp bị khiếu nại bị khóa (không đổi được sau khi tạo). 6\. Admin bấm "Lưu": hệ thống hiện xác nhận "Bạn có chắc muốn lưu thay đổi đơn khiếu nại này?" (Đồng ý/Hủy); sau đó xác nhận "Đã lưu thay đổi đơn khiếu nại", đơn giữ nguyên trạng thái "Chờ xử lý". Đơn "Chờ hoàn tiền", "Đã xử lý", "Đã hủy" chỉ xem. |
| **Ngoại lệ** | 2.1. Không có khiếu nại nào trong hệ thống: hệ thống hiển thị "Chưa có khiếu nại nào". 4a. Người khiếu nại rút yêu cầu khi đơn còn "Chờ xử lý". 4a.1. Admin bấm "Hủy khiếu nại". 4a.2. Hệ thống hiển thị thông báo xác nhận và 2 nút Đồng ý, Hủy. 4a.3. Admin bấm Đồng ý. 4a.4. Khiếu nại chuyển "Đã hủy" (CANCELLED), lớp cần gia sư và lớp học giữ nguyên trạng thái. 6.1. Khi đơn không còn "Chờ xử lý": các thao tác sửa/hủy/giải quyết không khả dụng (API trả 409 COMPLAINT_INVALID_STATE). |

## **UC-ADM-15: Xác nhận giải quyết khiếu nại**

> **Ghi chú phạm vi (v1.2):** Tính năng khiếu nại đã được loại khỏi phạm vi triển khai (WBS 6.1, commit 1624a9f) nhưng module backend và trang Admin/Lễ tân giữ nguyên trong codebase — UC này mô tả chức năng hiện có trong mã nguồn, không phải hạng mục bắt buộc hoàn thiện.

| Mã UC | UC-ADM-15 |
| :---- | :---- |
| **Tên UC** | Xác nhận giải quyết khiếu nại |
| **Actor** | Admin (hoặc Lễ tân — API giải quyết khiếu nại / gửi yêu cầu hoàn tiền cho phép cả RECEPTIONIST và ADMIN) |
| **Tiền điều kiện** | 1\. Admin đã đăng nhập hệ thống. 2\. Tồn tại khiếu nại ở trạng thái "Chờ xử lý". 3\. Với khiếu nại không hoàn tiền, Admin đã liên hệ bên còn lại (gia sư hoặc phụ huynh) để xác nhận yêu cầu |
| **Hậu điều kiện** | 1\. **Không hoàn tiền:** khiếu nại chuyển "Đã xử lý" (RESOLVED), lưu kết quả xử lý, kết quả với lớp (Hủy lớp hoặc Ghép lại), minh chứng, người xử lý và thời điểm giải quyết; lớp cần gia sư đổi trạng thái theo kết quả nếu chưa được xử lý trước đó. 2\. **Hoàn tiền:** khiếu nại chuyển "Chờ hoàn tiền" (PROCESSING), tạo yêu cầu hoàn tiền chờ Kế toán; trạng thái khiếu nại tự cập nhật khi Kế toán (hoặc Admin) xử lý (UC-ACC-04). |
| **Kịch bản chính: Không hoàn tiền** | 1\. Admin truy cập trang "Xử lý khiếu nại", chọn tab "Chờ xử lý". 2\. Hệ thống hiển thị danh sách các khiếu nại cần giải quyết. 3\. Admin liên hệ bên còn lại để xác nhận yêu cầu (thao tác ngoài hệ thống). 4\. Admin bấm nút "Giải quyết" tại khiếu nại tương ứng. 5\. Hệ thống hiển thị modal giải quyết gồm thông tin đơn, thông tin lớp cần gia sư bị khiếu nại (trạng thái hiện tại, gia sư, số ngày còn được xử lý nếu đã ghép thành công), ô "Kết quả với lớp" gồm "Hủy lớp" và "Ghép lại", ô nhập "Kết quả xử lý & Ghi chú", "Đính kèm minh chứng" và 2 nút "Xác nhận", "Hủy". Lớp chưa có gia sư (Chờ xử lý, Đã đăng, Đang ghép lại) chỉ có "Hủy lớp" và được chọn sẵn. Lớp Đang dạy thử hoặc Ghép thành công bắt buộc chọn một trong hai. 6\. Admin nhập thông tin rồi bấm "Xác nhận". 7\. Hệ thống hiển thị popup xác nhận theo trường hợp, Admin bấm "Đồng ý". 8\. Hệ thống thực hiện chuỗi xử lý tự động: \- **Hủy lớp:** lớp cần gia sư và lớp đang học (nếu có) bị hủy, gia sư đang dạy bị loại. \- **Ghép lại:** lớp chuyển "Đang ghép lại" (REMATCH), lớp đang học bị hủy, gia sư cũ bị loại khỏi lớp. \- Khiếu nại chuyển "Đã xử lý", lưu thời gian giải quyết, gửi thông báo tới các bên và ghi Audit Log (RESOLVE\_COMPLAINT). |
| **Kịch bản thay thế: Xử lý thủ công** | 3a. Admin tự thao tác hủy hoặc ghép lại tại trang Lớp cần gia sư. 3a.1. Sau đó Admin quay lại khiếu nại, bấm "Giải quyết", chọn kết quả tương ứng và nhập kết quả xử lý. 3a.2. Hệ thống nhận ra lớp đã được xử lý, hiển thị nhãn "Đã xử lý thủ công" và yêu cầu đính kèm minh chứng đã xử lý (bắt buộc ít nhất 1 tệp). 3a.3. Admin đính kèm minh chứng và xác nhận. Hệ thống chỉ đóng khiếu nại, không thao tác lại trên lớp và không gửi lại thông báo. |
| **Kịch bản chính: Hoàn tiền** | 1\. Lễ tân (hoặc Admin) thống nhất số tiền hoàn đề xuất và tài khoản nhận với người khiếu nại. 2\. Bấm nút "Gửi yêu cầu hoàn tiền" tại khiếu nại tương ứng. 3\. Hệ thống hiển thị modal gồm các khoản phí đã được xác nhận của lớp (kèm số tiền còn có thể hoàn), ô nhập "Số tiền đề xuất hoàn" (không vượt số còn có thể hoàn), tên chủ tài khoản, ngân hàng, số tài khoản. 4\. Nhập thông tin và bấm "Gửi". 5\. Hệ thống tạo yêu cầu hoàn tiền, chuyển khiếu nại sang "Chờ hoàn tiền", thông báo cho Kế toán và ghi Audit Log (REQUEST\_REFUND). 6\. Kế toán (hoặc Admin) xử lý theo UC-ACC-04 / UC-ADM-18. Khi hoàn tiền được xác nhận, khiếu nại tự chuyển "Đã xử lý"; khi bị từ chối, khiếu nại quay về "Chờ xử lý" kèm lý do để xử lý lại. |
| **Ngoại lệ** | 6.1. Admin để trống ô "Kết quả xử lý". 6.1.1. Hệ thống hiển thị cảnh báo "Vui lòng nhập kết quả xử lý." và không cho phép xác nhận. 6.2. Admin chưa chọn ô "Kết quả với lớp" khi lớp đang dạy thử hoặc ghép thành công. 6.2.1. Hệ thống hiển thị cảnh báo "Vui lòng chọn Hủy lớp hoặc Ghép lại." 6.3. Lớp chưa có gia sư. 6.3.1. Hệ thống không cho chọn "Ghép lại". 6.4. Lớp đã được xử lý thủ công nhưng chưa có minh chứng. 6.4.1. Hệ thống hiển thị cảnh báo "Lớp đã được xử lý trước đó. Vui lòng đính kèm minh chứng đã xử lý." 6.5. Lớp đã ghép thành công quá 7 ngày và chưa được xử lý. 6.5.1. Hệ thống báo "Lớp đã ghép thành công quá 7 ngày, không thể hủy lớp hoặc ghép lại.", Admin hủy khiếu nại và giải thích với người khiếu nại. 8.1. Lớp không còn ở trạng thái có thể xử lý. 8.1.1. Hệ thống báo lỗi và không thay đổi dữ liệu. 4.1 (Hoàn tiền). Số tiền đề xuất vượt số tiền còn có thể hoàn. 4.1.1. Hệ thống báo lỗi và không cho gửi. 5.1. Admin bấm "Hủy" hoặc icon "X" tại modal. 5.1.1. Hệ thống đóng modal và giữ nguyên trạng thái "Chờ xử lý". |

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
| **Actor** | Admin (trang dùng chung với Kế toán — /admin/payments và /accountant/payments, nút "Chỉnh tỷ lệ" chỉ hiện với Admin) |
| **Tiền điều kiện** | 1\. Admin (hoặc Kế toán) đã đăng nhập hệ thống. 2\. Tồn tại khoản phí ở trạng thái **"Chờ xác nhận"** (SUBMITTED), đã có ảnh minh chứng do Gia sư tải lên qua Cổng Gia sư hoặc do Lễ tân/Admin thu hộ tại quầy (tiền mặt hoặc chuyển khoản). |
| **Hậu điều kiện** | 1\. **Nếu số tiền thực nhận đủ (≥ số phải nộp)**: khoản phí chuyển APPROVED ("Đã xác nhận"); lưu số tiền thực nhận (received\_amount), người duyệt (reviewed\_by), thời điểm (reviewed\_at); thông báo người nộp; ghi audit\_logs (APPROVE\_PAYMENT). (Gia sư đã xem được SĐT phụ huynh từ khi ghép lớp thành công, không phụ thuộc bước xác nhận này.) 2\. **Nếu số tiền thực nhận nhỏ hơn số phải nộp**: hệ thống TỰ ĐỘNG chuyển khoản phí sang RESUBMIT\_REQUIRED ("Yêu cầu gửi lại") kèm lý do tự sinh ("Số tiền thực nhận [X] nhỏ hơn số tiền phải nộp [Y]"), ghi audit\_logs (REQUEST\_PAYMENT\_RESUBMIT). 3\. **Nếu yêu cầu nộp lại minh chứng nghi ngờ** (nhánh riêng): khoản phí chuyển RESUBMIT\_REQUIRED, lưu lý do do người đối chiếu tự nhập (reject\_reason); ghi audit\_logs (REQUEST\_PAYMENT\_RESUBMIT). |
| **Kịch bản chính** | 1\. Admin chọn tab **"Chờ xác nhận"** tại màn hình Đối chiếu phí nhận lớp. 2\. Hệ thống hiển thị danh sách các khoản phí chờ xác nhận; mỗi dòng có nút **"Đối chiếu"**. 3\. Admin bấm nút **"Đối chiếu"** tại một khoản phí cần xử lý. 4\. Hệ thống hiển thị modal **"Đối chiếu biên lai"** gồm: \- Ảnh biên lai (ảnh xem trực tiếp, PDF mở ở tab mới — công cụ phóng to/xoay ảnh chưa có trong UI hiện tại). \- Thông tin khoản: số tiền phải nộp, tỷ lệ phí (%), hình thức (Chuyển khoản / Tiền mặt), thời điểm nộp; số tiền thực nhận và lý do gửi lại (nếu khoản đã từng bị yêu cầu nộp lại). \- Ô nhập **"Số tiền thực nhận (₫)"** (mặc định gợi ý bằng số phải nộp) và 2 nút hành động: **"Xác nhận"** và **"Yêu cầu gửi lại"**, kèm nút **"Đóng"**. Nếu người đang xem là chính người đã tải/thu hộ minh chứng, hệ thống chặn (PAYMENT\_SAME\_ACTOR): hiện cảnh báo "Bạn là người đã nộp hoặc thu hộ biên lai này nên không thể tự xác nhận. Hãy nhờ người khác đối chiếu" và khóa các thao tác. 5\. Admin mở sao kê tài khoản ngân hàng của trung tâm (thao tác ngoài hệ thống), tra cứu biến động số dư theo mã giao dịch, thời gian và nội dung. 6\. **Trường hợp tiền đã vào tài khoản (đủ hoặc thiếu)**: Admin nhập số tiền thực tế ghi có vào ô "Số tiền thực nhận" và bấm **"Xác nhận"**. 7\. Hệ thống xử lý: \- Nếu số thực nhận ≥ số phải nộp: khoản chuyển **"Đã xác nhận"** (APPROVED), lưu số thực nhận, người duyệt, thời điểm; thông báo người nộp "Kế toán đã xác nhận khoản phí nhận lớp của lớp này."; ghi audit\_logs (APPROVE\_PAYMENT). \- Nếu số thực nhận < số phải nộp: hệ thống TỰ ĐỘNG chuyển khoản sang **"Yêu cầu gửi lại"** (RESUBMIT\_REQUIRED), tự sinh lý do "Số tiền thực nhận [X] nhỏ hơn số tiền phải nộp [Y]", thông báo người nộp "Yêu cầu nộp lại biên lai phí nhận lớp" kèm lý do; ghi audit\_logs (REQUEST\_PAYMENT\_RESUBMIT). \- Hệ thống thông báo kết quả ("Đã xác nhận phí nhận lớp." / "Số tiền thực nhận chưa đủ, đã yêu cầu gia sư nộp lại.") và quay lại danh sách. |
| **Luồng rẽ nhánh: Minh chứng nghi ngờ (Yêu cầu gửi lại)** | **5a. Admin phát hiện minh chứng có dấu hiệu nghi ngờ hoặc sai lệch** (nghi làm giả, ảnh mờ/mất góc, chưa có tiền về tài khoản, sai tài khoản thụ hưởng,...): 5a.1. Admin bấm nút **"Yêu cầu gửi lại"**. 5a.2. Hệ thống hiển thị ô nhập **"Lý do yêu cầu gửi lại"** (ô văn bản tự do, bắt buộc nhập — không có danh sách lý do mẫu/checklist; ví dụ: "Ảnh biên lai bị mờ, không đọc được nội dung chuyển khoản.") kèm nút **"Gửi yêu cầu"**. 5a.3. Admin nhập lý do cụ thể và bấm "Gửi yêu cầu". 5a.4. Hệ thống thực hiện: chuyển khoản sang RESUBMIT\_REQUIRED, lưu lý do vào reject\_reason, lưu người xử lý và thời điểm, thông báo người nộp kèm lý do, ghi audit\_logs (REQUEST\_PAYMENT\_RESUBMIT); hiển thị "Đã yêu cầu gia sư gửi lại biên lai." và quay lại danh sách. |
| **Ngoại lệ** | **6.1. Admin để trống ô "Số tiền thực nhận":** hệ thống chặn xác nhận ("Vui lòng nhập số tiền hợp lệ."). **5a.2.1. Admin để trống ô lý do khi yêu cầu gửi lại:** hệ thống không cho gửi (RESUBMIT\_REASON\_REQUIRED — "Vui lòng nhập lý do yêu cầu nộp lại"). **6.2. Người xem là chính người đã tải/thu hộ minh chứng (PAYMENT\_SAME\_ACTOR):** hệ thống không cho xác nhận hay yêu cầu gửi lại ("Người duyệt không được trùng với người nộp hoặc thu hộ minh chứng"), yêu cầu chuyển cho người khác đối chiếu. |

## **UC-ADM-18: Xử lý yêu cầu hoàn tiền**

> **Ghi chú phạm vi (v1.2):** Tính năng khiếu nại đã được loại khỏi phạm vi triển khai (WBS 6.1, commit 1624a9f) nhưng module backend và trang Admin/Lễ tân giữ nguyên trong codebase — UC này mô tả chức năng hiện có trong mã nguồn, không phải hạng mục bắt buộc hoàn thiện. **Actor chính là Kế toán** (trang "Hoàn tiền" dùng chung /accountant/refunds và /admin/refunds); mọi endpoint hoàn tiền (RefundController) cho phép cả ACCOUNTANT và ADMIN. UC này ghi nhận vai trò của Admin khi tham gia; kịch bản đầy đủ xem **UC-ACC-04**.

| Thuộc tính | Nội dung đặc tả |
| :---- | :---- |
| **Mã UC** | **UC-ADM-18** |
| **Tên UC** | **Xử lý yêu cầu hoàn tiền (do Kế toán thực hiện; Admin có cùng quyền)** |
| **Actor** | Kế toán (hoặc Admin) |
| **Tiền điều kiện** | 1\. Kế toán (hoặc Admin) đã đăng nhập hệ thống. 2\. Tồn tại ít nhất một yêu cầu hoàn tiền ở trạng thái **"Chờ xử lý"** (PENDING) do Lễ tân (hoặc Admin) lập từ một khiếu nại loại Hoàn tiền (complaint\_type \= REFUND). |
| **Hậu điều kiện** | 1\. **Nếu chấp thuận hoàn tiền**: Yêu cầu hoàn tiền chuyển sang PAID ("Đã hoàn tiền"); lưu số tiền hoàn thực tế, ảnh biên lai chuyển khoản hoàn tiền, người hoàn (processed\_by — Kế toán hoặc Admin), thời điểm (processed\_at); khiếu nại liên quan tự động chuyển sang RESOLVED ("Đã xử lý"); gửi thông báo tới người lập đề xuất (Lễ tân) và người khiếu nại; ghi audit\_logs (PAY\_REFUND). 2\. **Nếu từ chối hoàn tiền**: Yêu cầu hoàn tiền chuyển sang REJECTED ("Đã từ chối") kèm lý do; nếu khiếu nại đang ở "Chờ hoàn tiền" (PROCESSING) thì quay về PENDING ("Chờ xử lý"); gửi thông báo kèm lý do cho Lễ tân tiếp nhận để xử lý lại với khách hàng; ghi audit\_logs (REJECT\_REFUND). |
| **Kịch bản chính** | 1\. Kế toán (hoặc Admin) chọn mục **"Hoàn tiền"** từ thanh điều hướng. 2\. Hệ thống hiển thị danh sách các yêu cầu hoàn tiền được chia 3 tab: \- Tab 1: **Chờ xử lý** (PENDING) \- Tab 2: **Đã hoàn tiền** (PAID) \- Tab 3: **Đã từ chối** (REJECTED) \- Mỗi dòng hiển thị: Mã khiếu nại, mã yêu cầu hoàn tiền, Người khiếu nại (kèm tên học sinh nếu có), Số tiền (đề xuất, hoặc số đã hoàn khi yêu cầu ở trạng thái Đã hoàn tiền), Lễ tân đề xuất, Ngày tạo và Trạng thái. 3\. Kế toán (hoặc Admin) bấm vào 1 dòng ở tab "Chờ xử lý" để mở modal xử lý. 4\. Hệ thống hiển thị modal **"Xử lý yêu cầu hoàn tiền"** gồm: \- Thông tin khiếu nại: Người khiếu nại, Học sinh, Lớp, nội dung khiếu nại ban đầu, số tiền Lễ tân đề xuất. \- Bảng đối soát tài chính của lớp (ô [A]/[B]/[A-B]): \+ Tổng số tiền trung tâm đã thực nhận từ khoản phí của lớp: \[A\]₫. \+ Tổng số tiền đã hoàn trong các lần trước (nếu có): \[B\]₫. \+ **Số tiền tối đa còn có thể hoàn**: \[A \- B\]₫. \- Thông tin tài khoản thụ hưởng: Chủ tài khoản, Ngân hàng, Số tài khoản (đang ở trạng thái chờ; nếu yêu cầu đã hoàn/đã từ chối thì hiển thị kết quả, biên lai, người xử lý, lý do từ chối). \- Ô nhập: **"Số tiền hoàn thực tế"** (mặc định gợi ý min(số Lễ tân đề xuất, số còn có thể hoàn); không vượt quá giới hạn) và khung tải tệp **"Biên lai chuyển khoản"** (JPG, PNG, PDF, tối đa 5 MB). \- Các nút hành động: **"Xác nhận đã hoàn tiền"**, **"Từ chối"**, **"Đóng"**. Người lập đề xuất (Lễ tân) không được tự xử lý yêu cầu của mình (REFUND\_SAME\_ACTOR) — hệ thống hiện cảnh báo "Bạn là người tạo yêu cầu này nên không được tự xử lý. Vui lòng chuyển cho Kế toán khác." 5\. Kế toán (hoặc Admin) thực hiện lệnh chuyển khoản hoàn tiền qua tài khoản ngân hàng của trung tâm (thao tác ngoài hệ thống) tới đúng số tài khoản thụ hưởng. Sau đó chụp/lưu lại ảnh biên lai chuyển khoản thành công, tải tệp lên khung đính kèm, kiểm tra số tiền hoàn thực tế và bấm **"Xác nhận đã hoàn tiền"**. 6\. Hệ thống hiển thị popup xác nhận: *"Xác nhận đã chuyển \[X\]₫ cho \[Tên chủ tài khoản\] (\[Ngân hàng\] \[Số TK\])? Khiếu nại sẽ chuyển sang Đã xử lý."* kèm 2 nút **Đồng ý** / **Hủy**. 7\. Kế toán (hoặc Admin) bấm **"Đồng ý"**. 8\. Hệ thống thực hiện chuỗi xử lý tự động: \- Lưu trạng thái yêu cầu hoàn tiền là PAID kèm số tiền hoàn, URL ảnh biên lai, người xử lý, thời điểm. \- Cập nhật khiếu nại tương ứng thành RESOLVED kèm kết quả tự động: *"Đã hoàn trả \[X\]₫ qua ngân hàng \[Tên NH\] ngày \[DD/MM/YYYY\] bởi Kế toán \[Họ tên\]."*. \- Gửi thông báo cho người lập đề xuất (Lễ tân) và người khiếu nại. \- Ghi nhật ký hệ thống: Action PAY\_REFUND, Entity REFUND. \- Hiển thị "Đã xác nhận hoàn tiền, khiếu nại chuyển sang Đã xử lý." và đóng modal. |
| **Luồng rẽ nhánh: Từ chối yêu cầu hoàn tiền** | **5a. Kế toán (hoặc Admin) phát hiện yêu cầu hoàn tiền không hợp lệ:** 5a.1. Kiểm tra và phát hiện một trong các lý do không thể duyệt hoàn tiền: Thông tin số tài khoản thụ hưởng bị sai/không chính chủ, khiếu nại chưa đủ căn cứ, phát hiện gian lận, số tiền vượt giới hạn,... 5a.2. Bấm nút **"Từ chối"**. 5a.3. Hệ thống hiện ô nhập "Lý do từ chối" (bắt buộc) kèm nút **"Xác nhận từ chối"**. 5a.4. Nhập lý do cụ thể và bấm "Xác nhận từ chối". 5a.5. Hệ thống cập nhật yêu cầu hoàn tiền thành REJECTED, nếu khiếu nại đang ở "Chờ hoàn tiền" (PROCESSING) thì chuyển về PENDING ("Chờ xử lý"), gửi thông báo kèm lý do tới người lập đề xuất (Lễ tân) để làm việc lại với khách hàng, ghi audit\_logs (REJECT\_REFUND), hiển thị "Đã từ chối yêu cầu, khiếu nại quay về Chờ xử lý." và quay lại danh sách. |
| **Ngoại lệ** | **5.1. Số tiền hoàn thực tế vượt quá giới hạn (min(số Lễ tân đề xuất, số còn có thể hoàn)):** 5.1.1. Hệ thống báo lỗi: *"Số tiền hoàn ([X]₫) vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: [Y]₫)."* hoặc *"Số tiền hoàn không được vượt số Lễ tân đề xuất ([Z]₫)."* và không cho xác nhận. **5.2. Chưa tải tệp biên lai chuyển khoản hoàn tiền:** 5.2.1. Hệ thống báo lỗi: "Vui lòng đính kèm ảnh biên lai chuyển khoản hoàn tiền trước khi xác nhận." và không cho tiếp tục. **5a.4.1. Để trống ô lý do từ chối:** 5a.4.1.1. Hệ thống báo lỗi: *"Vui lòng nhập lý do từ chối hoàn tiền để Lễ tân nắm được thông tin."* và không cho gửi. **7.1. Bấm "Hủy" tại popup xác nhận:** 7.1.1. Hệ thống đóng popup và giữ nguyên dữ liệu trong modal để rà soát lại. **5.3. Người lập đề xuất (Lễ tân) tự mở yêu cầu của mình:** hệ thống chặn (REFUND\_SAME\_ACTOR) — "Bạn là người tạo yêu cầu này nên không được tự xử lý. Vui lòng chuyển cho Kế toán khác." |

