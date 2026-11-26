# Kế hoạch thiết kế: Quản lý lớp dạy thử không thành công

## 1. Bối cảnh và mục tiêu

Sau khi gia sư gửi báo cáo dạy thử `FAILED`, hệ thống cần tạo một công việc để admin/lễ tân tiếp nhận, xác minh và xử lý. Hiện tại:

- Bảng `trial_reports` đã tồn tại từ migration V31 và cho phép gửi lại báo cáo khi lớp vẫn ở trạng thái `TRIAL`.
- Bảng `classes` hiện chưa có trạng thái `TRIAL_FAIL`.
- Phía staff hiện chủ yếu quản lý `class_requests`; chưa có endpoint hoặc màn hình danh sách lớp theo trạng thái.
- Luồng `rematch` hiện tại đóng lớp cũ, đưa yêu cầu về `REMATCH`, rồi tạo lớp `TRIAL` mới khi chọn gia sư.
- Thông báo đã được ghi vào bảng `notifications`, nhưng frontend staff hiện đang dùng dữ liệu mock trong `AuthContext`.

### Mục tiêu thiết kế

1. Không bỏ sót lớp có báo cáo dạy thử thất bại.
2. Tách rõ báo cáo của gia sư và trạng thái xử lý của vận hành.
3. Cung cấp hàng đợi tập trung cho admin/lễ tân.
4. Cho phép xem lý do thất bại, người phụ trách và lịch sử xử lý.
5. Tái sử dụng luồng ghép lại hiện có khi lớp có `class_requests`.
6. Giữ lớp và báo cáo cũ làm lịch sử; không biến lớp cũ thành một vòng dạy thử mới.
7. Ngăn việc gửi nhiều báo cáo chính thức trên cùng một lớp.

## 2. Phạm vi

### Trong phạm vi

- Bổ sung trạng thái lớp `TRIAL_FAIL`.
- Bổ sung thông tin công việc xử lý report thất bại.
- API hàng đợi và API chi tiết cho admin/lễ tân.
- Các thao tác: xem, gán cho mình, bỏ gán/gán người khác, ghép lại, chuyển trạng thái bằng dropdown (`PENDING` / `IN_PROGRESS` / `RESOLVED`).
- Lịch sử thao tác trên report.
- Menu **Quản lý lớp học** với các mục:
  - **Lớp dạy thử**.
  - **Lớp chính thức** — đặt route/menu trước, chưa triển khai màn hình đầy đủ.
  - **Dạy thử thất bại cần xử lý**.
- Màn hình hàng đợi **Dạy thử thất bại cần xử lý**.
- Màn hình chi tiết lớp dạy thử thất bại.
- Thông báo cho admin/lễ tân khi có report thất bại mới.
- Test backend, test frontend phù hợp và kiểm thử API/UI.

### Ngoài phạm vi

- Không gửi thông báo trạng thái xử lý cho gia sư.
- Không gửi thông báo hoặc yêu cầu xác nhận cho phụ huynh sau khi xử lý lớp không có `class_requests`.
- Không thêm SLA, cảnh báo quá hạn hoặc phân bổ tự động.
- Không xây dựng màn hình **Lớp chính thức** trong giai đoạn này.
- Không sửa nội dung lịch sử của report/lớp cũ.
- Không khôi phục lớp `TRIAL_FAIL` thành `TRIAL`.
- Không thay đổi luồng kích hoạt lớp thành công hiện có ngoài phần guard cần thiết.

## 3. Quyết định thiết kế chính

