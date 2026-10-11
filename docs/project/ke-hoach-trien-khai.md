---
title: Kế hoạch triển khai đề tài — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
version: 2.1
ngày lập: 2026-09-04
cập nhật: 2026-10-11
ngày bắt đầu: 2026-09-07
ngày kết thúc: 2026-11-15
nhóm: 3 thành viên
thời lượng: 10 tuần
tài liệu liên quan: prd.md, mo_ta_de_tai.md, ARCHITECTURE.md, ../database.mmd, ../Usecase/*.docx
---
# 1. Tóm tắt

Nền tảng Web single-tenant cho trung tâm gia sư tiếng Anh 1-1: số hóa quy trình ghép lớp, thu phí nhận lớp, khiếu nại; hỗ trợ gia sư soạn quiz bằng AI; học sinh làm quiz với phản hồi tức thì và điểm Elo. Chi tiết xem `prd.md`.

**Kế hoạch được lập lại ở tuần 6 (11/10/2026)** vì hai lý do: (1) bộ use case mới đã đổi phạm vi, nguyên tắc là *use case có thì làm, không có thì bỏ* (xem `prd.md` mục 0 và mục 6); (2) tiến độ thực tế cho thấy backend mới ở mức khung nên giai đoạn 2 phải phân lại theo mức ưu tiên.

## 1.1. Kiến trúc công nghệ

| Thành phần | Công nghệ | Vai trò |
| --- | --- | --- |
| Frontend | React 19, Vite, Tailwind CSS v4 | 4 cổng: công khai (phụ huynh), Gia sư, Học sinh, Lễ tân/Admin |
| Backend | Java 17, Spring Boot 3.2, JPA, JWT | Cổng API duy nhất, nghiệp vụ, phân quyền, ghi audit log |
| AI Service | Python 3.11, FastAPI, LangGraph | Sinh quiz theo hội thoại, parser và kiểm định import, kiểm duyệt nội dung |
| Cơ sở dữ liệu | PostgreSQL 16 | Thiết kế tại `docs/database.mmd` |
| Lưu trữ file | Tương thích S3 | Chứng chỉ, tài liệu, minh chứng |
| Hạ tầng | Docker Compose, GitHub Actions | Chạy local, CI |

# 2. Hiện trạng (11/10/2026)

| Hạng mục | Trạng thái | Ghi chú |
| --- | --- | --- |
| Đặc tả use case | Xong | 3 file trong `docs/Usecase/`: Lễ tân và Admin (gộp một file), Gia sư, Học sinh và Phụ huynh |
| ERD | Xong bản đầu | `docs/database.mmd`, cần rà lại cùng cả nhóm |
| PRD, mô tả đề tài, kế hoạch | Xong (v2) | 7 quyết định tạm ở PRD mục 10 |
| Docker Compose, CI | Xong | `docker compose up --build` chạy 5 dịch vụ (thêm MinIO) |
| Frontend | Prototype nhiều trang, dữ liệu giả | Chưa nối API. Có trang theo thiết kế cũ nằm ngoài use case, cần gỡ (xem mục 3.4) |
| Backend | **Mới có khung**: `HealthController`, cấu hình kết nối DB | Chưa có entity, auth, nghiệp vụ |
| AI Service | **Mới có khung**: FastAPI, endpoint `/health` | Chưa có endpoint sinh quiz |
| Cơ sở dữ liệu | `init.sql` mới chỉ bật extension | Chưa có DDL, chưa có migration |
| Sơ đồ UML (trạng thái, tuần tự) | Chưa có | Rút gọn, xem mục 4 |

**Nhận định:** còn 5 tuần để dựng toàn bộ backend, nối frontend và AI cho 39 yêu cầu (35 bắt buộc, 4 nên có). Phải làm theo lát dọc và ưu tiên các mục bắt buộc.

# 3. Phạm vi và nguyên tắc triển khai

## 3.1. Trong phạm vi

Toàn bộ 39 FR ở `prd.md` mục 4, mỗi FR bám một use case:

- **Bắt buộc (M), 35 FR:** luồng cốt lõi chạy được từ đầu đến cuối: yêu cầu của phụ huynh → ghép lớp → dạy thử → chốt lịch → buổi học và nhật ký → quiz và Elo → duyệt phí → khiếu nại.
- **Nên có (S), 4 FR:** hồ sơ cá nhân học sinh (FR-16), xem gia sư của học sinh (FR-18), quản lý nhân sự lễ tân và thêm lễ tân (FR-38, FR-39).

## 3.2. Ngoài phạm vi

Không có use case nên không làm: báo cáo doanh thu và xuất file, xem audit log trên giao diện, đối soát tài chính, tạo tài khoản học sinh từ giao diện, tài khoản phụ huynh riêng, lập lịch SM-2, khung chương trình học, dạng bài ngoài trắc nghiệm, thanh toán tự động, dạy học trực tuyến tích hợp. Chi tiết `prd.md` mục 6.

## 3.3. Nguyên tắc

1. **Làm lát dọc**: mỗi tính năng hoàn thành cả DB, API, giao diện, kiểm thử trước khi sang tính năng sau.
2. **Giữ prototype frontend**, thay dần dữ liệu giả bằng API thật theo từng lát.
3. **Hợp đồng API trước**: viết OpenAPI của từng lát ở đầu tuần để frontend và AI Service làm song song.
4. **Quyết định tạm**: các điểm use case chưa nêu đã có mặc định ở `prd.md` mục 10 (QĐ-1 đến QĐ-7); chỉ đổi khi cả nhóm đồng ý, vì ảnh hưởng đến DB.
5. Quy ước Git theo `GIT_CONVENTION.md`: nhánh `feature/*` từ `dev`, PR có ít nhất 1 người duyệt và CI xanh.

## 3.4. Việc dọn frontend

Gỡ khỏi menu, không phát triển thêm các trang theo thiết kế cũ mà use case không có:

- Admin: `AdminAnalytics`, `AdminLogs` (báo cáo, xem audit log).
- Học sinh: `SpacedRepetitionSession`, `StudentChat`, `StudentMarketplace`, `StudentOnboarding`, `StudentProgress`.
- Gia sư: nhóm `Library*`, `manage/ManageLearningPath*` (khung chương trình), `ExerciseGenerator`.
- Phụ huynh: `ParentLearningProgress`, `guest/ParentProgressViewPage` (phụ huynh xem qua tài khoản học sinh).
- Gộp trang Admin và Lễ tân trùng chức năng (ghép lớp, duyệt phí, khiếu nại, danh sách gia sư/học sinh) thành một bộ, Admin có thêm trang quản lý lễ tân.

Danh sách trên dựa vào tên file, cần mở từng trang để xác nhận trước khi xóa.

# 4. WBS — Work Breakdown Structure

| Mã | Hạng mục | Đầu ra chính | Trạng thái |
| --- | --- | --- | --- |
| **1.0** | **Khởi tạo và thiết kế** | | |
| 1.1 | Rà soát PRD, chốt phạm vi MVP, phân công | PRD v2 | Xong |
| 1.2 | Kiến trúc hệ thống FE–BE–AI | `ARCHITECTURE.md` (cần cập nhật theo v2) | Cần cập nhật |
| 1.3 | Thiết kế CSDL | `database.mmd`, sau đó DDL/migration | ERD xong, DDL chưa |
| 1.4 | Prototype giao diện các cổng | Frontend React | Có, cần dọn (mục 3.4) |
| 1.5 | Docker Compose, CI | Pipeline chạy được | Xong |
| 1.6 | Layout, routing, thư viện component dùng chung | Design system | Có |
| 1.7 | Đặc tả use case | 3 file `.docx` | Xong |
| 1.8 | Sơ đồ trạng thái cho 6 đối tượng (hồ sơ gia sư, lớp cần gia sư, đơn ghép lớp, lớp học, phí, khiếu nại) | Tập sơ đồ, nội dung gốc ở PRD mục 5 | Chưa |
| 1.9 | Sơ đồ tuần tự cho 4 luồng: chọn gia sư và tạo đơn, chốt lịch cố định, soạn quiz với AI, trả lời câu quiz và cập nhật Elo | Tập sơ đồ | Chưa |
| **2.0** | **Nền tảng backend** | | |
| 2.1 | Migration DB (Flyway) từ ERD, dữ liệu mẫu | Schema chạy trong Docker | Chưa |
| 2.2 | Đăng nhập JWT, đổi mật khẩu lần đầu, phân quyền vai trò và quan hệ lớp học (FR-05, FR-06) | API Auth, middleware | Chưa |
| 2.3 | Audit log (ghi ngầm), thông báo, tải tệp lên S3 | Dịch vụ dùng chung | Chưa |
| **3.0** | **Cổng công khai (Phụ huynh)** | | |
| 3.1 | Tìm kiếm và xem hồ sơ gia sư (FR-01, FR-02) | API và giao diện | Chưa |
| 3.2 | Đăng ký gia sư chỉ định, gửi yêu cầu tìm gia sư (FR-03, FR-04) | API và giao diện | Chưa |
| **4.0** | **Cổng Lễ tân và Admin** | | |
| 4.1 | Dashboard lễ tân (FR-24) | API và giao diện | Chưa |
| 4.2 | Duyệt hồ sơ gia sư, quản lý gia sư (FR-31, FR-32) | API và giao diện | Chưa |
| 4.3 | Lớp cần gia sư: tạo, chọn gia sư, hủy (FR-25 đến FR-27) | API và giao diện | Chưa |
| 4.4 | Đơn ghép lớp: tạo, duyệt, hủy (FR-28 đến FR-30) | API và giao diện | Chưa |
| 4.5 | Duyệt phí QR Proof, phí bằng 35 - 40% học phí tháng đầu (FR-33) | API và giao diện | Chưa |
| 4.6 | Quản lý học sinh (FR-34) | API và giao diện | Chưa |
| 4.7 | Khiếu nại: tạo, xem và sửa, giải quyết (FR-35 đến FR-37) | API và giao diện | Chưa |
| 4.8 | *(S)* Admin: quản lý và thêm lễ tân (FR-38, FR-39) | API và giao diện | Chưa |
| **5.0** | **Cổng Gia sư** | | |
| 5.1 | Hồ sơ 5 bước, tải chứng chỉ và video (FR-07) | API và giao diện | Chưa |
| 5.2 | Ứng tuyển lớp, lịch dạy thử, chốt lịch cố định, kiểm tra trùng ca (FR-08 đến FR-10) | API và giao diện | Chưa |
| 5.3 | Lịch dạy, khởi tạo buổi học, tài liệu, nhật ký dạy học (FR-11, FR-12) | API và giao diện | Chưa |
| 5.4 | Nộp minh chứng phí (FR-15) | API và giao diện | Chưa |
| **6.0** | **Cổng Học sinh** | | |
| 6.1 | Dashboard, lịch học, chi tiết buổi, tài liệu (FR-17, FR-19 đến FR-21) | API và giao diện | Chưa |
| 6.2 | Làm quiz từng câu, Elo, hồ sơ kỹ năng, danh sách ôn tập (FR-22) | Engine Elo, API, giao diện | Chưa |
| 6.3 | Thông báo (FR-23) | API và giao diện | Chưa |
| 6.4 | *(S)* Hồ sơ cá nhân, xem gia sư (FR-16, FR-18) | API và giao diện | Chưa |
| **7.0** | **AI Service** | | |
| 7.1 | Thiết kế luồng LangGraph: nhận yêu cầu, ngữ cảnh kỹ năng học sinh, sinh câu hỏi, kiểm định đầu ra | Kiến trúc agent | Chưa |
| 7.2 | Endpoint chat sinh quiz (FR-13), giới hạn 60 giây và thử lại | API AI | Chưa |
| 7.3 | Prompt mẫu cho import và parser kiểm định JSON, báo lỗi theo câu (FR-14) | Module parse | Chưa |
| 7.4 | Kiểm duyệt nội dung, ẩn danh dữ liệu đầu vào, giới hạn chi phí | Middleware | Chưa |
| 7.5 | Màn hình soạn quiz chia đôi, ngăn kéo hồ sơ kỹ năng (phía giao diện của FR-13, FR-14) | Giao diện | Chưa |
| **8.0** | **Tích hợp và kiểm thử** | | |
| 8.1 | Nối frontend với API thật cho 4 cổng, gỡ dữ liệu giả, dọn trang thừa | Luồng liên thông | Chưa |
| 8.2 | Kiểm thử đơn vị và tích hợp: phân quyền, kiểm tra trùng ca, Elo, trạng thái đơn và lớp, parser import | Test suite | Chưa |
| 8.3 | UAT nội bộ theo 6 hành trình UJ-1 đến UJ-6, sửa lỗi | Danh sách lỗi đã xử lý | Chưa |
| **9.0** | **Triển khai và bàn giao** | | |
| 9.1 | Đóng gói Docker, triển khai môi trường demo | Hệ thống chạy online | Chưa |
| 9.2 | README, tài liệu API, hướng dẫn sử dụng, cập nhật ARCHITECTURE | Tài liệu bàn giao | Chưa |
| 9.3 | Chuẩn bị demo và bàn giao | Buổi báo cáo | Chưa |

# 5. Lịch triển khai 10 tuần

## 5.1. Giai đoạn 1 (tuần 1–5, 07/09 – 11/10): Phân tích, thiết kế, prototype

| Tuần | Thời gian | Nội dung | Kết quả |
| --- | --- | --- | --- |
| 1 | 07/09 – 13/09 | Rà soát PRD, kiến trúc, dựng khung Docker/CI, prototype ban đầu | Hoàn thành |
| 2 | 14/09 – 20/09 | Layout chung, routing, component dùng chung, viết use case | Hoàn thành |
| 3 | 21/09 – 27/09 | Prototype các cổng, tiếp tục use case | Hoàn thành |
| 4 | 28/09 – 04/10 | Hoàn thiện prototype, rà lại phạm vi | Hoàn thành |
| 5 | 05/10 – 11/10 | Viết lại use case theo vận hành thực tế (gộp Lễ tân và Admin một file), ERD v1, PRD v2 và kế hoạch v2 | Hoàn thành |

**Chưa làm được và dồn sang tuần 6:** DDL/migration, sơ đồ trạng thái và tuần tự, backend nghiệp vụ.

## 5.2. Giai đoạn 2 (tuần 6–10, 12/10 – 15/11): Phát triển, tích hợp, bàn giao

| Tuần | Thời gian | Mã WBS | Trọng tâm | Công việc cụ thể | Kết quả cuối tuần |
| --- | --- | --- | --- | --- | --- |
| 6 | 12/10 – 18/10 | 1.8, 1.9, 2.1, 2.2, 2.3, 3.1, 4.1, 4.2, 5.1 | Nền tảng và hồ sơ gia sư | Migration từ ERD. Đăng nhập JWT và phân quyền. Audit log, thông báo, tải tệp. Hồ sơ gia sư 5 bước, lễ tân duyệt hồ sơ, trang tìm gia sư công khai. Vẽ sơ đồ trạng thái | Gia sư đăng ký, gửi duyệt, lễ tân duyệt, phụ huynh tìm và xem được hồ sơ bằng dữ liệu thật. **M1** |
| 7 | 19/10 – 25/10 | 3.2, 4.3, 4.4, 5.2, 4.5, 5.4 | Luồng ghép lớp và lịch | Form tìm gia sư và đăng ký chỉ định. Lớp cần gia sư: tạo, ứng tuyển, chọn. Đơn ghép lớp: tạo, duyệt, hủy. Lịch dạy thử, chốt lịch cố định, kiểm tra trùng ca. Nộp và duyệt minh chứng phí | Chạy trọn UJ-1 và UJ-2 đến khi lớp ACTIVE và phí được duyệt. **M2** |
| 8 | 26/10 – 01/11 | 5.3, 6.1, 6.2, 6.3, 7.1 → 7.5 | Buổi học, quiz, Elo, AI | Lịch dạy, khởi tạo buổi, tài liệu, nhật ký. Dashboard, lịch và chi tiết buổi của học sinh. Làm quiz từng câu với Elo và danh sách ôn tập. AI Service: chat sinh quiz, import, kiểm định. Màn hình soạn quiz | Chạy trọn UJ-3 và UJ-4 (gia sư giao quiz, học sinh làm, Elo cập nhật, phụ huynh xem bằng tài khoản con). **M3** |
| 9 | 02/11 – 08/11 | 4.6, 4.7, 4.8, 6.4, 8.1, 8.2 | Khiếu nại, quản lý, tích hợp | Quản lý học sinh. Khiếu nại 3 bước. Nếu kịp: quản lý lễ tân, hồ sơ cá nhân và xem gia sư của học sinh. Nối nốt frontend vào API thật, dọn trang thừa. Kiểm thử đơn vị và tích hợp | Cả 4 cổng chạy bằng dữ liệu thật, UJ-5 chạy được. **M4** |
| 10 | 09/11 – 15/11 | 8.3, 9.1, 9.2, 9.3 | Kiểm thử, triển khai, bàn giao | UAT 6 hành trình, sửa lỗi. Đóng băng tính năng từ đầu tuần. Triển khai demo, README, tài liệu API, hướng dẫn sử dụng, cập nhật ARCHITECTURE. Chuẩn bị demo | Hệ thống demo ổn định, tài liệu đủ, sẵn sàng bàn giao. **M5** |

**Phân công gợi ý cho 3 thành viên** (chia theo cổng để giảm xung đột code, có thể đổi):

| Thành viên | Phụ trách chính | Hỗ trợ |
| --- | --- | --- |
| A | Nền tảng (auth, DB, audit, thông báo, tệp), cổng Lễ tân và Admin | Tích hợp, CI |
| B | Cổng Gia sư (hồ sơ, lịch, buổi học), cổng công khai | Kiểm thử |
| C | Cổng Học sinh, quiz, Elo, AI Service | Tài liệu, demo |

# 6. Cột mốc

| Mốc | Thời điểm | Tiêu chí hoàn thành |
| --- | --- | --- |
| **M0 — Hoàn tất phân tích** | 11/10 (đã xong) | Use case, ERD, PRD v2, kế hoạch v2 |
| **M1 — Nền tảng và hồ sơ gia sư** | Cuối tuần 6 (18/10) | Migration, đăng nhập JWT, phân quyền; gia sư đăng ký và được duyệt; phụ huynh tìm thấy gia sư |
| **M2 — Luồng ghép lớp** | Cuối tuần 7 (25/10) | Từ yêu cầu của phụ huynh đến lớp ACTIVE và phí nhận lớp được duyệt, trên dữ liệu thật |
| **M3 — Dạy và học** | Cuối tuần 8 (01/11) | Nhật ký buổi học, quiz AI và import, học sinh làm quiz, Elo cập nhật |
| **M4 — Liên thông 4 cổng** | Cuối tuần 9 (08/11) | Khiếu nại, quản lý học sinh; không còn dữ liệu giả; test đơn vị và tích hợp pass |
| **M5 — Demo và bàn giao** | Cuối tuần 10 (15/11) | UAT xong, triển khai demo, tài liệu đầy đủ |

# 7. Kiểm thử và tiêu chí hoàn thành

- **Đơn vị và tích hợp** (ưu tiên): phân quyền theo vai trò và quan hệ lớp học (chỉ Admin quản lý lễ tân); kiểm tra trùng ca; chuyển trạng thái đơn, lớp, phí, khiếu nại; tính phí 35 - 40% học phí tháng đầu; Elo; quy tắc quiz (khóa đáp án, hết hạn, làm dở); parser import.
- **UAT**: thực hiện đủ 6 hành trình UJ-1 đến UJ-6 trong `prd.md` bằng tài khoản thật của từng vai trò.
- **Definition of Done** (theo `GIT_CONVENTION.md`): chạy ổn ở local, `docker compose up --build` không lỗi, CI pass 100%, có ít nhất 1 người duyệt PR.

# 8. Rủi ro và phương án

| Rủi ro | Mức | Ảnh hưởng | Phương án |
| --- | --- | --- | --- |
| Backend chưa có nghiệp vụ nào, còn 5 tuần cho 39 FR | Cao | Trễ toàn bộ | Làm lát dọc theo mức bắt buộc; cắt 4 mục S trước; dừng thêm tính năng từ đầu tuần 10 |
| Quyết định tạm (QĐ-1, QĐ-4, QĐ-5) bị đổi giữa chừng làm đổi thiết kế DB | Trung bình | Phải sửa migration và API | Chốt trong tuần 6. Mặc định tạm: hồ sơ kỹ năng theo học sinh, tỷ lệ phí do lễ tân chọn theo từng lớp trong khoảng 0,35 - 0,40, mặc định 0,40 |
| Prototype frontend theo thiết kế cũ lệch use case (khung chương trình, SM-2, báo cáo) | Trung bình | Làm lại giao diện | Dọn theo mục 3.4, đối chiếu từng trang ở đầu mỗi lát, không đầu tư thêm cho trang ngoài phạm vi |
| Chất lượng quiz AI chưa đạt (sai đáp án, sai CEFR) | Trung bình | Gia sư phải sửa nhiều | Bắt buộc xem và sửa trước khi giao; kiểm định cấu trúc; có đường import làm dự phòng; tinh chỉnh prompt ở tuần 8 |
| AI chậm hoặc lỗi kết nối | Trung bình | Gián đoạn soạn quiz | Giới hạn 60 giây, nút thử lại, import là đường thay thế |
| Phụ thuộc lẫn nhau giữa FE, BE, AI | Trung bình | Chờ nhau | OpenAPI viết đầu mỗi tuần, AI Service có dữ liệu mock để frontend làm trước |
| Tải tệp (chứng chỉ, video, tài liệu, minh chứng) phát sinh nhiều lỗi biên | Thấp | Tốn thời gian | Một dịch vụ tải tệp dùng chung từ tuần 6, kiểm tra định dạng và dung lượng ở một chỗ |
| Một người nghỉ hoặc quá tải | Thấp | Mất tiến độ cổng đó | Chia theo cổng, mỗi cổng có người hỗ trợ |

---

*Kế hoạch v2.1 cập nhật ngày 11/10/2026 theo PRD v2 và bộ use case trong `docs/Usecase/`. Cập nhật lại sau mỗi cột mốc.*
