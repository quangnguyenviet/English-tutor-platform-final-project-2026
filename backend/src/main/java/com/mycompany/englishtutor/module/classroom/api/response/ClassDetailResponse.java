package com.mycompany.englishtutor.module.classroom.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Chi tiết lớp học của gia sư, gồm buổi dạy thử (nếu đã thiết lập). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassDetailResponse {
    Long classId;
    String className;
    String status;
    String teachingMode;
    BigDecimal pricePerSession;
    LocalDate activeFrom;
    OffsetDateTime createdAt;
    String studentName;
    String school;
    String grade;
    String learningGoal;
    TrialSessionResponse trialSession;
}
