package com.mycompany.englishtutor.module.quiz.service;

import java.util.List;
import java.util.Locale;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.quiz.ai.AiClient;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatPayload;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatResult;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiDraftQuestion;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiRecentMessage;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiSkillInfo;
import com.mycompany.englishtutor.module.quiz.api.request.AiChatQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.AiChatQuizRequest.ChatMessage;
import com.mycompany.englishtutor.module.quiz.api.request.AiChatQuizRequest.PendingQuestion;
import com.mycompany.englishtutor.module.quiz.api.request.AiChatQuizRequest.PendingQuestion;
import com.mycompany.englishtutor.module.quiz.api.response.AiChatQuizResponse;
import com.mycompany.englishtutor.module.quiz.api.response.AiDraftQuestionResponse;
import com.mycompany.englishtutor.module.quiz.api.response.SkillProfileItemResponse;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.LessonOwnershipRow;
import com.mycompany.englishtutor.module.quiz.repository.SkillProfileRepository;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;

/**
 * Trợ lý AI soạn quiz (FR-13, UC-T06) + đọc hồ sơ kỹ năng học sinh (SKP).
 *
 * <p>Quyền sở hữu suy qua {@code lessons → classes.tutor_id} (V16) /
 * {@code classes.tutor_id}. Ngữ cảnh gửi cho AI Service là dạng ẩn danh
 * (AD-2): mã học sinh + cấp + mục tiêu + thống kê kỹ năng, không tên/SĐT.
 * Chat stateless: lịch sử hội thoại do frontend gửi kèm, chưa lưu MongoDB.
 */
@Service
@RequiredArgsConstructor
public class AiQuizService {

    /** Giới hạn tin hội thoại gửi kèm mỗi lượt (backend giữ tối đa 10). */
    private static final int MAX_RECENT_MESSAGES = 10;

    private final AiClient aiClient;
    private final SkillProfileRepository skillProfileRepository;
    private final QuizRepository quizRepository;
    private final UserRepository userRepository;

    // ============================================================= AI CHAT

