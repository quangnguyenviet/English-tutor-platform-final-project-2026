package com.mycompany.englishtutor.module.messaging.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.messaging.service.TrialSessionPlanner.WeeklySlot;

import lombok.RequiredArgsConstructor;

/**
 * Kiểm tra khung giờ của một đề xuất có trùng lịch hiện có của gia sư hoặc học sinh không. "Lịch hiện có" gồm ca
 * cố định còn hiệu lực ({@code class_schedules}) và buổi dạy thử sắp tới của các lớp {@code TRIAL}/{@code ACTIVE}.
 */
@Component
@RequiredArgsConstructor
public class ProposalConflictChecker {

    /** Khung giờ đề xuất: lịch cố định (mỗi thứ một khung giờ) và một buổi dạy thử. */
    public record Slot(List<WeeklySlot> weekly, LocalDate trialDate, LocalTime trialFrom, LocalTime trialTo) {}

    private final JdbcTemplate jdbcTemplate;

    public boolean tutorBusy(Long tutorId, Slot slot) {
        return busy("c.tutor_id", tutorId, slot);
    }

    public boolean studentBusy(Long studentId, Slot slot) {
        return busy("c.student_id", studentId, slot);
    }

    /** {@code ownerColumn} chỉ nhận hằng số nội bộ ở trên, không bao giờ từ input người dùng. */
    private boolean busy(String ownerColumn, Long ownerId, Slot s) {
        String days = toPgArray(s.weekly(), WeeklySlot::dayOfWeek);
        String starts = toPgArray(s.weekly(), WeeklySlot::start);
        String ends = toPgArray(s.weekly(), WeeklySlot::end);
        String sql = """
                SELECT EXISTS (
                    -- lịch cố định mới trùng ca cố định còn hiệu lực
                    SELECT 1 FROM classes c JOIN class_schedules cs ON cs.class_id = c.id
                    JOIN unnest(?::int[], ?::time[], ?::time[]) AS n(day, start_time, end_time)
                      ON cs.day_of_week = n.day AND cs.start_time < n.end_time AND cs.end_time > n.start_time
                    WHERE %1$s = ? AND c.status IN ('TRIAL', 'ACTIVE')
                      AND (cs.valid_to IS NULL OR cs.valid_to >= CURRENT_DATE)
                ) OR EXISTS (
                    -- buổi dạy thử mới trùng ca cố định có hiệu lực vào ngày đó
                    SELECT 1 FROM classes c JOIN class_schedules cs ON cs.class_id = c.id
                    WHERE %1$s = ? AND c.status IN ('TRIAL', 'ACTIVE')
                      AND cs.valid_from <= ?::date AND (cs.valid_to IS NULL OR cs.valid_to >= ?::date)
                      AND cs.day_of_week = EXTRACT(ISODOW FROM ?::date)::int
                      AND cs.start_time < ? AND cs.end_time > ?
                ) OR EXISTS (
                    -- buổi dạy thử mới trùng buổi dạy thử khác cùng ngày
                    SELECT 1 FROM classes c
                    WHERE %1$s = ? AND c.status = 'TRIAL' AND c.trial_date = ?::date
                      AND c.trial_start_time < ? AND c.trial_end_time > ?
                ) OR EXISTS (
                    -- lịch cố định mới trùng buổi dạy thử sắp tới
                    SELECT 1 FROM classes c
                    JOIN unnest(?::int[], ?::time[], ?::time[]) AS n(day, start_time, end_time)
                      ON EXTRACT(ISODOW FROM c.trial_date)::int = n.day
                      AND c.trial_start_time < n.end_time AND c.trial_end_time > n.start_time
                    WHERE %1$s = ? AND c.status = 'TRIAL' AND c.trial_date >= CURRENT_DATE
                )
                """.formatted(ownerColumn);
        Boolean busy = jdbcTemplate.queryForObject(sql, Boolean.class,
                days, starts, ends, ownerId,
                ownerId, s.trialDate(), s.trialDate(), s.trialDate(), s.trialTo(), s.trialFrom(),
                ownerId, s.trialDate(), s.trialTo(), s.trialFrom(),
                days, starts, ends, ownerId);
        return Boolean.TRUE.equals(busy);
    }

    private static String toPgArray(List<WeeklySlot> slots, Function<WeeklySlot, Object> field) {
        return slots.stream().map(field).map(String::valueOf).collect(Collectors.joining(",", "{", "}"));
    }
}
