package com.mycompany.englishtutor.module.student;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.OffsetDateTime;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.student.api.ReviewRating;
import com.mycompany.englishtutor.module.student.service.SpacedRepetitionScheduler;

class SpacedRepetitionSchedulerTest {

    private final SpacedRepetitionScheduler scheduler = new SpacedRepetitionScheduler();
    private final OffsetDateTime now = OffsetDateTime.parse("2026-11-08T10:00:00+07:00");

    @Test
    void schedulesAllFourRatingsFromServerTime() {
        assertSchedule(ReviewRating.AGAIN, 60);
        assertSchedule(ReviewRating.HARD, 360);
        assertSchedule(ReviewRating.GOOD, 600);
        assertSchedule(ReviewRating.EASY, 432_000);
    }

    private void assertSchedule(ReviewRating rating, int seconds) {
        var result = scheduler.schedule(rating, now);
        assertEquals(seconds, result.intervalSeconds());
        assertEquals(now.plusSeconds(seconds), result.nextReview());
    }
}
