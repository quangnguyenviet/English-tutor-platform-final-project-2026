# TASK PLAN — Giai đoạn 2 (Tuần 7–10, 19/10 – 15/11/2026)

Kế hoạch chia task chi tiết cho 3 thành viên, bám `docs/project/ke-hoach-trien-khai.md` mục 5.2 và `backend/API_DESIGN.md`.

> Tài liệu nguồn: `docs/project/prd.md` (FR-xx), `docs/project/ERD.md`, `backend/API_DESIGN.md` (mục API được trích dẫn dạng "API 3.x").
> Quy ước làm việc: `GIT_CONVENTION.md` (nhánh `feature/*` từ `dev`, PR có 1 review, CI xanh). UI theo `frontend/AGENTS.md`, tiếng Việt 100%.
> Quy ước API: mọi endpoint công khai của Spring Boot dùng tiền tố `/api/v1` (AI Service nội bộ giữ `/ai/...`, `/health`); mọi controller Spring Boot trả `ApiResponse<T>` theo khung `{ code, message, result }`; endpoint dành cho Lễ tân hoặc Admin dùng `@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")`, không tạo thêm vai trò trung gian.

---

## 0. Hiện trạng thực tế (21/10/2026) và điều chỉnh so với kế hoạch v2.2

Kế hoạch v2.2 ghi "backend mới có khung rỗng", nhưng code hiện đã có:

| Đã có | Còn thiếu của Tuần 6 (chuyển sang Tuần 7) |
| --- | --- |
| Auth JWT (token/refresh/logout/introspect), đăng ký gia sư | Đổi mật khẩu bắt buộc lần đầu (FR-06), từ chối tài khoản bị khóa |
| Flyway V1–V3 (users, tutors và 5 bảng con) | Toàn bộ bảng từ `parents` trở đi (V4–V8) và seed |
| Hồ sơ gia sư: lấy, lưu, gửi duyệt (nhánh `feature/tutor-submit-profile`, đang sửa dở) | Lễ tân duyệt hồ sơ (FR-31/32), tìm kiếm công khai (FR-01/02) |
| `StorageService` MinIO | Audit log, thông báo |
| AI Service: chỉ có `/health` | Toàn bộ |

**Quyết định điều chỉnh:**

1. Phần việc Tuần 6 chưa xong được gộp vào đầu Tuần 7 (task `T7-*` có ghi "tồn Tuần 6").
2. Phân công theo bảng 5.3 của kế hoạch, **riêng Tuần 7** chuyển module Phí nhận lớp (backend) cho Thành viên C, vì phần Học sinh/AI của C chưa phụ thuộc được vào luồng ghép lớp. Từ Tuần 8 C quay lại đúng vai trò (AI + Học sinh).
3. Kế toán (`ACCOUNTANT`, FR-40 → FR-44) có trong ERD/PRD nhưng không có dòng riêng trong WBS: được xếp cho A (backend duyệt phí/hoàn tiền) ở Tuần 7–9.

## 1. Phân công

| | Vai trò | Phạm vi sở hữu |
| --- | --- | --- |
| **Thành viên A** | Backend nền tảng + Cổng Lễ tân/Admin/Kế toán | DB migration, Auth, audit/notification, ghép lớp, duyệt hồ sơ, khiếu nại, hoàn tiền, UI Lễ tân/Admin/Kế toán |
| **Thành viên B** | Cổng Gia sư + Cổng Công khai | Tìm kiếm gia sư, ứng tuyển, lịch dạy thử/cố định, buổi học và nhật ký, UI soạn quiz của gia sư |
| **Thành viên C** | Cổng Học sinh + AI Service + Phí nhận lớp (Tuần 7) | FastAPI/LangGraph, quiz học sinh, Elo, phí nhận lớp, UI học sinh, tài liệu bàn giao |

## 2. Tổng quan theo tuần

| Tuần | Thời gian | Milestone | A | B | C |
| --- | --- | --- | --- | --- | --- |
| 7 | 19/10 – 25/10 | **M1 (bù) + M2** | T7-A1 Nền tảng DB/Auth/Audit<br>T7-A2 Duyệt hồ sơ gia sư<br>T7-A3 Lớp cần gia sư & Đơn ghép lớp | T7-B1 Cổng công khai (tìm gia sư, gửi yêu cầu)<br>T7-B2 Gia sư ứng tuyển lớp<br>T7-B3 Lịch dạy thử & chốt lịch cố định | T7-C1 Migration quiz + khung AI Service<br>T7-C2 Backend phí nhận lớp<br>T7-C3 UI phí nhận lớp |
| 8 | 26/10 – 01/11 | **M3** | T8-A1 Thông báo (chuông)<br>T8-A2 UI Lễ tân: ghép lớp, hồ sơ, dashboard<br>T8-A3 Quản lý học sinh | T8-B1 Buổi học, nhật ký, tài liệu<br>T8-B2 UI soạn quiz chia đôi + SKP<br>T8-B3 Import quiz | T8-C1 AI generate (LangGraph)<br>T8-C2 Làm quiz & Elo (backend)<br>T8-C3 UI Học sinh |
| 9 | 02/11 – 08/11 | **M4** | T9-A1 Khiếu nại & hoàn tiền<br>T9-A2 Dashboard & thống kê Kế toán<br>T9-A3 Test phân quyền & audit | T9-B1 Dọn dẹp frontend<br>T9-B2 Test lịch & ghép lớp<br>T9-B3 *(S)* Quản lý nhân sự | T9-C1 Thay mock Học sinh bằng API<br>T9-C2 Test Elo & quiz<br>T9-C3 *(S)* Hồ sơ HS, gia sư của tôi |
| 10 | 09/11 – 15/11 | **M5** | T10-A1 UAT UJ-5, 6, 7 + Docker/CI | T10-B1 UAT UJ-1, 2, 3 + sửa bug | T10-C1 UAT UJ-4 + tài liệu, demo |

**Lưu ý rủi ro:** tuần 7 có A và B/C phụ thuộc lẫn nhau qua migration V4–V6 (T7-A1). A merge migration vào `dev` **trước hết ngày 22/10**; B/C làm UI và mock trước, nối API sau.

## 3. Quy ước mô tả task

- **Problem**: vì sao cần làm, đang thiếu gì.
- **Requirement**: việc phải làm (đo được, kiểm tra được).
- **Acceptance Criteria (AC)**: điều kiện để review/merge, kết thúc bằng một **Manual test** chạy được.
- Mỗi task kèm *Nhánh*, *Phụ thuộc*, *FR*. Task phạm vi cả BE lẫn FE thì người sở hữu làm trọn lát cắt dọc.

---

# TUẦN 7 (19/10 – 25/10): Nền tảng còn thiếu, Ghép lớp, Lịch dạy, Phí nhận lớp

Kết quả cuối tuần (M1 bù + M2): Gia sư nộp hồ sơ → Lễ tân duyệt → Phụ huynh tìm thấy gia sư trên dữ liệu thật; Phụ huynh gửi yêu cầu → ghép lớp → dạy thử → chốt lịch cố định → phí được nộp.

## Thành viên A

### T7-A1 — Nền tảng DB, Auth, Audit, chuẩn response *(tồn Tuần 6)*

`feature/foundation-db-auth` · FR-05, FR-06 · API 1, 2, 4, 5

**Problem**
Mới có 8 bảng; mọi module sau (ghép lớp, buổi học, phí...) chưa có bảng để lưu. Auth, user và tutor đã thống nhất trả `ApiResponse`; các controller mới phải tiếp tục tuân thủ contract này. Chưa có audit log nên các thao tác duyệt/xác nhận không truy vết được. Đăng nhập chưa chặn tài khoản bị khóa và chưa bắt đổi mật khẩu lần đầu.

