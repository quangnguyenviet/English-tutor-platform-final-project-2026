# PROJECT OVERVIEW
# Tutor-Parent Hub — Nền tảng kết nối gia sư và quản lý hành trình học tập thông qua trung tâm có tích hợp trợ lý AI

---

## 1. THÔNG TIN ĐỀ TÀI

- **Tên tiếng Việt:** Nghiên cứu và xây dựng nền tảng kết nối gia sư kết hợp quản lý hành trình học tập thông qua trung tâm có tích hợp trợ lý AI.
- **Tên tiếng Anh:** Research and Development of a Center-Mediated Tutor-Parent Hub Platform with Learning Journey Management and AI Assistant.
- **Định hướng sản phẩm:**  
  **Tutor-Parent Hub** là nền tảng số hóa toàn diện quy trình dịch vụ gia sư: từ khâu **tìm kiếm và kết nối có kiểm duyệt thông qua Trung tâm** (Trung tâm/Admin đóng vai trò bảo chứng chất lượng, thẩm định hồ sơ, điều phối lớp học và đảm bảo quyền lợi tài chính) cho đến **quản lý toàn bộ hành trình học tập thực tế (Learning Journey Management)** sau khi kết nối.

Hệ thống giải quyết triệt để bài toán: *"Sau khi tìm được gia sư thì việc dạy và học diễn ra như thế nào, làm sao phụ huynh nắm bắt được sự tiến bộ của con và gia sư có công cụ sư phạm hiệu quả?"*.

---

## 2. BỐI CẢNH VÀ VẤN ĐỀ CẦN GIẢI QUYẾT

### 2.1. Vấn đề trong việc tìm kiếm và kết nối gia sư
- **Thiếu sự xác thực và bảo chứng:** Tìm gia sư qua mạng xã hội (Facebook, diễn đàn) tiềm ẩn nhiều rủi ro về bằng cấp ảo, lừa đảo tiền đặt cọc hoặc gia sư bỏ lớp giữa chừng.
- **Vai trò của Trung tâm truyền thống bị tắc nghẽn:** Các trung tâm gia sư truyền thống xử lý thủ công qua điện thoại/Zalo, tốn thời gian môi giới, không có nền tảng quản lý theo dõi sau khi giao lớp.
- **Tranh chấp và học phí:** Phụ huynh e ngại trả trước học phí trực tiếp cho gia sư lạ; ngược lại, gia sư lo lắng bị bùng học phí sau khi dạy xong.

### 2.2. Vấn đề trong việc quản lý quá trình học tập
- **"Hộp đen" sau khi chốt gia sư:** Đa số các ứng dụng hiện nay chỉ dừng lại ở bước kết nối (Matching). Khi gia sư bắt đầu dạy, phụ huynh hầu như không biết chi tiết:
  - Từng buổi học con học những gì?
  - Mức độ tập trung và tiếp thu bài của con ra sao?
  - Bài tập về nhà được giao và hoàn thành như thế nào?
  - Con có tiến bộ thực sự qua từng tuần/tháng hay không?
- **Dữ liệu dạy & học bị phân tán:** Gia sư phải dùng rải rác Zalo/Messenger (nhắn tin), Google Drive (gửi tài liệu), sổ tay/Excel (theo dõi buổi học, chấm bài), dẫn đến việc thiếu tính hệ thống và khó tổng hợp báo cáo.
- **Gia sư mất nhiều thời gian soạn giáo án và bài tập:** Gia sư sinh viên/giáo viên mất nhiều công sức để tự xây dựng lộ trình học phù hợp với từng học sinh và thiết kế đề bài/bài kiểm tra định kỳ.

---

## 3. Ý TƯỞNG GIẢI PHÁP VÀ MÔ HÌNH HOẠT ĐỘNG

Tutor-Parent Hub xây dựng chu trình khép kín gồm 5 giai đoạn:

```
[CONNECT (Qua Trung tâm)] ➔ [PLAN (Lộ trình AI)] ➔ [TEACH & RECORD (Buổi học)] ➔ [PRACTICE & EVALUATE (Bài tập/2 Chiều)] ➔ [REPORT (Báo cáo Phụ huynh)]
```

