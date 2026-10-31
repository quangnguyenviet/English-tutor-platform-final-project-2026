package com.mycompany.englishtutor.module.quiz.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.quiz.api.request.AssignQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.CreateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.request.QuizQuestionRequest;
import com.mycompany.englishtutor.module.quiz.api.request.UpdateQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.response.QuizDetailResponse;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizOwnershipRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizQuestionRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.SessionOwnershipRow;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Nghiệp vụ quiz buổi học (tầng service, Mockito — không Spring/DB): quyền
 * sở hữu buổi học, validation câu hỏi, DRAFT/ASSIGNED, deadline, audit và
 * notification giao bài.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class QuizServiceTest {

    private static final Long SESSION_ID = 42L;
    private static final Long QUIZ_ID = 7L;
    private static final Long CLASS_ID = 1L;
    private static final Long TUTOR_ID = 10L;
    private static final Long STUDENT_ID = 20L;

    private static final SessionOwnershipRow OWNED_SESSION =
            new SessionOwnershipRow(SESSION_ID, CLASS_ID, TUTOR_ID, STUDENT_ID, null);
    private static final SessionOwnershipRow OTHER_SESSION =
            new SessionOwnershipRow(SESSION_ID, 99L, 99L, 30L, null);

    private static final QuizOwnershipRow DRAFT_QUIZ =
            new QuizOwnershipRow(QUIZ_ID, SESSION_ID, CLASS_ID, TUTOR_ID, STUDENT_ID, "DRAFT", "Quiz A", null, 1);
    private static final QuizOwnershipRow ASSIGNED_QUIZ =
            new QuizOwnershipRow(
                    QUIZ_ID, SESSION_ID, CLASS_ID, TUTOR_ID, STUDENT_ID, "ASSIGNED", "Quiz A",
                    OffsetDateTime.now().plusDays(1), 1);

    @Mock
    QuizRepository quizRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    AuditLogService auditLogService;

    @InjectMocks
    QuizService quizService;

    HttpServletRequest httpRequest;

    @BeforeEach
    void setUpSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("tutor1", "x", List.of()));
        when(userRepository.findByUsername("tutor1"))
                .thenReturn(Optional.of(User.builder()
                        .id(TUTOR_ID)
                        .username("tutor1")
                        .fullName("Trần Gia Sư")
                        .role(UserRole.TUTOR.name())
                        .build()));
        httpRequest = new MockHttpServletRequest(HttpMethod.POST.name(), "/api/v1/sessions/42/quizzes");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------------ helpers

    private static QuizQuestionRequest question(String correct, String skillCode) {
        return QuizQuestionRequest.builder()
                .questionText("She ___ to Da Nang last summer.")
                .optionA("go")
                .optionB("goes")
                .optionC("went")
                .optionD("gone")
                .correctAnswer(correct)
                .skillCode(skillCode)
                .build();
    }

    private CreateQuizRequest createRequest() {
        return CreateQuizRequest.builder()
                .title("Quiz ôn tập Past Simple")
                .questions(List.of(question("C", "past_simple"), question("A", null)))
                .build();
    }

    private UpdateQuizRequest updateRequest() {
        return UpdateQuizRequest.builder()
                .title("Quiz ôn tập Past Simple (sửa)")
                .questions(List.of(question("C", null)))
                .build();
    }

    private AssignQuizRequest assignRequest(OffsetDateTime deadline) {
        return AssignQuizRequest.builder().deadline(deadline).build();
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }

    private void mockSkillLookup() {
        when(quizRepository.findSkillIdByCode("past_simple")).thenReturn(Optional.of(5L));
    }

    // --------------------------------------------------------------- CREATE

    @Test
    void createQuiz_success_insertsQuizQuestionsAndAudits() {
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OWNED_SESSION));
        mockSkillLookup();
        when(quizRepository.insertQuiz(eq(SESSION_ID), eq("Quiz ôn tập Past Simple"), eq("IMPORTED"), eq(2)))
                .thenReturn(QUIZ_ID);
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(Optional.of(new QuizRow(QUIZ_ID, "Quiz ôn tập Past Simple", "DRAFT", null, SESSION_ID, 2)));
        when(quizRepository.findQuizQuestions(QUIZ_ID)).thenReturn(List.of());

        QuizDetailResponse result = quizService.createQuizForSession(SESSION_ID, createRequest(), httpRequest);

        assertEquals(QUIZ_ID, result.getQuizId());
        assertEquals("DRAFT", result.getStatus());
        verify(quizRepository)
                .insertQuizQuestion(eq(QUIZ_ID), eq(1), any(QuizQuestionRequest.class), eq(5L));
        verify(quizRepository)
                .insertQuizQuestion(eq(QUIZ_ID), eq(2), any(QuizQuestionRequest.class), eq(null));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("CREATE_QUIZ"), eq("QUIZ"), eq(QUIZ_ID), any(), eq(httpRequest));
    }

    @Test
    void createQuiz_sessionMissing_shouldThrow404() {
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> quizService.createQuizForSession(SESSION_ID, createRequest(), httpRequest),
                ErrorCode.SESSION_NOT_FOUND);
        verify(quizRepository, never()).insertQuiz(anyLong(), anyString(), anyString(), anyInt());
    }

    @Test
    void createQuiz_tutorNotOwner_shouldThrow403() {
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OTHER_SESSION));

        assertErrorCode(
                () -> quizService.createQuizForSession(SESSION_ID, createRequest(), httpRequest),
                ErrorCode.SESSION_NOT_OWNED);
        verify(quizRepository, never()).insertQuiz(anyLong(), anyString(), anyString(), anyInt());
    }

    @Test
    void createQuiz_unknownSkillCode_shouldThrow1405WithoutPartialWrite() {
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OWNED_SESSION));
        when(quizRepository.findSkillIdByCode("ma_em_khong_cua"))
                .thenReturn(Optional.empty());
        CreateQuizRequest request =
                CreateQuizRequest.builder()
                        .title("Quiz X")
                        .questions(List.of(question("A", "ma_em_khong_cua")))
                        .build();

        assertErrorCode(
                () -> quizService.createQuizForSession(SESSION_ID, request, httpRequest),
                ErrorCode.SKILL_CODE_NOT_FOUND);
        // Không tạo quiz dở dang khi dữ liệu vô lệ (AC).
        verify(quizRepository, never()).insertQuiz(anyLong(), anyString(), anyString(), anyInt());
    }

    // ----------------------------------------------------------------- READ

    @Test
    void listSessionQuizzes_owner_returnsList() {
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OWNED_SESSION));
        when(quizRepository.findSessionQuizzes(SESSION_ID))
                .thenReturn(List.of(new QuizRow(QUIZ_ID, "Quiz A", "DRAFT", null, SESSION_ID, 2)));

        var result = quizService.listSessionQuizzes(SESSION_ID, httpRequest);

        assertEquals(1, result.size());
        assertEquals(QUIZ_ID, result.get(0).getQuizId());
        assertEquals("DRAFT", result.get(0).getStatus());
    }

    @Test
    void getQuizDetail_notFound_shouldThrow1400() {
        when(quizRepository.findQuiz(QUIZ_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> quizService.getQuizDetail(QUIZ_ID, httpRequest), ErrorCode.QUIZ_NOT_FOUND);
    }

    @Test
    void getQuizDetail_notOwner_shouldThrow403() {
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(Optional.of(new QuizRow(QUIZ_ID, "Quiz A", "DRAFT", null, SESSION_ID, 2)));
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OTHER_SESSION));

        assertErrorCode(() -> quizService.getQuizDetail(QUIZ_ID, httpRequest), ErrorCode.SESSION_NOT_OWNED);
    }

    @Test
    void getQuizDetail_owned_returnsQuestions() {
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(Optional.of(new QuizRow(QUIZ_ID, "Quiz A", "ASSIGNED", null, SESSION_ID, 1)));
        when(quizRepository.findSessionOwnership(SESSION_ID)).thenReturn(Optional.of(OWNED_SESSION));
        when(quizRepository.findQuizQuestions(QUIZ_ID))
                .thenReturn(
                        List.of(
                                new QuizQuestionRow(
                                        1,
                                        "She ___ to Da Nang.",
                                        "go",
                                        "goes",
                                        "went",
                                        "gone",
                                        "C",
                                        null,
                                        "A2",
                                        "past_simple")));

        QuizDetailResponse result = quizService.getQuizDetail(QUIZ_ID, httpRequest);

        assertEquals("ASSIGNED", result.getStatus());
        assertEquals("went", result.getQuestions().get(0).getOptionC());
        assertEquals("past_simple", result.getQuestions().get(0).getSkillCode());
    }

    // --------------------------------------------------------------- UPDATE

    @Test
    void updateQuiz_draft_replacesQuestionsAndAudits() {
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(DRAFT_QUIZ));
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(Optional.of(new QuizRow(QUIZ_ID, "Quiz (sửa)", "DRAFT", null, SESSION_ID, 1)));
        when(quizRepository.findQuizQuestions(QUIZ_ID)).thenReturn(List.of());

        QuizDetailResponse result = quizService.updateQuiz(QUIZ_ID, updateRequest(), httpRequest);

        assertEquals("DRAFT", result.getStatus());
        verify(quizRepository).deleteQuizQuestions(QUIZ_ID);
        verify(quizRepository).updateQuizTitle(QUIZ_ID, "Quiz ôn tập Past Simple (sửa)", 1);
        verify(quizRepository).insertQuizQuestion(eq(QUIZ_ID), eq(1), any(QuizQuestionRequest.class), eq(null));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("UPDATE_QUIZ"), eq("QUIZ"), eq(QUIZ_ID), any(), eq(httpRequest));
    }

    @Test
    void updateQuiz_notDraft_shouldThrow1402() {
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(ASSIGNED_QUIZ));

        assertErrorCode(
                () -> quizService.updateQuiz(QUIZ_ID, updateRequest(), httpRequest),
                ErrorCode.QUIZ_INVALID_STATE);
        verify(quizRepository, never()).deleteQuizQuestions(anyLong());
    }

    @Test
    void updateQuiz_notFound_shouldThrow1400() {
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> quizService.updateQuiz(QUIZ_ID, updateRequest(), httpRequest),
                ErrorCode.QUIZ_NOT_FOUND);
    }

    @Test
    void updateQuiz_notOwner_shouldThrow1401() {
        QuizOwnershipRow other =
                new QuizOwnershipRow(QUIZ_ID, SESSION_ID, 99L, 99L, 30L, "DRAFT", "Quiz B", null, 1);
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(other));

        assertErrorCode(
                () -> quizService.updateQuiz(QUIZ_ID, updateRequest(), httpRequest),
                ErrorCode.QUIZ_NOT_OWNED);
    }

    // --------------------------------------------------------------- ASSIGN

    @Test
    void assignQuiz_success_updatesStatusAndNotifiesStudent() {
        OffsetDateTime deadline = OffsetDateTime.now().plusDays(2);
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(DRAFT_QUIZ));
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(Optional.of(new QuizRow(QUIZ_ID, "Quiz A", "ASSIGNED", deadline, SESSION_ID, 1)));
        when(quizRepository.findQuizQuestions(QUIZ_ID)).thenReturn(List.of());

        QuizDetailResponse result = quizService.assignQuiz(QUIZ_ID, assignRequest(deadline), httpRequest);

        assertEquals("ASSIGNED", result.getStatus());
        verify(quizRepository).markQuizAssigned(QUIZ_ID, deadline);
        verify(quizRepository).insertQuizAssignedNotification(eq(STUDENT_ID), eq("Quiz A"), eq(deadline), eq(CLASS_ID));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("ASSIGN_QUIZ"), eq("QUIZ"), eq(QUIZ_ID), any(), eq(httpRequest));
    }

    @Test
    void assignQuiz_deadlineInPast_shouldThrow1403() {
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(DRAFT_QUIZ));

        assertErrorCode(
                () -> quizService.assignQuiz(
                        QUIZ_ID, assignRequest(OffsetDateTime.now().minusDays(1)), httpRequest),
                ErrorCode.QUIZ_DEADLINE_INVALID);
        verify(quizRepository, never()).markQuizAssigned(anyLong(), any());
    }

    @Test
    void assignQuiz_alreadyAssigned_shouldThrow1402() {
        when(quizRepository.lockQuiz(QUIZ_ID)).thenReturn(Optional.of(ASSIGNED_QUIZ));

        assertErrorCode(
                () ->
                        quizService.assignQuiz(QUIZ_ID, assignRequest(OffsetDateTime.now().plusDays(1)), httpRequest),
                ErrorCode.QUIZ_INVALID_STATE);
        verify(quizRepository, never()).markQuizAssigned(anyLong(), any());
        verify(quizRepository, never())
                .insertQuizAssignedNotification(anyLong(), anyString(), any(), anyLong());
    }
}
