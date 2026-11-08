package com.mycompany.englishtutor.module.complaint.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Khoản phí đã được Kế toán xác nhận của lớp, kèm số đã hoàn và số còn có thể hoàn. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundablePaymentResponse {
    Long paymentId;
    String payerType;
    String paymentMethod;
    BigDecimal receivedAmount;
    BigDecimal refundedAmount;
    BigDecimal remainingAmount;
    OffsetDateTime reviewedAt;
}
