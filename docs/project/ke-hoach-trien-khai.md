---
title: Kế hoạch triển khai đề tài — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
version: 3.0
ngày lập: 2026-09-04
cập nhật: 2026-11-22
ngày bắt đầu: 2026-09-07
ngày kết thúc: 2026-12-13
nhóm: 3 thành viên
thời lượng: 14 tuần (11 tuần kế hoạch gốc + 3 tuần bổ sung: tuần 12–14)
tài liệu liên quan: prd.md, mo_ta_de_tai.md, ARCHITECTURE.md, ../database.mmd, ../Usecase/
---
# 1. Tóm tắt

Nền tảng Web single-tenant cho trung tâm gia sư tiếng Anh 1-1: số hóa quy trình ghép lớp, thu phí nhận lớp; hỗ trợ gia sư soạn quiz bằng AI; học sinh làm quiz với phản hồi tức thì và điểm Elo. Chi tiết xem `prd.md`.

**Cập nhật kế hoạch tại mốc tuần 6 (11/10/2026):** Hiện tại nhóm **mới hoàn thành việc viết và chốt tài liệu Đặc tả Use Case**. Khối lượng công việc kỹ thuật thực tế (ERD hoàn chỉnh, DDL/migration CSDL, toàn bộ backend nghiệp vụ, tích hợp AI và kết nối frontend) cần được tập trung cao độ triển khai trong 5 tuần còn lại (tuần 6 đến tuần 10).

**Cập nhật kế hoạch tại mốc tuần 9 (08/11/2026):** M1–M2 đã đạt. **M3 chỉ đạt một phần**: AI Service đã chạy LLM thật, học sinh làm quiz + Elo đã xong, nhưng **tính năng soạn quiz với AI của gia sư (FR-13, FR-14) và ôn tập ngắt quãng câu sai (5.4) chưa hoàn tất** → dồn sang tuần 10. Soạn quiz AI, ôn tập ngắt quãng và dọn dẹp frontend (6.2) dồn lại cho tuần 10, kiểm thử & đóng gói (7.2, 7.3) sang tuần 11 mới được bổ sung, **M3 chưa đạt (hoàn thành trong tuần 10) và M4 lùi nhẹ**.

**Bổ sung 1 tuần triển khai (22/11/2026):** Do khối lượng công việc dồn lại cho tuần cuối quá lớn (dọn mock + UAT + đóng gói), nhóm **bổ sung thêm tuần 11 (16/11 – 22/11)** chuyên cho kiểm thử, UAT và đóng gói bàn giao. **M5 được dời sang cuối tuần 11**, giữ nguyên tiêu chí hoàn thành. *(Cập nhật sau: khối lượng còn lại 9.1–9.3 chưa kịp trong tuần 11, kế hoạch kéo dài thêm 3 tuần: tuần 12–14 (23/11/2026 – 13/12/2026) — xem đoạn "Phân công công việc 3 tuần cuối".)*

**Cập nhật kế hoạch tại mốc tuần 11 (22/11/2026):** **M3 và M4 đã đạt** — ôn tập ngắt quãng hoàn chỉnh với bảng snapshot `review_cards` (V24), nhiều bộ thẻ `review_decks` (V26) và setting `student_settings` (V25); tính năng MSG (đăng nhập Google, nhắn tin, đề xuất lớp học) đã merge dev; gói lưu trữ gia sư (Storage Quota, V29) trên nhánh `feature/tutor-storage-quota`. **Tính năng khiếu nại (FR-34 → FR-37, WBS 6.1) được loại khỏi phạm vi còn lại** — module backend + 2 trang Admin/Lễ tân đã xây dựng và giữ nguyên trong codebase (không phải hạng mục phải hoàn thiện). **Công việc cần làm tiếp: (1) chỉnh lại nghiệp vụ luồng ghép lớp (message + proposal) để giảm tải thao tác cho trung tâm/trung gian, (2) thống kê chi phí token AI + chi phí lưu trữ (phục vụ báo cáo & vận hành), (3) hoàn thiện báo cáo đồ án.** Trùng số migration V29 giữa nhánh storage-quota và dev cần xử lý khi merge (đổi số hoặc rebase).

**Phân công công việc 3 tuần cuối (cập nhật 22/11/2026):** Công việc còn lại (WBS 9.1, 9.2, 9.3, 8.2) được **chia đều vào 3 tuần kế tiếp (tuần 12–14, 23/11 – 13/12/2026)**, ngày kết thúc là **13/12/2026** như đã định, không kéo dài thêm.

| Tuần | Thời gian | Nhiệm vụ chính | Kết quả cuối tuần |
|------|-----------|----------------|------------------|
| **Tuần 12** | 23/11 – 29/11 | (1) WBS 9.2: hoàn thiện tính phí lưu trữ + phí token AI (bảng thống kê số lần gọi, token vào/ra theo model, quota, dung lượng upload thực tế) — dùng cho mục chi phí của báo cáo đồ án.- (2) WBS 9.1: hoàn thiện luồng ghép lớp mới theo use case MSG (message + proposal) — Lễ tân chỉ duyệt tin đăng, phụ huynh & gia sư tự chốt qua chat + proposal. | Tính phí storage + token (9.2) hoàn chỉnh; luồng ghép lớp mới message + proposal (9.1) hoàn tất trên dữ liệu thật. |
| **Tuần 13** | 30/11 – 06/12 | (1) WBS 8.2 + 6.2 (nền cho kiểm thử): merge Storage Quota (xử lý trùng số V29), dọn mock các trang thừa (Library*, AdminLogs, ManageLearningPath...) — 4 cổng sạch mock.- (2) WBS 7.1: kiểm thử toàn diện (test cho 9.1, 9.2 và các luồng cốt lõi), sửa lỗi phát hiện.- (3) Cải thiện UI: rà soát & polish giao diện 4 cổng theo design system, thống nhất ngôn ngữ tiếng Việt, sửa trải nghiệm trước demo.- (4) Bắt đầu viết báo cáo đồ án (WBS 9.3): tài liệu kỹ thuật, chụp màn hình, kịch bản demo. | 8.2 merge dev (V30), 4 cổng sạch mock; test 9.1/9.2 + các luồng khác xanh, lỗi tồn đọng được sửa; UI được polish; phần lớn tài liệu kỹ thuật của 9.3 hoàn thành. |
| **Tuần 14** | 07/12 – 13/12 | (1) WBS 7.2: UAT nội bộ theo UJ-1 → UJ-6, sửa nốt lỗi tồn đọng.- (2) WBS 9.3: hoàn thiện báo cáo đồ án (tài liệu kỹ thuật, hướng dẫn sử dụng, slide, kịch bản demo).- (3) WBS 7.1: chạy xanh toàn bộ test suite, đóng băng tính năng.- (4) Rà soát demo cuối, đóng gói tài liệu bàn giao. | **M5 (13/12/2026):** Báo cáo đồ án hoàn chỉnh (slide, kịch bản demo, tài liệu kỹ thuật); UAT đạt, hệ thống chạy demo ổn định, sẵn sàng bàn giao. |

