---
title: Quản lý lịch trình — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
version: 1.4
status: Đã xác nhận ngày khởi công 07/09/2026
ngày lập: 2026-09-06
ngày cập nhật: 2026-09-19
người biên soạn: Nhóm dự án (3 thành viên)
căn cứ: docs/ke-hoach-trien-khai.md (v1.4) + PRD v.final (2026-09-19)
thời lượng: 2,5 tháng (≈10 tuần)
baseline: 07/09/2026 → 17/11/2026
ngày khởi công đã xác nhận: 07/09/2026
---
# Quản lý lịch trình dự án (Project Schedule Management)

> Tài liệu này là **công cụ điều hành** cho lịch trình dự án: nó ghi nhận kế hoạch 10 tuần,
> các cột mốc, cách theo dõi, và quy trình xử lý khi lịch trình bị trượt.
> Theo thống nhất của nhóm, **ngày khởi công chính thức là Thứ 2 `07/09/2026`**;
> toàn bộ ngày tháng trong tài liệu dựa trên mốc khởi công này và là **baseline chính thức**.

---

# 1. Giới thiệu

## 1.1 Mục đích

- Thống nhất **một nguồn duy nhất** (single source of truth) về lịch trình của dự án cho cả 3 thành viên.
- Gắn kết WBS với **tuần làm việc**, **đầu ra** và **tiêu chí hoàn thành** để mọi công việc đều kiểm chứng được.
- Định nghĩa **nhịp điều hành** (họp, báo cáo, review) và **cổng kiểm soát** tại các cột mốc M1–M6.
- Định rõ **quy trình thay đổi** khi lịch trình trượt để nhóm phản ứng nhanh, không thay đổi "âm thầm".

## 1.2 Phạm vi

Tài liệu bao phủ toàn bộ **10 tuần triển khai + giai đoạn bàn giao** của dự án, từ khởi tạo
đến demo + bàn giao đề tài. Không bao gồm chi tiết kỹ thuật nội bộ của từng module (xem PRD và Kế hoạch triển khai).

## 1.3 Đối tượng sử dụng

- **Nhóm dự án (3 thành viên)** — người trực tiếp vận hành lịch trình.
- **Giảng viên hướng dẫn / Hội đồng** — dùng để theo dõi tiến độ tại các mốc và buổi báo cáo.
- **Người mới gia nhập nhóm** — đọc tài liệu để nắm nhanh quy ước điều hành.

## 1.4 Căn cứ & tài liệu tham chiếu

| Ký hiệu | Tài liệu                                         | Vị trí (repository)                                                        |
| --------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| PRD       | PRD v.final (2026-09-19)                          | `_bmad-output/planning-artifacts/prds/prd-final_project-2026-08-31/prd.md` |
| KHKD      | Kế hoạch triển khai đề tài v1.4 (2026-09-19) | `docs/ke-hoach-trien-khai.md`                                              |

> ⚠️ Trong tài liệu này, số WBS (1.x → 9.x) và số FR (FR-1 → FR-39) dùng lại nguyên văn từ KHKD v1.4 và PRD v.final để tránh phát sinh định nghĩa mới.

---

# 2. Thông tin dự án & kiến trúc (tóm tắt)

| Mục               | Chi tiết                                                                                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tên đề tài     | Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition                                                                    |
| Quy mô nhóm      | 3 thành viên                                                                                                                                            |
| Thời lượng      | 2,5 tháng (≈10 tuần), baseline 07/09/2026 – 17/11/2026                                                                                                |
| Frontend           | ReactJS (5 cổng: Parent / Tutor mobile-first / Student / Admin Dashboard / Receptionist Portal)                                                                                         |
| Backend            | Spring Boot — API Gateway duy nhất, RBAC theo `Enrollment`, auth JWT 24h, PostgreSQL, audit log                                                                        |
| AI Service         | Python + LangGraph — Agent sinh Khung chương trình 2 cấp, Agent Tutor Assistant (sinh bài tập bám sát SKP + đáp án + giải thích), Parser Import 0 Token Cost, Content Moderation                                                                  |
| Core Personalization | Student Knowledge Profile (SKP) với Thuật toán Elo Rating, Spaced Repetition Engine với Thuật toán SM-2 |
| Hạ tầng          | PostgreSQL (thực thể SKP, SM-2, Complaints, Audit Logs...), S3-compatible storage, Docker Compose, CI/CD cơ bản                                                                                                 |
| Các luồng chính | UJ-1 (Phụ huynh tìm gia sư → học thử), UJ-2 (Gia sư nhận lớp unlock SĐT → giao bài AI nhúng SKP → nộp phí QR 30 ngày), UJ-3 (Học sinh làm bài auto-grading → Elo SKP → Ôn tập ngắt quãng SM-2), UJ-4 (Admin ghép lớp, duyệt phí 30 ngày, quản lý lễ tân & đối soát khiếu nại REFUND/REMATCH) |

---

# 3. Nguyên tắc & phương pháp quản lý lịch trình

| #  | Nguyên tắc                                                       | Mô tả                                                                                                                                                      |
| -- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| P1 | **Lập lịch theo tuần**                                    | Lịch trình chia thành 10 tuần + giai đoạn bàn giao; mỗi tuần có một tập WBS xác định và tiêu chí hoàn thành riêng.                      |
| P2 | **Điều khiển theo cột mốc**                             | 6 cột mốc M1–M6 đóng vai trò "cổng kiểm soát"; tuần không đạt mốc thì áp dụng quy trình mục 12.                                           |
| P3 | **Phân công theo module, không theo vai trò cố định** | Theo KHKD: cả 3 thành viên đều có thể đảm nhận BE/FE/AI tùy hạng mục trong tuần; người phụ trách cụ thể chốt ở buổi họp đầu tuần. |
| P4 | **Đầu ra có thể kiểm chứng**                           | Mỗi tuần phải tạo đầu ra (artifact) cụ thể; hoàn thành tuần = đạt Định nghĩa hoàn thành (Section 13).                                      |
| P5 | **Bảo vệ tuần 9–10**                                     | Tuần tích hợp và kiểm thử là chuỗi phụ thuộc cứng; không kéo việc module muộn vào 2 tuần cuối.                                             |
| P6 | **Cập nhật liên tục, đánh giá tuần**                 | Bảng trạng thái tuần (Section 9) được cập nhật ≥ 2 ngày/tuần (đầu tuần + cuối tuần).                                                        |

