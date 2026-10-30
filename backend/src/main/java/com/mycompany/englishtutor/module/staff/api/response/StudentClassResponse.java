package com.mycompany.englishtutor.module.staff.api.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Một lớp học của học sinh trong modal chi tiết (lớp đang học hoặc đã học).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentClassResponse {
    Long id;
    String className;
    String status;
    String teachingMode;
    Long tutorId;
    String tutorName;
    LocalDate activeFrom;
    long completedSessions;
    OffsetDateTime createdAt;
}
