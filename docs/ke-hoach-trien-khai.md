---
title: Kế hoạch triển khai đề tài — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
version: 1.4
ngày lập: 2026-09-04 (cập nhật 2026-09-19)
ngày bắt đầu: 2026-09-07
nhóm: 3 thành viên
thời lượng: 2,5 tháng (10 tuần, từ 07/09/2026 đến 15/11/2026)
---
# 1. Mô tả ngắn đề tài

**Tên đề tài:** Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1, với AI và Spaced Repetition đóng vai trò đòn bẩy giúp gia sư **tiết kiệm thời gian soạn bài cá nhân hóa** và học sinh **tự học, ghi nhớ lâu dài hiệu quả hơn**.

**Giá trị cốt lõi:**

- **Gia sư**: Nhận lớp, quản lý lộ trình bài dạy, giao bài tập cá nhân hóa tự động dựa trên **Student Knowledge Profile (SKP)** qua cơ chế **Tutor Assistant Dual-Mode** (Direct AI Generation hoặc Import File 0 Token Cost).
- **Học sinh**: Làm bài trực tuyến, được tự động chấm điểm tức thì, xem lời giải thích AI chi tiết và được hệ thống tự động nhắc ôn lại các kiến thức sắp quên theo thuật toán **Spaced Repetition (SM-2)**.
- **Phụ huynh**: Tìm gia sư nhanh qua Form trực quan (Smart-Match Form), đăng ký học thử đơn giản, và theo dõi tiến bộ thực chất của con bằng biểu đồ định lượng (Chỉ số Chăm chỉ & Tiến bộ Năng lực).
- **Admin**: Ghép lớp, duyệt phí nhận lớp (sau 1 tháng dạy chính thức), quản lý nhân sự lễ tân, xử lý khiếu nại (`REMATCH`, `REFUND`) và đối soát tài chính trung tâm tập trung tại một nơi.
- **Lễ tân**: Hỗ trợ Admin xử lý yêu cầu ghép lớp, duyệt thanh toán, quản lý gia sư & học sinh, tiếp nhận và ghi nhận khiếu nại trực tiếp tại trung tâm.

**Kiến trúc công nghệ:**

| Thành phần | Công nghệ | Vai trò |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | ReactJS | Parent Portal, Tutor Portal (mobile-first), Student Portal, Admin Dashboard, Receptionist Portal |
| Backend | Spring Boot | API Gateway duy nhất, nghiệp vụ, RBAC theo `Enrollment`, PostgreSQL, Audit log |
| AI Service | Python + LangGraph | Agent sinh Khung chương trình 2 cấp, Agent Tutor Assistant (sinh bài tập bám sát SKP + đáp án + giải thích), Content Moderation, Cost guardrail |
| Core Personalization | Java / Python Engines | Student Knowledge Profile (SKP) với Thuật toán Elo Rating, Spaced Repetition Engine với Thuật toán SM-2 |
| Hạ tầng | PostgreSQL, S3-compatible storage, Docker | Lưu trữ dữ liệu có cấu trúc (SKP, SM-2, Complaints, Audit Logs...), tài liệu/video (S3), đóng gói triển khai |

---

# 2. Mô tả phạm vi (Scope)

## 2.1 Trong phạm vi

