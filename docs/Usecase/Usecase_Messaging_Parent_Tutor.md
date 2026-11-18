# TÀI LIỆU ĐẶC TẢ NGHIỆP VỤ: NHẮN TIN PHỤ HUYNH — GIA SƯ KÈM ĐỀ XUẤT LỚP HỌC

> Mã tính năng: **MSG** (Messaging + Proposal)
> Phạm vi: **thay thế UC-PA-03** (Gửi yêu cầu học với gia sư chỉ định) và **UC-PA-04** (Gửi yêu cầu tìm gia sư — form khách) ; không thay thế luồng ghép lớp của Lễ tân (UC-REC) nhưng giảm thao tác của Lễ tân xuống **2 điểm dừng**: duyệt đăng tin và xác nhận cuối
> Nguồn đối chiếu: `docs/project/prd.md` (UJ-1, UJ-2), `docs/project/ERD.md` (bảng `parents`, `class_requests`, `class_applications`, `classes`), `docs/Usecase/Usecase_Student_Parent.md` (UC-PA-01/02/03/04), `docs/Usecase/Usecase_Tutor.md` (UC-T02, UC-T08, UC-T09)

---

## 1. Bối cảnh & Mục tiêu

Trong thiết kế hiện tại, khi phụ huynh chọn một gia sư, trung tâm (Lễ tân/Admin) phải đứng giữa, làm kênh trao đổi thông tin **nhiều lần** giữa phụ huynh và gia sư (thông tin học phí, lịch học, yêu cầu...) trước khi hai bên thống nhất và lớp được tạo. Điều này tạo tải vận hành lớn cho trung tâm.

**Tính năng MSG thay thế hoàn toàn UC-PA-03** (form "Đăng ký" gia sư chỉ định) **và UC-PA-04** (form công khai "Tìm gia sư"), thay bằng 2 luồng có đăng nhập Google (mục 4.1). Trong cả 2 luồng, **học sinh không được chọn ở wizard hay form đăng tin** — chiều "cho con nào" được gia sư khai **trong đề xuất** (chọn con có sẵn của phụ huynh, hoặc ghi họ tên con mới; mục 8.1) và do lễ tân xác định hồ sơ học sinh cuối cùng khi xác nhận đơn (mục 10).

| Luồng | Đường đi | Thay thế |
|---|---|---|
| **A. Chỉ đích danh** ("Nhắn tin") | Phụ huynh thấy gia sư ưng → **Nhắn tin** → Google login → wizard → chat + đề xuất với **đúng gia sư đó** → đồng ý đề xuất → **đơn CHAT** → lễ tân xác nhận 1 lần → `classes` TRIAL | **UC-PA-03** |
| **B. Đăng tin** ("Tìm gia sư") | Phụ huynh chưa chọn được gia sư → **Đăng tin** (Google login → form đăng tin) → **Lễ tân duyệt** → đăng tin ở trạng thái "Đã đăng" → **gia sư ứng tuyển** (bảng tụ họp ứng viên, giữ mở) → phụ huynh nhắn tin với ứng viên + đồng ý **1 đề xuất** → hệ thống **tạo đơn CHAT** (đăng tin gốc **vẫn giữ OPEN**, không đóng, không TERMINATED) → **Lễ tân xác nhận 1 lần** | **UC-PA-04** |

Cả 2 luồng **hội tụ** ở bước cuối, **giống hệt nhau**: phụ huynh Đồng ý 1 đề xuất (card ghi rõ học sinh) → hệ thống tạo `class_requests` nguồn **CHAT** có `requested_tutor_id` = gia sư đang chat và học sinh của đề xuất (con có sẵn: `student_id` thật; con mới: `student_id = NULL`, họ tên học sinh nằm ở `proposal_messages.student_name`, lễ tân xác định/gán `student_id` khi xác nhận — mục 10) → Lễ tân xác nhận (1 thao tác, kèm xác định học sinh — mục 10) → `classes` TRIAL → gia sư tiếp UC-T08/T09 (ca thử + lịch cố định đã sẵn trong đề xuất). **Đăng tin (bảng POSTING) là lớp "khám phá", độc lập với việc chốt**: khi phụ huynh chốt qua chat, bảng POSTING **không đổi trạng thái** (giữ `OPEN`), các ứng tuyển của gia sư khác **không bị TERMINATED** — bảng chỉ đóng khi phụ huynh hoặc Lễ tân tự đóng (CANCELLED), đúng như một "bài đăng tìm lớp".

> **Vấn đề gốc đã gỡ tận rễ:** trước đây 1 room gắn định tuyến "đề xuất → ứng tuyển/đơn", nên "1 phụ huynh nhiều con, nhiều đăng tin" va chạm (không biết đề xuất cho con nào / đơn nào). Nay **học sinh gắn ở tầng đề xuất, không ở tầng room** (`chat_rooms` key `(parent, tutor)`, `proposal_messages` mang học sinh — con có sẵn qua `student_id` hoặc con mới qua họ tên, mục 8/13). Mỗi đề xuất tự khai học sinh; phụ huynh bấm Đồng ý trên chính thẻ đề xuất (card ghi rõ học sinh) — bước đó là checkpoint xác thực học sinh. Không còn cần wizard chọn con trước khi mở chat, cũng không cần cột gắn ứng tuyển làm định tuyến.

**Vì sao vẫn qua `class_requests` (không tạo thẳng lớp)?** Đơn là "hợp đồng khung" có mã riêng, cho phép: (1) lễ tân giữ 1 điểm kiểm soát duy nhất trước khi lớp tồn tại (quy tắc nền tảng: vận hành có kiểm soát, có audit); (2) nếu dạy thử thất bại, đơn gốc vẫn còn để **ghép lại (REMATCH)** cho cả 2 luồng — đúng quy trình UC-PA-05/UC-T09 hiện hành; (3) khiếu nại/hủy lớp có đơn gốc làm căn cứ (R-REFUND gắn `class_id`, khiếu nại 7 ngày đầu). Tạo thẳng `classes` sẽ mất cả 3 thứ trên.

Mục tiêu của tính năng MSG:

1. **Đưa phụ huynh và gia sư trao đổi trực tiếp** trên nền tảng qua phòng chat, với chính sách kiểm soát để không lộ thông tin liên hệ cá nhân (SĐT, Zalo, Facebook, email...).
2. **Chuẩn hóa việc chốt thỏa thuận** bằng "Đề xuất lớp học" mà gia sư tạo trong phòng chat: số buổi học, lịch học thử, lịch học, học phí 1 buổi. Phụ huynh Đồng ý / Từ chối trong chat.
3. **Giảm tải trung tâm**: trung tâm chỉ thao tác **ở điểm dừng cố định** (duyệt đăng tin, xác nhận sau khi chốt) thay vì nhiều vòng trao đổi; các khiếu nại vẫn xử lý tại quầy như trước.
4. **Bảo vệ dữ liệu cá nhân**: gia sư chỉ nhìn thấy SĐT của phụ huynh (được nhập ở wizard) **sau khi** phụ huynh đồng ý đề xuất. Trước đó, mọi thông tin liên hệ bị hệ thống chặn.

## 2. Vai trò

| Vai trò | Trong tính năng MSG |
|---|---|
| **Phụ huynh** (đăng nhập bằng Google Sign-In; **không** có tài khoản mật khẩu riêng trong hệ thống) | Đăng nhập Google, mở wizard (4 bước, không chọn con), nhắn tin, xem & phản hồi đề xuất (mỗi đề xuất do gia sư khai học sinh — mục 8.1) |
| **Gia sư** (`TUTOR`, `profile_status = ACTIVE`) | Nhắn tin, tạo/chỉnh đề xuất (khai học sinh: chọn con có sẵn của phụ huynh hoặc ghi họ tên con mới — mục 8.1.1), nhận SĐT phụ huynh sau khi đề xuất được đồng ý, bổ sung `grade_level` của học sinh mới (nudge, UC-T08) |
| **Lễ tân / Admin** (`RECEPTIONIST`/`ADMIN`) | Luồng B: duyệt đăng tin + xác nhận sau khi phụ huynh chốt gia sư (kèm xác định học sinh: verify con có sẵn / tạo hồ sơ con mới với grade NULL / gán hồ sơ có sẵn nếu trùng — mục 10). Luồng A: xác nhận đơn CHAT (1 thao tác + xác định học sinh). Cả 2 luồng: quan sát (read-only) phòng chat, can thiệp khiếu nại/xung đột |
| **Kế toán** | Không tham gia tính năng MSG |

## 3. Luồng tổng quan (2 luồng, hội tụ về Đề xuất + Xác nhận)

### Luồng A — Chỉ đích danh (thay thế UC-PA-03)

