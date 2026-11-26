# Kế hoạch triển khai: Kết nối lịch dạy tổng quát của gia sư

## Context

Màn hình `/tutor/schedule` cần hiển thị lịch thật của tất cả lớp thuộc gia sư đang đăng nhập, thay cho dữ liệu mock, đồng thời giữ semantics với lịch chi tiết lớp tại `/tutor/classes/:classId/schedule`.

Phạm vi được triển khai theo [business_description.md](business_description.md) và [design_plan.md](design_plan.md): tổng hợp lịch theo tuần, hỗ trợ ca cố định/ca thử/ngoại lệ/nhật ký, xử lý lỗi từng lớp, chuyển tuần và điều hướng tới lịch chi tiết.

Quy tắc project: từng bước nhỏ, kiểm tra sau mỗi bước; không commit cho đến khi người dùng tự kiểm thử và duyệt.

## Trạng thái tổng quan

- **Đã làm:** route, API client, hook tổng hợp nhiều lớp, giao diện lịch tuần, loading/empty/error/partial error, điều hướng và xử lý cơ bản ca dời lịch.
- **Chưa làm đầy đủ:** kiểm thử tự động cho toàn bộ model/hook, xác nhận E2E với dữ liệu thật, xử lý ca dời từ tuần khác bằng query backend, kiểm thử Docker và walkthrough UI.

## Bước 1 — Khảo sát hiện trạng và chốt contract ✅

- [x] Xác nhận route `/tutor/schedule` đã render `TutorSchedule`.
- [x] Xác nhận frontend đã có `useTutorWeekSchedule`.
- [x] Xác nhận API hiện có:
  - [x] `GET /api/v1/tutors/me/classes`.
  - [x] `GET /api/v1/classes/{id}/schedule?weekStart=YYYY-MM-DD`.
- [x] Đối chiếu DTO backend `ClassSummaryResponse`, `ClassScheduleResponse`, `OccurrenceResponse`, `TeachingLogMini`, `ExceptionInfo`.
- [x] Quyết định giai đoạn đầu dùng API lịch từng lớp, chưa tạo endpoint tổng hợp mới.
- [x] Xác nhận không cần migration hoặc bảng mới cho luồng chỉ đọc lịch.

## Bước 2 — Nguồn dữ liệu và bản đồ DB ✅

### Các bảng được đọc

- [x] `users`: xác định người dùng hiện tại và tên học viên/gia sư theo quan hệ hiện có.
- [x] `tutors`: xác định hồ sơ gia sư khi lấy danh sách lớp.
- [x] `classes`: thông tin lớp, trạng thái, học viên, hình thức dạy và dữ liệu ca thử.
- [x] `class_schedules`: lịch cố định, thứ trong tuần và khoảng hiệu lực.
- [x] `schedule_exceptions`: ngoại lệ hủy/dời lịch.
- [x] `teaching_logs`: xác định occurrence đã có nội dung nhật ký.

### Bản đồ đọc/ghi theo thao tác

| Thao tác | Bảng đọc | Bảng ghi | Ràng buộc |
|---|---|---|---|
| Lấy lớp của gia sư | `users`, `tutors`, `classes` và quan hệ học viên | Không ghi | Scope theo gia sư hiện tại từ security context |
| Lấy lattice tuần của một lớp | `classes`, `class_schedules`, `schedule_exceptions`, `teaching_logs` | Không ghi | Service kiểm tra lớp thuộc gia sư hiện tại |
| Tổng hợp nhiều lớp | Các bảng của hai thao tác trên | Không ghi | Lỗi một lớp không làm mất lớp khác |
| Mở chi tiết occurrence | Các bảng đọc của lịch chi tiết | Không ghi | `classId` và occurrence phải thuộc gia sư hiện tại |
| Thử tải lại | Lặp lại các thao tác đọc | Không ghi | Xóa kết quả lỗi cũ trước khi tải lại |

- [x] Không thêm migration/bảng mới.
- [x] Không có thao tác ghi dữ liệu trong màn hình tổng quát.

## Bước 3 — Backend API và lattice occurrence 🟡

