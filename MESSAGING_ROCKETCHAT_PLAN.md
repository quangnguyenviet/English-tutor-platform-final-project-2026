# Kế hoạch triển khai Messaging Phụ huynh - Gia sư bằng Rocket.Chat

> Nhánh: `feature/msg-messaging`  
> Use case nguồn: `docs/Usecase/Usecase_Messaging_Parent_Tutor.md`  
> Prototype tham khảo: `prototypes/flow-a-messaging.html`  
> Phạm vi đúng: phòng chat **phụ huynh - gia sư**; học sinh được gắn vào từng đề xuất, không gắn vào phòng.

## 1. Mục tiêu và nguyên tắc kiến trúc

- Rocket.Chat chịu trách nhiệm lưu trữ, phân phối tin nhắn, lịch sử, unread và realtime.
- Spring Boot là cổng nghiệp vụ duy nhất: phân quyền, room mapping, đề xuất, Phone Gate, tạo đơn CHAT và audit.
- PostgreSQL là nguồn dữ liệu chuẩn cho proposal và các trạng thái nghiệp vụ.
- React dựng giao diện theo design system hiện tại; không dùng iframe Rocket.Chat làm giao diện sản phẩm.
- Không tạo bản sao toàn bộ tin nhắn trong PostgreSQL. Tin nhắn thường nằm ở Rocket.Chat/MongoDB.
- Mọi thao tác ghi nghiệp vụ quan trọng phải idempotent và có audit log.

## 1A. Luồng nghiệp vụ chốt (cập nhật 18/11/2026 — ưu tiên hơn usecase MSG khi mâu thuẫn)

Quy tắc chung: phụ huynh **phải đăng nhập Google** trước khi đăng tin lớp cần gia sư hoặc nhắn tin với gia sư.

**Luồng B — Đăng tin (POSTING):**
1. Phụ huynh tạo đơn → `class_requests` `NEW`, `source = POSTING` → Lễ tân duyệt tại mục “Lớp cần gia sư” (`NEW → OPEN` hoặc hủy có lý do).
2. Gia sư ứng tuyển → mỗi ứng viên là một `class_applications`.
3. Phụ huynh xem danh sách ứng viên, chọn 1 ứng viên để chat → tạo room Rocket.Chat gắn `parent_id` + `class_application_id` (lưu trong `customFields` của room; PostgreSQL `chat_rooms` là nguồn chuẩn).
4. Gia sư tạo **proposal** trong chat → phụ huynh duyệt → hệ thống tạo `classes` (trạng thái `TRIAL`) mang `class_request_id` **và** `proposal_id`.

**Luồng A — Nhắn tin trực tiếp:**
1. Phụ huynh nhắn gia sư không qua đơn → room gắn `parent_id` + `tutor_id`.
2. Gia sư tạo proposal → phụ huynh duyệt → tạo `classes` `TRIAL` mang `proposal_id`, **không có `class_request_id`** (không còn tạo đơn CHAT).

**Proposal gồm:** học sinh (con có sẵn hoặc học sinh mới), các thứ trong tuần, giờ bắt đầu/kết thúc mỗi buổi, giá 1 buổi, **buổi dạy thử** (ngày + giờ, gia sư đặt), loại lớp `SHORT_TERM` (1 tháng, phí 25%) hoặc `REGULAR` (không giới hạn, phí 35%). Tỷ lệ phí lưu trong bảng `platform_fee_policies` và được chụp vào proposal khi tạo.

**Parent portal:** xem các tin đã đăng + trạng thái, xem hồ sơ gia sư ứng tuyển, chat với từng ứng viên.

### Quyết định đã chốt

