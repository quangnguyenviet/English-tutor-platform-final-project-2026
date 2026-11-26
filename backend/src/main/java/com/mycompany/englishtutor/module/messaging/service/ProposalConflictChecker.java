package com.mycompany.englishtutor.module.messaging.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;

/**
 * Kiểm tra khung giờ của một đề xuất có trùng lịch hiện có của gia sư hoặc học sinh không. "Lịch hiện có" gồm ca
 * cố định còn hiệu lực ({@code class_schedules}) và buổi dạy thử sắp tới của các lớp {@code TRIAL}/{@code ACTIVE}.
 */
@Component
@RequiredArgsConstructor
public class ProposalConflictChecker {

    /** Khung giờ đề xuất: lịch cố định theo thứ (1 = T2 … 7 = CN) và một buổi dạy thử. */
    public record Slot(List<Integer> days, LocalTime scheduleFrom, LocalTime scheduleTo,
                       LocalDate trialDate, LocalTime trialFrom, LocalTime trialTo) {}

    private final JdbcTemplate jdbcTemplate;

    public boolean tutorBusy(Long tutorId, Slot slot) {
        return busy("c.tutor_id", tutorId, slot);
    }

    public boolean studentBusy(Long studentId, Slot slot) {
        return busy("c.student_id", studentId, slot);
    }

    /** {@code ownerColumn} chỉ nhận hằng số nội bộ ở trên, không bao giờ từ input người dùng. */
    private boolean busy(String ownerColumn, Long ownerId, Slot s) {
        String days = "{" + String.join(",", s.days().stream().map(String::valueOf).toList()) + "}";
        String sql = """
                SELECT EXISTS (
                    -- lịch cố định mới trùng ca cố định còn hiệu lực
                    SELECT 1 FROM classes c JOIN class_schedules cs ON cs.class_id = c.id
                    WHERE %1$s = ? AND c.status IN ('TRIAL', 'ACTIVE')
                      AND (cs.valid_to IS NULL OR cs.valid_to >= CURRENT_DATE)
                      AND cs.day_of_week = ANY (?::int[])
                      AND cs.start_time < ? AND cs.end_time > ?
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
                    WHERE %1$s = ? AND c.status = 'TRIAL' AND c.trial_date >= CURRENT_DATE
                      AND EXTRACT(ISODOW FROM c.trial_date)::int = ANY (?::int[])
                      AND c.trial_start_time < ? AND c.trial_end_time > ?
                )
                """.formatted(ownerColumn);
        Boolean busy = jdbcTemplate.queryForObject(sql, Boolean.class,
                ownerId, days, s.scheduleTo(), s.scheduleFrom(),
                ownerId, s.trialDate(), s.trialDate(), s.trialDate(), s.trialTo(), s.trialFrom(),
                ownerId, s.trialDate(), s.trialTo(), s.trialFrom(),
                ownerId, days, s.scheduleTo(), s.scheduleFrom());
        return Boolean.TRUE.equals(busy);
    }
}
