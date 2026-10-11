import { useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import {
  HelpCircle,
  BookOpen,
  GraduationCap,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Phone,
  CheckCircle2,
  X,
  CreditCard,
  RefreshCw,
  Clock,
  Layers,
  FileText,
  UserCheck
} from "lucide-react";

// Danh mục 6 chủ đề Phụ huynh cần biết
const PARENT_TOPICS = [
  {
    id: "p1",
    index: "01",
    icon: BookOpen,
    title: "Quy trình tìm gia sư và học thử miễn phí",
    shortDesc: "Các bước từ điền Smart-Match Form, chuyên viên liên hệ đến buổi học thử 01 kèm 01 miễn phí.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          EnglishPath cam kết mang đến trải nghiệm minh bạch và phù hợp nhất cho từng học sinh thông qua quy trình 4 bước chuẩn hóa:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li><strong>Đăng ký nhu cầu:</strong> Phụ huynh điền biểu mẫu Smart-Match Form (4 bước) nêu rõ trình độ hiện tại, mục tiêu điểm số và khung giờ rảnh của con.</li>
          <li><strong>Tư vấn chọn gia sư:</strong> Trong vòng 12 giờ làm việc, chuyên viên giáo dục sẽ liên hệ đề xuất 1 - 2 hồ sơ gia sư phù hợp nhất về chuyên môn và phong cách giảng dạy.</li>
          <li><strong>Học thử 01 buổi miễn phí:</strong> Con được trải nghiệm học trực tiếp hoặc online cùng gia sư chỉ định để kiểm tra độ hòa hợp về phương pháp sư phạm.</li>
          <li><strong>Chính thức vào học:</strong> Sau buổi học thử, nếu phụ huynh hoàn toàn hài lòng, trung tâm sẽ tiến hành xếp lịch học chính thức và kích hoạt tài khoản học tập.</li>
        </ol>
      </div>
    )
  },
  {
    id: "p2",
    index: "02",
    icon: CreditCard,
    title: "Chính sách học phí minh bạch & linh hoạt",
    shortDesc: "Cơ chế tính phí theo năng lực thực tế, không thu phí môi giới trá hình hay phí ẩn.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          EnglishPath loại bỏ cơ chế biểu phí cố định cứng nhắc. Học phí được xác định linh hoạt dựa trên trình độ chuyên môn của gia sư và mục tiêu của người học:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li><strong>Sinh viên giỏi / Chuyên ngành tiếng Anh:</strong> 150.000đ - 200.000đ / buổi (dành cho mất gốc, củng cố ngữ pháp, rèn nề nếp).</li>
          <li><strong>Cử nhân Sư phạm / IELTS 7.5+:</strong> 220.000đ - 300.000đ / buổi (dành cho luyện thi vào 10, THPT Quốc gia, Foundation IELTS).</li>
          <li><strong>Giảng viên / Chuyên gia IELTS 8.0+:</strong> 350.000đ - 500.000đ / buổi (dành cho luyện thi chứng chỉ nâng cao và chiến thuật phòng thi).</li>
        </ul>
        <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200">
          <strong>Lưu ý:</strong> Học phí được thanh toán theo kỳ 10 buổi hoặc theo tháng. Trung tâm có hợp đồng dịch vụ rõ ràng và bảo lãnh học phí 100%.
        </div>
      </div>
    )
  },
  {
    id: "p3",
    index: "03",
    icon: RefreshCw,
    title: "Quy trình đổi gia sư REMATCH không giới hạn",
    shortDesc: "Chính sách đổi gia sư miễn phí nếu sau buổi học thử hoặc trong quá trình học con không phù hợp.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <p>
          Sự hòa hợp giữa gia sư và học sinh là chìa khóa bứt phá tiến độ. Nếu con không hợp phong cách giảng dạy, phụ huynh có quyền yêu cầu đổi gia sư:
        </p>
        <div className="space-y-2.5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Bước 1: Gửi yêu cầu đổi gia sư</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">Phụ huynh gửi yêu cầu qua cổng trực tuyến hoặc gọi hotline chăm sóc khách hàng 1900 6868.</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Bước 2: Trung tâm phân tích & Điều phối</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">Bộ phận học thuật rà soát lý do chưa hợp và chọn lựa gia sư mới phù hợp hơn trong vòng 24 - 48 giờ.</p>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h5 className="font-bold text-slate-900 dark:text-white text-xs mb-1">Bước 3: Học thử miễn phí cùng gia sư mới</h5>
            <p className="text-xs text-slate-600 dark:text-slate-400">Số buổi học còn lại được chuyển giao trọn vẹn, không phát sinh bất kỳ khoản phí phụ nào.</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "p4",
    index: "04",
    icon: ShieldCheck,
    title: "Chính sách bảo vệ quyền lợi Phụ huynh & Học sinh",
    shortDesc: "Cam kết hồ sơ gia sư xác thực 100%, bảo mật thông tin và hoàn trả học phí nếu có sự cố.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Trung tâm EnglishPath cam kết bảo vệ toàn diện quyền lợi của phụ huynh:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li><strong>Xác thực hồ sơ:</strong> 100% bằng cấp, chứng chỉ IELTS/TOEIC, lý lịch cá nhân và thẻ sinh viên/giảng viên được thẩm định đối chiếu gốc.</li>
          <li><strong>Theo dõi tiến độ định lượng:</strong> Báo cáo tỷ lệ nộp bài tập và biểu đồ tăng trưởng Elo Rating được cập nhật minh bạch sau mỗi buổi học.</li>
          <li><strong>Chính sách hoàn tiền:</strong> Nếu gia sư nghỉ đột xuất không có lý do hoặc trung tâm không thể sắp xếp gia sư thay thế trong 7 ngày, phụ huynh được hoàn lại 100% số tiền buổi học chưa phát sinh.</li>
        </ul>
      </div>
    )
  },
  {
    id: "p5",
    index: "05",
    icon: Sparkles,
    title: "Ứng dụng AI & Spaced Repetition (Lặp lại ngắt quãng)",
    shortDesc: "Cách hệ thống giúp học sinh nhớ từ vựng lâu dài và tự động phát hiện lỗ hổng ngữ pháp.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>
          EnglishPath kết hợp giữa mô hình gia sư 1-kèm-1 và công nghệ học tập thông minh:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li><strong>Thuật toán SM-2 (Spaced Repetition):</strong> Lên lịch ôn tập từ vựng và ngữ pháp vào đúng mốc học sinh sắp quên (1 ngày, 4 ngày, 7 ngày...), giúp củng cố kiến thức vào trí nhớ dài hạn chỉ với 5 phút mỗi ngày.</li>
          <li><strong>Phân tích lỗi sai AI:</strong> Sau mỗi bài làm, AI giải thích chi tiết vì sao đáp án đúng, chỉ ra bẫy câu hỏi thường gặp và lập danh mục các dạng lỗi con hay mắc để gia sư khắc phục trong buổi dạy.</li>
          <li><strong>Điểm số Elo Micro-skills:</strong> Đo lường chính xác từng kỹ năng nhỏ từ 0 đến 100 điểm, không đánh giá chung chung.</li>
        </ul>
      </div>
    )
  },
  {
    id: "p6",
    index: "06",
    icon: CreditCard,
    title: "Tài khoản ngân hàng ký quỹ an toàn Techcombank",
    shortDesc: "Thông tin chuyển khoản học phí chính thức, cảnh báo lừa đảo và hướng dẫn ghi nội dung.",
    badge: "Phụ huynh cần biết",
    content: (
      <div className="space-y-4 text-sm leading-relaxed">
        <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Ngân hàng:</span>
            <strong className="text-slate-900 dark:text-white">Techcombank (Ngân hàng TMCP Kỹ Thương)</strong>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Số tài khoản:</span>
            <strong className="text-blue-600 dark:text-blue-400 font-mono text-base">1903 8888 6868 99</strong>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Chủ tài khoản:</span>
            <strong className="text-slate-900 dark:text-white">CTCP GIAO DUC ENGLISHPATH VIET NAM</strong>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Cú pháp chuyển khoản:</span>
            <strong className="text-slate-900 dark:text-white font-mono bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
              [SĐT Phụ Huynh] - [Ten Hoc Sinh] - HP
            </strong>
          </div>
        </div>
        <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
          Cảnh báo an toàn: Trung tâm EnglishPath KHÔNG yêu cầu phụ huynh chuyển tiền vào bất kỳ tài khoản cá nhân nào của gia sư khi chưa có xác nhận từ văn phòng trung tâm.
        </p>
      </div>
    )
  }
];