| Module | Nội dung chính | FR liên quan |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Parent Portal** | Landing page, Form tìm gia sư trực quan (Smart-Match Form), danh sách gia sư kèm Matching Score, đăng ký học thử (OTP SMS), FAQ | FR-1, FR-2, FR-3, FR-4 |
| **Tutor Portal** | Nhận/từ chối lời mời nhận lớp (mở khóa SĐT & Địa chỉ Phụ huynh), nộp minh chứng phí QR proof (sau 30 ngày dạy chính thức), **Curriculum Management Dual-Mode** (2 cấp), **Tutor Assistant Dual-Mode** (Direct AI Generation / Import File 0 Token Cost bám sát SKP), duyệt & giao bài, upload video/tài liệu (S3), lịch dạy, đổi lịch/báo nghỉ, cấu hình lịch học thử & lịch cố định (`ACTIVE`), Rate Card, danh sách học sinh & Private Notes | FR-6, FR-8, FR-9, FR-21, FR-25 → FR-30 |
| **Student Portal** | Làm bài trực tuyến (trắc nghiệm/điền từ/sửa lỗi/viết lại câu), tự động chấm điểm, xem Lời giải thích AI chi tiết (per-question / submit-all mode), **Student Knowledge Profile (SKP) & Elo Rating**, **Ôn tập ngắt quãng Spaced Repetition (SM-2)**, xem video/tài liệu theo bài học, báo cáo tiến bộ cá nhân (Chỉ số Chăm chỉ + Biểu đồ Tiến bộ Năng lực) | FR-11, FR-12, FR-13, FR-15, FR-22, FR-38, FR-39 |
| **Admin Dashboard** | Quản lý Match Request, tạo Match Offer, tính phí tự động, duyệt phí QR proof (sau 30 ngày dạy), phân quyền RBAC theo Enrollment, Audit log, Báo cáo vận hành, **Quản lý Lễ tân**, **Xử lý khiếu nại & Đối soát tài chính (`REFUND`/`REMATCH`)** | FR-16, FR-19, FR-20, FR-23, FR-24, FR-31, FR-32 |
| **Receptionist Portal** | Yêu cầu ghép lớp, Duyệt thanh toán QR proof, Quản lý gia sư & học sinh, Thông báo trung tâm, **Tiếp nhận & ghi nhận khiếu nại trực tiếp tại trung tâm (`REFUND`/`REMATCH`)** | FR-33 → FR-37 |
| **AI Service (LangGraph)** | Agent sinh khung chương trình 2 cấp; Agent Tutor Assistant sinh bài tập bám sát SKP + đáp án + giải thích chi tiết; Parser cho chế độ Import (JSON/Text từ ChatGPT/Claude ngoài 0 Token Cost); Content Moderation filter | FR-8, FR-30 |
| **Nền tảng kỹ thuật** | Spring Boot API Gateway, JWT Auth (24h), Row-level security theo Enrollment, PostgreSQL (thực thể SKP, SM-2, Complaints, Receptionists, Audit Logs...), S3 storage, Docker deployment, APM logging cơ bản | Mục 8 (NFR) |

## 2.2 Ngoài phạm vi

- Đánh giá gia sư sau buổi học thử (Trial Lesson Review).
- Nhật ký buổi dạy (Lesson Log) thủ công sau từng buổi học.
- Khung chương trình học đa cấp phức tạp (> 2 cấp).
- Gamification cồng kềnh (EXP, Streak, Bảng xếp hạng).
- AI Advisor Chatbot & Live Chat Monitor / Takeover Mode.
- Student Socratic Chatbot (thay bằng tự động chấm điểm & Lời giải thích AI).
- Thanh toán trực tuyến tự động qua cổng thanh toán (chuyển khoản thủ công + duyệt bằng ảnh biên lai VietQR proof).
- Học trực tuyến tích hợp (dùng Zoom/Meet ngoài).
- Báo cáo email tự động định kỳ cho phụ huynh.

## 2.3 Ràng buộc dự án

- Đội ngũ: **3 thành viên**, thời gian: **2,5 tháng (≈10 tuần làm việc)**.

---

# 3. WBS — Work Breakdown Structure

