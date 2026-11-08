package com.mycompany.englishtutor.module.complaint.api.response;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Lớp cần gia sư bị khiếu nại và các lựa chọn xử lý hợp lệ ở thời điểm hiện tại.
 * Backend tính {@code allowedOutcomes}, {@code alreadyHandled} bằng cùng quy tắc dùng khi giải quyết.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintTargetResponse {
    Long classRequestId;
    String requestCode;
    /** Trạng thái hiển thị: NEW, OPEN, TRIAL, MATCHED, REMATCH, CANCELLED. */
    String status;
    String studentName;
    String parentName;
    String parentPhone;
    String tutorName;
    String teachingMode;

    /** Lớp học mới nhất của lớp cần gia sư. */
    Long classId;
    String classStatus;
    LocalDate activeFrom;
    LocalDate cancelDeadline;
    Long cancelDaysLeft;

    /** Lớp ghi trên khiếu nại (lúc tạo đơn) và trạng thái hiện tại của lớp đó. */
    Long complaintClassId;
    String complaintClassStatus;

    /** Lớp đang có gia sư dạy (dạy thử hoặc ghép thành công). */
    boolean hasTutor;
    /** Lớp đã ghép thành công quá 7 ngày. */
    boolean windowExpired;
    /** Lựa chọn hệ thống tự thực hiện được. */
    List<String> allowedOutcomes;
    /** Lựa chọn nào đã được xử lý thủ công ở trang Lớp cần gia sư. */
    Map<String, Boolean> alreadyHandled;
}
