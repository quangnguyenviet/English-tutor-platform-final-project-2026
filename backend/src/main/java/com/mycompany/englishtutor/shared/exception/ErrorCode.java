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
    MATCH_REQUEST_NOT_PENDING(1109, "Đơn ghép lớp không ở trạng thái chờ xử lý", HttpStatus.CONFLICT),
    CLASS_REQUEST_ALREADY_CANCELLED(1110, "Đơn ghép lớp này đã bị hủy trước đó", HttpStatus.CONFLICT),
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
            1155, "Loại ngoại lệ không hợp lệ (CANCELLED, RESCHEDULED hoặc MODIFIED)",
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
    // --- Quản lý nhân sự (Lễ tân / Kế toán) - module staff (UC-ADM-11, UC-ADM-12) ---
    PHONE_EXISTED(1300, "Số điện thoại đã được đăng ký trong hệ thống", HttpStatus.BAD_REQUEST),
    EMPLOYEE_NOT_FOUND(1301, "Nhân sự không tồn tại", HttpStatus.NOT_FOUND),
    INVALID_EMPLOYEE_ROLE(1302, "Vai trò nhân sự không hợp lệ (chỉ RECEPTIONIST hoặc ACCOUNTANT)", HttpStatus.BAD_REQUEST),
    INVALID_EMPLOYEE_STATUS(1303, "Trạng thái nhân sự không hợp lệ", HttpStatus.CONFLICT),
    ACCOUNT_INACTIVE(1304, "Tài khoản đã bị vô hiệu hóa, vui lòng liên hệ quản trị viên", HttpStatus.FORBIDDEN),
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