| Mã | Hạng mục công việc | Đầu ra chính |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| **1.0** | **Khởi tạo & Thiết kế** | Tài liệu đặc tả & sơ đồ UML hoàn chỉnh |
| 1.1 | Rà soát PRD, chốt phạm vi MVP, phân công vai trò | Scope Statement, phân công 3 người |
| 1.2 | Thiết kế kiến trúc hệ thống (FE–BE–AI, luồng REST nội bộ qua API Gateway) | Sơ đồ kiến trúc hệ thống |
| 1.3 | Thiết kế CSDL (ERD: Enrollment, Match Request, Curriculum, Homework, Payment, SKP, SM-2 Schedules, Complaints, Receptionists...) | ERD + DDL PostgreSQL hoàn chỉnh |
| 1.4 | Dựng prototype ReactJS 5 cổng (Parent/Tutor/Student/Admin/Receptionist) — thay wireframe/Figma | Prototype ReactJS 5 cổng chạy được |
| 1.5 | Thiết lập môi trường: Git repo, CI/CD cơ bản, Docker Compose (BE+FE+AI+DB) | Repo khởi tạo, pipeline chạy được |
| 1.6 | Dựng layout chung, routing & component thư viện dùng chung cho 5 cổng | Design system, layout & component dùng chung |
| 1.7 | Viết tài liệu đặc tả Use Case chi tiết cho 5 actors (Parent, Tutor, Student, Admin, Receptionist) | Tài liệu đặc tả Use Case (Use Case Specification) |
| 1.8 | Thiết kế sơ đồ tuần tự (Sequence Diagram) cho các thủ tục / chức năng quan trọng (Tạo Match Offer, Duyệt phí QR 30 ngày, AI sinh bài nhúng SKP, Auto-grading & SKP update, Spaced Repetition daily review) | Tập sơ đồ Sequence Diagram (UML) |
| 1.9 | Thiết kế sơ đồ trạng thái (State Machine Diagram) cho các đối tượng trung tâm (Enrollment, Match Request, Homework/Submission, Payment QR, Complaint) | Tập sơ đồ State Machine Diagram (UML) |
| 1.10 | Thiết kế sơ đồ hoạt động (Activity Diagram) cho các nghiệp vụ phức tạp (Luồng Dual-Mode AI/Import nhúng SKP, Luồng ghép lớp & duyệt phí 30 ngày, Luồng tiếp nhận & đối soát khiếu nại REFUND/REMATCH) | Tập sơ đồ Activity Diagram (UML) |
| **2.0** | **Module Phụ huynh (Parent Portal)** | |
| 2.1 | Auth JWT + RBAC theo `Enrollment` | API Auth, middleware phân quyền |
| 2.2 | Module Parent / Smart-Match Form & Registration (FR-1→FR-3) | API tìm gia sư, matching score, đăng ký học thử (OTP SMS) |
| 2.3 | Module Parent Tra cứu FAQ & Thông tin trung tâm (FR-4) | API + Giao diện FAQ & thông tin |
| **3.0** | **Module Gia sư (Tutor Portal)** | |
| 3.1 | Enrollment, Match Offer acceptance (Unlock SĐT & Địa chỉ Phụ huynh), QR proof payment sau 30 ngày dạy | API CRUD tương ứng |
| 3.2 | Curriculum Management Dual-Mode (FR-30): AI sinh khung chương trình 2 cấp + Import JSON từ ChatGPT ngoài | API CRUD curriculum, tích hợp AI Service |
| 3.3 | Tutor Assistant Dual-Mode (FR-8, FR-9): AI sinh bài tập bám sát **Student Knowledge Profile (SKP)** + đáp án + giải thích + Import File 0 Token Cost | API sinh bài tập nhúng SKP, duyệt & giao bài |
| 3.4 | Vận hành: Rate Card, Private Notes, Lịch dạy, Đổi lịch/Báo nghỉ, Lịch học thử & Cố định (`ACTIVE`), Upload tài liệu S3 (FR-21, FR-25→FR-29) | API tương ứng |
| **4.0** | **Module Học sinh (Student Portal)** | |
| 4.1 | Làm bài trực tuyến, Auto-grading, AI Explanation chi tiết (FR-11→FR-13) | Giao diện & API hoàn chỉnh |
| 4.2 | **Student Knowledge Profile (SKP) & Elo Rating Engine (FR-38)**: Tự động cập nhật `mastery_score` và `difficulty` câu hỏi theo thuật toán Elo Rating sau mỗi câu trả lời | Engine Elo rating + Bảng SKP tự động cập nhật |
| 4.3 | **Ôn tập ngắt quãng (Spaced Repetition - SM-2) (FR-39)**: Tự động lập lịch `next_review`, hiển thị danh sách câu hỏi đến hạn ôn hàng ngày (Daily Session 5 phút) | Engine SM-2 + Giao diện Ôn tập ngắt quãng |
| 4.4 | Báo cáo tiến bộ cá nhân: Chỉ số Chăm chỉ + Biểu đồ Tiến bộ Năng lực (FR-15); Xem tài liệu/video theo bài học (FR-22) | Giao diện & API hoàn chỉnh |
| **5.0** | **Module Admin (Admin Dashboard)** | |
| 5.1 | Match Request Management, Tạo Match Offer, Tính phí tự động (FR-16) | Giao diện & API hoàn chỉnh |
| 5.2 | Duyệt phí QR proof sau 30 ngày dạy chính thức (FR-23) | Giao diện & API hoàn chỉnh |
| 5.3 | RBAC Audit log, Báo cáo vận hành (FR-19, FR-20, FR-24) | Giao diện & API hoàn chỉnh |
| 5.4 | Quản lý nhân sự Lễ tân (FR-31) & Xử lý khiếu nại / Đối soát tài chính (`REFUND`/`REMATCH`) (FR-32) | Giao diện & API hoàn chỉnh |
| **6.0** | **Module Lễ tân (Receptionist Portal)** | |
| 6.1 | Yêu cầu ghép lớp & Duyệt thanh toán QR proof (FR-33, FR-34) | Giao diện & API xử lý |
| 6.2 | Quản lý thông tin Gia sư & Học sinh, Thông báo trung tâm (FR-35, FR-36) | Giao diện & API tra cứu |
| 6.3 | Tiếp nhận & ghi nhận khiếu nại trực tiếp tại trung tâm (`REFUND`/`REMATCH`) (FR-37) | Giao diện & API ghi nhận khiếu nại |
| **7.0** | **AI Service (Python + LangGraph)** | |
| 7.1 | Thiết kế LangGraph flow (state, node, guardrail) | Kiến trúc agent |
| 7.2 | Agent sinh Khung chương trình 2 cấp (Option A) | Endpoint `/curriculum/generate` |
| 7.3 | Agent Tutor Assistant: sinh bài tập bám sát bối cảnh SKP + đáp án + giải thích (Option A) | Endpoint `/homework/generate` nhúng SKP |
| 7.4 | Parser chế độ Import (Option B — JSON/Text từ Web AI ngoài 0 Token Cost) | Module parse & validate |
| 7.5 | Content Moderation filter + Privacy (ẩn danh hoá input học sinh) | Middleware kiểm duyệt |
| **8.0** | **Tích hợp & Kiểm thử** | |
| 8.1 | Tích hợp end-to-end theo 5 cổng và 4 UJ chính (UJ-1→UJ-4) | Luồng chạy thông suốt |
| 8.2 | Unit test + Integration test (ưu tiên RBAC, tính phí 30 ngày, Elo rating, SM-2, chấm điểm) | Test suite |
| 8.3 | UAT nội bộ (đóng vai Phụ huynh/Gia sư/Học sinh/Admin/Lễ tân), sửa lỗi | Bug list đã fix |
| **9.0** | **Triển khai & Bàn giao** | |
| 9.1 | Đóng gói Docker, deploy môi trường staging/demo | Hệ thống chạy online |
| 9.2 | Viết tài liệu kỹ thuật (README, API doc) + tài liệu hướng dẫn sử dụng | Tài liệu bàn giao |
| 9.3 | Chuẩn bị & thực hiện demo, bàn giao đề tài | Buổi báo cáo/demo |

