package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SetSessionStatusRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionLogRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OccurrenceResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionLogResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionStatusResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LockedSessionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.OccurrenceSessionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleSlotRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.SessionDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.SessionExceptionRow;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/** Nghiệp vụ "Lịch dạy" (lattice, exception, buổi học thật) ở tầng service. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ClassOccurrenceServiceTest {

    private static final Long CLASS_ID = 1L;
    private static final Long TUTOR_ID = 10L;
    private static final Long STUDENT_ID = 20L;

    /** T5 của tuần có Monday = 2026-11-02 (2026-11-06). */
    private static final LocalDate WEEK_START = LocalDate.of(2026, 11, 2);
    private static final LocalDate FRI = LocalDate.of(2026, 11, 6);
    private static final LocalDate SAT = LocalDate.of(2026, 11, 7);
    private static final LocalTime SLOT_START = LocalTime.of(19, 30);
    private static final LocalTime SLOT_END = LocalTime.of(21, 0);

    private static final ClassState ACTIVE_STATE =
            new ClassState(TUTOR_ID, STUDENT_ID, "ACTIVE", "ONLINE", "IELTS 1 kèm 1", "Lê Hoàng Nam");

    private static final ScheduleSlotRow SCHEDULE_ROW =
            new ScheduleSlotRow(3L, 5, SLOT_START, SLOT_END, WEEK_START, null);

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
    ClassOccurrenceService classOccurrenceService;

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
        httpRequest = new MockHttpServletRequest(HttpMethod.GET.name(), "/api/v1/classes/1/schedule");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------ helpers mock

    private void mockOwnedClass() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));
    }

    private OccurrenceSessionRow sessionRow(Long id, String status) {
        return new OccurrenceSessionRow(
                id, FRI, SLOT_START, SLOT_END, "Buổi học chính thức", status,
                "ONLINE", "https://meet.google.com/abc", null, false);
    }

    private SessionExceptionRow exceptionRow(String type, LocalDate newDate) {
        return new SessionExceptionRow(
                5L, CLASS_ID, 3L, FRI, type, newDate,
                newDate != null ? LocalTime.of(20, 0) : null,
                newDate != null ? LocalTime.of(21, 30) : null,
                null, null, null, "giáo viên bận", TUTOR_ID, OffsetDateTime.now());
    }

    private LockedSessionRow lockedRow(String status) {
        return new LockedSessionRow(
                42L, CLASS_ID, TUTOR_ID, STUDENT_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam",
                "Buổi học chính thức", FRI, SLOT_START, SLOT_END,
                "ONLINE", "https://meet.google.com/abc", null, status, null, null);
    }

    private SessionDetailRow detailRow(Long sessionId) {
        return new SessionDetailRow(
                sessionId, 3, CLASS_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam", "Trần Gia Sư",
                "Buổi học chính thức", FRI, SLOT_START, SLOT_END, false,
                "ONLINE", "https://meet.google.com/abc", null, "SCHEDULED", null, null);
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }

    // ---------------------------------------------------------------- LATTICE

    @Test
    void listOccurrences_cellWithSession_returnsSessionSourceWithPriority() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(sessionRow(8L, "SCHEDULED")));
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals(WEEK_START, result.getWeekStart());
        OccurrenceResponse fri = result.getOccurrences().stream()
                .filter(o -> FRI.equals(o.getDate())).findFirst().orElseThrow();
        assertEquals("SESSION", fri.getSource());
        assertEquals(8L, fri.getSession().getSessionId());
        assertTrue(fri.getException() == null);
        assertEquals("3_" + FRI, fri.getOccurrenceKey());
        assertEquals(1, result.getOccurrences().size());
    }

    @Test
    void listOccurrences_cellWithBothSessionAndException_returnsSession() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(sessionRow(8L, "SCHEDULED")));
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(exceptionRow("CANCELLED", null)));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals("SESSION", result.getOccurrences().getFirst().getSource());
        assertEquals(8L, result.getOccurrences().getFirst().getSession().getSessionId());
    }

    @Test
    void listOccurrences_cellWithExceptionOnly_returnsExceptionSource() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(exceptionRow("RESCHEDULED", SAT)));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        OccurrenceResponse cell = result.getOccurrences().getFirst();
        assertEquals("EXCEPTION", cell.getSource());
        assertEquals("RESCHEDULED", cell.getException().getType());
        assertEquals(SAT, cell.getException().getNewDate());
        assertEquals(SLOT_START, cell.getStartTime());
    }

    @Test
    void listOccurrences_plainCell_returnsOccurrenceSource() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals("OCCURRENCE", result.getOccurrences().getFirst().getSource());
        assertEquals("3_" + FRI, result.getOccurrences().getFirst().getOccurrenceKey());
    }

    @Test
    void listOccurrences_multiDayCa_rendersEveryWeekdayInValidity() {
        mockOwnedClass();
        // Ca T4 09:00 hiệu lực từ 26/10 (trước tuần xem) -> 1 ô T4 (05/11) trong tuần.
        ScheduleSlotRow t4 = new ScheduleSlotRow(7L, 4, LocalTime.of(9, 0), LocalTime.of(10, 0),
                WEEK_START.minusDays(7), null);
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(t4));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals(1, result.getOccurrences().size());
        assertEquals(LocalDate.of(2026, 11, 5), result.getOccurrences().getFirst().getDate());
    }

    @Test
    void listOccurrences_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void listOccurrences_tutorNotOwner_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(
                        new ClassState(99L, STUDENT_ID, "ACTIVE", "ONLINE", "Lớp khác", "Học sinh khác")));

        assertErrorCode(
                () -> classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START),
                ErrorCode.SESSION_NOT_OWNED);
    }

    @Test
    void listOccurrences_studentOwner_shouldReturn200() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));
        stubStudentContext();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of());
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);
        assertTrue(result.getOccurrences().isEmpty());
    }

    @Test
    void listOccurrences_studentNotOwner_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));
        stubStudentContext();
        // đổi học sinh khác = không sở hữu lớp
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(
                        new ClassState(TUTOR_ID, 99L, "ACTIVE", "ONLINE", "Lớp khác", "Học sinh khác")));

        assertErrorCode(
                () -> classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START),
                ErrorCode.SESSION_NOT_OWNED);
    }

    @Test
    void listOccurrences_receptionist_shouldNotCheckOwnership() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));
        stubReceptionistContext();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekSessions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);
        assertEquals("OCCURRENCE", result.getOccurrences().getFirst().getSource());
    }

    // ---------------------------------------------------------------- EXCEPTION

    private CreateExceptionRequest rescheduledRequest(LocalDate newDate) {
        return CreateExceptionRequest.builder()
                .scheduleId(3L)
                .exceptionDate(FRI)
                .exceptionType("RESCHEDULED")
                .newDate(newDate)
                .newStartTime(LocalTime.of(20, 0))
                .newEndTime(LocalTime.of(21, 30))
                .build();
    }

    @Test
    void createException_cellHasSession_shouldThrow409() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(sessionRow(8L, "SCHEDULED")));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, rescheduledRequest(SAT), httpRequest),
                ErrorCode.OCCURRENCE_HAS_SESSION);
    }

    @Test
    void createException_rescheduled_weeklyConflictOfOtherClass_shouldThrow1126() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(conflictChecker.findWeeklyConflicts(
                        eq(TUTOR_ID), eq(6), eq(LocalTime.of(20, 0)), eq(LocalTime.of(21, 30)),
                        eq(SAT), eq(SAT), eq(CLASS_ID)))
                .thenReturn(List.of(
                        new com.mycompany.englishtutor.module.classroom.repository
                                .ClassroomQueryRepository.WeeklyConflictInfo(
                                        2L, "IELTS cấp tốc", "Nguyễn Văn B", 6,
                                        LocalTime.of(19, 0), LocalTime.of(21, 0), WEEK_START, null)));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, rescheduledRequest(SAT), httpRequest),
                ErrorCode.SCHEDULE_CONFLICT);
    }

    @Test
    void createException_rescheduled_perDateConflict_shouldThrow1126() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(conflictChecker.findWeeklyConflicts(
                        eq(TUTOR_ID), anyInt(), any(), any(), eq(SAT), eq(SAT), eq(CLASS_ID)))
                .thenReturn(List.of());
        when(conflictChecker.findConflicts(eq(TUTOR_ID), eq(SAT), any(), any(), eq(null)))
                .thenReturn(List.of(new ConflictInfo(
                        9L, SAT, LocalTime.of(20, 0), LocalTime.of(22, 0),
                        "IELTS cấp tốc", "Nguyễn Văn B", false)));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, rescheduledRequest(SAT), httpRequest),
                ErrorCode.SCHEDULE_CONFLICT);
    }

    @Test
    void createException_rescheduled_inPast_shouldThrow1151() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.createException(
                        CLASS_ID, rescheduledRequest(LocalDate.now().minusDays(1)), httpRequest),
                ErrorCode.EXCEPTION_RESCHEDULE_IN_PAST);
    }

    @Test
    void createException_rescheduled_badTime_shouldThrow1136() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        CreateExceptionRequest request = rescheduledRequest(SAT);
        request.setNewEndTime(LocalTime.of(19, 0));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.SCHEDULE_INVALID_TIME);
    }

    @Test
    void createException_cancelled_shouldUpsertWithoutConflictCheckAndAudit() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(classroomRepository.upsertSessionException(
                        eq(CLASS_ID), eq(3L), eq(FRI), eq("CANCELLED"),
                        isNull(), isNull(), isNull(), isNull(), isNull(), isNull(),
                        eq("giáo viên bận"), eq(TUTOR_ID)))
                .thenReturn(5L);
        // Lần 1 (isUpdate check) = empty, lần 2 (đọc lại response) = row vừa ghi.
        when(classroomRepository.findSessionException(3L, FRI))
                .thenReturn(Optional.empty(), Optional.of(exceptionRow("CANCELLED", null)));

        CreateExceptionRequest request = CreateExceptionRequest.builder()
                .scheduleId(3L)
                .exceptionDate(FRI)
                .exceptionType("CANCELLED")
                .reason("giáo viên bận")
                .build();
        SessionExceptionResponse result =
                classOccurrenceService.createException(CLASS_ID, request, httpRequest);

        assertEquals("CANCELLED", result.getExceptionType());
        verify(conflictChecker, never())
                .findWeeklyConflicts(anyLong(), anyInt(), any(), any(), any(), any(), any());
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("CREATE_OCCURRENCE_EXCEPTION"), eq("SESSION_EXCEPTION"),
                        eq(5L), any(), eq(httpRequest));
        // Exception không bao giờ gửi notification (mục 1 dòng 3).
        verify(jdbcTemplate, never()).update(any(String.class), any(Object[].class));
    }

    @Test
    void createException_dateOutOfValidity_shouldThrow1154() {
        mockOwnedClass();
        // Ca hiệu lực 02/11–31/10 không hợp lệ tự mâu thuẫn; chọn ca validTo 04/11,
        // exceptionDate 06/11 (ngoài khoảng) -> 1154.
        ScheduleSlotRow limited =
                new ScheduleSlotRow(3L, 5, SLOT_START, SLOT_END, WEEK_START,
                        LocalDate.of(2026, 11, 4));
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(limited));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, rescheduledRequest(SAT), httpRequest),
                ErrorCode.EXCEPTION_DATE_OUT_OF_RANGE);
    }

    @Test
    void createException_scheduleNotInClass_shouldThrow1153() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 99L)).thenReturn(Optional.empty());
        CreateExceptionRequest request = rescheduledRequest(SAT);
        request.setScheduleId(99L);

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.OCCURRENCE_SCHEDULE_NOT_FOUND);
    }

    @Test
    void createException_invalidType_shouldThrow1155() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        CreateExceptionRequest request = rescheduledRequest(SAT);
        request.setExceptionType("PAUSED");

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.EXCEPTION_TYPE_INVALID);
    }

    @Test
    void createException_modified_missingMeetingUrl_shouldThrow1129() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.findOccurrenceSession(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        CreateExceptionRequest request =
                CreateExceptionRequest.builder()
                        .scheduleId(3L)
                        .exceptionDate(FRI)
                        .exceptionType("MODIFIED")
                        .newTeachingMode("ONLINE")
                        .build();

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
    }

    @Test
    void deleteException_existing_shouldDeleteAndAudit() {
        mockOwnedClass();
        when(classroomRepository.findSessionException(3L, FRI))
                .thenReturn(Optional.of(exceptionRow("CANCELLED", null)));

        classOccurrenceService.deleteException(CLASS_ID, 3L, FRI, httpRequest);

        verify(classroomRepository).deleteSessionException(3L, FRI);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("REMOVE_OCCURRENCE_EXCEPTION"), eq("SESSION_EXCEPTION"),
                        eq(3L), any(), eq(httpRequest));
    }

    @Test
    void deleteException_missing_shouldThrow1152() {
        mockOwnedClass();
        when(classroomRepository.findSessionException(3L, FRI)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.deleteException(CLASS_ID, 3L, FRI, httpRequest),
                ErrorCode.EXCEPTION_NOT_FOUND);
    }

    // ------------------------------------------------------------- SESSION LIST

    @Test
    void listSessions_passesFiltersAndOrder() {
        mockOwnedClass();
        when(classroomRepository.findSessionList(CLASS_ID, "SCHEDULED", false)).thenReturn(List.of());

        classOccurrenceService.listSessions(CLASS_ID, "scheduled", "asc");

        verify(classroomRepository).findSessionList(CLASS_ID, "SCHEDULED", false);
    }

    @Test
    void listSessions_invalidStatus_shouldThrow400() {
        mockOwnedClass();

        assertErrorCode(
                () -> classOccurrenceService.listSessions(CLASS_ID, "PAUSED", null),
                ErrorCode.INVALID_CLASS_STATUS);
    }

    // ------------------------------------------------------------------ DETAIL

    @Test
    void getDetail_returnsRowWithLogVisibleToAll() {
        when(classroomRepository.findSessionDetail(42L)).thenReturn(Optional.of(detailRow(42L)));
        mockOwnedClass();

        SessionDetailResponse result = classOccurrenceService.getDetail(42L);

        assertEquals("IELTS 1 kèm 1", result.getClassName());
        assertEquals("Lê Hoàng Nam", result.getStudentName());
        assertEquals("Trần Gia Sư", result.getTutorName());
        assertFalse(result.getHasLog());
    }

    @Test
    void getDetail_withLog_shouldExposeContent() {
        SessionDetailRow withLog = new SessionDetailRow(
                42L, 3, CLASS_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam", "Trần Gia Sư",
                "Buổi học chính thức", FRI, SLOT_START, SLOT_END, false,
                "ONLINE", "https://meet.google.com/abc", null, "COMPLETED",
                "Trọng音 phát âm", "Đọc trang 12");
        when(classroomRepository.findSessionDetail(42L)).thenReturn(Optional.of(withLog));
        mockOwnedClass();

        SessionDetailResponse result = classOccurrenceService.getDetail(42L);

        assertEquals("Trọng音 phát âm", result.getLogKnowledge());
        assertTrue(result.getHasLog());
    }

    @Test
    void getDetail_missing_shouldThrow404() {
        when(classroomRepository.findSessionDetail(42L)).thenReturn(Optional.empty());

        assertErrorCode(() -> classOccurrenceService.getDetail(42L), ErrorCode.SESSION_NOT_FOUND);
    }

    // -------------------------------------------------------------- UPDATE (PUT)

    private UpdateSessionRequest moveRequest(LocalDate date) {
        return UpdateSessionRequest.builder()
                .sessionDate(date)
                .startTime(LocalTime.of(20, 0))
                .endTime(LocalTime.of(21, 30))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/xyz")
                .build();
    }

    @Test
    void updateSession_success_movedShouldNotify() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));
        when(classroomRepository.countDuplicateSlotInClass(CLASS_ID, SAT, LocalTime.of(20, 0), 42L))
                .thenReturn(0);
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), eq(SAT), eq(LocalTime.of(20, 0)), eq(LocalTime.of(21, 30)), eq(42L)))
                .thenReturn(List.of());
        when(classroomRepository.findSessionDetail(42L)).thenReturn(Optional.of(detailRow(42L)));

        SessionDetailResponse result =
                classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest);

        assertEquals("SCHEDULED", result.getStatus());
        verify(jdbcTemplate)
                .update(
                        eq("""
                                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                                VALUES (?, ?, ?, 'CLASS', ?)
                                """),
                        eq(STUDENT_ID), any(String.class),
                        argThat((String c) -> c.contains("07/11/2026")), eq(CLASS_ID));
    }

    @Test
    void updateSession_duplicateSlotInClass_shouldThrow1148() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));
        when(classroomRepository.countDuplicateSlotInClass(CLASS_ID, SAT, LocalTime.of(20, 0), 42L))
                .thenReturn(1);

        assertErrorCode(
                () -> classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest),
                ErrorCode.SESSION_DUPLICATE_SLOT);
    }

    @Test
    void updateSession_conflictOtherClass_shouldThrow1126() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));
        when(classroomRepository.countDuplicateSlotInClass(CLASS_ID, SAT, LocalTime.of(20, 0), 42L))
                .thenReturn(0);
        when(conflictChecker.findConflicts(
                        eq(TUTOR_ID), eq(SAT), eq(LocalTime.of(20, 0)), eq(LocalTime.of(21, 30)), eq(42L)))
                .thenReturn(List.of(new ConflictInfo(
                        9L, SAT, LocalTime.of(19, 30), LocalTime.of(21, 0),
                        "IELTS cấp tốc", "Nguyễn Văn B", false)));

        AppException ex = assertThrows(
                AppException.class,
                () -> classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest));
        assertEquals(ErrorCode.SCHEDULE_CONFLICT, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("IELTS cấp tốc"));
    }

    @Test
    void updateSession_pastDate_shouldThrow1146() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));

        assertErrorCode(
                () -> classOccurrenceService.updateSession(
                        42L, moveRequest(LocalDate.now().minusDays(1)), httpRequest),
                ErrorCode.SESSION_RESCHEDULE_IN_PAST);
    }

    @Test
    void updateSession_invalidTime_shouldThrow1147() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));
        UpdateSessionRequest request = moveRequest(SAT);
        request.setEndTime(LocalTime.of(19, 0));

        assertErrorCode(
                () -> classOccurrenceService.updateSession(42L, request, httpRequest),
                ErrorCode.SESSION_INVALID_TIME);
    }

    @Test
    void updateSession_notScheduled_shouldThrow1144() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("IN_PROGRESS")));

        assertErrorCode(
                () -> classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest),
                ErrorCode.SESSION_NOT_EDITABLE);
    }

    @Test
    void updateSession_missing_shouldThrow404() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest),
                ErrorCode.SESSION_NOT_FOUND);
    }

    @Test
    void updateSession_tutorNotOwner_shouldThrow403() {
        LockedSessionRow other = new LockedSessionRow(
                42L, 2L, 99L, 30L, "Lớp khác", "HS khác", "t", FRI,
                SLOT_START, SLOT_END, "ONLINE", "u", null, "SCHEDULED", null, null);
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(other));

        assertErrorCode(
                () -> classOccurrenceService.updateSession(42L, moveRequest(SAT), httpRequest),
                ErrorCode.SESSION_NOT_OWNED);
    }

    // ----------------------------------------------------------------- STATUS

    @Test
    void changeStatus_validTransitions_shouldUpdateAndAudit() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));
        SessionStatusResponse result =
                classOccurrenceService.changeStatus(
                        42L, SetSessionStatusRequest.builder().status("IN_PROGRESS").build(), httpRequest);
        assertEquals("IN_PROGRESS", result.getStatus());

        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("IN_PROGRESS")));
        classOccurrenceService.changeStatus(
                42L, SetSessionStatusRequest.builder().status("COMPLETED").build(), httpRequest);

        verify(classroomRepository).updateSessionStatus(42L, "IN_PROGRESS");
        verify(classroomRepository).updateSessionStatus(42L, "COMPLETED");
        verify(auditLogService, org.mockito.Mockito.times(2))
                .log(eq(TUTOR_ID), eq("SESSION_STATUS_CHANGED"), eq("SESSION"),
                        eq(42L), any(), eq(httpRequest));
    }

    @Test
    void changeStatus_cancelledDestination_shouldNotify() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));

        classOccurrenceService.changeStatus(
                42L, SetSessionStatusRequest.builder().status("CANCELLED").build(), httpRequest);

        verify(jdbcTemplate)
                .update(
                        eq("""
                                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                                VALUES (?, ?, ?, 'CLASS', ?)
                                """),
                        eq(STUDENT_ID), eq("Buổi học đã bị hủy"), any(String.class), eq(CLASS_ID));
    }

    @Test
    void changeStatus_cancelledDestination_notifiedOnlyForCancelled() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("IN_PROGRESS")));

        classOccurrenceService.changeStatus(
                42L, SetSessionStatusRequest.builder().status("COMPLETED").build(), httpRequest);

        verify(jdbcTemplate, never())
                .update(
                        eq("""
                                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                                VALUES (?, ?, ?, 'CLASS', ?)
                                """),
                        any(), any(), any(), any());
    }

    @Test
    void changeStatus_terminalState_shouldThrow1145() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("COMPLETED")));

        assertErrorCode(
                () -> classOccurrenceService.changeStatus(
                        42L,
                        SetSessionStatusRequest.builder().status("IN_PROGRESS").build(),
                        httpRequest),
                ErrorCode.SESSION_INVALID_TRANSITION);
    }

    @Test
    void changeStatus_backToScheduled_shouldThrow1145() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("CANCELLED")));

        assertErrorCode(
                () -> classOccurrenceService.changeStatus(
                        42L,
                        SetSessionStatusRequest.builder().status("SCHEDULED").build(),
                        httpRequest),
                ErrorCode.SESSION_INVALID_TRANSITION);
    }

    @Test
    void changeStatus_scheduledToCompleted_shouldThrow1145() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("SCHEDULED")));

        assertErrorCode(
                () -> classOccurrenceService.changeStatus(
                        42L,
                        SetSessionStatusRequest.builder().status("COMPLETED").build(),
                        httpRequest),
                ErrorCode.SESSION_INVALID_TRANSITION);
    }

    // -------------------------------------------------------------------- LOG

    @Test
    void saveLog_firstPublish_shouldNotifyOnce() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("COMPLETED")));
        when(classroomRepository.findSessionDetail(42L)).thenReturn(Optional.of(detailRow(42L)));

        SessionLogResponse result =
                classOccurrenceService.saveLog(
                        42L,
                        UpdateSessionLogRequest.builder()
                                .logKnowledge("Nội dung kiến thức")
                                .logHomework("Bài tập trang 12")
                                .build(),
                        httpRequest);

        assertTrue(result.getFirstPublish());
        verify(jdbcTemplate)
                .update(
                        eq("""
                                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                                VALUES (?, ?, ?, 'CLASS', ?)
                                """),
                        eq(STUDENT_ID), eq("Gia sư đã ghi nhật ký"), any(String.class), eq(CLASS_ID));
    }

    @Test
    void saveLog_secondPublish_shouldNotNotify() {
        LockedSessionRow withLog = new LockedSessionRow(
                42L, CLASS_ID, TUTOR_ID, STUDENT_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam",
                "Buổi học chính thức", FRI, SLOT_START, SLOT_END, "ONLINE",
                "https://meet.google.com/abc", null, "COMPLETED", "log cũ", "bt cũ");
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(withLog));

        SessionLogResponse result =
                classOccurrenceService.saveLog(
                        42L,
                        UpdateSessionLogRequest.builder().logKnowledge("log mới").build(),
                        httpRequest);

        assertFalse(result.getFirstPublish());
        verify(jdbcTemplate, never())
                .update(any(String.class), eq(STUDENT_ID), any(), any(), eq(CLASS_ID));
    }

    @Test
    void saveLog_clearedThenSaveAgain_shouldNotifyAgain() {
        // Edge case chấp nhận (mục 1 dòng 7): xóa trắng rồi lưu lại -> báo thêm.
        LockedSessionRow cleared = new LockedSessionRow(
                42L, CLASS_ID, TUTOR_ID, STUDENT_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam",
                "Buổi học chính thức", FRI, SLOT_START, SLOT_END, "ONLINE",
                "https://meet.google.com/abc", null, "COMPLETED", null, null);
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(cleared));

        SessionLogResponse result =
                classOccurrenceService.saveLog(
                        42L,
                        UpdateSessionLogRequest.builder().logHomework("bài mới").build(),
                        httpRequest);

        assertTrue(result.getFirstPublish());
    }

    @Test
    void saveLog_bothEmpty_shouldThrow1149() {
        when(classroomRepository.lockSession(42L)).thenReturn(Optional.of(lockedRow("COMPLETED")));

        assertErrorCode(
                () -> classOccurrenceService.saveLog(
                        42L,
                        UpdateSessionLogRequest.builder().logKnowledge("  ").build(),
                        httpRequest),
                ErrorCode.SESSION_LOG_EMPTY);
    }

    // -------------------------------------------------------------- MATERIALIZE

    @Test
    void materializeOccurrenceException_cellHasException_shouldDeleteAndAudit() {
        when(classroomRepository.findExceptionForOccurrence(
                        CLASS_ID, FRI, 5, SLOT_START))
                .thenReturn(Optional.of(exceptionRow("CANCELLED", null)));

        boolean materialized =
                classOccurrenceService.materializeOccurrenceException(
                        CLASS_ID, FRI, 5, SLOT_START, TUTOR_ID, httpRequest);

        assertTrue(materialized);
        verify(classroomRepository).deleteSessionException(3L, FRI);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("MATERIALIZE_OCCURRENCE"), eq("SESSION_EXCEPTION"),
                        eq(3L), any(), eq(httpRequest));
    }

    @Test
    void materializeOccurrenceException_noException_shouldBeNoop() {
        when(classroomRepository.findExceptionForOccurrence(
                        CLASS_ID, FRI, 5, SLOT_START))
                .thenReturn(Optional.empty());

        boolean materialized =
                classOccurrenceService.materializeOccurrenceException(
                        CLASS_ID, FRI, 5, SLOT_START, TUTOR_ID, httpRequest);

        assertFalse(materialized);
        verify(classroomRepository, never()).deleteSessionException(anyLong(), any());
    }

    // ------------------------------------------------------------- AUTH STUBS

    private void stubStudentContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("student1", "x", List.of()));
        when(userRepository.findByUsername("student1"))
                .thenReturn(Optional.of(User.builder()
                        .id(STUDENT_ID)
                        .username("student1")
                        .fullName("Lê Hoàng Nam")
                        .role(UserRole.STUDENT.name())
                        .build()));
    }

    private void stubReceptionistContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("lt_01", "x", List.of()));
        when(userRepository.findByUsername("lt_01"))
                .thenReturn(Optional.of(User.builder()
                        .id(50L)
                        .username("lt_01")
                        .fullName("Lễ Tân Một")
                        .role(UserRole.RECEPTIONIST.name())
                        .build()));
    }

}
