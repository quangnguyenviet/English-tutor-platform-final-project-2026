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
 * Lớp đang mở nhận ứng tuyển, hiển thị cho gia sư.
 *
 * <p>Không chứa họ tên, số điện thoại hay địa chỉ cụ thể của phụ huynh —
 * chỉ có {@code generalLocation} đã rút gọn. {@code applied} cho biết gia sư hiện tại
 * đã ứng tuyển lớp này chưa; {@code applicationId} dùng để rút đơn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorOpenClassRequestResponse {
    Long id;
    String requestCode;
    String classRequirement;
    String gradeLevel;
    String studentGender;
    String teachingMode;
    String generalLocation;
    BigDecimal pricePerSession;
    String preferredSchedule;
    String tutorRequirement;
    String learningGoal;
    String school;
    OffsetDateTime createdAt;

    boolean applied;
    Long applicationId;
    String myMessage;
    OffsetDateTime appliedAt;
}
