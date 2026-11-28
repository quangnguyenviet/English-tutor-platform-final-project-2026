package com.mycompany.englishtutor.module.student.api;

import java.time.LocalDate;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO trang cá nhân của học sinh. */
public final class StudentProfileDtos {

    private StudentProfileDtos() {}

    /** Tên đăng nhập và thông tin phụ huynh chỉ đọc. */
    public record StudentProfileResponse(
            String username,
            String fullName,
            LocalDate dateOfBirth,
            String gender,
            String email,
            String phone,
            String school,
            String grade,
            String learningGoal,
            String parentName,
            String parentPhone) {}

    /** Trường không bắt buộc để trống (hoặc null) nghĩa là xóa giá trị đang lưu. */
    public record StudentProfileRequest(
            @NotBlank(message = "Họ tên không được để trống") @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự")
                    String fullName,
            @Past(message = "Ngày sinh phải ở quá khứ") LocalDate dateOfBirth,
            @Pattern(regexp = "MALE|FEMALE|OTHER", message = "Giới tính không hợp lệ") String gender,
            @Email(message = "Email không hợp lệ") @Size(max = 255, message = "Email tối đa 255 ký tự") String email,
            @Size(max = 15, message = "Số điện thoại tối đa 15 ký tự") String phone,
            @Size(max = 200, message = "Tên trường tối đa 200 ký tự") String school,
            @Size(max = 20, message = "Khối lớp tối đa 20 ký tự") String grade,
            @Size(max = 1000, message = "Mục tiêu học tối đa 1000 ký tự") String learningGoal) {}
}