```
Phụ huynh (gốc/tìm kiếm gia sư)
   │  bấm "Nhắn tin" trên card/hồ sơ gia sư
   ▼
[0] Đăng nhập Google (bắt buộc; chưa đăng nhập → màn hình đăng nhập)
   │  └─ Lần đầu: tạo tài khoản phụ huynh, liên kết tài khoản Google
   ▼
[1] Wizard truy cập (4 bước, chỉ khi chưa có phòng chat với gia sư đó)
   │  └─ Họ tên prefill từ hồ sơ Google; SĐT tra `parents` (trùng số khác người → chặn)
   │  └─ Không chọn con: chiều "cho con nào" nằm ở đề xuất (mục 8.1)
   ▼
[2] Phòng chat (1 phòng / cặp parents.id + tutor.id, mục 13)
   │   ├── Tin nhắn văn bản, bị kiểm duyệt PII (mục 7)
   │   └── Tin "Đề xuất" do GIA SƯ tạo (mục 8) — mỗi đề xuất khai học sinh
   │       (chọn con có sẵn của phụ huynh, hoặc ghi họ tên con mới)
   ▼
[3] Đề xuất PENDING ──► Phụ huynh Đồng ý / Từ chối
   │
   ├── ĐỒNG Ý  ──► (a) Gia sư thấy SĐT phụ huynh (mục 9)
   │              (b) Hệ thống tạo `class_requests` NEW có `requested_tutor_id`,
   │                  nguồn = CHAT, kèm nội dung đề xuất + học sinh được chốt (mục 10)
   │              (c) Lễ tân XÁC NHẬN 1 lần → tạo `classes` TRIAL
   │              → gia sư tiếp tục UC-T08/T09 (lịch thử đã có sẵn trong đề xuất)
   │
   └── TỪ CHỐI ──► Gia sư có thể tạo đề xuất MỚI (gợi ý điều chỉnh học phí/lịch);
                   phụ huynh có thể hỏi tiếp trong chat; không ép buộc
```

### Luồng B — Đăng tin (thay thế UC-PA-04)

```
Phụ huynh (nút "Tìm gia sư" trên trang chủ)
   │
   ▼
[0] Đăng nhập Google (bắt buộc, mục 4.1)
   │  └─ Chưa đăng nhập: Google Sign-In → tạo tài khoản PARENT lần đầu
   ▼
[1] Form "Đăng tin tìm gia sư" (mục 5.1)
   │  ├── Họ tên phụ huynh (prefill từ Google, cho sửa) + SĐT (kiểm định định dạng)
   │  ├── Mục đích (4 lựa chọn, mục 4.2 bước 3)
   │  ├── Khu vực 2 cấp (Tỉnh/TP → Quận/Huyện)
   │  └── Mô tả yêu cầu (text: thời gian mong muốn, số buổi/tuần gợi ý, mức phí tham khảo,
   │      có thể nêu con trong mô tả — không bắt buộc; con được khai chính thức ở đề xuất)
   ▼
[2] Hệ thống tạo `class_requests` NEW, nguồn = POSTING, chưa có gia sư chỉ định
   │  → Thông báo Lễ tân. Phụ huynh thấy mã tin + trạng thái trên tab "Đăng tin của tôi"
   ▼
[3] LỄ TÂN DUYỆT (điểm dừng 1)
   │  ├── DUYỆT: đơn chuyển "Đã đăng" (OPEN) cho gia sư ứng tuyển (UC-T02 hiện hành);
   │  │      Lễ tân có thể bổ sung/xuất chi tiết (thay thế bước "gọi tư vấn" của UC-PA-04 cũ)
   │  └── TỪ CHỐI: đơn CANCELLED kèm lý do, phụ huynh nhận thông báo, được tạo tin mới
   ▼
[4] GIA SƯ ỨNG TUYỂN (UC-T02: xem đơn OPEN, ứng tuyển kèm lời nhắn)
   ▼
[5] PHỤ HUYNH CHỐT GIA SƯ (trên tab "Đăng tin của tôi", mục 5.2)
   │  └─ Xem danh sách gia sư đã ứng tuyển (hồ sơ + lời nhắn ứng tuyển)
   │     Mỗi ứng viên có nút "Nhắn tin" → mở phòng chat với gia sư đó
   │     (wizard mục 4.2 nếu lần đầu với gia sư đó; chat + đề xuất như Luồng A —
   │     gia sư khai học sinh trong đề xuất, không phải ở tin)
   │  └─ Đồng ý MỘT đề xuất (mục 8) → hệ thống tạo đơn CHAT (mục 8.3):
   │     `requested_tutor_id` = gia sư được chọn, học sinh của đề xuất
   │     (con có sẵn: `student_id`; con mới: họ tên, lễ tân gán hồ sơ khi xác nhận).
   │     **Đăng tin gốc giữ `OPEN`, không TERMINATED** — bảng vẫn mở cho gia sư
   │     khác tiếp tục ứng tuyển (đóng tin chỉ khi phụ huynh/Lễ tân tự hủy).
   ▼
[6] LỄ TÂN XÁC NHẬN (điểm dừng 2, thao tác 1 lần + xác định học sinh)
   │  └─ Xác định học sinh (mục 10: con có sẵn → verify; con mới → tạo hồ sơ,
   │     họ tên từ đề xuất, `grade_level` NULL cho tới khi gia sư bổ sung),
   │     tạo `classes` TRIAL (mục 10)
   └► UC-T08/T09 tiếp tục như Luồng A
```

> **Điểm khác biệt so với hiện hành (UJ-1, UJ-2 trong PRD):** trước đây lễ tân là người *chọn* gia sư cho phụ huynh (sau cuộc gọi tư vấn). Nay phụ huynh tự chốt trong chat qua Đề xuất; lễ tân chỉ còn **điểm dừng cố định** (Luồng B: duyệt đăng tin; cả 2 luồng: xác nhận 1 lần sau khi phụ huynh đồng ý) — không còn vòng gọi điện trao đổi nhiều lần. Lớp vẫn được sinh ra **từ `class_requests`** nên toàn bộ quy tắc REMATCH, khiếu nại, phí nhận lớp hiện hành giữ nguyên.

## 4. Truy cập: Đăng nhập Google & Wizard

### 4.1. Đăng nhập bằng Google (bước bắt buộc, trước wizard)

**Nút "Nhắn tin"** (trên card gia sư kết quả tìm kiếm UC-PA-01 hoặc hồ sơ UC-PA-02) **và nút "Tìm gia sư" (form đăng tin, mục 5.1)** đều mở:

1. **Chưa đăng nhập** → màn hình "Đăng nhập để tiếp tục" với 1 nút duy nhất **"Đăng nhập bằng Google"** (Google Sign-In / OIDC, hiển thị avatar + email tài khoản Google). Phụ huynh **không có tài khoản mật khẩu** trong hệ thống — Google là phương thức đăng nhập duy nhất của vai trò phụ huynh.
2. **Lần đăng nhập đầu**: hệ thống tạo tài khoản `users` vai trò **`PARENT`** (không cần đặt mật khẩu), liên kết Google (bảng `oauth_accounts`, mục 13) và tạo bản ghi `parents` (kế thừa `users`, mục 13). Tên hiển thị, email, ảnh lấy từ hồ sơ Google.
3. **Đã đăng nhập** → bỏ qua bước này, mở thẳng wizard (lần đầu với gia sư đó) hoặc phòng chat (đã có phòng).

> **Lưu ý thay thế:** UC-PA-03 (form "Đăng ký" gia sư chỉ định, khách không cần tài khoản) và UC-PA-04 (form công khai "Tìm gia sư") **bị loại bỏ** — thay bằng 2 luồng A/B trên, cả 2 đều yêu cầu đăng nhập Google. Các `parents` cũ (sinh từ form công khai trước đây, không có `users`): khi phụ huynh đó đăng nhập Google và wizard bước 1 nhập đúng SĐT cũ, hệ thống **gộp hồ sơ** — gắn SĐT cũ vào tài khoản Google mới (chủ thể là Google account), không tạo phụ huynh trùng; dữ liệu `class_requests` cũ vẫn trỏ về đúng `parents` cũ.

### 4.2. Wizard truy cập (4 bước, hiện khi lần đầu vào chat với gia sư đó)

Wizard chỉ hiện **lần đầu** (chưa có phòng chat với gia sư đó); lần sau mở thẳng vào phòng chat. Wizard **không có bước chọn con** — chiều "cho con nào" được gia sư khai trong đề xuất (mục 8.1), đúng với thiết kế "học sinh gắn ở tầng đề xuất, không ở tầng room".

| Bước | Trường | Bắt buộc | Ghi chú |
|---|---|---|---|
| 1 | Số điện thoại | ✔ | Pre-fill nếu `parents` đã có SĐT (từ form UC-PA-04 hoặc lần trước), cho sửa. Kiểm định định dạng theo UC-PA-03.4.2 (10 chữ số, đầu 03/05/07/08/09 hoặc +84/84). SĐT đã thuộc về phụ huynh khác (Google account khác) → chặn với thông báo UC-PA-03.4.3 (không lộ tên chủ hiện tại, chỉ dẫn hotline) |
| 2 | Họ tên phụ huynh | ✔ | **Pre-fill từ hồ sơ Google** (tên hiển thị), cho sửa, tối thiểu 2 ký tự |
| 3 | Mục đích | ✔ | Chọn 1: `PHU_THONG` (Củng cố học phổ thông), `THI_CHUAN` (Luyện thi chuẩn: IELTS/TOEIC/VSTEP...), `GIAO_TIEP` (Giao tiếp), `THI_HOC_KY` (Luyện thi học kỳ) |
| 4 | Khu vực | ✔ | 2 cấp: **Tỉnh/Thành phố** → **Quận/Huyện** (cascade, danh sách từ dữ liệu VN chuẩn) |

