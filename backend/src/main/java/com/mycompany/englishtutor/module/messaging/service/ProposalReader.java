package com.mycompany.englishtutor.module.messaging.service;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentInfo;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;

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
                   p.schedule_time_from, p.schedule_time_to,
                   COALESCE(tc.trial_date, p.trial_date) AS trial_date,
                   COALESCE(tc.trial_start_time, p.trial_time_from) AS trial_time_from,
                   COALESCE(tc.trial_end_time, p.trial_time_to) AS trial_time_to,
                   NULLIF(concat_ws(', ', NULLIF(par.ward, ''), NULLIF(par.province, '')), '') AS learning_area,
                   p.class_mode, p.learning_address, p.note, p.rejection_reason, p.decided_at, p.created_at, p.expires_at,
                   CASE WHEN p.status = 'ACCEPTED' THEN par.phone END AS parent_phone,
                   tc.id AS class_id,
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
            LEFT JOIN classes tc ON tc.proposal_id = p.id
            """;

    private final JdbcTemplate jdbcTemplate;

    public Optional<ProposalItem> findById(Long id, Viewer viewer) {
        return jdbcTemplate.query(SELECT + " WHERE p.id = ?", mapper(viewer), id).stream().findFirst();
    }

    public List<ProposalItem> findByRoom(Long roomId, Viewer viewer) {
        return jdbcTemplate.query(SELECT + " WHERE p.room_id = ? ORDER BY p.version DESC", mapper(viewer), roomId);
    }

    /** Đề xuất theo id tin nhắn Rocket.Chat (thẻ đề xuất nằm trong luồng chat). */
    public List<ProposalItem> findByRocketMessageIds(Collection<String> ids, Viewer viewer) {
        if (ids.isEmpty()) {
            return List.of();
        }
        String placeholders = String.join(",", ids.stream().map(i -> "?").toList());
        return jdbcTemplate.query(
                SELECT + " WHERE p.rocket_message_id IN (" + placeholders + ")", mapper(viewer), ids.toArray());
    }

    public Optional<String> rocketMessageId(Long proposalId) {
        return jdbcTemplate
                .queryForList("SELECT rocket_message_id FROM proposal_messages WHERE id = ?", String.class, proposalId)
                .stream()
                .filter(java.util.Objects::nonNull)
                .findFirst();
    }

    private RowMapper<ProposalItem> mapper(Viewer viewer) {
        return (rs, rowNum) -> map(rs, viewer);
    }

    private ProposalItem map(ResultSet rs, Viewer viewer) throws SQLException {
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
                visibleAddress(rs, viewer),
                rs.getString("parent_phone"));
    }

    /** Gia sư chỉ thấy phường/xã, tỉnh/thành; địa chỉ chi tiết chỉ dành cho phụ huynh và nhân viên. */
    private static String visibleAddress(ResultSet rs, Viewer viewer) throws SQLException {
        String address = rs.getString("learning_address");
        if (address == null || viewer != Viewer.TUTOR) {
            return address;
        }
        return rs.getString("learning_area");
    }
}
