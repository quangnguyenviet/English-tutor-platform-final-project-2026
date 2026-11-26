# Mô tả nghiệp vụ: Quản lý lớp có kết quả dạy thử không thành công

> **Trạng thái tài liệu:** Bản nháp để brainstorming nghiệp vụ — chưa phải kế hoạch thiết kế hoặc kế hoạch code.
>
> Tài liệu này mở rộng nghiệp vụ trong [trial_report.md](../trial_report.md). Mục tiêu hiện tại là làm rõ cách admin/lễ tân tiếp nhận và xử lý các lớp mà gia sư báo kết quả dạy thử **Không thành công**.
>
> **Ghi chú bản viết lại (v2):** Cô đọng từ bản gốc — gộp các đoạn trùng lặp, mỗi quy tắc nghiệp vụ chỉ được giải thích đầy đủ tại một nơi (mục 3), và tách riêng các nội dung chưa thống nhất (mục 6) để tiếp tục brainstorming. Toàn bộ nghiệp vụ và quyết định đã chốt được giữ nguyên; bản này chỉ sắp xếp lại, không thay đổi hay bổ sung nghiệp vụ mới.

## 1. Bối cảnh & mục tiêu

Sau buổi dạy thử, gia sư gửi báo cáo:

- **Thành công:** lớp được kích hoạt tự động sang `ACTIVE`.
- **Không thành công:** gia sư bắt buộc nhập lý do; lớp chuyển `TRIAL` → `TRIAL_FAIL` để phía vận hành xử lý.

**Hiện trạng dự kiến:** lưu báo cáo thất bại → thông báo cho admin/lễ tân → hiển thị lý do trong chi tiết yêu cầu lớp → sau khi xác minh, chuyển việc sang trạng thái đã xử lý. Với lớp có `class_requests`, dùng **Ghép lại** như nút tiện ích để mở lại yêu cầu (nếu phụ huynh vẫn muốn tìm gia sư mới); không có request thì không dùng nút này.

**Khoảng trống cần làm rõ:** thông báo không nên là nơi duy nhất để theo dõi công việc. Admin/lễ tân cần một nơi tập trung (hàng đợi) để xem các lớp đang chờ xử lý, lớp nào mới phát sinh, lớp nào đã xử lý và ai đang phụ trách.

**Mục tiêu:**

- Không bỏ sót lớp có báo cáo dạy thử thất bại.
- Cho phép xem nhanh lý do thất bại và thông tin liên quan.
- Tái sử dụng thao tác **Ghép lại** khi lớp có `class_requests`; với lớp không có request, chuyển trạng thái sang **Đã xử lý** sau khi xác minh.
- Phân biệt lịch sử báo cáo của gia sư với trạng thái xử lý của vận hành.
- Mỗi lớp dạy thử chỉ có một báo cáo kết quả chính thức; không cho gia sư báo lại trên cùng lớp.
- Tránh hai nhân sự cùng xử lý một lớp theo cách gây sai lệch trạng thái.

## 2. Khái niệm & trạng thái

### 2.1. Báo cáo dạy thử vs việc xử lý

- **Báo cáo dạy thử** trả lời: buổi dạy thử có kết quả gì, lý do là gì, ai báo cáo, báo lúc nào.
- **Việc xử lý** trả lời: phía vận hành đã tiếp nhận/chưa, ai đang xử lý, kết quả xử lý là gì.

Mỗi báo cáo `FAILED` tạo một việc trong hàng đợi của admin/lễ tân. Vì lớp chuyển sang `TRIAL_FAIL` và không được báo lại, không cần khái niệm "báo cáo FAILED mới nhất" trên cùng một lớp. Không nên suy ra việc còn mở chỉ từ `trial_reports.outcome = 'FAILED'`, vì một báo cáo thất bại có thể đã được xử lý (ghép lại hoặc hủy lớp).

### 2.2. Kết quả báo cáo (`trial_reports.outcome`)

- `SUCCESS` — buổi dạy thử thành công.
- `FAILED` — buổi dạy thử không thành công; lớp chuyển sang `TRIAL_FAIL` và bị khóa báo cáo.

### 2.3. Trạng thái việc vận hành

