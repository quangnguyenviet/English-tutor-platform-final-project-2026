package com.mycompany.englishtutor.module.matching.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.matching.api.response.ClassApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc cho trang Lớp cần gia sư của Lễ tân/Admin.
 *
 * <p>Mỗi bản ghi {@code class_requests} là một dòng. Trạng thái hiển thị suy ra từ
 * {@code class_requests.status} và lớp học mới nhất: {@code MATCHED} + lớp {@code TRIAL} là Đang dạy thử,
 * {@code MATCHED} + lớp {@code ACTIVE}/{@code COMPLETED} là Ghép thành công.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffClassRequestQueryRepository {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    /** Một đơn có thể có nhiều lớp sau khi ghép lại, chỉ lấy lớp mới nhất để mỗi đơn là một dòng. */
    private static final String LATEST_CLASS_JOIN = """
            LEFT JOIN LATERAL (
                SELECT lc.id, lc.status, lc.tutor_id, lc.sessions_per_week, lc.price_per_session, lc.active_from
                FROM classes lc
                WHERE lc.class_request_id = cr.id
                ORDER BY lc.id DESC LIMIT 1
            ) c ON TRUE
            """;

    private static final String SELECT_BASE = """
            SELECT cr.id,
                   cr.requested_tutor_id,
                   cr.student_id,
                   cr.class_requirement,
                   cr.teaching_mode,
                   cr.price_per_session,
                   cr.fee_percentage,
                   cr.sessions_per_week,
                   cr.preferred_schedule,
                   cr.tutor_requirement,
                   cr.status AS request_status,
                   cr.cancel_reason,
                   cr.created_at,
                   cr.updated_at,
                   p.full_name   AS parent_name,
                   p.phone       AS parent_phone,
                   p.email       AS parent_email,
                   p.address     AS parent_address,
                   COALESCE(su.full_name, cr.student_name) AS student_name,
                   su.username   AS student_username,
                   COALESCE(s.grade, cr.student_grade) AS grade,
                   COALESCE(s.school, cr.student_school) AS school,
                   COALESCE(s.learning_goal, cr.student_learning_goal) AS learning_goal,
                   tu.full_name  AS tutor_name,
                   tu.email      AS tutor_email,
                   tu.phone      AS tutor_phone,
                   tu.avatar_url AS tutor_avatar_url,
                   hu.full_name  AS handled_by_name,
                   (SELECT COUNT(*) FROM class_applications ca
                     WHERE ca.class_request_id = cr.id AND ca.status <> 'TERMINATED') AS application_count,
                   (SELECT COUNT(*) FROM class_applications ca
                     WHERE ca.class_request_id = cr.id AND ca.status = 'APPLIED') AS pending_application_count,
                   c.id          AS class_id,
                   c.status      AS class_status,
                   c.sessions_per_week AS class_sessions_per_week,
                   c.price_per_session AS class_price_per_session,
                   c.active_from AS active_from,
                   c.tutor_id    AS last_tutor_id,
                   lu.full_name  AS last_tutor_name
            FROM class_requests cr
            JOIN parents p ON p.id = cr.parent_id
            LEFT JOIN students s ON s.id = cr.student_id
            LEFT JOIN users su ON su.id = s.id
            LEFT JOIN users tu ON tu.id = cr.requested_tutor_id
            LEFT JOIN users hu ON hu.id = cr.handled_by
            """ + LATEST_CLASS_JOIN + """
            LEFT JOIN users lu ON lu.id = c.tutor_id
            """;

    private static final String APPLICATIONS_QUERY = """
            SELECT ca.id          AS application_id,
                   ca.tutor_id,
                   ca.message,
                   ca.status,
                   ca.applied_at,
                   tu.full_name   AS tutor_name,
                   tu.email       AS tutor_email,
                   tu.phone       AS tutor_phone,
                   tu.avatar_url  AS tutor_avatar_url
            FROM class_applications ca
            JOIN users tu ON tu.id = ca.tutor_id
            WHERE ca.class_request_id = ?
            ORDER BY ca.applied_at ASC, ca.id ASC
            """;

    JdbcTemplate jdbcTemplate;

    public PageResponse<ClassRequestSummaryResponse> findClassRequests(
            String tab, String keyword, String sort, Integer page, Integer size) {
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        StringBuilder where = new StringBuilder(" WHERE TRUE ");
        List<Object> params = new ArrayList<>();
        applyTabFilter(where, tab);
        applyKeywordFilter(where, keyword, params);

        String countSql = "SELECT COUNT(*) FROM class_requests cr "
                + " JOIN parents p ON p.id = cr.parent_id "
                + " LEFT JOIN students s ON s.id = cr.student_id "
                + " LEFT JOIN users su ON su.id = s.id "
                + " LEFT JOIN users tu ON tu.id = cr.requested_tutor_id "
                + LATEST_CLASS_JOIN
                + where;
        Long total = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());
        long totalItems = total == null ? 0 : total;

        String querySql = SELECT_BASE + where + orderBy(sort) + " LIMIT ? OFFSET ?";
        List<Object> queryParams = new ArrayList<>(params);
        queryParams.add(pageSize);
        queryParams.add((long) pageIndex * pageSize);

        List<ClassRequestSummaryResponse> items =
                jdbcTemplate.query(querySql, new SummaryRowMapper(), queryParams.toArray());

        return PageResponse.of(items, pageIndex, pageSize, totalItems);
    }

    public Optional<ClassRequestDetailResponse> findDetailById(Long id) {
        List<ClassRequestDetailResponse> list =
                jdbcTemplate.query(SELECT_BASE + " WHERE cr.id = ?", new DetailRowMapper(), id);
        if (list.isEmpty()) {
            return Optional.empty();
        }
        ClassRequestDetailResponse detail = list.get(0);
        detail.setApplications(findApplications(id));
        return Optional.of(detail);
    }

    public List<ClassApplicationResponse> findApplications(Long classRequestId) {
        return jdbcTemplate.query(APPLICATIONS_QUERY, new ApplicationRowMapper(), classRequestId);
    }

    public Map<String, Long> getTabCounts() {
        String base = "SELECT COUNT(*) FROM class_requests cr " + LATEST_CLASS_JOIN + " WHERE TRUE ";
        Map<String, Long> counts = new HashMap<>();
        for (String tab : List.of("new", "open", "trial", "matched", "rematch", "cancelled")) {
            StringBuilder where = new StringBuilder();
            applyTabFilter(where, tab);
            counts.put(tab, count(base + where));
        }
        counts.put("total", count(base));
        return counts;
    }

    private Long count(String sql) {
        Long value = jdbcTemplate.queryForObject(sql, Long.class);
        return value == null ? 0L : value;
    }

    private void applyTabFilter(StringBuilder where, String tab) {
        if (tab == null || tab.isBlank() || "all".equalsIgnoreCase(tab)) {
            return;
        }
        switch (tab.toLowerCase()) {
            case "new" -> where.append(" AND cr.status = 'NEW' ");
            case "open" -> where.append(" AND cr.status = 'OPEN' ");
            case "trial" -> where.append(" AND cr.status = 'MATCHED' AND c.status = 'TRIAL' ");
            case "matched" -> where.append(" AND cr.status = 'MATCHED' AND c.status IN ('ACTIVE', 'COMPLETED') ");
            case "rematch" -> where.append(" AND cr.status = 'REMATCH' ");
            case "cancelled" -> where.append(
                    " AND (cr.status = 'CANCELLED' OR (cr.status = 'MATCHED' AND c.status = 'CANCELLED')) ");
            default -> { /* không lọc với tab lạ */ }
        }
    }

    private void applyKeywordFilter(StringBuilder where, String keyword, List<Object> params) {
        if (keyword == null || keyword.isBlank()) {
            return;
        }
        String pattern = "%" + keyword.trim().toLowerCase() + "%";
        where.append("""
                 AND (LOWER(p.full_name) LIKE ?
                      OR p.phone LIKE ?
                      OR LOWER(COALESCE(su.full_name, cr.student_name, '')) LIKE ?
                      OR LOWER(COALESCE(tu.full_name, '')) LIKE ?
                      OR LOWER(COALESCE(cr.class_requirement, '')) LIKE ?
                      OR LOWER('LOP-ENG-' || LPAD(cr.id::text, 4, '0')) LIKE ?
                      OR LOWER('REQ-' || TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD') || '-' || cr.id) LIKE ?)
                """);
        for (int i = 0; i < 7; i++) {
            params.add(pattern);
        }
    }

    private String orderBy(String sort) {
        if ("applications".equalsIgnoreCase(sort)) {
            return " ORDER BY application_count DESC, cr.created_at DESC, cr.id DESC ";
        }
        if ("oldest".equalsIgnoreCase(sort)) {
            return " ORDER BY cr.created_at ASC, cr.id ASC ";
        }
        return " ORDER BY cr.created_at DESC, cr.id DESC ";
    }

    /** Trạng thái hiển thị của lớp cần gia sư. */
    private static String resolveStatus(String requestStatus, String classStatus) {
        if (!"MATCHED".equalsIgnoreCase(requestStatus)) {
            return requestStatus;
        }
        if ("CANCELLED".equalsIgnoreCase(classStatus)) {
            return "CANCELLED";
        }
        return "TRIAL".equalsIgnoreCase(classStatus) ? "TRIAL" : "MATCHED";
    }

    private static boolean isCancellable(String status, LocalDate deadline, LocalDate today) {
        if ("CANCELLED".equals(status)) {
            return false;
        }
        return !"MATCHED".equals(status) || deadline == null || !today.isAfter(deadline);
    }

    private static String requestCode(long id, OffsetDateTime createdAt) {
        OffsetDateTime time = createdAt == null ? OffsetDateTime.now(VN_ZONE) : createdAt;
        return "REQ-" + time.atZoneSameInstant(VN_ZONE).format(CODE_DATE) + "-" + id;
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).longValue();
    }

    private static Integer nullableInt(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).intValue();
    }

    private static class SummaryRowMapper implements RowMapper<ClassRequestSummaryResponse> {
        @Override
        public ClassRequestSummaryResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
            String classStatus = rs.getString("class_status");
            String status = resolveStatus(rs.getString("request_status"), classStatus);
            LocalDate activeFrom = rs.getObject("active_from", LocalDate.class);
            LocalDate deadline = "MATCHED".equals(status) ? MatchingLifecycleSupport.cancelDeadline(activeFrom) : null;
            LocalDate today = MatchingLifecycleSupport.today();
            return ClassRequestSummaryResponse.builder()
                    .id(id)
                    .requestCode(requestCode(id, createdAt))
                    .status(status)
                    .tab(status.toLowerCase())
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .tutorId(nullableLong(rs, "requested_tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .tutorAvatarUrl(rs.getString("tutor_avatar_url"))
                    .classRequirement(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .preferredSchedule(rs.getString("preferred_schedule"))
                    .applicationCount(nullableLong(rs, "application_count"))
                    .pendingApplicationCount(nullableLong(rs, "pending_application_count"))
                    .cancelReason(rs.getString("cancel_reason"))
                    .classId(nullableLong(rs, "class_id"))
                    .classStatus(classStatus)
                    .lastTutorId(nullableLong(rs, "last_tutor_id"))
                    .lastTutorName(rs.getString("last_tutor_name"))
                    .activeFrom(activeFrom)
                    .cancelDeadline(deadline)
                    .cancelDaysLeft(deadline == null ? null : ChronoUnit.DAYS.between(today, deadline))
                    .cancellable(isCancellable(status, deadline, today))
                    .createdAt(createdAt)
                    .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                    .build();
        }
    }

    private static class DetailRowMapper implements RowMapper<ClassRequestDetailResponse> {
        @Override
        public ClassRequestDetailResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
            String classStatus = rs.getString("class_status");
            String status = resolveStatus(rs.getString("request_status"), classStatus);
            LocalDate activeFrom = rs.getObject("active_from", LocalDate.class);
            LocalDate deadline = "MATCHED".equals(status) ? MatchingLifecycleSupport.cancelDeadline(activeFrom) : null;
            LocalDate today = MatchingLifecycleSupport.today();
            return ClassRequestDetailResponse.builder()
                    .id(id)
                    .requestCode(requestCode(id, createdAt))
                    .status(status)
                    .tab(status.toLowerCase())
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .parentEmail(rs.getString("parent_email"))
                    .parentAddress(rs.getString("parent_address"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .school(rs.getString("school"))
                    .learningGoal(rs.getString("learning_goal"))
                    .studentUsername(rs.getString("student_username"))
                    .studentAccountCreated(rs.getObject("student_id") != null)
                    .tutorId(nullableLong(rs, "requested_tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .tutorEmail(rs.getString("tutor_email"))
                    .tutorPhone(rs.getString("tutor_phone"))
                    .tutorAvatarUrl(rs.getString("tutor_avatar_url"))
                    .classRequirement(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .feePercentage(rs.getBigDecimal("fee_percentage"))
                    .sessionsPerWeek(nullableInt(rs, "sessions_per_week"))
                    .classSessionsPerWeek(nullableInt(rs, "class_sessions_per_week"))
                    .classPricePerSession(rs.getBigDecimal("class_price_per_session"))
                    .preferredSchedule(rs.getString("preferred_schedule"))
                    .tutorRequirement(rs.getString("tutor_requirement"))
                    .cancelReason(rs.getString("cancel_reason"))
                    .handledByName(rs.getString("handled_by_name"))
                    .applicationCount(nullableLong(rs, "application_count"))
                    .pendingApplicationCount(nullableLong(rs, "pending_application_count"))
                    .classId(nullableLong(rs, "class_id"))
                    .classStatus(classStatus)
                    .lastTutorId(nullableLong(rs, "last_tutor_id"))
                    .lastTutorName(rs.getString("last_tutor_name"))
                    .activeFrom(activeFrom)
                    .cancelDeadline(deadline)
                    .cancelDaysLeft(deadline == null ? null : ChronoUnit.DAYS.between(today, deadline))
                    .cancellable(isCancellable(status, deadline, today))
                    .createdAt(createdAt)
                    .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                    .build();
        }
    }

    private static class ApplicationRowMapper implements RowMapper<ClassApplicationResponse> {
        @Override
        public ClassApplicationResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            return ClassApplicationResponse.builder()
                    .applicationId(rs.getLong("application_id"))
                    .tutorId(rs.getLong("tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .tutorEmail(rs.getString("tutor_email"))
                    .tutorPhone(rs.getString("tutor_phone"))
                    .tutorAvatarUrl(rs.getString("tutor_avatar_url"))
                    .message(rs.getString("message"))
                    .status(rs.getString("status"))
                    .appliedAt(rs.getObject("applied_at", OffsetDateTime.class))
                    .build();
        }
    }
}
