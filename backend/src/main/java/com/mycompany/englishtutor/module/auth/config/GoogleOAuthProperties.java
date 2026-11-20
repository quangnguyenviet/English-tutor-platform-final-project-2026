package com.mycompany.englishtutor.module.auth.config;

import java.util.ArrayList;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.validation.annotation.Validated;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Validated
@Component
@ConfigurationProperties(prefix = "app.oauth.google")
public class GoogleOAuthProperties {
    private String clientId = "";
    private String clientSecret = "";
    private String authorizationUri = "https://accounts.google.com/o/oauth2/v2/auth";
    private String tokenUri = "https://oauth2.googleapis.com/token";
    private String issuer = "https://accounts.google.com";
    private List<String> redirectUris = new ArrayList<>(List.of("http://localhost:5173/auth/google/callback"));

    public boolean isConfigured() {
        return !clientId.isBlank() && !clientSecret.isBlank();
    }

    public boolean isAllowedRedirectUri(String redirectUri) {
        return redirectUris.contains(redirectUri);
    }
}
