package com.mycompany.englishtutor.module.complaint.api.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Lễ tân gửi yêu cầu hoàn tiền cho Kế toán (UC-REC-16, kịch bản Hoàn tiền). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundCreateRequest {

    @NotNull(message = "Vui lòng chọn khoản phí cần hoàn")
    Long paymentId;

    @NotNull(message = "Vui lòng nhập số tiền đề xuất hoàn")
    @Positive(message = "Số tiền đề xuất phải lớn hơn 0")
    BigDecimal requestedAmount;

    @NotBlank(message = "Vui lòng nhập tên chủ tài khoản")
    @Size(max = 100, message = "Tên chủ tài khoản tối đa 100 ký tự")
    String recipientName;

    @NotBlank(message = "Vui lòng nhập tên ngân hàng")
    @Size(max = 100, message = "Tên ngân hàng tối đa 100 ký tự")
    String bankName;

    @NotBlank(message = "Vui lòng nhập số tài khoản")
    @Size(max = 30, message = "Số tài khoản tối đa 30 ký tự")
    String bankAccountNumber;
}
