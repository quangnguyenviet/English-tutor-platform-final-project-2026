package com.mycompany.englishtutor.module.payment.api.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentApproveRequest {
    @NotNull(message = "RECEIVED_AMOUNT_INVALID")
    @PositiveOrZero(message = "RECEIVED_AMOUNT_INVALID")
    BigDecimal receivedAmount;
}
