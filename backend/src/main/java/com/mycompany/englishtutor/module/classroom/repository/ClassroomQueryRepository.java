package com.mycompany.englishtutor.module.classroom.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc/ghi cho module lớp học của gia sư (API_DESIGN mục 3.5, UC-T08).
 *
 * <p>Bảng {@code classes} và {@code sessions} chưa có entity JPA nên dùng JdbcTemplate,
 * tương tự module matching. Bản ghi buổi dạy thử là dòng {@code sessions} có
 * {@code is_trial = TRUE}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassroomQueryRepository {

    /** Trạng thái lớp + chủ sở hữu, dùng để kiểm tra quyền trước khi thao tác. */
    public record ClassState(Long tutorId, String status, String className, String studentName) {}

    /** Một ca dạy của gia sư có khả năng trùng với khung giờ đang chọn. */
    public record ConflictInfo(
            Long sessionId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String className,
            String studentName,
            boolean trial) {}

    private static final String MY_CLASSES_BASE = """
            SELECT c.id AS class_id,
                   c.class_name,
                   c.status AS class_status,
                   c.teaching_mode AS class_mode,
                   c.price_per_session,
                   c.created_at,
                   u.full_name AS student_name,
                   s.id AS trial_id,
                   s.session_date AS trial_date,
                   s.start_time AS trial_start,
                   s.end_time AS trial_end,
                   s.teaching_mode AS trial_mode,
                   s.meeting_url AS trial_meeting_url,
                   s.location AS trial_location,
                   s.status AS trial_status
            FROM classes c
            JOIN users u ON u.id = c.student_id
            LEFT JOIN sessions s ON s.class_id = c.id AND s.is_trial = TRUE
            WHERE c.tutor_id = ?
            """;

    private static final String CLASS_DETAIL_QUERY = """
            SELECT c.id AS class_id,
                   c.class_name,
                   c.status AS class_status,
                   c.teaching_mode AS class_mode,
                   c.price_per_session,
                   c.active_from,
                   c.created_at,
                   u.full_name AS student_name,
                   st.school,
                   st.grade,
                   st.learning_goal,
                   s.id AS trial_id,
                   s.session_date AS trial_date,
                   s.start_time AS trial_start,
                   s.end_time AS trial_end,
                   s.teaching_mode AS trial_mode,
                   s.meeting_url AS trial_meeting_url,
                   s.location AS trial_location,
                   s.status AS trial_status
            FROM classes c
            JOIN users u ON u.id = c.student_id
            JOIN students st ON st.id = c.student_id
            LEFT JOIN sessions s ON s.class_id = c.id AND s.is_trial = TRUE
            WHERE c.id = ? AND c.tutor_id = ?
            """;

    private static final String TRIAL_SESSION_QUERY = """
            SELECT id,
                   session_date,
                   start_time,
                   end_time,
                   teaching_mode,
                   meeting_url,
                   location,
                   status
            FROM sessions
            WHERE class_id = ? AND is_trial = TRUE
            """;

    private static final String CONFLICTS_QUERY = """
            SELECT s.id AS session_id,
                   s.session_date,
                   s.start_time,
                   s.end_time,
                   c.class_name,
                   u.full_name AS student_name,
                   s.is_trial
            FROM sessions s
            JOIN classes c ON c.id = s.class_id
            JOIN users u ON u.id = c.student_id
            WHERE c.tutor_id = ?
              AND s.session_date = ?
              AND s.status IN ('SCHEDULED', 'IN_PROGRESS')
              AND s.start_time < ?
              AND s.end_time > ?
            """;

    JdbcTemplate jdbcTemplate;

    // ------------------------------------------------------------------ READ

    public List<ClassSummaryResponse> findMyClasses(Long tutorId, String status) {
        boolean filtered = status != null;
        String sql = MY_CLASSES_BASE + (filtered ? " AND c.status = ?" : "")
                + " ORDER BY c.created_at DESC, c.id DESC";
        List<Object> params = new ArrayList<>();
        params.add(tutorId);
        if (filtered) {
            params.add(status);
        }
        return jdbcTemplate.query(sql, new ClassSummaryRowMapper(), params.toArray());
    }

    public Optional<ClassDetailResponse> findClassDetail(Long classId, Long tutorId) {
        return jdbcTemplate.query(CLASS_DETAIL_QUERY, new ClassDetailRowMapper(), classId, tutorId)
                .stream()
                .findFirst();
    }

    public boolean classExists(Long classId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM classes WHERE id = ?", Integer.class, classId);
        return count != null && count > 0;
    }

    public Optional<ClassState> findClassState(Long classId) {
        return jdbcTemplate.query(
                        """
                        SELECT c.tutor_id, c.status, c.class_name, u.full_name AS student_name
                        FROM classes c
                        JOIN users u ON u.id = c.student_id
                        WHERE c.id = ?
                        """,
                        (ResultSet rs, int rowNum) -> new ClassState(
                                rs.getLong("tutor_id"),
                                rs.getString("status"),
                                rs.getString("class_name"),
                                rs.getString("student_name")),
                        classId)
                .stream()
                .findFirst();
    }

    public Optional<TrialSessionResponse> findTrialSession(Long classId) {
        return jdbcTemplate.query(TRIAL_SESSION_QUERY, new TrialSessionRowMapper(), classId)
                .stream()
                .findFirst();
    }

    /** Các ca SCHEDULED/IN_PROGRESS của gia sư giao khoảng thời gian với khung giờ đang chọn. */
    public List<ConflictInfo> findConflicts(
            Long tutorId, LocalDate sessionDate, LocalTime startTime, LocalTime endTime) {
        return jdbcTemplate.query(
                CONFLICTS_QUERY + " ORDER BY s.start_time, s.id",
                new ConflictRowMapper(),
                tutorId,
                sessionDate,
                endTime,
                startTime);
    }

    /** Như {@link #findConflicts} nhưng loại trừ chính buổi đang sửa (PUT). */
    public List<ConflictInfo> findConflictsExcluding(
            Long tutorId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeSessionId) {
        return jdbcTemplate.query(
                CONFLICTS_QUERY + " AND s.id <> ? ORDER BY s.start_time, s.id",
                new ConflictRowMapper(),
                tutorId,
                sessionDate,
                endTime,
                startTime,
                excludeSessionId);
    }

    // ----------------------------------------------------------------- WRITE

    public Long insertTrialSession(Long classId, UpsertTrialSessionRequest request) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO sessions (
                    class_id, title, session_date, start_time, end_time,
                    is_trial, teaching_mode, meeting_url, location, status)
                VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?, 'SCHEDULED')
                RETURNING id
                """,
                Long.class,
                classId,
                "Buổi học thử",
                request.getSessionDate(),
                request.getStartTime(),
                request.getEndTime(),
                normalizeMode(request.getTeachingMode()),
                trimToNull(request.getMeetingUrl()),
                trimToNull(request.getLocation()));
    }

    public void updateTrialSession(Long sessionId, UpsertTrialSessionRequest request) {
        jdbcTemplate.update(
                """
                UPDATE sessions
                SET session_date = ?, start_time = ?, end_time = ?, teaching_mode = ?,
                    meeting_url = ?, location = ?
                WHERE id = ?
                """,
                request.getSessionDate(),
                request.getStartTime(),
                request.getEndTime(),
                normalizeMode(request.getTeachingMode()),
                trimToNull(request.getMeetingUrl()),
                trimToNull(request.getLocation()),
                sessionId);
    }

    // --------------------------------------------------------------- HELPERS

    public static String normalizeMode(String teachingMode) {
        return teachingMode.trim().toUpperCase();
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static TrialSessionResponse mapTrialSession(ResultSet rs) throws SQLException {
        Object trialId = rs.getObject("trial_id");
        if (trialId == null) {
            return null;
        }
        return TrialSessionResponse.builder()
                .sessionId(((Number) trialId).longValue())
                .sessionDate(rs.getObject("trial_date", LocalDate.class))
                .startTime(rs.getObject("trial_start", LocalTime.class))
                .endTime(rs.getObject("trial_end", LocalTime.class))
                .teachingMode(rs.getString("trial_mode"))
                .meetingUrl(rs.getString("trial_meeting_url"))
                .location(rs.getString("trial_location"))
                .status(rs.getString("trial_status"))
                .build();
    }

    private static class ClassSummaryRowMapper implements RowMapper<ClassSummaryResponse> {
        @Override
        public ClassSummaryResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            return ClassSummaryResponse.builder()
                    .classId(rs.getLong("class_id"))
                    .className(rs.getString("class_name"))
                    .studentName(rs.getString("student_name"))
                    .teachingMode(rs.getString("class_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .status(rs.getString("class_status"))
                    .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                    .trialSession(mapTrialSession(rs))
                    .build();
        }
    }

    private static class ClassDetailRowMapper implements RowMapper<ClassDetailResponse> {
        @Override
        public ClassDetailResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            return ClassDetailResponse.builder()
                    .classId(rs.getLong("class_id"))
                    .className(rs.getString("class_name"))
                    .status(rs.getString("class_status"))
                    .teachingMode(rs.getString("class_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .activeFrom(rs.getObject("active_from", LocalDate.class))
                    .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                    .studentName(rs.getString("student_name"))
                    .school(rs.getString("school"))
                    .grade(rs.getString("grade"))
                    .learningGoal(rs.getString("learning_goal"))
                    .trialSession(mapTrialSession(rs))
                    .build();
        }
    }

    private static class TrialSessionRowMapper implements RowMapper<TrialSessionResponse> {
        @Override
        public TrialSessionResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            return TrialSessionResponse.builder()
                    .sessionId(rs.getLong("id"))
                    .sessionDate(rs.getObject("session_date", LocalDate.class))
                    .startTime(rs.getObject("start_time", LocalTime.class))
                    .endTime(rs.getObject("end_time", LocalTime.class))
                    .teachingMode(rs.getString("teaching_mode"))
                    .meetingUrl(rs.getString("meeting_url"))
                    .location(rs.getString("location"))
                    .status(rs.getString("status"))
                    .build();
        }
    }

    private static class ConflictRowMapper implements RowMapper<ConflictInfo> {
        @Override
        public ConflictInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ConflictInfo(
                    rs.getLong("session_id"),
                    rs.getObject("session_date", LocalDate.class),
                    rs.getObject("start_time", LocalTime.class),
                    rs.getObject("end_time", LocalTime.class),
                    rs.getString("class_name"),
                    rs.getString("student_name"),
                    rs.getBoolean("is_trial"));
        }
    }
}
