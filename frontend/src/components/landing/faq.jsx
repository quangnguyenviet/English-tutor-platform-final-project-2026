import { useState } from "react";
import {
  ChevronDown,
  X,
  GraduationCap,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Copy,
  Check,
  PhoneCall,
  Sparkles,
  DollarSign,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";

// Data: Phụ huynh học sinh cần biết (6 mục)
const parentKnowledge = [
  {
    id: "p1",
    num: "01",
    tag: "100% Miễn phí",
    title: "Tìm gia sư có mất phí không?",
    excerpt: "Tất cả dịch vụ tìm kiếm, tư vấn và ghép gia sư của EnglishPath cho phụ huynh đều hoàn toàn miễn phí 100%.",
    content: {
      lead: "Hoàn toàn không! Tất cả dịch vụ tư vấn, kết nối và tìm kiếm gia sư của EnglishPath dành cho quý phụ huynh đều hoàn toàn miễn phí 100%.",
      bullets: [
        "Trung tâm chỉ thu một khoản phí quản lý dịch vụ tối thiểu từ phía gia sư sau khi nhận được lương như một hình thức hỗ trợ việc làm để duy trì hạ tầng công nghệ và đội ngũ vận hành.",
        "Trong một số trường hợp đặc biệt (như yêu cầu giáo viên người nước ngoài bản ngữ chuyên biệt), nếu có bất kỳ chi phí phát sinh nào thì trung tâm sẽ thông báo rõ ràng, minh bạch ngay trong lúc tư vấn ban đầu.",
      ],
      warning: "Lưu ý quan trọng: Để tránh các trường hợp rủi ro không mong muốn, quý phụ huynh tuyệt đối không nên chuyển khoản học phí trực tiếp trước cho gia sư khi chưa dạy đủ số buổi và chưa có sự xác nhận đối soát từ trung tâm.",
    },
  },
  {
    id: "p2",
    num: "02",
    tag: "Khác biệt vượt trội",
    title: "Gia sư EnglishPath có gì khác biệt?",
    excerpt: "Mô hình thu phí sau khi nhận lương, kiểm duyệt hồ sơ khắt khe và ứng dụng AI Spaced Repetition độc quyền.",
    content: {
      lead: "EnglishPath tự hào là một trong số ít trung tâm gia sư tiếng Anh tiên phong tại Việt Nam áp dụng cơ chế thu phí gia sư sau khi gia sư nhận được lương, mang lại sự tin cậy tuyệt đối cho cả gia sư và phụ huynh.",
      bullets: [
        "Gia sư không chịu bất kỳ rủi ro nào: Giúp trung tâm thu hút đội ngũ gia sư giỏi nhất (IELTS 7.5 - 8.5+, Sư phạm Tiếng Anh, Thủ khoa đại học) với tinh thần cống hiến và trách nhiệm cao nhất.",
        "Nền tảng công nghệ tìm kiếm thông minh: Website EnglishPath giúp phụ huynh dễ dàng tra cứu, lọc gia sư theo khu vực, khối lớp, mục tiêu và xem chi tiết bằng cấp xác thực chỉ trong vài cú nhấp chuột.",
        "Học thử miễn phí 01 buổi: Phụ huynh có thể trao đổi trực tiếp và cho con học thử ngay để đánh giá độ hòa hợp và phong cách giảng dạy thực tế.",
        "Đội ngũ cố vấn tận tâm & am hiểu tâm lý: Thấu hiểu sâu sắc nhu cầu từng học sinh từ mất gốc đến ôn thi chuyên, đề xuất lộ trình tối ưu với mức chi phí tiết kiệm nhất.",
        "Ứng dụng công nghệ AI & Spaced Repetition: Hỗ trợ gia sư cá nhân hóa bài tập, giúp con nhớ lâu từ vựng và tự động đo lường mức độ tiến bộ qua từng buổi học.",
      ],
      note: "Phụ huynh có thể tham khảo nhận xét, đánh giá khách quan của cộng đồng học viên và gia sư tại hệ thống đánh giá minh bạch của EnglishPath.",
    },
  },
  {
    id: "p3",
    num: "03",
    tag: "Quy trình 6 bước",
    title: "Quy trình tìm gia sư tại EnglishPath",
    excerpt: "Quy trình tìm kiếm, phỏng vấn và học thử bài bản, minh bạch, đảm bảo quyền lợi tối đa cho gia đình.",
    content: {
      lead: "Quy trình tìm gia sư tại EnglishPath được chuẩn hóa gồm 6 bước chuyên nghiệp:",
      steps: [
        {
          title: "Bước 1: Truy cập hệ thống",
          desc: "Truy cập website www.englishpath.edu.vn để xem danh sách các hồ sơ gia sư tiếng Anh chất lượng cao đang sẵn sàng nhận lớp.",
        },
        {
          title: "Bước 2: Tìm kiếm & Lọc theo tiêu chí",
          desc: "Sử dụng công cụ lọc đa chiều (khu vực quận/huyện, môn học IELTS/Giao tiếp/THCS/THPT, học phí, giới tính) để tìm gia sư phù hợp nhất.",
        },
        {
          title: "Bước 3: Xem kỹ hồ sơ năng lực",
          desc: "Đọc kỹ thông tin giới thiệu, trường đại học, chứng chỉ ngoại ngữ, kinh nghiệm giảng dạy và mức học phí mong muốn của gia sư.",
        },
        {
          title: "Bước 4: Đăng ký tư vấn & Phỏng vấn kép",
          desc: "Nhấn 'Liên hệ ngay' hoặc gọi Hotline 1900 6868. Trung tâm sẽ phỏng vấn sàng lọc gia sư thêm một lần nữa trước khi kết nối số điện thoại để 2 bên trao đổi trực tiếp.",
        },
        {
          title: "Bước 5: Dạy thử & Kiểm tra giấy tờ gốc",
          desc: "Gia sư tới nhà dạy thử (hoặc mở lớp trực tuyến) luôn mang theo CCCD, thẻ sinh viên/giáo viên, chứng chỉ công chứng để phụ huynh trực tiếp kiểm tra và lưu bản photo.",
        },
        {
          title: "Bước 6: Đánh giá & Chính sách REMATCH",
          desc: "Nếu sau 01 buổi dạy thử cảm thấy gia sư chưa phù hợp phong cách học của con, phụ huynh được quyền đổi gia sư khác hoàn toàn miễn phí mà không mất chi phí nào.",
        },
      ],
    },
  },
  {
    id: "p4",
    num: "04",
    tag: "Xác thực 100%",
    title: "Thông tin gia sư liệu có chính xác?",
    excerpt: "100% hồ sơ được kiểm duyệt đối chiếu văn bằng gốc, phỏng vấn sư phạm và mang giấy tờ công chứng khi đến dạy.",
    content: {
      lead: "Rất nhiều phụ huynh băn khoăn về tính chính xác của hồ sơ gia sư trên Internet (khai man thành tích, trường học). Tại EnglishPath, quý phụ huynh hoàn toàn có thể an tâm tuyệt đối nhờ quy trình thẩm định 3 lớp:",
      bullets: [
        "Kiểm duyệt hồ sơ khắt khe: Tất cả hồ sơ tải lên hệ thống đều được ban học thuật EnglishPath kiểm tra kỹ lưỡng bản scan bằng cấp, chứng chỉ IELTS/TOEIC và đối chiếu dữ liệu trường học.",
        "Phỏng vấn kỹ năng sư phạm: Trước khi bàn giao số điện thoại cho phụ huynh, chuyên viên trung tâm gọi điện/phỏng vấn trực tiếp gia sư về phương pháp giảng dạy và năng lực tiếng Anh.",
        "Kiểm tra thực tế tại buổi đầu: Khi đến nhà dạy học, gia sư bắt buộc mang đầy đủ CCCD, thẻ sinh viên, bằng tốt nghiệp photo công chứng và các chứng chỉ đã khai báo. Gia sư sẽ gửi lại gia đình 01 bản photo để phụ huynh lưu giữ đối chiếu.",
        "Bảo đảm bằng uy tín thương hiệu: EnglishPath lấy uy tín giáo dục làm cốt lõi sống còn. Bất kỳ trường hợp gia sư gian lận thông tin nào đều bị hủy tư cách vĩnh viễn trên toàn hệ thống.",
      ],
    },
  },
  {
    id: "p5",
    num: "05",
    tag: "Chính sách học thử",
    title: "Học sinh được học thử bao nhiêu buổi?",
    excerpt: "Học sinh được học thử 01 buổi miễn phí. Nếu không hài lòng, gia đình không phải trả bất kỳ khoản phí nào.",
    content: {
      lead: "Quy định học thử tại EnglishPath nhằm bảo vệ trải nghiệm tốt nhất cho các con:",
      bullets: [
        "Gia sư sẽ tiến hành dạy thử 01 buổi với học sinh để làm quen, kiểm tra trình độ đầu vào và trao đổi phương pháp học với phụ huynh.",
        "Trường hợp không phù hợp: Nếu sau buổi dạy thử, gia đình cảm thấy phong cách dạy chưa phù hợp với con, phụ huynh có thể yêu cầu đổi gia sư khác và hoàn toàn không phải thanh toán tiền học phí cho buổi học thử đó.",
        "Trường hợp học sinh tiến bộ và tiếp tục học: Nếu gia sư dạy tốt, học sinh hào hứng và gia đình đồng ý học chính thức, quý phụ huynh sẽ thanh toán học phí bao gồm cả buổi học thử đầu tiên này vào kỳ học phí tháng đầu.",
      ],
      note: "Việc ghi nhận buổi học thử khi phụ huynh tiếp tục học giúp gia sư có tâm lý thoải mái, tận tâm hơn và gắn bó lâu dài cùng sự tiến bộ của con.",
    },
  },
  {
    id: "p6",
    num: "06",
    tag: "Ký quỹ an toàn",
    title: "Thu học phí trước từ phụ huynh đối với các lớp Online",
    excerpt: "Trung tâm thu giữ học phí tháng đầu để bảo vệ quyền lợi cả 2 bên. Chuyển khoản qua Techcombank chính thức.",
    content: {
      lead: "Đối với hình thức học Online 1 kèm 1, trong tháng đầu tiên trung tâm EnglishPath sẽ đứng ra thu học phí và giữ ký quỹ bảo đảm nhằm tránh các rủi ro, tranh chấp phát sinh:",
      bullets: [
        "Bảo vệ 2 chiều: Tránh tình trạng gia sư dạy xong không nhận được học phí, đồng thời bảo vệ phụ huynh không bị mất tiền nếu gia sư đột ngột nghỉ ngang không lý do.",
        "Thời điểm thu phí: Diễn ra sau khi con học thử xong buổi đầu. Nếu sau buổi này con không hiểu bài, gia đình không tiếp tục thì hoàn toàn không mất phí. Nếu đồng ý tiếp tục, buổi học thử này tính vào tháng đầu và phụ huynh nộp phí tháng đầu cho trung tâm.",
        "Nếu phụ huynh tự ý chuyển khoản trực tiếp cho gia sư trước, trung tâm sẽ không chịu trách nhiệm đối với các sự cố phát sinh từ phía gia sư.",
      ],
      bankInfo: {
        bankName: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)",
        accountNumber: "5050222666",
        accountHolder: "TRUNG TAM GIA SU ENGLISHPATH",
        syntax: "[Mã lớp / Mã gia sư] + [Số điện thoại Phụ huynh]",
        note: "Chuyển khoản xong phụ huynh vui lòng chụp ảnh biên lai giao dịch gửi cho chuyên viên tư vấn để trung tâm kích hoạt xác nhận lớp học.",
      },
    },
  },
];