**M5 (demo + báo cáo đồ án) dời sang cuối tuần 14 (13/12/2026)** — giữ nguyên ngày kết thúc đã định trong frontmatter.

## 1.1. Kiến trúc công nghệ

| Thành phần      | Công nghệ                        | Vai trò                                                                           |
| ----------------- | ---------------------------------- | ---------------------------------------------------------------------------------- |
| Frontend          | React 19, Vite, Tailwind CSS v4    | 4 cổng: công khai (phụ huynh), Gia sư, Học sinh, Lễ tân/Admin               |
| Backend           | Java 17, Spring Boot 3.2, JPA, JWT | Cổng API duy nhất, nghiệp vụ, phân quyền, ghi audit log                      |
| AI Service        | Python 3.11, FastAPI, LangGraph    | Sinh quiz theo hội thoại, parser và kiểm định import, kiểm duyệt nội dung |
| Cơ sở dữ liệu | PostgreSQL 16                      | Thiết kế tại`docs/database.mmd`                                               |
| Lưu trữ file    | Tương thích S3                  | Chứng chỉ, tài liệu, minh chứng                                               |
| Hạ tầng         | Docker Compose, GitHub Actions     | Chạy local, CI                                                                    |

# 2. Hiện trạng (tính đến 22/11/2026)

| Hạng mục                             | Trạng thái                        | Ghi chú                                                                                                                           |
| -------------------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Đặc tả use case**           | **Đã hoàn thành**         | Tài liệu đặc tả use case chi tiết, chuẩn hóa các luồng nghiệp vụ chính, thay thế, ngoại lệ; bổ sung use case MSG (nhắn tin phụ huynh–gia sư) |
| Thiết kế CSDL (ERD)                  | Chốt & triển khai           | ERD bám use case, đã sinh bảng và dữ liệu mẫu qua migration |
| DDL & Migration DB                     | Chạy trong Docker            | Bộ migration Flyway (V1 → V29+) với bảng nghiệp vụ và seed data mẫu; V22 khiếu nại, V24–V26 ôn tập, V27–V28 MSG, V29 trùng số giữa nhánh storage-quota và dev |
| Sơ đồ UML (trạng thái, tuần tự) | Một phần                      | Sơ đồ trạng thái các thực thể chính; sơ đồ tuần tự quiz AI (`docs/project/diagrams/quiz-ai-authoring.md`); còn thiếu một số luồng |
| Tài liệu PRD, Kiến trúc            | Bản dự thảo v2                   | Đã cập nhật đồng bộ theo bộ use case vừa hoàn tất                                                                       |
| Docker Compose, CI                     | Chạy được                     | `docker compose up --build` chạy toàn bộ service, pipeline CI kèm test backend/frontend  |
| Frontend                               | Thay mock bằng API theo từng lát | Cổng Gia sư, Học sinh, Lễ tân đã nối API thật; một số trang thừa vẫn dùng mock data (Library*, AdminLogs, ManageLearningPath...) — còn dọn theo 3.4 |
| Backend                                | **Đã có module nghiệp vụ**  | Các module auth, tutor, matching, classroom, payment, quiz, student, staff, audit; Auth JWT + phân quyền |
| AI Service                             | **Chạy LLM thật**           | FastAPI hỗ trợ LLM native OpenAI/Anthropic, sinh quiz theo CEFR, parser & kiểm định JSON import |
| **Messaging (MSG)**                    | **Hoàn thành trên dev**       | Đăng nhập Google phụ huynh (V23), module nhắn tin phụ huynh–gia sư qua Rocket.Chat, đề xuất lớp học, đăng tin nhận lớp (V27, V28) |
| **Gói lưu trữ gia sư**               | **Trên nhánh feature**       | Storage quota (FREE/PRO/PREMIUM) theo tháng, `storage_tiers` + `tutor_storage_subscriptions`, chặn upload khi vượt quota, widget dashboard + modal admin (V29 trên nhánh; **chưa merge dev, cần xử lý trùng số V29**) |

**Đánh giá thực tế (cập nhật 22/11/2026):**

