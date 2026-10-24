package com.mycompany.englishtutor.module.matching.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.matching.api.request.ApplyClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * API phía gia sư cho luồng xem lớp đang tuyển và ứng tuyển (API_DESIGN mục 3.4).
 *
 * <p>Chỉ đọc {@code class_requests}/{@code students}/{@code users}/{@code parents}; ghi
 * {@code class_applications} khi ứng tuyển/rút và ghi tạm {@code notifications} cho Lễ tân
 * (sẽ thay bằng NotificationService ở T8-A1). Mọi response đều loại bỏ thông tin liên hệ
 * của phụ huynh, chỉ giữ khu vực chung.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassRequestService {

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
    UserRepository userRepository;
    TutorRepository tutorRepository;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public PageResponse<TutorOpenClassRequestResponse> getOpenRequests(
            String keyword, String teachingMode, String gradeGroup, String sort, Integer page, Integer size) {
        Long tutorId = getCurrentUserId();
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        StringBuilder where = new StringBuilder();
        List<Object> filterParams = new ArrayList<>();
        appendFilters(where, filterParams, keyword, teachingMode, gradeGroup);

        Long total = jdbcTemplate.queryForObject(
                COUNT_QUERY + where, Long.class, filterParams.toArray());

        List<Object> pageParams = new ArrayList<>();
        pageParams.add(tutorId);
        pageParams.addAll(filterParams);
        pageParams.add(pageSize);
        pageParams.add((long) pageIndex * pageSize);

        List<TutorOpenClassRequestResponse> items = jdbcTemplate.query(
                BASE_QUERY + where + orderBy(sort) + " LIMIT ? OFFSET ?",
                new TutorOpenClassRowMapper(),
                pageParams.toArray());

        return PageResponse.of(items, pageIndex, pageSize, total == null ? 0 : total);
    }

    @Transactional(readOnly = true)
    public TutorOpenClassRequestResponse getOpenRequest(Long classRequestId) {
        Long tutorId = getCurrentUserId();
        return jdbcTemplate.query(
                        BASE_QUERY + " AND cr.id = ?",
                        new TutorOpenClassRowMapper(),
                        tutorId,
                        classRequestId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<TutorApplicationResponse> getMyApplications() {
        Long tutorId = getCurrentUserId();
        return jdbcTemplate.query(APPLICATIONS_QUERY, new TutorApplicationRowMapper(), tutorId);
    }

    // ----------------------------------------------------------------- WRITE

    @Transactional
    public TutorApplicationResponse apply(Long classRequestId, ApplyClassRequest request) {
        User user = getCurrentUser();
        Long tutorId = user.getId();
        requireActiveTutor(tutorId);

        // Khóa dòng đơn để không đua với Lễ tân đang publish/cancel/select (T7-A3).
        List<String> statuses = jdbcTemplate.queryForList(
                "SELECT status FROM class_requests WHERE id = ? FOR UPDATE", String.class, classRequestId);
        if (statuses.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        if (!"OPEN".equals(statuses.getFirst())) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_OPEN);
        }

        Long applicationId;
        try {
            applicationId = jdbcTemplate.queryForObject(
                    "INSERT INTO class_applications (class_request_id, tutor_id, message) "
                            + "VALUES (?, ?, ?) RETURNING id",
                    Long.class,
                    classRequestId,
                    tutorId,
                    request.getMessage().trim());
        } catch (DataIntegrityViolationException ex) {
            // UNIQUE(class_request_id, tutor_id) là chốt chặn race khi bấm ứng tuyển hai lần.
            throw new AppException(ErrorCode.CLASS_ALREADY_APPLIED);
        }

        notifyReceptionists(classRequestId, user.getFullName());
        return TutorApplicationResponse.builder()
                .applicationId(applicationId)
                .status("APPLIED")
                .message(request.getMessage().trim())
                .appliedAt(OffsetDateTime.now())
                .build();
    }

    @Transactional
    public void withdrawApplication(Long applicationId) {
        Long tutorId = getCurrentUserId();

        List<ApplicationState> states = jdbcTemplate.query(
                """
                SELECT ca.id, ca.tutor_id, ca.status AS app_status, cr.status AS request_status,
                       EXISTS (SELECT 1 FROM class_applications sel
                               WHERE sel.class_request_id = ca.class_request_id
                                 AND sel.status = 'SELECTED') AS has_selected
                FROM class_applications ca
                JOIN class_requests cr ON cr.id = ca.class_request_id
                WHERE ca.id = ?
                FOR UPDATE OF cr
                """,
                (rs, rowNum) -> new ApplicationState(
                        rs.getLong("tutor_id"),
                        rs.getString("app_status"),
                        rs.getString("request_status"),
                        rs.getBoolean("has_selected")),
                applicationId);

        // Không có hoặc không thuộc gia sư hiện tại: cùng một mã 404 để không lộ đơn của người khác.
        if (states.isEmpty() || !tutorId.equals(states.getFirst().tutorId())) {
            throw new AppException(ErrorCode.APPLICATION_NOT_FOUND);
        }

        ApplicationState state = states.getFirst();
        if (!"APPLIED".equals(state.applicationStatus())
                || !"OPEN".equals(state.requestStatus())
                || state.hasSelected()) {
            throw new AppException(ErrorCode.APPLICATION_NOT_WITHDRAWABLE);
        }

        jdbcTemplate.update("DELETE FROM class_applications WHERE id = ?", applicationId);
    }

    // ---------------------------------------------------------------- HELPER

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private void requireActiveTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));
        if (!ProfileStatus.ACTIVE.name().equals(tutor.getProfileStatus())) {
            throw new AppException(ErrorCode.TUTOR_NOT_ACTIVE);
        }
    }

    /** Bản tạm: ghi thẳng bảng notifications cho Lễ tân, thay bằng NotificationService ở T8-A1. */
    private void notifyReceptionists(long classRequestId, String tutorName) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'CLASS_REQUEST', ? FROM users
                WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                "Gia sư ứng tuyển lớp mới",
                "Gia sư " + tutorName + " vừa ứng tuyển lớp " + requestCode(classRequestId)
                        + ". Vào danh sách ứng tuyển để ghép lớp.",
                classRequestId);
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

    private static void appendFilters(
            StringBuilder where, List<Object> params, String keyword, String teachingMode, String gradeGroup) {
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

        String normalizedKeyword = PublicSearchSupport.normalize(keyword);
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

    private record ApplicationState(Long tutorId, String applicationStatus, String requestStatus,
            boolean hasSelected) {}

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
