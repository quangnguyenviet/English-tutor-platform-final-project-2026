package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Nghiệp vụ thiết lập/chỉnh sửa lịch dạy thử (UC-T08) ở tầng service. */
@ExtendWith(MockitoExtension.class)
class TutorClassServiceTest {

    private static final Long CLASS_ID = 1L;
    private static final Long TUTOR_ID = 10L;
    private static final LocalDate FUTURE_DATE = LocalDate.now().plusDays(2);
    private static final ClassState TRIAL_STATE =
            new ClassState(TUTOR_ID, "TRIAL", "Tiếng Anh giao tiếp", "Nguyễn Minh Khôi");

    @Mock
    ClassroomQueryRepository classroomRepository;

    @Mock
    ScheduleConflictChecker conflictChecker;

    @Mock
    UserRepository userRepository;

    @InjectMocks
    TutorClassService tutorClassService;

    @BeforeEach
    void setUpSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("tutor1", "x", List.of()));
        when(userRepository.findByUsername("tutor1"))
                .thenReturn(Optional.of(User.builder()
                        .id(TUTOR_ID)
                        .username("tutor1")
                        .fullName("Trần Gia Sư")
                        .build()));
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private UpsertTrialSessionRequest validRequest() {
        return UpsertTrialSessionRequest.builder()
                .sessionDate(FUTURE_DATE)
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 30))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc-defg-hij")
                .build();
    }

    private void mockOwnedTrialClass() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
    }

    private void mockNoConflict() {
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), eq(null)))
                .thenReturn(List.of());
    }

    // ------------------------------------------------------------- CREATE

    @Test
    void createTrialSession_success_shouldInsertAndReturnScheduled() {
        mockOwnedTrialClass();
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.empty());
        mockNoConflict();
        when(classroomRepository.insertTrialSession(eq(CLASS_ID), any())).thenReturn(99L);

        TrialSessionResponse result = tutorClassService.createTrialSession(CLASS_ID, validRequest());

        assertNotNull(result);
        assertEquals(99L, result.getSessionId());
        assertEquals("SCHEDULED", result.getStatus());
        assertEquals(FUTURE_DATE, result.getSessionDate());
        assertEquals("ONLINE", result.getTeachingMode());
        verify(classroomRepository).insertTrialSession(eq(CLASS_ID), any());
    }

    @Test
    void createTrialSession_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void createTrialSession_notOwned_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(99L, "TRIAL", "Lớp", "Học sinh")));

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void createTrialSession_classNotTrial_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(TUTOR_ID, "ACTIVE", "Lớp", "Học sinh")));

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_TRIAL);
    }

    @Test
    void createTrialSession_alreadyExists_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder().sessionId(5L).status("SCHEDULED").build()));

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.TRIAL_SESSION_ALREADY_EXISTS);
    }

    @Test
    void createTrialSession_conflict_shouldThrow409WithDetails() {
        mockOwnedTrialClass();
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.empty());
        ConflictInfo conflict =
                new ConflictInfo(7L, FUTURE_DATE, LocalTime.of(19, 30), LocalTime.of(20, 30),
                        "IELTS 1 kèm 1", "Lê Hoàng Nam", false);
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), eq(null)))
                .thenReturn(List.of(conflict));

        AppException ex = assertThrows(
                AppException.class, () -> tutorClassService.createTrialSession(CLASS_ID, validRequest()));

        assertEquals(ErrorCode.SCHEDULE_CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("IELTS 1 kèm 1"));
        assertTrue(ex.getMessage().contains("Lê Hoàng Nam"));
        verify(classroomRepository, never()).insertTrialSession(anyLong(), any());
    }

    @Test
    void createTrialSession_onlineWithoutMeetingUrl_shouldThrow400() {
        mockOwnedTrialClass();
        UpsertTrialSessionRequest request = validRequest();
        request.setMeetingUrl(null);

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
    }

    @Test
    void createTrialSession_atHomeWithoutLocation_shouldThrow400() {
        mockOwnedTrialClass();
        UpsertTrialSessionRequest request = validRequest();
        request.setTeachingMode("AT_HOME");

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
    }

    @Test
    void createTrialSession_endBeforeStart_shouldThrow400() {
        mockOwnedTrialClass();
        UpsertTrialSessionRequest request = validRequest();
        request.setStartTime(LocalTime.of(21, 0));
        request.setEndTime(LocalTime.of(19, 0));

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_INVALID_TIME);
    }

    @Test
    void createTrialSession_dateInPast_shouldThrow400() {
        mockOwnedTrialClass();
        UpsertTrialSessionRequest request = validRequest();
        request.setSessionDate(LocalDate.now().minusDays(1));

        assertErrorCode(
                () -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_DATE_IN_PAST);
    }

    // ------------------------------------------------------------- UPDATE

    @Test
    void updateTrialSession_noTrialSession_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> tutorClassService.updateTrialSession(CLASS_ID, validRequest()),
                ErrorCode.TRIAL_SESSION_NOT_FOUND);
    }

    @Test
    void updateTrialSession_trialNotScheduled_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder().sessionId(5L).status("COMPLETED").build()));

        assertErrorCode(
                () -> tutorClassService.updateTrialSession(CLASS_ID, validRequest()),
                ErrorCode.TRIAL_SESSION_NOT_EDITABLE);
    }

    @Test
    void updateTrialSession_success_shouldUpdateExistingRow() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder().sessionId(5L).status("SCHEDULED").build()));
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), eq(5L)))
                .thenReturn(List.of());

        TrialSessionResponse result = tutorClassService.updateTrialSession(CLASS_ID, validRequest());

        assertEquals(5L, result.getSessionId());
        verify(classroomRepository).updateTrialSession(eq(5L), any());
        verify(classroomRepository, never()).insertTrialSession(anyLong(), any());
    }

    // --------------------------------------------------------------- READ

    @Test
    void getClassDetail_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassDetail(CLASS_ID, TUTOR_ID)).thenReturn(Optional.empty());
        when(classroomRepository.classExists(CLASS_ID)).thenReturn(false);

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void getClassDetail_notOwned_shouldThrow403() {
        when(classroomRepository.findClassDetail(CLASS_ID, TUTOR_ID)).thenReturn(Optional.empty());
        when(classroomRepository.classExists(CLASS_ID)).thenReturn(true);

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void getMyClasses_invalidStatus_shouldThrow400() {
        assertErrorCode(
                () -> tutorClassService.getMyClasses("ON_HOLD"), ErrorCode.INVALID_CLASS_STATUS);
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }
}
