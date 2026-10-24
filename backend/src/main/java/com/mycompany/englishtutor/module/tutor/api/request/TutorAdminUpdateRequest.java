package com.mycompany.englishtutor.module.tutor.api.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorAdminUpdateRequest {
    @Size(max = 100, message = "Họ tên không được vượt quá 100 ký tự")
    String fullName;

    @Size(max = 15, message = "Số điện thoại không được vượt quá 15 ký tự")
    String phone;

    @Size(max = 200, message = "Tên trường đại học không được vượt quá 200 ký tự")
    String university;

    @Pattern(regexp = "^(STUDENT|GRADUATED|LECTURER)$", message = "Tình trạng học vấn không hợp lệ")
    String educationStatus;

    @Min(value = 0, message = "Số năm kinh nghiệm không được nhỏ hơn 0")
    Short experienceYears;

    @Size(max = 100, message = "Quê quán không được vượt quá 100 ký tự")
    String hometown;

    @Size(max = 500, message = "Địa chỉ không được vượt quá 500 ký tự")
    String address;

    String bio;

    @Size(max = 500, message = "Link video không được vượt quá 500 ký tự")
    String videoUrl;
}
