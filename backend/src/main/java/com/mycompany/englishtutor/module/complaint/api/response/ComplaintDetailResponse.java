package com.mycompany.englishtutor.module.complaint.api.response;

import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Chi tiết khiếu nại (UC-REC-15): thông tin đơn, lớp bị khiếu nại, minh chứng, hoàn tiền. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintDetailResponse {
    ComplaintResponse complaint;
    ComplaintTargetResponse target;
    List<ComplaintAttachmentResponse> attachments;
    /** Các yêu cầu hoàn tiền của khiếu nại, mới nhất trước. */
    List<RefundResponse> refunds;
    /** Chỉ có với khiếu nại {@code REFUND}. */
    List<RefundablePaymentResponse> refundablePayments;
}
