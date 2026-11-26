# Kế hoạch thiết kế: Kết nối lịch dạy tổng quát của gia sư với backend

## 1. Bối cảnh và phát hiện hiện trạng

Route mục tiêu là `/tutor/schedule`. Giao diện cần giữ cùng ngôn ngữ thiết kế và cách diễn giải dữ liệu với trang lịch chi tiết lớp tại `/tutor/classes/:classId/schedule`.

Qua rà soát mã nguồn hiện tại:

- Route `/tutor/schedule` đã được khai báo trong `frontend/src/App.jsx` và render `TutorSchedule`.
- `TutorSchedule.jsx` hiện đã sử dụng hook `useTutorWeekSchedule` thay vì đọc trực tiếp dữ liệu mock.
- `useTutorWeekSchedule` hiện gọi `apiGetMyClasses` để lấy lớp của gia sư, sau đó gọi `apiGetClassSchedule` cho từng lớp.
- Backend hiện đã có:
  - `GET /api/v1/tutors/me/classes` — danh sách lớp của gia sư.
  - `GET /api/v1/classes/{id}/schedule?weekStart=YYYY-MM-DD` — lattice tuần của một lớp.
- Vì vậy, phạm vi triển khai cần xác nhận lại trong lúc code: có thể hoàn thiện và kiểm thử luồng API hiện có thay vì tạo ngay endpoint mới. Nếu phát hiện response hiện tại chưa đủ dữ liệu hoặc gây N+1 không phù hợp, mới bổ sung endpoint tổng hợp sau khi đo và đối chiếu.

## 2. Mục tiêu thiết kế

1. Lịch tổng quát chỉ hiển thị dữ liệu thật từ backend.
2. Tập hợp đúng các ca dạy của gia sư hiện tại trong một tuần.
3. Tái sử dụng nguồn dữ liệu và quy tắc lattice của lịch chi tiết lớp.
4. Giữ đúng ngày/giờ thực tế của ca dời lịch và không hiển thị trùng ca.
5. Hiển thị thống nhất các trạng thái `UPCOMING`, `IN_PROGRESS`, `COMPLETED`, `MISSING_LOG`, `RESCHEDULED`, `CANCELLED`.
6. Lỗi một lớp không làm mất lịch của các lớp đã tải thành công.
7. Không quay về mock data khi API lỗi.
8. Giữ liên kết từ ca tổng quát đến đúng lớp, đúng tuần và đúng lần diễn.
9. Không tạo migration hoặc bảng mới nếu các bảng lịch hiện tại đã đáp ứng đủ nghiệp vụ.

## 3. Phạm vi

### 3.1. Trong phạm vi

- Rà soát và hoàn thiện API đọc danh sách lớp của gia sư.
- Rà soát và hoàn thiện API đọc lattice tuần của từng lớp.
- Cập nhật mapping dữ liệu frontend nếu tên trường giữa backend và frontend chưa nhất quán.
- Hoàn thiện hook tổng hợp lịch theo tuần.
- Hiển thị lịch dạng lưới 7 ngày và danh sách chi tiết các ca trong tuần.
- Chuyển tuần trước/sau và quay về tuần hiện tại.
- Hiển thị loading, empty state, lỗi toàn cục và lỗi một phần.
- Điều hướng tới lịch chi tiết lớp.
- Test backend, frontend và kiểm thử tích hợp luồng đọc lịch.

### 3.2. Ngoài phạm vi

- Tạo, sửa hoặc xóa lịch cố định.
- Tạo, sửa hoặc xóa ngoại lệ dời/hủy lịch.
- Ghi, sửa hoặc xóa nhật ký dạy học từ màn hình tổng quát.
- Tạo lịch độc lập riêng cho gia sư.
- Lọc theo học viên, trạng thái, hình thức dạy hoặc tên lớp.
- Đồng bộ lịch với Google Calendar.
- Gửi email, push notification hoặc nhắc lịch.
- Thay đổi nghiệp vụ và giao diện chính của lịch chi tiết lớp.
- Bổ sung bảng dữ liệu mới khi chưa chứng minh được nhu cầu.