- [x] API danh sách lớp gia sư đã có phân quyền `TUTOR`.
- [x] API lịch lớp đã có kiểm tra quyền sở hữu trong `ClassOccurrenceService`.
- [x] Lattice giới hạn theo tuần 7 ngày.
- [x] Lịch cố định tôn trọng `valid_from`/`valid_to`.
- [x] Ca thử được đưa vào lattice khi thuộc tuần đang xem.
- [x] Ngoại lệ `CANCELLED` được trả kèm occurrence.
- [x] Ngoại lệ `RESCHEDULED` được trả kèm thông tin ngày/giờ mới.
- [x] Bổ sung `originalDate` vào `OccurrenceResponse` để giữ ngày gốc khi dời lịch.
- [x] Backend dùng ngày/giờ mới của ca dời cho occurrence.
- [x] Backend bỏ occurrence khỏi tuần cũ khi ngày mới nằm ngoài tuần đang xem.
- [ ] Bổ sung/kiểm tra query để ca dời từ tuần trước xuất hiện trong tuần mới theo `new_date`.
- [ ] Xác nhận ca dời từ tuần hiện tại sang tuần sau xuất hiện đúng ở tuần sau.
- [ ] Bổ sung test service/repository cho các trường hợp dời qua ranh giới tuần.
- [ ] Cập nhật `backend/API_DESIGN.md` nếu contract `originalDate` được chốt chính thức.

## Bước 4 — Frontend API và mapping ✅

- [x] Giữ `apiGetMyClasses(token)` trong `classroomApi.js`.
- [x] Giữ `apiGetClassSchedule(token, classId, weekStart)` trong `classroomApi.js`.
- [x] Dùng `mapClassSummary` làm mapping tập trung cho lớp.
- [x] Chuẩn hóa giờ bằng `formatSessionTime`.
- [x] Map `classId`, tên lớp, tên học viên, trạng thái và hình thức dạy vào occurrence.
- [x] Xử lý `RESCHEDULED` ở helper `tutorOccurrenceTarget`.
- [x] Ưu tiên trạng thái ngoại lệ trước nhật ký và thời gian hiện tại.
- [x] Tạo link chi tiết với `classId`, `weekStart`, `occurrence` qua `URLSearchParams`.
- [x] Không có mock data fallback khi request lỗi.

## Bước 5 — Hook tổng hợp lịch tuần ✅

File: `frontend/src/hooks/useTutorWeekSchedule.js`

- [x] Khởi tạo và tải theo `weekStart`.
- [x] Lấy danh sách lớp của gia sư hiện tại.
- [x] Loại lớp `CANCELLED` khỏi phạm vi hiển thị.
- [x] Gọi lịch từng lớp bằng `Promise.allSettled`.
- [x] Giữ occurrence của các lớp tải thành công khi một lớp lỗi.
- [x] Trả cảnh báo partial error kèm số lớp thất bại.
- [x] Trả lỗi toàn cục khi không lấy được danh sách lớp.
- [x] Sắp xếp theo ngày thực tế rồi giờ bắt đầu.
- [x] Không giữ occurrence của tuần cũ khi đổi tuần.
- [x] Có hàm `reload` để thử tải lại.
- [ ] Thêm test thuần cho `tutorOccurrenceTarget`.
- [ ] Thêm test thuần cho `tutorOccurrenceStatus`.
- [ ] Thêm test cho partial success và lỗi toàn cục.
- [ ] Thêm test cho occurrence thiếu `classId`/`occurrenceKey`.

## Bước 6 — Giao diện `/tutor/schedule` ✅

File: `frontend/src/pages/tutor/TutorSchedule.jsx`

- [x] Hiển thị lưới đủ 7 ngày trong tuần.
- [x] Hiển thị danh sách chi tiết các ca trong tuần.
- [x] Hiển thị tên lớp, học viên, giờ dạy, hình thức dạy và trạng thái.
- [x] Hiển thị nhãn ca dạy thử.
- [x] Hiển thị ngày gốc khi ca đã dời.
- [x] Chuyển tuần trước/sau.
- [x] Nút quay về `Tuần này`.
- [x] Loading bằng skeleton.
- [x] Empty state tiếng Việt khi tuần không có ca.
- [x] Error state toàn cục có thao tác thử lại.
- [x] Partial error không che các lớp tải thành công.
- [x] Điều hướng từ ô lịch và danh sách đến lịch chi tiết lớp.
- [x] Dùng component UI chuẩn `Button`, `Badge`, `Card`.
- [x] Dùng icon `lucide-react`, không dùng emoji.
- [x] Hỗ trợ dark mode và responsive mobile theo `frontend/AGENTS.md`.
- [ ] Walkthrough trực tiếp trên mobile.
- [ ] Walkthrough trực tiếp ở light mode/dark mode.
- [ ] Kiểm tra keyboard focus và trạng thái hover/active trên các nút/link.

## Bước 7 — Kiểm thử backend 🟡

