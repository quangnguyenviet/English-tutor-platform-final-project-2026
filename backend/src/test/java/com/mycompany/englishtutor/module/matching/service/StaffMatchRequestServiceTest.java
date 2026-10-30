package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.api.request.CancelMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffMatchRequestQueryRepository;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport.ClassSnapshot;
import com.mycompany.englishtutor.module.payment.service.PaymentService;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Unit test luồng ghép lại / hủy đơn ghép lớp sau dạy thử (UC-REC-06.1 nhánh 5.2, UC-REC-07 5a, ERD C-14). */
@ExtendWith(MockitoExtension.class)
class StaffMatchRequestServiceTest {

    private static final Long REQUEST_ID = 5L;
    private static final Long CLASS_ID = 21L;
    private static final Long TUTOR_ID = 3L;
    private static final Long STUDENT_ID = 8L;
    private static final String LOCK_SQL = "SELECT status FROM class_requests WHERE id = ? FOR UPDATE";

    @Mock
    JdbcTemplate jdbcTemplate;

    @Mock
    StaffMatchRequestQueryRepository queryRepository;

    @Mock
    TutorRepository tutorRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    AuditLogService auditLogService;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    PaymentService paymentService;

    @Mock
    MatchingLifecycleSupport lifecycle;

    @InjectMocks
    StaffMatchRequestService service;

    // ---------------------------------------------------------------- rematch

    @Test
    void rematch_trialClass_closesClassTerminatesTutorAndMovesToRematch() {
        givenRequestStatus("MATCHED");
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(trialClass("TRIAL")));
        MatchRequestDetailResponse detail = MatchRequestDetailResponse.builder().id(REQUEST_ID).status("REMATCH").build();
        when(queryRepository.findDetailById(REQUEST_ID)).thenReturn(Optional.of(detail));

        MatchRequestDetailResponse result = service.rematchMatchRequest(
                REQUEST_ID, new RematchMatchRequest("  Học sinh chưa hợp phương pháp  "), null);

        assertEquals("REMATCH", result.getStatus());
        InOrder order = inOrder(lifecycle, jdbcTemplate);
        order.verify(lifecycle).closeOpenClasses(REQUEST_ID);
        order.verify(lifecycle).terminateTutor(REQUEST_ID, TUTOR_ID);
        order.verify(jdbcTemplate).update(contains("status = 'REMATCH', requested_tutor_id = NULL"), any(), eq(REQUEST_ID));
        verify(auditLogService).log(any(), eq("REMATCH_MATCH_REQUEST"), eq("CLASS_REQUEST"), eq(REQUEST_ID), any(), any());
        verify(lifecycle).notifyUser(eq(TUTOR_ID), anyString(), contains("Học sinh chưa hợp phương pháp"), eq("CLASS"), eq(CLASS_ID));
        verify(lifecycle).notifyUser(eq(STUDENT_ID), anyString(), anyString(), eq("CLASS"), eq(CLASS_ID));
    }

    @Test
    void rematch_classAlreadyActive_throwsNotTrial() {
        givenRequestStatus("MATCHED");
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(trialClass("ACTIVE")));

        AppException ex = assertThrows(AppException.class,
                () -> service.rematchMatchRequest(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.MATCH_REQUEST_NOT_TRIAL, ex.getErrorCode());
        verify(lifecycle, never()).closeOpenClasses(anyLong());
    }

    @Test
    void rematch_requestNotMatched_throwsNotTrial() {
        givenRequestStatus("REMATCH");
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(trialClass("CANCELLED")));

        AppException ex = assertThrows(AppException.class,
                () -> service.rematchMatchRequest(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.MATCH_REQUEST_NOT_TRIAL, ex.getErrorCode());
        verify(lifecycle, never()).terminateTutor(anyLong(), anyLong());
    }

    @Test
    void rematch_cancelledRequest_throwsAlreadyCancelled() {
        givenRequestStatus("CANCELLED");

        AppException ex = assertThrows(AppException.class,
                () -> service.rematchMatchRequest(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED, ex.getErrorCode());
    }

    @Test
    void rematch_missingRequest_throwsNotFound() {
        when(jdbcTemplate.queryForList(LOCK_SQL, String.class, REQUEST_ID)).thenReturn(List.of());

        AppException ex = assertThrows(AppException.class,
                () -> service.rematchMatchRequest(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- cancel

    @Test
    void cancel_duringTrial_terminatesSelectedTutorAndRejectsPending() {
        when(jdbcTemplate.queryForList(anyString(), eq(REQUEST_ID)))
                .thenReturn(List.of(java.util.Map.of("id", REQUEST_ID, "status", "MATCHED")));
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(trialClass("TRIAL")));

        service.cancelMatchRequest(REQUEST_ID, new CancelMatchRequest("Phụ huynh không tìm gia sư nữa"), null);

        verify(lifecycle).closeOpenClasses(REQUEST_ID);
        verify(lifecycle).terminateTutor(REQUEST_ID, TUTOR_ID);
        verify(lifecycle).rejectPendingApplications(REQUEST_ID);
        verify(jdbcTemplate).update(contains("status = 'CANCELLED'"), eq("Phụ huynh không tìm gia sư nữa"), any(), eq(REQUEST_ID));
    }

    @Test
    void cancel_pendingRequestWithoutClass_doesNotTerminateAnyone() {
        when(jdbcTemplate.queryForList(anyString(), eq(REQUEST_ID)))
                .thenReturn(List.of(java.util.Map.of("id", REQUEST_ID, "status", "NEW")));
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.empty());

        service.cancelMatchRequest(REQUEST_ID, new CancelMatchRequest("Phụ huynh đổi ý"), null);

        verify(lifecycle, never()).terminateTutor(anyLong(), anyLong());
        verify(lifecycle, never()).notifyUser(any(), any(), any(), any(), any());
    }

    // ----------------------------------------------------------------- helper

    private void givenRequestStatus(String status) {
        when(jdbcTemplate.queryForList(LOCK_SQL, String.class, REQUEST_ID)).thenReturn(List.of(status));
    }

    private static ClassSnapshot trialClass(String status) {
        return new ClassSnapshot(CLASS_ID, TUTOR_ID, STUDENT_ID, "Tiếng Anh lớp 8", status);
    }
}
