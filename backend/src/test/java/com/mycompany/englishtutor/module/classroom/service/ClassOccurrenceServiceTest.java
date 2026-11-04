package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonMaterialItem;
import com.mycompany.englishtutor.module.classroom.api.response.MaterialAccessUrlResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OccurrenceResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LogUpsertResult;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonMaterialRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleExceptionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleSlotRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.TeachingLogRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.TrialSlotRow;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Nghiệp vụ "Lịch dạy" V16: lattice tuần (ca cố định + ngoại lệ + nhật ký +
 * ca thử), dạy thử trên classes, nhật ký dạy học (teaching_logs) và tài
 * liệu bài giảng (lesson_materials).
 */
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
    com.mycompany.englishtutor.module.tutor.service.StorageService storageService;

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

    private void mockOwnedLatticeReads() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(SCHEDULE_ROW));
        when(classroomRepository.findWeekTeachingLogs(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findTrialSlot(CLASS_ID)).thenReturn(Optional.empty());
    }

    private static TeachingLogRow logRow(Long id, LocalDate date, LocalTime start, LocalTime end,
            String knowledge, String homework) {
        return new TeachingLogRow(
                id, date, start, end, knowledge, homework, false,
                OffsetDateTime.now(), OffsetDateTime.now());
    }

    private ScheduleExceptionRow exceptionRow(String type, LocalDate newDate) {
        return new ScheduleExceptionRow(
                5L, CLASS_ID, 3L, FRI, type, newDate,
                newDate != null ? LocalTime.of(20, 0) : null,
                newDate != null ? LocalTime.of(21, 30) : null,
                "giáo viên bận", TUTOR_ID, OffsetDateTime.now());
    }

    private TrialSlotRow trialSlot() {
        return new TrialSlotRow(
                SAT, LocalTime.of(14, 0), LocalTime.of(15, 0),
                "ONLINE", "https://meet.google.com/abc", null);
    }

    private LessonDetailRow lessonRow() {
        return new LessonDetailRow(
                42L, CLASS_ID, "IELTS 1 kèm 1", "Lê Hoàng Nam", "Trần Gia Sư",
                TUTOR_ID, STUDENT_ID, "Bài giảng 1", "PUBLISHED", 1, 0,
                OffsetDateTime.now(), OffsetDateTime.now());
    }

    private LessonMaterialRow materialRow(Long materialId) {
        return new LessonMaterialRow(
                materialId, 42L, CLASS_ID, TUTOR_ID, STUDENT_ID,
                "bai-hoc.pdf", "https://minio.local/englishpath/x/1.pdf", "PDF",
                1_000L, "Trần Gia Sư", OffsetDateTime.now());
    }

    private static void assertErrorCode(Runnable action, ErrorCode expected) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }

    // ---------------------------------------------------------------- LATTICE

    @Test
    void listOccurrences_cellWithLog_overlayLogOnOccurrenceCell() {
        mockOwnedLatticeReads();
        when(classroomRepository.findWeekTeachingLogs(CLASS_ID, WEEK_START))
                .thenReturn(List.of(logRow(8L, FRI, SLOT_START, SLOT_END, "Past Simple", "Bài 12")));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals(WEEK_START, result.getWeekStart());
        OccurrenceResponse fri = result.getOccurrences().stream()
                .filter(o -> FRI.equals(o.getDate())).findFirst().orElseThrow();
        assertEquals("OCCURRENCE", fri.getSource());
        assertEquals(8L, fri.getLog().getLogId());
        assertTrue(fri.getLog().getHasContent());
        assertEquals("3_" + FRI, fri.getOccurrenceKey());
        assertEquals(1, result.getOccurrences().size());
    }

    @Test
    void listOccurrences_cellWithBothLogAndException_keepsExceptionSource() {
        mockOwnedLatticeReads();
        when(classroomRepository.findWeekTeachingLogs(CLASS_ID, WEEK_START))
                .thenReturn(List.of(logRow(8L, FRI, SLOT_START, SLOT_END, "k", "b")));
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(exceptionRow("CANCELLED", null)));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals("EXCEPTION", result.getOccurrences().getFirst().getSource());
        assertEquals(8L, result.getOccurrences().getFirst().getLog().getLogId());
    }

    @Test
    void listOccurrences_cellWithExceptionOnly_returnsExceptionSource() {
        mockOwnedLatticeReads();
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START))
                .thenReturn(List.of(exceptionRow("RESCHEDULED", SAT)));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        OccurrenceResponse cell = result.getOccurrences().getFirst();
        assertEquals("EXCEPTION", cell.getSource());
        assertEquals("RESCHEDULED", cell.getException().getType());
        assertEquals(SAT, cell.getException().getNewDate());
        assertEquals(SLOT_START, cell.getStartTime());
        assertNull(cell.getLog());
    }

    @Test
    void listOccurrences_plainCell_returnsOccurrenceSource() {
        mockOwnedLatticeReads();

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals("OCCURRENCE", result.getOccurrences().getFirst().getSource());
        assertEquals("3_" + FRI, result.getOccurrences().getFirst().getOccurrenceKey());
    }

    @Test
    void listOccurrences_trialSlotWithoutMatchingCa_addsStandaloneTrialCell() {
        mockOwnedLatticeReads();
        // Ca T5 19:30 + ca thử T7 14:00 (không trùng thứ + giờ của ca) -> ô độc lập.
        when(classroomRepository.findTrialSlot(CLASS_ID)).thenReturn(Optional.of(trialSlot()));
        when(classroomRepository.isTrialCoveredBySlot(CLASS_ID, SAT, LocalTime.of(14, 0)))
                .thenReturn(false);

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals(2, result.getOccurrences().size());
        OccurrenceResponse trial = result.getOccurrences().stream()
                .filter(o -> "TRIAL".equals(o.getSource()))
                .findFirst()
                .orElseThrow();
        assertEquals(SAT, trial.getDate());
        // 2026-11-07 = thứ 7 (ISO value 6).
        assertEquals(6, trial.getDayOfWeek());
        assertEquals("trial_" + SAT + "_" + LocalTime.of(14, 0), trial.getOccurrenceKey());
        assertNull(trial.getScheduleId());
        assertTrue(trial.getTrial());
        assertEquals("ONLINE", trial.getTeachingMode());
        assertEquals("https://meet.google.com/abc", trial.getMeetingUrl());
    }

    @Test
    void listOccurrences_trialSlotCoveredByCa_isHidden() {
        mockOwnedLatticeReads();
        // Ca T7 14:00 (ISO 6) cùng giờ ca thử -> ca thử bị che, không hiện ô độc lập.
        ScheduleSlotRow sat = new ScheduleSlotRow(8L, 6, LocalTime.of(14, 0), LocalTime.of(15, 0),
                WEEK_START, null);
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(sat));
        when(classroomRepository.findTrialSlot(CLASS_ID)).thenReturn(Optional.of(trialSlot()));
        when(classroomRepository.isTrialCoveredBySlot(CLASS_ID, SAT, LocalTime.of(14, 0)))
                .thenReturn(true);

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        assertEquals(List.of("OCCURRENCE"),
                result.getOccurrences().stream().map(OccurrenceResponse::getSource).toList());
    }

    @Test
    void listOccurrences_trialSlotLogOverlay_showsLogOnTrialCell() {
        mockOwnedLatticeReads();
        when(classroomRepository.findTrialSlot(CLASS_ID)).thenReturn(Optional.of(trialSlot()));
        when(classroomRepository.isTrialCoveredBySlot(CLASS_ID, SAT, LocalTime.of(14, 0)))
                .thenReturn(false);
        when(classroomRepository.findWeekTeachingLogs(CLASS_ID, WEEK_START))
                .thenReturn(List.of(logRow(9L, SAT, LocalTime.of(14, 0), LocalTime.of(15, 0), "k", "b")));

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);

        OccurrenceResponse trial = result.getOccurrences().stream()
                .filter(o -> "TRIAL".equals(o.getSource()))
                .findFirst()
                .orElseThrow();
        assertEquals(9L, trial.getLog().getLogId());
    }

    @Test
    void listOccurrences_multiDayCa_rendersEveryWeekdayInValidity() {
        mockOwnedClass();
        // Ca T4 09:00 hiệu lực từ 26/10 (trước tuần xem) -> 1 ô T4 (05/11) trong tuần.
        ScheduleSlotRow t4 = new ScheduleSlotRow(7L, 4, LocalTime.of(9, 0), LocalTime.of(10, 0),
                WEEK_START.minusDays(7), null);
        when(classroomRepository.findScheduleSlotsWithIds(CLASS_ID)).thenReturn(List.of(t4));
        when(classroomRepository.findWeekTeachingLogs(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findWeekExceptions(CLASS_ID, WEEK_START)).thenReturn(List.of());
        when(classroomRepository.findTrialSlot(CLASS_ID)).thenReturn(Optional.empty());

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
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void listOccurrences_studentOwner_shouldReturn200() {
        mockOwnedLatticeReads();
        stubStudentContext();

        ClassScheduleResponse result = classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START);
        assertTrue(result.getOccurrences().stream().anyMatch(o -> FRI.equals(o.getDate())));
    }

    @Test
    void listOccurrences_studentNotOwner_shouldThrow403() {
        when(classroomRepository.findClassState(CLASS_ID))
                .thenReturn(Optional.of(
                        new ClassState(TUTOR_ID, 99L, "ACTIVE", "ONLINE", "Lớp khác", "Học sinh khác")));
        stubStudentContext();

        assertErrorCode(
                () -> classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void listOccurrences_receptionistNotOwner_shouldThrow403() {
        mockOwnedLatticeReads();
        stubReceptionistContext();

        assertErrorCode(
                () -> classOccurrenceService.listOccurrences(CLASS_ID, WEEK_START),
                ErrorCode.CLASS_NOT_OWNED);
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
    void createException_cellHasTeachingLog_shouldThrow409() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        // V16 R-LOG: ô đã có log -> chặn CANCELLED/RESCHEDULED.
        when(classroomRepository.countTeachingLogAt(CLASS_ID, FRI, SLOT_START)).thenReturn(1);

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, rescheduledRequest(SAT), httpRequest),
                ErrorCode.OCCURRENCE_HAS_SESSION);
    }

    @Test
    void createException_rescheduled_inPast_shouldThrow1151() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.countTeachingLogAt(CLASS_ID, FRI, SLOT_START)).thenReturn(0);

        assertErrorCode(
                () -> classOccurrenceService.createException(
                        CLASS_ID, rescheduledRequest(LocalDate.now().minusDays(1)), httpRequest),
                ErrorCode.EXCEPTION_RESCHEDULE_IN_PAST);
    }

    @Test
    void createException_rescheduled_badTime_shouldThrow1155() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.countTeachingLogAt(CLASS_ID, FRI, SLOT_START)).thenReturn(0);
        CreateExceptionRequest request = rescheduledRequest(SAT);
        request.setNewEndTime(LocalTime.of(19, 0));

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.EXCEPTION_TYPE_INVALID);
    }

    @Test
    void createException_cancelled_noLog_shouldUpsertAndAudit() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        when(classroomRepository.countTeachingLogAt(CLASS_ID, FRI, SLOT_START)).thenReturn(0);
        when(classroomRepository.upsertScheduleException(
                        eq(CLASS_ID), eq(3L), eq(FRI), eq("CANCELLED"),
                        isNull(), isNull(), isNull(),
                        eq("giáo viên bận"), eq(TUTOR_ID)))
                .thenReturn(5L);
        // Lần 1 (check ghi đè) = empty, lần 2 (đọc lại response) = row vừa ghi.
        when(classroomRepository.findScheduleException(3L, FRI))
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
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("CREATE_EXCEPTION"), eq("SCHEDULE_EXCEPTION"),
                        eq(5L), any(), eq(httpRequest));
    }

    @Test
    void createException_modifiedType_shouldBeRejected1155() {
        mockOwnedClass();
        when(classroomRepository.findScheduleSlot(CLASS_ID, 3L)).thenReturn(Optional.of(SCHEDULE_ROW));
        CreateExceptionRequest request =
                CreateExceptionRequest.builder()
                        .scheduleId(3L)
                        .exceptionDate(FRI)
                        .exceptionType("MODIFIED")
                        .build();

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.EXCEPTION_TYPE_INVALID);
    }

    @Test
    void createException_dateOutOfValidity_shouldThrow1154() {
        mockOwnedClass();
        // Ca validTo 04/11, exceptionDate 06/11 (ngoài khoảng) -> 1154.
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
        CreateExceptionRequest request = rescheduledRequest(SAT);
        request.setExceptionType("PAUSED");

        assertErrorCode(
                () -> classOccurrenceService.createException(CLASS_ID, request, httpRequest),
                ErrorCode.EXCEPTION_TYPE_INVALID);
    }

    @Test
    void deleteException_existing_shouldDeleteAndAudit() {
        mockOwnedClass();
        when(classroomRepository.deleteScheduleException(3L, FRI)).thenReturn(1);

        classOccurrenceService.deleteException(CLASS_ID, 3L, FRI, httpRequest);

        verify(classroomRepository).deleteScheduleException(3L, FRI);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("DELETE_EXCEPTION"), eq("SCHEDULE_EXCEPTION"),
                        eq(3L), any(), eq(httpRequest));
    }

    @Test
    void deleteException_missing_shouldThrow1152() {
        mockOwnedClass();
        when(classroomRepository.deleteScheduleException(3L, FRI)).thenReturn(0);

        assertErrorCode(
                () -> classOccurrenceService.deleteException(CLASS_ID, 3L, FRI, httpRequest),
                ErrorCode.EXCEPTION_NOT_FOUND);
    }

    // ------------------------------------------------------------- TEACHING LOG

    private SaveTeachingLogRequest logRequest(String knowledge, String homework) {
        return SaveTeachingLogRequest.builder()
                .logDate(FRI)
                .startTime(SLOT_START)
                .endTime(SLOT_END)
                .knowledge(knowledge)
                .homework(homework)
                .build();
    }

    @Test
    void saveLog_firstPublish_shouldUpsertNotifyAndAuditCreate() {
        mockOwnedClass();
        when(classroomRepository.findScheduleExceptionAt(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(classroomRepository.upsertTeachingLog(
                        eq(CLASS_ID), eq(FRI), eq(SLOT_START), eq(SLOT_END),
                        eq("Nội dung kiến thức"), eq("Bài tập trang 12")))
                .thenReturn(new LogUpsertResult(7L, true));
        when(classroomRepository.findTeachingLog(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(
                        logRow(7L, FRI, SLOT_START, SLOT_END, "Nội dung kiến thức", "Bài tập trang 12")));

        TeachingLogResponse result =
                classOccurrenceService.saveLog(
                        CLASS_ID, logRequest("Nội dung kiến thức", "Bài tập trang 12"), httpRequest);

        assertTrue(result.getFirstPublish());
        assertEquals("Nội dung kiến thức", result.getKnowledge());
        verify(classroomRepository)
                .insertLogFirstPublishNotification(eq(STUDENT_ID), eq("IELTS 1 kèm 1"), eq(FRI), eq(CLASS_ID));
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("CREATE_LOG"), eq("TEACHING_LOG"), eq(7L), any(), eq(httpRequest));
    }

    @Test
    void saveLog_secondPublish_shouldNotNotify() {
        mockOwnedClass();
        when(classroomRepository.findScheduleExceptionAt(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(classroomRepository.upsertTeachingLog(
                        eq(CLASS_ID), eq(FRI), eq(SLOT_START), eq(SLOT_END),
                        eq("log mới"), isNull()))
                .thenReturn(new LogUpsertResult(7L, false));
        when(classroomRepository.findTeachingLog(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(logRow(7L, FRI, SLOT_START, SLOT_END, "log mới", null)));

        TeachingLogResponse result =
                classOccurrenceService.saveLog(CLASS_ID, logRequest("log mới", null), httpRequest);

        assertFalse(result.getFirstPublish());
        verify(classroomRepository, never())
                .insertLogFirstPublishNotification(anyLong(), any(), any(), anyLong());
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("UPDATE_LOG"), eq("TEACHING_LOG"), eq(7L), any(), eq(httpRequest));
    }

    @Test
    void saveLog_upsertIdempotent_sameSlotUpdatesNoNewRow() {
        // V16 C-15': cùng (class, log_date, start_time) -> upsert, 1 dòng duy nhất.
        mockOwnedClass();
        when(classroomRepository.findScheduleExceptionAt(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());
        when(classroomRepository.upsertTeachingLog(any(), any(), any(), any(), any(), any()))
                .thenReturn(new LogUpsertResult(7L, false));
        when(classroomRepository.findTeachingLog(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(logRow(7L, FRI, SLOT_START, SLOT_END, "k", "b")));

        classOccurrenceService.saveLog(CLASS_ID, logRequest("k", "b"), httpRequest);
        classOccurrenceService.saveLog(CLASS_ID, logRequest("k2", "b2"), httpRequest);

        verify(classroomRepository, org.mockito.Mockito.times(2))
                .upsertTeachingLog(eq(CLASS_ID), eq(FRI), eq(SLOT_START), eq(SLOT_END), any(), any());
    }

    @Test
    void saveLog_slotCancelledException_shouldBlock() {
        mockOwnedClass();
        // V16 R-LOG: ô đang bị hủy/dời -> không ghi log tại ca gốc.
        when(classroomRepository.findScheduleExceptionAt(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(exceptionRow("CANCELLED", null)));

        assertErrorCode(
                () -> classOccurrenceService.saveLog(
                        CLASS_ID, logRequest("k", "b"), httpRequest),
                ErrorCode.OCCURRENCE_HAS_SESSION);
        verify(classroomRepository, never()).upsertTeachingLog(any(), any(), any(), any(), any(), any());
    }

    @Test
    void saveLog_bothEmpty_shouldThrow1149() {
        mockOwnedClass();
        when(classroomRepository.findScheduleExceptionAt(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.saveLog(
                        CLASS_ID, logRequest("  ", " "), httpRequest),
                ErrorCode.SESSION_LOG_EMPTY);
    }

    @Test
    void saveLog_endBeforeStart_shouldThrow1147() {
        mockOwnedClass();
        SaveTeachingLogRequest request = logRequest("k", "b");
        request.setEndTime(LocalTime.of(19, 0));

        assertErrorCode(
                () -> classOccurrenceService.saveLog(CLASS_ID, request, httpRequest),
                ErrorCode.SESSION_INVALID_TIME);
    }

    @Test
    void saveLog_classNotFound_shouldThrow404() {
        when(classroomRepository.findClassState(CLASS_ID)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.saveLog(
                        CLASS_ID, logRequest("k", "b"), httpRequest),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void getLog_existingSlot_returnsContent() {
        mockOwnedClass();
        when(classroomRepository.findTeachingLog(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.of(logRow(7L, FRI, SLOT_START, SLOT_END, "k", "b")));

        TeachingLogResponse result = classOccurrenceService.getLog(CLASS_ID, FRI, SLOT_START);

        assertEquals(7L, result.getLogId());
        assertTrue(result.getHasContent());
        assertEquals("k", result.getKnowledge());
    }

    @Test
    void getLog_noLogYet_returnsNull() {
        mockOwnedClass();
        when(classroomRepository.findTeachingLog(CLASS_ID, FRI, SLOT_START))
                .thenReturn(Optional.empty());

        assertNull(classOccurrenceService.getLog(CLASS_ID, FRI, SLOT_START));
    }

    @Test
    void deleteLog_existing_shouldDeleteAndAudit() {
        mockOwnedClass();
        when(classroomRepository.deleteTeachingLog(CLASS_ID, 7L)).thenReturn(1);

        classOccurrenceService.deleteLog(CLASS_ID, 7L, httpRequest);

        verify(classroomRepository).deleteTeachingLog(CLASS_ID, 7L);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("DELETE_LOG"), eq("TEACHING_LOG"), eq(7L), any(), eq(httpRequest));
    }

    @Test
    void deleteLog_missing_shouldThrow1156() {
        mockOwnedClass();
        when(classroomRepository.deleteTeachingLog(CLASS_ID, 7L)).thenReturn(0);

        assertErrorCode(
                () -> classOccurrenceService.deleteLog(CLASS_ID, 7L, httpRequest),
                ErrorCode.MATERIAL_NOT_FOUND);
    }

    // -------------------------------------------------------------------- LESSON

    @Test
    void getLesson_tutorOwner_returnsDetailWithMaterials() {
        when(classroomRepository.findLessonDetail(42L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterials(42L))
                .thenReturn(List.of(materialRow(40L)));

        LessonDetailResponse result = classOccurrenceService.getLesson(42L);

        assertEquals("IELTS 1 kèm 1", result.getClassName());
        assertEquals("Lê Hoàng Nam", result.getStudentName());
        assertEquals("Trần Gia Sư", result.getTutorName());
        assertEquals(1, result.getMaterials().size());
        assertEquals(40L, result.getMaterials().get(0).getMaterialId());
    }

    @Test
    void getLesson_studentOwner_returnsDetail() {
        stubStudentContext();
        when(classroomRepository.findLessonDetail(42L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterials(42L)).thenReturn(List.of());

        classOccurrenceService.getLesson(42L);
    }

    @Test
    void getLesson_otherUser_shouldThrow403() {
        when(classroomRepository.findLessonDetail(42L)).thenReturn(Optional.of(lessonRow()));
        stubReceptionistContext();

        assertErrorCode(
                () -> classOccurrenceService.getLesson(42L),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void getLesson_missing_shouldThrow404() {
        when(classroomRepository.findLessonDetail(42L)).thenReturn(Optional.empty());

        assertErrorCode(() -> classOccurrenceService.getLesson(42L), ErrorCode.CLASS_NOT_FOUND);
    }

    // ---------------------------------------------------------------- MATERIALS

    @Test
    void uploadMaterial_pdf_success() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "bai-hoc.pdf", "application/pdf", "pdf".getBytes());
        when(storageService.uploadFile(
                        eq("lesson-materials/42"), eq(file), anyLong()))
                .thenReturn("https://minio.local/englishpath/x/1.pdf");
        when(classroomRepository.insertLessonMaterial(
                        eq(42L), eq(TUTOR_ID), eq("bai-hoc.pdf"),
                        eq("https://minio.local/englishpath/x/1.pdf"), eq("PDF"), eq(3L)))
                .thenReturn(40L);
        when(classroomRepository.findLessonMaterial(42L, 40L))
                .thenReturn(Optional.of(materialRow(40L)));

        LessonMaterialItem result = classOccurrenceService.uploadMaterial(42L, file, httpRequest);

        assertEquals("PDF", result.getFileType());
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("UPLOAD_LESSON_MATERIAL"), eq("LESSON_MATERIAL"),
                        eq(40L), any(), eq(httpRequest));
    }

    @Test
    void uploadMaterial_invalidType_shouldThrow() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", "x".getBytes());

        assertErrorCode(
                () -> classOccurrenceService.uploadMaterial(42L, file, httpRequest),
                ErrorCode.MATERIAL_FILE_TYPE_INVALID);
    }

    @Test
    void uploadMaterial_tooLarge_shouldThrow() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "big.pdf", "application/pdf", new byte[21 * 1024 * 1024]);

        assertErrorCode(
                () -> classOccurrenceService.uploadMaterial(42L, file, httpRequest),
                ErrorCode.MATERIAL_FILE_TOO_LARGE);
    }

    @Test
    void uploadMaterial_emptyFile_shouldThrow404() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "a.pdf", "application/pdf", new byte[0]);

        assertErrorCode(
                () -> classOccurrenceService.uploadMaterial(42L, file, httpRequest),
                ErrorCode.MATERIAL_NOT_FOUND);
    }

    @Test
    void uploadMaterial_lessonNotFound_shouldThrow404() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.empty());
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "a.pdf", "application/pdf", "x".getBytes());

        assertErrorCode(
                () -> classOccurrenceService.uploadMaterial(42L, file, httpRequest),
                ErrorCode.CLASS_NOT_FOUND);
    }

    @Test
    void uploadMaterial_tutorNotOwner_shouldThrow403() {
        LessonDetailRow other = new LessonDetailRow(
                42L, 2L, "Lớp khác", "HS khác", "GS khác",
                99L, 30L, "t", "PUBLISHED", 0, 0, OffsetDateTime.now(), OffsetDateTime.now());
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(other));
        var file = new org.springframework.mock.web.MockMultipartFile(
                "file", "a.pdf", "application/pdf", "x".getBytes());

        assertErrorCode(
                () -> classOccurrenceService.uploadMaterial(42L, file, httpRequest),
                ErrorCode.CLASS_NOT_OWNED);
    }

    @Test
    void deleteMaterial_success_shouldDeleteS3AndRowAndAudit() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterial(42L, 40L))
                .thenReturn(Optional.of(materialRow(40L)));

        classOccurrenceService.deleteMaterial(42L, 40L, httpRequest);

        verify(storageService).deleteFile("https://minio.local/englishpath/x/1.pdf");
        verify(classroomRepository).deleteLessonMaterial(42L, 40L);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("DELETE_LESSON_MATERIAL"), eq("LESSON_MATERIAL"),
                        eq(40L), any(), eq(httpRequest));
    }

    @Test
    void deleteMaterial_notBelongingToLesson_shouldThrow404() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterial(42L, 40L)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.deleteMaterial(42L, 40L, httpRequest),
                ErrorCode.MATERIAL_NOT_FOUND);
    }

    @Test
    void deleteMaterial_s3Failure_stillDeletesRow() {
        when(classroomRepository.lockLesson(42L)).thenReturn(Optional.of(lessonRow()));
        when(classroomRepository.findLessonMaterial(42L, 40L))
                .thenReturn(Optional.of(materialRow(40L)));
        org.mockito.Mockito.doThrow(new RuntimeException("s3 down"))
                .when(storageService)
                .deleteFile(any());

        classOccurrenceService.deleteMaterial(42L, 40L, httpRequest);

        verify(classroomRepository).deleteLessonMaterial(42L, 40L);
    }

    @Test
    void getMaterialAccessUrl_tutorOwner_pdfPreviewable() {
        when(classroomRepository.findMaterialForAccess(40L))
                .thenReturn(Optional.of(materialRow(40L)));
        when(storageService.presignedUrl(
                        eq("https://minio.local/englishpath/x/1.pdf"),
                        eq(java.time.Duration.ofMinutes(10))))
                .thenReturn("https://minio.local/presigned");

        MaterialAccessUrlResponse result = classOccurrenceService.getMaterialAccessUrl(40L);

        assertEquals("https://minio.local/presigned", result.getUrl());
        assertTrue(result.getPreviewable());
    }

    @Test
    void getMaterialAccessUrl_docxNotPreviewable() {
        var docx = new LessonMaterialRow(
                40L, 42L, CLASS_ID, TUTOR_ID, STUDENT_ID,
                "bai-hoc.docx", "https://minio.local/x/docx", "DOCX",
                100L, "Trần Gia Sư", OffsetDateTime.now());
        when(classroomRepository.findMaterialForAccess(40L)).thenReturn(Optional.of(docx));
        when(storageService.presignedUrl(any(), eq(java.time.Duration.ofMinutes(10))))
                .thenReturn("https://minio.local/presigned");

        assertFalse(classOccurrenceService.getMaterialAccessUrl(40L).getPreviewable());
    }

    @Test
    void getMaterialAccessUrl_missing_shouldThrow404() {
        when(classroomRepository.findMaterialForAccess(40L)).thenReturn(Optional.empty());

        assertErrorCode(
                () -> classOccurrenceService.getMaterialAccessUrl(40L),
                ErrorCode.MATERIAL_NOT_FOUND);
    }

    @Test
    void getMaterialAccessUrl_studentOwner_allowed() {
        stubStudentContext();
        when(classroomRepository.findMaterialForAccess(40L))
                .thenReturn(Optional.of(materialRow(40L)));
        when(storageService.presignedUrl(any(), eq(java.time.Duration.ofMinutes(10))))
                .thenReturn("https://minio.local/presigned");

        classOccurrenceService.getMaterialAccessUrl(40L);
    }

    @Test
    void getMaterialAccessUrl_studentNotOwner_shouldThrow403() {
        stubStudentContext();
        var otherClass = new LessonMaterialRow(
                40L, 42L, CLASS_ID, TUTOR_ID, 30L, "a.pdf", "u", "PDF",
                1L, "Trần Gia Sư", OffsetDateTime.now());
        when(classroomRepository.findMaterialForAccess(40L)).thenReturn(Optional.of(otherClass));

        assertErrorCode(
                () -> classOccurrenceService.getMaterialAccessUrl(40L),
                ErrorCode.SESSION_NOT_OWNED);
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
