package com.mycompany.englishtutor.module.auth.api.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class GoogleAuthenticationResponse {
    String token;
    boolean authenticated;
    boolean newUser;
    Long userId;
    String username;
    String fullName;
    String email;
    String avatarUrl;
    String role;

    /** Chỉ có với gia sư (INCOMPLETE, PENDING, ACTIVE, REJECTED...) để frontend điều hướng. */
    String profileStatus;
}
