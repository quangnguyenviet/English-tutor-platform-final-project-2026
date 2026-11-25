# Plan: Gia sư báo cáo kết quả dạy thử qua hệ thống (Trial Report)

## Context

**Vấn đề:** Sau buổi dạy thử (lớp `TRIAL`), gia sư phải **báo miệng** với lễ tân; lễ tân mới bấm nút kích hoạt lớp (`TRIAL → ACTIVE`). Không có bước báo cáo nào trong hệ thống — ca thử chỉ là 6 cột `classes.trial_*` (V16), `teaching_logs` không có cột trạng thái/kết quả, và không có bảng/endpoint nào cho gia sư báo cáo.

**Mục tiêu (đã chốt với user):**
- Gia sư báo cáo kết quả dạy thử ngay trong **card "Lịch dạy thử" của tab Tổng quan** workspace lớp học.
- Kết quả: **Thành công** → hệ thống **tự động kích hoạt lớp ACTIVE** (đúng hiệu ứng của `activateTrialClass` hiện tại).
- Kết quả: **Không thành công** (bắt buộc lý do) → lưu báo cáo + thông báo lễ tân; lễ tân dùng nút **Ghép lại / Hủy SẴN CÓ** (không thêm nút mới phía staff), lý do của gia sư được hiển thị trong modal kích hoạt của lễ tân.
- Được **báo lại** trong khi lớp còn `TRIAL` (báo FAILED trước, báo SUCCESS sau → kích hoạt).
- Chỉ báo cáo được khi ca dạy thử **đã được thiết lập** (`trial_start_time IS NOT NULL`) — không gate theo ngày/giờ (hệ thống không xác minh được buổi học thật đã xảy ra; edge case báo giữa buổi, dời lịch).

## Bản đồ DB theo thao tác (bắt buộc đọc trước khi duyệt)

**Bảng MỚI (migration V31):** `trial_reports`
```sql
CREATE TABLE trial_reports (
    id          BIGSERIAL PRIMARY KEY,
    class_id    BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    reported_by BIGINT NOT NULL REFERENCES users(id),
    outcome     VARCHAR(10) NOT NULL,
    note        TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_trial_reports_outcome CHECK (outcome IN ('SUCCESS','FAILED')),
    CONSTRAINT chk_trial_reports_failed_note CHECK (outcome <> 'FAILED' OR note IS NOT NULL)
);
CREATE INDEX idx_trial_reports_class_created ON trial_reports(class_id, created_at DESC);
```
Không unique constraint (cố ý: cho phép nộp lại nhiều lần; "báo cáo mới nhất" = `ORDER BY created_at DESC, id DESC LIMIT 1`).

| Thao tác | Bảng ĐỌC | bảng GHI | Ghi chú khóa/riêng |
|---|---|---|---|
| `POST /api/v1/classes/{id}/trial-report` (gia sư) | `classes` (lock row `FOR UPDATE`), `trial_reports` (tra cứu khi cần), `class_requests` (fee_percentage nếu lớp có đơn), `users` (fan-out thông báo) | `trial_reports` (insert), `classes` (chỉ nhánh SUCCESS: `sessions_per_week`, `price_per_session`, `status=ACTIVE`, `active_from`, `end_date`), `payments` (chỉ SUCCESS: NEW → NOT_SUBMITTED qua `PaymentService.createForClassWithFeeInfo`), `class_requests.handled_by` (chỉ SUCCESS, nếu có đơn), `notifications` (tutor+student qua `activateTrialClass`, fan-out lễ tân), `audit_logs` | Row lock `FOR UPDATE` trên `classes.id` chống 2 tutor bấm chồng nhau; 1 transaction duy nhất (`@Transactional`) |
| Lễ tân đọc chi tiết đơn (existing `GET /class-requests/{id}`) — thêm 3 trường trial report | `trial_reports` (báo cáo mới nhất của lớp TRIAL hiện hành của đơn), `classes`, `class_requests` | — | Read-only, không thêm khóa |
| Nút kích hoạt / ghép lại lễ tân (existing endpoints) | không đổi | không đổi | Không sửa logic staff |

## Quyết định thiết kế

