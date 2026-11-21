# Kế hoạch: Quota lưu trữ tài liệu buổi học theo gói gia sư (FREE / PRO / PREMIUM)

> Yêu cầu gốc (đã chốt với user):
> - "Gia sư upload tài liệu, tạo quiz liên tục → tốn dung lượng, hệ thống bị lỗ. Tìm giải pháp."
> - Quiz **không** tốn storage (chỉ là text cấu trúc trong DB) → thứ cần kiểm soát là **file lesson materials** (PDF/ảnh/audio/video, mỗi file ≤20MB).
> - Chốt: **Quota theo 3 gói thuê bao** `FREE 1 GB / PRO 10 GB / PREMIUM 50 GB`, admin gán gói.
> - Chốt (bổ sung sau review plan): **gói trả phí (PRO/PREMIUM) có thời hạn theo tháng** — cột
>   `storage_tier_expires_at` (NULL = FREE vô thời hạn). Lễ tân gán gói + thời hạn (1/3/12 tháng);
>   quá hạn → gói trả phí bị coi như FREE, upload vượt 1GB bị chặn kèm CTA "liên hệ lễ tân để gia hạn".
>   **Không** làm metered billing theo GB (model C — cần payment gateway, ngoài phạm vi đồ án).
> - Chốt: **Chỉ tính dung lượng từ `lesson_materials`** (credentials/avatars ngoài phạm vi).
> - Chặn upload **trước** khi gọi MinIO nếu `used + newSize > quota`; widget tutor xem `used / quota`.

## 1. Context — tại sao phải làm

Hiện `ClassOccurrenceService.uploadMaterial` chỉ chặn **trần 1 file = 20MB**, **không có giới hạn tổng** theo tutor. Mỗi file sống vĩnh viễn (chỉ xóa khi gia sư chủ động `deleteMaterial`). Chạy MinIO trên VPS disk cố định → full disk → phải nâng VPS → "lỗ".

Giải pháp: biến dung lượng thành **nội dung gói** (FREE/PRO/PREMIUM), **gói trả phí có thời hạn theo
chu kỳ tháng** (lễ tân gán + thời hạn khi thanh toán offline; qua hạn tự revert về FREE) → storage
trở thành điểm bán subscription thay vì chi phí chìm. Quota trả phí được "nhả dần" theo thời gian,
không cần cổng thanh toán trong hệ thống (thu tiền offline qua lễ tân, đúng quy mô đồ án).

## 2. Nhánh

- Tách `feature/tutor-storage-quota` từ `dev`. Không trộn vào nhánh khác.
- Commit theo 6 bước ở mục 8, mỗi bước 1 commit + test pass, gộp PR vào `dev`.

## 3. Database — migration mới `V29__tutor_storage_tier.sql`

> Migration hiện đại nhất trên `dev` là `V28__class_request_posting_details.sql` → đặt tên **V29**
> (plan viết lúc đầu dùng V27 nhưng V27/V28 đã được merge sau đó).

```sql
-- Gói lưu trữ tài liệu buổi học cho gia sư (V29): FREE / PRO / PREMIUM.
-- Quota = SUM(lesson_materials.file_size) qua lessons.class_id -> classes.tutor_id.
-- Gói trả phí (PRO/PREMIUM) có thời hạn theo tháng: storage_tier_expires_at = thời điểm hết hạn;
-- NULL = gói FREE (vô thời hạn) hoặc gói trả phí chưa được gán thời hạn (không xảy ra —
-- form admin luôn bắt time hạn khi chọn PRO/PREMIUM). Quá hạn → coi như FREE.
-- Mặc định FREE (ADD COLUMN ... DEFAULT tự backfill mọi hàng có sẵn);
-- admin/lễ tân đổi gói + thời hạn qua PATCH /api/v1/tutors/{id} (tutor không tự upgrade — thu tiền offline).
ALTER TABLE tutors
    ADD COLUMN storage_tier VARCHAR(10) NOT NULL DEFAULT 'FREE',
    ADD COLUMN storage_tier_expires_at TIMESTAMPTZ NULL,
    ADD CONSTRAINT chk_tutors_storage_tier CHECK (storage_tier IN ('FREE', 'PRO', 'PREMIUM'));
```

