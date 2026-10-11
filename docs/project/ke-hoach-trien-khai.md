---
title: Kế hoạch triển khai đề tài — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
version: 2.2
ngày lập: 2026-09-04
cập nhật: 2026-10-11
ngày bắt đầu: 2026-09-07
ngày kết thúc: 2026-11-15
nhóm: 3 thành viên
thời lượng: 10 tuần
tài liệu liên quan: prd.md, mo_ta_de_tai.md, ARCHITECTURE.md, ../database.mmd, ../use-case-specification-document/
---
# 1. Tóm tắt

Nền tảng Web single-tenant cho trung tâm gia sư tiếng Anh 1-1: số hóa quy trình ghép lớp, thu phí nhận lớp, khiếu nại; hỗ trợ gia sư soạn quiz bằng AI; học sinh làm quiz với phản hồi tức thì và điểm Elo. Chi tiết xem `prd.md`.

**Cập nhật kế hoạch tại mốc tuần 6 (11/10/2026):** Hiện tại nhóm **mới hoàn thành việc viết và chốt tài liệu Đặc tả Use Case**. Khối lượng công việc kỹ thuật thực tế (ERD hoàn chỉnh, DDL/migration CSDL, toàn bộ backend nghiệp vụ, tích hợp AI và kết nối frontend) cần được tập trung cao độ triển khai trong 5 tuần còn lại (tuần 6 đến tuần 10).

## 1.1. Kiến trúc công nghệ

| Thành phần      | Công nghệ                        | Vai trò                                                                           |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Frontend          | React 19, Vite, Tailwind CSS v4    | 4 cổng: công khai (phụ huynh), Gia sư, Học sinh, Lễ tân/Admin               |
| Backend           | Java 17, Spring Boot 3.2, JPA, JWT | Cổng API duy nhất, nghiệp vụ, phân quyền, ghi audit log                      |
| AI Service        | Python 3.11, FastAPI, LangGraph    | Sinh quiz theo hội thoại, parser và kiểm định import, kiểm duyệt nội dung |
| Cơ sở dữ liệu | PostgreSQL 16                      | Thiết kế tại`docs/database.mmd`                                               |
| Lưu trữ file    | Tương thích S3                  | Chứng chỉ, tài liệu, minh chứng                                               |
| Hạ tầng         | Docker Compose, GitHub Actions     | Chạy local, CI                                                                    |

# 2. Hiện trạng (tính đến 11/10/2026)

| Hạng mục                             | Trạng thái                        | Ghi chú                                                                                                                           |
| -------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Đặc tả use case**           | **Đã hoàn thành**         | Đã hoàn thành viết tài liệu đặc tả use case chi tiết, chuẩn hóa các luồng nghiệp vụ chính, thay thế, ngoại lệ |
| Thiết kế CSDL (ERD)                  | Mới có phác thảo ban đầu      | Bản phác thảo`docs/database.mmd`, cần nhóm rà soát chốt lại bám sát use case                                          |
| DDL & Migration DB                     | Chưa có                           | `init.sql` mới bật extension, chưa có bảng và dữ liệu mẫu                                                               |
| Sơ đồ UML (trạng thái, tuần tự) | Chưa có                           | Cần vẽ sơ đồ trạng thái các thực thể chính và sơ đồ tuần tự các luồng cốt lõi                                 |
| Tài liệu PRD, Kiến trúc            | Bản dự thảo v2                   | Cần cập nhật đồng bộ theo bộ use case vừa hoàn tất                                                                       |
| Docker Compose, CI                     | Khung cơ bản                      | `docker compose up --build` chạy được các service rỗng                                                                     |
| Frontend                               | Prototype giao diện cũ, mock data | Giao diện prototype cần dọn dẹp các trang ngoài phạm vi use case, chưa nối API                                            |
| Backend                                | **Mới có khung rỗng**      | Mới có`HealthController` và cấu hình kết nối DB, chưa có Entity, Repository, Service, Auth JWT                          |
| AI Service                             | **Mới có khung rỗng**      | FastAPI với endpoint`/health`, chưa có logic sinh quiz hay LangGraph                                                          |