// Danh mục 9 chủ đề Gia sư cần biết
const TUTOR_TOPICS = [
  {
    id: "t1",
    index: "01",
    icon: UserCheck,
    title: "Tiêu chuẩn xét tuyển và phỏng vấn gia sư",
    shortDesc: "Yêu cầu bằng cấp, kiểm tra phát âm chuẩn IPA và bài giảng thử sư phạm trước hội đồng.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Để đảm bảo chất lượng giảng dạy, mọi ứng viên gia sư cần vượt qua 3 vòng tuyển chọn:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li><strong>Vòng 1 (Hồ sơ):</strong> Điểm thi THPT tiếng Anh 8.5+, hoặc chứng chỉ IELTS 6.5+, TOEIC 800+ kèm bảng điểm đại học.</li>
          <li><strong>Vòng 2 (Kiểm tra chuyên môn):</strong> Kiểm tra phát âm chuẩn IPA, ngữ pháp học thuật và phản xạ giao tiếp với chuyên gia.</li>
          <li><strong>Vòng 3 (Dạy thử Demo):</strong> Trình bày giáo án 20 phút trước hội đồng sư phạm để đánh giá phong thái và phương pháp truyền đạt.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t2",
    index: "02",
    icon: Layers,
    title: "Quy chế nhận lớp và ký quỹ an toàn",
    shortDesc: "Cách thức đăng ký lớp học mới, quyền lợi bảo lãnh hợp đồng và hoàn cọc khi bàn giao.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Trung tâm áp dụng quy chế nhận lớp công bằng, bảo đảm tối đa quyền lợi cho gia sư:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Gia sư được xem đầy đủ thông tin yêu cầu học sinh, địa chỉ, mức học phí và số buổi trước khi bấm Đăng ký nhận lớp.</li>
          <li>Phí nhận lớp được khấu trừ minh bạch và có hợp đồng bàn giao lớp có giá trị pháp lý.</li>
          <li>Nếu học sinh hủy lịch do phía gia đình trong 30 ngày đầu, trung tâm hỗ trợ hoàn phí nhận lớp 100% hoặc đổi sang lớp tương đương.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t3",
    index: "03",
    icon: Clock,
    title: "Quy định giờ dạy, tác phong và báo nghỉ",
    shortDesc: "Quy chuẩn trang phục, đúng giờ và quy trình báo nghỉ trước ít nhất 12 giờ.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Gia sư phải tuân thủ nghiêm ngặt tác phong chuyên nghiệp:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Vào phòng học trực tuyến hoặc đến nhà học sinh trước 5 - 10 phút.</li>
          <li>Trang phục lịch sự, nhã nhặn; không sử dụng điện thoại làm việc riêng trong giờ dạy.</li>
          <li>Trường hợp ốm đau hoặc sự cố bất khả kháng, phải thông báo cho phụ huynh và quản trị viên trước ít nhất 12 giờ và sắp xếp buổi dạy bù cụ thể.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t4",
    index: "04",
    icon: BookOpen,
    title: "Ứng dụng Hệ thống Soạn bài tập & Giao bài AI",
    shortDesc: "Hướng dẫn sử dụng công cụ Exercise Generator để tạo bài tập 4 dạng chuẩn chỉ trong 30 giây.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Gia sư được cấp tài khoản chuyên môn với bộ công cụ trợ giảng AI:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li><strong>Bộ sinh bài tập tự động:</strong> Chọn chủ đề (ví dụ: Câu điều kiện loại 3, Collocations IELTS), hệ thống tự tạo câu hỏi kèm lời giải thích AI chi tiết.</li>
          <li><strong>Hỗ trợ 4 định dạng chuẩn:</strong> Trắc nghiệm (MCQ), Điền từ (Fill-in), Sửa lỗi sai (Error Correction) và Viết lại câu (Sentence Transformation).</li>
          <li><strong>Tự động chấm và cập nhật Elo:</strong> Tiết kiệm đến 80% thời gian chấm bài và nhập điểm thủ công.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t5",
    index: "05",
    icon: CreditCard,
    title: "Chính sách đối soát và chi trả thù lao giảng dạy",
    shortDesc: "Lịch thanh toán lương cố định ngày 05 và 20 hàng tháng, sao kê minh bạch từng buổi.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Hệ thống tự động tính công dựa trên nhật ký buổi dạy đã điểm danh:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Kỳ thanh toán 1: Ngày 05 hàng tháng (cho các buổi từ ngày 16 đến ngày cuối tháng trước).</li>
          <li>Kỳ thanh toán 2: Ngày 20 hàng tháng (cho các buổi từ ngày 01 đến ngày 15 trong tháng).</li>
          <li>Thù lao được chuyển khoản trực tiếp vào tài khoản ngân hàng của gia sư kèm bảng kê chi tiết từng lớp.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t6",
    index: "06",
    icon: FileText,
    title: "Khung chương trình 2 cấp và học liệu dùng chung",
    shortDesc: "Kho thư viện giáo án, slide bài giảng, đề thi thử quốc tế được trung tâm kiểm duyệt sẵn.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Gia sư không cần tự soạn thảo tài liệu từ đầu mà được quyền sử dụng kho học liệu phong phú:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Thư viện Khung chương trình chuẩn hóa 2 cấp: Cấp độ Khóa học (Level) và Cấp độ Buổi học (Session).</li>
          <li>Hơn 500+ bộ slide bài giảng tương tác Canva/PowerPoint thiết kế chuyên nghiệp.</li>
          <li>Kho đề thi chuẩn hóa Cambridge, IELTS, đề thi vào 10 và THPT Quốc gia có đáp án chi tiết.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t7",
    index: "07",
    icon: ShieldCheck,
    title: "Chính sách thưởng chuyên cần và thăng cấp gia sư",
    shortDesc: "Thưởng định kỳ cho gia sư có học sinh tiến bộ vượt bậc và xét nâng bậc học phí định kỳ 6 tháng.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>EnglishPath ghi nhận xứng đáng mọi đóng góp và nỗ lực của gia sư:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Thưởng nóng khi học sinh đạt mục tiêu thi chứng chỉ hoặc tăng điểm số ngoạn mục trên lớp.</li>
          <li>Định kỳ 6 tháng, gia sư có điểm đánh giá hài lòng cao và duy trì nề nếp tốt được nâng hạng (Standard ➔ Senior ➔ Master Tutor) với mức thù lao tăng từ 20% đến 40%.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t8",
    index: "08",
    icon: RefreshCw,
    title: "Quy trình xử lý sự cố & Khiếu nại từ phụ huynh",
    shortDesc: "Cách phối hợp với Lễ tân và Quản trị viên khi có bất đồng hoặc yêu cầu đổi lịch học.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Khi phát sinh mâu thuẫn hoặc sự cố trong quá trình giảng dạy:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Gia sư giữ thái độ bình tĩnh, lắng nghe và ghi nhận phản hồi của phụ huynh.</li>
          <li>Báo ngay cho bộ phận Hỗ trợ vận hành qua hotline nội bộ hoặc tính năng tạo Ticket khiếu nại.</li>
          <li>Chuyên viên CSKH sẽ chủ động đứng ra làm cầu nối phân xử công tâm, bảo đảm gia sư không bị ép buộc vô lý.</li>
        </ul>
      </div>
    )
  },
  {
    id: "t9",
    index: "09",
    icon: ShieldCheck,
    title: "Bảo mật thông tin và cam kết đạo đức nghề giáo",
    shortDesc: "Không chia sẻ thông tin cá nhân của học sinh ra ngoài và tôn trọng ranh giới gia sư - người học.",
    badge: "Gia sư cần biết",
    content: (
      <div className="space-y-3 text-sm leading-relaxed">
        <p>Cam kết đạo đức là điều kiện tiên quyết đối với mọi thành viên EnglishPath:</p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
          <li>Tuyệt đối bảo mật số điện thoại, địa chỉ nhà và hình ảnh học sinh.</li>
          <li>Không tự ý thu các khoản tiền phát sinh ngoài thỏa thuận đã đăng ký với trung tâm.</li>
          <li>Nghiêm cấm các hành vi tiêu cực, gian lận thi cử hoặc có thái độ khiếm nhã đối với học sinh.</li>
        </ul>
      </div>
    )
  }
];

