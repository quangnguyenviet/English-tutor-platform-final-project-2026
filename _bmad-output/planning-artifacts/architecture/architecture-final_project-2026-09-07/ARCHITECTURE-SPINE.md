---
name: 'Xương sống Kiến trúc — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition'
type: architecture-spine
purpose: build-substrate
altitude: system
paradigm: Modular Monolith + Dịch vụ AI Python chuyên trách
scope: Toàn bộ Kiến trúc Hệ thống Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition
status: final
created: '2026-09-07'
updated: '2026-09-19'
binds:
  - FR-1
  - FR-2
  - FR-3
  - FR-6
  - FR-8
  - FR-9
  - FR-11
  - FR-12
  - FR-13
  - FR-15
  - FR-16
  - FR-19
  - FR-20
  - FR-21
  - FR-22
  - FR-23
  - FR-25
  - FR-27
  - FR-28
  - FR-29
  - FR-30
sources:
  - file:///d:/code/do-an/_bmad-output/planning-artifacts/prds/prd-final_project-2026-08-31/prd.md
companions: []
---

# Xương sống Kiến trúc — Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

## Mô hình Thiết kế (Design Paradigm)

Hệ thống áp dụng mô hình kiến trúc **Modular Monolith** cho các nghiệp vụ cốt lõi, kết hợp cùng một **Dịch vụ AI Subsystem (Python FastAPI)** chuyên trách cho các tác vụ sinh nội dung thông minh và trích xuất dữ liệu bài tập/lộ trình.

- **Giao diện (Frontend)**: Ứng dụng React 19 Single Page Application (SPA) phục vụ 4 cổng thông tin người dùng (Phụ huynh, Gia sư, Học sinh, Quản trị viên - Admin) với cơ chế bảo mật tuyến đường (Route Guard) dựa trên vai trò.
- **Lõi Backend**: Ứng dụng Java Spring Boot 3.4.x cấu trúc theo các gói nghiệp vụ (domain packages) rõ ràng (`auth`, `matching`, `enrollment`, `curriculum`, `homework`, `payment`). Spring Boot đóng vai trò là API Gateway duy nhất cho các ứng dụng client và thực thi các giao dịch bất biến (Transactional Invariants).
- **Phân hệ AI (AI Subsystem)**: Dịch vụ Python 3.12 FastAPI xử lý tích hợp LLM (OpenAI `gpt-4o-mini` / Google Gemini Flash), quản lý Prompt Engineering và trích xuất cấu trúc dữ liệu JSON cho tính năng Dual-Mode (Khung chương trình & Bài tập).
- **Tầng Dữ liệu**: Cơ sở dữ liệu quan hệ PostgreSQL 16 quản lý dữ liệu nghiệp vụ, kết hợp cùng MinIO / S3-compatible Object Storage lưu trữ tài liệu truyền thông (video bài giảng, tài liệu học tập, ảnh biên lai nộp phí QR proof).

```mermaid
graph TD
    subgraph Clients["Tầng Ứng dụng Client"]
        ParentPortal["Cổng Phụ huynh (Web)"]
        TutorPortal["Cổng Gia sư (Mobile/Web)"]
        StudentPortal["Cổng Học sinh (Web)"]
        AdminDashboard["Màn hình Admin (Web)"]
    end

    subgraph BackendGateway["Lõi Spring Boot API Gateway"]
        AuthModule["Gói auth"]
        MatchingModule["Gói matching"]
        EnrollmentModule["Gói enrollment"]
        CurriculumModule["Gói curriculum"]
        HomeworkModule["Gói homework"]
        PaymentModule["Gói payment"]
    end

    subgraph AIService["Phân hệ AI Python"]
        FastAPIWorker["Dịch vụ FastAPI AI"]
        PromptEngine["Pydantic & Prompt Engine"]
    end

    subgraph Storage["Tầng Lưu trữ"]
        PostgreSQL[("Cơ sở dữ liệu PostgreSQL")]
        S3Storage[("Lưu trữ Object S3")]
    end

    ParentPortal -->|REST / JWT| BackendGateway
    TutorPortal -->|REST / JWT| BackendGateway
    StudentPortal -->|REST / JWT| BackendGateway
    AdminDashboard -->|REST / JWT| BackendGateway

    BackendGateway -->|JPA / JDBC| PostgreSQL
    BackendGateway -->|Presigned URLs| S3Storage
    BackendGateway -->|Private REST API| FastAPIWorker

    FastAPIWorker -->|Gọi API LLM| ExternalLLM["OpenAI / Gemini API"]
```

---

## Các Quy tắc & Quyết định Bất biến (Invariants & Rules)