| Nội dung | Quyết định |
|---|---|
| Báo cáo chính thức | Mỗi lớp chỉ nhận một báo cáo chính thức. Sau `SUCCESS` hoặc `FAILED`, lớp bị khóa báo cáo. |
| Trạng thái lớp | `TRIAL → ACTIVE` khi thành công; `TRIAL → TRIAL_FAIL` khi thất bại. |
| Việc xử lý | Dùng trạng thái riêng `PENDING`, `IN_PROGRESS`, `RESOLVED`; không suy ra từ `trial_reports.outcome`. |
| Người phụ trách | Trường người phụ trách tách khỏi trạng thái. Gán cho mình không tự động đổi trạng thái. |
| Chuyển trạng thái | Nhân viên chọn trực tiếp trạng thái (`PENDING` / `IN_PROGRESS` / `RESOLVED`) bằng dropdown; không có nút riêng "Đánh dấu đã xử lý" hay "Mở lại". Khi vào `RESOLVED` ghi người xử lý + thời điểm; khi ra khỏi `RESOLVED` xóa hai trường đó. |
| Ghép lại | Chỉ mở lại `class_requests` liên quan; không sửa lớp `TRIAL_FAIL`. Khi ghép gia sư mới, tạo `classes` mới. |
| Không có request | Không hiện nút Ghép lại; sau khi xác minh chỉ đánh dấu đã xử lý. |
| Đồng thời | Dùng row lock và điều kiện cập nhật để bảo đảm thao tác gán, báo cáo và chuyển trạng thái không ghi đè sai. |
| Quyền | Admin và lễ tân có quyền xem/xử lý toàn bộ hàng đợi như nhau. |
| Nguồn sự thật | Trạng thái và người phụ trách lấy từ bảng công việc; lịch sử thao tác task dùng bảng chuyên dụng `trial_report_task_histories`, **chưa tận dụng `audit_logs` ở giai đoạn này**. |

## 4. Thiết kế dữ liệu

### 4.1. Migration mới: `V32__trial_report_management.sql`

Migration kế tiếp sau V31, gồm các thay đổi:

1. Mở rộng CHECK constraint của `classes.status` để thêm `TRIAL_FAIL`.
2. Tạo bảng công việc xử lý report, đề xuất tên `trial_report_tasks`:

```sql
CREATE TABLE trial_report_tasks (
    id              BIGSERIAL PRIMARY KEY,
    trial_report_id BIGINT NOT NULL UNIQUE REFERENCES trial_reports(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_to     BIGINT REFERENCES users(id),
    resolved_by     BIGINT REFERENCES users(id),
    resolved_at     TIMESTAMPTZ,
    resolution      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trial_report_tasks_status
        CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED'))
);

CREATE INDEX idx_trial_report_tasks_queue
    ON trial_report_tasks(status, created_at DESC);
CREATE INDEX idx_trial_report_tasks_assigned_to
    ON trial_report_tasks(assigned_to, status);
```

3. Tạo bảng lịch sử thao tác, đề xuất tên `trial_report_task_histories`:

```sql
CREATE TABLE trial_report_task_histories (
    id         BIGSERIAL PRIMARY KEY,
    task_id    BIGINT NOT NULL REFERENCES trial_report_tasks(id) ON DELETE CASCADE,
    actor_id   BIGINT NOT NULL REFERENCES users(id),
    action     VARCHAR(40) NOT NULL,
    details    JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_trial_report_task_histories_task
    ON trial_report_task_histories(task_id, created_at DESC);
```

`action` dự kiến gồm: `ASSIGN_SELF`, `UNASSIGN`, `ASSIGN_OTHER`, `REMATCH`, `RESOLVE`, `REOPEN`.

> Đã chốt: chưa tận dụng `audit_logs` ở giai đoạn này; lịch sử thao tác task dùng bảng chuyên dụng `trial_report_task_histories` (đúng quy tắc 3.10 của business description: lịch sử là bảng riêng, truy vấn theo task; `audit_logs` không phải nguồn lịch sử của task). Tên bảng và cột cần được rà soát lại với convention repository trước khi code. Có thể cân nhắc ghi `audit_logs` bổ sung sau giai đoạn này nếu vận hành cần tra cứu chung.

### 4.2. Ràng buộc dữ liệu

