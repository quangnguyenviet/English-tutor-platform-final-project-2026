# Kế hoạch: tính năng "Hồ sơ gia sư" (Xem / Sửa / Duyệt)

## 1. Luồng trạng thái hồ sơ

```
┌──────────┐   Gửi duyệt   ┌─────────┐   Lễ tân duyệt   ┌────────┐
│INCOMPLETE├──────────────►│ PENDING ├──────────────────►│ ACTIVE │
└──────────┘               └────┬────┘                   └───┬────┘
                               │ ▲                          │
                        Gia sư hủy│                          │ Sửa field
                                 │ │                      cho phép (*)
                                 └─┘                          │
                           ┌──────────┐                       │
                           │ REJECTED │                       ▼
                           └────┬─────┘              Lưu trực tiếp,
                                │                  KHÔNG cần duyệt lại
                           Sửa hồ sơ +
                           gửi duyệt lại
                                │
                                ▼
                          ┌─────────┐
                          │ PENDING │
                          └─────────┘
```

**Tóm tắt:**

1. Gia sư đăng ký tài khoản → `profileStatus = INCOMPLETE`.
2. Gia sư điền hồ sơ + bấm **"Gửi duyệt"** → `PENDING`.
3. Lễ tân (Receptionist/Admin) duyệt → `ACTIVE` | từ chối → `REJECTED` (kèm lý do).
4. `REJECTED`: gia sư sửa hồ sơ rồi bấm **"Gửi duyệt lại"** → quay về `PENDING`.
5. `PENDING`: gia sư có thể bấm **"Hủy duyệt"** để retirer hồ sơ về `INCOMPLETE`, sau đó sửa tự do tất cả trường và bấm **"Gửi duyệt"** để quay lại `PENDING`.
6. `ACTIVE`: gia sư **chỉ** sửa được các trường cho phép (bảng bên dưới), lưu trực tiếp, **không cần admin duyệt lại**.

---

## 2. Quy tắc chỉnh sửa theo trạng thái

### 2.1. Khi `INCOMPLETE` hoặc `REJECTED`

Sửa **tất cả** trường, không giới hạn. Phải gửi duyệt lại để chuyển sang `PENDING`.

### 2.2. Khi `PENDING`

**Không được sửa trực tiếp.** Hồ sơ đang chờ duyệt — UI ẩn nút sửa, chỉ hiển thị chế độ xem.

Gia sư có thể bấm **"Hủy duyệt"** để retirer hồ sơ về `INCOMPLETE`. Sau khi về `INCOMPLETE`, có thể sửa **tất cả** trường và bấm **"Gửi duyệt"** để quay lại `PENDING`.

### 2.3. Khi `ACTIVE`

Chỉ sửa các trường sau, **lưu trực tiếp không cần admin duyệt lại** (vì các trường quan trọng như tên, tuổi, quê quán đã bị khóa):

| Trường            | Cho sửa |
| :------------------ | :------: |
| `fullName`        |    ✕    |
| `email`           |    ✓    |
| `dateOfBirth`     |    ✕    |
| `gender`          |    ✕    |
| `phone`           |    ✓    |
| `avatarUrl`       |    ✓    |
| `address`         |    ✓    |
| `hometown`        |    ✕    |
| `university`      |    ✕    |
| `educationStatus` |    ✓    |
| `experienceYears` |    ✓    |
| `bio`             |    ✓    |
| `videoUrl`        |    ✓    |
| `serviceAreas`    |    ✓    |
| `specialties`     |    ✓    |
| `prices`          |    ✓    |
| `availabilities`  |    ✓    |
| `credentials`     |    ✓    |

**Các trường bị khóa khi ACTIVE:** `fullName`, `dateOfBirth`, `gender`, `hometown`, `university`.

---

## 3. Hiện trạng đã kiểm tra

### Backend