| # | Chủ đề | Quyết định |
|---|---|---|
| 1 | Phí | 25%/35% lưu ở bảng `platform_fee_policies`, chụp vào proposal → `classes.fee_percentage` → `payments.fee_percentage`; công thức `FeeCalculator` hiện hành giữ nguyên, chỉ đổi nguồn tỷ lệ (không còn 40% mặc định cho lớp từ chat) |
| 2 | Tài khoản học sinh | Tái dùng `ensureStudent` hiện có: học sinh = `users` (STUDENT) + `students` gắn `parent_id`, tìm theo (parent, họ tên), có thì dùng lại, chưa có thì tạo. Một học sinh học nhiều lớp (`classes.student_id` không duy nhất). Mật khẩu khởi tạo hiển thị cho phụ huynh một lần |
| 3 | Dạy thử | Proposal có trường `trial_date`, `trial_time_from/to` do gia sư đặt |
| 4 | Tin POSTING sau khi có lớp | `class_requests` → `MATCHED` (đóng tin); không thêm trạng thái mới; `REMATCH` giữ nguyên cho dạy thử thất bại |
| 5 | Room | Giữ 2 room riêng: `DIRECT` và `APPLICATION` |
| 6 | Lớp ngắn hạn | Hết hạn tự `COMPLETED` (job) |
| 7 | `requested_tutor_id` | Bỏ hẳn (xem đánh giá ở MSG-08) |

### Điểm lệch so với usecase cũ (usecase đã được viết lại theo bảng này)

| Chủ đề | Usecase cũ | Luồng chốt |
|---|---|---|
| Sau khi parent đồng ý proposal | Sinh đơn `CHAT`, Lễ tân xác nhận mới tạo lớp | Tạo thẳng `classes` TRIAL, **bỏ bước Lễ tân xác nhận** và nguồn `CHAT` |
| `class_requests.requested_tutor_id` | Dùng cho đơn CHAT/chỉ định | **Bỏ cột** |
| `classes.class_request_id` | NOT NULL | **Nullable**, thêm `proposal_id`; CHECK ít nhất một trong hai |
| Khóa room | `(parent, tutor)` | `DIRECT` theo `(parent, tutor)`; `APPLICATION` theo `class_application_id` |
| Phí | Cố định 40% | 25% / 35% theo loại lớp, đọc từ bảng cấu hình |
| Lớp ngắn hạn | Không có | Có `class_type`, tự `COMPLETED` sau 1 tháng |
| Điểm dừng Lễ tân | Duyệt tin + xác nhận đơn CHAT | Chỉ còn **duyệt tin POSTING** |

## 2. Phân chia công việc tổng thể

| Mã | Hạng mục | Phụ trách chính | Phụ thuộc | Kết quả đầu ra | Trạng thái |
|---|---|---|---|---|---|
| MSG-01 | Spike Rocket.Chat | Infra + Backend | Không | Compose profile, PII Guard app, smoke test REST/realtime | Hoàn tất |
| MSG-02 | Parent role và Google OAuth | Backend + Frontend | MSG-01 | Tài khoản PARENT Google-only, JWT và route parent | Hoàn tất |
| MSG-03 | Rocket.Chat account provisioning | Backend | MSG-01, MSG-02 | User mapping, token tạm, lifecycle đăng xuất | Hoàn tất |
| MSG-04 | Wizard và room mapping | Backend + Frontend | MSG-02, MSG-03 | Wizard 4 bước, room DIRECT (parent-tutor) và APPLICATION (parent-application), idempotent | Hoàn tất |
| MSG-05 | Chat text realtime | Backend + Frontend | MSG-04 | Lịch sử, gửi tin, unread, reconnect | Hoàn tất |
| MSG-06 | Kiểm duyệt PII hoàn chỉnh | Backend + Rocket.Chat App + Frontend | MSG-05 | Chặn PII hai tầng, highlight và audit | Hoàn tất |
| MSG-07 | Proposal, bảng phí và Phone Gate | Backend + Frontend | MSG-04, MSG-05 | Bảng cấu hình phí, proposal (học sinh, lịch, giá, loại lớp), accept/reject/withdraw, mở SĐT | Hoàn tất |
| MSG-08 | Accept proposal → tạo lớp TRIAL | Backend | MSG-07 | Refactor `classes`/`class_requests`, tạo lớp trực tiếp từ proposal, đồng bộ system message | Hoàn tất |
| MSG-09 | Đăng tin, duyệt và ứng tuyển | Backend + Frontend | MSG-02, MSG-04 | Luồng POSTING, Lễ tân duyệt, parent xem ứng viên và mở chat theo application | Hoàn tất |
| MSG-10 | Màn Lễ tân/Admin | Backend + Frontend | MSG-06, MSG-09 | Duyệt tin POSTING, transcript read-only, log PII, quản lý bảng phí | Hoàn tất |
| MSG-11 | Jobs và ngoại lệ | Backend | MSG-07, MSG-08 | Expire proposal, tự kết thúc lớp ngắn hạn, khóa room, reconciliation | Hoàn tất |
| MSG-12 | Kiểm thử và hardening | Cả nhóm | MSG-01..11 | Unit, integration, E2E, security, runbook | Hoàn tất |

