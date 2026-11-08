package com.mycompany.englishtutor.module.complaint.api.response;

import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Một dòng trong danh sách khiếu nại. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintResponse {
    Long id;
    /** Mã hiển thị {@code KN-{id}}. */
    String complaintCode;
    String complaintType;
    String status;
    String complainantName;
    String complainantPhone;
    String complainantRole;
    String complaintContent;
    String resolution;
    String requestOutcome;

    Long classRequestId;
    String requestCode;
    String studentName;
    String parentName;
    Long classId;
    String className;
    String teachingMode;

    Long receivedById;
    String receivedByName;
    String resolvedByName;
    OffsetDateTime resolvedAt;
    OffsetDateTime createdAt;
    OffsetDateTime updatedAt;

    /** Trạng thái yêu cầu hoàn tiền gần nhất (nếu có). */
    String latestRefundStatus;
    String latestRefundRejectReason;
}
