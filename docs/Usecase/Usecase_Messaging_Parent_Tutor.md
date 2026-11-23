# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ: NHẮN TIN PHỤ HUYNH — GIA SƯ KÈM ĐỀ XUẤT LỚP HỌC

> Mã tính năng: **MSG** (Messaging + Proposal)
> Phiên bản: 2.1 (18/12/2026) — đối chiếu code tại migration V27/V29; thay thế bản 2.0 (18/11) và 1.x (luồng đơn CHAT + Lễ tân xác nhận đã bỏ)
> Changelog v2.1: form hồ sơ phụ huynh là một màn hình (thêm địa chỉ nhà bắt buộc); bổ sung trường địa chỉ học của đề xuất, đầy đủ trường form đăng tin; gia sư cũng đăng nhập Google; room APPLICATION còn ghi được khi tin `MATCHED`; chỉnh schema `chat_pii_events` (lưu `blocked_text`, duyệt nội bộ); bỏ CHECK không tồn tại của `chat_rooms`
> Phạm vi: **thay thế UC-PA-03** (Gửi yêu cầu học với gia sư chỉ định) và **UC-PA-04** (Gửi yêu cầu tìm gia sư — form khách). Lễ tân chỉ còn **1 điểm dừng**: duyệt tin đăng. Việc chốt gia sư do phụ huynh và gia sư tự thỏa thuận qua chat + đề xuất.
> Nguồn đối chiếu: `docs/project/prd.md`, `docs/project/ERD.md` (bảng `parents`, `students`, `class_requests`, `class_applications`, `classes`), `docs/Usecase/Usecase_Student_Parent.md`, `docs/Usecase/Usecase_Tutor.md`
> Kế hoạch triển khai: `MESSAGING_ROCKETCHAT_PLAN.md`

---

## 1. Bối cảnh & Mục tiêu

Trước đây khi phụ huynh chọn một gia sư, Lễ tân phải làm kênh trao đổi nhiều lần giữa hai bên (học phí, lịch, yêu cầu) rồi mới ghép lớp. Tính năng MSG cho phụ huynh và gia sư **trao đổi trực tiếp trên nền tảng**, chốt thỏa thuận bằng **Đề xuất lớp học (proposal)**; khi phụ huynh đồng ý đề xuất, **lớp học thử (`classes` `TRIAL`) được tạo ngay**, không qua bước xác nhận của Lễ tân.

Hai luồng, cả hai **bắt buộc phụ huynh đăng nhập Google** (gia sư cũng đăng nhập Google, liên kết hồ sơ `TUTOR`; hồ sơ chưa đầy đủ vẫn được tạo/ghép):

| Luồng | Đường đi | Thay thế |
|---|---|---|
| **A. Nhắn tin trực tiếp** | Phụ huynh chọn gia sư → **Nhắn tin** → room `DIRECT` (phụ huynh–gia sư) → proposal → phụ huynh đồng ý → `classes` TRIAL (**không có** `class_request_id`) | UC-PA-03 |
| **B. Đăng tin "Lớp cần gia sư"** | Phụ huynh đăng tin → **Lễ tân duyệt** → gia sư ứng tuyển (`class_applications`) → phụ huynh xem ứng viên, chọn 1 người để chat → room `APPLICATION` → proposal → phụ huynh đồng ý → `classes` TRIAL (có `class_request_id` + `proposal_id`), **tin chuyển `MATCHED` (không nhận ứng tuyển mới; room chat của ứng viên được chọn vẫn mở, mục 5.3)** | UC-PA-04 |

> **Hai room độc lập:** một phụ huynh có thể có đồng thời room `DIRECT` và room `APPLICATION` với cùng một gia sư; hai room không gộp, lịch sử và đề xuất riêng.

Mục tiêu:
1. Đưa phụ huynh và gia sư trao đổi trực tiếp trên nền tảng, **chặn thông tin liên hệ cá nhân** (SĐT, Zalo, Facebook, email...) cho đến khi phụ huynh đồng ý đề xuất.
2. Chuẩn hóa thỏa thuận bằng đề xuất: học sinh, lịch học, giá mỗi buổi, loại lớp (ngắn hạn/thông thường), lịch dạy thử.
3. Giảm tải trung tâm: Lễ tân chỉ duyệt tin đăng; khiếu nại vẫn xử lý như hiện hành.
4. Phí nhận lớp theo **loại lớp**, lấy từ bảng cấu hình phí (mục 8.4).