    @Transactional(readOnly = true)
    public AiChatQuizResponse aiChatQuiz(Long lessonId, AiChatQuizRequest request) {
        Long currentUserId = getCurrentUserId();
        String message = request.getMessage();
        if (message == null || message.isBlank()) {
            throw new AppException(ErrorCode.AI_CHAT_MESSAGE_REQUIRED);
        }

        LessonOwnershipRow lesson =
                quizRepository
                        .findLessonOwnership(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        if (!currentUserId.equals(lesson.tutorId())) {
            throw new AppException(ErrorCode.SESSION_NOT_OWNED);
        }

        // Ngữ cảnh học sinh ẩn danh của lớp (AD-2).
        SkillProfileRepository.StudentContextRow ctx =
                skillProfileRepository
                        .findStudentContext(lesson.classId())
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        List<AiSkillInfo> skillProfile =
                skillProfileRepository.findStudentSkillStats(ctx.studentId()).stream()
                        .map(
                                s ->
                                        new AiSkillInfo(
                                                s.skillCode(),
                                                s.skillName(),
                                                s.category(),
                                                s.errorRate(),
                                                s.lastPracticedAt() == null
                                                        ? null
                                                        : s.lastPracticedAt().toString()))
                        .toList();
        List<AiSkillInfo> skillCatalog =
                quizRepository.findSkills().stream()
                        .map(
                                s ->
                                        AiSkillInfo.catalog(
                                                s.skillCode(), s.skillName(), s.category()))
                        .toList();

        // "Bản nháp hiện tại" theo ưu tiên: (1) trọn bộ câu đang hiển thị trên
        // form do FE gửi (pendingQuestions — câu AI sinh chưa save không có ở DB,
        // phải gửi kèm để LLM hiểu "câu số N"), (2) fallback đọc DB theo quizId
        // (client cũ chưa gửi pending), (3) rỗng.
        List<AiDraftQuestion> currentDraft =
                hasPendingQuestions(request)
                        ? toDraftFromPending(request.getPendingQuestions())
                        : currentDraftQuestions(request.getQuizId(), currentUserId);

        AiChatPayload payload =
                AiChatPayload.of(
                        "HS-" + ctx.studentId(),
                        ctx.grade(),
                        ctx.learningGoal(),
                        skillProfile,
                        skillCatalog,
                        currentDraft,
                        toRecentMessages(request.getRecentMessages()),
                        message.trim(),
                        null);

        AiChatResult result = aiClient.quizChat(payload);
        List<AiDraftQuestionResponse> draft =
                result.safeQuestions().stream()
                        .map(this::toDraftResponse)
                        .toList();
        return AiChatQuizResponse.builder()
                .reply(result.reply())
                .draftQuestions(draft)
                .build();
    }

    /** Bản nháp câu hỏi hiện tại của quiz đang sửa (rỗng nếu quizId null / không sở hữu). */
    private List<AiDraftQuestion> currentDraftQuestions(Long quizId, Long currentUserId) {
        if (quizId == null) {
            return List.of();
        }
        QuizRepository.QuizRow quiz =
                quizRepository.findQuiz(quizId).orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        LessonOwnershipRow lesson =
                quizRepository
                        .findLessonOwnership(quiz.lessonId())
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        if (!currentUserId.equals(lesson.tutorId())) {
            throw new AppException(ErrorCode.QUIZ_NOT_OWNED);
        }
        return quizRepository.findQuizQuestions(quizId).stream()
                .map(
                        q ->
                                new AiDraftQuestion(
                                        q.questionText(),
                                        optionsOf(q),
                                        q.correctAnswer(),
                                        q.explanation(),
                                        q.cefrLevel(),
                                        q.skillCode(),
                                        null))
                .toList();
    }

    /**
     * Map "trọn bộ câu trên form" (FE gửi kèm) thành draft — không đọc DB vì
     * câu AI sinh chưa save thì không có ở đâu phía server (AD-2 giữ nguyên:
     * vẫn chỉ metadata ẩn danh + nội dung câu, không PII). Câu hoàn toàn trống
     * bị loại; skillCode chưa gắn hợp lệ được giữ (LLM xem tham khảo, không
     * bảo hiểm DB).
     */
    private static boolean hasPendingQuestions(AiChatQuizRequest request) {
        return request.getPendingQuestions() != null && !request.getPendingQuestions().isEmpty();
    }

    private List<AiDraftQuestion> toDraftFromPending(List<PendingQuestion> pending) {
        return pending.stream()
                .filter(p -> p != null && p.getQuestionText() != null && !p.getQuestionText().isBlank())
                .map(
                        p ->
                                new AiDraftQuestion(
                                        p.getQuestionText().trim(),
                                        pendingOptionsOf(p),
                                        trimToNull(p.getCorrectAnswer()),
                                        trimToNull(p.getExplanation()),
                                        trimToNull(p.getCefrLevel()),
                                        trimToNull(p.getSkillCode()),
                                        null))
                .toList();
    }

    private static java.util.Map<String, String> pendingOptionsOf(PendingQuestion p) {
        var m = new java.util.LinkedHashMap<String, String>();
        m.put("A", nvl(p.getOptionA()));
        m.put("B", nvl(p.getOptionB()));
        m.put("C", nvl(p.getOptionC()));
        m.put("D", nvl(p.getOptionD()));
        return m;
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    private java.util.Map<String, String> optionsOf(QuizRepository.QuizQuestionRow q) {
        var m = new java.util.LinkedHashMap<String, String>();
        m.put("A", q.optionA());
        m.put("B", q.optionB());
        m.put("C", q.optionC());
        m.put("D", q.optionD());
        return m;
    }

    private List<AiRecentMessage> toRecentMessages(List<ChatMessage> recent) {
        if (recent == null || recent.isEmpty()) {
            return List.of();
        }
        return recent.stream()
                .filter(m -> m != null && m.getContent() != null && !m.getContent().isBlank())
                .filter(m -> "user".equals(m.getRole()) || "assistant".equals(m.getRole()))
                .limit(MAX_RECENT_MESSAGES)
                .map(m -> new AiRecentMessage(normalizeRole(m.getRole()), m.getContent().trim()))
                .toList();
    }

    private String normalizeRole(String role) {
        if (role == null) {
            return "user";
        }
        return role.toLowerCase(Locale.ROOT).equals("assistant") ? "assistant" : "user";
    }

    private AiDraftQuestionResponse toDraftResponse(AiDraftQuestion q) {
        java.util.Map<String, String> o = q.options() == null ? java.util.Map.of() : q.options();
        return AiDraftQuestionResponse.builder()
                .questionText(nvl(q.content()))
                .optionA(o.getOrDefault("A", ""))
                .optionB(o.getOrDefault("B", ""))
                .optionC(o.getOrDefault("C", ""))
                .optionD(o.getOrDefault("D", ""))
                .correctAnswer(q.correct())
                .explanation(nvl(q.explanation()))
                .cefrLevel(q.cefr())
                .skillCode(q.skill())
                .index(q.index())
                .build();
    }

    private static String nvl(String s) {
        return s == null ? "" : s;
    }

    // ============================================================= SKILL PROFILE

    @Transactional(readOnly = true)
    public List<SkillProfileItemResponse> getStudentSkillProfile(Long classId) {
        Long currentUserId = getCurrentUserId();
        if (!skillProfileRepository.classExists(classId)) {
            throw new AppException(ErrorCode.CLASS_NOT_FOUND);
        }
        if (!skillProfileRepository.classOwnedBy(classId, currentUserId)) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        SkillProfileRepository.StudentContextRow ctx =
                skillProfileRepository.findStudentContext(classId).orElseThrow();
        return skillProfileRepository.findStudentSkillStats(ctx.studentId()).stream()
                .map(
                        s ->
                                SkillProfileItemResponse.builder()
                                        .skillCode(s.skillCode())
                                        .skillName(s.skillName())
                                        .category(s.category())
                                        .totalCorrect(s.totalCorrect())
                                        .totalIncorrect(s.totalIncorrect())
                                        .totalAttempts(s.totalAttempts())
                                        .errorRate(s.errorRate())
                                        .lastPracticedAt(s.lastPracticedAt())
                                        .build())
                .toList();
    }

    // ============================================================= AUTH

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new AppException(ErrorCode.UNAUTHORIZED);
        }
        return userRepository
                .findByUsername(authentication.getName())
                .map(u -> u.getId())
                .orElseThrow(() -> new AppException(ErrorCode.UNAUTHORIZED));
    }
}
