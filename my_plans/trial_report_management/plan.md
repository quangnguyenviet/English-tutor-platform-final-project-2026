# Kế hoạch triển khai: Quản lý lớp dạy thử không thành công

## Context

Gia sư báo cáo dạy thử `FAILED` (V31) hiện đang: lớp giữ `TRIAL` cho phép báo lại nhiều lần, không có hàng đợi vận hành. Theo [business_description.md](d:\code\do-an\my_plans\trial_report_management\business_description.md) và [design_plan.md](d:\code\do-an\my_plans\trial_report_management\design_plan.md) (đã cập nhật các quyết định chốt):

- Mỗi lớp chỉ nhận **một** báo cáo chính thức; `SUCCESS` → `ACTIVE`, `FAILED` → trạng thái lớp mới `TRIAL_FAIL` + khóa báo cáo.
- Mỗi report `FAILED` tạo **một task** (`trial_report_tasks`): staff chuyển trạng thái việc bằng **dropdown 3 trạng thái** (`PENDING` / `IN_PROGRESS` / `RESOLVED`) — không có nút riêng resolve/reopen. Vào `RESOLVED` ghi `resolved_by` + `resolved_at`; ra khỏi `RESOLVED` xóa 2 trường này. Gán người phụ trách (`assigned_to`) tách rời, không đổi trạng thái.
- **Ghép lại** = mở lại `class_requests` (idempotent, không đổi task), chỉ có khi lớp có `class_request_id`.
- Menu **Quản lý lớp học** (nhóm mở rộng trong AppShell): *Lớp dạy thử*, *Lớp chính thức* (placeholder), *Dạy thử thất bại cần xử lý*.
- Notification: backend ghi `notifications` khi có report FAILED; frontend staff không thay mock ở phase này.

Quy tắc project: từng bước nhỏ, kiểm tra sau mỗi bước; không commit cho đến khi user duyệt.

## Bước 1 — Migration V32 ✅ (đã viết; chưa chạy Flyway thực tế)

- [x] File: `backend/src/main/resources/db/migration/V32__trial_report_management.sql`
- [x] Mở rộng `classes.status` thêm `TRIAL_FAIL`
- [x] Tạo bảng `trial_report_tasks`
- [x] Tạo bảng `trial_report_task_histories`
- [x] Thêm constraint `uq_trial_reports_class` UNIQUE (class_id)
- [x] Kiểm tra: `mvn -q test-compile` + chạy app (Flyway migrate) hoặc `docker compose up db` để xác nhận V32 sạch

## Bước 2 — ErrorCode + repository task

- [x] `shared/exception/ErrorCode.java`: thêm các mã mới (dùng 1175–1179, nối tiếp block trial-report hiện có):
  - [x] `TRIAL_REPORT_LOCKED` (409, "Lớp đã có báo cáo kết quả dạy thử, không gửi thêm được")
  - [x] `TRIAL_REPORT_TASK_NOT_FOUND` (404)
  - [x] `TRIAL_REPORT_TASK_INVALID_STATUS` (409, "Trạng thái không hợp lệ")
  - [x] `TRIAL_REPORT_ALREADY_ASSIGNED` (409, "Việc đã được gán cho người khác")
  - [x] `TRIAL_REPORT_REMATCH_NO_REQUEST` (409, "Lớp không có yêu cầu, không thể ghép lại")
- [x] Repository mới (JdbcTemplate theo convention matching): `backend/.../module/classroom/repository/TrialReportTaskRepository.java` (đặt trong module `classroom`, cùng `TrialReportService` — vì `classes`/`trial_reports` do module này sở hữu):
  - [x] `lockTask(id)` FOR UPDATE.
  - [x] insert task `PENDING` khi report FAILED.
  - [x] query list hàng đợi (filter `status`, `assignedTo`, phân trang, `ORDER BY created_at DESC`), COUNT theo trạng thái.
  - [x] query chi tiết (task + report + class + tutor + student + request + assigned/resolved user + history).
  - [x] assign-self có điều kiện `assigned_to IS NULL` (0 dòng = đã bị gán → 409).
  - [x] unassign / assign-other (validate người nhận RECEPTIONIST/ADMIN ACTIVE).
  - [x] `changeStatus(id, newStatus, actorId)`: vào RESOLVED ghi resolved_by/resolved_at; ra khỏi RESOLVED đặt NULL.
  - [x] insert history.