---

# 4. Cấu trúc lịch trình tổng thể

## 4.1 Timeline 10 tuần (Baseline 07/09/2026 – 17/11/2026)

```mermaid
gantt
    title Lịch trình dự án — 10 tuần 5 cổng (Baseline: 07/09 → 17/11/2026)
    dateFormat  YYYY-MM-DD
    axisFormat  %d/%m

    section Nền tảng & Vận hành cơ bản 5 cổng
    Tuần 1 — Khởi tạo & Thiết kế 5 cổng (WBS 1.1–1.5, 7.1)                :w1, 2026-09-07, 7d
    Tuần 2 — Nền tảng Auth & Layout 5 cổng (WBS 1.6, 1.7, 1.9, 2.1)        :w2, 2026-09-14, 7d
    M1 — Kiến trúc & Nền tảng 5 cổng sẵn sàng                           :milestone, m1, 2026-09-20, 0d
    Tuần 3 — Parent Portal & UML (WBS 1.8, 1.10, 2.2, 2.3)                 :w3, 2026-09-21, 7d
    Tuần 4 — Admin & Receptionist Vận hành & Khiếu nại (WBS 5.1–5.4, 6.1–6.3) :w4, 2026-09-28, 7d
    M2 — Luồng Ghép lớp, Phí 30 ngày & Vận hành Phụ huynh - Admin - Lễ tân  :milestone, m2, 2026-10-04, 0d
    Tuần 5 — Tutor: Vận hành cơ bản & Unlock liên hệ (WBS 3.1, 3.4)         :w5, 2026-10-05, 7d
    Tuần 6 — Student SKP (Elo) & Spaced Repetition SM-2 (WBS 4.1–4.4, 3.3)   :w6, 2026-10-12, 7d
    M3 — Vận hành Gia sư & Core Personalization Học sinh hoàn chỉnh        :milestone, m3, 2026-10-18, 0d

    section Tích hợp AI Service nhúng SKP
    Tuần 7 — Tutor: AI Curriculum Agent Dual-Mode (WBS 3.2, 7.2, 7.4)     :w7, 2026-10-19, 7d
    Tuần 8 — Tutor Assistant AI nhúng SKP & Student AI (WBS 3.3 AI, 7.3–7.5) :w8, 2026-10-26, 7d
    M4 — AI Service & Assistant AI nhúng SKP hoàn chỉnh                     :milestone, m4, 2026-11-01, 0d

    section Tích hợp toàn hệ thống & Bàn giao
    Tuần 9 — Tích hợp toàn hệ thống 5 cổng & Tối ưu AI (WBS 8.1, 8.2, 7.3) :w9, 2026-11-02, 7d
    M5 — Tích hợp toàn hệ thống 5 cổng                                   :milestone, m5, 2026-11-08, 0d
    Tuần 10 — Kiểm thử & Triển khai (WBS 8.2, 8.3, 9.1, 9.2)               :w10, 2026-11-09, 7d
    Bàn giao & Demo 5 roles (WBS 9.1, 9.3)                                 :w10b, 2026-11-16, 2d
    M6 — Bàn giao đề tài                                                  :milestone, m6, 2026-11-17, 0d
```

> 📌 Ngày trong biểu đồ là **baseline chính thức** theo ngày khởi công 07/09/2026 đã xác nhận.
> Mọi thay đổi về ngày tháng phải theo Quy trình thay đổi (Section 12) và ghi vào Nhật ký (Section 14).

## 4.2 Bảng tổng quan theo tuần

| Tuần | Khoảng ngày | Giai đoạn | Module chính | Mốc kiểm soát |
| ----- | ------------------------- | ------------------------ | ----------------------- | -------------------- |
| T1 | 07/09 – 13/09/2026 | Khởi tạo | Hạ tầng & Thiết kế 5 cổng | — |
| T2 | 14/09 – 20/09/2026 | Nền tảng | Auth, Layout 5 cổng & Use Case/State | **M1** (20/09) |
| T3 | 21/09 – 27/09/2026 | Module | Phụ huynh & Sequence/Activity UML | — |
| T4 | 28/09 – 04/10/2026 | Module | Admin & Lễ tân — Vận hành ghép lớp, Phí 30 ngày & Khiếu nại | **M2** (04/10) |
| T5 | 05/10 – 11/10/2026 | Module | Gia sư — Vận hành cơ bản & Unlock liên hệ Phụ huynh | — |
| T6 | 12/10 – 18/10/2026 | Module | Học sinh — SKP (Elo rating) & Spaced Repetition (SM-2) | **M3** (18/10) |
| T7 | 19/10 – 25/10/2026 | AI Service | Gia sư — AI Curriculum Agent Dual-Mode | — |
| T8 | 26/10 – 01/11/2026 | AI Service | Tutor Assistant AI nhúng SKP & Student AI Explanation | **M4** (01/11) |
| T9 | 02/11 – 08/11/2026 | Tích hợp | Toàn hệ thống 5 cổng & Tối ưu AI (<5s) | **M5** (08/11) |
| T10 | 09/11 – 15/11/2026 | Kiểm thử & Triển khai | Toàn hệ thống 5 cổng | — |
| T10.5 | 16/11 – 17/11/2026 | Bàn giao | Demo 5 roles & bàn giao đề tài | **M6** (17/11) |

---

# 5. Lịch trình chi tiết theo tuần

> Cột "Người phụ trách" được điền vào buổi **Kick-off tuần** (Section 8). Cột "Tiêu chí hoàn thành"
> là đề xuất mặc định; nhóm có thể làm rõ hơn tại buổi họp nhưng không được hạ thấp.