- `PENDING` — chưa có admin/lễ tân bắt đầu xử lý.
- `IN_PROGRESS` — đang được một admin/lễ tân kiểm tra và xử lý; chỉ phản ánh tiến độ, không phụ thuộc cơ chế phân công hay tiếp quản.
- `RESOLVED` — đã hoàn tất việc kiểm tra và xử lý.

Nhân viên được phép chuyển việc trực tiếp sang bất kỳ trạng thái nào trong ba trạng thái trên bằng danh sách chọn trạng thái. Khi chuyển sang `RESOLVED`, hệ thống lưu người xử lý và thời điểm. Trạng thái việc và người phụ trách là hai thứ tách rời (xem 3.4). Admin và lễ tân có quyền xem, bắt đầu và hoàn tất giống nhau (xem 3.11).

## 3. Quy tắc nghiệp vụ (đã chốt)

Mỗi quy tắc dưới đây chỉ được giải thích đầy đủ tại đây; các mục khác chỉ dẫn về đây.

### 3.1. Báo cáo một lần

Mỗi lớp `TRIAL` chỉ nhận **một** báo cáo chính thức từ gia sư hiện tại; lớp bị khóa báo cáo ngay sau báo cáo đầu tiên.

- Lớp `TRIAL` chưa có báo cáo: gia sư có thể gửi `SUCCESS` hoặc `FAILED`.
- Gửi `SUCCESS`: lớp kích hoạt `ACTIVE`, không gửi thêm được.
- Gửi `FAILED`: lớp chuyển `TRIAL_FAIL`, tạo việc `PENDING`, không gửi thêm được.
- Không chuyển lớp `TRIAL_FAIL` trở lại `TRIAL` để báo cáo lại.
- Thao tác ghi báo cáo + chuyển trạng thái lớp phải **nguyên tử** để tránh hai báo cáo (hoặc báo cáo + khóa) ghi đè khi bấm gần trùng nhau.

### 3.2. Báo cáo thành công

Lớp chuyển `TRIAL` → `ACTIVE` tự động; không sinh việc vận hành.

### 3.3. Báo cáo thất bại

- Gia sư nhập lý do bắt buộc.
- Lớp chuyển `TRIAL` → `TRIAL_FAIL`, báo cáo bị khóa.
- Hệ thống tạo một việc `PENDING` trong hàng đợi và gửi thông báo cho admin/lễ tân phù hợp.
- Việc xử lý sau thuộc vận hành (xem 3.4–3.7).

### 3.4. Gán cho mình — tách khỏi trạng thái

Gán report cho mình (đặt người phụ trách) là thao tác **độc lập**, không tự động chuyển trạng thái (không ép `PENDING` → `IN_PROGRESS`). Khi lễ tân nhận việc, họ gán report cho chính mình để chịu trách nhiệm xử lý.

- Hai nhân sự cùng gán một report `PENDING`: người bấm **Gán cho mình** trước thì report được gán với người đó; người vào sau thấy đã có người gán thì không gán nữa.

### 3.5. Ghép lại (chỉ khi lớp có `class_requests`)

Áp dụng cho lớp được tạo từ `class_requests` (yêu cầu tìm gia sư), sau khi lễ tân xác minh phù hợp:

- **Không** khôi phục/sửa lớp `TRIAL_FAIL` cũ thành một lớp trial mới.
- Đưa `class_requests` liên quan về trạng thái mở để các gia sư tiếp tục ứng tuyển theo luồng hiện hành.
- Khi một gia sư mới được ghép thành công, hệ thống tạo một `classes` mới (vòng đời trial độc lập, nhận một báo cáo riêng).
- Lớp cũ `TRIAL_FAIL` và báo cáo thất bại cũ được giữ làm lịch sử, gắn với lớp cũ, không ảnh hưởng lớp mới.

Thao tác **Ghép lại** chỉ mở lại `class_requests`, không thay đổi trạng thái report (idempotent). Hai nhân sự cùng bấm **Ghép lại** không gây xung đột.

### 3.6. Lớp không có `class_requests`

Lớp do phụ huynh tự chọn gia sư qua chat thông thường, không có `class_requests`:

