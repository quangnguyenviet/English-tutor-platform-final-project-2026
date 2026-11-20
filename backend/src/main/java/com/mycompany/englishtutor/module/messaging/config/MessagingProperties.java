package com.mycompany.englishtutor.module.messaging.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/** Cấu hình tính năng nhắn tin (MSG): Rocket.Chat, giới hạn tin nhắn, hạn đề xuất. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.messaging")
public class MessagingProperties {

    private RocketChat rocketchat = new RocketChat();
    private int proposalExpireDays = 7;
    private int maxMessagesPerMinute = 10;
    private int maxMessageLength = 2000;
    private String internalHmacSecret = "dev-only-change-me-hmac";
    private boolean jobsEnabled = true;

    @Getter
    @Setter
    public static class RocketChat {
        private String baseUrl = "http://localhost:3001";
        private String adminUsername = "ep_admin";
        private String adminPassword = "ChangeMe123!";
        private String createTokensSecret = "dev-only-change-me";
        private int connectTimeoutMs = 2000;
        private int readTimeoutMs = 15000;
        private int maxRetries = 2;
    }
}
