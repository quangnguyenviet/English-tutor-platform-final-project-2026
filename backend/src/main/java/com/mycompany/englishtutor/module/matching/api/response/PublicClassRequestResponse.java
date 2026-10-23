package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Thông tin lớp đang mở, đã loại bỏ dữ liệu liên hệ riêng tư của phụ huynh và học viên. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublicClassRequestResponse {
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
}