- Không thêm index mới cho `lesson_materials` (SUM theo `classes.tutor_id` chạy qua index có sẵn
  `idx_lesson_materials_lesson_id` + `classes` nhỏ). Nếu sau này số liệu lớn, thêm
  `CREATE INDEX ON lesson_materials(lesson_id)` (đã có) là đủ.
- **Quan trọng:** `spring.jpa.hibernate.ddl-auto: validate` → entity `Tutor` **phải** có field
  `storageTier` **và** `storageTierExpiresAt` khớp (mục 4.1), nếu không app không start được khi flyway đã chạy V29.

## 4. Backend

### 4.1 Enum `StorageTier` (mới) — source duy nhất của quota

`module/tutor/domain/enums/StorageTier.java` (mô phỏng enum thường khác trong module):

```java
public enum StorageTier {
    FREE(1L * 1024 * 1024 * 1024),        // 1 GB — gói mặc định, vô thời hạn
    PRO(10L * 1024 * 1024 * 1024),        // 10 GB
    PREMIUM(50L * 1024 * 1024 * 1024);    // 50 GB

    private final long quotaBytes;
    StorageTier(long quotaBytes) { this.quotaBytes = quotaBytes; }
    public long quotaBytes() { return quotaBytes; }

    /** Gói hiệu lực tại thời điểm T: gói trả phí mà expires_at đã qua → FREE.
     *  null = FREE (vô thời hạn) → trả FREE. */
    public static StorageTier effective(String tierName, OffsetDateTime expiresAt, OffsetDateTime now) {
        StorageTier tier = valueOf(tierName);
        if (tier == FREE || expiresAt == null || now.isBefore(expiresAt)) return tier;
        return FREE;
    }
}
```

> Chọn **enum Java** chứ không phải `application.yaml`: quota theo tên gói là quy tắc sản phẩm cố
> định, không phải cấu hình vận hành. Có 1 nguồn type-safe cho validation admin, check upload, widget
> đều gọi `StorageTier.valueOf(tier).quotaBytes()`; `effective(...)` là cách **duy nhất** tính quota
> khi có thời hạn (mọi caller — gate upload, widget, admin response — đều đi qua nó, không tự viết
> điều kiện `expiresAt` rải rác).

**Thời hạn gói trả phí:** `TutorStorageService` (mục 4.6) là nơi quy đổi "lễ tân chọn N tháng" →
`OffsetDateTime` cụ thể (1/3/12 tháng từ thời điểm gán, giữ trong 1 constant map `VALID_DURATIONS =
{1, 3, 12}`). Gói FREE luôn `expiresAt = null` (validation: FREE + expiresAt phải khớp null lẫn nhau).

### 4.2 Entity `Tutor` + `ErrorCode`

- `module/tutor/domain/Tutor.java` — thêm (mô phỏng cột `openToTeaching` L73-75, `@Builder.Default`):
  ```java
  @Builder.Default
  @Column(name = "storage_tier", nullable = false, length = 10)
  String storageTier = StorageTier.FREE.name();

  @Builder.Default
  @Column(name = "storage_tier_expires_at")
  OffsetDateTime storageTierExpiresAt = null;   // null = FREE (vô thời hạn)
  ```
- `shared/exception/ErrorCode.java` — thêm sau L262 (`EMPLOYEE_CONTACT_EXISTED(1602...)`), số free là **1603–1604**:
  ```java
  // --- Quota lưu trữ tài liệu theo gói gia sư (tutors.storage_tier, V29) ---
  TUTOR_STORAGE_QUOTA_EXCEEDED(
      1603, "Đã vượt dung lượng lưu trữ tối đa của gói hiện tại", HttpStatus.BAD_REQUEST),
  TUTOR_STORAGE_TIER_EXPIRED(
      1604, "Gói lưu trữ trả phí đã hết hạn, vui lòng liên hệ lễ tân để gia hạn", HttpStatus.BAD_REQUEST),
  ```
  Dùng `BAD_REQUEST` (400) cho nhất quán với precedent "limit reached" trong codebase
  (`REVIEW_DECK_LIMIT_REACHED(1427...)`, `MATERIAL_FILE_TOO_LARGE(1158...)` đều là 400).

  Phân biệt 1603 vs 1604 (dùng trong gate, mục 4.4): quota bị vượt **vì gói còn hạn** → 1603
  (CTA "nâng gói"); gói trả phí **đã hết hạn** (effective = FREE) mà upload vượt phần FREE → 1604
  (CTA "gia hạn gói"). Frontend nhận `err.code` để hiện đúng dòng CTA (mục 5).