## 3. Chi tiết từng task

### MSG-01 - Spike Rocket.Chat

Mục tiêu: chứng minh Rocket.Chat đáp ứng được chức năng messaging trước khi nối vào domain chính.

#### Infra

- [x] Pin Rocket.Chat `8.9.1` LTS và MongoDB `8.0`.
- [x] Thêm Compose profile `messaging` gồm MongoDB replica set, NATS và Rocket.Chat.
- [x] Dùng volume riêng; không dùng chung PostgreSQL hay MongoDB khác.
- [x] Rocket.Chat chạy tại `http://localhost:3001` để không xung đột frontend.
- [x] Tắt đăng ký tự do và file upload trong môi trường spike.
- [x] Thêm biến môi trường mẫu, không commit secret production.

#### PII Guard App

- [x] Tạo private Rocket.Chat App bằng TypeScript.
- [x] Implement `IPreMessageSentPrevent`.
- [x] Chặn số điện thoại Việt Nam, email và URL/social handle rõ ràng.
- [x] Không chặn chỉ vì câu có từ `zalo`/`facebook` nhưng không chứa thông tin liên hệ.
- [x] Có unit test cho detector độc lập.
- [x] Package được app thành ZIP để cài private app.

#### Smoke test

- [x] Chờ Rocket.Chat healthy.
- [x] Login admin bằng REST.
- [x] Tạo/reuse hai user spike: parent và tutor.
- [x] Tạo token tạm cho user bằng `users.createToken`.
- [x] Tạo/reuse DM parent-tutor.
- [x] Gửi tin hợp lệ và đọc lại lịch sử.
- [x] Subscribe `stream-room-messages` và nhận được tin realtime.
- [ ] Xác nhận tin PII bị chặn sau khi cài PII Guard App — bị chặn bởi giới hạn license Community; package và lệnh test E2E đã sẵn sàng cho Starter/premium.
- [x] Viết README/runbook chạy spike và cleanup.

Definition of Done:

- `docker compose --profile messaging config` hợp lệ.
- PII Guard App compile, test và package thành công.
- Smoke test REST/realtime chạy thành công với workspace local.
- Các giới hạn hoặc license blocker được ghi rõ trong báo cáo task.

Kết quả spike ngày 18/11/2026:

- Compose config hợp lệ; Rocket.Chat, MongoDB replica set và NATS chạy healthy.
- 13 unit test PII detector pass; private app compile và package thành công.
- Smoke REST/realtime pass: temporary token, DM, send/history và DDP `stream-room-messages`.
- Rocket.Chat 8.9 yêu cầu usage-report token còn hạn hoặc license hợp lệ; workspace air-gapped quá hạn sẽ trả `restricted-workspace` khi gửi tin.
- Private app không thể enable trên Community từ Rocket.Chat 7.0; quyết định kiến trúc và phương án thay thế nằm trong `docs/rocketchat-spike.md`.

### MSG-02 - Parent role và Google OAuth

#### Backend

- [x] Thêm `PARENT` vào enum, DB CHECK và JWT scope.
- [x] Thêm `parents.user_id UNIQUE NULL` để giữ tương thích dữ liệu cũ.
- [x] Tạo bảng `oauth_accounts`, unique `(provider, provider_user_id)`.
- [x] Hỗ trợ user OAuth không có mật khẩu đăng nhập local.
- [x] Tích hợp Google Authorization Code + PKCE.
- [x] Phát JWT nội bộ sau callback và hỗ trợ logout.
- [x] Không tự động chiếm tài khoản/hồ sơ cũ bằng email hoặc SĐT; hồ sơ SĐT cũ chỉ được xử lý ở wizard có bước xác minh.

