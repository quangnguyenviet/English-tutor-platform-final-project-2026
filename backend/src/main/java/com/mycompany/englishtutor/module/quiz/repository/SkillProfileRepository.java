package com.mycompany.englishtutor.module.quiz.repository;

import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Đọc hồ sơ kỹ năng học sinh (SKP) cho màn soạn quiz AI (FR-13, UC-T06 bước 2).
 *
 * <p>Dữ liệu lấy từ view {@code v_student_skill_stats} (gộp từ
 * {@code quiz_answers} JOIN {@code quiz_questions}) JOIN {@code skills} lấy
 * tên kỹ năng. Chưa có dữ liệu trả lời quiz thì view rỗng — service trả
 * danh sách rỗng, giao diện hiển thị trạng thái "chưa có dữ liệu".
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class SkillProfileRepository {

    /** Một dòng thống kê kỹ năng của học sinh (đã JOIN tên + nhóm). */
    public record SkillProfileRow(
            String skillCode,
            String skillName,
            String category,
            Integer totalCorrect,
            Integer totalIncorrect,
            Integer totalAttempts,
            Double errorRate,
            OffsetDateTime lastPracticedAt) {}

    /** Thông tin học sinh ẩn danh (AD-2: không tên/SĐT, chỉ mã + cấp + mục tiêu). */
    public record StudentContextRow(Long studentId, String grade, String learningGoal) {}

    JdbcTemplate jdbcTemplate;

    /** SKP của 1 học sinh: mọi kỹ năng có ít nhất 1 lần trả lời quiz. */
    public List<SkillProfileRow> findStudentSkillStats(Long studentId) {
        return jdbcTemplate
                .query(
                        """
                        SELECT sk.skill_code, sk.skill_name, sk.category,
                               v.total_correct, v.total_incorrect, v.total_attempts,
                               v.error_rate, v.last_practiced_at
                        FROM v_student_skill_stats v
                        JOIN skills sk ON sk.id = v.skill_id
                        WHERE v.student_id = ?
                        ORDER BY v.error_rate DESC NULLS LAST, v.last_practiced_at ASC NULLS FIRST
                        """,
                        (ResultSet rs, int rowNum) ->
                                new SkillProfileRow(
                                        rs.getString("skill_code"),
                                        rs.getString("skill_name"),
                                        rs.getString("category"),
                                        toInt(rs.getObject("total_correct")),
                                        toInt(rs.getObject("total_incorrect")),
                                        toInt(rs.getObject("total_attempts")),
                                        toDouble(rs.getObject("error_rate")),
                                        rs.getObject("last_practiced_at", OffsetDateTime.class)),
                        studentId)
                .stream()
                .toList();
    }

    /**
     * PostgreSQL {@code COUNT(...)} trả về BIGINT (Long) — không cast cứng
     * {@code (Integer) getObject()} (ClassCastException khi view có dữ liệu).
     */
    private static Integer toInt(Object value) {
        return value instanceof Number n ? n.intValue() : null;
    }

    /** {@code ROUND(...)::NUMERIC} trả về BigDecimal — convert an toàn. */
    private static Double toDouble(Object value) {
        return value instanceof Number n ? n.doubleValue() : null;
    }

    /** Lớp thuộc về gia sư (guard endpoint skill-profile): có {@code c.tutor_id = ?}. */
    public boolean classOwnedBy(Long classId, Long tutorId) {
        Integer count =
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM classes WHERE id = ? AND tutor_id = ?",
                        Integer.class,
                        classId,
                        tutorId);
        return count != null && count > 0;
    }

    /** Lớp có tồn tại (để phân biệt CLASS_NOT_FOUND vs CLASS_NOT_OWNED). */
    public boolean classExists(Long classId) {
        Integer count =
                jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM classes WHERE id = ?", Integer.class, classId);
        return count != null && count > 0;
    }

    /** Học sinh ẩn danh của 1 lớp (mã id + cấp + mục tiêu) — guard bằng lớp sở hữu. */
    public Optional<StudentContextRow> findStudentContext(Long classId) {
        return jdbcTemplate
                .query(
                        """
                        SELECT c.student_id, st.grade, st.learning_goal
                        FROM classes c
                        JOIN students st ON st.id = c.student_id
                        WHERE c.id = ?
                        """,
                        (ResultSet rs, int rowNum) ->
                                new StudentContextRow(
                                        rs.getLong("student_id"),
                                        rs.getString("grade"),
                                        rs.getString("learning_goal")),
                        classId)
                .stream()
                .findFirst();
    }
}