**Requirement**
- Viết Flyway V4–V6 theo `API_DESIGN.md` mục 5: `parents`, `students`, `employees`, `class_requests`, `class_applications`, `classes`, `class_schedules`, `sessions`, `session_materials`, `notifications`, `audit_logs`; thêm `users.status`, `users.must_change_password`; partial unique index theo ERD.
- Seed: 1 ADMIN, 1 RECEPTIONIST, 1 ACCOUNTANT, 3 STUDENT (kèm `parents`), mật khẩu mặc định theo quy tắc ở QĐ-7 của PRD.
- `AuditLogService.log(action, entityType, entityId, details)` lấy user và IP từ request.
- `POST /api/v1/auth/change-password`; `POST /api/v1/auth/token` trả `mustChangePassword`, từ chối tài khoản `LOCKED`/`INACTIVE` bằng `ErrorCode` mới.
- Duy trì `ApiResponse<T>` cho auth, user, tutor và bắt buộc mọi controller mới dùng cùng contract; các API client frontend đọc dữ liệu trong `result`.
- Siết quyền các endpoint quản trị `/api/v1/users` (chỉ `ADMIN`); giữ `/api/v1/users/my-info` cho người đã đăng nhập.

**Acceptance Criteria**
- `docker compose up --build` chạy migration V4–V6 sạch trên DB mới và trên DB đã ở V3.
- Đăng nhập tài khoản seed học sinh lần đầu nhận `mustChangePassword = true`; sau khi đổi mật khẩu thì cờ về `false`; mật khẩu mới trùng mật khẩu mặc định bị từ chối.
- Tài khoản `LOCKED` đăng nhập bị từ chối kèm thông điệp liên hệ trung tâm.
- Mọi endpoint của `TutorProfileController` trả `{ code, message, result }`; luồng đăng ký → nhập hồ sơ → gửi duyệt trên frontend vẫn chạy.
- User không phải ADMIN gọi `GET /api/v1/users` nhận 403.
- Manual test: gửi duyệt hồ sơ gia sư, kiểm tra DB (`audit_logs` được ghi qua endpoint duyệt ở T7-A2) và đăng nhập bằng 4 vai trò seed.

### T7-A2 — Lễ tân duyệt & quản lý hồ sơ gia sư *(tồn Tuần 6)*

`feature/staff-tutor-review` · FR-31, FR-32 · API 3.3 · Phụ thuộc: T7-A1

**Problem**
Gia sư gửi duyệt xong hồ sơ nằm ở `PENDING` mà không ai duyệt được, nên không có gia sư `ACTIVE` để tìm kiếm hay ghép lớp.

**Requirement**
- Backend: `GET /api/v1/tutors` (lọc `status`, `keyword`, phân trang), `GET /api/v1/tutors/{id}`, `POST .../approve`, `POST .../reject` (bắt buộc `reason`), `PATCH .../status`, `PATCH .../{id}`.
- Duyệt/từ chối/đổi trạng thái đều ghi audit (`APPROVE_TUTOR`, `REJECT_TUTOR`...).
- Chỉ cho chuyển trạng thái theo máy trạng thái ở `API_DESIGN.md` mục 2.5, sai thì ném lỗi 409.
- Frontend: nối `ReceptionistTutorList.jsx` và `admin/TutorManagement.jsx` với 3 tab (Chờ duyệt, Đang hoạt động, Ngưng hoạt động), màn chi tiết xem ảnh chứng chỉ, hộp xác nhận trước khi lưu.

**Acceptance Criteria**
- Chỉ `RECEPTIONIST` và `ADMIN` gọi được các endpoint trên; `TUTOR` nhận 403.
- Từ chối không có lý do trả 400; hồ sơ không ở `PENDING` mà gọi approve trả 409.
- Sau khi duyệt, gia sư thấy trạng thái `ACTIVE` tại `GET /api/v1/tutors/me/profile`, và bản ghi `audit_logs` có `user_id`, `action`, `entity_id` đúng.
- Giao diện đủ Light/Dark, không còn mock data ở hai trang này.
- Manual test: gia sư A nộp hồ sơ → lễ tân duyệt → hồ sơ xuất hiện ở tab "Đang hoạt động"; gia sư B nộp → lễ tân từ chối kèm lý do → B xem được lý do và sửa lại.

### T7-A3 — Lớp cần gia sư & Đơn ghép lớp (backend)

`feature/matching-backend` · FR-25 → FR-30 · API 3.4 (`RECEPTIONIST`, `ADMIN`) · Phụ thuộc: T7-A1

**Problem**
Luồng cốt lõi của nền tảng (từ yêu cầu của phụ huynh đến lớp dạy thử) chưa có backend. Lễ tân chưa có nơi tạo đơn, đăng tuyển, chọn gia sư hay hủy.

**Requirement**
- Triển khai các endpoint dành cho `RECEPTIONIST` hoặc `ADMIN` ở API 3.4, bảo vệ bằng `hasAnyRole('RECEPTIONIST', 'ADMIN')`: danh sách theo tab, chi tiết, tạo, bổ sung sau cuộc gọi lại, `publish`, `cancel`, `applications`, `select-tutor`, `assign-tutor`, `POST /api/v1/classes/{id}/cancel`.
- Khi bổ sung thông tin mà chưa có học sinh: tạo `students` + `users` (role STUDENT) với mật khẩu mặc định và `must_change_password = true`.
- `select-tutor` và `assign-tutor` chạy trong **một transaction**: tạo `classes` (`TRIAL`), cập nhật application/request.
- Hủy bắt buộc có lý do; thông báo cho gia sư đã ứng tuyển (gọi `NotificationService`, dùng bản tạm ghi bảng `notifications` nếu T8-A1 chưa xong).
- Chuẩn hóa `ErrorCode` dải 1100–1299.

**Acceptance Criteria**
- `publish` thiếu `class_requirement`/`teaching_mode`/`price_per_session` trả 400 kèm tên trường thiếu.
- Chọn gia sư khi đơn không còn `OPEN` trả 409; không thể tạo hai lớp `TRIAL`/`ACTIVE` cùng một đơn (vi phạm partial unique index bị chuyển thành lỗi 409 rõ ràng, không phải lỗi 500).
- Hủy lớp ở `TRIAL`/`ACTIVE` lưu lý do và ghi audit; hủy lớp ở `COMPLETED` bị từ chối.
- Có test Spring (MockMvc hoặc service) cho `select-tutor` thành công và `select-tutor` khi đơn đã `MATCHED`.
- Manual test (Swagger/Postman): tạo đơn → bổ sung → publish → hai gia sư ứng tuyển (dùng DB seed) → chọn một → kiểm tra DB: request `MATCHED`, application `SELECTED`/`REJECTED`, 1 dòng `classes` `TRIAL`.

## Thành viên B

### T7-B1 — Cổng công khai: tìm gia sư, xem hồ sơ, gửi yêu cầu

`feature/public-portal` · FR-01 → FR-04 · API 3.2 · Phụ thuộc: T7-A1 (bảng `parents`, `class_requests`), T7-A2 (có gia sư `ACTIVE`; trong lúc chờ dùng dữ liệu seed)

**Problem**
Phụ huynh chưa tìm được gia sư và chưa có cách để lại yêu cầu. Các trang `Guest*` hiện chạy bằng mock data.

**Requirement**
- Backend: `GET /api/v1/public/tutors` (lọc tỉnh/quận, chuyên môn, cấp lớp, hình thức, giới tính, từ khóa, phân trang), `GET /api/v1/public/tutors/{id}`, `POST /api/v1/public/class-requests` (body `{ parentName, phone, tutorId? }`: có `tutorId` là đăng ký gia sư chỉ định, bỏ trống là nhận tư vấn; thay cho 2 endpoint `tutor-requests` và `class-requests` ban đầu); không công khai học phí gia sư; thêm các đường dẫn `/api/v1/public/**` vào `PUBLIC_ENDPOINTS` (cả GET).
- Chỉ trả gia sư `ACTIVE`; mục rỗng không có trong response; gia sư không còn `ACTIVE` → 404 `TUTOR_PROFILE_UNAVAILABLE`.
- Validate SĐT Việt Nam (đầu 03/05/07/08/09 hoặc +84/84, 10 số), giới hạn 5 request/giờ cho mỗi SĐT.
- Sinh mã `REQ-{yyyyMMdd}-{id}`; tạo `parents` mới nếu SĐT chưa tồn tại, dùng lại nếu đã có.
- Frontend: nối `GuestTutorExplorePage.jsx`, `GuestTutorDetailPage.jsx`, `GuestContactPage.jsx`; thêm form "Đăng ký gia sư này" và "Gửi yêu cầu tìm gia sư" (thông báo "trung tâm sẽ liên hệ trong 12 giờ").

