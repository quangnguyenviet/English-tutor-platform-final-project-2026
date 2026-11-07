# API Design — EnglishPath Backend

Tài liệu thiết kế API cho backend (Spring Boot 3.2, Java 17). Bám sát `docs/project/ERD.md`, `docs/project/prd.md` (FR-01 → FR-44) và code hiện có tại `backend/src/main/java/com/mycompany/englishtutor`.

Phiên bản: 1.3 — 07/11/2026.

---

## 1. Hiện trạng code

### 1.1. Đã có

| Phần | Đã làm được | Ghi chú |
| --- | --- | --- |
| Đăng nhập (`auth`) | Đăng nhập, làm mới token, đăng xuất, kiểm tra token, đăng ký gia sư | Đường dẫn `/api/v1/auth/...` |
| Người dùng (`user`) | Tạo, xem, sửa, xóa user; xem thông tin của mình | Đường dẫn `/api/v1/users/...`. Cần siết quyền theo từng thao tác |
| Hồ sơ gia sư (`tutor`) | Xem hồ sơ, lưu hồ sơ, gửi duyệt | Đường dẫn `/api/v1/tutors/me/profile...` |
| Database | 8 bảng: `users`, `invalidated_token`, `tutors`, `tutor_credentials`, `tutor_service_areas`, `tutor_prices`, `tutor_availabilities`, `tutor_specialties` | Flyway V1 đến V3 |
| Vai trò | `ADMIN`, `RECEPTIONIST`, `ACCOUNTANT`, `TUTOR`, `STUDENT` | Phụ huynh không có tài khoản |

### 1.2. Chưa có

- Mọi bảng từ nhóm ghép lớp trở đi: lớp, buổi học, quiz, phí, khiếu nại, thông báo, nhật ký hệ thống.
- Lễ tân duyệt hồ sơ gia sư, tìm gia sư công khai, ghi audit log.

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
| `NEW` | Chờ xử lý, chờ lễ tân gọi lại | `OPEN` (không có gia sư chỉ định, đăng lớp), `MATCHED` (có gia sư chỉ định, lễ tân xác nhận), `CANCELLED` |
| `OPEN` | Đã đăng, gia sư đang ứng tuyển | `MATCHED` (chọn gia sư ứng tuyển), `CANCELLED` |
| `MATCHED` | Đã ghép, đã có lớp | `REMATCH` (lớp `TRIAL` dạy thử thất bại, phụ huynh muốn tìm gia sư khác), `CANCELLED` (lớp `ACTIVE`/`COMPLETED` chỉ hủy được trong 7 ngày kể từ `active_from`, quá hạn trả 409 `CLASS_REQUEST_CANCEL_EXPIRED` 1169) |
| `REMATCH` | Đang ghép lại: gia sư cũ bị loại, lớp mở lại để ứng tuyển | `MATCHED` (chọn gia sư ứng tuyển, hoặc xác nhận gia sư chỉ định), `CANCELLED` |
| `CANCELLED` | Đã hủy | không |

Khi chuyển `REMATCH`: lớp `TRIAL` + payment `NEW` bị hủy, bài giảng chuyển `HIDDEN`, `requested_tutor_id = NULL`, lượt ứng tuyển của gia sư cũ → `TERMINATED` (lớp chỉ định không có lượt ứng tuyển thì chèn một dòng `TERMINATED`), các lượt `REJECTED` quay về `APPLIED`.

Trạng thái trả về ở API quản lý suy ra từ `class_requests.status` và lớp học mới nhất:

| `status` trả về | Tab | Hiển thị | Dữ liệu |
| --- | --- | --- | --- |
| `NEW` | `new` | Chờ xử lý | `NEW` |
| `OPEN` | `open` | Đã đăng | `OPEN` |
| `TRIAL` | `trial` | Đang dạy thử | `MATCHED` + lớp `TRIAL` |
| `MATCHED` | `matched` | Ghép thành công | `MATCHED` + lớp `ACTIVE`/`COMPLETED` |
| `REMATCH` | `rematch` | Đang ghép lại | `REMATCH` |
| `CANCELLED` | `cancelled` | Đã hủy | `CANCELLED` |

Gia sư và khách không thấy `REMATCH`: API gia sư trả lớp này về `OPEN`, lớp hiển thị như lớp đăng tuyển bình thường. Lớp `REMATCH` đang có `requested_tutor_id` thì tạm ẩn và không nhận ứng tuyển.