#### Frontend

- [x] Thêm role route `/parent`.
- [x] Màn “Đăng nhập bằng Google” và redirect về URL ban đầu.
- [x] Khôi phục session parent khi refresh.

Kết quả MSG-02 ngày 18/11/2026:

- Migration V1→V23 chạy thành công trên PostgreSQL 16.
- Unit test pass cho PKCE authorization URL, redirect allowlist, tạo/reuse parent và chống chiếm email.
- Frontend lint/build pass; live Google E2E cần credentials trong `docs/google-parent-oauth.md`.

### MSG-03 - Rocket.Chat account provisioning

- [x] Tạo bảng `rocket_chat_accounts(user_id, rocket_user_id, rocket_username, provisioned_at)`.
- [x] Username ổn định theo internal user ID, không dùng email làm khóa.
- [x] Tạo `RocketChatClient` với timeout, retry có giới hạn và error mapping.
- [x] Provision lazy khi user mở messaging lần đầu.
- [x] Admin/service token chỉ tồn tại ở backend.
- [x] Token user là token tạm, được logout hoặc tái sử dụng an toàn để không chạm giới hạn token.

### MSG-04 - Wizard và room mapping

- [x] Thêm purpose, province, district vào hồ sơ parent.
- [x] Validate và normalize SĐT Việt Nam.
- [x] Wizard 4 bước: SĐT, họ tên, mục đích, khu vực (hiện lần đầu parent mở chat/đăng tin).
- [x] Tạo `chat_rooms` với `room_type`: `DIRECT` (parent-tutor) hoặc `APPLICATION` (parent-class_application).
- [x] Ràng buộc: `UNIQUE(class_application_id)` cho APPLICATION; partial unique `(parent_id, tutor_id)` WHERE `room_type = 'DIRECT'`; CHECK `room_type` khớp cột nào NOT NULL.
- [x] Room là private group Rocket.Chat gồm phụ huynh, gia sư và tài khoản hệ thống (Rocket.Chat mặc định tắt `customFields`, nên không dùng); `chat_rooms` trong PostgreSQL là nguồn chuẩn, job đối soát kiểm tra phòng còn tồn tại.
- [x] API tạo room idempotent, chỉ cho tutor `ACTIVE`; room APPLICATION chỉ mở được khi application thuộc tin của chính parent và ở trạng thái `APPLIED`.
- [x] Bắt buộc đăng nhập (JWT PARENT) cho mọi API tạo room và đăng tin.

### MSG-05 - Chat text realtime

- [x] API danh sách room và unread.
- [x] API lịch sử có cursor/pagination.
- [x] API gửi tin giới hạn 2.000 ký tự và 10 tin/phút.
- [x] Realtime chỉ dùng để nhận, qua kênh SSE của backend (`GET /api/v1/chat/stream`); mọi thao tác ghi đi bằng REST. Trình duyệt không nhận token Rocket.Chat nên không thể gọi thẳng Rocket.Chat để vượt kiểm duyệt.
- [x] Mark room read.
- [x] Tự kết nối lại SSE và kéo lịch sử bằng REST (catch-up) sau mất kết nối.
- [x] Không có upload, edit, delete, thread, reaction trong MVP.

### MSG-06 - Kiểm duyệt PII hoàn chỉnh

- [x] Dùng chung bộ fixture detector giữa backend và PII Guard App.
- [x] Backend pre-check trả loại vi phạm và span để frontend highlight.
- [x] Backend là cổng gửi tin duy nhất (Community không bật được private app): token Rocket.Chat chỉ tồn tại ở backend. PII Guard App vẫn được đóng gói và báo log chặn về backend qua endpoint nội bộ ký HMAC, sẵn sàng làm lớp chặn thứ hai nếu nâng cấp license.
- [x] Ghi `chat_pii_events` qua internal endpoint có HMAC/service authentication.
- [x] Lễ tân/Admin xem được log nhưng không tự động công khai lại tin bị chặn.

