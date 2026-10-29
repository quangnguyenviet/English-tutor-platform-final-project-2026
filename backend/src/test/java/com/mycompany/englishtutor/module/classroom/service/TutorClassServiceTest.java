package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
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
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpMethod;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OnDemandSessionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/** Nghiệp vụ lịch dạy thử (UC-T08) và lịch dạy cố định (UC-T09) ở tầng service. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TutorClassServiceTest {

    private static final Long CLASS_ID = 1L;
    private static final Long TUTOR_ID = 10L;
    private static final Long STUDENT_ID = 20L;
    private static final LocalDate FUTURE_DATE = LocalDate.now().plusDays(2);
    private static final LocalTime SLOT_START = LocalTime.of(19, 0);
    private static final LocalTime SLOT_END = LocalTime.of(20, 30);

    private static final ClassState TRIAL_STATE =
            new ClassState(TUTOR_ID, STUDENT_ID, "TRIAL", "ONLINE", "Tiếng Anh giao tiếp", "Nguyễn Minh Khôi");
    private static final ClassState ACTIVE_STATE =
            new ClassState(TUTOR_ID, STUDENT_ID, "ACTIVE", "ONLINE", "IELTS 1 kèm 1", "Lê Hoàng Nam");

    @Mock
    ClassroomQueryRepository classroomRepository;

    @Mock
    ScheduleConflictChecker conflictChecker;

    @Mock
    UserRepository userRepository;

    @Mock
    AuditLogService auditLogService;

    @Mock
    JdbcTemplate jdbcTemplate;

    @InjectMocks
    TutorClassService tutorClassService;

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
                        .build()));
        httpRequest =
                new MockHttpServletRequest(HttpMethod.GET.name(), "/api/v1/classes/1/finalize-schedule");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    private UpsertTrialSessionRequest validRequest() {
        return UpsertTrialSessionRequest.builder()
                .sessionDate(FUTURE_DATE)
                .startTime(SLOT_START)
                .endTime(SLOT_END)
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc-defg-hij")
                .build();
    }

    private FinalizeScheduleRequest validScheduleRequest() {
        LocalDate from = LocalDate.now().plusDays(3);
        return FinalizeScheduleRequest.builder()
                .schedules(List.of(scheduleSlot(3, from)))
                .build();
    }

    private FinalizeScheduleRequest.ScheduleSlot scheduleSlot(int dayOfWeek, LocalDate validFrom) {
        return FinalizeScheduleRequest.ScheduleSlot.builder()
                .dayOfWeek(dayOfWeek)
                .startTime(SLOT_START)
                .endTime(SLOT_END)
                .validFrom(validFrom)
                .validTo(null)
                .build();
    }

    private void mockOwnedActiveClass() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));
    }

    private void mockNoConflict() {
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), eq(null)))
                .thenReturn(List.of());
    }

    private void mockNoWeeklyConflict() {
        when(conflictChecker.findWeeklyConflicts(
                        eq(TUTOR_ID),
                        anyInt(),
                        any(LocalTime.class),
                        any(LocalTime.class),
                        any(),
                        any(),
                        any()))
                .thenReturn(List.of());
        when(classroomRepository.findSessionConflicts(
                        eq(TUTOR_ID),
                        any(),
                        any(),
                        any(LocalTime.class),
                        any(LocalTime.class),
                        any()))
                .thenReturn(List.of());
    }

    // ------------------------------------------------------------- CREATE (UC-T08)

    @Test
    void createTrialSession_success_shouldInsertAndReturnScheduled() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
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

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void createTrialSession_notOwned_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(99L, STUDENT_ID, "TRIAL", "ONLINE", "Lớp", "Học sinh")));

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void createTrialSession_classNotTrial_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.CLASS_NOT_TRIAL);
    }

    @Test
    void createTrialSession_alreadyExists_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder().sessionId(5L).status("SCHEDULED").build()));

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, validRequest()),
                ErrorCode.TRIAL_SESSION_ALREADY_EXISTS);
    }

    @Test
    void createTrialSession_conflict_shouldThrow409WithDetails() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
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
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setMeetingUrl(null);

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
    }

    @Test
    void createTrialSession_atHomeWithoutLocation_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setTeachingMode("AT_HOME");

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
    }

    @Test
    void createTrialSession_endBeforeStart_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setStartTime(LocalTime.of(21, 0));
        request.setEndTime(LocalTime.of(19, 0));

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_INVALID_TIME);
    }

    @Test
    void createTrialSession_dateInPast_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setSessionDate(LocalDate.now().minusDays(1));

        assertErrorCode(() -> tutorClassService.createTrialSession(CLASS_ID, request),
                ErrorCode.TRIAL_SESSION_DATE_IN_PAST);
    }

    // ------------------------------------------------------------- UPDATE (UC-T08)

    @Test
    void updateTrialSession_noTrialSession_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.updateTrialSession(CLASS_ID, validRequest()),
                ErrorCode.TRIAL_SESSION_NOT_FOUND);
    }

    @Test
    void updateTrialSession_trialNotScheduled_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder().sessionId(5L).status("COMPLETED").build()));

        assertErrorCode(() -> tutorClassService.updateTrialSession(CLASS_ID, validRequest()),
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

    // --------------------------------------------------------- FINALIZE (UC-T09)

    @Test
    void finalizeSchedule_success_shouldInsertSchedulesAndAudit() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        mockNoWeeklyConflict();
        when(classroomRepository.findSchedules(CLASS_ID)).thenReturn(List.of());

        FinalizeScheduleResponse result =
                tutorClassService.finalizeSchedule(CLASS_ID, validScheduleRequest(), httpRequest);

        assertEquals(CLASS_ID, result.getClassId());
        verify(classroomRepository).insertSchedules(eq(CLASS_ID), any());
        verify(classroomRepository, never()).deleteSchedules(CLASS_ID);
        verify(auditLogService).log(eq(TUTOR_ID), eq("FINALIZE_SCHEDULE"), eq("CLASS"), eq(CLASS_ID), any(), any());
        verify(jdbcTemplate).update(
                eq("""
                        INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                        VALUES (?, ?, ?, 'CLASS', ?)
                        """),
                eq(STUDENT_ID), any(String.class), any(String.class), eq(CLASS_ID));
    }

    @Test
    void finalizeSchedule_classNotActive_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.CLASS_NOT_ACTIVE);
    }

    @Test
    void finalizeSchedule_notOwned_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(99L, STUDENT_ID, "ACTIVE", "ONLINE", "Lớp", "Học sinh")));

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void finalizeSchedule_alreadyHasSchedules_shouldThrow409() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(2);

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.SCHEDULE_ALREADY_EXISTS);
    }

    @Test
    void finalizeSchedule_weeklyConflict_shouldThrowWithDetails() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        FinalizeScheduleRequest request = validScheduleRequest();
        WeeklyConflictInfo conflict = new WeeklyConflictInfo(
                2L, "IELTS 1 kèm 1", "Lê Hoàng Nam", 3, SLOT_START, LocalTime.of(20, 0),
                LocalDate.now().plusDays(1), null);
        when(conflictChecker.findWeeklyConflicts(
                        eq(TUTOR_ID), eq(3), any(LocalTime.class), any(LocalTime.class),
                        any(), any(), eq(CLASS_ID)))
                .thenReturn(List.of(conflict));

        AppException ex = assertThrows(
                AppException.class, () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest));

        assertEquals(ErrorCode.SCHEDULE_DUPLICATE, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("IELTS 1 kèm 1"));
        assertTrue(ex.getMessage().contains("Lê Hoàng Nam"));
        verify(classroomRepository, never()).insertSchedules(anyLong(), any());
    }

    @Test
    void finalizeSchedule_sessionConflictOnSameWeekday_shouldThrow409() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        FinalizeScheduleRequest request = FinalizeScheduleRequest.builder()
                .schedules(List.of(scheduleSlot(3, LocalDate.now().plusDays(3))))
                .build();
        ConflictInfo conflict =
                new ConflictInfo(8L, nextWeekday(3, LocalDate.now()), SLOT_START, SLOT_END,
                        "Tiếng Anh giao tiếp", "Nguyễn Minh Khôi", false);
        when(conflictChecker.findWeeklyConflicts(
                        eq(TUTOR_ID), anyInt(), any(LocalTime.class), any(LocalTime.class),
                        any(), any(), eq(CLASS_ID)))
                .thenReturn(List.of());
        when(classroomRepository.findSessionConflicts(
                        eq(TUTOR_ID), any(), any(),
                        any(LocalTime.class), any(LocalTime.class), eq(CLASS_ID)))
                .thenReturn(List.of(conflict));

        AppException ex = assertThrows(
                AppException.class, () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest));
        assertEquals(ErrorCode.SCHEDULE_CONFLICT, ex.getErrorCode());
    }

    @Test
    void finalizeSchedule_endBeforeStart_shouldThrow400() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        FinalizeScheduleRequest.ScheduleSlot slot = scheduleSlot(3, LocalDate.now().plusDays(3));
        slot.setStartTime(LocalTime.of(21, 0));
        slot.setEndTime(LocalTime.of(19, 0));
        FinalizeScheduleRequest request = FinalizeScheduleRequest.builder().schedules(List.of(slot)).build();

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest),
                ErrorCode.SCHEDULE_INVALID_TIME);
    }

    @Test
    void finalizeSchedule_validFromInPast_shouldThrow400() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        FinalizeScheduleRequest.ScheduleSlot slot = scheduleSlot(3, LocalDate.now().minusDays(1));
        FinalizeScheduleRequest request = FinalizeScheduleRequest.builder().schedules(List.of(slot)).build();

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest),
                ErrorCode.SCHEDULE_DATE_IN_PAST);
    }

    @Test
    void finalizeSchedule_validToBeforeValidFrom_shouldThrow400() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        FinalizeScheduleRequest.ScheduleSlot slot = scheduleSlot(3, LocalDate.now().plusDays(3));
        slot.setValidTo(LocalDate.now().plusDays(1));
        FinalizeScheduleRequest request = FinalizeScheduleRequest.builder().schedules(List.of(slot)).build();

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest),
                ErrorCode.SCHEDULE_INVALID_RANGE);
    }

    @Test
    void finalizeSchedule_overlappingSlotsSameWeekday_shouldThrow400() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);
        LocalDate from = LocalDate.now().plusDays(3);
        FinalizeScheduleRequest.ScheduleSlot a = scheduleSlot(3, from);
        FinalizeScheduleRequest.ScheduleSlot b = scheduleSlot(3, from);
        b.setStartTime(LocalTime.of(20, 0));
        b.setEndTime(LocalTime.of(21, 30));
        FinalizeScheduleRequest request = FinalizeScheduleRequest.builder().schedules(List.of(a, b)).build();

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest),
                ErrorCode.SCHEDULE_DUPLICATE);
    }

    // ---------------------------------------------------------- UPDATE LỊCH (UC-T09)

    @Test
    void updateSchedule_success_shouldReplaceSchedulesWithoutTouchingSessions() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(2);
        mockNoWeeklyConflict();

        FinalizeScheduleResponse result =
                tutorClassService.updateSchedule(CLASS_ID, validScheduleRequest(), httpRequest);

        assertEquals(CLASS_ID, result.getClassId());
        verify(classroomRepository).deleteSchedules(CLASS_ID);
        verify(classroomRepository).insertSchedules(eq(CLASS_ID), any());
        verify(auditLogService).log(eq(TUTOR_ID), eq("UPDATE_CLASS_SCHEDULE"), eq("CLASS"), eq(CLASS_ID), any(), any());
        // Không sinh/xóa session (ràng buộc 9).
        verify(classroomRepository, never()).insertOnDemandSession(
                anyLong(), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any());
    }

    @Test
    void updateSchedule_noSchedulesYet_shouldThrow404() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);

        assertErrorCode(
                () -> tutorClassService.updateSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.SCHEDULE_NOT_FOUND);
    }

    // -------------------------------------------------- ON-DEMAND SESSION (UC-T09)

    @Test
    void createSessionOnDemand_singleSlot_createsNewSession() {
        mockOwnedActiveClass();
        LocalDate date = nextWeekday(3, LocalDate.now());
        when(classroomRepository.findSchedules(CLASS_ID))
                .thenReturn(List.of(scheduleInfo(3, date)));
        when(classroomRepository.findOnDemandSessionAt(eq(CLASS_ID), eq(date), eq(SLOT_START)))
                .thenReturn(Optional.empty());
        when(classroomRepository.insertOnDemandSession(
                        eq(CLASS_ID), eq(date), eq(SLOT_START), eq(SLOT_END), eq("ONLINE")))
                .thenReturn(77L);

        OnDemandSessionResponse result =
                tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(date).build(), httpRequest);

        assertEquals(77L, result.getSessionId());
        assertTrue(result.getCreatedNow());
        assertFalse(result.getIsTrial());
        verify(auditLogService).log(eq(TUTOR_ID), eq("CREATE_SESSION"), eq("CLASS"), eq(CLASS_ID), any(), any());
    }

    @Test
    void createSessionOnDemand_alreadyExists_isIdempotent() {
        mockOwnedActiveClass();
        LocalDate date = nextWeekday(3, LocalDate.now());
        when(classroomRepository.findSchedules(CLASS_ID))
                .thenReturn(List.of(scheduleInfo(3, date)));
        OnDemandSessionResponse existing = OnDemandSessionResponse.builder()
                .sessionId(55L)
                .sessionDate(date)
                .startTime(SLOT_START)
                .endTime(SLOT_END)
                .status("SCHEDULED")
                .isTrial(Boolean.FALSE)
                .createdNow(Boolean.FALSE)
                .build();
        when(classroomRepository.findOnDemandSessionAt(eq(CLASS_ID), eq(date), eq(SLOT_START)))
                .thenReturn(Optional.of(existing));

        OnDemandSessionResponse result =
                tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(date).build(), httpRequest);

        assertEquals(55L, result.getSessionId());
        assertFalse(result.getCreatedNow());
        verify(classroomRepository, never()).insertOnDemandSession(
                anyLong(), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class), any());
    }

    @Test
    void createSessionOnDemand_dateNotInSchedule_shouldThrow400() {
        mockOwnedActiveClass();
        // Ca T3 hiệu lực từ tuần sau, nhưng xin tạo buổi vào T3 tuần trước.
        LocalDate futureSlotDate = nextWeekday(3, LocalDate.now());
        LocalDate pastWeekDate = nextWeekday(3, LocalDate.now().minusDays(7));
        when(classroomRepository.findSchedules(CLASS_ID))
                .thenReturn(List.of(scheduleInfo(3, futureSlotDate)));

        assertErrorCode(
                () -> tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(pastWeekDate).build(), httpRequest),
                ErrorCode.SESSION_DATE_NOT_IN_SCHEDULE);
    }

    @Test
    void createSessionOnDemand_weekdayWithoutSlot_shouldThrow400() {
        mockOwnedActiveClass();
        when(classroomRepository.findSchedules(CLASS_ID))
                .thenReturn(List.of(scheduleInfo(3, nextWeekday(3, LocalDate.now()))));
        LocalDate fridayDate = nextWeekday(5, LocalDate.now());

        assertErrorCode(
                () -> tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(fridayDate).build(), httpRequest),
                ErrorCode.SESSION_DATE_NOT_IN_SCHEDULE);
    }

    @Test
    void createSessionOnDemand_twoSlotsWithoutStartTime_shouldThrowAmbiguous() {
        mockOwnedActiveClass();
        LocalDate date = nextWeekday(3, LocalDate.now());
        ScheduleInfo slotA = scheduleInfo(3, date);
        ScheduleInfo slotB = scheduleInfo(3, date);
        slotB.setStartTime(LocalTime.of(20, 0));
        slotB.setEndTime(LocalTime.of(21, 30));
        when(classroomRepository.findSchedules(CLASS_ID)).thenReturn(List.of(slotA, slotB));

        assertErrorCode(
                () -> tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(date).build(), httpRequest),
                ErrorCode.SESSION_AMBIGUOUS_TIME);
    }

    @Test
    void createSessionOnDemand_twoSlotsWithStartTime_picksMatchingSlot() {
        mockOwnedActiveClass();
        LocalDate date = nextWeekday(3, LocalDate.now());
        ScheduleInfo slotA = scheduleInfo(3, date);
        ScheduleInfo slotB = scheduleInfo(3, date);
        slotB.setStartTime(LocalTime.of(20, 0));
        slotB.setEndTime(LocalTime.of(21, 30));
        when(classroomRepository.findSchedules(CLASS_ID)).thenReturn(List.of(slotA, slotB));
        when(classroomRepository.findOnDemandSessionAt(eq(CLASS_ID), eq(date), eq(LocalTime.of(20, 0))))
                .thenReturn(Optional.empty());
        when(classroomRepository.insertOnDemandSession(
                        eq(CLASS_ID), eq(date), eq(LocalTime.of(20, 0)), eq(LocalTime.of(21, 30)), eq("ONLINE")))
                .thenReturn(88L);

        OnDemandSessionResponse result =
                tutorClassService.createSessionOnDemand(
                        CLASS_ID,
                        CreateSessionRequest.builder().sessionDate(date).startTime(LocalTime.of(20, 0)).build(),
                        httpRequest);

        assertEquals(88L, result.getSessionId());
        assertEquals(LocalTime.of(20, 0), result.getStartTime());
        assertTrue(result.getCreatedNow());
    }

    @Test
    void createSessionOnDemand_noScheduleAtAll_shouldThrow404() {
        mockOwnedActiveClass();
        when(classroomRepository.findSchedules(CLASS_ID)).thenReturn(List.of());
        LocalDate date = nextWeekday(3, LocalDate.now());

        assertErrorCode(
                () -> tutorClassService.createSessionOnDemand(
                        CLASS_ID, CreateSessionRequest.builder().sessionDate(date).build(), httpRequest),
                ErrorCode.SCHEDULE_NOT_FOUND);
    }

    @Test
    void createSessionOnDemand_classNotActive_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));

        assertErrorCode(
                () -> tutorClassService.createSessionOnDemand(
                        CLASS_ID,
                        CreateSessionRequest.builder().sessionDate(LocalDate.now().plusDays(3)).build(),
                        httpRequest),
                ErrorCode.CLASS_NOT_ACTIVE);
    }

    // --------------------------------------------------------------- READ

    @Test
    void getClassDetail_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void getClassDetail_notOwned_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(99L, STUDENT_ID, "TRIAL", "ONLINE", "Lớp", "Học sinh")));

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void getMyClasses_invalidStatus_shouldThrow400() {
        assertErrorCode(() -> tutorClassService.getMyClasses("ON_HOLD"), ErrorCode.INVALID_CLASS_STATUS);
    }

    // ------------------------------------------------------------- HELPERS

    private static ScheduleInfo scheduleInfo(int dayOfWeek, LocalDate validFrom) {
        return ScheduleInfo.builder()
                .dayOfWeek(dayOfWeek)
                .startTime(SLOT_START)
                .endTime(SLOT_END)
                .validFrom(validFrom)
                .validTo(null)
                .build();
    }

    /** Thứ (1 = T2 ... 7 = CN) gần nhất sau hoặc bằng hôm nay + N tuần; dùng cho ngày kiểm thử. */
    private static LocalDate nextWeekday(int dayOfWeekInt, LocalDate anchor) {
        int diff = dayOfWeekInt - anchor.getDayOfWeek().getValue();
        return diff >= 0 ? anchor.plusDays(diff) : anchor.plusDays(diff + 7);
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }
}