- **Không** có thao tác **Ghép lại** phía admin/lễ tân.
- Nếu phụ huynh vẫn có nhu cầu, tự lên website tìm gia sư mới.
- **Không** gửi thông báo hay yêu cầu xác nhận nào cho phụ huynh sau khi lễ tân đánh dấu đã xử lý.

### 3.7. Chuyển trạng thái việc (dropdown 3 trạng thái)

Lễ tân/admin chuyển trạng thái việc bằng danh sách chọn (dropdown): có thể đưa việc về bất kỳ trạng thái nào trong `PENDING`, `IN_PROGRESS`, `RESOLVED` — kể cả mở lại việc đã `RESOLVED`.

- Khi chuyển **vào** `RESOLVED`: hệ thống lưu người xử lý (người thao tác) và thời điểm xử lý.
- Khi chuyển **khỏi** `RESOLVED` (mở lại): xóa người xử lý và thời điểm đã xử lý.
- Không thay đổi lớp cũ.
- Độc lập — không phụ thuộc việc lớp có `class_requests`, có ghép lại, hay đã tạo `classes` mới. Có thể chuyển trạng thái dù request đã mở lại, chưa ghép gia sư mới, hoặc chưa tạo `classes` mới.
- Là cách duy nhất chuyển trạng thái việc; gán người phụ trách (3.4, 3.8) không thay đổi trạng thái.

### 3.8. Điều phối việc đang `IN_PROGRESS`

Khi admin/lễ tân nghỉ hoặc đổi ca:

- Người quản lý có thể chủ động **bỏ gán (unassign)** hoặc **gán sang** một admin/lễ tân khác để tiếp tục xử lý.
- Nhân sự khác có thể tự **gán cho mình** rồi tiếp tục; hoặc xử lý luôn mà không cần gán lại vì `IN_PROGRESS` không khóa report.
- Mọi thao tác chỉ thay đổi trường người phụ trách, không thay đổi trạng thái việc (vẫn `IN_PROGRESS`). Không cần cơ chế tiếp quản hay mở lại riêng.

### 3.9. Xác minh với phụ huynh

Lễ tân gọi điện cho phụ huynh để kiểm tra thông tin và đánh giá tính trung thực của báo cáo từ gia sư. Với lớp không có `class_requests`, sau khi gọi xác minh, lễ tân chỉ cần đánh dấu đã xử lý; không gửi thông báo hay yêu cầu xác nhận nào cho phụ huynh (xem 3.6).

### 3.10. Lịch sử thao tác

Hệ thống ghi nhận lịch sử thao tác của admin/lễ tân trên report. Các thao tác được ghi: gán cho mình, bỏ gán, gán sang người khác, ghép lại (mở lại `class_requests`), chuyển trạng thái việc (kể cả sang và khỏi `RESOLVED`). Mỗi dòng gồm: người thực hiện, thao tác, thời điểm.

Lịch sử chỉ để tra cứu/tham chiếu; nguồn sự thật của trạng thái việc và người phụ trách vẫn là các trường tương ứng trên report, không suy ra từ lịch sử.

### 3.11. Quyền & vai trò

- Lễ tân được xem và xử lý toàn bộ report trong hàng đợi vận hành.
- Admin có quyền giống lễ tân: xem và xử lý toàn bộ report, không chỉ giám sát.
- Admin và lễ tân cùng được: chuyển trạng thái việc qua dropdown (kể cả mở lại việc đã xử lý) — không có giới hạn riêng.
- Không giới hạn quyền theo chi nhánh/nhóm phụ trách trong phạm vi hiện tại.
- Gia sư chỉ tạo report và được xác nhận đã báo cáo; **không** xem tiến độ/kết quả xử lý vận hành của report đó, không truy cập hàng đợi vận hành. Hệ thống **không** gửi thông báo trạng thái xử lý cho gia sư (ví dụ "đã tiếp nhận", "đã xử lý").

### 3.12. Kênh thông báo & nơi quản lý

- **Menu "Quản lý lớp học"** là nơi theo dõi chính các `classes`, gồm các menu con **Lớp dạy thử**, **Lớp chính thức** và **Dạy thử thất bại cần xử lý**.
- **Notification** là kênh nhắc việc khi có báo cáo mới; không yêu cầu admin/lễ tân phải tìm trong danh sách thông báo mới biết có lớp cần xử lý.
- Menu **"Lớp cần gia sư"** chỉ quản lý các `class_requests`, không quản lý các `classes`.

