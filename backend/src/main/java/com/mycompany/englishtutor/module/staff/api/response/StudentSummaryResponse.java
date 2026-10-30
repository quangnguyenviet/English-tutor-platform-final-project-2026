package com.mycompany.englishtutor.module.staff.api.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Một dòng trong danh sách quản lý học sinh (FR-34).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentSummaryResponse {
    Long id;
    String username;
    String fullName;
    String avatarUrl;
    LocalDate dateOfBirth;
    String school;
    String grade;
    String parentName;
    String parentPhone;
    String status;
    /** Số lớp đang học (TRIAL hoặc ACTIVE). */
    int currentClassCount;
    /** Gia sư đang phụ trách các lớp TRIAL/ACTIVE. */
    List<String> currentTutorNames;
    OffsetDateTime createdAt;
}
