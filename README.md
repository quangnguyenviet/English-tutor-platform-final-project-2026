# Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh ứng dụng LLM và Spaced Repetition

Nền tảng Web **single-tenant** hỗ trợ vận hành và nâng cao chất lượng giảng dạy cho mô hình gia sư tiếng Anh 1-1. Hệ thống gồm 4 thành viên chính: **Parent Portal**, **Tutor Portal**, **Student Portal** và **Admin Dashboard**, tích hợp **AI Service (LangGraph/FastAPI)** để tự động hóa việc biên soạn chương trình học và bài tập cá nhân hóa.

---

## 🏗️ Cấu trúc hệ thống & Công nghệ

| Thành phần | Đường dẫn | Công nghệ sử dụng | Cổng Mặc định |
| :--- | :--- | :--- | :--- |
| **Frontend** | `./frontend` | ReactJS 19, Vite, TailwindCSS v4 | `http://localhost:3000` |
| **Backend** | `./backend` | Java 17, Spring Boot 3.2.3, Spring Data JPA | `http://localhost:8080` |
| **AI Service** | `./ai` | Python 3.11, FastAPI, Uvicorn, LangGraph | `http://localhost:8000` |
| **Database** | `./docker/init.sql` | PostgreSQL 16 | `localhost:5432` |

---

## 🚀 Hướng dẫn khởi chạy môi trường Local (Docker Compose)

### Yêu cầu tiên quyết
- **Docker** (v24.0+) & **Docker Compose** (v2.20+) đã được cài đặt trên máy.
- **Git** để clone và quản lý mã nguồn.

### Các bước thực hiện (3 bước đơn giản)

1. **Tạo file môi trường `.env`**:
   Copy file `.env.example` thành `.env` ở thư mục gốc:
   ```bash
   cp .env.example .env
   ```

2. **Khởi chạy toàn bộ 4 dịch vụ bằng Docker Compose**:
   ```bash
   docker compose up --build -d
   ```

3. **Kiểm tra trạng thái các dịch vụ**:
   Sau khi container khởi chạy thành công, kiểm tra bằng lệnh:
   ```bash
   docker compose ps
   ```

---

## 🩺 Kiểm tra sức khỏe (Healthchecks)

Truy cập các địa chỉ sau trên trình duyệt hoặc qua cURL để đảm bảo các dịch vụ hoạt động bình thường:

- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend Health Check**: [http://localhost:8080/api/v1/health](http://localhost:8080/api/v1/health)
  - Trả về: `{"status": "UP", "service": "tutor-backend", "timestamp": "..."}`
- **Backend Actuator**: [http://localhost:8080/actuator/health](http://localhost:8080/actuator/health)
- **AI Service Health Check**: [http://localhost:8000/health](http://localhost:8000/health)
  - Trả về: `{"status": "ok", "service": "ai-service", "timestamp": "..."}`
- **AI OpenAPI Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📌 Dừng và Xóa Containers

Khi cần dừng môi trường local:
```bash
docker compose down
```

Nếu muốn xóa toàn bộ dữ liệu CSDL PostgreSQL để làm sạch:
```bash
docker compose down -v
```

---

## 🤝 Quy ước làm việc Git (Git Convention)

Chi tiết quy trình rẽ nhánh, định dạng commit message và quy trình gửi Pull Request được quy định tại [GIT_CONVENTION.md](file:///e:/PTIT/%C4%90%E1%BB%93%20%C3%A1n/Do-an/GIT_CONVENTION.md).

- **`main`**: Nhánh Chính (Production).
- **`dev`**: Nhánh Tích hợp.
- **`feature/<tên-tính-năng>`**: Nhánh làm việc cá nhân cho từng WBS.