- **Đã đạt M1–M3**; M4 đạt về mặt liên thông 4 cổng (khiếu nại không còn là tiêu chí của M4).
- **Loại khỏi phạm vi còn lại:** tính năng khiếu nại (FR-34 → FR-37, WBS 6.1) — module backend + 2 trang Admin/Lễ tân đã hoàn thiện, giữ nguyên trong codebase, **không phải hạng mục phải hoàn thiện** trong giai đoạn cuối.
- **Công việc cần làm tiếp (UAT, đóng gói):**
  1. **Chỉnh lại nghiệp vụ luồng ghép lớp** (message + proposal) — giảm thao tác thủ công cho trung tâm/trung gian (Lễ tân/Admin) theo use case MSG.
  2. **Thống kê chi phí** — tính chi phí token AI và chi phí lưu trữ (phục vụ báo cáo đồ án & vận hành).
  3. **Hoàn thành báo cáo đồ án** — tài liệu kỹ thuật, hướng dẫn, slide và kịch bản demo.
- **Rủi ro cần xử lý ngay:** Trùng số migration **V29** — nhánh `feature/tutor-storage-quota` có `V29__tutor_storage_tier.sql` trong khi dev đã dùng `V29__parent_address_proposal_location.sql`. Khi merge, đổi số migration (V30) hoặc rebase trước.
- **Rủi ro còn lại:** Dọn mock triệt để trên các trang thừa (Library*, AdminLogs, ManageLearningPath...) — kiểm tra nhanh thấy vẫn import từ `data/mock`.
- **Tiến độ (22/11):** Các công việc trên (9.1, 9.2) đang thực hiện trong tuần 11, **chưa kịp hoàn tất** → kế hoạch kéo dài thêm 3 tuần (tuần 12–14, 23/11 – 13/12/2026), chia đều: tuần 12 hoàn thiện tính phí storage + token (9.2) + hoàn thiện luồng ghép lớp mới message + proposal (9.1); tuần 13 kiểm thử toàn diện + sửa lỗi + cải thiện UI (merge 8.2, dọn mock 6.2, test 7.1) + bắt đầu viết báo cáo (9.3); tuần 14 hoàn thiện báo cáo đồ án (9.3) + UAT (7.2) + demo.
- Chiến lược duy trì: Làm lát cắt dọc, ưu tiên Must-have; cắt khiếu nại khỏi hạng mục hoàn thiện; tuần 13 tập trung kiểm thử + sửa lỗi + cải thiện UI (nền 8.2, 6.2), tuần 14 ưu tiên hoàn tất 9.3 (báo cáo đồ án) + UAT trước demo. Nếu 9.1 chưa kịp, cắt gọn scope 9.1.

# 3. Phạm vi và nguyên tắc triển khai

## 3.1. Trong phạm vi

Toàn bộ 39 FR ở `prd.md` bám sát tài liệu đặc tả use case:

- **Bắt buộc (M), 35 FR:** luồng cốt lõi chạy được từ đầu đến cuối: yêu cầu của phụ huynh → ghép lớp → dạy thử → chốt lịch → buổi học và nhật ký → quiz và Elo → duyệt phí.
- **Nên có (S), 4 FR:** hồ sơ cá nhân học sinh (FR-16), xem gia sư của học sinh (FR-18), quản lý nhân sự lễ tân và thêm lễ tân (FR-38, FR-39) — chỉ làm nếu còn thời gian.
- **Mở rộng (tuần 10–11, ngoài 39 FR gốc):** tính năng MSG (đăng nhập Google phụ huynh, nhắn tin phụ huynh–gia sư, đề xuất lớp học, đăng tin nhận lớp) **thay thế FR-03, FR-04** theo `docs/Usecase/Usecase_Messaging_Parent_Tutor.md`; gói lưu trữ gia sư (Storage Quota FREE/PRO/PREMIUM).

## 3.2. Ngoài phạm vi

Không có trong use case nên không làm: báo cáo doanh thu phức tạp, xem audit log trên giao diện, đối soát tài chính ngân hàng tự động, tạo tài khoản học sinh tự do từ giao diện, tài khoản phụ huynh riêng, thuật toán SM-2 phức tạp, dạng bài tự luận, thanh toán tự động, phòng học trực tuyến tích hợp.

- **Xử lý khiếu nại (FR-34 → FR-37, WBS 6.1): loại khỏi phạm vi triển khai** — module backend + 2 trang Admin/Lễ tân đã hoàn thiện trên dev được giữ nguyên trong codebase như tài sản tham khảo, nhưng **không là hạng mục cần hoàn thiện trong giai đoạn còn lại (tuần 12–14)**.

## 3.3. Nguyên tắc

1. **Làm lát dọc**: Mỗi tính năng hoàn thành trọn vẹn từ DB schema → API backend → giao diện frontend → kiểm thử trước khi sang tính năng kế tiếp.
2. **Kế thừa prototype frontend**: Giữ khung layout hiện có, dọn dẹp các trang dư thừa, thay dần mock data bằng API thật theo từng lát cắt.
3. **Chốt contract API trước**: Viết OpenAPI/endpoint contract ở đầu mỗi lát cắt để FE và BE làm việc song song, tránh chờ đợi.
4. **Quy ước Git**: Nhánh `feature/*` tách từ `dev`, PR có ít nhất 1 thành viên review và CI xanh trước khi merge.

## 3.4. Dọn dẹp Frontend (theo Use Case)

Dọn khỏi routing/menu các trang cũ nằm ngoài use case:

- Admin: Bỏ `AdminAnalytics`, `AdminLogs`.
- Học sinh: Bỏ `StudentChat`, `StudentMarketplace`, `StudentOnboarding`, `StudentProgress`; **giữ `SpacedRepetitionSession`** (được làm lại thành trang Ôn tập ngắt quãng nhiều bộ thẻ, thay thế hoàn toàn mock).
- Gia sư: Bỏ nhóm `Library*`, `manage/ManageLearningPath*`, `ExerciseGenerator` cũ.
- Phụ huynh: Bỏ `ParentLearningProgress`, `guest/ParentProgressViewPage` riêng (phụ huynh theo dõi qua tài khoản con).
- Gộp trang Admin và Lễ tân dùng chung bộ component nghiệp vụ (ghép lớp, duyệt phí, danh sách).

