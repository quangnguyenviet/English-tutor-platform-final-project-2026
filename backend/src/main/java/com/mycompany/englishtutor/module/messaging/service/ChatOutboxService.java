package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Transactional outbox: tin hệ thống (đề xuất được đồng ý/từ chối/rút, hết hạn...) được ghi cùng transaction
 * nghiệp vụ rồi gửi sang Rocket.Chat sau, nên Rocket.Chat tạm lỗi không làm hỏng nghiệp vụ.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatOutboxService {

    private static final int MAX_ATTEMPTS = 10;

    private final JdbcTemplate jdbcTemplate;
    private final RocketChatClient client;
    private final ObjectMapper objectMapper;
    private final ChatEventHub hub;
    private final MessagingProperties properties;

    /** Ghi tin hệ thống chờ gửi (cùng transaction với thao tác gọi). */
    public void enqueueSystemMessage(Long roomId, String eventType, String text) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO chat_outbox (event_type, room_id, payload) VALUES (?, ?, ?::jsonb)",
                    eventType, roomId, objectMapper.writeValueAsString(Map.of("text", text)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Thông báo in-app cho một user. */
    public void notifyUser(Long userId, String title, String content, String entityType, Long entityId) {
        if (userId == null) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                userId, title, content, entityType, entityId);
    }

    /** Phát sự kiện realtime sau khi transaction commit (hoặc ngay nếu không có transaction). */
    public void publishAfterCommit(List<Long> userIds, String event, Object payload) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    hub.publish(userIds, event, payload);
                }
            });
        } else {
            hub.publish(userIds, event, payload);
        }
    }

    @Scheduled(fixedDelay = 4_000L, initialDelay = 10_000L)
    public void flushScheduled() {
        if (properties.isJobsEnabled()) {
            flush();
        }
    }

    /** Gửi các dòng outbox đến hạn; lỗi thì lùi thời gian thử lại (backoff), quá số lần thì đánh dấu FAILED. */
    public int flush() {
        List<Map<String, Object>> due = jdbcTemplate.queryForList(
                """
                SELECT o.id, o.room_id, o.payload::text AS payload, o.attempts, r.rocket_room_id
                FROM chat_outbox o JOIN chat_rooms r ON r.id = o.room_id
                WHERE o.status = 'PENDING' AND o.next_attempt_at <= NOW()
                ORDER BY o.id LIMIT 20
                """);
        int sent = 0;
        for (Map<String, Object> row : due) {
            Long id = ((Number) row.get("id")).longValue();
            int attempts = ((Number) row.get("attempts")).intValue();
            try {
                String text = objectMapper.readTree((String) row.get("payload")).path("text").asText();
                client.sendSystemMessage((String) row.get("rocket_room_id"), text);
                jdbcTemplate.update("UPDATE chat_outbox SET status = 'SENT', sent_at = NOW(), attempts = ? WHERE id = ?", attempts + 1, id);
                jdbcTemplate.update("UPDATE chat_rooms SET last_message_at = NOW() WHERE id = ?", row.get("room_id"));
                hub.publish(participantsOf(((Number) row.get("room_id")).longValue()), "refresh",
                        Map.of("roomId", row.get("room_id")));
                sent++;
            } catch (Exception e) {
                int next = attempts + 1;
                String status = next >= MAX_ATTEMPTS ? "FAILED" : "PENDING";
                long delaySeconds = Math.min(3600L, 10L * (1L << Math.min(next, 8)));
                jdbcTemplate.update(
                        """
                        UPDATE chat_outbox SET attempts = ?, status = ?, last_error = ?,
                               next_attempt_at = NOW() + (? || ' seconds')::interval WHERE id = ?
                        """,
                        next, status, String.valueOf(e.getMessage()), String.valueOf(delaySeconds), id);
                log.warn("Outbox {} gửi lỗi lần {}: {}", id, next, e.getMessage());
            }
        }
        return sent;
    }

    /** Cho phép chạy lại các dòng FAILED (reconciliation thủ công/theo lịch). */
    public int retryFailed() {
        return jdbcTemplate.update(
                "UPDATE chat_outbox SET status = 'PENDING', attempts = 0, next_attempt_at = NOW() WHERE status = 'FAILED'");
    }

    private List<Long> participantsOf(Long roomId) {
        return jdbcTemplate.query(
                "SELECT p.user_id AS parent_user, r.tutor_id FROM chat_rooms r JOIN parents p ON p.id = r.parent_id WHERE r.id = ?",
                (rs, i) -> List.of(rs.getLong("parent_user"), rs.getLong("tutor_id")), roomId)
                .stream().findFirst().orElse(List.of());
    }
}
