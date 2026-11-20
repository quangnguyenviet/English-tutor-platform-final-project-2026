package com.mycompany.englishtutor.module.auth.service;

import java.net.URI;
import java.util.Locale;
import java.util.Objects;

import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.mycompany.englishtutor.module.auth.config.GoogleOAuthProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class GoogleOAuthClient {
    private final GoogleOAuthProperties properties;
    private final RestClient restClient = RestClient.create();

    private volatile JwtDecoder jwtDecoder;

    public String buildAuthorizationUrl(
            String redirectUri, String state, String codeChallenge, String nonce) {
        requireConfigured();
        requireAllowedRedirectUri(redirectUri);
        return UriComponentsBuilder.fromUriString(properties.getAuthorizationUri())
                .queryParam("client_id", properties.getClientId())
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid email profile")
                .queryParam("state", state)
                .queryParam("nonce", nonce)
                .queryParam("code_challenge", codeChallenge)
                .queryParam("code_challenge_method", "S256")
                .queryParam("prompt", "select_account")
                .build()
                .encode()
                .toUriString();
    }

    public GoogleIdentity exchangeCode(String code, String codeVerifier, String redirectUri, String expectedNonce) {
        requireConfigured();
        requireAllowedRedirectUri(redirectUri);

        MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
        form.add("grant_type", "authorization_code");
        form.add("code", code);
        form.add("client_id", properties.getClientId());
        form.add("client_secret", properties.getClientSecret());
        form.add("redirect_uri", redirectUri);
        form.add("code_verifier", codeVerifier);

        try {
            GoogleTokenResponse response = restClient
                    .post()
                    .uri(URI.create(properties.getTokenUri()))
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                    .body(form)
                    .retrieve()
                    .body(GoogleTokenResponse.class);

            if (response == null || response.idToken() == null || response.idToken().isBlank()) {
                throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
            }
            return identityFrom(response.idToken(), expectedNonce);
        } catch (AppException exception) {
            throw exception;
        } catch (Exception exception) {
            log.warn("Google OAuth token exchange failed: {}", exception.getMessage());
            throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
        }
    }

    private GoogleIdentity identityFrom(String idToken, String expectedNonce) {
        Jwt jwt = decoder().decode(idToken);
        if (!jwt.getAudience().contains(properties.getClientId())
                || !Boolean.TRUE.equals(jwt.getClaimAsBoolean("email_verified"))
                || !Objects.equals(expectedNonce, jwt.getClaimAsString("nonce"))) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
        }

        String subject = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        String fullName = jwt.getClaimAsString("name");
        if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
        }
        if (fullName == null || fullName.isBlank()) {
            fullName = email.substring(0, email.indexOf('@'));
        }
        return new GoogleIdentity(
                subject,
                email.toLowerCase(Locale.ROOT),
                truncate(fullName, 100),
                truncate(jwt.getClaimAsString("picture"), 500));
    }

    private JwtDecoder decoder() {
        if (jwtDecoder == null) {
            synchronized (this) {
                if (jwtDecoder == null) {
                    jwtDecoder = JwtDecoders.fromIssuerLocation(properties.getIssuer());
                }
            }
        }
        return jwtDecoder;
    }

    private void requireConfigured() {
        if (!properties.isConfigured()) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_NOT_CONFIGURED);
        }
    }

    private void requireAllowedRedirectUri(String redirectUri) {
        if (!properties.isAllowedRedirectUri(redirectUri)) {
            throw new AppException(ErrorCode.GOOGLE_OAUTH_INVALID);
        }
    }

    private String truncate(String value, int maxLength) {
        return value == null || value.length() <= maxLength ? value : value.substring(0, maxLength);
    }

    private record GoogleTokenResponse(@JsonProperty("id_token") String idToken) {}
}