1. **Một endpoint** `POST /api/v1/classes/{id}/trial-report` trên `TutorClassController` (đã có `@PreAuthorize("hasRole('TUTOR')")`), body `{ outcome: "SUCCESS"|"FAILED", note?: string }`. SUCCESS là nhánh kích hoạt **cùng transaction**, tránh tách 2 API khiến client tự giữ state và mất nguyên tử (report ghi mà activation lỗi).
2. **Activation tái dụng logic có sẵn** (không duplicate): thêm method public `tutorActivateTrial(Long classId, HttpServletRequest)` trong `StaffClassRequestService` (module matching) — lock row `classes FOR UPDATE` (mô phỏng `completeDirectClass` L381-395), đọc `fee_percentage` từ `class_requests` nếu `class_request_id` khác null, rồi gọi đúng `activateTrialClass(...)` L419-483. Không gọi thẳng `complete()`/`completeDirectClass()` vì chúng gắn với guard phía staff (`class_request_id IS NULL` / lock request).
3. **Service mới `TrialReportService`** trong module/classroom phối hợp: guard sở hữu (`requireOwnedClass`, giống `TutorClassService`) → kiểm tra lớp `TRIAL` (409 `CLASS_NOT_TRIAL` 1122) → ca thử tồn tại (404 `TRIAL_SESSION_NOT_FOUND` 1124) → validate outcome (FAILED: note ≥ 5 ký tự → 400 mới `TRIAL_REPORT_REASON_REQUIRED` 1173; outcome khác → 400 mới `TRIAL_REPORT_INVALID_OUTCOME` 1174) → insert `trial_reports` → nếu SUCCESS gọi `tutorActivateTrial` → audit. **Lưu ý dữ liệu:** luồng `select-tutor` tạo lớp mà **không set `sessions_per_week`** (lấy từ body lễ tân khi complete-match) nên nhánh SUCCESS có thể rơi `CLASS_FEE_INCOMPLETE` (1115, 409) nếu cả 3 nguồn (lớp → body → draft payment/đơn) đều thiếu — giữ đúng hành vi hiện có, FE hiện lỗi lên.
4. **Hiển thị lý do phía staff — tối giản:** `ClassRequestDetailResponse` thêm `trialReportOutcome / trialReportNote / trialReportAt`; 1 khối cảnh báo (tone amber) trong **modal "Xác nhận ghép thành công"** của `ClassRequests.jsx` (đã fetch detail ở L497). Không thêm vào TrialsTab (StaffChatPage) hay notification-listing cho staff (out of scope).
5. **Thông báo lễ tân:** thêm `notifyReceptionists(title, content, entityType, entityId)` vào `MatchingLifecycleSupport` (fan-out SQL theo mẫu `ParentPostingService` L78-84: insert cho mọi user `role='RECEPTIONIST' AND status='ACTIVE'`). Gửi ở cả 2 outcome (FAILED kèm lý do).

## Các bước triển khai (mỗi bước nhỏ, kiểm tra sau mỗi bước)

### Backend
- **B1.** Migration `backend/src/main/resources/db/migration/V31__trial_reports.sql` (schema như trên). Chạy `docker compose up -d` kiểm tra flyway apply sạch.
- **B2.** `ErrorCode.java` (shared/exception): thêm 2 mã 1173/1174 (400) vào khối 11xx.
- **B3.** Module classroom:
  - DTO `TrialReportRequest` (`module/classroom/api/request/`, `@NotBlank outcome`, `@Size(max=1000) note`).
  - `TrialReportService` (guard, validate, insert, audit, gọi activation, fan-out thông báo).
  - `TutorClassController`: endpoint `POST /classes/{id}/trial-report`.
- **B4.** Module matching:
  - `StaffClassRequestService.tutorActivateTrial` (public, `@Transactional` REQUIRED — nằm trong transaction của service caller).
  - `MatchingLifecycleSupport.notifyReceptionists` (fan-out mẫu ParentPostingService).
