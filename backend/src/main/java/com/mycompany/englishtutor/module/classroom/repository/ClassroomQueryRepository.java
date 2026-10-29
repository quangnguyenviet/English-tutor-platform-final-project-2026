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

import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OnDemandSessionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc/ghi cho module lớp học của gia sư (API_DESIGN mục 3.5, UC-T08 + UC-T09).
 *
 * <p>Bảng {@code classes}, {@code sessions} và {@code class_schedules} chưa có entity
 * JPA nên dùng JdbcTemplate, tương tự module matching. Bản ghi buổi dạy thử là dòng
 * {@code sessions} có {@code is_trial = TRUE}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassroomQueryRepository {

    /** Trạng thái lớp + chủ sở hữu, dùng để kiểm tra quyền trước khi thao tác. */
    public record ClassState(
            Long tutorId,
            Long studentId,
            String status,
            String teachingMode,
            String className,
            String studentName) {}

    /** Một ca dạy của gia sư có khả năng trùng với khung giờ đang chọn (theo ngày cụ thể). */
    public record ConflictInfo(
            Long sessionId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String className,
            String studentName,
            boolean trial) {}

    /** Ca dạy cố định (class_schedules) của lớp ACTIVE khác trùng với ca đang kiểm tra (UC-T09). */
    public record WeeklyConflictInfo(
            Long classId,
            String className,
            String studentName,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate validFrom,
            LocalDate validTo) {}

    /** Biên trên thay thế khi ca mới không có valid_to (mở, không giới hạn). */
    private static final LocalDate NO_END_BOUND = LocalDate.of(9999, 12, 31);

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

    /** Như CONFLICTS_QUERY nhưng giới hạn trong khoảng hiệu lực và loại trừ một lớp (UC-T09). */
    private static final String CONFLICTS_RANGE_QUERY = """
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
              AND c.id <> ?
              AND s.session_date >= ?
              AND (?::date IS NULL OR s.session_date <= ?::date)
              AND s.status IN ('SCHEDULED', 'IN_PROGRESS')
              AND s.start_time < ?
              AND s.end_time > ?
            """;

    private static final String WEEKLY_CONFLICTS_QUERY = """
            SELECT cs.day_of_week,
                   cs.start_time,
                   cs.end_time,
                   cs.valid_from,
                   cs.valid_to,
                   c.id AS class_id,
                   c.class_name,
                   u.full_name AS student_name
            FROM class_schedules cs
            JOIN classes c ON c.id = cs.class_id
            JOIN users u ON u.id = c.student_id
            WHERE c.tutor_id = ?
              AND c.status = 'ACTIVE'
              AND c.id <> ?
              AND cs.day_of_week = ?
              AND cs.start_time < ?
              AND cs.end_time > ?
              AND cs.valid_from <= ?
              AND (cs.valid_to IS NULL OR cs.valid_to >= ?)
            """;

    private static final String SCHEDULES_QUERY = """
            SELECT day_of_week, start_time, end_time, valid_from, valid_to
            FROM class_schedules
            WHERE class_id = ?
            ORDER BY day_of_week, start_time
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

    public Optional<ClassState> findClassState(Long classId) {
        return jdbcTemplate.query(
                        """
                        SELECT c.tutor_id, c.student_id, c.status, c.teaching_mode,
                               c.class_name, u.full_name AS student_name
                        FROM classes c
                        JOIN users u ON u.id = c.student_id
                        WHERE c.id = ?
                        """,
                        (ResultSet rs, int rowNum) -> new ClassState(
                                rs.getLong("tutor_id"),
                                rs.getLong("student_id"),
                                rs.getString("status"),
                                rs.getString("teaching_mode"),
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

    // -------------------------------------------------- UC-T09: LỊCH CỐ ĐỊNH

    /** Lịch dạy cố định của lớp (trống nếu chưa chốt). */
    public List<ScheduleInfo> findSchedules(Long classId) {
        return jdbcTemplate.query(
                SCHEDULES_QUERY,
                (ResultSet rs, int rowNum) ->
                        ScheduleInfo.builder()
                                .dayOfWeek(rs.getInt("day_of_week"))
                                .startTime(rs.getObject("start_time", LocalTime.class))
                                .endTime(rs.getObject("end_time", LocalTime.class))
                                .validFrom(rs.getObject("valid_from", LocalDate.class))
                                .validTo(rs.getObject("valid_to", LocalDate.class))
                                .build(),
                classId);
    }

    public int countSchedules(Long classId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM class_schedules WHERE class_id = ?", Integer.class, classId);
        return count != null ? count : 0;
    }

    /**
     * Ca tuần của lớp ACTIVE khác, cùng gia sư, cùng thứ, giao giờ với ca mới và
     * giao khoảng hiệu lực (UC-T09 bước 4). {@code newValidTo} null được thay bằng
     * biên trên; ca khác không giới hạn (valid_to null) vẫn được xét.
     */
    public List<WeeklyConflictInfo> findWeeklyConflicts(
            Long tutorId,
            int dayOfWeek,
            LocalTime newStart,
            LocalTime newEnd,
            LocalDate newValidFrom,
            LocalDate newValidTo,
            Long excludeClassId) {
        return jdbcTemplate.query(
                WEEKLY_CONFLICTS_QUERY + " ORDER BY cs.start_time, cs.id",
                new WeeklyConflictRowMapper(),
                tutorId,
                excludeClassId,
                dayOfWeek,
                newEnd,
                newStart,
                newValidTo != null ? newValidTo : NO_END_BOUND,
                newValidFrom);
    }

    /**
     * Ca SCHEDULED/IN_PROGRESS (kể cả buổi thử) của gia sư trong khoảng hiệu lực của ca
     * mới ({@code [validFrom, validTo]}, {@code validTo} null = mở), giao giờ với khung
     * đang chọn, thuộc lớp khác ({@code excludeClassId}). Filtering theo thứ trong tuần
     * do service thực hiện (ít dòng nên an toàn).
     */
    public List<ConflictInfo> findSessionConflicts(
            Long tutorId,
            LocalDate validFrom,
            LocalDate validTo,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeClassId) {
        return jdbcTemplate.query(
                CONFLICTS_RANGE_QUERY,
                new ConflictRowMapper(),
                tutorId,
                excludeClassId,
                validFrom,
                validTo,
                validTo,
                endTime,
                startTime);
    }

    /** Ca chính thức (is_trial = FALSE) đã tồn tại tại (class, ngày, giờ bắt đầu) — idempotent. */
    public Optional<OnDemandSessionResponse> findOnDemandSessionAt(
            Long classId, LocalDate date, LocalTime startTime) {
        return jdbcTemplate.query(
                        """
                        SELECT id, session_date, start_time, end_time, status
                        FROM sessions
                        WHERE class_id = ? AND session_date = ? AND start_time = ?
                          AND is_trial = FALSE
                        """,
                        (ResultSet rs, int rowNum) -> OnDemandSessionResponse.builder()
                                .sessionId(rs.getLong("id"))
                                .sessionDate(rs.getObject("session_date", LocalDate.class))
                                .startTime(rs.getObject("start_time", LocalTime.class))
                                .endTime(rs.getObject("end_time", LocalTime.class))
                                .status(rs.getString("status"))
                                .isTrial(Boolean.FALSE)
                                .createdNow(Boolean.FALSE)
                                .build(),
                        classId,
                        date,
                        startTime)
                .stream()
                .findFirst();
    }

    /** Các ngày đã có buổi học chính thức của lớp (để FE render nút "Mở buổi học"). */
    public List<LocalDate> findSessionDates(Long classId) {
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT session_date FROM sessions"
                        + " WHERE class_id = ? AND is_trial = FALSE ORDER BY session_date",
                LocalDate.class,
                classId);
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

    /** Ghi lịch cố định mới (kèm khoảng hiệu lực từng ca) — dùng khi chốt lần đầu. */
    public void insertSchedules(
            Long classId, List<FinalizeScheduleRequest.ScheduleSlot> slots) {
        for (FinalizeScheduleRequest.ScheduleSlot slot : slots) {
            jdbcTemplate.update(
                    """
                    INSERT INTO class_schedules
                        (class_id, day_of_week, start_time, end_time, valid_from, valid_to)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    classId,
                    slot.getDayOfWeek(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    slot.getValidFrom(),
                    slot.getValidTo());
        }
    }

    /** Xóa toàn bộ ca cố định của lớp — bước 1 của cập nhật (ghi đè). */
    public void deleteSchedules(Long classId) {
        jdbcTemplate.update("DELETE FROM class_schedules WHERE class_id = ?", classId);
    }

    /** Tạo buổi học chính thức on-demand đúng ca trong lịch (UC-T09, mục 4.6). */
    public Long insertOnDemandSession(
            Long classId,
            LocalDate date,
            LocalTime startTime,
            LocalTime endTime,
            String teachingMode) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO sessions (
                    class_id, title, session_date, start_time, end_time,
                    is_trial, teaching_mode, status)
                VALUES (?, ?, ?, ?, ?, FALSE, ?, 'SCHEDULED')
                RETURNING id
                """,
                Long.class,
                classId,
                "Buổi học chính thức",
                date,
                startTime,
                endTime,
                normalizeMode(teachingMode));
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

    private static class WeeklyConflictRowMapper implements RowMapper<WeeklyConflictInfo> {
        @Override
        public WeeklyConflictInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new WeeklyConflictInfo(
                    rs.getLong("class_id"),
                    rs.getString("class_name"),
                    rs.getString("student_name"),
                    rs.getInt("day_of_week"),
                    rs.getObject("start_time", LocalTime.class),
                    rs.getObject("end_time", LocalTime.class),
                    rs.getObject("valid_from", LocalDate.class),
                    rs.getObject("valid_to", LocalDate.class));
        }
    }
}