// Data: Gia sư cần biết (9 mục)
const tutorKnowledge = [
  {
    id: "t1",
    num: "01",
    tag: "Đăng ký thành viên",
    title: "Làm thế nào để trở thành thành viên Gia Sư EnglishPath?",
    excerpt: "Tạo hồ sơ online trên website, tải ảnh bằng cấp/CCCD rõ ràng, nhận Mã Gia Sư (MGS) trong vòng 24 giờ.",
    content: {
      lead: "Rất đơn giản! Bạn chỉ cần vào mục Đăng Ký Gia Sư trên website EnglishPath hoặc ứng dụng di động để tạo hồ sơ:",
      bullets: [
        "Hồ sơ hợp lệ bao gồm: Thông tin cá nhân đầy đủ, ảnh chân dung rõ mặt, ảnh thẻ sinh viên/giáo viên hoặc bằng tốt nghiệp, chứng chỉ tiếng Anh (IELTS, TOEIC, VSTEP nếu có).",
        "Thời gian xét duyệt: Hồ sơ đạt yêu cầu sẽ được bộ phận học thuật duyệt chậm nhất trong vòng 24 giờ làm việc.",
        "Hình thức nộp hồ sơ: Trung tâm chỉ nhận đăng ký trực tuyến qua website, không nhận qua email hay văn phòng để đảm bảo tính minh bạch và dữ liệu tập trung.",
        "Phỏng vấn nhận lớp: Trung tâm sẽ liên hệ phỏng vấn qua điện thoại/video call khi có lớp học phù hợp với hồ sơ của bạn.",
        "Mã Gia Sư (MGS): Sau khi tạo hồ sơ thành công, hệ thống sẽ cấp Mã Gia Sư duy nhất. Bạn cần ghi nhớ mã này để làm việc, nhận lớp và nhận thanh toán cùng trung tâm.",
      ],
    },
  },
  {
    id: "t2",
    num: "02",
    tag: "Bí quyết nhận lớp",
    title: "Làm thế nào để được nhận lớp giảng dạy?",
    excerpt: "Ưu tiên video bài giảng demo 1-2 phút, cập nhật trạng thái sẵn sàng dạy và tương tác nhận lớp nhanh trên hệ thống.",
    content: {
      lead: "Để tăng cơ hội nhận lớp nhanh nhất tại EnglishPath, bạn hãy chú ý các điểm trọng tâm sau:",
      bullets: [
        "Tải video bài giảng mẫu: EnglishPath ưu tiên tuyệt đối trong việc giao lớp cho những gia sư có video bài giảng mẫu (1-2 phút) giới thiệu phát âm hoặc giải thích 1 chủ đề ngữ pháp/IELTS. Video giúp phụ huynh hiểu rõ phong cách dạy và giọng phát âm của bạn.",
        "Theo dõi danh sách lớp mới: Lớp học được đăng tải liên tục tại mục 'Lớp Cần Gia Sư' trên website và các nhóm cộng đồng Gia sư EnglishPath.",
        "Đăng ký nhận lớp đúng chuyên môn: Khi thấy lớp phù hợp, gia sư bấm 'Nhận lớp' trên hệ thống hoặc gửi mã MGS kèm lý do thuyết phục tại sao bạn phù hợp với học sinh đó.",
        "Duyệt hồ sơ công tâm: Trung tâm chọn lọc những hồ sơ chất lượng nhất gửi phụ huynh học sinh xem xét và đưa ra quyết định chọn gia sư.",
      ],
      note: "Mẹo nhỏ: Hãy kiểm tra kỹ mã gia sư và tự giới thiệu cô đọng, tự tin để bộ phận điều phối lớp ưu tiên kết nối ngay!",
    },
  },
  {
    id: "t3",
    num: "03",
    tag: "Quy chuẩn lớp học",
    title: "Quy trình nhận lớp, dạy học & đóng phí như thế nào?",
    excerpt: "Quy chuẩn 4 bước: Nhận thông tin -> Gọi phụ huynh trong 1h -> Buổi đầu tác phong chuẩn mực -> Báo cáo kết quả.",
    content: {
      lead: "Gia sư nhận lớp tại EnglishPath tuân thủ quy trình làm việc chuyên nghiệp:",
      steps: [
        {
          title: "1. Tiếp nhận số điện thoại phụ huynh",
          desc: "Trung tâm gửi thông báo và số điện thoại của phụ huynh học sinh cho gia sư được chọn.",
        },
        {
          title: "2. Liên hệ phụ huynh ngay trong vòng 1 giờ",
          desc: "Gia sư chủ động gọi điện ngay để trao đổi chi tiết về học lực, địa chỉ và thống nhất lịch hẹn buổi đầu. Báo lại lịch hẹn cho trung tâm.",
        },
        {
          title: "3. Tác phong chuẩn mực buổi đầu dạy thử",
          desc: "Đến đúng giờ (sớm 5-10 phút), ăn mặc lịch sự, mang ĐẦY ĐỦ CCCD, thẻ SV/GV, chứng chỉ photo công chứng (tặng gia đình 1 bộ). Làm bài test nhỏ 15-20 phút đánh giá học sinh.",
        },
        {
          title: "4. Báo cáo kết quả buổi đầu về trung tâm",
          desc: "Sau buổi đầu, gia sư PHẢI chủ động nhắn tin/gọi điện báo cáo tình hình học sinh, thái độ phụ huynh và lịch các buổi tiếp theo để trung tâm quản lý lớp.",
        },
      ],
      warning: "Nếu học sinh nghỉ nhiều hoặc không xếp được lịch dạy trong 1 tuần vì bất kỳ lý do gì, gia sư PHẢI thông báo ngay cho trung tâm để được hỗ trợ xử lý kịp thời.",
    },
  },
  {
    id: "t4",
    num: "04",
    tag: "Lớp học Online",
    title: "Hình thức thu phí đối với các lớp Online",
    excerpt: "Trung tâm đứng ra thu học phí tháng đầu để bảo đảm thù lao cho gia sư. Chi trả đầy đủ khi dạy đủ số buổi.",
    content: {
      lead: "Đối với các lớp học tiếng Anh Online 1 kèm 1, nhằm loại bỏ rủi ro quỵt lương cho gia sư:",
      bullets: [
        "Tháng đầu tiên, trung tâm EnglishPath sẽ đứng ra thu học phí từ phụ huynh. Gia sư không tự ý nhận lương trực tiếp từ phụ huynh trong tháng này.",
        "Trách nhiệm báo cáo: Sau khi hoàn thành buổi học thử đầu tiên, gia sư có TRÁCH NHIỆM thông báo ngay cho trung tâm để trung tâm liên hệ thu học phí 1 tháng của phụ huynh.",
        "Lưu ý rủi ro: Nếu sau buổi đầu gia sư không báo lại cho trung tâm dẫn đến rủi ro không thu được phí, gia sư phải tự chịu trách nhiệm.",
        "Chính sách học thử: Buổi đầu hoàn toàn miễn phí cho học sinh nếu học sinh không học tiếp. Nếu học sinh đồng ý học tiếp, buổi này vẫn được tính đầy đủ vào thù lao của gia sư.",
        "Nhận thù lao: Khi gia sư dạy đủ số buổi của 1 tháng (Số buổi/tuần x 4 tuần), gia sư liên hệ trung tâm để nhận chuyển khoản thù lao đầy đủ, nhanh gọn.",
      ],
    },
  },
  {
    id: "t5",
    num: "05",
    tag: "Thanh toán phí",
    title: "Hình thức nộp phí nhận lớp",
    excerpt: "Chuyển khoản ngân hàng Techcombank chính thức hoặc ví điện tử, ghi rõ Mã Gia Sư và Mã Lớp.",
    content: {
      lead: "Gia sư nộp phí nhận lớp thông qua tài khoản chính thức duy nhất của EnglishPath:",
      bankInfo: {
        bankName: "Ngân hàng TMCP Kỹ Thương Việt Nam (Techcombank)",
        accountNumber: "5050222666",
        accountHolder: "TRUNG TAM GIA SU ENGLISHPATH",
        syntax: "[Mã Gia Sư] + [Mã Lớp] (Ví dụ: MGS 12345 LOP 678)",
        note: "Chuyển khoản xong, bạn chụp ảnh biên lai giao dịch gửi cho chuyên viên điều phối của trung tâm để xác nhận hoàn tất.",
      },
      bullets: [
        "Ngoài ra, trung tâm hỗ trợ nộp phí linh hoạt qua Ví MoMo, ZaloPay và cổng thanh toán đối soát tự động của hệ thống.",
        "Mọi khoản nộp phí đều có biên nhận điện tử minh bạch được lưu trữ trực tiếp trong tài khoản gia sư.",
      ],
    },
  },
  {
    id: "t6",
    num: "06",
    tag: "Bảng phí minh bạch",
    title: "Bảng phí nhận lớp áp dụng tại EnglishPath",
    excerpt: "Chỉ thu phí tháng đầu tiên một lần duy nhất. Từ tháng thứ 2 trở đi, gia sư nhận trọn vẹn 100% học phí.",
    content: {
      lead: "Chính sách phí nhận lớp tại EnglishPath cam kết công bằng, nhân văn và hỗ trợ tối đa cho gia sư:",
      bullets: [
        "Chỉ thu 1 lần duy nhất: Trung tâm chỉ thu phí % thù lao của tháng đầu tiên. Từ tháng thứ 2 trở đi cho đến khi kết thúc lớp, gia sư hưởng 100% học phí và không phải đóng thêm bất kỳ khoản nào.",
        "Công thức tính lương tháng đầu: Số buổi/tuần x 4 x Học phí/buổi.",
        "Mức phí thông thường: 30% - 40% lương tháng đầu tiên (tùy khu vực và hình thức Tại nhà hay Online).",
        "Lớp ngắn hạn (thời lượng 1 tháng): Mức phí ưu đãi chỉ 20%.",
        "Lớp đặc biệt / Luyện thi chứng chỉ cấp tốc: Mức phí được thỏa thuận linh hoạt và hợp lý giữa trung tâm và gia sư.",
      ],
      note: "EnglishPath luôn đồng hành, trân trọng công sức và đạo đức nghề giáo của các bạn gia sư. Chúng tôi kiên quyết xử lý các trường hợp gian lận hay thiếu trách nhiệm để bảo vệ một cộng đồng giáo dục trong sạch, nhân văn.",
    },
  },
  {
    id: "t7",
    num: "07",
    tag: "Kinh nghiệm nhận lớp",
    title: "Tại sao bạn vẫn chưa được nhận lớp?",
    excerpt: "6 nguyên nhân phổ biến: Hồ sơ sơ sài, thiếu video bài giảng, ít cập nhật trạng thái hoặc học phí đề xuất quá cao.",
    content: {
      lead: "Nhiều gia sư đăng ký đã lâu nhưng vẫn chưa nhận được lớp thường do các nguyên nhân sau:",
      bullets: [
        "Phần tự giới thiệu quá sơ sài: Chưa ghi rõ điểm thi ĐH, điểm IELTS/TOEIC, trường đại học, kinh nghiệm dạy học sinh nào, kết quả ra sao. Viết hồ sơ chi tiết và tâm huyết sẽ giúp phụ huynh tin tưởng ngay từ cái nhìn đầu tiên.",
        "Hồ sơ ít cập nhật: Hãy đăng nhập định kỳ 1 tuần/lần, cập nhật trạng thái 'Sẵn sàng nhận lớp' để hồ sơ luôn hiển thị ở các vị trí ưu tiên đầu tiên của website.",
        "Học phí đề xuất quá cao: Đề xuất mức học phí chưa tương xứng với kinh nghiệm. Với sinh viên mới đi dạy, mức phí 120k-180k/buổi là bước đệm tốt để tích lũy kinh nghiệm và nhận đánh giá tốt trước khi tăng học phí.",
        "Chưa có video bài giảng: Gia sư có video phát âm tự tin và giảng giải 1 chủ đề ngắn có tỷ lệ nhận lớp cao hơn gấp nhiều lần so với hồ sơ chỉ có văn bản.",
        "Chưa chủ động theo dõi lớp mới: Lớp học được cập nhật liên tục mỗi ngày, những bạn chủ động đăng ký nhanh sẽ được ban điều phối lớp ưu tiên giao việc.",
      ],
    },
  },
  {
    id: "t8",
    num: "08",
    tag: "Tài khoản & Hồ sơ",
    title: "Các câu hỏi liên quan đến tài khoản, hồ sơ và mã gia sư",
    excerpt: "Cách xem Mã Gia Sư (MGS), xử lý trùng email/SĐT khi đăng ký và thời gian phê duyệt hồ sơ.",
    content: {
      lead: "Tổng hợp giải đáp các thắc mắc thường gặp về tài khoản gia sư:",
      qaList: [
        {
          q: "Làm thế nào để biết tôi đã đăng ký hồ sơ thành công?",
          a: "Sau khi đăng nhập, nếu hệ thống chuyển bạn đến trang 'Hồ Sơ Gia Sư' với trạng thái 'Chờ duyệt' hoặc 'Đã duyệt' thì bạn đã tạo hồ sơ thành công.",
        },
        {
          q: "Mã gia sư (MGS) của tôi là bao nhiêu?",
          a: "Mã gia sư là dãy ký hiệu hiển thị nổi bật ở đầu trang Hồ sơ cá nhân của bạn (ví dụ: EP-GS12345). Bạn hãy lưu lại mã này để làm việc với trung tâm.",
        },
        {
          q: "Xử lý thế nào khi website báo 'Email đã tồn tại' lúc đăng ký?",
          a: "Trường hợp này bạn đã đăng ký tài khoản trước đó. Hãy nhấn vào liên kết 'Quên mật khẩu' ở màn hình Đăng nhập để khôi phục mật khẩu đăng nhập.",
        },
        {
          q: "Giáo viên làm gia sư tự do điền 'Đơn vị học tập/công tác' là gì?",
          a: "Bạn chọn trường ĐH Sư phạm/Ngoại ngữ đã tốt nghiệp, sau đó trong phần Tự giới thiệu ghi rõ hiện đang là giáo viên dạy kèm tiếng Anh chuyên nghiệp.",
        },
        {
          q: "Tại sao hồ sơ sau 24h vẫn chưa được duyệt?",
          a: "Hồ sơ của bạn có thể thiếu ảnh chụp thẻ SV/CCCD rõ nét, hoặc phần giới thiệu quá sơ sài. Bạn hãy đăng nhập để bổ sung thông tin hoặc liên hệ Hotline hỗ trợ.",
        },
      ],
    },
  },
  {
    id: "t9",
    num: "09",
    tag: "Chính sách CTV",
    title: "Làm thế nào để trở thành cộng tác viên (CTV) của Trung tâm?",
    excerpt: "Cơ hội gia tăng thu nhập hấp dẫn từ việc kết nối phụ huynh và gia sư với hoa hồng lên tới 60% - 80%.",
    content: {
      lead: "Gia nhập mạng lưới Cộng tác viên (CTV) EnglishPath là cơ hội tuyệt vời để nâng cao thu nhập và rèn luyện kỹ năng tư vấn giáo dục:",
      bullets: [
        "Đội ngũ gia sư đông đảo & chất lượng: Giúp bạn hoàn toàn tự tin khi giới thiệu cho người thân, bạn bè phụ huynh học sinh.",
        "Không lo mất nguồn: Bất kỳ khi nào gia đình do bạn giới thiệu có nhu cầu học tiếp, hệ thống đều tự động ghi nhận hoa hồng trọn đời cho bạn.",
        "Hình thức CTV Tự Do (Giới thiệu): Bạn chỉ cần giới thiệu phụ huynh cần tìm gia sư cho trung tâm, trung tâm sẽ tư vấn và vận hành. Bạn nhận 50% phí lớp (hoặc 60% nếu giới thiệu từ 4 lớp trở lên/tháng).",
        "Hình thức CTV Chính Thức (Điều phối): Bạn vừa tìm kiếm học viên, vừa chủ động chọn gia sư phù hợp từ kho dữ liệu EnglishPath để kết nối. Bạn nhận 70% phí lớp (hoặc 80% nếu đạt từ 4 lớp trở lên/tháng).",
        "Thanh toán minh bạch: Hoa hồng CTV được đối soát tự động và chuyển khoản vào ngày cuối cùng của mỗi tháng.",
      ],
      note: "Được tham gia các buổi chia sẻ kinh nghiệm, cấp tài liệu hướng dẫn và sinh hoạt cộng đồng CTV EnglishPath định kỳ hàng tháng.",
    },
  },
];