---

# 4. Kế hoạch triển khai chi tiết (10 tuần / 2,5 tháng)

Mỗi tuần phân công theo module, không theo vai trò cố định — cả 3 thành viên đều có thể đảm nhận BE, FE hoặc AI tùy hạng mục. Ưu tiên hoàn thành các luồng vận hành cơ bản trước (Tuần 2–6), sau đó tích hợp AI Service (Tuần 7–8).

| Tuần | Thời gian | Mã WBS | Giai đoạn | Module chính | Công việc cụ thể |
| --- | --- | ---------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | 07/09 – 13/09 | 1.1, 1.2, 1.3, 1.4, 1.5, 7.1 | Khởi tạo | Hạ tầng & Thiết kế | Rà soát PRD, chốt phạm vi MVP; Thiết kế kiến trúc hệ thống (FE–BE–AI); Thiết kế ERD bổ sung SKP, SM-2, Complaints, Receptionists; Setup Spring Boot skeleton, Docker Compose; Dựng prototype ReactJS 5 cổng; Thiết kế LangGraph flow |
| 2 | 14/09 – 20/09 | 1.6, 1.7, 1.9, 2.1 | Nền tảng & Đã đặc tả | Auth, Layout & Thiết kế Use Case/State | Auth JWT + RBAC theo Enrollment; Layout chung, routing 5 cổng, component thư viện dùng chung; Viết tài liệu đặc tả Use Case 5 actors; Vẽ sơ đồ State Machine cho các đối tượng (Enrollment, Match Request, Homework, Payment, Complaint) |
| 3 | 21/09 – 27/09 | 1.8, 1.10, 2.2, 2.3 | Parent Portal & UML | Module Phụ huynh & Sơ đồ Sequence/Activity | API + UI FR-1→FR-4 (tìm gia sư Smart-Match, matching score, đăng ký học thử, FAQ); Vẽ sơ đồ Sequence Diagram cho các thủ tục quan trọng; Vẽ sơ đồ Activity Diagram cho các nghiệp vụ phức tạp |
| 4 | 28/09 – 04/10 | 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3 | Admin & Receptionist Vận hành | Module Admin & Lễ tân | API + UI FR-16, FR-23 (Match Request, Match Offer, tính phí tự động, duyệt phí QR proof sau 30 ngày); FR-19, FR-20, FR-24 (RBAC audit log, báo cáo vận hành); **Module Lễ tân (FR-33→FR-37: ghép lớp, duyệt phí, tiếp nhận & đối soát khiếu nại REFUND/REMATCH)** |
| 5 | 05/10 – 11/10 | 3.1, 3.4 | Tutor — Vận hành cơ bản | Module Gia sư | API + UI nhận/từ chối lớp (mở khóa SĐT/địa chỉ) + nộp QR proof; Cấu hình lịch dạy & học thử, chốt lịch cố định (`ACTIVE`) (FR-29); Quản lý Khung chương trình thủ công; Rate Card, Private Notes, Đổi lịch/Báo nghỉ; Upload tài liệu S3 (FR-21, FR-25→FR-28) |
| 6 | 12/10 – 18/10 | 4.1, 4.2, 4.3, 4.4, 3.3 (Non-AI) | Student & Tutor Homework (Core Personalization) | Module Học sinh + Gia sư (Cơ bản) | Giao bài tập thủ công (Non-AI); API + UI FR-11→FR-13 (làm bài trực tuyến, Auto-grading tự động chấm điểm); **Student Knowledge Profile (SKP & Elo Rating engine - FR-38)**; **Spaced Repetition (SM-2 daily review engine & UI - FR-39)**; FR-15 (báo cáo tiến bộ cá nhân); FR-22 (xem tài liệu/video) |
| 7 | 19/10 – 25/10 | 3.2, 7.2, 7.4 | Tutor — AI Curriculum | Module Gia sư + AI Service | Xây dựng & hoàn thiện AI Curriculum Agent (Option A — sinh khung chương trình 2 cấp); Parser Import Option B (Curriculum JSON/Text 0 Token Cost); UI Curriculum Dual-Mode |
| 8 | 26/10 – 01/11 | 3.3 (AI), 7.3, 7.4, 7.5 | Tutor Assistant AI & Student AI (SKP-Integrated) | AI Service & Tích hợp AI | Agent Tutor Assistant (sinh bài tập bám sát bối cảnh SKP + đáp án + giải thích); Parser Import Option B (Bài tập nhúng SKP 0 Token Cost); Tích hợp xem giải thích AI trong Student Portal; Content Moderation & Privacy filter |
| 9 | 02/11 – 08/11 | 8.1, 8.2, 7.3 (Tối ưu) | Tích hợp toàn hệ thống | Tích hợp & Tối ưu AI | Tích hợp BE↔AI Service qua API Gateway; Nối toàn bộ FE 5 cổng với API AI thật; Rà soát RBAC; Tối ưu độ trễ AI Service (benchmark <5s); Test luồng UJ-1→UJ-4 |
| 10 | 09/11 – 15/11 | 8.2, 8.3, 9.1, 9.2 | Kiểm thử & Triển khai | Kiểm thử & Triển khai | Fix bug; Unit test + Integration test; UAT nội bộ 5 roles; Deploy staging; Viết API doc, tài liệu kỹ thuật, hướng dẫn sử dụng |
| 10.5 | 14/11 – 15/11 | 9.1, 9.3 | Bàn giao | Bàn giao | Đóng gói Docker production; Chuẩn bị & sẵn sàng demo |

