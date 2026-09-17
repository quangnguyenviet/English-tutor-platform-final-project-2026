---
title: Kế hoạch triển khai đề tài — Ứng dụng AI hỗ trợ vận hành & giảng dạy gia sư tiếng Anh 1-1
version: 1.3
ngày lập: 2026-09-04 (cập nhật 2026-09-15)
nhóm: 3 thành viên
thời lượng: 2,5 tháng (10 tuần)
---
# 1. Mô tả ngắn đề tài

**Tên đề tài:** Ứng dụng AI hỗ trợ vận hành và giảng dạy cho mô hình gia sư tiếng Anh 1-1

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1, với AI là công cụ giúp gia sư **tiết kiệm thời gian soạn bài** và học sinh **tự học hiệu quả hơn**

**Giá trị cốt lõi:**

- **Gia sư**: nhận lớp, soạn chương trình, giao bài tập cá nhân hóa — tất cả trên di động, trong vài phút.
- **Học sinh**: làm bài, được chấm tức thì, và tự hiểu lý do sai qua lời giải thích AI.
- **Phụ huynh**: đăng ký học thử nhanh, xem tiến bộ con bằng biểu đồ.
- **Admin**: ghép lớp, duyệt phí, và quản lý vận hành trung tâm tập trung tại một nơi.

**Kiến trúc công nghệ:**

| Thành phần | Công nghệ | Vai trò |
| ------------ | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Frontend | ReactJS | Parent Portal, Tutor Portal (mobile-first), Student Portal, Admin Dashboard |
| Backend | Spring Boot | API Gateway duy nhất, nghiệp vụ, RBAC theo`Enrollment`, PostgreSQL, Audit log |
| AI Service | Python + LangGraph | Agent sinh Khung chương trình, Agent Tutor Assistant (sinh bài tập + đáp án + giải thích), Content Moderation, Cost guardrail |
| Hạ tầng | PostgreSQL, S3-compatible storage, Docker | Lưu trữ dữ liệu, tài liệu/video, đóng gói triển khai |

---

# 2. Mô tả phạm vi (Scope)

## 2.1 Trong phạm vi

| Module | Nội dung chính | FR liên quan |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Parent Portal** | Landing page, Form tìm gia sư trực quan, danh sách gia sư kèm Matching Score, đăng ký học thử (OTP SMS), FAQ | FR-1, FR-2, FR-3, FR-4 |
| **Tutor Portal** | Nhận/từ chối lời mời nhận lớp, nộp minh chứng phí (QR proof),**Curriculum Management Dual-Mode** (tối đa 2 cấp), **Tutor Assistant Dual-Mode** (Direct AI Generation / Import File), duyệt & giao bài, upload video/tài liệu (S3), lịch dạy, đổi lịch/báo nghỉ, cấu hình lịch học thử & lịch cố định, Rate Card, danh sách học sinh & Private Notes | FR-6, FR-8, FR-9, FR-21, FR-25 → FR-30 |
| **Student Portal** | Làm bài trực tuyến (trắc nghiệm/điền từ/sửa lỗi), tự động chấm điểm, xem lời giải thích AI (chế độ per-question hoặc submit-all), xem video/tài liệu theo bài học, báo cáo tiến bộ cá nhân (Chỉ số Chăm chỉ + Biểu đồ Năng lực) | FR-11, FR-12, FR-13, FR-15, FR-22 |
| **Admin Dashboard** | Quản lý Match Request, tạo Match Offer, tính phí tự động, duyệt phí QR proof & mở khóa liên hệ, phân quyền RBAC theo Enrollment, audit log, báo cáo vận hành | FR-16, FR-19, FR-20, FR-23, FR-24 |
| **AI Service (LangGraph)** | Agent sinh khung chương trình 2 cấp; Agent sinh bài tập + đáp án + giải thích chi tiết; Parser cho chế độ Import (JSON/Text từ ChatGPT/Claude ngoài); Content Moderation filter | FR-8, FR-30 |
| **Nền tảng kỹ thuật** | Spring Boot API Gateway, JWT Auth (24h), Row-level security theo Enrollment, PostgreSQL, S3 storage, Docker deployment, APM logging cơ bản | Mục 8 (NFR) |

## 2.2 Ngoài phạm vi

