package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;

/** Kiểm tra logic trùng ca: trùng hẳn, trùng một phần, liền kề và khác ngày. */
class ScheduleConflictCheckerTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 28);

    private static ConflictInfo conflict(LocalDate date, LocalTime start, LocalTime end, boolean trial) {
        return new ConflictInfo(1L, date, start, end, "Tiếng Anh giao tiếp", "Nguyễn Minh Khôi", trial);
    }

    @Test
    void overlaps_sameInterval_shouldReturnTrue() {
        ConflictInfo other = conflict(DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), false);
        assertTrue(ScheduleConflictChecker.overlaps(
                DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), other));
    }

    @Test
    void overlaps_partialIntersection_shouldReturnTrue() {
        ConflictInfo other = conflict(DATE, LocalTime.of(20, 0), LocalTime.of(21, 30), false);
        assertTrue(ScheduleConflictChecker.overlaps(
                DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), other));
    }

    @Test
    void overlaps_adjacentIntervals_shouldReturnFalse() {
        ConflictInfo other = conflict(DATE, LocalTime.of(20, 30), LocalTime.of(21, 30), false);
        assertFalse(ScheduleConflictChecker.overlaps(
                DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), other));
    }

    @Test
    void overlaps_differentDate_shouldReturnFalse() {
        ConflictInfo other = conflict(DATE.plusDays(1), LocalTime.of(19, 0), LocalTime.of(20, 30), false);
        assertFalse(ScheduleConflictChecker.overlaps(
                DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), other));
    }

    @Test
    void describeConflict_shouldContainTrialLabelDateAndClassName() {
        ConflictInfo trial = conflict(DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), true);
        String message = ScheduleConflictChecker.describeConflict(trial);

        assertTrue(message.contains("[Học thử]"));
        assertTrue(message.contains("28/10/2026"));
        assertTrue(message.contains("19:00 - 20:30"));
        assertTrue(message.contains("Tiếng Anh giao tiếp - Nguyễn Minh Khôi"));
    }
}
