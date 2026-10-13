package com.mycompany.englishtutor.module.user.api.response;

import java.time.LocalDate;
import java.util.Set;

import com.mycompany.englishtutor.module.role.api.response.RoleResponse;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    String id;
    String username;
    String firstName;
    String lastName;
    LocalDate dob;
    Set<RoleResponse> roles;
}
