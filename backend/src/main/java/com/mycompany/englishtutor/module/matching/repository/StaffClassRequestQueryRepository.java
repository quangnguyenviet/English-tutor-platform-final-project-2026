package com.mycompany.englishtutor.module.matching.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
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
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc cho luồng Lễ tân/Admin quản lý lớp cần gia sư (API_DESIGN mục 3.4, UC-REC-02/03/04).
 *
 * <p>Chỉ phục vụ các lớp {@code requested_tutor_id IS NULL} (lớp đăng tuyển), tách biệt với
 * "Đơn ghép lớp chỉ định" ở {@link StaffMatchRequestQueryRepository}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffClassRequestQueryRepository {

    private static final String SELECT_BASE = """
            SELECT cr.id,
                   cr.class_requirement,
                   cr.teaching_mode,
                   cr.price_per_session,
                   cr.fee_percentage,
                   cr.sessions_per_week,
                   cr.preferred_schedule,
                   cr.tutor_requirement,
                   cr.status,
                   cr.cancel_reason,
                   cr.created_at,
                   cr.updated_at,
                   p.full_name   AS parent_name,
                   p.phone       AS parent_phone,
                   p.email       AS parent_email,
                   p.address     AS parent_address,
                   su.full_name  AS student_name,
                   s.grade,
                   s.school,
                   s.learning_goal,
                   hu.full_name  AS handled_by_name,
                   (SELECT COUNT(*) FROM class_applications ca
                     WHERE ca.class_request_id = cr.id AND ca.status <> 'TERMINATED') AS application_count,
                   (SELECT COUNT(*) FROM class_applications ca
                     WHERE ca.class_request_id = cr.id AND ca.status = 'APPLIED') AS pending_application_count,
                   cls.id        AS class_id,
                   cls.status    AS class_status
            FROM class_requests cr
            JOIN parents p ON p.id = cr.parent_id
            LEFT JOIN students s ON s.id = cr.student_id
            LEFT JOIN users su ON su.id = s.id
            LEFT JOIN users hu ON hu.id = cr.handled_by
            LEFT JOIN LATERAL (
                SELECT c.id, c.status FROM classes c
                WHERE c.class_request_id = cr.id
                ORDER BY c.id DESC LIMIT 1
            ) cls ON TRUE
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

    /**
     * Phạm vi "Lớp cần gia sư": lớp chưa chỉ định gia sư (đang tuyển/chờ xử lý), HOẶC lớp đã từng
     * nhận đơn ứng tuyển (tức là lớp đăng tuyển đã được chọn gia sư — vẫn hiển thị ở tab "Đã xử lý").
     * Nhờ đó khi chọn gia sư (gán {@code requested_tutor_id}), lớp vừa vào trang Đơn ghép lớp vừa
     * ở lại trang này; còn Đơn ghép lớp chỉ định (không có đơn ứng tuyển) thì bị loại trừ.
     */
    private static final String SCOPE =
            "(cr.requested_tutor_id IS NULL "
                    + "OR EXISTS (SELECT 1 FROM class_applications cax WHERE cax.class_request_id = cr.id))";

    public PageResponse<ClassRequestSummaryResponse> findClassRequests(
            String tab, String keyword, String sort, Integer page, Integer size) {
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        StringBuilder where = new StringBuilder(" WHERE " + SCOPE + " ");
        List<Object> params = new ArrayList<>();
        applyTabFilter(where, tab);
        applyKeywordFilter(where, keyword, params);

        String countSql = "SELECT COUNT(*) FROM class_requests cr "
                + " JOIN parents p ON p.id = cr.parent_id "
                + " LEFT JOIN students s ON s.id = cr.student_id "
                + " LEFT JOIN users su ON su.id = s.id "
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
        String sql = SELECT_BASE + " WHERE " + SCOPE + " AND cr.id = ?";
        List<ClassRequestDetailResponse> list = jdbcTemplate.query(sql, new DetailRowMapper(), id);
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
        Map<String, Long> counts = new HashMap<>();
        String base = "SELECT COUNT(*) FROM class_requests cr WHERE " + SCOPE;
        counts.put("new", count(base + " AND cr.status = 'NEW'"));
        counts.put("open", count(base + " AND cr.status = 'OPEN'"));
        counts.put("matched", count(base + " AND cr.status = 'MATCHED'"));
        counts.put("rematch", count(base + " AND cr.status = 'REMATCH'"));
        counts.put("cancelled", count(base + " AND cr.status = 'CANCELLED'"));
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
            case "matched" -> where.append(" AND cr.status = 'MATCHED' ");
            case "rematch" -> where.append(" AND cr.status = 'REMATCH' ");
            case "cancelled" -> where.append(" AND cr.status = 'CANCELLED' ");
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
                      OR LOWER(COALESCE(su.full_name, '')) LIKE ?
                      OR LOWER(COALESCE(cr.class_requirement, '')) LIKE ?
                      OR LOWER('LOP-ENG-' || LPAD(cr.id::text, 4, '0')) LIKE ?)
                """);
        for (int i = 0; i < 5; i++) {
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

    private static String requestCode(long id) {
        return "LOP-ENG-" + String.format("%04d", id);
    }

    private static String resolveTab(String status) {
        return status == null ? "new" : status.toLowerCase();
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        Object value = rs.getObject(column);
        return value == null ? null : ((Number) value).longValue();
    }

    private static class SummaryRowMapper implements RowMapper<ClassRequestSummaryResponse> {
        @Override
        public ClassRequestSummaryResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            String status = rs.getString("status");
            return ClassRequestSummaryResponse.builder()
                    .id(id)
                    .requestCode(requestCode(id))
                    .status(status)
                    .tab(resolveTab(status))
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .classRequirement(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .preferredSchedule(rs.getString("preferred_schedule"))
                    .applicationCount(nullableLong(rs, "application_count"))
                    .pendingApplicationCount(nullableLong(rs, "pending_application_count"))
                    .cancelReason(rs.getString("cancel_reason"))
                    .classId(nullableLong(rs, "class_id"))
                    .classStatus(rs.getString("class_status"))
                    .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                    .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                    .build();
        }
    }

    private static class DetailRowMapper implements RowMapper<ClassRequestDetailResponse> {
        @Override
        public ClassRequestDetailResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            String status = rs.getString("status");
            return ClassRequestDetailResponse.builder()
                    .id(id)
                    .requestCode(requestCode(id))
                    .status(status)
                    .tab(resolveTab(status))
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .parentEmail(rs.getString("parent_email"))
                    .parentAddress(rs.getString("parent_address"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .school(rs.getString("school"))
                    .learningGoal(rs.getString("learning_goal"))
                    .classRequirement(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(rs.getBigDecimal("price_per_session"))
                    .feePercentage(rs.getBigDecimal("fee_percentage"))
                    .sessionsPerWeek(rs.getObject("sessions_per_week") != null
                            ? ((Number) rs.getObject("sessions_per_week")).intValue()
                            : null)
                    .preferredSchedule(rs.getString("preferred_schedule"))
                    .tutorRequirement(rs.getString("tutor_requirement"))
                    .cancelReason(rs.getString("cancel_reason"))
                    .handledByName(rs.getString("handled_by_name"))
                    .applicationCount(nullableLong(rs, "application_count"))
                    .pendingApplicationCount(nullableLong(rs, "pending_application_count"))
                    .classId(nullableLong(rs, "class_id"))
                    .classStatus(rs.getString("class_status"))
                    .createdAt(rs.getObject("created_at", OffsetDateTime.class))
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
