package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.messaging.service.TrialSessionPlanner.TrialSession;
import com.mycompany.englishtutor.module.messaging.service.TrialSessionPlanner.WeeklySlot;

class TrialSessionPlannerTest {

    /** Thứ 5, 26/11/2026 lúc 10:00. */
    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 26, 10, 0);

    private static final LocalDate TODAY = NOW.toLocalDate();

    private static WeeklySlot slot(int day, int startHour) {
        return new WeeklySlot(day, LocalTime.of(startHour, 0), LocalTime.of(startHour + 1, 30));
    }

    private static LocalDate trialDate(LocalDate startDate, WeeklySlot... slots) {
        return TrialSessionPlanner.firstSession(List.of(slots), startDate, NOW).date();
    }

    @Test
    void todayIsUsedWhenSessionHasNotStarted() {
        assertEquals(TODAY, trialDate(TODAY, slot(4, 19)));
    }

    @Test
    void sameWeekdayMovesToNextWeekWhenSessionAlreadyStarted() {
        assertEquals(LocalDate.of(2026, 12, 3), trialDate(TODAY, slot(4, 9)));
    }

    @Test
    void earliestScheduledWeekdayWins() {
        assertEquals(LocalDate.of(2026, 11, 28), trialDate(TODAY, slot(2, 19), slot(6, 19)));
    }

    @Test
    void mondayStartDateMovesToFirstSessionOfThatWeek() {
        assertEquals(LocalDate.of(2026, 12, 8), trialDate(LocalDate.of(2026, 12, 7), slot(2, 19), slot(4, 19)));
    }

    @Test
    void startDateOnScheduledWeekdayIsTheTrialDate() {
        LocalDate thursday = LocalDate.of(2026, 12, 10);

        assertEquals(thursday, trialDate(thursday, slot(2, 19), slot(4, 19)));
    }

    @Test
    void pastStartDateIsCountedFromNow() {
        assertEquals(TODAY, trialDate(LocalDate.of(2026, 11, 9), slot(4, 19)));
    }

    @Test
    void trialUsesTimeOfItsOwnWeekday() {
        TrialSession trial = TrialSessionPlanner.firstSession(
                List.of(slot(2, 19), slot(4, 17)), LocalDate.of(2026, 12, 10), NOW);

        assertEquals(LocalTime.of(17, 0), trial.start());
        assertEquals(LocalTime.of(18, 30), trial.end());
    }

    @Test
    void startDateOutsideScheduleMovesToNextSession() {
        // Thứ 4, 09/12/2026 không có trong lịch nên học thử vào thứ 5.
        assertEquals(LocalDate.of(2026, 12, 10), trialDate(LocalDate.of(2026, 12, 9), slot(2, 19), slot(4, 19)));
    }
}