## 4. Quyết định thiết kế chính

| Nội dung | Quyết định |
|---|---|
| Nguồn dữ liệu | Dùng API backend; không dùng mock làm fallback khi request lỗi. |
| Phạm vi lớp | Lấy các lớp của gia sư hiện tại từ `GET /tutors/me/classes`; loại lớp đã hủy ở tầng nghiệp vụ hiển thị nếu backend chưa lọc. |
| Nguồn occurrence | Tái sử dụng `GET /classes/{id}/schedule` vì đây là nguồn lattice đã có cho lịch chi tiết lớp. |
| Cách tổng hợp | Giai đoạn đầu giữ mô hình lấy danh sách lớp rồi lấy lattice từng lớp; chỉ tạo API tổng hợp nếu hiệu năng hoặc số lượng request không đạt yêu cầu. |
| Lỗi từng lớp | Dùng cơ chế partial success: giữ kết quả lớp thành công, hiển thị cảnh báo số lớp thất bại. |
| Trạng thái | Map nhất quán từ exception, log, ngày và giờ hiện tại; exception ưu tiên hơn log. |
| Ca dời lịch | Hiển thị theo ngày/giờ mới, lưu ngày gốc để hiển thị thông tin “Dời từ ngày…”. |
| Điều hướng | Dùng `classId`, `weekStart` và `occurrence` khi mở trang lịch chi tiết. |
| Quyền | Backend kiểm tra gia sư hiện tại sở hữu lớp; frontend không tự quyết định quyền bằng `classId`. |
| Cơ sở dữ liệu | Không migration nếu không thay đổi schema; dùng các bảng hiện có. |

## 5. Thiết kế dữ liệu và nguồn sự thật

### 5.1. Các bảng được sử dụng

- `users`: xác định tài khoản gia sư và tên học viên/người liên quan thông qua quan hệ hiện có.
- `tutors`: xác định hồ sơ gia sư khi query lớp của gia sư.
- `classes`: thông tin lớp, trạng thái lớp, học viên, gia sư và dữ liệu ca dạy thử.
- `class_schedules`: các ca cố định, ngày trong tuần và khoảng hiệu lực.
- `schedule_exceptions`: ngoại lệ theo từng lần diễn, gồm hủy hoặc dời lịch.
- `teaching_logs`: nhật ký dạy học theo `class_id`, ngày và giờ bắt đầu.

Không ghi bảng nào trong luồng xem lịch tổng quát.

### 5.2. Bản đồ đọc/ghi cơ sở dữ liệu theo thao tác

| Thao tác | Bảng đọc | Bảng ghi | Khóa/nguyên tử |
|---|---|---|---|
| Lấy danh sách lớp của gia sư | `users`, `tutors`, `classes`, quan hệ học viên hiện có | Không ghi | Scope theo tutor hiện tại từ security context |
| Lấy lattice tuần của một lớp | `classes`, `class_schedules`, `schedule_exceptions`, `teaching_logs`, dữ liệu học viên/gia sư liên quan | Không ghi | Kiểm tra quyền sở hữu lớp trước khi trả dữ liệu |
| Tổng hợp lịch nhiều lớp | Các bảng đọc của hai thao tác trên | Không ghi | Mỗi lớp độc lập; lỗi một lớp không rollback dữ liệu lớp khác |
| Mở chi tiết ca | Các bảng đọc của lịch chi tiết lớp | Không ghi | `classId` và `occurrence` phải thuộc gia sư hiện tại |
| Thử tải lại | Lặp lại các thao tác đọc tương ứng | Không ghi | Xóa lỗi cũ trước khi tải lại |

### 5.3. Ràng buộc dữ liệu cần giữ

