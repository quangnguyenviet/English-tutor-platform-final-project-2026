package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body tùy chọn cho {@code complete-match} (kế hoạch mục 4.1): chỉ bổ sung dữ liệu
 * còn thiếu để tính phí nhận lớp khi kích hoạt lớp. Mọi trường đều optional —
 * hệ thống ưu tiên giá trị đã có trên lớp / đơn, fallback mới từ body này.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CompleteMatchRequest {

    @DecimalMin(value = "1", message = "Số buổi mỗi tuần phải lớn hơn 0")
    @Schema(description = "Số buổi mỗi tuần (bổ sung khi lớp chưa có)", example = "2")
    Integer sessionsPerWeek;

    @DecimalMin(value = "10000", message = "Học phí mỗi buổi phải lớn hơn 10.000 VNĐ")
    @Schema(description = "Học phí mỗi buổi (VNĐ, bổ sung khi lớp chưa có)", example = "300000")
    BigDecimal pricePerSession;

    @DecimalMin(value = "0", message = "Tỷ lệ phí nhận lớp không được âm")
    @DecimalMax(value = "50", message = "Tỷ lệ phí nhận lớp tối đa 50%")
    @Schema(description = "Tỷ lệ phí nhận lớp (%) — ghi đè snapshot khi cần", example = "40")
    BigDecimal feePercentage;
}