```mermaid
graph LR
    FrontendApp["React SPA Frontend"] -->|Bắt buộc xác thực JWT| SpringBootGateway["Spring Boot Gateway"]
    SpringBootGateway -->|Bắt buộc kiểm tra Enrollment| DB[("PostgreSQL")]
    SpringBootGateway -->|Bắt buộc chuẩn hóa DTO| AIService["Dịch vụ Python FastAPI AI"]
    SpringBootGateway -->|Bắt buộc tạo Presigned URL| S3[("Lưu trữ S3")]
```

### AD-1 — Mô hình Kiến trúc Modular Monolith cho Backend

- **Ràng buộc:** `all` (Tất cả gói nghiệp vụ Backend)
- **Ngăn chặn:** Tình trạng over-engineering phân rã microservices cồng kềnh, độ trễ mạng phát sinh và rủi ro bất đồng bộ giao dịch giữa phê duyệt phí & mở khóa thông tin liên hệ.
- **Quy tắc:** Backend chính phải là một ứng dụng Java Spring Boot duy nhất được tổ chức thành các gói nghiệp vụ phân tách rõ ràng (`com.englishtutor.backend.domain.*`). Tương tác giữa các domain trong Spring Boot phải thực hiện thông qua Spring Service Interface bên trong ranh giới giao dịch `@Transactional`. Nghiêm cấm việc gọi trực tiếp Repository qua ranh giới gói khác.

### AD-2 — Dịch vụ AI Python FastAPI Chuyên trách

- **Ràng buộc:** `FR-8`, `FR-30`, `Vận hành Dual-Mode AI`
- **Ngăn chặn:** Việc làm cồng kềnh mã nguồn Java Backend bởi các thư viện prompt engineering/SDK LLM phức tạp; giúp linh hoạt nâng cấp prompt và hỗ trợ parse file 0-token cost.
- **Quy tắc:** Java Spring Boot đóng vai trò API Gateway duy nhất tiếp nhận request từ client. Spring Boot ủy quyền các tác vụ AI (Option A sinh trực tiếp & Option B trích xuất file cấu trúc JSON) sang dịch vụ Python FastAPI nội bộ qua REST API riêng tư trong VPC (`http://ai-service:8000/api/v1/ai/*`). Dịch vụ Python trực tiếp gọi LLM (`gpt-4o-mini` / `Gemini Flash`) và xác thực cấu trúc dữ liệu qua Pydantic.

### AD-3 — Phân quyền RBAC theo Enrollment & Bảo vệ Ghi chú Riêng tư

- **Ràng buộc:** `FR-19`, `FR-25`, `Các Endpoint Dữ liệu Học sinh`
- **Ngăn chặn:** Gia sư chưa kết nối truy cập trái phép dữ liệu học sinh; rò rỉ Ghi chú riêng tư (Private Notes) sang cổng Học sinh hoặc Phụ huynh.
- **Quy tắc:** Sử dụng Spring Security JWT kết hợp Custom Annotation `@PreAuthorize("@enrollmentGuard.canAccessStudent(authentication, #studentId)")` để bảo vệ mọi API học sinh. Gia sư chỉ được xem dữ liệu của học sinh có liên kết `Enrollment` ở trạng thái `ACTIVE`. Trường ghi chú riêng tư (`private_notes`) phải bị loại bỏ (strip) khỏi tất cả DTO trả về cho Học sinh và Phụ huynh tại tầng Serializer Controller.

### AD-4 — Chuẩn hóa Cấu trúc Dữ liệu Dual-Mode (Option A & Option B)

- **Ràng buộc:** `FR-8`, `FR-30`
- **Ngăn chặn:** Sự sai lệch cấu trúc dữ liệu giữa bài tập/chương trình do AI sinh ra và file JSON/Text do người dùng upload từ ChatGPT/Claude bên ngoài.
- **Quy tắc:** Cả Option A (Sinh trực tiếp) và Option B (Import File) đều phải tuân thủ chuẩn JSON Schema v1.0 chung (`CurriculumDraftSchema` và `HomeworkDraftSchema`). Mọi file upload Option B phải gửi tới endpoint `/api/v1/ai/parse-file` trên Dịch vụ Python AI để kiểm duyệt và chuyển đổi trước khi lưu vào PostgreSQL.

### AD-5 — Quy trình Duyệt Biên lai Phí & Ẩn/Hiện Thông tin Liên hệ

