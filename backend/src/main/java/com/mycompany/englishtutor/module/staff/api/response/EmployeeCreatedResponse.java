package com.mycompany.englishtutor.module.staff.api.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Kết quả tạo nhân sự mới, kèm thông tin đăng nhập ban đầu để bàn giao (UC-ADM-12).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeCreatedResponse {
    EmployeeDetailResponse employee;
    /** Tên đăng nhập hệ thống tự sinh. */
    String username;
    /** Mật khẩu mặc định dùng một lần; nhân viên buộc đổi ở lần đăng nhập đầu. */
    String defaultPassword;
}