- Chỉ trả các lớp mà gia sư hiện tại được phép truy cập.
- Lattice phải giới hạn trong `[weekStart, weekStart + 6 ngày]`.
- Ca cố định chỉ phát sinh trong khoảng `valid_from`/`valid_to` của `class_schedules`.
- Ngoại lệ `CANCELLED` không được biến thành ca sắp dạy.
- Ngoại lệ `RESCHEDULED` dùng ngày/giờ mới làm mốc hiển thị và không tạo bản sao ở mốc cũ.
- Nhật ký được nhận diện theo cặp `class_id`, `log_date`, `start_time`.
- Không làm thay đổi dữ liệu khi chỉ xem lịch.

## 6. Thiết kế backend

### 6.1. Ưu tiên kiểm tra API hiện có

Rà soát các thành phần sau trước khi thêm code mới:

- `TutorClassController#getMyClasses`.
- `TutorClassService#getMyClasses`.
- `ClassOccurrenceController#getClassSchedule`.
- `ClassOccurrenceService#listOccurrences`.
- Các query repository lấy lớp, lịch cố định, ngoại lệ và nhật ký.
- Các DTO `ClassSummaryResponse`, `ClassScheduleResponse`, `OccurrenceResponse` và `ScheduleInfo`.

Mục tiêu của bước này là bảo đảm response đã có đủ:

- `classId`, tên lớp, tên học viên, trạng thái lớp.
- `occurrences` với ngày, giờ, nguồn và exception.
- `log.hasContent` hoặc dữ liệu tương đương để frontend xác định trạng thái nhật ký.
- Hình thức dạy và thông tin ca thử khi có.

### 6.2. Endpoint hiện có cần giữ hoặc điều chỉnh

| Method | Endpoint | Mục đích |
|---|---|---|
| `GET` | `/api/v1/tutors/me/classes` | Lấy danh sách lớp thuộc gia sư hiện tại |
| `GET` | `/api/v1/classes/{id}/schedule?weekStart=YYYY-MM-DD` | Lấy lattice tuần của một lớp |

Nếu các endpoint đủ dữ liệu, không tạo endpoint mới.

Nếu sau kiểm thử hiệu năng thấy số lượng request theo số lớp gây vấn đề, đề xuất giai đoạn sau bổ sung:

`GET /api/v1/tutors/me/schedule?weekStart=YYYY-MM-DD`

Endpoint tổng hợp khi đó phải giữ cùng semantics với endpoint lịch chi tiết, dùng cùng service/query lõi, không copy lại logic sinh occurrence. Việc bổ sung endpoint này chỉ được thực hiện sau khi có bằng chứng về giới hạn hiệu năng hoặc trải nghiệm tải.

### 6.3. Phân quyền và lỗi

- Controller lịch lớp tiếp tục dùng `TUTOR` và service kiểm tra gia sư sở hữu lớp.
- Request không có token hoặc token hết hạn xử lý theo cơ chế xác thực chung.
- `403`/`404` không được frontend biến thành dữ liệu rỗng một cách im lặng.
- Lớp không còn truy cập được phải được ghi nhận là lỗi của lớp đó hoặc bị loại theo quy ước backend, không được gắn occurrence sang lớp khác.

## 7. Thiết kế frontend

### 7.1. Các file hiện có cần rà soát

- `frontend/src/App.jsx` — route `/tutor/schedule` và route chi tiết.
- `frontend/src/pages/tutor/TutorSchedule.jsx` — màn hình lịch tổng quát.
- `frontend/src/hooks/useTutorWeekSchedule.js` — tải và tổng hợp dữ liệu.
- `frontend/src/lib/classroomApi.js` — API lớp và lịch.
- `frontend/src/lib/studentModel.js` — helper tuần/ngày đang được tái sử dụng.
- `frontend/src/components/ui/Button.jsx`, `Badge.jsx`, `Card.jsx` — component giao diện chuẩn.
- `frontend/src/components/student/AsyncBlock.jsx` — loading/error block.

### 7.2. Luồng tải dữ liệu

