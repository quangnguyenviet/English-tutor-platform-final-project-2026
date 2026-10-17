package com.mycompany.englishtutor.module.auth.api.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorRegistrationResponse {
    String token;
    boolean authenticated;
    Long userId;
    String username;
    String fullName;
    String email;
    String role;
    String status;
    String profileStatus;
}