**Đánh giá thực tế:**

- Nhóm đã hoàn thành xong mốc nền móng quan trọng nhất về phân tích nghiệp vụ: **Đặc tả Use Case**.
- Còn đúng **5 tuần** để biến toàn bộ use case thành hệ thống chạy thực tế (DB, Backend Spring Boot, Frontend React, AI Service FastAPI).
- Chiến lược bắt buộc: Triển khai theo **lát cắt dọc (vertical slice)**, ưu tiên tuyệt đối cho các yêu cầu bắt buộc (Must-have, 35 FRs), cắt giảm triệt để các tính năng rườm rà ngoài use case.

# 3. Phạm vi và nguyên tắc triển khai

## 3.1. Trong phạm vi

Toàn bộ 39 FR ở `prd.md` bám sát tài liệu đặc tả use case:

- **Bắt buộc (M), 35 FR:** luồng cốt lõi chạy được từ đầu đến cuối: yêu cầu của phụ huynh → ghép lớp → dạy thử → chốt lịch → buổi học và nhật ký → quiz và Elo → duyệt phí → khiếu nại.
- **Nên có (S), 4 FR:** hồ sơ cá nhân học sinh (FR-16), xem gia sư của học sinh (FR-18), quản lý nhân sự lễ tân và thêm lễ tân (FR-38, FR-39) — chỉ làm nếu còn thời gian.

## 3.2. Ngoài phạm vi

Không có trong use case nên không làm: báo cáo doanh thu phức tạp, xem audit log trên giao diện, đối soát tài chính ngân hàng tự động, tạo tài khoản học sinh tự do từ giao diện, tài khoản phụ huynh riêng, thuật toán SM-2 phức tạp, dạng bài tự luận, thanh toán tự động, phòng học trực tuyến tích hợp.

## 3.3. Nguyên tắc

1. **Làm lát dọc**: Mỗi tính năng hoàn thành trọn vẹn từ DB schema → API backend → giao diện frontend → kiểm thử trước khi sang tính năng kế tiếp.
2. **Kế thừa prototype frontend**: Giữ khung layout hiện có, dọn dẹp các trang dư thừa, thay dần mock data bằng API thật theo từng lát cắt.
3. **Chốt contract API trước**: Viết OpenAPI/endpoint contract ở đầu mỗi lát cắt để FE và BE làm việc song song, tránh chờ đợi.
4. **Quy ước Git**: Nhánh `feature/*` tách từ `dev`, PR có ít nhất 1 thành viên review và CI xanh trước khi merge.

## 3.4. Dọn dẹp Frontend (theo Use Case)

Dọn khỏi routing/menu các trang cũ nằm ngoài use case:

- Admin: Bỏ `AdminAnalytics`, `AdminLogs`.
- Học sinh: Bỏ `SpacedRepetitionSession`, `StudentChat`, `StudentMarketplace`, `StudentOnboarding`, `StudentProgress`.
- Gia sư: Bỏ nhóm `Library*`, `manage/ManageLearningPath*`, `ExerciseGenerator` cũ.
- Phụ huynh: Bỏ `ParentLearningProgress`, `guest/ParentProgressViewPage` riêng (phụ huynh theo dõi qua tài khoản con).
- Gộp trang Admin và Lễ tân dùng chung bộ component nghiệp vụ (ghép lớp, duyệt phí, khiếu nại, danh sách).

# 4. WBS — Work Breakdown Structure

