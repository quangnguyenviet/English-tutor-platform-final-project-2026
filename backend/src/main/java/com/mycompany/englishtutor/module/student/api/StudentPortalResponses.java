package com.mycompany.englishtutor.module.student.api;

import java.math.BigDecimal;
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

    /** Một lớp của chính học sinh trong màn "Lớp học của tôi". */
    public record StudentClassSummary(
            Long classId,
            String className,
            String status,
            String teachingMode,
            Long tutorId,
            String tutorName,
            LocalDate activeFrom,
            Integer completedSessions,
            Integer lessonCount,
            Integer quizCount,
            Integer materialCount,
            List<String> weeklySlots) {}

    public record StudentScheduleSlot(
            Integer dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate validFrom,
            LocalDate validTo) {}

    public record StudentTrialSession(
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            String teachingMode,
            String meetingUrl,
            String location) {}

    /** Chi tiết lớp dạng chỉ đọc dành cho học sinh sở hữu lớp. */
    public record StudentClassDetail(
            Long classId,
            String className,
            String status,
            String teachingMode,
            BigDecimal pricePerSession,
            LocalDate activeFrom,
            OffsetDateTime createdAt,
            Long tutorId,
            String tutorName,
            String school,
            String grade,
            String learningGoal,
            Integer completedSessions,
            Integer lessonCount,
            Integer quizCount,
            Integer materialCount,
            List<StudentScheduleSlot> schedules,
            StudentTrialSession trialSession) {}

    /** Bài giảng học sinh được phép xem — chỉ lấy trạng thái PUBLISHED. */
    public record StudentLessonItem(
            Long lessonId,
            Integer lessonNumber,
            String title,
            OffsetDateTime createdAt,
            Integer materialCount,
            Integer quizCount) {}

    /** Tài liệu trong workspace lớp, kèm bài giảng chứa tài liệu. */
    public record StudentClassMaterialItem(
            Long materialId,
            Long lessonId,
            String lessonTitle,
            String fileName,
            String fileType,
            Long fileSize,
            String uploadedBy,
            OffsetDateTime createdAt) {}

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

    /** Tài liệu lớp hiển thị trong chi tiết buổi (V16: tài liệu nằm ở lesson của lớp). */
    public record StudentMaterialItem(
            Long materialId,
            String fileName,
            String fileType,
            Long fileSize,
            String uploadedBy,
            OffsetDateTime createdAt) {}

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

    /** Kết quả lượt trả lời lại đang chờ học sinh tự đánh giá độ khó. */
    public record ReviewFeedback(
            Long reviewAttemptId,
            String selectedAnswer,
            Boolean isCorrect,
            String correctAnswer,
            String explanation) {}

    /** Một thẻ đã đến hạn trong phiên ôn tập; đáp án chỉ xuất hiện sau khi đã trả lời. */
    public record DueReviewItem(
            Long questionId,
            Long quizId,
            String quizTitle,
            String content,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String skillName,
            String cefrLevel,
            OffsetDateTime nextReview,
            Integer reviewCount,
            String lastRating,
            ReviewFeedback pendingFeedback) {}

    public record ReviewScheduleResponse(
            Long reviewAttemptId,
            String rating,
            OffsetDateTime nextReview,
            Integer intervalSeconds,
            Integer reviewCount) {}

    public record ReviewStatsResponse(
            Integer dueCount,
            Integer reviewedToday,
            OffsetDateTime nextReview) {}

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