| Endpoint                                   | Việc                                                                     |
| :----------------------------------------- | :------------------------------------------------------------------------ |
| `GET /api/v1/tutors/me/profile`          | Lấy hồ sơ gia sư hiện tại                                           |
| `POST /api/v1/tutors/me/profile`         | Upsert toàn bộ hồ sơ (JSON)                                           |
| `POST .../me/profile/avatar`             | Upload avatar lên storage, **chỉ trả URL** (không lưu vào DB) |
| `POST .../me/profile/credentials/upload` | Upload file minh chứng, trả URL theo thứ tự                           |
| `POST .../me/profile/submit`             | Chuyển trạng thái sang `PENDING`                                     |

- Response trả DTO thô (không bọc `ApiResponse`); lỗi trả `{ code, message }`.
- `profileStatus` có 5 giá trị: `INCOMPLETE`, `PENDING`, `ACTIVE`, `INACTIVE`, `REJECTED`.
- Đăng ký tutor luôn tạo sẵn bản ghi `Tutor` với `profileStatus = INCOMPLETE`.
- `submitForReview` trả 409 nếu đang `PENDING` hoặc `ACTIVE`.

**Thiếu:**

- **Endpoint admin duyệt/từ chối** (chưa có).
- **Endpoint gia sư hủy PENDING → INCOMPLETE** (chưa có).
- **Chặn sửa trường bị khóa khi ACTIVE** (upsert hiện cho sửa tất cả).
- **Chặn upsert khi PENDING** (hiện cho sửa tự do).
- **Upload avatar hiện lưu thẳng vào DB** — cần sửa thành chỉ trả URL.

### Frontend

- Route `/tutor/profile` → `TutorProfile.jsx` (mock 100%, dữ liệu hardcode, không gọi API).
- `CreateTutorProfilePage.jsx` đã gọi API thật → tái dùng logic build payload/upload. Trang này đã gửi `avatarUrl` trong payload upsert (dòng 296), nên sau khi backend sửa avatar API thì **FE trang tạo không cần thay đổi gì**.
- `tutorApi.js` đã có đủ 5 hàm cần thiết. Comment của `uploadTutorAvatar` cần cập nhật (bỏ ghi chú "lưu ngay vào tài khoản").

---

## 4. Phạm vi

### Trong phạm vi

- ✅ Xem hồ sơ gia sư theo trạng thái (5 trạng thái).
- ✅ Sửa hồ sơ khi `INCOMPLETE`/`REJECTED` (tất cả trường) + gửi duyệt.
- ✅ Sửa hồ sơ khi `ACTIVE` (chỉ trường cho phép, lưu trực tiếp).
- ✅ Khóa sửa khi `PENDING`; cho phép **hủy duyệt** về `INCOMPLETE` rồi sửa tự do.
- ✅ Upload avatar & file chứng chỉ.
- ✅ Backend: endpoint admin duyệt/từ chối hồ sơ.
- ✅ Backend: endpoint gia sư hủy hồ sơ PENDING → INCOMPLETE.
- ✅ Backend: chặn upsert khi `PENDING`, chặn trường khóa khi `ACTIVE`.
- ✅ Loading, empty, error, 401, confirm rời trang.

### Ngoài phạm vi

- ❌ Giao diện admin (trang danh sách hồ sơ chờ duyệt) — chỉ làm API, test bằng Swagger/Postman.
- ❌ Trạng thái `INACTIVE` — giữ enum nhưng chưa có luồng UI.
- ❌ Các field không có DB: `zalo`, `facebookUrl`, `feeNote`, `isAcceptingClasses`.
- ❌ Hợp nhất `CreateTutorProfilePage` với trang sửa.

---

## 5. Thiết kế backend — Thay đổi cần làm

### 5.1. Endpoint admin duyệt/từ chối (MỚI)

**File mới:** `AdminTutorController.java` + `AdminTutorService.java`

```
POST /api/v1/admin/tutors/{tutorId}/approve
POST /api/v1/admin/tutors/{tutorId}/reject
  Body: { "rejectionReason": "..." }
GET  /api/v1/admin/tutors/pending
  → Danh sách hồ sơ đang PENDING (phục vụ trang admin sau)
```

**Logic:**

