package com.mycompany.englishtutor.module.messaging.rocketchat;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.Auth;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.RcMessage;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.RocketChatUnauthorizedException;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

/** Contract test RocketChatClient với một HTTP server giả lập Rocket.Chat REST. */
class RocketChatClientContractTest {

    private HttpServer server;
    private RocketChatClient client;
    private final Map<String, AtomicInteger> hits = new ConcurrentHashMap<>();
    private volatile int sendStatus = 200;

    @BeforeEach
    void setUp() throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/api/v1/login", ex -> reply(ex, 200, "{\"data\":{\"userId\":\"admin1\",\"authToken\":\"tok\"}}"));
        server.createContext("/api/v1/users.info", ex -> reply(ex, 400, "{\"success\":false,\"error\":\"User not found\"}"));
        server.createContext("/api/v1/users.create", ex -> reply(ex, 200, "{\"user\":{\"_id\":\"rcUser9\"},\"success\":true}"));
        server.createContext("/api/v1/groups.create", ex -> reply(ex, 200, "{\"group\":{\"_id\":\"room42\"},\"success\":true}"));
        server.createContext("/api/v1/chat.sendMessage", ex -> {
            if (sendStatus == 200) {
                reply(ex, 200, "{\"message\":{\"_id\":\"m1\"},\"success\":true}");
            } else {
                reply(ex, sendStatus, "{\"success\":false,\"error\":\"boom\"}");
            }
        });
        server.createContext("/api/v1/groups.history", ex -> reply(ex, 200,
                "{\"messages\":[{\"_id\":\"m2\",\"rid\":\"room42\",\"msg\":\"xin chào\",\"ts\":\"2026-11-18T10:00:00.000Z\",\"u\":{\"username\":\"ep_u6\"}},"
                        + "{\"_id\":\"m3\",\"rid\":\"room42\",\"msg\":\"sys\",\"ts\":\"2026-11-18T10:01:00.000Z\",\"t\":\"uj\",\"u\":{\"username\":\"ep_admin\"}}]}"));
        server.createContext("/api/v1/subscriptions.get", ex -> reply(ex, 200,
                "{\"update\":[{\"rid\":\"room42\",\"unread\":3},{\"rid\":\"room43\",\"unread\":0,\"alert\":true},{\"rid\":\"room44\",\"unread\":0,\"alert\":false}]}"));
        server.createContext("/api/v1/subscriptions.read", ex -> reply(ex, 401, "{\"error\":\"unauthorized\"}"));
        server.start();

        MessagingProperties properties = new MessagingProperties();
        properties.getRocketchat().setBaseUrl("http://127.0.0.1:" + server.getAddress().getPort());
        properties.getRocketchat().setReadTimeoutMs(1500);
        properties.getRocketchat().setMaxRetries(2);
        client = new RocketChatClient(properties, new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        server.stop(0);
    }

    private void reply(HttpExchange ex, int status, String body) throws IOException {
        hits.computeIfAbsent(ex.getRequestURI().getPath(), k -> new AtomicInteger()).incrementAndGet();
        byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
        ex.getResponseHeaders().add("Content-Type", "application/json");
        ex.sendResponseHeaders(status, bytes.length);
        ex.getResponseBody().write(bytes);
        ex.close();
    }

    @Test
    void ensureUser_createsWhenMissing() {
        assertEquals("rcUser9", client.ensureUser("ep_u9", "Nguyễn A", "ep_u9@chat.local"));
        assertEquals(1, hits.get("/api/v1/users.create").get());
    }

    @Test
    void createPrivateRoom_returnsRoomId() {
        assertEquals("room42", client.createPrivateRoom("ep-direct-1-2", List.of("ep_u1", "ep_u2")));
    }

    @Test
    void history_mapsMessagesAndFlagsSystem() {
        List<RcMessage> messages = client.history(new Auth("u", "t"), "room42", 30, null);

        assertEquals(2, messages.size());
        assertEquals("ep_u6", messages.get(0).username());
        assertTrue(messages.get(1).system());
    }

    @Test
    void unreadByRoom_usesAlertWhenUnreadCounterIsZero() {
        Map<String, Integer> unread = client.unreadByRoom(new Auth("u", "t"));

        assertEquals(3, unread.get("room42"));
        assertEquals(1, unread.get("room43"));
        assertEquals(0, unread.get("room44"));
    }

    @Test
    void sendMessage_doesNotRetryAndMapsServerErrorToUnavailable() {
        sendStatus = 500;

        AppException ex = assertThrows(AppException.class, () -> client.sendMessage(new Auth("u", "t"), "room42", "hi"));

        assertEquals(ErrorCode.CHAT_UNAVAILABLE, ex.getErrorCode());
        assertEquals(1, hits.get("/api/v1/chat.sendMessage").get(), "ghi không được retry để tránh gửi trùng");
    }

    @Test
    void userToken401_raisesUnauthorizedForRefresh() {
        assertThrows(RocketChatUnauthorizedException.class, () -> client.markRead(new Auth("u", "bad"), "room42"));
    }

    @Test
    void unreachableServer_mapsToUnavailable() {
        server.stop(0);

        AppException ex = assertThrows(AppException.class, () -> client.history(new Auth("u", "t"), "room42", 10, null));

        assertEquals(ErrorCode.CHAT_UNAVAILABLE, ex.getErrorCode());
    }
}
