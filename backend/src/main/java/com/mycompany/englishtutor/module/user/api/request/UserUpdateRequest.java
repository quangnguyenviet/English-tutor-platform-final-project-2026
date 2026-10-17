package com.mycompany.englishtutor.module.user.api.request;

import java.time.LocalDate;
import com.mycompany.englishtutor.shared.validation.DobConstraint;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserUpdateRequest {
    String password;
    String fullName;
    String email;
    String phone;

    @DobConstraint(min = 18, message = "INVALID_DOB")
    LocalDate dateOfBirth;

    String role;
}
