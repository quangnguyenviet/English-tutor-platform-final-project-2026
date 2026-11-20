# EnglishPath PII Guard

Private Rocket.Chat App dùng `IPreMessageSentPrevent` để chặn thông tin liên hệ trước khi Rocket.Chat lưu tin nhắn.

## Chạy test và đóng gói

```bash
npm install
npm test
npm run package:app
```

Gói cài đặt được sinh tại:

```text
dist/englishpath-pii-guard_0.1.0.zip
```

## Giới hạn license

Rocket.Chat 7+ không cho Community workspace bật private app mới. App này cần Starter/premium workspace. Nếu dự án dùng Community, backend phải giữ toàn bộ Rocket.Chat credential và proxy cả REST/realtime; trình duyệt không được nhận Rocket.Chat token để tránh đường gửi tin bỏ qua PII validation của Spring Boot.