1. **Connect (Kết nối có kiểm duyệt):** Phụ huynh đăng nhu cầu / tìm gia sư, Gia sư đăng ký hồ sơ KYC và nhận lớp thông qua sự thẩm định và điều phối của Trung tâm.
2. **Plan (Khung chương trình AI):** Gia sư sử dụng trợ lý AI để sinh khung chương trình học theo 2 cấp (tổng thể khóa học và chi tiết từng buổi học) được cá nhân hóa cho học sinh.
3. **Teach & Record (Dạy và ghi nhận):** Từng buổi học được số hóa qua **Session Log** (điểm danh, nội dung giảng dạy, nhận xét của gia sư).
4. **Practice & Evaluate (Luyện tập & Đánh giá 2 chiều):**
   - Gia sư giao bài tập / bài kiểm tra (được AI hỗ trợ sinh đề) và chấm điểm, phản hồi.
   - Cơ chế đánh giá 2 chiều: Gia sư nhận xét học sinh từng buổi; Phụ huynh/Học sinh đánh giá chất lượng gia sư.
5. **Report (Báo cáo trực quan):** Phụ huynh theo dõi toàn diện tiến độ, tỷ lệ hoàn thành bài tập, điểm số và nhật ký học tập của con qua Parent Dashboard.

---

## 4. CÁC ĐỐI TƯỢNG SỬ DỤNG (ACTORS & ROLES)

### 4.1. Phụ huynh (Parent)
- Đăng yêu cầu tìm gia sư (môn học, lớp, hình thức online/offline, khu vực, ngân sách, mục tiêu).
- Duyệt danh sách gia sư đã được Trung tâm xác minh (KYC Verified).
- Quản lý thông tin học sinh (con em).
- Đặt lịch học, thanh toán học phí qua hệ thống ký quỹ an toàn của Trung tâm (Escrow).
- Theo dõi nhật ký từng buổi học, tình trạng điểm danh, bài tập về nhà và điểm kiểm tra của con.
- Đánh giá chất lượng giảng dạy của gia sư định kỳ hoặc sau khóa học.

### 4.2. Gia sư (Tutor)
- Tạo hồ sơ năng lực (Profile), nộp giấy tờ xác minh danh tính và bằng cấp (KYC).
- Tìm kiếm lớp học phù hợp được đăng tuyển hoặc nhận lớp do Trung tâm điều phối.
- Sử dụng **AI Assistant** để:
  - Sinh khung chương trình học 2 cấp (Lộ trình tổng quát & Kế hoạch chi tiết từng buổi).
  - Sinh bài tập, câu hỏi trắc nghiệm, bài kiểm tra kèm đáp án/lời giải.
- Ghi nhận nhật ký buổi học (Session Log): điểm danh, nội dung đã dạy, nhận xét về mức độ tiếp thu của học sinh.
- Giao bài tập về nhà, chấm điểm, sửa bài và gửi nhận xét.
- Đánh giá mức độ hợp tác, chuyên cần của học sinh sau mỗi buổi học.
- Quản lý thu nhập và nhận học phí từ Trung tâm sau khi hoàn thành buổi học.

### 4.3. Học sinh (Learner / Student)
- Xem thời khóa biểu và lịch học các buổi.
- Nhận bài tập về nhà, bài kiểm tra từ gia sư.
- Nộp bài tập (dạng trắc nghiệm trực tuyến hoặc đính kèm ảnh/tài liệu bài làm tự luận).
- Xem điểm số, nhận xét và lời giải chi tiết từ gia sư.

### 4.4. Trung tâm / Quản trị viên (Center Admin / Operations)
- Thẩm định và duyệt hồ sơ danh tính, bằng cấp của gia sư (Quy trình KYC).
- Kiểm duyệt và phê duyệt các lớp học / bài đăng tìm gia sư của phụ huynh.
- Điều phối, ghép nối gia sư với lớp học phù hợp.
- Giám sát tiến độ lớp học, số lượng buổi học đã hoàn thành.
- Quản lý dòng tiền, tạm giữ học phí (Escrow) và giải ngân cho gia sư sau khi buổi học/khóa học hoàn thành hợp lệ.
- Xử lý khiếu nại, hỗ trợ đổi gia sư hoặc hoàn phí khi có tranh chấp phát sinh.

---

## 5. CHI TIẾT CÁC MODULE CHỨC NĂNG

### Module 1: Quản lý Xác thực, Phân quyền & KYC (Auth & Identity)
- Đăng ký, đăng nhập tài khoản đa vai trò (Admin, Tutor, Parent, Learner).
- Quản lý hồ sơ gia sư: Giới thiệu bản thân, học vấn, kinh nghiệm, môn dạy, khu vực, bảng giá, chứng chỉ.
- **Quy trình KYC của Trung tâm:** Gia sư upload CCCD, Thẻ sinh viên, Bằng cấp/Chứng chỉ ➔ Admin duyệt (`PENDING` ➔ `UNDER_REVIEW` ➔ `APPROVED` / `REJECTED`).