- [x] Kiểm tra: `mvn test-compile` sạch; service test che phủ repository (bước 6).

> Ghi chú: `StaffClassRequestService.rematchClass` đã có sẵn overload `skipStatusGuard` (đổi filter `MATCHED` → bỏ guard, idempotent khi request đã `REMATCH`) — dùng cho Bước 4.

## Bước 3 — Sửa `TrialReportService`  ✅

File: `backend/.../module/classroom/service/TrialReportService.java`

- [x] Guard: thay "lớp phải TRIAL" bằng "lớp chưa có report chính thức". Kiểm tra bằng query `trial_reports` (kèm lock class FOR UPDATE đang có); nếu đã có report → `TRIAL_REPORT_LOCKED`. Cho phép gửi report ở cả `TRIAL` (và các trạng thái khác nếu chưa có report — theo nghiệp vụ: lớp chưa báo cáo, chưa bị ghép lại/thì mới được báo).
- [x] `FAILED`: cùng 1 transaction: insert report → `UPDATE classes SET status='TRIAL_FAIL'` → insert task `PENDING` → audit → notification fan-out tới **RECEPTIONIST + ADMIN** (bổ sung admin ngoài `notifyReceptionists`; thêm phương thức `notifyStaff(title, content, entityType, entityId)` vào `MatchingLifecycleSupport`).
- [x] `SUCCESS`: giữ flow kích hoạt (`tutorActivateTrial`) + audit; lớp sau đó bị khóa báo cáo do report đã tồn tại.
- [x] Cập nhật test `TrialReportServiceTest`: case "báo cáo lần hai bị chặn" thay thế kỳ vọng cũ cho phép nộp lại.

Kiểm tra: `mvn test` module classroom — 10/10 `TrialReportServiceTest` pass.

## Bước 4 — Service + Controller staff ✅

File mới (module classroom):
- [x] `TrialReportTaskService.java`:
  - [x] `listTasks(status, assignedTo, page, size)` + `getTaskCounts()` (stat card Chờ/Đang/Đã xử lý).
  - [x] `getTaskDetail(id)` (kèm lịch sử).
  - [x] `assignSelf(id)` / `unassign(id)` / `assign(id, targetUserId)` — lock task, update có điều kiện, ghi history, không đổi status.
  - [x] `rematch(id)`: qua task → report → `class.class_request_id`; NULL → 409; REMATCH/OPEN idempotent; MATCHED chạy lifecycle và ghi history.
  - [x] `changeStatus(id, newStatus)`: dropdown 3 trạng thái, update + history; RESOLVED ghi resolved_by/resolved_at, mở lại thì xóa.
- [x] `TrialReportTaskController.java` (`/api/v1/trial-report-tasks`, `@PreAuthorize("hasAnyRole('ADMIN','RECEPTIONIST')")`): list, counts, detail, assign-self, unassign, assign-other, rematch, change-status.
- [x] Kiểm tra compile và service test.

> Ghi chú: endpoint triển khai dùng `/api/v1/trial-report-tasks` thay cho tên draft `/api/v1/staff/trial-report-tasks`; frontend đã đồng bộ theo endpoint thực tế.

## Bước 5 — Frontend ✅ (tên file khác draft: xem ghi chú)

