# API Design — EnglishPath Backend

Tài liệu thiết kế API cho backend (Spring Boot 3.2, Java 17). Bám sát `docs/project/ERD.md`, `docs/project/prd.md` (FR-01 → FR-44) và code hiện có tại `backend/src/main/java/com/mycompany/englishtutor`.

Phiên bản: 1.1 — 22/10/2026.

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
| 1300 – 1399 | Phí nhận lớp |
| 1400 – 1499 | Quiz, Elo |
| 1500 – 1599 | Khiếu nại, hoàn tiền |
| 1600 – 1699 | Nhân sự, thông báo, nhật ký hệ thống |

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

**Đơn yêu cầu lớp** (`class_requests.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `NEW` | Mới tiếp nhận, chờ lễ tân gọi lại | `OPEN` (đăng cho gia sư ứng tuyển), `MATCHED` (phụ huynh đã chọn sẵn gia sư), `CANCELLED` |
| `OPEN` | Đã đăng, gia sư đang ứng tuyển | `MATCHED`, `CANCELLED` |
| `MATCHED` | Đã ghép, đã có lớp | `OPEN` (ghép lại sau khiếu nại "ghép lại lớp") |
| `CANCELLED` | Đã hủy | không |

**Đơn ứng tuyển** (`class_applications.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `APPLIED` | Gia sư đã ứng tuyển | `SELECTED` (được chọn), `REJECTED` (không được chọn) |
| `SELECTED` | Được chọn | không |
| `REJECTED` | Không được chọn | không |

Gia sư muốn rút ứng tuyển thì xóa dòng này, chỉ được khi đơn còn `OPEN` và chưa chọn ai.

**Lớp học** (`classes.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `TRIAL` | Đang dạy thử | `ACTIVE` (gia sư chốt lịch cố định), `CANCELLED` |
| `ACTIVE` | Đang học chính thức | `COMPLETED`, `CANCELLED` |
| `COMPLETED` | Kết thúc | không |
| `CANCELLED` | Đã hủy | không |

**Buổi học** (`sessions.status`)

| Trạng thái | Ý nghĩa | Chuyển được sang |
| --- | --- | --- |
| `SCHEDULED` | Sắp diễn ra | `IN_PROGRESS`, `ABSENT` (vắng), `CANCELLED` |
| `IN_PROGRESS` | Đang diễn ra | `COMPLETED` |
| `COMPLETED` | Đã học | không |
| `ABSENT` | Vắng | không |
| `CANCELLED` | Đã hủy | không |

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
| POST | `/api/v1/auth/refresh`, `/api/v1/auth/logout`, `/api/v1/auth/introspect` | PUBLIC | Làm mới / thu hồi / kiểm tra token | FR-05 | Có |
| POST | `/api/v1/auth/change-password` | AUTH | Body `{ oldPassword, newPassword }`. Bắt buộc ở lần đăng nhập đầu; mật khẩu mới không trùng mặc định, đạt độ mạnh | FR-06, FR-16 | Mới |
| GET | `/api/v1/users/my-info` | AUTH | Thông tin tài khoản hiện tại kèm role | FR-05 | Có |
| PUT | `/api/v1/students/me/profile` | STUDENT | Sửa ảnh đại diện, trường, lớp hiện tại, mục tiêu học tập (multipart) | FR-16 (S) | Mới |

> Siết quyền các endpoint quản trị `/api/v1/users` (chỉ `ADMIN`); `/api/v1/users/my-info` vẫn dành cho mọi tài khoản đã đăng nhập — xem T7-A1.

### 3.2. Cổng công khai (module `publicportal`) — Phụ huynh không có tài khoản

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/public/tutors` | PUBLIC | Tìm gia sư `ACTIVE`. Query: `province`, `district`, `specialty` (lặp được nhiều lần), `gradeGroup` (`tieuhoc`/`thcs`/`thpt`/`nguoidilam`), `teachingMode` (`ONLINE`/`AT_HOME`), `gender` (`MALE`/`FEMALE`), `keyword`, `page`, `size`. Tìm không phân biệt dấu. Item: ảnh, họ tên, trường/chuyên ngành, khu vực, chuyên môn, thành tích, hình thức dạy. **Không công khai học phí.** Mục rỗng không trả. `size` mặc định 20, tối đa 100 | FR-01 |
| GET | `/api/v1/public/tutors/{id}` | PUBLIC | Hồ sơ công khai: giới thiệu, chứng chỉ đã xác thực, kinh nghiệm, khu vực, hình thức dạy, video, lịch rảnh. Mục rỗng không trả. Gia sư không `ACTIVE` → 404 `TUTOR_PROFILE_UNAVAILABLE` (1101). Không công khai học phí | FR-02 |
| POST | `/api/v1/public/class-requests` | PUBLIC | Phụ huynh để lại **họ tên + SĐT** để trung tâm gọi lại. Body `{ parentName, phone, tutorId? }`: có `tutorId` là đăng ký gia sư chỉ định (gia sư phải `ACTIVE`, nếu không 404 `TUTOR_PROFILE_UNAVAILABLE`), bỏ trống là nhận tư vấn tìm gia sư. Tìm `parents` theo SĐT (chưa có thì tạo), tạo `class_requests` (`NEW`, `requested_tutor_id` = `tutorId` hoặc NULL). Gửi lặp cùng yêu cầu đang `NEW` trả lại mã cũ. Trả 201 `{ requestCode, message }`, `requestCode` dạng `REQ-yyyyMMdd-id`, thông điệp "liên hệ trong 12 giờ". Ghi `notifications` cho Lễ tân | FR-03, FR-04 |

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
| GET | `/api/v1/class-requests` | RECEPTIONIST, ADMIN | Danh sách. Query: `tab` (`NEW`/`OPEN`/`MATCHED`/`CANCELLED`), `keyword`, `sort` (thời gian đăng, số ứng tuyển) | FR-25 |
| GET | `/api/v1/class-requests/{id}` | RECEPTIONIST, ADMIN | Chi tiết kèm phụ huynh, học sinh, danh sách ứng tuyển | FR-25, FR-26 |
| POST | `/api/v1/class-requests` | RECEPTIONIST, ADMIN | Lễ tân tạo đơn tại quầy (thông tin phụ huynh + học sinh + yêu cầu) | FR-25 |
| PUT | `/api/v1/class-requests/{id}` | RECEPTIONIST, ADMIN | Bổ sung sau cuộc gọi lại: `class_requirement`, `teaching_mode`, `price_per_session`, `preferred_schedule`, `tutor_requirement`, thông tin học sinh. Nếu chưa có `student_id` → tạo tài khoản học sinh (mật khẩu mặc định, `mustChangePassword = true`) | FR-25 |
| POST | `/api/v1/class-requests/{id}/publish` | RECEPTIONIST, ADMIN | `NEW → OPEN`; yêu cầu đủ `class_requirement`, `teaching_mode`, `price_per_session`. Hiện trên trang gia sư | FR-25 |
| POST | `/api/v1/class-requests/{id}/cancel` | RECEPTIONIST, ADMIN | Body `{ reason }` bắt buộc. → `CANCELLED`; thông báo gia sư đã ứng tuyển | FR-27 |
| GET | `/api/v1/class-requests/{id}/applications` | RECEPTIONIST, ADMIN | Danh sách gia sư ứng tuyển (tên, thời gian, lời nhắn) | FR-26 |
| POST | `/api/v1/class-requests/{id}/select-tutor` | RECEPTIONIST, ADMIN | Body `{ applicationId }`. Application `SELECTED`, các application khác `REJECTED`; tạo `classes` (`TRIAL`); request → `MATCHED`. Một transaction | FR-26 |
| POST | `/api/v1/class-requests/{id}/assign-tutor` | RECEPTIONIST, ADMIN | Luồng chỉ định: Body `{ className, sessionsPerWeek, durationMinutes, teachingMode, pricePerSession }`. Tạo `classes` (`TRIAL`); request → `MATCHED` | FR-28, FR-29 |
| POST | `/api/v1/classes/{id}/cancel` | RECEPTIONIST, ADMIN | Body `{ reason }`. Hủy lớp ở `TRIAL`/`ACTIVE`, thông báo các bên. Nếu đơn gốc còn hiệu lực → cho phép về `OPEN` (ghép lại) | FR-30 |
| GET | `/api/v1/tutors/me/open-requests` | TUTOR | Lớp `OPEN` đang tuyển, kèm cờ `applied` | FR-08 |
| GET | `/api/v1/tutors/me/open-requests/{id}` | TUTOR | Chi tiết lớp tuyển (ẩn SĐT phụ huynh) | FR-08 |
| POST | `/api/v1/tutors/me/open-requests/{id}/apply` | TUTOR | Body `{ message }`. 409 nếu đã ứng tuyển hoặc đơn không còn `OPEN` | FR-08 |
| DELETE | `/api/v1/tutors/me/applications/{id}` | TUTOR | Rút ứng tuyển khi đơn còn `OPEN` và chưa chọn gia sư | FR-08 |
| GET | `/api/v1/tutors/me/applications` | TUTOR | Lịch sử ứng tuyển và kết quả | FR-08 |

### 3.5. Lớp học, Lịch dạy thử & Lịch cố định (module `classroom`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/classes` | TUTOR | Lớp của tôi. Query: `status` | FR-09, FR-10 |
| GET | `/api/v1/classes/{id}` | TUTOR (sở hữu), RECEPTIONIST, ADMIN, STUDENT (sở hữu) | Chi tiết lớp: học sinh, hình thức, học phí, `class_schedules`, trạng thái | FR-09 |
| POST | `/api/v1/classes/{id}/trial-session` | TUTOR | Body `{ sessionDate, startTime, endTime, teachingMode, meetingUrl?, location? }`. Online bắt buộc `meetingUrl`, tại nhà bắt buộc `location`. Tạo `sessions` (`is_trial = true`), lớp vẫn `TRIAL`. 409 `SCHEDULE_CONFLICT` nếu trùng ca của gia sư; mỗi lớp tối đa 1 buổi thử | FR-09 |
| PUT | `/api/v1/classes/{id}/trial-session` | TUTOR | Sửa/đổi lịch dạy thử (chỉ khi buổi thử còn `SCHEDULED`) | FR-09 |
| POST | `/api/v1/classes/{id}/finalize-schedule` | TUTOR | Body `{ activeFrom, teachingMode, slots: [{ dayOfWeek, startTime, endTime }] }`. Kiểm tra trùng với lớp `ACTIVE` khác (trả rõ thứ, giờ, tên học sinh trùng); lưu `class_schedules`; lớp → `ACTIVE`, `active_from`; tạo `payments` (`NOT_SUBMITTED`, `TUTOR`, 40%); sinh `sessions` cho 4 tuần tới. Một transaction | FR-10 |
| PATCH | `/api/v1/classes/{id}/tutor-note` | TUTOR | Ghi chú riêng của gia sư (học sinh không thấy) | — |

Công thức `payments.amount`: `fee_percentage × số_dòng_class_schedules × 4 × price_per_session`, làm tròn nghìn đồng.

### 3.6. Buổi học & Nhật ký (module `session`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/schedule` | TUTOR | Lịch dạy. Query: `view` (`week`\|`month`), `date` (mốc). Item: học sinh, giờ, hình thức, `sessionId?` | FR-11 |
| POST | `/api/v1/classes/{classId}/sessions` | TUTOR | Tạo buổi học (từ ca lịch hoặc thủ công). Kiểm tra trùng ca | FR-11, FR-12 |
| GET | `/api/v1/classes/{classId}/sessions` | TUTOR, STUDENT (sở hữu), RECEPTIONIST, ADMIN | Danh sách buổi, kèm số thứ tự tính bằng `ROW_NUMBER()`. Query `order` (tutor tăng, student giảm), `status` | FR-12, FR-19 |
| GET | `/api/v1/sessions/{id}` | TUTOR, STUDENT (sở hữu), RECEPTIONIST, ADMIN | Chi tiết: thông tin chung, tài liệu, quiz và kết quả, nhật ký. Học sinh chỉ thấy nhật ký khi đã công bố | FR-12, FR-20 |
| PUT | `/api/v1/sessions/{id}` | TUTOR | Sửa tiêu đề, ngày giờ, hình thức, link/địa điểm | FR-12 |
| POST | `/api/v1/sessions/{id}/status` | TUTOR | Body `{ status: IN_PROGRESS\|COMPLETED\|ABSENT\|CANCELLED }` theo máy trạng thái | FR-12 |
| PUT | `/api/v1/sessions/{id}/log` | TUTOR | Body `{ logKnowledge, logHomework }`. Gửi thông báo cho học sinh khi lưu lần đầu | FR-12 |
| POST | `/api/v1/sessions/{id}/materials` | TUTOR | Upload tài liệu (`.pdf`, `.docx`, ảnh, âm thanh), kiểm tra loại và dung lượng | FR-12 |
| DELETE | `/api/v1/sessions/{id}/materials/{materialId}` | TUTOR | Gỡ tài liệu | FR-12 |
| GET | `/api/v1/materials/{id}/access-url` | TUTOR, STUDENT (sở hữu) | Trả URL ký sẵn có hạn (10 phút) và cờ `previewable` (PDF, ảnh, âm thanh xem trực tiếp; còn lại chỉ tải). Tệp đã gỡ → `MATERIAL_UNAVAILABLE` | FR-21 |
| GET | `/api/v1/students/me/schedule` | STUDENT | Lịch tuần (T2–CN) với trạng thái buổi. Query `weekStart` | FR-19 |
| GET | `/api/v1/students/me/sessions` | STUDENT | Lịch sử buổi học, lọc theo gia sư/lớp | FR-19 |
| GET | `/api/v1/students/me/tutors` | STUDENT | Gia sư đang dạy kèm tiến trình (môn, ngày bắt đầu, lịch cố định, số buổi đã học) | FR-18 (S) |
| GET | `/api/v1/students/me/dashboard` | STUDENT | Gộp: thông tin học sinh/gia sư, buổi sắp tới và gần nhất, bài cần làm, Elo, thông báo. Mỗi khu vực lỗi độc lập (`null` + `error`), không làm hỏng cả phản hồi | FR-17 |

### 3.7. Quiz, Elo & AI (module `quiz`; AI Service là service riêng)

**Backend (`quiz`):**

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/skills` | AUTH | Danh mục kỹ năng (seed) | FR-13 |
| GET | `/api/v1/classes/{classId}/skill-profile` | TUTOR (sở hữu) | Bảng thống kê hồ sơ học sinh (SKP) từ view `v_student_skill_stats`, sắp theo `error_rate` | FR-13 |
| POST | `/api/v1/sessions/{sessionId}/quizzes/ai-chat` | TUTOR | Body `{ message, quizId?, attachments? }` (multipart). Backend lấy SKP + lịch sử chat (MongoDB `ai_chat_messages`), gọi AI Service, lưu hội thoại, trả `{ reply, draftQuestions[] }`. Timeout 60 s, retry 1 lần | FR-13 |
| POST | `/api/v1/sessions/{sessionId}/quizzes` | TUTOR | Tạo quiz `DRAFT` (`source = AI_DIRECT`) từ câu hỏi đã chọn | FR-13 |
| GET | `/api/v1/quizzes/import-prompt` | TUTOR | Query `classId`. Trả prompt mẫu (nhúng kỹ năng yếu và chuẩn JSON CEFR) | FR-14 |
| POST | `/api/v1/sessions/{sessionId}/quizzes/import` | TUTOR | Body `{ json }`. Kiểm định cấu trúc (đủ A–D, `correct_answer` ∈ A–D, `cefr_level`, `skill_code` tồn tại); lỗi trả danh sách `{ questionNumber, field, message }`; thành công tạo quiz `DRAFT` (`IMPORTED`) | FR-14 |
| PUT | `/api/v1/quizzes/{id}` | TUTOR | Sửa tiêu đề, câu hỏi khi còn `DRAFT` | FR-13 |
| POST | `/api/v1/quizzes/{id}/assign` | TUTOR | Body `{ deadline }`. `DRAFT → ASSIGNED`, thông báo học sinh | FR-13 |
| GET | `/api/v1/quizzes/{id}` | TUTOR (sở hữu), STUDENT (sở hữu, ẩn đáp án chưa trả lời) | Chi tiết quiz | FR-13, FR-22 |
| GET | `/api/v1/students/me/quizzes` | STUDENT | Bài cần làm. Query `status` | FR-17, FR-22 |
| POST | `/api/v1/quizzes/{id}/attempts/start` | STUDENT | Bắt đầu hoặc làm tiếp: trả câu chưa trả lời kế tiếp và tiến độ. Quá `deadline` → `QUIZ_EXPIRED` | FR-22 |
| POST | `/api/v1/quizzes/{id}/questions/{questionId}/answer` | STUDENT | Body `{ selectedAnswer }`. Chấm ngay, trả `{ isCorrect, correctAnswer, explanation, eloBefore, eloAfter, eloChange }`. UNIQUE (student, question) → gọi lại trả lại kết quả cũ (idempotent). Cập nhật `students.elo`. Hoàn tất → quiz `COMPLETED` | FR-22 |
| GET | `/api/v1/quizzes/{id}/result` | STUDENT, TUTOR | Tổng kết: số đúng/sai, tổng Elo thay đổi | FR-22 |
| GET | `/api/v1/students/me/review-list` | STUDENT | Danh sách ôn tập: các câu `is_correct = false` | FR-22 |

**Elo:** công thức chuẩn `E = 1 / (1 + 10^((Rq − Rs) / 400))`, `Rs' = Rs + K × (S − E)`, K = 32. `Rq` (độ khó câu hỏi) quy từ CEFR: A1=800, A2=1000, B1=1200, B2=1400, C1=1600, C2=1800. Elo khởi điểm của học sinh: 1000. Hằng số đặt trong `EloProperties`.

**AI Service (FastAPI, chỉ backend gọi — không public ra frontend):**

| Method | Path | Mô tả |
| --- | --- | --- |
| POST | `/ai/quiz/generate` | Input `{ messages[], skillProfile[], cefrLevel, numQuestions, attachments? }` → `{ reply, questions[] }` (JSON đúng schema `quiz_questions`) |
| POST | `/ai/quiz/validate-import` | Input `{ json }` → `{ valid, errors[] }` (dự phòng nếu validate ở Python) |
| GET | `/health` | Đã có |

### 3.8. Phí nhận lớp (module `payment`)

| Method | Path | Quyền | Mô tả | FR |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/tutors/me/payments` | TUTOR | Query `tab` (`NOT_SUBMITTED`/`RESUBMIT_REQUIRED`/`SUBMITTED`/`APPROVED`) | FR-15 |
| POST | `/api/v1/payments/{id}/proof` | TUTOR | Gia sư nộp biên lai (multipart `file`, `paymentMethod = BANK_TRANSFER`). Chỉ khi `NOT_SUBMITTED`/`RESUBMIT_REQUIRED` → `SUBMITTED` | FR-15 |
| GET | `/api/v1/payments` | RECEPTIONIST, ADMIN, ACCOUNTANT | Tìm theo mã lớp, tên gia sư, SĐT phụ huynh, `status`, `month`; phân trang | FR-33, FR-41 |
| GET | `/api/v1/payments/{id}` | RECEPTIONIST, ADMIN, ACCOUNTANT, TUTOR (sở hữu) | Chi tiết kèm cách tính | FR-41 |
| POST | `/api/v1/payments/{id}/collect-proof` | RECEPTIONIST, ADMIN | Lễ tân thu hộ tại quầy (`CASH` hoặc `BANK_TRANSFER`, ảnh phiếu thu). → `SUBMITTED`, `uploaded_by` = lễ tân, audit `COLLECT_PAYMENT_PROOF` | FR-33 |
| PATCH | `/api/v1/payments/{id}/fee-percentage` | ACCOUNTANT | Body `{ feePercentage }` ∈ [35, 40]; chỉ khi `NOT_SUBMITTED`; tính lại `amount`; audit `UPDATE_FEE_RATE` | FR-41 |
| POST | `/api/v1/payments/{id}/approve` | ACCOUNTANT | Body `{ receivedAmount }`. `receivedAmount ≥ amount` → `APPROVED`, ghi `reviewed_by/at`, thông báo, audit; thiếu → `RESUBMIT_REQUIRED` + `rejectReason`. **`reviewed_by ≠ uploaded_by`** (lỗi `PAYMENT_SAME_ACTOR`) | FR-42 |
| POST | `/api/v1/payments/{id}/request-resubmit` | ACCOUNTANT | Body `{ reason }`. → `RESUBMIT_REQUIRED` | FR-42 |

Khi phí `APPROVED` → mở khóa thông tin liên hệ phụ huynh cho gia sư (cờ `contactUnlocked` trong `GET /api/v1/classes/{id}`).

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
| GET | `/api/v1/reception/dashboard` | RECEPTIONIST, ADMIN | Lời chào + mã nhân viên, KPI: đơn ghép lớp chờ xử lý, khiếu nại chờ xử lý, khiếu nại chờ hoàn tiền, gia sư đang hoạt động | FR-24 |
| GET | `/api/v1/employees` | ADMIN | Lọc theo vai trò, trạng thái, tìm kiếm | FR-38 (S) |
| GET | `/api/v1/employees/{id}` | ADMIN | Chi tiết nhân sự | FR-38 (S) |
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
| `ScheduleConflictChecker` | Kiểm tra trùng ca theo gia sư (`class_schedules` của lớp `ACTIVE` + `sessions` `SCHEDULED`) | 3.5, 3.6 |
| `EloCalculator` | Hàm thuần `(rs, rq, correct) → rs'`, có unit test | 3.7 |
| `AiClient` | `RestClient` gọi AI Service, timeout 60 s, retry 1 lần, map lỗi về `AI_SERVICE_UNAVAILABLE` | 3.7 |

## 5. Migration cần bổ sung (Flyway)

| Version | Nội dung |
| --- | --- |
| V4 | `parents`, `students`, `employees`; cột `users.must_change_password`, `users.status`; seed tài khoản ADMIN/RECEPTIONIST/ACCOUNTANT/STUDENT mẫu |
| V5 | `class_requests`, `class_applications`, `classes` (partial unique index lớp `TRIAL`/`ACTIVE` theo `class_request_id`), `class_schedules` |
| V6 | `sessions` (partial unique index buổi thử), `session_materials`, `notifications`, `audit_logs` |
| V7 | `skills` (seed), `quizzes`, `quiz_questions`, `quiz_answers`, view `v_student_skill_stats` |
| V8 | `payments`, `complaints`, `complaint_attachments`, `refunds` |

> `db/migration/` hiện đã có V1–V3; mọi file mới phải tăng version, không sửa file đã merge.

## 6. Ma trận phân quyền tổng hợp

| Nhóm API | PUBLIC | STUDENT | TUTOR | RECEPTIONIST | ACCOUNTANT | ADMIN |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Tìm gia sư, gửi yêu cầu (3.2) | x | | | | | |
| Hồ sơ cá nhân gia sư (3.3 `/me`) | | | x | | | |
| Duyệt/quản lý gia sư (3.3) | | | | x | | x |
| Lớp cần gia sư, ghép lớp (3.4) | | | | x | | x |
| Ứng tuyển, lịch dạy, buổi học (3.4–3.6 TUTOR) | | | x | | | |
| Lịch học, làm quiz (3.6–3.7 STUDENT) | | x | | | | |
| Nộp minh chứng phí (3.8) | | | x | thu hộ | | |
| Duyệt phí, hoàn tiền, thống kê (3.8–3.9) | | | | | x | |
| Khiếu nại (3.9) | | | | x | xem | x |
| Quản lý học sinh (3.10) | | | | x | | x |
| Quản lý nhân sự (3.10) | | | | | | x |