**Acceptance Criteria**
- Truy cập các endpoint public không cần token; không lộ SĐT, email hay địa chỉ của gia sư trong response.
- Lọc theo từng tiêu chí và kết hợp nhiều tiêu chí trả đúng; phân trang đúng `totalItems`.
- SĐT sai định dạng trả 400 kèm thông điệp tiếng Việt; gửi lần thứ 6 trong 1 giờ trả 429.
- Gửi yêu cầu thành công trả mã yêu cầu; DB có `class_requests` ở `NEW` (và `requested_tutor_id` đúng khi chỉ định).
- Giao diện Light/Dark, mobile không tràn ngang, không dùng emoji.
- Manual test: tìm gia sư ở "Quận Cầu Giấy", mở hồ sơ, bấm đăng ký chỉ định bằng SĐT `0912345678` → nhận mã; kiểm tra DB; thử SĐT `0212345678` bị từ chối.

### T7-B2 — Gia sư xem lớp cần gia sư và ứng tuyển

`feature/tutor-apply-class` · FR-08 · API 3.4 (TUTOR) · Phụ thuộc: T7-A3 (publish)

**Problem**
Gia sư không có cách nào nhận lớp ngoài sự chỉ định của lễ tân; trang `ClassRequests.jsx` đang là mock.

**Requirement**
- Backend: `GET /api/v1/tutors/me/open-requests` (cờ `applied`), `GET .../{id}`, `POST .../apply`, `DELETE /api/v1/tutors/me/applications/{id}`, `GET /api/v1/tutors/me/applications`.
- Chỉ gia sư `ACTIVE` mới ứng tuyển được; ẩn thông tin liên hệ phụ huynh.
- Rút ứng tuyển chỉ khi đơn còn `OPEN` và chưa chọn gia sư.
- Frontend: nối `ClassRequests.jsx` (danh sách, chi tiết, hộp thoại ứng tuyển kèm lời nhắn, nút rút lại).

**Acceptance Criteria**
- Ứng tuyển lần 2 vào cùng đơn trả 409; ứng tuyển khi hồ sơ chưa `ACTIVE` trả 403.
- Đơn đã `MATCHED` hoặc `CANCELLED` không còn trong danh sách của gia sư.
- Rút ứng tuyển sau khi lễ tân đã chọn gia sư trả 409.
- Response cho gia sư không chứa SĐT/tên phụ huynh.
- Manual test: lễ tân publish đơn → gia sư A ứng tuyển → A thấy nút "Rút lại" → A rút → lễ tân thấy danh sách ứng tuyển rỗng.

### T7-B3 — Lịch dạy thử và chốt lịch cố định

`feature/trial-and-schedule` · FR-09, FR-10 · API 3.5 · Phụ thuộc: T7-A3 (có `classes` `TRIAL`)

**Problem**
Sau khi ghép, lớp dừng ở `TRIAL`: gia sư không đặt được buổi dạy thử, không chốt được lịch học cố định và nên không sinh được buổi học nào. Việc kiểm tra trùng ca chưa có.

**Requirement**
- Backend: `GET /api/v1/tutors/me/classes`, `GET /api/v1/classes/{id}`, `POST/PUT /api/v1/classes/{id}/trial-session`, `POST /api/v1/classes/{id}/finalize-schedule`.
- `ScheduleConflictChecker`: so sánh với `class_schedules` các lớp `ACTIVE` và `sessions` `SCHEDULED` khác của cùng gia sư; lỗi trả rõ thứ, giờ và tên học sinh trùng.
- Online bắt buộc `meetingUrl`; tại nhà bắt buộc `location`; mỗi lớp tối đa 1 buổi thử.
- `finalize-schedule` trong một transaction: lưu `class_schedules`, lớp → `ACTIVE` + `active_from`, sinh `sessions` 4 tuần, và gọi `PaymentService.createForClass(classId)` của T7-C2 (nếu chưa merge thì dùng interface rỗng, **không** đổi chữ ký).
- Frontend: màn lịch dạy thử (form ngày/giờ/hình thức), màn chốt lịch (chọn nhiều ca theo thứ, giờ, ngày bắt đầu) trong trang chi tiết lớp của gia sư.

**Acceptance Criteria**
- Đặt buổi thử trùng ca với buổi khác của gia sư trả 409 `SCHEDULE_CONFLICT` kèm thông tin ca trùng.
- Chốt lịch lỗi giữa chừng (ví dụ ca thứ 2 trùng) **không** để lại dữ liệu dở: lớp vẫn `TRIAL`, không có `class_schedules` mới.
- Chốt lịch thành công: lớp `ACTIVE`, đúng số dòng `class_schedules`, đúng số `sessions` sinh ra, có 1 `payments` `NOT_SUBMITTED` (khi T7-C2 đã merge).
- Gia sư khác gọi `GET /api/v1/classes/{id}` của lớp không thuộc mình nhận 403.
- Có unit test cho `ScheduleConflictChecker` (trùng hẳn, trùng một phần, liền kề không trùng).
- Manual test: lớp `TRIAL` → đặt buổi thử thứ 3 19:00–20:30 → thử đặt lại buổi khác trùng giờ bị từ chối → chốt lịch T3/T5 19:00–20:30 → kiểm tra DB.

## Thành viên C

### T7-C1 — Migration Quiz và khung AI Service

`feature/quiz-schema-ai-skeleton` · FR-13, FR-14, FR-22 · API 5 (V7), API 3.7 (AI) · Phụ thuộc: T7-A1 (version migration)

**Problem**
Chưa có bảng cho quiz/Elo nên cả luồng học sinh và gia sư soạn quiz chưa bắt đầu được. AI Service chỉ có `/health`; thuật toán Elo chưa tồn tại.

**Requirement**
- Flyway V7: `skills` (seed ≥ 20 kỹ năng theo 7 nhóm), `quizzes`, `quiz_questions`, `quiz_answers`, view `v_student_skill_stats`, cột `students.elo` mặc định 1000.
- Seed 1 quiz mẫu 10 câu cho học sinh seed.
- `EloCalculator` (hàm thuần) theo `API_DESIGN.md` mục 3.7, hằng số trong `EloProperties`, kèm unit test.
- AI Service: dựng cấu trúc FastAPI (`/ai/quiz/generate` trả dữ liệu giả đúng schema, `/ai/quiz/validate-import`), schema Pydantic khớp `quiz_questions`, Dockerfile chạy trong `docker compose`.
- Backend `AiClient` (RestClient, timeout 60 s, retry 1 lần, map lỗi `AI_SERVICE_UNAVAILABLE`).

**Acceptance Criteria**
- Migration V7 chạy sạch; `SELECT * FROM v_student_skill_stats` chạy được trên dữ liệu seed.
- `EloCalculator`: học sinh Elo ngang độ khó, trả lời đúng tăng 16, sai giảm 16 (K = 32); đúng câu khó tăng nhiều hơn đúng câu dễ; có test cho cả hai.
- `POST /ai/quiz/generate` trả JSON hợp lệ theo schema; payload sai schema trả 422.
- `AiClient` khi AI Service tắt trả `AI_SERVICE_UNAVAILABLE` (không treo quá 60 s, không lỗi 500).
- Manual test: `docker compose up`, gọi `/ai/quiz/generate` bằng curl, rồi dừng container AI và gọi qua backend để thấy lỗi dự kiến.

### T7-C2 — Phí nhận lớp (backend)

`feature/payment-backend` · FR-15, FR-33, FR-41, FR-42 · API 3.8 · Phụ thuộc: T7-A1 (`AuditLogService`), T7-B3 (gọi `createForClass`)

**Problem**
Khi gia sư chốt lịch, trung tâm phải thu phí nhận lớp (mặc định 40% học phí tháng đầu, Lễ tân chỉnh được trong 0–50%). Hiện chưa có API nộp minh chứng, thu hộ tại quầy hay đối soát.

