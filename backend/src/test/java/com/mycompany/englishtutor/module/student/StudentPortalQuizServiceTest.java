package com.mycompany.englishtutor.module.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyBoolean;
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
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.AnswerResultResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizDetailResponse;
import com.mycompany.englishtutor.module.student.api.StudentPortalResponses.StudentQuizQuestion;
import com.mycompany.englishtutor.module.student.config.EloProperties;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.QuestionRow;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.QuizAccessRow;
import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository.StoredAnswerRow;
import com.mycompany.englishtutor.module.student.service.EloCalculator;
import com.mycompany.englishtutor.module.student.service.QuizExpiryService;
import com.mycompany.englishtutor.module.student.service.StudentPortalService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Nghiệp vụ làm quiz và Elo của học sinh (Mockito, không Spring/DB). */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StudentPortalQuizServiceTest {

    private static final Long STUDENT_ID = 20L;
    private static final Long QUIZ_ID = 7L;
    private static final Long QUESTION_ID = 100L;

    @Mock
    StudentPortalRepository repository;

    @Mock
    UserRepository userRepository;

    @Mock
    ClassOccurrenceService occurrenceService;

    @Mock
    QuizExpiryService quizExpiryService;

    @Spy
    EloCalculator eloCalculator = new EloCalculator(new EloProperties());

    @InjectMocks
    StudentPortalService service;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("hs1", "x", List.of()));
        when(userRepository.findByUsername("hs1"))
                .thenReturn(Optional.of(User.builder().id(STUDENT_ID).username("hs1").build()));
        when(repository.findQuizAccess(QUIZ_ID)).thenReturn(Optional.of(quiz("ASSIGNED", STUDENT_ID, 1)));
        when(repository.findQuestion(QUIZ_ID, QUESTION_ID))
                .thenReturn(Optional.of(new QuestionRow(QUESTION_ID, QUIZ_ID, "C", "Giải thích", "A2")));
        when(repository.countQuestions(QUIZ_ID)).thenReturn(2);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private static QuizAccessRow quiz(String status, Long studentId, int days) {
        return new QuizAccessRow(
                QUIZ_ID, "Quiz A", status, OffsetDateTime.now().plusDays(days), 2, studentId, 10L, 42L);
    }

    @Test
    void answer_correct_updatesEloAndStoresAnswer() {
        when(repository.findStoredAnswer(STUDENT_ID, QUESTION_ID)).thenReturn(Optional.empty());
        when(repository.lockElo(STUDENT_ID)).thenReturn(1000);
        when(repository.insertAnswer(eq(STUDENT_ID), eq(QUESTION_ID), eq("C"), eq(true), eq(1000), eq(1016), eq(16)))
                .thenReturn(1);
        when(repository.countAnswers(QUIZ_ID, STUDENT_ID)).thenReturn(1);

        AnswerResultResponse result = service.answer(QUIZ_ID, QUESTION_ID, "c");

        assertTrue(result.isCorrect());
        assertEquals(16, result.eloChange());
        assertEquals(1016, result.eloAfter());
        assertFalse(result.completed());
        verify(repository).updateElo(STUDENT_ID, 1016);
        verify(repository, never()).markQuizCompleted(anyLong());
    }

    @Test
    void answer_lastQuestion_completesQuiz() {
        when(repository.findStoredAnswer(STUDENT_ID, QUESTION_ID)).thenReturn(Optional.empty());
        when(repository.lockElo(STUDENT_ID)).thenReturn(1000);
        when(repository.insertAnswer(anyLong(), anyLong(), anyString(), anyBoolean(), anyInt(), anyInt(), anyInt()))
                .thenReturn(1);
        when(repository.countAnswers(QUIZ_ID, STUDENT_ID)).thenReturn(2);

        AnswerResultResponse result = service.answer(QUIZ_ID, QUESTION_ID, "A");

        assertFalse(result.isCorrect());
        assertTrue(result.completed());
        verify(repository).markQuizCompleted(QUIZ_ID);
    }

    @Test
    void answer_alreadyAnswered_replaysWithoutChangingElo() {
        when(repository.findStoredAnswer(STUDENT_ID, QUESTION_ID))
                .thenReturn(Optional.of(new StoredAnswerRow("C", true, 1000, 1016, 16)));
        when(repository.countAnswers(QUIZ_ID, STUDENT_ID)).thenReturn(1);

        AnswerResultResponse result = service.answer(QUIZ_ID, QUESTION_ID, "D");

        assertEquals("C", result.selectedAnswer());
        assertEquals(16, result.eloChange());
        verify(repository, never()).lockElo(anyLong());
        verify(repository, never())
                .insertAnswer(anyLong(), anyLong(), anyString(), anyBoolean(), anyInt(), anyInt(), anyInt());
        verify(repository, never()).updateElo(anyLong(), anyInt());
    }

    @Test
    void answer_concurrentInsertLost_replaysWinnerAndKeepsEloUntouched() {
        // Request song song đã ghi trước: insert không thêm dòng nào (ON CONFLICT DO NOTHING)
        when(repository.findStoredAnswer(STUDENT_ID, QUESTION_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(new StoredAnswerRow("C", true, 1000, 1016, 16)));
        when(repository.lockElo(STUDENT_ID)).thenReturn(1016);
        when(repository.insertAnswer(anyLong(), anyLong(), anyString(), anyBoolean(), anyInt(), anyInt(), anyInt()))
                .thenReturn(0);
        when(repository.countAnswers(QUIZ_ID, STUDENT_ID)).thenReturn(1);

        AnswerResultResponse result = service.answer(QUIZ_ID, QUESTION_ID, "C");

        assertEquals(16, result.eloChange());
        verify(repository, never()).updateElo(anyLong(), anyInt());
    }

    @Test
    void answer_invalidOption_rejected() {
        AppException ex = assertThrows(AppException.class, () -> service.answer(QUIZ_ID, QUESTION_ID, "E"));
        assertEquals(ErrorCode.QUIZ_ANSWER_INVALID, ex.getErrorCode());
    }

    @Test
    void answer_pastDeadline_marksExpiredAndThrows() {
        when(repository.findQuizAccess(QUIZ_ID)).thenReturn(Optional.of(quiz("ASSIGNED", STUDENT_ID, -1)));
        when(repository.findStoredAnswer(STUDENT_ID, QUESTION_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.answer(QUIZ_ID, QUESTION_ID, "C"));

        assertEquals(ErrorCode.QUIZ_EXPIRED, ex.getErrorCode());
        verify(quizExpiryService).markExpired(QUIZ_ID);
        verify(repository, never()).updateElo(anyLong(), anyInt());
    }

    @Test
    void startAttempt_pastDeadline_marksExpiredAndThrows() {
        when(repository.findQuizAccess(QUIZ_ID)).thenReturn(Optional.of(quiz("ASSIGNED", STUDENT_ID, -1)));

        AppException ex = assertThrows(AppException.class, () -> service.startAttempt(QUIZ_ID));

        assertEquals(ErrorCode.QUIZ_EXPIRED, ex.getErrorCode());
        verify(quizExpiryService).markExpired(QUIZ_ID);
    }

    @Test
    void quizOfAnotherStudent_isHidden() {
        when(repository.findQuizAccess(QUIZ_ID)).thenReturn(Optional.of(quiz("ASSIGNED", 99L, 1)));

        assertEquals(ErrorCode.QUIZ_NOT_AVAILABLE,
                assertThrows(AppException.class, () -> service.startAttempt(QUIZ_ID)).getErrorCode());
        assertEquals(ErrorCode.QUIZ_NOT_AVAILABLE,
                assertThrows(AppException.class, () -> service.answer(QUIZ_ID, QUESTION_ID, "C")).getErrorCode());
        assertEquals(ErrorCode.QUIZ_NOT_AVAILABLE,
                assertThrows(AppException.class, () -> service.getQuizDetail(QUIZ_ID)).getErrorCode());
    }

    @Test
    void draftQuiz_isHiddenFromStudent() {
        when(repository.findQuizAccess(QUIZ_ID)).thenReturn(Optional.of(quiz("DRAFT", STUDENT_ID, 1)));

        assertEquals(ErrorCode.QUIZ_NOT_AVAILABLE,
                assertThrows(AppException.class, () -> service.getQuizDetail(QUIZ_ID)).getErrorCode());
    }

    @Test
    void quizDetail_countsAnsweredAndKeepsPendingAnswersHidden() {
        var answered = new StudentQuizQuestion(
                1L, 1, "Q1", "a", "b", "c", "d", null, "A2", true, "A", false, "C", "Giải thích");
        var pending = new StudentQuizQuestion(
                2L, 2, "Q2", "a", "b", "c", "d", null, "A2", false, null, null, null, null);
        when(repository.findQuestionsForStudent(QUIZ_ID, STUDENT_ID)).thenReturn(List.of(answered, pending));

        StudentQuizDetailResponse detail = service.getQuizDetail(QUIZ_ID);

        assertEquals(2, detail.totalQuestions());
        assertEquals(1, detail.answeredCount());
        assertNull(detail.questions().get(1).correctAnswer());
        assertNull(detail.questions().get(1).explanation());
        assertEquals("C", detail.questions().get(0).correctAnswer());
    }
}