## Tuần 1 — Khởi tạo (07/09 – 13/09/2026)

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | --------------------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------- |
| 1.1 | Rà soát PRD, chốt phạm vi MVP, phân công vai trò | Scope Statement, phân công 3 người | Đã chốt danh sách tính năng MVP & trách nhiệm từng thành viên |
| 1.2 | Thiết kế kiến trúc hệ thống (FE–BE–AI, luồng REST nội bộ qua API Gateway) | Sơ đồ kiến trúc | Sơ đồ được cả nhóm duyệt; xác định API Gateway & luồng gọi AI |
| 1.3 | Thiết kế CSDL (ERD: Enrollment, Match Request, Curriculum, Homework, Payment, SKP, SM-2 Schedules, Complaints, Receptionists…) | ERD + DDL PostgreSQL hoàn chỉnh | ERD v1 + DDL bổ sung SKP, SM-2, Complaints chạy được trên PostgreSQL local |
| 1.4 | Dựng prototype ReactJS 5 cổng (Parent/Tutor/Student/Admin/Receptionist) | Prototype ReactJS 5 cổng chạy được | 5 cổng có luồng demo chạy được (mock data) |
| 1.5 | Thiết lập môi trường: Git repo, CI/CD cơ bản, Docker Compose (BE+FE+AI+DB) | Repo khởi tạo, pipeline chạy được | `docker compose up` chạy đủ các dịch vụ; CI chạy build thành công |
| 7.1 | Thiết kế LangGraph flow (state, node, guardrail) | Kiến trúc agent | Sơ đồ flow agent + danh sách node/state được duyệt |

## Tuần 2 — Nền tảng Auth & Layout (14/09 – 20/09/2026) — **M1**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | -------------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1.6 | Dựng layout chung, routing & component thư viện dùng chung cho 5 cổng | Design system, layout & component dùng chung | 5 cổng dùng chung layout/component; không trùng lặp code UI cơ bản |
| 1.7 | Viết tài liệu đặc tả Use Case chi tiết cho 5 actors (Parent, Tutor, Student, Admin, Receptionist) | Tài liệu đặc tả Use Case | Tài liệu đặc tả Use Case hoàn thành, mô tả rõ các luồng chính/phụ/ngoại lệ |
| 1.9 | Thiết kế sơ đồ trạng thái (State Machine Diagram) cho các đối tượng trung tâm | Tập sơ đồ State Machine Diagram (UML) | Sơ đồ trạng thái hoàn chỉnh cho Enrollment, Match Request, Homework, Payment QR 30 ngày, Complaint |
| 2.1 | Auth JWT + RBAC theo `Enrollment` | API Auth, middleware phân quyền | Đăng nhập/đăng ký được; kiểm tra quyền theo vai trò Enrollment thành công |

### ✔️ M1 — Kiến trúc & Nền tảng 5 cổng sẵn sàng (cuối tuần 2, 20/09/2026)

**Tiêu chí:** Auth hoạt động; repo / CI-CD / Docker chạy được; prototype ReactJS 5 cổng được duyệt.

## Tuần 3 — Parent Portal (21/09 – 27/09/2026)

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| 1.8 | Thiết kế sơ đồ tuần tự (Sequence Diagram) cho các thủ tục/chức năng quan trọng | Tập sơ đồ Sequence Diagram (UML) | Sơ đồ tuần tự hoàn chỉnh cho Ghép lớp, Duyệt phí 30 ngày, AI sinh bài nhúng SKP, Auto-grading & SKP update, Spaced Repetition daily review |
| 1.10 | Thiết kế sơ đồ hoạt động (Activity Diagram) cho các nghiệp vụ phức tạp | Tập sơ đồ Activity Diagram (UML) | Sơ đồ hoạt động hoàn chỉnh cho luồng Dual-Mode AI/Import nhúng SKP, Luồng ghép lớp & duyệt phí 30 ngày, Luồng tiếp nhận & đối soát khiếu nại REFUND/REMATCH |
| 2.2 | Module Parent / Smart-Match Form & Registration (FR-1→FR-3) — Form tìm gia sư trực quan, matching score cơ bản, đăng ký học thử (OTP SMS) | API tìm gia sư, matching score, đăng ký học thử | Luồng tìm gia sư → danh sách gia sư + matching score → tạo Match Request (OTP SMS) hoạt động |
| 2.3 | Module Parent tra cứu FAQ & thông tin trung tâm (FR-4) | API + giao diện FAQ & thông tin | Trang FAQ hiển thị dữ liệu thật từ BE |

## Tuần 4 — Admin Dashboard & Receptionist Portal: Vận hành & Khiếu nại (28/09 – 04/10/2026) — **M2**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------- |
| 5.1 | Match Request Management, tạo Match Offer, tính phí tự động (FR-16) | Giao diện & API hoàn chỉnh | Admin xem request → tạo offer → tính phí tự động theo Rate Card |
| 5.2 | Duyệt phí QR proof sau 30 ngày dạy chính thức (FR-23) | Giao diện & API hoàn chỉnh | Admin duyệt/từ chối proof sau 30 ngày dạy chính thức |
| 5.3 | RBAC Audit log, báo cáo vận hành cơ bản (FR-19, FR-20, FR-24) | Giao diện & API hoàn chỉnh | Audit log ghi đủ hành động; báo cáo vận hành xuất được |
| 5.4 | Quản lý nhân sự Lễ tân (FR-31) & Xử lý khiếu nại đối soát tài chính (`REFUND`/`REMATCH`) (FR-32) | Giao diện & API Admin | Admin tạo/sửa tài khoản Lễ tân; giám sát và phê duyệt tổng hợp đối soát khiếu nại |
| 6.1 | Receptionist: Yêu cầu ghép lớp & Duyệt thanh toán QR proof (FR-33, FR-34) | Giao diện & API Lễ tân | Lễ tân tiếp nhận xử lý ghép lớp và kiểm duyệt ảnh biên lai QR proof |
| 6.2 | Receptionist: Tra cứu hồ sơ GS/HS & Thông báo trung tâm (FR-35, FR-36) | Giao diện & API Lễ tân | Lễ tân tra cứu hồ sơ GS/HS và gửi thông báo vận hành |
| 6.3 | Receptionist: Tiếp nhận & ghi nhận khiếu nại trực tiếp tại trung tâm (`REFUND`/`REMATCH`) (FR-37) | Giao diện & API Lễ tân | Lễ tân tiếp nhận & tạo đơn khiếu nại `REFUND` hoặc `REMATCH` với mã lớp, số tiền |