# 4. WBS — Work Breakdown Structure

| Mã           | Hạng mục                                                                                                         | Đầu ra chính                            | Trạng thái      |
| ------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------ | ----------------- |
| **1.0** | **Khởi tạo và Phân tích thiết kế**                                                                    |                                            |                   |
| 1.1           | Đặc tả trường hợp sử dụng (Use Case Specification)                                                         | Tài liệu đặc tả use case hoàn chỉnh | **Xong**    |
| 1.2           | Rà soát PRD và chốt phạm vi MVP theo Use Case                                                                 | PRD v2 chuẩn hóa                         | Hoàn thành      |
| 1.3           | Thiết kế CSDL chi tiết (ERD) & DDL/Migration                                                                    | ERD chốt bám use case, file DDL/Flyway   | Xong              |
| 1.4           | Sơ đồ trạng thái UML (Hồ sơ GS, Lớp học, Đơn ghép, Phí, Khiếu nại)                                  | Bộ sơ đồ State Machine                 | Một phần          |
| 1.5           | Sơ đồ tuần tự UML cho các luồng cốt lõi                                                                   | Bộ sơ đồ Sequence Diagram              | Một phần          |
| 1.6           | Hạ tầng Docker Compose & CI cơ bản                                                                             | Docker running, CI pipeline                | Xong              |
| **2.0** | **Nền tảng Backend & Cơ sở dữ liệu**                                                                   |                                            |                   |
| 2.1           | Migration DB (Flyway/DDL) và dữ liệu mẫu (Seed Data)                                                           | Database schema chạy trong Docker         | Xong              |
| 2.2           | Module Auth: Đăng nhập JWT, đổi mật khẩu, phân quyền RBAC (FR-05, FR-06)                                  | API Auth, Security filter                  | Xong              |
| 2.3           | Dịch vụ dùng chung: Lưu trữ file S3/MinIO, Audit Log, Thông báo                                             | Service upload & audit                     | Xong              |
| **3.0** | **Lát cắt 1: Quản lý Hồ sơ Gia sư & Cổng Công khai**                                                |                                            |                   |
| 3.1           | Khách/Phụ huynh: Tìm kiếm & xem hồ sơ gia sư (FR-01, FR-02)                                                 | API & UI tìm kiếm gia sư                | Xong              |
| 3.2           | Gia sư: Thiết lập hồ sơ 5 bước, tải chứng chỉ, video, bảng giá (FR-07)                                 | API & UI hồ sơ gia sư                   | Xong              |
| 3.3           | Lễ tân/Admin: Duyệt/Từ chối hồ sơ gia sư (FR-31, FR-32)                                                    | API & UI duyệt hồ sơ                    | Xong              |
| **4.0** | **Lát cắt 2: Luồng Ghép lớp, Xếp lịch & Duyệt phí**                                                 |                                            |                   |
| 4.1           | Phụ huynh: Gửi yêu cầu tìm gia sư & Đăng ký chỉ định (FR-03, FR-04) — **đã được thay thế bởi tính năng MSG (WBS 8.1)** trong tuần 10 | API & UI đăng ký                        | Xong (thay thế bởi MSG) |
| 4.2           | Lễ tân: Quản lý Lớp cần gia sư, Đơn ghép lớp (FR-25 → FR-30)                                           | API & UI ghép lớp                        | Xong              |
| 4.3           | Gia sư: Ứng tuyển lớp, Lịch dạy thử, Chốt lịch cố định (FR-08 → FR-10)                                | API & UI lịch và nhận lớp              | Xong              |
| 4.4           | Gia sư & Lễ tân: Nộp và duyệt minh chứng phí nhận lớp (FR-15, FR-33)                                     | API & UI quản lý phí                    | Xong              |
| **5.0** | **Lát cắt 3: Vận hành Buổi học, Trợ lý AI & Quiz**                                                   |                                            |                   |
| 5.1           | Gia sư & Học sinh: Lịch dạy, khởi tạo buổi học, nhật ký buổi học (FR-11, FR-12, FR-17, FR-19 → FR-21) | API & UI buổi học & nhật ký            | Xong              |
| 5.2           | AI Service: Endpoint chat sinh quiz theo CEFR & Prompt import kiểm định JSON (FR-13, FR-14)                     | FastAPI service chạy thật                | Xong              |
| 5.3           | Gia sư: Không gian soạn quiz chia đôi kết hợp AI và xem hồ sơ kỹ năng học sinh (FR-13, FR-14)         | UI soạn quiz tích hợp AI                | Xong (tuần 10)  |
| 5.4           | Học sinh: Làm quiz từng câu, chấm điểm tức thì, cập nhật Elo và ôn tập ngắt quãng câu sai (FR-22)    | Engine tính Elo, API & UI làm quiz + phiên ôn tập (snapshot review_cards, nhiều deck) | Xong (tuần 10) |
| **6.0** | **Lát cắt 4: Quản lý Vận hành & Hoàn thiện**                                            |                                            |                   |
| 6.1           | Lễ tân/Admin: Quản lý học sinh, tiếp nhận và xử lý khiếu nại (FR-34 → FR-37)                          | API & UI khiếu nại                       | Xong (tuần 10) — **loại khỏi phạm vi triển khai, không làm tiếp; giữ nguyên module trong codebase** |
| 6.2           | Dọn dẹp triệt để frontend, thay 100% dữ liệu mock bằng API thật                                           | Giao diện 4 cổng liên thông            | Một phần (khiếu nại, học sinh đã dùng API thật; các trang thừa Library*, AdminLogs, ManageLearningPath... vẫn dùng mock — tiếp tục **tuần 13**) |
| 6.3           | *(S)* Admin: Quản lý lễ tân; Học sinh: Hồ sơ cá nhân (FR-16, FR-18, FR-38, FR-39)                       | Tính năng phụ (nếu kịp)               | Đã làm phần Admin   |
| **7.0** | **Tích hợp, Kiểm thử & Đóng gói Bàn giao**                                                           |                                            |                   |
| 7.1           | Unit test & Integration test cho các luồng nghiệp vụ cốt lõi                                                 | Test suite pass                            | Một phần (kiểm thử toàn diện + sửa lỗi tuần 13 cho 9.1/9.2 và các luồng khác; chạy xanh toàn bộ & đóng băng tính năng tuần 14) |
| 7.2           | UAT nội bộ theo các hành trình người dùng (UJ-1 đến UJ-6)                                                | Biên bản test & sửa bug                 | Chạy UJ-1 → UJ-6 tại **tuần 14**, sửa nốt lỗi tồn đọng trước demo |
| 7.3           | Đóng gói hệ thống Docker, tài liệu kỹ thuật & kịch bản báo cáo                                        | Tài liệu & Demo hoàn chỉnh             | **Thay thế bởi 9.2 + 9.3** (báo cáo đồ án, không đóng gói UAT riêng) |
| **8.0** | **Mở rộng phạm vi ngoài kế hoạch gốc (tuần 10–11)**                                               |                                            |                   |
| 8.1           | MSG: Đăng nhập Google phụ huynh, nhắn tin phụ huynh–gia sư (Rocket.Chat), đề xuất lớp học, đăng tin nhận lớp (thay thế UC-PA-03, UC-PA-04; `docs/Usecase/Usecase_Messaging_Parent_Tutor.md`, V23, V27, V28) | API & UI messaging + proposal            | Xong (đã merge dev) |
| 8.2           | Gói lưu trữ gia sư: quota FREE/PRO/PREMIUM theo tháng, chặn upload vượt quota, widget + lịch sử thuê bao admin (`storage_tiers`, `tutor_storage_subscriptions`, V29) | API & UI storage quota                   | Trên nhánh `feature/tutor-storage-quota`, chờ merge — xử lý trùng số V29 và merge dev tại **tuần 13** |
| **9.0** | **Công việc còn lại (thay thế UAT & đóng gói)** |                                            |                   |
| 9.1           | Chỉnh lại nghiệp vụ luồng ghép lớp, giảm thao tác cho trung tâm/trung gian (Lễ tân/Admin): dựa trên use case MSG (message + proposal) — Lễ tân chỉ còn 1 điểm dừng (duyệt tin đăng), phụ huynh & gia sư tự chốt qua chat + proposal, giảm bước xác nhận trung gian | Nghiệp vụ luồng ghép lớp được chỉnh lại, thao tác Lễ tân giảm | Chưa làm (dự kiến hoàn thiện tuần 12: 23/11 – 29/11; test/chỉnh lại ở tuần 13) |
| 9.2           | Thống kê chi phí token AI (số lần gọi, token đầu ra/vào theo model) và chi phí lưu trữ (dựa trên `storage_tiers`, quota gia sư, dung lượng thực tế upload) phục vụ báo cáo đồ án | Bảng chi phí token + lưu trữ             | Chưa làm (dự kiến hoàn thiện tuần 12: 23/11 – 29/11) |
| 9.3           | Hoàn thành báo cáo đồ án: tài liệu kỹ thuật, hướng dẫn sử dụng, slide và kịch bản demo                  | Báo cáo đồ án hoàn chỉnh                | Chưa làm (bắt đầu viết tại **tuần 13** — tài liệu kỹ thuật, kịch bản demo; hoàn thiện tại **tuần 14**: slide, hướng dẫn sử dụng) |

