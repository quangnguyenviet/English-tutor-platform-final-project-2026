# Tài liệu Đặc tả Ý tưởng: Khởi tạo điểm Mastery Score (Elo Baseline) & Micro-Skill Catalog

> **Trạng thái:** Đã hoàn thành Brainstorming (Complete)  
> **Workspace:** `_bmad-output/mastery-score-initialization`  
> **Ngày cập nhật:** 03/10/2026  

---

## 1. Bối cảnh & Vấn đề (Context & Problem Statement)

Trong hệ thống **Gia sư Tiếng Anh Cá nhân hóa**, điểm `mastery_score` (thang 0–100) được tự động tính toán dựa trên **thuật toán Elo Rating** cho từng micro-skill trong hồ sơ tri thức học sinh (*Student Knowledge Profile - SKP*).

**Phân định tính năng rõ ràng giữa 2 Engines:**
- **Elo Rating Engine:** Cập nhật `mastery_score` sau **mọi câu trả lời** (đúng hoặc sai) để đo lường biến động năng lực thời gian thực.
- **Spaced Repetition Engine (SM-2):** Kích hoạt **đặc thù khi học sinh làm SAI câu hỏi** trong bài Quiz/Bài tập $\rightarrow$ Tự động đưa các câu trả lời sai vào **Danh sách Ôn tập Ngắt quãng (Daily Review List)** và lập lịch `next_review` theo thuật toán SM-2 để học sinh ôn lại đúng thời điểm cho đến khi master.

**Vấn đề Cold Start của Elo Rating:** Khi học sinh mới tạo tài khoản, hệ thống chưa có lịch sử làm bài để tính điểm Elo. 
- Nếu học sinh tự đánh giá (Self-assessment) $\rightarrow$ Dữ liệu bị nhiễu do học sinh không tự định vị đúng năng lực.
- Nếu dùng bài test tự do bên ngoài $\rightarrow$ Không có ma trận độ khó chuẩn hóa để quy đổi ra Elo.

---

## 2. Giải pháp chốt: Tutor-Driven Initial SKP Setup (Chuẩn CEFR & Thang Elo Cờ Vua)

### 2.1. Phân định Phạm vi Tracking (Scope Separation)
- **Tự động hóa qua Elo Engine (System Auto-Tracked):** Tập trung vào 3 mảng micro-skills đo lường chuẩn xác qua bài tập định lượng: **Ngữ pháp (Grammar)**, **Từ vựng (Vocabulary)**, và **Đọc hiểu (Reading)**.
- **Đánh giá định tính bởi Gia sư (Tutor Qualitative Assessment):** Các kỹ năng **Nói (Speaking)**, **Viết (Writing)** và **Nghe (Listening)** bỏ qua

### 2.2. Trạng thái Lifecycle của SKP
1. **UNINITIALIZED (Chưa khởi tạo):** Khi tài khoản học sinh vừa tạo. Dashboard học sinh hiển thị thông báo chờ Gia sư kích hoạt sau buổi học đầu tiên.
2. **ACTIVE (Đã kích hoạt):** Sau khi Gia sư chọn mốc CEFR ban đầu $\rightarrow$ Elo Rating Engine & Spaced Repetition (khi làm sai) bắt đầu hoạt động.

---

## 3. Ma trận Ánh xạ Trình độ CEFR $\rightarrow$ Thang điểm Elo (Chess Elo Rating Style)

Mốc Elo khởi tạo bắt đầu từ **500 Elo** (tương đương chuẩn Elo cờ vua cho mức nhập môn A1), tạo dải phân định rộng và tự nhiên cho thuật toán:

| Cấp độ CEFR | Mô tả trình độ | Elo Baseline ($R$) | Điểm `mastery_score` tương ứng (0–100) |
| :--- | :--- | :---: | :---: |
| **A1** | Beginner (Sơ cấp) | **500** | **15.1** (~ 15.0) |
| **A2** | Elementary (Cơ bản) | **800** | **29.7** (~ 30.0) |
| **B1** | Intermediate (Trung cấp) | **1100** | **50.0** (~ 50.0) |
| **B2** | Upper-Intermediate (Trung cao cấp) | **1400** | **70.3** (~ 70.0) |
| **C1** | Advanced (Nâng cao) | **1700** | **84.9** (~ 85.0) |
| **C2** | Proficient (Thành thạo) | **2000** | **93.0** (~ 95.0) |

### 3.1. Công thức Quy đổi Toán học (Elo Rating $\rightarrow$ Mastery Score)

Hệ thống sử dụng **Hàm Logistic (Sigmoid Function)** cơ số 10 để ánh xạ mượt mà từ điểm Elo ($R$) sang thang điểm `mastery_score` ($0 - 100$):

$$\text{Mastery Score}(R) = \text{Round}\left( \frac{100}{1 + 10^{-\frac{R - 1100}{800}}}, 1 \right)$$

*Trong đó:*
- $R$: Điểm Elo hiện tại của micro-skill.
- $1100$: Điểm Elo trung vị chuẩn CEFR B1 (tương ứng 50.0 điểm Mastery).
- $800$: Hệ số dãn dải (Scaling factor) đảm bảo phân bố mượt mà và tiệm cận tự nhiên trong dải $[0, 100]$.