### ✔️ M2 — Luồng Ghép lớp, Phí 30 ngày & Vận hành Phụ huynh - Admin - Lễ tân hoàn chỉnh (cuối tuần 4, 04/10/2026)

**Tiêu chí:** UJ-1 & UJ-4 phiên bản vận hành cơ bản chạy end-to-end (tìm gia sư → tạo Match Request → Admin/Lễ tân ghép offer → gia sư chấp nhận unlock liên hệ → duyệt phí QR proof 30 ngày → tiếp nhận khiếu nại REFUND/REMATCH).

## Tuần 5 — Tutor: Vận hành cơ bản (05/10 – 11/10/2026)

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | --------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- |
| 3.1 | Enrollment, Match Offer acceptance (Unlock SĐT & Địa chỉ Phụ huynh), QR proof payment sau 30 ngày dạy | API CRUD tương ứng | Gia sư chấp nhận Match Offer → hệ thống unlock liên hệ Phụ huynh; nộp ảnh QR proof sau 30 ngày dạy thành công |
| 3.4 | Rate Card, Private Notes, Lịch dạy, Đổi lịch/Báo nghỉ, Lịch học thử & Cố định (`ACTIVE`), Upload tài liệu S3 (FR-21, FR-25→FR-29) | API tương ứng + UI | Cấu hình lịch học thử & chốt lịch cố định (`ACTIVE`); đổi lịch, upload tài liệu S3 hoạt động |
| 3.2 | Quản lý Khung chương trình thủ công (Non-AI Curriculum Management) | API + UI Khung chương trình cơ bản | Gia sư tạo & chỉnh sửa khung chương trình thủ công 2 cấp |

## Tuần 6 — Student SKP & Spaced Repetition (Core Personalization) (12/10 – 18/10/2026) — **M3**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | -------------------------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------- |
| 3.3 | Giao bài tập thủ công (Non-AI Homework Assignment) | UI & API Giao bài tập | Gia sư soạn và giao bài tập thủ công cho học sinh |
| 4.1 | Làm bài trực tuyến, Auto-grading chấm điểm tự động (FR-11→FR-13) | Giao diện & API làm bài | Học sinh làm bài trực tuyến; hệ thống tự động chấm điểm tức thì |
| 4.2 | **Student Knowledge Profile (SKP) & Elo Rating Engine (FR-38)** | Engine Elo rating + Bảng SKP tự động cập nhật | `mastery_score` và độ khó câu hỏi tự động cập nhật sau mỗi câu làm bài |
| 4.3 | **Ôn tập ngắt quãng Spaced Repetition (SM-2 Algorithm - FR-39)** | Engine SM-2 + Giao diện Ôn tập ngắt quãng | Tự động lập lịch `next_review`, hiển thị danh sách câu hỏi đến hạn ôn hàng ngày (Daily Session 5 phút) |
| 4.4 | Báo cáo tiến bộ (FR-15) — Chỉ số Chăm chỉ + Biểu đồ Tiến bộ Năng lực; Xem tài liệu/video theo bài học (FR-22) | Giao diện & API báo cáo | Biểu đồ năng lực hiển thị từ dữ liệu SKP thật; xem được tài liệu/video |

### ✔️ M3 — Vận hành Gia sư & Core Personalization Học sinh hoàn chỉnh (Không AI) (cuối tuần 6, 18/10/2026)

**Tiêu chí:** Toàn bộ 5 cổng (Parent - Admin - Receptionist - Tutor - Student) chạy end-to-end luồng vận hành cơ bản kèm SKP Elo rating & Spaced Repetition SM-2 chưa tích hợp AI Service.

## Tuần 7 — Tutor: AI Curriculum Agent Dual-Mode (19/10 – 25/10/2026)

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 7.2 | Agent sinh Khung chương trình 2 cấp (Option A — Python + LangGraph) | Endpoint `/curriculum/generate` | AI Agent sinh được khung chương trình 2 cấp đúng cấu trúc JSON |
| 7.4 | Parser chế độ Import (Option B — JSON/Text từ Web AI ngoài 0 Token Cost) — phần Curriculum | Module parse & validate | Import file JSON/Text → curriculum hợp lệ |
| 3.2 | Tích hợp UI Curriculum Dual-Mode (AI Generate + Import JSON 0 Token Cost) | UI Curriculum Dual-Mode | Gia sư chọn Option A (AI) hoặc Option B (Import) để tạo curriculum |

## Tuần 8 — Tutor Assistant AI nhúng SKP & Student AI (26/10 – 01/11/2026) — **M4**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | ------------------------------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| 7.3 | Agent Tutor Assistant: sinh bài tập bám sát bối cảnh SKP + đáp án + giải thích chi tiết (Option A) | Endpoint `/homework/generate` nhúng SKP | AI Agent nhận bối cảnh SKP (Skill mastery, Error patterns) sinh bài tập cá nhân hóa |
| 7.4 | Parser Import Option B — phần bài tập nhúng SKP (0 Token Cost) | Module parse & validate | Import file bài tập cấu trúc SKP từ ngoài → bài tập hợp lệ |
| 3.3 | UI Tutor Assistant (AI Generation / Import File 0 Token Cost) | UI Tutor Assistant hoàn chỉnh | Gia sư sinh bài từ AI bám SKP hoặc import → duyệt & giao bài |
| 7.5 | Content Moderation filter + Privacy (ẩn danh hoá input học sinh) | Middleware kiểm duyệt | Nội dung nhạy cảm bị chặn; input gửi AI được ẩn danh hoá |
| 4.1 | Tích hợp xem lời giải thích AI (AI Explanation) trong Student Portal | UI Student với AI Explanation | Học sinh xem được lời giải thích AI từng câu hoặc sau submit |