- [x] Backend compile thành công sau thay đổi.
- [ ] Test gia sư chỉ lấy được lớp của chính mình.
- [ ] Test gia sư không đọc được lịch lớp của gia sư khác.
- [ ] Test lattice trả đúng 7 ngày.
- [ ] Test lịch cố định tôn trọng khoảng hiệu lực.
- [ ] Test ca dạy thử.
- [ ] Test `CANCELLED` không bị coi là `UPCOMING`.
- [ ] Test `RESCHEDULED` có ngày/giờ mới và `originalDate`.
- [ ] Test ca dời ngoài tuần không xuất hiện ở tuần cũ.
- [ ] Test ca dời từ tuần khác xuất hiện tại tuần mới.
- [ ] Test nhật ký khớp theo `class_id`, ngày và giờ bắt đầu.
- [ ] Test `weekStart` sai định dạng.
- [ ] Test API đọc không ghi dữ liệu.

## Bước 8 — Kiểm thử frontend 🟡

- [x] `npm run lint` chạy được; chỉ còn warning tồn tại trong project.
- [x] `npm run build` thành công.
- [ ] Test mapping lớp và occurrence.
- [ ] Test đủ các trạng thái `UPCOMING`, `IN_PROGRESS`, `COMPLETED`, `MISSING_LOG`, `RESCHEDULED`, `CANCELLED`.
- [ ] Test đổi tuần và reset về tuần hiện tại.
- [ ] Test partial error.
- [ ] Test global error không fallback về mock.
- [ ] Test empty state.
- [ ] Test link chi tiết giữ đúng `classId`, `weekStart`, `occurrence`.
- [ ] Test response có/không có `originalDate`.

## Bước 9 — Kiểm thử tích hợp và E2E ⬜

1. [ ] Đăng nhập bằng gia sư có nhiều lớp.
2. [ ] Mở `/tutor/schedule` và đối chiếu với lịch chi tiết từng lớp.
3. [ ] Kiểm tra lớp có lịch cố định.
4. [ ] Kiểm tra lớp có ca dạy thử.
5. [ ] Kiểm tra ca đã có nhật ký và ca đã qua chưa có nhật ký.
6. [ ] Kiểm tra ca hủy.
7. [ ] Kiểm tra ca dời trong cùng tuần.
8. [ ] Kiểm tra ca dời sang tuần khác.
9. [ ] Chuyển tuần trước/sau và quay lại tuần hiện tại.
10. [ ] Làm lỗi request của một lớp và xác nhận partial error.
11. [ ] Dùng `classId` của gia sư khác và xác nhận không lộ dữ liệu.
12. [ ] Kiểm tra responsive mobile, dark mode và keyboard focus.

## Bước 10 — Verification tổng và bàn giao 🟡

- [x] Backend compile: `mvn -q -f backend/pom.xml -DskipTests compile`.
- [x] Frontend lint: `npm run lint`.
- [x] Frontend build: `npm run build`.
- [ ] Chạy đầy đủ backend tests liên quan.
- [ ] Chạy đầy đủ frontend tests sau khi bổ sung.
- [ ] Chạy `docker compose up --build` và xác nhận không crash.
- [ ] Kiểm tra migration hiện hành không bị ảnh hưởng.
- [ ] Cập nhật tài liệu API nếu contract occurrence thay đổi.
- [ ] User tự kiểm thử route `/tutor/schedule`.
- [ ] User xác nhận duyệt kết quả.
- [ ] Chỉ sau khi user duyệt mới commit.

## Definition of Done

- [ ] `/tutor/schedule` chỉ dùng dữ liệu backend, không dùng mock fallback.
- [x] Có tổng hợp lịch từ nhiều lớp và xử lý lỗi từng lớp.
- [x] Có chuyển tuần, empty/loading/error/partial error.
- [x] Có điều hướng đúng lớp, tuần và occurrence.
- [x] Giao diện tiếng Việt, dark mode, responsive, không emoji.
- [ ] Ca dời qua ranh giới tuần đã được kiểm thử và xác nhận đúng.
- [ ] Có test tự động cho trạng thái, mapping, quyền và các tình huống biên chính.
- [ ] Backend/frontend/Docker verification đạt.
- [ ] Người dùng tự kiểm thử và duyệt trước khi commit.

---

## Iteration 2 — Cải thiện giao diện lịch tuần theo hướng “Dashboard cân đối” (UI polish)

> Task này chỉ sửa giao diện của `/tutor/schedule` trên cơ sở logic/hook/API đã hoàn tất ở Iteration 1. Người dùng đã chọn hướng **“Dashboard cân đối”**: 7 panel ngày có chiều cao tối thiểu đồng nhất, card ca dạy nền trung tính kèm vạch màu trạng thái, header ngày nằm trong cùng panel, empty state đẹp hơn và responsive tối ưu cho mobile.