// Quick standard FAQs
const quickFaqData = [
  {
    q: "Học phí 1 kèm 1 tại EnglishPath tính như thế nào?",
    a: "Học phí được tính theo buổi học thực tế, dao động từ 150.000đ - 350.000đ/buổi tùy theo cấp độ (mất gốc, luyện thi vào 10, THPT Quốc Gia, IELTS) và trình độ của gia sư (sinh viên xuất sắc, cử nhân Sư phạm hay giảng viên chuyên gia). Phụ huynh chỉ thanh toán theo số buổi thực học.",
  },
  {
    q: "Chính sách học thử và đổi gia sư REMATCH hoạt động ra sao?",
    a: "Học sinh được học thử miễn phí 01 buổi đầu tiên. Nếu sau buổi dạy thử, bé cảm thấy không phù hợp phong cách giảng dạy, phụ huynh có quyền yêu cầu trung tâm đổi gia sư khác (chính sách REMATCH) hoàn toàn miễn phí và không phải trả bất kỳ khoản phí nào cho buổi học thử đó.",
  },
  {
    q: "Công nghệ AI và Spaced Repetition của EnglishPath hỗ trợ học sinh như thế nào?",
    a: "Hệ thống AI tự động phân tích điểm mạnh, điểm yếu từ bài tập về nhà của con, xây dựng thuật toán Spaced Repetition (Lặp lại ngắt quãng) nhắc nhở con ôn tập đúng thời điểm vàng ghi nhớ. Gia sư sử dụng dữ liệu này để cá nhân hóa bài giảng cho từng buổi học.",
  },
  {
    q: "Lịch học có thể sắp xếp linh hoạt theo thời gian biểu của con không?",
    a: "Hoàn toàn linh hoạt! Phụ huynh và học sinh có thể tự do lựa chọn học vào Buổi Sáng, Buổi Chiều hoặc Buổi Tối vào các ngày rảnh trong tuần. Nếu con bận việc đột xuất, phụ huynh chỉ cần báo trước cho gia sư trước 4 tiếng để dời lịch mà không bị tính buổi.",
  },
  {
    q: "Phụ huynh theo dõi sự tiến bộ của con bằng cách nào mà không cần đăng nhập phức tạp?",
    a: "Phụ huynh chỉ cần truy cập tính năng 'Phụ huynh theo dõi' trên website hoặc ứng dụng, nhập số điện thoại đăng ký để xem trực tiếp báo cáo tiến độ định lượng: tỷ lệ làm bài tập, chuỗi ngày chăm chỉ Streak, và điểm tinh thông năng lực (Elo Rating) cùng nhận xét thực tế từ gia sư.",
  },
];