### Module 2: Kết nối & Điều phối qua Trung tâm (Center-Mediated Marketplace)
- **Phụ huynh:** Đăng tin tìm gia sư (Job Posting) hoặc tìm kiếm gia sư trên danh bạ đã kiểm duyệt.
- **Gia sư:** Ứng tuyển vào các lớp học phù hợp.
- **Trung tâm (Admin):** Kiểm duyệt tin đăng, điều phối, xác nhận ghép lớp thành công và mở lớp học chính thức.
- **Quản lý Hợp đồng & Lịch học:** Thiết lập thời khóa biểu (lịch học cố định/linh hoạt, buổi học thử, đổi lịch).

### Module 3: Không gian quản lý học tập (Learning Workspace & Session Logs)
- **Nhật ký buổi học (Session Log):** Sau mỗi buổi học, gia sư ghi nhận:
  - Trạng thái điểm danh (Có mặt, Đi muộn, Vắng có phép, Vắng không phép).
  - Nội dung kiến thức đã giảng dạy trong buổi.
  - Tài liệu bài giảng đính kèm.
  - Ghi chú và nhận xét sư phạm về thái độ, mức độ hiểu bài của học sinh.
- **Lịch sử học tập (Learning History):** Toàn bộ lịch sử các buổi học được lưu trữ liền mạch, giúp phụ huynh và trung tâm theo dõi sát sao.

### Module 4: Đánh giá 2 chiều (Two-way Evaluation System)
- **Gia sư đánh giá Học sinh:** Nhận xét từng buổi học về mức độ hiểu bài, mức độ tập trung, điểm cần cải thiện.
- **Phụ huynh/Học sinh đánh giá Gia sư:** Đánh giá chất lượng giảng dạy, tính đúng giờ, sự nhiệt tình, phương pháp sư phạm (thang điểm 1-5 sao kèm nhận xét). Đánh giá này ảnh hưởng trực tiếp đến độ uy tín của gia sư trên nền tảng.

### Module 5: Quản lý Bài tập & Bài kiểm tra (Homework & Quiz Management)
- **Giao bài tập/bài kiểm tra:** Gia sư tạo bài tập (tự luận hoặc trắc nghiệm), đặt thời hạn nộp (Deadline), đính kèm tài liệu hướng dẫn.
- **Làm và nộp bài:** Học sinh làm trắc nghiệm trực tiếp trên hệ thống hoặc tải lên ảnh/file bài làm tự luận.
- **Chấm điểm & Nhận xét:** Gia sư chấm điểm, ghi nhận xét chi tiết từng câu hoặc tổng quan bài làm.
- **Báo cáo kết quả:** Hệ thống tổng hợp tỷ lệ làm bài, điểm số trung bình, biểu đồ tiến độ bài tập hiển thị trên Dashboard của Phụ huynh.

### Module 6: Quản trị Trung tâm & Tài chính Bảo đảm (Admin Operations & Escrow)
- **Quản lý học phí (Escrow):** Phụ huynh thanh toán học phí vào tài khoản trung gian của Trung tâm ➔ Trung tâm tạm giữ bảo đảm ➔ Sau khi các buổi học hoàn tất và được xác nhận, hệ thống giải ngân học phí cho gia sư (sau khi trừ phí dịch vụ/hoa hồng trung tâm).
- **Xử lý tranh chấp:** Giải quyết các trường hợp nghỉ học đột xuất, đổi gia sư, hoàn trả học phí theo quy chế trung tâm.
- **Dashboard Trung tâm:** Thống kê tổng số lớp đang hoạt động, doanh thu, tỷ lệ hoàn thành buổi học, trạng thái KYC.

---

## 6. ĐẶC TẢ PHẠM VI TÍNH NĂNG AI (AI ASSISTANT SCOPE)

> [!IMPORTANT]
> **Phạm vi tính năng AI của đề tài được quy hoạch tập trung và chuẩn xác vào 2 năng lực cốt lõi sau đây:**

```
                                  ┌───────────────────────────────┐
                                  │      TRỢ LÝ AI (FASTAPI)      │
                                  └──────────────┬────────────────┘
                                                 │
                  ┌──────────────────────────────┴──────────────────────────────┐
                  ▼                                                             ▼
   ┌──────────────────────────────┐                              ┌──────────────────────────────┐
   │ TÍNH NĂNG 1:                 │                              │ TÍNH NĂNG 2:                 │
   │ AI TẠO KHUNG CHƯƠNG TRÌNH    │                              │ AI TẠO BÀI TẬP & BÀI TEST    │
   │ (2 CẤP ĐỘ)                   │                              │                              │
   └──────────────┬───────────────┘                              └──────────────┬───────────────┘
                  │                                                             │
         ┌────────┴────────┐                                           ┌────────┴────────┐
         ▼                 ▼                                           ▼                 ▼
   [CẤP 1: LỘ TRÌNH] [CẤP 2: BUỔI HỌC]                           [BÀI TRẮC NGHIỆM]  [BÀI TỰ LUẬN/ĐÁP ÁN]
   (Course Outline)  (Session Plan)                              (Multiple Choice)  (Open-ended & Key)
```

