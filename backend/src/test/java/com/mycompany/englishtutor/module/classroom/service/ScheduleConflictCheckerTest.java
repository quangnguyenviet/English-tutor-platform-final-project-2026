package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalDate;
import java.time.LocalTime;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictSlotInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;

/** Kiểm tra thông điệp cảnh báo trùng ca (V16: ca cố định + ca thử). */
class ScheduleConflictCheckerTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 28);

    private static ConflictSlotInfo slotConflict(LocalDate date, LocalTime start, LocalTime end, boolean trial) {
        return new ConflictSlotInfo(1L, date, start, end, "Tiếng Anh giao tiếp", "Nguyễn Minh Khôi", trial);
    }

    @Test
    void describeConflict_trialSlot_shouldContainTrialLabelDateAndClassName() {
        ConflictSlotInfo trial = slotConflict(DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), true);
        String message = ScheduleConflictChecker.describeConflict(trial);

        assertTrue(message.contains("[Học thử]"));
        assertTrue(message.contains("28/10/2026"));
        assertTrue(message.contains("19:00 - 20:30"));
        assertTrue(message.contains("Tiếng Anh giao tiếp - Nguyễn Minh Khôi"));
    }

    @Test
    void describeConflict_fixedSlot_noTrialLabel() {
        ConflictSlotInfo fixed = slotConflict(DATE, LocalTime.of(19, 0), LocalTime.of(20, 30), false);
        String message = ScheduleConflictChecker.describeConflict(fixed);

        assertTrue(message.contains("28/10/2026"));
        assertTrue(message.contains("19:00 - 20:30"));
        assertTrue(message.contains("Tiếng Anh giao tiếp - Nguyễn Minh Khôi"));
        assertTrue(!message.contains("[Học thử]"));
    }

    @Test
    void describeWeeklyConflict_shouldContainDayLabelTimesAndValidity() {
        WeeklyConflictInfo conflict = new WeeklyConflictInfo(
                2L, "IELTS 1 kèm 1", "Lê Hoàng Nam", 3,
                LocalTime.of(19, 30), LocalTime.of(21, 0), DATE, null);
        String message = ScheduleConflictChecker.describeWeeklyConflict(conflict);

        assertTrue(message.contains("Thứ 4"));
        assertTrue(message.contains("19:30 - 21:00"));
        assertTrue(message.contains("IELTS 1 kèm 1 - Lê Hoàng Nam"));
        assertTrue(message.contains("hiệu lực từ " + "28/10/2026"));
    }

    @Test
    void dayLabel_shouldMapIsoDayOfWeek() {
        assertEquals("Thứ 2", ScheduleConflictChecker.dayLabel(1));
        assertEquals("Chủ nhật", ScheduleConflictChecker.dayLabel(7));
    }
}
