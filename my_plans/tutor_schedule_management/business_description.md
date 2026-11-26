# Mô tả nghiệp vụ: Xem lịch dạy tổng quát của gia sư

> **Trạng thái tài liệu:** Bản nháp mô tả nghiệp vụ để thống nhất phạm vi và quy tắc trước khi lập kế hoạch thiết kế/triển khai.
>
> **Phạm vi tài liệu:** Chỉ mô tả nghiệp vụ cho màn hình **Lịch dạy** tại route `/tutor/schedule`. Tài liệu này chưa quyết định tên endpoint, cấu trúc response, migration, thiết kế UI chi tiết hoặc cách triển khai frontend/backend.

## 1. Bối cảnh & mục tiêu

Gia sư cần một màn hình tập trung để xem toàn bộ các ca dạy của mình trong một tuần, thay vì phải mở từng lớp riêng lẻ. Màn hình nằm tại `/tutor/schedule` và giao diện tham chiếu theo trang lịch của từng lớp tại `/tutor/classes/:classId/schedule`.

Hiện tại màn hình lịch tổng quát đang sử dụng dữ liệu mock ở phía frontend. Mục tiêu của nghiệp vụ mới là lấy dữ liệu thật từ backend, tổng hợp lịch của tất cả lớp mà gia sư được phép xem, đồng thời giữ cách hiển thị thống nhất với lịch trong từng lớp.

**Mục tiêu chính:**

- Cho gia sư xem nhanh các ca dạy trong tuần đang chọn.
- Hiển thị chính xác cả lịch cố định, ca dạy thử và các ngoại lệ đã phát sinh.
- Phân biệt rõ trạng thái của từng ca: sắp dạy, đang diễn ra, đã có nhật ký, chờ nhật ký, đã dời lịch hoặc đã hủy.
- Cho phép đi từ một ca trong lịch tổng quát đến trang lịch chi tiết của đúng lớp và đúng lần diễn.
- Không để lỗi tải lịch của một lớp làm mất toàn bộ lịch của các lớp còn lại.
- Loại bỏ sự phụ thuộc vào dữ liệu mock khi màn hình kết nối backend.

## 2. Đối tượng và phạm vi truy cập

### 2.1. Đối tượng sử dụng

- **Gia sư đã đăng nhập:** được xem lịch tổng quát của chính mình.
- Gia sư không được xem lịch của gia sư khác bằng cách thay đổi tham số trên URL hoặc request.

### 2.2. Phạm vi dữ liệu

Lịch tổng quát bao gồm các lớp thuộc gia sư hiện tại và không bao gồm các lớp đã hủy, trừ khi nghiệp vụ sau này quy định cần hiển thị lịch sử riêng.

Một ca dạy trong lịch có thể phát sinh từ:

- Lịch dạy cố định của lớp đang hoạt động.
- Ca dạy thử của lớp.
- Ngoại lệ của một lần diễn, chẳng hạn dời lịch hoặc hủy lịch.
- Thông tin nhật ký dạy học của lần diễn, dùng để xác định ca đã có nhật ký hay chưa.

## 3. Khái niệm nghiệp vụ

### 3.1. Tuần được chọn

Tuần được chọn là khoảng thời gian liên tục 7 ngày, bắt đầu từ ngày đầu tuần theo quy ước hiện hành của hệ thống. Màn hình chỉ hiển thị các lần diễn có ngày thực tế nằm trong 7 ngày đó.

Gia sư có thể:

- Chuyển sang tuần trước.
- Chuyển sang tuần sau.
- Quay về tuần hiện tại khi đang xem một tuần khác.

Ngày bắt đầu tuần phải được truyền nhất quán trong quá trình lấy dữ liệu và khi mở trang chi tiết lớp.

### 3.2. Lần diễn (occurrence)

Lần diễn là một ca dạy cụ thể của một lớp tại một ngày và khung giờ xác định. Đây là đơn vị được hiển thị trên lịch tổng quát.

Mỗi lần diễn tối thiểu cần gắn được với:

- Lớp học.
- Học viên.
- Ngày dạy thực tế.
- Giờ bắt đầu và giờ kết thúc.
- Hình thức dạy, nếu lớp đã có thông tin này.
- Nguồn của lần diễn: lịch cố định, ca thử hoặc ngoại lệ.
- Trạng thái hiển thị của lần diễn.

### 3.3. Ngày và giờ thực tế khi dời lịch

Nếu một lần diễn được dời lịch, ngày và giờ dùng để hiển thị trên lịch tổng quát là ngày và giờ mới. Hệ thống vẫn giữ ngày gốc để gia sư nhận biết ca đã được dời từ thời điểm nào.

Ca bị dời không được hiển thị đồng thời như một ca sắp dạy ở ngày cũ và một ca sắp dạy ở ngày mới. Lần diễn đó chỉ xuất hiện tại thời gian thực tế mới, kèm nhãn cho biết đã dời lịch.