### 6.1. Tính năng AI 1: AI tạo Khung chương trình học theo 2 cấp (Two-Level Curriculum Generation)

1. **Cấp 1 — Khung lộ trình tổng thể toàn khóa (Course / Syllabus Level):**
   - **Đầu vào (Input):** Môn học, Khối lớp, Trình độ hiện tại của học sinh, Mục tiêu đầu ra (ví dụ: Lấy lại gốc, Ôn thi vào 10, Ôn thi HSG, Nâng cao), Tổng số buổi học dự kiến (ví dụ: 10, 20, 30 buổi), Số buổi/tuần.
   - **Đầu ra (Output):** Khung phân phối chương trình toàn khóa gồm các chủ đề lớn (Modules/Units), mục tiêu kiến thức từng giai đoạn, phân bổ số buổi học cho từng chuyên đề.
   
2. **Cấp 2 — Khung kế hoạch chi tiết từng buổi học (Session / Lesson Plan Level):**
   - **Đầu vào (Input):** Chủ đề của buổi học cụ thể (chọn từ Khung cấp 1), thời lượng buổi học (vd: 90 phút hoặc 120 phút), yêu cầu trọng tâm của gia sư.
   - **Đầu ra (Output):** Giáo án/Kế hoạch chi tiết cho buổi học gồm:
     - Mục tiêu cụ thể của buổi học (Kiến thức - Kỹ năng).
     - Phân bổ thời gian từng phần (Khởi động/Kiểm tra bài cũ, Giảng lý thuyết trọng tâm, Thực hành làm ví dụ mẫu, Củng cố & Giao bài tập).
     - Các dạng bài tập minh họa mẫu và lưu ý lỗi sai học sinh thường gặp.
   - **Quyền kiểm soát của Gia sư:** Gia sư có toàn quyền chỉnh sửa, thêm/bớt nội dung giáo án do AI gợi ý trước khi lưu vào lớp học.

### 6.2. Tính năng AI 2: AI tạo Bài tập & Bài kiểm tra (Assignment & Quiz Generator)

1. **Sinh câu hỏi trắc nghiệm (Multiple-choice Questions):**
   - Tạo các bộ câu hỏi 4 lựa chọn (A, B, C, D) theo chủ đề môn học và cấp độ nhận thức (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).
   - Tự động tạo đáp án đúng kèm lời giải thích chi tiết từng bước.
2. **Sinh bài tập tự luận và bài kiểm tra định kỳ (Open-ended Exercises & Periodical Tests):**
   - Tạo đề bài tự luận theo chủ đề buổi học hoặc đề ôn tập tổng hợp sau một số buổi.
   - Tự động cung cấp barem chấm điểm, phương pháp giải và đáp án mẫu để hỗ trợ gia sư trong quá trình chấm và chữa bài.
3. **Tuỳ biến linh hoạt:** Gia sư có thể yêu cầu AI tăng/giảm độ khó, thay đổi số lượng câu hỏi, hoặc sinh đề tương tự dựa trên một dạng bài học sinh làm sai nhiều.

### 6.3. Giới hạn phạm vi AI (Non-Goals / Out-of-Scope AI Features)
- **KHÔNG** triển khai nhận diện khuôn mặt điểm danh / AI phân tích cảm xúc qua camera.
- **KHÔNG** triển khai AI chấm điểm tự luận tự động 100% (Gia sư là người giữ quyền quyết định chấm điểm và nhận xét cuối cùng để đảm bảo tính nhân văn và sư phạm).
- **KHÔNG** làm OCR trích xuất chữ viết tay phức tạp.
- **KHÔNG** triển khai mô hình video streaming tự xây dựng (sử dụng tích hợp link Google Meet / Zoom khi học online).

---

## 7. KIẾN TRÚC HỆ THỐNG VÀ CÔNG NGHỆ (SYSTEM ARCHITECTURE & TECH STACK)

