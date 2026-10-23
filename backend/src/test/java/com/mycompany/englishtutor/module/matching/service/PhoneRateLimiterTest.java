package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

/** Unit test giới hạn 5 request / giờ / SĐT. */
class PhoneRateLimiterTest {

    /** Đồng hồ giả để dịch chuyển thời gian trong test. */
    static class MutableClock extends Clock {
        private Instant now = Instant.parse("2026-10-23T03:00:00Z");

        void advance(Duration duration) {
            now = now.plus(duration);
        }

        @Override
        public ZoneOffset getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(java.time.ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return now;
        }
    }

    @Test
    void sixthRequestWithinAnHour_isRejected() {
        PhoneRateLimiter limiter = new PhoneRateLimiter(new MutableClock());

        for (int i = 0; i < 5; i++) {
            assertTrue(limiter.tryAcquire("0912345678"), "request " + (i + 1) + " phải được chấp nhận");
        }
        assertFalse(limiter.tryAcquire("0912345678"));
    }

    @Test
    void otherPhone_isCountedSeparately() {
        PhoneRateLimiter limiter = new PhoneRateLimiter(new MutableClock());
        for (int i = 0; i < 5; i++) {
            limiter.tryAcquire("0912345678");
        }

        assertTrue(limiter.tryAcquire("0987654321"));
    }

    @Test
    void afterWindowPasses_phoneCanSendAgain() {
        MutableClock clock = new MutableClock();
        PhoneRateLimiter limiter = new PhoneRateLimiter(clock);
        for (int i = 0; i < 5; i++) {
            limiter.tryAcquire("0912345678");
        }
        assertFalse(limiter.tryAcquire("0912345678"));

        clock.advance(Duration.ofMinutes(61));

        assertTrue(limiter.tryAcquire("0912345678"));
    }
}
