package com.mycompany.englishtutor.module.user.api.response;

import java.time.LocalDate;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    Long id;
    String username;
    String fullName;
    String email;
    String phone;
    LocalDate dateOfBirth;
    String gender;
    String avatarUrl;
    String role;
    String status;
    boolean mustChangePassword;
}