### 4.3 Repo: tổng bytes đã dùng của 1 tutor

`module/classroom/repository/ClassroomQueryRepository.java` — thêm cạnh `insertLessonMaterial` (~L859),
mô phỏng aggregate `ComplaintQueryRepository.sumPaidRefunds` (JdbcTemplate vì `lesson_materials`
không có JPA entity):

```java
/** Tổng bytes tài liệu buổi học của 1 gia sư (lesson_materials qua lessons.class_id -> classes.tutor_id). */
public long sumTutorMaterialBytes(Long tutorId) {
    Long sum = jdbcTemplate.queryForObject(
        """
        SELECT COALESCE(SUM(m.file_size), 0)
        FROM lesson_materials m
        JOIN lessons l ON l.id = m.lesson_id
        JOIN classes c ON c.id = l.class_id
        WHERE c.tutor_id = ?
        """, Long.class, tutorId);
    return sum == null ? 0L : sum;
}
```

### 4.4 Chặn quota trong `ClassOccurrenceService.uploadMaterial`

`module/classroom/service/ClassOccurrenceService.java`:
- Thêm field `private final TutorRepository tutorRepository;` (class `@RequiredArgsConstructor`).
- Trong `uploadMaterial` (L490-536), **sau** `requireClassOwnerForLesson` (L497) + kiểm tra 20MB/định dạng
  (giữ nguyên thứ tự), **trước** `storageService.uploadFile` (L507):
  ```java
  Tutor tutor = tutorRepository.findDetailById(lesson.tutorId())
          .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));
  long used = classroomRepository.sumTutorMaterialBytes(lesson.tutorId());
  OffsetDateTime now = OffsetDateTime.now();
  StorageTier tier = StorageTier.valueOf(tutor.getStorageTier());
  StorageTier effective = StorageTier.effective(tutor.getStorageTier(), tutor.getStorageTierExpiresAt(), now);
  long quota = effective.quotaBytes();
  boolean expired = effective == FREE && (tier == PRO || tier == PREMIUM);
  if (used + file.getSize() > quota) {
      if (expired) {
          throw new AppException(ErrorCode.TUTOR_STORAGE_TIER_EXPIRED,
              String.format("Gói %s đã hết hạn (hạn dùng %s), hiện áp dụng %s; tệp %s vượt dung lượng.",
                  tier, formatDate(tutor.getStorageTierExpiresAt()),
                  formatBytes(quota), formatBytes(file.getSize())));
      } else {
          throw new AppException(ErrorCode.TUTOR_STORAGE_QUOTA_EXCEEDED,
              String.format("Gói %s đã dùng %s / %s; tệp này %s sẽ vượt quá dung lượng.",
                  tier, formatBytes(used), formatBytes(quota), formatBytes(file.getSize())));
      }
  }
  ```
- Helper private `formatBytes(long)` (B/KB/MB/GB) + `formatDate(OffsetDateTime)` (dd/MM/yyyy)
  trong service để message người dùng dễ đọc (message này chính là thứ hiện ra ở frontend).
- `tutorId` = `lesson.tutorId()` (từ `lockLesson` join `classes c ... c.tutor_id`); vì
  `tutors.id == users.id` (`@MapsId`) nên `findDetailById(lesson.tutorId())` đúng.
- **Ghi chú "nhả dần" quota:** không cần job scheduled — gói hết hạn tự revert về FREE ngay tại
  thời điểm upload kế tiếp (kiểm tra 1 line, rẻ). `expires_at` chỉ là "deadline", không phải
  trigger; admin/widget vẫn thấy trạng thái hết hạn đúng thời điểm.

