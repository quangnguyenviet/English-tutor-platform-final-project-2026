package com.mycompany.englishtutor.module.student.api;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/** Các response của cổng Học sinh (API_DESIGN §3.6, §3.7). */
public final class StudentPortalResponses {

    private StudentPortalResponses() {}

    /** Một buổi học trong lịch tuần / lịch sử. {@code id} = {@code sessionId} để frontend dùng chung. */
    public record StudentSessionItem(
            Long id,
            Long sessionId,
            Long classId,
            String className,
            String tutorName,
            Integer sessionNumber,
            String title,
            LocalDate date,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String status,
            String teachingMode,
            String meetingUrl,
            String location,
            Boolean hasLog,
            String logKnowledge,
            String logHomework,
            Integer materialCount,
            String note) {}

    public record StudentScheduleResponse(LocalDate weekStart, List<StudentSessionItem> items) {}

    public record StudentTutorItem(
            Long classId,
            String className,
            String classStatus,
            Long tutorId,
            String tutorName,
            LocalDate activeFrom,
            Integer completedSessions,
            List<String> weeklySlots) {}

    public record StudentQuizItem(
            Long id,
            String title,
            String status,
            OffsetDateTime deadline,
            Integer totalQuestions,
            Integer answeredCount,
            Long sessionId,
            String sessionTitle,
            String tutorName) {}

    /** Câu hỏi gửi cho học sinh: KHÔNG có đáp án đúng và giải thích. */
    public record QuizQuestionForStudent(
            Long id,
            Integer orderNo,
            String content,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String skillName,
            String cefrLevel) {}

    public record AttemptStateResponse(
            Long quizId,
            String title,
            Integer totalQuestions,
            Integer answeredCount,
            Boolean completed,
            QuizQuestionForStudent nextQuestion) {}

    public record AnswerResultResponse(
            Boolean isCorrect,
            String selectedAnswer,
            String correctAnswer,
            String explanation,
            Integer eloBefore,
            Integer eloAfter,
            Integer eloChange,
            Integer answeredCount,
            Integer totalQuestions,
            Boolean completed) {}

    public record QuizResultResponse(
            Long quizId,
            String title,
            Integer totalQuestions,
            Integer correctCount,
            Integer wrongCount,
            Integer totalEloChange,
            Integer currentElo) {}

    public record ReviewItem(
            Long questionId,
            Long quizId,
            String quizTitle,
            String content,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String selectedAnswer,
            String correctAnswer,
            String explanation,
            String skillName,
            OffsetDateTime answeredAt) {}

    /** Câu trong chi tiết quiz của học sinh: đáp án đúng và giải thích chỉ có khi đã trả lời câu đó. */
    public record StudentQuizQuestion(
            Long id,
            Integer orderNo,
            String content,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String skillName,
            String cefrLevel,
            Boolean answered,
            String selectedAnswer,
            Boolean isCorrect,
            String correctAnswer,
            String explanation) {}

    public record StudentQuizDetailResponse(
            Long quizId,
            String title,
            String status,
            OffsetDateTime deadline,
            Long sessionId,
            Integer totalQuestions,
            Integer answeredCount,
            List<StudentQuizQuestion> questions) {}

    public record EloInfo(Integer current, Integer lastChange) {}

    public record StudentInfo(Long id, String fullName) {}

    /**
     * Dashboard gộp: mỗi khu vực lỗi độc lập — khu lỗi là {@code null} và có thông báo ở {@code errors[key]},
     * không làm hỏng cả phản hồi.
     */
    public record DashboardResponse(
            StudentInfo student,
            EloInfo elo,
            StudentSessionItem nextSession,
            StudentSessionItem lastSession,
            List<StudentQuizItem> pendingQuizzes,
            Integer unreadNotifications,
            Map<String, String> errors) {}
}
