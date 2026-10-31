package com.mycompany.englishtutor.module.student.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.QuizQuestionForStudent;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentSessionItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentTutorItem;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn cổng Học sinh (API_DESIGN §3.6, §3.7). Các bảng chưa có entity JPA nên dùng
 * JdbcTemplate như module {@code classroom}/{@code quiz}. Sở hữu suy ra qua
 * {@code classes.student_id = students.id = users.id}.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentPortalRepository {

    /** Quiz kèm chuỗi sở hữu, dùng cho start/answer/result. */
    public record QuizAccessRow(
            Long quizId,
            String title,
            String status,
            OffsetDateTime deadline,
            Integer totalQuestions,
            Long studentId,
            Long tutorId) {}

    /** Câu hỏi đầy đủ (có đáp án) — chỉ dùng phía server để chấm. */
    public record QuestionRow(Long id, Long quizId, String correctAnswer, String explanation, String cefrLevel) {}

    /** Bài làm đã lưu của một câu (phục vụ idempotent). */
    public record StoredAnswerRow(
            String selectedAnswer, boolean correct, Integer eloBefore, Integer eloAfter, Integer eloChange) {}

    JdbcTemplate jdbc;

    private static final String SESSION_SELECT =
            """
            SELECT s.id, s.class_id, c.class_name, t.full_name AS tutor_name, s.title,
                   s.session_date, s.start_time, s.end_time, s.status, s.teaching_mode,
                   s.meeting_url, s.location,
                   (s.log_knowledge IS NOT NULL OR s.log_homework IS NOT NULL) AS has_log,
                   s.log_knowledge, s.log_homework,
                   ROW_NUMBER() OVER (PARTITION BY s.class_id
                                      ORDER BY s.session_date, s.start_time, s.id) AS session_number,
                   (SELECT COUNT(*) FROM session_materials m WHERE m.session_id = s.id) AS material_count
            FROM sessions s
            JOIN classes c ON c.id = s.class_id
            JOIN users t ON t.id = c.tutor_id
            """;

    private static final RowMapper<StudentSessionItem> SESSION_MAPPER = (rs, rowNum) -> {
        LocalDate date = rs.getObject("session_date", LocalDate.class);
        return new StudentSessionItem(
                rs.getLong("id"),
                rs.getLong("id"),
                rs.getLong("class_id"),
                rs.getString("class_name"),
                rs.getString("tutor_name"),
                rs.getInt("session_number"),
                rs.getString("title"),
                date,
                date,
                rs.getObject("start_time", LocalTime.class),
                rs.getObject("end_time", LocalTime.class),
                rs.getString("status"),
                rs.getString("teaching_mode"),
                rs.getString("meeting_url"),
                rs.getString("location"),
                rs.getBoolean("has_log"),
                rs.getString("log_knowledge"),
                rs.getString("log_homework"),
                rs.getInt("material_count"));
    };

    // ------------------------------------------------------------------ STUDENT

    public Optional<String> findFullName(Long studentId) {
        return jdbc.query("SELECT full_name FROM users WHERE id = ?", (rs, i) -> rs.getString(1), studentId)
                .stream()
                .findFirst();
    }

    public boolean studentExists(Long studentId) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM students WHERE id = ?", Integer.class, studentId);
        return count != null && count > 0;
    }

    public Integer findElo(Long studentId) {
        return jdbc.queryForObject("SELECT elo FROM students WHERE id = ?", Integer.class, studentId);
    }

    /** Khóa dòng học sinh để cập nhật Elo an toàn khi trả lời đồng thời. */
    public Integer lockElo(Long studentId) {
        return jdbc.queryForObject("SELECT elo FROM students WHERE id = ? FOR UPDATE", Integer.class, studentId);
    }

    public void updateElo(Long studentId, int elo) {
        jdbc.update("UPDATE students SET elo = ?, updated_at = NOW() WHERE id = ?", elo, studentId);
    }

    public Integer lastEloChange(Long studentId) {
        List<Integer> rows = jdbc.query(
                "SELECT elo_change FROM quiz_answers WHERE student_id = ? ORDER BY answered_at DESC, id DESC LIMIT 1",
                (rs, i) -> rs.getObject(1, Integer.class),
                studentId);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public int countUnreadNotifications(Long userId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = FALSE", Integer.class, userId);
        return count == null ? 0 : count;
    }

    // ----------------------------------------------------------------- SESSIONS

    /** Buổi học của học sinh trong [from, to) — lịch tuần. */
    public List<StudentSessionItem> findSessionsBetween(Long studentId, LocalDate from, LocalDate to) {
        return jdbc.query(
                SESSION_SELECT
                        + " WHERE c.student_id = ? AND s.session_date >= ? AND s.session_date < ?"
                        + " ORDER BY s.session_date, s.start_time, s.id",
                SESSION_MAPPER,
                studentId,
                from,
                to);
    }

    /** Lịch sử buổi học, mới nhất trước; lọc theo lớp nếu có. */
    public List<StudentSessionItem> findSessionHistory(Long studentId, Long classId) {
        String sql = SESSION_SELECT
                + " WHERE c.student_id = ?"
                + (classId != null ? " AND s.class_id = ?" : "")
                + " ORDER BY s.session_date DESC, s.start_time DESC, s.id DESC";
        return classId != null
                ? jdbc.query(sql, SESSION_MAPPER, studentId, classId)
                : jdbc.query(sql, SESSION_MAPPER, studentId);
    }

    /** Buổi sắp tới gần nhất (chưa diễn ra, chưa hủy/vắng). */
    public Optional<StudentSessionItem> findNextSession(Long studentId) {
        return jdbc.query(
                        SESSION_SELECT
                                + " WHERE c.student_id = ? AND s.status IN ('SCHEDULED', 'IN_PROGRESS')"
                                + " AND (s.session_date > CURRENT_DATE"
                                + "      OR (s.session_date = CURRENT_DATE AND s.end_time >= CURRENT_TIME))"
                                + " ORDER BY s.session_date, s.start_time, s.id LIMIT 1",
                        SESSION_MAPPER,
                        studentId)
                .stream()
                .findFirst();
    }

    /** Buổi đã hoàn thành gần nhất. */
    public Optional<StudentSessionItem> findLastCompletedSession(Long studentId) {
        return jdbc.query(
                        SESSION_SELECT
                                + " WHERE c.student_id = ? AND s.status = 'COMPLETED'"
                                + " ORDER BY s.session_date DESC, s.start_time DESC, s.id DESC LIMIT 1",
                        SESSION_MAPPER,
                        studentId)
                .stream()
                .findFirst();
    }

    public List<StudentTutorItem> findTutors(Long studentId) {
        return jdbc.query(
                """
                SELECT c.id, c.class_name, c.status, c.tutor_id, t.full_name AS tutor_name, c.active_from,
                       (SELECT COUNT(*) FROM sessions s WHERE s.class_id = c.id AND s.status = 'COMPLETED') AS done
                FROM classes c
                JOIN users t ON t.id = c.tutor_id
                WHERE c.student_id = ? AND c.status IN ('TRIAL', 'ACTIVE')
                ORDER BY c.created_at DESC
                """,
                (rs, i) -> new StudentTutorItem(
                        rs.getLong("id"),
                        rs.getString("class_name"),
                        rs.getString("status"),
                        rs.getLong("tutor_id"),
                        rs.getString("tutor_name"),
                        rs.getObject("active_from", LocalDate.class),
                        rs.getInt("done"),
                        findWeeklySlots(rs.getLong("id"))),
                studentId);
    }

    /** Ca cố định dạng "thứ|giờ bắt đầu|giờ kết thúc" (thứ ISO 1–7). */
    private List<String> findWeeklySlots(Long classId) {
        return jdbc.query(
                "SELECT day_of_week, start_time, end_time FROM class_schedules WHERE class_id = ?"
                        + " ORDER BY day_of_week, start_time",
                (rs, i) -> "%d|%s|%s"
                        .formatted(
                                rs.getInt("day_of_week"),
                                rs.getObject("start_time", LocalTime.class).toString().substring(0, 5),
                                rs.getObject("end_time", LocalTime.class).toString().substring(0, 5)),
                classId);
    }

    // ------------------------------------------------------------------- QUIZZES

    /**
     * Quiz học sinh nhìn thấy (ASSIGNED/COMPLETED/EXPIRED). Quiz ASSIGNED quá hạn được tính là EXPIRED.
     * {@code status}, {@code sessionId} lọc tùy chọn; {@code answeredCount} đếm bài làm của chính học sinh.
     */
    public List<StudentQuizItem> findQuizzes(Long studentId, String status, Long sessionId) {
        String sql =
                """
                SELECT * FROM (
                    SELECT q.id, q.title, q.deadline, q.total_questions, q.session_id,
                           s.title AS session_title, t.full_name AS tutor_name,
                           CASE WHEN q.status = 'ASSIGNED' AND q.deadline IS NOT NULL AND q.deadline < NOW()
                                THEN 'EXPIRED' ELSE q.status END AS eff_status,
                           (SELECT COUNT(*) FROM quiz_answers a
                              JOIN quiz_questions qq ON qq.id = a.question_id
                             WHERE qq.quiz_id = q.id AND a.student_id = c.student_id) AS answered
                    FROM quizzes q
                    JOIN sessions s ON s.id = q.session_id
                    JOIN classes c ON c.id = s.class_id
                    JOIN users t ON t.id = c.tutor_id
                    WHERE c.student_id = ? AND q.status <> 'DRAFT'
                ) x
                WHERE (?::text IS NULL OR x.eff_status = ?)
                  AND (?::bigint IS NULL OR x.session_id = ?)
                ORDER BY x.deadline NULLS LAST, x.id DESC
                """;
        return jdbc.query(
                sql,
                (rs, i) -> new StudentQuizItem(
                        rs.getLong("id"),
                        rs.getString("title"),
                        rs.getString("eff_status"),
                        rs.getObject("deadline", OffsetDateTime.class),
                        rs.getObject("total_questions", Integer.class),
                        rs.getInt("answered"),
                        rs.getLong("session_id"),
                        rs.getString("session_title"),
                        rs.getString("tutor_name")),
                studentId,
                status,
                status,
                sessionId,
                sessionId);
    }

    public Optional<QuizAccessRow> findQuizAccess(Long quizId) {
        return jdbc.query(
                        """
                        SELECT q.id, q.title, q.status, q.deadline, q.total_questions, c.student_id, c.tutor_id
                        FROM quizzes q
                        JOIN sessions s ON s.id = q.session_id
                        JOIN classes c ON c.id = s.class_id
                        WHERE q.id = ?
                        """,
                        (rs, i) -> new QuizAccessRow(
                                rs.getLong("id"),
                                rs.getString("title"),
                                rs.getString("status"),
                                rs.getObject("deadline", OffsetDateTime.class),
                                rs.getObject("total_questions", Integer.class),
                                rs.getLong("student_id"),
                                rs.getLong("tutor_id")),
                        quizId)
                .stream()
                .findFirst();
    }

    public int countQuestions(Long quizId) {
        Integer n = jdbc.queryForObject("SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = ?", Integer.class, quizId);
        return n == null ? 0 : n;
    }

    public int countAnswers(Long quizId, Long studentId) {
        Integer n = jdbc.queryForObject(
                """
                SELECT COUNT(*) FROM quiz_answers a JOIN quiz_questions qq ON qq.id = a.question_id
                WHERE qq.quiz_id = ? AND a.student_id = ?
                """,
                Integer.class,
                quizId,
                studentId);
        return n == null ? 0 : n;
    }

    /** Câu chưa trả lời kế tiếp theo thứ tự câu hỏi (không kèm đáp án đúng). */
    public Optional<QuizQuestionForStudent> findNextQuestion(Long quizId, Long studentId) {
        return jdbc.query(
                        """
                        SELECT qq.id, qq.question_number, qq.question_text, qq.option_a, qq.option_b,
                               qq.option_c, qq.option_d, qq.cefr_level, sk.skill_name
                        FROM quiz_questions qq
                        LEFT JOIN skills sk ON sk.id = qq.skill_id
                        WHERE qq.quiz_id = ?
                          AND NOT EXISTS (SELECT 1 FROM quiz_answers a
                                           WHERE a.question_id = qq.id AND a.student_id = ?)
                        ORDER BY qq.question_number
                        LIMIT 1
                        """,
                        (rs, i) -> new QuizQuestionForStudent(
                                rs.getLong("id"),
                                rs.getInt("question_number"),
                                rs.getString("question_text"),
                                rs.getString("option_a"),
                                rs.getString("option_b"),
                                rs.getString("option_c"),
                                rs.getString("option_d"),
                                rs.getString("skill_name"),
                                rs.getString("cefr_level")),
                        quizId,
                        studentId)
                .stream()
                .findFirst();
    }

    public Optional<QuestionRow> findQuestion(Long quizId, Long questionId) {
        return jdbc.query(
                        "SELECT id, quiz_id, correct_answer, explanation, cefr_level FROM quiz_questions"
                                + " WHERE id = ? AND quiz_id = ?",
                        (rs, i) -> new QuestionRow(
                                rs.getLong("id"),
                                rs.getLong("quiz_id"),
                                rs.getString("correct_answer").trim(),
                                rs.getString("explanation"),
                                rs.getString("cefr_level")),
                        questionId,
                        quizId)
                .stream()
                .findFirst();
    }

    public Optional<StoredAnswerRow> findStoredAnswer(Long studentId, Long questionId) {
        return jdbc.query(
                        "SELECT selected_answer, is_correct, elo_before, elo_after, elo_change FROM quiz_answers"
                                + " WHERE student_id = ? AND question_id = ?",
                        (rs, i) -> new StoredAnswerRow(
                                rs.getString("selected_answer").trim(),
                                rs.getBoolean("is_correct"),
                                rs.getObject("elo_before", Integer.class),
                                rs.getObject("elo_after", Integer.class),
                                rs.getObject("elo_change", Integer.class)),
                        studentId,
                        questionId)
                .stream()
                .findFirst();
    }

    /** Ghi bài làm; UNIQUE (student, question) chống ghi trùng. @return số dòng được chèn (0 nếu đã có). */
    public int insertAnswer(
            Long studentId, Long questionId, String selected, boolean correct, int before, int after, int change) {
        return jdbc.update(
                """
                INSERT INTO quiz_answers (question_id, student_id, selected_answer, is_correct,
                                          elo_before, elo_after, elo_change)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (student_id, question_id) DO NOTHING
                """,
                questionId,
                studentId,
                selected,
                correct,
                before,
                after,
                change);
    }

    public void markQuizCompleted(Long quizId) {
        jdbc.update(
                "UPDATE quizzes SET status = 'COMPLETED', updated_at = NOW() WHERE id = ? AND status = 'ASSIGNED'",
                quizId);
    }

    public void markQuizExpired(Long quizId) {
        jdbc.update(
                "UPDATE quizzes SET status = 'EXPIRED', updated_at = NOW() WHERE id = ? AND status = 'ASSIGNED'",
                quizId);
    }

    /** Tổng hợp kết quả: [số đúng, tổng thay đổi Elo]. */
    public int[] summarize(Long quizId, Long studentId) {
        return jdbc.queryForObject(
                """
                SELECT COALESCE(SUM(CASE WHEN a.is_correct THEN 1 ELSE 0 END), 0) AS correct,
                       COALESCE(SUM(a.elo_change), 0) AS elo
                FROM quiz_answers a JOIN quiz_questions qq ON qq.id = a.question_id
                WHERE qq.quiz_id = ? AND a.student_id = ?
                """,
                (ResultSet rs, int i) -> new int[] {rs.getInt("correct"), rs.getInt("elo")},
                quizId,
                studentId);
    }

    public List<ReviewItem> findReviewList(Long studentId) {
        return jdbc.query(
                """
                SELECT qq.id AS question_id, qq.quiz_id, q.title AS quiz_title, qq.question_text,
                       qq.option_a, qq.option_b, qq.option_c, qq.option_d, a.selected_answer,
                       qq.correct_answer, qq.explanation, sk.skill_name, a.answered_at
                FROM quiz_answers a
                JOIN quiz_questions qq ON qq.id = a.question_id
                JOIN quizzes q ON q.id = qq.quiz_id
                LEFT JOIN skills sk ON sk.id = qq.skill_id
                WHERE a.student_id = ? AND a.is_correct = FALSE
                ORDER BY a.answered_at DESC, qq.id
                """,
                (rs, i) -> mapReview(rs),
                studentId);
    }

    private static ReviewItem mapReview(ResultSet rs) throws SQLException {
        return new ReviewItem(
                rs.getLong("question_id"),
                rs.getLong("quiz_id"),
                rs.getString("quiz_title"),
                rs.getString("question_text"),
                rs.getString("option_a"),
                rs.getString("option_b"),
                rs.getString("option_c"),
                rs.getString("option_d"),
                rs.getString("selected_answer").trim(),
                rs.getString("correct_answer").trim(),
                rs.getString("explanation"),
                rs.getString("skill_name"),
                rs.getObject("answered_at", OffsetDateTime.class));
    }
}