// Danh mục Câu hỏi thường gặp nhanh (FAQ Accordion)
const QUICK_FAQS = [
  {
    q: "Học thử 01 buổi có thực sự miễn phí hoàn toàn không?",
    a: "Đúng vậy. Buổi học thử 01-kèm-01 đầu tiên hoàn toàn miễn phí. Phụ huynh chỉ quyết định đóng học phí khi đã hài lòng với phong cách của gia sư và con đồng ý tiếp tục học."
  },
  {
    q: "Nếu sau vài buổi con cảm thấy không hợp gia sư thì có được đổi không?",
    a: "Hoàn toàn được. EnglishPath hỗ trợ chính sách REMATCH đổi gia sư miễn phí không giới hạn. Trung tâm sẽ chọn gia sư khác có phong cách phù hợp hơn và chuyển giao số buổi học còn lại."
  },
  {
    q: "Học sinh có thể học cùng lúc 2 hoặc nhiều gia sư không?",
    a: "Hoàn toàn có thể. Ví dụ học sinh có thể học Writing với một gia sư chuyên môn học thuật và học Pronunciation / Speaking với một gia sư khác. Hệ thống LMS có lịch tuần thông minh phân tách màu sắc theo từng gia sư."
  },
  {
    q: "Hệ thống Spaced Repetition (Lặp lại ngắt quãng) hoạt động thế nào?",
    a: "Hệ thống dựa trên thuật toán SM-2 danh tiếng. Hàng ngày, học sinh chỉ cần dành 5 phút để ôn tập lại những câu hỏi ngữ pháp hoặc từ vựng đã đến hạn quên. Thuật toán sẽ giãn cách ngày ôn tiếp theo dựa trên độ ghi nhớ của học sinh."
  },
  {
    q: "Điểm số Elo Micro-skills là gì và có ý nghĩa như thế nào?",
    a: "Điểm Elo Rating (thang điểm 0 - 100) đo lường độ tinh thông thực tế của học sinh trên từng kỹ năng vi mô cụ thể. Sau mỗi câu làm bài đúng hay sai, điểm Elo sẽ tự động điều chỉnh theo độ khó của câu hỏi."
  }
];