Hậu điều kiện của wizard:

- `parents` của phụ huynh được cập nhật (SĐT + mục đích + khu vực).
- Phòng chat tồn tại 1:1 với bộ **`(parents.id, tutor.id)`** (mục 13): tin nhắn cũ, đề xuất cũ giữ nguyên khi phụ huynh quay lại **cùng gia sư**.
- Gia sư nhận thông báo "Phụ huynh mới bắt đầu trò chuyện" kèm mục đích và khu vực (2 trường này gia sư được thấy **ngay**, không cần chờ đồng ý đề xuất — vì không phải dữ liệu cá nhân nhạy cảm theo chính sách mục 7.1). Thông tin học sinh chưa xuất hiện ở thời điểm này — nó do gia sư khai khi tạo đề xuất (mục 8.1.1).

## 5. Luồng B — Đăng tin (mở rộng UC-PA-04 cũ)

### 5.1. Form "Đăng tin tìm gia sư"

**Điều kiện mở:** Phụ huynh đã đăng nhập Google (mục 4.1). Nút **"Tìm gia sư"** trên trang chủ (giữ nguyên vị trí UC-PA-04 cũ) — trước đây mở form công khai không cần đăng nhập, nay mở form đăng tin (bắt buộc đăng nhập).

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| Họ tên phụ huynh | Text | ✔ | Pre-fill từ hồ sơ Google, cho sửa. Tối thiểu 2 ký tự |
| SĐT | Text | ✔ | Pre-fill nếu `parents` đã có (từ wizard lần trước hoặc form UC-PA-04 cũ). Kiểm định định dạng (UC-PA-03.4.2). SĐT thuộc Google account khác → chặn |
| Mục đích | Chọn 1 | ✔ | 4 lựa chọn như mục 4.2 bước 3 |
| Tỉnh/Thành phố | Chọn | ✔ | Cấp 1 |
| Quận/Huyện | Chọn | ✔ | Cấp 2 (cascade) |
| Số buổi/tuần (gợi ý) | Chọn | — | 1–5, optional; dùng tham khảo cho gia sư, không ràng buộc |
| Mức phí tham khảo (VND/buổi) | Số | — | Optional, interval (VD 200k–300k); dùng tham khảo |
| Ghi chú | Text (≤ 1000) | — | Mô tả thêm: thời gian mong muốn, tình trạng HS, kỳ vọng, có thể nêu con (tên + khối lớp) dưới dạng tự do. Tin **không có trường cấu trúc "con nào"** — học sinh chính thức do gia sư khai trong đề xuất (mục 8.1), lễ tân xác định hồ sơ khi xác nhận (mục 10). Phụ huynh nhiều con thì ghi trong mô tả, hoặc tạo nhiều tin nếu muốn tách phạm vi ứng tuyển |

Hậu điều kiện:
- Hệ thống tạo `class_requests` NEW, `source = POSTING`, `requested_tutor_id = NULL`, `student_id = NULL` (tin là bảng khám phá — học sinh chưa được gắn; học sinh của tin, nếu phụ huynh nêu trong mô tả, chỉ mang tính tham khảo), `created_by = parent.user_id` (thay cho `created_by = NULL` như form công khai cũ).
- Phụ huynh nhận mã tin + thông báo "Trung tâm sẽ duyệt tin trong 24 giờ", chuyển tới **tab "Đăng tin của tôi"** (mục 5.2). Giới hạn chống spam duy nhất: mỗi phụ huynh tối đa **1 tin POSTING đang sống** (`NEW`/`OPEN`) cùng lúc (E-9) — tin không gắn con nên cap theo phụ huynh, không theo con.

### 5.2. Tab "Đăng tin của tôi" (phụ huynh)

Hiển thị trên trang "Của tôi" sau khi đăng nhập. Mỗi tin là một card (tin không gắn học sinh — học sinh do gia sư khai ở đề xuất), trạng thái:

| Trạng thái | Mô tả | Nút phụ huynh thấy |
|---|---|---|
| **Chờ duyệt** (`NEW`, nguồn POSTING) | Lễ tân chưa duyệt | "Hủy tin" (đơn chuyển CANCELLED, có thể tạo tin mới) |
| **Đã đăng – chờ gia sư** (`OPEN`) | Gia sư đang xem/ứng tuyển. Tin **giữ OPEN** ngay cả khi đã có đơn CHAT chốt học sinh từ tin này (bảng chỉ đóng khi tự hủy) | "Xem ứng viên" (danh sách gia sư đã ứng tuyển) |
| **Đã hủy** (`CANCELLED`) | Phụ huynh hoặc Lễ tân đóng tin | "Tạo tin mới" (nút) |

> Tin POSTING là **bảng khám phá, không phải hợp đồng** (mục 3). Vì vậy **không có trạng thái "Đã chốt" trên tin**: khi phụ huynh đồng ý đề xuất của một ứng viên (mỗi đề xuất ghi rõ học sinh, mục 8.1), hệ thống tạo **đơn CHAT riêng** (mục 8.3); tin gốc vẫn `OPEN`, các ứng viên khác vẫn đang "đứng" và gia sư khác vẫn có thể ứng tuyển tiếp. Việc "học sinh đã có lớp từ chat" hiển thị như một **dòng trạng thái thông tin trên card** ("Học sinh [tên] (từ đơn CHAT số [mã]) đã có lớp — xem chi tiết →" liên kết đến đơn CHAT/lớp), kèm nút **"Đóng tin"** nếu phụ huynh muốn ngừng nhận ứng viên (đơn chuyển `CANCELLED`).

Khi có gia sư ứng tuyển (bước [4] Luồng B), phụ huynh nhận thông báo: *"Bạn mới có [N] gia sư ứng tuyển cho tin '[mã tin]', xem ngay →"*. Mỗi ứng viên có **nút "Nhắn tin"** — mở phòng chat với gia sư đó (wizard mục 4.2 nếu lần đầu với gia sư đó), cho phép phụ huynh đàm phán và đồng ý đề xuất (mỗi đề xuất ghi rõ học sinh — mục 8.1; đơn CHAT, mục 8.3).

**Quản trị bởi Lễ tân** (mục 12): tab "Yêu cầu từ chat" bổ sung danh sách tin POSTING `NEW` (chờ duyệt) và `OPEN` (đang nhận ứng tuyển). Nút "Duyệt" → đơn chuyển OPEN; "Từ chối/Đóng tin" → CANCELLED kèm lý do (phụ huynh nhận thông báo). Lễ tân cũng thấy các **đơn CHAT** `NEW` chờ xác nhận (mục 8.3, cả nguồn CHAT do chat và do đăng tin) để thao tác xác nhận 1 lần (mục 10).

## 6. Tiền điều kiện mở chat với gia sư

- Gia sư `profile_status = ACTIVE` (đã được Lễ tân duyệt, UC-REC-07/08). Gia sư `INACTIVE`/`REJECTED`: ẩn nút "Nhắn tin".
- Phụ huynh **đã đăng nhập bằng Google** (mục 4.1 — không có phương thức khác). Chưa đăng nhập: bấm "Nhắn tin" mở màn hình đăng nhập Google.
- Phụ huynh hoàn tất wizard (mục 4.2).

## 7. Chính sách phòng chat (bắt buộc)

### 7.1. Chặn thông tin liên hệ (PII policy)

Mọi tin nhắn (cả phụ huynh lẫn gia sư) được quét trước khi gửi, theo 3 nhóm:

1. **Số điện thoại**: regex chuỗi số 10–11 chữ số (03xx/05xx/07xx/08xx/09xx, +84/84) → **chặn gửi**, hiện thông báo: *"Hệ thống không cho phép chia sẻ số điện thoại. Hãy thống nhất nội dung học rồi để gia sư tạo đề xuất."*
2. **Kênh liên lạc xã hội**: từ khóa/zalo, zalo, z.n, facebook, fb, messenger, telegram, whatsapp, instagram + dạng link (`zalo.me/...`, `fb.com/...`, `linktr.ee/...`) → chặn gửi, thông báo tương tự.
3. **Email**: regex email → chặn gửi.

