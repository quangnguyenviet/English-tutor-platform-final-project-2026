package com.mycompany.englishtutor.module.classroom.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Một lớp học của gia sư trong danh sách "Lớp học của tôi" (API_DESIGN mục 3.5). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassSummaryResponse {
    Long classId;
    String className;
    String studentName;
    String teachingMode;
    BigDecimal pricePerSession;
    String status;
    OffsetDateTime createdAt;
    TrialSessionResponse trialSession;
}
