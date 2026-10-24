package com.mycompany.englishtutor.module.matching.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc cho luồng gia sư xem lớp cần gia sư (API_DESIGN mục 3.4).
 *
 * <p>Tách khỏi service để service chỉ còn nghiệp vụ; SQL và row mapper nằm cùng một chỗ.
 * Mọi response đều đã loại bỏ thông tin liên hệ phụ huynh, chỉ trả khu vực chung.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassRequestQueryRepository {

    private static final String BASE_QUERY = """
            SELECT cr.id,
                   cr.class_requirement,
                   cr.teaching_mode,
                   cr.price_per_session,
                   cr.preferred_schedule,
                   cr.tutor_requirement,
                   cr.created_at,
                   s.grade,
                   s.school,
                   s.learning_goal,
                   u.gender,
                   p.address,
                   ca.id AS application_id,
                   ca.message AS my_message,
                   ca.applied_at AS my_applied_at
            FROM class_requests cr
            JOIN students s ON s.id = cr.student_id
            JOIN users u ON u.id = cr.student_id
            JOIN parents p ON p.id = cr.parent_id
            LEFT JOIN class_applications ca ON ca.class_request_id = cr.id AND ca.tutor_id = ?
            WHERE cr.status = 'OPEN'
            """;

    private static final String COUNT_QUERY = """
            SELECT COUNT(*)
            FROM class_requests cr
            JOIN students s ON s.id = cr.student_id
            JOIN parents p ON p.id = cr.parent_id
            WHERE cr.status = 'OPEN'
            """;

    private static final String APPLICATIONS_QUERY = """
            SELECT ca.id AS application_id,
                   ca.status AS application_status,
                   ca.message,
                   ca.applied_at,
                   cr.id AS request_id,
                   cr.status AS request_status,
                   cr.class_requirement,
                   cr.teaching_mode,
                   cr.price_per_session,
                   cr.preferred_schedule,
                   cr.created_at AS request_created_at,
                   s.grade,
                   s.school,
                   s.learning_goal,
                   u.gender,
                   p.address
            FROM class_applications ca
            JOIN class_requests cr ON cr.id = ca.class_request_id
            JOIN students s ON s.id = cr.student_id
            JOIN users u ON u.id = cr.student_id
            JOIN parents p ON p.id = cr.parent_id
            WHERE ca.tutor_id = ?
            ORDER BY ca.applied_at DESC, ca.id DESC
            """;

    JdbcTemplate jdbcTemplate;

    /** Bộ lọc danh sách lớp; các trường null/rỗng được bỏ qua. */
    public record Filter(String keyword, String teachingMode, String gradeGroup, String sort) {}

    public PageResponse<TutorOpenClassRequestResponse> findOpenRequests(
            Long tutorId, Filter filter, int page, int size) {
        StringBuilder where = new StringBuilder();
        List<Object> filterParams = new ArrayList<>();
        appendFilters(where, filterParams, filter);

        Long total = jdbcTemplate.queryForObject(COUNT_QUERY + where, Long.class, filterParams.toArray());

        List<Object> pageParams = new ArrayList<>();
        pageParams.add(tutorId);
        pageParams.addAll(filterParams);
        pageParams.add(size);
        pageParams.add((long) page * size);

        List<TutorOpenClassRequestResponse> items = jdbcTemplate.query(
                BASE_QUERY + where + orderBy(filter.sort()) + " LIMIT ? OFFSET ?",
                new TutorOpenClassRowMapper(),
                pageParams.toArray());

        return PageResponse.of(items, page, size, total == null ? 0 : total);
    }

    public Optional<TutorOpenClassRequestResponse> findOpenRequest(Long tutorId, Long classRequestId) {
        return jdbcTemplate.query(
                        BASE_QUERY + " AND cr.id = ?",
                        new TutorOpenClassRowMapper(),
                        tutorId,
                        classRequestId)
                .stream()
                .findFirst();
    }

    public List<TutorApplicationResponse> findApplicationsByTutor(Long tutorId) {
        return jdbcTemplate.query(APPLICATIONS_QUERY, new TutorApplicationRowMapper(), tutorId);
    }

    private static String orderBy(String sort) {
        if ("fee_asc".equals(sort)) {
            return " ORDER BY cr.price_per_session ASC NULLS LAST, cr.id DESC";
        }
        if ("fee_desc".equals(sort)) {
            return " ORDER BY cr.price_per_session DESC NULLS LAST, cr.id DESC";
        }
        return " ORDER BY cr.created_at DESC, cr.id DESC";
    }

    private static void appendFilters(StringBuilder where, List<Object> params, Filter filter) {
        String teachingMode = filter.teachingMode();
        if ("ONLINE".equalsIgnoreCase(teachingMode) || "AT_HOME".equalsIgnoreCase(teachingMode)) {
            where.append(" AND cr.teaching_mode = ?");
            params.add(teachingMode.toUpperCase());
        }

        List<String> gradePatterns = PublicSearchSupport.gradePatterns(filter.gradeGroup());
        if (!gradePatterns.isEmpty()) {
            where.append(" AND (")
                    .append(gradePatterns.stream()
                            .map(pattern -> "unaccent(lower(s.grade)) LIKE ? ESCAPE '\\'")
                            .collect(Collectors.joining(" OR ")))
                    .append(")");
            gradePatterns.forEach(pattern -> params.add(PublicSearchSupport.likeContains(pattern)));
        }

        String normalizedKeyword = PublicSearchSupport.normalize(filter.keyword());
        if (normalizedKeyword != null) {
            String pattern = PublicSearchSupport.likeContains(normalizedKeyword);
            where.append(" AND (")
                    .append("unaccent(lower(cr.class_requirement)) LIKE ? ESCAPE '\\'")
                    .append(" OR unaccent(lower(cr.tutor_requirement)) LIKE ? ESCAPE '\\'")
                    .append(" OR unaccent(lower(s.grade)) LIKE ? ESCAPE '\\'")
                    .append(" OR unaccent(lower(s.school)) LIKE ? ESCAPE '\\'")
                    .append(" OR unaccent(lower(p.address)) LIKE ? ESCAPE '\\'")
                    .append(" OR unaccent(lower('LOP-ENG-' || LPAD(cr.id::text, 4, '0'))) LIKE ? ESCAPE '\\'")
                    .append(")");
            for (int i = 0; i < 6; i++) {
                params.add(pattern);
            }
        }
    }

    private static String requestCode(long id) {
        return "LOP-ENG-" + String.format("%04d", id);
    }

    private static class TutorOpenClassRowMapper implements RowMapper<TutorOpenClassRequestResponse> {
        @Override
        public TutorOpenClassRequestResponse mapRow(ResultSet resultSet, int rowNum) throws SQLException {
            long id = resultSet.getLong("id");
            Object applicationId = resultSet.getObject("application_id");
            return TutorOpenClassRequestResponse.builder()
                    .id(id)
                    .requestCode(requestCode(id))
                    .classRequirement(resultSet.getString("class_requirement"))
                    .gradeLevel(resultSet.getString("grade"))
                    .studentGender(resultSet.getString("gender"))
                    .teachingMode(resultSet.getString("teaching_mode"))
                    .generalLocation(PublicSearchSupport.toGeneralLocation(resultSet.getString("address")))
                    .pricePerSession(resultSet.getBigDecimal("price_per_session"))
                    .preferredSchedule(resultSet.getString("preferred_schedule"))
                    .tutorRequirement(resultSet.getString("tutor_requirement"))
                    .learningGoal(resultSet.getString("learning_goal"))
                    .school(resultSet.getString("school"))
                    .createdAt(resultSet.getObject("created_at", OffsetDateTime.class))
                    .applied(applicationId != null)
                    .applicationId(applicationId == null ? null : ((Number) applicationId).longValue())
                    .myMessage(resultSet.getString("my_message"))
                    .appliedAt(resultSet.getObject("my_applied_at", OffsetDateTime.class))
                    .build();
        }
    }

    private static class TutorApplicationRowMapper implements RowMapper<TutorApplicationResponse> {
        @Override
        public TutorApplicationResponse mapRow(ResultSet resultSet, int rowNum) throws SQLException {
            long requestId = resultSet.getLong("request_id");
            return TutorApplicationResponse.builder()
                    .applicationId(resultSet.getLong("application_id"))
                    .status(resultSet.getString("application_status"))
                    .message(resultSet.getString("message"))
                    .appliedAt(resultSet.getObject("applied_at", OffsetDateTime.class))
                    .classRequest(TutorApplicationResponse.ClassSummary.builder()
                            .id(requestId)
                            .requestCode(requestCode(requestId))
                            .classRequirement(resultSet.getString("class_requirement"))
                            .gradeLevel(resultSet.getString("grade"))
                            .teachingMode(resultSet.getString("teaching_mode"))
                            .generalLocation(
                                    PublicSearchSupport.toGeneralLocation(resultSet.getString("address")))
                            .pricePerSession(resultSet.getBigDecimal("price_per_session"))
                            .preferredSchedule(resultSet.getString("preferred_schedule"))
                            .createdAt(resultSet.getObject("request_created_at", OffsetDateTime.class))
                            .status(resultSet.getString("request_status"))
                            .build())
                    .build();
        }
    }
}