# 5. Lịch triển khai (gốc 11 tuần + 3 tuần bổ sung, 07/09/2026 – 13/12/2026)

## 5.1. Giai đoạn 1 (Tuần 1–5, 07/09 – 11/10): Khởi tạo, Khảo sát & Đặc tả Use Case

| Tuần | Thời gian     | Nội dung công việc thực tế                                                                                                             | Kết quả đạt được                   |
| ----- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| 1     | 07/09 – 13/09 | Khởi động dự án, nghiên cứu đề tài, dựng khung Docker Compose & repo                                                             | Hoàn thành                              |
| 2     | 14/09 – 20/09 | Xây dựng khung giao diện React prototype ban đầu, định hình các vai trò người dùng                                             | Hoàn thành                              |
| 3     | 21/09 – 27/09 | Bổ sung prototype các màn hình chức năng chính, khảo sát quy trình vận hành trung tâm                                          | Hoàn thành                              |
| 4     | 28/09 – 04/10 | Rà soát luồng thực tế, nhận diện các điểm bất cập trong thiết kế cũ, định hình lại phạm vi                              | Hoàn thành                              |
| 5     | 05/10 – 11/10 | **Tập trung viết và hoàn thiện tài liệu Đặc tả Use Case chi tiết**, chuẩn hóa các tác nhân và quy trình nghiệp vụ | **Hoàn thành Đặc tả Use Case** |

> **Hiện trạng chuyển giao sang tuần 6:** Đã có tài liệu Đặc tả Use Case chuẩn làm kim chỉ nam. Các phần thiết kế CSDL chi tiết, DDL/migration và toàn bộ backend nghiệp vụ được chuyển giao để thực hiện gấp rút từ đầu Tuần 6.

## 5.2. Giai đoạn 2 (Tuần 6–14, 12/10/2026 – 13/12/2026): Phát triển theo Lát cắt dọc, Tích hợp & Hoàn thiện Báo cáo

