package com.mycompany.englishtutor.module.auth.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    /** Loại tài khoản đăng nhập: PARENT (mặc định) hoặc TUTOR. */
    @Pattern(regexp = "PARENT|TUTOR", message = "Loại tài khoản không hợp lệ")
    String role;
}