---

## 4. Danh mục Micro-Skills Mẫu (Standard Micro-Skill Catalog)

### 4.1. Ngữ pháp (Grammar Micro-Skills)
- **Tenses & Aspects:** `GRAM_TENSE_PRES` (Hiện tại), `GRAM_TENSE_PAST` (Quá khứ), `GRAM_TENSE_FUT` (Tương lai), `GRAM_TENSE_MIX` (Phối hợp thì).
- **Sentence Transformations:** `GRAM_PASSIVE` (Bị động), `GRAM_REPORTED` (Tường thuật), `GRAM_COND` (Điều kiện), `GRAM_RELATIVE` (Quan hệ), `GRAM_INVERSION` (Đảo ngữ), `GRAM_CLEFT` (Câu chẻ).
- **Syntax & Parts of Speech:** `GRAM_SV_AGREE` (Hòa hợp S-V), `GRAM_MODALS` (Khuyết thiếu), `GRAM_COMPARISON` (So sánh), `GRAM_VERB_FORM` (V-ing/To-V), `GRAM_PREP_CONJ` (Giới từ & Từ nối).

### 4.2. Từ vựng (Vocabulary Micro-Skills)
- **Lexical Mechanics:** `VOCAB_WORD_FORM` (Cấu tạo từ), `VOCAB_COLLOCATION` (Cụm cố định), `VOCAB_PHRASAL_VERB` (Cụm động từ), `VOCAB_IDIOM` (Thành ngữ), `VOCAB_SYN_ANT` (Đồng/Trái nghĩa).
- **Topic-based Lexicon:** `VOCAB_TOPIC_BASIC` (A1-A2), `VOCAB_TOPIC_INTER` (B1-B2), `VOCAB_TOPIC_ACADEMIC` (B2-C1).

### 4.3. Đọc hiểu (Reading Micro-Skills)
- `READ_MAIN_IDEA` (Ý chính / Tiêu đề), `READ_FACT_DETAIL` (Chi tiết / True-False), `READ_CONTEXT_VOCAB` (Từ vựng bối cảnh), `READ_INFERENCE` (Suy luận ý ẩn), `READ_STRUCTURE` (Mạch logic & Chèn câu).

---

## 5. Tính năng Custom Micro-Skill Tags bởi Gia sư (Tutor Custom Tags)

- **Quyền hạn Gia sư:** Gia sư có thể tự do **Thêm mới**, **Chỉnh sửa** hoặc **Tùy biến** các micro-skill tags (VD: Thêm `GRAM_INVERSION_ADVANCED` hoặc `IELTS_READING_HEADINGS`) để phù hợp với bài giảng riêng hoặc giáo trình chuyên biệt.
- **Thiết lập Mốc Elo Khởi tạo (Tutor-Set CEFR Baseline):** 
  - Khi tạo một Custom Tag mới, Gia sư được chủ động chọn **mốc trình độ CEFR khởi điểm (A1–C2)** riêng cho tag đó (Ví dụ: Dù học sinh có trình độ chung là B2, Gia sư vẫn có thể set mốc khởi tạo A2/B1 cho tag `VOCAB_IDIOM_DAILY` nếu học sinh còn yếu phần này).
  - Hệ thống sẽ tự động đề xuất mốc CEFR mặc định bằng với mốc chung của học sinh để Gia sư tiết kiệm thời gian thao tác nếu không có điều chỉnh riêng.
- **Cơ chế Hội tụ Nhanh (Fast Convergence K-Factor):** 
  - Đối với các Custom Tag mới tạo, Elo Rating Engine áp dụng **Hệ số $K$ biến động cao** ($K = 64$ hoặc $K = 128$) trong **5 câu hỏi đầu tiên**.
  - **Tác dụng:** Giúp điểm Elo của Custom Tag nhanh chóng tự điều chỉnh vọt lên hoặc rơi xuống đúng mốc năng lực thực tế của học sinh chỉ sau 2–3 câu trả lời, khắc phục hoàn toàn rủi ro lệch mốc Elo ban đầu.

---

## 6. Thiết kế Giao diện Khởi tạo cho Gia sư (Single-Select CEFR Wizard)

1. **Khởi tạo 1-Click (Single CEFR Selection):** Gia sư mở màn hình SKP Học sinh và chỉ cần **chọn 1 mốc trình độ CEFR tổng quan chung** cho học sinh (Ví dụ: `B1`).
2. **Tự động áp dụng Elo Baseline:** Backend tự động áp dụng mốc Elo tương ứng (Ví dụ: `B1` $\rightarrow$ 1100 Elo) cho **tất cả** các micro-skills thuộc 3 mảng Ngữ pháp, Từ vựng và Đọc hiểu. Gia sư không cần chọn riêng lẻ từng kỹ năng.
3. **Smart Question Filtering:** Thuật toán tự động chỉ gợi ý các bài tập có độ khó trong dải phù hợp với mốc CEFR ban đầu ($\pm 1$ level).