### Trạng thái hiện tại (từ Iteration 1)

- Các cột ngày hiện cao tự do theo nội dung → cột không có lịch chỉ cao `min-h-16`, cột nhiều ca kéo dài → thiếu cảm giác “bảng lịch tuần” thống nhất.
- Mỗi card ca dùng nền màu theo trạng thái (`SURFACE[meta.tone]`, ví dụ `bg-blue-50/70`) → khi 7 cột cạnh nhau, nhiều màu nền xuất hiện cùng lúc, giao diện hơi rối và nặng.
- Header ngày và danh sách ca là 2 block riêng biệt, không tạo thành một panel thống nhất.

### Dữ liệu & phạm vi

- **Chỉnh sửa:** chỉ [frontend/src/pages/tutor/TutorSchedule.jsx](frontend/src/pages/tutor/TutorSchedule.jsx).
- **Không chỉnh sửa:** `useTutorWeekSchedule.js`, `classroomApi.js`, `SessionCard` (phần danh sách chi tiết bên dưới), logic điều hướng, URL params, loading/error/partial error, nút chuyển tuần.
- **DB tables đọc:** không thao tác trực tiếp; chỉ dùng kết quả hook hiện có.
- **DB tables ghi:** không có.

### Các thay đổi cụ thể

1. **7 panel ngày có chiều cao bằng nhau**
   - Mỗi ngày (header + danh sách ca) được bọc vào một panel flex-col duy nhất; trên desktop, 7 panel sẽ dùng chiều cao bằng panel cao nhất trong cùng hàng để tạo bố cục lịch tuần thống nhất.
   - Header ngày (Thứ + ngày + số buổi) trở thành phần đầu trong cùng panel, không còn là block card riêng.
   - Ngày hiện tại giữ nền xanh nhạt + `ring-1` nhẹ, đồng thời hiển thị nhãn “Hôm nay” hoặc số buổi kèm dấu hiệu trực quan.
   - Grid hiện có `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` cần tối ưu thành: mobile 1 cột, tablet (sm/md) 2–4 cột, desktop (lg) 7 cột theo khuyến nghị trong đề xuất UI; kiểm tra kỹ không bị overflow ngang ở `sm` (768px) khi vẫn giữ 4 cột hiện tại.

2. **Card ca dạy nền trung tính + vạch màu trạng thái**
   - Thay nền `SURFACE[meta.tone]` (ví dụ `bg-blue-50/70`) bằng nền trung tính: `bg-white dark:bg-slate-900` (khớp chuẩn Card trong AGENTS.md).
   - Thêm một thanh màu dọc bên trái card (hoặc thanh ngang mỏng) dùng tone hiện có của `meta.tone` (blue/amber/emerald/rose) để giữ tín hiệu trạng thái mà không cần nền màu cả card.
   - Giảm số border/card lồng nhau trong ô lịch: mỗi ca chỉ có một border chính + vạch màu, không cần thêm card lồng card.
   - Giữ nguyên `className` link hover/active (`hover:border-blue-400 active:scale-[0.98]`), tên lớp, học viên, giờ, trạng thái và link “Xem chi tiết” (nếu giữ nút trong card overview; nếu bỏ nút ở overview thì nút vẫn còn trong `SessionCard` bên dưới).

3. **Header ngày trong panel**
   - Hiển thị: nhãn thứ (`day.label`), ngày tháng dạng `12/05` (từ `day.date.slice(-2)` hiện có, cần xem `buildWeekDays` để biết cấu trúc), và số buổi (`day.sessions.length`).
   - Khi số buổi = 0, hiển thị “Trống lịch”.
   - Khi là ngày hiện tại, thêm badge/nhãn “Hôm nay” màu blue nhẹ (khớp tone blue hiện có trong `STATUS_META`/design token), không dùng nền xanh mạnh cho toàn cột.

4. **Empty state ô không có lịch**
   - Thay `min-h-16` + chữ “Không có lịch” bằng empty state cao hơn, chiếm phần lớn chiều cao panel còn lại (`flex-1`), hiển thị icon `CalendarDays` màu nhạt hoặc dấu gạch `—` + “Trống lịch” theo chuẩn Empty State trong DESIGN.md (icon + heading + description ngắn).
   - Trên mobile, giảm chiều cao tối thiểu (khoảng `80–100px`) để tránh phải cuộn quá dài khi có nhiều ngày trống.

5. **Giữ nguyên danh sách “Buổi dạy trong tuần” bên dưới**
   - Không thay đổi `SessionCard` và layout danh sách; đây vẫn là nơi xem chi tiết đầy đủ và thao tác “Xem chi tiết”.
   - Chỉ cân nhắc nới/hẹp khoảng cách `space-y` giữa khối overview và khối danh sách nếu cần cho cảm giác phân tách rõ hơn.