**Requirement**
- Bảng `payments` đã có từ V5; Flyway V9 chỉ nới `fee_percentage` thành 0–50 và `amount >= 0`. Các bảng khiếu nại do A thêm ở T9-A1 bằng migration kế tiếp.
- `PaymentService.createForClass(classId)`: tạo khoản `NOT_SUBMITTED`, `TUTOR`, 40% (cấu hình `app.payment.default-fee-percentage`), `amount = fee% × số_ca × 4 × price_per_session` làm tròn nghìn đồng.
- Endpoint API 3.8: gia sư nộp biên lai (Lễ tân/Admin nộp thay), Lễ tân thu hộ, danh sách/chi tiết/tìm kiếm, **Lễ tân/Admin** chỉnh tỷ lệ (0–50%, chỉ khi `NOT_SUBMITTED`, kế toán không được chỉnh), `approve` (có `receivedAmount`), `request-resubmit` (Kế toán và Admin). Admin gọi được mọi API.
- Ràng buộc `reviewed_by ≠ uploaded_by` (`PAYMENT_SAME_ACTOR`, áp dụng cả Admin). Ghi audit cho mọi thao tác.
- Phí `APPROVED` → mở cờ `contactUnlocked` (suy ra từ `payments.status`, gia sư chỉ thấy SĐT phụ huynh sau đó).

**Acceptance Criteria**
- Công thức: lớp 2 ca/tuần, 200.000đ/buổi, 40% → `0.4 × 2 × 4 × 200000 = 640.000đ`; có unit test cho 2 tỷ lệ và một trường hợp làm tròn.
- Tỷ lệ ngoài [0, 50] trả 400; sửa khi đã nộp minh chứng trả 409.
- `approve` với `receivedAmount < amount` chuyển `RESUBMIT_REQUIRED` kèm lý do; `≥ amount` chuyển `APPROVED`.
- Cùng một user vừa thu hộ vừa duyệt bị từ chối.
- Upload biên lai sai định dạng hoặc > 5 MB bị từ chối bằng `FILE_INVALID_TYPE`/`FILE_TOO_LARGE`.
- Manual test: chốt lịch (T7-B3) → gia sư nộp biên lai → kế toán nhập số tiền thiếu → gia sư nộp lại → kế toán xác nhận đủ → DB `payments.status = APPROVED`, có `reviewed_by`, `audit_logs`.

### T7-C3 — Giao diện phí nhận lớp (Gia sư, Lễ tân, Kế toán)

`feature/payment-ui` · FR-15, FR-33, FR-41, FR-42 · Phụ thuộc: T7-C2

**Problem**
Backend phí có API nhưng chưa có màn hình cho ba vai trò; các trang `PaymentApproval.jsx`, `ReceptionistPaymentApproval.jsx` đang là mock.

**Requirement**
- Gia sư: trang "Phí nhận lớp" với 4 tab (Chưa nộp minh chứng, Yêu cầu gửi lại, Chờ xác nhận, Đã xác nhận), nộp ảnh biên lai, hiện lý do khi bị yêu cầu gửi lại.
- Lễ tân: tìm khoản phí theo mã lớp/tên gia sư/SĐT phụ huynh, thu hộ hoặc nộp thay tại quầy (chọn tiền mặt/chuyển khoản, ảnh phiếu thu), chỉnh tỷ lệ phí khi chưa có minh chứng.
- Kế toán (dùng chung component với Admin): 4 tab, xem ảnh biên lai, nhập số tiền thực nhận, xác nhận hoặc yêu cầu gửi lại; tỷ lệ phí chỉ đọc (Lễ tân/Admin mới chỉnh được).
- Tái sử dụng `Badge`, `Card`, `Button`, `StatCard`; skeleton khi tải; tiếng Việt.

**Acceptance Criteria**
- Số tiền hiển thị định dạng `640.000 ₫`; trạng thái dùng đúng tone Badge (Amber chờ, Emerald xác nhận, Rose gửi lại).
- Nút xác nhận bị vô hiệu khi chưa nhập số tiền thực nhận hoặc khi chính người đó là người thu hộ.
- Upload hiển thị tiến trình và lỗi rõ ràng khi sai loại/quá dung lượng.
- Light/Dark đủ, mobile không tràn ngang, không có emoji.
- Manual test: đi hết luồng của Manual test ở T7-C2 bằng giao diện với 3 tài khoản (gia sư, lễ tân, kế toán).

---

# TUẦN 8 (26/10 – 01/11): Buổi học, AI Service, Quiz và Elo

Kết quả cuối tuần (M3): Gia sư soạn quiz qua AI hoặc import, giao bài; học sinh làm bài, Elo tự cập nhật.

## Thành viên A

### T8-A1 — Hệ thống thông báo (chuông)

`feature/notifications` · FR-23 · API 3.10 · Phụ thuộc: T7-A1

**Problem**
Các luồng đã làm (duyệt hồ sơ, hủy lớp, giao quiz, xác nhận phí) cần báo cho người liên quan, nhưng chưa có API đọc thông báo và chưa có chuông trên giao diện.

**Requirement**
- Hoàn thiện `NotificationService` và `GET /api/v1/notifications`, `POST /api/v1/notifications/{id}/read`, `POST /api/v1/notifications/read-all`.
- Rà lại các luồng của Tuần 7 để gọi `notify(...)` đúng người nhận (thông báo cho phụ huynh đi qua tài khoản học sinh).
- Frontend: biểu tượng chuông trong `AppShell.jsx` kèm số chưa đọc, danh sách thả xuống, click điều hướng đến đối tượng liên kết; đối tượng đã xóa hiển thị "không còn khả dụng".

**Acceptance Criteria**
- Người dùng chỉ đọc/đánh dấu được thông báo của chính mình (user khác nhận 403/404).
- Số chưa đọc giảm đúng sau khi mở thông báo; mở thông báo trỏ tới đối tượng đã xóa không gây lỗi trang.
- Duyệt hồ sơ gia sư, hủy lớp, giao quiz, xác nhận phí đều sinh thông báo cho đúng người.
- Manual test: lễ tân duyệt hồ sơ → gia sư thấy chuông có 1 thông báo → bấm vào → thông báo chuyển đã đọc và điều hướng đúng.

### T8-A2 — Giao diện Lễ tân: ghép lớp, dashboard, hồ sơ gia sư

`feature/reception-matching-ui` · FR-24 → FR-30 · API 3.4, 3.10 · Phụ thuộc: T7-A3

**Problem**
Backend ghép lớp (T7-A3) chưa có giao diện; `ReceptionistMatchRequests.jsx`, `ReceptionistDashboard.jsx`, `admin/MatchRequests.jsx` đang là mock.

**Requirement**
- `GET /api/v1/reception/dashboard` (KPI: đơn ghép lớp chờ xử lý, khiếu nại chờ xử lý, khiếu nại chờ hoàn tiền, gia sư đang hoạt động).
- Màn Lớp cần gia sư (4 tab, tìm kiếm, sắp xếp theo thời gian đăng/số ứng tuyển), form tạo và bổ sung thông tin sau cuộc gọi, đăng tuyển, hủy kèm lý do, danh sách ứng tuyển và chọn gia sư, form chỉ định gia sư.
- Gộp Admin và Lễ tân dùng chung bộ component nghiệp vụ (theo mục 3.4 của kế hoạch).

**Acceptance Criteria**
- Nút "Chọn gia sư" bị khóa khi chưa có ai ứng tuyển; hủy không nhập lý do không gửi được.
- KPI trên dashboard khớp số liệu đếm trực tiếp trong DB.
- Admin và Lễ tân dùng chung component, không có hai bản sao.
- Light/Dark, mobile không tràn ngang.
- Manual test: thực hiện UJ-1 và UJ-2 bước phía lễ tân trên giao diện (từ đơn `NEW` đến lớp `TRIAL`).

### T8-A3 — Quản lý học sinh

`feature/student-management` · FR-34 · API 3.10 · Phụ thuộc: T7-A1

**Problem**
Lễ tân/Admin chưa xem được danh sách học sinh, phụ huynh, lớp đã/đang học, và chưa khóa/mở được tài khoản học sinh.