## 4. Trạng thái hiển thị của ca dạy

Trạng thái hiển thị được suy ra từ ngoại lệ, nhật ký, ngày giờ hiện tại và thời gian của lần diễn. Đây là trạng thái phục vụ việc đọc lịch, không nhất thiết là một trạng thái được lưu độc lập trên dữ liệu lịch.

| Trạng thái | Ý nghĩa nghiệp vụ | Điều kiện tổng quát |
|---|---|---|
| **Sắp dạy** | Ca chưa bắt đầu | Lần diễn ở tương lai, hoặc hôm nay nhưng chưa đến giờ bắt đầu |
| **Đang diễn ra** | Ca đang trong khung giờ dạy hiện tại | Hôm nay, thời điểm hiện tại nằm từ giờ bắt đầu đến giờ kết thúc |
| **Đã có nhật ký** | Gia sư đã ghi nhật ký cho lần diễn | Lần diễn có nhật ký chứa nội dung |
| **Chờ nhật ký** | Ca đã kết thúc nhưng chưa có nhật ký | Lần diễn đã qua và chưa có nhật ký |
| **Đã dời lịch** | Ca có ngoại lệ dời sang ngày/giờ khác | Ngoại lệ của lần diễn là `RESCHEDULED` |
| **Đã hủy** | Ca bị hủy | Ngoại lệ của lần diễn là `CANCELLED` |

Nếu một lần diễn vừa có ngoại lệ vừa có nhật ký, ngoại lệ được ưu tiên khi hiển thị. Ví dụ: ca đã hủy phải hiển thị **Đã hủy**, không hiển thị **Đã có nhật ký**.

## 5. Luồng nghiệp vụ chính

### 5.1. Mở màn hình lịch tổng quát

1. Gia sư truy cập `/tutor/schedule`.
2. Hệ thống xác định danh tính gia sư đang đăng nhập.
3. Hệ thống lấy danh sách các lớp thuộc gia sư và loại các lớp không còn thuộc phạm vi hiển thị, tối thiểu là lớp đã hủy.
4. Với mỗi lớp trong phạm vi, hệ thống lấy các lần diễn trong tuần được chọn.
5. Hệ thống tổng hợp các lần diễn thành một danh sách chung, sắp xếp theo ngày và giờ thực tế.
6. Màn hình hiển thị lịch theo từng ngày trong tuần và danh sách chi tiết các ca dạy.

### 5.2. Chuyển tuần

1. Gia sư chọn tuần trước, tuần sau hoặc **Tuần này**.
2. Hệ thống cập nhật tuần được chọn.
3. Hệ thống tải lại dữ liệu của đúng 7 ngày thuộc tuần mới.
4. Các lần diễn của tuần cũ không được giữ lại trong kết quả của tuần mới.
5. Nếu gia sư mở chi tiết một ca, tuần đang chọn được truyền sang trang lịch của lớp để giữ đúng ngữ cảnh.

### 5.3. Xem chi tiết một ca

1. Gia sư chọn một ca trên lịch theo ngày hoặc trong danh sách chi tiết.
2. Hệ thống mở trang `/tutor/classes/:classId/schedule`.
3. Trang chi tiết nhận tuần đang xem và định danh lần diễn nếu có.
4. Trang chi tiết tập trung hiển thị lịch, ngoại lệ và nhật ký của riêng lớp đó.

### 5.4. Tải lại sau lỗi

Nếu không thể tải dữ liệu, màn hình phải thông báo rõ nguyên nhân ở mức người dùng có thể hiểu và cung cấp thao tác thử lại.

Nếu chỉ một hoặc một số lớp không tải được:

- Các lớp tải thành công vẫn được hiển thị.
- Màn hình hiển thị cảnh báo rằng lịch của một số lớp chưa tải được.
- Gia sư có thể thử tải lại toàn bộ màn hình.

Nếu không lấy được danh sách lớp hoặc lỗi ảnh hưởng đến toàn bộ dữ liệu:

- Màn hình hiển thị trạng thái lỗi toàn cục.
- Không hiển thị dữ liệu mock thay thế cho dữ liệu thật.
- Gia sư có thể thử lại.

## 6. Quy tắc nghiệp vụ cần giữ nhất quán

