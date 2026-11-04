package com.mycompany.englishtutor.module.staff.api.request;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

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
    @Size(max = 100, message = "Họ và tên không được vượt quá 100 ký tự")
    String fullName;

    @NotBlank(message = "Vui lòng nhập email")
    @Email(message = "Email không đúng định dạng")
    @Size(max = 100, message = "Email không được vượt quá 100 ký tự")
    String email;

    @NotBlank(message = "Vui lòng nhập số điện thoại")
    @Pattern(regexp = "^(0|\\+84|84)(3|5|7|8|9)\\d{8}$", message = "Số điện thoại không đúng định dạng")
    String phone;

    /** Ngày vào làm; để trống hệ thống lấy ngày hôm nay. */
    LocalDate startDate;
}