## 2. Vai trò

| Vai trò | Trong tính năng MSG |
|---|---|
| **Phụ huynh** (`PARENT`, chỉ đăng nhập Google, không mật khẩu) | Đăng nhập Google, điền form hồ sơ (một màn hình), đăng tin, xem ứng viên, chat, đồng ý/từ chối đề xuất |
| **Gia sư** (`TUTOR`, `ACTIVE`) | Đăng nhập Google (liên kết/tạo hồ sơ `TUTOR`), ứng tuyển, chat, tạo/rút đề xuất, nhận SĐT phụ huynh sau khi đề xuất được đồng ý |
| **Lễ tân / Admin** | Duyệt/hủy tin đăng; xem transcript read-only và log kiểm duyệt; Admin quản lý bảng cấu hình phí |
| **Kế toán** | Không tham gia MSG; phí nhận lớp vẫn xử lý ở luồng thanh toán hiện hành (mục 10) |

## 3. Luồng tổng quan

### Luồng A — Nhắn tin trực tiếp

```
Phụ huynh bấm "Nhắn tin" trên hồ sơ/card gia sư
  ▼ [0] Đăng nhập Google (bắt buộc)
  ▼ [1] Form hồ sơ 1 màn hình (lần đầu): họ tên → SĐT → mục đích → khu vực + địa chỉ
  ▼ [2] Room DIRECT (parent_id + tutor_id): chat văn bản có kiểm duyệt PII
  ▼ [3] Gia sư tạo đề xuất (PENDING)
        ├─ Phụ huynh ĐỒNG Ý → (a) mở khóa SĐT; (b) tạo/gắn học sinh;
        │                      (c) tạo classes TRIAL (proposal_id, không class_request_id)
        ├─ Phụ huynh TỪ CHỐI → gia sư có thể tạo đề xuất mới
        └─ Gia sư RÚT LẠI → CANCELLED
```

### Luồng B — Đăng tin "Lớp cần gia sư"

```
Phụ huynh bấm "Tìm gia sư" → [0] đăng nhập Google → [1] Form đăng tin
  ▼ class_requests NEW (source = POSTING) → thông báo Lễ tân
  ▼ [2] LỄ TÂN DUYỆT tại mục "Lớp cần gia sư": NEW → OPEN  |  hủy kèm lý do (CANCELLED)
  ▼ [3] Gia sư ứng tuyển → mỗi lượt là 1 class_applications
  ▼ [4] Phụ huynh vào tin của mình → xem danh sách ứng viên (hồ sơ + lời nhắn)
        └─ chọn 1 ứng viên → "Nhắn tin" → room APPLICATION (parent_id + class_application_id)
  ▼ [5] Chat → gia sư tạo đề xuất → phụ huynh ĐỒNG Ý
        └─ tạo classes TRIAL (class_request_id + proposal_id) + tin → MATCHED (không nhận ứng tuyển mới;
           room APPLICATION của ứng viên được chọn vẫn ghi được để chat tiếp — mục 5.3)
           + application được chọn → SELECTED, các ứng viên còn lại → REJECTED (có thông báo)
```

## 4. Truy cập: đăng nhập Google & Form hồ sơ

### 4.1. Đăng nhập Google
Mọi thao tác **Nhắn tin**, **Tìm gia sư/đăng tin**, **xem tin của tôi** yêu cầu phụ huynh đã đăng nhập; chưa đăng nhập thì chuyển tới màn "Đăng nhập bằng Google" rồi quay về trang ban đầu. Lần đầu: hệ thống tạo `users` role `PARENT` (không mật khẩu) + `oauth_accounts` + `parents`. Không tự gộp hồ sơ `parents` cũ theo email/SĐT: nếu phụ huynh nhập ở form hồ sơ một SĐT đã thuộc hồ sơ khác (kể cả hồ sơ cũ chưa có tài khoản), hệ thống chặn, không lộ tên chủ số và hướng dẫn liên hệ hotline để trung tâm xử lý.

> UC-PA-03 và UC-PA-04 dạng form công khai **bị loại bỏ**; API `POST /api/v1/public/class-requests` ngừng dùng.

Gia sư **cũng** đăng nhập Google (vào vai trò `TUTOR`): liên kết hoặc tạo hồ sơ `TUTOR` mới (hồ sơ chưa đầy đủ được giữ trạng thái `INCOMPLETE` cho tới khi gia sư hoàn thiện); cùng email Google không được dùng cho cả hai vai trò — hệ thống chặn conflict.