| Tuần        | Thời gian     | Trọng tâm WBS                        | Nội dung công việc chi tiết                                                                                                                                                                                                                                                                                                                                                                                             | Kết quả cuối tuần                                                                                                                          |
| ------------ | -------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **6**  | 12/10 – 18/10 | 1.3, 1.4, 2.1, 2.2, 2.3, 3.1, 3.2, 3.3 | **Chốt CSDL, Backend nền tảng & Hồ sơ Gia sư**- Rà soát và chốt ERD bám use case, viết DDL/Flyway migration.- Xây dựng module Auth JWT, phân quyền Spring Security.- Dựng S3 file upload (chứng chỉ/video) và audit log.- CRUD Hồ sơ gia sư, Lễ tân duyệt hồ sơ, trang tìm kiếm gia sư công khai.- Vẽ sơ đồ trạng thái UML cho các thực thể chính.                          | **Đã đạt (18/10):** Gia sư nộp hồ sơ, Lễ tân duyệt hồ sơ, Phụ huynh tìm được gia sư trên dữ liệu thật DB. (**M1**)                        |
| **7**  | 19/10 – 25/10 | 1.5, 4.1, 4.2, 4.3, 4.4                | **Luồng Ghép lớp, Lịch dạy & Thu phí**- Form gửi yêu cầu tìm gia sư và đăng ký chỉ định.- Nghiệp vụ Lớp cần gia sư (tạo, ứng tuyển, chọn gia sư).- Nghiệp vụ Đơn ghép lớp (tạo, duyệt, hủy).- Xếp lịch dạy thử, chốt lịch cố định, kiểm tra trùng ca dạy.- Nộp minh chứng và Lễ tân duyệt phí nhận lớp (35–40%).                                           | **Đã đạt (25/10):** Chạy thông suốt luồng từ Phụ huynh đăng ký → Ghép lớp → Dạy thử → Chốt lịch cố định → Nộp & duyệt phí. (**M2**) |
| **8**  | 26/10 – 01/11 | 5.1, 5.2, 5.3, 5.4                     | **Buổi học, AI Service & Quiz cá nhân hóa**- Quản lý buổi học, khởi tạo ca, nhật ký dạy học và tài liệu.- Xây dựng AI Service FastAPI: endpoint chat sinh quiz theo CEFR, parser kiểm định JSON import.- UI soạn quiz chia đôi tích hợp AI chatbot và xem hồ sơ kỹ năng.- Học sinh làm quiz từng câu, chấm điểm tức thì, cập nhật điểm Elo và danh sách ôn tập.     | **Đạt một phần (01/11):** Buổi học & nhật ký xong; AI Service chạy LLM thật; Học sinh làm quiz + Elo xong. **Chưa xong: giao diện soạn quiz tích hợp AI của gia sư (5.3) và ôn tập ngắt quãng câu sai (5.4)** → chuyển sang tuần 10. (**M3 chưa đạt, hoàn thành trong tuần 10**)          |
| **9**  | 02/11 – 08/11 | 6.2, 7.1                     | **Dọn Frontend & Tích hợp 4 cổng**- Quản lý danh sách học sinh.- Dọn dẹp triệt để các trang thừa trên frontend, thay thế toàn bộ mock data bằng API thật.- Viết test nghiệp vụ quan trọng (phân quyền, trùng ca, tính phí, Elo). | **Đạt một phần:** Workspace học sinh, gộp Lớp cần gia sư, quản lý nhân sự (FR-38, FR-39), và làm mới khung soạn quiz (gộp câu tự động, popover "Nhảy tới câu", hồ sơ kỹ năng). **Chưa xong: hoàn thiện soạn quiz AI (5.3), ôn tập ngắt quãng câu sai (5.4) và dọn mock frontend (6.2)** → chuyển sang tuần 10. (**M3 chưa đạt, M4 lùi**) |
| **10** | 09/11 – 15/11 | 5.3, 5.4, 6.2, 7.1, 8.1         | **Dọn Frontend & Tích hợp 4 cổng**- Dọn dẹp triệt để các trang thừa trên frontend và thay thế 100% mock data bằng API thật.- Quản lý danh sách học sinh.- Hoàn thiện tính năng soạn quiz với AI (FR-13, FR-14): hoàn chỉnh luồng chat trợ lý AI gộp thẳng câu vào bài soạn + sửa câu, tích hợp hồ sơ kỹ năng học sinh, import quiz kiểm định JSON, và điều hướng/sửa câu ổn định trên LLM thật.- Hoàn thiện tính năng ôn tập ngắt quãng câu sai (FR-22): phiên ôn tập trong không gian Học sinh — lấy câu đến hạn, đánh dấu mức độ nắm vững, đẩy lịch ôn kế tiếp; thay thế trang `SpacedRepetitionSession` riêng (dọn theo 6.2).- Bổ sung test nghiệp vụ quan trọng (phân quyền, trùng ca, tính phí, Elo).- **(Mở rộng ngoài kế hoạch, WBS 8.1)** Tính năng MSG: đăng nhập Google phụ huynh, module nhắn tin phụ huynh–gia sư (Rocket.Chat), đề xuất lớp học, đăng tin nhận lớp (V23, V27, V28; thay thế UC-PA-03/UC-PA-04). | **Đã đạt (15/11):** 4 cổng liên thông API thật, soạn quiz AI và ôn tập ngắt quãng hoàn chỉnh trên dữ liệu thật (M3 + M4 đạt). Tính năng MSG hoàn thành và merge dev. |
| **11** | 16/11 – 22/11 | 9.1, 9.2, 7.1, 8.2                      | **Hoàn thiện giai đoạn cuối**- (WBS 9.1) Tối ưu luồng ghép lớp giảm thao tác trung tâm/trung gian dựa trên use case MSG (Lễ tân chỉ duyệt tin đăng, phụ huynh–gia sư tự chốt qua chat + proposal).- (WBS 9.2) Thống kê chi phí token AI và chi phí lưu trữ (bảng chi phí phục vụ báo cáo đồ án & vận hành).- (WBS 7.1) Hoàn thiện & chạy xanh test suite cho các luồng còn mở.- (WBS 8.2) Merge Storage Quota: xử lý trùng số migration V29, dọn mock các trang thừa (Library*, AdminLogs, ManageLearningPath...) để hoàn tất 6.2. | **Đạt một phần (22/11):** 9.1, 9.2 và merge Storage Quota chưa kịp hoàn tất trong tuần 11; 9.3 (báo cáo đồ án) chưa bắt đầu → **chia đều vào 3 tuần tiếp theo (tuần 12–14, 23/11 – 13/12)**. (M5 dời sang tuần 14) |
| **12** | 23/11 – 29/11 | 9.2, 9.1                          | **Hoàn thiện tính phí & Luồng ghép lớp mới (MSG)**- (WBS 9.2) Hoàn thiện tính phí lưu trữ + phí token AI: bảng thống kê số lần gọi, token vào/ra theo model, quota, dung lượng upload thực tế — dùng cho mục chi phí của báo cáo đồ án.- (WBS 9.1) Hoàn thiện luồng ghép lớp mới theo use case MSG (message + proposal): Lễ tân chỉ duyệt tin đăng, phụ huynh & gia sư tự chốt qua chat + proposal; cập nhật UI/BE tương ứng.- Chạy demo nội bộ ngắn để rà lỗi tồn đọng trước tuần 13–14. | Tính phí storage + token (9.2) hoàn chỉnh; luồng ghép lớp mới message + proposal (9.1) hoàn tất trên dữ liệu thật. |
| **13** | 30/11 – 06/12 | 8.2, 6.2, 7.1, 9.3 (khởi động)                          | **Kiểm thử, sửa lỗi, cải thiện UI & bắt đầu báo cáo**- (WBS 8.2 + 6.2, nền cho kiểm thử) Merge Storage Quota (xử lý trùng số V29 → V30, merge dev) và dọn mock các trang thừa (Library*, AdminLogs, ManageLearningPath...) — 4 cổng sạch mock.- (WBS 7.1) Kiểm thử toàn diện: viết & chạy test cho 9.1, 9.2 và các luồng cốt lõi, sửa lỗi phát hiện.- Cải thiện UI: rà soát & polish giao diện 4 cổng theo design system, thống nhất tiếng Việt, sửa trải nghiệm trước demo.- (WBS 9.3) Bắt đầu viết báo cáo đồ án: tài liệu kỹ thuật, chụp màn hình, kịch bản demo. | 8.2 merge dev (V30), 4 cổng sạch mock; test + sửa lỗi cho 9.1/9.2 và các luồng khác, CI xanh; UI polish; phần lớn tài liệu kỹ thuật 9.3 hoàn thành. |
| **14** | 07/12 – 13/12 | 9.3, 7.1, 7.2                          | **Hoàn thiện báo cáo & Demo Cuối**- (WBS 9.3) Hoàn thiện báo cáo đồ án: tài liệu kỹ thuật, hướng dẫn sử dụng, slide và kịch bản demo.- (WBS 7.2) UAT nội bộ theo UJ-1 → UJ-6, sửa nốt lỗi tồn đọng.- (WBS 7.1) Chạy xanh toàn bộ test suite, đóng băng tính năng.- Rà soát demo cuối, đóng gói tài liệu bàn giao. | **M5 (13/12/2026):** Báo cáo đồ án hoàn chỉnh (slide, kịch bản demo, tài liệu kỹ thuật); UAT đạt, hệ thống chạy demo ổn định, sẵn sàng bàn giao. |

