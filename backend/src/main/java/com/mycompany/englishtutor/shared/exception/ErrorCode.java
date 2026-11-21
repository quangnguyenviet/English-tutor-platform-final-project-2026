package com.mycompany.englishtutor.shared.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;

import lombok.Getter;

@Getter
public enum ErrorCode {
    UNCATEGORIZED_EXCEPTION(9999, "Uncategorized error", HttpStatus.INTERNAL_SERVER_ERROR),
    INVALID_KEY(1001, "Uncategorized error", HttpStatus.BAD_REQUEST),
    USER_EXISTED(1002, "User existed", HttpStatus.BAD_REQUEST),
    USERNAME_INVALID(1003, "Username must be at least {min} characters", HttpStatus.BAD_REQUEST),
    INVALID_PASSWORD(1004, "Password must be at least {min} characters", HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User not existed", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Unauthenticated", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "You do not have the required role", HttpStatus.FORBIDDEN),
    INVALID_DOB(1008, "Your age must be at least {min}", HttpStatus.BAD_REQUEST),
    EMAIL_EXISTED(1009, "Email đã được sử dụng", HttpStatus.BAD_REQUEST),
    TUTOR_REGISTRATION_FAILED(1010, "Đăng ký tài khoản gia sư thất bại", HttpStatus.INTERNAL_SERVER_ERROR),
    GOOGLE_OAUTH_NOT_CONFIGURED(1015, "Đăng nhập Google chưa được cấu hình", HttpStatus.SERVICE_UNAVAILABLE),
    GOOGLE_OAUTH_INVALID(1016, "Phiên đăng nhập Google không hợp lệ hoặc đã hết hạn", HttpStatus.UNAUTHORIZED),
    GOOGLE_OAUTH_ACCOUNT_CONFLICT(
            1017,
            "Email Google đã thuộc tài khoản khác. Vui lòng liên hệ hỗ trợ để xác minh.",
            HttpStatus.CONFLICT),
    TUTOR_PROFILE_NOT_FOUND(1011, "Tutor profile not found", HttpStatus.NOT_FOUND),
    TUTOR_PROFILE_ALREADY_SUBMITTED(1012, "Hồ sơ đã được gửi duyệt", HttpStatus.CONFLICT),
    FILE_TOO_LARGE(1013, "Tệp vượt quá dung lượng cho phép", HttpStatus.BAD_REQUEST),
    FILE_INVALID_TYPE(1014, "Định dạng tệp không hợp lệ", HttpStatus.BAD_REQUEST),
    TUTOR_PROFILE_PENDING(1030, "Hồ sơ đang chờ duyệt, không thể chỉnh sửa", HttpStatus.CONFLICT),
    TUTOR_PROFILE_NOT_PENDING(1031, "Hồ sơ không ở trạng thái chờ duyệt", HttpStatus.CONFLICT),
    INVALID_STATUS_TRANSITION(1032, "Chuyển trạng thái hồ sơ không hợp lệ", HttpStatus.CONFLICT),
    MISSING_REJECTION_REASON(1033, "Lý do từ chối không được để trống", HttpStatus.BAD_REQUEST),
    CLASS_REQUEST_NOT_FOUND(1100, "Lớp cần gia sư không tồn tại hoặc không còn mở", HttpStatus.NOT_FOUND),
    TUTOR_PROFILE_UNAVAILABLE(1101, "Hồ sơ gia sư không khả dụng", HttpStatus.NOT_FOUND),
    TOO_MANY_REQUESTS(
            1102,
            "Số điện thoại này đã gửi quá 5 yêu cầu trong 1 giờ. Vui lòng thử lại sau",
            HttpStatus.TOO_MANY_REQUESTS),
    TUTOR_NOT_ACTIVE(
            1103,
            "Hồ sơ gia sư của bạn chưa được duyệt hoạt động. Vui lòng hoàn tất hồ sơ và chờ trung tâm duyệt trước khi ứng tuyển.",
            HttpStatus.FORBIDDEN),
    CLASS_ALREADY_APPLIED(1104, "Bạn đã ứng tuyển lớp này rồi.", HttpStatus.CONFLICT),
    APPLICATION_NOT_FOUND(1105, "Đơn ứng tuyển không tồn tại.", HttpStatus.NOT_FOUND),
    APPLICATION_NOT_WITHDRAWABLE(
            1106,
            "Không thể rút đơn ứng tuyển: lớp đã chốt gia sư hoặc đơn ứng tuyển đã có kết quả.",
            HttpStatus.CONFLICT),
    CLASS_REQUEST_NOT_OPEN(1107, "Lớp này không còn nhận đơn ứng tuyển.", HttpStatus.CONFLICT),
    MISSING_CANCEL_REASON(1108, "Lý do hủy không được để trống", HttpStatus.BAD_REQUEST),
    MATCH_REQUEST_NOT_PENDING(1109, "Chỉ xác nhận được lớp đang chờ xử lý hoặc đang ghép lại", HttpStatus.CONFLICT),
    CLASS_REQUEST_ALREADY_CANCELLED(1110, "Lớp này đã bị hủy trước đó", HttpStatus.CONFLICT),
    MATCH_REQUEST_NOT_TRIAL(1111, "Chỉ có thể duyệt hoàn tất đối với lớp đang ở trạng thái dạy thử", HttpStatus.CONFLICT),
    CLASS_REQUEST_NOT_NEW(1112, "Chỉ có thể đăng tuyển lớp đang ở trạng thái chờ xử lý", HttpStatus.CONFLICT),
    CLASS_REQUEST_NOT_READY(
            1113,
            "Lớp chưa đủ thông tin (yêu cầu lớp, hình thức, học phí, học sinh) để đăng tuyển",
            HttpStatus.CONFLICT),
    APPLICATION_NOT_IN_REQUEST(1114, "Đơn ứng tuyển không thuộc lớp này", HttpStatus.CONFLICT),
    CLASS_FEE_INCOMPLETE(
            1115,
            "Lớp chưa đủ thông tin tính phí nhận lớp (thiếu số buổi/tuần hoặc học phí mỗi buổi)",
            HttpStatus.CONFLICT),
    CLASS_NOT_FOUND(1120, "Lớp học không tồn tại", HttpStatus.NOT_FOUND),
    CLASS_NOT_OWNED(1121, "Bạn không có quyền truy cập lớp học này", HttpStatus.FORBIDDEN),
    CLASS_NOT_TRIAL(1122, "Lớp học không ở trạng thái dạy thử", HttpStatus.CONFLICT),
    TRIAL_SESSION_ALREADY_EXISTS(1123, "Lớp học đã có lịch dạy thử", HttpStatus.CONFLICT),
    TRIAL_SESSION_NOT_FOUND(1124, "Lớp học chưa có lịch dạy thử", HttpStatus.NOT_FOUND),
    TRIAL_SESSION_NOT_EDITABLE(
            1125,
            "Chỉ có thể chỉnh sửa lịch dạy thử khi buổi học thử chưa diễn ra",
            HttpStatus.CONFLICT),
    SCHEDULE_CONFLICT(
            1126,
            "Khung giờ bạn chọn bị trùng với ca dạy khác của bạn. Vui lòng chọn khung giờ khác.",
            HttpStatus.CONFLICT),
    TRIAL_SESSION_INVALID_TIME(1127, "Giờ kết thúc phải sau giờ bắt đầu", HttpStatus.BAD_REQUEST),
    TRIAL_SESSION_DATE_IN_PAST(1128, "Ngày dạy thử không được trong quá khứ", HttpStatus.BAD_REQUEST),
    TRIAL_SESSION_MISSING_MEETING_URL(
            1129, "Vui lòng nhập liên kết phòng học cho buổi học online", HttpStatus.BAD_REQUEST),
    TRIAL_SESSION_MISSING_LOCATION(
            1130, "Vui lòng xác nhận địa chỉ cho buổi học tại nhà", HttpStatus.BAD_REQUEST),
    TRIAL_SESSION_INVALID_MODE(1131, "Hình thức học không hợp lệ", HttpStatus.BAD_REQUEST),
    INVALID_CLASS_STATUS(1132, "Trạng thái lớp không hợp lệ", HttpStatus.BAD_REQUEST),
    CLASS_NOT_ACTIVE(1133, "Lớp học chưa được kích hoạt", HttpStatus.CONFLICT),
    SCHEDULE_ALREADY_EXISTS(1134, "Lớp học đã có lịch dạy cố định", HttpStatus.CONFLICT),
    SCHEDULE_NOT_FOUND(1135, "Lớp học chưa có lịch dạy cố định", HttpStatus.NOT_FOUND),
    SCHEDULE_INVALID_TIME(1136, "Giờ kết thúc phải sau giờ bắt đầu", HttpStatus.BAD_REQUEST),
    SCHEDULE_DATE_IN_PAST(1137, "Ngày bắt đầu hiệu lực không được trong quá khứ", HttpStatus.BAD_REQUEST),
    SCHEDULE_INVALID_RANGE(
            1138, "Ngày kết thúc hiệu lực phải sau hoặc bằng ngày bắt đầu", HttpStatus.BAD_REQUEST),
    SCHEDULE_DUPLICATE(1139, "Các ca dạy trong tuần bị trùng nhau", HttpStatus.BAD_REQUEST),
    SESSION_DATE_NOT_IN_SCHEDULE(
            1140,
            "Ngày này không có ca dạy trong khoảng hiệu lực của lịch cố định lớp",
            HttpStatus.BAD_REQUEST),
    SESSION_AMBIGUOUS_TIME(
            1141, "Ngày này có nhiều ca, cần chỉ định giờ bắt đầu", HttpStatus.BAD_REQUEST),
    SESSION_NOT_FOUND(1142, "Buổi học không tồn tại", HttpStatus.NOT_FOUND),
    SESSION_NOT_OWNED(
            1143, "Bạn không có quyền với buổi học của lớp này", HttpStatus.FORBIDDEN),
    SESSION_RESCHEDULE_IN_PAST(
            1146, "Không thể dời buổi học sang ngày trong quá khứ", HttpStatus.BAD_REQUEST),
    SESSION_INVALID_TIME(1147, "Giờ kết thúc phải sau giờ bắt đầu", HttpStatus.BAD_REQUEST),
    SESSION_DUPLICATE_SLOT(
            1148, "Khung giờ này đã có buổi học khác trong lớp", HttpStatus.CONFLICT),
    SESSION_LOG_EMPTY(
            1149, "Nhật ký buổi học không được để trống cả hai phần", HttpStatus.BAD_REQUEST),
    OCCURRENCE_HAS_SESSION(
            1150,
            "Ô này đã có buổi học thật, không thể ghi ngoại lệ — dùng thao tác trên buổi học",
            HttpStatus.CONFLICT),
    EXCEPTION_RESCHEDULE_IN_PAST(
            1151, "Không thể dời ngoại lệ sang ngày trong quá khứ", HttpStatus.BAD_REQUEST),
    EXCEPTION_NOT_FOUND(1152, "Ngoại lệ lịch dạy không tồn tại", HttpStatus.NOT_FOUND),
    OCCURRENCE_SCHEDULE_NOT_FOUND(
            1153, "Ca lịch cố định không tồn tại / không thuộc lớp này", HttpStatus.NOT_FOUND),
    EXCEPTION_DATE_OUT_OF_RANGE(
            1154, "Ngày ngoại lệ phải nằm trong khoảng hiệu lực của ca lịch cố định",
            HttpStatus.BAD_REQUEST),
    EXCEPTION_TYPE_INVALID(
            1155, "Loại ngoại lệ không hợp lệ (CANCELLED hoặc RESCHEDULED)",
            HttpStatus.BAD_REQUEST),
    MATERIAL_NOT_FOUND(1156, "Tài liệu buổi học không tồn tại hoặc đã bị gỡ", HttpStatus.NOT_FOUND),
    MATERIAL_FILE_TYPE_INVALID(
            1157,
            "Định dạng tệp không hợp lệ — chỉ nhận PDF, DOCX, ảnh hoặc âm thanh",
            HttpStatus.BAD_REQUEST),
    MATERIAL_FILE_TOO_LARGE(
            1158, "Tệp vượt quá dung lượng tối đa 20MB", HttpStatus.BAD_REQUEST),
    // --- Ghép lại lớp (REMATCH, ERD v2.4 C-14) ---
    APPLICATION_TERMINATED(
            1159,
            "Bạn đã bị loại khỏi lớp này sau buổi dạy thử không thành công, không thể ứng tuyển lại.",
            HttpStatus.CONFLICT),
    TUTOR_NOT_OPEN_TO_TEACHING(
            1160,
            "Bạn đang tắt chế độ \"Đang mở nhận lớp\". Hãy bật lại để ứng tuyển.",
            HttpStatus.CONFLICT),
    CLASS_REQUEST_NOT_SELECTABLE(
            1161, "Chỉ chọn gia sư cho lớp đang tuyển hoặc đang ghép lại.", HttpStatus.CONFLICT),
    APPLICATION_REJECTED(
            1162,
            "Bạn đã không được chọn cho lớp này trước đó, không thể ứng tuyển lại.",
            HttpStatus.CONFLICT),
    // --- Gộp Đơn ghép lớp vào Lớp cần gia sư ---
    CLASS_REQUEST_TUTOR_NOT_CHANGEABLE(
            1163, "Chỉ đổi gia sư chỉ định khi lớp đang chờ xử lý hoặc đang ghép lại.", HttpStatus.CONFLICT),
    CLASS_REQUEST_NOT_EDITABLE(
            1164, "Chỉ sửa thông tin khi lớp đang chờ xử lý hoặc đang ghép lại.", HttpStatus.CONFLICT),
    CLASS_REQUEST_FIELD_LOCKED(
            1165, "Khi đang ghép lại chỉ được sửa học phí, mục tiêu và yêu cầu gia sư.", HttpStatus.CONFLICT),
    CLASS_REQUEST_NO_TUTOR(1166, "Lớp chưa có gia sư chỉ định.", HttpStatus.CONFLICT),
    CLASS_REQUEST_HAS_TUTOR(
            1167, "Lớp đang có gia sư chỉ định, không thể đăng tuyển hoặc chọn ứng viên.", HttpStatus.CONFLICT),
    CLASS_REQUEST_TUTOR_TERMINATED(
            1168, "Gia sư này đã bị loại khỏi lớp sau buổi dạy thử không thành công.", HttpStatus.CONFLICT),
    CLASS_REQUEST_CANCEL_EXPIRED(
            1169, "Đã quá 7 ngày kể từ khi ghép thành công, không thể hủy lớp.", HttpStatus.CONFLICT),
    // --- Một SĐT là một phụ huynh ---
    PARENT_PHONE_NAME_MISMATCH(
            1170,
            "Số điện thoại này đã được đăng ký với họ tên khác. Vui lòng kiểm tra lại hoặc gọi Hotline 1900 6868.",
            HttpStatus.CONFLICT),
    PARENT_PHONE_BELONGS_TO_OTHER(
            1171, "Số điện thoại này thuộc về một phụ huynh khác. Vui lòng xác nhận lại với phụ huynh.", HttpStatus.CONFLICT),
    CLASS_REQUEST_PRICE_REQUIRED(
            1172, "Vui lòng bổ sung học phí mỗi buổi trước khi chuyển lớp sang dạy thử.", HttpStatus.CONFLICT),
    PAYMENT_NOT_FOUND(1200, "Khoản phí nhận lớp không tồn tại", HttpStatus.NOT_FOUND),
    PAYMENT_INVALID_STATE(1201, "Khoản phí không ở trạng thái cho phép thao tác này", HttpStatus.CONFLICT),
    PAYMENT_SAME_ACTOR(1202, "Người duyệt không được trùng với người nộp hoặc thu hộ minh chứng", HttpStatus.FORBIDDEN),
    FEE_PERCENTAGE_OUT_OF_RANGE(1203, "Tỷ lệ phí nhận lớp nằm ngoài khoảng cho phép", HttpStatus.BAD_REQUEST),
    PAYMENT_ACCESS_DENIED(1204, "Bạn không có quyền với khoản phí này", HttpStatus.FORBIDDEN),
    PAYMENT_CLASS_NOT_FOUND(1205, "Lớp học của khoản phí không tồn tại", HttpStatus.NOT_FOUND),
    PAYMENT_CLASS_INCOMPLETE(
            1206, "Lớp chưa có học phí mỗi buổi hoặc lịch học cố định để tính phí", HttpStatus.CONFLICT),
    PAYMENT_PROOF_REQUIRED(1207, "Vui lòng đính kèm ảnh hoặc tệp biên lai", HttpStatus.BAD_REQUEST),
    RECEIVED_AMOUNT_INVALID(1208, "Số tiền thực nhận không hợp lệ", HttpStatus.BAD_REQUEST),
    RESUBMIT_REASON_REQUIRED(1209, "Vui lòng nhập lý do yêu cầu nộp lại", HttpStatus.BAD_REQUEST),
    PAYMENT_METHOD_NOT_ALLOWED(1210, "Phương thức thanh toán không hợp lệ cho vai trò này", HttpStatus.BAD_REQUEST),
    // --- Quiz buổi học - module quiz (API_DESIGN §3.7, FR-13) ---
    QUIZ_NOT_FOUND(1400, "Quiz không tồn tại", HttpStatus.NOT_FOUND),
    QUIZ_NOT_OWNED(
            1401, "Bạn không có quyền với quiz của buổi học này", HttpStatus.FORBIDDEN),
    QUIZ_INVALID_STATE(
            1402, "Chỉ có thể thực hiện thao tác này khi quiz còn ở trạng thái nháp (DRAFT)",
            HttpStatus.CONFLICT),
    QUIZ_DEADLINE_INVALID(
            1403, "Thời hạn làm quiz phải ở thời điểm hiện tại hoặc sau", HttpStatus.BAD_REQUEST),
    QUIZ_QUESTION_INVALID(
            1404, "Danh sách câu hỏi không hợp lệ (thiếu nội dung, lựa chọn A–D hoặc đáp án đúng)",
            HttpStatus.BAD_REQUEST),
    SKILL_CODE_NOT_FOUND(1405, "Mã kỹ năng không tồn tại trong hệ thống", HttpStatus.BAD_REQUEST),
    // --- Quiz phía học sinh (làm bài, Elo) & đổi mật khẩu ---
    QUIZ_NOT_AVAILABLE(1406, "Bài quiz chưa được giao hoặc không thuộc về bạn", HttpStatus.NOT_FOUND),
    QUESTION_NOT_FOUND(1407, "Câu hỏi không tồn tại trong quiz này", HttpStatus.NOT_FOUND),
    QUIZ_ANSWER_INVALID(1408, "Đáp án phải là một trong A, B, C, D", HttpStatus.BAD_REQUEST),
    QUIZ_EXPIRED(1410, "Bài quiz đã quá hạn nên không thể làm tiếp", HttpStatus.GONE),
    OLD_PASSWORD_INCORRECT(1411, "Mật khẩu hiện tại không đúng", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_REUSED(1412, "Mật khẩu mới không được trùng mật khẩu cũ hoặc mật khẩu mặc định", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_WEAK(1413, "Mật khẩu mới phải có tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số", HttpStatus.BAD_REQUEST),
    STUDENT_INFO_REQUIRED(
            1414,
            "Vui lòng bổ sung họ tên học sinh trước khi chuyển lớp sang dạy thử",
            HttpStatus.BAD_REQUEST),
    AI_SERVICE_UNAVAILABLE(
            1416, "Dịch vụ AI đang không khả dụng. Vui lòng thử lại sau ít phút.",
            HttpStatus.BAD_GATEWAY),
    AI_CHAT_MESSAGE_REQUIRED(
            1417, "Vui lòng nhập nội dung yêu cầu cho trợ lý AI.", HttpStatus.BAD_REQUEST),
    AI_CHAT_INPUT_TOO_LONG(
            1418,
            "Nội dung câu hỏi trong form quá dài, vượt giới hạn ký tự của trợ lý AI. "
                    + "Vui lòng rút gọn câu hỏi rồi thử lại.",
            HttpStatus.BAD_REQUEST),
    REVIEW_NOT_AVAILABLE(1419, "Câu hỏi này không có trong danh sách ôn tập của bạn", HttpStatus.NOT_FOUND),
    REVIEW_NOT_DUE(1420, "Câu hỏi này chưa đến thời điểm ôn lại", HttpStatus.CONFLICT),
    REVIEW_ATTEMPT_NOT_FOUND(1421, "Lượt ôn tập không tồn tại hoặc không thuộc về bạn", HttpStatus.NOT_FOUND),
    REVIEW_CARD_ANSWER_REQUIRED(
            1422, "Bạn cần trả lời câu hỏi này trước khi thêm vào danh sách ôn tập", HttpStatus.BAD_REQUEST),
    REVIEW_DECK_NOT_FOUND(
            1423, "Bộ thẻ ôn tập không tồn tại hoặc không thuộc về bạn", HttpStatus.NOT_FOUND),
    REVIEW_DECK_NAME_INVALID(
            1424, "Tên bộ thẻ ôn tập phải từ 1 đến 60 ký tự", HttpStatus.BAD_REQUEST),
    REVIEW_DECK_NAME_TAKEN(
            1425, "Đã có bộ thẻ ôn tập cùng tên", HttpStatus.CONFLICT),
    REVIEW_DECK_DELETE_FORBIDDEN(
            1426, "Không thể xóa bộ thẻ mặc định của hệ thống", HttpStatus.BAD_REQUEST),
    REVIEW_DECK_LIMIT_REACHED(
            1427, "Tối đa 50 bộ thẻ ôn tập", HttpStatus.BAD_REQUEST),
    // --- Quản lý nhân sự (Lễ tân / Kế toán) - module staff (UC-ADM-11, UC-ADM-12) ---
    PHONE_EXISTED(1300, "Số điện thoại đã được đăng ký trong hệ thống", HttpStatus.BAD_REQUEST),
    EMPLOYEE_NOT_FOUND(1301, "Nhân sự không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_EMPLOYEE_ROLE(1302, "Vai trò nhân sự không hợp lệ (chỉ RECEPTIONIST hoặc ACCOUNTANT)", HttpStatus.BAD_REQUEST),
    INVALID_EMPLOYEE_STATUS(1303, "Trạng thái nhân sự không hợp lệ", HttpStatus.CONFLICT),
    ACCOUNT_INACTIVE(1304, "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên", HttpStatus.FORBIDDEN),
    // --- Khiếu nại & hoàn tiền (1500 – 1599) ---
    COMPLAINT_NOT_FOUND(1500, "Đơn khiếu nại không tồn tại", HttpStatus.NOT_FOUND),
    COMPLAINT_INVALID_STATE(1501, "Đơn khiếu nại không ở trạng thái cho phép thao tác này", HttpStatus.CONFLICT),
    COMPLAINT_TYPE_MISMATCH(1502, "Loại khiếu nại không phù hợp với thao tác này", HttpStatus.CONFLICT),
    COMPLAINT_TARGET_NOT_PROCESSABLE(
            1503, "Lớp không còn ở trạng thái có thể xử lý theo lựa chọn này", HttpStatus.CONFLICT),
    COMPLAINT_RESOLUTION_REQUIRED(1504, "Vui lòng nhập kết quả xử lý.", HttpStatus.BAD_REQUEST),
    REFUND_NOT_FOUND(1505, "Yêu cầu hoàn tiền không tồn tại", HttpStatus.NOT_FOUND),
    REFUND_INVALID_STATE(1506, "Yêu cầu hoàn tiền không ở trạng thái cho phép thao tác này", HttpStatus.CONFLICT),
    REFUND_PAYMENT_INVALID(
            1507, "Khoản phí phải đã được xác nhận và thuộc đúng lớp của khiếu nại", HttpStatus.CONFLICT),
    REFUND_ALREADY_EXISTS(1508, "Khiếu nại đã có yêu cầu hoàn tiền đang chờ hoặc đã hoàn", HttpStatus.CONFLICT),
    REFUND_AMOUNT_EXCEEDED(1509, "Số tiền hoàn vượt quá giới hạn còn lại", HttpStatus.BAD_REQUEST),
    REFUND_SAME_ACTOR(1510, "Người tạo yêu cầu hoàn tiền không được tự xử lý yêu cầu đó", HttpStatus.FORBIDDEN),
    REFUND_PROOF_REQUIRED(
            1511, "Vui lòng đính kèm ảnh biên lai chuyển khoản hoàn tiền trước khi xác nhận.", HttpStatus.BAD_REQUEST),
    REFUND_REJECT_REASON_REQUIRED(
            1512, "Vui lòng nhập lý do từ chối hoàn tiền để Lễ tân nắm được thông tin.", HttpStatus.BAD_REQUEST),
    COMPLAINT_OUTCOME_REQUIRED(1513, "Vui lòng chọn Hủy lớp hoặc Ghép lại.", HttpStatus.BAD_REQUEST),
    COMPLAINT_EVIDENCE_REQUIRED(
            1514, "Lớp đã được xử lý trước đó. Vui lòng đính kèm minh chứng đã xử lý.", HttpStatus.BAD_REQUEST),
    REFUND_CLASS_NOT_ONLINE(1515, "Khiếu nại hoàn tiền chỉ áp dụng cho lớp Online", HttpStatus.CONFLICT),
    COMPLAINT_WINDOW_EXPIRED(
            1516,
            "Lớp đã ghép thành công quá 7 ngày, không thể tiếp nhận khiếu nại hủy lớp hoặc ghép lại.",
            HttpStatus.CONFLICT),
    COMPLAINT_TOO_MANY_FILES(1517, "Chỉ được đính kèm tối đa 5 tệp minh chứng.", HttpStatus.BAD_REQUEST),
    PASSWORD_CHANGE_REQUIRED(1600, "Bạn cần đổi mật khẩu trước khi tiếp tục sử dụng hệ thống", HttpStatus.FORBIDDEN),
    EMPLOYEE_STATUS_VALUE_INVALID(1601, "Giá trị trạng thái nhân sự không hợp lệ", HttpStatus.BAD_REQUEST),
    EMPLOYEE_CONTACT_EXISTED(1602, "Email hoặc Số điện thoại đã được đăng ký trong hệ thống", HttpStatus.BAD_REQUEST),
    // --- Quota lưu trữ tài liệu theo gói gia sư (catalog storage_tiers, V29) ---
    TUTOR_STORAGE_QUOTA_EXCEEDED(
            1603, "Đã vượt dung lượng lưu trữ tối đa của gói hiện tại", HttpStatus.BAD_REQUEST),
    TUTOR_STORAGE_TIER_EXPIRED(
            1604, "Gói lưu trữ trả phí đã hết hạn, vui lòng liên hệ lễ tân để gia hạn", HttpStatus.BAD_REQUEST),
    TUTOR_STORAGE_TIER_NOT_FOUND(
            1605, "Không tìm thấy gói lưu trữ được chỉ định", HttpStatus.BAD_REQUEST),
    // --- Nhắn tin & đề xuất lớp học MSG (1700 – 1799) ---
    CHAT_UNAVAILABLE(1700, "Dịch vụ nhắn tin tạm thời không khả dụng, vui lòng thử lại sau", HttpStatus.SERVICE_UNAVAILABLE),
    CHAT_PARENT_PROFILE_INCOMPLETE(
            1701, "Vui lòng hoàn tất thông tin phụ huynh (số điện thoại, mục đích, khu vực) trước khi tiếp tục", HttpStatus.CONFLICT),
    CHAT_PARENT_ONLY(1702, "Chỉ phụ huynh mới thực hiện được thao tác này", HttpStatus.FORBIDDEN),
    CHAT_TUTOR_ONLY(1703, "Chỉ gia sư mới thực hiện được thao tác này", HttpStatus.FORBIDDEN),
    CHAT_ROOM_NOT_FOUND(1704, "Phòng chat không tồn tại hoặc bạn không có quyền truy cập", HttpStatus.NOT_FOUND),
    CHAT_ROOM_CLOSED(1705, "Phòng chat đang bị khóa, bạn chỉ có thể xem lại nội dung", HttpStatus.CONFLICT),
    CHAT_TUTOR_NOT_ACTIVE(1706, "Gia sư hiện không nhận trò chuyện", HttpStatus.CONFLICT),
    CHAT_APPLICATION_NOT_AVAILABLE(
            1707, "Ứng viên này không còn khả dụng hoặc tin đăng không còn nhận ứng tuyển", HttpStatus.CONFLICT),
    CHAT_MESSAGE_EMPTY(1708, "Nội dung tin nhắn không được để trống", HttpStatus.BAD_REQUEST),
    CHAT_MESSAGE_TOO_LONG(1709, "Tin nhắn tối đa 2.000 ký tự", HttpStatus.BAD_REQUEST),
    CHAT_RATE_LIMITED(1710, "Bạn gửi quá nhanh, vui lòng chờ vài giây rồi thử lại", HttpStatus.TOO_MANY_REQUESTS),
    CHAT_PII_BLOCKED(
            1711,
            "Hệ thống không cho phép chia sẻ thông tin liên hệ. Hãy thống nhất nội dung học rồi để gia sư tạo đề xuất.",
            HttpStatus.UNPROCESSABLE_ENTITY),
    CHAT_INVALID_PHONE(1712, "Số điện thoại không hợp lệ", HttpStatus.BAD_REQUEST),
    PROPOSAL_NOT_FOUND(1720, "Đề xuất không tồn tại", HttpStatus.NOT_FOUND),
    PROPOSAL_NOT_PENDING(1721, "Đề xuất không còn ở trạng thái chờ phản hồi", HttpStatus.CONFLICT),
    PROPOSAL_NEEDS_CONVERSATION(
            1722, "Cần trao đổi ít nhất một tin nhắn hai chiều trước khi tạo đề xuất", HttpStatus.CONFLICT),
    PROPOSAL_STUDENT_REQUIRED(1723, "Vui lòng chọn học sinh có sẵn hoặc nhập họ tên học sinh mới", HttpStatus.BAD_REQUEST),
    PROPOSAL_STUDENT_NOT_OF_PARENT(1724, "Học sinh không thuộc phụ huynh trong phòng chat này", HttpStatus.BAD_REQUEST),
    PROPOSAL_DUPLICATE_PENDING(1725, "Học sinh này đã có một đề xuất đang chờ phản hồi", HttpStatus.CONFLICT),
    PROPOSAL_INVALID_SCHEDULE(1726, "Lịch học hoặc lịch dạy thử không hợp lệ", HttpStatus.BAD_REQUEST),
    PROPOSAL_TUTOR_BUSY(1727, "Khung giờ trong đề xuất trùng lớp khác của gia sư", HttpStatus.CONFLICT),
    PROPOSAL_STUDENT_ALREADY_WITH_TUTOR(
            1728, "Học sinh đang có lớp với gia sư này, không thể tạo thêm lớp", HttpStatus.CONFLICT),
    PROPOSAL_REQUEST_CLOSED(1729, "Tin đăng đã đóng nên không thể đồng ý thêm đề xuất", HttpStatus.CONFLICT),
    PROPOSAL_WITHDRAW_REASON_REQUIRED(1730, "Vui lòng nhập lý do rút đề xuất (ít nhất 5 ký tự)", HttpStatus.BAD_REQUEST),
    FEE_POLICY_NOT_FOUND(1740, "Chưa cấu hình tỷ lệ phí cho loại lớp này", HttpStatus.INTERNAL_SERVER_ERROR),
    POSTING_LIMIT_REACHED(1750, "Bạn đang có một tin đăng chưa kết thúc, vui lòng đóng tin cũ trước khi tạo tin mới", HttpStatus.CONFLICT),
    POSTING_NOT_FOUND(1751, "Tin đăng không tồn tại", HttpStatus.NOT_FOUND),
    POSTING_INVALID_STATE(1752, "Tin đăng không ở trạng thái cho phép thao tác này", HttpStatus.CONFLICT),
    PII_REVIEW_NOT_FOUND(1760, "Không tìm thấy bản ghi kiểm duyệt", HttpStatus.NOT_FOUND),
    INTERNAL_SIGNATURE_INVALID(1761, "Chữ ký yêu cầu nội bộ không hợp lệ", HttpStatus.UNAUTHORIZED),
    ;

    ErrorCode(int code, String message, HttpStatusCode statusCode) {
        this.code = code;
        this.message = message;
        this.statusCode = statusCode;
    }

    private final int code;
    private final String message;
    private final HttpStatusCode statusCode;
}