### 4.2. Form hồ sơ phụ huynh (một màn hình, lần đầu chat hoặc đăng tin)
Form **một màn hình gồm 4 nhóm trường** (không phải stepper nhiều bước); không lưu được nếu thiếu trường bắt buộc, mọi thao tác nhắn tin/đăng tin sau đó bị chặn (`CHAT_PARENT_PROFILE_INCOMPLETE`).

| Nhóm | Trường | Ghi chú |
|---|---|---|
| 1 | Họ tên phụ huynh | Prefill từ Google (bấm "Sửa" để đổi), tối thiểu 2 ký tự |
| 2 | Số điện thoại | Định dạng VN 10 số (03/05/07/08/09 hoặc +84/84). Số đã thuộc phụ huynh khác → chặn, không lộ tên chủ số |
| 3 | Mục đích | `PHU_THONG`, `THI_CHUAN`, `GIAO_TIEP`, `THI_HOC_KY` |
| 4 | Khu vực + địa chỉ | Tỉnh/TP → Quận/Huyện; **địa chỉ nhà bắt buộc (5–500 ký tự)** — dùng khi học tại nhà; gia sư chỉ thấy địa chỉ trong đề xuất (mục 8.1), không phải SĐT |

Form **không chọn học sinh**: học sinh được khai trong đề xuất (mục 8.1). Gia sư thấy ngay mục đích + khu vực của phụ huynh; **không** thấy SĐT (mục 9).

## 5. Luồng B — Đăng tin

### 5.1. Form đăng tin
Form **không có trường họ tên/SĐT** (lấy từ hồ sơ phụ huynh, mục 4.2). Trường: mục đích, tỉnh/quận (trống thì prefill từ hồ sơ phụ huynh), số buổi/tuần gợi ý (1–5, tùy chọn), mức phí tham khảo (tùy chọn), **hình thức học** `ONLINE`/`AT_HOME` (tùy chọn), **địa chỉ học** (≤ 255 ký tự, tùy chọn), **yêu cầu giới tính** `MALE`/`FEMALE`/`ANY`, **yêu cầu gia sư** `STUDENT`/`TEACHER`/`ANY`, **loại lớp** `SHORT_TERM`/`REGULAR` (tùy chọn), **thời gian có thể học** (thứ trong tuần + khung giờ, ≤ 255 ký tự, tùy chọn), ghi chú (≤ 1000 ký tự, có thể nêu thông tin con; ghi chú không được chứa SĐT/email/link — bị chặn PII như tin nhắn). Tin **không gắn học sinh cấu trúc**.

Hậu điều kiện: `class_requests` `NEW`, `source = POSTING`, `student_id = NULL`, `created_by = user_id phụ huynh`. Giới hạn chống spam: mỗi phụ huynh tối đa **1 tin `NEW`/`OPEN`** cùng lúc.

### 5.2. Lễ tân duyệt
Mục **"Lớp cần gia sư"** của Lễ tân: danh sách tin `NEW`. **Duyệt** → `OPEN` (gia sư thấy và ứng tuyển, UC-T02). **Hủy** → `CANCELLED` kèm lý do; phụ huynh nhận thông báo và được tạo tin mới.

### 5.3. Trang "Tin của tôi" (phụ huynh)

| Trạng thái | Ý nghĩa | Phụ huynh thấy |
|---|---|---|
| Chờ duyệt (`NEW`) | Lễ tân chưa duyệt | "Hủy tin" |
| Đang nhận ứng tuyển (`OPEN`) | Gia sư xem/ứng tuyển | "Xem ứng viên" (danh sách `class_applications` + hồ sơ gia sư + lời nhắn), "Nhắn tin" từng ứng viên, "Đóng tin" |
| Đã có lớp (`MATCHED`) | Đã tạo lớp từ tin này | Link tới lớp TRIAL; tin **đã đóng, không nhận ứng tuyển mới** nhưng nút "Xem ứng viên" vẫn hiện; room `APPLICATION` của ứng viên được chọn **vẫn ghi được** để phụ huynh và gia sư tiếp tục chat (tin `OPEN`/`REMATCH`/`MATCHED` đều cho chat; chỉ `CANCELLED`, gia sư `INACTIVE` hay room bị đóng mới khóa) |
| Đang ghép lại (`REMATCH`) | Dạy thử thất bại, mở lại theo UC-PA-05 | Như `OPEN` (gia sư cũ bị loại) |
| Đã hủy (`CANCELLED`) | Phụ huynh/Lễ tân hủy | "Tạo tin mới" |