## 5.3. Phân công trách nhiệm 3 thành viên

| Thành viên             | Trách nhiệm chính                                                                                                                                  | Trách nhiệm phối hợp                    |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| **Thành viên A** | **Backend nền tảng, CSDL & Cổng Admin/Lễ tân**: Thiết kế CSDL/Migration, Auth JWT, API ghép lớp, duyệt phí              | Hỗ trợ cấu hình Docker, CI/CD           |
| **Thành viên B** | **Cổng Gia sư & Cổng Công khai**: Hồ sơ gia sư 5 bước, lịch dạy thử/cố định, nhật ký buổi học, giao diện tìm kiếm gia sư | Hỗ trợ kiểm thử tích hợp UI–BE       |
| **Thành viên C** | **Cổng Học sinh & AI Service**: Xây dựng AI Service (FastAPI sinh quiz/import), làm quiz, thuật toán tính điểm Elo, UI học sinh      | Soạn tài liệu bàn giao, kịch bản demo |

# 6. Các cột mốc (Milestones)

| Mốc                                                       | Thời điểm                 | Tiêu chí hoàn thành thực tế                                                                                                                                              |
| ---------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **M0 — Hoàn tất Đặc tả Use Case**              | 11/10 (Hiện tại đã xong) | Tài liệu Đặc tả Use Case chi tiết được phê duyệt, làm căn cứ kỹ thuật duy nhất cho toàn bộ hệ thống                                                       |
| **M1 — Nền tảng CSDL, Auth & Hồ sơ Gia sư**    | Cuối tuần 6 (18/10)        | DDL/Flyway migration chạy trong Docker; Đăng nhập JWT & phân quyền; Gia sư tạo và gửi duyệt hồ sơ, Lễ tân duyệt hồ sơ, Phụ huynh xem hồ sơ trên DB thật |
| **M2 — Luồng Ghép lớp, Lịch & Thu phí**        | Cuối tuần 7 (25/10)        | Luồng ghép lớp vận hành từ yêu cầu phụ huynh đến lớp chuyển ACTIVE và phí nhận lớp được phê duyệt trên dữ liệu thật                                  |
| **M3 — Vận hành Giảng dạy & AI Quiz**           | Cuối tuần 8 (01/11) — hoàn thành trong tuần 10 | Gia sư quản lý buổi học & soạn quiz với AI; Học sinh làm quiz, chấm tự động, cập nhật Elo; ôn tập ngắt quãng hoàn chỉnh (review_cards, nhiều deck) |
| **M4 — Liên thông 4 cổng** | **Đã đạt (15/11)** | 4 cổng liên thông bằng API thật; mở rộng thêm tính năng MSG (đăng nhập Google, nhắn tin, đề xuất lớp học). Khiếu nại không còn là tiêu chí của M4 (đã loại khỏi phạm vi hoàn thiện). |
| **M5 — Demo & Hoàn thành Báo cáo Đồ án**               | **Cuối tuần 14 (13/12/2026)** — kéo dài thêm 3 tuần (12–14) do khối lượng còn lại (9.1–9.3) chưa kịp trong tuần 11 | Luồng ghép lớp mới (chỉnh lại nghiệp vụ, message + proposal) hoàn thiện; bảng chi phí token + lưu trữ hoàn chỉnh; báo cáo đồ án (slide, kịch bản demo, tài liệu kỹ thuật) sẵn sàng; merge gói lưu trữ gia sư (xử lý trùng số migration V29) |

