package com.mycompany.englishtutor.module.quiz.service;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.quiz.api.request.AssignQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.CreateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.QuizQuestionRequest;
import com.mycompany.englishtutor.module.quiz.api.request.UpdateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.response.QuizDetailResponse;
import com.mycompany.englishtutor.module.quiz.api.response.QuizListItemResponse;
import com.mycompany.englishtutor.module.quiz.api.response.QuizQuestionResponse;
import com.mycompany.englishtutor.module.quiz.api.response.SkillOptionResponse;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizOwnershipRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizQuestionRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.SessionOwnershipRow;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ quiz buổi học cho gia sư — lát cắt nhập THỦ CÔNG (API_DESIGN §3.7,
 * FR-13): tạo bản nháp, sửa, giao bài (đặt hạn, thông báo học sinh), xem chi
 * tiết, đọc catalog kỹ năng.
 *
 * <p>Chưa có phần AI / import (T8-B3, T8-C1) và học sinh làm quiz / Elo
 * (T8-C2). Sở hữu suy qua {@code quizzes → sessions → classes.tutor_id}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class QuizService {

    /** Giá trị {@code source} của quiz do gia sư nhập tay (CHK V5 chỉ có 2 giá trị). */
    private static final String SOURCE_MANUAL = "IMPORTED";

    /** Trạng thái cho phép sửa / giao (DRAFT). */
    private static final String STATUS_DRAFT = "DRAFT";

    QuizRepository quizRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;

    // ============================================================= CREATE (DRAFT)

    /**
     * Tạo quiz bản nháp cho buổi học. Kiểm tra quyền (gia sư sở hữu buổi) →
     * validate toàn bộ câu hỏi (để lỗi về đúng từng câu, không tạo quiz dở dang
     * — AC: "Import thất bại không tạo quiz dở dang") → insert quiz + câu hỏi
     * trong 1 transaction.
     */
    @Transactional
    public QuizDetailResponse createQuizForSession(
            Long sessionId, CreateQuizRequest request, HttpServletRequest httpRequest) {
        SessionOwnershipRow session =
                quizRepository
                        .findSessionOwnership(sessionId)
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        requireOwnedSession(session);

        List<Long> skillIds = resolveSkillIds(request.getQuestions());

        Long quizId =
                quizRepository.insertQuiz(
                        sessionId, request.getTitle().trim(), SOURCE_MANUAL, request.getQuestions().size());

        for (int i = 0; i < request.getQuestions().size(); i++) {
            quizRepository.insertQuizQuestion(quizId, i + 1, request.getQuestions().get(i), skillIds.get(i));
        }

        auditLogService.log(
                getCurrentUserId(),
                "CREATE_QUIZ",
                "QUIZ",
                quizId,
                Map.of("sessionId", sessionId, "title", request.getTitle().trim(), "totalQuestions", request.getQuestions().size()),
                httpRequest);

        return findDetail(quizId);
    }

    // ============================================================= READ

    @Transactional(readOnly = true)
    public List<QuizListItemResponse> listSessionQuizzes(Long sessionId, HttpServletRequest httpRequest) {
        SessionOwnershipRow session =
                quizRepository
                        .findSessionOwnership(sessionId)
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        requireOwnedSession(session);

        return quizRepository.findSessionQuizzes(sessionId).stream()
                .map(this::toListItem)
                .toList();
    }

    @Transactional(readOnly = true)
    public QuizDetailResponse getQuizDetail(Long quizId, HttpServletRequest httpRequest) {
        QuizRow quiz =
                quizRepository
                        .findQuiz(quizId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        SessionOwnershipRow session =
                quizRepository
                        .findSessionOwnership(quiz.sessionId())
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        requireOwnedSession(session);
        return findDetail(quizId);
    }

    @Transactional(readOnly = true)
    public List<SkillOptionResponse> listSkills() {
        return quizRepository.findSkills().stream()
                .map(
                        s ->
                                SkillOptionResponse.builder()
                                        .skillCode(s.skillCode())
                                        .skillName(s.skillName())
                                        .category(s.category())
                                        .build())
                .toList();
    }

    // ============================================================= UPDATE (DRAFT)

    @Transactional
    public QuizDetailResponse updateQuiz(
            Long quizId, UpdateQuizRequest request, HttpServletRequest httpRequest) {
        QuizOwnershipRow quiz =
                quizRepository
                        .lockQuiz(quizId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        requireOwnedQuiz(quiz);
        requireDraft(quiz);

        List<Long> skillIds = resolveSkillIds(request.getQuestions());

        quizRepository.deleteQuizQuestions(quizId);
        quizRepository.updateQuizTitle(quizId, request.getTitle().trim(), request.getQuestions().size());

        for (int i = 0; i < request.getQuestions().size(); i++) {
            quizRepository.insertQuizQuestion(quizId, i + 1, request.getQuestions().get(i), skillIds.get(i));
        }

        auditLogService.log(
                getCurrentUserId(),
                "UPDATE_QUIZ",
                "QUIZ",
                quizId,
                Map.of("sessionId", quiz.sessionId(), "totalQuestions", request.getQuestions().size()),
                httpRequest);

        return findDetail(quizId);
    }

    // ============================================================= ASSIGN (giao bài)

    @Transactional
    public QuizDetailResponse assignQuiz(
            Long quizId, AssignQuizRequest request, HttpServletRequest httpRequest) {
        QuizOwnershipRow quiz =
                quizRepository
                        .lockQuiz(quizId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        requireOwnedQuiz(quiz);
        requireDraft(quiz);
        requireFutureDeadline(request.getDeadline());

        quizRepository.markQuizAssigned(quizId, request.getDeadline());
        quizRepository.insertQuizAssignedNotification(
                quiz.studentId(), quiz.title(), request.getDeadline(), quiz.classId());

        auditLogService.log(
                getCurrentUserId(),
                "ASSIGN_QUIZ",
                "QUIZ",
                quizId,
                Map.of("sessionId", quiz.sessionId(), "classId", quiz.classId(), "deadline", String.valueOf(request.getDeadline())),
                httpRequest);

        return findDetail(quizId);
    }

    // ============================================================= GUARDS & HELPERS

    private void requireOwnedSession(SessionOwnershipRow session) {
        if (!getCurrentUserId().equals(session.tutorId())) {
            throw new AppException(ErrorCode.SESSION_NOT_OWNED);
        }
    }

    private void requireOwnedQuiz(QuizOwnershipRow quiz) {
        if (!getCurrentUserId().equals(quiz.tutorId())) {
            throw new AppException(ErrorCode.QUIZ_NOT_OWNED);
        }
    }

    private void requireDraft(QuizOwnershipRow quiz) {
        if (!STATUS_DRAFT.equals(quiz.status())) {
            throw new AppException(ErrorCode.QUIZ_INVALID_STATE);
        }
    }

    private void requireFutureDeadline(OffsetDateTime deadline) {
        if (deadline == null || deadline.isBefore(OffsetDateTime.now())) {
            throw new AppException(ErrorCode.QUIZ_DEADLINE_INVALID);
        }
    }

    /** Map từng câu → skill_id (null nếu câu không gắn kỹ năng). Lỗi về đúng mã kỹ năng. */
    private List<Long> resolveSkillIds(List<QuizQuestionRequest> questions) {
        return questions.stream()
                .map(
                        q -> {
                            String code = QuizRepository.trimToNull(q.getSkillCode());
                            if (code == null) {
                                return null;
                            }
                            return quizRepository
                                    .findSkillIdByCode(code)
                                    .orElseThrow(() -> new AppException(ErrorCode.SKILL_CODE_NOT_FOUND, "Kỹ năng không tồn tại: " + code));
                        })
                .toList();
    }

    private QuizDetailResponse findDetail(Long quizId) {
        QuizRow quiz =
                quizRepository
                        .findQuiz(quizId)
                        .orElseThrow(() -> new AppException(ErrorCode.QUIZ_NOT_FOUND));
        List<QuizQuestionResponse> questions =
                quizRepository.findQuizQuestions(quizId).stream().map(this::toQuestion).toList();
        return QuizDetailResponse.builder()
                .quizId(quiz.quizId())
                .title(quiz.title())
                .status(quiz.status())
                .deadline(quiz.deadline())
                .sessionId(quiz.sessionId())
                .questions(questions)
                .build();
    }

    private QuizListItemResponse toListItem(QuizRow quiz) {
        return QuizListItemResponse.builder()
                .quizId(quiz.quizId())
                .title(quiz.title())
                .status(quiz.status())
                .deadline(quiz.deadline())
                .totalQuestions(quiz.totalQuestions())
                .build();
    }

    private QuizQuestionResponse toQuestion(QuizQuestionRow row) {
        return QuizQuestionResponse.builder()
                .questionNumber(row.questionNumber())
                .questionText(row.questionText())
                .optionA(row.optionA())
                .optionB(row.optionB())
                .optionC(row.optionC())
                .optionD(row.optionD())
                .correctAnswer(row.correctAnswer())
                .explanation(row.explanation())
                .cefrLevel(row.cefrLevel())
                .skillCode(row.skillCode())
                .build();
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
