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
