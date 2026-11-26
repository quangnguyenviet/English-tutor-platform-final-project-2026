package com.mycompany.englishtutor.module.classroom.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

import lombok.Builder;
import lombok.Data;
import lombok.experimental.Accessors;

/**
 * Một dòng trong hàng đợi "Dạy thử thất bại cần xử lý" (V32).
 * Kèm đủ thông tin báo cáo, lớp, học viên, gia sư để render bảng mà không cần gọi chi tiết.
 */
@Data
@Builder
@Accessors(chain = true)
public class TrialReportTaskListItemResponse {

    // --- task
    Long taskId;
    String status;                 // PENDING / IN_PROGRESS / RESOLVED
    Long assignedToId;
    String assignedToName;
    OffsetDateTime taskCreatedAt;

    // --- report
    Long reportId;
    String reportOutcome;          // FAILED (chỉ task FAILED)
    String reportNote;
    OffsetDateTime reportedAt;

    // --- class
    Long classId;
    String className;
    String classStatus;           // TRIAL_FAIL
    LocalDate trialDate;
    LocalTime trialStartTime;
    LocalTime trialEndTime;

    // --- people
    Long studentId;
    String studentName;
    Long tutorId;
    String tutorName;

    // --- request
    /** true nếu lớp gắn {@code class_request_id} (có thể Ghép lại). */
    boolean hasClassRequest;
}