### 4.5 Admin đổi gói: extend `PATCH /{tutorId}`

Không tạo endpoint mới — dùng PATCH tutor profile đang có (`AdminTutorController`, L173-185):
- `module/tutor/api/request/TutorAdminUpdateRequest.java` — thêm:
  ```java
  @Pattern(regexp = "^(FREE|PRO|PREMIUM)$", message = "Gói lưu trữ không hợp lệ (FREE, PRO hoặc PREMIUM)")
  String storageTier;

  @Min(1) @Max(12)   // 1 / 3 / 12 tháng
  Integer storageTierDurationMonths;   // chỉ có nghĩa khi tier = PRO/PREMIUM; FREE → bỏ qua
  ```
- `module/tutor/service/AdminTutorService.java` — trong `updateProfile` (L264-309):
  ```java
  String oldTier = tutor.getStorageTier();
  if (request.getStorageTier() != null) {
      StorageTier tier = StorageTier.valueOf(request.getStorageTier().trim());
      int months = request.getStorageTierDurationMonths() != null ? ... : 1;
      tutor.setStorageTier(tier.name());
      tutor.setStorageTierExpiresAt(
          tier == StorageTier.FREE ? null : OffsetDateTime.now().plusMonths(months));
  }
  ```
  (FREE → `expiresAt = null`; PRO/PREMIUM → `now + months`.) Enrich audit `details`
  (chuyển `Map.of` → `HashMap`) thêm `oldTier`/`newTier`/`expiresAt` khi tier đổi,
  action giữ `UPDATE_TUTOR_PROFILE`.
- `module/tutor/api/response/TutorProfileResponse.java` + mapper — thêm `String storageTier;`
  `OffsetDateTime storageTierExpiresAt;` (admin đọc được gói + hạn hiện tại khi mở edit modal).

### 4.6 Endpoint widget: `GET /api/v1/tutors/me/storage` (mới)

- `module/tutor/api/response/TutorStorageResponse.java` (mới) — record, kèm `effectiveQuotaBytes`:
  ```java
  public record TutorStorageResponse(
      String tier, OffsetDateTime tierExpiresAt,
      long quotaBytes,            // quota theo tier gốc (PRO = 10 GB)
      long effectiveQuotaBytes,   // quota THỰC TẾ tại NOW (PRO hết hạn → 1 GB)
      long usedBytes) {}
  ```
- `module/tutor/service/TutorStorageService.java` (mới) — `getMyStorage()`:
  resolve current user qua `userRepository.findByUsername(SecurityContextHolder…getName())`
  (mô phỏng `TutorProfileService` L46) → load `Tutor` → `StorageTier.effective(tier, expiresAt, now)`
  + `classroomRepository.sumTutorMaterialBytes(tutor.getId())`. Inject `ClassroomQueryRepository`.
- `module/tutor/controller/TutorProfileController.java` — thêm cạnh `/me/profile` (L35):
  ```java
  @GetMapping("/me/storage")
  @PreAuthorize("hasRole('TUTOR')")
  public ResponseEntity<TutorStorageResponse> getStorage() {
      return ResponseEntity.ok(tutorStorageService.getMyStorage());
  }
  ```
  Widget frontend vẽ thanh tiến độ theo **effectiveQuotaBytes** (đúng với upload bị chặn khi nào)
  và hiện `tier` + `tierExpiresAt` ("Gói PRO · hết hạn 15/08").

### 4.7 Mapping đọc/ghi bảng theo thao tác (bắt buộc)

| # | Thao tác | Đọc | Ghi |
|---|----------|-----|-----|
| 1 | Quota gate trong `uploadMaterial` | `tutors.storage_tier`+`storage_tier_expires_at` (+`id`); `lesson_materials.file_size` JOIN `lessons.lesson_id` JOIN `classes.class_id`+`classes.tutor_id` | — (chặn trước khi MinIO) |
| 2 | Ghi material (không đổi, chỉ chạy khi quota PASS) | — | `lesson_materials(lesson_id, uploaded_by, file_name, file_url, file_type, file_size)` |
| 3 | `GET /me/storage` (widget) | `users`(current), `tutors.storage_tier`+`storage_tier_expires_at`, SUM `lesson_materials.file_size` | — |
| 4 | Admin đổi gói (`updateProfile`) | `tutors`, `users` | `tutors.storage_tier`+`storage_tier_expires_at` (+`updated_at` auto), `audit_logs`(INSERT, details old/new tier + expiresAt) |

