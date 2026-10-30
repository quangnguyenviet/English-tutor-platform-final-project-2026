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
import com.mycompany.englishtutor.module.classroom.api.response.SessionListItem;
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

    // ----------------------------- RECORDS: OCCURRENCE & SESSION (T7-B4)

    /** Ca cố định kèm id (dùng cho overlay exception, V13). */
    public record ScheduleSlotRow(
            Long scheduleId,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate validFrom,
            LocalDate validTo) {}

    /** Một ngoại lệ (session_exceptions) gắn với ca cụ thể tại một ngày. */
    public record SessionExceptionRow(
            Long id,
            Long classId,
            Long scheduleId,
            LocalDate exceptionDate,
            String exceptionType,
            LocalDate newDate,
            LocalTime newStartTime,
            LocalTime newEndTime,
            String newTeachingMode,
            String newMeetingUrl,
            String newLocation,
            String reason,
            Long createdBy,
            OffsetDateTime createdAt) {}

    /** Buổi học thật (non-trial) thuộc 1 lần diễn của ca — ô "SESSION" trong lattice. */
    public record OccurrenceSessionRow(
            Long sessionId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String title,
            String status,
            String teachingMode,
            String meetingUrl,
            String location,
            boolean hasLog) {}

    /** Chi tiết buổi học (mục 4.5, JOIN tên lớp/học sinh/gia sư + ROW_NUMBER). */
    public record SessionDetailRow(
            Long sessionId,
            int sessionNumber,
            Long classId,
            String className,
            String studentName,
            String tutorName,
            String title,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            boolean isTrial,
            String teachingMode,
            String meetingUrl,
            String location,
            String status,
            String logKnowledge,
            String logHomework) {}

    /** Row nội bộ cho UPDATE sessions động (trường null = giữ nguyên, mục 4.6). */
    public record SessionInfoUpdate(
            String title,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String teachingMode,
            String meetingUrl,
            String location) {}

    /**
     * Buổi học đang khóa (SELECT ... FOR UPDATE), kèm chủ sở hữu lớp và 2 log
     * — đủ thông tin cho validate quyền / state machine / "lần đầu lưu log".
     */
    public record LockedSessionRow(
            Long sessionId,
            Long classId,
            Long tutorId,
            Long studentId,
            String className,
            String studentName,
            String title,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String teachingMode,
            String meetingUrl,
            String location,
            String status,
            String logKnowledge,
            String logHomework) {}

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

    // ------------------------------------------------- T7-B4: OCCURRENCE (lattice)

    /** Ca cố định của lớp kèm id (overlay exception cần {@code schedule_id}). */
    public List<ScheduleSlotRow> findScheduleSlotsWithIds(Long classId) {
        return jdbcTemplate.query(
                        """
                        SELECT id, day_of_week, start_time, end_time, valid_from, valid_to
                        FROM class_schedules
                        WHERE class_id = ?
                        ORDER BY day_of_week, start_time, id
                        """,
                        (ResultSet rs, int rowNum) ->
                                new ScheduleSlotRow(
                                        rs.getLong("id"),
                                        rs.getInt("day_of_week"),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getObject("valid_from", LocalDate.class),
                                        rs.getObject("valid_to", LocalDate.class)),
                        classId)
                .stream()
                .toList();
    }

    /** Một ca cụ thể (check thuộc lớp + khoảng hiệu lực khi ghi exception, mục 4.2 bước 1). */
    public Optional<ScheduleSlotRow> findScheduleSlot(Long classId, Long scheduleId) {
        return jdbcTemplate.query(
                        """
                        SELECT id, day_of_week, start_time, end_time, valid_from, valid_to
                        FROM class_schedules
                        WHERE class_id = ? AND id = ?
                        """,
                        (ResultSet rs, int rowNum) ->
                                new ScheduleSlotRow(
                                        rs.getLong("id"),
                                        rs.getInt("day_of_week"),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getObject("valid_from", LocalDate.class),
                                        rs.getObject("valid_to", LocalDate.class)),
                        classId,
                        scheduleId)
                .stream()
                .findFirst();
    }

    /**
     * Buổi chính thức (ô "SESSION" trong lattice) của lớp trong 7 ngày
     * {@code [weekStart, weekStart+7)} — đọc index {@code idx_sessions_class_date}.
     */
    public List<OccurrenceSessionRow> findWeekSessions(Long classId, LocalDate weekStart) {
        return jdbcTemplate.query(
                        """
                        SELECT id, session_date, start_time, end_time, title, status,
                               teaching_mode, meeting_url, location,
                               (log_knowledge IS NOT NULL OR log_homework IS NOT NULL) AS has_log
                        FROM sessions
                        WHERE class_id = ? AND is_trial = FALSE
                          AND session_date >= ? AND session_date < ?
                        ORDER BY session_date, start_time, id
                        """,
                        (ResultSet rs, int rowNum) ->
                                new OccurrenceSessionRow(
                                        rs.getLong("id"),
                                        rs.getObject("session_date", LocalDate.class),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getString("title"),
                                        rs.getString("status"),
                                        rs.getString("teaching_mode"),
                                        rs.getString("meeting_url"),
                                        rs.getString("location"),
                                        rs.getBoolean("has_log")),
                        classId,
                        weekStart,
                        weekStart.plusDays(7))
                .stream()
                .toList();
    }

    /**
     * Ngoại lệ (ô "EXCEPTION" trong lattice) của lớp trong 7 ngày
     * {@code [weekStart, weekStart+7)} — đọc index {@code idx_session_exceptions_class_date}.
     */
    public List<SessionExceptionRow> findWeekExceptions(Long classId, LocalDate weekStart) {
        return jdbcTemplate.query(
                        """
                        SELECT id, class_id, schedule_id, exception_date, exception_type,
                               new_date, new_start_time, new_end_time, new_teaching_mode,
                               new_meeting_url, new_location, reason, created_by, created_at
                        FROM session_exceptions
                        WHERE class_id = ? AND exception_date >= ? AND exception_date < ?
                        ORDER BY exception_date, schedule_id
                        """,
                        new SessionExceptionRowMapper(),
                        classId,
                        weekStart,
                        weekStart.plusDays(7))
                .stream()
                .toList();
    }

    /** Buổi chính thức (nếu có) tại đúng (lớp, ngày, giờ bắt đầu) — check ô đã "vật chất hóa". */
    public Optional<OccurrenceSessionRow> findOccurrenceSession(
            Long classId, LocalDate date, LocalTime startTime) {
        return jdbcTemplate.query(
                        """
                        SELECT id, session_date, start_time, end_time, title, status,
                               teaching_mode, meeting_url, location,
                               (log_knowledge IS NOT NULL OR log_homework IS NOT NULL) AS has_log
                        FROM sessions
                        WHERE class_id = ? AND is_trial = FALSE
                          AND session_date = ? AND start_time = ?
                        ORDER BY id
                        """,
                        (ResultSet rs, int rowNum) ->
                                new OccurrenceSessionRow(
                                        rs.getLong("id"),
                                        rs.getObject("session_date", LocalDate.class),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getString("title"),
                                        rs.getString("status"),
                                        rs.getString("teaching_mode"),
                                        rs.getString("meeting_url"),
                                        rs.getString("location"),
                                        rs.getBoolean("has_log")),
                        classId,
                        date,
                        startTime)
                .stream()
                .findFirst();
    }

    // ------------------------------------------------------- T7-B4: EXCEPTION

    /** Ngoại lệ hiện có của ô (check ghi đè → audit CREATE hay UPDATE, mục 4.2 bước 5). */
    public Optional<SessionExceptionRow> findSessionException(Long scheduleId, LocalDate date) {
        return jdbcTemplate.query(
                        """
                        SELECT id, class_id, schedule_id, exception_date, exception_type,
                               new_date, new_start_time, new_end_time, new_teaching_mode,
                               new_meeting_url, new_location, reason, created_by, created_at
                        FROM session_exceptions
                        WHERE schedule_id = ? AND exception_date = ?
                        """,
                        new SessionExceptionRowMapper(),
                        scheduleId,
                        date)
                .stream()
                .findFirst();
    }

    /**
     * Ghi đè ngoại lệ của ô (R4: UNIQUE {@code uq_session_exceptions} +
     * ON CONFLICT DO UPDATE = upsert idempotent). Trả về id.
     */
    public Long upsertSessionException(
            Long classId,
            Long scheduleId,
            LocalDate exceptionDate,
            String exceptionType,
            LocalDate newDate,
            LocalTime newStartTime,
            LocalTime newEndTime,
            String newTeachingMode,
            String newMeetingUrl,
            String newLocation,
            String reason,
            Long createdBy) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO session_exceptions (
                    class_id, schedule_id, exception_date, exception_type,
                    new_date, new_start_time, new_end_time,
                    new_teaching_mode, new_meeting_url, new_location,
                    reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (schedule_id, exception_date) DO UPDATE SET
                    exception_type = EXCLUDED.exception_type,
                    new_date = EXCLUDED.new_date,
                    new_start_time = EXCLUDED.new_start_time,
                    new_end_time = EXCLUDED.new_end_time,
                    new_teaching_mode = EXCLUDED.new_teaching_mode,
                    new_meeting_url = EXCLUDED.new_meeting_url,
                    new_location = EXCLUDED.new_location,
                    reason = EXCLUDED.reason,
                    created_by = EXCLUDED.created_by
                RETURNING id
                """,
                Long.class,
                classId,
                scheduleId,
                exceptionDate,
                exceptionType,
                newDate,
                newStartTime,
                newEndTime,
                newTeachingMode,
                newMeetingUrl,
                newLocation,
                reason,
                createdBy);
    }

    /** Xóa ngoại lệ của ô (mục 4.3 / vật chất hóa mục 1.8) — 0 nếu không có. */
    public int deleteSessionException(Long scheduleId, LocalDate date) {
        return jdbcTemplate.update(
                "DELETE FROM session_exceptions WHERE schedule_id = ? AND exception_date = ?",
                scheduleId,
                date);
    }

    // ------------------------------------------------- T7-B4: SESSION THẬT

    /**
     * Danh sách buổi của lớp (mục 4.4): ROW_NUMBER trên toàn bộ buổi (kể cả trial),
     * lọc trạng thái ở lớp ngoài để số thứ tự không nhảy. {@code status} null = không lọc.
     */
    public List<SessionListItem> findSessionList(Long classId, String status, boolean descending) {
        boolean filtered = status != null;
        return jdbcTemplate.query(
                """
                SELECT x.session_id, x.session_number, x.title, x.session_date,
                       x.start_time, x.end_time, x.is_trial, x.teaching_mode,
                       x.meeting_url, x.location, x.status, x.has_log
                FROM (
                  SELECT s.id AS session_id, s.title, s.session_date, s.start_time, s.end_time,
                         s.is_trial, s.teaching_mode, s.meeting_url, s.location, s.status,
                         (s.log_knowledge IS NOT NULL OR s.log_homework IS NOT NULL) AS has_log,
                         ROW_NUMBER() OVER (PARTITION BY s.class_id
                                            ORDER BY s.session_date, s.start_time, s.id)
                             AS session_number
                  FROM sessions s
                  WHERE s.class_id = ?
                ) x
                WHERE (
                """
                        + (filtered ? "x.status = ?" : "TRUE")
                        + ") ORDER BY x.session_number "
                        + (descending ? "DESC" : "ASC")
                        + ", x.session_id "
                        + (descending ? "DESC" : "ASC"),
                new SessionListItemRowMapper(),
                filtered ? new Object[] {classId, status} : new Object[] {classId});
    }

    /** Khóa row buổi (FOR UPDATE) kèm chủ sở hữu lớp, dùng cho sửa/dời/đổi trạng thái/lưu log. */
    public Optional<LockedSessionRow> lockSession(Long sessionId) {
        return jdbcTemplate.query(
                        """
                        SELECT s.id, s.class_id, c.tutor_id, c.student_id, c.class_name,
                               u.full_name AS student_name,
                               s.title, s.session_date, s.start_time, s.end_time,
                               s.teaching_mode, s.meeting_url, s.location,
                               s.status, s.log_knowledge, s.log_homework
                        FROM sessions s
                        JOIN classes c ON c.id = s.class_id
                        JOIN users u ON u.id = c.student_id
                        WHERE s.id = ?
                        FOR UPDATE
                        """,
                        (ResultSet rs, int rowNum) ->
                                new LockedSessionRow(
                                        rs.getLong("id"),
                                        rs.getLong("class_id"),
                                        rs.getLong("tutor_id"),
                                        rs.getLong("student_id"),
                                        rs.getString("class_name"),
                                        rs.getString("student_name"),
                                        rs.getString("title"),
                                        rs.getObject("session_date", LocalDate.class),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getString("teaching_mode"),
                                        rs.getString("meeting_url"),
                                        rs.getString("location"),
                                        rs.getString("status"),
                                        rs.getString("log_knowledge"),
                                        rs.getString("log_homework")),
                        sessionId)
                .stream()
                .findFirst();
    }

    /** Chi tiết buổi học (mục 4.5, đọc không khóa) kèm số thứ tự + tên lớp / học sinh / gia sư. */
    public Optional<SessionDetailRow> findSessionDetail(Long sessionId) {
        return jdbcTemplate.query(
                        """
                        SELECT s.id, s.class_id, s.title, s.session_date, s.start_time, s.end_time,
                               s.is_trial, s.teaching_mode, s.meeting_url, s.location, s.status,
                               c.class_name, u.full_name AS student_name, t.full_name AS tutor_name,
                               s.log_knowledge, s.log_homework,
                               ROW_NUMBER() OVER (PARTITION BY s.class_id
                                                  ORDER BY s.session_date, s.start_time, s.id)
                                   AS session_number
                        FROM sessions s
                        JOIN classes c ON c.id = s.class_id
                        JOIN users u ON u.id = c.student_id
                        JOIN users t ON t.id = c.tutor_id
                        WHERE s.id = ?
                        """,
                        (ResultSet rs, int rowNum) ->
                                new SessionDetailRow(
                                        rs.getLong("id"),
                                        rs.getInt("session_number"),
                                        rs.getLong("class_id"),
                                        rs.getString("class_name"),
                                        rs.getString("student_name"),
                                        rs.getString("tutor_name"),
                                        rs.getString("title"),
                                        rs.getObject("session_date", LocalDate.class),
                                        rs.getObject("start_time", LocalTime.class),
                                        rs.getObject("end_time", LocalTime.class),
                                        rs.getBoolean("is_trial"),
                                        rs.getString("teaching_mode"),
                                        rs.getString("meeting_url"),
                                        rs.getString("location"),
                                        rs.getString("status"),
                                        rs.getString("log_knowledge"),
                                        rs.getString("log_homework")),
                        sessionId)
                .stream()
                .findFirst();
    }

    /** Buổi chính thức khác cùng (lớp, ngày, giờ bắt đầu) — kiểm trùng bước 4a (mục 4.6). */
    public int countDuplicateSlotInClass(
            Long classId, LocalDate sessionDate, LocalTime startTime, Long excludeSessionId) {
        Integer count =
                jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*)
                        FROM sessions
                        WHERE class_id = ? AND session_date = ? AND start_time = ?
                          AND is_trial = FALSE AND id <> ?
                        """,
                        Integer.class,
                        classId,
                        sessionDate,
                        startTime,
                        excludeSessionId);
        return count != null ? count : 0;
    }

    /**
     * Sửa / dời buổi (chỉ buổi SCHEDULED, service validate trước).
     * {@code meetingUrl}/{@code location} do service tính giá trị hợp lệ —
     * null = xóa trắng trường đối diện (đổi hình thức); {@code title} null giữ
     * nguyên giá trị cũ (COALESCE).
     */
    public void updateSessionInfo(Long sessionId, SessionInfoUpdate update) {
        jdbcTemplate.update(
                """
                UPDATE sessions
                SET session_date = ?, start_time = ?, end_time = ?,
                    teaching_mode = ?,
                    title = COALESCE(?, title),
                    meeting_url = ?, location = ?,
                    updated_at = NOW()
                WHERE id = ?
                """,
                update.sessionDate(),
                update.startTime(),
                update.endTime(),
                update.teachingMode(),
                update.title(),
                update.meetingUrl(),
                update.location(),
                sessionId);
    }

    /**
     * Lấy ngoại lệ (nếu có) gắn với 1 ô (lớp, ngày, giờ ca) — dùng khi "Tạo
     * buổi học" vật chất hóa ô (mục 1.8): cần schedule_id trước khi xóa.
     */
    public Optional<SessionExceptionRow> findExceptionForOccurrence(
            Long classId, LocalDate date, int dayOfWeek, LocalTime startTime) {
        return jdbcTemplate.query(
                        """
                        SELECT e.id, e.class_id, e.schedule_id, e.exception_date, e.exception_type,
                               e.new_date, e.new_start_time, e.new_end_time, e.new_teaching_mode,
                               e.new_meeting_url, e.new_location, e.reason, e.created_by, e.created_at
                        FROM session_exceptions e
                        JOIN class_schedules cs ON cs.id = e.schedule_id
                        WHERE e.class_id = ? AND e.exception_date = ?
                          AND cs.day_of_week = ? AND cs.start_time = ?
                        """,
                        new SessionExceptionRowMapper(),
                        classId,
                        date,
                        dayOfWeek,
                        startTime)
                .stream()
                .findFirst();
    }

    /** Đổi trạng thái buổi (state machine validate ở service). */
    public void updateSessionStatus(Long sessionId, String status) {
        jdbcTemplate.update(
                "UPDATE sessions SET status = ?, updated_at = NOW() WHERE id = ?",
                status,
                sessionId);
    }

    /** Lưu nhật ký buổi (cả 2 nội dung, null = xóa trắng phần đó). */
    public void updateSessionLog(Long sessionId, String logKnowledge, String logHomework) {
        jdbcTemplate.update(
                """
                UPDATE sessions
                SET log_knowledge = ?, log_homework = ?, updated_at = NOW()
                WHERE id = ?
                """,
                logKnowledge,
                logHomework,
                sessionId);
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

    private static class SessionExceptionRowMapper implements RowMapper<SessionExceptionRow> {
        @Override
        public SessionExceptionRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new SessionExceptionRow(
                    rs.getLong("id"),
                    rs.getLong("class_id"),
                    rs.getLong("schedule_id"),
                    rs.getObject("exception_date", LocalDate.class),
                    rs.getString("exception_type"),
                    rs.getObject("new_date", LocalDate.class),
                    rs.getObject("new_start_time", LocalTime.class),
                    rs.getObject("new_end_time", LocalTime.class),
                    rs.getString("new_teaching_mode"),
                    rs.getString("new_meeting_url"),
                    rs.getString("new_location"),
                    rs.getString("reason"),
                    rs.getObject("created_by", Long.class),
                    rs.getObject("created_at", OffsetDateTime.class));
        }
    }

    private static class SessionListItemRowMapper implements RowMapper<SessionListItem> {
        @Override
        public SessionListItem mapRow(ResultSet rs, int rowNum) throws SQLException {
            return SessionListItem.builder()
                    .sessionId(rs.getLong("session_id"))
                    .sessionNumber(rs.getInt("session_number"))
                    .title(rs.getString("title"))
                    .sessionDate(rs.getObject("session_date", LocalDate.class))
                    .startTime(rs.getObject("start_time", LocalTime.class))
                    .endTime(rs.getObject("end_time", LocalTime.class))
                    .teachingMode(rs.getString("teaching_mode"))
                    .meetingUrl(rs.getString("meeting_url"))
                    .location(rs.getString("location"))
                    .status(rs.getString("status"))
                    .isTrial(rs.getBoolean("is_trial"))
                    .hasLog(rs.getBoolean("has_log"))
                    .build();
        }
    }
}
