package com.mycompany.englishtutor.module.complaint.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Kế toán từ chối yêu cầu hoàn tiền kèm lý do (UC-ACC-04). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundRejectRequest {

    @NotBlank(message = "REFUND_REJECT_REASON_REQUIRED")
    String reason;
}
