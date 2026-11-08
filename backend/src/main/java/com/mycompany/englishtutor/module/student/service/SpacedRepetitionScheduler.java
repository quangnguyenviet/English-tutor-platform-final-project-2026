package com.mycompany.englishtutor.module.student.service;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.student.api.ReviewRating;

/** Quy tắc lịch ôn FR-22. Mốc thời gian luôn do server quyết định. */
@Component
public class SpacedRepetitionScheduler {

    public record Schedule(int intervalSeconds, OffsetDateTime nextReview) {}

    public Schedule schedule(ReviewRating rating, OffsetDateTime now) {
        int seconds = switch (rating) {
            case AGAIN -> 60;
            case HARD -> 6 * 60;
            case GOOD -> 10 * 60;
            case EASY -> 5 * 24 * 60 * 60;
        };
        return new Schedule(seconds, now.plusSeconds(seconds));
    }
}