1. Khởi tạo `weekStart` bằng đầu tuần hiện tại.
2. Gọi `apiGetMyClasses(token)`.
3. Lọc các lớp không thuộc phạm vi hiển thị, tối thiểu `CANCELLED`.
4. Gọi lịch tuần cho từng lớp.
5. Dùng `Promise.allSettled` hoặc cơ chế tương đương để giữ kết quả thành công khi một lớp lỗi.
6. Map occurrence kèm thông tin lớp và học viên.
7. Chuẩn hóa ngày/giờ thực tế của ca dời lịch.
8. Tính trạng thái hiển thị ở một helper duy nhất.
9. Sắp xếp theo ngày thực tế rồi giờ bắt đầu.
10. Dựng lưới 7 ngày và danh sách chi tiết.

Không đặt dữ liệu mock vào hook hoặc component làm fallback.

### 7.3. Giao diện và responsive

Giữ giao diện theo `frontend/AGENTS.md` và trang lịch chi tiết:

- Container `max-w-6xl`, spacing và typography theo Midnight Academic.
- Nút chuyển tuần dùng `Button`, có hover/active state.
- Trạng thái dùng `Badge` với tone `blue`, `amber`, `emerald`, `rose`, `violet`.
- Icon chỉ dùng `lucide-react`.
- Loading dùng skeleton; spinner chỉ dùng trong button nếu cần.
- Có dark mode đầy đủ.
- Lưới 7 ngày co giãn trên mobile; không tràn ngang.
- Toàn bộ text giao diện bằng tiếng Việt.
- Không thêm emoji hoặc màu ngoài design system.

## 8. Thiết kế API frontend và mapping

Giữ các hàm đã có nếu contract đúng:

- `apiGetMyClasses(token)`.
- `apiGetClassSchedule(token, classId, weekStart)`.

Rà soát các mapping:

- `mapClassSummary` phải map đúng `classId`, `className`, `studentName`, `status`, `teachingMode`.
- `mapOccurrence` phải gắn `classId`, tên lớp, học viên và hình thức dạy vào occurrence.
- `tutorOccurrenceTarget` phải xử lý đúng `RESCHEDULED`.
- `tutorOccurrenceStatus` phải ưu tiên exception, sau đó log, sau đó ngày/giờ hiện tại.
- Link chi tiết phải encode `weekStart` và `occurrenceKey` an toàn.

Nếu backend trả tên trường khác, cập nhật mapping tại lớp API/model thay vì rải điều kiện vào JSX.

## 9. Kiểm thử

### 9.1. Backend

- Gia sư chỉ lấy được danh sách lớp của chính mình.
- Gia sư không đọc được lịch của lớp không thuộc mình.
- Lattice trả đúng 7 ngày theo `weekStart`.
- Lịch cố định tôn trọng khoảng hiệu lực.
- Ca `CANCELLED` có trạng thái ngoại lệ đúng.
- Ca `RESCHEDULED` trả ngày/giờ mới và ngày gốc.
- Nhật ký đúng occurrence theo `class_id`, ngày và giờ bắt đầu.
- Lớp không có occurrence trả danh sách rỗng hợp lệ.
- `weekStart` sai định dạng trả lỗi validation phù hợp.
- Không có thao tác ghi dữ liệu khi gọi các API đọc.

### 9.2. Frontend

- Mở route gọi API thật, không đọc mock.
- Hiển thị đúng 7 ngày và tuần hiện tại.
- Chuyển tuần tải lại đúng dữ liệu và không giữ occurrence của tuần cũ.
- Hiển thị đúng từng trạng thái.
- Ca dời lịch chỉ xuất hiện ở ngày mới.
- Ca hủy không bị hiển thị như ca sắp dạy.
- Không có occurrence hiển thị empty state tiếng Việt.
- Lỗi toàn cục hiển thị `ErrorBox` và nút thử lại.
- Lỗi một lớp vẫn giữ các lớp tải thành công và hiển thị cảnh báo một phần.
- Link từ ô lịch và danh sách đều tới đúng `classId`, `weekStart`, `occurrence`.
- Dark mode, mobile và keyboard focus hoạt động đúng.
- Không có emoji, text tiếng Anh hoặc dữ liệu mock trong màn hình mới.

