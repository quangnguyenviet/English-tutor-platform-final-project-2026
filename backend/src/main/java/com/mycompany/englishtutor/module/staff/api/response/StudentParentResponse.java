package com.mycompany.englishtutor.module.staff.api.response;

import lombok.AccessLevel;
import lombok.Builder;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Thông tin phụ huynh của học sinh (phụ huynh không có tài khoản).
 */
@Data
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentParentResponse {
    Long id;
    String fullName;
    String phone;
    String email;
    String address;
}
