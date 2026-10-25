Đã khảo sát đủ: backend chưa có module `classroom` (bảng `classes`, `sessions` đã có sẵn từ Flyway V5), frontend có prototype menu "Học sinh" tại [AppShell.jsx:211](frontend/src/components/layout/AppShell.jsx#L211). Dưới đây là plan.

---

# PLAN — UC-T08: Thiết lập Lịch dạy thử (lát cắt của T7-B3)

**Nhánh:** `feature/trial-session` (rẽ từ `dev`, PR có 1 review, CI xanh)
**FR:** FR-09 (PRD hiện hành; theo ma trận Usecase: FR-29) · **API:** 3.5 module `classroom` · **Người sở hữu:** Thành viên B

## 1. Problem

Sau khi ghép lớp (matching đã merge ở PR #44), lớp dừng ở `TRIAL` nhưng gia sư không có chỗ nào để đặt buổi dạy thử: chưa có module backend `classroom` (bảng `classes`, `sessions` đã có từ V5 nhưng chưa có code đọc/ghi), chưa có kiểm tra trùng ca. Phía frontend, menu "Học sinh" trỏ tới prototype [StudentsList.jsx](frontend/src/pages/tutor/StudentsList.jsx) chạy mock — không phản ánh luồng "lớp của gia sư" trong UC-T08.

## 2. Requirement

### 2.1 Backend — module mới `classroom` (package `module.classroom`)

Theo đúng pattern của module `matching` hiện có (JdbcTemplate + record response + `ApiResponse<T>` + `@PreAuthorize("hasRole('TUTOR')")` + xử lý sở hữu):

1. **`GET /api/v1/tutors/me/classes`** — "Lớp của tôi". Query `status` (tùy chọn). Mỗi item: `classId`, `className`, `studentName`, `teachingMode`, `pricePerSession`, `status`, `trialSession` (ngày/giờ/trạng thái hoặc `null`), sắp theo `created_at` giảm dần.
2. **`GET /api/v1/classes/{id}`** — chi tiết lớp: học sinh, hình thức, học phí, trạng thái, buổi dạy thử (nếu có), `class_schedules` (hiện rỗng). Gia sư không sở hữu → **403** (theo AC của T7-B3).
3. **`POST /api/v1/classes/{id}/trial-session`** — Body `{ sessionDate, startTime, endTime, teachingMode, meetingUrl?, location? }`:
   - Lớp phải tồn tại + thuộc gia sư (403) + `TRIAL` (409).
   - Mỗi lớp tối đa 1 buổi thử (409 — DB đã có unique index `uq_sessions_one_trial_per_class`, phải bắt thành lỗi rõ ràng, không 500).
   - Online bắt buộc `meetingUrl`; Tại nhà bắt buộc `location` (400). `startTime < endTime` (400), ngày không trong quá khứ (400).
   - **Kiểm tra trùng ca** bằng `ScheduleConflictChecker` → 409 `SCHEDULE_CONFLICT` kèm ngày, giờ, tên lớp/học sinh trùng.
   - Ghi 1 dòng `sessions`: `is_trial = true`, `status = SCHEDULED`, `title = "Buổi học thử"`. Lớp giữ nguyên `TRIAL`.
4. **`PUT /api/v1/classes/{id}/trial-session`** — chỉ khi buổi thử tồn tại (404) và còn `SCHEDULED` (409); validate + kiểm tra trùng ca **loại trừ chính nó**; UPDATE đúng dòng cũ, không sinh dòng mới.
5. **`ScheduleConflictChecker`** (component dùng chung, UC-T09 sẽ tái sử dụng): tìm ca của cùng gia sư có `session_date` trùng ngày, `status IN ('SCHEDULED','IN_PROGRESS')`, giao khoảng thời gian (`start < other.end AND end > other.start`). Ca liền kề (19:00–20:00 vs 20:00–21:00) **không** coi là trùng.
6. **Bổ sung `ErrorCode`** dải 1100–1299: `CLASS_NOT_FOUND`, `CLASS_NOT_OWNED`, `CLASS_NOT_TRIAL`, `TRIAL_SESSION_ALREADY_EXISTS`, `TRIAL_SESSION_NOT_FOUND`, `TRIAL_SESSION_NOT_EDITABLE`, `SCHEDULE_CONFLICT`, `TRIAL_SESSION_INVALID_TIME`, `TRIAL_SESSION_DATE_IN_PAST`, `TRIAL_SESSION_MISSING_MEETING_URL`, `TRIAL_SESSION_MISSING_LOCATION`.

### 2.2 Frontend

1. **Đổi menu** [AppShell.jsx:211](frontend/src/components/layout/AppShell.jsx#L211): label `"Học sinh"` → **`"Lớp học của tôi"`**, route → `/tutor/classes`. Các route prototype `/tutor/students*` giữ nguyên (dọn sau ở T9-B1), chỉ không còn xuất hiện trên sidebar.
2. **Trang mới `TutorClasses.jsx`** (`/tutor/classes`) — "Lớp học của tôi": danh sách lớp từ API (không mock), tab lọc theo trạng thái (Đang học thử — violet, Đang hoạt động — emerald, Đã kết thúc/Đã hủy — slate/rose), skeleton khi tải, trạng thái rỗng; thẻ lớp hiển thị tên lớp, tên học sinh, hình thức, học phí/buổi, trạng thái buổi thử (chưa thiết lập / ngày–giờ), nút "Xem chi tiết".
3. **Trang mới `TutorClassDetail.jsx`** (`/tutor/classes/:classId`) — chi tiết lớp + khối **"Lịch dạy thử"**:
   - Chưa có buổi thử → nút **"Thiết lập lịch dạy thử"** mở form: DatePicker (ngày ≥ hôm nay), giờ bắt đầu/kết thúc, chọn hình thức (Online → ô nhập liên kết Zoom/Meet; Tại nhà → ô địa chỉ), nút **"Lưu lịch dạy thử"**.
   - Đã có → hiển thị chi tiết + nút **"Chỉnh sửa lịch dạy thử"** (theo luồng thay thế 4a của UC).
   - 409 trùng ca → cảnh báo amber với nội dung ca trùng từ backend; thành công → *"Đã thiết lập lịch dạy thử thành công cho ngày [DD/MM/YYYY]."*
4. **API client mới `lib/classroomApi.js`**: `apiGetMyClasses`, `apiGetClassDetail`, `apiCreateTrialSession`, `apiUpdateTrialSession` + meta nhãn trạng thái lớp — theo pattern `tutorClassApi.js` hiện có.
5. Tuân thủ `frontend/AGENTS.md`: dùng lại `Card`, `Badge`, `Button`, `PageHeader`; icon `lucide-react` (`CalendarDays`, `Clock`, `Video`, `MapPin`, `CalendarPlus`, `Pencil`); Light/Dark đầy đủ; tiếng Việt 100%; không emoji; mobile không tràn ngang.

## 3. Ánh xạ bảng DB theo thao tác

| Thao tác | Bảng đọc (R) | Bảng ghi (W) |
| --- | --- | --- |
| `GET /tutors/me/classes` | `classes`, `students`, `users` (tên HS), `sessions` (`is_trial = true`) | — |
| `GET /classes/{id}` | `classes`, `students`, `users`, `sessions`, `class_schedules` | — |
| `POST /classes/{id}/trial-session` | `classes` (sở hữu + `TRIAL`), `sessions` (đã có buổi thử của lớp; các ca khác cùng gia sư để check trùng — JOIN `classes`) | `sessions` (INSERT, `is_trial = true`, `SCHEDULED`) |
| `PUT /classes/{id}/trial-session` | `classes`, `sessions` (buổi thử hiện có + check trùng loại trừ chính nó) | `sessions` (UPDATE) |
| `ScheduleConflictChecker` | `sessions` JOIN `classes` (cùng `tutor_id`, `SCHEDULED`/`IN_PROGRESS`) | — |

## 4. Acceptance Criteria

1. `POST` thành công → đúng 1 dòng `sessions` (`is_trial = true`, `SCHEDULED`), lớp vẫn `TRIAL`; response chứa đúng ngày/giờ đã lưu.
2. Đặt buổi thử lần 2 trên cùng lớp → 409 `TRIAL_SESSION_ALREADY_EXISTS`; lớp không ở `TRIAL` → 409 `CLASS_NOT_TRIAL`; gia sư khác gọi `GET/POST/PUT /api/v1/classes/{id}...` → 403.
3. Trùng ca (trùng hẳn hoặc giao một phần với session `SCHEDULED` khác của cùng gia sư) → 409 `SCHEDULE_CONFLICT` kèm ngày, giờ, tên lớp/học sinh trùng; ca liền kề không trùng.
4. Online thiếu `meetingUrl` → 400; Tại nhà thiếu `location` → 400; `startTime ≥ endTime` → 400; ngày quá khứ → 400.
5. `PUT` khi buổi thử đã `COMPLETED`/`ABSENT`/`CANCELLED` → 409; `PUT` hợp lệ chỉ UPDATE dòng cũ (không sinh dòng mới), không tự trùng với chính nó.
6. Unit test `ScheduleConflictChecker`: trùng hẳn, trùng một phần, liền kề không trùng, khác ngày không trùng (tối thiểu 4 ca).
7. FE: menu hiển thị "Lớp học của tôi"; 2 trang mới nối API thật, có skeleton + trạng thái rỗng + hiển thị lỗi tiếng Việt; cảnh báo trùng ca hiện nội dung từ backend; Light/Dark + mobile OK, không emoji.
8. **Manual test:** lễ tân ghép lớp (qua luồng `select-tutor`/`assign-tutor` đã merge) → lớp `TRIAL` → đăng nhập gia sư → "Lớp học của tôi" → chi tiết lớp → thiết lập thử: thứ Tư 19:00–20:30, Online kèm link Meet → kiểm tra DB `sessions`; đặt lại khung trùng bị từ chối kèm cảnh báo → chỉnh sửa sang 19:30–21:00 → DB vẫn 1 dòng, giờ đã cập nhật → gia sư khác gọi `GET /api/v1/classes/{id}` nhận 403.

## 5. Ngoài phạm vi (task khác)

- Chốt lịch cố định / `finalize-schedule` (UC-T09) — làm ngay sau, tái sử dụng `ScheduleConflictChecker` + mở rộng check `class_schedules`.
- Hiển thị ca `[Học thử]` trên Thời khóa biểu (UC-T07 → T8-B1) — bản ghi `sessions` của task này là dữ liệu đầu vào cho task đó.
- Dọn dẹp trang prototype `/tutor/students*` (T9-B1); thông báo cho học sinh/phụ huynh (T8-A1).

## 6. Files dự kiến & commit

**Backend:** `module/classroom/controller/TutorClassController.java`, `api/request/UpsertTrialSessionRequest.java`, `api/response/{ClassSummaryResponse, ClassDetailResponse, TrialSessionResponse}.java`, `service/{TutorClassService, ClassQueryRepository, ScheduleConflictChecker}.java`, bổ sung `shared/exception/ErrorCode.java`; test `ScheduleConflictCheckerTest`, `TutorClassServiceTest`.
**Frontend:** `pages/tutor/TutorClasses.jsx`, `pages/tutor/TutorClassDetail.jsx`, `lib/classroomApi.js`, sửa `AppShell.jsx`, `App.jsx` (thêm 2 route).

Commit đề xuất: ① `feat: API thiết lập lịch dạy thử cho lớp TRIAL (module classroom)` — ② `feat: trang Lớp học của tôi và form lịch dạy thử, đổi tên menu`. DoD theo GIT_CONVENTION (test local, CI xanh, 1 review).

---

Plan đã xong — bạn duyệt thì tôi bắt đầu code, hoặc nếu muốn tôi có thể lưu plan này vào file trong `docs/` để đưa lên ClickUp.