1. [x] `frontend/src/lib/trialReportTaskApi.js` — request helper + 8 hàm API (thay vì `staffTrialReportApi.js`; tách riêng để không lặp với `staffClassRequestApi.js`).
2. [x] Trang `frontend/src/pages/operations/TrialReportTasks.jsx` (admin & receptionist dùng chung): `PageHeader` + 3 stat cards (`/counts`), filter 2 (trạng thái, người phụ trách), bảng đủ cột (học viên, lớp, gia sư, ca thử, báo cáo, lý do, badge trạng thái, phụ trách, nút Xem chi tiết) + phân trang. Modal chi tiết gộp sẵn trong file này (thay `TrialFailureDetail.jsx`): thông tin lớp/học viên/gia sư + ca thử, lý do, gán cho mình/bỏ gán, dropdown trạng thái, nút Ghép lại (chỉ khi `hasClassRequest`), timeline lịch sử, refetch sau thao tác.
3. [x] Trang wrapper `frontend/src/pages/admin/ClassManagement.jsx` — menu "Quản lý lớp học" 3 tab con: *Lớp dạy thử*, *Lớp chính thức* (placeholder theo phạm vi mục 6.4 business), *Dạy thử thất bại cần xử lý* (chạy thật).
4. [x] Routing `App.jsx`: `/admin/class-management` + `/admin/trial-report-tasks` và tương ứng receptionist.
5. [x] `AppShell.jsx`: item menu "Quản lý lớp học" cho cả admin và lễ tân. Chưa làm: badge đếm task PENDING trên menu (poll 30s) và route mở rộng chevron (dùng 1 item phẳng thay vì nhóm mở rộng).
6. [x] `TopBar.jsx`: thêm routeMeta/breadcrumb cho `/admin/class-management`, `/admin/trial-report-tasks` + tương ứng receptionist (kèm nhánh "Lễ tân" vào breadcrumb và role lookup).

Kiểm tra: `npm run build` ✅; chưa walkthrough dark mode/mobile.

> Lệc chọn (lệch với draft, giữ để đồng bộ): (a) filter "người phụ trách" hiện là ô nhập ID, chưa phải dropdown từ danh sách staff (chưa có endpoint staff-options); (b) chưa có frontend test cho lib API theo pattern `complaintModel.test.js`.

## Bước 6 — Test + tài liệu 🟡 phần lớn xong

- [x] Backend: test service `TrialReportTaskServiceTest` (11 test): assign-self race (đã gán → 409), unassign/assign-other (validate staff ACTIVE), changeStatus vào/ra RESOLVED + reject giá trị sai, rematch no-request → 404, rematch idempotent (REMATCH/OPEN bỏ lifecycle, CANCELLED chạy lại), list phân trang + validate status.
- [x] Backend: `TrialReportServiceTest` cập nhật: 1 report/lớp (409 `TRIAL_REPORT_LOCKED`), FAILED tạo task + TRIAL_FAIL + notification `notifyStaff`.
- [ ] Controller test (403 tutor, 404) — chưa có test riêng cho `TrialReportTaskController` (security do `@PreAuthorize`, chưa test MockMvc).
- [ ] Frontend: test lib API (mock fetch) — chưa có.
- [x] Cập nhật `backend/API_DESIGN.md` (state machine + API staff mới):
  - [x] Mục 2.5: thêm `TRIAL_FAIL` vào bảng trạng thái `classes.status` (lộ chuyển từ `TRIAL`)
  - [x] Mục 2.5: khối "Hàng đợi dạy thử thất bại" (`trial_report_tasks.status`) — dropdown 3 trạng thái, quy tắc `assigned_to` / `resolved_by`+`resolved_at`, rematch idempotent
  - [x] Mục 3.5: endpoint `POST /classes/{id}/trial-report` cho TUTOR (guard 1 báo cáo/lớp, flow SUCCESS/FAILED)
  - [x] Mục 3.5: bảng endpoint staff `/api/v1/trial-report-tasks` (8 endpoint, mã lỗi 1175–1179)
  - [x] Mục 5: dòng V31, V32; footnote "hiện có V1–V32"
  - [x] Mục 6 ma trận phân quyền: 2 hàng mới (báo cáo TUTOR, hàng đợi staff)

## Verification tổng

- [x] `mvn test` (backend) — compile sạch; classroom module 109/109 pass (TrialReportServiceTest 10, TrialReportTaskServiceTest 11, ...).
- [x] `npm run build` (frontend) — pass.
- [x] `docker compose up --build` chạy không crash; xác nhận Flyway V32 sạch (chưa chạy thực tế).
- [ ] E2E thủ công: gia sư submit FAILED → thấy task trong hàng đợi → assign-self → dropdown chuyển IN_PROGRESS → RESOLVED (có resolved_by/at) → mở lại về PENDING → với lớp có request bấm Ghép lại → request về REMATCH, lớp cũ giữ TRIAL_FAIL.
- Dừng cho user tự kiểm thử; không commit trước khi user duyệt.
