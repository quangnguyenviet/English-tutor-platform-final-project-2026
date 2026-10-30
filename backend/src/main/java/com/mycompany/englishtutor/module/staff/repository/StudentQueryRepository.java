package com.mycompany.englishtutor.module.staff.repository;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.staff.api.response.StudentClassResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentParentResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentSummaryResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc cho màn hình Quản lý học sinh của Lễ tân / Admin (FR-34).
 * Học sinh = {@code users} (role STUDENT) + {@code students} + {@code parents}; lớp lấy từ {@code classes}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentQueryRepository {

    /** Bộ lọc tình trạng học: đang có ít nhất một lớp TRIAL/ACTIVE. */
    public static final String LEARNING_STUDYING = "STUDYING";
    /** Bộ lọc tình trạng học: không có lớp TRIAL/ACTIVE nào. */
    public static final String LEARNING_NOT_STUDYING = "NOT_STUDYING";

    /** Số chữ số tối thiểu để từ khóa được so khớp như số điện thoại. */
    private static final int MIN_PHONE_DIGITS = 3;

    private static final String FROM_BASE = """
            FROM users u
            JOIN students s ON s.id = u.id
            JOIN parents p ON p.id = s.parent_id
            """;

    private static final String CURRENT_CLASS_EXISTS = """
            EXISTS (SELECT 1 FROM classes cc
                    WHERE cc.student_id = s.id AND cc.status IN ('TRIAL', 'ACTIVE'))
            """;

    private static final String SELECT_SUMMARY = """
            SELECT u.id, u.username, u.full_name, u.avatar_url, u.date_of_birth, u.status, u.created_at,
                   s.school, s.grade,
                   p.full_name AS parent_name, p.phone AS parent_phone,
                   cur.class_count, cur.tutor_names
            """ + FROM_BASE + """
            LEFT JOIN LATERAL (
                SELECT COUNT(*) AS class_count,
                       ARRAY_AGG(DISTINCT tu.full_name) AS tutor_names
                FROM classes c
                JOIN users tu ON tu.id = c.tutor_id
                WHERE c.student_id = s.id AND c.status IN ('TRIAL', 'ACTIVE')
            ) cur ON TRUE
            """;

    private static final String SELECT_DETAIL = """
            SELECT u.id, u.username, u.full_name, u.email, u.phone, u.date_of_birth, u.gender, u.avatar_url,
                   u.status, u.must_change_password, u.created_at,
                   s.school, s.grade, s.learning_goal, s.elo,
                   p.id AS parent_id, p.full_name AS parent_name, p.phone AS parent_phone,
                   p.email AS parent_email, p.address AS parent_address
            """ + FROM_BASE + """
            WHERE u.role = 'STUDENT' AND u.id = ?
            """;

    private static final String SELECT_CLASSES = """
            SELECT c.id, c.class_name, c.status, c.teaching_mode, c.tutor_id, tu.full_name AS tutor_name,
                   c.active_from, c.created_at,
                   (SELECT COUNT(*) FROM sessions se
                    WHERE se.class_id = c.id AND se.status = 'COMPLETED') AS completed_sessions
            FROM classes c
            JOIN users tu ON tu.id = c.tutor_id
            WHERE c.student_id = ?
            ORDER BY c.created_at DESC, c.id DESC
            """;

    JdbcTemplate jdbcTemplate;

    /**
     * Danh sách học sinh có phân trang.
     *
     * @param status   {@code ACTIVE}/{@code INACTIVE}, null = tất cả
     * @param keyword  tên học sinh, username, email, tên phụ huynh, SĐT học sinh/phụ huynh
     * @param learning {@link #LEARNING_STUDYING}/{@link #LEARNING_NOT_STUDYING}, null = tất cả
     */
    public PageResponse<StudentSummaryResponse> search(
            String status, String keyword, String learning, Integer page, Integer size) {
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);

        List<Object> params = new ArrayList<>();
        String where = buildWhere(status, keyword, learning, params);

        long total = queryCount(where, params);

        List<Object> queryParams = new ArrayList<>(params);
        queryParams.add(pageSize);
        queryParams.add((long) pageIndex * pageSize);
        List<StudentSummaryResponse> items = jdbcTemplate.query(
                SELECT_SUMMARY + where + " ORDER BY u.created_at DESC, u.id DESC LIMIT ? OFFSET ?",
                (rs, rowNum) -> mapSummary(rs),
                queryParams.toArray());

        return PageResponse.of(items, pageIndex, pageSize, total);
    }

    /** Đếm học sinh theo cùng bộ lọc với {@link #search} (dùng cho badge tab). */
    public long count(String status, String keyword, String learning) {
        List<Object> params = new ArrayList<>();
        return queryCount(buildWhere(status, keyword, learning, params), params);
    }

    /** Chi tiết học sinh kèm phụ huynh và toàn bộ lớp (chưa tách đang học / đã học). */
    public Optional<StudentDetailResponse> findDetail(Long id) {
        List<StudentDetailResponse> rows = jdbcTemplate.query(SELECT_DETAIL, (rs, rowNum) -> mapDetail(rs), id);
        return rows.stream().findFirst();
    }

    /** Toàn bộ lớp của học sinh, mới nhất trước. */
    public List<StudentClassResponse> findClasses(Long studentId) {
        return jdbcTemplate.query(SELECT_CLASSES, (rs, rowNum) -> mapClass(rs), studentId);
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    private long queryCount(String where, List<Object> params) {
        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + FROM_BASE + where, Long.class, params.toArray());
        return total == null ? 0 : total;
    }

    private String buildWhere(String status, String keyword, String learning, List<Object> params) {
        StringBuilder where = new StringBuilder(" WHERE u.role = 'STUDENT' ");

        if (status != null) {
            where.append(" AND u.status = ? ");
            params.add(status);
        }

        if (LEARNING_STUDYING.equals(learning)) {
            where.append(" AND ").append(CURRENT_CLASS_EXISTS);
        } else if (LEARNING_NOT_STUDYING.equals(learning)) {
            where.append(" AND NOT ").append(CURRENT_CLASS_EXISTS);
        }

        String normalized = PublicSearchSupport.normalize(keyword);
        if (normalized != null) {
            String pattern = PublicSearchSupport.likeContains(normalized);
            where.append("""
                     AND (unaccent(lower(u.full_name)) LIKE ? ESCAPE '\\'
                          OR unaccent(lower(p.full_name)) LIKE ? ESCAPE '\\'
                          OR lower(u.username) LIKE ? ESCAPE '\\'
                          OR lower(COALESCE(u.email, '')) LIKE ? ESCAPE '\\'
                    """);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);
            params.add(pattern);

            // SĐT so khớp trên phần chữ số để "0911 000 001" hay "0911-000-001" vẫn tìm được.
            String digits = keyword.replaceAll("[^0-9]", "");
            if (digits.length() >= MIN_PHONE_DIGITS) {
                String phonePattern = "%" + digits + "%";
                where.append("""
                          OR regexp_replace(p.phone, '[^0-9]', '', 'g') LIKE ?
                          OR regexp_replace(COALESCE(u.phone, ''), '[^0-9]', '', 'g') LIKE ?
                        """);
                params.add(phonePattern);
                params.add(phonePattern);
            }
            where.append(") ");
        }
        return where.toString();
    }

    private static StudentSummaryResponse mapSummary(ResultSet rs) throws SQLException {
        return StudentSummaryResponse.builder()
                .id(rs.getLong("id"))
                .username(rs.getString("username"))
                .fullName(rs.getString("full_name"))
                .avatarUrl(rs.getString("avatar_url"))
                .dateOfBirth(rs.getObject("date_of_birth", LocalDate.class))
                .school(rs.getString("school"))
                .grade(rs.getString("grade"))
                .parentName(rs.getString("parent_name"))
                .parentPhone(rs.getString("parent_phone"))
                .status(rs.getString("status"))
                .currentClassCount(rs.getInt("class_count"))
                .currentTutorNames(toStringList(rs.getArray("tutor_names")))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }

    private static StudentDetailResponse mapDetail(ResultSet rs) throws SQLException {
        String parentAddress = rs.getString("parent_address");
        return StudentDetailResponse.builder()
                .id(rs.getLong("id"))
                .username(rs.getString("username"))
                .fullName(rs.getString("full_name"))
                .email(rs.getString("email"))
                .phone(rs.getString("phone"))
                .dateOfBirth(rs.getObject("date_of_birth", LocalDate.class))
                .gender(rs.getString("gender"))
                .avatarUrl(rs.getString("avatar_url"))
                .school(rs.getString("school"))
                .grade(rs.getString("grade"))
                .learningGoal(rs.getString("learning_goal"))
                .elo(rs.getObject("elo", Integer.class))
                .address(parentAddress)
                .status(rs.getString("status"))
                .mustChangePassword(rs.getBoolean("must_change_password"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .parent(StudentParentResponse.builder()
                        .id(rs.getLong("parent_id"))
                        .fullName(rs.getString("parent_name"))
                        .phone(rs.getString("parent_phone"))
                        .email(rs.getString("parent_email"))
                        .address(parentAddress)
                        .build())
                .build();
    }

    private static StudentClassResponse mapClass(ResultSet rs) throws SQLException {
        return StudentClassResponse.builder()
                .id(rs.getLong("id"))
                .className(rs.getString("class_name"))
                .status(rs.getString("status"))
                .teachingMode(rs.getString("teaching_mode"))
                .tutorId(rs.getLong("tutor_id"))
                .tutorName(rs.getString("tutor_name"))
                .activeFrom(rs.getObject("active_from", LocalDate.class))
                .completedSessions(rs.getLong("completed_sessions"))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }

    private static List<String> toStringList(Array array) throws SQLException {
        if (array == null) {
            return List.of();
        }
        Object[] values = (Object[]) array.getArray();
        return Arrays.stream(values).filter(v -> v != null).map(Object::toString).toList();
    }
}
