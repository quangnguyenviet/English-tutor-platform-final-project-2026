package com.mycompany.englishtutor.module.messaging.service;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentInfo;

import lombok.RequiredArgsConstructor;

/** Đọc đề xuất từ PostgreSQL và dựng DTO (kèm cờ trùng lịch học sinh). */
@Component
@RequiredArgsConstructor
public class ProposalReader {

    private static final String SELECT = """
            SELECT p.id, p.room_id, p.version, p.status, p.student_id,
                   COALESCE(su.full_name, p.student_name) AS student_name,
                   COALESCE(s.grade, p.student_grade) AS student_grade,
                   COALESCE(s.school, p.student_school) AS student_school,
                   COALESCE(s.learning_goal, p.student_learning_goal) AS student_goal,
                   p.class_type, p.fee_percentage, p.price_per_session, p.schedule_days,
                   p.schedule_time_from, p.schedule_time_to, p.trial_date, p.trial_time_from, p.trial_time_to,
                   p.class_mode, p.learning_address, p.note, p.rejection_reason, p.decided_at, p.created_at, p.expires_at,
                   CASE WHEN p.status = 'ACCEPTED' THEN par.phone END AS parent_phone,
                   (SELECT c.id FROM classes c WHERE c.proposal_id = p.id) AS class_id,
                   (p.status = 'PENDING' AND p.student_id IS NOT NULL AND EXISTS (
                        SELECT 1 FROM class_schedules cs JOIN classes c ON c.id = cs.class_id
                        WHERE c.student_id = p.student_id AND c.status IN ('TRIAL', 'ACTIVE')
                          AND cs.day_of_week = ANY (p.schedule_days)
                          AND cs.start_time < p.schedule_time_to AND cs.end_time > p.schedule_time_from
                   )) AS student_conflict
            FROM proposal_messages p
            JOIN chat_rooms cr ON cr.id = p.room_id
            JOIN parents par ON par.id = cr.parent_id
            LEFT JOIN students s ON s.id = p.student_id
            LEFT JOIN users su ON su.id = s.id
            """;

    private final JdbcTemplate jdbcTemplate;

    public Optional<ProposalItem> findById(Long id) {
        return jdbcTemplate.query(SELECT + " WHERE p.id = ?", this::map, id).stream().findFirst();
    }

    public List<ProposalItem> findByRoom(Long roomId) {
        return jdbcTemplate.query(SELECT + " WHERE p.room_id = ? ORDER BY p.version DESC", this::map, roomId);
    }

    /** Đề xuất theo id tin nhắn Rocket.Chat (thẻ đề xuất nằm trong luồng chat). */
    public List<ProposalItem> findByRocketMessageIds(Collection<String> ids) {
        if (ids.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", ids.stream().map(i -> "?").toList());
        return jdbcTemplate.query(
                SELECT + " WHERE p.rocket_message_id IN (" + placeholders + ")", this::map, ids.toArray());
    }

    public Optional<String> rocketMessageId(Long proposalId) {
        return jdbcTemplate
                .queryForList("SELECT rocket_message_id FROM proposal_messages WHERE id = ?", String.class, proposalId)
                .stream()
                .filter(java.util.Objects::nonNull)
                .findFirst();
    }

    private ProposalItem map(ResultSet rs, int rowNum) throws SQLException {
        Long studentId = rs.getObject("student_id") == null ? null : rs.getLong("student_id");
        Array daysArray = rs.getArray("schedule_days");
        List<Integer> days = new ArrayList<>();
        if (daysArray != null) {
            for (Object o : (Object[]) daysArray.getArray()) {
                days.add(((Number) o).intValue());
            }
        }
        return new ProposalItem(
                rs.getLong("id"),
                rs.getLong("room_id"),
                rs.getInt("version"),
                rs.getString("status"),
                new StudentInfo(studentId, rs.getString("student_name"), rs.getString("student_grade"),
                        rs.getString("student_school"), rs.getString("student_goal"), studentId == null),
                rs.getString("class_type"),
                rs.getBigDecimal("fee_percentage"),
                rs.getBigDecimal("price_per_session"),
                days,
                rs.getString("schedule_time_from"),
                rs.getString("schedule_time_to"),
                rs.getString("trial_date"),
                rs.getString("trial_time_from"),
                rs.getString("trial_time_to"),
                rs.getString("class_mode"),
                rs.getString("note"),
                rs.getString("rejection_reason"),
                rs.getTimestamp("decided_at") == null ? null : rs.getTimestamp("decided_at").toInstant().toString(),
                rs.getTimestamp("created_at").toInstant().toString(),
                rs.getTimestamp("expires_at").toInstant().toString(),
                rs.getObject("class_id") == null ? null : rs.getLong("class_id"),
                rs.getBoolean("student_conflict"),
                rs.getString("learning_address"),
                rs.getString("parent_phone"));
    }
}