- Chặn **thành phần** (không chặn cả tin nhắn vì từ "zalo" ghép trong câu thông thường không đủ yếu tố số/link): chỉ kích hoạt khi phát hiện cấu trúc số điện thoại, link hoặc email thật sự. Số bị che một phần (09xx-xx...) vẫn bắt bằng regex nới (các biến thể dấu cách, gạch nối, "+84", "SDT là 09...").
- **Lượt cảnh báo**: tin nhắn bị chặn hiện trong khung soạn của người gửi với phần vi phạm tô đỏ để họ sửa; tin không được lưu, không đối phương không nhận.
- Hệ thống **ghi log kiểm duyệt** (thời điểm, loại vi phạm, vai trò) — phục vụ Lễ tân/Admin xem khi hòa giải (mục 12).

### 7.2. Giới hạn khác

- Tin nhắn văn bản tối đa 2000 ký tự; không đính kèm file (MVP) — tài liệu đi qua kênh lớp học chính thống (UC-ST-07), tránh biến chat thành kênh giao tài liệu.
- Tốc độ: tối đa 10 tin/phút mỗi người (chống spam); vượt giới hạn hiện thông báo chờ 5 giây.
- Gia sư không tạo được đề xuất nếu đã có đề xuất `PENDING` **cho cùng học sinh** trong phòng (1 học sinh tối đa 1 đề xuất đang chờ trong 1 room — tránh phụ huynh không biết chốt bản nào). Vì học sinh gắn ở tầng đề xuất (mục 8.1) chứ không ở tầng room, **một room có thể có đồng thời 2 đề xuất PENDING cho 2 học sinh khác nhau** của cùng phụ huynh — mỗi thẻ ghi rõ học sinh (mục 14). Ràng buộc "1 học sinh + mục đích = tối đa 1 lớp TRIAL/ACTIVE" (E-4) được enforce ở bước kiểm tra (mục 8.3) và màn lễ tân xác nhận (mục 10).

## 8. Đề xuất lớp học (Proposal)

### 8.1. Người tạo & thời điểm

- **Chỉ GIA SƯ** tạo được đề xuất (nút "Tạo đề xuất" trong phòng chat), khi đã trao đổi được ít nhất 1 tin nhắn hai chiều trong phòng.
- Đề xuất thuộc về **phòng chat** (`(phụ huynh, gia sư)`, mục 13), **không thuộc về bất kỳ đơn/ứng tuyển nào**: dù phụ huynh mở room từ nút "Nhắn tin" trên card ứng viên của một tin POSTING (Luồng B) hay từ hồ sơ gia sư (Luồng A), đề xuất chỉ được định tuyến qua cặp phụ huynh + gia sư của room. **Học sinh là nội dung của chính đề xuất, không phải của room** (mục 8.1.1) — mỗi đề xuất khai riêng học sinh của mình, nên 1 room có thể chứa đề xuất cho nhiều học sinh của cùng phụ huynh. Tin POSTING (nếu có) là bảng khám phá, không bị tác động bởi nội dung hay kết quả của đề xuất (mục 8.3).
- Nội dung đề xuất (form gia sư điền):

#### 8.1.1. Mục "Học sinh" — cách khai học sinh trong đề xuất

| Nhánh | Điều kiện | Trường | Ghi chú |
|---|---|---|---|
| **Con có sẵn** (mặc định, hiện đầu) | Phụ huynh đã có hồ sơ học sinh trong hệ thống | Dropdown chọn 1 con trong `students` có `parent_id` = phụ huynh (dòng: họ tên + khối lớp nếu có) | Gắn `student_id` thật → bước Đồng ý (mục 8.3) kiểm tra E-4 + trùng lịch của con được **chạy thật** (join `class_schedules`/`classes`) |
| **Thêm học sinh mới** | Phụ huynh chưa có con đó trong hệ thống | **Họ tên** (min 2 ký tự, max 50) | `student_id = NULL`, lưu `student_name`; `grade_level` để **rỗng** — gia sư bổ sung sau (nudge ở UC-T08 trước/khi vào ca thử). Lễ tân tạo hồ sơ học sinh khi xác nhận (mục 10). Trùng hồ sơ (con thực ra đã tồn tại nhưng orthography khác) → lễ tân đối chiếu danh sách con của phụ huynh ở màn xác nhận (gợi ý khớp theo tên, 1 chạm "dùng hồ sơ này / tạo mới") |

> Vì sao bỏ khối lớp ở bước này: với học sinh mới, chưa có lịch cũ để trùng → việc thiếu khối lớp **không làm mất** bất kỳ check nào; khối lớp là thông tin gia sư nắm tốt nhất lúc dạy thử — để gia sư bổ sung chính xác hơn là để phụ huynh đoán ở form. Với con có sẵn, khối lớp (nếu có) đã hiển thị kèm trong dropdown.

| Trường | Kiểu | Bắt buộc | Ghi chú |
|---|---|---|---|
| `student` (mục 8.1.1) | Chọn con có sẵn / họ tên con mới | ✔ | Không có đề xuất hợp lệ nếu bỏ trống học sinh |
| `price_per_session` | Số tiền (VND/buổi) | ✔ | Gợi ý giá từ `tutor_prices` của gia sư làm giá trị mặc định, cho sửa |
| `sessions_per_week` | Số buổi/tuần | ✔ | 1–5 |
| `trial_date` | Ngày | ✔ | Ngày dạy thử (1 buổi duy nhất, khớp UC-T08: 1 lớp = 1 ca thử) |
| `trial_time_from` / `trial_time_to` | Giờ | ✔ | Khoảng thời gian buổi thử |
| `schedule_days` | Chọn ngày trong tuần (đa lựa chọn) | ✔ | Chạy theo UC-T08 bước 5 (trùng lặp với các ca khác của gia sư → cảnh báo, không chặn, vì mới là đề xuất) |
| `schedule_time_from` / `schedule_time_to` | Giờ | ✔ | Lịch cố định hàng tuần |
| `class_mode` | `AT_HOME` / `ONLINE` | ✔ | Hình thức dạy |
| `note` | Văn bản ngắn | — | Ghi chú phụ (tài liệu chuẩn bị, yêu cầu...) |

### 8.2. Trạng thái đề xuất (state machine)

```
PENDING ──(phụ huynh Đồng ý)──► ACCEPTED   (kết thúc, không đổi thêm)
PENDING ──(phụ huynh Từ chối)──► REJECTED   (kết thúc; gia sư có thể tạo đề xuất MỚI)
PENDING ──(gia sư Rút lại, có lý do trong chat)──► CANCELLED (gia sư tạo đề xuất MỚI nếu cần)
```

