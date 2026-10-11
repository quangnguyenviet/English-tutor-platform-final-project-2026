# Frontend UI Rules — EnglishPath

Áp dụng cho mọi tác vụ phát triển giao diện (UI/UX), thêm mới hoặc sửa đổi trang/component trong dự án `frontend`.

---

## 1. MỤC TIÊU VÀ NGUYÊN TẮC BẮT BUỘC

Mọi trang và component mới (Student, Tutor, Admin, Receptionist, Guest...) **bắt buộc** phải tuân thủ nghiêm ngặt ngôn ngữ thiết kế đồng nhất của hệ thống, lấy 2 trang chuẩn sau làm **Golden Reference (Chuẩn tham chiếu vàng)**:
1. **Landing Page**: [LandingPage.jsx](src/pages/LandingPage.jsx) và các component tại [frontend/src/components/landing/](src/components/landing/).
2. **Trang Gia sư (Tutor Portal)**: [TutorDashboard.jsx](src/pages/tutor/TutorDashboard.jsx), [ClassRequests.jsx](src/pages/tutor/ClassRequests.jsx), [TutorProfile.jsx](src/pages/tutor/TutorProfile.jsx) cùng AppShell tại [AppShell.jsx](src/components/layout/AppShell.jsx).
3. **Design System Specification**: Đọc kỹ [frontend/DESIGN.md](DESIGN.md).

