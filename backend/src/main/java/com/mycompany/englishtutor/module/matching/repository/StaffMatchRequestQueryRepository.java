package com.mycompany.englishtutor.module.matching.repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestSummaryResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StaffMatchRequestQueryRepository {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    JdbcTemplate jdbcTemplate;

    private static final String SELECT_BASE = """
            SELECT cr.id,
                   cr.requested_tutor_id,
                   cr.student_id,
                   cr.class_requirement,
                   cr.teaching_mode,
                   cr.price_per_session,
                   cr.preferred_schedule,
                   cr.status AS request_status,
                   cr.cancel_reason,
                   cr.created_at,
                   cr.updated_at,
                   p.full_name AS parent_name,
                   p.phone AS parent_phone,
                   p.email AS parent_email,
                   p.address AS parent_address,
                   su.full_name AS student_name,
                   s.grade,
                   s.school,
                   s.learning_goal,
                   tu.full_name AS tutor_name,
                   tu.email AS tutor_email,
                   tu.phone AS tutor_phone,
                   tu.avatar_url AS tutor_avatar_url,
                   hu.full_name AS handled_by_name,
                   c.id AS class_id,
                   c.status AS class_status
            FROM class_requests cr
            JOIN parents p ON p.id = cr.parent_id
            LEFT JOIN students s ON s.id = cr.student_id
            LEFT JOIN users su ON su.id = s.id
            LEFT JOIN tutors t ON t.id = cr.requested_tutor_id
            LEFT JOIN users tu ON tu.id = t.id
            LEFT JOIN users hu ON hu.id = cr.handled_by
            LEFT JOIN classes c ON c.class_request_id = cr.id
            """;

    public PageResponse<MatchRequestSummaryResponse> findMatchRequests(
            String tab, String keyword, Integer page, Integer size) {
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        StringBuilder where = new StringBuilder(" WHERE cr.requested_tutor_id IS NOT NULL ");
        List<Object> params = new ArrayList<>();

        applyTabFilter(where, tab);
        applyKeywordFilter(where, keyword, params);

        String countSql = "SELECT COUNT(*) FROM class_requests cr "
                + " JOIN parents p ON p.id = cr.parent_id "
                + " LEFT JOIN students s ON s.id = cr.student_id "
                + " LEFT JOIN users su ON su.id = s.id "
                + " LEFT JOIN tutors t ON t.id = cr.requested_tutor_id "
                + " LEFT JOIN users tu ON tu.id = t.id "
                + " LEFT JOIN classes c ON c.class_request_id = cr.id "
                + where;

        Long totalItems = jdbcTemplate.queryForObject(countSql, Long.class, params.toArray());
        long total = totalItems == null ? 0 : totalItems;

        int totalPages = (int) Math.ceil((double) total / pageSize);

        String querySql = SELECT_BASE + where + " ORDER BY cr.created_at DESC, cr.id DESC LIMIT ? OFFSET ?";
        List<Object> queryParams = new ArrayList<>(params);
        queryParams.add(pageSize);
        queryParams.add(pageIndex * pageSize);

        List<MatchRequestSummaryResponse> items = jdbcTemplate.query(
                querySql, new MatchRequestSummaryRowMapper(), queryParams.toArray());

        return PageResponse.<MatchRequestSummaryResponse>builder()
                .page(pageIndex)
                .size(pageSize)
                .totalItems(total)
                .totalPages(totalPages)
                .items(items)
                .build();
    }

    public Optional<MatchRequestDetailResponse> findDetailById(Long id) {
        String sql = SELECT_BASE + " WHERE cr.id = ? ORDER BY c.id DESC LIMIT 1";
        List<MatchRequestDetailResponse> list = jdbcTemplate.query(sql, new MatchRequestDetailRowMapper(), id);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    public Map<String, Long> getTabCounts() {
        Map<String, Long> counts = new HashMap<>();

        Long pending = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM class_requests WHERE requested_tutor_id IS NOT NULL AND status = 'NEW'", Long.class);
        Long trial = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM class_requests cr
                JOIN classes c ON c.class_request_id = cr.id
                WHERE cr.requested_tutor_id IS NOT NULL AND c.status = 'TRIAL' AND cr.status != 'CANCELLED'
                """, Long.class);
        Long matched = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM class_requests cr
                JOIN classes c ON c.class_request_id = cr.id
                WHERE cr.requested_tutor_id IS NOT NULL AND c.status IN ('ACTIVE', 'COMPLETED') AND cr.status != 'CANCELLED'
                """, Long.class);
        Long cancelled = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM class_requests cr
                LEFT JOIN classes c ON c.class_request_id = cr.id
                WHERE cr.requested_tutor_id IS NOT NULL AND (cr.status = 'CANCELLED' OR c.status = 'CANCELLED')
                """, Long.class);
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM class_requests WHERE requested_tutor_id IS NOT NULL", Long.class);

        counts.put("pending", pending == null ? 0L : pending);
        counts.put("trial", trial == null ? 0L : trial);
        counts.put("matched", matched == null ? 0L : matched);
        counts.put("cancelled", cancelled == null ? 0L : cancelled);
        counts.put("total", total == null ? 0L : total);
        return counts;
    }

    private void applyTabFilter(StringBuilder where, String tab) {
        if (tab == null || tab.isBlank() || "all".equalsIgnoreCase(tab)) {
            return;
        }
        switch (tab.toLowerCase()) {
            case "pending":
                where.append(" AND cr.status = 'NEW' ");
                break;
            case "trial":
                where.append(" AND c.status = 'TRIAL' AND cr.status != 'CANCELLED' ");
                break;
            case "matched":
                where.append(" AND c.status IN ('ACTIVE', 'COMPLETED') AND cr.status != 'CANCELLED' ");
                break;
            case "cancelled":
                where.append(" AND (cr.status = 'CANCELLED' OR c.status = 'CANCELLED') ");
                break;
            default:
                break;
        }
    }

    private void applyKeywordFilter(StringBuilder where, String keyword, List<Object> params) {
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            where.append("""
                     AND (LOWER(p.full_name) LIKE ?
                          OR p.phone LIKE ?
                          OR LOWER(COALESCE(su.full_name, '')) LIKE ?
                          OR LOWER(COALESCE(tu.full_name, '')) LIKE ?
                          OR LOWER(COALESCE(cr.class_requirement, '')) LIKE ?)
                    """);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
        }
    }

    private static String resolveStatus(String crStatus, String classStatus) {
        if ("CANCELLED".equalsIgnoreCase(crStatus) || "CANCELLED".equalsIgnoreCase(classStatus)) {
            return "CANCELLED";
        }
        if ("ACTIVE".equalsIgnoreCase(classStatus) || "COMPLETED".equalsIgnoreCase(classStatus)) {
            return "MATCHED";
        }
        if ("TRIAL".equalsIgnoreCase(classStatus)) {
            return "TRIAL";
        }
        if ("NEW".equalsIgnoreCase(crStatus)) {
            return "PENDING";
        }
        return crStatus;
    }

    private static String resolveTab(String status) {
        return switch (status.toUpperCase()) {
            case "PENDING" -> "pending";
            case "TRIAL" -> "trial";
            case "MATCHED" -> "matched";
            case "CANCELLED" -> "cancelled";
            default -> "pending";
        };
    }

    private static String formatRequestCode(long id, OffsetDateTime createdAt) {
        return "REQ-" + createdAt.atZoneSameInstant(VN_ZONE).format(CODE_DATE) + "-" + id;
    }

    private static class MatchRequestSummaryRowMapper implements RowMapper<MatchRequestSummaryResponse> {
        @Override
        public MatchRequestSummaryResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
            if (createdAt == null) {
                createdAt = OffsetDateTime.now(VN_ZONE);
            }

            String crStatus = rs.getString("request_status");
            String classStatus = rs.getString("class_status");
            String status = resolveStatus(crStatus, classStatus);
            String tab = resolveTab(status);

            BigDecimal price = rs.getBigDecimal("price_per_session");
            Long classId = rs.getObject("class_id") != null ? rs.getLong("class_id") : null;

            return MatchRequestSummaryResponse.builder()
                    .id(id)
                    .requestCode(formatRequestCode(id, createdAt))
                    .status(status)
                    .tab(tab)
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .tutorId(rs.getLong("requested_tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .tutorAvatarUrl(rs.getString("tutor_avatar_url"))
                    .className(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(price)
                    .createdAt(createdAt)
                    .cancelReason(rs.getString("cancel_reason"))
                    .classId(classId)
                    .classStatus(classStatus)
                    .build();
        }
    }

    private static class MatchRequestDetailRowMapper implements RowMapper<MatchRequestDetailResponse> {
        @Override
        public MatchRequestDetailResponse mapRow(ResultSet rs, int rowNum) throws SQLException {
            long id = rs.getLong("id");
            OffsetDateTime createdAt = rs.getObject("created_at", OffsetDateTime.class);
            if (createdAt == null) {
                createdAt = OffsetDateTime.now(VN_ZONE);
            }
            OffsetDateTime updatedAt = rs.getObject("updated_at", OffsetDateTime.class);

            String crStatus = rs.getString("request_status");
            String classStatus = rs.getString("class_status");
            String status = resolveStatus(crStatus, classStatus);
            String tab = resolveTab(status);

            BigDecimal price = rs.getBigDecimal("price_per_session");
            Long classId = rs.getObject("class_id") != null ? rs.getLong("class_id") : null;

            return MatchRequestDetailResponse.builder()
                    .id(id)
                    .requestCode(formatRequestCode(id, createdAt))
                    .status(status)
                    .tab(tab)
                    .parentName(rs.getString("parent_name"))
                    .parentPhone(rs.getString("parent_phone"))
                    .parentEmail(rs.getString("parent_email"))
                    .parentAddress(rs.getString("parent_address"))
                    .studentName(rs.getString("student_name"))
                    .grade(rs.getString("grade"))
                    .school(rs.getString("school"))
                    .learningGoal(rs.getString("learning_goal"))
                    .tutorId(rs.getLong("requested_tutor_id"))
                    .tutorName(rs.getString("tutor_name"))
                    .tutorEmail(rs.getString("tutor_email"))
                    .tutorPhone(rs.getString("tutor_phone"))
                    .tutorAvatarUrl(rs.getString("tutor_avatar_url"))
                    .className(rs.getString("class_requirement"))
                    .teachingMode(rs.getString("teaching_mode"))
                    .pricePerSession(price)
                    .preferredSchedule(rs.getString("preferred_schedule"))
                    .cancelReason(rs.getString("cancel_reason"))
                    .createdAt(createdAt)
                    .updatedAt(updatedAt)
                    .handledByName(rs.getString("handled_by_name"))
                    .classId(classId)
                    .classStatus(classStatus)
                    .build();
        }
    }
}
