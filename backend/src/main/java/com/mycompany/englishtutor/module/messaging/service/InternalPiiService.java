package com.mycompany.englishtutor.module.messaging.service;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.InternalPiiEvent;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/**
 * Nhận log chặn PII từ Rocket.Chat App qua endpoint nội bộ, xác thực bằng HMAC-SHA256 trên nội dung thô
 * ({@code X-Signature: hex}). Không dùng JWT vì app chạy trong Rocket.Chat, không phải người dùng hệ thống.
 */
@Service
@RequiredArgsConstructor
public class InternalPiiService {

    private final MessagingProperties properties;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper;
    private final ChatRoomService rooms;

    public void record(String rawBody, String signature) {
        if (!validSignature(rawBody, signature)) {
            throw new AppException(ErrorCode.INTERNAL_SIGNATURE_INVALID);
        }
        InternalPiiEvent event;
        try {
            event = objectMapper.readValue(rawBody, InternalPiiEvent.class);
        } catch (JsonProcessingException e) {
            throw new AppException(ErrorCode.INTERNAL_SIGNATURE_INVALID);
        }
        rooms.findByRocketRoomId(event.rocketRoomId()).ifPresent(room -> {
            Long userId = RocketChatAccountService.userIdOf(event.rocketUsername());
            try {
                String detail = objectMapper.writeValueAsString(Map.of(
                        "types", event.types() == null ? java.util.List.of() : event.types(),
                        "source", "ROCKETCHAT_APP", "length", event.textLength() == null ? 0 : event.textLength()));
                jdbcTemplate.update(
                        "INSERT INTO chat_pii_events (room_id, user_id, type, detail) VALUES (?, ?, 'PII_BLOCKED', ?::jsonb)",
                        room.id(), userId, detail);
            } catch (JsonProcessingException e) {
                throw new IllegalStateException(e);
            }
        });
    }

    boolean validSignature(String rawBody, String signature) {
        if (signature == null || rawBody == null) {
            return false;
        }
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(properties.getInternalHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), signature.strip().toLowerCase().getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return false;
        }
    }
}