- **Ràng buộc:** `FR-16`, `FR-23`
- **Ngăn chặn:** Việc rò rỉ thông tin liên hệ (SĐT, Địa chỉ) của Phụ huynh cho Gia sư trước khi Admin xác nhận biên lai nộp phí.
- **Quy tắc:** Thông tin liên hệ trong kết quả trả về cho Gia sư luôn ở trạng thái ẩn (`masked: true`) cho đến khi `FeePayment.status == 'PAID'`. Việc chuyển trạng thái sang `PAID` chỉ được kích hoạt duy nhất bởi hành động bấm duyệt của Admin trong một database transaction, đồng thời tự động ghi nhận nhật ký hệ thống Audit Log (`FR-20`).

### AD-6 — Chiến lược Lưu trữ File Truyền thông qua S3 Presigned URL

- **Ràng buộc:** `FR-21`, `FR-23`
- **Ngăn chặn:** Việc lưu tệp tin dung lượng lớn directly vào DB PostgreSQL hoặc công khai URL bucket S3 không an toàn.
- **Quy tắc:** Video bài giảng, tài liệu học tập (PDF/Word) và ảnh biên lai chuyển khoản QR proof phải được lưu trữ tại Object Storage tương thích S3 (MinIO ở môi trường dev, AWS S3 / Cloudflare R2 trên prod). Client tải lên và tải xuống tệp tin trực tiếp qua Presigned URLs do Spring Boot khởi tạo với thời gian hết hạn ngắn (15 phút).

### AD-7 — Cấu trúc React SPA với Bảo mật Tuyến đường dựa trên Vai trò

- **Ràng buộc:** `Cổng Phụ huynh`, `Cổng Gia sư`, `Cổng Học sinh`, `Màn hình Admin`
- **Ngăn chặn:** Truy cập trái phép vào các màn hình chức năng và rò rỉ state giữa các vai trò người dùng.
- **Quy tắc:** Frontend là một ứng dụng React 19 SPA duy nhất xây dựng bằng Vite và React Router DOM v7. Phân quyền tuyến đường sử dụng thành phần `<ProtectedRoute allowedRoles={['ROLE_TUTOR']}>` để kiểm tra quyền hạn trong JWT Token. State dữ liệu server được quản lý thống nhất qua TanStack Query để đảm bảo tính nhất quán dữ liệu và tự động làm mới cache.

---

## Quy ước Thống nhất (Consistency Conventions)

| Hạng mục | Quy ước |
| --- | --- |
| Quy cách đặt tên (Entity, File, Interface) | Entity: PascalCase (`MatchRequest`, `Enrollment`). Bảng DB: snake_case số nhiều (`match_requests`, `enrollments`). REST URI: kebab-case (`/api/v1/match-requests`, `/api/v1/curriculums`). DTO: Hậu tố `*Request`, `*Response`. |
| Định dạng Dữ liệu (ID, Ngày tháng, Lỗi) | Khóa chính: UUID v4 (`id`). Thời gian: ISO-8601 UTC (`yyyy-MM-dd'T'HH:mm:ss'Z'`). Chuẩn vỏ bọc lỗi (Error Envelope): `{ "code": "RESOURCE_NOT_FOUND", "message": "...", "timestamp": "...", "errors": [] }`. |
| Quản lý Trạng thái & Xử lý Lỗi | Chuyển đổi trạng thái phải dùng động từ rõ ràng (`/accept`, `/approve-fee`, `/assign-homework`). Lỗi được map tương ứng với HTTP Status Code (400, 401, 403, 404, 409, 500) qua `@ControllerAdvice`. |

---

## Công nghệ Tải trước (Stack)

| Tên công nghệ | Phiên bản |
| --- | --- |
| Java | 21 LTS |
| Spring Boot | 3.4.x |
| Python | 3.12 |
| FastAPI | 0.115.x |
| PostgreSQL | 16.x |
| React | 19.2.7 |
| React Router DOM | 7.11.0 |
| TailwindCSS | 4.3.3 |
| Vite | 8.1.1 |
| Docker / Docker Compose | Mới nhất |

---

## Cấu trúc Khởi tạo (Structural Seed)

### Cấu trúc Thư mục Nguồn (Source Tree)

```text
{root}/
  frontend/
    src/
      components/    # Thành phần UI dùng chung (buttons, modals, cards)
      layouts/       # Vỏ bọc giao diện các Cổng (ParentLayout, TutorLayout, v.v.)
      pages/         # Các trang theo cổng (parent/, tutor/, student/, admin/)
      services/      # Axios API Client & TanStack Query Hooks
      context/       # AuthContext & State toàn cục của Portal
  backend/
    src/main/java/com/englishtutor/backend/
      config/        # SecurityConfig, S3Config, WebConfig
      domain/
        auth/        # User, Role, Authentication Controller & Service
        matching/    # MatchRequest, Thuật toán SmartMatch, RateCard
        enrollment/  # Entity Enrollment, Lịch dạy Calendar, PrivateNotes
        curriculum/  # Entity Topic, Lesson, Attachment
        homework/    # Entity Exercise, Question, Submission, Bộ chấm điểm
        payment/     # FeePayment, Xử lý minh chứng VietQR Proof
      common/        # Xử lý ngoại lệ, AuditLog, Security Utils
  ai-service/
    app/
      main.py        # Điểm đầu vào FastAPI
      routers/       # /generate-homework, /generate-curriculum, /parse-file
      services/      # Tích hợp LLM Client (OpenAI / Gemini wrapper)
      schemas/       # Pydantic Schemas xác thực Dual-Mode
      prompts/       # Quản lý System Prompts
  docker-compose.yml
```

