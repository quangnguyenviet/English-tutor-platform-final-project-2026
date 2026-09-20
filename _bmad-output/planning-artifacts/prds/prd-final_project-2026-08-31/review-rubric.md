# PRD Quality Review — final_project

## Overall verdict
Bản PRD được xây dựng rất tốt, bám sát các câu chuyện nghiệp vụ thực tế (User Journeys) của 4 vai trò người dùng và tích hợp đầy đủ các ràng buộc, chỉ số của một sản phẩm Production thực tế. Điểm cần hoàn thiện lớn nhất là bổ sung một số yêu cầu chức năng còn thiếu so với Đề cương sơ bộ (quản lý video bài giảng, quản lý phí nhận lớp của gia sư, và hệ thống báo cáo admin) trước khi chuyển tiếp sang thiết kế UX/kiến trúc.

---

## 1. Decision-readiness — adequate
Tài liệu thể hiện rõ các quyết định thiết kế quan trọng như giới hạn Quota để kiểm soát chi phí API, áp dụng White-label AI để bảo vệ hình ảnh chuyên nghiệp cho gia sư. Các câu hỏi mở và giả định được lập chỉ mục rõ ràng.
*   **Trade-offs**: Đã cân bằng tốt giữa chi phí vận hành AI (Socratic quota) và trải nghiệm tự học của học sinh.
*   **Gaps**: Cần làm rõ cơ chế phân tích cảm xúc để tự động kích hoạt cảnh báo Takeover.

### Findings
- **[high]** Xác định ngưỡng Takeover (§ 9.2) — Chưa định nghĩa rõ thế nào là phụ huynh "giận dữ" hay "hỏi dồn" để kích hoạt Takeover tự động. *Fix:* Đưa ra quy tắc cụ thể (ví dụ: phát hiện 3 từ khóa tiêu cực liên tiếp hoặc 2 lần lặp lại câu hỏi về giá cả mà không có câu trả lời khớp FAQ).

---

## 2. Substance over theater — strong
Tài liệu không bị sa vào hình thức. Các nhân vật trong UJ (chị Lan, Minh, Nam, anh Bình) được sử dụng xuyên suốt để giải thích lý do tồn tại của các tính năng. Các chỉ số NFR được lượng hóa cụ thể (SSE < 200ms, AI generation < 5s) thay vì dùng tính từ chung chung.

---

## 3. Strategic coherence — strong
Hệ thống tính năng phục vụ thống nhất cho luận điểm lõi: Tối ưu hóa trước khi nhận lớp (AI Advisor) và nâng cao chất lượng sau khi nhận lớp (Tutor & Socratic Assistant). Các chỉ số đo lường (Success Metrics) đi kèm các chỉ số đối chứng (Counter-metrics) như chi phí API và tỷ lệ sửa câu hỏi của gia sư để đảm bảo kiểm soát rủi ro tài chính và chất lượng AI.

---

## 4. Done-ness clarity — adequate
Mỗi yêu cầu chức năng (FR-1 đến FR-20) đều có phần hệ quả kiểm thử (Consequences) mô tả rõ ràng trạng thái mong muốn của hệ thống và các tham số kỹ thuật.
*   **Gaps**: Độ rõ ràng của "Done" đối với các tính năng quản lý bài giảng video, quản lý phí nhận lớp và báo cáo doanh thu chưa có vì các tính năng này đang bị thiếu trong PRD.

### Findings
- **[high]** Thiếu tính năng bài giảng video & tài liệu (§ 4) — Đề cương sơ bộ yêu cầu gia sư có thể upload video/tài liệu và học sinh có thể xem chúng, nhưng PRD chưa có FR nào cho phần này. *Fix:* Bổ sung FR-21 (Gia sư quản lý bài giảng/tài liệu) và FR-22 (Học sinh học tập qua video/tài liệu).
- **[medium]** Thiếu quản lý phí nhận lớp của gia sư (§ 4) — Chưa có yêu cầu chức năng cho việc gia sư theo dõi phí nhận lớp và admin giám sát trạng thái phí. *Fix:* Bổ sung FR-23 (Quản lý nghĩa vụ phí gia sư).
- **[medium]** Thiếu chức năng báo cáo Admin (§ 4.4) — Đề cương yêu cầu báo cáo doanh thu, tỷ lệ gán lớp và điểm trung bình kỹ năng nhưng PRD chưa có FR định nghĩa. *Fix:* Bổ sung FR-24 (Hệ thống báo cáo quản trị).

---

## 5. Scope honesty — strong
Mục Non-Goals và MVP Scope làm việc hiệu quả, phân định rõ ràng những gì nằm ngoài phạm vi v1 (như video call tích hợp, thanh toán tự động, gamification nâng cao). Các giả định được đánh dấu và tập hợp đầy đủ.

---

## 6. Downstream usability — strong
Glossary được định nghĩa kỹ và sử dụng chính xác các danh từ riêng như `AI Advisor`, `Socratic Assistant`, `Lesson Log`, `Takeover`. Các ID từ UJ-1 đến UJ-4 và FR-1 đến FR-20 liên tục và không bị chồng chéo.

---

## 7. Shape fit — strong
PRD được cấu trúc theo dạng Journey-led rất phù hợp với một sản phẩm đa tác nhân (multi-stakeholder B2B/Consumer) và có độ chi tiết cao của một sản phẩm Production (đầy đủ NFRs, Cost Guardrails, Security và Audit Trail).

---

## Mechanical notes
*   **Assumptions Index roundtrip**: Đã khớp đầy đủ các giả định từ `[ASSUMPTION-1]` đến `[ASSUMPTION-3]` giữa nội dung và bảng chỉ mục.
*   **Glossary drift**: Không phát hiện sự không đồng nhất hay từ đồng nghĩa ngoài Glossary.
