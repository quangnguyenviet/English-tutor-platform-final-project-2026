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