**Requirement**
- `GET /api/v1/students` (tab `ACTIVE`/`INACTIVE`, tìm kiếm, lọc, phân trang), `GET /api/v1/students/{id}`, `PATCH /api/v1/students/{id}/status`.
- Khóa tài khoản học sinh phải chặn đăng nhập (dùng cơ chế `users.status` của T7-A1) và ghi audit.
- Frontend: nối `ReceptionistStudentList.jsx` và `admin/StudentManagement.jsx`.

**Acceptance Criteria**
- Học sinh bị chuyển `INACTIVE` đăng nhập bị từ chối; mở lại thì đăng nhập được.
- Chi tiết học sinh hiển thị đúng phụ huynh và danh sách lớp (đã và đang học).
- Tìm kiếm theo tên và SĐT phụ huynh trả đúng.
- Manual test: khóa học sinh seed → thử đăng nhập bị từ chối → mở lại → đăng nhập thành công; kiểm tra `audit_logs`.

## Thành viên B

### T8-B1 — Buổi học, nhật ký và tài liệu

`feature/sessions-and-logs` · FR-11, FR-12, FR-21 · API 3.6 · Phụ thuộc: T7-B3

**Problem**
Sau khi chốt lịch, gia sư không có nơi xem lịch dạy, mở buổi học, ghi nhật ký (kiến thức, bài tập) hay đính kèm tài liệu. `LessonOperations.jsx` đang là mock.

**Requirement**
- Backend: `GET /api/v1/tutors/me/schedule` (tuần/tháng), `POST/GET /api/v1/classes/{id}/sessions`, `GET/PUT /api/v1/sessions/{id}`, `POST /api/v1/sessions/{id}/status`, `PUT /api/v1/sessions/{id}/log`, upload/xóa tài liệu, `GET /api/v1/materials/{id}/access-url` (URL ký sẵn 10 phút).
- Số thứ tự buổi tính bằng `ROW_NUMBER()` theo ngày, không lưu cột.
- Tài liệu chỉ nhận `.pdf`, `.docx`, ảnh, âm thanh, ≤ 20 MB.
- Chuyển trạng thái buổi theo máy trạng thái mục 2.5; lưu nhật ký lần đầu gửi thông báo cho học sinh.
- Frontend: lịch tuần/tháng, danh sách buổi, trang chi tiết buổi (thông tin chung, tài liệu, quiz, nhật ký).

**Acceptance Criteria**
- Học sinh gọi `GET /api/v1/sessions/{id}` của lớp khác trả 403; học sinh không thấy nhật ký khi chưa công bố.
- Tải lên `.exe` hoặc tệp > 20 MB bị từ chối; URL ký sẵn hết hạn sau 10 phút (kiểm tra bằng mock thời gian hoặc cấu hình ngắn khi test).
- Chuyển trạng thái sai thứ tự (ví dụ `COMPLETED → SCHEDULED`) trả 409.
- Sửa giờ buổi gây trùng ca với buổi khác của gia sư bị từ chối.
- Manual test: mở buổi học → đổi trạng thái → nhập nhật ký → đính kèm PDF → đăng nhập học sinh xem được nhật ký và tải tài liệu.

### T8-B2 — Giao diện soạn quiz chia đôi và hồ sơ kỹ năng

> **Cập nhật (31/10):** Lát cắt **thủ công (chưa AI)** của T8-B2 đã hoàn thành trên nhánh `feature/tutor-quiz-authoring`: backend module `quiz` (tạo DRAFT, sửa, giao bài + notification, đọc catalog kỹ năng) + UI gia sư "Soạn Quiz" tại chi tiết buổi học (màn chia 3+2: form câu hỏi A–D + xem trước). Skill giữ **catalog chung toàn hệ thống** (bảng `skills`, seed ~20 kỹ năng trong V14, idempotent); không làm bảng bộ-skill-riêng-theo-lớp (chủ sở hữu kỹ năng là học sinh — SKP/Elo sau này nhất quán hơn). Phần chia đôi + chat AI + SKP (`ai-chat`, `skill-profile`) và AI thật vẫn thuộc phạm vi gốc của T8-B2/T8-C1.

`feature/tutor-quiz-authoring` · FR-13 · API 3.7 · Phụ thuộc: T7-C1 (schema, AiClient), T8-C1 (AI thật; trước đó dùng dữ liệu giả của T7-C1)

**Problem**
Gia sư chưa có công cụ soạn quiz: không xem được điểm yếu của học sinh, không chat được với AI để sinh câu hỏi bám sát điểm yếu.

**Requirement**
- Backend: `GET /api/v1/classes/{id}/skill-profile` (từ view, sắp theo `error_rate`), `POST /api/v1/sessions/{id}/quizzes/ai-chat` (lưu hội thoại MongoDB), `POST /api/v1/sessions/{id}/quizzes`, `PUT /api/v1/quizzes/{id}`, `POST /api/v1/quizzes/{id}/assign` (đặt deadline).
- Frontend: màn chia đôi (trái: xem trước/sửa câu hỏi, phải: chat AI), đính kèm PDF/ảnh, ngăn kéo "Bảng thống kê hồ sơ học sinh", chọn câu để thêm vào quiz, giao bài.

**Acceptance Criteria**
- Chat gửi kèm kỹ năng yếu nhất của học sinh trong ngữ cảnh gửi AI (kiểm tra qua log request của AI Service).
- Chỉ sửa được quiz khi còn `DRAFT`; giao bài đặt `ASSIGNED`, thông báo học sinh, `deadline` phải ở tương lai.
- AI Service lỗi hoặc quá 60 s hiển thị thông báo lỗi và gợi ý dùng import (T8-B3), không treo giao diện.
- Gia sư chỉ truy cập được lớp của mình.
- Manual test: mở buổi học → chat "5 câu về past simple, B1" → chọn 5 câu → giao bài với deadline → học sinh seed thấy bài trong danh sách.

### T8-B3 — Import quiz từ công cụ AI ngoài

`feature/quiz-import` · FR-14 · API 3.7 · Phụ thuộc: T7-C1

**Problem**
Khi AI Service chậm hoặc hết token, gia sư cần phương án dự phòng 0 token: dùng AI ngoài (ChatGPT...) rồi nhập kết quả vào hệ thống.

**Requirement**
- `GET /api/v1/quizzes/import-prompt?classId=` trả prompt mẫu nhúng kỹ năng yếu và chuẩn JSON CEFR.
- `POST /api/v1/sessions/{id}/quizzes/import` kiểm định cấu trúc: đủ A–D, `correct_answer` ∈ A–D, `cefr_level` hợp lệ, `skill_code` tồn tại; trả danh sách lỗi `{ questionNumber, field, message }`.
- Frontend: tab "Import" trong màn soạn quiz: nút sao chép prompt, ô dán JSON, hiển thị lỗi theo câu.

**Acceptance Criteria**
- JSON thiếu `option_c` ở câu 3 trả lỗi chỉ rõ câu 3 và trường `option_c`; JSON hợp lệ tạo quiz `DRAFT` với `source = IMPORTED`.
- Import thất bại **không** tạo quiz dở dang.
- Chuỗi không phải JSON trả 400 với thông điệp dễ hiểu, không lộ stack trace.
- Có unit test cho validator: hợp lệ, thiếu trường, `correct_answer = "E"`, `skill_code` không tồn tại.
- Manual test: sao chép prompt, dán JSON mẫu đúng → quiz xuất hiện ở `DRAFT`; sửa JSON cho sai một câu → thấy lỗi đúng câu.

## Thành viên C

### T8-C1 — AI Service: sinh quiz theo hội thoại (LangGraph)

`feature/ai-quiz-generation` · FR-13 · API 3.7 (AI) · Phụ thuộc: T7-C1

**Problem**
Endpoint AI hiện chỉ trả dữ liệu giả; chưa sinh được câu hỏi thật, chưa bám CEFR hay kỹ năng yếu và chưa kiểm duyệt nội dung.

**Requirement**
- Dùng LangGraph: nút phân tích yêu cầu → sinh câu hỏi → kiểm tra định dạng (A–D, một đáp án đúng, có giải thích, gán `skill_code` hợp lệ) → tự sửa nếu lỗi (tối đa 2 lần).
- Nhận `skillProfile` để ưu tiên kỹ năng yếu; nhận `attachments` (PDF/ảnh) làm ngữ cảnh.
- Lọc nội dung không phù hợp; API key chỉ qua biến môi trường.
- Timeout bên trong dưới 55 s để backend (60 s) không bị treo.

