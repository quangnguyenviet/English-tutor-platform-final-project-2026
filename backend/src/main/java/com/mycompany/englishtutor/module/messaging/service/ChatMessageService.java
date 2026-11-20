package com.mycompany.englishtutor.module.messaging.service;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.MessageItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.MessagePage;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PreCheckResponse;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalItem;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.pii.PiiDetector;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.RcMessage;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Access;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Gửi và đọc tin nhắn. Backend là cổng ghi duy nhất: kiểm duyệt PII, giới hạn tốc độ rồi mới gửi lên Rocket.Chat
 * bằng token tạm của người gửi; Rocket.Chat lưu tin, backend không sao chép nội dung tin thường vào PostgreSQL.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatMessageService {

    private final ChatRoomService rooms;
    private final RocketChatAccountService accounts;
    private final RocketChatClient client;
    private final PiiDetector piiDetector;
    private final ProposalReader proposalReader;
    private final ChatEventHub hub;
    private final JdbcTemplate jdbcTemplate;
    private final MessagingProperties properties;
    private final ObjectMapper objectMapper;
    private final Map<Long, Deque<Long>> recentSends = new ConcurrentHashMap<>();

    /** Kiểm tra trước khi gửi để frontend tô đỏ phần vi phạm. */
    public PreCheckResponse preCheck(Long roomId, String text) {
        rooms.requireAccess(roomId, false);
        PiiDetector.Detection detection = piiDetector.detect(text);
        return new PreCheckResponse(detection.blocked(), toItems(detection));
    }

    public MessageItem send(Long roomId, String rawText) {
        String text = rawText == null ? "" : rawText.strip();
        if (text.isEmpty()) {
            throw new AppException(ErrorCode.CHAT_MESSAGE_EMPTY);
        }
        if (text.length() > properties.getMaxMessageLength()) {
            throw new AppException(ErrorCode.CHAT_MESSAGE_TOO_LONG);
        }
        Access access = rooms.requireAccess(roomId, false);
        if (!access.room().writable()) {
            throw new AppException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        enforceRateLimit(access.userId());

        PiiDetector.Detection detection = piiDetector.detect(text);
        if (detection.blocked()) {
            logBlocked(access, text, detection);
            throw new PiiBlockedException(toItems(detection));
        }

        String messageId = accounts.withUserAuth(
                access.userId(), auth -> client.sendMessage(auth, access.room().rocketRoomId(), text));
        jdbcTemplate.update("UPDATE chat_rooms SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?", roomId);

        MessageItem item = new MessageItem(messageId, "TEXT", text, access.userId(), access.viewer().name(), true,
                Instant.now().toString(), null);
        hub.publish(access.room().participantUserIds(), "message", Map.of("roomId", roomId, "message", item));
        return item;
    }

    /** Lịch sử theo trang lùi (cursor là mốc thời gian của tin cũ nhất đã có). */
    public MessagePage history(Long roomId, String before, Integer limit) {
        Access access = rooms.requireAccess(roomId, true);
        int size = limit == null ? 30 : Math.max(1, Math.min(limit, 50));
        String rocketRoomId = access.room().rocketRoomId();
        List<RcMessage> raw = access.viewer() == Viewer.STAFF
                ? client.adminHistory(rocketRoomId, size, before)
                : accounts.withUserAuth(access.userId(), auth -> client.history(auth, rocketRoomId, size, before));

        Map<String, ProposalItem> proposals = proposalReader
                .findByRocketMessageIds(raw.stream().map(RcMessage::id).toList())
                .stream()
                .collect(Collectors.toMap(p -> proposalReader.rocketMessageId(p.id()).orElse(""), Function.identity(), (a, b) -> a));

        List<MessageItem> items = new ArrayList<>();
        for (RcMessage m : raw) {
            items.add(toItem(m, access, proposals.get(m.id())));
        }
        Collections.reverse(items);
        String nextCursor = raw.size() >= size ? raw.get(raw.size() - 1).timestamp() : null;
        return new MessagePage(items, nextCursor);
    }

    public void markRead(Long roomId) {
        Access access = rooms.requireAccess(roomId, false);
        accounts.withUserAuth(access.userId(), auth -> {
            client.markRead(auth, access.room().rocketRoomId());
            return null;
        });
    }

    /** Có tin nhắn của cả hai phía trong phòng (điều kiện tạo đề xuất). */
    public boolean hasTwoWayConversation(Access access) {
        List<RcMessage> raw = client.adminHistory(access.room().rocketRoomId(), 100, null);
        boolean parentSpoke = false;
        boolean tutorSpoke = false;
        for (RcMessage m : raw) {
            Long sender = RocketChatAccountService.userIdOf(m.username());
            if (sender == null) {
                continue;
            }
            parentSpoke |= sender.equals(access.room().parentUserId());
            tutorSpoke |= sender.equals(access.room().tutorId());
        }
        return parentSpoke && tutorSpoke;
    }

    // ------------------------------------------------------------ nội bộ

    private MessageItem toItem(RcMessage m, Access access, ProposalItem proposal) {
        Long senderId = RocketChatAccountService.userIdOf(m.username());
        boolean system = m.system() || accounts.isSystemUsername(m.username());
        String senderRole = system
                ? "SYSTEM"
                : senderId != null && senderId.equals(access.room().tutorId()) ? "TUTOR" : "PARENT";
        String type = proposal != null ? "PROPOSAL" : system ? "SYSTEM" : "TEXT";
        boolean mine = senderId != null && senderId.equals(access.userId());
        return new MessageItem(m.id(), type, m.text(), senderId, senderRole, mine, m.timestamp(), proposal);
    }

    private void enforceRateLimit(Long userId) {
        long now = System.currentTimeMillis();
        Deque<Long> window = recentSends.computeIfAbsent(userId, k -> new ArrayDeque<>());
        synchronized (window) {
            while (!window.isEmpty() && now - window.peekFirst() > 60_000L) {
                window.pollFirst();
            }
            if (window.size() >= properties.getMaxMessagesPerMinute()) {
                throw new AppException(ErrorCode.CHAT_RATE_LIMITED);
            }
            window.addLast(now);
        }
    }

    private void logBlocked(Access access, String text, PiiDetector.Detection detection) {
        try {
            String detail = objectMapper.writeValueAsString(Map.of(
                    "types", detection.types(), "senderRole", access.viewer().name(), "length", text.length()));
            jdbcTemplate.update(
                    """
                    INSERT INTO chat_pii_events (room_id, user_id, type, detail, blocked_text)
                    VALUES (?, ?, 'PII_BLOCKED', ?::jsonb, ?)
                    """,
                    access.room().id(), access.userId(), detail, text);
        } catch (JsonProcessingException e) {
            log.warn("Không ghi được log PII: {}", e.getMessage());
        }
    }

    private static List<PiiViolationItem> toItems(PiiDetector.Detection detection) {
        return detection.violations().stream()
                .map(v -> new PiiViolationItem(v.type().name(), v.start(), v.end()))
                .toList();
    }
}
