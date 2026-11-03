package com.mycompany.englishtutor.module.quiz.repository;

import java.sql.ResultSet;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.quiz.api.request.QuizQuestionRequest;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc/ghi cho module quiz (API_DESIGN §3.7, FR-13 — lát cắt gia sư
 * nhập thủ công). V16: quiz gắn bài giảng (quizzes.lesson_id), không gắn buổi
 * học — sở hữu suy qua chuỗi {@code quizzes → lessons → classes.tutor_id}
 * (mỗi lớp 1 gia sư + 1 học sinh, FK thẳng trên {@code classes}).
 *
 * <p>Bảng {@code quizzes}, {@code quiz_questions}, {@code skills} chưa có
 * entity JPA nên dùng JdbcTemplate, tương tự module {@code classroom}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuizRepository {

    /** Chủ sở hữu bài giảng (guard tạo/đọc quiz theo lesson). */
    public record LessonOwnershipRow(Long lessonId, Long classId, Long tutorId, Long studentId) {}

    /** Dòng quiz kèm chuỗi sở hữu (guard cập nhật/giao bài theo quiz). */
    public record QuizOwnershipRow(
            Long quizId,
            Long lessonId,
            Long classId,
            Long tutorId,
            Long studentId,
            String status,
            String title,
            OffsetDateTime deadline,
            Integer totalQuestions) {}

    /** Chi tiết quiz kèm câu hỏi (gia sư view). */
    public record QuizRow(
            Long quizId,
            String title,
            String status,
            OffsetDateTime deadline,
            Long lessonId,
            Integer totalQuestions) {}

    /** Một câu hỏi kèm tên kỹ năng (JOIN LEFT, skill null = câu không gắn kỹ năng). */
    public record QuizQuestionRow(
            Integer questionNumber,
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctAnswer,
            String explanation,
            String cefrLevel,
            String skillCode) {}

    /** Kỹ năng catalog (ô chọn khi soạn quiz). */
    public record SkillRow(String skillCode, String skillName, String category) {}

    JdbcTemplate jdbcTemplate;

    // ------------------------------------------------------------------- OWNERSHIP

    /** Chủ sở hữu bài giảng (không khóa — đủ để guard tạo/đọc quiz theo lesson). */
    public Optional<LessonOwnershipRow> findLessonOwnership(Long lessonId) {
        return jdbcTemplate.query(
                        """
                        SELECT l.id, l.class_id, c.tutor_id, c.student_id
                        FROM lessons l
                        JOIN classes c ON c.id = l.class_id
                        WHERE l.id = ?
                        """,
                        (ResultSet rs, int rowNum) ->
                                new LessonOwnershipRow(
                                        rs.getLong("id"),
                                        rs.getLong("class_id"),
                                        rs.getLong("tutor_id"),
                                        rs.getLong("student_id")),
                        lessonId)
                .stream()
                .findFirst();
    }

    /** Quiz kèm chuỗi sở hữu (khóa FOR UPDATE cho thao tác sửa/giao bài). */
    public Optional<QuizOwnershipRow> lockQuiz(Long quizId) {
        return jdbcTemplate.query(
                        """
                        SELECT q.id, q.lesson_id, q.status, q.title, q.deadline, q.total_questions,
                               l.class_id, c.tutor_id, c.student_id
                        FROM quizzes q
                        JOIN lessons l ON l.id = q.lesson_id
                        JOIN classes c ON c.id = l.class_id
                        WHERE q.id = ?
                        FOR UPDATE OF q
                        """,
                        (ResultSet rs, int rowNum) ->
                                new QuizOwnershipRow(
                                        rs.getLong("id"),
                                        rs.getLong("lesson_id"),
                                        rs.getLong("class_id"),
                                        rs.getLong("tutor_id"),
                                        rs.getLong("student_id"),
                                        rs.getString("status"),
                                        rs.getString("title"),
                                        rs.getObject("deadline", OffsetDateTime.class),
                                        rs.getObject("total_questions", Integer.class)),
                        quizId)
                .stream()
                .findFirst();
    }

    /** Quiz không khóa (đọc chi tiết — guard bằng ownership query khác khi cần). */
    public Optional<QuizRow> findQuiz(Long quizId) {
        return jdbcTemplate.query(
                        """
                        SELECT id, title, status, deadline, lesson_id, total_questions
                        FROM quizzes
                        WHERE id = ?
                        """,
                        (ResultSet rs, int rowNum) ->
                                new QuizRow(
                                        rs.getLong("id"),
                                        rs.getString("title"),
                                        rs.getString("status"),
                                        rs.getObject("deadline", OffsetDateTime.class),
                                        rs.getLong("lesson_id"),
                                        rs.getObject("total_questions", Integer.class)),
                        quizId)
                .stream()
                .findFirst();
    }

    // ------------------------------------------------------------------- READ

    /** Danh sách quiz của 1 bài giảng (card "Quiz bài giảng"). */
    public List<QuizRow> findLessonQuizzes(Long lessonId) {
        return jdbcTemplate.query(
                        """
                        SELECT id, title, status, deadline, lesson_id, total_questions, created_at
                        FROM quizzes
                        WHERE lesson_id = ?
                        ORDER BY id
                        """,
                        (ResultSet rs, int rowNum) ->
                                new QuizRow(
                                        rs.getLong("id"),
                                        rs.getString("title"),
                                        rs.getString("status"),
                                        rs.getObject("deadline", OffsetDateTime.class),
                                        rs.getLong("lesson_id"),
                                        rs.getObject("total_questions", Integer.class)),
                        lessonId)
                .stream()
                .toList();
    }

    /** Toàn bộ câu hỏi của quiz theo số thứ tự (skill JOIN để trả skill_code). */
    public List<QuizQuestionRow> findQuizQuestions(Long quizId) {
        return jdbcTemplate.query(
                        """
                        SELECT qq.question_number, qq.question_text, qq.option_a, qq.option_b,
                               qq.option_c, qq.option_d, qq.correct_answer, qq.explanation,
                               qq.cefr_level, sk.skill_code
                        FROM quiz_questions qq
                        LEFT JOIN skills sk ON sk.id = qq.skill_id
                        WHERE qq.quiz_id = ?
                        ORDER BY qq.question_number
                        """,
                        (ResultSet rs, int rowNum) ->
                                new QuizQuestionRow(
                                        rs.getInt("question_number"),
                                        rs.getString("question_text"),
                                        rs.getString("option_a"),
                                        rs.getString("option_b"),
                                        rs.getString("option_c"),
                                        rs.getString("option_d"),
                                        rs.getString("correct_answer"),
                                        rs.getString("explanation"),
                                        rs.getString("cefr_level"),
                                        rs.getString("skill_code")),
                        quizId)
                .stream()
                .toList();
    }

    /** Catalog kỹ năng chung (ô chọn khi soạn quiz). */
    public List<SkillRow> findSkills() {
        return jdbcTemplate.query(
                        "SELECT skill_code, skill_name, category FROM skills ORDER BY category, skill_code",
                        (ResultSet rs, int rowNum) ->
                                new SkillRow(
                                        rs.getString("skill_code"),
                                        rs.getString("skill_name"),
                                        rs.getString("category")))
                .stream()
                .toList();
    }

    public Optional<Long> findSkillIdByCode(String skillCode) {
        List<Long> ids =
                jdbcTemplate.queryForList(
                        "SELECT id FROM skills WHERE skill_code = ?", Long.class, skillCode);
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    // ------------------------------------------------------------------- WRITE

    /** Tạo quiz bản nháp. {@code source} do service quyết định (quiz nhập
     *  *thủ công ghi 'IMPORTED' — không có giá trị 'MANUAL' trong CHK V5). */
    public Long insertQuiz(Long lessonId, String title, String source, int totalQuestions) {
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO quizzes (lesson_id, title, status, source, total_questions)
                VALUES (?, ?, 'DRAFT', ?, ?)
                RETURNING id
                """,
                Long.class,
                lessonId,
                title,
                source,
                totalQuestions);
    }

    public void insertQuizQuestion(
            Long quizId,
            int questionNumber,
            QuizQuestionRequest question,
            Long skillId) {
        jdbcTemplate.update(
                """
                INSERT INTO quiz_questions (
                    quiz_id, question_number, question_text, option_a, option_b,
                    option_c, option_d, correct_answer, explanation, cefr_level, skill_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                quizId,
                questionNumber,
                question.getQuestionText().trim(),
                question.getOptionA().trim(),
                question.getOptionB().trim(),
                question.getOptionC().trim(),
                question.getOptionD().trim(),
                question.getCorrectAnswer().trim().toUpperCase(),
                trimToNull(question.getExplanation()),
                trimToNull(question.getCefrLevel()).toUpperCase(),
                skillId);
    }

    /** Xoá toàn bộ câu hỏi của quiz (bước 1 của cập nhật DRAFT: ghi đè danh sách). */
    public void deleteQuizQuestions(Long quizId) {
        jdbcTemplate.update("DELETE FROM quiz_questions WHERE quiz_id = ?", quizId);
    }

    public void updateQuizTitle(Long quizId, String title, int totalQuestions) {
        jdbcTemplate.update(
                """
                UPDATE quizzes
                SET title = ?, total_questions = ?, updated_at = NOW()
                WHERE id = ?
                """,
                title,
                totalQuestions,
                quizId);
    }

    /** DRAFT → ASSIGNED + đặt thời hạn (gọi trong transaction, sau khi lock). */
    public void markQuizAssigned(Long quizId, OffsetDateTime deadline) {
        jdbcTemplate.update(
                """
                UPDATE quizzes
                SET status = 'ASSIGNED', deadline = ?, updated_at = NOW()
                WHERE id = ?
                """,
                deadline,
                quizId);
    }

    /** Bản tạm T8-A1 (giống module classroom): thông báo học sinh khi giao quiz. */
    public void insertQuizAssignedNotification(
            Long studentId, String quizTitle, OffsetDateTime deadline, Long classId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                studentId,
                "Quiz mới được giao",
                "Quiz " + quizTitle + " đã được giao, hoàn thành trước " + deadline,
                classId);
    }

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}