- `trial_report_tasks.trial_report_id` là `UNIQUE`: một report thất bại chỉ tạo một task.
- Chỉ tạo task khi report có `outcome = 'FAILED'`.
- Report `SUCCESS` không tạo task.
- Không cho tạo report mới trên lớp đã có report chính thức.
- Khi chuyển lớp sang `TRIAL_FAIL`, thao tác insert report + update class + insert task phải nằm trong một transaction.
- `RESOLVED` không xóa task; chuyển trạng thái (dropdown) là thao tác duy nhất đổi trạng thái việc, kể cả mở lại việc đã `RESOLVED`.

## 5. Bản đồ đọc/ghi cơ sở dữ liệu theo thao tác

| Thao tác | Bảng đọc | Bảng ghi | Khóa/nguyên tử |
|---|---|---|---|
| Gia sư gửi `FAILED` | `classes`, `trial_reports`, `class_requests`, `users` | `trial_reports`, `classes`, `trial_report_tasks`, `notifications` | Lock `classes FOR UPDATE`; một transaction |
| Gia sư gửi report lần hai | `classes`, `trial_reports` | Không ghi nếu lớp đã có report; trả lỗi conflict | Lock `classes FOR UPDATE` |
| Danh sách hàng đợi | `trial_report_tasks`, `trial_reports`, `classes`, `users`, `class_requests` | Không ghi | Phân trang; sort `created_at DESC` |
| Xem chi tiết task | `trial_report_tasks`, `trial_reports`, `classes`, `users`, `class_requests`, `trial_report_task_histories` | Không ghi | Không cần lock |
| Gán cho mình | `trial_report_tasks`, `users` | `trial_report_tasks`, `trial_report_task_histories` | Update có điều kiện `assigned_to IS NULL` |
| Bỏ gán | `trial_report_tasks`, `users` | `trial_report_tasks`, `trial_report_task_histories` | Chỉ admin/lễ tân; giữ nguyên status |
| Gán sang người khác | `trial_report_tasks`, `users` | `trial_report_tasks`, `trial_report_task_histories` | Validate người nhận là admin/lễ tân active |
| Ghép lại | `trial_report_tasks`, `trial_reports`, `classes`, `class_requests` | `class_requests`, `trial_report_task_histories` | Tái sử dụng luồng rematch hiện có; idempotent |
| Chuyển trạng thái (dropdown) | `trial_report_tasks`, `users` | `trial_report_tasks`, `trial_report_task_histories` | Row lock task `FOR UPDATE`; đổi `status`; khi vào `RESOLVED` ghi `resolved_by` + `resolved_at`, khi ra khỏi `RESOLVED` xóa 2 trường đó |
| Thông báo staff | `users` | `notifications` | Fan-out tới admin/lễ tân active |
| Danh sách lớp `TRIAL` | `classes`, `trial_reports`, `users`, `class_requests` | Không ghi | Staff scope toàn hệ thống |

## 6. Thiết kế backend

### 6.1. Domain và repository

Tạo module/package quản lý task trong `module/matching` hoặc `module/classroom` theo nơi đang sở hữu nghiệp vụ. Khuyến nghị:

- `TrialReportTask` và repository cho dữ liệu task.
- Query repository cho danh sách có phân trang, lọc `status` và `assigned_to`.
- Query chi tiết kết hợp report, class, tutor, student, request và người phụ trách.
- Repository history cho các thao tác trên task.

Không dùng truy vấn `trial_reports.outcome = 'FAILED'` để đại diện cho hàng đợi, vì report đã xử lý vẫn có outcome `FAILED`.

### 6.2. Điều chỉnh `TrialReportService`

File hiện tại: `backend/src/main/java/com/mycompany/englishtutor/module/classroom/service/TrialReportService.java`.

- Đổi guard từ chỉ cho phép `TRIAL` sang chỉ cho phép lớp chưa có report chính thức.
- Khi `FAILED`:
  1. lock lớp;
  2. kiểm tra chưa có report;
  3. insert report;
  4. update `classes.status = 'TRIAL_FAIL'`;
  5. insert task `PENDING`;
  6. fan-out notification;
  7. (không ghi `audit_logs` ở giai đoạn này — xem mục 4.1).