**Không đụng:** `deleteMaterial` (xóa S3 + DB row → tự giảm quota), `tutor_credentials`,
`credentials/` S3, avatar upload, trần `MATERIAL_MAX_BYTES`(20MB) & `multipart max-file-size`(50MB).
**Không có scheduled job** — gói hết hạn tự hạ về FREE tại thời điểm upload/widget kế tiếp
(1 line check), không cần cron.

## 5. Frontend

| File | Thay đổi |
|---|---|
| `lib/tutorApi.js` | + `apiGetTutorStorage(token)` (mô phỏng `apiGetTutorProfile` L105: `GET /api/v1/tutors/me/storage`, `bearerHeader`/`readJson`/`extractErrorMessage`, gắn `err.status` + `err.code`). **Không** đổi `apiUpdateTutorProfile` — nó đã POST toàn bộ form, chỉ cần form thêm trường. Reuse `formatBytes` có sẵn trong `classroomApi.js` (L524). |
| `lib/classroomApi.js` | Trong `request` (L33) và `requestMultipart` (L214) thêm `error.code = data?.code;` để nhận diện quota error. |
| `pages/admin/TutorManagement.jsx` | `handleOpenEdit`: `form.storageTier = detail.storageTier \|\| "FREE"` + `storageTierDurationMonths = 1`. Edit modal: khối "Gói lưu trữ" (blue box) với `<select>` gói + `<select>` thời hạn (1/3/12 tháng, chỉ hiện khi ≠ FREE). Detail modal: badge chỉ-đọc `Gói lưu trữ: {tier}` cạnh badge profile-status. |
| `pages/tutor/TutorDashboard.jsx` | `const { token } = useAuth();` + `useEffect` fetch `apiGetTutorStorage(token)`. Thêm **widget "Dung lượng lưu trữ"** (dưới stats row, card `rounded-2xl`): icon `HardDrive` (lucide, KHÔNG emoji), value `formatBytes(used) / formatBytes(effectiveQuota)`, hint `Gói {label} · hết hạn dd/MM`, progress bar (blue <70%, amber <90%, rose ≥90%), `dark:` variants. Lỗi → hiện "—", không block dashboard. |
| `pages/tutor/manage/ManageSessions.jsx` | Trong `handleFileUpload` catch: `if (err.code === 1603 \|\| err.code === 1604) setShowStorageUpgradeHint(true)`. Hiện dòng amber dưới dropzone: "Bạn đã dùng hết dung lượng của gói hiện tại. Vui lòng liên hệ lễ tân để nâng gói lưu trữ hoặc gia hạn thời hạn gói." (không có trang billing → text inline, không CTA chết). |

> Dashboard hiện toàn mock, nhưng quota là số liệu **thật** (used/quota từ backend) → thẻ này
> kết nối endpoint thật, nhất quán với các trang tutor khác đang dùng `useAuth().token`.

## 6. Test

| File | Thay đổi |
|---|---|
| `ClassOccurrenceServiceTest.java` (material tests, helper `assertErrorCode` L177, `lessonRow()` L163) | Thêm `@Mock TutorRepository tutorRepository;` + mock default `findDetailById(TUTOR_ID)→freeTierTutor()` trong `setUp`. 3 test mới: (1) `uploadMaterial_quotaExceeded_throws1603`: used = FREE-quota-1, file nhỏ → `TUTOR_STORAGE_QUOTA_EXCEEDED` + `verify(storageService, never()).uploadFile(...)`. (2) `uploadMaterial_withinQuota_succeeds`: used = 0 → upload OK. (3) `uploadMaterial_tierExpired_throws1604`: PRO hết hạn, used = FREE-quota-1 → `TUTOR_STORAGE_TIER_EXPIRED`. |
| `AdminTutorServiceTest.java` | 3 test mới: `updateProfile_setProTier_savesTierWithExpiryAndAudits` (PRO + 3 tháng → tier="PRO", expiresAt ∈ (now+2th, now+4th), audit log có oldTier/newTier), `updateProfile_setFreeTier_clearsExpiry` (PRO→FREE → expiresAt=null), `updateProfile_noTierInRequest_keepsExistingTier`. |
| `TutorStorageServiceTest.java` (mới) | 3 test: FREE → `effectiveQuotaBytes` = FREE, PRO hết hạn → hạ về FREE (quota gốc vẫn PRO), PREMIUM còn hạn → giữ PREMIUM. |
| `TutorClassControllerTest.uploadLessonMaterial_...` (L444) | Không cần đổi (service bị mock) — chỉ chạy lại cho chắc. |