### Sơ đồ Thực thể Dữ liệu Cốt lõi (ERD)

```mermaid
erDiagram
    USER ||--o{ MATCH_REQUEST : "gửi yêu cầu (Phụ huynh)"
    USER ||--o{ TUTOR_PROFILE : "có hồ sơ (Gia sư)"
    USER ||--o{ ENROLLMENT : "tham gia (Học sinh/Gia sư)"
    
    TUTOR_PROFILE ||--o{ RATE_CARD : "cấu hình bảng giá"
    MATCH_REQUEST ||--o| MATCH_OFFER : "tạo ra"
    MATCH_OFFER ||--o| FEE_PAYMENT : "yêu cầu đóng phí"
    FEE_PAYMENT ||--o| ENROLLMENT : "mở khóa & kích hoạt"
    
    ENROLLMENT ||--o{ CURRICULUM_TOPIC : "chứa các chủ đề"
    CURRICULUM_TOPIC ||--o{ CURRICULUM_LESSON : "có bài học"
    CURRICULUM_LESSON ||--o{ LESSON_ATTACHMENT : "đính kèm tài liệu"
    
    ENROLLMENT ||--o{ HOMEWORK : "giao bài tập"
    HOMEWORK ||--o{ QUESTION : "chứa câu hỏi"
    HOMEWORK ||--o{ SUBMISSION : "bài nộp của học sinh"
    SUBMISSION ||--o{ SUBMISSION_ANSWER : "chứa chi tiết câu trả lời"
    ENROLLMENT ||--o{ PRIVATE_NOTE : "ghi chú riêng của gia sư"
```

---

## Bản đồ Tính năng → Kiến trúc (Capability → Architecture Map)

| Tính năng / Khu vực | Nằm tại | Quản lý bởi |
| --- | --- | --- |
| Form Tìm Gia sư & Đăng ký Học thử (`FR-1`, `FR-2`, `FR-3`) | `backend/domain/matching`, `frontend/pages/parent` | `AD-1`, `AD-5`, Standard Error Envelope |
| Tạo Khung chương trình AI Dual-Mode (`FR-30`) | `ai-service/routers`, `backend/domain/curriculum` | `AD-2`, `AD-4` |
| Sinh bài tập AI Dual-Mode (`FR-8`, `FR-9`) | `ai-service/routers`, `backend/domain/homework` | `AD-2`, `AD-4` |
| Tự động Chấm điểm & Giải thích AI (`FR-12`, `FR-13`) | `backend/domain/homework`, `ai-service` | `AD-2`, Quy tắc Phản hồi Tức thì |
| Bảo mật Enrollment & Ghi chú Riêng tư (`FR-19`, `FR-25`) | `backend/domain/enrollment`, `backend/config` | `AD-3` |
| Phê duyệt Phí Chuyển khoản & Mở khóa SĐT (`FR-16`, `FR-23`) | `backend/domain/payment`, `frontend/pages/admin` | `AD-5`, Presigned S3 URLs |
| Quản lý Tài liệu Bài giảng S3 (`FR-21`) | `backend/domain/curriculum`, MinIO/S3 | `AD-6` |

---

## Danh mục Hoãn lại (Deferred)

| Hạng mục hoãn lại | Lý do hoãn | Điều kiện xem xét lại |
| --- | --- | --- |
| Phân rã Microservices cồng kềnh | Mô hình Modular Monolith đáp ứng hoàn hảo hiệu năng Single-tenant hiện tại. | Khi lượng người dùng > 50,000 DAU hoặc cần chia nhiều team phát triển độc lập. |
| Tích hợp Cổng thanh toán Tự động | Quy trình upload VietQR proof thủ công + Admin duyệt tay đủ tinh gọn cho MVP. | Khi số lượng giao dịch vượt quá 100 lớp/ngày. |
| Gửi thông báo Tự động qua Email / Zalo | Hệ thống thông báo in-app và cập nhật Calendar ứng dụng đã đáp ứng tốt user flow. | Khi mở rộng quy mô vận hành ở Giai đoạn 2. |
