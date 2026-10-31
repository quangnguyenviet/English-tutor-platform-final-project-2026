package com.mycompany.englishtutor.module.student.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.AnswerResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.AttemptStateResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.DashboardResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.EloInfo;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.QuizResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.ReviewItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentInfo;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentScheduleResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentSessionItem;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentTutorItem;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.QuizAccessRow;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.StoredAnswerRow;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ cổng Học sinh: lịch, buổi học, dashboard, quiz từng câu và Elo
 * (API_DESIGN §3.6, §3.7; FR-17, FR-19 → FR-22).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class StudentPortalService {

    StudentPortalRepository repository;
    UserRepository userRepository;

    // ---------------------------------------------------------------- LỊCH & BUỔI

    @Transactional(readOnly = true)
    public StudentScheduleResponse getSchedule(LocalDate weekStart) {
        Long studentId = currentUserId();
        LocalDate monday = (weekStart != null ? weekStart : LocalDate.now()).with(DayOfWeek.MONDAY);
        List<StudentSessionItem> items = repository.findSessionsBetween(studentId, monday, monday.plusDays(7));
        return new StudentScheduleResponse(monday, items);
    }

    @Transactional(readOnly = true)
    public List<StudentSessionItem> getSessionHistory(Long classId) {
        return repository.findSessionHistory(currentUserId(), classId);
    }

    @Transactional(readOnly = true)
    public List<StudentTutorItem> getTutors() {
        return repository.findTutors(currentUserId());
    }

    // ------------------------------------------------------------------- DASHBOARD

    /** Mỗi khu vực chạy độc lập: lỗi một khu → {@code null} + {@code errors[key]}, khu khác vẫn trả bình thường. */
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard() {
        Long studentId = currentUserId();
        Map<String, String> errors = new LinkedHashMap<>();

        StudentInfo student = area(errors, "student", () -> new StudentInfo(
                studentId, repository.findFullName(studentId).orElse(null)));
        EloInfo elo = area(errors, "elo", () -> new EloInfo(repository.findElo(studentId), repository.lastEloChange(studentId)));
        StudentSessionItem next = area(errors, "nextSession", () -> repository.findNextSession(studentId).orElse(null));
        StudentSessionItem last =
                area(errors, "lastSession", () -> repository.findLastCompletedSession(studentId).orElse(null));
        List<StudentQuizItem> pending =
                area(errors, "pendingQuizzes", () -> repository.findQuizzes(studentId, "ASSIGNED", null));
        Integer unread = area(errors, "unreadNotifications", () -> repository.countUnreadNotifications(studentId));

        return new DashboardResponse(student, elo, next, last, pending, unread, errors);
    }

    private <T> T area(Map<String, String> errors, String key, Supplier<T> loader) {
        try {
            return loader.get();
        } catch (RuntimeException ex) {
            log.warn("Dashboard học sinh: khu vực {} lỗi", key, ex);
            errors.put(key, "Không tải được khu vực này");
            return null;
        }
    }

    // ----------------------------------------------------------------------- QUIZ

    @Transactional(readOnly = true)
    public List<StudentQuizItem> getQuizzes(String status, Long sessionId) {
        String normalized = (status == null || status.isBlank()) ? null : status.trim().toUpperCase();
        return repository.findQuizzes(currentUserId(), normalized, sessionId);
    }

    /** Bắt đầu hoặc làm tiếp: trả câu chưa trả lời kế tiếp + tiến độ. */
    @Transactional
    public AttemptStateResponse startAttempt(Long quizId) {
        Long studentId = currentUserId();
        QuizAccessRow quiz = requireOwnedQuiz(quizId, studentId);
        int total = repository.countQuestions(quizId);
        int answered = repository.countAnswers(quizId, studentId);

        if ("COMPLETED".equals(quiz.status())) {
            return new AttemptStateResponse(quizId, quiz.title(), total, answered, true, null);
        }
        requireNotExpired(quiz);

        var next = repository.findNextQuestion(quizId, studentId);
        if (next.isEmpty()) {
            repository.markQuizCompleted(quizId);
            return new AttemptStateResponse(quizId, quiz.title(), total, answered, true, null);
        }
        return new AttemptStateResponse(quizId, quiz.title(), total, answered, false, next.get());
    }

    /** Chấm ngay và cập nhật Elo. Gọi lại cùng câu trả lại kết quả cũ (idempotent). */
    @Transactional
    public AnswerResultResponse answer(Long quizId, Long questionId, String selectedAnswer) {
        Long studentId = currentUserId();
        String selected = selectedAnswer == null ? "" : selectedAnswer.trim().toUpperCase();
        if (!selected.matches("[A-D]")) {
            throw new AppException(ErrorCode.QUIZ_ANSWER_INVALID);
        }

        QuizAccessRow quiz = requireOwnedQuiz(quizId, studentId);
        var question = repository
                .findQuestion(quizId, questionId)
                .orElseThrow(() -> new AppException(ErrorCode.QUESTION_NOT_FOUND));
        int total = repository.countQuestions(quizId);

        var stored = repository.findStoredAnswer(studentId, questionId);
        if (stored.isPresent()) {
            return replay(stored.get(), question.correctAnswer(), question.explanation(),
                    repository.countAnswers(quizId, studentId), total);
        }
        requireNotExpired(quiz);

        int currentElo = repository.lockElo(studentId);
        boolean correct = selected.equals(question.correctAnswer());
        EloCalculator.Result elo = EloCalculator.apply(currentElo, question.cefrLevel(), correct);

        int inserted = repository.insertAnswer(
                studentId, questionId, selected, correct, elo.before(), elo.after(), elo.change());
        if (inserted == 0) {
            // Hai request đồng thời: giữ kết quả của request ghi trước
            var again = repository.findStoredAnswer(studentId, questionId).orElseThrow();
            return replay(again, question.correctAnswer(), question.explanation(),
                    repository.countAnswers(quizId, studentId), total);
        }
        repository.updateElo(studentId, elo.after());

        int answered = repository.countAnswers(quizId, studentId);
        boolean completed = total > 0 && answered >= total;
        if (completed) {
            repository.markQuizCompleted(quizId);
        }
        return new AnswerResultResponse(
                correct, selected, question.correctAnswer(), question.explanation(),
                elo.before(), elo.after(), elo.change(), answered, total, completed);
    }

    /** Tổng kết: học sinh làm bài hoặc gia sư sở hữu lớp. */
    @Transactional(readOnly = true)
    public QuizResultResponse getResult(Long quizId) {
        Long userId = currentUserId();
        QuizAccessRow quiz =
                repository.findQuizAccess(quizId).orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        if (!userId.equals(quiz.studentId()) && !userId.equals(quiz.tutorId())) {
            throw new AppException(ErrorCode.QUIZ_NOT_OWNED);
        }
        int total = repository.countQuestions(quizId);
        int[] summary = repository.summarize(quizId, quiz.studentId());
        int answered = repository.countAnswers(quizId, quiz.studentId());
        return new QuizResultResponse(
                quizId, quiz.title(), total, summary[0], Math.max(0, answered - summary[0]), summary[1],
                repository.findElo(quiz.studentId()));
    }

    @Transactional(readOnly = true)
    public List<ReviewItem> getReviewList() {
        return repository.findReviewList(currentUserId());
    }

    // --------------------------------------------------------------------- HELPERS

    private QuizAccessRow requireOwnedQuiz(Long quizId, Long studentId) {
        QuizAccessRow quiz =
                repository.findQuizAccess(quizId).orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_AVAILABLE));
        if (!studentId.equals(quiz.studentId()) || "DRAFT".equals(quiz.status())) {
            throw new AppException(ErrorCode.QUIZ_NOT_AVAILABLE);
        }
        return quiz;
    }

    private void requireNotExpired(QuizAccessRow quiz) {
        boolean pastDeadline = quiz.deadline() != null && quiz.deadline().isBefore(java.time.OffsetDateTime.now());
        if ("EXPIRED".equals(quiz.status()) || ("ASSIGNED".equals(quiz.status()) && pastDeadline)) {
            repository.markQuizExpired(quiz.quizId());
            throw new AppException(ErrorCode.QUIZ_EXPIRED);
        }
    }

    private static AnswerResultResponse replay(
            StoredAnswerRow stored, String correctAnswer, String explanation, int answered, int total) {
        return new AnswerResultResponse(
                stored.correct(), stored.selectedAnswer(), correctAnswer, explanation,
                stored.eloBefore(), stored.eloAfter(), stored.eloChange(), answered, total,
                total > 0 && answered >= total);
    }

    private Long currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED))
                .getId();
    }
}