- Đánh giá gia sư sau buổi học thử (Trial Lesson Review).
- Nhật ký buổi dạy (Lesson Log) thủ công.
- Khung chương trình học đa cấp phức tạp (> 2 cấp).
- Thanh toán trực tuyến tự động (chỉ chuyển khoản thủ công + Admin duyệt).
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
| 1.2 | Thiết kế kiến trúc hệ thống (FE–BE–AI, luồng REST nội bộ) | Sơ đồ kiến trúc |
| 1.3 | Thiết kế CSDL (ERD: Enrollment, Match Request, Curriculum, Homework, Payment...) | ERD + DDL PostgreSQL |
| 1.4 | Dựng prototype ReactJS 4 cổng (Parent/Tutor/Student/Admin) — thay wireframe/Figma | Prototype ReactJS 4 cổng chạy được |
| 1.5 | Thiết lập môi trường: Git repo, CI/CD cơ bản, Docker Compose (BE+FE+AI+DB) | Repo khởi tạo, pipeline chạy được |
| 1.6 | Dựng layout chung, routing & component thư viện dùng chung cho 4 cổng | Design system, layout & component dùng chung |
| 1.7 | Viết tài liệu đặc tả Use Case chi tiết cho các actors (Parent, Tutor, Student, Admin) | Tài liệu đặc tả Use Case (Use Case Specification) |
| 1.8 | Thiết kế sơ đồ tuần tự (Sequence Diagram) cho các thủ tục / chức năng quan trọng (Tạo Match Offer, Duyệt phí QR, AI sinh/giao bài, Auto-grading...) | Tập sơ đồ Sequence Diagram (UML) |
| 1.9 | Thiết kế sơ đồ trạng thái (State Machine Diagram) cho các đối tượng trung tâm (Enrollment, Match Request, Homework/Submission, Payment QR) | Tập sơ đồ State Machine Diagram (UML) |
| 1.10 | Thiết kế sơ đồ hoạt động (Activity Diagram) cho các nghiệp vụ phức tạp (Luồng Dual-Mode AI/Import, Luồng ghép lớp & duyệt phí, Luồng đổi lịch/báo nghỉ) | Tập sơ đồ Activity Diagram (UML) |
| **2.0** | **Module Phụ huynh (Parent Portal)** | |
| 2.1 | Auth JWT + RBAC theo`Enrollment` | API Auth, middleware phân quyền |
| 2.2 | Module Parent/Match Request (FR-1→FR-4) | API tìm gia sư, matching score, đăng ký học thử |
| 2.3 | Module Parent Tra cứu FAQ & Thông tin trung tâm (FR-4) | API + Giao diện FAQ & thông tin |
| **3.0** | **Module Gia sư (Tutor Portal)** | |
| 3.1 | Enrollment, Match Offer acceptance, QR proof payment | API CRUD tương ứng |
| 3.2 | Curriculum Management Dual-Mode (FR-30): AI sinh khung chương trình 2 cấp + Import JSON từ ChatGPT ngoài | API CRUD curriculum, tích hợp AI Service |
| 3.3 | Tutor Assistant Dual-Mode (FR-8, FR-9): AI sinh bài tập + đáp án + giải thích + Import File | API sinh bài tập, duyệt & giao bài |
| 3.4 | Vận hành: Rate Card, Private Notes, Lịch dạy, Đổi lịch/Báo nghỉ, Upload tài liệu/S3 (FR-21, FR-25→FR-29) | API tương ứng |
| **4.0** | **Module Học sinh (Student Portal)** | |
| 4.1 | Làm bài trực tuyến, Auto-grading, AI Explanation (FR-11→FR-13) | Giao diện & API hoàn chỉnh |
| 4.2 | Báo cáo tiến bộ cá nhân: Chỉ số Chăm chỉ + Biểu đồ Năng lực (FR-15); Xem tài liệu/video theo bài học (FR-22) | Giao diện & API hoàn chỉnh |
| **5.0** | **Module Admin (Admin Dashboard)** | |
| 5.1 | Match Request Management, Tạo Match Offer, Tính phí tự động (FR-16) | Giao diện & API hoàn chỉnh |
| 5.2 | Duyệt phí QR proof, Mở khóa liên hệ Phụ huynh (FR-23) | Giao diện & API hoàn chỉnh |
| 5.3 | RBAC Audit log, Báo cáo vận hành (FR-19, FR-20, FR-24) | Giao diện & API hoàn chỉnh |
| **6.0** | **AI Service (Python + LangGraph)** | |
| 6.1 | Thiết kế LangGraph flow (state, node, guardrail) | Kiến trúc agent |
| 6.2 | Agent sinh Khung chương trình 2 cấp (Option A) | Endpoint`/curriculum/generate` |
| 6.3 | Agent Tutor Assistant: sinh câu hỏi + đáp án + giải thích (Option A) | Endpoint`/homework/generate` |
| 6.4 | Parser chế độ Import (Option B — JSON/Text từ Web AI ngoài) | Module parse & validate |
| 6.5 | Content Moderation filter + Privacy (ẩn danh hoá input) | Middleware kiểm duyệt |
| **7.0** | **Tích hợp & Kiểm thử** | |
| 7.1 | Tích hợp end-to-end theo từng UJ (UJ-1→UJ-4) | Luồng chạy thông suốt |
| 7.2 | Unit test + Integration test (ưu tiên RBAC, tính phí, chấm điểm) | Test suite |
| 7.3 | UAT nội bộ (đóng vai Phụ huynh/Gia sư/Học sinh/Admin), sửa lỗi | Bug list đã fix |
| **8.0** | **Triển khai & Bàn giao** | |
| 8.1 | Đóng gói Docker, deploy môi trường staging/demo | Hệ thống chạy online |
| 8.2 | Viết tài liệu kỹ thuật (README, API doc) + tài liệu hướng dẫn sử dụng | Tài liệu bàn giao |
| 8.3 | Chuẩn bị & thực hiện demo, bàn giao đề tài | Buổi báo cáo/demo |