### ✔️ M4 — AI Service & Assistant AI nhúng SKP hoàn chỉnh (cuối tuần 8, 01/11/2026)

**Tiêu chí:** Tích hợp hoàn tất các tính năng AI (Curriculum Agent, Tutor Assistant Agent nhúng SKP, Import Parser 0 Token Cost, Moderation & AI Explanation).

## Tuần 9 — Tích hợp toàn hệ thống 5 cổng & Tối ưu AI (02/11 – 08/11/2026) — **M5**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | ----------------------------------------------------------------------- | ------------------------------ | ------------------------------------------------------------ |
| 8.1 | Tích hợp end-to-end theo 5 cổng và 4 UJ chính (UJ-1→UJ-4) | 5 cổng liên thông dữ liệu thật | 4 luồng UJ chạy xuyên 5 cổng FE–BE–AI với dữ liệu thật |
| 8.2 | Unit test + Integration test (ưu tiên RBAC, tính phí 30 ngày, Elo rating, SM-2, chấm điểm) | Test suite | Test suite chạy xanh trên CI; phủ các luồng quan trọng |
| 7.3 | Benchmark & tối ưu độ trễ AI Service | AI Service tối ưu | Độ trễ AI sinh bài tập/chương trình đạt NFR ≤ 5s |

### ✔️ M5 — Tích hợp toàn hệ thống 5 cổng (cuối tuần 9, 08/11/2026)

**Tiêu chí:** Toàn bộ 5 cổng liên thông qua dữ liệu thật kèm AI Service; RBAC kiểm chứng; AI benchmark <5s; SKP & SM-2 vận hành chính xác.

## Tuần 10 — Kiểm thử & Triển khai (09/11 – 15/11/2026)

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | --------------------------------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| 8.2 | Hoàn tất Unit test + Integration test còn lại | Test suite đầy đủ | 100% test quan trọng pass trước khi merge cuối |
| 8.3 | UAT nội bộ (đóng vai Phụ huynh/Gia sư/Học sinh/Admin/Lễ tân), sửa lỗi | Bug list đã fix | Các lỗi critical/high đã fix và verify |
| 9.1 | Đóng gói Docker, deploy môi trường staging/demo | Hệ thống chạy online | Staging truy cập được qua URL demo |
| 9.2 | Viết tài liệu kỹ thuật (README, API doc) + tài liệu hướng dẫn sử dụng | Tài liệu bàn giao | API doc khớp OpenAPI thực tế; hướng dẫn sử dụng đủ 5 vai trò |

## Tuần 10.5 — Bàn giao (16/11 – 17/11/2026, 2–3 ngày cuối) — **M6**

| Mã WBS | Công việc | Đầu ra chính | Tiêu chí hoàn thành |
| ------- | -------------------------------------------------- | -------------------- | ----------------------------------------------------------------- |
| 9.1 | Hoàn tất đóng gói Docker production | Image production | Build production thành công, cấu hình môi trường rõ ràng |
| 9.3 | Chuẩn bị & thực hiện demo 5 roles, bàn giao đề tài | Buổi báo cáo/demo | Kịch bản demo đủ 5 vai trò; buổi bàn giao hoàn tất |

### ✔️ M6 — Bàn giao đề tài (cuối tuần 10)

**Tiêu chí:** Deploy staging thành công; tài liệu đầy đủ; sẵn sàng demo.

---

# 6. Các cột mốc (Milestones) & cổng kiểm soát

| Mốc | Thời điểm (baseline) | Nội dung | Tiêu chí hoàn thành | Hành động tại cổng kiểm soát |
| ------------ | ---------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| **M1** | Cuối tuần 2 — 20/09/2026 | Kiến trúc & Nền tảng 5 cổng sẵn sàng | Auth hoạt động; repo/CI-CD/Docker chạy được; ERD bổ sung SKP, SM-2, Complaints; prototype ReactJS 5 cổng được duyệt | Duyệt prototype; quyết định đi tiếp Tuần 3 |
| **M2** | Cuối tuần 4 — 04/10/2026 | Luồng Ghép lớp, Phí 30 ngày & Vận hành Phụ huynh - Admin - Lễ tân hoàn chỉnh | Parent Portal, Admin Dashboard & Receptionist Portal vận hành thông suốt (tìm gia sư, tạo Match Offer, tính & duyệt phí QR 30 ngày, quản lý lễ tân, tiếp nhận khiếu nại REFUND/REMATCH) | Demo UJ-1 & UJ-4 phiên bản vận hành cơ bản |
| **M3** | Cuối tuần 6 — 18/10/2026 | Vận hành Gia sư & Core Personalization Học sinh hoàn chỉnh (Không AI) | UJ-1, UJ-2, UJ-3, UJ-4 chạy end-to-end phiên bản vận hành cơ bản (nhận lớp unlock liên hệ, giao bài thủ công, làm bài, auto-grading, SKP Elo rating, Spaced Repetition SM-2) | Demo luồng 5 cổng vận hành hoàn chỉnh không AI |
| **M4** | Cuối tuần 8 — 01/11/2026 | AI Service & Assistant AI nhúng SKP hoàn chỉnh | Tích hợp hoàn tất AI Curriculum Agent, Tutor Assistant Agent nhúng SKP, Import Parser 0 Token Cost, Moderation & AI Explanation | Demo UJ-2 & UJ-3 có tích hợp AI Service bám SKP |
| **M5** | Cuối tuần 9 — 08/11/2026 | Tích hợp toàn hệ thống 5 cổng | Toàn bộ 5 cổng liên thông qua dữ liệu thật kèm AI Service, RBAC kiểm chứng, benchmark AI <5s, SKP & SM-2 chính xác | Diễn tập luồng dữ liệu xuyên 5 cổng |
| **M6** | Cuối tuần 10 — 17/11/2026 | Bàn giao đề tài | Deploy staging thành công; tài liệu đầy đủ; sẵn sàng demo 5 roles | Buổi demo/báo cáo với giảng viên hướng dẫn |