**Đơn ứng tuyển** (`class_applications.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `APPLIED` | Gia sư đã ứng tuyển | `SELECTED` (được chọn), `REJECTED` (không được chọn hoặc lớp bị hủy) |
| `SELECTED` | Được chọn | `TERMINATED` (dạy thử thất bại → ghép lại, hoặc hủy đơn khi đang dạy thử) |
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

### 3.2. Cổng công khai (module `publicportal`) — Phụ huynh không có tài khoản

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/public/tutors` | PUBLIC | Tìm gia sư `ACTIVE`. Query: `province`, `district`, `specialty` (lặp được nhiều lần), `gradeGroup` (`tieuhoc`/`thcs`/`thpt`/`nguoidilam`), `teachingMode` (`ONLINE`/`AT_HOME`), `gender` (`MALE`/`FEMALE`), `keyword`, `page`, `size`. Tìm không phân biệt dấu. Item: ảnh, họ tên, trường/chuyên ngành, khu vực, chuyên môn, thành tích, hình thức dạy. **Không công khai học phí.** Mục rỗng không trả. `size` mặc định 20, tối đa 100 | FR-01 |
| GET | `/api/v1/public/tutors/{id}` | PUBLIC | Hồ sơ công khai: giới thiệu, chứng chỉ đã xác thực, kinh nghiệm, khu vực, hình thức dạy, video, lịch rảnh. Mục rỗng không trả. Gia sư không `ACTIVE` → 404 `TUTOR_PROFILE_UNAVAILABLE` (1101). Không công khai học phí | FR-02 |
| POST | `/api/v1/public/class-requests` | PUBLIC | Phụ huynh để lại **họ tên + SĐT** để trung tâm gọi lại. Body `{ parentName, phone, tutorId? }`: có `tutorId` là đăng ký gia sư chỉ định (gia sư phải `ACTIVE`, nếu không 404 `TUTOR_PROFILE_UNAVAILABLE`), bỏ trống là nhận tư vấn tìm gia sư. SĐT được quy về dạng `0xxxxxxxxx`, tìm `parents` theo SĐT (chưa có thì tạo). SĐT đã có mà họ tên khác → 409 `PARENT_PHONE_NAME_MISMATCH` 1170, thông báo không chứa tên phụ huynh đang giữ số. Họ tên so sánh bỏ qua chữ hoa/thường, khoảng trắng thừa và dấu tiếng Việt. Hợp lệ thì tạo `class_requests` (`NEW`, `requested_tutor_id` = `tutorId` hoặc NULL). Gửi lặp cùng yêu cầu đang `NEW` trả lại mã cũ. Trả 201 `{ requestCode, message }`, `requestCode` dạng `REQ-yyyyMMdd-id`, thông điệp "liên hệ trong 12 giờ". Ghi `notifications` cho Lễ tân | FR-03, FR-04 |

Validate SĐT: regex `^(0|\+84|84)(3|5|7|8|9)\d{8}$`, sai trả 400 "Số điện thoại không hợp lệ". Chống spam: tối đa 5 request/giờ/SĐT (bộ đếm trong bộ nhớ), vượt quá trả 429 `TOO_MANY_REQUESTS` (1102).

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
| POST | `/api/v1/class-requests` | RECEPTIONIST, ADMIN | Tạo lớp tại quầy, luôn ở `NEW`. `tutorId` tùy chọn (`null` là không chỉ định). Thông tin học sinh lưu ở `class_requests.student_*`, chưa tạo tài khoản. SĐT đã có mà họ tên khác → 409 `PARENT_PHONE_BELONGS_TO_OTHER` 1171 | FR-25 |
| PUT | `/api/v1/class-requests/{id}` | RECEPTIONIST, ADMIN | Sửa một phần, trường nào gửi thì cập nhật. `NEW`: mọi trường. `REMATCH`: chỉ `pricePerSession`, `classRequirement`, `learningGoal`, `tutorRequirement` (trường khác → 409 `CLASS_REQUEST_FIELD_LOCKED` 1165) và báo cho gia sư đang ứng tuyển. Trạng thái khác → 409 `CLASS_REQUEST_NOT_EDITABLE` 1164 | FR-28 |
| PATCH | `/api/v1/class-requests/{id}/designated-tutor` | RECEPTIONIST, ADMIN | Body `{ tutorId }`, `null` là không chỉ định. Chỉ `NEW`/`REMATCH` (khác → 409 `CLASS_REQUEST_TUTOR_NOT_CHANGEABLE` 1163). Gia sư phải `ACTIVE`; gia sư đã bị loại khỏi lớp → 409 `CLASS_REQUEST_TUTOR_TERMINATED` 1168 | FR-28 |
| POST | `/api/v1/class-requests/{id}/publish` | RECEPTIONIST, ADMIN | `NEW → OPEN`, hiện trên trang gia sư và trang công khai. Lớp đang có gia sư chỉ định → 409 `CLASS_REQUEST_HAS_TUTOR` 1167. Yêu cầu đủ họ tên học sinh, `class_requirement`, `teaching_mode`, `price_per_session` (thiếu → 409 `CLASS_REQUEST_NOT_READY` 1113) | FR-25 |
| POST | `/api/v1/class-requests/{id}/confirm` | RECEPTIONIST, ADMIN | Lớp có gia sư chỉ định, trạng thái `NEW`/`REMATCH`. Chuyển `MATCHED` + tạo `classes` (`TRIAL`) + payment `NEW`. Tạo tài khoản học sinh nếu chưa có, trả `initialPassword` đúng lần tạo. Không có gia sư → 409 `CLASS_REQUEST_NO_TUTOR` 1166. Chưa có học phí → 409 `CLASS_REQUEST_PRICE_REQUIRED` 1172. Một transaction | FR-29 |
| GET | `/api/v1/class-requests/{id}/applications` | RECEPTIONIST, ADMIN | Danh sách gia sư ứng tuyển (tên, thời gian, lời nhắn) | FR-26 |
| POST | `/api/v1/class-requests/{id}/select-tutor` | RECEPTIONIST, ADMIN | Body `{ applicationId }`. Lớp `OPEN`/`REMATCH` chưa có gia sư chỉ định (khác → 409 `CLASS_REQUEST_NOT_SELECTABLE` 1161 hoặc `CLASS_REQUEST_HAS_TUTOR` 1167). Lượt được chọn `SELECTED`, lượt `APPLIED` khác `REJECTED`; các bước còn lại như `confirm`. Một transaction | FR-26 |
| POST | `/api/v1/class-requests/{id}/complete-match` | RECEPTIONIST, ADMIN | Body tùy chọn `{ sessionsPerWeek, pricePerSession, feePercentage }`. Lớp `TRIAL → ACTIVE`, ghi `active_from`, kích hoạt khoản phí. Khác `TRIAL` → 409 `MATCH_REQUEST_NOT_TRIAL` 1111 | FR-29 |
| POST | `/api/v1/class-requests/{id}/rematch` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. Dạy thử không thành công, phụ huynh muốn tìm gia sư khác: lớp `MATCHED` + lớp học mới nhất `TRIAL` (khác → 409 `MATCH_REQUEST_NOT_TRIAL` 1111) → `REMATCH`. Hủy lớp `TRIAL` và payment `NEW`, gia sư cũ `TERMINATED`, lượt `REJECTED` về `APPLIED`, thông báo các bên. Một transaction | FR-30 |
| POST | `/api/v1/class-requests/{id}/cancel` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. → `CANCELLED` ở mọi trạng thái; đóng lớp học nếu có, loại gia sư đang dạy, từ chối lượt `APPLIED`, thông báo gia sư, học sinh. Lớp đã ghép thành công quá 7 ngày → 409 `CLASS_REQUEST_CANCEL_EXPIRED` 1169. Đã hủy → 409 `CLASS_REQUEST_ALREADY_CANCELLED` 1110 | FR-27 |
| POST | `/api/v1/classes/{id}/cancel` | RECEPTIONIST, ADMIN | Body `{ reason }`. Hủy lớp ở `TRIAL`/`ACTIVE`, thông báo các bên. Nếu đơn gốc còn hiệu lực → cho phép về `OPEN` (ghép lại) | FR-30 |
| GET | `/api/v1/tutors/me/open-requests` | TUTOR | Lớp đang tuyển, kèm cờ `applied`. Gồm `OPEN` và `REMATCH` chưa có gia sư chỉ định, cả hai đều trả `requestStatus = OPEN` | FR-08 |
| GET | `/api/v1/tutors/me/open-requests/{id}` | TUTOR | Chi tiết lớp tuyển (ẩn SĐT phụ huynh) | FR-08 |
| POST | `/api/v1/tutors/me/open-requests/{id}/apply` | TUTOR | Body `{ message }` (tùy chọn). 409 nếu đã ứng tuyển, lớp không còn tuyển, hoặc lớp đang có gia sư chỉ định | FR-08 |
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
| GET | `/api/v1/complaints/{id}` | RECEPTIONIST, ADMIN, ACCOUNTANT | Chi tiết kèm yêu cầu hoàn tiền gần nhất và tệp đính kèm | FR-36 |
| POST | `/api/v1/complaints` | RECEPTIONIST, ADMIN | Body `{ complainantName, complainantPhone, complainantRole, classId, complaintType, complaintContent }` → `PENDING` | FR-35 |
| PUT | `/api/v1/complaints/{id}` | RECEPTIONIST, ADMIN | Sửa khi chưa `RESOLVED`/`CANCELLED` | FR-36 |
| POST | `/api/v1/complaints/{id}/resolve-rematch` | RECEPTIONIST, ADMIN | Body `{ resolution }` + ảnh minh chứng (multipart, nhiều tệp). `REMATCH`: → `RESOLVED`, lớp → `CANCELLED`, đơn gốc → `OPEN`, audit `RESOLVE_COMPLAINT` | FR-37 |
| POST | `/api/v1/complaints/{id}/refund-requests` | RECEPTIONIST, ADMIN | Body `{ paymentId, requestedAmount, recipientName, bankName, bankAccountNumber }`. `paymentId` phải `APPROVED` và cùng lớp; tối đa 1 yêu cầu `PENDING`/`PAID`. Complaint → `PROCESSING`, audit `REQUEST_REFUND` | FR-37 |
| POST | `/api/v1/complaints/{id}/cancel` | RECEPTIONIST, ADMIN | Hủy khiếu nại | FR-36 |
| GET | `/api/v1/refunds` | ACCOUNTANT | Query `tab` (`PENDING`/`PAID`/`REJECTED`) | FR-43 |
| GET | `/api/v1/refunds/{id}` | ACCOUNTANT | Kèm số đã thu / đã hoàn / còn lại | FR-43 |
| POST | `/api/v1/refunds/{id}/pay` | ACCOUNTANT | Body `{ approvedAmount }` + biên lai (multipart). `approvedAmount ≤ received_amount − đã hoàn`. → `PAID`, complaint → `RESOLVED`, audit `PAY_REFUND`. **`processed_by ≠ requested_by`** | FR-43 |
| POST | `/api/v1/refunds/{id}/reject` | ACCOUNTANT | Body `{ reason }`. → `REJECTED`, complaint → `PENDING` | FR-43 |
| GET | `/api/v1/accounting/dashboard` | ACCOUNTANT | Thẻ chỉ số: phí chờ xác nhận, hoàn tiền chờ, thu/hoàn trong tháng, công nợ | FR-40 |
| GET | `/api/v1/accounting/statistics` | ACCOUNTANT | Query `from`, `to`, `groupBy` (`month`\|`payerType`\|`tutor`\|`teachingMode`). Công thức ở `ERD.md` mục 2.6 | FR-44 |

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
| V19 | Nới `chk_class_requests_ready`: lớp `OPEN` được phép chưa có `student_id`, tài khoản học sinh tạo khi vào dạy thử |
| V20 | `parents`: quy SĐT về dạng `0xxxxxxxxx`, gộp phụ huynh trùng số, thêm `UNIQUE (phone)` |

> Thực tế `payments`, `complaints`, `refunds` đã được tạo trong V5; V7–V8 là seed và `unaccent`. `db/migration/` hiện có **V1–V20**, mọi file mới phải tăng version, không sửa file đã merge (Flyway immutable — V16 đổi tên bảng cũ thay vì sửa lại migration).

## 6. Ma trận phân quyền tổng hợp

| Nhóm API | PUBLIC | STUDENT | TUTOR | RECEPTIONIST | ACCOUNTANT | ADMIN |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Tìm gia sư, gửi yêu cầu (3.2) | x | | | | | |
| Hồ sơ cá nhân gia sư (3.3 `/me`) | | | x | | | |
| Duyệt/quản lý gia sư (3.3) | | | | x | | x |
| Lớp cần gia sư (3.4) | | | | x | | x |
| Ứng tuyển, lịch dạy, buổi học (3.4–3.6 TUTOR) | | | x | | | |
| Lịch học, làm quiz (3.6–3.7 STUDENT) | | x | | | | |
| Nộp minh chứng phí (3.8) | | | x | thu hộ / nộp thay | | x |
| Chỉnh tỷ lệ phí (3.8) | | | | x | | x |
| Duyệt phí, hoàn tiền, thống kê (3.8–3.9) | | | | | x | x |
| Khiếu nại (3.9) | | | | x | xem | x |
| Quản lý học sinh (3.10) | | | | x | | x |
| Quản lý nhân sự (3.10) | | | | | | x |