export function GuestFAQPage() {
  const { openContactModal } = useOutletContext() || {};
  const [activeTab, setActiveTab] = useState("parent"); // "parent" | "tutor" | "faq"
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  return (
    <div className="flex flex-col gap-0 pb-20">
      {/* ══════════════════════════════════════════════════
          HERO BANNER
      ══════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #0B1220 0%, #111C31 60%, #1A2740 100%)" }}
      >
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white text-xs font-semibold tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Cẩm nang tri thức & Quy chuẩn vận hành EnglishPath
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            Trung Tâm Hỏi Đáp & <span className="text-blue-300">Cẩm Nang Tri Thức</span>
          </h1>
          <p className="text-white/80 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Tra cứu toàn bộ quy chế vận hành, chính sách học phí linh hoạt, quy trình học thử miễn phí và hỗ trợ chuyên môn cho phụ huynh và gia sư.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          TAB NAVIGATION BAR
      ══════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto w-full px-4 -mt-6 z-10">
        <div className="p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg grid grid-cols-3 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("parent")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "parent"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <BookOpen size={16} />
            <span className="hidden sm:inline">Phụ huynh học sinh cần biết</span>
            <span className="sm:hidden">Phụ huynh</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 ml-1">6</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tutor")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "tutor"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <GraduationCap size={16} />
            <span className="hidden sm:inline">Gia sư cần biết</span>
            <span className="sm:hidden">Gia sư</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 ml-1">9</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("faq")}
            className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === "faq"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <HelpCircle size={16} />
            <span className="hidden sm:inline">Hỏi đáp nhanh (FAQ)</span>
            <span className="sm:hidden">FAQ</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/20 ml-1">5</span>
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          MAIN CONTENT AREA
      ══════════════════════════════════════════════════ */}
      <div className="max-w-5xl mx-auto w-full px-4 pt-10">
        {/* TAB 1: PHỤ HUYNH CẦN BIẾT */}
        {activeTab === "parent" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Cẩm nang Dành cho Phụ huynh & Học sinh
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Nhấn vào từng chủ đề bên dưới để xem nội dung chi tiết và quy chế bảo vệ quyền lợi.
                </p>
              </div>
              <button
                type="button"
                onClick={openContactModal}
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <span>Đăng ký học thử ngay</span>
                <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PARENT_TOPICS.map((topic) => {
                const Icon = topic.icon;
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                          {topic.index}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          Xem chi tiết
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {topic.shortDesc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <span>Đọc cẩm nang</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: GIA SƯ CẦN BIẾT */}
        {activeTab === "tutor" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Quy chế Vận hành Dành cho Gia sư EnglishPath
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  9 tiêu chuẩn và hướng dẫn giảng dạy cốt lõi dành cho đội ngũ gia sư trung tâm.
                </p>
              </div>
              <Link
                to="/tutor/register"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span>Đăng ký làm gia sư</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {TUTOR_TOPICS.map((topic) => {
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopic(topic)}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-pointer group shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                          {topic.index}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                          Quy chế
                        </span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                        {topic.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {topic.shortDesc}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-semibold">
                      <span>Xem nội dung</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FAQ ACCORDION */}
        {activeTab === "faq" && (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Câu Hỏi Thường Gặp Nhanh
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Giải đáp nhanh những thắc mắc phổ biến nhất của phụ huynh và học sinh khi mới tìm hiểu.
              </p>
            </div>

            <div className="space-y-3">
              {QUICK_FAQS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-xs flex items-center justify-center shrink-0 font-bold">
                          ?
                        </span>
                        {faq.q}
                      </span>
                      {isOpen ? (
                        <ChevronUp size={18} className="text-blue-600 shrink-0" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400 shrink-0" />
                      )}
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════
          KNOWLEDGE DETAIL MODAL (Popup chi tiết)
      ══════════════════════════════════════════════════ */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-white">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setSelectedTopic(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="space-y-2 pr-8">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                  {selectedTopic.badge}
                </span>
                <span className="text-xs text-slate-400 font-mono font-bold">
                  MỤC {selectedTopic.index}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                {selectedTopic.title}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="py-2 border-y border-slate-100 dark:border-slate-800">
              {selectedTopic.content}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Phone size={14} className="text-blue-600" />
                <span>Hotline giải đáp: <strong>1900 6868</strong></span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setSelectedTopic(null)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Đóng
                </button>

                {selectedTopic.badge.includes("Phụ huynh") ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTopic(null);
                      openContactModal?.();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Đăng ký học thử ngay
                  </button>
                ) : (
                  <Link
                    to="/tutor/register"
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md inline-flex items-center justify-center"
                  >
                    Đăng ký nhận lớp
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestFAQPage;