> ⚙️ **Trạng thái cổng kiểm soát:** mỗi mốc đánh giá ở 1 trong 3 trạng thái:
> 🟢 **Pass** — đủ tiêu chí, tiếp tục đúng kế hoạch;
> 🟡 **Pass có điều kiện** — thiếu 1–2 tiêu chí phụ, có kế hoạch bù cụ thể trong tuần kế tiếp;
> 🔴 **Fail** — không đạt tiêu chí mốc → **bắt buộc** chạy quy trình Section 12 trước khi sang tuần mới.

---

# 7. Vai trò & trách nhiệm trong quản lý lịch trình

| Vai trò | Người (điền tên) | Trách nhiệm |
| --------------------------------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Giữ & cập nhật tài liệu lịch trình** | Nguyễn Việt Quang | Cập nhật tài liệu này khi có thay đổi; quản lý Nhật ký (Section 14); giữ version nhất quán |
| **Điều phối tuần** | Nguyễn Việt Quang | Chủ trì Kick-off tuần & Weekly Review; chốt người phụ trách từng đầu việc |
| **Thành viên phát triển** | Thành viên 1–3 | Tự cập nhật trạng thái công việc được giao trong bảng tuần; báo blocker sớm nhất có thể |
| **Xác nhận hoàn thành (DoD)** | Cả nhóm | Tại Weekly Review, cả nhóm cùng xác nhận công việc đạt tiêu chí hoàn thành trước khi đánh dấu tuần xanh |

> Nguyên tắc KHKD: cả 3 thành viên có thể đảm nhận BE/FE/AI tùy hạng mục; vai trò điều phối nên
> luân phiên theo tuần để mọi người đều nắm toàn cảnh dự án.

---

# 8. Nhịp điều hành (Working Cadence)

| Khoảng thời gian | Hoạt động | Thời lượng | Ai tham gia | Đầu ra |
| --------------------------------------------------- | ------------------------- | ------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Thứ 2 (sáng)** | Kick-off tuần | 15 phút | Cả nhóm | Chốt kế hoạch tuần; điền người phụ trách vào Mục 5; nhắc deadline mốc (nếu cuối tuần có mốc) |
| **Thứ 2 → Thứ 6 (hằng ngày)** | Stand-up nhanh | 10–15 phút | Cả nhóm (online/offline) | 3 câu hỏi: đã làm gì / đang làm gì / có blocker gì; cập nhật bảng trạng thái (Mục 9) |
| **Thứ 6 (cuối tuần)** | Weekly Review & DoD check | 30–45 phút | Cả nhóm | Đánh giá từng đầu việc theo tiêu chí trả lời được không; đánh dấu tuần 🟢/🟡/🔴; liệt kê bài học & việc chuyển tiếp |
| **Cuối tuần có mốc (T2, 4, 6, 8, 9, 10)** | Milestone Gate Review | 30 phút | Cả nhóm (+ GVHD nếu cần) | Chốt trạng thái mốc (cổng Section 6); quyết định pass / điều chỉnh kế hoạch |

**Quy tắc "báo trễ" (early-warning):** nếu một công việc có khả năng không kịp tiêu chí hoàn thành
trong tuần, thành viên phụ trách **báo trong stand-up thứ 4 (sớm nhất có thể)**, không chờ đến Weekly Review.

---

# 9. Cơ chế theo dõi lịch trình

## 9.1 Bảng trạng thái tuần (cập nhật mỗi kỳ)

| Tuần | Khoảng ngày | Mốc | Trạng thái tuần | Ghi chú / blocker chính | Công việc chuyển tiếp sang tuần sau |
| ----- | ------------------- | ---- | ------------------ | ------------------------- | ---------------------------------------- |
| T1 | 07/09 – 13/09/2026 | — | ⬜ | | |
| T2 | 14/09 – 20/09/2026 | M1 | ⬜ | | |
| T3 | 21/09 – 27/09/2026 | — | ⬜ | | |
| T4 | 28/09 – 04/10/2026 | M2 | ⬜ | | |
| T5 | 05/10 – 11/10/2026 | — | ⬜ | | |
| T6 | 12/10 – 18/10/2026 | M3 | ⬜ | | |
| T7 | 19/10 – 25/10/2026 | — | ⬜ | | |
| T8 | 26/10 – 01/11/2026 | M4 | ⬜ | | |
| T9 | 02/11 – 08/11/2026 | M5 | ⬜ | | |
| T10 | 09/11 – 15/11/2026 | — | ⬜ | | |
| T10.5 | 16/11 – 17/11/2026 | M6 | ⬜ | | |

**Chú thích trạng thái:**

- 🟢 **Xanh** — tất cả đầu việc của tuần đạt tiêu chí hoàn thành, mốc (nếu có) Pass.
- 🟡 **Vàng** — 1–2 đầu việc trễ nhẹ, có kế hoạch bù trong tuần tiếp theo, mốc Pass có điều kiện.
- 🔴 **Đỏ** — mốc Fail hoặc ≥ 50% đầu việc không đạt → **chạy quy trình Section 12 ngay**.

## 9.2 Quy tắc cập nhật

1. **Hằng ngày (stand-up):** mỗi thành viên cập nhật dòng tương ứng trong Mục 5 (người phụ trách, tiến độ, blocker).
2. **Cuối tuần (Weekly Review):** cả nhóm cập nhật Bảng 9.1 và đóng dòng tuần đã qua
   (chỉ đánh dấu 🟢 khi có đủ minh chứng — code committed trên branch, demo chạy được, artifact tồn tại).