| Mã           | Hạng mục                                                                                                         | Đầu ra chính                            | Trạng thái      |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------- |
| **1.0** | **Khởi tạo và Phân tích thiết kế**                                                                    |                                            |                   |
| 1.1           | Đặc tả trường hợp sử dụng (Use Case Specification)                                                         | Tài liệu đặc tả use case hoàn chỉnh | **Xong**    |
| 1.2           | Rà soát PRD và chốt phạm vi MVP theo Use Case                                                                 | PRD v2 chuẩn hóa                         | Hoàn thành      |
| 1.3           | Thiết kế CSDL chi tiết (ERD) & DDL/Migration                                                                    | ERD chốt bám use case, file DDL/Flyway   | Đang thực hiện |
| 1.4           | Sơ đồ trạng thái UML (Hồ sơ GS, Lớp học, Đơn ghép, Phí, Khiếu nại)                                  | Bộ sơ đồ State Machine                 | Chưa làm        |
| 1.5           | Sơ đồ tuần tự UML cho các luồng cốt lõi                                                                   | Bộ sơ đồ Sequence Diagram              | Chưa làm        |
| 1.6           | Hạ tầng Docker Compose & CI cơ bản                                                                             | Docker running, CI pipeline                | Xong              |
| **2.0** | **Nền tảng Backend & Cơ sở dữ liệu**                                                                   |                                            |                   |
| 2.1           | Migration DB (Flyway/DDL) và dữ liệu mẫu (Seed Data)                                                           | Database schema chạy trong Docker         | Chưa làm        |
| 2.2           | Module Auth: Đăng nhập JWT, đổi mật khẩu, phân quyền RBAC (FR-05, FR-06)                                  | API Auth, Security filter                  | Chưa làm        |
| 2.3           | Dịch vụ dùng chung: Lưu trữ file S3/MinIO, Audit Log, Thông báo                                             | Service upload & audit                     | Chưa làm        |
| **3.0** | **Lát cắt 1: Quản lý Hồ sơ Gia sư & Cổng Công khai**                                                |                                            |                   |
| 3.1           | Khách/Phụ huynh: Tìm kiếm & xem hồ sơ gia sư (FR-01, FR-02)                                                 | API & UI tìm kiếm gia sư                | Chưa làm        |
| 3.2           | Gia sư: Thiết lập hồ sơ 5 bước, tải chứng chỉ, video, bảng giá (FR-07)                                 | API & UI hồ sơ gia sư                   | Chưa làm        |
| 3.3           | Lễ tân/Admin: Duyệt/Từ chối hồ sơ gia sư (FR-31, FR-32)                                                    | API & UI duyệt hồ sơ                    | Chưa làm        |
| **4.0** | **Lát cắt 2: Luồng Ghép lớp, Xếp lịch & Duyệt phí**                                                 |                                            |                   |
| 4.1           | Phụ huynh: Gửi yêu cầu tìm gia sư & Đăng ký chỉ định (FR-03, FR-04)                                    | API & UI đăng ký                        | Chưa làm        |
| 4.2           | Lễ tân: Quản lý Lớp cần gia sư, Đơn ghép lớp (FR-25 → FR-30)                                           | API & UI ghép lớp                        | Chưa làm        |
| 4.3           | Gia sư: Ứng tuyển lớp, Lịch dạy thử, Chốt lịch cố định (FR-08 → FR-10)                                | API & UI lịch và nhận lớp              | Chưa làm        |
| 4.4           | Gia sư & Lễ tân: Nộp và duyệt minh chứng phí nhận lớp (FR-15, FR-33)                                     | API & UI quản lý phí                    | Chưa làm        |
| **5.0** | **Lát cắt 3: Vận hành Buổi học, Trợ lý AI & Quiz**                                                   |                                            |                   |
| 5.1           | Gia sư & Học sinh: Lịch dạy, khởi tạo buổi học, nhật ký buổi học (FR-11, FR-12, FR-17, FR-19 → FR-21) | API & UI buổi học & nhật ký            | Chưa làm        |
| 5.2           | AI Service: Endpoint chat sinh quiz theo CEFR & Prompt import kiểm định JSON (FR-13, FR-14)                     | FastAPI service chạy thật                | Chưa làm        |
| 5.3           | Gia sư: Không gian soạn quiz chia đôi kết hợp AI và xem hồ sơ kỹ năng học sinh (FR-13, FR-14)         | UI soạn quiz tích hợp AI                | Chưa làm        |
| 5.4           | Học sinh: Làm quiz từng câu, chấm điểm tức thì, cập nhật Elo và ôn tập (FR-22)                       | Engine tính Elo, API & UI làm quiz       | Chưa làm        |
| **6.0** | **Lát cắt 4: Quản lý Vận hành, Khiếu nại & Hoàn thiện**                                            |                                            |                   |
| 6.1           | Lễ tân/Admin: Quản lý học sinh, tiếp nhận và xử lý khiếu nại (FR-34 → FR-37)                          | API & UI khiếu nại                       | Chưa làm        |
| 6.2           | Dọn dẹp triệt để frontend, thay 100% dữ liệu mock bằng API thật                                           | Giao diện 4 cổng liên thông            | Chưa làm        |
| 6.3           | *(S)* Admin: Quản lý lễ tân; Học sinh: Hồ sơ cá nhân (FR-16, FR-18, FR-38, FR-39)                       | Tính năng phụ (nếu kịp)               | Chưa làm        |
| **7.0** | **Tích hợp, Kiểm thử & Đóng gói Bàn giao**                                                           |                                            |                   |
| 7.1           | Unit test & Integration test cho các luồng nghiệp vụ cốt lõi                                                 | Test suite pass                            | Chưa làm        |
| 7.2           | UAT nội bộ theo các hành trình người dùng (UJ-1 đến UJ-6)                                                | Biên bản test & sửa bug                 | Chưa làm        |
| 7.3           | Đóng gói hệ thống Docker, tài liệu kỹ thuật & kịch bản báo cáo                                        | Tài liệu & Demo hoàn chỉnh             | Chưa làm        |