Khi có gia sư ứng tuyển mới, phụ huynh nhận thông báo in-app.

## 6. Tiền điều kiện mở chat

- Gia sư `profile_status = ACTIVE` (ẩn nút "Nhắn tin" nếu không).
- Phụ huynh đã đăng nhập Google và hoàn tất form hồ sơ (mục 4.2).
- Room `APPLICATION`: chỉ mở được khi tin thuộc chính phụ huynh, tin đang `OPEN`/`REMATCH` và application ở trạng thái `APPLIED`.

## 7. Chính sách phòng chat (bắt buộc)

### 7.1. Chặn thông tin liên hệ (PII)
Quét mọi tin trước khi gửi: số điện thoại VN (kể cả biến thể dấu cách/gạch nối/+84), email, link/handle mạng xã hội (`zalo.me/...`, `fb.com/...`...). Chặn theo **thành phần** (nhắc từ "zalo" nhưng không có số/link thì không chặn). Tin bị chặn: **không gửi vào Rocket.Chat, không nằm trong lịch sử chat**; người gửi thấy phần vi phạm tô đỏ để sửa; ghi `chat_pii_events` loại `PII_BLOCKED` — nguyên văn tin vi phạm được lưu trong cột `blocked_text` (PostgreSQL) để Lễ tân/Admin xem lại khi kiểm duyệt (mục 13), không tự công khai lại tin. Ngoài tin nhắn, PII cũng bị chặn ở: **ghi chú tin đăng** (mục 5.1, lỗi 422 "Ghi chú không được chứa thông tin liên hệ") và **các trường văn bản tự do của đề xuất** (ghi chú, họ tên/trường học/mục tiêu học sinh, địa chỉ học). Cơ chế hai lớp: kiểm tra ở backend (trả loại + vị trí vi phạm) và Rocket.Chat App chặn khi gọi thẳng API (xem kế hoạch về giới hạn license).

### 7.2. Giới hạn khác
- Tối đa 2000 ký tự/tin; không đính kèm file; 10 tin/phút/người.
- Mỗi room tối đa **1 đề xuất `PENDING` cho mỗi học sinh** (một room có thể chứa đề xuất PENDING cho 2 học sinh khác nhau).

## 8. Đề xuất lớp học (Proposal)

### 8.1. Người tạo & nội dung
- **Chỉ gia sư** tạo (sau khi room có ít nhất 1 tin nhắn hai chiều). Đề xuất thuộc **room**; học sinh là nội dung của đề xuất.

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| Học sinh | ✔ | **Con có sẵn** (chọn trong `students` của phụ huynh → `student_id`) hoặc **học sinh mới** (họ tên bắt buộc, khối lớp/trường/mục tiêu tùy chọn → `student_name`, `student_grade`, `student_school`, `student_learning_goal`) |
| `class_type` | ✔ | `SHORT_TERM` (1 tháng) hoặc `REGULAR` (không giới hạn) — quyết định tỷ lệ phí (mục 8.4) |
| `price_per_session` | ✔ | VND/buổi; gợi ý từ `tutor_prices` |
| `schedule_days` | ✔ | Các thứ trong tuần (1–7); số buổi/tuần = số thứ chọn |
| `schedule_time_from/to` | ✔ | Giờ bắt đầu – kết thúc mỗi buổi |
| `trial_date`, `trial_time_from/to` | ✔ | **Buổi dạy thử** do gia sư đặt trong đề xuất; buổi thử tách riêng khỏi lịch cố định |
| `class_mode` | ✔ | `AT_HOME` / `ONLINE` |
| `learning_address` (địa chỉ học) | ✔ khi `AT_HOME` | Địa chỉ học tại nhà (≥ 5 ký tự, ≤ 500); không có với lớp `ONLINE`. Gia sư tự điền trong form đề xuất; phụ huynh đã khai địa chỉ nhà ở form hồ sơ (mục 4.2) |
| `note` | — | Ghi chú |

### 8.2. Tài khoản học sinh và việc học nhiều lớp
Mỗi học sinh là **một tài khoản `users` (role `STUDENT`) + dòng `students`** gắn với một phụ huynh (`students.parent_id`); `students.id = users.id`. **Một học sinh có nhiều lớp** (`classes.student_id` không duy nhất): hồ sơ học sinh tạo **một lần**, các lớp sau dùng lại.

