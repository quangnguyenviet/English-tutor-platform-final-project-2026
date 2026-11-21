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

    /** Gói lưu trữ tài liệu buổi học (V29): FREE / PRO / PREMIUM. */
    @Pattern(regexp = "^(FREE|PRO|PREMIUM)$", message = "Gói lưu trữ không hợp lệ (FREE, PRO hoặc PREMIUM)")
    String storageTier;

    /**
     * Thời hạn gói trả phí theo số tháng (V29): 1, 3 hoặc 12 tháng từ thời điểm gán.
     * Chỉ có ý nghĩa khi {@code storageTier} là PRO/PREMIUM; gói FREE bỏ qua (expires_at = NULL).
     * Mặc định 1 tháng nếu PRO/PREMIUM mà không truyền.
     */
    @jakarta.validation.constraints.Min(value = 1, message = "Thời hạn lưu trữ tối thiểu 1 tháng")
    @jakarta.validation.constraints.Max(value = 12, message = "Thời hạn lưu trữ tối đa 12 tháng")
    Integer storageTierDurationMonths;
}
