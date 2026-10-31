package com.mycompany.englishtutor.module.quiz.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.quiz.ai.AiClient;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatPayload;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiChatResult;
import com.mycompany.englishtutor.module.quiz.ai.dto.AiDraftQuestion;
import com.mycompany.englishtutor.module.quiz.api.request.AiChatQuizRequest;
import com.mycompany.englishtutor.module.quiz.api.response.AiChatQuizResponse;
import com.mycompany.englishtutor.module.quiz.api.response.SkillProfileItemResponse;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizQuestionRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.QuizRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.LessonOwnershipRow;
import com.mycompany.englishtutor.module.quiz.repository.QuizRepository.SkillRow;
import com.mycompany.englishtutor.module.quiz.repository.SkillProfileRepository;
import com.mycompany.englishtutor.module.quiz.repository.SkillProfileRepository.SkillProfileRow;
import com.mycompany.englishtutor.module.quiz.repository.SkillProfileRepository.StudentContextRow;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Trợ lý AI soạn quiz (tầng service, Mockito — không Spring/DB): quyền sở
 * hữu buổi học/lớp, map câu AI → shape form, guard kỹ năng, đọc SKP.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class AiQuizServiceTest {

    private static final Long LESSON_ID = 42L;
    private static final Long QUIZ_ID = 7L;
    private static final Long CLASS_ID = 1L;
    private static final Long TUTOR_ID = 10L;
    private static final Long STUDENT_ID = 20L;

    private static final LessonOwnershipRow OWNED_LESSON =
            new LessonOwnershipRow(LESSON_ID, CLASS_ID, TUTOR_ID, STUDENT_ID);
    private static final LessonOwnershipRow OTHER_LESSON =
            new LessonOwnershipRow(LESSON_ID, 99L, 99L, 30L);

    private static final StudentContextRow STUDENT_CTX =
            new StudentContextRow(STUDENT_ID, "Lớp 9", "IELTS");
    private static final SkillProfileRow SKILL_ROW =
            new SkillProfileRow(
                    "narrative_tense",
                    "Kể chuyện quá khứ / Narrative Tense",
                    "SPEAKING",
                    1,
                    3,
                    4,
                    0.75,
                    null);

    @Mock
    QuizRepository quizRepository;

    @Mock
    SkillProfileRepository skillProfileRepository;

    @Mock
    AiClient aiClient;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    AiQuizService aiQuizService;

    @BeforeEach
    void setUpSecurityContext() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("tutor1", "x", List.of()));
        when(userRepository.findByUsername("tutor1"))
                .thenReturn(
                        Optional.of(
                                User.builder()
                                        .id(TUTOR_ID)
                                        .username("tutor1")
                                        .fullName("Trần Gia Sư")
                                        .role(UserRole.TUTOR.name())
                                        .build()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }

    private AiChatQuizRequest chatRequest(String message) {
        return AiChatQuizRequest.builder().message(message).build();
    }

    // --------------------------------------------------------------- AI CHAT

    @Test
    void aiChat_success_mapsDraftAndSendsAnonymizedContext() {
        when(quizRepository.findLessonOwnership(LESSON_ID)).thenReturn(Optional.of(OWNED_LESSON));
        when(skillProfileRepository.findStudentContext(CLASS_ID)).thenReturn(Optional.of(STUDENT_CTX));
        when(skillProfileRepository.findStudentSkillStats(STUDENT_ID)).thenReturn(List.of(SKILL_ROW));
        when(quizRepository.findSkills())
                .thenReturn(List.of(new SkillRow("narrative_tense", "Kể chuyện quá khứ", "SPEAKING")));
        AiChatResult ai =
                new AiChatResult(
                        "Đã soạn 1 câu B1.",
                        List.of(
                                new AiDraftQuestion(
                                        "Yesterday I ____ my grandma.",
                                        Map.of("A", "helps", "B", "helped", "C", "helping", "D", "have helped"),
                                        "B",
                                        "Quá khứ đơn.",
                                        "B1",
                                        "narrative_tense")));
        when(aiClient.quizChat(any(AiChatPayload.class))).thenReturn(ai);

        AiChatQuizResponse result = aiQuizService.aiChatQuiz(LESSON_ID, chatRequest("Tạo 1 câu B1"));

        assertEquals("Đã soạn 1 câu B1.", result.getReply());
        assertEquals(1, result.getDraftQuestions().size());
        var draft = result.getDraftQuestions().get(0);
        assertEquals("B", draft.getCorrectAnswer());
        assertEquals("B1", draft.getCefrLevel());
        assertEquals("narrative_tense", draft.getSkillCode());
        assertEquals("helped", draft.getOptionB());

        // Ngữ cảnh ẩn danh được gửi cho AI Service (AD-2: mã HS-N, không PII).
        org.mockito.ArgumentCaptor<AiChatPayload> cap =
                org.mockito.ArgumentCaptor.forClass(AiChatPayload.class);
        verify(aiClient).quizChat(cap.capture());
        assertEquals("HS-" + STUDENT_ID, cap.getValue().studentCode());
        assertEquals("Lớp 9", cap.getValue().grade());
        assertEquals(1, cap.getValue().skillProfile().size());
    }

    @Test
    void aiChat_blankMessage_shouldThrow1407() {
        assertErrorCode(
                () -> aiQuizService.aiChatQuiz(LESSON_ID, chatRequest("   ")),
                ErrorCode.AI_CHAT_MESSAGE_REQUIRED);
        verify(aiClient, never()).quizChat(any());
    }

    @Test
    void aiChat_sessionMissing_shouldThrow404() {
        when(quizRepository.findLessonOwnership(LESSON_ID)).thenReturn(Optional.empty());
        assertErrorCode(
                () -> aiQuizService.aiChatQuiz(LESSON_ID, chatRequest("x")),
                ErrorCode.SESSION_NOT_FOUND);
        verify(aiClient, never()).quizChat(any());
    }

    @Test
    void aiChat_notOwner_shouldThrowForbidden() {
        when(quizRepository.findLessonOwnership(LESSON_ID)).thenReturn(Optional.of(OTHER_LESSON));
        assertErrorCode(
                () -> aiQuizService.aiChatQuiz(LESSON_ID, chatRequest("x")),
                ErrorCode.SESSION_NOT_OWNED);
        verify(aiClient, never()).quizChat(any());
    }

    @Test
    void aiChat_sendsCurrentDraftWhenEditingQuiz() {
        when(quizRepository.findLessonOwnership(LESSON_ID)).thenReturn(Optional.of(OWNED_LESSON));
        when(skillProfileRepository.findStudentContext(CLASS_ID)).thenReturn(Optional.of(STUDENT_CTX));
        when(skillProfileRepository.findStudentSkillStats(STUDENT_ID)).thenReturn(List.of());
        when(quizRepository.findSkills()).thenReturn(List.of());
        when(quizRepository.findQuiz(QUIZ_ID))
                .thenReturn(
                        Optional.of(
                                new QuizRow(QUIZ_ID, "Quiz A", "DRAFT", null, LESSON_ID, 1)));
        when(quizRepository.findQuizQuestions(QUIZ_ID))
                .thenReturn(
                        List.of(
                                new QuizQuestionRow(
                                        1, "She ___ to school.", "go", "goes", "going", "gone", "B",
                                        null, "A1", "present_simple")));
        when(aiClient.quizChat(any())).thenReturn(new AiChatResult("ok", List.of()));

        AiChatQuizRequest req =
                AiChatQuizRequest.builder().message("Nâng câu 1 lên B1").quizId(QUIZ_ID).build();
        aiQuizService.aiChatQuiz(LESSON_ID, req);

        org.mockito.ArgumentCaptor<AiChatPayload> cap =
                org.mockito.ArgumentCaptor.forClass(AiChatPayload.class);
        verify(aiClient).quizChat(cap.capture());
        assertEquals(1, cap.getValue().currentDraft().size());
        assertEquals("She ___ to school.", cap.getValue().currentDraft().get(0).content());
    }

    // --------------------------------------------------------------- SKILL PROFILE

    @Test
    void skillProfile_owner_returnsRankedRows() {
        when(skillProfileRepository.classExists(CLASS_ID)).thenReturn(true);
        when(skillProfileRepository.classOwnedBy(CLASS_ID, TUTOR_ID)).thenReturn(true);
        when(skillProfileRepository.findStudentContext(CLASS_ID)).thenReturn(Optional.of(STUDENT_CTX));
        when(skillProfileRepository.findStudentSkillStats(STUDENT_ID)).thenReturn(List.of(SKILL_ROW));

        List<SkillProfileItemResponse> result = aiQuizService.getStudentSkillProfile(CLASS_ID);

        assertEquals(1, result.size());
        assertEquals("narrative_tense", result.get(0).getSkillCode());
        assertEquals(0.75, result.get(0).getErrorRate(), 0.0001);
    }

    @Test
    void skillProfile_notFound_shouldThrow404() {
        when(skillProfileRepository.classExists(CLASS_ID)).thenReturn(false);
        assertErrorCode(
                () -> aiQuizService.getStudentSkillProfile(CLASS_ID),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void skillProfile_notOwner_shouldThrowForbidden() {
        when(skillProfileRepository.classExists(CLASS_ID)).thenReturn(true);
        when(skillProfileRepository.classOwnedBy(CLASS_ID, TUTOR_ID)).thenReturn(false);
        assertErrorCode(
                () -> aiQuizService.getStudentSkillProfile(CLASS_ID),
                ErrorCode.CLASS_NOT_OWNED);
        verify(skillProfileRepository, never()).findStudentSkillStats(anyLong());
    }

    @Test
    void skillProfile_noData_returnsEmptyList() {
        when(skillProfileRepository.classExists(CLASS_ID)).thenReturn(true);
        when(skillProfileRepository.classOwnedBy(CLASS_ID, TUTOR_ID)).thenReturn(true);
        when(skillProfileRepository.findStudentContext(CLASS_ID)).thenReturn(Optional.of(STUDENT_CTX));
        when(skillProfileRepository.findStudentSkillStats(STUDENT_ID)).thenReturn(List.of());

        assertTrue(aiQuizService.getStudentSkillProfile(CLASS_ID).isEmpty());
    }
}
