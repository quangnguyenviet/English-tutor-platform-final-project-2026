package com.mycompany.englishtutor.module.messaging.rocketchat;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.extern.slf4j.Slf4j;

/**
 * Client REST tới Rocket.Chat. Chỉ backend dùng; trình duyệt không bao giờ nhận token Rocket.Chat.
 * Có timeout, retry có giới hạn cho thao tác đọc/idempotent và ánh xạ lỗi sang {@link ErrorCode#CHAT_UNAVAILABLE}.
 */
@Slf4j
@Component
public class RocketChatClient {

    /** Cặp thông tin xác thực của một tài khoản Rocket.Chat. */
    public record Auth(String userId, String authToken) {}

    /** Một tin nhắn đọc từ Rocket.Chat. */
    public record RcMessage(String id, String roomId, String text, String username, String timestamp, boolean system) {}

    private final MessagingProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;
    private volatile Auth adminAuth;

    public RocketChatClient(MessagingProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .connectTimeout(Duration.ofMillis(properties.getRocketchat().getConnectTimeoutMs()))
                .build();
    }

    // ------------------------------------------------------------ admin

    /** Đăng nhập admin (cache); tự đăng nhập lại khi token hết hạn. */
    public synchronized Auth adminAuth() {
        if (adminAuth == null) {
            MessagingProperties.RocketChat cfg = properties.getRocketchat();
            JsonNode body = call("POST", "/api/v1/login", null,
                    Map.of("user", cfg.getAdminUsername(), "password", cfg.getAdminPassword()), true);
            JsonNode data = body.path("data");
            adminAuth = new Auth(data.path("userId").asText(), data.path("authToken").asText());
        }
        return adminAuth;
    }

    private synchronized void resetAdminAuth() {
        adminAuth = null;
    }

    /** Tạo user nếu chưa có; trả về Rocket user id. Idempotent theo username. */
    public String ensureUser(String username, String name, String email) {
        JsonNode info = callAdmin("GET", "/api/v1/users.info?username=" + enc(username), null, true, true);
        if (info != null && info.path("success").asBoolean(false)) {
            return info.path("user").path("_id").asText();
        }
        Map<String, Object> body = new HashMap<>();
        body.put("username", username);
        body.put("name", name);
        body.put("email", email);
        body.put("password", UUID.randomUUID() + "Aa1!");
        body.put("active", true);
        body.put("verified", true);
        body.put("joinDefaultChannels", false);
        body.put("sendWelcomeEmail", false);
        body.put("requirePasswordChange", false);
        JsonNode created = callAdmin("POST", "/api/v1/users.create", body, false, false);
        return created.path("user").path("_id").asText();
    }

    /** Token tạm của một user (Rocket.Chat users.createToken). */
    public Auth createUserToken(String rocketUserId) {
        JsonNode node = callAdmin("POST", "/api/v1/users.createToken",
                Map.of("userId", rocketUserId, "secret", properties.getRocketchat().getCreateTokensSecret()),
                false, false);
        JsonNode data = node.path("data");
        return new Auth(data.path("userId").asText(), data.path("authToken").asText());
    }

    /** Tạo phòng private gồm phụ huynh, gia sư và tài khoản admin (người gửi tin hệ thống, đọc transcript). */
    public String createPrivateRoom(String roomName, List<String> usernames) {
        JsonNode node = callAdmin("POST", "/api/v1/groups.create",
                Map.of("name", roomName, "members", usernames, "readOnly", false), false, false);
        return node.path("group").path("_id").asText();
    }

    /** Gửi tin dưới danh nghĩa tài khoản hệ thống (admin). */
    public String sendSystemMessage(String roomId, String text) {
        JsonNode node = callAdmin("POST", "/api/v1/chat.sendMessage",
                Map.of("message", Map.of("rid", roomId, "msg", text)), false, false);
        return node.path("message").path("_id").asText();
    }

    /** Đọc lịch sử bằng quyền admin (transcript read-only cho Lễ tân). */
    public List<RcMessage> adminHistory(String roomId, int count, String latest) {
        return parseMessages(callAdmin("GET", historyPath(roomId, count, latest), null, true, false));
    }

    // ------------------------------------------------------------ user

    public String sendMessage(Auth auth, String roomId, String text) {
        JsonNode node = call("POST", "/api/v1/chat.sendMessage", auth,
                Map.of("message", Map.of("rid", roomId, "msg", text)), false);
        return node.path("message").path("_id").asText();
    }

    /** Lịch sử phòng; {@code latest} là mốc thời gian ISO (loại trừ) để phân trang lùi. */
    public List<RcMessage> history(Auth auth, String roomId, int count, String latest) {
        return parseMessages(call("GET", historyPath(roomId, count, latest), auth, null, true));
    }

    /** Số tin chưa đọc theo từng phòng của user. */
    public Map<String, Integer> unreadByRoom(Auth auth) {
        JsonNode node = call("GET", "/api/v1/subscriptions.get", auth, null, true);
        Map<String, Integer> result = new HashMap<>();
        for (JsonNode sub : node.path("update")) {
            // Rocket.Chat 8 có thể để unread = 0 trong khi alert = true (có tin chưa xem): coi là ít nhất 1 tin mới.
            int unread = sub.path("unread").asInt(0);
            result.put(sub.path("rid").asText(), unread > 0 ? unread : sub.path("alert").asBoolean(false) ? 1 : 0);
        }
        return result;
    }

    public void markRead(Auth auth, String roomId) {
        call("POST", "/api/v1/subscriptions.read", auth, Map.of("rid", roomId), true);
    }

