# EnglishPath Frontend

Ứng dụng React (SPA) phục vụ 5 cổng: Công khai (phụ huynh), Gia sư, Học sinh,
Phụ huynh, Lễ tân / Admin / Kế toán. Giao diện 100% tiếng Việt, hỗ trợ sáng &
tối (chuẩn thiết kế: xem `AGENTS.md`, `DESIGN.md`).

## Công nghệ

- React 19, Vite, Tailwind CSS v4
- React Router 7 (định tuyến theo vai trò), Recharts (biểu đồ thống kê)
- Icon: `lucide-react` (không dùng emoji)

## Chạy local

```bash
npm install
npm run dev
```

Frontend dev chạy tại `http://localhost:5173`.

## Biến môi trường

Tạo file `.env.local` (sao chép từ `.env.local.example`, không commit):

```bash
# URL backend (bắt buộc — các module API trong src/lib/*.js đọc từ đây)
VITE_API_BASE_URL=http://localhost:8080
```

## Lệnh

| Lệnh | Ý nghĩa |
| --- | --- |
| `npm run dev` | Chạy dev server (Vite, port 5173) |
| `npm run build` | Build production ra `dist/` |
| `npm run lint` | Chạy oxlint |
| `npm run preview` | Xem bản build production |