## 4.1 Cột mốc (Milestones)

| Mốc | Thời điểm | Tiêu chí hoàn thành |
| ----------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **M1 — Kiến trúc & Nền tảng 5 cổng sẵn sàng** | Cuối tuần 2 | Auth hoạt động, ERD (có SKP, SM-2, Complaints) được duyệt, repo/CI/CD/Docker chạy được, prototype ReactJS 5 cổng thành công |
| **M2 — Luồng Ghép lớp, Phí 30 ngày & Vận hành Phụ huynh - Admin - Lễ tân hoàn chỉnh** | Cuối tuần 4 | Parent Portal, Admin Dashboard & Receptionist Portal vận hành thông suốt (tìm gia sư, tạo Match Offer, tính & duyệt phí QR 30 ngày, quản lý lễ tân, tiếp nhận & đối soát khiếu nại REFUND/REMATCH) |
| **M3 — Vận hành Gia sư & Core Personalization Học sinh hoàn chỉnh (Không AI)** | Cuối tuần 6 | UJ-1→UJ-4 chạy end-to-end phiên bản cơ bản (nhận lớp unlock liên hệ, giao bài thủ công, làm bài, auto-grading, cập nhật SKP Elo rating, ôn tập ngắt quãng Spaced Repetition SM-2) |
| **M4 — AI Service & Assistant AI nhúng SKP hoàn chỉnh** | Cuối tuần 8 | Tích hợp hoàn tất AI Curriculum Agent, Tutor Assistant Agent (bám sát SKP), Import Parser 0 Token Cost, Content Moderation & AI Explanation |
| **M5 — Tích hợp toàn hệ thống 5 cổng** | Cuối tuần 9 | Toàn bộ 5 cổng liên thông qua dữ liệu thật kèm AI Service, RBAC kiểm chứng, benchmark AI <5s, Elo & SM-2 vận hành chính xác |
| **M6 — Bàn giao đề tài** | Cuối tuần 10 (2,5 tháng) | Deploy staging thành công, tài liệu đầy đủ, sẵn sàng demo |