## 4. Luồng vận hành

### 4.1. Khi gia sư báo thất bại (3.3)

1. Gia sư gửi `FAILED` với lý do hợp lệ.
2. Hệ thống lưu báo cáo chính thức của lớp.
3. Lớp chuyển `TRIAL` → `TRIAL_FAIL`.
4. Tạo một việc `PENDING` trong hàng đợi; gia sư không gửi thêm báo cáo cho lớp này.
5. Gửi thông báo cho các admin/lễ tân phù hợp.

### 4.2. Khi admin/lễ tân xem danh sách (hàng đợi)

Hàng đợi nằm tại menu con **Dạy thử thất bại cần xử lý** trong "Quản lý lớp học" (xem mục 6, điểm 4). Nó tập trung các việc `PENDING` và `IN_PROGRESS`. Mặc định ưu tiên:

- báo cáo mới nhất lên trước;
- việc đã chờ lâu lên trước hoặc có dấu hiệu quá hạn;
- hiển thị rõ lớp vẫn còn `TRIAL` hay đã thay đổi trạng thái.

Mỗi mục tối thiểu: học viên; lớp/yêu cầu liên quan; gia sư vừa dạy thử; thời gian ca dạy thử; thời gian báo cáo; lý do thất bại; trạng thái xử lý; người đang phụ trách (nếu có); thao tác **Xem chi tiết**, **Ghép lại** (nếu lớp có `class_requests`), **Chuyển trạng thái bằng dropdown** (không phụ thuộc `class_requests`). Hỗ trợ lọc theo **trạng thái xử lý** và **người phụ trách**; không cần các bộ lọc khác trong phạm vi hiện tại.

### 4.3. Khi admin/lễ tân xử lý

Mở chi tiết lớp `TRIAL_FAIL`, xem lý do thất bại, xác minh với phụ huynh (3.9), sau đó dùng một trong các hướng hiện có:

- **Ghép lại** (3.5) — nếu lớp có `class_requests`.
- Lớp không có `class_requests` (3.6) — phụ huynh tự tìm gia sư mới nếu còn nhu cầu.
- Chuyển trạng thái bằng dropdown (3.7) — chọn `PENDING`, `IN_PROGRESS` hoặc `RESOLVED`; thao tác luôn có, không phụ thuộc `class_requests`.

Khi chuyển sang `RESOLVED`, hệ thống ghi nhận người thực hiện và thời điểm. Khi chuyển về trạng thái khác, xóa thông tin xử lý RESOLVED.

## 5. Tình huống biên (đã phân tích)

Mỗi tình huống nêu ngắn kết luận; quy tắc điều hành nằm tại mục 3.

