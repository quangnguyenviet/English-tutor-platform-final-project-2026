package com.mycompany.englishtutor.module.matching.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.matching.api.response.PublicClassRequestResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PublicClassRequestService {
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
                   p.address
            FROM class_requests cr
            JOIN students s ON s.id = cr.student_id
            JOIN users u ON u.id = cr.student_id
            JOIN parents p ON p.id = cr.parent_id
            WHERE cr.status = 'OPEN'
            """;

    JdbcTemplate jdbcTemplate;

    private static final String COUNT_QUERY = """
            SELECT COUNT(*)
            FROM class_requests cr
            JOIN students s ON s.id = cr.student_id
            WHERE cr.status = 'OPEN'
            """;

    /** Chỉ cho phép sắp xếp theo danh sách trắng để tránh SQL injection qua tham số sort. */
    private static String orderBy(String sort) {
        if ("fee_asc".equals(sort)) {
            return " ORDER BY cr.price_per_session ASC, cr.id DESC";
        }
        if ("fee_desc".equals(sort)) {
            return " ORDER BY cr.price_per_session DESC, cr.id DESC";
        }
        return " ORDER BY cr.created_at DESC, cr.id DESC";
    }

    @Transactional(readOnly = true)
    public PageResponse<PublicClassRequestResponse> getOpenClassRequests(
            String teachingMode, String gradeGroup, String sort, Integer page, Integer size) {
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        StringBuilder where = new StringBuilder();
        List<Object> params = new ArrayList<>();

        if ("ONLINE".equalsIgnoreCase(teachingMode) || "AT_HOME".equalsIgnoreCase(teachingMode)) {
            where.append(" AND cr.teaching_mode = ?");
            params.add(teachingMode.toUpperCase());
        }

        List<String> gradePatterns = PublicSearchSupport.gradePatterns(gradeGroup);
        if (!gradePatterns.isEmpty()) {
            where.append(" AND (")
                    .append(gradePatterns.stream()
                            .map(pattern -> "unaccent(lower(s.grade)) LIKE ? ESCAPE '\\'")
                            .collect(Collectors.joining(" OR ")))
                    .append(")");
            gradePatterns.forEach(pattern -> params.add(PublicSearchSupport.likeContains(pattern)));
        }

        Long total = jdbcTemplate.queryForObject(COUNT_QUERY + where, Long.class, params.toArray());

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(pageSize);
        pageParams.add((long) pageIndex * pageSize);
        List<PublicClassRequestResponse> items = jdbcTemplate.query(
                BASE_QUERY + where + orderBy(sort) + " LIMIT ? OFFSET ?",
                new PublicClassRowMapper(),
                pageParams.toArray());

        return PageResponse.of(items, pageIndex, pageSize, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public PublicClassRequestResponse getOpenClassRequest(Long classRequestId) {
        return jdbcTemplate.query(
                        BASE_QUERY + " AND cr.id = ?",
                        new PublicClassRowMapper(),
                        classRequestId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    private static class PublicClassRowMapper implements RowMapper<PublicClassRequestResponse> {
        @Override
        public PublicClassRequestResponse mapRow(ResultSet resultSet, int rowNum) throws SQLException {
            long id = resultSet.getLong("id");
            return PublicClassRequestResponse.builder()
                    .id(id)
                    .requestCode("LOP-ENG-" + String.format("%04d", id))
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
                    .build();
        }
    }
}