---

# 4. Kế hoạch triển khai chi tiết (10 tuần / 2,5 tháng)

Mỗi tuần phân công theo module, không theo vai trò cố định — cả 3 thành viên đều có thể đảm nhận BE, FE hoặc AI tùy hạng mục. Ưu tiên hoàn thành các luồng vận hành cơ bản trước (Tuần 2–6), sau đó tích hợp AI Service (Tuần 7–8).

| Tuần | Mã WBS | Giai đoạn | Module chính | Công việc cụ thể |
| ----------------------- | ---------------------------- | --------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1 | 1.1, 1.2, 1.3, 1.4, 1.5, 6.1 | Khởi tạo | Hạ tầng & Thiết kế | Rà soát PRD, chốt phạm vi MVP; Thiết kế kiến trúc hệ thống (FE–BE–AI); Thiết kế ERD, setup Spring Boot skeleton, Docker Compose; Dựng prototype ReactJS 4 cổng; Thiết kế LangGraph flow, setup AI service skeleton |
| 2 | 1.6, 1.7, 1.9, 2.1 | Nền tảng & Đã đặc tả | Auth, Layout & Thiết kế Use Case/State | Auth JWT + RBAC theo Enrollment; Layout chung, routing, component thư viện dùng chung; Viết tài liệu đặc tả Use Case chi tiết; Vẽ sơ đồ State Machine cho các đối tượng trung tâm (Enrollment, Match Request, Homework, Payment) |
| 3 | 1.8, 1.10, 2.2, 2.3 | Parent Portal & UML | Module Phụ huynh & Sơ đồ Sequence/Activity | API + UI FR-1→FR-4 (tìm gia sư, matching score cơ bản, đăng ký học thử, FAQ); Vẽ sơ đồ Sequence Diagram cho các thủ tục quan trọng; Vẽ sơ đồ Activity Diagram cho các nghiệp vụ phức tạp |
| 4 | 5.1, 5.2, 5.3 | Admin Dashboard — Vận hành | Module Admin | API + UI FR-16, FR-23 (Match Request, Match Offer, tính phí tự động, duyệt phí QR proof, mở khóa liên hệ Phụ huynh); FR-19, FR-20, FR-24 (RBAC audit log, báo cáo vận hành cơ bản) |
| 5 | 3.1, 3.4 | Tutor — Vận hành cơ bản | Module Gia sư | API + UI nhận/từ chối lớp + nộp QR proof; Cấu hình lịch dạy & học thử (FR-29); Quản lý Khung chương trình thủ công (Non-AI); Rate Card, Private Notes, Đổi lịch/Báo nghỉ; Upload tài liệu S3 (FR-21, FR-25→FR-28) |
| 6 | 3.3 (Non-AI), 4.1, 4.2 | Student & Tutor Homework | Module Học sinh + Gia sư (Cơ bản) | Giao bài tập thủ công (Non-AI); API + UI FR-11→FR-13 (làm bài trực tuyến trắc nghiệm/điền từ, Auto-grading tự động chấm điểm); FR-15 (báo cáo tiến bộ cá nhân); FR-22 (xem tài liệu/video) |
| 7 | 3.2, 6.2, 6.4 | Tutor — AI Curriculum | Module Gia sư + AI Service | Xây dựng & hoàn thiện AI Curriculum Agent (Option A — sinh khung chương trình 2 cấp); Parser Import Option B (Curriculum JSON/Text); UI Curriculum Dual-Mode |
| 8 | 3.3 (AI), 6.3, 6.4, 6.5 | Tutor Assistant AI & Student AI | AI Service & Tích hợp AI | Agent Tutor Assistant (sinh bài tập + đáp án + giải thích); Parser Import Option B (Bài tập); Tích hợp xem giải thích AI trong Student Portal; Content Moderation & Privacy filter |
| 9 | 7.1, 7.2, 6.3 (Tối ưu) | Tích hợp toàn hệ thống | Tích hợp & Tối ưu AI | Tích hợp BE↔AI Service qua API Gateway; Nối toàn bộ FE với API AI thật; Rà soát RBAC; Tối ưu độ trễ AI Service (benchmark <5s); Test luồng UJ-1→UJ-4 |
| 10 | 7.2, 7.3, 8.1, 8.2 | Kiểm thử & Triển khai | Kiểm thử & Triển khai | Fix bug; Unit test + Integration test; UAT nội bộ; Deploy staging; Viết API doc, tài liệu kỹ thuật, hướng dẫn sử dụng |
| 10.5 (2–3 ngày cuối) | 8.1, 8.3 | Bàn giao | Bàn giao | Đóng gói Docker production; Chuẩn bị & sẵn sàng demo |