1. **Hai lễ tân cùng mở và cùng bấm Ghép lại** (3.5): không cần khóa — thao tác chỉ mở lại `class_requests` (idempotent), không đổi trạng thái report. Chỉ thao tác chuyển trạng thái qua dropdown (3.7) mới chuyển `RESOLVED`.
2. **Hai lễ tân cùng gán một report `PENDING`** (3.4): người bấm **Gán cho mình** trước thì được gán; người sau thấy đã gán thì không gán. Gán tách rời với trạng thái xử lý.
3. **Gia sư gửi SUCCESS gần như đồng thời với tiếp nhận report** (3.1): không phải xung đột — việc vận hành chỉ tạo với report `FAILED`; một lớp chỉ nhận đúng một báo cáo và khóa sau báo cáo đầu tiên nên SUCCESS và FAILED không thể cùng lúc. Đảm bảo thao tác ghi báo cáo + chuyển trạng thái lớp nguyên tử.
4. **Một người đang `IN_PROGRESS` nghỉ hoặc không hoàn tất** (3.8): không cần cơ chế tiếp quản/mở lại riêng; nhân sự khác gán lại cho mình rồi tiếp tục, hoặc xử lý luôn vì `IN_PROGRESS` không khóa report.
5. **Lớp đã ghép lại nhưng report FAILED cũ vẫn hiện trong lịch sử** (3.5): không xung đột — ghép lại tạo `classes` mới; report FAILED + lớp `TRIAL_FAIL` cũ giữ nguyên làm lịch sử, gắn với lớp cũ, không ảnh hưởng lớp mới.
6. **Report đã xác minh nhưng lễ tân chưa thực hiện thao tác cuối** (3.7): không có vấn đề — report vẫn ở `PENDING`/`IN_PROGRESS`; khi quay lại chỉ cần chọn `RESOLVED` trên dropdown.
7. **Gia sư gửi lý do mới ngắn hơn/khác hẳn** (3.1): không xảy ra trên lớp cũ (mỗi lớp một báo cáo, khóa sau đó). "Lý do mới" chỉ thuộc lớp mới tạo sau ghép lại — là báo cáo độc lập, không ghi đè.
8. **Người xử lý mở chi tiết rồi không hoàn tất** (3.7): report vẫn nằm trong hàng đợi ở `PENDING`/`IN_PROGRESS`; nhân viên có thể chuyển lại trạng thái qua dropdown khi quay lại.
9. **Admin/lễ tân đổi ca khi việc đang `IN_PROGRESS`** (3.8): người quản lý chủ động bỏ gán hoặc gán sang; thao tác chỉ đổi trường người phụ trách, không đổi trạng thái việc.
10. **Hàng đợi có quá nhiều việc cũ chưa xử lý** — ưu tiên thấp: đã chốt không cần cơ chế riêng (SLA, cảnh báo quá hạn, phân bổ tự động) trong giai đoạn đầu; có thể bổ sung sau khi vận hành ổn định. (Quyết định tại mục 6, điểm 3.)

## 6. Quyết định đã chốt từ brainstorming

Các nội dung dưới đây đã được thảo luận và chốt, không hỏi lại:

1. **Không thông báo cho phụ huynh:** với lớp không có `class_requests`, sau khi lễ tân gọi xác minh và đánh dấu report đã xử lý, hệ thống không gửi thông báo hay yêu cầu xác nhận nào cho phụ huynh. Quy tắc chi tiết tại [mục 3.6](#36-lớp-không-có-class_requests) và [mục 3.9](#39-xác-minh-với-phụ-huynh).
2. **Không thông báo trạng thái cho gia sư:** hệ thống chỉ xác nhận cho gia sư rằng report đã được gửi; không thông báo việc lễ tân đã tiếp nhận, xác minh, ghép lại hoặc xử lý report. Quy tắc chi tiết tại [mục 3.11](#311-quyền--vai-trò).
3. **Không có SLA/quá hạn và không lọc theo tuổi việc:** giai đoạn đầu không cần cơ chế SLA, cảnh báo quá hạn hay bộ lọc theo tuổi việc; có thể bổ sung sau khi vận hành ổn định (xem tình huống biên số 10, mục 5).
4. **Vị trí hàng đợi & cấu trúc menu:** tách khỏi menu "Lớp cần gia sư" (trang này chỉ quản lý `class_requests`). Đặt trong menu **"Quản lý lớp học"** (quản lý `classes`), có 3 menu con:
   - **Lớp dạy thử** — các lớp đang ở trạng thái `TRIAL` (chưa có báo cáo kết quả).
   - **Lớp chính thức** — các lớp ở trạng thái `ACTIVE`.
   - **Dạy thử thất bại cần xử lý** — hàng đợi các report dạy thử thất bại cần xử lý (trang đã thống nhất ở các mục 3, 4.2).
   - **Phạm vi hiện tại:** chỉ làm 2 màn: chi tiết lớp dạy thử và **Dạy thử thất bại cần xử lý**; menu **Lớp chính thức** chỉ đặt tên trước, chưa xây dựng màn hình.
5. **Bộ lọc hàng đợi:** chỉ lọc theo **trạng thái** và **người xử lý**; không lọc theo thời gian báo cáo, thời gian chờ, loại lớp hay lý do thất bại.

## 7. Phạm vi tài liệu hiện tại

Tài liệu này **chưa** quyết định:

- thiết kế bảng dữ liệu;
- tên endpoint;
- thiết kế UI cụ thể;
- cách triển khai frontend/backend;
- migration hoặc test case chi tiết.

Sau khi nghiệp vụ được thống nhất, mới chuyển sang một kế hoạch thiết kế và triển khai riêng.
