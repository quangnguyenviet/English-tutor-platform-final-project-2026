# EnglishPath Backend

Backend của EnglishPath: cổng API duy nhất của hệ thống, chứa toàn bộ nghiệp vụ
(vận hành trung tâm và hỗ trợ giảng dạy), phân quyền RBAC theo 5 vai trò
(`ADMIN`, `RECEPTIONIST`, `ACCOUNTANT`, `TUTOR`, `STUDENT`), ghi audit log.

## Project structure

The codebase uses a package-by-feature structure so each business capability can
grow as an isolated module:

```text
com.mycompany.englishtutor
├── module
│   ├── auth       # Authentication: JWT, đổi mật khẩu, đăng ký gia sư, đăng nhập Google
│   ├── user       # Quản lý tài khoản & thông tin của tôi
│   ├── tutor      # Hồ sơ gia sư, duyệt/quản lý (admin), gói lưu trữ
│   ├── matching   # Lớp cần gia sư, đơn ghép lớp, ứng tuyển
│   ├── classroom  # Lớp học, lịch dạy, bài giảng, nhật ký, tài liệu
│   ├── quiz       # Quiz, Elo, AI chat, import, ôn tập ngắt quãng
│   ├── payment    # Phí nhận lớp, đối chiếu, hoàn tiền
│   ├── complaint  # Khiếu nại & hoàn tiền
│   ├── student    # Cổng học sinh (lịch, buổi học, quiz, dashboard)
│   ├── staff      # Nhân sự, thông báo, dashboard lễ tân/kế toán
│   ├── messaging  # Nhắn tin phụ huynh–gia sư qua Rocket.Chat, đề xuất lớp học
│   └── audit      # Audit log
├── infrastructure
│   └── config     # Spring, security, Flyway và cấu hình chung
└── shared
    ├── api        # Shared API envelope (ApiResponse, PageResponse)
    ├── exception  # Global error handling
    ├── util       # Tiện ích dùng chung
    └── validation # Shared validation constraints
```

Each business module keeps its own `controller`, `service`, `api`,
`domain`, `repository` and (when needed) `mapper` packages. When adding a new
feature, create a new folder under `module` and keep feature-specific code
inside it. Put code in `shared` only when it is genuinely used by multiple
modules.

## Tech stack
* Build tool: maven >= 3.9.5
* Java: 21
* Framework: Spring boot 3.2.x
* DBMS: PostgreSQL
* Database migrations: Flyway

## Prerequisites
* Java SDK 21
* A PostgreSQL server

## Tài khoản seed

Trên cơ sở dữ liệu mới (chạy xong migration Flyway), các tài khoản mẫu được tạo
bởi `V6__seed_sample_data.sql` — tất cả dùng mật khẩu chung `123456` (chưa ép đổi):

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin` | `123456` |
| Lễ tân | `receptionist` | `123456` |
| Kế toán | `accountant` | `123456` |
| Gia sư | `tutor` | `123456` |
| Học viên | `student` | `123456` |

> `ApplicationInitConfig` chỉ tự tạo tài khoản (mật khẩu = tên đăng nhập, ép đổi
> lần đầu) khi tên chưa tồn tại. Vì `V6` đã tạo sẵn, mật khẩu thực dụng là `123456`.

## Start application
`mvn spring-boot:run`

Database migrations are applied automatically by Flyway at application startup. Add
future schema changes as versioned SQL files under
`src/main/resources/db/migration` using Flyway's `V<version>__<description>.sql`
naming convention. Existing non-empty databases are automatically baselined at
version `0`, while new databases run the initial migration. Hibernate validates
the schema but does not create or update database objects.

## API documentation

After starting the application, open Swagger UI at
`http://localhost:8080/swagger-ui/index.html`.

The OpenAPI document is available at
`http://localhost:8080/v3/api-docs`.

To download the API documentation:

* JSON: open the URL above in a browser and use **Save as**, or run:
  `curl http://localhost:8080/v3/api-docs -o openapi.json`
* YAML: use:
  `curl http://localhost:8080/v3/api-docs.yaml -o openapi.yaml`

Swagger UI includes the `bearerAuth` security scheme. Use **Authorize** and enter
the JWT token to try protected endpoints.

## Build application
`mvn clean package`

## Docker guideline
> Chạy nhanh nhất là `docker compose up --build` từ thư mục gốc (postgres + minio + ai +
> Rocket.Chat). Ở chế độ dev, backend chạy bằng `mvn spring-boot:run` (không đóng gói Docker).
> Các lệnh dưới đây dùng khi cần đóng gói backend thành image độc lập.

### Build docker image
`docker build -t <account>/englishpath-backend:latest .`
### Push docker image to Docker Hub
`docker image push <account>/englishpath-backend:latest`
### Start PostgreSQL
`docker run --name englishpath-postgres -p 5432:5432 -e POSTGRES_DB=tutor_db -e POSTGRES_USER=tutor_user -e POSTGRES_PASSWORD=tutor_password_123 -d postgres:16`
### Run your application
`docker run --name englishpath-backend -p 8080:8080 -e DBMS_CONNECTION=jdbc:postgresql://postgres:5432/tutor_db -e DBMS_USERNAME=tutor_user -e DBMS_PASSWORD=tutor_password_123 englishpath-backend:latest`

## Install Docker on ubuntu

# Add Docker's official GPG key:
sudo apt-get update
sudo apt-get install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

# Add the repository to Apt sources:
echo \
"deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
$(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update

sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo docker run hello-world
