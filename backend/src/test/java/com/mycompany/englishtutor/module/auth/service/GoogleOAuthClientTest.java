package com.mycompany.englishtutor.module.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.auth.config.GoogleOAuthProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

class GoogleOAuthClientTest {
    private static final String REDIRECT_URI = "http://localhost:5173/auth/google/callback";

    private GoogleOAuthProperties properties;
    private GoogleOAuthClient client;

    @BeforeEach
    void setUp() {
        properties = new GoogleOAuthProperties();
        properties.setClientId("google-client-id");
        properties.setClientSecret("google-client-secret");
        properties.setRedirectUris(List.of(REDIRECT_URI));
        client = new GoogleOAuthClient(properties);
    }

    @Test
    void authorizationUrlUsesCodeFlowPkceStateAndNonce() {
        String url = client.buildAuthorizationUrl(
                REDIRECT_URI, "s".repeat(32), "c".repeat(43), "n".repeat(32));

        assertThat(url)
                .contains("response_type=code")
                .contains("code_challenge_method=S256")
                .contains("code_challenge=" + "c".repeat(43))
                .contains("state=" + "s".repeat(32))
                .contains("nonce=" + "n".repeat(32))
                .contains("scope=openid%20email%20profile");
    }

    @Test
    void authorizationUrlRejectsUnregisteredRedirectUri() {
        assertThatThrownBy(() -> client.buildAuthorizationUrl(
                        "https://attacker.example/callback", "s".repeat(32), "c".repeat(43), "n".repeat(32)))
                .isInstanceOf(AppException.class)
                .satisfies(exception -> assertThat(((AppException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.GOOGLE_OAUTH_INVALID));
    }

    @Test
    void authorizationUrlFailsClosedWhenGoogleIsNotConfigured() {
        properties.setClientSecret("");

        assertThatThrownBy(() -> client.buildAuthorizationUrl(
                        REDIRECT_URI, "s".repeat(32), "c".repeat(43), "n".repeat(32)))
                .isInstanceOf(AppException.class)
                .satisfies(exception -> assertThat(((AppException) exception).getErrorCode())
                        .isEqualTo(ErrorCode.GOOGLE_OAUTH_NOT_CONFIGURED));
    }
}