1. Chỉ gia sư đang đăng nhập được xem lịch tổng quát của họ.
2. Lịch tổng quát là phép tổng hợp từ các lớp thuộc gia sư, không phải một lịch độc lập được nhập riêng.
3. Một lần diễn phải được hiển thị ở ngày và giờ thực tế; ca dời lịch dùng mốc mới.
4. Không hiển thị trùng một lần diễn do vừa lấy từ lịch gốc vừa lấy từ ngoại lệ.
5. Ca hủy vẫn có thể xuất hiện trong tuần để gia sư biết lịch đã bị hủy, nhưng phải được phân biệt rõ với ca sắp dạy.
6. Ca đã qua mà chưa có nhật ký phải được nhận diện là **Chờ nhật ký**.
7. Ca có nhật ký phải được nhận diện là **Đã có nhật ký**, không phụ thuộc việc nhật ký được tạo từ màn hình tổng quát hay màn hình chi tiết.
8. Thứ tự sắp xếp ưu tiên ngày thực tế, sau đó đến giờ bắt đầu; không sắp xếp theo tên lớp.
9. Dữ liệu hiển thị trên màn hình phải lấy từ backend sau khi kết nối; không âm thầm quay lại mock data khi request lỗi.
10. Lỗi một lớp không được làm mất dữ liệu của các lớp khác đã tải thành công.
11. Mọi thông tin tên lớp, tên học viên, hình thức dạy và trạng thái phải dùng dữ liệu thật của lớp/lần diễn.
12. Khi mở chi tiết, phải giữ đúng `classId` và ngữ cảnh tuần để gia sư không bị đưa đến lớp hoặc tuần khác.

## 7. Thông tin tối thiểu cần hiển thị

### 7.1. Trên ô lịch theo ngày

- Tên lớp.
- Tên học viên.
- Khung giờ bắt đầu–kết thúc.
- Trạng thái ca dạy.
- Dấu hiệu nhận biết ca dạy thử nếu có.

### 7.2. Trong danh sách chi tiết của tuần

- Tên lớp.
- Tên học viên.
- Ngày và giờ dạy.
- Hình thức dạy: trực tuyến hoặc tại nhà, nếu có.
- Trạng thái ca.
- Ngày gốc khi ca đã được dời.
- Liên kết xem chi tiết lớp/lần diễn.

## 8. Tình huống biên cần được thống nhất

1. **Gia sư không có lớp trong tuần:** hiển thị trạng thái rỗng, giải thích rằng tuần được chọn chưa có ca dạy.
2. **Gia sư có lớp nhưng không có lần diễn:** vẫn hiển thị khung các ngày trong tuần và trạng thái rỗng phù hợp.
3. **Một lớp có nhiều ca trong cùng ngày:** hiển thị đủ các ca và sắp xếp theo giờ bắt đầu.
4. **Hai lớp có ca trùng giờ:** vẫn hiển thị cả hai; đây là thông tin cần phản ánh để gia sư nhận biết, không tự ý loại bỏ ca nào.
5. **Ca dời sang ngoài tuần đang xem:** ca chỉ xuất hiện ở tuần chứa ngày mới; không tạo bản sao ở tuần chứa ngày gốc.
6. **Ca hủy trong tuần:** hiển thị ca với trạng thái **Đã hủy** để giữ thông tin lịch sử của tuần.
7. **Lớp bị hủy sau khi gia sư đã mở màn hình:** lần tải dữ liệu mới phải loại lớp theo quy tắc phạm vi; không giữ dữ liệu cũ như dữ liệu hiện hành.
8. **Không tải được một lớp:** giữ các ca của những lớp tải thành công và hiển thị cảnh báo một phần.
9. **Token hết hạn hoặc không có quyền:** không hiển thị dữ liệu lịch; xử lý theo luồng xác thực chung của hệ thống.
10. **Một lần diễn thiếu dữ liệu nhận diện:** không được tạo liên kết chi tiết sai lớp; cần bỏ qua bản ghi không hợp lệ hoặc báo lỗi dữ liệu theo quy ước backend/frontend.

## 9. Ngoài phạm vi của mô tả này

Các nội dung sau chưa thuộc phạm vi màn hình lịch tổng quát trong giai đoạn này:

- Tạo, sửa hoặc xóa lịch cố định của lớp.
- Tạo hoặc xóa ngoại lệ dời/hủy lịch.
- Ghi, sửa hoặc xóa nhật ký dạy học trực tiếp từ màn hình tổng quát.
- Phân công ca dạy cho gia sư khác.
- Lọc lịch theo học viên, hình thức dạy, trạng thái hoặc tên lớp ngoài việc chọn tuần.
- Xuất lịch ra tệp, đồng bộ Google Calendar hoặc gửi nhắc lịch.
- Thông báo push/email về ca sắp dạy.
- Thay đổi nghiệp vụ của trang lịch chi tiết tại `/tutor/classes/:classId/schedule`.

## 10. Kết quả mong đợi

Sau khi hoàn thành kết nối backend, gia sư có thể mở `/tutor/schedule` và nhận được lịch dạy thật của tất cả lớp thuộc mình trong tuần đang chọn. Dữ liệu phải phản ánh đúng lần diễn thực tế, trạng thái nhật ký và ngoại lệ lịch; thao tác chuyển tuần, xem chi tiết và thử lại khi lỗi phải hoạt động nhất quán với trang lịch chi tiết của từng lớp.
