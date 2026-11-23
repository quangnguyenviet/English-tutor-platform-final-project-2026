# API Design — EnglishPath Backend

Tài liệu thiết kế API cho backend (Spring Boot 3.2, Java 21). Bám sát `docs/project/ERD.md`, `docs/project/prd.md` (FR-01 → FR-44) và code hiện có tại `backend/src/main/java/com/mycompany/englishtutor`.

Phiên bản: 1.5 — 23/11/2026 (đồng bộ hiện trạng module, migration V23–V30; bổ sung mục 3.11 MSG và 3.12 gói lưu trữ). Bản 1.4: khiếu nại và hoàn tiền theo mô hình Lớp cần gia sư hợp nhất. Bản 1.3: gộp Đơn ghép lớp vào Lớp cần gia sư.

---

## 1. Hiện trạng code

### 1.1. Đã có

| Phần | Đã làm được | Ghi chú |
| --- | --- | --- |
| Đăng nhập (`auth`) | Đăng nhập JWT, đổi mật khẩu, làm mới/thu hồi/introspect token, đăng ký gia sư, đăng nhập Google (phụ huynh) | Đường dẫn `/api/v1/auth/...` |
| Người dùng (`user`) | Quản lý user theo vai trò; `/users/my-info` cho mọi tài khoản đã đăng nhập | Đường dẫn `/api/v1/users/...` (quản trị chỉ `ADMIN`) |
| Hồ sơ gia sư (`tutor`) | Hồ sơ 5 bước, gửi duyệt, duyệt/từ chối (Lễ tân/Admin), công khai tìm gia sư, bật/tắt nhận lớp, gói lưu trữ | `TutorProfileController`, `AdminTutorController`, `PublicTutorController` |
| Ghép lớp (`matching`) | Lớp cần gia sư, đơn ghép, ứng tuyển, dạy thử, chốt lịch, hủy; lớp đăng tin từ phụ huynh (public) | Staff/tutor/public controller theo vai trò |
| Buổi học (`classroom`) | Lịch cố định + ca thử, ngoại lệ, bài giảng, nhật ký dạy, tài liệu (chặn quota V30) | V16: `lessons` + `teaching_logs` |
| Quiz & Elo (`quiz`) | Soạn quiz (AI chat + import), giao bài, học sinh làm quiz, Elo, ôn tập ngắt quãng (V24–V26) | `EloCalculator`, `AiClient` |
| Phí & Khiếu nại (`payment`, `complaint`) | Nộp/chốt phí, đối chiếu, hoàn tiền; khiếu nại (giữ nguyên, không phải hạng mục hoàn thiện) | FR-34 → FR-37 loại khỏi phạm vi (WBS 6.1) |
| Nhân sự & thông báo (`staff`) | Quản lý học sinh, nhân sự, dashboard, thông báo | FR-38, FR-39 đã làm phần Admin |
| Nhắn tin (`messaging`) | Chat phụ huynh–gia sư qua Rocket.Chat, đề xuất lớp học, tin đăng phụ huynh, Phone Gate | V23, V27–V29, mục 3.11 |
| Database | Bộ migration Flyway **V1–V30** (30 bảng nghiệp vụ + hạ tầng `invalidated_token`) | Xem mục 5 |
| Vai trò | `ADMIN`, `RECEPTIONIST`, `ACCOUNTANT`, `TUTOR`, `STUDENT`, `PARENT` (đăng nhập Google, V23) | Phụ huynh có tài khoản từ MSG |

### 1.2. Ghi chú hiện trạng

- Toàn bộ module trên đã có code và chạy trên dữ liệu thật; các mục 3.x bên dưới là **contract tham chiếu** (mã lỗi, quyền, máy trạng thái), không phải danh sách "cần làm".
- Chạy backend hiện bằng `mvn spring-boot:run` (JDK 21); dịch vụ backend/frontend trong `docker-compose.yml` đang chú thích, chỉ postgres/minio/Rocket.Chat/ai chạy trong compose.
- Endpoint `POST /api/v1/public/class-requests` (FR-03/FR-04, bản 1.4) **đã được thay thế** bởi luồng MSG: phụ huynh đăng tin qua `POST /api/v1/parent/postings` sau khi đăng nhập Google (mục 3.11). Tìm gia sư công khai (`/api/v1/public/tutors`) và xem lớp tuyển (`/api/v1/public/classes`) vẫn giữ nguyên.

### 1.3. Quy ước đã thống nhất

| Vấn đề | Quy ước | Cách xử lý code hiện có |
| --- | --- | --- |
| Đường dẫn | Tất cả API công khai của Spring Boot, bao gồm `auth`, `user` và `tutor`, dùng tiền tố `/api/v1` | Backend, frontend và test đã dùng `/api/v1/auth`, `/api/v1/users`; không duy trì endpoint cũ. Các endpoint nội bộ của AI Service giữ `/ai/...` và `/health` |
| Dạng trả về | Tất cả controller trả `ApiResponse<T>` theo khung `{ code, message, result }` | Auth, user và tutor đã dùng `ApiResponse`; các API mới bắt buộc dùng cùng định dạng (task T7-A1) |

---

## 2. Quy ước chung

### 2.1. Đường dẫn, dạng trả về, mã lỗi

**Đường dẫn:** mọi API công khai mới của Spring Boot bắt đầu bằng `/api/v1/`. AI Service là dịch vụ nội bộ nên giữ `/ai/...` và `/health`.

**Dạng trả về:** mọi API mới đều trả về cùng một khung `{ code, message, result }`.

Thành công (`code = 1000`):

```json
{
  "code": 1000,
  "result": { "id": 12, "name": "Nguyễn Minh Khôi" }
}
```

Lỗi (code khác 1000, kèm mã HTTP tương ứng):

```json
{
  "code": 1012,
  "message": "Hồ sơ đã được gửi duyệt"
}
```

**Cách báo lỗi trong code:** ném `AppException(ErrorCode.XXX)`. `GlobalExceptionHandler` tự đổi thành JSON ở trên.

**Mã lỗi:** mỗi module dùng một dải số riêng để không đặt trùng nhau.

| Dải mã | Dùng cho |
| --- | --- |
| 1000 – 1099 | Đăng nhập, người dùng, hồ sơ gia sư (đã dùng đến 1017) |
| 1100 – 1199 | Cổng công khai, yêu cầu tìm gia sư, ứng tuyển |
| 1200 – 1299 | Lớp học, lịch dạy, buổi học |
| 1300 – 1399 | Phí nhận lớp; riêng 1300 – 1304 đang dùng cho nhân sự và trạng thái tài khoản (giữ nguyên vì nhiều tài liệu đã tham chiếu) |
| 1400 – 1499 | Quiz, Elo |
| 1500 – 1599 | Khiếu nại, hoàn tiền |
| 1600 – 1699 | Nhân sự, thông báo, nhật ký hệ thống (1600 buộc đổi mật khẩu, 1601 giá trị trạng thái sai, 1602 trùng liên hệ khi tạo đồng thời) |

### 2.2. Phân trang

**Tham số gửi lên (query):**

| Tham số | Ý nghĩa | Mặc định |
| --- | --- | --- |
| `page` | Số trang, bắt đầu từ 0 | 0 |
| `size` | Số dòng mỗi trang, tối đa 100 | 20 |
| `sort` | Sắp xếp, ví dụ `createdAt,desc` | tùy API |

**Kết quả trả về:**

```json
{
  "code": 1000,
  "result": {
    "items": [],
    "page": 0,
    "size": 20,
    "totalItems": 135,
    "totalPages": 7
  }
}
```

### 2.3. Phân quyền

Cột "Quyền" ở mục 3 dùng các ký hiệu sau:

| Ký hiệu | Ai được gọi |
| --- | --- |
| `PUBLIC` | Bất kỳ ai, không cần đăng nhập (phải thêm vào `PUBLIC_ENDPOINTS` trong `SecurityConfig`) |
| `AUTH` | Mọi người đã đăng nhập |
| `TUTOR`, `STUDENT`, `RECEPTIONIST`, `ACCOUNTANT`, `ADMIN` | Đúng vai trò đó (`@PreAuthorize("hasRole('...')")`) |
| `RECEPTIONIST, ADMIN` | Một trong hai vai trò (`@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")`) |
| Nhiều vai trò khác, ví dụ `RECEPTIONIST, ADMIN, ACCOUNTANT` | Một trong các vai trò được liệt kê (`hasAnyRole(...)`) |

Ngoài vai trò, còn phải kiểm tra **sở hữu**: gia sư chỉ xem được lớp của mình, học sinh chỉ xem được buổi học và quiz của mình. Việc này làm trong service, nếu sai thì ném lỗi `UNAUTHORIZED`. Trong bảng ở mục 3, "(sở hữu)" nghĩa là phải qua bước kiểm tra này.

### 2.4. Định dạng dữ liệu và quy tắc khác