# 5. Lịch triển khai 10 tuần

## 5.1. Giai đoạn 1 (Tuần 1–5, 07/09 – 11/10): Khởi tạo, Khảo sát & Đặc tả Use Case

| Tuần | Thời gian     | Nội dung công việc thực tế                                                                                                             | Kết quả đạt được                   |
| ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1     | 07/09 – 13/09 | Khởi động dự án, nghiên cứu đề tài, dựng khung Docker Compose & repo                                                             | Hoàn thành                              |
| 2     | 14/09 – 20/09 | Xây dựng khung giao diện React prototype ban đầu, định hình các vai trò người dùng                                             | Hoàn thành                              |
| 3     | 21/09 – 27/09 | Bổ sung prototype các màn hình chức năng chính, khảo sát quy trình vận hành trung tâm                                          | Hoàn thành                              |
| 4     | 28/09 – 04/10 | Rà soát luồng thực tế, nhận diện các điểm bất cập trong thiết kế cũ, định hình lại phạm vi                              | Hoàn thành                              |
| 5     | 05/10 – 11/10 | **Tập trung viết và hoàn thiện tài liệu Đặc tả Use Case chi tiết**, chuẩn hóa các tác nhân và quy trình nghiệp vụ | **Hoàn thành Đặc tả Use Case** |

> **Hiện trạng chuyển giao sang tuần 6:** Đã có tài liệu Đặc tả Use Case chuẩn làm kim chỉ nam. Các phần thiết kế CSDL chi tiết, DDL/migration và toàn bộ backend nghiệp vụ được chuyển giao để thực hiện gấp rút từ đầu Tuần 6.

## 5.2. Giai đoạn 2 (Tuần 6–10, 12/10 – 15/11): Phát triển theo Lát cắt dọc, Tích hợp & Bàn giao