- Khi `SUCCESS`: giữ nguyên flow kích hoạt hiện có, nhưng cũng phải khóa report sau lần gửi đầu tiên.
- Thêm mã lỗi cho lớp đã có report và trạng thái không cho báo cáo lại.
- Cập nhật test hiện tại vì test cũ đang kỳ vọng `FAILED` cho phép báo lại.

### 6.3. API staff

Controller đề xuất: `StaffTrialReportController` dưới prefix `/api/v1/staff/trial-report-tasks`, dùng chung quyền `ADMIN` và `RECEPTIONIST`.

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/api/v1/staff/trial-report-tasks` | Danh sách hàng đợi; filter `status`, `assignedTo`, phân trang |
| `GET` | `/api/v1/staff/trial-report-tasks/{id}` | Chi tiết task và lịch sử |
| `POST` | `/api/v1/staff/trial-report-tasks/{id}/assign-self` | Gán cho người đăng nhập |
| `POST` | `/api/v1/staff/trial-report-tasks/{id}/unassign` | Bỏ gán |
| `POST` | `/api/v1/staff/trial-report-tasks/{id}/assign` | Gán cho staff khác |
| `POST` | `/api/v1/staff/trial-report-tasks/{id}/rematch` | Mở lại `class_requests` nếu có |
| `PUT` | `/api/v1/staff/trial-report-tasks/{id}/status` | Chuyển trạng thái việc theo dropdown (`PENDING` / `IN_PROGRESS` / `RESOLVED`) |

Endpoint `rematch` phải gọi hoặc tách phần dùng chung từ `StaffClassRequestService.rematch`, không copy logic đóng lớp, khôi phục application và audit.

### 6.4. Response chính

`TrialReportTaskListItemResponse` tối thiểu gồm:

- `taskId`, `status`, `assignedTo`.
- `classId`, `classStatus`.
- `studentName`, `tutorName`.
- `trialStartTime`, `reportedAt`.
- `reportReason`.
- `hasClassRequest`.

`TrialReportTaskDetailResponse` bổ sung:

- Chi tiết lớp, request, gia sư, học viên.
- Toàn bộ nội dung report chính thức.
- Lịch sử thao tác.
- Các thao tác được phép theo trạng thái và quyền hiện tại.

## 7. Thiết kế frontend

### 7.1. Routing và menu

Cập nhật:

- `frontend/src/App.jsx`: thêm route tương ứng cho admin và receptionist.
- `frontend/src/components/layout/AppShell.jsx`: thêm nhóm **Quản lý lớp học**.
- `frontend/src/components/layout/TopBar.jsx`: thêm route metadata/breadcrumb.

AppShell hiện chỉ hỗ trợ menu phẳng. Giai đoạn đầu nên dùng một nhóm menu mở rộng nhỏ hoặc 3 route phẳng dưới cùng một nhãn, không làm lại toàn bộ navigation. Nếu triển khai expandable group, phải bảo đảm mobile và trạng thái active của route con.

Route đề xuất:

- `/admin/classes/trials` và `/receptionist/classes/trials`.
- `/admin/classes/official` và `/receptionist/classes/official` — placeholder.
- `/admin/classes/trial-failures` và `/receptionist/classes/trial-failures`.
- `/admin/classes/trial-failures/:taskId` và route receptionist tương ứng.

### 7.2. Hàng đợi thất bại

Tạo `frontend/src/pages/admin/TrialFailureQueue.jsx`, receptionist re-export nếu phù hợp.

Bố cục:

- `PageHeader`: **Dạy thử thất bại cần xử lý**.
- Stat cards: `Chờ xử lý`, `Đang xử lý`, `Đã xử lý` nếu API trả counts.
- Bộ lọc duy nhất:
  - Trạng thái xử lý.
  - Người phụ trách.
- Bảng/card responsive hiển thị:
  - Học viên.
  - Gia sư.
  - Thời gian dạy thử.
  - Thời gian báo cáo.
  - Lý do thất bại.
  - Badge trạng thái.
  - Người phụ trách.
  - Nút **Xem chi tiết**.
  - Nút **Ghép lại** khi có `class_requests`.
  - Dropdown **Trạng thái xử lý** với ba lựa chọn `Chờ xử lý`, `Đang xử lý`, `Đã xử lý`.

Tái sử dụng `Button`, `Badge`, `Card`, `StatCard`, `ConfirmModal`, `PageHeader` và icon từ `lucide-react`. Không dùng emoji. Tất cả text UI bằng tiếng Việt, có `dark:` hoặc token tương đương, responsive trên mobile.

### 7.3. Chi tiết task

Tạo `frontend/src/pages/admin/TrialFailureDetail.jsx` hoặc một component chi tiết dùng chung.

Các khối:

1. Thông tin lớp và học viên.
2. Thông tin gia sư và ca dạy thử.
3. Panel amber hiển thị lý do report thất bại.
4. Trạng thái task, người phụ trách, thời điểm.
5. Dropdown chuyển trạng thái việc (`PENDING` / `IN_PROGRESS` / `RESOLVED`) theo quyền.
6. Lịch sử thao tác dạng timeline/list.

Sau thao tác thành công, refetch chi tiết và hàng đợi; không chỉ sửa state cục bộ nếu response có thể thay đổi do staff khác thao tác đồng thời.

### 7.4. API frontend

Tạo `frontend/src/lib/staffTrialReportApi.js` với request helper có `error.status` và `error.code`, khác với helper hiện tại trong `staffClassRequestApi.js`.

Các hàm:

- `apiGetTrialFailureTasks`.
- `apiGetTrialFailureTaskDetail`.
- `apiAssignTrialFailureTaskToSelf`.
- `apiUnassignTrialFailureTask`.
- `apiAssignTrialFailureTask`.
- `apiRematchTrialFailureTask`.
- `apiChangeTrialFailureTaskStatus` (dropdown trạng thái).

## 8. Thông báo

Backend tiếp tục ghi `notifications` bằng `notifyReceptionists`, đồng thời fan-out tới admin nếu nghiệp vụ yêu cầu.

Frontend staff hiện chưa có API notification thật và notification list đang mock trong `AuthContext`. Không dùng notification làm nguồn chính của hàng đợi. Có hai bước:

1. Giai đoạn này: hàng đợi gọi API trực tiếp; notification chỉ là kênh nhắc việc.
2. Nếu triển khai notification thật: bổ sung endpoint đọc notification và map `link_entity_type/link_entity_id` tới route chi tiết task hoặc lớp.

## 9. Kiểm thử

### Backend unit/service

- `FAILED` tạo report, đổi lớp sang `TRIAL_FAIL`, tạo đúng một task `PENDING`.
- `SUCCESS` vẫn kích hoạt lớp và không tạo task.
- Gửi report lần hai trên lớp đã có report trả conflict.
- Thiếu lý do hoặc lý do dưới 5 ký tự trả lỗi validation.
- Hai request gửi đồng thời chỉ một request thành công.
- Gán cho mình đồng thời: chỉ người đầu tiên được gán.
- Gán/bỏ gán không làm thay đổi trạng thái ngoài quy định.
- Ghép lại không sửa lớp cũ và có tính idempotent.
- Lớp không có `class_requests` không được gọi rematch.
- Chuyển trạng thái qua dropdown ghi history; vào `RESOLVED` lưu người xử lý + thời điểm, ra khỏi `RESOLVED` xóa hai trường này.
- Có thể chuyển task đã `RESOLVED` về bất kỳ trạng thái nào trong ba trạng thái.
- Admin và receptionist có quyền giống nhau; tutor không truy cập được API staff.

### Frontend

- Render đúng filter và trạng thái.
- Nút Ghép lại chỉ xuất hiện khi có request.
- Dropdown chuyển trạng thái luôn có ở task (kể cả task đã `RESOLVED`); có thể chọn lại bất kỳ trạng thái nào.
- Xử lý lỗi 409/403/404 và lỗi mạng.
- Refetch sau assign/rematch và sau khi chuyển trạng thái.
- Dark mode, mobile layout, loading skeleton, empty state.
- Không có emoji hoặc text tiếng Anh trong UI mới.

### End-to-end

1. Tạo lớp `TRIAL` có ca dạy thử.
2. Gia sư gửi `FAILED` với lý do.
3. Xác nhận lớp thành `TRIAL_FAIL`, task `PENDING`, notification được tạo.
4. Admin mở hàng đợi, gán cho mình, xem chi tiết.
5. Với lớp có request: bấm Ghép lại, xác nhận request mở lại, lớp cũ vẫn giữ `TRIAL_FAIL`.
6. Với lớp không có request: không có nút Ghép lại, đánh dấu đã xử lý được.
7. Kiểm tra lịch sử và thao tác mở lại.
8. Thử hai staff thao tác đồng thời.
9. Chạy dark mode và mobile walkthrough.

## 10. Thứ tự triển khai

Mỗi bước thay đổi vừa phải và kiểm tra ngay sau bước đó.

1. Chốt tên bảng, trạng thái và API; rà soát với convention hiện có.
2. Viết migration V32; chạy Flyway và kiểm tra constraint/index.
3. Tạo domain/repository task và history; thêm repository tests.
4. Cập nhật `TrialReportService` để khóa report, chuyển `TRIAL_FAIL`, tạo task nguyên tử.
5. Tách/reuse logic rematch trong matching service.
6. Tạo staff controller, DTO, service và API tests.
7. Bổ sung notification/read endpoint nếu quyết định làm notification thật; nếu chưa làm, ghi rõ chỉ dùng queue API.
8. Tạo frontend API lib và model mapping.
9. Thêm route/menu/breadcrumb.
10. Dựng màn hàng đợi.
11. Dựng màn chi tiết và thao tác.
12. Cập nhật test frontend, kiểm tra dark mode/mobile.
13. Cập nhật tài liệu API/state machine.
14. Chạy `mvn test`, frontend test/build và `docker compose up --build`.

## 11. Tài liệu cần cập nhật

- `backend/API_DESIGN.md`: state machine `classes`, state machine task, API staff mới, quyền truy cập.
- `my_plans/trial_report_management/business_description.md`: cập nhật trạng thái đã triển khai nếu cần.
- Có thể bổ sung tài liệu vận hành ngắn cho admin/lễ tân về hàng đợi và thao tác Ghép lại.

## 12. Các quyết định đã chốt trước khi code

1. Dùng bảng `trial_report_tasks` + `trial_report_task_histories`, không dùng `audit_logs` làm nguồn history của task.
2. Nhân viên chuyển trực tiếp task qua dropdown giữa `PENDING`, `IN_PROGRESS`, `RESOLVED`; không có semantics "Mở lại" riêng.
3. `rematch` không tự động đổi trạng thái; nhân viên chọn `RESOLVED` riêng nếu đã hoàn tất xử lý.
4. Menu **Quản lý lớp học** dùng nhóm mở rộng trong AppShell.
5. Giai đoạn này chỉ backend ghi notification; hàng đợi vẫn là nguồn theo dõi chính, frontend chưa thay notification mock bằng API thật.

## 13. Definition of Done

- Migration V32 chạy sạch và không phá dữ liệu V31.
- Một lớp chỉ có một report chính thức và một task tương ứng khi `FAILED`.
- Hàng đợi staff hoạt động với filter trạng thái/người phụ trách.
- Admin/lễ tân thực hiện được xem, gán, ghép lại và chuyển trạng thái qua dropdown theo quyền.
- Lớp cũ `TRIAL_FAIL` và report cũ được giữ nguyên sau rematch.
- Test backend/frontend pass.
- `docker compose up --build` chạy không crash.
- UI tiếng Việt, hỗ trợ light/dark mode, responsive và dùng đúng component/icon của design system.
- Chưa commit cho tới khi người dùng tự kiểm thử và xác nhận kết quả.
