package com.mycompany.englishtutor.module.staff.api.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Chi tiết nhân sự hiển thị trong modal (UC-ADM-11).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeDetailResponse {
    Long id;
    String employeeCode;
    String fullName;
    String email;
    String phone;
    String role;
    String roleLabel;
    LocalDate hiredDate;
    String status;
    String statusLabel;
    OffsetDateTime createdAt;
}