### MSG-07 - Proposal, bảng phí và Phone Gate

Bảng cấu hình phí:

- [x] Migration `platform_fee_policies(id, class_type, fee_percentage, effective_from, active, created_by, created_at)`; seed `SHORT_TERM = 25`, `REGULAR = 35`.
- [x] Mỗi `class_type` chỉ một policy hiệu lực tại một thời điểm; đổi tỷ lệ = thêm dòng mới (giữ lịch sử), có audit.
- [x] Service tra tỷ lệ hiệu lực; API Admin xem/đổi cấu hình.

Proposal:

- [x] Migration `proposal_messages`: học sinh (`student_id` hoặc `student_name` + `student_grade/school/learning_goal`), `class_type`, `fee_percentage` (snapshot), `price_per_session`, `schedule_days`, `schedule_time_from/to`, `trial_date`, `trial_time_from/to`, `class_mode`, `note`, `status`, `rejection_reason`, `decided_at`, `rocket_message_id`.
- [x] State machine `PENDING → ACCEPTED | REJECTED | CANCELLED | EXPIRED`; chỉ gia sư tạo/rút, chỉ parent accept/reject.
- [x] `UNIQUE(room_id, version)`; CHECK có `student_id` hoặc `student_name`; partial unique đề xuất PENDING theo học sinh trong room.
- [x] Validate: giờ kết thúc > bắt đầu, `trial_date` không ở quá khứ, ít nhất 1 thứ trong tuần.
- [x] Thẻ đề xuất nối với tin Rocket.Chat qua `proposal_messages.rocket_message_id`.
- [x] Phone Gate: SĐT không lưu ở Rocket.Chat, chỉ trả từ backend sau khi có proposal `ACCEPTED` trong room.

### MSG-08 - Accept proposal → tạo lớp TRIAL

Migration (V24+):

