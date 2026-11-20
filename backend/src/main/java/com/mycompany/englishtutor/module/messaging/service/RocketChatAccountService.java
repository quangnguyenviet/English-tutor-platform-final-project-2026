package com.mycompany.englishtutor.module.messaging.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.Auth;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.RocketChatUnauthorizedException;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Quản lý tài khoản Rocket.Chat của người dùng: tạo lười khi mở chat lần đầu, username ổn định theo user id,
 * và token tạm chỉ tồn tại trong bộ nhớ backend (hết hạn/đăng xuất thì thu hồi).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RocketChatAccountService {

    private static final long TOKEN_TTL_SECONDS = 20 * 60;

    private record CachedToken(Auth auth, Instant expiresAt) {}

    public record RocketAccount(String rocketUserId, String username) {}

    private final JdbcTemplate jdbcTemplate;
    private final RocketChatClient client;
    private final MessagingProperties properties;
    private final PlatformTransactionManager transactionManager;
    private final ConcurrentHashMap<Long, CachedToken> tokens = new ConcurrentHashMap<>();

    public static String usernameOf(Long userId) {
        return "ep_u" + userId;
    }

    /** Suy ngược user id từ username Rocket.Chat; null nếu không phải tài khoản người dùng. */
    public static Long userIdOf(String username) {
        if (username != null && username.startsWith("ep_u")) {
            try {
                return Long.parseLong(username.substring(4));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public boolean isSystemUsername(String username) {
        return properties.getRocketchat().getAdminUsername().equals(username);
    }

    /** Provision lười: tạo user trên Rocket.Chat và ánh xạ nếu chưa có. */
    public RocketAccount ensureAccount(Long userId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT rocket_user_id, rocket_username FROM rocket_chat_accounts WHERE user_id = ?", userId);
        if (!rows.isEmpty()) {
            return new RocketAccount((String) rows.get(0).get("rocket_user_id"), (String) rows.get(0).get("rocket_username"));
        }
        String fullName = jdbcTemplate.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, userId);
        String username = usernameOf(userId);
        String rocketUserId = client.ensureUser(username, fullName, username + "@chat.englishpath.local");
        // Ghi trong giao dịch riêng: ensureAccount có thể được gọi từ giao dịch chỉ-đọc (vd. liệt kê phòng).
        TransactionTemplate requiresNew = new TransactionTemplate(transactionManager);
        requiresNew.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        requiresNew.executeWithoutResult(status -> jdbcTemplate.update(
                """
                INSERT INTO rocket_chat_accounts (user_id, rocket_user_id, rocket_username)
                VALUES (?, ?, ?) ON CONFLICT (user_id) DO NOTHING
                """,
                userId, rocketUserId, username));
        return new RocketAccount(rocketUserId, username);
    }

    /** Chạy một thao tác bằng token của user; token hết hạn thì làm mới và thử lại một lần. */
    public <T> T withUserAuth(Long userId, Function<Auth, T> action) {
        for (int attempt = 0; attempt < 2; attempt++) {
            Auth auth = authFor(userId);
            try {
                return action.apply(auth);
            } catch (RocketChatUnauthorizedException e) {
                evict(userId);
            }
        }
        throw new AppException(ErrorCode.CHAT_UNAVAILABLE);
    }

    private Auth authFor(Long userId) {
        CachedToken cached = tokens.get(userId);
        if (cached != null && cached.expiresAt().isAfter(Instant.now())) {
            return cached.auth();
        }
        RocketAccount account = ensureAccount(userId);
        Auth auth = client.createUserToken(account.rocketUserId());
        CachedToken previous = tokens.put(userId, new CachedToken(auth, Instant.now().plusSeconds(TOKEN_TTL_SECONDS)));
        if (previous != null) {
            client.logout(previous.auth());
        }
        return auth;
    }

    /** Thu hồi token tạm (đăng xuất hoặc lỗi xác thực). */
    public void evict(Long userId) {
        CachedToken removed = tokens.remove(userId);
        if (removed != null) {
            client.logout(removed.auth());
        }
    }

    @Scheduled(fixedDelay = 5 * 60 * 1000L, initialDelay = 60 * 1000L)
    public void cleanupExpiredTokens() {
        Instant now = Instant.now();
        tokens.forEach((userId, cached) -> {
            if (cached.expiresAt().isBefore(now) && tokens.remove(userId, cached)) {
                client.logout(cached.auth());
            }
        });
    }
}
