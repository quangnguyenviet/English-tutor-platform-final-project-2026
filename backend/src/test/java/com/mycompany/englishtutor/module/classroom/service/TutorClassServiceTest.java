package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
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
import com.mycompany.englishtutor.module.classroom.api.request.CreateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonListItem;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictSlotInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Nghiệp vụ lớp học của gia sư (V16): ca thử (classes.trial_*), lịch cố định
 * (UC-T09) và CRUD bài giảng (lessons).
 */
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

    /** V16: ca thử dò trùng trên class_schedules (slot conflicts) + ca thử lớp khác (trial conflicts). */
    private void mockNoTrialConflict() {
        when(classroomRepository.findSlotConflicts(
                        eq(TUTOR_ID), eq(FUTURE_DATE), eq(FUTURE_DATE),
                        eq(FUTURE_DATE.getDayOfWeek().getValue()), eq(SLOT_START), eq(SLOT_END), eq(CLASS_ID)))
                .thenReturn(List.of());
        when(classroomRepository.findTrialConflicts(
                        eq(TUTOR_ID), eq(CLASS_ID), eq(FUTURE_DATE), eq(SLOT_START), eq(SLOT_END)))
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
                        eq(null)))
                .thenReturn(List.of());
    }

    // ------------------------------------------------- CA THỬ (classes.trial_*, UC-T08)

    @Test
    void upsertTrialSlot_success_writesTrialColumnsAndReturnsSlot() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        mockNoTrialConflict();
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder()
                        .sessionDate(FUTURE_DATE)
                        .startTime(SLOT_START)
                        .endTime(SLOT_END)
                        .teachingMode("ONLINE")
                        .meetingUrl("https://meet.google.com/abc-defg-hij")
                        .status("SCHEDULED")
                        .build()));

        TrialSessionResponse result =
                tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest);

        assertNotNull(result);
        assertEquals(FUTURE_DATE, result.getSessionDate());
        assertEquals("ONLINE", result.getTeachingMode());
        assertEquals("SCHEDULED", result.getStatus());
        verify(classroomRepository)
                .upsertTrialSlot(
                        eq(CLASS_ID), any(UpsertTrialSessionRequest.class),
                        eq("ONLINE"), eq("https://meet.google.com/abc-defg-hij"), eq(null));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("UPSERT_TRIAL_SLOT"), eq("CLASS"), eq(CLASS_ID), any(), eq(httpRequest));
    }

    @Test
    void upsertTrialSlot_idempotentEvenIfSlotExists() {
        // V16: ca thử là 6 cột trên classes → upsert ghi đè, không còn "đã tồn tại".
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        mockNoTrialConflict();
        when(classroomRepository.findTrialSession(CLASS_ID))
                .thenReturn(Optional.of(TrialSessionResponse.builder()
                        .sessionDate(FUTURE_DATE)
                        .startTime(SLOT_START)
                        .endTime(SLOT_END)
                        .teachingMode("ONLINE")
                        .status("SCHEDULED")
                        .build()));

        TrialSessionResponse result =
                tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest);

        assertEquals(FUTURE_DATE, result.getSessionDate());
        verify(classroomRepository).upsertTrialSlot(eq(CLASS_ID), any(), any(), any(), any());
    }

    @Test
    void upsertTrialSlot_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void upsertTrialSlot_notOwned_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(new ClassState(99L, STUDENT_ID, "TRIAL", "ONLINE", "Lớp", "Học sinh")));

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void upsertTrialSlot_classNotTrial_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest),
                ErrorCode.INVALID_CLASS_STATUS);
    }

    @Test
    void upsertTrialSlot_fixedSlotConflict_shouldThrow409WithDetails() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        ConflictSlotInfo conflict =
                new ConflictSlotInfo(7L, FUTURE_DATE, LocalTime.of(19, 30), LocalTime.of(20, 30),
                        "IELTS 1 kèm 1", "Lê Hoàng Nam", false);
        when(classroomRepository.findSlotConflicts(
                        eq(TUTOR_ID), eq(FUTURE_DATE), eq(FUTURE_DATE),
                        eq(FUTURE_DATE.getDayOfWeek().getValue()), eq(SLOT_START), eq(SLOT_END), eq(CLASS_ID)))
                .thenReturn(List.of(conflict));
        when(classroomRepository.findTrialConflicts(
                        eq(TUTOR_ID), eq(CLASS_ID), eq(FUTURE_DATE), eq(SLOT_START), eq(SLOT_END)))
                .thenReturn(List.of());

        AppException ex = assertThrows(
                AppException.class, () -> tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest));

        assertEquals(ErrorCode.SCHEDULE_CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("IELTS 1 kèm 1"));
        assertTrue(ex.getMessage().contains("Lê Hoàng Nam"));
        verify(classroomRepository, never()).upsertTrialSlot(anyLong(), any(), any(), any(), any());
    }

    @Test
    void upsertTrialSlot_trialConflictOtherClass_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findSlotConflicts(
                        eq(TUTOR_ID), eq(FUTURE_DATE), eq(FUTURE_DATE),
                        eq(FUTURE_DATE.getDayOfWeek().getValue()), eq(SLOT_START), eq(SLOT_END), eq(CLASS_ID)))
                .thenReturn(List.of());
        when(classroomRepository.findTrialConflicts(
                        eq(TUTOR_ID), eq(CLASS_ID), eq(FUTURE_DATE), eq(SLOT_START), eq(SLOT_END)))
                .thenReturn(List.of(
                        new com.mycompany.englishtutor.module.classroom.repository
                                .ClassroomQueryRepository.TrialSlotRow(
                                        FUTURE_DATE, LocalTime.of(19, 30), LocalTime.of(20, 30),
                                        "ONLINE", "https://meet.google.com/other", null)));

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, validRequest(), httpRequest),
                ErrorCode.SCHEDULE_CONFLICT);
    }

    @Test
    void upsertTrialSlot_onlineWithoutMeetingUrl_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setMeetingUrl(null);

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, request, httpRequest),
                ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
    }

    @Test
    void upsertTrialSlot_atHomeWithoutLocation_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setTeachingMode("AT_HOME");

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, request, httpRequest),
                ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
    }

    @Test
    void upsertTrialSlot_endBeforeStart_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setStartTime(LocalTime.of(21, 0));
        request.setEndTime(LocalTime.of(19, 0));

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, request, httpRequest),
                ErrorCode.TRIAL_SESSION_INVALID_TIME);
    }

    @Test
    void upsertTrialSlot_dateInPast_shouldThrow400() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        UpsertTrialSessionRequest request = validRequest();
        request.setSessionDate(LocalDate.now().minusDays(1));

        assertErrorCode(() -> tutorClassService.upsertTrialSlot(CLASS_ID, request, httpRequest),
                ErrorCode.TRIAL_SESSION_DATE_IN_PAST);
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
    }

    @Test
    void finalizeSchedule_classNotActive_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));

        assertErrorCode(
                () -> tutorClassService.finalizeSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.INVALID_CLASS_STATUS);
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
                        any(), any(), eq(null)))
                .thenReturn(List.of(conflict));

        AppException ex = assertThrows(
                AppException.class, () -> tutorClassService.finalizeSchedule(CLASS_ID, request, httpRequest));

        assertEquals(ErrorCode.SCHEDULE_CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("IELTS 1 kèm 1"));
        assertTrue(ex.getMessage().contains("Lê Hoàng Nam"));
        verify(classroomRepository, never()).insertSchedules(anyLong(), any());
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
    void updateSchedule_success_shouldReplaceSchedules() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(2);
        mockNoWeeklyConflict();
        when(classroomRepository.findSchedules(CLASS_ID)).thenReturn(List.of());

        FinalizeScheduleResponse result =
                tutorClassService.updateSchedule(CLASS_ID, validScheduleRequest(), httpRequest);

        assertEquals(CLASS_ID, result.getClassId());
        verify(classroomRepository).deleteSchedules(CLASS_ID);
        verify(classroomRepository).insertSchedules(eq(CLASS_ID), any());
        verify(auditLogService).log(eq(TUTOR_ID), eq("UPDATE_SCHEDULE"), eq("CLASS"), eq(CLASS_ID), any(), any());
    }

    @Test
    void updateSchedule_noSchedulesYet_shouldThrow404() {
        mockOwnedActiveClass();
        when(classroomRepository.countSchedules(CLASS_ID)).thenReturn(0);

        assertErrorCode(
                () -> tutorClassService.updateSchedule(CLASS_ID, validScheduleRequest(), httpRequest),
                ErrorCode.SCHEDULE_NOT_FOUND);
    }

    // --------------------------------------------------- BÀI GIẢNG (lessons, V16)

    private LessonDetailRow lessonRow() {
        return new LessonDetailRow(
                70L, CLASS_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam", "Trần Gia Sư",
                TUTOR_ID, STUDENT_ID, "Bài 1: Past Simple", "PUBLISHED",
                0, 0, OffsetDateTime.now(), OffsetDateTime.now());
    }

    @Test
    void createLesson_success_insertsAndReturnsDetail() {
        mockOwnedActiveClass();
        when(classroomRepository.insertLesson(eq(CLASS_ID), eq("Bài 1: Past Simple"))).thenReturn(70L);
        when(classroomRepository.findLessonDetail(70L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterials(70L)).thenReturn(List.of());

        LessonDetailResponse result =
                tutorClassService.createLesson(
                        CLASS_ID,
                        CreateLessonRequest.builder().title("Bài 1: Past Simple").build(),
                        httpRequest);

        assertEquals(70L, result.getLessonId());
        assertEquals("PUBLISHED", result.getStatus());
        verify(classroomRepository).insertLesson(eq(CLASS_ID), eq("Bài 1: Past Simple"));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("CREATE_LESSON"), eq("LESSON"), eq(70L), any(), eq(httpRequest));
    }

    @Test
    void createLesson_classNotActive_shouldThrow409() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(
                new ClassState(TUTOR_ID, STUDENT_ID, "ON_HOLD", "ONLINE", "Lớp", "Học sinh")));

        assertErrorCode(
                () -> tutorClassService.createLesson(
                        CLASS_ID, CreateLessonRequest.builder().build(), httpRequest),
                ErrorCode.INVALID_CLASS_STATUS);
    }

    @Test
    void updateLesson_success_changesTitleAndStatus() {
        when(classroomRepository.lockLesson(70L)).thenReturn(Optional.of(lessonRow()));

        LessonDetailResponse result =
                tutorClassService.updateLesson(
                        70L,
                        UpdateLessonRequest.builder().title("Bài 1 (sửa)").status("HIDDEN").build(),
                        httpRequest);

        assertEquals(70L, result.getLessonId());
        verify(classroomRepository).updateLessonTitle(70L, "Bài 1 (sửa)");
        verify(classroomRepository).updateLessonStatus(70L, "HIDDEN");
    }

    @Test
    void updateLesson_invalidStatus_shouldThrow400() {
        when(classroomRepository.lockLesson(70L)).thenReturn(Optional.of(lessonRow()));

        assertErrorCode(
                () -> tutorClassService.updateLesson(
                        70L, UpdateLessonRequest.builder().status("ARCHIVED").build(), httpRequest),
                ErrorCode.INVALID_CLASS_STATUS);
    }

    @Test
    void updateLesson_notOwner_shouldThrow403() {
        LessonDetailRow other = new LessonDetailRow(
                70L, CLASS_ID, "Lớp khác", "HS khác", "GS khác",
                99L, 30L, "t", "PUBLISHED", 0, 0, OffsetDateTime.now(), OffsetDateTime.now());
        when(classroomRepository.lockLesson(70L)).thenReturn(Optional.of(other));

        assertErrorCode(
                () -> tutorClassService.updateLesson(
                        70L, UpdateLessonRequest.builder().build(), httpRequest),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void deleteLesson_success_deletesAndAudits() {
        when(classroomRepository.lockLesson(70L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.deleteLesson(CLASS_ID, 70L)).thenReturn(1);

        tutorClassService.deleteLesson(70L, httpRequest);

        verify(classroomRepository).deleteLesson(CLASS_ID, 70L);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("DELETE_LESSON"), eq("LESSON"), eq(70L), any(), eq(httpRequest));
    }

    @Test
    void deleteLesson_missing_shouldThrow404() {
        when(classroomRepository.lockLesson(70L)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.deleteLesson(70L, httpRequest), ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void listLessons_passesThrough() {
        mockOwnedActiveClass();
        when(classroomRepository.findLessonList(CLASS_ID, false))
                .thenReturn(List.of(LessonListItem.builder().lessonId(70L).lessonNumber(1).build()));

        List<LessonListItem> result = tutorClassService.listLessons(CLASS_ID);

        assertEquals(1, result.size());
        assertEquals(70L, result.get(0).getLessonId());
    }

    @Test
    void getLessonDetail_returnsDetail() {
        when(classroomRepository.findLessonDetail(70L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterials(70L)).thenReturn(List.of());

        LessonDetailResponse result = tutorClassService.getLessonDetail(70L);

        assertEquals("IELTS 1 kèm 1", result.getClassName());
        assertEquals("Lê Hoàng Nam", result.getStudentName());
    }

    // --------------------------------------------------------------- READ

    @Test
    void getClassDetail_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void getClassDetail_notOwned_shouldThrow404() {
        // V16: findClassDetail được lọc theo tutor_id -> lớp của người khác = không thấy (404).
        when(classroomRepository.findClassDetail(CLASS_ID, TUTOR_ID)).thenReturn(Optional.empty());

        assertErrorCode(() -> tutorClassService.getClassDetail(CLASS_ID), ErrorCode.CLASS_NOT_FOUND);
    }

    // ------------------------------------------------------------- HELPERS

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }
}
