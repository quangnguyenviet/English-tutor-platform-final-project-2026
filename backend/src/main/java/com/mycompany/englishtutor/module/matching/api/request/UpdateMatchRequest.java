package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
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