**Acceptance Criteria**
- 20 lần gọi mẫu: ≥ 95% trả JSON đúng schema `quiz_questions` ngay lần đầu hoặc sau tự sửa.
- Mọi câu có đúng 1 đáp án đúng và `explanation` không rỗng; `skill_code` luôn nằm trong danh mục `skills`.
- Yêu cầu "tập trung vào thì hiện tại hoàn thành" cho ra câu hỏi liên quan chủ đề này.
- Hết thời gian hoặc lỗi nhà cung cấp trả mã lỗi rõ ràng, không treo.
- Manual test: gọi `/ai/quiz/generate` với `skillProfile` yếu `third_person_s` → phần lớn câu hỏi gắn kỹ năng này.

### T8-C2 — Làm quiz và cập nhật Elo (backend)

`feature/student-quiz-backend` · FR-17, FR-22 · API 3.7 (học sinh) · Phụ thuộc: T7-C1, T8-B2 (quiz `ASSIGNED`)

**Problem**
Học sinh chưa làm quiz được: chưa có API bắt đầu/tiếp tục, chấm từng câu, tính Elo, tổng kết và danh sách ôn tập.

**Requirement**
- `GET /api/v1/students/me/quizzes`, `GET /api/v1/quizzes/{id}` (ẩn đáp án chưa trả lời), `POST .../attempts/start`, `POST .../questions/{id}/answer`, `GET /api/v1/quizzes/{id}/result`, `GET /api/v1/students/me/review-list`.
- `answer`: chấm ngay, lưu `quiz_answers` với `elo_before/after/change`, cập nhật `students.elo` trong một transaction; **idempotent** (gọi lại trả kết quả cũ).
- Quá `deadline` → `QUIZ_EXPIRED` và quiz chuyển `EXPIRED`; trả lời hết câu → quiz `COMPLETED`.
- `GET /api/v1/students/me/dashboard` gộp theo mục 3.6, mỗi khu vực lỗi độc lập.

**Acceptance Criteria**
- Trả lời lại cùng câu không thay đổi Elo lần hai (UNIQUE student/question được bảo vệ, không trả 500).
- Học sinh không lấy được đáp án đúng của câu chưa trả lời qua `GET /api/v1/quizzes/{id}`.
- Học sinh A không truy cập được quiz của học sinh B.
- Câu sai xuất hiện trong `review-list`; câu đúng thì không.
- Hai request answer song song cho cùng câu không làm Elo cập nhật hai lần (test đồng thời hoặc khóa dòng).
- Manual test: học sinh seed làm hết quiz mẫu 10 câu → Elo thay đổi khớp tổng `elo_change` của kết quả; kiểm tra `review-list`.

### T8-C3 — Giao diện Học sinh: lịch, buổi học, quiz

`feature/student-portal-ui` · FR-17, FR-19 → FR-22 · API 3.6, 3.7 · Phụ thuộc: T8-C2, T8-B1

**Problem**
Các trang học sinh đang dùng mock (`StudentSchedule.jsx`, `StudentExercises.jsx`, `ExerciseTaking.jsx`, `StudentMaterials.jsx`, `StudentDashboard.jsx`).

**Requirement**
- Nối API thật: lịch tuần T2–CN với trạng thái buổi, lịch sử buổi (giảm dần), chi tiết buổi, xem trực tiếp/tải tài liệu, danh sách bài, màn làm quiz từng câu (thanh tiến độ, khóa sau khi chọn, hiện đúng/sai, đáp án, giải thích, Elo thay đổi), tổng kết, danh sách ôn tập.
- Ép đổi mật khẩu ở lần đăng nhập đầu (dùng API của T7-A1).
- Dashboard hiển thị Elo, bài cần làm kèm hạn nộp; khu vực lỗi không phá cả trang.

**Acceptance Criteria**
- Sau khi chọn đáp án không đổi được; reload giữa chừng làm tiếp đúng câu kế tiếp.
- Buổi chưa có nhật ký hiển thị "Chưa có" hoặc "Gia sư chưa gửi nhật ký" đúng theo trạng thái.
- Tệp không hỗ trợ xem thì chỉ có nút tải; tệp đã gỡ hiển thị "không còn khả dụng".
- Light/Dark, mobile không tràn ngang, không emoji.
- Manual test: thực hiện UJ-4 trọn vẹn (đăng nhập lần đầu → đổi mật khẩu → làm quiz → xem Elo → ôn câu sai).

---

# TUẦN 9 (02/11 – 08/11): Khiếu nại, Dọn frontend, Tích hợp 4 cổng, Test

Kết quả cuối tuần (M4): Hệ thống liên thông 4 cổng trên dữ liệu thật, không còn mock; test tích hợp pass.

## Thành viên A

### T9-A1 — Khiếu nại và hoàn tiền

`feature/complaints-refunds` · FR-35 → FR-37, FR-43 · API 3.9 · Phụ thuộc: T7-C2 (payments `APPROVED`)

**Problem**
Sau khi ghép lớp, phụ huynh có thể muốn đổi gia sư hoặc hoàn phí; lễ tân chưa có nơi tiếp nhận/xử lý và kế toán chưa có cách hoàn tiền kiểm soát được.

**Requirement**
- Flyway V9: `complaints`, `complaint_attachments`, `refunds`.
- Endpoint API 3.9: tạo/xem/sửa/hủy khiếu nại, `resolve-rematch`, `refund-requests`, danh sách/chi tiết hoàn tiền, `pay`, `reject`.
- `REMATCH`: lớp → `CANCELLED`, đơn gốc về `OPEN`. `REFUND`: `payment` phải `APPROVED` và cùng lớp, `approvedAmount ≤ received_amount − đã hoàn`, `processed_by ≠ requested_by`; hoàn xong khiếu nại tự `RESOLVED`.
- Audit: `RESOLVE_COMPLAINT`, `REQUEST_REFUND`, `PAY_REFUND`, `REJECT_REFUND`.
- Frontend: `ReceptionistComplaints.jsx`, `admin/ComplaintManagement.jsx` (lễ tân), màn hoàn tiền (kế toán).

**Acceptance Criteria**
- Hoàn vượt số đã thu còn lại bị từ chối (400) kể cả khi hoàn nhiều lần cho cùng khoản.
- Một khiếu nại không tạo được hai yêu cầu hoàn tiền `PENDING`/`PAID`.
- Kế toán từ chối → khiếu nại quay về `PENDING`, lễ tân thấy lý do và gửi lại được.
- `resolve-rematch` làm đơn gốc `OPEN` lại và lớp `CANCELLED` trong một transaction; lỗi giữa chừng không để dữ liệu dở.
- Manual test: UJ-5 và UJ-7: lễ tân tạo khiếu nại REFUND → gửi yêu cầu hoàn → kế toán hoàn kèm biên lai → khiếu nại `RESOLVED`; thêm một khiếu nại REMATCH → đơn gốc trở lại `OPEN`.

### T9-A2 — Dashboard và thống kê Kế toán

`feature/accounting-dashboard` · FR-40, FR-44 · API 3.9 · Phụ thuộc: T7-C2, T9-A1

**Problem**
Kế toán chưa có tổng quan phí chờ xác nhận, hoàn tiền chờ xử lý và số liệu thu/hoàn theo kỳ.

**Requirement**
- `GET /api/v1/accounting/dashboard` và `GET /api/v1/accounting/statistics` (lọc `from`, `to`, `groupBy`), dùng đúng công thức mục 2.6 của `ERD.md` (thu theo `reviewed_at`, hoàn theo `processed_at`, công nợ = `NOT_SUBMITTED` + `RESUBMIT_REQUIRED`).
- Frontend: dashboard kế toán với `StatCard` và biểu đồ theo tháng (chọn thư viện chart đã có trong `package.json`, không thêm mới nếu không cần).
- *Nếu đến hết 05/11 chưa kịp: cắt `statistics`, giữ `dashboard`* (rủi ro đã ghi trong kế hoạch).

