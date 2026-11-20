# Google OAuth cho tài khoản phụ huynh

## Google Cloud Console

Tạo OAuth 2.0 Client loại **Web application** và khai báo redirect URI chính xác:

```text
http://localhost:5173/auth/google/callback
```

Production phải dùng HTTPS và thêm callback production vào cả Google Cloud Console lẫn `GOOGLE_OAUTH_REDIRECT_URIS`.

## Biến môi trường backend

```dotenv
GOOGLE_OAUTH_CLIENT_ID=...
GOOGLE_OAUTH_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT_URIS=http://localhost:5173/auth/google/callback
```

Có thể khai báo nhiều redirect URI bằng dấu phẩy. Backend từ chối mọi callback URI không nằm trong allowlist.

## Luồng xác thực

1. Frontend sinh `state`, `nonce`, PKCE `code_verifier` và `code_challenge` S256.
2. Backend tạo Google authorization URL cho redirect URI đã được allowlist.
3. Google redirect về `/auth/google/callback` với authorization code.
4. Frontend kiểm tra `state`, sau đó gửi code, verifier và nonce cho backend.
5. Backend đổi code, xác minh chữ ký ID token, issuer, thời hạn, audience, `email_verified` và nonce.
6. Backend tạo hoặc tìm liên kết `(GOOGLE, sub)`, sau đó phát JWT nội bộ `ROLE_PARENT`.

Phụ huynh không có mật khẩu local. Email trùng tài khoản chưa liên kết không được tự động chiếm; người dùng phải liên hệ hỗ trợ để xác minh.
