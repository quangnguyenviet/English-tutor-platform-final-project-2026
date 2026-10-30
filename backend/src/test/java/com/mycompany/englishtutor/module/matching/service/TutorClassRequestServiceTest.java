package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.matching.api.request.ApplyClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.matching.repository.ClassApplicationRepository;
import com.mycompany.englishtutor.module.matching.repository.TutorClassRequestQueryRepository;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Unit test nghiệp vụ gia sư xem lớp đang tuyển, ứng tuyển và rút đơn (FR-08). */
@ExtendWith(MockitoExtension.class)
class TutorClassRequestServiceTest {

    private static final Long TUTOR_ID = 3L;
    private static final Long REQUEST_ID = 7L;
    private static final Long APPLICATION_ID = 9L;

    @Mock
    TutorClassRequestQueryRepository queryRepository;

    @Mock
    ClassApplicationRepository applicationRepository;

    @Mock
    UserRepository userRepository;

    @Mock
    TutorRepository tutorRepository;

    @InjectMocks
    TutorClassRequestService service;

    @BeforeEach
    void setUp() {
        when(userRepository.findByUsername("tutor"))
                .thenReturn(Optional.of(User.builder().id(TUTOR_ID).fullName("Phạm Ngọc Gia Sư").build()));
        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken("tutor", null));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------- list/detail

    @Test
    void getOpenRequests_delegatesWithClampedPagingAndFilter() {
        when(queryRepository.findOpenRequests(eq(TUTOR_ID), any(), eq(0), eq(100)))
                .thenReturn(PageResponse.of(List.of(), 0, 100, 0));

        service.getOpenRequests("IELTS", "ONLINE", "thpt", "fee_asc", -1, 500);

        ArgumentCaptor<TutorClassRequestQueryRepository.Filter> filterCaptor =
                ArgumentCaptor.forClass(TutorClassRequestQueryRepository.Filter.class);
        verify(queryRepository).findOpenRequests(eq(TUTOR_ID), filterCaptor.capture(), eq(0), eq(100));

        assertEquals("IELTS", filterCaptor.getValue().keyword());
        assertEquals("ONLINE", filterCaptor.getValue().teachingMode());
        assertEquals("thpt", filterCaptor.getValue().gradeGroup());
        assertEquals("fee_asc", filterCaptor.getValue().sort());
    }