3. **Ngay khi có thay đổi:** deadline, phạm vi công việc tuần, người phụ trách đều phải sửa vào tài liệu
   trong **cùng ngày**, kèm ghi chú trong Nhật ký (Section 14).
4. **Báo trễ sớm:** blocker phải được nêu trong stand-up chậm nhất thứ 4 hàng tuần (Xem Section 8).

## 9.3 Công cụ

- Tài liệu này (trong Git repo, branch `dev`) là **nguồn chính thức** của lịch trình.
- Khuyến nghị: nếu nhóm dùng **GitHub Projects / Issues**, ánh xạ issue → mã WBS để các task
  đồng bộ với bảng Mục 5; khi lịch trình đổi, đổi tại cả 2 nơi trong cùng ngày.

---

# 10. Buffer & thứ tự ưu tiên khi chậm tiến độ

## 10.1 Nguyên tắc buffer

- **Chỉ dùng buffer nội tuần:** nếu một đầu việc trễ, ưu tiên tăng công suất trong tuần (hỗ trợ chéo,
  giảm bớt việc phụ) thay vì đẩy sang tuần sau — vì tuần sau đã có kế hoạch riêng.
- **Không có "tuần đệm" riêng:** toàn bộ 10 tuần đều có việc; 2,5 tháng là đủ chặt cho nhóm 3 người.
- **Bảo vệ tuần 9–10:** không được phép kéo việc module lớn vào tuần tích hợp/kiểm thử. Việc module
  trễ quá 1 tuần phải được xử lý theo thứ tự ưu tiên 10.2 ngay từ tuần 6.

## 10.2 Thứ tự ưu tiên cắt giảm khi trễ (thấp dần)

> Quy tắc: không tự ý cắt tính năng → luôn chốt bằng buổi họp và ghi vào Nhật ký.

| Ưu tiên | Hạng mục có thể cắt giảm | Hậu quả chấp nhận được |
| --------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| 1 | Tính năng có mức độ hoàn thiện "bóng bẩy" (FAQ mở rộng, giao diện thuần tuý nâng cao) | Giảm UX, không ảnh hưởng luồng chính UJ-1→UJ-4 |
| 2 | Báo cáo vận hành nâng cao (FR-24) dùng tạm bản đơn giản | Admin xem số liệu cơ bản, nâng cấp sau |
| 3 | Import Option B hỗ trợ thêm định dạng (giữ tối thiểu JSON/Text đã cam kết) | Gia sư vẫn dùng Option A (AI sinh) |
| 4 | Tinh chỉnh prompt nâng cao chất lượng AI (chỉ phục vụ "hoàn hảo", không phải "đạt yêu cầu") | Chất lượng ở mức chấp nhận được, đúng NFR |

> Lưu ý: các hạng mục thuộc **Phạm vi MVP chốt tại Tuần 1 (WBS 1.1)** và **UJ-1→UJ-4** không nằm trong danh sách
> cắt giảm; bất kỳ đề xuất cắt nào cũng phải đi qua Section 12.

---

# 11. Quản lý rủi ro ảnh hưởng lịch trình

| Mã | Rủi ro | Ảnh hưởng lịch trình | Xác suất | Phản ứng (dự phòng / giảm thiểu) | Theo dõi |
| --- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------- | ---------------- |
| R1 | Nội dung AI sinh ra chưa đạt (câu hỏi/giải thích không chính xác) | Gia sư mất thời gian sửa → trễ Tuần 5–6, ảnh hưởng M3 | Cao | Gia sư luôn xem trước & chỉnh sửa trước khi giao; tinh chỉnh prompt sớm tuần 5–6 (đã gắn vào Tuần 5) | Tuần 5–6 |
| R2 | Thời gian sinh nội dung AI > 5 giây (NFR SM-3) | Trải nghiệm Gia sư kém; benchmark không đạt M3 | Trung bình | Benchmark ngay tuần 5; tối ưu prompt/streaming; giới hạn độ dài sinh theo cấu hình | Tuần 5 trở đi |
| R3 | Tích hợp 3 khối (FE–BE–AI) trễ do phụ thuộc lẫn nhau | Lệch Tuần 9 (M5) | Trung bình | Định nghĩa API contract (OpenAPI) từ tuần 1–2; dùng mock API để FE/AI phát triển song song | Tuần 1–2, 9 |
| R4 | Khối lượng công việc lớn với nhóm 3 người khi bổ sung 5 cổng & SM-2/SKP | Quá tải, giảm chất lượng, trễ deadline | Cao | Bám sát MVP scope; tái sử dụng component giữa Admin & Receptionist; tập trung vào thuật toán Elo & SM-2 cốt lõi gọn nhẹ; báo trễ sớm (Section 8) | Mỗi tuần |
| R5 | Trễ mốc từ 1 tuần trở lên liên tiếp | Hiệu ứng domino sang các mốc sau | Trung bình | Kích hoạt quy trình Section 12; cắt giảm theo 10.2 | Ngay khi mốc 🔴 |
| R6 | Một thành viên nghỉ/ốm kéo dài | Mất ≥ 1/3 năng lực nhóm | Thấp | Bổ sung chéo kiến thức (mọi người vẫn biết cấu trúc FE/BE/AI nhờ P3); xác định lại ưu tiên tuần | Khi xảy ra |

---

# 12. Quy trình thay đổi lịch trình

## 12.1 Khi nào kích hoạt quy trình

- Một mốc (M1–M6) bị đánh giá 🔴 **Fail**.
- Có đề xuất thay đổi phạm vi MVP (thêm/bớt tính năng) ảnh hưởng đến thời lượng.
- Một thành viên nghỉ ≥ 3 ngày liên tiếp hoặc có việc ngoài dự án chiếm > 30% thời gian trong tuần.
- Deadline của GVHD/hội đồng bị thay đổi.

## 12.2 Các bước xử lý

