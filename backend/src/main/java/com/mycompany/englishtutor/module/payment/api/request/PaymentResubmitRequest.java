package com.mycompany.englishtutor.module.payment.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PaymentResubmitRequest {
    @NotBlank(message = "RESUBMIT_REASON_REQUIRED")
    String reason;
}
