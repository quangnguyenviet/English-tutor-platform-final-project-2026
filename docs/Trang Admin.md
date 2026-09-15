Ở trang YÊU CẦU GHÉP LỚP:

&nbsp;

* Ở phần chờ xử lý:  
  * Giao diện: Ấn Hủy yêu cầu phải có pop up thông báo, nút hủy, nút đồng ý  
  * Luồng: khi ấn match ghép lớp \-\> hiển thị thông báo: bạn chắc chắn xác nhận match học sinh A với gia sư B chứ? VÀ 2 nút Hủy, Đồng ý \-\> Hủy thì quay lại trang match / Đồng ý thì hiển thị pop up:"Hệ thống sẽ gửi đề nghị tới gia sư B" nhảy sang Đã gửi đề nghị thì có thông tin của match lớp, đồng thời thì Ở phần Duyệt thanh toán cũng sẽ có thông tin của offer này ở phần Chờ duyệt thanh toán.

  &nbsp;

* Ở phần Đã gửi đề nghị:&nbsp;  
  * Giao diện: Vẫn có nút Hủy đề nghị ở dưới nút Thay đổi gia sư. Phòng trường hợp phụ huynh hủy phút chót. Và lại có pop up thông báo, nút đồng ý, nút hủy. Nếu ấn hủy thì ở trang Duyệt thanh toán, ở mục chờ duyệt cũng sẽ biến mất offer này.  
  * Luồng: Khi ấn thay đổi gia sư \-\> hiển thị thông báo: bạn chắc chắn xác nhận thay đổi gia sư B thành gia sư C chứ? VÀ 2 nút Hủy, Đồng ý \-\> Hủy thì quay lại trang / Đồng ý thì lại hiện pop up mới: Hệ thống đã gửi thông báo hủy đề nghị tới gia sư B và lời đề nghị tới gia sư C. (Tương tác tới trang gia sư).  
* Ở phần Đã ghép thành công:  
  * Luồng: Khi Gia sư thanh toán ở phần Duyệt thanh toán (Đã duyệt ở mục Duyệt thanh toán). Thì Yêu cầu ghép lớp sẽ tự động chuyển sang mục Đã ghép thành công.  
* Ở phần Đã hủy: Sử dụng xóa data theo thời gian, có thể là 7 ngày 1 lần thì lại xóa data đi  → để đỡ nặng CSDL.  
* Bỏ phần hình thức học đi: mặc định là dạy trực tiếp, còn buổi nào online thì để gia sư tự bàn với phụ huynh, học sinh.

&nbsp;

Ở Trang DUYỆT THANH TOÁN:

* Ở phần chờ duyệt:&nbsp;  
  * Có thêm ví dụ cả việc gia sư chưa nộp minh chứng nữa. Lúc này sẽ có nút hiện là chưa nộp minh chứng&nbsp;  
  * Nếu gia sư nộp rồi: thì chỉ có 1 nút là Minh chứng, Duyệt & Mở khóa, Yêu cầu gửi lại minh chứng (Thay cho nút từ chối). Còn nút Từ chối thì không cần, vì hủy sẽ hủy ở phần Yêu cầu ghép lớp như đã đề cập ở trên.  
    * Nếu ấn vào Minh chứng thì sẽ hiện lên pop up như đã code, thay đổi 1 chút: Nút Từ chối sẽ thay thành nút  Yêu cầu gửi lại minh chứng. Nếu Ấn vào nút này sẽ hiển thị lên pop up gồm: Ô text (để ghi lí do phải nộp lại minh chứng), nút gửi, nút hủy. Nếu gửi sẽ thông báo đến với Gia sư. Còn với nút Duyệt & Mở khóa, khi click vào sẽ hiển thị thông báo: Bạn chắc chắn muốn duyệt minh chứng này chứ? Và 2 nút Đồng ý, Hủy.  
  * Bỏ phần Đã từ chối. Vì nếu Hủy thì nó sẽ Hủy ở trang Yêu cầu ghép lớp rồi.

&nbsp;

Ở trang Quản lý gia sư:

* Ở phần tạo tài khoản: Bỏ phần Thêm gia sư. Tất cả gia sư sẽ đăng ký hồ sơ và gửi về admin, nằm trong mục Chờ duyệt.  
* Ở mục Chờ duyệt: Sẽ có list gia sư, ấn vào từng người sẽ hiển thị lên thông tin chi tiết của họ và 2 nút Duyệt, không Duyệt. Mỗi khi ấn vào 2 nút này sẽ có pop up xác nhận cùng 2 nút Đồng ý, Hủy. Khi mà hồ sơ được duyệt thì thêm trường trạng thái hoạt động: Đang hoạt động vào cho gia sư.  
* Ở mục Đang hoạt động: Hiển thị list gia sư, mỗi gia sư kèm thêm 2 button Con mắt (Xem chi tiết), Cây bút (Sửa thông tin \- khi sửa thì sửa được thông tin trong hồ sơ gia sư và trạng thái hoạt động), bỏ nút xóa gia sư.  
* Ở mục Ngưng hoạt động thì lúc này mới có cả xem, sửa, xóa.  
* Lưu ý, hành động như sửa, xóa đều hiển thị pop up xác nhận và 2 nút Đồng ý, Hủy

&nbsp;

Ở trang Quản lý học sinh:

* Bỏ phần Tất cả trình độ, A1, ..,C2 đi  
* Thêm mục Chờ duyệt, Đã duyệt.  
* Ở mục chờ duyệt:  Khi này, phụ huynh mới nộp đăng ký học, gia sư chưa nộp tiền. Hiển thị list phụ huynh, admin có thể xem (xem thông tin phụ huynh cung cấp). Mục này sẽ được tự động hóa khi admin duyệt thanh toán của gia sư, đồng thời nó cũng bị xóa đi khi admin hủy yêu cầu ghép lớp ở bước trước.  
* Ở mục Đã duyệt, tại đây Admin sẽ thực hiện tạo account cho học sinh thông qua số điện thoại họ cung cấp, mật khẩu set mặc định là 123456789 → Học sinh sẽ tự đổi khi được tạo account.  
* Giữ lại phần tìm kiếm theo gia sư.  
* Các hành động như tạo acc, thay đổi dữ liệu đều cần có pop up xác nhận thay đổi và 2 nút Đồng ý, Hủy.&nbsp;&nbsp;&nbsp;

Ở trang Báo cáo & Phân tích:

* Phân tích thêm về số lượng gia sư, học sinh mới join vào hệ thống, tỉ lệ ghép lớp thành công.

&nbsp;

Thêm phần Thông báo:

* Để nhận thêm thông báo từ gia sư, học sinh

&nbsp;

Phần Nhật ký hoạt động và Cài đặt giữ nguyên  