## 4.2 Rủi ro chính & phương án ứng phó

| Rủi ro | Ảnh hưởng | Phương án |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Chất lượng nội dung AI sinh ra chưa đạt (câu hỏi/giải thích không chính xác) | Gia sư phải sửa nhiều, giảm hiệu quả | Cho phép gia sư luôn xem trước & chỉnh sửa trước khi giao bài; ưu tiên luồng thủ công trước, tinh chỉnh prompt ở tuần 7–8 |
| Thời gian sinh nội dung AI > 5s | Ảnh hưởng SM-3, trải nghiệm Gia sư | Benchmark ở tuần 8–9, tối ưu prompt/streaming nếu cần |
| Tích hợp 3 khối (FE-BE-AI) trễ do phụ thuộc lẫn nhau | Trễ tiến độ tuần 9 | Định nghĩa API contract (OpenAPI) từ tuần 1–2, các luồng nghiệp vụ không phụ thuộc AI được phát triển và kiểm thử trước |
| Bổ sung Cổng Lễ tân & Spaced Repetition tăng khối lượng công việc | Nguy cơ trễ hạn 10 tuần | Phân chia công việc rõ ràng trong 3 người; ưu tiên xây dựng component tái sử dụng giữa Admin Dashboard và Receptionist Portal; tập trung vào tính toán SM-2 & Elo Rating cốt lõi gọn nhẹ |

---

*Tài liệu này được biên soạn dựa trên PRD "Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition" (v.final, cập nhật 2026-09-19).*
