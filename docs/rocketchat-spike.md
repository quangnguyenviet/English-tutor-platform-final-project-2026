# Rocket.Chat Spike Runbook

## Phiên bản

- Rocket.Chat: `8.9.1` LTS
- Apps-Engine: `1.67.0`
- MongoDB: `8.0` replica set
- NATS: `2.11-alpine`
- Cổng Rocket.Chat local: `3001`

## Khởi động

Sao chép các biến `ROCKETCHAT_*` từ `.env.example` sang `.env` và thay secret/password mặc định, sau đó chạy:

```bash
docker compose --profile messaging up -d rocketchat
docker compose --profile messaging ps
```

Lệnh chỉ định service `rocketchat` sẽ kéo theo MongoDB/NATS của messaging nhưng không khởi động PostgreSQL, MinIO và AI nếu chúng chưa chạy.

## Smoke test REST và realtime

```bash
node scripts/rocketchat-smoke.mjs
```

Smoke test thực hiện:

1. Login admin.
2. Tạo/reuse parent và tutor thử nghiệm.
3. Tạo temporary user token.
4. Tạo/reuse DM.
5. Gửi tin và đọc lịch sử.
6. Login DDP WebSocket, subscribe room và nhận tin realtime.

### Giới hạn air-gapped của Rocket.Chat 8.9

Rocket.Chat 8.9 chặn gửi tin với lỗi `restricted-workspace` nếu workspace không có usage-report token còn hạn và cũng không có license hợp lệ.

- Giữ `ROCKETCHAT_DISABLE_STATISTICS_REPORTING=false` cho spike local và cho phép container truy cập HTTPS tới collector.
- Nếu production không được phép gửi usage report, cần license offline/air-gapped phù hợp trước khi triển khai.
- Không sửa trực tiếp MongoDB hoặc monkey-patch Rocket.Chat để bỏ giới hạn này.

## PII Guard

Build package:

```bash
npm --prefix rocketchat-apps/pii-guard install
npm --prefix rocketchat-apps/pii-guard test
npm --prefix rocketchat-apps/pii-guard run package:app
```

Sau khi cài và enable private app trên Starter/premium workspace, kiểm tra end-to-end:

```bash
ROCKETCHAT_EXPECT_PII_GUARD=true node scripts/rocketchat-smoke.mjs
```

### License decision

Community workspace có core messaging và DM nhưng không cho enable private app mới từ Rocket.Chat 7.0. Có hai lựa chọn trước MSG-03/MSG-05:

1. Dùng Starter cho dự án nhỏ và giữ PII Guard App làm lớp chặn cuối.
2. Dùng Community nhưng không cấp Rocket.Chat token cho browser; Spring Boot proxy REST và realtime, do đó mọi message bắt buộc qua PII validation của backend.

Không được dùng kiến trúc “browser nhận Rocket.Chat token + Community không có PII Guard”, vì người dùng có thể gọi thẳng `chat.sendMessage` để bỏ qua backend.

## Dừng dịch vụ

```bash
docker compose --profile messaging stop rocketchat rocketchat-nats rocketchat-mongodb
```

Dữ liệu local nằm trong volume `rocketchat_mongodb_data`; không xóa volume nếu chưa chủ động muốn reset workspace.

## Quyết định kiến trúc đã áp dụng (MSG-03 trở đi)

- Backend Spring Boot là cổng duy nhất tới Rocket.Chat: provision tài khoản `ep_u{userId}`, tạo phòng private (group) gồm phụ huynh, gia sư và tài khoản admin, gửi tin bằng token tạm của người gửi, đọc transcript cho Lễ tân bằng tài khoản admin. Token tạm chỉ nằm trong bộ nhớ backend, hết hạn sau 20 phút hoặc khi người dùng đăng xuất.
- Trình duyệt không nhận token Rocket.Chat. Realtime đi qua SSE của backend; mất kết nối thì client kéo lịch sử bằng REST.
- Kiểm duyệt PII chạy ở backend (cùng bộ fixture `rocketchat-apps/pii-fixtures.json` với PII Guard App). Nếu cài được PII Guard App, cấu hình `backend_url` và `hmac_secret` trong app để app báo log chặn về `POST /api/v1/internal/chat/pii-events` (chữ ký HMAC-SHA256 trong header `X-Signature`, secret trùng `MESSAGING_INTERNAL_HMAC_SECRET`).
- Biến môi trường backend: `ROCKETCHAT_URL`, `ROCKETCHAT_ADMIN_USERNAME`, `ROCKETCHAT_ADMIN_PASSWORD`, `ROCKETCHAT_CREATE_TOKENS_SECRET`, `MESSAGING_INTERNAL_HMAC_SECRET`, `MESSAGING_JOBS_ENABLED`.
- Ghi chú vận hành: lần đầu tạo user trên Rocket.Chat có thể chậm vài giây; timeout đọc của client là 15 giây.