## 7. Trạng thái biên / rủi ro (ghi trong PR)

- **Race upload song song:** gate đọc `SUM` rồi mới ghi. Hai upload cùng tutor (vào 2 lesson khác nhau)
  có thể đều pass rồi vượt nhẹ quota. Đã giảm rủi ro: `uploadMaterial` chạy `@Transactional` +
  `lockLesson ... FOR UPDATE OF l` (upload **cùng** lesson bị serialize). Sửa triệt để cần advisory
  lock per-tutor — ngoài phạm vi v1.
- **`file_size` nullable** (V5 cho phép NULL): `COALESCE(SUM(file_size),0)` coi NULL=0 → legacy row
  thiếu size bị đếm thiếu. Chấp nhận (upload hiện tại luôn set `file_size`).
- **Tier do admin gán**, tutor không self-upgrade (chưa có billing) — đúng yêu cầu.
- **Đổi gói xuống thấp hơn mức đã dùng:** không chặn (admin vẫn gán được PRO→FREE dù đã dùng 5GB).
  Upload sau đó bị chặn tới khi xóa tài liệu. Hành vi hợp lý, không cần validate thêm ở v1.

## 8. Trật tự thực hiện (mỗi bước 1 commit, kiểm tra sau mỗi bước)

Trên nhánh `feature/tutor-storage-quota` (tách từ `dev`). **Trạng thái: đủ 5 commit (bước 1–5),
đang ở bước 6 (rà soát cuối + gộp PR).**

1. ✅ `4f2f07d` `feat(db): V29 thêm cột tutors.storage_tier (FREE/PRO/PREMIUM) + thời hạn gói` — chỉ migration.
2. ✅ `4911df7` `feat(tutor): enum StorageTier + Tutor.storageTier/expiresAt + ErrorCode 1603/1604` — entity/enum/ErrorCode, chưa đổi hành vi.
3. ✅ `fb43488` `feat(classroom): chặn upload tài liệu khi vượt quota lưu trữ gia sư (V29)` — `sumTutorMaterialBytes` + gate trong `uploadMaterial` + 3 test (1603/within-quota/1604).
4. ✅ `d2def52` `feat(tutor): admin đổi gói lưu trữ + thời hạn tháng + endpoint widget /me/storage` — `TutorAdminUpdateRequest`(+`storageTierDurationMonths`)/`updateProfile`/`TutorProfileResponse` + `TutorStorageService`/`TutorStorageResponse`/endpoint + 6 test.
5. ✅ `dd4ed27` `feat(ui): giao diện gói lưu trữ (admin, widget dashboard, CTA upload)` — 5 file frontend mục 5.
6. ⏳ Build + test toàn bộ (backend `mvn test` xanh, frontend `vite build` + lint sạch), rà checklist AGENTS.md (dark mode, lucide icon, tiếng Việt, rounded), gộp PR vào `dev`.

### Critical files

- `backend/.../module/classroom/service/ClassOccurrenceService.java`
- `backend/.../module/classroom/repository/ClassroomQueryRepository.java`
- `backend/.../module/tutor/service/AdminTutorService.java`
- `backend/.../module/tutor/domain/Tutor.java`
- `frontend/src/pages/admin/TutorManagement.jsx`
- `frontend/src/pages/tutor/TutorDashboard.jsx`
- `frontend/src/pages/tutor/manage/ManageSessions.jsx`