- **Con có sẵn:** đề xuất mang `student_id`; không tạo tài khoản.
- **Học sinh mới:** khi phụ huynh đồng ý, hệ thống dùng lại logic `ensureStudent` hiện hành: tìm học sinh của phụ huynh theo họ tên (không phân biệt hoa thường); **có thì dùng lại, chưa có thì tạo** `users` (username `hs_<SĐT phụ huynh>[_n]`, mật khẩu mặc định, `must_change_password = true`) và `students`. Mật khẩu khởi tạo hiển thị cho **phụ huynh** một lần ở màn đồng ý (thay cho việc Lễ tân bàn giao).
- Chặn: học sinh đã có lớp `TRIAL`/`ACTIVE` **với cùng gia sư**; học sinh được học với gia sư khác (nhiều lớp) nhưng **trùng khung giờ** với lớp đang có thì cảnh báo trên thẻ đề xuất.

### 8.3. State machine
```
PENDING ──(phụ huynh Đồng ý)──► ACCEPTED
PENDING ──(phụ huynh Từ chối, lý do ≤ 500)──► REJECTED
PENDING ──(gia sư Rút lại, lý do ≥ 5 ký tự)──► CANCELLED
PENDING ──(trùng lịch gia sư khi đồng ý / quá hạn 7 ngày / gia sư INACTIVE)──► EXPIRED
```
Thẻ đề xuất cố định, không chỉnh sửa sau khi gửi (muốn đổi thì rút lại và tạo mới, số phiên bản #N). Thẻ ghi nổi bật **học sinh**, loại lớp, giá, lịch, lịch dạy thử.

### 8.4. Bảng cấu hình phí
Bảng `platform_fee_policies` lưu tỷ lệ phí nhận lớp theo loại lớp:

| `class_type` | Tỷ lệ |
|---|---|
| `SHORT_TERM` (1 tháng) | **25%** |
| `REGULAR` (không giới hạn) | **35%** |

Admin quản lý (thêm dòng mới có `effective_from`, không sửa dòng cũ để giữ lịch sử). Tại thời điểm **gia sư tạo đề xuất**, tỷ lệ đang hiệu lực được **chụp vào đề xuất** (`fee_percentage`) và hiển thị cho gia sư; khi lớp được tạo, giá trị này chuyển sang `classes.fee_percentage` và phí nháp (`payments.fee_percentage`).

### 8.5. Sự kiện khi phụ huynh bấm "Đồng ý"
Chạy trong **một transaction**, khóa dòng đề xuất (và dòng `class_requests` nếu room `APPLICATION`):
1. Kiểm tra: gia sư còn `ACTIVE`; lịch gia sư (ca thử + lịch cố định) không trùng lớp khác — trùng thì đề xuất `EXPIRED` kèm thông báo; học sinh không vi phạm mục 8.2; với room `APPLICATION`, tin phải còn `OPEN`/`REMATCH` (nếu đã `MATCHED` → từ chối, thông báo "tin đã đóng").
2. Đề xuất → `ACCEPTED`, ghi `decided_at`.
3. Xác định học sinh (mục 8.2).
4. Tạo `classes` `TRIAL`: `tutor_id`, `student_id`, `proposal_id`, `class_request_id` (room `APPLICATION`: lấy từ application; room `DIRECT`: NULL), `class_type`, `fee_percentage`, `price_per_session`, `teaching_mode`, `sessions_per_week` (= số thứ trong tuần), `trial_date`/`trial_start_time`/`trial_end_time` (dùng các cột ca thử sẵn có của `classes`; link phòng học/địa điểm ca thử do gia sư bổ sung ở UC-T08). Lịch cố định trong đề xuất được điền sẵn khi gia sư chốt lịch (UC-T09). `end_date` của lớp `SHORT_TERM` được tính khi lớp chuyển `ACTIVE` (+1 tháng).
5. Tạo phí nháp (`payments` `NEW`) với tỷ lệ từ đề xuất.
6. Room `APPLICATION`: `class_requests` → `MATCHED`; application được chọn → `SELECTED`, các application `APPLIED` còn lại → `REJECTED` + thông báo.
7. Mở khóa SĐT phụ huynh cho gia sư (mục 9), ghi `chat_pii_events` `PHONE_UNLOCKED`.
8. Ghi audit; đưa tin hệ thống vào chat qua outbox. Thông báo gia sư (lớp TRIAL mới, SĐT đã mở) và phụ huynh.

Double-click/đồng ý song song chỉ tạo **một** lớp (khóa dòng + idempotency); hai đề xuất từ hai ứng viên khác nhau của cùng một tin: đề xuất thứ hai bị từ chối vì tin đã `MATCHED`.

### 8.6. Từ chối / Rút lại
Từ chối: đề xuất `REJECTED` kèm lý do, SĐT vẫn ẩn, chat tiếp tục. Gia sư rút lại: chỉ khi `PENDING`.

## 9. Cổng SĐT (Phone Gate)
- Trước khi có đề xuất `ACCEPTED` trong room: gia sư chỉ thấy mục đích + khu vực + danh sách con có sẵn của phụ huynh; **SĐT không có trong payload** (enforce ở backend, không lưu ở Rocket.Chat).
- Sau `ACCEPTED`: hiện đầy đủ SĐT, giữ mở trong room đó. Ghi audit mở khóa.
- Phụ huynh không thấy SĐT gia sư trong chat.

## 10. Tích hợp với luồng lớp học hiện có

| Thời điểm | Hành động | Bảng |
|---|---|---|
| Đăng nhập Google lần đầu | Tạo `users` PARENT + `parents` | `users`, `oauth_accounts`, `parents` |
| Form hồ sơ hoàn tất | Cập nhật SĐT, họ tên, mục đích, khu vực, địa chỉ | `parents` |
| Đăng tin | `class_requests` NEW, source POSTING | `class_requests` |
| Lễ tân duyệt | NEW → OPEN / CANCELLED | `class_requests` |
| Gia sư ứng tuyển | Tạo lượt ứng tuyển | `class_applications` |
| Phụ huynh mở chat | Tạo room APPLICATION hoặc DIRECT | `chat_rooms` |
| Gia sư tạo đề xuất | Chụp `fee_percentage` từ bảng phí | `proposal_messages`, `platform_fee_policies` |
| Phụ huynh đồng ý | Mục 8.5 | `proposal_messages`, `students`, `users`, `classes`, `payments`, `class_requests`, `class_applications`, `chat_pii_events` |
| Dạy thử (UC-T08) | Gia sư dạy buổi thử đã đặt trong đề xuất | `classes`, `lessons` |
| Chốt lịch (UC-T09) | `TRIAL → ACTIVE`, sinh `class_schedules`, kích hoạt phí nháp theo `FeeCalculator` với tỷ lệ của lớp | `classes`, `class_schedules`, `payments` |
| Lớp `SHORT_TERM` hết 1 tháng | Job đặt `classes` → `COMPLETED` | `classes` |
| Dạy thử thất bại | Lớp từ tin POSTING: `class_requests` → `REMATCH` hoặc `CANCELLED` (UC-PA-05 hiện hành). Lớp từ room DIRECT (không có đơn): lớp → `CANCELLED`, phụ huynh nhắn gia sư khác hoặc đăng tin | `classes`, `class_requests` |

> **`class_requests.requested_tutor_id` bị bỏ.** Gia sư của lớp nằm ở `classes.tutor_id`; gia sư ứng tuyển nằm ở `class_applications`. Lễ tân không còn thao tác "chỉ định gia sư", "xác nhận đơn chỉ đích danh". Các thao tác thay mặt phụ huynh chọn ứng viên (ngoại lệ vận hành) vẫn nằm ở luồng staff hiện hành, tạo lớp có `class_request_id` nhưng không có đề xuất.

## 11. Ngoại lệ & Ranh giới

| # | Tình huống | Xử lý |
|---|---|---|
| E-1 | Gõ SĐT/email/link liên hệ | Chặn: tin **không gửi vào chat** (không nằm ở lịch sử Rocket.Chat), người gửi thấy phần vi phạm tô đỏ; ghi `chat_pii_events` loại `PII_BLOCKED` kèm nguyên văn tin trong `blocked_text` (PostgreSQL) để trung tâm kiểm duyệt (mục 13) |
| E-2 | Đổi SĐT ở form hồ sơ khi đã có room | SĐT mới chưa ai dùng → cập nhật, giữ room; thuộc phụ huynh khác → chặn |
| E-3 | Gia sư `INACTIVE` khi room có đề xuất PENDING | Room khóa (chỉ đọc); đề xuất `EXPIRED` sau 7 ngày; gia sư `ACTIVE` lại thì mở lại |
| E-4 | Học sinh học nhiều lớp | Cho phép với gia sư khác nhau; chặn trùng (học sinh, gia sư) còn `TRIAL`/`ACTIVE`; trùng khung giờ → cảnh báo mềm |
| E-5 | Gia sư đã có lớp trùng giờ khi phụ huynh đồng ý | Đề xuất `EXPIRED`, gia sư tạo đề xuất mới |
| E-6 | Hẹn gặp ngoài hệ thống | Không phát hiện tự động; Lễ tân xem transcript + log khi có khiếu nại |
| E-7 | Tin chặn nhầm | Lễ tân/Admin xem log (kèm nguyên văn tin trong `blocked_text`) và đánh dấu đã xem xét nội bộ (kèm ghi chú); tin **không bao giờ** tự công khai lại chat, các bên phải nhắn lại nội dung hợp lệ |
| E-8 | Tin POSTING bị Lễ tân hủy | `CANCELLED` kèm lý do; room `APPLICATION` của tin chuyển chỉ đọc; phụ huynh tạo tin mới |
| E-9 | Tin không có ứng viên sau 14 ngày | Nhắc phụ huynh điều chỉnh; tin vẫn `OPEN` |
| E-10 | Phụ huynh muốn đổi gia sư sau khi đã có lớp TRIAL | Qua quy trình khiếu nại/hủy lớp hiện hành của Lễ tân; ngoài phạm vi MVP có nút "Đổi gia sư" |
| E-11 | Nhiều đề xuất của nhiều ứng viên cho cùng tin | Đề xuất đầu tiên được đồng ý đóng tin; các đề xuất PENDING còn lại tự `EXPIRED` kèm thông báo |

## 12. Quan sát & kiểm soát của trung tâm
- Lễ tân/Admin: màn "Tin nhắn & tin đăng" gồm: tin đăng chờ duyệt/đang mở; phòng chat (lọc loại phòng, có đề xuất chờ); log kiểm duyệt; **lớp dạy thử tạo từ chat** (Lễ tân xác nhận chính thức hoặc hủy sau dạy thử với lớp nhắn tin trực tiếp); bảng phí (Admin sửa).
- "Xem hội thoại" read-only: toàn bộ tin nhắn + thẻ đề xuất + log kiểm duyệt + log mở khóa SĐT.
- Admin: quản lý bảng cấu hình phí.
- Audit log cho: duyệt/hủy tin, mở khóa SĐT, tạo lớp từ đề xuất, đổi cấu hình phí, duyệt lại tin bị chặn.

## 13. Mô hình dữ liệu

### Bảng mới
- **`oauth_accounts`** — đã triển khai ở MSG-02.
- **`chat_outbox`**: hàng đợi tin hệ thống (đề xuất được đồng ý/từ chối/rút/hết hạn) gửi sang Rocket.Chat; Rocket.Chat tạm lỗi không làm hỏng nghiệp vụ.
- **`chat_rooms`**: `id`, `room_type` (`DIRECT`/`APPLICATION`), `parent_id`, `tutor_id`, `class_application_id` (NULL với DIRECT), `rocket_room_id`, `status` (`ACTIVE`/`CLOSED`), timestamps. Ràng buộc: `UNIQUE(class_application_id)`; unique một phần `(parent_id, tutor_id)` khi `room_type = 'DIRECT'`. Khi application bị xóa, `class_application_id` bị `SET NULL` nên không có ràng buộc ép khớp chiều `room_type`.
- **`proposal_messages`**: `id`, `room_id`, `tutor_id`, `version`, `student_id` / `student_name` / `student_grade` / `student_school` / `student_learning_goal`, `class_type`, `fee_percentage` (snapshot), `price_per_session`, `schedule_days`, `schedule_time_from/to`, `trial_date`, `trial_time_from/to`, `class_mode`, `learning_address` (địa chỉ học khi `class_mode = AT_HOME`, NULL khi `ONLINE`; thêm ở V29), `note`, `status`, `rejection_reason`, `decided_at`, `rocket_message_id`. `UNIQUE(room_id, version)`; CHECK `student_id` hoặc `student_name` có giá trị; unique một phần cho đề xuất `PENDING` theo học sinh.
- **`platform_fee_policies`**: `id`, `class_type`, `fee_percentage`, `effective_from`, `active`, `created_by`, `created_at`. Seed `SHORT_TERM = 25`, `REGULAR = 35`.
- **`chat_pii_events`**: `id`, `room_id`, `user_id` (người liên quan, NULL với sự kiện do hệ thống), `type` (`PII_BLOCKED`/`PHONE_UNLOCKED`/`REVIEW_REINSTATED`), `detail` (JSONB), `blocked_text` (nguyên văn tin vi phạm, chỉ `PII_BLOCKED`), `reviewed_by`/`reviewed_at`/`review_note` (đánh dấu xem xét nội bộ cho E-7), `created_at`. Tin thường **không** lưu PostgreSQL; `blocked_text` là ngoại lệ có chủ đích — chỉ để trung tâm kiểm duyệt, không gửi lại chat.
- **`rocket_chat_accounts`**: ánh xạ `users` ↔ tài khoản Rocket.Chat.
- Tin nhắn thường **không** lưu ở PostgreSQL — nằm ở Rocket.Chat/MongoDB. Mỗi phòng là một **private group** Rocket.Chat gồm phụ huynh, gia sư và tài khoản hệ thống (gửi tin hệ thống, đọc transcript cho Lễ tân). PostgreSQL (`chat_rooms`) là nguồn chuẩn cho ánh xạ phụ huynh/gia sư/application; thẻ đề xuất nối với tin Rocket.Chat qua `proposal_messages.rocket_message_id` (Rocket.Chat mặc định tắt `customFields`). Trình duyệt chỉ gọi backend; realtime đi qua kênh SSE của backend, không cấp token Rocket.Chat cho trình duyệt.

### Thay đổi bảng có sẵn
| Bảng | Thay đổi |
|---|---|
| `class_requests` | **Xóa `requested_tutor_id`**; thêm `source` (`POSTING`/`STAFF`), `purpose`, `province`, `district`, `no_applicant_reminded_at`; đơn `NEW` đang chỉ định gia sư được chuyển `CANCELLED` khi migrate |
| `classes` | Đã có sẵn `trial_*`, `sessions_per_week` (dùng lại). `class_request_id` → **nullable**; thêm `proposal_id` (FK, UNIQUE); CHECK `class_request_id IS NOT NULL OR proposal_id IS NOT NULL`; thêm `class_type`, `fee_percentage`, `end_date`; chỉnh `uq_classes_one_current_per_request` cho phù hợp |
| `parents` | Thêm `purpose`, `province`, `district` (V27). Cột `address` đã có từ trước; từ V29 trở thành **bắt buộc** trước khi nhắn tin/đăng tin (mục 4.2) |
| `class_applications` | Giữ nguyên; `status` dùng `SELECTED`/`REJECTED` khi lớp được tạo |

## 14. Giao diện (theo `frontend/AGENTS.md`)
- Form hồ sơ phụ huynh: một màn hình, 4 nhóm (họ tên, SĐT, mục đích, khu vực + địa chỉ nhà bắt buộc), không chọn con; không phải stepper.
- Form đăng tin: mục đích/khu vực (prefill từ hồ sơ), số buổi/tuần, phí tham khảo, hình thức, địa chỉ học, yêu cầu giới tính/gia sư, loại lớp, thời gian có thể học, ghi chú.
- Form đề xuất: mục "Học sinh" (con có sẵn / thêm mới), loại lớp (hiện tỷ lệ phí), giá, thứ trong tuần + giờ, **buổi dạy thử**, hình thức, **địa chỉ học (bắt buộc khi học tại nhà)**, ghi chú.
- Thẻ đề xuất: đầu thẻ là học sinh (nổi bật), huy hiệu trạng thái (PENDING amber, ACCEPTED emerald, REJECTED/CANCELLED/EXPIRED rose), nút "Đồng ý"/"Từ chối".
- Trang "Tin của tôi" của phụ huynh: card từng tin, danh sách ứng viên, nút nhắn tin theo từng ứng viên.
- Tin bị chặn: phần vi phạm tô rose nhạt; tin hệ thống `text-xs` căn giữa.
- Light/dark mode và mobile theo checklist AGENTS.md.

## 15. Ghi chú phạm vi (MVP)
1. Chưa có video call, đính kèm file; tài liệu đi qua kênh lớp học (UC-ST-07).
2. Thông báo cho phụ huynh: in-app, không email/SMS.
3. Nút "Đổi gia sư" sau khi có lớp: ngoài phạm vi.
4. Học sinh mới có thể thiếu `grade` — các tính năng phụ thuộc cần xử lý NULL; gia sư được nhắc bổ sung ở UC-T08.
5. Mật khẩu khởi tạo của học sinh mới do phụ huynh nhận ở màn đồng ý; học sinh bắt buộc đổi ở lần đăng nhập đầu.