- **B5.** Chi tiết đơn: thêm 3 trường trial report vào `ClassRequestDetailResponse` + truy vấn "báo cáo mới nhất" trong repository (JOIN `classes` + `trial_reports` theo `class_request_id`).
- **B6.** Tests (xem `ClassOccurrenceServiceTest` làm mẫu cơ sở test): class test mới `TrialReportServiceTest` với các kịch bản: SUCCESS khi đủ phí → lớp ACTIVE + payment NOT_SUBMITTED + có audit; FAILED thiếu lý do → 400; FAILED đủ lý do → insert, lớp vẫn TRIAL, được nộp lại; chưa có ca thử → 404; lớp không phải TRIAL → 409; tutor không sở hữu → 403; SUCCESS thiếu phí (cả 3 nguồn) → 409 CLASS_FEE_INCOMPLETE.

### Frontend (tuân thủ frontend/AGENTS.md: tiếng Việt, lucide-react, dark mode, tone Badge chuẩn)
- **F1.** `frontend/src/lib/tutorClassApi.js` (hoặc `classroomApi.js` — nơi `apiUpsertTrialSlot` hiện ở): thêm `apiSubmitTrialReport(token, classId, payload)`.
- **F2.** Component mới `frontend/src/components/tutor/TrialReportForm.jsx`: 2 nút chọn kết quả (Thành công — emerald / Không thành công — rose) + textarea lý do (bắt buộc khi FAILED, min 5 ký tự), footer Button `primary` "Gửi báo cáo", trạng thái submitting (`Loader2`), lỗi `serverError` hiển thị.
- **F3.** `frontend/src/pages/tutor/ClassOverview.jsx`:
  - map `mapClassDetail` (classroomApi.js): thêm `trialReportable = status==='TRIAL' && trialSession` và `trialReport` (outcome/note/reportAt từ detail).
  - Chỉnh điều kiện L153: khi ca thử đã diễn ra mà lớp vẫn `TRIAL` → card hiện **khu vực báo cáo** thay vì ẩn (nút "Báo cáo kết quả dạy thử"; nếu đã có báo cáo FAILED → hiện lý do + cho phép báo lại).
  - Submit → `apiSubmitTrialReport` → `loadDetail()` (workspace đã truyền sẵn); SUCCESS: toast "Đã kích hoạt lớp học"; FAILED: toast "Đã gửi báo cáo cho lễ tân".
- **F4.** `frontend/src/pages/admin/ClassRequests.jsx`: trong modal "Xác nhận ghép thành công", nếu `detail.trialReportOutcome === "FAILED"` → hiện 1 khối amber với lý do của gia sư. Map thêm 3 trường trong `staffClassRequestApi.js` nếu cần.

### Git (theo GIT_CONVENTION, trên nhánh feature từ dev)
- `git checkout dev && git pull` → `git checkout -b feature/trial-report`
- Commits nhỏ tách theo bước: `feat(trial): bảng trial_reports và endpoint báo cáo kết quả dạy thử (V31)`, `feat(trial): kích hoạt lớp khi gia sư báo dạy thử thành công`, `test(trial): kiểm thử luồng báo cáo dạy thử`, `feat(trial-fe): màn báo cáo kết quả dạy thử cho gia sư`, `fix(docs)/...` nếu có. Squash-merge về dev qua PR, không commit main trực tiếp.

## Kiểm chứng end-to-end
1. `mvn test` (hoặc JUnit class tương ứng) cho test mới; `docker compose up --build` chạy sạch, V31 apply.
2. Postman (API thật): `POST /api/v1/classes/{id}/trial-report` với token tutor — các kịch bản 400/403/404/409/200 như B6.
3. UI walkthrough (tiếng Việt): lớp TRIAL đã qua ca thử → tab Tổng quan hiện khu báo cáo → báo FAILED (nhập lý do) → mở trang `ClassRequests.jsx` (lễ tân/admin) → modal "Xác nhận ghép thành công" hiện lý do → bấm "Xác nhận" (đủ học phí) → lớp ACTIVE, payment NOT_SUBMITTED, thông báo lễ tân có trong bảng `notifications`. Thử lại: lớp TRIAL mới → báo SUCCESS (khi đủ dữ liệu phí) → lớp ACTIVE ngay.
4. Dark mode: kiểm tra card + modal mới hiển thị đúng (token `dark:` theo AGENTS.md).