| Mục | Quy tắc |
| --- | --- |
| Ngày giờ | Thời điểm: `2026-10-21T09:30:00+07:00`. Ngày: `2026-10-21`. Giờ: `09:30` |
| Tiền | Số nguyên, đơn vị VNĐ (ví dụ `640000`) |
| Upload file | Gửi bằng `multipart/form-data`, lưu qua `StorageService` (MinIO) đã có |
| Giới hạn file | Ảnh và biên lai tối đa 5 MB. Tài liệu buổi học tối đa 20 MB (cấu hình ở `FileStorageProperties`) |
| Mã yêu cầu cho phụ huynh | `REQ-{yyyyMMdd}-{id}`, ví dụ `REQ-20261021-57` |
| Audit log | Mọi thao tác ghi quan trọng (duyệt, xác nhận, hoàn tiền...) gọi `AuditLogService.log(action, entityType, entityId, details)` |

### 2.5. Các trạng thái và cách chuyển

Mỗi bảng dưới đây cho biết một đối tượng có những trạng thái nào và từ trạng thái đó được chuyển sang đâu. Chuyển sai quy tắc thì API trả lỗi 409.

**Hồ sơ gia sư** (`tutors.profile_status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `INCOMPLETE` | Chưa đủ thông tin | `PENDING` (gia sư gửi duyệt) |
| `PENDING` | Chờ lễ tân duyệt | `ACTIVE` (duyệt), `REJECTED` (từ chối) |
| `ACTIVE` | Đang hoạt động | `INACTIVE` |
| `INACTIVE` | Ngưng hoạt động | `ACTIVE` |
| `REJECTED` | Bị từ chối | `INCOMPLETE` (gia sư sửa lại) |

**Lớp cần gia sư** (`class_requests.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `NEW` | Chờ xử lý (tin đăng `POSTING` hoặc đơn tại quầy) | `OPEN` (Lễ tân đăng lớp / duyệt tin đăng), `CANCELLED` |
| `OPEN` | Đã đăng, gia sư đang ứng tuyển | `MATCHED` (chọn gia sư ứng tuyển — `select-tutor`, tạo lớp `TRIAL`), `CANCELLED` |
| `MATCHED` | Đã ghép, đã có lớp | `REMATCH` (lớp `TRIAL` dạy thử thất bại, phụ huynh muốn tìm gia sư khác; hoặc giải quyết khiếu nại khi lớp `TRIAL`, lớp `ACTIVE` trong 7 ngày kể từ `active_from`), `CANCELLED` (lớp `ACTIVE`/`COMPLETED` chỉ hủy được trong 7 ngày kể từ `active_from`, quá hạn trả 409 `CLASS_REQUEST_CANCEL_EXPIRED` 1169) |
| `REMATCH` | Đang ghép lại: gia sư cũ bị loại, lớp mở lại để ứng tuyển | `MATCHED` (chọn gia sư ứng tuyển lại), `CANCELLED` |
| `CANCELLED` | Đã hủy | không |

> (V27: bỏ cột `class_requests.requested_tutor_id` — không còn "gia sư chỉ định". Gia sư của lớp là gia sư được `select-tutor` chọn hoặc do phụ huynh đồng ý đề xuất MSG; `MATCHED` chỉ đi từ `OPEN`/`REMATCH`.)

Khi chuyển `REMATCH`: lớp `TRIAL` + payment `NEW` bị hủy, bài giảng chuyển `HIDDEN`, lượt ứng tuyển của gia sư cũ → `TERMINATED`, các lượt `REJECTED` quay về `APPLIED`.

Trạng thái trả về ở API quản lý suy ra từ `class_requests.status` và lớp học mới nhất:

| `status` trả về | Tab | Hiển thị | Dữ liệu |
| --- | --- | --- | --- |
| `NEW` | `new` | Chờ xử lý | `NEW` |
| `OPEN` | `open` | Đã đăng | `OPEN` |
| `TRIAL` | `trial` | Đang dạy thử | `MATCHED` + lớp `TRIAL` |
| `MATCHED` | `matched` | Ghép thành công | `MATCHED` + lớp `ACTIVE`/`COMPLETED` |
| `REMATCH` | `rematch` | Đang ghép lại | `REMATCH` |
| `CANCELLED` | `cancelled` | Đã hủy | `CANCELLED` |

Gia sư và khách không thấy `REMATCH`: API gia sư trả lớp này về `OPEN`, lớp hiển thị như lớp đăng tuyển bình thường (V27: không còn cột `requested_tutor_id`, mọi lớp tuyển đều nhận ứng tuyển bình thường).

Chuyển `REMATCH` do khiếu nại trên lớp `ACTIVE` (chỉ trong 7 ngày kể từ `active_from`, quá hạn trả 409 `COMPLAINT_WINDOW_EXPIRED` 1516): lớp → `CANCELLED`, bài giảng và khoản phí giữ nguyên, các bước còn lại như trên. `OPEN` chỉ đi từ `NEW` (lớp đăng lần đầu), không có đường về `OPEN` khi ghép lại.

**Đơn ứng tuyển** (`class_applications.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `APPLIED` | Gia sư đã ứng tuyển | `SELECTED` (được chọn), `REJECTED` (không được chọn hoặc lớp bị hủy) |
| `SELECTED` | Được chọn | `TERMINATED` (dạy thử thất bại → ghép lại, hủy lớp khi đang có lớp, hoặc giải quyết khiếu nại) |
| `REJECTED` | Không được chọn | `APPLIED` (tự động khi lớp chuyển `REMATCH`). Ngoài trường hợp này không ứng tuyển lại được (409 `APPLICATION_REJECTED` 1162) |
| `TERMINATED` | Đã loại sau dạy thử không thành công, không ứng tuyển lại được (UNIQUE C-01, 409 `APPLICATION_TERMINATED` 1159) | không |

Gia sư muốn rút ứng tuyển thì xóa dòng này, chỉ được khi lớp còn `OPEN`/`REMATCH` và chưa chọn ai.

**Lớp học** (`classes.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `TRIAL` | Đang dạy thử | `ACTIVE` (gia sư chốt lịch cố định), `CANCELLED` |
| `ACTIVE` | Đang học chính thức | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Kết thúc | không |
| `CANCELLED` | Đã hủy | không |

**Bài giảng** (`lessons.status`) — V16, thay `sessions`

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `PUBLISHED` | Đang hiển thị cho học sinh | `HIDDEN` (gia sư ẩn; lớp TRIAL bị hủy → `HIDDEN`) |
| `HIDDEN` | Đã ẩn | `PUBLISHED` (gia sư hiện lại) |

> **V16 — refactor `sessions` → `lessons` + `teaching_logs`:** không còn trạng thái "buổi học"
> (SCHEDULED/IN_PROGRESS/COMPLETED/ABSENT/CANCELLED) hay luồng "vật chất hóa ô ảo". Nội dung buổi
> dạy (kiến thức, dặn dò) tách sang bảng `teaching_logs` (khớp ô ca theo `class_id`+`log_date`+
> `start_time`, UNIQUE C-15'); ca thử lưu trên 6 cột `classes.trial_*` (chỉ khi `status = TRIAL`);
> bảng con đổi tên `lesson_materials`, `quizzes.lesson_id`, `schedule_exceptions`.

**Phí nhận lớp** (`payments.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `NOT_SUBMITTED` | Chưa nộp minh chứng | `SUBMITTED` |
| `SUBMITTED` | Chờ kế toán xác nhận | `APPROVED` (đủ tiền), `RESUBMIT_REQUIRED` (thiếu tiền hoặc biên lai sai) |
| `RESUBMIT_REQUIRED` | Yêu cầu nộp lại | `SUBMITTED` |
| `APPROVED` | Đã xác nhận | không |

**Quiz** (`quizzes.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `DRAFT` | Bản nháp, gia sư còn sửa được | `ASSIGNED` (giao bài) |
| `ASSIGNED` | Đã giao cho học sinh | `COMPLETED` (làm xong), `EXPIRED` (quá hạn) |
| `COMPLETED` | Đã làm xong | không |
| `EXPIRED` | Hết hạn | không |

**Khiếu nại** (`complaints.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `PENDING` | Chờ xử lý | `PROCESSING` (đã gửi yêu cầu hoàn tiền), `RESOLVED` (đã xử lý), `CANCELLED` |
| `PROCESSING` | Chờ kế toán hoàn tiền | `RESOLVED` (kế toán hoàn xong), `PENDING` (kế toán từ chối) |
| `RESOLVED` | Đã xử lý | không |
| `CANCELLED` | Đã hủy | không |

**Yêu cầu hoàn tiền** (`refunds.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `PENDING` | Chờ kế toán xử lý | `PAID` (đã hoàn), `REJECTED` (từ chối) |
| `PAID` | Đã hoàn tiền | không |
| `REJECTED` | Kế toán từ chối | không |

---

## 3. Danh sách endpoint

> Cột **FR** tham chiếu `prd.md`. Cột **Trạng thái**: `Có` = đã có code, `Mới` = cần làm.

### 3.1. Auth & User (module `auth`, `user`)

| Method | Path | Quyền | Mô tả | FR | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| POST | `/api/v1/auth/token` | PUBLIC | Đăng nhập. Từ chối tài khoản `LOCKED`/`INACTIVE` (hướng dẫn liên hệ trung tâm). Response thêm cờ `mustChangePassword` | FR-05 | Có (cần bổ sung) |
| POST | `/api/v1/auth/register-tutor` | PUBLIC | Đăng ký gia sư, tạo `tutors.profile_status = INCOMPLETE` | FR-07 | Có |
| POST | `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/introspect` | PUBLIC | Làm mới / thu hồi / kiểm tra token. `refresh` từ chối tài khoản không `ACTIVE` (403 mã 1304); token của tài khoản đã khóa cũng bị 403 ở mọi API cần đăng nhập | FR-05 | Có |
| POST | `/api/v1/auth/change-password` | AUTH | Body `{ oldPassword, newPassword }`. Bắt buộc ở lần đăng nhập đầu; mật khẩu mới không trùng mặc định, đạt độ mạnh. Lễ tân, kế toán chưa đổi thì mọi API khác trả 403 mã 1600 | FR-06, FR-16 | Mới |
| GET | `/api/v1/users/my-info` | AUTH | Thông tin tài khoản hiện tại kèm role | FR-05 | Có |
| PUT | `/api/v1/students/me/profile` | STUDENT | Sửa ảnh đại diện, trường, lớp hiện tại, mục tiêu học tập (multipart) | FR-16 (S) | Mới |

> Siết quyền các endpoint quản trị `/api/v1/users` (chỉ `ADMIN`); `/api/v1/users/my-info` vẫn dành cho mọi tài khoản đã đăng nhập — xem T7-A1.

### 3.2. Cổng công khai (module `tutor`, `matching`) — Phụ huynh không cần tài khoản

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/public/tutors` | PUBLIC | Tìm gia sư `ACTIVE`. Query: `keyword`, `province`, `district`, `gender`, `teachingMode`, `specialty` (lặp), `gradeGroup`, `page`, `size`. Item: ảnh, họ tên, trường/chuyên ngành, khu vực, chuyên môn, hình thức dạy. **Không công khai học phí.** `size` mặc định 20, tối đa 100 | FR-01 |
| GET | `/api/v1/public/tutors/{tutorId}` | PUBLIC | Hồ sơ công khai của gia sư `ACTIVE`; không `ACTIVE` → 404 `TUTOR_PROFILE_UNAVAILABLE` (1101). Không công khai học phí | FR-02 |
| GET | `/api/v1/public/classes` | PUBLIC | Danh sách lớp đang cần gia sư (trạng thái `OPEN`, `source = POSTING`). Query: `teachingMode`, `gradeGroup`, `sort`, `page`, `size` | FR-03 (MSG) |
| GET | `/api/v1/public/classes/{classRequestId}` | PUBLIC | Chi tiết lớp đang tuyển (ẩn thông tin liên hệ phụ huynh) | FR-03 (MSG) |

> **Đã thay thế (FR-03, FR-04 gốc):** endpoint `POST /api/v1/public/class-requests` (để lại SĐT để trung tâm gọi lại) **không còn** — thay bằng luồng MSG (V27): phụ huynh **đăng nhập Google** rồi đăng tin qua `POST /api/v1/parent/postings` (mục 3.11). Lễ tân duyệt tin đăng trong mục "Lớp cần gia sư" (tab `NEW`).

### 3.3. Hồ sơ gia sư (module `tutor`)

| Method | Path | Quyền | Mô tả | FR | Trạng thái |
| --- | --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/profile` | TUTOR | Lấy hồ sơ của tôi | FR-07 | Có |
| POST | `/api/v1/tutors/me/profile` | TUTOR | Tạo/cập nhật hồ sơ 5 bước (multipart: avatar, credentialsFiles). Khóa khi `PENDING`/`ACTIVE` | FR-07 | Có |
| POST | `/api/v1/tutors/me/profile/submit` | TUTOR | Gửi duyệt: `INCOMPLETE/REJECTED → PENDING` | FR-07 | Có |
| GET | `/api/v1/tutors` | RECEPTIONIST, ADMIN | Quản lý gia sư. Query: `status` (`PENDING`/`ACTIVE`/`INACTIVE`/`REJECTED`), `keyword`, phân trang | FR-31, FR-32 | Mới |
| GET | `/api/v1/tutors/{id}` | RECEPTIONIST, ADMIN | Chi tiết đầy đủ (chứng chỉ kèm link ảnh ký sẵn, bảng giá, lịch rảnh…) | FR-31, FR-32 | Mới |
| POST | `/api/v1/tutors/{id}/approve` | RECEPTIONIST, ADMIN | `PENDING → ACTIVE`, thông báo gia sư, ghi audit `APPROVE_TUTOR` | FR-31 | Mới |
| POST | `/api/v1/tutors/{id}/reject` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. `PENDING → REJECTED`, thông báo gia sư, audit `REJECT_TUTOR` | FR-31 | Mới |
| PATCH | `/api/v1/tutors/{id}/status` | RECEPTIONIST, ADMIN | Body `{ status: ACTIVE\|INACTIVE, note }`. Đổi trạng thái hoạt động | FR-32 | Mới |
| PATCH | `/api/v1/tutors/{id}` | RECEPTIONIST, ADMIN | Sửa thông tin hồ sơ (có xác nhận ở UI) | FR-32 | Mới |

### 3.4. Lớp cần gia sư & Ứng tuyển (module `matching`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/class-requests` | RECEPTIONIST, ADMIN | Danh sách. Query: `tab` (`all`/`new`/`open`/`trial`/`matched`/`rematch`/`cancelled`), `keyword` (phụ huynh, SĐT, học sinh, gia sư, yêu cầu lớp, mã `REQ-…`, mã `LOP-ENG-…`), `sort` (`newest`, `oldest`, `applications`), `page`, `size`. Mỗi dòng có `tutorId`, `lastTutorName`, `cancelDeadline`, `cancelDaysLeft`, `cancellable` | FR-25 |
| GET | `/api/v1/class-requests/counts` | RECEPTIONIST, ADMIN | Số lượng theo tab và `total` | FR-25 |
| GET | `/api/v1/class-requests/{id}` | RECEPTIONIST, ADMIN | Chi tiết kèm phụ huynh, học sinh, gia sư, danh sách ứng tuyển. `initialPassword` chỉ có khi học sinh chưa đổi mật khẩu mặc định | FR-25, FR-26 |
| POST | `/api/v1/class-requests/parent-check` | RECEPTIONIST, ADMIN | Body `{ phone, parentName }`. Kiểm tra trong lúc nhập form, trả `{ exists, nameMatches, parentName }` | FR-25 |
| POST | `/api/v1/class-requests` | RECEPTIONIST, ADMIN | Tạo lớp tại quầy, luôn ở `NEW`. Body: họ tên + SĐT phụ huynh, học sinh (tên, khối, trường, mục tiêu), `classRequirement`, `sessionsPerWeek`, `teachingMode` (ONLINE/AT_HOME), `pricePerSession` (≥ 10.000), `preferredSchedule?`, `tutorRequirement?`, `feePercentage` (mặc định 40, 0–50, V10); V28: `address?`, `genderRequirement?` (MALE/FEMALE/ANY), `durationType?` (SHORT_TERM/REGULAR). Thông tin học sinh lưu ở `class_requests.student_*`, chưa tạo tài khoản. (V27: **không còn `tutorId`** — gia sư của lớp là gia sư được `select-tutor` chọn hoặc từ đề xuất MSG) | FR-25 |
| PUT | `/api/v1/class-requests/{id}` | RECEPTIONIST, ADMIN | Sửa một phần, trường nào gửi thì cập nhật. `NEW`: mọi trường. `REMATCH`: chỉ `pricePerSession`, `classRequirement`, `learningGoal`, `tutorRequirement` (trường khác → 409 `CLASS_REQUEST_FIELD_LOCKED` 1165) và báo cho gia sư đang ứng tuyển. Trạng thái khác → 409 `CLASS_REQUEST_NOT_EDITABLE` 1164 | FR-28 |
| POST | `/api/v1/class-requests/{id}/publish` | RECEPTIONIST, ADMIN | `NEW → OPEN`, hiện trên trang gia sư và trang công khai. Yêu cầu đủ họ tên học sinh, `class_requirement`, `teaching_mode`, `price_per_session` (thiếu → 409 `CLASS_REQUEST_NOT_READY` 1113). Tin đăng `source = POSTING` do Lễ tân duyệt ở mục 3.11 (`/staff/chat/postings/{id}/approve`) | FR-25 |
| POST | `/api/v1/class-requests/{id}/select-tutor` | RECEPTIONIST, ADMIN | Body `{ applicationId }`. Lớp `OPEN`/`REMATCH` chưa có gia sư (khác → 409 `CLASS_REQUEST_NOT_SELECTABLE` 1161). Lượt được chọn `SELECTED`, lượt `APPLIED` khác `REJECTED`; tạo lớp `TRIAL` + payment `NEW`, tạo tài khoản học sinh nếu chưa có. Một transaction (gọi chung `startTrial`) | FR-26 |
| GET | `/api/v1/class-requests/{id}/applications` | RECEPTIONIST, ADMIN | Danh sách gia sư ứng tuyển (tên, thời gian, lời nhắn) | FR-26 |
| POST | `/api/v1/class-requests/{id}/complete-match` | RECEPTIONIST, ADMIN | Body tùy chọn `{ sessionsPerWeek, pricePerSession, feePercentage }`. Lớp `TRIAL → ACTIVE`, ghi `active_from`, kích hoạt khoản phí. Khác `TRIAL` → 409 `MATCH_REQUEST_NOT_TRIAL` 1111 | FR-29 |
| POST | `/api/v1/class-requests/{id}/rematch` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. Dạy thử không thành công, phụ huynh muốn tìm gia sư khác: lớp `MATCHED` + lớp học mới nhất `TRIAL` (khác → 409 `MATCH_REQUEST_NOT_TRIAL` 1111) → `REMATCH`. Hủy lớp `TRIAL` và payment `NEW`, gia sư cũ `TERMINATED`, lượt `REJECTED` về `APPLIED`, thông báo các bên. Một transaction | FR-30 |
| POST | `/api/v1/class-requests/{id}/cancel` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. → `CANCELLED` ở mọi trạng thái; đóng lớp học nếu có, loại gia sư đang dạy, từ chối lượt `APPLIED`, thông báo gia sư, học sinh. Lớp đã ghép thành công quá 7 ngày → 409 `CLASS_REQUEST_CANCEL_EXPIRED` 1169. Đã hủy → 409 `CLASS_REQUEST_ALREADY_CANCELLED` 1110. Hủy lớp dạy thử tạo từ đề xuất MSG dùng `POST /api/v1/staff/chat/classes/{classId}/cancel-trial` (mục 3.11) | FR-27, FR-30 |
| GET | `/api/v1/tutors/me/open-requests` | TUTOR | Lớp đang tuyển, kèm cờ `applied`. Gồm `OPEN` và `REMATCH` chưa được chọn gia sư; cả hai đều trả `requestStatus = OPEN` (trạng thái thật `REMATCH` bị che) | FR-08 |
| GET | `/api/v1/tutors/me/open-requests/{id}` | TUTOR | Chi tiết lớp tuyển (ẩn SĐT phụ huynh) | FR-08 |
| POST | `/api/v1/tutors/me/open-requests/{id}/apply` | TUTOR | Body `{ message }` (tùy chọn). 409 nếu đã ứng tuyển (`CLASS_ALREADY_APPLIED`), lớp không còn tuyển (`CLASS_REQUEST_NOT_OPEN`), gia sư đang tắt nhận lớp (`TUTOR_NOT_OPEN_TO_TEACHING` 1160), hoặc lượt cũ đã `TERMINATED`/`REJECTED` | FR-08 |
| DELETE | `/api/v1/tutors/me/applications/{id}` | TUTOR | Rút ứng tuyển khi lớp còn tuyển và chưa chọn gia sư | FR-08 |
| PATCH | `/api/v1/tutors/me/open-to-teaching` | TUTOR | Body `{ open }`. Bật/tắt `tutors.is_open_to_teaching`. Tắt: `open-requests` trả rỗng, apply → 409 `TUTOR_NOT_OPEN_TO_TEACHING` (1160); lớp đang dạy giữ nguyên. Trả hồ sơ (có `openToTeaching`) | FR-08 |
| GET | `/api/v1/tutors/me/applications` | TUTOR | Lịch sử ứng tuyển và kết quả | FR-08 |

### 3.5. Lớp học, Lịch dạy thử & Lịch cố định (module `classroom`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/classes` | TUTOR | Lớp của tôi. Query: `status` | FR-09, FR-10 |
| GET | `/api/v1/classes/{id}` | TUTOR (sở hữu), RECEPTIONIST, ADMIN, STUDENT (sở hữu) | Chi tiết lớp: học sinh, hình thức, học phí, `class_schedules`, ca thử `trial_*`, các ngày có log | FR-09 |
| PUT | `/api/v1/classes/{id}/trial` | TUTOR | V16: ca thử lưu trên 6 cột `classes.trial_*` (thay `sessions` `is_trial`). Body `{ sessionDate, startTime, endTime, teachingMode, meetingUrl?, location? }` (upsert). Online bắt buộc `meetingUrl`, tại nhà bắt buộc `location`. Chỉ khi lớp `TRIAL`. 409 `SCHEDULE_CONFLICT` nếu trùng ca của gia sư | FR-09 |
| POST | `/api/v1/classes/{id}/finalize-schedule` | TUTOR | V16: Body `{ schedules: [{ dayOfWeek, startTime, endTime, validFrom, validTo? }] }` (mỗi ca có khoảng hiệu lực riêng). Kiểm tra trùng với lớp `ACTIVE` khác; lưu `class_schedules`; lớp → `ACTIVE`; tạo `payments` (`NOT_SUBMITTED`). **Không còn sinh session**. Một transaction | FR-10 |
| PUT | `/api/v1/classes/{id}/schedules` | TUTOR | V16: cập nhật (ghi đè) lịch cố định của lớp `ACTIVE`. Cùng shape body `finalize-schedule`. Xóa `schedule_exceptions` cũ theo ca bị gỡ | FR-10 |
| POST | `/api/v1/classes/{id}/exceptions` | TUTOR | V16 (bảng `schedule_exceptions`), V17 (bỏ 3 cột override + loại `MODIFIED`): ghi overlay cho 1 ô ca — `{ scheduleId, exceptionDate, exceptionType: CANCELLED\|RESCHEDULED, newDate?, newStartTime?, newEndTime?, reason? }`. `RESCHEDULED` chỉ đổi ngày + khung giờ; hình thức/link/địa chỉ giữ theo ca gốc của lớp. Ô đã có log chặn `CANCELLED`/`RESCHEDULED` (R-LOG) | FR-11 |
| DELETE | `/api/v1/classes/{id}/exceptions/{scheduleId}/{exceptionDate}` | TUTOR | V16: gỡ ngoại lệ của 1 ô | FR-11 |

Công thức `payments.amount`: `fee_percentage × sessions_per_week × 4 × price_per_session`, làm tròn nghìn đồng.

### 3.6. Lịch dạy, Nhật ký & Bài giảng (module `classroom`, V16)

> **V16 refactor:** nhóm 3.6 cũ (`/sessions`) tách thành 2 luồng: (1) **Lattice + nhật ký dạy học**
> (ô ca trên lịch — ghi `teaching_logs`, overlay `schedule_exceptions`), (2) **Bài giảng `lessons`**
> (tab riêng — driver nhúng, không mang ngày/giờ). Không còn endpoint tạo/đổi trạng thái "buổi học".

**Lattice & nhật ký dạy học (đọc đa vai trò — `ClassOccurrenceController`):**

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/classes/{id}/schedule?weekStart=` | TUTOR, STUDENT (sở hữu), RECEPTIONIST, ADMIN | Lattice tuần: ô ca cố định (`class_schedules`) + overlay `schedule_exceptions` + nhật ký `teaching_logs` + ca thử (`classes.trial_*`). Item kèm `log` (TeachingLogMini) nếu ô đã có log | FR-11, FR-19 |
| GET | `/api/v1/classes/{id}/logs?logDate=&startTime=` | TUTOR, STUDENT (sở hữu), RECEPTIONIST, ADMIN | Đọc nhật ký của 1 ô ca (modal trên lưới); trống nếu chưa ghi | FR-12 |
| POST | `/api/v1/classes/{id}/logs` | TUTOR | Ghi/sửa nhật ký (upsert theo `class_id`+`log_date`+`start_time`, C-15'). Body `{ logDate, startTime, endTime, knowledge?, homework? }`. Log đầu (firstPublish) mới thông báo học sinh; ô có exception `CANCELLED`/`RESCHEDULED` bị chặn (R-LOG) | FR-12 |
| DELETE | `/api/v1/classes/{id}/logs/{logId}` | TUTOR | Xóa 1 nhật ký dạy học | FR-12 |

**Bài giảng `lessons` (viết — `TutorClassController`, chỉ TUTOR):**

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/classes/{id}/lessons` | TUTOR | Tạo bài giảng (driver nhúng, không lên lịch). Body `{ title? }` (mặc định "Bài giảng") | FR-12 |
| GET | `/api/v1/classes/{id}/lessons` | TUTOR | Danh sách bài giảng của lớp (ROW_NUMBER theo thời gian tạo), kèm số tài liệu + số quiz | FR-12 |
| GET | `/api/v1/lessons/{id}` | TUTOR | Chi tiết bài giảng: tiêu đề, trạng thái, tài liệu, số quiz | FR-12 |
| PUT | `/api/v1/lessons/{id}` | TUTOR | Sửa tiêu đề và/hoặc ẩn/hiện (`PUBLISHED` \| `HIDDEN`) | FR-12 |
| DELETE | `/api/v1/lessons/{id}` | TUTOR | Xóa bài giảng (CASCADE tự xóa tài liệu + quiz) | FR-12 |
| POST | `/api/v1/lessons/{id}/materials` | TUTOR | Upload tài liệu bài giảng (`.pdf`, `.docx`, ảnh, âm thanh), kiểm tra loại + dung lượng (≤ 20 MB) | FR-12 |
| DELETE | `/api/v1/lessons/{id}/materials/{materialId}` | TUTOR | Gỡ tài liệu | FR-12 |
| GET | `/api/v1/materials/{id}/access-url` | TUTOR, STUDENT (sở hữu) | Link tải an toàn (ký sẵn 10 phút) cho tài liệu bài giảng; cờ `previewable`. Tệp đã gỡ → `MATERIAL_UNAVAILABLE` | FR-21 |

**Cổng học sinh (đọc theo log/bài giảng — `StudentPortalController`):**

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/students/me/schedule` | STUDENT | Lịch tuần (T2–CN) đọc từ `class_schedules` + `teaching_logs` + `schedule_exceptions` + ca thử `trial_*`. Query `weekStart` | FR-19 |
| GET | `/api/v1/students/me/sessions` | STUDENT | Lịch sử buổi học (giờ đây = danh sách `teaching_logs`), lọc theo gia sư/lớp | FR-19 |
| GET | `/api/v1/students/me/sessions/{logId}/materials` | STUDENT | Tài liệu kèm buổi (từ các bài giảng `PUBLISHED` của lớp) | FR-20 |
| GET | `/api/v1/students/me/tutors` | STUDENT | Gia sư đang dạy kèm tiến trình (môn, ngày bắt đầu, lịch cố định, số bài giảng `PUBLISHED`) | FR-18 (S) |
| GET | `/api/v1/students/me/dashboard` | STUDENT | Gộp: thông tin HS/gia sư, buổi sắp tới (ô ca `class_schedules`/`trial_*` trong hiệu lực gần nhất) và gần nhất, bài cần làm, Elo, thông báo. Mỗi khu vực lỗi độc lập | FR-17 |

### 3.7. Quiz, Elo & AI (module `quiz`; AI Service là service riêng)

**Backend (`quiz`):**

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/skills` | AUTH | Danh mục kỹ năng (seed) | FR-13 |
| GET | `/api/v1/classes/{classId}/skill-profile` | TUTOR (sở hữu) | Bảng thống kê hồ sơ học sinh (SKP) từ view `v_student_skill_stats`, sắp theo `error_rate` | FR-13 |
| POST | `/api/v1/lessons/{lessonId}/quizzes/ai-chat` | TUTOR | Body JSON `{ message, quizId?, recentMessages[] (tối đa 10 tin {role, content}), pendingQuestions[]? (trọn bộ câu đang trên form) }`. Backend xác thực quyền sở hữu bài giảng (lessons → classes.tutor_id), gom ngữ cảnh ẩn danh (mã HS + cấp + mục tiêu + SKP từ view `v_student_skill_stats` + catalog kỹ năng + bản nháp câu hỏi), gọi AI Service, trả `{ reply, draftQuestions[] }` (shape form: `questionText, optionA–D, correctAnswer, explanation, cefrLevel, skillCode`). Timeout 60 s, retry 1 lần, lỗi → `AI_SERVICE_UNAVAILABLE` (1416). Chat stateless: lịch sử do frontend gửi kèm (chưa lưu MongoDB `ai_chat_messages` — lát cắt sau), đính kèm file (PDF/ảnh) chưa có ở lần này | FR-13 |
| POST | `/api/v1/lessons/{lessonId}/quizzes` | TUTOR | V16: tạo quiz `DRAFT` gắn **bài giảng** (scope theo lesson, không theo buổi). Body thêm trường tuỳ chọn `source` (`AI_DIRECT` — gộp câu do trợ lý AI đề xuất / `IMPORTED` — nhập tay, mặc định) | FR-13 |
| GET | `/api/v1/lessons/{lessonId}/quizzes` | TUTOR | V16: danh sách quiz của bài giảng (card "Quiz bài giảng") | FR-13 |
| GET | `/api/v1/quizzes/import-prompt` | TUTOR | Query `classId`. Trả prompt mẫu (nhúng kỹ năng yếu và chuẩn JSON CEFR) | FR-14 |
| PUT | `/api/v1/quizzes/{id}` | TUTOR | Sửa tiêu đề + ghi đè câu hỏi khi còn `DRAFT` | FR-13 |
| POST | `/api/v1/quizzes/{id}/assign` | TUTOR | Body `{ deadline }`. `DRAFT → ASSIGNED`, thông báo học sinh | FR-13 |
| GET | `/api/v1/quizzes/{id}` | TUTOR (sở hữu), STUDENT (sở hữu, ẩn đáp án chưa trả lời) | Chi tiết quiz | FR-13, FR-22 |
| GET | `/api/v1/students/me/quizzes` | STUDENT | Bài cần làm. Query `status` | FR-17, FR-22 |
| POST | `/api/v1/quizzes/{id}/attempts/start` | STUDENT | Bắt đầu hoặc làm tiếp: trả câu chưa trả lời kế tiếp và tiến độ. Quá `deadline` → `QUIZ_EXPIRED` | FR-22 |
| POST | `/api/v1/quizzes/{id}/questions/{questionId}/answer` | STUDENT | Body `{ selectedAnswer }`. Chấm ngay, trả `{ isCorrect, correctAnswer, explanation, eloBefore, eloAfter, eloChange }`. UNIQUE (student, question) → gọi lại trả lại kết quả cũ (idempotent). Cập nhật `students.elo`. Hoàn tất → quiz `COMPLETED` | FR-22 |
| GET | `/api/v1/quizzes/{id}/result` | STUDENT, TUTOR | Tổng kết: số đúng/sai, tổng Elo thay đổi | FR-22 |
| GET | `/api/v1/students/me/review-list` | STUDENT | Danh sách ôn tập: các câu `is_correct = false` | FR-22 |
| GET | `/api/v1/students/me/reviews/due` | STUDENT | Các câu sai đã đến hạn; nếu đã trả lời nhưng chưa đánh giá thì trả kèm feedback để tiếp tục sau reload | FR-22 |
| GET | `/api/v1/students/me/reviews/stats` | STUDENT | Số câu đến hạn, số lượt đã ôn hôm nay và thời điểm ôn kế tiếp | FR-22 |
| POST | `/api/v1/students/me/reviews/{questionId}/answer` | STUDENT | Trả lời lại câu sai, không cập nhật kết quả quiz/Elo; trả đáp án đúng và giải thích | FR-22 |
| POST | `/api/v1/students/me/reviews/{questionId}/rate` | STUDENT | Body `{ reviewAttemptId, rating }`, `rating` là `AGAIN/HARD/GOOD/EASY`; server lên lịch lần lượt `+1m/+6m/+10m/+5d` | FR-22 |

Lịch ôn dùng giờ server làm nguồn sự thật. Mỗi câu chỉ có tối đa một lượt đã trả lời nhưng chưa đánh giá;
hai endpoint POST đều an toàn khi client gửi lặp và lịch sử từng lượt được giữ trong
`spaced_repetition_reviews`.

> **V16:** quiz gắn **bài giảng** (`quizzes.lesson_id`) thay buổi học — học sinh xem quiz theo lớp/bài
> giảng, không còn "thuộc buổi" (D-03). Đường dẫn quiz đổi từ `/sessions/{sessionId}/quizzes` sang
> `/lessons/{lessonId}/quizzes`. Lát cắt hiện tại là nhập **thủ công** (chưa có AI chat / import
> file — mục AI Service bên dưới giữ cho giai đoạn sau).

**Elo:** công thức chuẩn `E = 1 / (1 + 10^((Rq − Rs) / 400))`, `Rs' = Rs + K × (S − E)`, K = 32. `Rq` (độ khó câu hỏi) quy từ CEFR: A1=800, A2=1000, B1=1200, B2=1400, C1=1600, C2=1800. Elo khởi điểm của học sinh: 1000. Hằng số đặt trong `EloProperties`.

**AI Service (FastAPI, chỉ backend gọi — không public ra frontend; đường dẫn theo AD-2 trong ARCHITECTURE.md):**

| Method | Path | Mô tả | Trạng thái |
| --- | --- | --- | --- |
| POST | `/api/v1/ai/quiz/chat` | Input `{ student_code, grade?, learning_goal?, skill_profile[], skill_catalog[], current_draft?, recent_messages[], message, cefr_hint? }` → `{ reply, questions[] }` (mỗi câu theo `QuizDraftSchema`: `content, options{A,B,C,D}, correct, explanation, cefr, skill`). Provider: `openai` (LLM_API_KEY) hoặc `mock` (key trống — không tốn token) | Đã cài (FR-13) |
| POST | `/api/v1/ai/quiz/validate` | Kiểm định JSON gia sư dán từ AI ngoài → `{ valid, errors[] }` (dự phòng nếu validate ở Python) | Chưa (FR-14) |
| POST | `/api/v1/ai/moderate` | Kiểm duyệt nội dung đầu vào/đầu ra (AD-2) | Chưa |
| GET | `/health` | Kiểm tra sức khỏe | Đã có |

### 3.8. Phí nhận lớp (module `payment`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/payments` | TUTOR | Query `tab` (`NOT_SUBMITTED`/`RESUBMIT_REQUIRED`/`SUBMITTED`/`APPROVED`) | FR-15 |
| POST | `/api/v1/payments/{id}/proof` | TUTOR (sở hữu), RECEPTIONIST, ADMIN | Nộp biên lai (multipart `file` jpg/png/pdf ≤ 5 MB, sai → `FILE_INVALID_TYPE`/`FILE_TOO_LARGE`; `paymentMethod` mặc định `BANK_TRANSFER`, gia sư chỉ được `BANK_TRANSFER`). Lễ tân/Admin nộp thay gia sư hoặc phụ huynh, audit có `onBehalfOf`. Chỉ khi `NOT_SUBMITTED`/`RESUBMIT_REQUIRED` → `SUBMITTED`; nộp lại thì xóa kết quả đối chiếu cũ | FR-15, FR-33 |
| GET | `/api/v1/payments` | RECEPTIONIST, ADMIN, ACCOUNTANT | Tìm theo mã lớp, tên gia sư, SĐT phụ huynh, `status`, `month`; phân trang | FR-33, FR-41 |
| GET | `/api/v1/payments/{id}` | RECEPTIONIST, ADMIN, ACCOUNTANT, TUTOR (sở hữu) | Chi tiết kèm cách tính | FR-41 |
| POST | `/api/v1/payments/{id}/collect-proof` | RECEPTIONIST, ADMIN | Lễ tân thu hộ tại quầy (`CASH` hoặc `BANK_TRANSFER`, ảnh phiếu thu). → `SUBMITTED`, `uploaded_by` = lễ tân, audit `COLLECT_PAYMENT_PROOF` | FR-33 |
| PATCH | `/api/v1/payments/{id}/fee-percentage` | RECEPTIONIST, ADMIN | Body `{ feePercentage }` ∈ [0, 50] (mặc định 40, ngoài khoảng → 400 `FEE_PERCENTAGE_OUT_OF_RANGE`); chỉ khi `NOT_SUBMITTED` (sai trạng thái → 409); tính lại `amount`; audit `UPDATE_FEE_RATE`. Kế toán không được chỉnh | FR-41 |
| POST | `/api/v1/payments/{id}/approve` | ACCOUNTANT, ADMIN | Body `{ receivedAmount }`. `receivedAmount ≥ amount` → `APPROVED`, ghi `reviewed_by/at`, thông báo, audit; thiếu → `RESUBMIT_REQUIRED` + `rejectReason`. **`reviewed_by ≠ uploaded_by`** (lỗi `PAYMENT_SAME_ACTOR`, áp dụng cả Admin) | FR-42 |
| POST | `/api/v1/payments/{id}/request-resubmit` | ACCOUNTANT, ADMIN | Body `{ reason }`. Từ `SUBMITTED` → `RESUBMIT_REQUIRED`; cũng áp dụng `PAYMENT_SAME_ACTOR` | FR-42 |

`PaymentService.createForClass(classId)` (gọi trong cùng transaction chốt lịch, T7-B3): tạo khoản `NOT_SUBMITTED`, `TUTOR`, tỷ lệ mặc định 40% (`app.payment.default-fee-percentage`), idempotent theo lớp. Khoảng chỉnh tỷ lệ cấu hình ở `app.payment.min/max-fee-percentage` (0–50). ADMIN gọi được mọi endpoint của mục này.

Khi ghép lớp thành công (`class_requests` chuyển `MATCHED`) → gia sư xem được SĐT phụ huynh (các API trả về `parentPhone` đầy đủ, không che theo trạng thái phí). Khi phí `APPROVED` → kế toán ghi audit log + thông báo; không có cờ `contactUnlocked`.

### 3.9. Khiếu nại & Hoàn tiền (module `complaint`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/complaints` | RECEPTIONIST, ADMIN, ACCOUNTANT | Query `status`, `type`, `keyword`, phân trang | FR-36 |
| GET | `/api/v1/complaints/counts` | RECEPTIONIST, ADMIN, ACCOUNTANT | Số đơn theo trạng thái `{ PENDING, PROCESSING, RESOLVED, CANCELLED, TOTAL }`, dùng cho badge menu và Dashboard | FR-24, FR-36 |
| GET | `/api/v1/complaints/{id}` | RECEPTIONIST, ADMIN, ACCOUNTANT | Chi tiết kèm lớp cần gia sư bị khiếu nại (trạng thái hiển thị, gia sư, `cancelDeadline`, cờ `alreadyHandled`), `requestOutcome`, yêu cầu hoàn tiền gần nhất, tệp đính kèm và `refundablePayments` (khoản `APPROVED` của lớp: `receivedAmount`, `refundedAmount`, `remainingAmount`) | FR-36 |
| POST | `/api/v1/complaints` | RECEPTIONIST, ADMIN | Body `{ complainantName, complainantPhone, complainantRole, complaintType, classRequestId, complaintContent }` → `PENDING`, chưa đổi trạng thái lớp. Đối tượng luôn là một lớp cần gia sư; hệ thống tự ghi `class_id` là lớp học `TRIAL`/`ACTIVE` hiện tại nếu có. `NON_REFUND`: lớp không được `CANCELLED` (409 `COMPLAINT_TARGET_NOT_PROCESSABLE` 1503); lớp đã ghép thành công quá 7 ngày kể từ `active_from` → 409 `COMPLAINT_WINDOW_EXPIRED` 1516. `REFUND`: lớp học mới nhất phải `ONLINE` (khác → 409 `REFUND_CLASS_NOT_ONLINE` 1515), nhận cả lớp đã hủy vì phụ huynh thường đòi hoàn tiền sau khi lớp dừng | FR-35 |
| PUT | `/api/v1/complaints/{id}` | RECEPTIONIST, ADMIN | Sửa họ tên, SĐT, vai trò, nội dung khi `PENDING`. Không đổi loại, đối tượng, trạng thái | FR-36 |
| POST | `/api/v1/complaints/{id}/resolve` | RECEPTIONIST, ADMIN | Chỉ đơn `NON_REFUND`, `PENDING`. Multipart: `resolution`, `requestOutcome`, ảnh minh chứng (nhiều tệp). `requestOutcome`: `CANCELLED` (Hủy lớp) hoặc `REMATCH` (Ghép lại). Lớp chưa có gia sư (`NEW`/`OPEN`/`REMATCH`) chỉ có Hủy lớp, bỏ trống thì hiểu là `CANCELLED`; gửi `REMATCH` → 409 `COMPLAINT_TARGET_NOT_PROCESSABLE` 1503. Lớp đang dạy thử hoặc ghép thành công bắt buộc chọn (thiếu → 400 `COMPLAINT_OUTCOME_REQUIRED` 1513). `CANCELLED`: như `POST /class-requests/{id}/cancel`. `REMATCH`: lớp `TRIAL`, hoặc `ACTIVE` trong 7 ngày, → `CANCELLED`, gia sư cũ `TERMINATED`, lớp cần gia sư → `REMATCH`. Quá 7 ngày → 409 `COMPLAINT_WINDOW_EXPIRED` 1516. **Lớp đã được xử lý thủ công trước đó** (đã ở đúng kết quả được chọn): không thao tác lại, bắt buộc đính kèm ít nhất 1 tệp minh chứng đã xử lý (thiếu → 400 `COMPLAINT_EVIDENCE_REQUIRED` 1514), không áp hạn 7 ngày. Khiếu nại → `RESOLVED`, lưu `request_outcome`, audit `RESOLVE_COMPLAINT` | FR-37 |
| POST | `/api/v1/complaints/{id}/refund-requests` | RECEPTIONIST, ADMIN | Body `{ paymentId, requestedAmount, recipientName, bankName, bankAccountNumber }`. Chỉ đơn `REFUND`. `paymentId` phải `APPROVED` và cùng lớp; `requestedAmount` không vượt số còn lại; tối đa 1 yêu cầu `PENDING`/`PAID`. Complaint → `PROCESSING`, audit `REQUEST_REFUND` | FR-37 |
| POST | `/api/v1/complaints/{id}/cancel` | RECEPTIONIST, ADMIN | Hủy khiếu nại khi `PENDING`, đối tượng giữ nguyên | FR-36 |
| GET | `/api/v1/refunds` | ACCOUNTANT, ADMIN | Query `tab` (`PENDING`/`PAID`/`REJECTED`) | FR-43 |
| GET | `/api/v1/refunds/counts` | ACCOUNTANT, ADMIN | Số yêu cầu theo trạng thái `{ PENDING, PAID, REJECTED }` | FR-43 |
| GET | `/api/v1/refunds/{id}` | ACCOUNTANT, ADMIN | Kèm số đã thu / đã hoàn / còn lại | FR-43 |
| POST | `/api/v1/refunds/{id}/pay` | ACCOUNTANT, ADMIN | Multipart `approvedAmount`, biên lai. `approvedAmount ≤ min(requested_amount, received_amount − đã hoàn)`. → `PAID`, complaint → `RESOLVED`, audit `PAY_REFUND`. **`processed_by ≠ requested_by`** | FR-43 |
| POST | `/api/v1/refunds/{id}/reject` | ACCOUNTANT, ADMIN | Body `{ reason }`. → `REJECTED`, complaint → `PENDING` | FR-43 |
| GET | `/api/v1/accounting/dashboard` | ACCOUNTANT | Thẻ chỉ số: phí chờ xác nhận, hoàn tiền chờ, thu/hoàn trong tháng, công nợ | FR-40 |
| GET | `/api/v1/accounting/statistics` | ACCOUNTANT | Query `from`, `to`, `groupBy` (`month`\|`payerType`\|`tutor`\|`teachingMode`). Công thức ở `ERD.md` mục 2.6 | FR-44 |

Mã lỗi nhóm 1500: `COMPLAINT_NOT_FOUND` 1500, `COMPLAINT_INVALID_STATE` 1501, `COMPLAINT_TYPE_MISMATCH` 1502, `COMPLAINT_TARGET_NOT_PROCESSABLE` 1503, `COMPLAINT_RESOLUTION_REQUIRED` 1504, `REFUND_NOT_FOUND` 1505, `REFUND_INVALID_STATE` 1506, `REFUND_PAYMENT_INVALID` 1507, `REFUND_ALREADY_EXISTS` 1508, `REFUND_AMOUNT_EXCEEDED` 1509, `REFUND_SAME_ACTOR` 1510, `REFUND_PROOF_REQUIRED` 1511, `REFUND_REJECT_REASON_REQUIRED` 1512, `COMPLAINT_OUTCOME_REQUIRED` 1513, `COMPLAINT_EVIDENCE_REQUIRED` 1514, `REFUND_CLASS_NOT_ONLINE` 1515, `COMPLAINT_WINDOW_EXPIRED` 1516, `COMPLAINT_TOO_MANY_FILES` 1517 (tối đa 5 tệp minh chứng).

Hạn 7 ngày (Quy định website I.3) chỉ áp cho khiếu nại `NON_REFUND` trên lớp đã ghép thành công, tính từ `classes.active_from`. Lớp đang dạy thử hoặc chưa có gia sư không bị giới hạn. Khiếu nại `REFUND` không theo hạn này, số tiền hoàn do kế toán đối soát.

### 3.10. Học sinh, Nhân sự, Dashboard, Thông báo (module `staff`, `student`, `notification`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/students` | RECEPTIONIST, ADMIN | Tab `ACTIVE`/`INACTIVE`, tìm kiếm và lọc, phân trang | FR-34 |
| GET | `/api/v1/students/{id}` | RECEPTIONIST, ADMIN | Cá nhân, phụ huynh, lớp đã và đang học | FR-34 |
| PATCH | `/api/v1/students/{id}/status` | RECEPTIONIST, ADMIN | Đổi trạng thái; khóa/mở tài khoản | FR-34 |
| GET | `/api/v1/reception/dashboard` | RECEPTIONIST, ADMIN | Lời chào + mã nhân viên, KPI: lớp cần gia sư chờ xử lý, khiếu nại chờ xử lý, khiếu nại chờ hoàn tiền, gia sư đang hoạt động | FR-24 |
| GET | `/api/v1/employees` | ADMIN | Lọc theo vai trò, trạng thái, tìm kiếm | FR-38 (S) |
| GET | `/api/v1/employees/counts` | ADMIN | Số nhân sự theo trạng thái cho badge tab, lọc được theo vai trò | FR-38 (S) |
| GET | `/api/v1/employees/{id}` | ADMIN | Chi tiết nhân sự, kèm `workStats` theo vai trò (lễ tân: `handledClassRequests`, `receivedComplaints`, `reviewedPayments`; kế toán: `reviewedPayments`, `processedRefunds`) | FR-38 (S) |
| PATCH | `/api/v1/employees/{id}/status` | ADMIN | Khóa/mở khóa | FR-38 (S) |
| POST | `/api/v1/employees` | ADMIN | Body `{ role: RECEPTIONIST\|ACCOUNTANT, fullName, email, phone, startDate }`; kiểm tra trùng email/SĐT; tạo user + mã nhân viên (`NV-xxxx`); audit `CREATE_EMPLOYEE` | FR-39 (S) |
| GET | `/api/v1/notifications` | AUTH | Thông báo của tôi. Query `unreadOnly`, phân trang; kèm `unreadCount` | FR-23 |
| POST | `/api/v1/notifications/{id}/read` | AUTH | Đánh dấu đã đọc. Đối tượng liên kết đã bị xóa → client hiển thị "không còn khả dụng" | FR-23 |
| POST | `/api/v1/notifications/read-all` | AUTH | Đánh dấu tất cả đã đọc | FR-23 |

### 3.11. Nhắn tin phụ huynh – gia sư (module `messaging`, V23/V27–V29)

Nhắn tin chạy trên Rocket.Chat (room 1-1 phụ huynh–gia sư); backend là cổng nghiệp vụ
duy nhất (phân quyền, room mapping, đề xuất lớp học, Phone Gate, audit). Tin nhắn thực
nằm ở Rocket.Chat/MongoDB, PostgreSQL giữ `chat_rooms`/`proposal_messages` là nguồn chuẩn.

**Auth Google (module `auth`, V23):**

| Method | Path | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/auth/google/authorization-url` | PUBLIC | Trả URL đăng nhập Google (phụ huynh / gia sư) |
| POST | `/api/v1/auth/google/callback` | PUBLIC | Exchange code → tạo/đồng bộ user (role `PARENT` hoặc `TUTOR`), trả token |

**Phụ huynh (PARENT):**

| Method | Path | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/parents/me` | PARENT | Hồ sơ phụ huynh (wizard: SĐT, mục đích, khu vực, địa chỉ mặc định) |
| PUT | `/api/v1/parents/me/profile` | PARENT | Sửa hồ sơ (địa chỉ học mặc định — V29) |
| POST | `/api/v1/parent/postings` | PARENT | Đăng tin "Lớp cần gia sư" → `class_requests` `NEW`, `source = POSTING` (tối đa 1 tin `NEW`/`OPEN` mỗi phụ huynh) |
| GET | `/api/v1/parent/postings` | PARENT | Tin đăng của tôi |
| GET | `/api/v1/parent/postings/{postingId}/applicants` | PARENT | Danh sách người ứng tuyển (mở room chat với ứng viên) |
| POST | `/api/v1/parent/postings/{postingId}/cancel` | PARENT | Hủy tin đăng |

**Room chat & đề xuất (PARENT, TUTOR):**

| Method | Path | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/chat/rooms` | PARENT, TUTOR | Danh sách room của tôi |
| POST | `/api/v1/chat/rooms/direct` | PARENT, TUTOR | Tạo room trực tiếp (phụ huynh ↔ gia sư) |
| POST | `/api/v1/chat/rooms/application` | PARENT | Tạo room từ lượt ứng tuyển (gắn `class_application_id`) |
| GET | `/api/v1/chat/rooms/{roomId}` | PARENT, TUTOR | Chi tiết room |
| GET/POST | `/api/v1/chat/rooms/{roomId}/messages` | PARENT, TUTOR | Đọc / gửi tin nhắn (đồng bộ qua Rocket.Chat) |
| POST | `/api/v1/chat/rooms/{roomId}/messages/check` | PARENT, TUTOR | Kiểm tra PII (chặn SĐT trước khi gửi) |
| POST | `/api/v1/chat/rooms/{roomId}/read` | PARENT, TUTOR | Đánh dấu đã đọc |
| GET | `/api/v1/chat/rooms/{roomId}/proposals` | PARENT, TUTOR | Đề xuất lớp học trong room |
| POST | `/api/v1/chat/rooms/{roomId}/proposals` | TUTOR | Tạo đề xuất (ca dạy, học phí, `learning_address` với lớp `AT_HOME` — V29) |
| POST | `/api/v1/chat/proposals/{proposalId}/accept` | PARENT | Duyệt đề xuất → tạo `classes` `TRIAL` (mang `proposal_id`, có thể không `class_request_id`) |
| POST | `/api/v1/chat/proposals/{proposalId}/reject` | PARENT | Từ chối đề xuất (kèm lý do) |
| POST | `/api/v1/chat/proposals/{proposalId}/withdraw` | TUTOR | Rút đề xuất chưa được xử lý |
| GET | `/api/v1/chat/stream` | PARENT, TUTOR | Kênh realtime (stream) |

**Lễ tân/Admin (module `staff/chat`):**

| Method | Path | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/staff/chat/postings` | RECEPTIONIST, ADMIN | Tin đăng chờ duyệt (`NEW`) |
| POST | `/api/v1/staff/chat/postings/{id}/approve` | RECEPTIONIST, ADMIN | Duyệt tin: `NEW → OPEN` (hiện trang công khai) |
| POST | `/api/v1/staff/chat/postings/{id}/reject` | RECEPTIONIST, ADMIN | Từ chối tin (kèm lý do) |
| GET | `/api/v1/staff/chat/rooms`, `/rooms/{roomId}/transcript` | RECEPTIONIST, ADMIN | Theo dõi room / xem transcript (không can thiệp nội dung) |
| GET | `/api/v1/staff/chat/pii-events` | RECEPTIONIST, ADMIN | Sự kiện PII bị chặn (audit) |
| POST | `/api/v1/staff/chat/pii-events/{eventId}/review` | RECEPTIONIST, ADMIN | Xử lý sự kiện PII |
| GET | `/api/v1/staff/chat/trial-classes` | RECEPTIONIST, ADMIN | Lớp dạy thử sinh ra từ đề xuất |
| POST | `/api/v1/staff/chat/classes/{classId}/complete` | RECEPTIONIST, ADMIN | Xác nhận hoàn tất lớp dạy thử (`TRIAL → ACTIVE`) |
| POST | `/api/v1/staff/chat/classes/{classId}/cancel-trial` | RECEPTIONIST, ADMIN | Hủy lớp dạy thử |
| GET/POST | `/api/v1/staff/chat/fee-policies` | RECEPTIONIST, ADMIN | Chính sách phí theo loại lớp (`platform_fee_policies`) |
| POST | `/api/v1/internal/chat/pii-events` | nội bộ | Hook Rocket.Chat app ghi sự kiện PII (bảo vệ bằng HMAC, không gọi từ FE) |

> **Phone Gate:** gia sư chỉ thấy SĐT phụ huynh sau khi một đề xuất trong room được
> đồng ý (`parents.phone` vẫn NULL tới đó). Mỗi room gắn `parent_id` + (`tutor_id`
> hoặc `class_application_id`); PostgreSQL `chat_rooms` là nguồn chuẩn.

### 3.12. Gói lưu trữ gia sư (module `tutor`, V30)

Quota tài liệu buổi học theo gói thuê bao (FREE/PRO/PREMIUM — catalog `storage_tiers`,
quota là dữ liệu DB; lịch sử trong `tutor_storage_subscriptions`). Upload bị chặn khi
vượt quota (kèm CTA nâng cấp); gói trả phí tự hạ về FREE khi hết hạn (theo
`storage_tier_expires_at`, không cần job).

| Method | Path | Quyền | Mô tả |
| --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/storage` | TUTOR | Widget dashboard: gói hiện hành, quota, dung lượng đã dùng, thời hạn gói |
| PATCH | `/api/v1/tutors/{id}` (trường `storageTier`, `storageTierDurationMonths`) | RECEPTIONIST, ADMIN | Admin đổi gói lưu trữ (FREE không có thời hạn; PRO/PREMIUM kèm số tháng) — ghi lịch sử thuê bao |
| GET | `/api/v1/tutors/{id}/storage-subscriptions` | RECEPTIONIST, ADMIN | Lịch sử thuê bao gói lưu trữ (modal chi tiết admin) |

> Quota gate áp khi upload tài liệu bài giảng (mục 3.6): vượt quota trả mã lỗi kèm
> thông báo nâng cấp, không trả 500.

---

## 4. Thiết kế dùng chung (không có endpoint công khai)

| Thành phần | Mô tả | Dùng ở |
| --- | --- | --- |
| `AuditLogService` | `log(action, entityType, entityId, details)`, tự lấy `user_id` từ `SecurityContext` và IP từ request. Ghi trong cùng transaction với thao tác nghiệp vụ | 3.3, 3.8, 3.9, 3.10 |
| `NotificationService` | `notify(userId, title, content, entityType, entityId)`. Thông báo cho phụ huynh đi qua tài khoản học sinh | Mọi module |
| `StorageService` (đã có) | Bổ sung `presignedUrl(key, ttl)` để cấp link tải an toàn | 3.6, 3.8, 3.9 |
| `ScheduleConflictChecker` | V16: kiểm tra trùng ca theo gia sư (so trên `class_schedules` của các lớp `ACTIVE` + ca thử `classes.trial_*`; không còn dựa vào `sessions`) | 3.5, 3.6 |
| `EloCalculator` | Hàm thuần `(rs, rq, correct) → rs'`, có unit test | 3.7 |
| `AiClient` | `RestClient` gọi AI Service, timeout 60 s, retry 1 lần, map lỗi về `AI_SERVICE_UNAVAILABLE` | 3.7 |

## 5. Migration cần bổ sung (Flyway)

| Version | Nội dung |
| --- | --- |
| V4 | `parents`, `students`, `employees`; cột `users.must_change_password`, `users.status`; seed tài khoản ADMIN/RECEPTIONIST/ACCOUNTANT/STUDENT mẫu |
| V5 | `class_requests`, `class_applications`, `classes` (partial unique index lớp `TRIAL`/`ACTIVE` theo `class_request_id`), `class_schedules` |
| V6 | `sessions` (đổi tên → `lessons` ở V16), `session_materials` (→ `lesson_materials` ở V16), `notifications`, `audit_logs`; seed mẫu |
| V7 | `skills` (seed), `quizzes` (cột `session_id` → `lesson_id` ở V16), `quiz_questions`, `quiz_answers`, view `v_student_skill_stats` |
| V8 | `payments`, `complaints`, `complaint_attachments`, `refunds` |
| V9 | `payments`: nới `fee_percentage` thành 0–50 và `amount >= 0` (T7-C2) |
| V10 | `class_requests.sessions_per_week` + `fee_percentage`, trạng thái `REMATCH`; `tutors.is_open_to_teaching` |
| V11 | `class_schedules.valid_from`/`valid_to` (khoảng hiệu lực từng ca), `classes.sessions_per_week`; `payments` thêm `NEW`/`CANCELLED`, `amount` NULL khi `NEW` |
| V12 | `payments.amount` nullable (sửa) |
| V13 | `session_exceptions` (overlay ô ảo) → đổi tên `schedule_exceptions` ở V16 |
| V14 | Seed catalog kỹ năng (≥ 20, idempotent theo `skill_code`) |
| V15 | `class_requests` lưu thông tin HS khi đơn `NEW` (chưa có tài khoản) |
| V16 | **Refactor lessons/logs:** `sessions` → `lessons` (bỏ ngày/giờ, `is_trial`, 2 cột log; `status` PUBLISHED/HIDDEN); bảng mới `teaching_logs` (UNIQUE `class_id`+`log_date`+`start_time`); 6 cột `classes.trial_*`; đổi tên `lesson_materials`, `quizzes.lesson_id`, `schedule_exceptions`; copy seed V6 |
| V17 | Bỏ 3 cột override khỏi `schedule_exceptions` |
| V18 | Đổi mã nhân viên sang định dạng `NV-xxxx` |
| V19 | Nới `chk_class_requests_ready`: lớp `OPEN` được phép chưa có `student_id`, tài khoản học sinh tạo khi vào dạy thử |
| V20 | `parents`: quy SĐT về dạng `0xxxxxxxxx`, gộp phụ huynh trùng số, thêm `UNIQUE (phone)` |
| V21 | Ôn tập ngắt quãng phiên bản đầu: bảng `spaced_repetition_reviews` (thay bằng snapshot `review_cards` ở V24) |
| V22 | `complaints`: thêm `class_request_id` (NN), `request_outcome`; `class_id` nullable; `complaint_type` đổi `REMATCH` thành `NON_REFUND` |
| V23 | **MSG:** vai trò `PARENT` trong `users` (đăng nhập Google OAuth duy nhất), bảng `parent_google_oauth` (liên kết user ↔ tài khoản Google) |
| V24 | **FR-22 refactor:** bảng snapshot `review_cards` (đóng băng nội dung câu sai, lịch SRS độc lập vòng đời quiz); bỏ phụ thuộc ôn tập vào `quiz_answers` |
| V25 | Bảng `student_settings` (setting học sinh: `auto_review_wrong`, mở rộng được) |
| V26 | Bảng `review_decks` (nhiều bộ thẻ ôn kiểu Anki; mỗi học sinh 1 deck mặc định "Câu sai tự động") |
| V27 | **MSG:** bỏ `class_requests.requested_tutor_id`; bảng `platform_fee_policies`, `rocket_chat_accounts`, `chat_rooms`, `proposal_messages` (đề xuất lớp học), `chat_pii_events`, `chat_outbox`; lớp có thể tạo từ đề xuất (`classes.proposal_id`) |
| V28 | `class_requests`: cột tin đăng `address`, `gender_requirement`, `duration_type` (địa chỉ, yêu cầu giới tính, loại lớp) |
| V29 | `proposal_messages.learning_address` (đề xuất offline `AT_HOME` chốt địa chỉ học theo địa chỉ mặc định của phụ huynh) |
| V30 | **Gói lưu trữ gia sư:** catalog `storage_tiers` (quota FREE/PRO/PREMIUM là dữ liệu DB), `tutor_storage_subscriptions` (lịch sử thuê bao), `tutors.storage_tier_id` + `storage_tier_expires_at`; chặn upload tài liệu khi vượt quota |

> Thực tế `payments`, `complaints`, `refunds` đã được tạo trong V5; V7–V8 là seed và `unaccent`. `db/migration/` hiện có **V1–V30** (V21 là ôn tập ngắt quãng, V31+ chưa có trên `dev`), mọi file mới phải tăng version, không sửa file đã merge (Flyway immutable — V16 đổi tên bảng cũ thay vì sửa lại migration).

## 6. Ma trận phân quyền tổng hợp

| Nhóm API | PUBLIC | PARENT | STUDENT | TUTOR | RECEPTIONIST | ACCOUNTANT | ADMIN |
| --- | :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| Tìm gia sư, xem lớp tuyển công khai (3.2) | x | | | | | | |
| Hồ sơ cá nhân gia sư (3.3 `/me`) | | | | x | | | |
| Duyệt/quản lý gia sư (3.3) | | | | | x | | x |
| Lớp cần gia sư (3.4) | | | | | x | | x |
| Ứng tuyển, lịch dạy, buổi học (3.4–3.6 TUTOR) | | | | x | | | |
| Lịch học, làm quiz (3.6–3.7 STUDENT) | | | x | | | | |
| Nộp minh chứng phí (3.8) | | | | x | thu hộ / nộp thay | | x |
| Chỉnh tỷ lệ phí (3.8) | | | | | x | | x |
| Duyệt phí, hoàn tiền, thống kê (3.8–3.9) | | | | | | x | x |
| Khiếu nại (3.9) | | | | | x | xem | x |
| Quản lý học sinh (3.10) | | | | | x | | x |
| Quản lý nhân sự (3.10) | | | | | | | x |
| Tin đăng lớp, chat & đề xuất (3.11 PARENT/TUTOR) | | x | | x | | | |
| Duyệt tin đăng, transcript, PII, chính sách phí (3.11 staff) | | | | | x | | x |
| Gói lưu trữ gia sư (3.12) | | | | widget `/me` | đổi gói / lịch sử | | x |