    @Test
    void getOpenRequest_notFound_throwsNotFound() {
        when(queryRepository.findOpenRequest(TUTOR_ID, REQUEST_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class, () -> service.getOpenRequest(REQUEST_ID));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void getOpenRequest_found_returnsResponse() {
        TutorOpenClassRequestResponse response =
                TutorOpenClassRequestResponse.builder().id(REQUEST_ID).build();
        when(queryRepository.findOpenRequest(TUTOR_ID, REQUEST_ID)).thenReturn(Optional.of(response));

        assertEquals(response, service.getOpenRequest(REQUEST_ID));
    }

    @Test
    void getMyApplications_delegatesToRepository() {
        List<TutorApplicationResponse> history = List.of(TutorApplicationResponse.builder()
                .applicationId(APPLICATION_ID)
                .status("SELECTED")
                .build());
        when(queryRepository.findApplicationsByTutor(TUTOR_ID)).thenReturn(history);

        assertEquals(history, service.getMyApplications());
    }

    // ------------------------------------------------------------------ apply

    @Test
    void apply_tutorNotActive_throws403AndDoesNotInsert() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .profileStatus(ProfileStatus.PENDING.name())
                        .build()));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.TUTOR_NOT_ACTIVE, ex.getErrorCode());
        verify(applicationRepository, never()).lockRequestStatus(anyLong());
        verify(applicationRepository, never()).insert(anyLong(), anyLong(), any());
    }

    @Test
    void apply_requestMissing_throws404() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of());

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void apply_requestNotOpen_throws409() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("MATCHED"));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_OPEN, ex.getErrorCode());
    }

    @Test
    void apply_success_insertsApplicationAndNotifiesReceptionists() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("OPEN"));
        when(applicationRepository.insert(REQUEST_ID, TUTOR_ID, "Em nhận lớp được")).thenReturn(10L);

        TutorApplicationResponse response =
                service.apply(REQUEST_ID, new ApplyClassRequest("  Em nhận lớp được  "));

        assertEquals(10L, response.getApplicationId());
        assertEquals("APPLIED", response.getStatus());
        assertEquals("Em nhận lớp được", response.getMessage());
        verify(applicationRepository).notifyReceptionists(REQUEST_ID, "Phạm Ngọc Gia Sư");
    }

    @Test
    void apply_duplicate_throwsAlreadyApplied() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("OPEN"));
        when(applicationRepository.insert(anyLong(), anyLong(), any()))
                .thenThrow(new DuplicateKeyException("uq_class_applications"));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_ALREADY_APPLIED, ex.getErrorCode());
        verify(applicationRepository, never()).notifyReceptionists(anyLong(), any());
    }

    @Test
    void apply_tutorClosedToTeaching_throwsAndDoesNotLockRequest() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .profileStatus(ProfileStatus.ACTIVE.name())
                        .openToTeaching(false)
                        .build()));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.TUTOR_NOT_OPEN_TO_TEACHING, ex.getErrorCode());
        verify(applicationRepository, never()).lockRequestStatus(anyLong());
    }

    @Test
    void apply_rematchRequest_newTutor_insertsApplication() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("REMATCH"));
        when(applicationRepository.insert(REQUEST_ID, TUTOR_ID, "Em nhận lớp")).thenReturn(11L);

        TutorApplicationResponse response = service.apply(REQUEST_ID, new ApplyClassRequest("Em nhận lớp"));

        assertEquals(11L, response.getApplicationId());
        verify(applicationRepository).notifyReceptionists(REQUEST_ID, "Phạm Ngọc Gia Sư");
    }

    @Test
    void apply_terminatedTutor_throwsApplicationTerminated() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("REMATCH"));
        when(applicationRepository.findByRequestAndTutor(REQUEST_ID, TUTOR_ID))
                .thenReturn(Optional.of(new ClassApplicationRepository.ExistingApplication(APPLICATION_ID, "TERMINATED")));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Cho em thử lại")));

        assertEquals(ErrorCode.APPLICATION_TERMINATED, ex.getErrorCode());
        verify(applicationRepository, never()).insert(anyLong(), anyLong(), any());
    }

    @Test
    void apply_rematchRequest_previouslyRejected_throwsApplicationRejected() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("REMATCH"));
        when(applicationRepository.findByRequestAndTutor(REQUEST_ID, TUTOR_ID))
                .thenReturn(Optional.of(new ClassApplicationRepository.ExistingApplication(APPLICATION_ID, "REJECTED")));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Em vẫn muốn nhận lớp")));

        assertEquals(ErrorCode.APPLICATION_REJECTED, ex.getErrorCode());
        verify(applicationRepository, never()).insert(anyLong(), anyLong(), any());
    }

    @Test
    void apply_existingApplied_throwsAlreadyApplied() {
        givenActiveTutor();
        when(applicationRepository.lockRequestStatus(REQUEST_ID)).thenReturn(List.of("OPEN"));
        when(applicationRepository.findByRequestAndTutor(REQUEST_ID, TUTOR_ID))
                .thenReturn(Optional.of(new ClassApplicationRepository.ExistingApplication(APPLICATION_ID, "APPLIED")));

        AppException ex = assertThrows(AppException.class,
                () -> service.apply(REQUEST_ID, new ApplyClassRequest("Lời nhắn hợp lệ")));

        assertEquals(ErrorCode.CLASS_ALREADY_APPLIED, ex.getErrorCode());
    }

    @Test
    void getOpenRequests_tutorClosedToTeaching_returnsEmptyWithoutQuery() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder().openToTeaching(false).build()));

        PageResponse<TutorOpenClassRequestResponse> page = service.getOpenRequests(null, null, null, null, 0, 20);

        assertEquals(0, page.getTotalItems());
        verify(queryRepository, never()).findOpenRequests(anyLong(), any(), anyInt(), anyInt());
    }

    // --------------------------------------------------------------- withdraw

    @Test
    void withdraw_notFound_throws404() {
        when(applicationRepository.findForWithdraw(APPLICATION_ID)).thenReturn(Optional.empty());

        AppException ex = assertThrows(AppException.class,
                () -> service.withdrawApplication(APPLICATION_ID));

        assertEquals(ErrorCode.APPLICATION_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void withdraw_notOwned_throws404AndDoesNotDelete() {
        when(applicationRepository.findForWithdraw(APPLICATION_ID))
                .thenReturn(Optional.of(new ClassApplicationRepository.WithdrawState(
                        99L, "APPLIED", "OPEN", false)));

        AppException ex = assertThrows(AppException.class,
                () -> service.withdrawApplication(APPLICATION_ID));

        assertEquals(ErrorCode.APPLICATION_NOT_FOUND, ex.getErrorCode());
        verify(applicationRepository, never()).delete(anyLong());
    }

    @Test
    void withdraw_applicationNotApplied_throws409() {
        givenWithdrawState("SELECTED", "MATCHED", true);

        AppException ex = assertThrows(AppException.class,
                () -> service.withdrawApplication(APPLICATION_ID));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_requestMatched_throws409() {
        givenWithdrawState("APPLIED", "MATCHED", false);

        AppException ex = assertThrows(AppException.class,
                () -> service.withdrawApplication(APPLICATION_ID));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_selectedSibling_throws409() {
        givenWithdrawState("APPLIED", "OPEN", true);

        AppException ex = assertThrows(AppException.class,
                () -> service.withdrawApplication(APPLICATION_ID));

        assertEquals(ErrorCode.APPLICATION_NOT_WITHDRAWABLE, ex.getErrorCode());
    }

    @Test
    void withdraw_rematchRequest_deletesRow() {
        givenWithdrawState("APPLIED", "REMATCH", false);

        service.withdrawApplication(APPLICATION_ID);

        verify(applicationRepository).delete(APPLICATION_ID);
    }

    @Test
    void withdraw_success_deletesRow() {
        givenWithdrawState("APPLIED", "OPEN", false);

        service.withdrawApplication(APPLICATION_ID);

        verify(applicationRepository).delete(APPLICATION_ID);
    }

    // ----------------------------------------------------------------- helper

    private void givenActiveTutor() {
        when(tutorRepository.findById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .profileStatus(ProfileStatus.ACTIVE.name())
                        .build()));
    }

    private void givenWithdrawState(String appStatus, String requestStatus, boolean hasSelected) {
        when(applicationRepository.findForWithdraw(APPLICATION_ID))
                .thenReturn(Optional.of(new ClassApplicationRepository.WithdrawState(
                        TUTOR_ID, appStatus, requestStatus, hasSelected)));
    }
}
