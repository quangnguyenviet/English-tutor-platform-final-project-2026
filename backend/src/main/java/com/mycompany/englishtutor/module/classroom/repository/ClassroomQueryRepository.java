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
import com.mycompany.englishtutor.module.classroom.api.response.LessonListItem;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc/ghi cho module lớp học của gia sư (API_DESIGN mục 3.5, UC-T08 + UC-T09).
 *
 * <p>Bảng {@code classes}, {@code lessons}, {@code teaching_logs},
 * {@code schedule_exceptions} và {@code class_schedules} chưa có entity JPA nên dùng
 * JdbcTemplate, tương tự module matching. Ca dạy thử là các cột {@code trial_*}
 * trên chính dòng {@code classes} (chỉ có khi status = TRIAL); nhật ký dạy học
 * nằm ở bảng riêng {@code teaching_logs} (không gắn bài giảng, không gắn buổi).
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

    /** Ca dạy cố định (class_schedules) trùng khung giờ đang chọn (theo ngày cụ thể). */
    public record ConflictSlotInfo(
            Long scheduleId,
            LocalDate slotDate,
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

    // ----------------------------- RECORDS: OCCURRENCE & LOG (V16)

    /** Ca cố định kèm id (dùng cho overlay exception, V13). */
    public record ScheduleSlotRow(
            Long scheduleId,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate validFrom,
            LocalDate validTo) {}

    /** Ca thử của lớp (các cột trial_* trên classes, V16). */
    public record TrialSlotRow(
            LocalDate trialDate,
            LocalTime startTime,
            LocalTime endTime,
            String teachingMode,
            String meetingUrl,
            String location) {}

    /** Một ngoại lệ (schedule_exceptions) gắn với ca cụ thể tại một ngày. */
    public record ScheduleExceptionRow(
            Long id,
            Long classId,
            Long scheduleId,
            LocalDate exceptionDate,
            String exceptionType,
            LocalDate newDate,
            LocalTime newStartTime,
            LocalTime newEndTime,
            String reason,
            Long createdBy,
            OffsetDateTime createdAt) {}

    /**
     * Nhật ký dạy học (bảng teaching_logs, V16) — khớp ô ca theo
     * (class_id, log_date, start_time), không cần JOIN class_schedules.
     */
    public record TeachingLogRow(
            Long id,
            LocalDate logDate,
            LocalTime startTime,
            LocalTime endTime,
            String knowledge,
            String homework,
            boolean firstPublish,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {}

    /** Kết quả upsert log: id dòng + lần đầu lưu (cả 2 nội dung NULL trước khi ghi). */
    public record LogUpsertResult(Long logId, boolean firstPublish) {}

    /** Chi tiết bài giảng (lessons, V16) kèm chủ sở hữu lớp + đếm tài liệu / quiz. */
    public record LessonDetailRow(
            Long lessonId,
            Long classId,
            String className,
            String studentName,
            String tutorName,
            Long tutorId,
            Long studentId,
            String title,
            String status,
            int materialCount,
            int quizCount,
            OffsetDateTime createdAt,
            OffsetDateTime updatedAt) {}

    // -------------------------------------------------- QUERIES

    private static final String MY_CLASSES_BASE = """
            SELECT c.id AS class_id,
                   c.class_name,
                   c.status AS class_status,
                   c.teaching_mode AS class_mode,
                   c.price_per_session,
                   c.created_at,
                   u.full_name AS student_name,
                   c.trial_date AS trial_date,
                   c.trial_start_time AS trial_start,
                   c.trial_end_time AS trial_end,
                   c.trial_teaching_mode AS trial_mode,
                   c.trial_meeting_url AS trial_meeting_url,
                   c.trial_location AS trial_location
            FROM classes c
            JOIN users u ON u.id = c.student_id
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
                   p.full_name AS parent_name,
                   p.phone     AS parent_phone,
                   p.email     AS parent_email,
                   p.address   AS parent_address,
                   c.trial_date AS trial_date,
                   c.trial_start_time AS trial_start,
                   c.trial_end_time AS trial_end,
                   c.trial_teaching_mode AS trial_mode,
                   c.trial_meeting_url AS trial_meeting_url,
                   c.trial_location AS trial_location
            FROM classes c
            JOIN users u ON u.id = c.student_id
            JOIN students st ON st.id = c.student_id
            JOIN parents p ON p.id = st.parent_id
            WHERE c.id = ? AND c.tutor_id = ?
            """;

    private static final String TRIAL_SLOT_QUERY = """
            SELECT trial_date, trial_start_time, trial_end_time,
                   trial_teaching_mode, trial_meeting_url, trial_location
            FROM classes
            WHERE id = ? AND trial_start_time IS NOT NULL
            """;

    /** Ca cố định của lớp khác (cùng tutor, khác lớp) giao giờ trên một ngày cụ thể. */
    private static final String SLOTS_CONFLICTS_QUERY = """
            SELECT cs.id AS schedule_id,
                   cs.valid_from AS slot_date,
                   cs.start_time,
                   cs.end_time,
                   c.class_name,
                   u.full_name AS student_name,
                   FALSE AS trial
            FROM class_schedules cs
            JOIN classes c ON c.id = cs.class_id
            JOIN users u ON u.id = c.student_id
            WHERE c.tutor_id = ?
              AND c.id <> ?
              AND c.status = 'ACTIVE'
              AND cs.day_of_week = ?
              AND cs.valid_from <= ?
              AND (cs.valid_to IS NULL OR cs.valid_to >= ?)
              AND cs.start_time < ?
              AND cs.end_time > ?
            """;

    /** Ca cố định của lớp khác trong khoảng hiệu lực — để check conflict ca tuần (UC-T09). */
    private static final String SLOTS_CONFLICTS_RANGE_QUERY = """
            SELECT cs.id AS schedule_id,
                   cs.valid_from AS slot_date,
                   cs.start_time,
                   cs.end_time,
                   c.class_name,
                   u.full_name AS student_name,
                   FALSE AS trial
            FROM class_schedules cs
            JOIN classes c ON c.id = cs.class_id
            JOIN users u ON u.id = c.student_id
            WHERE c.tutor_id = ?
              AND c.id <> ?
              AND c.status = 'ACTIVE'
              AND cs.day_of_week = ?
              AND cs.valid_from <= ?
              AND (cs.valid_to IS NULL OR cs.valid_to >= ?)
              AND cs.start_time < ?
              AND cs.end_time > ?
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

    /** Ca thử hiện có của lớp (các cột trial_* trên classes; rỗng nếu chưa thiết lập). */
    public Optional<TrialSessionResponse> findTrialSession(Long classId) {
        return jdbcTemplate.query(
                        TRIAL_SLOT_QUERY,
                        (ResultSet rs, int rowNum) -> TrialSessionResponse.builder()
                                .sessionDate(rs.getObject("trial_date", LocalDate.class))
                                .startTime(rs.getObject("trial_start_time", LocalTime.class))
                                .endTime(rs.getObject("trial_end_time", LocalTime.class))
                                .teachingMode(rs.getString("trial_teaching_mode"))
                                .meetingUrl(rs.getString("trial_meeting_url"))
                                .location(rs.getString("trial_location"))
                                .status("SCHEDULED")
                                .build(),
                        classId)
                .stream()
                .findFirst();
    }

    /** Các ngày đã có nhật ký dạy học của lớp (V16, thay "ngày có buổi" cũ) — FE render điểm "đã dạy". */
    public List<LocalDate> findLogDates(Long classId) {
        return jdbcTemplate.queryForList(
                "SELECT DISTINCT log_date FROM teaching_logs WHERE class_id = ? ORDER BY log_date",
                LocalDate.class,
                classId);
    }

    /** Ca cố định (của lớp khác, cùng tutor, lớp ACTIVE) trùng khung giờ trong 1 ngày. */
    public List<ConflictSlotInfo> findConflicts(
            Long tutorId, LocalDate slotDate, LocalTime startTime, LocalTime endTime, Long excludeClassId) {
        return jdbcTemplate.query(
                SLOTS_CONFLICTS_QUERY + " ORDER BY cs.start_time, cs.id",
                new ConflictSlotRowMapper(),
                tutorId,
                excludeClassId != null ? excludeClassId : 0L,
                slotDate.getDayOfWeek().getValue(),
                slotDate,
                slotDate,
                endTime,
                startTime);
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
     * Ca cố định của lớp khác (cùng tutor) giao giờ với ca mới trong khoảng hiệu lực
     * của ca đang chốt (thay thế query session SCHEDULED/IN_PROGRESS cũ — buổi thật
     * giờ là teaching_log, không còn dòng session).
     */
    public List<ConflictSlotInfo> findSlotConflicts(
            Long tutorId,
            LocalDate validFrom,
            LocalDate validTo,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeClassId) {
        LocalDate effectiveTo = validTo != null ? validTo : NO_END_BOUND;
        return jdbcTemplate.query(
                SLOTS_CONFLICTS_RANGE_QUERY,
                new ConflictSlotRowMapper(),
                tutorId,
                excludeClassId != null ? excludeClassId : 0L,
                dayOfWeek,
                validFrom,
                effectiveTo,
                endTime,
                startTime);
    }

    // ------------------------------------------------- CA THỬ (classes.trial_*)

    /** Ghi / cập nhật 6 cột ca thử trên dòng lớp (chỉ khi status = TRIAL). */
    public void upsertTrialSlot(
            Long classId,
            UpsertTrialSessionRequest request,
            String normalizedMode,
            String meetingUrl,
            String location) {
        jdbcTemplate.update(
                """
                UPDATE classes
                SET trial_date = ?, trial_start_time = ?, trial_end_time = ?,
                    trial_teaching_mode = ?, trial_meeting_url = ?, trial_location = ?,
                    updated_at = NOW()
                WHERE id = ?
                """,
                request.getSessionDate(),
                request.getStartTime(),
                request.getEndTime(),
                normalizedMode,
                meetingUrl,
                location,
                classId);
    }

    /** Ca thử của 1 lớp khác của cùng tutor, trùng khung giờ (bộ so trùng ca thử). */
    public List<TrialSlotRow> findTrialConflicts(
            Long tutorId, Long excludeClassId, LocalDate date, LocalTime startTime, LocalTime endTime) {
        return jdbcTemplate.query(
                        """
                        SELECT c.trial_date, c.trial_start_time, c.trial_end_time,
                               c.trial_teaching_mode, c.trial_meeting_url, c.trial_location
                        FROM classes c
                        WHERE c.tutor_id = ? AND c.id <> ? AND c.status = 'TRIAL'
                          AND c.trial_date = ?
                          AND c.trial_start_time IS NOT NULL
                          AND c.trial_start_time < ?
                          AND c.trial_end_time > ?
                        ORDER BY c.trial_start_time
                        """,
                        (ResultSet rs, int rowNum) ->
                                new TrialSlotRow(
                                        rs.getObject("trial_date", LocalDate.class),
                                        rs.getObject("trial_start_time", LocalTime.class),
                                        rs.getObject("trial_end_time", LocalTime.class),
                                        rs.getString("trial_teaching_mode"),
                                        rs.getString("trial_meeting_url"),
                                        rs.getString("trial_location")),
                        tutorId,
                        excludeClassId != null ? excludeClassId : 0L,
                        date,
                        endTime,
                        startTime)
                .stream()
                .toList();
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

    /** Ca thử của lớp (chip độc lập trên lattice khi chưa có ca cố định khớp). */
    public Optional<TrialSlotRow> findTrialSlot(Long classId) {
        return jdbcTemplate.query(
                        """
                        SELECT trial_date, trial_start_time, trial_end_time,
                               trial_teaching_mode, trial_meeting_url, trial_location
                        FROM classes
                        WHERE id = ? AND trial_start_time IS NOT NULL
                        """,
                        (ResultSet rs, int rowNum) ->
                                new TrialSlotRow(
                                        rs.getObject("trial_date", LocalDate.class),
                                        rs.getObject("trial_start_time", LocalTime.class),
                                        rs.getObject("trial_end_time", LocalTime.class),
                                        rs.getString("trial_teaching_mode"),
                                        rs.getString("trial_meeting_url"),
                                        rs.getString("trial_location")),
                        classId)
                .stream()
                .findFirst();
    }

    /** Nhật ký dạy học của lớp trong 7 ngày {@code [weekStart, weekStart+7)}. */
    public List<TeachingLogRow> findWeekTeachingLogs(Long classId, LocalDate weekStart) {
        return jdbcTemplate.query(
                        """
                        SELECT id, log_date, start_time, end_time, knowledge, homework,
                               (knowledge IS NULL AND homework IS NULL) AS first_publish,
                               created_at, updated_at
                        FROM teaching_logs
                        WHERE class_id = ? AND log_date >= ? AND log_date < ?
                        ORDER BY log_date, start_time, id
                        """,
                        new TeachingLogRowMapper(),
                        classId,
                        weekStart,
                        weekStart.plusDays(7))
                .stream()
                .toList();
    }

    /**
     * Ngoại lệ (ô "EXCEPTION" trong lattice) của lớp trong 7 ngày
     * {@code [weekStart, weekStart+7)} — bảng schedule_exceptions (V13, rename V16).
     */
    public List<ScheduleExceptionRow> findWeekExceptions(Long classId, LocalDate weekStart) {
        return jdbcTemplate.query(
                        """
                        SELECT id, class_id, schedule_id, exception_date, exception_type,
                               new_date, new_start_time, new_end_time,
                               reason, created_by, created_at
                        FROM schedule_exceptions
                        WHERE class_id = ? AND exception_date >= ? AND exception_date < ?
                        ORDER BY exception_date, schedule_id
                        """,
                        new ScheduleExceptionRowMapper(),
                        classId,
                        weekStart,
                        weekStart.plusDays(7))
                .stream()
                .toList();
    }

    // ------------------------------------------------- TEACHING LOGS (V16)

    /** Log hiện có tại đúng (lớp, ngày, giờ bắt đầu) — check ô đã "vật chất hóa" thành log. */
    public Optional<TeachingLogRow> findTeachingLog(Long classId, LocalDate date, LocalTime startTime) {
        return jdbcTemplate.query(
                        """
                        SELECT id, log_date, start_time, end_time, knowledge, homework,
                               (knowledge IS NULL AND homework IS NULL) AS first_publish,
                               created_at, updated_at
                        FROM teaching_logs
                        WHERE class_id = ? AND log_date = ? AND start_time = ?
                        """,
                        new TeachingLogRowMapper(),
                        classId,
                        date,
                        startTime)
                .stream()
                .findFirst();
    }

    /**
     * Upsert log theo UNIQUE (class_id, log_date, start_time) (C-15', idempotent).
     * {@code firstPublish} = cả 2 nội dung đang NULL trước khi ghi (notification học sinh).
     */
    public LogUpsertResult upsertTeachingLog(
            Long classId,
            LocalDate logDate,
            LocalTime startTime,
            LocalTime endTime,
            String knowledge,
            String homework) {
        LogUpsertResult result =
                jdbcTemplate.query(
                                """
                                SELECT (knowledge IS NULL AND homework IS NULL) AS first_publish
                                FROM teaching_logs
                                WHERE class_id = ? AND log_date = ? AND start_time = ?
                                FOR UPDATE
                                """,
                                (ResultSet rs, int rowNum) ->
                                        new LogUpsertResult(null, rs.getBoolean("first_publish")),
                                classId,
                                logDate,
                                startTime)
                        .stream()
                        .findFirst()
                        .orElseGet(() -> new LogUpsertResult(null, true));
        boolean firstPublish = result.firstPublish();

        Long logId =
                jdbcTemplate.queryForObject(
                        """
                        INSERT INTO teaching_logs (
                            class_id, log_date, start_time, end_time, knowledge, homework)
                        VALUES (?, ?, ?, ?, ?, ?)
                        ON CONFLICT (class_id, log_date, start_time) DO UPDATE SET
                            end_time = EXCLUDED.end_time,
                            knowledge = EXCLUDED.knowledge,
                            homework = EXCLUDED.homework,
                            updated_at = NOW()
                        RETURNING id
                        """,
                        Long.class,
                        classId,
                        logDate,
                        startTime,
                        endTime,
                        knowledge,
                        homework);
        return new LogUpsertResult(logId, firstPublish);
    }

    /** Xóa 1 log; 0 dòng nếu không tồn tại. */
    public int deleteTeachingLog(Long classId, Long logId) {
        return jdbcTemplate.update(
                "DELETE FROM teaching_logs WHERE id = ? AND class_id = ?", logId, classId);
    }

    // ------------------------------------------------- BÀI GIẢNG (lessons, V16)

    /**
     * Danh sách bài giảng của lớp (ROW_NUMBER theo created_at) — tab "Bài giảng".
     * Không có ngày/giờ (bài giảng không lên lịch nữa).
     */
    public List<LessonListItem> findLessonList(Long classId, boolean descending) {
        return jdbcTemplate.query(
                """
                SELECT x.lesson_id, x.lesson_number, x.title, x.status, x.created_at, x.material_count, x.quiz_count
                FROM (
                  SELECT l.id AS lesson_id, l.title, l.status, l.created_at,
                         (SELECT COUNT(*) FROM lesson_materials m WHERE m.lesson_id = l.id) AS material_count,
                         (SELECT COUNT(*) FROM quizzes q WHERE q.lesson_id = l.id) AS quiz_count,
                         ROW_NUMBER() OVER (PARTITION BY l.class_id
                                            ORDER BY l.created_at, l.id)
                             AS lesson_number
                  FROM lessons l
                  WHERE l.class_id = ?
                ) x
                ORDER BY x.lesson_number """
                        + (descending ? " DESC" : " ASC")
                        + ", x.lesson_id "
                        + (descending ? " DESC" : " ASC"),
                (ResultSet rs, int rowNum) ->
                        LessonListItem.builder()
                                .lessonId(rs.getLong("lesson_id"))
                                .lessonNumber(rs.getInt("lesson_number"))
                                .title(rs.getString("title"))
                                .status(rs.getString("status"))
                                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                                .materialCount(rs.getInt("material_count"))
                                .quizCount(rs.getInt("quiz_count"))
                                .build(),
                classId)
                .stream()
                .toList();
    }

    /** Chi tiết bài giảng kèm chuỗi sở hữu lớp (kiểm tra quyền + upload tài liệu) — khóa dòng (write-only tx). */
    public Optional<LessonDetailRow> lockLesson(Long lessonId) {
        return jdbcTemplate.query(
                        """
                        SELECT l.id, l.class_id, l.title, l.status, l.created_at, l.updated_at,
                               c.class_name, c.tutor_id, c.student_id,
                               u.full_name AS student_name, t.full_name AS tutor_name,
                               (SELECT COUNT(*) FROM lesson_materials m WHERE m.lesson_id = l.id) AS material_count,
                               (SELECT COUNT(*) FROM quizzes q WHERE q.lesson_id = l.id) AS quiz_count
                        FROM lessons l
                        JOIN classes c ON c.id = l.class_id
                        JOIN users u ON u.id = c.student_id
                        JOIN users t ON t.id = c.tutor_id
                        WHERE l.id = ?
                        FOR UPDATE OF l
                        """,
                        lessonDetailRowMapper(),
                        lessonId)
                .stream()
                .findFirst();
    }

    private RowMapper<LessonDetailRow> lessonDetailRowMapper() {
        return (ResultSet rs, int rowNum) ->
                new LessonDetailRow(
                        rs.getLong("id"),
                        rs.getLong("class_id"),
                        rs.getString("class_name"),
                        rs.getString("student_name"),
                        rs.getString("tutor_name"),
                        rs.getLong("tutor_id"),
                        rs.getLong("student_id"),
                        rs.getString("title"),
                        rs.getString("status"),
                        rs.getInt("material_count"),
                        rs.getInt("quiz_count"),
                        rs.getObject("created_at", OffsetDateTime.class),
                        rs.getObject("updated_at", OffsetDateTime.class));
    }

    /** Chi tiết bài giảng đọc thuần (không khóa) — dùng trong transaction read-only. */
    public Optional<LessonDetailRow> findLessonDetail(Long lessonId) {
        return jdbcTemplate.query(
                        """
                        SELECT l.id, l.class_id, l.title, l.status, l.created_at, l.updated_at,
                               c.class_name, c.tutor_id, c.student_id,
                               u.full_name AS student_name, t.full_name AS tutor_name,
                               (SELECT COUNT(*) FROM lesson_materials m WHERE m.lesson_id = l.id) AS material_count,
                               (SELECT COUNT(*) FROM quizzes q WHERE q.lesson_id = l.id) AS quiz_count
                        FROM lessons l
                        JOIN classes c ON c.id = l.class_id
                        JOIN users u ON u.id = c.student_id
                        JOIN users t ON t.id = c.tutor_id
                        WHERE l.id = ?
                        """,
                        lessonDetailRowMapper(),
                        lessonId)
                .stream()
                .findFirst();
    }

    /** Tạo bài giảng mới cho lớp (trả về id). */
    public Long insertLesson(Long classId, String title) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO lessons (class_id, title, status)
                VALUES (?, ?, 'PUBLISHED')
                RETURNING id
                """,
                Long.class,
                classId,
                title);
    }

    /** Sửa tiêu đề bài giảng (null = giữ nguyên). */
    public void updateLessonTitle(Long lessonId, String title) {
        jdbcTemplate.update(
                """
                UPDATE lessons SET title = COALESCE(?, title), updated_at = NOW() WHERE id = ?
                """,
                title,
                lessonId);
    }

    /** Ẩn / hiện bài giảng (PUBLISHED / HIDDEN). */
    public void updateLessonStatus(Long lessonId, String status) {
        jdbcTemplate.update(
                "UPDATE lessons SET status = ?, updated_at = NOW() WHERE id = ?", status, lessonId);
    }

    /** Xóa bài giảng (CASCADE tự xóa lesson_materials, quizzes). */
    public int deleteLesson(Long classId, Long lessonId) {
        return jdbcTemplate.update(
                "DELETE FROM lessons WHERE id = ? AND class_id = ?", lessonId, classId);
    }

    // ------------------------------------------------------- MATERIALS (bài giảng)

    private static final String MATERIAL_BASE = """
            SELECT m.id, m.lesson_id, m.file_name, m.file_url, m.file_type, m.file_size,
                   m.created_at, c.id AS class_id, c.tutor_id, c.student_id, u.full_name AS uploaded_by_name
            FROM lesson_materials m
            JOIN lessons l ON l.id = m.lesson_id
            JOIN classes c ON c.id = l.class_id
            JOIN users u ON u.id = m.uploaded_by
            """;

    /** Toàn bộ tài liệu của 1 bài giảng (tab Bài giảng). */
    public List<LessonMaterialRow> findLessonMaterials(Long lessonId) {
        return jdbcTemplate.query(
                MATERIAL_BASE + " WHERE m.lesson_id = ? ORDER BY m.id",
                new LessonMaterialRowMapper(),
                lessonId)
                .stream()
                .toList();
    }

    /** 1 tài liệu kèm chủ sở hữu lớp (kiểm tra quyền access-url / gỡ — không thuộc bài giảng → 404). */
    public Optional<LessonMaterialRow> findLessonMaterial(Long lessonId, Long materialId) {
        return jdbcTemplate.query(
                        MATERIAL_BASE + " WHERE m.id = ? AND m.lesson_id = ?",
                        new LessonMaterialRowMapper(),
                        materialId,
                        lessonId)
                .stream()
                .findFirst();
    }

    /** 1 tài liệu theo id, kèm chủ sở hữu lớp — kiểm tra quyền access-url (TUTOR/STUDENT sở hữu). */
    public Optional<LessonMaterialRow> findMaterialForAccess(Long materialId) {
        return jdbcTemplate.query(
                        MATERIAL_BASE + " WHERE m.id = ?",
                        new LessonMaterialRowMapper(),
                        materialId)
                .stream()
                .findFirst();
    }

    /** Gỡ tài liệu (chỉ dòng đúng bài giảng — bảo vệ khỏi xóa nhầm vật liệu của bài khác). */
    public int deleteLessonMaterial(Long lessonId, Long materialId) {
        return jdbcTemplate.update(
                "DELETE FROM lesson_materials WHERE lesson_id = ? AND id = ?", lessonId, materialId);
    }

    /** Thêm tài liệu (trả về id dòng mới). */
    public Long insertLessonMaterial(
            Long lessonId,
            Long uploadedBy,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO lesson_materials (
                    lesson_id, uploaded_by, file_name, file_url, file_type, file_size)
                VALUES (?, ?, ?, ?, ?, ?)
                RETURNING id
                """,
                Long.class,
                lessonId,
                uploadedBy,
                fileName,
                fileUrl,
                fileType,
                fileSize);
    }

    // ------------------------------------------------------- EXCEPTION (schedule_exceptions)

    /** Ngoại lệ hiện có của ô (check ghi đè → audit CREATE hay UPDATE, mục 4.2 bước 5). */
    public Optional<ScheduleExceptionRow> findScheduleException(Long scheduleId, LocalDate date) {
        return jdbcTemplate.query(
                        """
                        SELECT id, class_id, schedule_id, exception_date, exception_type,
                               new_date, new_start_time, new_end_time,
                               reason, created_by, created_at
                        FROM schedule_exceptions
                        WHERE schedule_id = ? AND exception_date = ?
                        """,
                        new ScheduleExceptionRowMapper(),
                        scheduleId,
                        date)
                .stream()
                .findFirst();
    }

    /**
     * Ghi đè ngoại lệ của ô (R4: UNIQUE {@code uq_schedule_exceptions} +
     * ON CONFLICT DO UPDATE = upsert idempotent). Trả về id.
     */
    public Long upsertScheduleException(
            Long classId,
            Long scheduleId,
            LocalDate exceptionDate,
            String exceptionType,
            LocalDate newDate,
            LocalTime newStartTime,
            LocalTime newEndTime,
            String reason,
            Long createdBy) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO schedule_exceptions (
                    class_id, schedule_id, exception_date, exception_type,
                    new_date, new_start_time, new_end_time,
                    reason, created_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (schedule_id, exception_date) DO UPDATE SET
                    exception_type = EXCLUDED.exception_type,
                    new_date = EXCLUDED.new_date,
                    new_start_time = EXCLUDED.new_start_time,
                    new_end_time = EXCLUDED.new_end_time,
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
                reason,
                createdBy);
    }

    /** Xóa ngoại lệ của ô — 0 nếu không có. */
    public int deleteScheduleException(Long scheduleId, LocalDate date) {
        return jdbcTemplate.update(
                "DELETE FROM schedule_exceptions WHERE schedule_id = ? AND exception_date = ?",
                scheduleId,
                date);
    }

    /** R-LOG: số log đang có tại (lớp, ngày, giờ ca) — chặn ghi exception CANCELLED/RESCHEDULED. */
    public int countTeachingLogAt(Long classId, LocalDate date, LocalTime startTime) {
        Integer count =
                jdbcTemplate.queryForObject(
                        """
                        SELECT COUNT(*) FROM teaching_logs
                        WHERE class_id = ? AND log_date = ? AND start_time = ?
                        """,
                        Integer.class,
                        classId,
                        date,
                        startTime);
        return count != null ? count : 0;
    }

    /** Ngoài lệ theo (ca, ngày diễn ra) — để R-LOG chặn ghi log ở ô đang bị hủy/dời. */
    public Optional<ScheduleExceptionRow> findScheduleExceptionAt(Long classId, LocalDate date, LocalTime startTime) {
        return jdbcTemplate.query(
                        """
                        SELECT e.id, e.class_id, e.schedule_id, e.exception_date, e.exception_type,
                               e.new_date, e.new_start_time, e.new_end_time,
                               e.reason, e.created_by, e.created_at
                        FROM schedule_exceptions e
                        JOIN class_schedules sc ON sc.id = e.schedule_id
                        WHERE e.class_id = ? AND e.exception_date = ?
                          AND sc.start_time = ? AND sc.day_of_week = ?
                        """,
                        new ScheduleExceptionRowMapper(),
                        classId,
                        date,
                        startTime,
                        date.getDayOfWeek().getValue())
                .stream()
                .findFirst();
    }

    /** Thông báo học sinh khi lần đầu lưu nhật ký dạy học (link CLASS). */
    public void insertLogFirstPublishNotification(
            Long studentId, String className, LocalDate logDate, Long classId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                studentId,
                "Nhật ký buổi học mới",
                "Gia sư đã cập nhật nhật ký buổi học " + className + " ngày " + logDate,
                classId);
    }

    // ------------------------------------------------- LATTICE WEEK: TRIAL COVERAGE

    /** Ca cố định của lớp (dùng để tính "ca thử bị che bởi ca cố định" trên lattice). */
    public boolean isTrialCoveredBySlot(Long classId, LocalDate trialDate, LocalTime trialStart) {
        boolean covered =
                findScheduleSlotsWithIds(classId).stream()
                        .anyMatch(
                                s ->
                                        s.dayOfWeek() == trialDate.getDayOfWeek().getValue()
                                                && s.startTime().equals(trialStart)
                                                && s.validFrom().compareTo(trialDate) <= 0
                                                && (s.validTo() == null || s.validTo().compareTo(trialDate) >= 0));
        return covered;
    }

    // ----------------------------------------------------------------- WRITE

    /** Ghi lịch cố định mới (kèm khoảng hiệu lực từng ca) — dùng khi chốt lần đầu. */
    public void insertSchedules(Long classId, List<FinalizeScheduleRequest.ScheduleSlot> slots) {
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

    // --------------------------------------------------------------- HELPERS

    public static String normalizeMode(String teachingMode) {
        if (teachingMode == null) {
            return null;
        }
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
        Object trialStart = rs.getObject("trial_start");
        if (trialStart == null) {
            return null;
        }
        return TrialSessionResponse.builder()
                .sessionDate(rs.getObject("trial_date", LocalDate.class))
                .startTime(rs.getObject("trial_start", LocalTime.class))
                .endTime(rs.getObject("trial_end", LocalTime.class))
                .teachingMode(rs.getString("trial_mode"))
                .meetingUrl(rs.getString("trial_meeting_url"))
                .location(rs.getString("trial_location"))
                .status("SCHEDULED")
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
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .parentEmail(rs.getString("parent_email"))
                    .parentAddress(rs.getString("parent_address"))
                    .trialSession(mapTrialSession(rs))
                    .build();
        }
    }

    private static class ConflictSlotRowMapper implements RowMapper<ConflictSlotInfo> {
        @Override
        public ConflictSlotInfo mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ConflictSlotInfo(
                    rs.getLong("schedule_id"),
                    rs.getObject("slot_date", LocalDate.class),
                    rs.getObject("start_time", LocalTime.class),
                    rs.getObject("end_time", LocalTime.class),
                    rs.getString("class_name"),
                    rs.getString("student_name"),
                    rs.getBoolean("trial"));
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

    private static class ScheduleExceptionRowMapper implements RowMapper<ScheduleExceptionRow> {
        @Override
        public ScheduleExceptionRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new ScheduleExceptionRow(
                    rs.getLong("id"),
                    rs.getLong("class_id"),
                    rs.getLong("schedule_id"),
                    rs.getObject("exception_date", LocalDate.class),
                    rs.getString("exception_type"),
                    rs.getObject("new_date", LocalDate.class),
                    rs.getObject("new_start_time", LocalTime.class),
                    rs.getObject("new_end_time", LocalTime.class),
                    rs.getString("reason"),
                    rs.getObject("created_by", Long.class),
                    rs.getObject("created_at", OffsetDateTime.class));
        }
    }

    private static class TeachingLogRowMapper implements RowMapper<TeachingLogRow> {
        @Override
        public TeachingLogRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TeachingLogRow(
                    rs.getLong("id"),
                    rs.getObject("log_date", LocalDate.class),
                    rs.getObject("start_time", LocalTime.class),
                    rs.getObject("end_time", LocalTime.class),
                    rs.getString("knowledge"),
                    rs.getString("homework"),
                    rs.getBoolean("first_publish"),
                    rs.getObject("created_at", OffsetDateTime.class),
                    rs.getObject("updated_at", OffsetDateTime.class));
        }
    }

    /** Tài liệu đính kèm bài giảng (bảng {@code lesson_materials}, JOIN tên người tải lên). */
    public record LessonMaterialRow(
            Long materialId,
            Long lessonId,
            Long classId,
            Long tutorId,
            Long studentId,
            String fileName,
            String fileUrl,
            String fileType,
            Long fileSize,
            String uploadedByName,
            OffsetDateTime createdAt) {}

    private static class LessonMaterialRowMapper implements RowMapper<LessonMaterialRow> {
        @Override
        public LessonMaterialRow mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new LessonMaterialRow(
                    rs.getLong("id"),
                    rs.getLong("lesson_id"),
                    rs.getLong("class_id"),
                    rs.getLong("tutor_id"),
                    rs.getLong("student_id"),
                    rs.getString("file_name"),
                    rs.getString("file_url"),
                    rs.getString("file_type"),
                    rs.getObject("file_size", Long.class),
                    rs.getString("uploaded_by_name"),
                    rs.getObject("created_at", OffsetDateTime.class));
        }
    }
}
