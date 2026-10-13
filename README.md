# EnglishPath

**Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh 1-1 ứng dụng LLM và Spaced Repetition.**

Ứng dụng Web single-tenant dành cho một trung tâm gia sư tiếng Anh. Hệ thống làm hai việc:

- **Vận hành trung tâm**: số hóa quy trình từ yêu cầu của phụ huynh, ghép gia sư, dạy thử, chốt lịch, thu phí nhận lớp (bằng ảnh biên lai, kế toán đối chiếu và xác nhận), hoàn tiền, thống kê tài chính đến xử lý khiếu nại, có audit log.
- **Hỗ trợ giảng dạy**: gia sư soạn quiz với trợ lý AI (hoặc import từ ChatGPT/Claude/Gemini), bám sát hồ sơ kỹ năng và thang CEFR; học sinh làm quiz từng câu, nhận lời giải thích ngay, điểm Elo cập nhật, câu sai vào danh sách ôn tập.

## Các cổng người dùng

| Cổng | Đối tượng | Chức năng chính |
| --- | --- | --- |
| Công khai | Phụ huynh (không cần đăng nhập) | Tìm gia sư, xem hồ sơ, gửi yêu cầu tìm gia sư, đăng ký gia sư chỉ định |
| Gia sư | Gia sư | Hồ sơ 5 bước, ứng tuyển lớp, lịch dạy thử và lịch cố định, buổi học và nhật ký, soạn và giao quiz, nộp phí nhận lớp |
| Học sinh | Học sinh (tài khoản do trung tâm cấp, phụ huynh đăng nhập bằng tài khoản của con để xem) | Dashboard, lịch học, chi tiết buổi học, tài liệu, làm quiz, thông báo |
| Lễ tân / Admin | Nhân sự trung tâm | Lớp cần gia sư, đơn ghép lớp, duyệt hồ sơ gia sư, thu hộ minh chứng phí, quản lý học sinh, khiếu nại tại quầy. Admin có thêm toàn bộ chức năng Kế toán và quản lý nhân sự |
| Kế toán | Nhân sự trung tâm | Quản lý khoản phí nhận lớp, đối chiếu và xác nhận số tiền thực nhận, xử lý hoàn tiền, thống kê tài chính và xuất Excel |

## Tài liệu dự án

| Tài liệu | Nội dung |
| --- | --- |
| [docs/project/mo_ta_de_tai.md](docs/project/mo_ta_de_tai.md) | Mô tả đề tài, bài toán, chức năng, cơ sở lý thuyết |
| [docs/project/prd.md](docs/project/prd.md) | Yêu cầu sản phẩm: hành trình người dùng, 44 yêu cầu chức năng, máy trạng thái, chỉ số, câu hỏi mở |
| [docs/project/ke-hoach-trien-khai.md](docs/project/ke-hoach-trien-khai.md) | WBS, lịch 10 tuần, cột mốc, rủi ro, hiện trạng |
| [docs/project/ARCHITECTURE.md](docs/project/ARCHITECTURE.md) | Kiến trúc hệ thống |
| [docs/New_ERD.md](docs/New_ERD.md) | Thiết kế cơ sở dữ liệu: bảng, thuộc tính, sơ đồ Mermaid, quan hệ, ràng buộc |
| [docs/Usecase/](docs/Usecase) | Đặc tả use case: Lễ tân và Admin (một file), Kế toán, Gia sư, Học sinh và Phụ huynh |

Khi tài liệu mâu thuẫn nhau, lấy bộ use case làm chuẩn.

## Cấu trúc và công nghệ

| Thành phần | Thư mục | Công nghệ | Cổng mặc định |
| --- | --- | --- | --- |
| Frontend | `frontend/` | React 19, Vite, Tailwind CSS v4, React Router, Recharts | `http://localhost:3000` (Docker) |
| Backend | `backend/` | Java 17, Spring Boot 3.2, Spring Data JPA | `http://localhost:8080` |
| AI Service | `ai/` | Python 3.11, FastAPI, Uvicorn, LangGraph | `http://localhost:8000` |
| Cơ sở dữ liệu | `docker/init.sql` | PostgreSQL 16 | `localhost:5432` |

Frontend chỉ gọi Backend. Backend gọi AI Service qua mạng nội bộ.

## Trạng thái hiện tại

Cập nhật 11/10/2026 (tuần 6 trên 10):

- Đã có: đặc tả use case, ERD, PRD, kế hoạch, Docker Compose, CI, prototype giao diện các cổng (dữ liệu giả).
- Chưa có: nghiệp vụ backend (mới có health check), endpoint AI sinh quiz (mới có `/health`), DDL và migration, nối frontend với API.

Chi tiết và lịch làm tiếp xem [kế hoạch triển khai](docs/project/ke-hoach-trien-khai.md).

## Chạy môi trường local

### Yêu cầu
- Docker 24+ và Docker Compose 2.20+
- Git
- Để chạy riêng từng dịch vụ: JDK 17 và Maven (backend), Node.js 20 (frontend), Python 3.11 và `uv` (AI)

### Chạy bằng Docker Compose

1. Tạo file môi trường:
   ```bash
   cp .env.example .env
   ```
2. Build và chạy 4 dịch vụ:
   ```bash
   docker compose up --build -d
   ```
3. Kiểm tra:
   ```bash
   docker compose ps
   ```

Dừng: `docker compose down`. Xóa cả dữ liệu PostgreSQL: `docker compose down -v`.

### Chạy riêng từng dịch vụ

```bash
# Frontend
cd frontend && npm install && npm run dev

# Backend (cần PostgreSQL đang chạy, xem biến trong .env)
cd backend && mvn spring-boot:run

# AI Service: xem ai/README.md
```

Chi tiết từng dịch vụ: [backend/README.md](backend/README.md), [ai/README.md](ai/README.md), [frontend/README.md](frontend/README.md).

### Kiểm tra sức khỏe

| Dịch vụ | Địa chỉ |
| --- | --- |
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080/api/v1/health |
| Backend Actuator | http://localhost:8080/actuator/health |
| AI Service | http://localhost:8000/health |
| AI OpenAPI | http://localhost:8000/docs |

## Quy ước làm việc

- **Git**: nhánh `main` (production, không commit trực tiếp), `dev` (tích hợp), `feature/<tên>` và `fix/<tên>` rẽ từ `dev`. Commit theo dạng `<type>: <mô tả>` với `feat`, `fix`, `infra`, `docs`, `refactor`, `test`, `style`. PR vào `dev` cần ít nhất 1 người duyệt và CI xanh. Chi tiết tại [GIT_CONVENTION.md](GIT_CONVENTION.md).
- **Giao diện**: toàn bộ bằng tiếng Việt, hỗ trợ sáng và tối, dùng `lucide-react` cho icon (không emoji), tái sử dụng component trong `frontend/src/components/ui/`. Chi tiết tại [frontend/AGENTS.md](frontend/AGENTS.md) và [frontend/DESIGN.md](frontend/DESIGN.md).
- **Cơ sở dữ liệu**: mọi thay đổi bảng phải cập nhật `docs/database.mmd`.
