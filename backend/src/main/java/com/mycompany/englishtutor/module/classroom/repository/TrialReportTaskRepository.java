package com.mycompany.englishtutor.module.classroom.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskListItemResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Đọc/ghi bảng {@code trial_report_tasks} + {@code trial_report_task_histories} (V32) —
 * hàng đợi vận hành xử lý báo cáo dạy thử thất bại. JdbcTemplate theo convention module classroom.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TrialReportTaskRepository {

    JdbcTemplate jdbcTemplate;

    private static final List<String> TASK_STATUSES = List.of("PENDING", "IN_PROGRESS", "RESOLVED");

    private static final String QUEUE_BASE = """
            SELECT t.id AS task_id, t.status AS task_status,
                   t.assigned_to AS assigned_to_id, ua.full_name AS assigned_to_name,
                   t.created_at AS task_created_at,
                   r.id AS report_id, r.outcome AS report_outcome, r.note AS report_note,
                   r.created_at AS report_at,
                   c.id AS class_id, c.class_name, c.status AS class_status,
                   c.trial_date, c.trial_start_time AS trial_start, c.trial_end_time AS trial_end,
                   c.student_id, us.full_name AS student_name,
                   c.tutor_id, ut.full_name AS tutor_name,
                   c.class_request_id
            """;

    private static final String QUEUE_FROM = """
            FROM trial_report_tasks t
            JOIN trial_reports r ON r.id = t.trial_report_id
            JOIN classes c ON c.id = r.class_id
            JOIN users us ON us.id = c.student_id
            JOIN users ut ON ut.id = c.tutor_id
            LEFT JOIN users ua ON ua.id = t.assigned_to
            """;

    private static final String DETAIL_BASE = """
            SELECT t.id AS task_id, t.status AS task_status,
                   t.assigned_to AS assigned_to_id, ua.full_name AS assigned_to_name,
                   t.resolved_by AS resolved_by_id, ur.full_name AS resolved_by_name,
                   t.resolved_at, t.resolution,
                   t.created_at AS task_created_at, t.updated_at AS task_updated_at,
                   r.id AS report_id, r.outcome AS report_outcome, r.note AS report_note,
                   r.created_at AS report_at,
                   c.id AS class_id, c.class_name, c.status AS class_status,
                   c.teaching_mode AS class_mode, c.class_type, c.price_per_session,
                   c.active_from, c.end_date,
                   c.trial_date, c.trial_start_time AS trial_start, c.trial_end_time AS trial_end,
                   c.trial_teaching_mode AS trial_mode, c.trial_meeting_url AS trial_meeting_url,
                   COALESCE(c.trial_location, CASE WHEN c.trial_teaching_mode = 'AT_HOME' THEN
                       (SELECT pa.address FROM students sa JOIN parents pa ON pa.id = sa.parent_id
                         WHERE sa.id = c.student_id) END) AS trial_location,
                   c.student_id, us.full_name AS student_name,
                   c.tutor_id, ut.full_name AS tutor_name,
                   c.class_request_id, cr.status AS request_status
            """;

    private static final String DETAIL_FROM = """
            FROM trial_report_tasks t
            JOIN trial_reports r ON r.id = t.trial_report_id
            JOIN classes c ON c.id = r.class_id
            JOIN users us ON us.id = c.student_id
            JOIN users ut ON ut.id = c.tutor_id
            LEFT JOIN users ua ON ua.id = t.assigned_to
            LEFT JOIN users ur ON ur.id = t.resolved_by
            LEFT JOIN class_requests cr ON cr.id = c.class_request_id
            """;

    // ------------------------------------------------------------------ READ

    /** Danh sách hàng đợi (filter status/assignedTo, phân trang, ORDER BY created_at DESC). */
    public List<TrialReportTaskListItemResponse> findQueue(String status, Long assignedTo, int page, int size) {
        StringBuilder sql = new StringBuilder(QUEUE_BASE + QUEUE_FROM + " WHERE " + queueWhere(status, assignedTo));
        List<Object> params = new ArrayList<>();
        queueParams(status, assignedTo, params);
        sql.append(" ORDER BY t.created_at DESC, t.id DESC LIMIT ? OFFSET ?");
        params.add(size);
        params.add(page * size);
        return jdbcTemplate.query(sql.toString(), new QueueRowMapper(), params.toArray());
    }

    /** Tổng số task theo filter. */
    public long countQueue(String status, Long assignedTo) {
        List<Object> params = new ArrayList<>();
        String sql = "SELECT COUNT(*) FROM trial_report_tasks t"
                + " JOIN trial_reports r ON r.id = t.trial_report_id"
                + " WHERE " + queueWhere(status, assignedTo);
        queueParams(status, assignedTo, params);
        Long count = jdbcTemplate.queryForObject(sql, Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    /** Số lượng theo 3 trạng thái — stat card. */
    public Map<String, Long> countByStatus() {
        Map<String, Long> counts = new HashMap<>();
        for (String s : TASK_STATUSES) {
            counts.put(s, 0L);
        }
        for (Map<String, Object> row :
                jdbcTemplate.queryForList("SELECT status, COUNT(*) AS n FROM trial_report_tasks GROUP BY status")) {
            counts.put((String) row.get("status"), ((Number) row.get("n")).longValue());
        }
        return counts;
    }

    /** Chi tiết task (không lock) — empty nếu task không tồn tại. */
    public Optional<TrialReportTaskDetailResponse> findTaskDetail(Long taskId) {
        return jdbcTemplate.query(DETAIL_BASE + DETAIL_FROM + " WHERE t.id = ?", new DetailRowMapper(), taskId)
                .stream()
                .findFirst();
    }

    /** Khóa dòng task (FOR UPDATE OF t) — thao tác gán/chuyển trạng thái không ghi đè. */
    public Optional<TrialReportTaskDetailResponse> lockTask(Long taskId) {
        return jdbcTemplate.query(DETAIL_BASE + DETAIL_FROM + " WHERE t.id = ? FOR UPDATE OF t",
                        new DetailRowMapper(),
                        taskId)
                .stream()
                .findFirst();
    }

    /** Lịch sử thao tác của task (ORDER BY created_at DESC, id DESC). */
    public List<TrialReportTaskDetailResponse.HistoryItem> findHistory(Long taskId) {
        return jdbcTemplate.query(
                """
                SELECT h.id, h.action, h.details, h.created_at, uh.full_name AS actor_name
                FROM trial_report_task_histories h
                JOIN users uh ON uh.id = h.actor_id
                WHERE h.task_id = ?
                ORDER BY h.created_at DESC, h.id DESC
                """,
                new HistoryRowMapper(),
                taskId);
    }

    /** Trạng thái của yêu cầu ghép lớp (trả {@code null} nếu không tồn tại) — phục vụ ghim "đã REMATCH". */
    public String findRequestStatus(Long classRequestId) {
        List<String> rows = jdbcTemplate.query(
                "SELECT status FROM class_requests WHERE id = ?",
                (rs, rowNum) -> rs.getString("status"),
                classRequestId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    /** Người nhận gán hợp lệ: RECEPTIONIST/ADMIN đang ACTIVE (trả full_name, empty nếu không). */
    public Optional<String> findAssignableStaffName(Long userId) {
        return jdbcTemplate.query(
                        """
                        SELECT full_name FROM users
                        WHERE id = ? AND status = 'ACTIVE' AND role IN ('RECEPTIONIST', 'ADMIN')
                        """,
                        (ResultSet rs, int rowNum) -> rs.getString("full_name"),
                        userId)
                .stream()
                .findFirst();
    }

    // ----------------------------------------------------------------- WRITE

    /** Chèn task PENDING sau report FAILED (gọi trong transaction của service). */
    public void insertTask(Long trialReportId) {
        jdbcTemplate.update(
                "INSERT INTO trial_report_tasks (trial_report_id, status) VALUES (?, 'PENDING')",
                trialReportId);
    }

    /** Gán cho người đăng nhập; 0 dòng = task đã được gán trước → service trả 409. */
    public int assignSelf(Long taskId, Long userId) {
        return jdbcTemplate.update(
                """
                UPDATE trial_report_tasks
                SET assigned_to = ?, updated_at = NOW()
                WHERE id = ? AND assigned_to IS NULL
                """,
                userId,
                taskId);
    }

    /** Bỏ gán (giữ nguyên status). */
    public int unassign(Long taskId) {
        return jdbcTemplate.update(
                "UPDATE trial_report_tasks SET assigned_to = NULL, updated_at = NOW() WHERE id = ?",
                taskId);
    }

    /** Gán sang người khác (service đã validate người nhận là staff ACTIVE). */
    public int assignTo(Long taskId, Long targetUserId) {
        return jdbcTemplate.update(
                "UPDATE trial_report_tasks SET assigned_to = ?, updated_at = NOW() WHERE id = ?",
                targetUserId,
                taskId);
    }

    /**
     * Đổi trạng thái việc (dropdown). Vào {@code RESOLVED} ghi resolved_by/resolved_at;
     * ra khỏi {@code RESOLVED} đặt 2 trường đó NULL.
     */
    public int changeStatus(Long taskId, String newStatus, Long actorId) {
        boolean enteringResolved = "RESOLVED".equalsIgnoreCase(newStatus);
        return jdbcTemplate.update(
                """
                UPDATE trial_report_tasks SET
                    status = ?,
                    resolved_by = CASE WHEN ? THEN ? ELSE NULL END,
                    resolved_at = CASE WHEN ? THEN NOW() ELSE NULL END,
                    updated_at = NOW()
                WHERE id = ?
                """,
                newStatus,
                enteringResolved,
                actorId,
                enteringResolved,
                taskId);
    }

    /** Ghi 1 dòng lịch sử thao tác (details JSONB; null = không có). */
    public void insertHistory(Long taskId, Long actorId, String action, String detailsJson) {
        jdbcTemplate.update(
                """
                INSERT INTO trial_report_task_histories (task_id, actor_id, action, details)
                VALUES (?, ?, ?, ?::jsonb)
                """,
                taskId,
                actorId,
                action,
                detailsJson);
    }

    // ------------------------------------------------------------- HELPERS

    /** Điều kiện filter hàng đợi (status theo 3 giá trị hợp lệ, assignedTo theo id). */
    private static String queueWhere(String status, Long assignedTo) {
        List<String> wheres = new ArrayList<>();
        wheres.add("r.outcome = 'FAILED'");
        if (normalizeStatus(status) != null) {
            wheres.add("t.status = ?");
        }
        if (assignedTo != null) {
            wheres.add("t.assigned_to = ?");
        }
        return String.join(" AND ", wheres);
    }

    private static void queueParams(String status, Long assignedTo, List<Object> params) {
        if (normalizeStatus(status) != null) {
            params.add(normalizeStatus(status));
        }
        if (assignedTo != null) {
            params.add(assignedTo);
        }
    }

    private static String normalizeStatus(String status) {
        return status == null || status.isBlank() ? null : status.trim().toUpperCase();
    }

    // ------------------------------------------------------------- MAPPERS

    private static class QueueRowMapper implements RowMapper<TrialReportTaskListItemResponse> {
        @Override
        public TrialReportTaskListItemResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            return TrialReportTaskListItemResponse.builder()
                    .taskId(rs.getLong("task_id"))
                    .status(rs.getString("task_status"))
                    .assignedToId(rs.getObject("assigned_to_id", Long.class))
                    .assignedToName(rs.getString("assigned_to_name"))
                    .taskCreatedAt(rs.getObject("task_created_at", OffsetDateTime.class))
                    .reportId(rs.getLong("report_id"))
                    .reportOutcome(rs.getString("report_outcome"))
                    .reportNote(rs.getString("report_note"))
                    .reportedAt(rs.getObject("report_at", OffsetDateTime.class))
                    .classId(rs.getLong("class_id"))
                    .className(rs.getString("class_name"))
                    .classStatus(rs.getString("class_status"))
                    .trialDate(rs.getObject("trial_date", LocalDate.class))
                    .trialStartTime(rs.getObject("trial_start", LocalTime.class))
                    .trialEndTime(rs.getObject("trial_end", LocalTime.class))
                    .studentId(rs.getLong("student_id"))
                    .studentName(rs.getString("student_name"))
                    .tutorId(rs.getLong("tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .hasClassRequest(rs.getObject("class_request_id", Long.class) != null)
                    .build();
        }
    }

    private static class DetailRowMapper implements RowMapper<TrialReportTaskDetailResponse> {
        @Override
        public TrialReportTaskDetailResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            TrialReportTaskDetailResponse.ReportDetail report =
                    TrialReportTaskDetailResponse.ReportDetail.builder()
                            .reportId(rs.getLong("report_id"))
                            .outcome(rs.getString("report_outcome"))
                            .note(rs.getString("report_note"))
                            .createdAt(rs.getObject("report_at", OffsetDateTime.class))
                            .build();

            var classInfo = TrialReportTaskDetailResponse.ClassInfo.builder()
                    .classId(rs.getLong("class_id"))
                    .className(rs.getString("class_name"))
                    .status(rs.getString("class_status"))
                    .teachingMode(rs.getString("class_mode"))
                    .classType(rs.getString("class_type"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .activeFrom(rs.getObject("active_from", LocalDate.class))
                    .endDate(rs.getObject("end_date", LocalDate.class))
                    .student(TrialReportTaskDetailResponse.PersonInfo.builder()
                            .id(rs.getLong("student_id"))
                            .name(rs.getString("student_name"))
                            .build())
                    .tutor(TrialReportTaskDetailResponse.PersonInfo.builder()
                            .id(rs.getLong("tutor_id"))
                            .name(rs.getString("tutor_name"))
                            .build());

            LocalTime trialStart = rs.getObject("trial_start", LocalTime.class);
            if (trialStart != null) {
                classInfo.trialSession(TrialReportTaskDetailResponse.TrialSessionInfo.builder()
                        .trialDate(rs.getObject("trial_date", LocalDate.class))
                        .startTime(trialStart)
                        .endTime(rs.getObject("trial_end", LocalTime.class))
                        .teachingMode(rs.getString("trial_mode"))
                        .meetingUrl(rs.getString("trial_meeting_url"))
                        .location(rs.getString("trial_location"))
                        .build());
            }

            Long requestId = rs.getObject("class_request_id", Long.class);
            if (requestId != null) {
                classInfo.classRequest(TrialReportTaskDetailResponse.ClassRequestInfo.builder()
                        .id(requestId)
                        .status(rs.getString("request_status"))
                        .build());
            }

            TrialReportTaskDetailResponse.TaskDetail task =
                    TrialReportTaskDetailResponse.TaskDetail.builder()
                            .taskId(rs.getLong("task_id"))
                            .status(rs.getString("task_status"))
                            .assignedToId(rs.getObject("assigned_to_id", Long.class))
                            .assignedToName(rs.getString("assigned_to_name"))
                            .resolvedById(rs.getObject("resolved_by_id", Long.class))
                            .resolvedByName(rs.getString("resolved_by_name"))
                            .resolvedAt(rs.getObject("resolved_at", OffsetDateTime.class))
                            .resolution(rs.getString("resolution"))
                            .createdAt(rs.getObject("task_created_at", OffsetDateTime.class))
                            .updatedAt(rs.getObject("task_updated_at", OffsetDateTime.class))
                            .report(report)
                            .classInfo(classInfo.build())
                            .build();

            return TrialReportTaskDetailResponse.builder().task(task).build();
        }
    }

    private static class HistoryRowMapper implements RowMapper<TrialReportTaskDetailResponse.HistoryItem> {
        @Override
        public TrialReportTaskDetailResponse.HistoryItem mapRow(ResultSet rs, int rowNum) throws SQLException {
            return new TrialReportTaskDetailResponse.HistoryItem(
                    rs.getLong("id"),
                    rs.getString("action"),
                    rs.getString("actor_name"),
                    rs.getObject("details"),
                    rs.getObject("created_at", OffsetDateTime.class));
        }
    }
}
