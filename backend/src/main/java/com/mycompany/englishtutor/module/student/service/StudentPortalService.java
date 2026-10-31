package com.mycompany.englishtutor.module.student.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.api.response.OccurrenceResponse;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;
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
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.ClassBrief;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.IncomingReschedule;
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
    ClassOccurrenceService occurrenceService;

    private static final DateTimeFormatter DAY_MONTH = DateTimeFormatter.ofPattern("dd/MM");

    // ---------------------------------------------------------------- LỊCH & BUỔI

    @Transactional(readOnly = true)
    public StudentScheduleResponse getSchedule(LocalDate weekStart) {
        Long studentId = currentUserId();
        LocalDate monday = (weekStart != null ? weekStart : LocalDate.now()).with(DayOfWeek.MONDAY);
        LocalDate end = monday.plusDays(7);

        // Buổi học thật (đã tạo, gồm cả buổi dạy thử) + các ca lịch cố định gia sư đã đặt nhưng chưa tạo buổi.
        List<StudentSessionItem> items = new ArrayList<>(repository.findSessionsBetween(studentId, monday, end));
        for (ClassBrief cls : repository.findOpenClasses(studentId)) {
            for (OccurrenceResponse occurrence :
                    occurrenceService.listOccurrences(cls.id(), monday).getOccurrences()) {
                StudentSessionItem virtual = toVirtualItem(cls, occurrence, monday, end);
                if (virtual != null) {
                    items.add(virtual);
                }
            }
            for (IncomingReschedule moved : repository.findIncomingReschedules(cls.id(), monday, end)) {
                items.add(virtualItem(cls, moved.newDate(), moved.newStart(), moved.newEnd(),
                        moved.teachingMode(), moved.meetingUrl(), moved.location(),
                        "Dời từ " + moved.originalDate().format(DAY_MONTH)));
            }
        }
        items.sort(Comparator.comparing(StudentSessionItem::date).thenComparing(StudentSessionItem::startTime));
        return new StudentScheduleResponse(monday, items);
    }

    /** Buổi sắp tới gần nhất trong 4 tuần tới, tính cả ca lịch cố định gia sư đã đặt nhưng chưa tạo buổi. */
    private StudentSessionItem findNextScheduledSession() {
        LocalDate today = LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now();
        LocalDate monday = today.with(DayOfWeek.MONDAY);
        for (int week = 0; week < 4; week++) {
            var next = getSchedule(monday.plusWeeks(week)).items().stream()
                    .filter(item -> "SCHEDULED".equals(item.status()) || "IN_PROGRESS".equals(item.status()))
                    .filter(item -> item.date().isAfter(today)
                            || (item.date().equals(today) && !item.endTime().isBefore(now)))
                    .findFirst();
            if (next.isPresent()) {
                return next.get();
            }
        }
        return null;
    }

    /**
     * Ô lịch cố định chưa có buổi học thật → hiển thị cho học sinh đúng như gia sư đã đặt:
     * ca thường, hủy, dời (sang ngày khác), điều chỉnh. Ô đã có buổi thật đã nằm trong danh sách buổi học.
     */
    private StudentSessionItem toVirtualItem(
            ClassBrief cls, OccurrenceResponse occurrence, LocalDate weekStart, LocalDate weekEnd) {
        if ("SESSION".equals(occurrence.getSource())) {
            return null;
        }
        var exception = occurrence.getException();
        if (exception == null) {
            return virtualItem(cls, occurrence.getDate(), occurrence.getStartTime(), occurrence.getEndTime(),
                    null, null, null, null);
        }
        return switch (exception.getType()) {
            case "CANCELLED" -> cancelledItem(cls, occurrence, "Buổi học đã hủy");
            case "RESCHEDULED" -> {
                LocalDate newDate = exception.getNewDate();
                if (newDate != null && !newDate.isBefore(weekStart) && newDate.isBefore(weekEnd)) {
                    yield virtualItem(cls, newDate,
                            exception.getNewStartTime() != null ? exception.getNewStartTime() : occurrence.getStartTime(),
                            exception.getNewEndTime() != null ? exception.getNewEndTime() : occurrence.getEndTime(),
                            exception.getNewTeachingMode(), exception.getNewMeetingUrl(), exception.getNewLocation(),
                            "Dời từ " + occurrence.getDate().format(DAY_MONTH));
                }
                yield cancelledItem(cls, occurrence,
                        newDate != null ? "Đã dời sang " + newDate.format(DAY_MONTH) : "Đã dời lịch");
            }
            case "MODIFIED" -> virtualItem(cls, occurrence.getDate(),
                    exception.getNewStartTime() != null ? exception.getNewStartTime() : occurrence.getStartTime(),
                    exception.getNewEndTime() != null ? exception.getNewEndTime() : occurrence.getEndTime(),
                    exception.getNewTeachingMode(), exception.getNewMeetingUrl(), exception.getNewLocation(),
                    "Đã điều chỉnh");
            default -> virtualItem(cls, occurrence.getDate(), occurrence.getStartTime(), occurrence.getEndTime(),
                    null, null, null, null);
        };
    }

    private StudentSessionItem cancelledItem(ClassBrief cls, OccurrenceResponse occurrence, String note) {
        return new StudentSessionItem(null, null, cls.id(), cls.className(), cls.tutorName(), null,
                cls.className(), occurrence.getDate(), occurrence.getDate(), occurrence.getStartTime(),
                occurrence.getEndTime(), "CANCELLED", cls.teachingMode(), null, null, false, null, null, 0, note);
    }

    /** Buổi chưa tạo: ngày tương lai là "Đã lên lịch", ngày đã qua không gắn trạng thái để khỏi gây hiểu nhầm. */
    private StudentSessionItem virtualItem(
            ClassBrief cls, LocalDate date, java.time.LocalTime start, java.time.LocalTime end,
            String mode, String meetingUrl, String location, String note) {
        String status = date.isBefore(LocalDate.now()) ? null : "SCHEDULED";
        return new StudentSessionItem(null, null, cls.id(), cls.className(), cls.tutorName(), null,
                cls.className(), date, date, start, end, status,
                mode != null ? mode : cls.teachingMode(), meetingUrl, location, false, null, null, 0, note);
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
        StudentSessionItem next = area(errors, "nextSession", this::findNextScheduledSession);
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