| Tuần        | Thời gian     | Trọng tâm WBS                        | Nội dung công việc chi tiết                                                                                                                                                                                                                                                                                                                                                                                             | Kết quả cuối tuần                                                                                                                          |
| ------------ | -------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **6**  | 12/10 – 18/10 | 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 | **Chốt CSDL, Backend nền tảng & Hồ sơ Gia sư**- Rà soát và chốt ERD bám use case, viết DDL/Flyway migration.- Xây dựng module Auth JWT, phân quyền Spring Security.- Dựng S3 file upload (chứng chỉ/video) và audit log.- CRUD Hồ sơ gia sư, Lễ tân duyệt hồ sơ, trang tìm kiếm gia sư công khai.- Vẽ sơ đồ trạng thái UML cho các thực thể chính.                          | Gia sư nộp hồ sơ, Lễ tân duyệt hồ sơ, Phụ huynh tìm được gia sư trên dữ liệu thật DB. (**M1**)                        |
| **7**  | 19/10 – 25/10 | 1.5, 4.1, 4.2, 4.3, 4.4                | **Luồng Ghép lớp, Lịch dạy & Thu phí**- Form gửi yêu cầu tìm gia sư và đăng ký chỉ định.- Nghiệp vụ Lớp cần gia sư (tạo, ứng tuyển, chọn gia sư).- Nghiệp vụ Đơn ghép lớp (tạo, duyệt, hủy).- Xếp lịch dạy thử, chốt lịch cố định, kiểm tra trùng ca dạy.- Nộp minh chứng và Lễ tân duyệt phí nhận lớp (35–40%).                                           | Chạy thông suốt luồng từ Phụ huynh đăng ký → Ghép lớp → Dạy thử → Chốt lịch cố định → Nộp & duyệt phí. (**M2**) |
| **8**  | 26/10 – 01/11 | 5.1, 5.2, 5.3, 5.4                     | **Buổi học, AI Service & Quiz cá nhân hóa**- Quản lý buổi học, khởi tạo ca, nhật ký dạy học và tài liệu.- Xây dựng AI Service FastAPI: endpoint chat sinh quiz theo CEFR, parser kiểm định JSON import.- UI soạn quiz chia đôi tích hợp AI chatbot và xem hồ sơ kỹ năng.- Học sinh làm quiz từng câu, chấm điểm tức thì, cập nhật điểm Elo và danh sách ôn tập.     | Hoàn thành luồng giảng dạy: Gia sư soạn quiz qua AI/import, giao bài, Học sinh làm bài, Elo tự cập nhật. (**M3**)          |
| **9**  | 02/11 – 08/11 | 6.1, 6.2, 6.3, 7.1                     | **Quản lý Khiếu nại, Dọn Frontend & Tích hợp 4 cổng**- Tiếp nhận và xử lý khiếu nại (Đổi gia sư / Hoàn phí).- Quản lý danh sách học sinh.- Dọn dẹp triệt để các trang thừa trên frontend, thay thế toàn bộ mock data bằng API thật.- Viết test nghiệp vụ quan trọng (phân quyền, trùng ca, tính phí, Elo).- *(Nếu còn thời gian)*: Làm 4 tính năng Should-have. | Hệ thống liên thông 4 cổng trên dữ liệu thật, không còn mock data. Kiểm thử tích hợp pass. (**M4**)                       |
| **10** | 09/11 – 15/11 | 7.2, 7.3                               | **Kiểm thử UAT, Đóng gói Docker & Bàn giao**- Đóng băng toàn bộ tính năng từ đầu tuần.- UAT nội bộ theo các kịch bản người dùng UJ-1 đến UJ-6, sửa lỗi tồn đọng.- Đóng gói Docker Compose production ổn định.- Hoàn thiện tài liệu kỹ thuật, hướng dẫn sử dụng, slide và kịch bản demo đề tài.                                                                 | Hệ thống chạy demo ổn định, tài liệu hoàn chỉnh, sẵn sàng báo cáo tốt nghiệp. (**M5**)                                   |

## 5.3. Phân công trách nhiệm 3 thành viên

