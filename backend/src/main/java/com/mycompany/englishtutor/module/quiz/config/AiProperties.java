package com.mycompany.englishtutor.module.quiz.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/**
 * Cấu hình AI Service (FastAPI) — AD-2: Backend là cổng duy nhất gọi AI.
 * Mặc định trỏ về localhost:8000 (chạy AI service ngoài Docker); khi chạy
 * full docker compose thì env {@code AI_SERVICE_URL=http://ai:8000}.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.ai")
public class AiProperties {

    /** Base URL của AI Service (không kèm slash cuối). */
    private String serviceUrl = "http://localhost:8000";

    /** Timeout đọc mỗi lần gọi (giây). UC-T06: AI phản hồi quá 60s → "Thử lại". */
    private long timeoutSeconds = 60;
}