**Acceptance Criteria**
- Tổng "tiền thu" khớp tay với `SUM(received_amount)` các khoản `APPROVED` trong kỳ trên dữ liệu seed; "doanh thu thuần" = thu − hoàn.
- Lọc kỳ rỗng trả số 0 và biểu đồ rỗng thân thiện, không lỗi.
- Chỉ `ACCOUNTANT` và `ADMIN` truy cập được.
- Manual test: tạo 3 khoản đã xác nhận + 1 khoản hoàn → đối chiếu từng con số trên dashboard.

### T9-A3 — Test phân quyền và audit

`test/security-and-audit` · mục 7.1 WBS · Phụ thuộc: T9-A1

**Problem**
Phân quyền theo 5 vai trò và audit là yêu cầu bắt buộc nhưng chưa có test tự động; nhiều endpoint kiểm sở hữu ở tầng service nên dễ sót.

**Requirement**
- Test (MockMvc + Testcontainers hoặc DB test) theo ma trận phân quyền `API_DESIGN.md` mục 6: mỗi nhóm API kiểm tra vai trò đúng (2xx), vai trò sai (403), không token (401).
- Test sở hữu: gia sư A không đọc được lớp của gia sư B; học sinh A không đọc được buổi học/quiz của học sinh B.
- Test audit: các hành động `APPROVE_TUTOR`, `APPROVE_PAYMENT`, `PAY_REFUND`, `RESOLVE_COMPLAINT` đều tạo đúng 1 dòng `audit_logs`.
- Thêm vào CI (GitHub Actions) bước chạy test backend.

**Acceptance Criteria**
- Test chạy trong CI và pass; cố ý mở quyền sai một endpoint thì test đỏ.
- Phủ ít nhất 1 endpoint đại diện cho mỗi nhóm trong ma trận phân quyền.
- Test sở hữu có ít nhất 4 ca (gia sư–lớp, học sinh–buổi học, học sinh–quiz, gia sư–phí).
- Manual test: chạy `./mvnw test` local, rồi tạm bỏ `@PreAuthorize` của một endpoint để thấy test fail.

## Thành viên B

### T9-B1 — Dọn dẹp frontend theo Use Case, thay mock bằng API

`refactor/frontend-cleanup` · WBS 6.2, mục 3.4 kế hoạch · Phụ thuộc: các lát cắt tuần 7–8

**Problem**
Frontend còn nhiều trang ngoài use case (`AdminAnalytics`, `AdminLogs`, `SpacedRepetitionSession`, `StudentChat`, `StudentMarketplace`, `StudentOnboarding`, `StudentProgress`, `ParentLearningProgress`, `ParentProgressViewPage`, `Library*`, `ManageLearningPath*`, `ExerciseGenerator`...) và dữ liệu mock còn sót ở các cổng.

**Requirement**
- Xóa file, route, menu của các trang thuộc danh sách mục 3.4 kế hoạch.
- Rà từng cổng (Gia sư, Công khai, Lễ tân/Admin, Học sinh, Kế toán): thay mock còn sót bằng API; liệt kê trang chưa nối vào PR.
- Sidebar hiển thị đúng menu theo vai trò; route cấm trả về trang 403 thân thiện.
- Kiểm tra mọi trang với `frontend/AGENTS.md` (Light/Dark, không emoji, icon `lucide-react`, tiếng Việt).

**Acceptance Criteria**
- `grep` không còn import tới các file đã xóa; `npm run build` và `npm run lint` pass.
- Không còn dữ liệu mock (mảng cứng tên/số liệu) trong `frontend/src/pages` (trừ trang tĩnh Landing/FAQ).
- Truy cập thẳng URL của vai trò khác bị chặn, không lộ nội dung.
- Manual test: đăng nhập từng vai trò, bấm hết các mục menu, không có trang trắng hoặc lỗi console.

### T9-B2 — Test lịch dạy và ghép lớp

`test/matching-and-schedule` · mục 7.1 WBS · Phụ thuộc: T7-A3, T7-B3

**Problem**
Hai nghiệp vụ dễ sai nhất — trùng ca và chuyển trạng thái ghép lớp — mới có vài test lẻ.

**Requirement**
- Integration test luồng ghép lớp: `NEW → OPEN → MATCHED`, hủy, ghép lại.
- Test chốt lịch: trùng ca với lớp `ACTIVE` khác, ca liền kề, rollback khi lỗi giữa chừng.
- Test tính phí nhận lớp tại điểm tích hợp với `finalize-schedule`.

**Acceptance Criteria**
- Tối thiểu 12 ca test, chạy trong CI, pass.
- Có ca kiểm tra `select-tutor` đồng thời hai request: chỉ một thành công, không tạo hai lớp.
- Có ca ghép lại sau `resolve-rematch` cho cùng một đơn.
- Manual test: chạy bộ test, đối chiếu báo cáo với danh sách ca.

### T9-B3 — *(Should-have)* Quản lý nhân sự

`feature/employee-management` · FR-38, FR-39 · API 3.10 · Phụ thuộc: T7-A1 · **Chỉ làm nếu T9-B1 và T9-B2 xong trước 06/11**

**Problem**
Admin chưa thêm/khóa được lễ tân và kế toán.

**Requirement**
- `GET/POST /api/v1/employees`, `GET /api/v1/employees/{id}`, `PATCH /api/v1/employees/{id}/status` (ADMIN).
- Kiểm tra trùng email/SĐT; sinh mã `NV-xxxx`; mật khẩu mặc định + `must_change_password`; audit `CREATE_EMPLOYEE`.
- Frontend: nối `admin/ReceptionistManagement.jsx`.

**Acceptance Criteria**
- Thêm nhân sự trùng email hoặc SĐT trả 400 kèm tên trường trùng.
- Nhân sự mới đăng nhập lần đầu bị ép đổi mật khẩu.
- Chỉ ADMIN gọi được.
- Manual test: UJ-6: Admin thêm lễ tân → lễ tân đăng nhập, đổi mật khẩu → Admin khóa → đăng nhập bị từ chối.

## Thành viên C

### T9-C1 — Thay mock Học sinh bằng API, hoàn thiện lỗi và trạng thái rỗng

`refactor/student-portal-integration` · FR-17 → FR-23 · Phụ thuộc: T8-C3

**Problem**
Sau tuần 8 còn các màn học sinh chưa phủ hết trạng thái lỗi/rỗng và chưa kiểm tra liên thông với dữ liệu thật từ cổng gia sư.

**Requirement**
- Kiểm tra liên thông: buổi do gia sư tạo/đổi trạng thái hiện đúng trên lịch học sinh; quiz do gia sư giao hiện đúng danh sách.
- Bổ sung skeleton, trạng thái rỗng, thông báo lỗi tiếng Việt cho mọi màn học sinh.
- Sửa các lỗi lệch contract phát hiện được (ghi lại trong PR).

**Acceptance Criteria**
- Mọi màn học sinh có trạng thái tải, rỗng và lỗi; không màn nào trắng khi API trả lỗi.
- Đổi trạng thái buổi ở cổng gia sư xuất hiện ở cổng học sinh sau khi tải lại, đúng nhãn tiếng Việt.
- Không còn dữ liệu mock ở `frontend/src/pages/student`.
- Manual test: dùng 2 trình duyệt (gia sư và học sinh) chạy chu trình tạo buổi → nhật ký → giao quiz → làm quiz.

### T9-C2 — Test Elo và quiz

`test/elo-and-quiz` · mục 7.1 WBS · Phụ thuộc: T8-C2

**Problem**
Elo và chấm quiz là nghiệp vụ tính toán, sai số nhỏ cũng làm lệch toàn bộ hồ sơ học sinh; cần test tự động.

**Requirement**
- Unit test `EloCalculator` (đúng/sai, câu dễ/khó, giới hạn tối thiểu của Elo).
- Integration test: làm hết quiz, hết hạn `EXPIRED`, trả lời lặp, hai request song song, `review-list`, view `v_student_skill_stats`.
- Test validator import quiz với ≥ 8 ca.