| Thành viên             | Trách nhiệm chính                                                                                                                                  | Trách nhiệm phối hợp                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Thành viên A** | **Backend nền tảng, CSDL & Cổng Admin/Lễ tân**: Thiết kế CSDL/Migration, Auth JWT, API ghép lớp, duyệt phí, khiếu nại              | Hỗ trợ cấu hình Docker, CI/CD           |
| **Thành viên B** | **Cổng Gia sư & Cổng Công khai**: Hồ sơ gia sư 5 bước, lịch dạy thử/cố định, nhật ký buổi học, giao diện tìm kiếm gia sư | Hỗ trợ kiểm thử tích hợp UI–BE       |
| **Thành viên C** | **Cổng Học sinh & AI Service**: Xây dựng AI Service (FastAPI sinh quiz/import), làm quiz, thuật toán tính điểm Elo, UI học sinh      | Soạn tài liệu bàn giao, kịch bản demo |

# 6. Các cột mốc (Milestones)

| Mốc                                                       | Thời điểm                 | Tiêu chí hoàn thành thực tế                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M0 — Hoàn tất Đặc tả Use Case**              | 11/10 (Hiện tại đã xong) | Tài liệu Đặc tả Use Case chi tiết được phê duyệt, làm căn cứ kỹ thuật duy nhất cho toàn bộ hệ thống                                                       |
| **M1 — Nền tảng CSDL, Auth & Hồ sơ Gia sư**    | Cuối tuần 6 (18/10)        | DDL/Flyway migration chạy trong Docker; Đăng nhập JWT & phân quyền; Gia sư tạo và gửi duyệt hồ sơ, Lễ tân duyệt hồ sơ, Phụ huynh xem hồ sơ trên DB thật |
| **M2 — Luồng Ghép lớp, Lịch & Thu phí**        | Cuối tuần 7 (25/10)        | Luồng ghép lớp vận hành từ yêu cầu phụ huynh đến lớp chuyển ACTIVE và phí nhận lớp được phê duyệt trên dữ liệu thật                                  |
| **M3 — Vận hành Giảng dạy & AI Quiz**           | Cuối tuần 8 (01/11)        | Gia sư quản lý buổi học & soạn quiz với AI; Học sinh làm quiz, chấm tự động, cập nhật Elo                                                                       |
| **M4 — Liên thông 4 cổng & Xử lý Khiếu nại** | Cuối tuần 9 (08/11)        | Giải quyết khiếu nại, quản lý học sinh; dọn dẹp xong frontend; liên thông toàn bộ 4 cổng bằng API thật                                                         |
| **M5 — Demo & Đóng gói Bàn giao**               | Cuối tuần 10 (15/11)       | UAT đạt yêu cầu; Docker chạy thông suốt; tài liệu báo cáo và kịch bản demo sẵn sàng                                                                            |

# 7. Quản lý rủi ro & Phương án xử lý

| Rủi ro                                                                     | Mức độ             | Biện pháp giảm thiểu                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend mới ở mức khung rỗng, khối lượng 5 tuần còn lại rất lớn | **Rất cao**    | - Bám sát Use Case làm lát cắt dọc, không xây dựng dư thừa.- Cắt bỏ hoàn toàn 4 tính năng Should-have nếu tuần 8 chưa kịp tiến độ.- Tái sử dụng tối đa thư viện và UI component sẵn có từ prototype. |
| Thiết kế CSDL (ERD) bị thay đổi làm ảnh hưởng API                  | **Cao**         | Chốt dứt điểm ERD và DDL trong 2 ngày đầu Tuần 6 (12/10 - 13/10) trước khi code các module nghiệp vụ.                                                                                                                     |
| AI Service sinh quiz chậm hoặc vượt giới hạn token                    | **Trung bình** | - Đặt timeout 60s và cơ chế retry ở client.- Tính năng Import Quiz ngoài (Prompt template + JSON validate) đóng vai trò phương án dự phòng 0-token.                                                                    |
| Sai lệch giữa Frontend prototype và Backend API                          | **Trung bình** | Thống nhất contract API (OpenAPI/DTO mẫu) đầu mỗi tuần trước khi triển khai song song.                                                                                                                                        |

---

*Kế hoạch triển khai phiên bản 2.2 — Cập nhật ngày 11/10/2026 sau khi nhóm hoàn thành tài liệu Đặc tả Use Case.*
