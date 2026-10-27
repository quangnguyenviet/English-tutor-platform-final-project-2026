package com.mycompany.englishtutor.module.staff.api.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Dữ liệu tạo mới nhân sự (UC-ADM-12). Vai trò chỉ nhận RECEPTIONIST hoặc ACCOUNTANT.
 */
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeCreationRequest {

    @NotBlank(message = "Vui lòng chọn vai trò nhân sự")
    String role;

    @NotBlank(message = "Vui lòng nhập họ và tên")
    String fullName;

    @NotBlank(message = "Vui lòng nhập email")
    @Email(message = "Email không đúng định dạng")
    String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    String phone;

    /** Ngày vào làm; để trống hệ thống lấy ngày hôm nay. */
    LocalDate startDate;
}
