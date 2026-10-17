package com.mycompany.englishtutor.module.auth.controller;

import java.text.ParseException;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.auth.api.request.AuthenticationRequest;
import com.mycompany.englishtutor.module.auth.api.request.IntrospectRequest;
import com.mycompany.englishtutor.module.auth.api.request.LogoutRequest;
import com.mycompany.englishtutor.module.auth.api.request.RefreshRequest;
import com.mycompany.englishtutor.module.auth.api.request.TutorRegistrationRequest;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.module.auth.api.response.AuthenticationResponse;
import com.mycompany.englishtutor.module.auth.api.response.IntrospectResponse;
import com.mycompany.englishtutor.module.auth.api.response.TutorRegistrationResponse;
import com.mycompany.englishtutor.module.auth.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationController {
    AuthenticationService authenticationService;

    @PostMapping("/token")
    ApiResponse<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        var result = authenticationService.authenticate(request);
        return ApiResponse.<AuthenticationResponse>builder().result(result).build();
    }

    /**
     * Đăng ký tài khoản gia sư (UC-T01) — public endpoint.
     * Tạo user role=TUTOR + record tutors với profile_status=INCOMPLETE, trả JWT.
     */
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