> **Tuyệt đối không:** Tự ý tạo ra các phong cách thiết kế lệch chuẩn, bảng màu ngoại lai (tím neon, hồng rực, đen tuyền #000000), hoặc sử dụng emoji làm icon.

---

## 2. CHUẨN THIẾT KẾ CỐT LÕI (DESIGN SYSTEM TOKENS)

Phong cách chủ đạo: **"Midnight Academic"** — Hiện đại, trang nhã, tin cậy, tối ưu hiển thị thông tin học thuật (Density 6/10, Motion 4/10).

### 2.1. Bảng màu (Color Palette) & Dark Mode Hỗ trợ song song
Hệ thống sử dụng Tailwind CSS v4 với CSS Variables tại [frontend/src/index.css](src/index.css). Mọi màn hình **bắt buộc hỗ trợ hoàn hảo cả 2 theme**:

| Thành phần | Light Theme | Dark Theme (`dark:`) |
| :--- | :--- | :--- |
| **Nền trang (Canvas)** | `#F7F9FC` hoặc `#F8FAFC` (`bg-background`) | `#0B1220` hoặc Gradient Navy Midnight (`#0a0a2e` -> `#1a1a4e`) |
| **Bề mặt thẻ (Cards/Surface)** | `bg-white` (`#FFFFFF`) | `dark:bg-slate-900` hoặc Glass `rgba(255,255,255,0.05)` |
| **Viền (Border)** | `border-slate-200` (`#E2E8F0` / `#DCE3EE`) | `dark:border-slate-800` hoặc `rgba(255,255,255,0.10)` |
| **Chữ chính (Primary text)** | `text-slate-900` (`#0F172A` / `text-foreground`) | `dark:text-white` (`#FFFFFF`) |
| **Chữ phụ (Secondary text)**| `text-slate-500` / `text-slate-600` | `dark:text-slate-400` |
| **Accent chính (Primary Blue)**| `bg-blue-600 hover:bg-blue-700 text-white` | Giữ nguyên Blue hoặc `bg-blue-500` |
| **Accent phụ (Cyan highlight)**| `#0EA5E9` (Sky/Cyan) | `#00BFFF` (Dùng cho Live session, pulse glow, progress bar) |

### 2.2. Trạng thái ngữ nghĩa (Status Badges & Tones)
Sử dụng chuẩn Tone màu đồng nhất cho Badge, Stat Icon và Status Indicator:
- **Emerald (Thành công / Đã xác nhận / Hoàn thành):**
  - Light: `bg-emerald-50 text-emerald-700 border-emerald-200` (hoặc `bg-emerald-100 text-emerald-800`)
  - Dark: `dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40`
- **Amber (Cảnh báo / Chờ duyệt / Cần chấm):**
  - Light: `bg-amber-50 text-amber-700 border-amber-200`
  - Dark: `dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40`
- **Blue (Thông tin / Yêu cầu mới / Mặc định):**
  - Light: `bg-blue-50 text-blue-700 border-blue-200`
  - Dark: `dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40`
- **Rose (Nguy hiểm / Huỷ bỏ / Từ chối):**
  - Light: `bg-rose-50 text-rose-700 border-rose-200`
  - Dark: `dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/40`
- **Violet / Teal (Tính năng phụ, chủ đề lớp học):**
  - Dùng tương ứng với format nền nhạt 50, chữ 700, dark 950/40.

---

## 3. QUY TẮC BỐ CỤC & TYPOGRAPHY

### 3.1. Typography
- **Font gia đình:** `Inter` cho văn bản UI thường, `Geist Mono` cho số liệu thống kê / mã ID / timestamps.
- **Tiêu đề trang (Page Title):**
  ```jsx
  <div className="mb-6">
    <p className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
      {categoryOrBreadcrumb}
    </p>
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
      {pageTitle}
    </h1>
    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
      {pageDescription}
    </p>
  </div>
  ```
- **Tiêu đề khối (Section Heading):** `text-base font-semibold text-slate-900 dark:text-white`.
- **Nhãn phụ / Metadata:** `text-xs text-slate-500 dark:text-slate-400`.
- **Cấm hoàn toàn:** Không dùng font serif (Times New Roman, Georgia...). Không dùng chữ gradient màu mè trên tiêu đề dashboard.

### 3.2. Bố cục trang trong App (App Shell Wrapper)
Mọi trang nằm trong AppShell (Tutor, Student, Admin):
- Bọc nội dung trong container chuẩn:
  ```jsx
  <div className="px-4 lg:px-8 py-6 lg:py-8 space-y-6 max-w-6xl mx-auto min-h-[100dvh]">
    {/* Page Content */}
  </div>
  ```
- **Hàng chỉ số (Stat Cards Row):**
  Sử dụng Grid 3 cột (`grid-cols-3 gap-3`) hoặc 4 cột (`grid grid-cols-2 lg:grid-cols-4 gap-4`).
- **Khối chia cột nội dung:** Chia bất đối xứng `lg:grid-cols-5` (3 cột chính + 2 cột phụ) hoặc `lg:grid-cols-3` (2 + 1). Tránh chia đều 3 cột thẻ tẻ nhạt.

---

## 4. QUY TẮC TÁI SỬ DỤNG COMPONENT (KHÔNG CODE LẠI TỪ ĐẦU)

Khi dựng giao diện, **bắt buộc kiểm tra và ưu tiên tái sử dụng** các component đã dựng sẵn tại `frontend/src/components/ui/`:

1. **Button** (`frontend/src/components/ui/Button.jsx`):
   - Variant: `primary`, `secondary`, `outline`, `ghost`, `danger`.
   - Luôn kèm hiệu ứng nhấn: `active:scale-[0.98] transition-all`.
2. **Badge** (`frontend/src/components/ui/Badge.jsx`):
   - Tone: `emerald`, `amber`, `blue`, `rose`, `teal`, `violet`, `slate`.
   - Bo góc tròn pill: `rounded-full px-2.5 py-1 text-xs font-medium`.
3. **Card & StatCard** (`frontend/src/components/ui/Card.jsx`, `StatCard.jsx`):
   - Bo góc chuẩn: `rounded-2xl` hoặc `rounded-xl`.
   - Viền: `border border-slate-200 dark:border-slate-800`.
   - Đổ bóng nhẹ: `hover:border-blue-300 dark:hover:border-blue-800 transition-colors`.
4. **Icons**:
   - Chỉ sử dụng thư viện **`lucide-react`** (`<Users size={18} />`, `<Sparkles size={16} />`, `<CalendarDays />`).
   - Icon nằm trong khung vuông mềm: `w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center`.
   - **CẤM DÙNG EMOJI** trong button, badge, bảng biểu hoặc nhãn chức năng.
5. **Loading States**:
   - Sử dụng Skeleton Shimmer (`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl`).
   - Chỉ dùng spinner (`Loader2` từ `lucide-react`) cho trạng thái loading bên trong button.

---

## 5. NGUYÊN TẮC NGÔN NGỮ & NỘI DUNG

1. **Ngôn ngữ hiển thị:** Toàn bộ giao diện người dùng phải viết bằng **Tiếng Việt chuẩn**, tự nhiên, đúng thuật ngữ giáo dục (VD: "Lớp đang hoạt động", "Chờ chấm bài", "Yêu cầu nhận lớp", "Học viên", "Thời khoá biểu").
2. **Dữ liệu mẫu (Mock data):** Tên học viên và phụ huynh phải là tên người Việt chuẩn (VD: "Nguyễn Minh Khôi", "Lê Hoàng Nam", "Đặng Gia Bảo").
3. **Không dùng khẩu hiệu sáo rỗng AI:** Tránh các từ như "Unleash your potential", "Game-changing", "Next-Gen".

---

## 6. DANH SÁCH KIỂM TRA TRƯỚC KHI HOÀN TẤT MỖI TRANG (CHECKLIST)

Trước khi submit code bất kỳ trang nào, agent phải tự kiểm tra:
- [ ] Giao diện có ăn khớp với phong cách của [LandingPage.jsx](src/pages/LandingPage.jsx) hoặc [TutorDashboard.jsx](src/pages/tutor/TutorDashboard.jsx) không?
- [ ] Có hỗ trợ đầy đủ cả Light Mode và Dark Mode (`dark:`) không? Có bị chữ đen trên nền tối hay ngược lại không?
- [ ] Các nút bấm có hiệu ứng hover/active (`active:scale-[0.98] cursor-pointer`) không?
- [ ] Các icon có dùng đồng nhất từ `lucide-react` không? Có emoji nào bị lọt vào không?
- [ ] Bo góc thẻ và nút có theo chuẩn `rounded-xl` hoặc `rounded-2xl` không?
- [ ] Layout có co giãn mượt mà trên mobile (`< 768px`) không tràn chiều ngang không?