- `approve`: set `profileStatus = ACTIVE`, `reviewedBy = currentAdminId`, `reviewedAt = now()`, `rejectionReason = null`.
- `reject`: set `profileStatus = REJECTED`, `reviewedBy`, `reviewedAt`, `rejectionReason = request.reason`.
- Guard: chỉ `PENDING` mới được approve/reject, khác thì trả 409.
- `@PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")`.

### 5.1.1. Endpoint gia sư hủy hồ sơ PENDING (MỚI)

```
POST /api/v1/tutors/me/profile/cancel
```

**Logic:**

- Chỉ cho phép khi `profileStatus = PENDING`; khác thì trả 409 (`TUTOR_PROFILE_NOT_PENDING`).
- Set `profileStatus = INCOMPLETE`, `rejectionReason = null`, `reviewedBy = null`, `reviewedAt = null`.
- Sau khi hủy, gia sư có thể sửa tất cả trường và gửi duyệt lại.

---

### 5.2. Sửa `upsertProfile` — chặn khi PENDING + khóa field khi ACTIVE

**File:** [TutorProfileService.java](file:///d:/code/do-an/backend/src/main/java/com/mycompany/englishtutor/module/tutor/service/TutorProfileService.java)

**Thay đổi logic `upsertProfile`:**

```java
// Sau khi lấy tutor, kiểm tra trạng thái:

// 1. PENDING → không cho sửa
if ("PENDING".equals(tutor.getProfileStatus())) {
    throw new AppException(ErrorCode.TUTOR_PROFILE_PENDING);
    // FE: "Hồ sơ đang chờ duyệt, không thể chỉnh sửa"
}

// 2. ACTIVE → chỉ cho sửa trường trong whitelist, bỏ qua trường bị khóa
if ("ACTIVE".equals(tutor.getProfileStatus())) {
    // Bỏ qua: fullName, dateOfBirth, gender, hometown, university
    // Chỉ cập nhật: phone, avatarUrl, address, educationStatus,
    //               experienceYears, bio, videoUrl + 5 mảng con
    updateAllowedFieldsOnly(tutor, user, request);
    return mapToResponse(user, tutor);
}

// 3. INCOMPLETE / REJECTED → sửa tất cả (giữ logic hiện tại)
```

**Thêm method `updateAllowedFieldsOnly`:**

```java
private TutorProfileResponse updateAllowedFieldsOnly(
        Tutor tutor, User user, TutorProfileUpsertRequest request) {
    // User fields cho phép sửa
    if (request.getPhone() != null) user.setPhone(request.getPhone());
    if (request.getAvatarUrl() != null) user.setAvatarUrl(request.getAvatarUrl());
    userRepository.save(user);

    // Tutor fields cho phép sửa
    if (request.getAddress() != null) tutor.setAddress(request.getAddress());
    if (request.getEducationStatus() != null) tutor.setEducationStatus(request.getEducationStatus());
    if (request.getExperienceYears() != null) tutor.setExperienceYears(request.getExperienceYears().shortValue());
    if (request.getBio() != null) tutor.setBio(request.getBio());
    if (request.getVideoUrl() != null) tutor.setVideoUrl(request.getVideoUrl());
    tutorRepository.save(tutor);

    // 5 mảng con — cho phép cập nhật tất cả
    updateServiceAreas(tutor, request.getServiceAreas());
    updateSpecialties(tutor, request.getSpecialties());
    updatePrices(tutor, request.getPrices());
    updateAvailabilities(tutor, request.getAvailabilities());
    updateCredentials(tutor, request.getCredentials());

    return mapToResponse(user, tutor);
}
```

### 5.3. Sửa `uploadAvatar` — chỉ upload, không lưu DB

**File:** [TutorProfileService.java](file:///d:/code/do-an/backend/src/main/java/com/mycompany/englishtutor/module/tutor/service/TutorProfileService.java) — method `uploadAvatar` (dòng 136–148)

**Hiện tại:** upload file lên storage rồi **ghi luôn `avatarUrl` vào `user`** trong DB.
**Sửa thành:** chỉ upload file, trả URL. **Không gọi `user.setAvatarUrl()` / `userRepository.save()`.**

```java
@Transactional
public String uploadAvatar(MultipartFile avatarFile) {
    // Chỉ cần xác thực user tồn tại (giữ guard)
    getCurrentUserId();

    String avatarUrl = storageService.uploadFile("avatars", avatarFile);
    log.info("Avatar uploaded, url: {}", avatarUrl);
    return avatarUrl;  // FE giữ URL, gửi lại trong upsert payload
}
```

**Tác động:**

- `avatarUrl` chỉ được lưu vào DB khi FE gọi `POST /me/profile` (upsert) với field `avatarUrl` trong JSON body — **logic này đã có sẵn** ở cả `upsertProfile` (dòng 83–85) và `updateAllowedFieldsOnly`.
- `CreateTutorProfilePage.jsx` đã gửi `avatarUrl` trong payload upsert (dòng 296) → **không cần sửa FE trang tạo**.
- `tutorApi.js`: cập nhật comment `uploadTutorAvatar` (bỏ ghi chú "Ảnh được lưu ngay vào tài khoản người dùng ở backend").
- Nếu user upload avatar rồi **không bấm Lưu** → ảnh tồn tại trên storage nhưng **không ghi vào hồ sơ** → đúng kỳ vọng (Hủy = không thay đổi gì).

### 5.4. Sửa `submitForReview` — clear `rejectionReason`

```java
tutor.setProfileStatus("PENDING");
tutor.setRejectionReason(null);  // ← THÊM dòng này
tutorRepository.save(tutor);
```

### 5.5. Thêm ErrorCode mới

```java
TUTOR_PROFILE_PENDING(1030, "Hồ sơ đang chờ duyệt, không thể chỉnh sửa", HttpStatus.CONFLICT),
TUTOR_PROFILE_NOT_PENDING(1031, "Hồ sơ không ở trạng thái chờ duyệt", HttpStatus.CONFLICT),
```

---

## 6. Mapping dữ liệu API ⇄ form

| API (`TutorProfileResponse`)                                                                                      | Form state              | Chuyển đổi                                                                                             |
| :------------------------------------------------------------------------------------------------------------------ | :---------------------- | :-------------------------------------------------------------------------------------------------------- |
| `fullName`, `email`, `phone`, `avatarUrl`, `address`, `hometown`, `university`, `bio`, `videoUrl` | trùng tên             | `fullName`, `dateOfBirth`, `gender`, `hometown`, `university` → **read-only khi ACTIVE** |
| `dateOfBirth` (`String` ISO)                                                                                    | `dateOfBirth`         | `<input type="date">` dùng `YYYY-MM-DD`                                                              |
| `gender`                                                                                                          | `gender`              | `MALE` / `FEMALE` / `OTHER`                                                                         |
| `educationStatus`                                                                                                 | `educationStatus`     | `STUDENT` / `GRADUATED` / `LECTURER`                                                                |
| `experienceYears`                                                                                                 | `experienceYears`     | number, ≥ 0                                                                                              |
| `profileStatus`, `rejectionReason`, `reviewedAt`, `updatedAt`                                               | `profile` (read-only) | chỉ hiển thị                                                                                           |
| `serviceAreas[]`                                                                                                  | `serviceAreas[]`      | `{ province, district }`                                                                                |
| `specialties[]`                                                                                                   | `specialties[]`       | `{ specialty, gradeLevel }`                                                                             |
| `prices[]`                                                                                                        | `prices[]`            | `{ teachingMode, pricePerSession, program }`                                                            |
| `availabilities[]`                                                                                                | `availabilities[]`    | `{ dayOfWeek 1–7, timeSlot }`                                                                          |
| `credentials[]`                                                                                                   | `credentials[]`       | `{ title, type, score, fileUrl }`                                                                       |

**Quy tắc payload:** luôn gửi **đủ cả 5 mảng** (`serviceAreas`, `specialties`, `prices`, `availabilities`, `credentials`), kể cả rỗng `[]`. Backend `deleteByTutorId` rồi insert lại.

---

## 7. Hành vi theo trạng thái (UI)

| `profileStatus` | Nhãn UI                   | Badge   | Xem |             Sửa             | Hủy duyệt |      Gửi duyệt      |
| :---------------- | :------------------------- | :------ | :-: | :--------------------------: | :-------: | :-------------------: |
| `INCOMPLETE`    | Chưa hoàn thiện hồ sơ | amber   | ✓ |    ✓ (tất cả trường)    |     ✕     |   ✓ "Gửi duyệt"   |
| `PENDING`       | Đang chờ duyệt          | amber   | ✓ |              ✕              |     ✓     |          ✕          |
| `ACTIVE`        | Đã duyệt                | emerald | ✓ | ✓ (chỉ trường cho phép) |     ✕     |          ✕          |
| `REJECTED`      | Bị từ chối              | rose    | ✓ |    ✓ (tất cả trường)    |     ✕     | ✓ "Gửi duyệt lại" |
| `INACTIVE`      | Tạm ngưng                | slate   | ✓ |              ✕              |     ✕     |          ✕          |

---

## 8. Kiến trúc frontend

### File mới

```
frontend/src/lib/tutorProfileModel.js        # mapper + validate + build payload
frontend/src/lib/tutorProfileModel.test.js   # unit test
frontend/src/components/tutor/profile/
  ProfileStatusBanner.jsx      # banner theo trạng thái + lý do từ chối
  ProfileView.jsx              # chế độ xem
  ProfileEditForm.jsx          # chế độ sửa (phân biệt full edit vs restricted edit)
  sections/PersonalSection.jsx
  sections/EducationSection.jsx
  sections/IntroSection.jsx
  sections/ServiceAreasSection.jsx
  sections/SpecialtiesSection.jsx
  sections/PricesSection.jsx
  sections/AvailabilitySection.jsx
  sections/CredentialsSection.jsx
  ProfileSkeleton.jsx
  ProfileEmptyState.jsx
```

### File sửa

- **TutorProfile.jsx**: viết lại — fetch, state, điều phối View ↔ Edit, action bar.
- **tutorApi.js**: thêm hàm `cancelProfileForReview(token)` (gọi `POST .../me/profile/cancel`); tổng 6 hàm.

### Hai chế độ sửa

**Full edit** (INCOMPLETE / REJECTED): tất cả trường đều editable.

**Restricted edit** (ACTIVE): các trường `fullName`, `dateOfBirth`, `gender`, `hometown`, `university` hiện ở chế độ read-only (có label "Không thể chỉnh sửa sau khi hồ sơ đã duyệt"), còn lại editable. Nút "Lưu" lưu trực tiếp, không cần duyệt lại.

### State & luồng

```text
useEffect(load)
  apiGetTutorProfile(token)
  → mapApiToForm(data) → setProfile(data), setForm(normalized)
  → xác định mode dựa trên profileStatus

Chế độ Sửa:
  INCOMPLETE/REJECTED → full form, tất cả trường editable
  ACTIVE → restricted form, trường bị khóa disabled/read-only
  PENDING → KHÔNG cho vào chế độ sửa

Lưu:
  validate(form)
  nếu có avatar mới → uploadTutorAvatar(token, file) → nhận avatarUrl
                       (chỉ upload, chưa lưu DB)
  upload file chứng chỉ mới (nếu có)
  buildUpsertPayload(form, profileStatus)  // gắn avatarUrl vào payload
                                            // khi ACTIVE: backend bỏ qua trường khóa
  apiSubmitTutorProfile(token, payload)    // avatarUrl được lưu vào DB ở bước này
  refresh profile
  toast "Đã lưu hồ sơ"

Gửi duyệt (chỉ INCOMPLETE/REJECTED):
  nếu dirty → lưu trước
  apiSubmitProfileForReview(token) → profileStatus = PENDING
  toast "Đã gửi duyệt"

Hủy duyệt (chỉ PENDING):
  apiCancelProfileForReview(token) → profileStatus = INCOMPLETE
  toast "Đã hủy duyệt, bạn có thể chỉnh sửa lại hồ sơ"
```

---

## 9. UI chi tiết

### Chế độ Xem

- **ProfileStatusBanner**: 5 biến thể màu; `REJECTED` hiện khối lý do từ chối.
- **Hero card**: avatar, tên, email, badge trạng thái, SĐT, ngày sinh, giới tính, quê quán, địa chỉ.
- **Nút hành động**:
  - `INCOMPLETE` / `REJECTED`: "Chỉnh sửa hồ sơ" + "Gửi duyệt" / "Gửi duyệt lại"
  - `ACTIVE`: "Chỉnh sửa hồ sơ" (restricted)
  - `PENDING`: không có nút sửa — hiện thông báo "Hồ sơ đang chờ duyệt" + nút "Hủy duyệt" (trở về INCOMPLETE)
- Layout bất đối xứng responsive: giới thiệu + chuyên môn + học phí | lịch rảnh + khu vực + chứng chỉ.

### Chế độ Sửa

- 8 card section, mỗi card có heading + icon lucide.
- **Khi ACTIVE**: các trường bị khóa (`fullName`, `dateOfBirth`, `gender`, `hometown`, `university`) hiện dạng text read-only với icon khóa + tooltip "Không thể sửa sau khi hồ sơ đã duyệt".
- Avatar: preview + upload (chỉ upload file, chưa lưu DB). Ảnh chỉ được gắn vào hồ sơ khi bấm "Lưu".
- Repeater: khu vực dạy / chuyên môn / học phí / chứng chỉ.
- Lịch rảnh: bảng checkbox 7×3.
- Sticky action bar: "Hủy" + "Lưu hồ sơ".
- Nút "Gửi duyệt" chỉ hiện khi `INCOMPLETE` / `REJECTED`.

### Loại bỏ khỏi UI

`zalo`, `phoneBackup`, `facebookUrl`, `currentRole`, `faculty`, `graduationScore`, `academicRank`, `feeUnit`, `feeNote`, `isAcceptingClasses`, thanh prototype, nút giả lập Admin.

---

## 10. Xử lý lỗi & biên

| Tình huống                    | Hành vi                                                                             |
| :------------------------------ | :----------------------------------------------------------------------------------- |
| 401 / token hết hạn           | Banner "Phiên đăng nhập hết hạn" + nút về `/login?role=tutor`              |
| 404 `TUTOR_PROFILE_NOT_FOUND` | Empty state + CTA sang `/tutor/create-profile`                                     |
| 409 khi upsert (PENDING)        | "Hồ sơ đang chờ duyệt, không thể chỉnh sửa" — refresh, ẩn nút sửa       |
| 409 khi submit                  | "Hồ sơ đã được gửi duyệt" — refresh                                        |
| 409 khi hủy duyệt (không PENDING)| "Không thể hủy hồ sơ tại trạng thái này" — refresh                        |
| 400 validation                  | Hiện message lỗi; map lỗi kỹ thuật về tiếng Việt                             |
| Mất mạng                      | Banner lỗi + nút "Thử lại", không mất dữ liệu form                           |
| Upload avatar lỗi              | Giữ ảnh cũ, báo lỗi, không chặn Lưu (gửi payload không có avatarUrl mới) |
| Upload chứng chỉ lỗi         | Dừng trước upsert, báo rõ tệp nào lỗi                                        |
| Rời trang khi dirty            | `beforeunload` + confirm                                                           |

---

## 11. Phân rã công việc & ước lượng

| # | Việc                                                                                                                                                    | Output                                                                        | Ước lượng      |
| :-: | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------- | :----------------- |
| 1 | **Backend: Admin endpoint duyệt/từ chối**                                                                                                       | `AdminTutorController` + `AdminTutorService` + approve/reject/listPending | 1 ngày            |
| 1.5 | **Backend: endpoint gia sư hủy PENDING → INCOMPLETE**                                                                                     | `TutorProfileController`/`Service` + cancel logic                       | 0,5 ngày          |
| 2 | **Backend: sửa upsertProfile + uploadAvatar + submitForReview** — chặn PENDING, khóa field ACTIVE, avatar chỉ trả URL, clear rejectionReason | `TutorProfileService` sửa + cập nhật comment `tutorApi.js`             | 0,5 ngày          |
| 3 | **FE: `tutorProfileModel.js`** — mapper, validate, build payload, field lock logic + unit test                                                  | Mapper thuần, test xanh                                                      | 0,5 ngày          |
| 4 | **FE: Page shell** — fetch + skeleton/error/empty + `ProfileStatusBanner`                                                                       | Xem được hồ sơ thật                                                     | 1 ngày            |
| 5 | **FE: `ProfileView`** — chế độ xem đầy đủ, responsive, dark mode                                                                         | Chế độ xem hoàn chỉnh                                                    | 1 ngày            |
| 6 | **FE: `ProfileEditForm`** — full edit + restricted edit + 8 section                                                                             | Sửa được, phân biệt ACTIVE vs khác                                     | 2 ngày            |
| 7 | **FE: Luồng Lưu / Upload / Gửi duyệt / dirty guard / toast**                                                                                   | Chạy thật end-to-end                                                        | 1 ngày            |
| 8 | **QA + polish**                                                                                                                                    | Lint, build, test thủ công, dark mode, mobile                               | 1 ngày            |
|  | **Tổng**                                                                                                                                          |                                                                               | **~8,5 ngày** |

---

## 12. Kiểm thử

### Thủ công

1. Đăng ký tutor mới → `INCOMPLETE` → xem empty state.
2. Điền đủ form → Lưu → F5 → dữ liệu còn nguyên.
3. Gửi duyệt → `PENDING` → **không sửa được** → UI khóa.
4. Admin approve (Swagger) → `ACTIVE` → sửa được trường cho phép, trường khóa disabled.
5. Sửa phone, bio, thêm chứng chỉ → Lưu → **không thay đổi trạng thái**, vẫn ACTIVE.
6. Xác nhận `fullName`, `dateOfBirth`, `gender`, `hometown`, `university` **không đổi** dù payload gửi lên có giá trị.
7. Admin reject (Swagger) → `REJECTED` → thấy lý do → sửa tất cả trường → "Gửi duyệt lại" → `PENDING`.
8. Tắt backend → banner lỗi + Thử lại.
9. Token hết hạn → redirect login.
10. Rời trang khi đang sửa → cảnh báo.
11. `PENDING` → "Hủy duyệt" → `INCOMPLETE` → sửa tất cả trường → "Gửi duyệt" → quay lại `PENDING`.
12. Mobile 375px, dark mode.

### Tự động

- `node --test src/lib/tutorProfileModel.test.js` — mapper: payload đủ 5 mảng, field lock khi ACTIVE đúng, validate bắt trường bắt buộc.
- `npm run lint`, `npm run build`.

---

## 13. Rủi ro

| Rủi ro                                                                    |    Mức    | Giảm thiểu                                                                     |
| :------------------------------------------------------------------------- | :---------: | :------------------------------------------------------------------------------- |
| Mất dữ liệu do replace-all (payload thiếu mảng → xoá sạch)         |     Cao     | Mapper luôn gửi đủ 5 mảng, kể cả `[]`                                   |
| FE gửi field khóa khi ACTIVE, backend phải bỏ qua                      | Trung bình | Backend `updateAllowedFieldsOnly` tách biệt, không động đến field khóa |
| Avatar file tồn tại trên storage nhưng user không Lưu → file orphan |    Thấp    | Chấp nhận; dọn bằng cron job sau nếu cần                                   |

---

## 14. Tổng kết quyết định thiết kế

1. **PENDING = không sửa trực tiếp**, nhưng cho phép **Hủy duyệt** về `INCOMPLETE` → sửa tự do → gửi duyệt lại. Giúp gia sư sửa lỗi/hồ sơ cũ mà không cần đợi admin hay tạo hồ sơ mới.
2. **ACTIVE = sửa giới hạn, không cần duyệt lại** — vì trường quan trọng (tên, tuổi, quê, trường) đã khóa.
3. **Backend enforce field lock** — FE disable trường nhưng backend cũng bỏ qua field khóa khi ACTIVE → defense in depth.
4. **Admin endpoint riêng** — tách khỏi tutor self-service, bảo vệ bằng role `RECEPTIONIST`/`ADMIN`.
