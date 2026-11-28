# MỞ ĐẦU

## 1. Lý do chọn đề tài

Tiếng Anh ngày càng được xem là kỹ năng nền tảng trong học tập và công việc, kéo theo nhu cầu học kèm theo hình thức một thầy một trò ngày càng phổ biến. Phụ huynh tìm đến gia sư 1-1 vì muốn con được kèm sát theo đúng trình độ và điểm yếu của mình, điều mà các lớp học đông người khó đáp ứng. Để kết nối phụ huynh với gia sư phù hợp, nhiều trung tâm gia sư quy mô nhỏ và vừa đã ra đời, đóng vai trò trung gian tư vấn, ghép lớp và đảm bảo quyền lợi cho cả hai bên.

Qua khảo sát quy trình vận hành của một trung tâm gia sư đang hoạt động, nhóm nhận thấy phần lớn công việc vẫn được thực hiện thủ công. Phụ huynh liên hệ qua điện thoại, Zalo hoặc Facebook; lễ tân ghi nhận nhu cầu rồi gọi điện lại để chốt thông tin. Lớp cần gia sư được đăng lên các nhóm mạng xã hội, gia sư ứng tuyển bằng cách bình luận hoặc nhắn tin riêng, sau đó nhân viên tự sàng lọc và gửi danh sách cho phụ huynh lựa chọn. Phí nhận lớp được thu bằng ảnh chuyển khoản, khiếu nại và yêu cầu đổi gia sư được xử lý qua tin nhắn. Cách làm này dẫn đến bốn nhóm vấn đề chính:

- **Dữ liệu phân tán:** yêu cầu của phụ huynh và hồ sơ gia sư nằm rải rác trên nhiều kênh, khó đối chiếu và dễ bị sót.
- **Ghép lớp thủ công:** việc tìm gia sư phù hợp phụ thuộc vào trí nhớ và thao tác của nhân viên; phụ huynh và gia sư phải liên hệ qua lại nhiều lần mới chốt được lớp.
- **Khó kiểm soát chất lượng và tài chính:** năng lực thực tế của gia sư khó đánh giá qua giấy tờ; việc thu phí, đối soát và hoàn tiền không có quy trình duyệt rõ ràng và không để lại dấu vết để kiểm tra lại.
- **Mất kết nối sau khi chốt lớp:** trung tâm không nắm được tiến độ học tập thực tế. Gia sư không có công cụ tập trung để soạn bài tập và theo dõi từng học sinh; phụ huynh chỉ biết con học thế nào qua lời kể của gia sư.

Các nền tảng hiện có trên thị trường thường chỉ giải quyết được một phía của bài toán. Các website gia sư trong nước chủ yếu đóng vai trò đăng tin và kết nối, ít hỗ trợ việc giảng dạy sau khi ghép lớp. Ngược lại, các ứng dụng học tiếng Anh cá nhân hóa tập trung vào người học tự học, không gắn với quy trình vận hành của một trung tâm gia sư và không tận dụng được vai trò của người thầy.

Trong khi đó, sự phát triển của các mô hình ngôn ngữ lớn (LLM) mở ra khả năng hỗ trợ gia sư soạn bài tập nhanh và bám sát trình độ của từng học sinh. Kết hợp với các phương pháp đo lường năng lực người học như hệ thống xếp hạng Elo và khung tham chiếu trình độ CEFR, hệ thống có thể theo dõi điểm mạnh, điểm yếu của học sinh qua từng câu trả lời và đưa các câu làm sai vào danh sách ôn tập.

Xuất phát từ những lý do trên, nhóm lựa chọn đề tài **"Nền tảng hỗ trợ vận hành và giảng dạy cá nhân hóa cho mô hình gia sư tiếng Anh 1-1 ứng dụng LLM và Spaced Repetition"**. Đề tài hướng tới một nền tảng Web duy nhất vừa số hóa quy trình vận hành của trung tâm, vừa hỗ trợ gia sư giảng dạy cá nhân hóa sau khi lớp học bắt đầu.

## 2. Mục tiêu và đối tượng của đề tài

### 2.1. Mục tiêu

Đề tài đặt ra các mục tiêu sau:

- **Số hóa quy trình vận hành** từ khi phụ huynh có nhu cầu đến khi lớp học diễn ra: tiếp nhận yêu cầu, duyệt hồ sơ gia sư, ghép lớp, dạy thử, chốt lịch học, thu phí nhận lớp và xử lý khiếu nại, có ghi nhận lịch sử thao tác (audit log).
- **Tách bạch nghiệp vụ tài chính** cho kế toán: đối chiếu số tiền thực nhận trước khi xác nhận phí, chi hoàn tiền có biên lai, thống kê doanh thu và xuất báo cáo. Người thu tiền và người xác nhận tiền luôn là hai người khác nhau.
- **Hỗ trợ gia sư soạn bài tập cá nhân hóa bằng AI:** gia sư trao đổi với trợ lý AI ngay trong hệ thống, hoặc dùng công cụ AI bên ngoài rồi nhập kết quả về. Câu hỏi được sinh dựa trên hồ sơ kỹ năng của học sinh và gắn cấp độ CEFR.
- **Theo dõi năng lực học sinh:** học sinh nhận phản hồi đúng sai và lời giải thích ngay sau mỗi câu; điểm Elo được cập nhật theo từng câu trả lời; câu làm sai được đưa vào danh sách ôn tập.
- **Kết nối phụ huynh với quá trình học của con:** phụ huynh trao đổi với gia sư qua kênh nhắn tin của nền tảng và xem nhật ký dạy học sau mỗi buổi.

### 2.2. Đối tượng

- **Đối tượng sử dụng:** phụ huynh, học sinh, gia sư, lễ tân, kế toán và quản trị viên của một trung tâm gia sư tiếng Anh 1-1.
- **Đối tượng nghiên cứu:** quy trình nghiệp vụ của trung tâm gia sư; phương pháp đo lường năng lực người học bằng Elo theo thang CEFR; kỹ thuật sử dụng LLM để sinh câu hỏi trắc nghiệm có cấu trúc; kiến trúc Modular Monolith và phương án đảm bảo nhất quán dữ liệu giữa các kho lưu trữ.

## 3. Phạm vi

**Trong phạm vi đề tài:**

- Nền tảng Web phục vụ một trung tâm gia sư (single-tenant), gồm các cổng: công khai, phụ huynh, gia sư, học sinh, lễ tân, kế toán và quản trị viên.
- Toàn bộ luồng ghép lớp, dạy thử, chốt lịch, thu phí nhận lớp bằng ảnh chuyển khoản hoặc tiền mặt tại quầy, khiếu nại và hoàn tiền.
- Nhắn tin giữa phụ huynh và gia sư, đề xuất lớp học ngay trong cuộc trò chuyện.
- Bài tập dạng trắc nghiệm A/B/C/D, điểm Elo, danh sách ôn tập từ câu sai, nhật ký dạy học.
- Thống kê tài chính và xuất báo cáo Excel.

**Ngoài phạm vi đề tài:**

- Thanh toán trực tuyến tự động và đối soát tự động với ngân hàng.
- Kế toán tổng hợp (sổ sách, thuế, lương gia sư, hóa đơn).
- Lập lịch ôn tập tự động theo thuật toán như SM-2; đề tài dừng ở việc ôn tập dựa trên câu sai và thời gian chưa ôn theo từng kỹ năng.
- Dạy học trực tuyến tích hợp (các buổi học online dùng công cụ bên ngoài như Zoom, Google Meet).
- Các dạng bài tập ngoài trắc nghiệm, ứng dụng di động riêng.

## 4. Bố cục đồ án

Ngoài phần Mở đầu, Kết luận, Tài liệu tham khảo và Phụ lục, đồ án gồm 4 chương:

- **Chương 1. Tổng quan và cơ sở lý thuyết:** khảo sát thực trạng vận hành trung tâm gia sư và các nền tảng hiện có; trình bày cơ sở lý thuyết về học tập cá nhân hóa, mô hình ngôn ngữ lớn, kiến trúc phần mềm và nhất quán dữ liệu; từ đó đề xuất giải pháp và lựa chọn công nghệ.
- **Chương 2. Phân tích và thiết kế hệ thống:** xác định yêu cầu và tác nhân; xây dựng biểu đồ use case, đặc tả các use case tiêu biểu, biểu đồ hoạt động, máy trạng thái, biểu đồ lớp, biểu đồ tuần tự và thiết kế cơ sở dữ liệu.
- **Chương 3. Kiến trúc và giải pháp kỹ thuật:** trình bày kiến trúc tổng thể, các quyết định kiến trúc (ADR), phương án đồng bộ dữ liệu, kiểm soát đồng thời, mô-đun sinh quiz bằng AI, cơ chế Elo và các giải pháp bảo mật.
- **Chương 4. Cài đặt, kiểm thử và đánh giá:** mô tả môi trường triển khai và kết quả cài đặt; trình bày kết quả kiểm thử, đánh giá mô-đun AI và cơ chế Elo, quá trình cải tiến sản phẩm và cách nhóm tổ chức, phối hợp thực hiện dự án.
