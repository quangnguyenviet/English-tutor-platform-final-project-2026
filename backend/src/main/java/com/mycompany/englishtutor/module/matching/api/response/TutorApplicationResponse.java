package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Đơn ứng tuyển của gia sư kèm tóm tắt lớp, dùng cho tab "Đơn ứng tuyển của tôi".
 *
 * <p>Vẫn giữ đơn khi lớp đã {@code MATCHED}/{@code CANCELLED} để gia sư xem lịch sử;
 * {@code classRequest.status} cho biết trạng thái hiện tại của đơn lớp.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorApplicationResponse {
    Long applicationId;
    String status;
    String message;
    OffsetDateTime appliedAt;
    ClassSummary classRequest;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ClassSummary {
        Long id;
        String requestCode;
        String classRequirement;
        String gradeLevel;
        String teachingMode;
        String generalLocation;
        BigDecimal pricePerSession;
        String preferredSchedule;
        OffsetDateTime createdAt;
        String status;
    }
}
