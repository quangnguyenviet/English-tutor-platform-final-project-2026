package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

class TrialSessionPlannerTest {

    /** Thứ 5, 26/11/2026 lúc 10:00. */
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 26, 10, 0);

    @Test
    void todayIsUsedWhenSessionHasNotStarted() {
        assertEquals(LocalDate.of(2026, 11, 26),
                TrialSessionPlanner.firstSessionDate(List.of(4), LocalTime.of(19, 0), NOW));
    }

    @Test
    void sameWeekdayMovesToNextWeekWhenSessionAlreadyStarted() {
        assertEquals(LocalDate.of(2026, 12, 3),
                TrialSessionPlanner.firstSessionDate(List.of(4), LocalTime.of(9, 0), NOW));
    }

    @Test
    void earliestScheduledWeekdayWins() {
        assertEquals(LocalDate.of(2026, 11, 28),
                TrialSessionPlanner.firstSessionDate(List.of(2, 6), LocalTime.of(19, 0), NOW));
    }
}