# 7. Quản lý rủi ro & Phương án xử lý

| Rủi ro                                                                     | Mức độ             | Biện pháp giảm thiểu                                                                                                                                                                                                                |
| --------------------------------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend mới ở mức khung rỗng, khối lượng 5 tuần còn lại rất lớn | **Rất cao**    | - Bám sát Use Case làm lát cắt dọc, không xây dựng dư thừa.- Cắt bỏ hoàn toàn 4 tính năng Should-have nếu tuần 8 chưa kịp tiến độ.- Tái sử dụng tối đa thư viện và UI component sẵn có từ prototype. |
| Thiết kế CSDL (ERD) bị thay đổi làm ảnh hưởng API                  | **Cao**         | Chốt dứt điểm ERD và DDL trong 2 ngày đầu Tuần 6 (12/10 - 13/10) trước khi code các module nghiệp vụ.                                                                                                                     |
| AI Service sinh quiz chậm hoặc vượt giới hạn token                    | **Trung bình** | - Đặt timeout 60s và cơ chế retry ở client.- Tính năng Import Quiz ngoài (Prompt template + JSON validate) đóng vai trò phương án dự phòng 0-token.                                                                    |
| Sai lệch giữa Frontend prototype và Backend API                          | **Trung bình** | Thống nhất contract API (OpenAPI/DTO mẫu) đầu mỗi tuần trước khi triển khai song song.                                                                                                                                        |
| **Khiếu nại (WBS 6.1) chưa hoàn thành đến cuối tuần 9, M4 bị lùi vào tuần 10** | **Đã loại khỏi phạm vi** | Module khiếu nại + hoàn phí hoàn tất đầu tuần 10 (V22), 2 trang Admin/Lễ tân nối API thật. **Không còn là hạng mục phải hoàn thiện giai đoạn cuối** — giữ nguyên trong codebase, thời gian dành cho chỉnh lại nghiệp vụ ghép lớp, chi phí và báo cáo. |
| **Trùng số migration V29**: nhánh `feature/tutor-storage-quota` (gói lưu trữ gia sư, V29) và dev (V29 khác nội dung — parent address/proposal location) cùng dùng số V29 | **Cao** | Đổi số migration gói lưu trữ sang V30 (hoặc rebase nhánh theo dev) trước khi mở PR merge; kiểm tra Flyway `validateMigrationChecksum` không báo lỗi sau khi đổi. |
| Mở rộng phạm vi (MSG, Storage Quota) ngoài kế hoạch có thể gây tràn tiến độ | **Trung bình** | Storage Quota ưu tiên merge dev trước mốc demo; nếu không kịp, giữ làm tính năng mở rộng (không tính vào M5). MSG đã merge dev, không gây rủi ro. |
| **9.1–9.3 chưa kịp trong tuần 11, kế hoạch kéo dài thêm 3 tuần (tuần 12–14, 23/11 – 13/12/2026)** | **Cao** | **Đã xử lý:** Chia đều khối lượng còn lại vào 3 tuần: tuần 12 (23/11 – 29/11) hoàn thiện tính phí storage + token (9.2) + hoàn thiện luồng ghép lớp mới message + proposal (9.1); tuần 13 (30/11 – 06/12) kiểm thử toàn diện + sửa lỗi + cải thiện UI (merge 8.2, dọn mock 6.2, test 7.1) + bắt đầu viết báo cáo (9.3); tuần 14 (07/12 – 13/12) hoàn thiện báo cáo đồ án (9.3) + UAT (7.2) + demo (M5). M5 = demo + báo cáo đồ án, cuối tuần 14 (13/12/2026). Cắt gọn scope 9.1 nếu chưa kịp. |

---

*Kế hoạch triển khai phiên bản 3.0 — Cập nhật ngày 22/11/2026 (mốc tuần 11): M1–M3 đã đạt, M4 đạt về liên thông 4 cổng (khiếu nại không còn là tiêu chí). **Loại khiếu nại (WBS 6.1) khỏi phạm vi triển khai** (module đã hoàn thiện, giữ nguyên trong codebase; không còn là hạng mục phải triển khai tiếp). **Công việc còn lại (WBS 9.0 + 8.2) được chia đều vào 3 tuần tiếp theo (tuần 12–14, 23/11 – 13/12/2026):** tuần 12 hoàn thiện tính phí storage + token (9.2) + hoàn thiện luồng ghép lớp mới message + proposal (9.1); tuần 13 kiểm thử toàn diện + sửa lỗi + cải thiện UI (merge 8.2, dọn mock 6.2, test 7.1) + bắt đầu viết báo cáo (9.3); tuần 14 hoàn thiện báo cáo đồ án (9.3) + UAT (7.2) + demo. M5 = demo + báo cáo đồ án, cuối tuần 14 (13/12/2026).*
