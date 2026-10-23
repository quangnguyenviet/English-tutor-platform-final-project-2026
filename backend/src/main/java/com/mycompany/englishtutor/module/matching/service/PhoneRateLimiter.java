package com.mycompany.englishtutor.module.matching.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Component;

/**
 * Giới hạn số yêu cầu công khai theo SĐT trong cửa sổ trượt, lưu trong bộ nhớ (mất khi khởi động lại backend).
 */
@Component
public class PhoneRateLimiter {
    static final int MAX_REQUESTS = 5;
    static final Duration WINDOW = Duration.ofHours(1);

    private final Clock clock;
    private final Map<String, Deque<Instant>> hits = new ConcurrentHashMap<>();

    public PhoneRateLimiter() {
        this(Clock.systemUTC());
    }

    PhoneRateLimiter(Clock clock) {
        this.clock = clock;
    }

    /** Ghi nhận một yêu cầu; trả về {@code false} (và không ghi) nếu SĐT đã đạt giới hạn trong cửa sổ. */
    public boolean tryAcquire(String phone) {
        Instant now = clock.instant();
        Instant windowStart = now.minus(WINDOW);
        boolean[] allowed = {false};

        hits.compute(phone, (key, queue) -> {
            Deque<Instant> deque = queue == null ? new ArrayDeque<>() : queue;
            while (!deque.isEmpty() && !deque.peekFirst().isAfter(windowStart)) {
                deque.pollFirst();
            }
            if (deque.size() < MAX_REQUESTS) {
                deque.addLast(now);
                allowed[0] = true;
            }
            return deque;
        });

        if (hits.size() > 10_000) {
            hits.entrySet().removeIf(entry -> {
                Deque<Instant> deque = entry.getValue();
                synchronized (deque) {
                    return deque.isEmpty() || !deque.peekLast().isAfter(windowStart);
                }
            });
        }
        return allowed[0];
    }
}
