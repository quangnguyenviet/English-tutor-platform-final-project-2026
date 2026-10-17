# Identity service
This microservice is responsible for:
* Onboarding users
* Role-based access control
* Authentication

## Project structure

The codebase uses a package-by-feature structure so each business capability can
grow as an isolated module:

```text
com.mycompany.englishtutor
├── module
│   ├── auth       # Authentication, JWT and token lifecycle
│   ├── role       # Role management
│   └── user       # User management
├── infrastructure
│   └── config     # Spring, security and OpenAPI configuration
└── shared
    ├── api        # Shared API envelope
    ├── exception  # Global error handling
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

Sau khi khởi động ứng dụng và chạy migration, có thể sử dụng các tài khoản mẫu
sau để đăng nhập:

| Vai trò | Tên đăng nhập | Mật khẩu |
| --- | --- | --- |
| Quản trị viên | `admin` | `admin` |
| Gia sư | `tutor` | `tutor` |
| Học viên | `student` | `student` |
| Lễ tân | `receptionist` | `receptionist` |

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
`http://localhost:8080/identity/swagger-ui/index.html`.

The OpenAPI document is available at
`http://localhost:8080/identity/v3/api-docs`.

To download the API documentation:

* JSON: open the URL above in a browser and use **Save as**, or run:
  `curl http://localhost:8080/identity/v3/api-docs -o openapi.json`
* YAML: use:
  `curl http://localhost:8080/identity/v3/api-docs.yaml -o openapi.yaml`

Swagger UI includes the `bearerAuth` security scheme. Use **Authorize** and enter
the JWT token to try protected endpoints.

## Build application
`mvn clean package`

## Docker guideline
### Build docker image
`docker build -t <account>/english-tutor:0.9.0 .`
### Push docker image to Docker Hub
`docker image push <account>/english-tutor:0.9.0`
### Create network:
`docker network create devteria-network`
### Start PostgreSQL in devteria-network
`docker run --network devteria-network --name postgres -p 5432:5432 -e POSTGRES_DB=identity_service -e POSTGRES_USER=identity_user -e POSTGRES_PASSWORD=identity_password -d postgres:16`
### Run your application in devteria-network
`docker run --name english-tutor --network devteria-network -p 8080:8080 -e DBMS_CONNECTION=jdbc:postgresql://postgres:5432/identity_service -e DBMS_USERNAME=identity_user -e DBMS_PASSWORD=identity_password english-tutor:0.9.0`

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
