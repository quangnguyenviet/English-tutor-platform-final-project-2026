package com.mycompany.englishtutor.module.staff.api.response;

import java.time.LocalDate;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Một dòng nhân sự trong danh sách quản lý (UC-ADM-11).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeSummaryResponse {
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
}