### Ràng buộc thiết kế (từ AGENTS.md / DESIGN.md)

- Toàn bộ chữ hiển thị phải là tiếng Việt chuẩn.
- Hỗ trợ đồng thời Light và Dark mode (`dark:` variants), kiểm tra không bị chữ đen trên nền tối hoặc ngược lại.
- Chỉ dùng icon từ `lucide-react`, không dùng emoji.
- Bo góc thẻ/nút theo `rounded-xl`/`rounded-2xl` hiện có.
- Nút/link giữ hiệu ứng `active:scale-[0.98]` theo chuẩn.
- Layout co giãn mượt trên mobile (<768px), không tràn ngang.

### Bản đồ thao tác (theo quy tắc project: phải liệt kê đọc/ghi DB)

| Thao tác | Bảng đọc | Bảng ghi |
|---|---|---|
| Render lịch tuần (không đổi so với Iteration 1) | `users`, `tutors`, `classes`, `class_schedules`, `schedule_exceptions`, `teaching_logs` (gián tiếp qua `useTutorWeekSchedule`) | Không ghi |
| Chuyển tuần | Các bảng trên, gọi lại API theo `weekStart` mới | Không ghi |
| Bấm link “Xem chi tiết” | Dữ liệu occurrence hiện có trong hook, không query DB mới | Không ghi |

Không có thao tác ghi dữ liệu mới trong task UI polish này.

### Trạng thái hoàn thành (đã làm)

- [x] **Bước 1 — Panel đồng nhất:** Bọc header + danh sách ca của mỗi ngày vào 1 panel flex-col với `min-h-[360px]`; 7 cột cao cân đối, cột nhiều ca vẫn tự kéo dài. Header ngày (thứ, ngày, số buổi/“Trống lịch”, badge “Hôm nay”) nằm trong cùng panel, không còn là block card riêng. Ngày hiện tại dùng nền xanh nhạt + `ring-1 ring-blue-300/60`, badge “Hôm nay”.
- [x] **Bước 2 — Card nền trung tính + vạch màu:** Bỏ nền màu `SURFACE[meta.tone]` khỏi card overview; đổi sang nền `bg-white dark:bg-slate-900`, thêm thanh màu dọc `w-1` bên trái theo tone (blue/amber/emerald/rose) + màu chữ trạng thái. Giữ nguyên hover/active và link chi tiết.
- [x] **Bước 3 — Empty state:** Ô trống dùng `CalendarDays` icon nhạt + nhãn “Trống lịch”, chiều cao `flex-1` chiếm hết phần còn lại của panel (desktop `min-h-[120px]` cho ô trống riêng, mobile panel vẫn `min-h-[360px]` theo khuyến nghị ban đầu — cân nhắc giảm nếu cần).
- [x] **Bước 4 — Responsive grid:** Đổi từ `grid-cols-2 sm:grid-cols-4 lg:grid-cols-7` sang `grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7` (mobile 1 cột, tablet 2/4 cột, desktop 7 cột).
- [x] **Giữ nguyên:** danh sách “Buổi dạy trong tuần”, `SessionCard`, logic chuyển tuần, `detailUrl`, hook/API, loading/error/partial error.
- [x] **Verification tự động:** `npm run lint` (chỉ còn warning tồn tại từ trước, không có lỗi mới do thay đổi này) và `npm run build` (Vite thành công).

### Checklist kiểm tra (dành cho người dùng tự chạy)

- [ ] 7 cột ngày trên desktop có chiều cao cân đối, không còn trạng thái “lọt thỏm” cho ngày không có lịch.
- [ ] Card ca dạy dùng nền trung tính + vạch màu trạng thái, hiển thị rõ ở cả light mode lẫn dark mode.
- [ ] Header ngày (thứ, ngày, số buổi, “Hôm nay” nếu đúng) nằm gọn trong cùng panel với danh sách ca.
- [ ] Empty state ô trống hiển thị đúng chuẩn DESIGN.md, chiều cao cân đối hơn trước.
- [ ] Mobile (<768px) hiển thị 1 cột, không tràn ngang; tablet hiển thị 2 hoặc 4 cột hợp lý.
- [ ] Danh sách “Buổi dạy trong tuần” bên dưới và nút “Xem chi tiết” hoạt động đúng như trước.
- [ ] Người dùng tự kiểm thử giao diện ở cả 2 theme và responsive; sau khi duyệt mới được commit (theo CLAUDE.md).

