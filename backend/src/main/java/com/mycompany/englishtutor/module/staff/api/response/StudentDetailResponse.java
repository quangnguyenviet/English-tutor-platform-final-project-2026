package com.mycompany.englishtutor.module.staff.api.response;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Chi tiết học sinh hiển thị trong modal (UC-REC-11, UC-ADM-10): cá nhân, phụ huynh, lớp đang và đã học.
 */
@Data
@Builder(toBuilder = true)
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentDetailResponse {
    Long id;
    String username;
    String fullName;
    String email;
    String phone;
    LocalDate dateOfBirth;
    String gender;
    String avatarUrl;
    String school;
    String grade;
    String learningGoal;
    Integer elo;
    /** Bảng students không có địa chỉ riêng; dùng địa chỉ gia đình ở parents.address. */
    String address;
    String status;
    boolean mustChangePassword;
    OffsetDateTime createdAt;
    StudentParentResponse parent;
    /** Lớp TRIAL / ACTIVE. */
    List<StudentClassResponse> currentClasses;
    /** Lớp COMPLETED / CANCELLED. */
    List<StudentClassResponse> pastClasses;
}