- [x] `classes.class_request_id` → nullable; thêm `proposal_id` (FK, UNIQUE), `class_type`, `fee_percentage`, `end_date`; CHECK `class_request_id IS NOT NULL OR proposal_id IS NOT NULL`.
- [x] **Dùng lại** cột có sẵn của `classes` (V11/V16): `trial_date`, `trial_start_time`, `trial_end_time` nhận dữ liệu từ proposal; `sessions_per_week` = số thứ trong tuần của proposal; `price_per_session`. Lưu ý CHECK `chk_classes_trial_online`: ca thử ONLINE bắt buộc có `trial_meeting_url`, nên khi tạo lớp chỉ ghi ngày/giờ thử, **chưa ghi `trial_teaching_mode`** để gia sư bổ sung link/địa điểm ở UC-T08. Lịch cố định trong proposal dùng làm gợi ý điền sẵn khi gia sư chốt lịch (UC-T09 sinh `class_schedules`).
- [x] Chỉnh `uq_classes_one_current_per_request` (V5): giữ được vì tin đóng khi có lớp (quyết định #4), mỗi tin chỉ có một lớp hiện hành.
- [x] Bỏ `class_requests.requested_tutor_id` + index `idx_class_requests_requested_tutor_id` (xem đánh giá bên dưới). Không sửa V5/V6/V7 đã chạy (Flyway checksum).

Tái sử dụng logic có sẵn:

- [x] Tách `ensureStudent` và đoạn tạo lớp TRIAL + phí nháp (`startTrial`) trong `StaffClassRequestService` thành service dùng chung (`StudentAccountService`, `ClassActivationService`) để luồng staff cũ và luồng proposal cùng dùng; không nhân bản code.

Accept (một transaction, mục 8.5 usecase):

- [x] Khóa proposal (và `class_requests` nếu room APPLICATION) → kiểm tra gia sư ACTIVE, lịch gia sư, học sinh (chặn trùng học sinh+gia sư còn sống, cảnh báo trùng giờ) → proposal `ACCEPTED` → `ensureStudent` → tạo `classes` TRIAL + phí nháp theo `fee_percentage` của proposal → room APPLICATION: request `MATCHED`, application `SELECTED`, các `APPLIED` khác `REJECTED` + thông báo, các proposal PENDING khác trong cùng tin `EXPIRED` → mở khóa SĐT → audit.
- [x] Idempotent khi double-click/song song.
- [x] Transactional outbox đồng bộ system message sang Rocket.Chat.
- [x] Trả mật khẩu khởi tạo học sinh một lần cho phụ huynh nếu tạo mới.
- [x] Gia sư nhận thông báo lớp TRIAL mới và tiếp tục UC-T08/T09.

**Đánh giá việc bỏ `requested_tutor_id`: làm được, độ khó thấp–trung bình, chủ yếu là xóa code của luồng "chỉ định gia sư".**

| Vị trí | Việc cần làm |
|---|---|
| `ClassRequestSubmitService` + `ClassRequestSubmitController` (form công khai có tutor) | Xóa; thay bằng API đăng tin yêu cầu parent đăng nhập |
| `StaffClassRequestService.changeDesignatedTutor` + `PATCH /{id}/designated-tutor` | Xóa; sửa `ClassRequests.jsx` (`apiChangeDesignatedTutor`) |
| `StaffClassRequestService.confirm` + `POST /{id}/confirm` | Xóa (luồng chỉ đích danh do Lễ tân xác nhận không còn) |
| `StaffClassRequestService.publish` (check `CLASS_REQUEST_HAS_TUTOR`), `selectTutor`, `startTrial`, `rematch` (`requested_tutor_id = NULL`) | Bỏ điều kiện/cột; `startTrial` không còn `SET requested_tutor_id`; `rematch` lấy gia sư cũ từ `classes` |
| `StaffClassRequestQueryRepository` (3 chỗ, join `users tu`) | Lấy tên gia sư từ lớp hiện hành (`classes` TRIAL/ACTIVE) bằng LEFT JOIN |
| `PublicClassRequestService`, `TutorClassRequestQueryRepository` | Bỏ điều kiện `requested_tutor_id IS NULL` |
| `ClassApplicationRepository` (kiểm tra đơn có gia sư chỉ định) | Bỏ kiểm tra |
| Frontend: `HireTutorModal`, `parent-contact-modal`, `classRequestApi.js` | Thay bằng luồng Nhắn tin/đăng tin; `staffClassRequestApi.js` bỏ 2 API |
| Test `StaffClassRequestServiceTest` (khoảng 5 chỗ) | Sửa/xóa case theo hành vi mới |
| Docs `ERD.md`, `class_diagram.md`, `prd.md` | Cập nhật (đã có ghi chú ở các file này) |

Rủi ro chính: ô dữ liệu cũ (đơn có `requested_tutor_id` đang `NEW` chưa xử lý) — migration phải xử lý trước khi xóa cột: đơn đang `MATCHED` đã có `classes` nên không mất dữ liệu; đơn `NEW` có gia sư chỉ định chuyển `CANCELLED` kèm lý do hoặc chuyển thành tin thường, cần Lễ tân quyết định trước khi chạy migration trên môi trường có dữ liệu thật.

### MSG-09 - Đăng tin, duyệt và ứng tuyển

- [x] Form POSTING yêu cầu parent đã login.
- [x] Tối đa một POSTING `NEW/OPEN` trên mỗi parent.
- [x] Mục “Lớp cần gia sư” của Lễ tân: duyệt `NEW → OPEN` hoặc hủy có lý do; parent nhận thông báo.
- [x] Gia sư ứng tuyển → `class_applications` (luồng hiện có, giữ nguyên).
- [x] Parent xem tin của mình (trạng thái, số ứng viên), xem hồ sơ từng ứng viên và nút “Nhắn tin” mở room APPLICATION.
- [x] Chốt proposal tạo lớp TRIAL (MSG-08); đánh dấu `class_applications.status = SELECTED` cho ứng viên được chọn. Tin chuyển `MATCHED` (đóng tin) khi lớp được tạo; các ứng viên còn lại `REJECTED` kèm thông báo; room APPLICATION của tin đóng thành chỉ đọc.

### MSG-10 - Màn Lễ tân/Admin

- [x] Mục “Lớp cần gia sư”: danh sách POSTING chờ duyệt/đang mở.
- [x] Transcript read-only qua backend service account.
- [x] Bộ lọc phòng theo loại và có đề xuất chờ; tab tin đăng, lớp dạy thử từ chat và log PII.
- [x] Màn quản lý bảng cấu hình phí (Admin).
- [x] Không cấp Rocket.Chat admin token cho trình duyệt.

### MSG-11 - Jobs và ngoại lệ

- [x] Expire proposal `PENDING` quá hạn (mốc do nhóm chốt, mặc định 7 ngày).
- [x] Tự đặt lớp `SHORT_TERM` thành `COMPLETED` khi quá `end_date` (`end_date` tính khi lớp chuyển `ACTIVE`, +1 tháng); thông báo parent/gia sư trước hạn vài ngày.
- [x] Expire các proposal PENDING còn lại của một tin khi tin đóng (`MATCHED`).
- [x] Khóa room khi tutor INACTIVE.
- [x] Nhắc POSTING sau 14 ngày không có ứng viên nhưng không tự đóng.
- [x] Outbox retry và reconciliation Rocket.Chat room/message mapping.

### MSG-12 - Kiểm thử và hardening

- [x] Unit test PII, Phone Gate, proposal state, tra bảng phí theo class_type, `ensureStudent` dùng lại học sinh, học sinh nhiều lớp và authorization.
- [x] Integration test room idempotency (DIRECT và APPLICATION), schedule conflict, accept song song, outbox retry.
- [x] Contract test `RocketChatClient` bằng mock HTTP server.
- [ ] Compose smoke test tự động với Rocket.Chat thật (đã kiểm tay luồng đầy đủ trên Rocket.Chat local: tạo user/phòng, gửi tin, SSE, đề xuất, đồng ý, transcript).
- [ ] E2E trình duyệt Luồng A, Luồng B, staff read-only, mobile và dark mode (đã kiểm Luồng A/B và staff ở mức API; giao diện mới chỉ qua lint và build).
- [x] Test trường hợp Rocket.Chat tạm thời unavailable (contract test ánh xạ lỗi sang `CHAT_UNAVAILABLE`, danh sách phòng vẫn hiển thị khi không lấy được unread).
- [x] Regression test các màn Lễ tân/gia sư/khiếu nại/thanh toán sau khi bỏ `requested_tutor_id` và cho `classes.class_request_id` nullable (`ComplaintTargetEvaluator`, `PaymentQueryRepository`).

## 4. Thứ tự triển khai và khả năng làm song song

1. Hoàn tất MSG-01 trước để loại rủi ro công nghệ.
2. MSG-02 có thể bắt đầu song song với phần cuối MSG-01.
3. MSG-03 và MSG-04 làm tuần tự vì room cần account mapping.
4. MSG-05 và phần database của MSG-07 có thể chia hai người làm song song.
5. MSG-06 hoàn thiện ngay sau chat text; không để PII thành việc cuối.
6. MSG-08 là refactor schema lớn (bỏ `requested_tutor_id`, `classes.class_request_id` nullable): làm sớm migration + regression trên nhánh riêng, trước khi nối accept proposal.
7. MSG-09 (đăng tin/duyệt/ứng tuyển) chỉ phụ thuộc MSG-02/04 nên có thể bắt đầu song song với MSG-05; MSG-10 làm sau khi contract proposal ổn định.
8. MSG-11 và MSG-12 là gate trước khi merge vào `dev`.

## 5. Ước lượng

| Nhóm | Person-days dự kiến |
|---|---:|
| Infra + Rocket.Chat App | 3-5 |
| Auth + Parent domain | 3-4 |
| Backend messaging/proposal + bảng phí + refactor classes/class_requests | 10-14 |
| Frontend parent/tutor/staff | 7-9 |
| Posting integration | 3-4 |
| Test + hardening | 3-4 |
| **Tổng** | **29-40** |

Ước lượng không bao gồm thời gian chờ cấu hình Google OAuth production, DNS/TLS và review license Rocket.Chat.