## 4.1 Cột mốc (Milestones)

| Mốc | Thời điểm | Tiêu chí hoàn thành |
| ----------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **M1 — Kiến trúc & Nền tảng sẵn sàng** | Cuối tuần 2 | Auth hoạt động, repo/CI/CD/Docker chạy được, prototype ReactJS được duyệt |
| **M2 — Luồng Ghép lớp & Vận hành Phụ huynh - Admin hoàn chỉnh** | Cuối tuần 4 | Parent Portal & Admin Dashboard vận hành thông suốt (tìm gia sư, tạo Match Offer, tính & duyệt phí QR) |
| **M3 — Vận hành Gia sư & Học sinh cơ bản hoàn chỉnh (Không AI)** | Cuối tuần 6 | UJ-1, UJ-2, UJ-3, UJ-4 chạy end-to-end phiên bản vận hành cơ bản (nhận lớp, giao bài thủ công, làm bài, auto-grading chấm điểm) |
| **M4 — AI Service & Assistant AI hoàn chỉnh** | Cuối tuần 8 | Tích hợp hoàn tất AI Curriculum Agent, Tutor Assistant Agent, Import Parser, Content Moderation & AI Explanation |
| **M5 — Tích hợp toàn hệ thống** | Cuối tuần 9 | Toàn bộ 4 cổng liên thông qua dữ liệu thật kèm AI Service, RBAC kiểm chứng, benchmark AI <5s |
| **M6 — Bàn giao đề tài** | Cuối tuần 10 (2,5 tháng) | Deploy staging thành công, tài liệu đầy đủ, sẵn sàng demo |

## 4.2 Rủi ro chính & phương án ứng phó

| Rủi ro | Ảnh hưởng | Phương án |
| ------------------------------------------------------------------------------------------ | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Chất lượng nội dung AI sinh ra chưa đạt (câu hỏi/giải thích không chính xác) | Gia sư phải sửa nhiều, giảm hiệu quả | Cho phép gia sư luôn xem trước & chỉnh sửa trước khi giao bài; ưu tiên luồng thủ công trước, tinh chỉnh prompt ở tuần 7–8 |
| Thời gian sinh nội dung AI > 5s | Ảnh hưởng SM-3, trải nghiệm Gia sư | Benchmark ở tuần 8–9, tối ưu prompt/streaming nếu cần |
| Tích hợp 3 khối (FE-BE-AI) trễ do phụ thuộc lẫn nhau | Trễ tiến độ tuần 9 | Định nghĩa API contract (OpenAPI) từ tuần 1–2, các luồng nghiệp vụ không phụ thuộc AI được phát triển và kiểm thử trước |
| Chỉ 3 người, khối lượng công việc lớn | Quá tải, giảm chất lượng | Bám sát MVP scope (mục 2.2), ưu tiên luồng vận hành cốt lõi, không mở rộng tính năng ngoài phạm vi |

---

*Tài liệu này được biên soạn dựa trên PRD "Ứng dụng AI hỗ trợ vận hành và giảng dạy cho mô hình gia sư tiếng Anh 1-1" (v.final, cập nhật 2026-09-04).*