- Khi **gửi**, đề xuất hiện trong chat dưới dạng **thẻ (card)** cố định, không thể chỉnh sửa sau khi gửi — muốn đổi nội dung thì Rút lại (CANCELLED) và tạo mới. Thẻ ghi rõ số phiên bản (Đề xuất #1, #2...) **và học sinh của đề xuất** ("Cho học sinh: [Họ tên] (Khối X)" nếu con có sẵn có khối; "Cho học sinh: [Họ tên]" nếu con mới — dòng này phải nổi bật vì là checkpoint để phụ huynh bấm đúng thẻ cho đúng con, đặc biệt khi 1 room có đề xuất cho nhiều học sinh (mục 7.2)).
- Thẻ có 2 nút cho phụ huynh: **"Đồng ý"** và **"Từ chối"** (kèm ô nhập lý do, tùy chọn, ≤ 500 ký tự — lý do để gia sư điều chỉnh đề xuất mới, đồng thời là dữ liệu cho khiếu nại sau này).
- Phụ huynh chỉ thao tác được trên thẻ **PENDING**. Thẻ ACCEPTED hiện trạng thái "Đã đồng ý — trung tâm sẽ xác nhận lớp học cho [Họ tên học sinh]" kèm mã đơn được sinh (mục 10).

### 8.3. Sự kiện khi phụ huynh bấm "Đồng ý"

Sự kiện này **giống hệt nhau ở cả 2 luồng** — không có phân nhánh theo nguồn mở room:

1. **Kiểm tra trước khi accept** (chạy luôn khi bấm Đồng ý, vì học sinh đã gắn vào đề xuất):
   - **E-11 (lịch gia sư)**: khung thử + khung cố định trùng lớp/ca khác của gia sư → không accept được, đề xuất tự `EXPIRED`, thông báo trong chat (như mục 11 E-11).
   - **E-4 (lịch học sinh, chỉ khi con có sẵn — có `student_id`)**: học sinh đã có lớp `TRIAL`/`ACTIVE` cùng mục đích → chặn accept, thông báo *"Học sinh [Tên] đang có lớp [mục đích]. Muốn học với gia sư này, vui lòng hủy lớp cũ trước (quy trình Lễ tân, UC-REC)."* Khung giờ đề xuất trùng lịch học của con (join `class_schedules`) → cảnh báo mềm trên thẻ (không chặn), lễ tân đối chiếu lại ở màn xác nhận (mục 10).
   - **Con mới (chưa có hồ sơ)**: không có lịch cũ để trùng, không có E-4 để chặn — chấp nhận (check cuối nằm ở màn lễ tân, mục 10).
2. Đề xuất → `ACCEPTED`, ghi `decided_at`, `rejection_reason = NULL`.
3. **Mở khóa SĐT phụ huynh cho gia sư** (mục 9) — gia sư thấy SĐT đầy đủ (không che) trong khối thông tin phụ huynh ở đầu phòng chat.
4. Hệ thống **tạo `class_requests` nguồn `CHAT`** (đơn "hợp đồng khung"):
   - `requested_tutor_id` = gia sư đang chat (room).
   - Học sinh của đề xuất (mục 8.1.1): con có sẵn → `student_id` thật; con mới → `student_id = NULL` (họ tên học sinh nằm ở `proposal_messages.student_name`, liên kết qua `class_request_id` — lễ tân gán `student_id` khi xác nhận, mục 10).
   - Mục đích (từ wizard), số buổi/tuần & học phí **chụp từ đề xuất đã chốt** (đổi được bởi Lễ tân khi xác nhận, mục 10).
   - `created_by = user_id của phụ huynh`, `source = CHAT`, `status = NEW`, chờ xác nhận (mục 10).
5. **Tin POSTING (nếu room mở từ Luồng B) không đổi trạng thái** — giữ `OPEN`, không `TERMINATED` ứng tuyển nào. Các gia sư khác vẫn có thể tiếp tục ứng tuyển (UC-T02) và phụ huynh có thể đồng ý đề xuất của người khác (bị chặn bởi E-4: cùng học sinh + cùng mục đích tối đa 1 lớp TRIAL/ACTIVE — mục 11 E-4). Tin chỉ đóng khi phụ huynh hoặc Lễ tân tự hủy (CANCELLED, mục 5.2).
6. Thông báo: gia sư ("Phụ huynh đã đồng ý đề xuất cho [Họ tên học sinh] — số điện thoại của phụ huynh đã được mở khóa; đơn học đã tạo, trung tâm xác nhận trong 24 giờ"), phụ huynh ("Trung tâm đã ghi nhận, sẽ xác nhận lớp cho [Họ tên học sinh] trong 24 giờ. Nếu sai học sinh, vui lòng liên hệ hotline"), Lễ tân (đơn CHAT `NEW` chờ xác nhận, gắn link phòng chat + học sinh + mã tin gốc nếu room mở từ đăng tin).
7. Phụ huynh thấy trong chat: *"Trung tâm đã nhận đề xuất cho [Họ tên học sinh]. Số điện thoại của bạn (09xx...) đã được chia sẻ với gia sư để xác nhận lớp."*

> **Vì sao không chuyển tin POSTING sang "Đã chốt"?** Tin là bảng khám phá (mục 3) — giống "bài đăng tìm lớp" chứ không phải hợp đồng. Chốt gia sư là hành vi **trong chat**, sinh ra **đơn CHAT riêng**; để tin mở kéo dài là có chủ đích (các ứng viên khác vẫn giá trị, phụ huynh có thể chưa ưng gia sư đang dạy thử — E-12). Hệ quả: `MATCHED_PENDING` (trạng thái từng dùng để "chặn tin") **không còn**; ràng buộc "1 con = tối đa 1 lớp" chuyển sang E-4 phía `classes`.

### 8.4. Sự kiện khi phụ huynh bấm "Từ chối"

- Đề xuất → `REJECTED` kèm lý do. Gia sư nhận thông báo, có thể nhắn tin tiếp và tạo đề xuất mới (mục 7.2: lúc này không còn đề xuất PENDING).
- Không có hậu quả nghiệp vụ nào khác; phòng chat vẫn hoạt động bình thường, SĐT vẫn chưa mở khóa.

### 8.5. Rút lại (gia sư)

- Chỉ khi `PENDING`: gia sư bấm "Rút đề xuất" trên thẻ, nhập lý do ngắn (≥ 5 ký tự) → `CANCELLED`. Tin "Đã rút đề xuất (lý do)" hiện công khai trong chat. Tạo mới bình thường.

## 9. Cổng SĐT (Phone Gate)

- **Trước** khi có bất kỳ đề xuất `ACCEPTED` nào trong phòng: khối thông tin phía gia sư chỉ hiện **mục đích + khu vực** (từ wizard) và danh sách học sinh đã có hồ sơ của phụ huynh (họ tên + khối lớp nếu có — dùng cho mục "Học sinh" của đề xuất, mục 8.1.1), SĐT **ẩn hoàn toàn** (không phải che số — không tồn tại trong payload trả về phía gia sư, enforce ở backend: API chat của gia sư không join trường `parents.phone` chừng nào không có đề xuất ACCEPTED của cùng phòng).
- **Sau** khi có đề xuất `ACCEPTED`: SĐT hiện đầy đủ kèm nhãn "Đã chia sẻ theo đề xuất #N được đồng ý" + thời điểm. Một khi đã mở khóa, SĐT **giữ mở** trong phòng đó (dù các đề xuất tiếp theo thay đổi).
- Phụ huynh không bao giờ thấy SĐT gia sư trong chat (gia sư là thành viên đăng nhập, SĐT họ là công khai trên hồ sơ UC-PA-02 — không nằm trong chat).
- Audit: ghi log sự kiện "SĐT mở khóa cho gia sư X tại thời điểm T (đề xuất N)" — xem được bởi Lễ tân/Admin (mục 12).

## 10. Tích hợp với luồng ghép lớp hiện có

| Thời điểm | Hành động hệ thống | Bảng liên quan |
|---|---|---|
| Đăng nhập Google lần đầu | Tra `oauth_accounts`; tạo `users` (PARENT) + `parents` | `users`, `oauth_accounts`, `parents` |
| Wizard hoàn tất | Cập nhật SĐT + mục đích + khu vực (phụ huynh). **Không tạo/ghi học sinh** (chiều con ở đề xuất) | `parents` |
| Phụ huynh tạo **đăng tin** (Luồng B, mục 5.1) | Tạo đơn `NEW` nguồn POSTING, `requested_tutor_id = NULL`, `student_id = NULL` (tin không gắn học sinh) | `class_requests` |
| Lễ tân duyệt đăng tin | Đơn `NEW → OPEN` (cho gia sư ứng tuyển UC-T02) | `class_requests` |
| Gia sư ứng tuyển (Luồng B) | `class_applications` (hiện hành) — bảng khám phá, **độc lập với chat/đề xuất** | `class_applications` |
| Gia sư tạo đề xuất (mục 8.1) | Khai học sinh: con có sẵn → `student_id` (từ `students` của phụ huynh); con mới → `student_name` (họ tên, `student_id = NULL`) | `proposal_messages`, `students` (đọc, con có sẵn) |
| Phụ huynh Đồng ý đề xuất (**cả 2 luồng, sự kiện như nhau**, mục 8.3) | Kiểm tra E-11 (gia sư) + E-4 (con có sẵn: con đã có lớp TRIAL/ACTIVE cùng mục đích → chặn) → (a) Mở khóa SĐT; (b) tạo đơn `class_requests` NEW nguồn CHAT có `requested_tutor_id` (gia sư của room), `student_id` (con có sẵn từ đề xuất; con mới → NULL, họ tên nằm ở `proposal_messages.student_name` liên kết qua `class_request_id`), nội dung chụp từ đề xuất; tin POSTING (nếu room từ Luồng B) **giữ OPEN, không TERMINATED** | `class_requests`, `proposal_messages`, `chat_pii_events` |
| Lễ tân xác nhận (1 thao tác + **xác định học sinh**, màn hình "Yêu cầu từ chat", xử lý **đơn nguồn CHAT**) | Đơn CHAT `NEW` → `MATCHED`. Xác định học sinh: con có sẵn (đơn có `student_id`) → verify + kiểm tra E-4/trùng lịch con thực (join `class_schedules`); con mới (đơn có `student_name`) → đối chiếu danh sách con của phụ huynh (gợi ý khớp tên), tạo `students` + `users` mới với **`grade_level = NULL`** (gia sư bổ sung sau, nudge ở UC-T08) hoặc gán `student_id` có sẵn nếu trùng hồ sơ; tạo `classes` TRIAL (ca thử + học phí chụp từ đề xuất đã chốt; lễ tân có thể giữ nguyên hoặc chỉnh — nếu chỉnh, log thay đổi so với đề xuất gốc) | `class_requests`, `classes`, `students`, `users` |
| Gia sư dạy thử (UC-T08, ca thử đã có sẵn từ đề xuất) | Nudge gia sư bổ sung `grade_level` nếu học sinh mới đang `NULL` (không block ca thử) | `students`, `classes` |
| Dạy thử thất bại (UC-PA-05 hiện hành) | Đơn CHAT gốc (đã sinh lớp, `requested_tutor_id` cũ) → `REMATCH` (lễ tân mở lại cho gia sư khác) hoặc `CANCELLED`; tin POSTING liên quan (nếu room mở từ đăng tin) **vẫn giữ OPEN** để gia sư khác tiếp tục ứng tuyển | `class_requests`, `class_applications`, `classes` |
| Chốt lịch cố định (UC-T09) | `TRIAL → ACTIVE`, sinh `class_schedules` + khoản phí nhận lớp (UC-REC/ACC hiện hành, 40% tháng đầu) | `classes`, `class_schedules`, `fees` |

**Nghĩa quy tắc**: đề xuất trong chat là "hợp đồng khung" — phụ huynh + gia sư thống nhất đủ thông tin (kể cả học sinh — mục 8.1.1), và **lớp luôn được sinh ra từ đơn nguồn CHAT** (cả 2 luồng hội tụ về cùng một loại đơn). Đăng tin (POSTING) chỉ là **bảng khám phá** tách rời: không đóng, không TERMINATED khi có người chốt (giống "bài đăng tìm lớp" — mục 8.3). Học sinh gắn ở **tầng đề xuất + tầng đơn**, không ở tầng room (mục 1): (1) lễ tân giữ đúng 1 điểm kiểm soát trước khi lớp tồn tại (xác nhận đơn CHAT, kèm xác định học sinh — verify con có sẵn / tạo hồ sơ con mới với grade NULL); (2) khi dạy thử thất bại, **đơn CHAT gốc làm căn cứ REMATCH**, trong khi tin POSTING (nếu có) tự do giữ mở cho ứng viên khác; (3) ràng buộc "1 học sinh = tối đa 1 lớp TRIAL/ACTIVE cùng mục đích" (E-4) enforce ở bước Đồng ý (mục 8.3, khi có `student_id`) và màn xác nhận lễ tân (mục 10, khi lễ tân gán `student_id` cho con mới) — ràng buộc áp dụng **theo hồ sơ học sinh**, nên trùng hồ sơ con (2 record cùng tên) chỉ chặn trong từng record, được phòng vệ bởi: 1 room tối đa 1 PENDING mỗi học sinh (mục 7.2), phụ huynh bấm Đồng ý trên card ghi rõ học sinh, lễ tân verify tên ở màn xác nhận; (4) học sinh mới có `grade_level = NULL` tới khi gia sư bổ sung ở UC-T08 (không block ca thử); (5) khiếu nại/hủy lớp, phí nhận lớp, báo cáo kế toán vận hành đúng quy tắc hiện hành không cần sửa.

## 11. Ngoại lệ & Ranh giới

| # | Tình huống | Xử lý |
|---|---|---|
| E-1 | Phụ huynh gõ SĐT (của mình hay người khác), email, link Zalo | Chặn ở mục 7.1; tin không lưu; log kiểm duyệt |
| E-2 | Phụ huynh dùng SĐT khác với SĐT đã tạo phòng trước đó (chỉnh trong wizard khi quay lại) | SĐT là dữ liệu wizard; khi phụ huynh đã có phòng và đổi SĐT, hệ thống tra SĐT mới: SĐT mới không thuộc ai → cập nhật và giữ phòng cũ; SĐT mới thuộc phụ huynh khác (Google account khác) → chặn (UC-PA-03.4.3). Phòng chat vẫn gắn với cùng Google account (1 tài khoản phụ huynh = 1 `users`), không tạo phòng trùng |
| E-3 | Phụ huynh đồng ý đề xuất nhưng trung tâm không xác nhận trong 7 ngày | Đơn CHAT giữ trạng thái chờ xác nhận (`NEW`); hệ thống nhắc Lễ tân (dashboard + thông báo lặp sau 48 giờ). Hết 7 ngày đơn tự chuyển `EXPIRED`, phòng chat vẫn hoạt động để hai bên tiếp tục, gia sư có thể đề xuất lại; SĐT của phụ huynh vẫn giữ mở (đã đồng ý 1 lần — không thu hồi). Tin POSTING (nếu room mở từ đăng tin) không bị ảnh hưởng — vẫn `OPEN` |
| E-4 | Phụ huynh đồng ý 2 đề xuất khác nhau | Mỗi lúc chỉ tồn tại tối đa 1 đề xuất PENDING **mỗi học sinh** trong 1 phòng (mục 7.2) — không đồng ý được 2 đề xuất **cùng gia sư** cho cùng học sinh. Với 2 học sinh khác nhau của cùng phụ huynh: cùng 1 phòng (room key `(parent, tutor)`, mục 13), mỗi học sinh được 1 lớp (ràng buộc "1 học sinh + mục đích = tối đa 1 lớp TRIAL/ACTIVE" áp dụng **theo hồ sơ học sinh**, R-19 hiện hành). Với 2 gia sư khác nhau cho **cùng học sinh + cùng mục đích**: chỉ 1 đơn CHAT có thể xác nhận; đồng ý bản thứ 2 khi học sinh đã có lớp TRIAL/ACTIVE → chặn ở bước Đồng ý (mục 8.3) nếu học sinh có sẵn (`student_id`), hoặc ở màn lễ tân xác nhận (mục 10) nếu học sinh mới (lễ tân gán `student_id`); báo học sinh đã có lớp, hủy lớp cũ trước nếu muốn đổi (E-12). Tin POSTING vẫn giữ OPEN, không phải lý do chặn — ràng buộc nằm ở phía lớp. **Lưu ý**: E-4 enforce theo hồ sơ học sinh (record-level); nếu cùng học sinh thật bị tạo 2 hồ sơ (họ tên chính tả khác nhau, lễ tân không khớp hồ sơ ở màn xác nhận), check E-4 không nhận diện được 2 record là cùng người. Phòng vệ: (1) 1 room tối đa 1 PENDING mỗi học sinh (mục 7.2); (2) card đề xuất ghi rõ học sinh — phụ huynh bấm Đồng ý sai học sinh sẽ lộ ngay (mục 8.2); (3) lễ tân đối chiếu danh sách học sinh của phụ huynh khi xác nhận (mục 10); (4) lớp tạo sai vẫn hủy được qua quy trình khiếu nại/hủy lớp hiện hành (UC-REC) |
| E-5 | Gia sư ngừng hoạt động (`INACTIVE`) khi phòng đang có đề xuất PENDING | Phòng khóa: phụ huynh chỉ xem, không gửi được; đề xuất PENDING tự `EXPIRED` sau 7 ngày. Gia sư quay lại `ACTIVE` thì phòng mở lại |
| E-6 | Gia sư dùng chat để hẹn gặp ngoài hệ thống (đề xuất học tại quán cà phê, không qua lớp) | Không phát hiện tự động; Lễ tân/Admin xem được toàn bộ chat + log kiểm duyệt (mục 12) khi có khiếu nại (UC-REC khiếu nại hiện hành) để can thiệp |
| E-7 | Phụ huynh xóa SĐT / không muốn chia sẻ thêm | Không có: SĐT là dữ liệu wizard bắt buộc; muốn hủy dùng thì xóa tài khoản lớp (quy trình khiếu nại/hủy lớp hiện hành của Lễ tân), không có nút "xóa SĐT" một mình |
| E-8 | Tin nhắn bị chặn nhưng người gửi cho là nhầm (gõ số để "minh họa") | Không có ngoại lệ thủ công ở phía phụ huynh; Lễ tân/Admin có thể xem log kiểm duyệt và **duyệt lại** tin bị chặn (thao tác nội bộ, tin chỉ hiện trong log, không tự động chuyển thành tin nhắn công khai) |
| E-9 | Đăng tin (Luồng B) bị từ chối bởi Lễ tân | Đơn `CANCELLED` kèm lý do (Lễ tân nhập). Phụ huynh nhận thông báo, có thể **tạo tin mới**. Tin không gắn học sinh (mục 5.1) nên giới hạn chống spam duy nhất: mỗi **phụ huynh** tối đa **1 tin ở trạng thái `NEW`/`OPEN`** cùng lúc (tránh trùng đơn chờ); phụ huynh nhiều con vẫn được ghi nhiều con trong mô tả của cùng tin, hoặc tạo tin mới sau khi tin cũ kết thúc (CANCELLED) |
| E-10 | Đăng tin không gia sư nào ứng tuyển trong 14 ngày | Hệ thống nhắc phụ huynh: "Tin của bạn chưa có gia sư ứng tuyển. Bạn có thể điều chỉnh mức phí/khu vực hoặc tạo tin mới." Tin giữ `OPEN` (không tự EXPIRED) — vì không có cam kết thời gian với ai. |
| E-11 | Phụ huynh đồng ý đề xuất của gia sư X nhưng gia sư đó đã có lớp cùng khung giờ (hoặc khung giờ trùng lịch của học sinh) | Khi phụ huynh bấm Đồng ý (mục 8.3 bước kiểm tra): (a) **Lịch gia sư** — backend kiểm tra `class_schedules`/`tutor_availabilities` của gia sư, khung thử + khung cố định trùng ca khác của gia sư → không accept được, đề xuất tự `EXPIRED`, thông báo trong chat *"Khung giờ [X] của gia sư đã có lớp khác. Vui lòng đề xuất lại với khung giờ khác."* (gia sư tạo đề xuất mới); (b) **Lịch học sinh, chỉ khi học sinh có sẵn (`student_id`)** — khung đề xuất trùng lịch học của con (join `class_schedules`) → **cảnh báo mềm, không chặn accept** (tránh chặn cả đơn hợp lệ vì lịch con sắp thay đổi); lễ tân đối chiếu conflict ở màn xác nhận (mục 10) với 3 nút: giữ nguyên / chỉnh khung (log thay đổi) / từ chối → REMATCH. **Học sinh mới (chưa có hồ sơ)**: không có lịch cũ, không conflict (check cuối nằm ở màn lễ tân). Tin POSTING (nếu có) vẫn giữ OPEN |
| E-12 | Phụ huynh muốn đổi gia sư khác sau khi đã đồng ý 1 đề xuất | **Trước khi trung tâm xác nhận**: phụ huynh hủy đơn CHAT (đơn `CANCELLED`, đề xuất gốc giữ `ACCEPTED` làm lịch sử) rồi tạo đề xuất mới trong chat (cùng gia sư, cùng học sinh) hoặc nhắn tin gia sư khác (phòng mới với gia sư khác, cùng học sinh khai trong đề xuất). Tin POSTING (nếu có) không bị tác động. **Sau khi lớp đã tạo**: hủy lớp qua quy trình khiếu nại/hủy lớp hiện hành của Lễ tân (UC-REC), sau đó đơn CHAT gốc có thể REMATCH (mục 10) hoặc phụ huynh bắt đầu luồng mới |

## 12. Quan sát & Kiểm soát của Trung tâm

- Lễ tân/Admin có tab **"Yêu cầu từ chat"** trên dashboard: danh sách phòng có đề xuất PENDING/đã chốt chờ xác nhận, **đơn CHAT `NEW` chờ xác nhận** (đơn nguồn CHAT, sinh khi phụ huynh đồng ý đề xuất — mục 8.3), đơn POSTING `NEW`/`OPEN` (chờ duyệt / đang nhận ứng tuyển), số tin bị kiểm duyệt trong ngày.
- Nút "Xem hội thoại" (read-only) vào phòng chat: xem toàn bộ tin nhắn + thẻ đề xuất + log kiểm duyệt + log mở khóa SĐT.
- Mọi thao tác quan trọng (mở khóa SĐT, duyệt đăng tin, xác nhận đơn, hủy đơn/lớp, duyệt lại tin bị chặn) ghi **audit log** theo quy định nền tảng (PRD mục 0: "audit log vẫn được ghi ngầm").

## 13. Mô hình dữ liệu (bảng mới + tương tác bảng có sẵn)

> Chi tiết kiểu dữ liệu full trong ERD (sẽ bổ sung khi phê duyệt tài liệu này); bảng dưới là khung nghiệp vụ.

### Bảng mới

**`oauth_accounts`** — Liên kết tài khoản OAuth (Google) cho vai trò phụ huynh
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `user_id` | BIGINT FK → `users.id`, NN, UQ | 1 người dùng (vai trò PARENT) = 1 tài khoản Google (không cho liên kết 2 Google với cùng phụ huynh) |
| `provider` | VARCHAR(20) | `GOOGLE` (dự phòng thêm sau) |
| `provider_user_id` | VARCHAR(255), NN | `sub` của Google OAuth (id duy nhất, bền) |
| `email` | VARCHAR(255) | Email Google, lưu cho tra cứu/gộp hồ sơ SĐT (mục 4.1) |
| `avatar_url` | VARCHAR(500) | Ảnh đại diện Google |
| `created_at` | TIMESTAMPTZ | |

**`chat_rooms`** — Phòng chat, 1:1 với cặp (phụ huynh, gia sư)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `parent_id` | BIGINT FK → `parents.id`, NN | |
| `tutor_id` | BIGINT FK → `tutors.id`, NN | |
| `unique(parent_id, tutor_id)` | | Mỗi (phụ huynh, gia sư) 1 phòng. **Không có chiều học sinh ở tầng room** (mục 1, 4.2) — học sinh gắn vào `proposal_messages` (mục 8.1.1) |
| `class_request_id` | BIGINT FK → `class_requests.id`, NULL | Chỉ ghi nhận **tin POSTING gốc** (nếu room mở từ nút "Nhắn tin" của một ứng viên trên tin đó, mục 5.2) — audit/hiển thị, **không định tuyến, không ràng buộc trạng thái** (tin giữ OPEN, mục 8.3). NULL khi room mở từ hồ sơ gia sư (Luồng A) |
| `status` | VARCHAR(20) | `ACTIVE` / `CLOSED` (gia sư INACTIVE) |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

**`chat_messages`** — Tin nhắn đã gửi thành công (bị chặn không lưu)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `room_id` | BIGINT FK → `chat_rooms.id`, NN | |
| `sender_type` | VARCHAR(10) | `PARENT` / `TUTOR` |
| `content` | TEXT (≤ 2000) | |
| `created_at` | TIMESTAMPTZ | |

**`proposal_messages`** — Tin dạng thẻ đề xuất (thành viên chat theo `room_id`, học sinh gắn ở tầng đề xuất — mục 8.1.1)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `room_id` | BIGINT FK, NN | |
| `tutor_id` | BIGINT FK → `tutors.id`, NN | Người tạo (luôn là gia sư) |
| `version` | SMALLINT | Số phiên bản trong phòng (tính theo từng học sinh nếu 1 room có nhiều học sinh) |
| `student_id` | BIGINT FK → `students.id`, NULL | Con có sẵn do gia sư chọn (mục 8.1.1); NULL khi học sinh mới (chưa có hồ sơ) |
| `student_name` | VARCHAR(50), NULL | Họ tên học sinh mới (min 2 ký tự) — bắt buộc khi `student_id = NULL`; NULL khi chọn con có sẵn. `grade_level` để rỗng — gia sư bổ sung sau ở UC-T08 (nudge, không block ca thử), lễ tân gán hồ sơ `student_id` khi xác nhận (mục 10). Ràng buộc: `student_id` VÀ `student_name` không được cùng NULL (CHECK) |
| `price_per_session` | INT (VND) | |
| `sessions_per_week` | SMALLINT | 1–5 |
| `trial_date` | DATE | |
| `trial_time_from` / `trial_time_to` | TIME | |
| `schedule_days` | INT[] | Ngày trong tuần (1–7) |
| `schedule_time_from` / `schedule_time_to` | TIME | |
| `class_mode` | VARCHAR(10) | `AT_HOME` / `ONLINE` |
| `note` | TEXT (≤ 1000, NULL) | |
| `status` | VARCHAR(20) | `PENDING` / `ACCEPTED` / `REJECTED` / `CANCELLED` / `EXPIRED` |
| `rejection_reason` | TEXT (≤ 500, NULL) | Lý do phụ huynh từ chối / gia sư rút |
| `decided_at` | TIMESTAMPTZ, NULL | Thời điểm đồng ý / từ chối |
| `class_request_id` | BIGINT FK → `class_requests.id`, NULL | Đơn CHAT sinh ra khi đề xuất `ACCEPTED` (mục 8.3) — có giá trị từ `ACCEPTED` trở đi. **Không** trỏ về tin POSTING; link tin POSTING gốc (audit) nằm ở `chat_rooms.class_request_id` (mục 13) |

**`chat_pii_events`** — Log kiểm duyệt & mở khóa SĐT (chỉ Lễ tân/Admin đọc)
| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | BIGSERIAL PK | |
| `room_id` | BIGINT FK, NN | |
| `type` | VARCHAR(20) | `PII_BLOCKED` / `PHONE_UNLOCKED` / `REVIEW_REINSTATED` |
| `detail` | TEXT | Loại PII (PHONE/EMAIL/LINK), tin bị chặn (chỉ log, không hiện công khai), lý do unlock |
| `created_at` / `created_by` | | `created_by` = Lễ tân khi có thao tác nội bộ, NULL khi hệ thống |

### Tương tác bảng có sẵn (đọc/ghi theo thao tác)

| Thao tác | Đọc | Ghi |
|---|---|---|
| Đăng nhập Google lần đầu (mục 4.1) | `oauth_accounts` (tra tài khoản Google đã liên kết) | `users` (tạo, role = `PARENT`, không mật khẩu), `oauth_accounts` (liên kết Google), `parents` (tạo bản ghi kế thừa, SĐT = NULL) |
| Gộp hồ sơ SĐT (mục 4.1) | `parents` (tra SĐT đã tồn tại từ form cũ) | `users` (gắn vai trò PARENT), `oauth_accounts`, `parents` (gộp SĐT vào tài khoản Google) |
| Wizard hoàn tất (mục 4.2) | `parents` (tra SĐT đã chiếm, quy tắc UC-PA-03.4.3) | `parents` (SĐT + purpose + province/district). **Không ghi `students`/`users`** — học sinh được khai ở đề xuất (mục 8.1) |
| Tạo đăng tin (Luồng B, mục 5.1) | `parents` | `class_requests` (NEW, `source = POSTING`, `requested_tutor_id = NULL`, `student_id = NULL`, `created_by` = phụ huynh, mục đích + khu vực + mô tả). Tin không gắn học sinh — học sinh do gia sư khai ở đề xuất (mục 8.1) |
| Lễ tân duyệt đăng tin (mục 5.2) | `class_requests` | `class_requests` (NEW → OPEN; hoặc CANCELLED kèm lý do) |
| Gia sư ứng tuyển (UC-T02 hiện hành) | `class_requests` (OPEN), `tutors` | `class_applications` |
| Mở phòng chat | `chat_rooms`, `tutors` (trạng thái hồ sơ), `class_requests` (POSTING gốc nếu mở từ tin — ghi `chat_rooms.class_request_id`, audit) | `chat_rooms` (tạo phòng nếu lần đầu, key `(parent, tutor)`) |
| Gửi tin nhắn | `chat_messages` (hiển thị), `chat_rooms` | `chat_messages`; tin bị chặn → `chat_pii_events` (không ghi `chat_messages`) |
| Gia sư tạo đề xuất (PENDING, mục 8.1) | `tutor_prices` (giá gợi ý), `tutor_availabilities` (trùng lặp tham khảo), `students` (danh sách học sinh có sẵn của phụ huynh — nhánh "chọn con có sẵn"; rule 1 PENDING mỗi học sinh, mục 7.2) | `proposal_messages` (ghi `student_id` nếu con có sẵn, hoặc `student_name` nếu con mới — mục 8.1.1) |
| Phụ huynh Đồng ý đề xuất (**cả 2 luồng, sự kiện như nhau**, mục 8.3) | `proposal_messages`, `chat_rooms` (gia sư của room), `tutor_availabilities`/`class_schedules` (E-11: trùng ca của gia sư → EXPIRED đề xuất), `classes` (E-4: chỉ khi học sinh có sẵn `student_id` — đã có lớp TRIAL/ACTIVE cùng mục đích → chặn; trùng lịch học của con → cảnh báo mềm), `students` (E-4, con có sẵn) | `proposal_messages` (→ACCEPTED, `decided_at`, `class_request_id` = đơn CHAT mới), `class_requests` (tạo NEW, `source = CHAT`, `requested_tutor_id` = gia sư, `student_id` = con có sẵn hoặc NULL (con mới — chụp `student_name` từ đề xuất, lễ tân gán hồ sơ khi xác nhận), chụp giá/số buổi từ đề xuất), `chat_pii_events` (`PHONE_UNLOCKED`) |
| Phụ huynh Từ chối | `proposal_messages` | `proposal_messages` (→REJECTED, lý do) |
| Gia sư Rút đề xuất | `proposal_messages` | `proposal_messages` (→CANCELLED) |
| Lễ tân xác nhận đơn CHAT (mục 10) | `class_requests` (đơn CHAT `NEW`), `proposal_messages`, `parents`, `tutors`, `students` (danh sách học sinh có sẵn của phụ huynh — đối chiếu khi đơn có `student_name`, gợi ý khớp theo tên), `class_schedules`/`classes` (E-11 + E-4 thực: trùng ca gia sư / học sinh đã có lớp TRIAL-ACTIVE cùng mục đích / trùng khung giờ học của con) | `class_requests` (→MATCHED; nếu học sinh mới, gán `student_id` sau khi xác định hồ sơ), `classes` (TRIAL, ca thử + học phí từ đề xuất đã chốt; lễ tân có thể chỉnh, log thay đổi), `students` + `users` (tạo học sinh mới với `grade_level = NULL` nếu con chưa có — mục 10; hoặc gán hồ sơ có sẵn nếu trùng), `chat_pii_events` (audit nếu chỉnh) |

## 14. Giao diện (tham chiếu chuẩn Frontend/AGENTS.md)

- **Wizard 4 bước**: stepper chuẩn, 1 trường/bước, tiến trình có thể quay lại, giữ draft khi rời trang (không giữ qua phiên). Nút "Tiếp tục" disable cho đến khi bước hợp lệ. Không có bước chọn con (chiều con nằm ở đề xuất, mục 8.1.1).
- **Form đề xuất (gia sư)**: card form với mục **"Học sinh"** (mục 8.1.1) hiện đầu — 2 nhánh: (a) dropdown học sinh có sẵn của phụ huynh (dòng: họ tên + khối lớp nếu có), (b) nút "Thêm học sinh mới" → hiện field **Họ tên** (min 2 ký tự) — không có field khối lớp (gia sư bổ sung sau, UC-T08). Form không enable submit nếu mục "Học sinh" trống.
- **Phòng chat**:
  - Tin phụ huynh: khung trái, màu surface chuẩn; tin gia sư: khung phải, `bg-blue-50 dark:bg-blue-950/40` (tham khảo mẫu Landing/Tutor Portal).
  - Tin hệ thống (đồng ý, từ chối, mở khóa SĐT, rút đề xuất): dòng chữ nhỏ giữa, `text-xs text-slate-500 dark:text-slate-400`.
  - **Thẻ đề xuất**: card `rounded-2xl` viền `border-blue-200 dark:border-blue-800/40`, đầu là "Cho học sinh: **[Họ tên]** (Khối X)" (con có sẵn) hoặc "Cho học sinh: **[Họ tên]**" (con mới — không có khối) + tiêu đề "Đề xuất lớp học #N" + badge trạng thái (tone: `PENDING` = amber, `ACCEPTED` = emerald, `REJECTED`/`CANCELLED`/`EXPIRED` = rose). Dòng học sinh phải nổi bật (font-semibold, cỡ vừa) vì là checkpoint xác thực cho phụ huynh trước khi bấm Đồng ý (mục 8.2). Nội dung: học phí/buổi (Geist Mono, cỡ lớn), số buổi/tuần, lịch thử (ngày + khung giờ), lịch cố định (chips ngày trong tuần), hình thức, ghi chú. Hai nút **"Đồng ý"** (primary) và **"Từ chối"** (outline, mở hộp lý do).
  - Tin bị chặn: khung soạn hiện tin gốc với phần vi phạm tô nền rose nhạt + note "Bị chặn theo chính sách bảo mật".
  - Khối thông tin (gia sư thấy ở đầu phòng): **danh sách học sinh có sẵn của phụ huynh (họ tên + khối lớp) + mục đích + khu vực** hiện ngay (4 mục: học sinh, mục đích, khu vực — học sinh có thể là danh sách rỗng nếu phụ huynh chưa có con nào); SĐT phụ huynh ẩn ("—") cho tới khi mở khóa, hiện kèm note "Mở khóa theo đề xuất #N ngày DD/MM/YYYY HH:mm".
- Toàn bộ dark mode + mobile theo AGENTS.md (checklist mục 6).

## 15. Ghi chú phạm vi (MVP)

1. Chưa có video call trong chat (quy định nền tảng: dùng Zoom/Meet, hệ thống chỉ lưu link phòng học).
2. Chưa có đính kèm file trong chat; tài liệu đi qua UC-ST-07.
3. Không có "yêu cầu gặp riêng bên ngoài hệ thống" — mọi trao đổi phải đi qua chat + đề xuất.
4. Phụ huynh **có** tài khoản (vai trò `PARENT`) nhưng **đăng nhập bằng Google duy nhất** (mục 4.1), không có mật khẩu riêng; phạm vi truy cập: nhắn tin + đăng tin + xem tiến trình con qua tài khoản học sinh (quy định nền tảng). **Form công khai UC-PA-03/04 không còn tồn tại** — cả 2 nút "Nhắn tin" và "Tìm gia sư" đều bắt đăng nhập Google (lưu ý gộp hồ sơ `parents` cũ, mục 4.1).
5. Kênh thông báo tới phụ huynh: thông báo in-app khi phụ huynh đang đăng nhập (kênh chủ động duy nhất, vì phụ huynh đã có tài khoản Google); không có email/SMS.
6. Đăng tin: không giới hạn số tin lũy kế; mỗi **phụ huynh** tối đa **1 tin POSTING đang sống** (`NEW`/`OPEN`) cùng lúc (E-9, mục 5.1) — tin không gắn học sinh (học sinh do gia sư khai ở đề xuất, mục 8.1), nên cap theo phụ huynh, không theo con; phụ huynh nhiều con ghi mô tả trong cùng tin hoặc tạo tin mới khi tin cũ kết thúc. Tin không tự đóng khi học sinh đã chốt gia sư qua chat (mục 8.3); đóng tin là thao tác chủ động của phụ huynh/Lễ tân.
7. Nút "Đổi gia sư" sau khi đã chốt đề xuất (E-12): ngoài phạm vi MVP — phụ huynh tạo đăng tin mới hoặc nhắn tin gia sư khác (khai học sinh mới trong đề xuất).
8. **Học sinh gắn ở tầng đề xuất, không ở tầng room** (mục 1): wizard 4 bước không chọn con (mục 4.2); `chat_rooms` key `(parent, tutor)` (mục 13). `grade_level` của học sinh mới được tạo `NULL`, gia sư bổ sung sau ở UC-T08 (không block ca thử) — do đó các tính năng phụ thuộc `grade_level` (gợi ý lộ trình, xếp lớp) cần xử lý trường hợp NULL.