export function FAQ({ onOpenContactModal }) {
  const [activeTab, setActiveTab] = useState("parent"); // "parent" | "tutor" | "quick"
  const [selectedItem, setSelectedItem] = useState(null);
  const [copiedBank, setCopiedBank] = useState(false);
  const [openQuickIdx, setOpenQuickIdx] = useState(0);

  const handleOpenDetail = (item, category) => {
    setSelectedItem({ ...item, category });
  };

  const handleCloseDetail = () => {
    setSelectedItem(null);
    setCopiedBank(false);
  };

  const handleCopyText = (text) => {
    navigator.clipboard?.writeText(text);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  return (
    <section id="faq" className="py-16 lg:py-24 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">

          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight mt-4">
            Thông Tin Cần Biết & Giải Đáp Thắc Mắc
          </h2>
          <p className="mt-3 text-muted-foreground text-sm sm:text-base">
            Mọi quy chuẩn vận hành, chính sách học thử miễn phí, cách nhận lớp và cam kết quyền lợi minh bạch tại EnglishPath.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex p-1.5 rounded-2xl bg-muted border border-border/80 shadow-inner max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab("parent")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "parent"
                ? "bg-card text-foreground shadow-sm border border-border font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Users className="w-4 h-4 text-blue-500" />
              <span>Phụ huynh cần biết</span>

            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tutor")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "tutor"
                ? "bg-card text-foreground shadow-sm border border-border font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <GraduationCap className="w-4 h-4 text-emerald-500" />
              <span>Gia sư cần biết</span>

            </button>

            <button
              type="button"
              onClick={() => setActiveTab("quick")}
              className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl font-medium text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer ${activeTab === "quick"
                ? "bg-card text-foreground shadow-sm border border-border font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <HelpCircle className="w-4 h-4 text-amber-500" />
              <span>Câu hỏi thường gặp (FAQ)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: Phụ huynh học sinh cần biết */}
        {activeTab === "parent" && (
          <div className="space-y-6">
            <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-500 text-white shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Cẩm nang dành cho Phụ huynh & Học sinh</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Giải đáp tất cả quy trình kết nối gia sư, chính sách học thử 01 buổi miễn phí và bảo đảm an toàn.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenContactModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors shrink-0 shadow-sm cursor-pointer"
              >
                Đăng ký học thử ngay
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {parentKnowledge.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item, "Phụ huynh học sinh cần biết")}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border bg-card hover:border-blue-400/60 dark:hover:border-blue-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">
                        #{item.num}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                      {item.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Xem chi tiết nội dung</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: Gia sư cần biết */}
        {activeTab === "tutor" && (
          <div className="space-y-6">
            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/40 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-sm shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-base">Cẩm nang & Quy chế dành cho Gia sư</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Hướng dẫn đăng ký hồ sơ, bí quyết nhận lớp nhanh, quy trình nhận lớp & chính sách cộng tác viên.
                  </p>
                </div>
              </div>
              <Link
                to="/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors shrink-0 shadow-sm"
              >
                Đăng ký làm gia sư
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {tutorKnowledge.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleOpenDetail(item, "Gia sư cần biết")}
                  className="group relative flex flex-col justify-between p-6 rounded-2xl border border-border bg-card hover:border-emerald-400/60 dark:hover:border-emerald-500/50 hover:shadow-lg transition-all duration-200 cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                        {item.tag}
                      </span>
                      <span className="text-xs font-mono font-semibold text-muted-foreground">
                        #{item.num}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug mb-2">
                      {item.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {item.excerpt}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border/50 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    <span>Xem quy định chi tiết</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: Câu hỏi thường gặp (Quick FAQ) */}
        {activeTab === "quick" && (
          <div className="max-w-4xl mx-auto space-y-4">
            {quickFaqData.map((item, idx) => {
              const isOpen = openQuickIdx === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenQuickIdx(isOpen ? null : idx)}
                    className="w-full p-5 text-left flex items-center justify-between gap-4 font-semibold text-foreground text-sm sm:text-base hover:bg-muted/40 transition-colors cursor-pointer"
                  >
                    <span>{item.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180 text-primary" : ""
                        }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3.5">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL POPUP XEM CHI TIẾT */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl bg-card border border-border text-foreground rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between gap-4 bg-muted/30">
              <div className="space-y-1.5 pr-6">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${selectedItem.category.includes("Phụ huynh")
                      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      }`}
                  >
                    {selectedItem.category}
                  </span>
                  <span className="text-xs font-mono font-medium text-muted-foreground">
                    Mục {selectedItem.num}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                  {selectedItem.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleCloseDetail}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm text-muted-foreground leading-relaxed">
              {/* Lead Paragraph */}
              {selectedItem.content?.lead && (
                <p className="text-foreground font-medium text-sm sm:text-base leading-relaxed bg-muted/20 p-3.5 rounded-xl border border-border/50">
                  {selectedItem.content.lead}
                </p>
              )}

              {/* Steps (if available) */}
              {selectedItem.content?.steps && (
                <div className="space-y-3.5 my-2">
                  {selectedItem.content.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl border border-border bg-background/50 flex gap-3.5"
                    >
                      <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-foreground text-sm">{step.title}</h5>
                        <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Bullets List (if available) */}
              {selectedItem.content?.bullets && (
                <ul className="space-y-2.5">
                  {selectedItem.content.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-1" />
                      <span className="text-xs sm:text-sm text-foreground/90">{bullet}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* QA List (if available, e.g. for item 8) */}
              {selectedItem.content?.qaList && (
                <div className="space-y-3 my-2">
                  {selectedItem.content.qaList.map((qa, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl border border-border bg-muted/20 space-y-1.5">
                      <p className="font-semibold text-foreground text-xs sm:text-sm flex items-start gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] shrink-0">HỎI</span>
                        <span>{qa.q}</span>
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground pl-7 leading-relaxed">
                        <strong className="text-foreground/80">Đáp:</strong> {qa.a}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Bank Info Callout Box (if available) */}
              {selectedItem.content?.bankInfo && (
                <div className="p-4 sm:p-5 rounded-2xl border border-primary/30 bg-primary/5 dark:bg-primary/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wide">
                      <DollarSign className="w-4 h-4" />
                      Tài khoản thanh toán chính thức
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyText(selectedItem.content.bankInfo.accountNumber)}
                      className="text-xs inline-flex items-center gap-1 text-primary hover:underline font-medium cursor-pointer"
                    >
                      {copiedBank ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedBank ? "Đã sao chép STK" : "Sao chép STK"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm bg-card p-3.5 rounded-xl border border-border/80">
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Ngân hàng:</span>
                      <strong className="text-foreground">{selectedItem.content.bankInfo.bankName}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Số tài khoản (STK):</span>
                      <strong className="text-foreground font-mono text-base text-primary">
                        {selectedItem.content.bankInfo.accountNumber}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Chủ tài khoản:</span>
                      <strong className="text-foreground">{selectedItem.content.bankInfo.accountHolder}</strong>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-[11px]">Cú pháp chuyển khoản:</span>
                      <strong className="text-foreground font-mono">{selectedItem.content.bankInfo.syntax}</strong>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground italic">
                    {selectedItem.content.bankInfo.note}
                  </p>
                </div>
              )}

              {/* Warning Alert */}
              {selectedItem.content?.warning && (
                <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs sm:text-sm flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                  <span>{selectedItem.content.warning}</span>
                </div>
              )}

              {/* Note Alert */}
              {selectedItem.content?.note && (
                <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-500/10 text-blue-800 dark:text-blue-300 text-xs sm:text-sm flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                  <span>{selectedItem.content.note}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <PhoneCall className="w-4 h-4 text-primary" />
                <span>Hỗ trợ trực tiếp: <strong>1900 6868</strong> (08:00 - 21:00)</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCloseDetail}
                  className="px-4 py-2 rounded-xl border border-border text-xs sm:text-sm font-medium hover:bg-muted transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                {selectedItem.category.includes("Phụ huynh") ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleCloseDetail();
                      if (onOpenContactModal) onOpenContactModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-colors shadow-sm cursor-pointer"
                  >
                    Đăng ký học thử ngay
                  </button>
                ) : (
                  <Link
                    to="/register"
                    onClick={handleCloseDetail}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs sm:text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    Đăng ký làm gia sư
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default FAQ;
