package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateMatchRequest {

    @NotBlank(message = "Họ tên phụ huynh không được để trống")
    @Schema(description = "Họ tên phụ huynh", example = "Trần Thị Lan")
    String parentName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84|84)(3|5|7|8|9)\\d{8}$", message = "Vui lòng nhập đúng số điện thoại.")
    @Schema(description = "Số điện thoại liên hệ (10 chữ số đầu 03, 05, 07, 08, 09 hoặc +84)", example = "0987654321")
    String phone;

    @NotBlank(message = "Họ tên học sinh không được để trống")
    @Schema(description = "Họ tên học sinh", example = "Lê Hoàng Nam")
    String studentName;

    @Schema(description = "Khối lớp của học sinh", example = "Lớp 10")
    String grade;

    @Schema(description = "Trường học hiện tại", example = "THPT Chuyên Chu Văn An")
    String school;

    @NotNull(message = "Vui lòng chọn gia sư chỉ định")
    @Schema(description = "ID gia sư được chỉ định", example = "2")
    Long tutorId;

    @NotBlank(message = "Tên lớp không được để trống")
    @Schema(description = "Tên môn học hoặc lớp yêu cầu", example = "Tiếng Anh IELTS 6.5 cấp tốc")
    String className;

    @Schema(description = "Số buổi mỗi tuần", example = "3")
    @Builder.Default
    Integer sessionsPerWeek = 2;

    @Schema(description = "Thời lượng mỗi buổi (phút)", example = "90")
    @Builder.Default
    Integer durationMinutes = 90;

    @NotBlank(message = "Hình thức học không được để trống")
    @Pattern(regexp = "^(ONLINE|AT_HOME)$", message = "Hình thức học phải là ONLINE hoặc AT_HOME")
    @Schema(description = "Hình thức học (ONLINE / AT_HOME)", example = "ONLINE")
    String teachingMode;

    @NotNull(message = "Mức học phí mỗi buổi không được để trống")
    @DecimalMin(value = "10000", message = "Học phí mỗi buổi phải lớn hơn 10.000 VNĐ")
    @Schema(description = "Mức học phí mỗi buổi (VNĐ)", example = "250000")
    BigDecimal pricePerSession;

    @DecimalMin(value = "0", message = "Tỷ lệ phí nhận lớp không được âm")
    @DecimalMax(value = "50", message = "Tỷ lệ phí nhận lớp tối đa 50%")
    @Schema(description = "Tỷ lệ phí nhận lớp (%) — default 40, khoảng 0–50", example = "40")
    @Builder.Default
    BigDecimal feePercentage = BigDecimal.valueOf(40);

    @Schema(description = "Lịch học mong muốn", example = "Thứ 2 - 4 - 6 từ 19:30 đến 21:00")
    String preferredSchedule;

    @Schema(description = "Ghi chú thêm từ phụ huynh hoặc lễ tân", example = "Học sinh cần kèm phát âm và kỹ năng Viết Task 2")
    String notes;
}
