package com.mycompany.englishtutor.module.auth.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoogleOAuthCallbackRequest {
    @NotBlank
    String code;

    @NotBlank
    @Size(min = 43, max = 128)
    String codeVerifier;

    @NotBlank
    String redirectUri;

    @NotBlank
    String nonce;
}
