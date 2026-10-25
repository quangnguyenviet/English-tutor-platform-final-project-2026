package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Lễ tân/Admin tạo mới "Lớp cần gia sư" tại quầy (UC-REC-02, UC-ADM-01).
 *
 * <p>Tạo đơn ở trạng thái {@code NEW}; sau đó gọi {@code publish} để chuyển sang {@code OPEN}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateClassRequest {

    @NotBlank(message = "Họ tên phụ huynh không được để trống")
    @Schema(description = "Họ tên phụ huynh (chưa công khai)", example = "Trần Thị Lan")
    String parentName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84|84)(3|5|7|8|9)\\d{8}$", message = "Vui lòng nhập đúng số điện thoại.")
    @Schema(description = "Số điện thoại liên hệ (chưa công khai)", example = "0987654321")
    String phone;

    @NotBlank(message = "Họ tên học sinh không được để trống")
    @Schema(description = "Họ tên học sinh (chưa công khai)", example = "Lê Hoàng Nam")
    String studentName;

    @Schema(description = "Khối lớp của học sinh", example = "Lớp 10")
    String grade;

    @Schema(description = "Trường học hiện tại", example = "THPT Chuyên Chu Văn An")
    String school;

    @NotBlank(message = "Yêu cầu lớp học không được để trống")
    @Schema(description = "Yêu cầu lớp học / môn học", example = "Luyện IELTS từ 5.0 lên 6.5, tập trung Speaking và Grammar")
    String classRequirement;

    @NotBlank(message = "Hình thức học không được để trống")
    @Pattern(regexp = "^(ONLINE|AT_HOME)$", message = "Hình thức học phải là ONLINE hoặc AT_HOME")
    @Schema(description = "Hình thức học (ONLINE / AT_HOME)", example = "ONLINE")
    String teachingMode;

    @NotNull(message = "Mức học phí mỗi buổi không được để trống")
    @DecimalMin(value = "10000", message = "Học phí mỗi buổi phải lớn hơn 10.000 VNĐ")
    @Schema(description = "Mức học phí mỗi buổi (VNĐ)", example = "300000")
    BigDecimal pricePerSession;

    @Schema(description = "Lịch học mong muốn (số buổi/tuần, thời gian)", example = "2 buổi/tuần, tối Thứ 3 và Thứ 6")
    String preferredSchedule;

    @Schema(description = "Yêu cầu đối với gia sư", example = "Gia sư IELTS 7.5 trở lên, có kinh nghiệm dạy THPT")
    String tutorRequirement;
}
