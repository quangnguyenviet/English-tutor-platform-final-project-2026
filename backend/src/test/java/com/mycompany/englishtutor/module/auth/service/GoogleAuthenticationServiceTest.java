package com.mycompany.englishtutor.module.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;

import com.mycompany.englishtutor.module.auth.api.request.GoogleOAuthCallbackRequest;
import com.mycompany.englishtutor.module.auth.domain.OAuthAccount;
import com.mycompany.englishtutor.module.auth.repository.OAuthAccountRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class GoogleAuthenticationServiceTest {
    @Mock
    private GoogleOAuthClient googleOAuthClient;

    @Mock
    private OAuthAccountRepository oAuthAccountRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private AuthenticationService authenticationService;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private GoogleAuthenticationService service;
    private GoogleOAuthCallbackRequest request;

    @BeforeEach
    void setUp() {
        service = new GoogleAuthenticationService(
                googleOAuthClient, oAuthAccountRepository, userRepository, authenticationService, jdbcTemplate);
        request = new GoogleOAuthCallbackRequest();
        request.setCode("google-code");
        request.setCodeVerifier("a".repeat(43));
        request.setRedirectUri("http://localhost:5173/auth/google/callback");
        request.setNonce("nonce-value");
    }

    @Test
    void firstGoogleLoginCreatesPasswordlessParentAndInternalJwt() {
        GoogleIdentity identity = new GoogleIdentity(
                "google-sub-123", "parent@example.com", "Nguyễn Minh Anh", "https://example.com/avatar.png");
        when(googleOAuthClient.exchangeCode(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(identity);
        when(oAuthAccountRepository.findByProviderAndProviderUserId("GOOGLE", identity.subject()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase(identity.email())).thenReturn(Optional.empty());
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(42L);
            return user;
        });
        when(authenticationService.issueToken(any(User.class))).thenReturn("internal-jwt");

        var response = service.authenticate(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User created = userCaptor.getValue();
        assertThat(created.getRole()).isEqualTo(UserRole.PARENT.name());
        assertThat(created.getPasswordHash()).isNull();
        assertThat(created.isMustChangePassword()).isFalse();
        assertThat(response.getToken()).isEqualTo("internal-jwt");
        assertThat(response.isNewUser()).isTrue();
        verify(jdbcTemplate).update(
                eq("INSERT INTO parents (user_id, full_name, phone, email) VALUES (?, ?, NULL, ?)"),
                eq(42L),
                eq(identity.fullName()),
                eq(identity.email()));
    }

    @Test
    void returningGoogleLoginReusesLinkedParent() {
        GoogleIdentity identity = new GoogleIdentity(
                "google-sub-123", "parent@example.com", "Nguyễn Minh Anh", "https://example.com/new-avatar.png");
        OAuthAccount account = OAuthAccount.builder()
                .id(10L)
                .userId(42L)
                .provider("GOOGLE")
                .providerUserId(identity.subject())
                .build();
        User user = User.builder()
                .id(42L)
                .username("parent_g_123")
                .fullName("Tên cũ")
                .email(identity.email())
                .role(UserRole.PARENT.name())
                .status("ACTIVE")
                .build();
        when(googleOAuthClient.exchangeCode(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(identity);
        when(oAuthAccountRepository.findByProviderAndProviderUserId("GOOGLE", identity.subject()))
                .thenReturn(Optional.of(account));
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));
        when(userRepository.save(user)).thenReturn(user);
        when(authenticationService.issueToken(user)).thenReturn("internal-jwt");

        var response = service.authenticate(request);

        assertThat(response.isNewUser()).isFalse();
        assertThat(response.getFullName()).isEqualTo(identity.fullName());
        verify(jdbcTemplate, never()).update(
                eq("INSERT INTO parents (user_id, full_name, phone, email) VALUES (?, ?, NULL, ?)"),
                any(),
                any(),
                any());
        verify(jdbcTemplate).update(
                eq("UPDATE parents SET full_name = ?, email = ?, updated_at = NOW() WHERE user_id = ?"),
                eq(identity.fullName()),
                eq(identity.email()),
                eq(42L));
    }

    @Test
    void firstGoogleLoginDoesNotClaimExistingUserByEmail() {
        GoogleIdentity identity = new GoogleIdentity(
                "google-sub-123", "tutor@example.com", "Nguyễn Minh Anh", null);
        when(googleOAuthClient.exchangeCode(anyString(), anyString(), anyString(), anyString()))
                .thenReturn(identity);
        when(oAuthAccountRepository.findByProviderAndProviderUserId("GOOGLE", identity.subject()))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase(identity.email()))
                .thenReturn(Optional.of(User.builder().id(9L).role(UserRole.TUTOR.name()).build()));

        assertThatThrownBy(() -> service.authenticate(request))
                .isInstanceOf(AppException.class)
                .satisfies(exception -> assertThat(((AppException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.GOOGLE_OAUTH_ACCOUNT_CONFLICT));
        verify(userRepository, never()).save(any());
    }
}
