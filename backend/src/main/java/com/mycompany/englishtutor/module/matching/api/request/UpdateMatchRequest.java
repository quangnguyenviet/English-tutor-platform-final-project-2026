package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Sửa đơn ghép lớp khi còn {@code NEW} (kế hoạch mục 4.1.1, mirror của
 * {@code PUT /class-requests/{id}}): cho lễ tân hoàn thiện đơn trước khi
 * {@code confirm} — đặc biệt là {@code fee_percentage} (tỷ lệ phí nhận lớp)
 * vì đơn từ form công khai mặc định 40%.
 *
 * <p>Mọi trường đều tùy chọn (partial update); trường nào gửi lên thì cập nhật trường đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateMatchRequest {

    @Size(max = 100, message = "Họ tên phụ huynh tối đa 100 ký tự")
    @Schema(description = "Họ tên phụ huynh", example = "Trần Thị Lan")
    String parentName;

    @Email(message = "Email phụ huynh không hợp lệ")
    @Size(max = 100, message = "Email phụ huynh tối đa 100 ký tự")
    @Schema(description = "Email phụ huynh", example = "lan.tran@gmail.com")
    String parentEmail;

    @Size(max = 500, message = "Địa chỉ phụ huynh tối đa 500 ký tự")
    @Schema(description = "Địa chỉ liên hệ phụ huynh", example = "12 Nguyễn Trãi, Thanh Xuân, Hà Nội")
    String parentAddress;

    @Size(max = 100, message = "Họ tên học sinh tối đa 100 ký tự")
    @Schema(description = "Họ tên học sinh (bắt buộc trước khi chuyển sang dạy thử)", example = "Lê Hoàng Nam")
    String studentName;

    @Size(max = 20, message = "Khối lớp tối đa 20 ký tự")
    @Schema(description = "Khối lớp của học sinh", example = "Lớp 10")
    String grade;

    @Size(max = 200, message = "Tên trường tối đa 200 ký tự")
    @Schema(description = "Trường học hiện tại", example = "THPT Chuyên Chu Văn An")
    String school;

    @Schema(description = "Mục tiêu học tập", example = "Đạt IELTS 6.5 trong 6 tháng")
    String learningGoal;

    @Schema(description = "Tên lớp / yêu cầu môn học", example = "Tiếng Anh IELTS 6.5 cấp tốc")
    String classRequirement;

    @Pattern(regexp = "^(ONLINE|AT_HOME)$", message = "Hình thức học phải là ONLINE hoặc AT_HOME")
    @Schema(description = "Hình thức học (ONLINE / AT_HOME)", example = "ONLINE")
    String teachingMode;

    @DecimalMin(value = "10000", message = "Học phí mỗi buổi phải lớn hơn 10.000 VNĐ")
    @Schema(description = "Mức học phí mỗi buổi (VNĐ)", example = "300000")
    BigDecimal pricePerSession;

    @DecimalMin(value = "0", message = "Tỷ lệ phí nhận lớp không được âm")
    @DecimalMax(value = "50", message = "Tỷ lệ phí nhận lớp tối đa 50%")
    @Schema(description = "Tỷ lệ phí nhận lớp (%) — khoảng 0–50 (V10)", example = "40")
    BigDecimal feePercentage;
}