### 9.3. Tích hợp/end-to-end

1. Đăng nhập bằng tài khoản gia sư có nhiều lớp.
2. Mở `/tutor/schedule` và xác nhận dữ liệu khớp các lịch chi tiết tương ứng.
3. Kiểm tra lớp có lịch cố định, lớp có ca thử, lớp có nhật ký, lớp có ca dời và lớp có ca hủy.
4. Chuyển tuần trước/sau và quay lại tuần hiện tại.
5. Tắt hoặc làm lỗi request của một lớp để kiểm tra partial error.
6. Mở chi tiết từ nhiều occurrence khác nhau.
7. Kiểm tra quyền khi dùng `classId` của gia sư khác.
8. Kiểm tra responsive ở mobile và dark mode.

## 10. Thứ tự triển khai

Mỗi bước thực hiện với lượng thay đổi vừa phải và kiểm tra ngay sau bước đó.

1. Đối chiếu contract response thực tế của hai endpoint với các DTO backend và mapping frontend.
2. Chạy/test API danh sách lớp và API lattice tuần bằng dữ liệu có nhiều loại occurrence.
3. Sửa backend query/DTO/service nếu thiếu dữ liệu hoặc sai scope quyền.
4. Sửa `classroomApi.js` và các mapper ở một lớp tập trung.
5. Hoàn thiện `useTutorWeekSchedule` với loading, partial error, sorting và normalization.
6. Rà soát `TutorSchedule.jsx` theo design system và các trạng thái nghiệp vụ.
7. Bổ sung hoặc cập nhật unit test backend cho quyền và lattice.
8. Bổ sung frontend test cho tuần, status, partial error, empty state và navigation.
9. Chạy kiểm thử tích hợp, frontend build và backend test.
10. Chỉ đề xuất endpoint tổng hợp mới nếu kết quả đo cho thấy mô hình nhiều request không đáp ứng yêu cầu.

## 11. Tài liệu cần cập nhật

- `backend/API_DESIGN.md`: contract thực tế của endpoint lớp và lịch nếu có thay đổi.
- `my_plans/tutor_schedule_management/business_description.md`: cập nhật nếu phát hiện nghiệp vụ khác với mô tả hiện tại.
- Tài liệu kế hoạch `plan.md` sau khi design plan được duyệt và phạm vi code được chốt.

## 12. Các quyết định cần chốt trước khi code

1. Xác nhận có giữ mô hình gọi lịch từng lớp hay chuyển sang endpoint tổng hợp; mặc định giữ API hiện có vì đã có service lattice dùng chung.
2. Xác nhận lớp `CANCELLED` có bị backend loại ngay hay frontend loại sau khi nhận response; không được để hai tầng có semantics mâu thuẫn.
3. Xác nhận contract tên học viên và hình thức dạy trong `ClassSummaryResponse`/`OccurrenceResponse`; nếu thiếu thì bổ sung DTO/query, không hard-code ở frontend.
4. Xác nhận `occurrenceKey` là định danh ổn định đủ để truyền sang trang chi tiết; nếu không, chỉ truyền các trường đã được backend bảo đảm.
5. Xác nhận ngưỡng hiệu năng thực tế trước khi tạo endpoint tổng hợp mới.

## 13. Definition of Done

- Route `/tutor/schedule` không còn phụ thuộc mock data.
- Dữ liệu hiển thị đúng theo backend và quyền của gia sư.
- Lịch tổng quát nhất quán với lịch chi tiết lớp.
- Có xử lý loading, empty, lỗi toàn cục và lỗi một phần.
- Chuyển tuần và mở chi tiết hoạt động đúng.
- Có test cho các trạng thái occurrence và tình huống biên chính.
- Frontend đạt yêu cầu dark mode, mobile, tiếng Việt và không emoji.
- Backend test, frontend test/build và kiểm tra Docker liên quan đều đạt.
- Sau khi hoàn tất toàn bộ plan, dừng để người dùng tự kiểm thử và duyệt trước khi commit.
