package com.mycompany.englishtutor.module.complaint.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Yêu cầu hoàn tiền kèm bảng đối soát UC-ACC-04: {@code receivedAmount} [A], {@code refundedAmount} [B]
 * (đã hoàn từ khoản phí này bởi các yêu cầu khác), {@code remainingAmount} [A-B].
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RefundResponse {
    Long id;
    String status;
    Long complaintId;
    String complaintCode;
    String complaintContent;
    String complainantName;
    String complainantPhone;

    Long classId;
    String className;
    String requestCode;
    String studentName;

    Long paymentId;
    BigDecimal receivedAmount;
    BigDecimal refundedAmount;
    BigDecimal remainingAmount;

    BigDecimal requestedAmount;
    BigDecimal approvedAmount;
    String recipientName;
    String bankName;
    String bankAccountNumber;
    String rejectReason;
    /** Link xem biên lai tạm thời (presigned), chỉ có ở chi tiết. */
    String proofUrl;

    Long requestedById;
    String requestedByName;
    Long processedById;
    String processedByName;
    OffsetDateTime processedAt;
    OffsetDateTime createdAt;
}