**Acceptance Criteria**
- Tối thiểu 15 ca test, chạy trong CI, pass.
- Có ca chứng minh tổng `elo_change` của một lần làm bằng chênh lệch `students.elo` trước và sau.
- Có ca quiz quá hạn trả `QUIZ_EXPIRED`.
- Manual test: chạy bộ test, rồi thử đổi hệ số K trong `EloProperties` thấy test Elo fail.

### T9-C3 — *(Should-have)* Hồ sơ cá nhân học sinh và gia sư của tôi

`feature/student-profile` · FR-16, FR-18 · API 3.1, 3.6 · **Chỉ làm nếu T9-C1 và T9-C2 xong trước 06/11**

**Problem**
Học sinh chưa tự sửa được ảnh đại diện, trường, mục tiêu học tập và chưa xem được tiến trình với gia sư của mình.

**Requirement**
- `PUT /api/v1/students/me/profile` (chỉ sửa ảnh, trường, lớp hiện tại, mục tiêu; thông tin định danh và liên hệ chỉ xem), `GET /api/v1/students/me/tutors`.
- Đổi mật khẩu cần mật khẩu cũ (dùng API T7-A1).
- Frontend: nối `SettingsPage.jsx` và màn "Gia sư của tôi".

**Acceptance Criteria**
- Gửi kèm trường định danh (họ tên, SĐT) trong `PUT` bị bỏ qua hoặc trả 400, không bị ghi đè.
- Ảnh đại diện sai định dạng hoặc quá dung lượng bị từ chối.
- Màn "Gia sư của tôi" hiển thị đúng số buổi đã học và lịch cố định.
- Manual test: học sinh sửa mục tiêu học tập, tải ảnh, đổi mật khẩu rồi đăng nhập lại.

---

# TUẦN 10 (09/11 – 15/11): UAT, Đóng gói, Bàn giao

Đóng băng tính năng từ 09/11. Chỉ sửa bug và tài liệu. Kết quả (M5): hệ thống demo ổn định, tài liệu hoàn chỉnh.

### T10-A1 — UAT UJ-5, UJ-6, UJ-7; Docker production và CI *(Thành viên A)*

`fix/uat-reception-admin-accounting` · WBS 7.2, 7.3

**Problem**
Cần chứng minh các hành trình của lễ tân, admin, kế toán chạy trọn trên môi trường đóng gói, và hệ thống khởi động ổn định bằng một lệnh.

**Requirement**
- Chạy UJ-5, UJ-6, UJ-7 trên bản build từ `docker compose` (không dùng chế độ dev), ghi biên bản (bước, kết quả, bug, mức độ).
- Sửa bug mức nghiêm trọng/cao thuộc phạm vi của mình trong tuần.
- Chuẩn hóa `docker-compose` production: biến môi trường qua `.env.example`, không chứa bí mật trong repo, healthcheck cho DB/BE/AI, volume dữ liệu; CI chạy build + test.

**Acceptance Criteria**
- `docker compose up --build` trên máy sạch chạy thành công, các service `healthy` trong 3 phút, migration tự chạy, seed có sẵn.
- Biên bản UAT cho UJ-5/6/7: 100% bước đạt hoặc có bug đã ghi nhận kèm kế hoạch (không còn bug nghiêm trọng).
- CI trên `dev` xanh; không có bí mật nào trong lịch sử commit của các file cấu hình mới.
- Manual test: clone repo mới, copy `.env.example` thành `.env`, chạy `docker compose up --build`, đăng nhập 5 vai trò.

### T10-B1 — UAT UJ-1, UJ-2, UJ-3 và hướng dẫn sử dụng *(Thành viên B)*

`fix/uat-parent-tutor` · WBS 7.2, 7.3

**Problem**
Hành trình phụ huynh (tìm gia sư, đăng ký) và gia sư (nhận lớp, dạy thử, chốt lịch, nhật ký, giao quiz) chưa được chạy xuyên suốt cùng nhau trên dữ liệu thật.

**Requirement**
- Chạy UJ-1, UJ-2, UJ-3 xuyên suốt cùng thành viên A (phía lễ tân) và C (phía học sinh), ghi biên bản.
- Sửa bug thuộc phạm vi cổng Gia sư và Công khai.
- Viết tài liệu hướng dẫn sử dụng cho Phụ huynh, Gia sư (có ảnh chụp màn hình).

**Acceptance Criteria**
- UJ-1, UJ-2, UJ-3 chạy từ đầu đến cuối không phải sửa dữ liệu thủ công trong DB.
- Biên bản không còn bug nghiêm trọng nào của cổng Gia sư và Công khai.
- Tài liệu hướng dẫn mỗi vai trò dưới 5 trang, kèm ảnh chụp từng bước chính.
- Manual test: một người ngoài nhóm làm theo tài liệu hướng dẫn để hoàn thành UJ-1 mà không cần hỏi.

### T10-C1 — UAT UJ-4; tài liệu kỹ thuật, slide và kịch bản demo *(Thành viên C)*

`docs/handover` · WBS 7.2, 7.3

**Problem**
Cần chứng minh hành trình học sinh chạy ổn và bàn giao đầy đủ tài liệu báo cáo, slide, kịch bản demo.

**Requirement**
- Chạy UJ-4 (đăng nhập lần đầu, làm quiz, xem Elo, ôn câu sai), kiểm tra luồng AI sinh quiz và import, ghi biên bản; sửa bug cổng Học sinh và AI Service.
- Cập nhật `docs/project/` cho khớp hệ thống thực tế (ARCHITECTURE, ERD, PRD nếu có thay đổi) và README chạy dự án.
- Slide báo cáo và kịch bản demo 15 phút (thứ tự, tài khoản, dữ liệu mẫu, phương án dự phòng khi AI Service lỗi: dùng import).

**Acceptance Criteria**
- Kịch bản demo chạy thử đủ một lượt, đúng thời gian ≤ 15 phút, có phương án dự phòng khi AI lỗi.
- Tài liệu kỹ thuật khớp code (không còn mô tả chức năng đã bị cắt).
- UJ-4 đạt 100% bước; không còn bug nghiêm trọng ở cổng Học sinh và AI Service.
- Manual test: diễn tập demo với cả nhóm trên máy chạy bằng `docker compose` (không dùng dữ liệu dev riêng).

---

## 4. Phụ thuộc quan trọng và thứ tự merge

```
T7-A1 (V4–V6, Audit, ApiResponse)  ──►  tất cả task còn lại
T7-A2 (có gia sư ACTIVE)           ──►  T7-B1 (tìm kiếm thật), T7-B2
T7-A3 (publish, select/assign)     ──►  T7-B2, T7-B3
T7-B3 (finalize-schedule)          ──►  T7-C2 (createForClass), T8-B1
T7-C1 (V7, EloCalculator, AiClient)──►  T8-B2, T8-B3, T8-C1, T8-C2
T7-C2 (payments)                   ──►  T9-A1, T9-A2
T8-B2 (quiz ASSIGNED)              ──►  T8-C2
```

## 5. Quy tắc cắt giảm khi trễ tiến độ

Theo mục 7 của kế hoạch, ưu tiên cắt theo thứ tự:

1. Task Should-have: T9-B3, T9-C3 (FR-16, FR-18, FR-38, FR-39).
2. `GET /api/v1/accounting/statistics` trong T9-A2 (giữ dashboard).
3. Đính kèm PDF/ảnh trong chat AI (T8-B2, T8-C1) — giữ chat văn bản và import.

Không cắt: Auth, ghép lớp, chốt lịch, phí nhận lớp, quiz + Elo, khiếu nại và hoàn tiền (luồng lõi của M2–M4).

## 6. Các điểm cần nhóm chốt trước khi bắt đầu

1. Đã chốt chuyển `/auth/*`, `/users/*` sang `/api/v1/auth/*`, `/api/v1/users/*`; backend, frontend, test và tài liệu chỉ dùng đường dẫn mới.
2. Xác nhận phân công Kế toán (FR-40 → FR-44) cho A và việc C nhận module Phí nhận lớp trong Tuần 7.
3. Nhà cung cấp LLM và cách cấp API key cho AI Service (ảnh hưởng T7-C1, T8-C1).
4. Quy tắc mật khẩu mặc định cho tài khoản học sinh/nhân sự tạo mới (QĐ-7 của PRD chỉ nêu "theo quy tắc").
