package com.mycompany.englishtutor.module.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import com.mycompany.englishtutor.module.auth.api.request.AuthenticationRequest;
import com.mycompany.englishtutor.module.auth.api.request.IntrospectRequest;
import com.mycompany.englishtutor.module.auth.api.request.RefreshRequest;
import com.mycompany.englishtutor.module.auth.repository.InvalidatedTokenRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Chặn tài khoản INACTIVE (học sinh / nhân sự bị khóa) ở đăng nhập, làm mới token và phiên đang mở.
 */
@ExtendWith(MockitoExtension.class)
class AuthenticationServiceTest {

    private static final String USERNAME = "student";
    private static final String PASSWORD = "123456";
    private static final String SIGNER_KEY =
            "test-signer-key-test-signer-key-test-signer-key-test-signer-key-0123456789";

    @Mock
    UserRepository userRepository;

    @Mock
    InvalidatedTokenRepository invalidatedTokenRepository;

    @Mock
    TutorRepository tutorRepository;

    @InjectMocks
    AuthenticationService authenticationService;

    User student;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authenticationService, "SIGNER_KEY", SIGNER_KEY);
        ReflectionTestUtils.setField(authenticationService, "VALID_DURATION", 3600L);
        ReflectionTestUtils.setField(authenticationService, "REFRESHABLE_DURATION", 36000L);

        student = User.builder()
                .id(5L)
                .username(USERNAME)
                .passwordHash(new BCryptPasswordEncoder(10).encode(PASSWORD))
                .fullName("Nguyễn Minh Khôi")
                .role("STUDENT")
                .status("ACTIVE")
                .build();
        when(userRepository.findByUsername(USERNAME)).thenReturn(Optional.of(student));
    }

    private String login() {
        return authenticationService
                .authenticate(AuthenticationRequest.builder().username(USERNAME).password(PASSWORD).build())
                .getToken();
    }

    @Test
    void authenticate_activeStudent_success() {
        assertThat(login()).isNotBlank();
    }

    @Test
    void authenticate_inactiveStudent_rejected() {
        student.setStatus("INACTIVE");

        AppException ex = assertThrows(AppException.class, this::login);

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_INACTIVE);
    }

    @Test
    void introspect_tokenOfLockedAccount_invalid() throws Exception {
        String token = login();
        when(userRepository.existsByUsernameAndStatus(USERNAME, "ACTIVE")).thenReturn(false);

        boolean valid = authenticationService
                .introspect(IntrospectRequest.builder().token(token).build())
                .isValid();

        assertThat(valid).isFalse();
    }

    @Test
    void introspect_tokenOfActiveAccount_valid() throws Exception {
        String token = login();
        when(userRepository.existsByUsernameAndStatus(USERNAME, "ACTIVE")).thenReturn(true);

        boolean valid = authenticationService
                .introspect(IntrospectRequest.builder().token(token).build())
                .isValid();

        assertThat(valid).isTrue();
    }

    @Test
    void refreshToken_lockedAccount_rejected() {
        String token = login();
        student.setStatus("INACTIVE");

        AppException ex = assertThrows(AppException.class, () -> authenticationService
                .refreshToken(RefreshRequest.builder().token(token).build()));

        assertThat(ex.getErrorCode()).isEqualTo(ErrorCode.ACCOUNT_INACTIVE);
    }
}