### 7.1. Sơ đồ kiến trúc tổng thể
```
┌────────────────────────────────────────────────────────────────────────┐
│                          NGƯỜI DÙNG & GIAO DIỆN                        │
│             (Phụ huynh, Gia sư, Học sinh, Quản trị viên Trung tâm)      │
│                                                                        │
│   Next.js (React, TypeScript) + TailwindCSS v4 + shadcn/ui + Lucide   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS (RESTful API / JSON)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE BACKEND (TRUNG TÂM)                        │
│                           Java / Spring Boot                           │
│                                                                        │
│  - Module Auth & Phân quyền RBAC (JWT Spring Security)                │
│  - Module Quản lý Người dùng, Gia sư & KYC Approval                    │
│  - Module Điều phối Lớp học & Marketplace Trung tâm                   │
│  - Module Learning Workspace (Session Logs, Attendance, 2-Way Reviews) │
│  - Module Bài tập & Bài kiểm tra (Homework, Quizzes, Grading)          │
│  - Module Thanh toán & Ký quỹ an toàn (Escrow & Transactions)         │
└─────────────────┬────────────────────────────────────┬─────────────────┘
                  │                                    │ HTTP REST Call
                  ▼                                    ▼
┌───────────────────────────────────┐    ┌───────────────────────────────┐
│       DATABASE & STORAGE          │    │          AI SERVICE           │
│                                   │    │        (Python FastAPI)       │
│ - PostgreSQL: RDBMS lưu trữ dữ    │    │                               │
│   liệu người dùng, lớp, logs, v.v │    │ - Two-Level Curriculum Agent  │
│ - Redis: Caching, session token   │    │ - Assignment & Quiz Generator │
│ - MinIO / S3: Lưu trữ tài liệu    │    │ - LLM Provider: OpenAI /      │
│   học tập, ảnh KYC, bài làm       │    │   Google Gemini / Claude API  │
└───────────────────────────────────┘    └───────────────────────────────┘
```

### 7.2. Bảng tổng hợp công nghệ sử dụng

| Tầng hệ thống | Công nghệ / Thư viện | Vai trò |
|---|---|---|
| **Frontend Web** | Next.js (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Lucide Icons | Giao diện Responsive cho Phụ huynh, Gia sư, Học sinh và Admin Trung tâm |
| **Backend Core** | Java 17 / 21, Spring Boot 3, Spring Security (JWT), Spring Data JPA | Xử lý logic nghiệp vụ, quản lý lớp, điều phối, bảo mật và lưu trữ dữ liệu |
| **Cơ sở dữ liệu** | PostgreSQL 15+, Hibernate ORM | Lưu trữ quan hệ ACID: Người dùng, KYC, Lớp học, Buổi học, Bài tập, Đánh giá |
| **Caching & Job** | Redis | Bộ nhớ đệm dữ liệu truy vấn nhanh, rate limiting |
| **AI Service** | Python 3.11+, FastAPI, Pydantic, uv | Service độc lập xử lý sinh Khung chương trình 2 cấp và sinh Bài tập/Đề kiểm tra |
| **AI Models** | OpenAI API (GPT-4o / GPT-4o-mini) hoặc Google Gemini API | Mô hình ngôn ngữ lớn (LLM) phục vụ sinh nội dung sư phạm |
| **DevOps & Deploy** | Docker, Docker Compose | Đóng gói và chạy đồng bộ toàn bộ hệ thống (Frontend, Backend, AI Service, DB) |

---

## 8. GIÁ TRỊ CỐT LÕI CỦA ĐỀ TÀI (CORE VALUE PROPOSITION)

1. **Bảo chứng tin cậy thông qua Trung tâm:** Loại bỏ nỗi lo về gia sư kém chất lượng hoặc rủi ro tài chính nhờ quy trình kiểm duyệt KYC và cơ chế ký quỹ học phí (Escrow).
2. **Minh bạch hóa hành trình học tập:** Phụ huynh không còn đứng ngoài "hộp đen" sau khi tìm gia sư; mọi buổi học, bài tập, nhận xét đều được cập nhật minh bạch, tức thời.
3. **Đánh giá 2 chiều công bằng:** Nâng cao trách nhiệm của cả gia sư (giảng dạy tận tâm, nhận xét chi tiết) và học sinh/phụ huynh (học tập nghiêm túc, đóng góp ý kiến xây dựng).
4. **Trợ lý AI thiết thực và tập trung:** Ứng dụng AI đúng trọng tâm vào việc giảm tải công sức soạn giáo án (2 cấp độ) và tạo bài tập/bài kiểm tra cho gia sư, nâng cao chất lượng giảng dạy mà không làm phức tạp hóa hệ thống.