    /** Hủy token tạm; lỗi không làm hỏng luồng gọi. */
    public void logout(Auth auth) {
        try {
            call("POST", "/api/v1/logout", auth, null, false);
        } catch (RuntimeException e) {
            log.debug("Rocket.Chat logout bỏ qua: {}", e.getMessage());
        }
    }

    /** Phòng còn tồn tại trên Rocket.Chat không (reconciliation). */
    public boolean roomExists(String roomId) {
        JsonNode node = callAdmin("GET", "/api/v1/groups.info?roomId=" + enc(roomId), null, true, true);
        return node != null && node.path("success").asBoolean(false);
    }

    /** Kiểm tra Rocket.Chat còn sống (dùng cho health/reconciliation). */
    public boolean isAlive() {
        try {
            call("GET", "/api/info", null, null, true);
            return true;
        } catch (RuntimeException e) {
            return false;
        }
    }

    // ------------------------------------------------------------ nội bộ

    private String historyPath(String roomId, int count, String latest) {
        String path = "/api/v1/groups.history?roomId=" + enc(roomId) + "&count=" + count;
        if (latest != null && !latest.isBlank()) {
            path += "&latest=" + enc(latest);
        }
        return path;
    }

    private List<RcMessage> parseMessages(JsonNode node) {
        List<RcMessage> messages = new ArrayList<>();
        for (JsonNode m : node.path("messages")) {
            messages.add(new RcMessage(
                    m.path("_id").asText(),
                    m.path("rid").asText(),
                    m.path("msg").asText(""),
                    m.path("u").path("username").asText(""),
                    m.path("ts").asText(""),
                    m.hasNonNull("t")));
        }
        return messages;
    }

    /** Gọi bằng quyền admin; hết hạn token (401) thì đăng nhập lại một lần. */
    private JsonNode callAdmin(String method, String path, Object body, boolean retryable, boolean allowNotFound) {
        try {
            return callRaw(method, path, adminAuth(), body, retryable);
        } catch (RocketChatHttpException e) {
            if (e.status == 401) {
                resetAdminAuth();
                try {
                    return callRaw(method, path, adminAuth(), body, retryable);
                } catch (RocketChatHttpException again) {
                    throw map(again);
                }
            }
            if (allowNotFound && (e.status == 400 || e.status == 404)) {
                return null;
            }
            throw map(e);
        }
    }

    /** Gọi bằng token người dùng: 401 báo {@link RocketChatUnauthorizedException} để caller làm mới token. */
    private JsonNode call(String method, String path, Auth auth, Object body, boolean retryable) {
        try {
            return callRaw(method, path, auth, body, retryable);
        } catch (RocketChatHttpException e) {
            if (e.status == 401 && auth != null) {
                throw new RocketChatUnauthorizedException();
            }
            throw map(e);
        }
    }

    private JsonNode callRaw(String method, String path, Auth auth, Object body, boolean retryable) {
        int attempts = retryable ? properties.getRocketchat().getMaxRetries() + 1 : 1;
        RuntimeException last = null;
        for (int i = 0; i < attempts; i++) {
            try {
                return execute(method, path, auth, body);
            } catch (RocketChatHttpException e) {
                if (e.status >= 500 && i < attempts - 1) {
                    last = e;
                    continue;
                }
                throw e;
            } catch (IOException e) {
                last = new AppException(ErrorCode.CHAT_UNAVAILABLE);
                log.warn("Rocket.Chat không phản hồi ({} {}): {}", method, path, e.getMessage());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new AppException(ErrorCode.CHAT_UNAVAILABLE);
            }
        }
        if (last instanceof RocketChatHttpException http) {
            throw http;
        }
        throw last;
    }

    private JsonNode execute(String method, String path, Auth auth, Object body)
            throws IOException, InterruptedException {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(properties.getRocketchat().getBaseUrl().replaceAll("/$", "") + path))
                .timeout(Duration.ofMillis(properties.getRocketchat().getReadTimeoutMs()))
                .header("Accept", "application/json");
        if (auth != null) {
            builder.header("X-User-Id", auth.userId()).header("X-Auth-Token", auth.authToken());
        }
        if (body != null) {
            builder.header("Content-Type", "application/json")
                    .method(method, HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(body)));
        } else if ("POST".equals(method)) {
            builder.POST(HttpRequest.BodyPublishers.noBody());
        } else {
            builder.method(method, HttpRequest.BodyPublishers.noBody());
        }
        HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
        JsonNode json = response.body() == null || response.body().isBlank()
                ? objectMapper.createObjectNode()
                : objectMapper.readTree(response.body());
        if (response.statusCode() >= 400) {
            throw new RocketChatHttpException(response.statusCode(), json.path("error").asText(json.path("message").asText("")));
        }
        return json;
    }

    private AppException map(RocketChatHttpException e) {
        log.warn("Rocket.Chat trả lỗi {}: {}", e.status, e.getMessage());
        return new AppException(ErrorCode.CHAT_UNAVAILABLE);
    }

    private static String enc(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    /** Token người dùng đã hết hạn hoặc bị thu hồi. */
    public static class RocketChatUnauthorizedException extends RuntimeException {
        public RocketChatUnauthorizedException() {
            super("Token Rocket.Chat không còn hiệu lực");
        }
    }

    /** Lỗi HTTP nội bộ của client, luôn được ánh xạ sang AppException trước khi ra khỏi lớp này. */
    static class RocketChatHttpException extends RuntimeException {
        final int status;

        RocketChatHttpException(int status, String message) {
            super(message);
            this.status = status;
        }
    }
}
