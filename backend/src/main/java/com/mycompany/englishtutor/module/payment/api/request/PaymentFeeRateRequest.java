package com.mycompany.englishtutor.module.payment.api.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentFeeRateRequest {
    @NotNull(message = "FEE_PERCENTAGE_OUT_OF_RANGE")
    BigDecimal feePercentage;
}
