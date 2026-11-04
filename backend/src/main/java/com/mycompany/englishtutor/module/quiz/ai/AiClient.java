package com.mycompany.englishtutor.module.quiz.ai;

import java.time.Duration;

import org.springframework.http.MediaType;
import org.springframework.http.client.ClientHttpRequestFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.ResourceAccessException;

import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatPayload;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatResult;
import com.mycompany.englishtutor.module.quiz.config.AiProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * HTTP client gọi AI Service (AD-2: Backend là cổng duy nhất, timeout 60s +
 * retry 1 lần — API_DESIGN §3.7). Mọi lỗi mạng / 5xx được map về
 * {@code AI_SERVICE_UNAVAILABLE} để giao diện hiện nút "Thử lại" (UC-T06 bước 4a).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AiClient {

    private final AiProperties aiProperties;

    private volatile RestClient restClient;

    private RestClient client() {
        if (restClient == null) {
            synchronized (this) {
                if (restClient == null) {
                    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
                    factory.setConnectTimeout((int) Duration.ofSeconds(5).toMillis());
                    factory.setReadTimeout((int) Duration.ofSeconds(aiProperties.getTimeoutSeconds()).toMillis());
                    restClient =
                            RestClient.builder()
                                    .baseUrl(aiProperties.getServiceUrl())
                                    .requestFactory(factory)
                                    .build();
                }
            }
        }
        return restClient;
    }

    /** Gọi POST /api/v1/ai/quiz/chat, retry 1 lần khi lỗi 5xx/mạng. */
    public AiChatResult quizChat(AiChatPayload payload) {
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                return client()
                        .post()
                        .uri("/api/v1/ai/quiz/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .accept(MediaType.APPLICATION_JSON)
                        .body(payload)
                        .retrieve()
                        .body(AiChatResult.class);
            } catch (HttpServerErrorException ex) {
                log.warn(
                        "AI service lỗi (lần {}): {} {}",
                        attempt,
                        ex.getStatusCode(),
                        ex.getResponseBodyAsString());
                if (attempt == 2) {
                    throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
                }
            } catch (ResourceAccessException ex) {
                log.warn("Không gọi được AI service (lần {}): {}", attempt, ex.getMessage());
                if (attempt == 2) {
                    throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
                }
            }
        }
        throw new AppException(ErrorCode.AI_SERVICE_UNAVAILABLE);
    }
}
