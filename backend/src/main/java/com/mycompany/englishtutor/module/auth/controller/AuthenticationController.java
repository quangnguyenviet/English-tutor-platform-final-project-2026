package com.mycompany.englishtutor.module.auth.controller;

import java.text.ParseException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.security.core.Authentication;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.auth.api.request.AuthenticationRequest;
import com.mycompany.englishtutor.module.auth.api.request.ChangePasswordRequest;
import com.mycompany.englishtutor.module.auth.api.request.GoogleOAuthCallbackRequest;
import com.mycompany.englishtutor.module.auth.api.request.IntrospectRequest;
import com.mycompany.englishtutor.module.auth.api.request.LogoutRequest;
import com.mycompany.englishtutor.module.auth.api.request.RefreshRequest;
import com.mycompany.englishtutor.module.auth.api.request.TutorRegistrationRequest;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.module.auth.api.response.AuthenticationResponse;
import com.mycompany.englishtutor.module.auth.api.response.GoogleAuthenticationResponse;
import com.mycompany.englishtutor.module.auth.api.response.GoogleAuthorizationUrlResponse;
import com.mycompany.englishtutor.module.auth.api.response.IntrospectResponse;
import com.mycompany.englishtutor.module.auth.api.response.TutorRegistrationResponse;
import com.mycompany.englishtutor.module.auth.service.AuthenticationService;
import com.mycompany.englishtutor.module.auth.service.GoogleAuthenticationService;
import com.nimbusds.jose.JOSEException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@Validated
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;
    GoogleAuthenticationService googleAuthenticationService;

    @GetMapping("/google/authorization-url")
    ApiResponse<GoogleAuthorizationUrlResponse> googleAuthorizationUrl(
            @RequestParam @NotBlank String redirectUri,
            @RequestParam @NotBlank @Size(min = 32, max = 128) String state,
            @RequestParam @NotBlank @Size(min = 43, max = 128) String codeChallenge,
            @RequestParam @NotBlank @Size(min = 32, max = 128) String nonce) {
        var result = GoogleAuthorizationUrlResponse.builder()
                .authorizationUrl(googleAuthenticationService.authorizationUrl(redirectUri, state, codeChallenge, nonce))
                .build();
        return ApiResponse.<GoogleAuthorizationUrlResponse>builder().result(result).build();
    }

    @PostMapping("/google/callback")
    ApiResponse<GoogleAuthenticationResponse> googleCallback(
            @Valid @RequestBody GoogleOAuthCallbackRequest request) {
        return ApiResponse.<GoogleAuthenticationResponse>builder()
                .result(googleAuthenticationService.authenticate(request))
                .build();
    }

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    /**
     * Đăng ký tài khoản gia sư (UC-T01) — public endpoint.
     * Tạo user role=TUTOR + record tutors với profile_status=INCOMPLETE, trả JWT.
     */
    @PostMapping("/change-password")
    ApiResponse<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request, Authentication authentication) {
        authenticationService.changePassword(authentication.getName(), request);
        return ApiResponse.<Void>builder().message("Đổi mật khẩu thành công").build();
    }

    @PostMapping("/register-tutor")
    ApiResponse<TutorRegistrationResponse> registerTutor(@RequestBody @Valid TutorRegistrationRequest request) {
        var result = authenticationService.registerTutor(request);
        return ApiResponse.<TutorRegistrationResponse>builder().result(result).build();
    }

    @PostMapping("/introspect")
    ApiResponse<IntrospectResponse> authenticate(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return ApiResponse.<IntrospectResponse>builder().result(result).build();
    }

    @PostMapping("/refresh")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody RefreshRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.refreshToken(request);
        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    @PostMapping("/logout")
    ApiResponse<Void> logout(@RequestBody LogoutRequest request) throws ParseException, JOSEException {
        authenticationService.logout(request);
        return ApiResponse.<Void>builder().build();
    }
}