1. **Lập đề xuất** (bằng văn bản): nêu rõ nguyên nhân, đầu việc bị ảnh hưởng, phương án bù (kế hoạch cụ thể).
2. **Đánh giá ảnh hưởng dây chuyền:** kiểm tra tác động lên Mục 4–6 (tuần tiếp theo, mốc tiếp theo, tuần 9–10).
3. **Chọn giải pháp theo thứ tự:** (a) dùng buffer nội tuần → (b) hỗ trợ chéo → (c) cắt giảm theo Mục 10.2 → (d) dời deadline (chỉ khi 3 cách trên bất khả thi).
4. **Chốt trong buổi họp** (tối thiểu có mặt đủ 3 thành viên; nếu liên quan GVHD thì xin ý kiến trước khi chốt).
5. **Cập nhật tài liệu ngay:** sửa Mục 4–6 (bảng tuần + mốc + Gantt nếu cần), ghi vào **Nhật ký** (Section 14) với lý do và quyết định.
6. **Thông báo:** gửi cho toàn nhóm (và GVHD nếu bị ảnh hưởng) trong ngày.

## 12.3 Quy tắc quan trọng

- Không tự ý "chuyển việc sang tuần sau" mà chưa qua bước 1–2 — tuần sau đã có kế hoạch riêng.
- Mọi thay đổi **phải để lại dấu vết** trong Nhật ký; không sửa thầm số liệu ngày tháng.
- Nếu dự kiến trễ **> 1 tuần** so với M6 (17/11/2026): báo GVHD sớm, trình bày phương án điều chỉnh phạm vi trước khi hết tuần 8.

---

# 13. Định nghĩa hoàn thành chung (Definition of Done)

Một đầu việc (WBS) chỉ được tính là **hoàn thành** khi **đủ tất cả** các tiêu chí sau:

| # | Tiêu chí | Áp dụng cho |
| -- | --------------------------------------------------------------------------------------------------------- | -------------- |
| D1 | Code được **commit lên git** (branch `dev` hoặc feature branch riêng) | FE / BE / AI |
| D2 | Chạy được ở môi trường local **hoặc** staging, có thể demo trực tiếp | Tất cả |
| D3 | Test cơ bản pass (unit test nếu có; ít nhất build/run không lỗi) | BE / AI / FE |
| D4 | Đúng API contract đã chốt (Mục R3, OpenAPI tuần 1–2) | BE / AI |
| D5 | Được **cả nhóm xác nhận** tại Weekly Review theo tiêu chí hoàn thành của tuần (Mục 5) | Tất cả |
| D6 | Việc phụ trợ hoàn tất cùng tuần (migration DB, config, tài liệu ngắn nếu cần) | BE / Hạ tầng |

> Một mốc chỉ **Pass** khi tất cả đầu việc liên quan của mốc đạt DoD trên.

---

# 14. Nhật ký cập nhật tài liệu (Revision History)

| Version | Ngày | Người | Nội dung thay đổi |
| ------- | ---------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.4 | 2026-09-19 | Nhóm dự án | **Cập nhật WBS & lịch trình theo KHKD v1.4 & PRD v.final**: Mở rộng từ 4 cổng lên 5 cổng ReactJS (thêm Receptionist Portal); bổ sung Student Knowledge Profile (SKP & Elo Rating Engine - FR-38), Spaced Repetition (SM-2 Algorithm - FR-39), Quản lý Lễ tân & Xử lý khiếu nại đối soát tài chính (`REFUND`/`REMATCH`). |
| 1.3 | 2026-09-15 | Nhóm dự án | **Cập nhật WBS & lịch trình theo KHKD v1.3**: Ưu tiên hoàn thiện luồng vận hành cơ bản 4 cổng không AI từ Tuần 2 đến Tuần 6; đẩy việc tích hợp AI Service sang Tuần 7 và Tuần 8; giữ nguyên Tuần 1. |
| 1.2 | 2026-09-15 | Nhóm dự án | **Cập nhật WBS & lịch trình theo KHKD v1.2**: bổ sung các đầu việc đặc tả Use Case (WBS 1.7), sơ đồ State Machine (WBS 1.9) vào Tuần 2 và sơ đồ Sequence (WBS 1.8), sơ đồ Activity (WBS 1.10) vào Tuần 3; giữ nguyên Tuần 1. |
| 1.1 | 2026-09-06 | Nhóm dự án | **Xác nhận ngày khởi công chính thức 07/09/2026** (Thứ 2); chuyển baseline từ "giả định" sang "chính thức"; không thay đổi ngày tháng cụ thể của các tuần/mốc. |
| 1.0 | 2026-09-06 | Nhóm dự án | Baseline cơ bản: dựng tài liệu quản lý lịch trình từ KHKD v1.1 (10 tuần, mốc M1–M6); ngày tháng tính theo mốc khởi công dự kiến 07/09/2026. |

> Ghi chú cập nhật trong mỗi thay đổi: mô tả **cái gì đổi**, **vì sao**, **ảnh hưởng gì** (tuần/mốc nào bị dịch).

---

# Phụ lục A — Liên kết tài liệu liên quan

| Tài liệu | Đường dẫn | Dùng để |
| -------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Kế hoạch triển khai đề tài | `docs/ke-hoach-trien-khai.md` | Nguồn WBS, công việc, mốc, rủi ro (base của tài liệu này) |
| PRD | `_bmad-output/planning-artifacts/prds/prd-final_project-2026-08-31/prd.md` | Yêu cầu chức năng FR-1→FR-39, UJ-1→UJ-4, NFR |
| Brief dự án | `_bmad-output/planning-artifacts/briefs/brief-final_project-2026-08-30/brief.md` | Bối cảnh & phạm vi tổng quan |
| Source frontend | `frontend/` | Prototype & implementation ReactJS hiện có |

---

*Tài liệu được biên soạn dựa trên Kế hoạch triển khai đề tài v1.4 (2026-09-19) và PRD v.final (2026-09-19).*
