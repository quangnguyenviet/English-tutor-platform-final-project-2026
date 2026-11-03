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
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizQuestion;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentMaterialItem;
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

    /** Quiz kèm chuỗi sở hữu (V16: quiz gắn lesson), dùng cho start/answer/result.
     *  Trường cuối giữ tên {@code sessionId} cho ổn định (thực chất là lessonId). */
    public record QuizAccessRow(
            Long quizId,
            String title,
            String status,
            OffsetDateTime deadline,
            Integer totalQuestions,
            Long studentId,
            Long tutorId,
            Long sessionId) {}

    /** Câu hỏi đầy đủ (có đáp án) — chỉ dùng phía server để chấm. */
    public record QuestionRow(Long id, Long quizId, String correctAnswer, String explanation, String cefrLevel) {}

    /** Bài làm đã lưu của một câu (phục vụ idempotent). */
    public record StoredAnswerRow(
            String selectedAnswer, boolean correct, Integer eloBefore, Integer eloAfter, Integer eloChange) {}

    /** Lớp đang mở (dạy thử / chính thức) của học sinh — nguồn để dựng lịch cố định. */
    public record ClassBrief(Long id, String className, String tutorName, String teachingMode, String status) {}

    /** Ngoại lệ dời lịch có ngày gốc ngoài tuần đang xem nhưng ngày mới rơi vào tuần đó. */
    public record IncomingReschedule(
            Long classId,
            LocalDate originalDate,
            LocalDate newDate,
            LocalTime newStart,
            LocalTime newEnd,
            String teachingMode,
            String meetingUrl,
            String location) {}

    JdbcTemplate jdbc;

    private static final String SESSION_SELECT =
            """
            SELECT t.id, t.class_id, c.class_name, u.full_name AS tutor_name,
                   c.class_name AS title,
                   t.log_date, t.start_time, t.end_time,
                   'COMPLETED' AS status, c.teaching_mode,
                   CASE WHEN c.trial_date = t.log_date AND c.trial_start_time = t.start_time
                        THEN c.trial_meeting_url END AS meeting_url,
                   CASE WHEN c.trial_date = t.log_date AND c.trial_start_time = t.start_time
                        THEN c.trial_location END AS location,
                   TRUE AS has_log,
                   t.knowledge AS log_knowledge, t.homework AS log_homework,
                   ROW_NUMBER() OVER (PARTITION BY t.class_id
                                      ORDER BY t.log_date, t.start_time, t.id) AS session_number,
                   (SELECT COUNT(*) FROM lesson_materials lm
                        JOIN lessons l ON l.id = lm.lesson_id
                      WHERE l.class_id = t.class_id) AS material_count
            FROM teaching_logs t
            JOIN classes c ON c.id = t.class_id
            JOIN users u ON u.id = c.tutor_id
            """;

    private static final RowMapper<StudentSessionItem> SESSION_MAPPER = (rs, rowNum) -> {
        LocalDate date = rs.getObject("log_date", LocalDate.class);
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
                rs.getInt("material_count"),
                null);
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

    public List<ClassBrief> findOpenClasses(Long studentId) {
        return jdbc.query(
                """
                SELECT c.id, c.class_name, t.full_name AS tutor_name, c.teaching_mode, c.status
                FROM classes c
                JOIN users t ON t.id = c.tutor_id
                WHERE c.student_id = ? AND c.status IN ('TRIAL', 'ACTIVE')
                ORDER BY c.id
                """,
                (rs, i) -> new ClassBrief(
                        rs.getLong("id"),
                        rs.getString("class_name"),
                        rs.getString("tutor_name"),
                        rs.getString("teaching_mode"),
                        rs.getString("status")),
                studentId);
    }

    public List<IncomingReschedule> findIncomingReschedules(Long classId, LocalDate from, LocalDate to) {
        return jdbc.query(
                """
                SELECT e.class_id, e.exception_date, e.new_date, e.new_start_time, e.new_end_time,
                       e.new_teaching_mode, e.new_meeting_url, e.new_location,
                       sc.start_time, sc.end_time
                FROM schedule_exceptions e
                JOIN class_schedules sc ON sc.id = e.schedule_id
                WHERE e.class_id = ? AND e.exception_type = 'RESCHEDULED'
                  AND e.new_date >= ? AND e.new_date < ?
                  AND (e.exception_date < ? OR e.exception_date >= ?)
                """,
                (rs, i) -> new IncomingReschedule(
                        rs.getLong("class_id"),
                        rs.getObject("exception_date", LocalDate.class),
                        rs.getObject("new_date", LocalDate.class),
                        firstNonNull(rs.getObject("new_start_time", LocalTime.class), rs.getObject("start_time", LocalTime.class)),
                        firstNonNull(rs.getObject("new_end_time", LocalTime.class), rs.getObject("end_time", LocalTime.class)),
                        rs.getString("new_teaching_mode"),
                        rs.getString("new_meeting_url"),
                        rs.getString("new_location")),
                classId,
                from,
                to,
                from,
                to);
    }

    private static <T> T firstNonNull(T first, T second) {
        return first != null ? first : second;
    }

    /** Buổi học (nhật ký dạy học) của học sinh trong [from, to) — lịch tuần. */
    public List<StudentSessionItem> findSessionsBetween(Long studentId, LocalDate from, LocalDate to) {
        return jdbc.query(
                SESSION_SELECT
                        + " WHERE c.student_id = ? AND t.log_date >= ? AND t.log_date < ?"
                        + " ORDER BY t.log_date, t.start_time, t.id",
                SESSION_MAPPER,
                studentId,
                from,
                to);
    }

    /** Lịch sử buổi học (tất cả nhật ký), mới nhất trước; lọc theo lớp nếu có. */
    public List<StudentSessionItem> findSessionHistory(Long studentId, Long classId) {
        String sql = SESSION_SELECT
                + " WHERE c.student_id = ?"
                + (classId != null ? " AND t.class_id = ?" : "")
                + " ORDER BY t.log_date DESC, t.start_time DESC, t.id DESC";
        return classId != null
                ? jdbc.query(sql, SESSION_MAPPER, studentId, classId)
                : jdbc.query(sql, SESSION_MAPPER, studentId);
    }

    /** Buổi sắp tới gần nhất: ca cố định (class_schedules) hoặc ca thử
     *  (classes.trial_*) đầu tiên chưa diễn ra, của các lớp đang mở. */
    public Optional<StudentSessionItem> findNextSession(Long studentId) {
        return jdbc.query(
                        """
                        SELECT * FROM (
                            SELECT c.id AS class_id, c.class_name, u.full_name AS tutor_name,
                                   cs.id AS schedule_id, cs.day_of_week AS day_of_week,
                                   cs.start_time, cs.end_time, 'SCHEDULED' AS status,
                                   c.teaching_mode, NULL::text AS meeting_url, NULL::text AS location,
                                   CASE
                                       WHEN cs.valid_from IS NOT NULL AND cs.valid_from > CURRENT_DATE
                                           THEN cs.valid_from + (((cs.day_of_week - FLOOR(DATE_PART('isodow', cs.valid_from)) + 7) % 7)::int)
                                       ELSE CURRENT_DATE + (((cs.day_of_week - FLOOR(DATE_PART('isodow', CURRENT_DATE)) + 7) % 7)::int)
                                   END AS next_date,
                                   2 AS kind
                            FROM classes c
                            JOIN users u ON u.id = c.tutor_id
                            JOIN class_schedules cs ON cs.class_id = c.id
                            WHERE c.student_id = ? AND c.status IN ('TRIAL', 'ACTIVE')
                            UNION ALL
                            SELECT c.id, c.class_name, u.full_name,
                                   NULL, NULL, c.trial_start_time, c.trial_end_time,
                                   CASE WHEN c.trial_date IS NULL THEN NULL
                                        WHEN c.trial_date >= CURRENT_DATE THEN 'SCHEDULED' ELSE NULL END,
                                   c.trial_teaching_mode, c.trial_meeting_url, c.trial_location,
                                   c.trial_date, 1 AS kind
                            FROM classes c
                            JOIN users u ON u.id = c.tutor_id
                            WHERE c.student_id = ? AND c.status = 'TRIAL' AND c.trial_date IS NOT NULL
                        ) x
                        WHERE x.next_date IS NOT NULL
                          AND (x.kind = 1 OR (x.next_date > CURRENT_DATE
                               OR (x.next_date = CURRENT_DATE AND x.end_time >= CURRENT_TIME)))
                        ORDER BY x.next_date, x.start_time, x.kind
                        LIMIT 1
                        """,
                        (rs, i) -> {
                            LocalDate date = rs.getObject("next_date", LocalDate.class);
                            String status =
                                    date != null && date.isAfter(LocalDate.now()) ? "SCHEDULED" : "IN_PROGRESS";
                            return new StudentSessionItem(
                                    null,
                                    null,
                                    rs.getLong("class_id"),
                                    rs.getString("class_name"),
                                    rs.getString("tutor_name"),
                                    null,
                                    rs.getString("class_name"),
                                    date,
                                    date,
                                    rs.getObject("start_time", LocalTime.class),
                                    rs.getObject("end_time", LocalTime.class),
                                    status,
                                    rs.getString("teaching_mode"),
                                    rs.getString("meeting_url"),
                                    rs.getString("location"),
                                    false,
                                    null,
                                    null,
                                    0,
                                    null);
                        },
                        studentId,
                        studentId)
                .stream()
                .findFirst();
    }

    /** Buổi đã hoàn thành gần nhất = nhật ký dạy học mới nhất. */
    public Optional<StudentSessionItem> findLastCompletedSession(Long studentId) {
        return jdbc.query(
                        SESSION_SELECT
                                + " WHERE c.student_id = ?"
                                + " ORDER BY t.log_date DESC, t.start_time DESC, t.id DESC LIMIT 1",
                        SESSION_MAPPER,
                        studentId)
                .stream()
                .findFirst();
    }

    public List<StudentTutorItem> findTutors(Long studentId) {
        return jdbc.query(
                """
                SELECT c.id, c.class_name, c.status, c.tutor_id, t.full_name AS tutor_name, c.active_from,
                       (SELECT COUNT(*) FROM lessons l WHERE l.class_id = c.id AND l.status = 'PUBLISHED') AS done
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

    // ------------------------------------------------------------------- MATERIALS

    /** Trỏ buổi-log (id, class_id) để guard quyền truy cập tài liệu theo học sinh. */
    public record LogBrief(Long id, Long classId) {}

    public Optional<LogBrief> findTeachingLogById(Long logId) {
        return jdbc.query(
                        "SELECT id, class_id FROM teaching_logs WHERE id = ?",
                        (rs, i) -> new LogBrief(rs.getLong("id"), rs.getLong("class_id")),
                        logId)
                .stream()
                .findFirst();
    }

    public Long findClassStudentId(Long classId) {
        return jdbc.query(
                        "SELECT student_id FROM classes WHERE id = ?",
                        (rs, i) -> rs.getLong("student_id"),
                        classId)
                .stream()
                .findFirst()
                .orElse(null);
    }

    /**
     * Tài liệu của các bài giảng PUBLISHED thuộc lớp của chính học sinh (V16:
     * tài liệu nằm ở lesson của lớp, không ở buổi). Hiển thị trong chi tiết
     * buổi học khi học sinh mở buổi của lớp đó.
     */
    public List<StudentMaterialItem> findClassMaterials(Long classId, Long studentId) {
        return jdbc.query(
                """
                SELECT lm.id, lm.file_name, lm.file_type, lm.file_size,
                       u.full_name AS uploaded_by, lm.created_at
                FROM lesson_materials lm
                JOIN lessons l ON l.id = lm.lesson_id
                JOIN classes c ON c.id = l.class_id
                JOIN users u ON u.id = lm.uploaded_by
                WHERE c.id = ? AND c.student_id = ? AND l.status = 'PUBLISHED'
                ORDER BY lm.id
                """,
                (rs, i) -> new StudentMaterialItem(
                        rs.getLong("id"),
                        rs.getString("file_name"),
                        rs.getString("file_type"),
                        rs.getObject("file_size", Long.class),
                        rs.getString("uploaded_by"),
                        rs.getObject("created_at", OffsetDateTime.class)),
                classId,
                studentId);
    }

    // ------------------------------------------------------------------- QUIZZES

    /**
     * Quiz học sinh nhìn thấy (ASSIGNED/COMPLETED/EXPIRED). Quiz ASSIGNED quá hạn được tính là EXPIRED.
     * {@code status}, {@code lessonId} (vẫn nhận dưới tên tham số sessionId cho ổn định API) lọc tùy chọn;
     * {@code answeredCount} đếm bài làm của chính học sinh.
     */
    public List<StudentQuizItem> findQuizzes(Long studentId, String status, Long sessionId) {
        String sql =
                """
                SELECT * FROM (
                    SELECT q.id, q.title, q.deadline, q.total_questions, q.lesson_id,
                           l.title AS session_title, t.full_name AS tutor_name,
                           CASE WHEN q.status = 'ASSIGNED' AND q.deadline IS NOT NULL AND q.deadline < NOW()
                                THEN 'EXPIRED' ELSE q.status END AS eff_status,
                           (SELECT COUNT(*) FROM quiz_answers a
                              JOIN quiz_questions qq ON qq.id = a.question_id
                             WHERE qq.quiz_id = q.id AND a.student_id = c.student_id) AS answered
                    FROM quizzes q
                    JOIN lessons l ON l.id = q.lesson_id
                    JOIN classes c ON c.id = l.class_id
                    JOIN users t ON t.id = c.tutor_id
                    WHERE c.student_id = ? AND q.status <> 'DRAFT'
                ) x
                WHERE (?::text IS NULL OR x.eff_status = ?)
                  AND (?::bigint IS NULL OR x.lesson_id = ?)
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
                        rs.getLong("lesson_id"),
                        rs.getString("session_title"),
                        rs.getString("tutor_name")),
                studentId,
                status,
                status,
                sessionId,
                sessionId);
    }

    /** {@code lessonId} = bài giảng quiz gắn với (V16: quiz gắn lesson, không gắn buổi). */
    public Optional<QuizAccessRow> findQuizAccess(Long quizId) {
        return jdbc.query(
                        """
                        SELECT q.id, q.title, q.status, q.deadline, q.total_questions, c.student_id, c.tutor_id, q.lesson_id
                        FROM quizzes q
                        JOIN lessons l ON l.id = q.lesson_id
                        JOIN classes c ON c.id = l.class_id
                        WHERE q.id = ?
                        """,
                        (rs, i) -> new QuizAccessRow(
                                rs.getLong("id"),
                                rs.getString("title"),
                                rs.getString("status"),
                                rs.getObject("deadline", OffsetDateTime.class),
                                rs.getObject("total_questions", Integer.class),
                                rs.getLong("student_id"),
                                rs.getLong("tutor_id"),
                                rs.getLong("lesson_id")),
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

    /** Toàn bộ câu của quiz kèm bài làm của học sinh; đáp án đúng và giải thích chỉ lộ ra ở câu đã trả lời. */
    public List<StudentQuizQuestion> findQuestionsForStudent(Long quizId, Long studentId) {
        return jdbc.query(
                """
                SELECT qq.id, qq.question_number, qq.question_text, qq.option_a, qq.option_b, qq.option_c,
                       qq.option_d, qq.cefr_level, sk.skill_name, qq.correct_answer, qq.explanation,
                       a.selected_answer, a.is_correct
                FROM quiz_questions qq
                LEFT JOIN skills sk ON sk.id = qq.skill_id
                LEFT JOIN quiz_answers a ON a.question_id = qq.id AND a.student_id = ?
                WHERE qq.quiz_id = ?
                ORDER BY qq.question_number
                """,
                (rs, i) -> {
                    boolean answered = rs.getString("selected_answer") != null;
                    return new StudentQuizQuestion(
                            rs.getLong("id"),
                            rs.getInt("question_number"),
                            rs.getString("question_text"),
                            rs.getString("option_a"),
                            rs.getString("option_b"),
                            rs.getString("option_c"),
                            rs.getString("option_d"),
                            rs.getString("skill_name"),
                            rs.getString("cefr_level"),
                            answered,
                            answered ? rs.getString("selected_answer").trim() : null,
                            answered ? rs.getBoolean("is_correct") : null,
                            answered ? rs.getString("correct_answer").trim() : null,
                            answered ? rs.getString("explanation") : null);
                },
                studentId,
                quizId);
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
