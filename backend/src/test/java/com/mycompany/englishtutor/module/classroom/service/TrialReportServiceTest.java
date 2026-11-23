package com.mycompany.englishtutor.module.classroom.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
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
import com.mycompany.englishtutor.module.classroom.api.request.TrialReportRequest;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Luồng báo cáo kết quả dạy thử của gia sư (trial_report, V31):
 * guard sở hữu + lock, validate outcome/lý do, insert trial_reports,
 * kích hoạt lớp khi SUCCESS, fan-out thông báo lễ tân.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TrialReportServiceTest {

    private static final Long CLASS_ID = 5L;
    private static final Long TUTOR_ID = 10L;
    private static final Long OTHER_TUTOR_ID = 11L;
    private static final Long STUDENT_ID = 20L;

    private static final ClassState TRIAL_STATE =
            new ClassState(TUTOR_ID, STUDENT_ID, "TRIAL", "ONLINE", "IELTS 1 kèm 1", "Lê Hoàng Nam");

    private static final ClassState ACTIVE_STATE =
            new ClassState(TUTOR_ID, STUDENT_ID, "ACTIVE", "ONLINE", "IELTS 1 kèm 1", "Lê Hoàng Nam");

    private static final ClassState NOT_OWNED_TRIAL_STATE =
            new ClassState(OTHER_TUTOR_ID, STUDENT_ID, "TRIAL", "ONLINE", "IELTS 1 kèm 1", "Lê Hoàng Nam");

    private static final TrialSessionResponse TRIAL_SESSION =
            TrialSessionResponse.builder()
                    .sessionDate(java.time.LocalDate.of(2026, 11, 6))
                    .startTime(java.time.LocalTime.of(19, 30))
                    .endTime(java.time.LocalTime.of(21, 0))
                    .teachingMode("ONLINE")
                    .meetingUrl("https://meet.google.com/abc")
                    .status("SCHEDULED")
                    .build();

    @Mock
    ClassroomQueryRepository classroomRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    AuditLogService auditLogService;

    @Mock
    StaffClassRequestService staffClassRequestService;

    @Mock
    MatchingLifecycleSupport lifecycle;

    @InjectMocks
    TrialReportService trialReportService;

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
        httpRequest = new MockHttpServletRequest(HttpMethod.POST.name(), "/api/v1/classes/5/trial-report");
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------ helpers

    private void mockOwnedTrialClass() {
        when(classroomRepository.lockClassForUpdate(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.of(TRIAL_SESSION));
    }

    private static TrialReportRequest request(String outcome, String note) {
        return TrialReportRequest.builder().outcome(outcome).note(note).build();
    }

    // ------------------------------------------------------------ TESTS

    /** SUCCESS khi đủ phí: lớp kích hoạt ACTIVE + payment NOT_SUBMITTED + audit + thông báo lễ tân. */
    @Test
    void successWithFeeActivatesClass() {
        mockOwnedTrialClass();
        when(classroomRepository.insertTrialReport(eq(CLASS_ID), eq(TUTOR_ID), eq("SUCCESS"), eq(null)))
                .thenReturn(100L);

        boolean activated = trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest);

        assertTrue(activated);
        verify(staffClassRequestService).tutorActivateTrial(CLASS_ID, httpRequest);
        verify(classroomRepository).insertTrialReport(CLASS_ID, TUTOR_ID, "SUCCESS", null);
        verify(auditLogService)
                .log(eq(TUTOR_ID), eq("SUBMIT_TRIAL_REPORT"), eq("CLASS"), eq(CLASS_ID), any(), eq(httpRequest));
        verify(lifecycle)
                .notifyReceptionists(
                        eq("Gia sư báo dạy thử thành công"), any(), eq("CLASS"), eq(CLASS_ID));
    }

    /** FAILED thiếu lý do (hoặc ngắn hơn 5 ký tự) → 400 TRIAL_REPORT_REASON_REQUIRED, không insert. */
    @Test
    void failedWithoutReasonThrows400() {
        mockOwnedTrialClass();

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("FAILED", "abc"), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_REASON_REQUIRED);

        verify(classroomRepository, never()).insertTrialReport(anyLong(), anyLong(), any(), any());
        verify(staffClassRequestService, never()).tutorActivateTrial(anyLong(), any());
    }

    /** FAILED đủ lý do: insert, lớp giữ TRIAL, được nộp lại lần 2 (insert mới). */
    @Test
    void failedWithReasonInsertsAndKeepsTrial() {
        mockOwnedTrialClass();
        when(classroomRepository.insertTrialReport(eq(CLASS_ID), eq(TUTOR_ID), eq("FAILED"), eq("Học sinh chưa phù hợp")))
                .thenReturn(101L);

        boolean activated = trialReportService.submit(
                CLASS_ID, request("FAILED", "Học sinh chưa phù hợp"), httpRequest);

        assertFalse(activated);
        verify(classroomRepository).insertTrialReport(CLASS_ID, TUTOR_ID, "FAILED", "Học sinh chưa phù hợp");
        verify(staffClassRequestService, never()).tutorActivateTrial(anyLong(), any());
        verify(lifecycle)
                .notifyReceptionists(
                        eq("Gia sư báo dạy thử không thành công"), any(), eq("CLASS"), eq(CLASS_ID));
    }

    /** Chưa có ca thử (trial_start_time NULL) → 404 TRIAL_SESSION_NOT_FOUND. */
    @Test
    void noTrialSessionThrows404() {
        when(classroomRepository.lockClassForUpdate(CLASS_ID)).thenReturn(Optional.of(TRIAL_STATE));
        when(classroomRepository.findTrialSession(CLASS_ID)).thenReturn(Optional.empty());

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_SESSION_NOT_FOUND);
        verify(classroomRepository, never()).insertTrialReport(anyLong(), anyLong(), any(), any());
    }

    /** Lớp không phải TRIAL → 409 CLASS_NOT_TRIAL. */
    @Test
    void nonTrialClassThrows409() {
        when(classroomRepository.lockClassForUpdate(CLASS_ID)).thenReturn(Optional.of(ACTIVE_STATE));

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.CLASS_NOT_TRIAL);
    }

    /** Tutor không sở hữu lớp → 403 CLASS_NOT_OWNED. */
    @Test
    void nonOwnerTutorThrows403() {
        when(classroomRepository.lockClassForUpdate(CLASS_ID))
                .thenReturn(Optional.of(NOT_OWNED_TRIAL_STATE));

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.CLASS_NOT_OWNED);
    }

    /** Outcome không hợp lệ (không SUCCESS/FAILED) → 400 TRIAL_REPORT_INVALID_OUTCOME. */
    @Test
    void invalidOutcomeThrows400() {
        mockOwnedTrialClass();

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("MAYBE", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.TRIAL_REPORT_INVALID_OUTCOME);
        verify(classroomRepository, never()).insertTrialReport(anyLong(), anyLong(), any(), any());
    }

    /** SUCCESS thiếu phí (3 nguồn đều thiếu) → 409 CLASS_FEE_INCOMPLETE (từ tutorActivateTrial). */
    @Test
    void successMissingFeeThrows409() {
        mockOwnedTrialClass();
        when(classroomRepository.insertTrialReport(eq(CLASS_ID), eq(TUTOR_ID), eq("SUCCESS"), eq(null)))
                .thenReturn(102L);
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.CLASS_FEE_INCOMPLETE))
                .when(staffClassRequestService)
                .tutorActivateTrial(CLASS_ID, httpRequest);

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.CLASS_FEE_INCOMPLETE);
        // Thông báo lễ tân không gửi khi kích hoạt lỗi (transaction roll back)
        verify(lifecycle, never()).notifyReceptionists(any(), any(), any(), any());
    }

    /** Lớp không tồn tại → 404 CLASS_NOT_FOUND. */
    @Test
    void classNotFoundThrows404() {
        when(classroomRepository.lockClassForUpdate(CLASS_ID)).thenReturn(Optional.empty());

        AppException ex =
                assertThrows(
                        AppException.class,
                        () -> trialReportService.submit(CLASS_ID, request("SUCCESS", null), httpRequest));
        assertTrue(ex.getErrorCode() == ErrorCode.CLASS_NOT_FOUND);
    }
}
