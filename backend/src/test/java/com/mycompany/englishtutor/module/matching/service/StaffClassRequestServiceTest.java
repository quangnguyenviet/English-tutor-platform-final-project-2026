package com.mycompany.englishtutor.module.matching.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ChangeDesignatedTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ParentCheckRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.SelectTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ParentCheckResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffClassRequestQueryRepository;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport.ClassSnapshot;
import com.mycompany.englishtutor.module.payment.service.PaymentService;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Unit test máy trạng thái Lớp cần gia sư sau khi gộp Đơn ghép lớp. */
@ExtendWith(MockitoExtension.class)
class StaffClassRequestServiceTest {

    private static final Long REQUEST_ID = 5L;
    private static final Long CLASS_ID = 21L;
    private static final Long TUTOR_ID = 3L;
    private static final Long OTHER_TUTOR_ID = 4L;
    private static final Long STUDENT_ID = 8L;
    private static final Long PARENT_ID = 2L;

    @Mock
    JdbcTemplate jdbcTemplate;

    @Mock
    StaffClassRequestQueryRepository queryRepository;

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

    @Mock
    ParentResolver parentResolver;

    @InjectMocks
    StaffClassRequestService service;

    // ---------------------------------------------------------------- rematch

    @Test
    void rematch_trialClass_closesClassTerminatesTutorReopensRejectedAndMovesToRematch() {
        givenRequest("MATCHED", TUTOR_ID, STUDENT_ID, null);
        givenDetail();
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(classWith("TRIAL", null)));
        when(lifecycle.reopenRejectedApplications(REQUEST_ID)).thenReturn(List.of(OTHER_TUTOR_ID));

        service.rematch(REQUEST_ID, new RematchMatchRequest("  Học sinh chưa hợp phương pháp  "), null);

        InOrder order = inOrder(lifecycle, jdbcTemplate);
        order.verify(lifecycle).closeOpenClasses(REQUEST_ID);
        order.verify(lifecycle).terminateTutor(REQUEST_ID, TUTOR_ID);
        order.verify(lifecycle).reopenRejectedApplications(REQUEST_ID);
        order.verify(jdbcTemplate).update(contains("status = 'REMATCH', requested_tutor_id = NULL"), any(), eq(REQUEST_ID));
        verify(auditLogService).log(any(), eq("REMATCH_CLASS_REQUEST"), eq("CLASS_REQUEST"), eq(REQUEST_ID), any(), any());
        verify(lifecycle).notifyUser(eq(TUTOR_ID), anyString(), contains("Học sinh chưa hợp phương pháp"), eq("CLASS"), eq(CLASS_ID));
        verify(lifecycle).notifyUser(eq(STUDENT_ID), anyString(), anyString(), eq("CLASS"), eq(CLASS_ID));
        verify(lifecycle).notifyUser(eq(OTHER_TUTOR_ID), anyString(), anyString(), eq("CLASS_REQUEST"), eq(REQUEST_ID));
    }

    @Test
    void rematch_classAlreadyActive_throwsNotTrial() {
        givenRequest("MATCHED", TUTOR_ID, STUDENT_ID, null);
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(classWith("ACTIVE", LocalDate.now())));

        AppException ex = assertThrows(AppException.class,
                () -> service.rematch(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.MATCH_REQUEST_NOT_TRIAL, ex.getErrorCode());
        verify(lifecycle, never()).closeOpenClasses(anyLong());
    }

    @Test
    void rematch_cancelledRequest_throwsAlreadyCancelled() {
        givenRequest("CANCELLED", null, STUDENT_ID, null);

        AppException ex = assertThrows(AppException.class,
                () -> service.rematch(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.CLASS_REQUEST_ALREADY_CANCELLED, ex.getErrorCode());
    }

    @Test
    void rematch_missingRequest_throwsNotFound() {
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq((Object) REQUEST_ID))).thenReturn(List.of());

        AppException ex = assertThrows(AppException.class,
                () -> service.rematch(REQUEST_ID, new RematchMatchRequest("Lý do"), null));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_FOUND, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- cancel

    @Test
    void cancel_duringTrial_terminatesSelectedTutorAndRejectsPending() {
        givenRequest("MATCHED", TUTOR_ID, STUDENT_ID, null);
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(classWith("TRIAL", null)));

        service.cancel(REQUEST_ID, new CancelClassRequest("Phụ huynh không tìm gia sư nữa"), null);

        verify(lifecycle).closeOpenClasses(REQUEST_ID);
        verify(lifecycle).terminateTutor(REQUEST_ID, TUTOR_ID);
        verify(lifecycle).rejectPendingApplications(REQUEST_ID);
        verify(jdbcTemplate).update(contains("status = 'CANCELLED'"), eq("Phụ huynh không tìm gia sư nữa"), any(), eq(REQUEST_ID));
    }

    @Test
    void cancel_openRequest_notifiesApplicantsWithoutTerminatingAnyone() {
        givenRequest("OPEN", null, null, "Lê Hoàng Nam");
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.empty());

        service.cancel(REQUEST_ID, new CancelClassRequest("Phụ huynh đổi ý"), null);

        verify(jdbcTemplate).update(contains("FROM class_applications"),
                eq("Lớp cần gia sư đã bị hủy"), contains("Phụ huynh đổi ý"), eq(REQUEST_ID), eq(REQUEST_ID));
        verify(lifecycle, never()).terminateTutor(anyLong(), anyLong());
        verify(lifecycle, never()).notifyUser(any(), any(), any(), any(), any());
    }

    @Test
    void cancel_activeClassOnLastDay_isAllowed() {
        givenRequest("MATCHED", TUTOR_ID, STUDENT_ID, null);
        LocalDate lastDayFrom = MatchingLifecycleSupport.today().minusDays(MatchingLifecycleSupport.CANCEL_WINDOW_DAYS);
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(classWith("ACTIVE", lastDayFrom)));

        service.cancel(REQUEST_ID, new CancelClassRequest("Hủy trong tuần đầu"), null);

        verify(lifecycle).terminateTutor(REQUEST_ID, TUTOR_ID);
    }

    @Test
    void cancel_activeClassAfterSevenDays_throwsExpiredAndChangesNothing() {
        givenRequest("MATCHED", TUTOR_ID, STUDENT_ID, null);
        LocalDate expiredFrom = MatchingLifecycleSupport.today().minusDays(MatchingLifecycleSupport.CANCEL_WINDOW_DAYS + 1L);
        when(lifecycle.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(classWith("ACTIVE", expiredFrom)));

        AppException ex = assertThrows(AppException.class,
                () -> service.cancel(REQUEST_ID, new CancelClassRequest("Quá hạn"), null));

        assertEquals(ErrorCode.CLASS_REQUEST_CANCEL_EXPIRED, ex.getErrorCode());
        verify(lifecycle, never()).closeOpenClasses(anyLong());
    }

    @Test
    void cancelWindow_expiresOnlyAfterDeadlineAndOnlyForMatchedClasses() {
        LocalDate activeFrom = LocalDate.of(2026, 1, 1);
        assertFalse(classWith("ACTIVE", activeFrom).isCancelExpired(activeFrom.plusDays(7)));
        assertTrue(classWith("ACTIVE", activeFrom).isCancelExpired(activeFrom.plusDays(8)));
        assertFalse(classWith("TRIAL", null).isCancelExpired(activeFrom.plusDays(100)));
    }

    // ---------------------------------------------------------------- confirm

    @Test
    void confirm_withoutStudentAccountAndName_throwsStudentInfoRequired() {
        givenRequest("NEW", TUTOR_ID, null, "   ");
        givenActiveTutor(TUTOR_ID);

        AppException ex = assertThrows(AppException.class, () -> service.confirm(REQUEST_ID, null));

        assertEquals(ErrorCode.STUDENT_INFO_REQUIRED, ex.getErrorCode());
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirm_withoutPrice_throwsPriceRequiredAndCreatesNothing() {
        Map<String, Object> row = givenRequest("NEW", TUTOR_ID, null, "Lê Hoàng Nam");
        row.remove("price_per_session");
        givenActiveTutor(TUTOR_ID);

        AppException ex = assertThrows(AppException.class, () -> service.confirm(REQUEST_ID, null));

        assertEquals(ErrorCode.CLASS_REQUEST_PRICE_REQUIRED, ex.getErrorCode());
        verify(userRepository, never()).save(any());
        verify(paymentService, never()).createDraftForClass(any(), any(), any());
    }

    @Test
    void confirm_withoutDesignatedTutor_throwsNoTutor() {
        givenRequest("NEW", null, null, "Lê Hoàng Nam");

        AppException ex = assertThrows(AppException.class, () -> service.confirm(REQUEST_ID, null));

        assertEquals(ErrorCode.CLASS_REQUEST_NO_TUTOR, ex.getErrorCode());
    }

    @Test
    void confirm_openRequest_throwsNotPending() {
        givenRequest("OPEN", TUTOR_ID, STUDENT_ID, null);

        AppException ex = assertThrows(AppException.class, () -> service.confirm(REQUEST_ID, null));

        assertEquals(ErrorCode.MATCH_REQUEST_NOT_PENDING, ex.getErrorCode());
    }

    @Test
    void confirm_rematchWithDesignatedTutor_createsTrialAndRejectsApplicants() {
        givenRequest("REMATCH", TUTOR_ID, STUDENT_ID, null);
        givenActiveTutor(TUTOR_ID);
        givenDetail();
        when(jdbcTemplate.queryForList(contains("RETURNING tutor_id"), eq(Long.class), eq(REQUEST_ID), eq(TUTOR_ID)))
                .thenReturn(List.of(OTHER_TUTOR_ID));
        when(jdbcTemplate.queryForObject(contains("INSERT INTO classes"), eq(Long.class),
                any(), any(), any(), any(), any(), any())).thenReturn(CLASS_ID);

        service.confirm(REQUEST_ID, null);

        verify(jdbcTemplate).update(contains("status = 'MATCHED'"),
                eq(TUTOR_ID), eq(STUDENT_ID), any(), any(), any(), eq(REQUEST_ID));
        verify(paymentService).createDraftForClass(eq(CLASS_ID), any(), any());
        verify(lifecycle).notifyUser(eq(OTHER_TUTOR_ID), anyString(), anyString(), eq("CLASS_REQUEST"), eq(REQUEST_ID));
        verify(userRepository, never()).save(any());
    }

    @Test
    void confirm_newStudent_savesAccountWithoutParentPhone() {
        givenRequest("NEW", TUTOR_ID, null, "Lê Hoàng Nam");
        givenActiveTutor(TUTOR_ID);
        givenDetail();
        when(jdbcTemplate.queryForObject(contains("SELECT phone FROM parents"), eq(String.class), eq(PARENT_ID)))
                .thenReturn("0368171004");
        when(userRepository.save(any())).thenAnswer(call -> {
            User user = call.getArgument(0);
            user.setId(STUDENT_ID);
            return user;
        });
        when(jdbcTemplate.queryForObject(contains("INSERT INTO classes"), eq(Long.class),
                any(), any(), any(), any(), any(), any())).thenReturn(CLASS_ID);

        service.confirm(REQUEST_ID, null);

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals("hs_0368171004", saved.getValue().getUsername());
        assertNull(saved.getValue().getPhone());
    }

    // -------------------------------------------------------- designated tutor

    @Test
    void changeDesignatedTutor_toNone_clearsTutor() {
        givenRequest("NEW", TUTOR_ID, null, "Lê Hoàng Nam");
        givenDetail();

        service.changeDesignatedTutor(REQUEST_ID, new ChangeDesignatedTutorRequest(null), null);

        verify(jdbcTemplate).update(contains("requested_tutor_id = ?"), isNull(), any(), eq(REQUEST_ID));
        verify(tutorRepository, never()).findPublicByIdAndProfileStatus(anyLong(), anyString());
    }

    @Test
    void changeDesignatedTutor_onRematchToOtherTutor_updatesTutor() {
        givenRequest("REMATCH", null, STUDENT_ID, null);
        givenActiveTutor(OTHER_TUTOR_ID);
        givenDetail();
        when(jdbcTemplate.queryForObject(contains("TERMINATED"), eq(Integer.class), eq(REQUEST_ID), eq(OTHER_TUTOR_ID)))
                .thenReturn(0);

        service.changeDesignatedTutor(REQUEST_ID, new ChangeDesignatedTutorRequest(OTHER_TUTOR_ID), null);

        verify(jdbcTemplate).update(contains("requested_tutor_id = ?"), eq(OTHER_TUTOR_ID), any(), eq(REQUEST_ID));
    }

    @Test
    void changeDesignatedTutor_terminatedTutor_throwsConflict() {
        givenRequest("REMATCH", null, STUDENT_ID, null);
        givenActiveTutor(TUTOR_ID);
        when(jdbcTemplate.queryForObject(contains("TERMINATED"), eq(Integer.class), eq(REQUEST_ID), eq(TUTOR_ID)))
                .thenReturn(1);

        AppException ex = assertThrows(AppException.class,
                () -> service.changeDesignatedTutor(REQUEST_ID, new ChangeDesignatedTutorRequest(TUTOR_ID), null));

        assertEquals(ErrorCode.CLASS_REQUEST_TUTOR_TERMINATED, ex.getErrorCode());
    }

    @Test
    void changeDesignatedTutor_onOpen_throwsNotChangeable() {
        givenRequest("OPEN", null, null, "Lê Hoàng Nam");

        AppException ex = assertThrows(AppException.class,
                () -> service.changeDesignatedTutor(REQUEST_ID, new ChangeDesignatedTutorRequest(TUTOR_ID), null));

        assertEquals(ErrorCode.CLASS_REQUEST_TUTOR_NOT_CHANGEABLE, ex.getErrorCode());
    }

    // ---------------------------------------------------------------- publish

    @Test
    void publish_withPendingStudentName_doesNotCreateAccount() {
        Map<String, Object> row = givenRequest("NEW", null, null, "Lê Hoàng Nam");
        row.put("class_requirement", "IELTS 6.5");
        row.put("teaching_mode", "ONLINE");
        row.put("price_per_session", BigDecimal.valueOf(300000));
        givenDetail();

        service.publish(REQUEST_ID, null);

        verify(jdbcTemplate).update(contains("status = 'OPEN'"), any(), eq(REQUEST_ID));
        verify(userRepository, never()).save(any());
    }

    @Test
    void publish_withDesignatedTutor_throwsHasTutor() {
        givenRequest("NEW", TUTOR_ID, null, "Lê Hoàng Nam");

        AppException ex = assertThrows(AppException.class, () -> service.publish(REQUEST_ID, null));

        assertEquals(ErrorCode.CLASS_REQUEST_HAS_TUTOR, ex.getErrorCode());
    }

    @Test
    void publish_missingStudentInfo_throwsNotReady() {
        Map<String, Object> row = givenRequest("NEW", null, null, null);
        row.put("class_requirement", "IELTS 6.5");
        row.put("teaching_mode", "ONLINE");
        row.put("price_per_session", BigDecimal.valueOf(300000));

        AppException ex = assertThrows(AppException.class, () -> service.publish(REQUEST_ID, null));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_READY, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- select

    @Test
    void selectTutor_whenDesignatedTutorSet_throwsHasTutor() {
        givenRequest("REMATCH", TUTOR_ID, STUDENT_ID, null);

        AppException ex = assertThrows(AppException.class,
                () -> service.selectTutor(REQUEST_ID, new SelectTutorRequest(1L), null));

        assertEquals(ErrorCode.CLASS_REQUEST_HAS_TUTOR, ex.getErrorCode());
    }

    @Test
    void selectTutor_onNewRequest_throwsNotSelectable() {
        givenRequest("NEW", null, null, "Lê Hoàng Nam");

        AppException ex = assertThrows(AppException.class,
                () -> service.selectTutor(REQUEST_ID, new SelectTutorRequest(1L), null));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_SELECTABLE, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- update

    @Test
    void update_rematchWithLockedField_throwsFieldLocked() {
        givenRequest("REMATCH", null, STUDENT_ID, null);

        AppException ex = assertThrows(AppException.class, () -> service.update(
                REQUEST_ID, UpdateClassRequest.builder().teachingMode("ONLINE").build(), null));

        assertEquals(ErrorCode.CLASS_REQUEST_FIELD_LOCKED, ex.getErrorCode());
    }

    @Test
    void update_rematchAllowedFields_notifiesApplicants() {
        givenRequest("REMATCH", null, STUDENT_ID, null);
        givenDetail();

        service.update(REQUEST_ID, UpdateClassRequest.builder()
                .pricePerSession(BigDecimal.valueOf(350000))
                .tutorRequirement("IELTS 8.0")
                .build(), null);

        verify(jdbcTemplate).update(contains("FROM class_applications"),
                eq("Lớp bạn ứng tuyển đã cập nhật thông tin"), anyString(), eq(REQUEST_ID), eq(REQUEST_ID));
    }

    @Test
    void update_rematchWithSessionsPerWeek_throwsFieldLocked() {
        givenRequest("REMATCH", null, STUDENT_ID, null);

        AppException ex = assertThrows(AppException.class, () -> service.update(
                REQUEST_ID, UpdateClassRequest.builder().sessionsPerWeek(3).build(), null));

        assertEquals(ErrorCode.CLASS_REQUEST_FIELD_LOCKED, ex.getErrorCode());
    }

    @Test
    void update_newRequest_savesSessionsPerWeek() {
        givenRequest("NEW", null, null, "Lê Hoàng Nam");
        givenDetail();

        service.update(REQUEST_ID, UpdateClassRequest.builder().sessionsPerWeek(3).build(), null);

        verify(jdbcTemplate).update(contains("sessions_per_week  = COALESCE"),
                any(), any(), any(), eq(3), any(), any(), any(), eq(REQUEST_ID));
    }

    @Test
    void update_openRequest_throwsNotEditable() {
        givenRequest("OPEN", null, null, "Lê Hoàng Nam");

        AppException ex = assertThrows(AppException.class,
                () -> service.update(REQUEST_ID, new UpdateClassRequest(), null));

        assertEquals(ErrorCode.CLASS_REQUEST_NOT_EDITABLE, ex.getErrorCode());
    }

    @Test
    void update_newRequestWithoutAccount_keepsStudentOnRequest() {
        givenRequest("NEW", TUTOR_ID, null, null);
        givenDetail();

        service.update(REQUEST_ID, UpdateClassRequest.builder().studentName("Lê Hoàng Nam").build(), null);

        verify(jdbcTemplate).update(contains("student_name          = COALESCE"),
                eq("Lê Hoàng Nam"), any(), any(), any(), eq(REQUEST_ID));
        verify(userRepository, never()).save(any());
    }

    // ------------------------------------------------------- phụ huynh theo SĐT

    @Test
    void create_phoneOfAnotherParent_rejectsWithoutCreatingClass() {
        when(parentResolver.resolve("Lê Thị Hoa", "0984453212"))
                .thenReturn(new ParentResolver.Parent(PARENT_ID, "Phạm Công Minh"));

        AppException ex = assertThrows(AppException.class, () -> service.create(createRequest("Lê Thị Hoa", null), null));

        assertEquals(ErrorCode.PARENT_PHONE_BELONGS_TO_OTHER, ex.getErrorCode());
        verify(auditLogService, never()).log(any(), any(), any(), any(), any(), any());
    }

    @Test
    void create_sameParentInternationalPhone_createsClassForExistingParent() {
        when(parentResolver.resolve("pham cong minh", "0984453212"))
                .thenReturn(new ParentResolver.Parent(PARENT_ID, "Phạm Công Minh"));
        when(jdbcTemplate.queryForObject(contains("INSERT INTO class_requests"), eq(Long.class), any(Object[].class)))
                .thenReturn(REQUEST_ID);
        givenDetail();

        service.create(createRequest("pham cong minh", "+84984453212"), null);

        verify(auditLogService).log(any(), eq("CREATE_CLASS_REQUEST"), eq("CLASS_REQUEST"), eq(REQUEST_ID), any(), any());
    }

    @Test
    void checkParent_nameDiffers_returnsStoredName() {
        when(parentResolver.findByPhone("0984453212"))
                .thenReturn(Optional.of(new ParentResolver.Parent(PARENT_ID, "Phạm Công Minh")));

        ParentCheckResponse result = service.checkParent(new ParentCheckRequest("+84984453212", "Lê Thị Hoa"));

        assertTrue(result.isExists());
        assertFalse(result.isNameMatches());
        assertEquals("Phạm Công Minh", result.getParentName());
    }

    @Test
    void checkParent_unknownPhone_isNotConflict() {
        when(parentResolver.findByPhone("0984453212")).thenReturn(Optional.empty());

        ParentCheckResponse result = service.checkParent(new ParentCheckRequest("0984453212", "Lê Thị Hoa"));

        assertFalse(result.isExists());
        assertTrue(result.isNameMatches());
    }

    // ----------------------------------------------------------------- helper

    private static CreateClassRequest createRequest(String parentName, String phone) {
        return CreateClassRequest.builder()
                .parentName(parentName)
                .phone(phone == null ? "0984453212" : phone)
                .studentName("Lê Hoàng Nam")
                .classRequirement("IELTS 6.5")
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(300000))
                .build();
    }

    private Map<String, Object> givenRequest(String status, Long tutorId, Long studentId, String studentName) {
        Map<String, Object> row = new HashMap<>();
        row.put("id", REQUEST_ID);
        row.put("parent_id", PARENT_ID);
        row.put("requested_tutor_id", tutorId);
        row.put("student_id", studentId);
        row.put("status", status);
        row.put("student_name", studentName);
        row.put("price_per_session", BigDecimal.valueOf(300000));
        when(jdbcTemplate.queryForList(contains("FOR UPDATE"), eq((Object) REQUEST_ID))).thenReturn(List.of(row));
        return row;
    }

    private void givenActiveTutor(Long tutorId) {
        when(tutorRepository.findPublicByIdAndProfileStatus(eq(tutorId), anyString()))
                .thenReturn(Optional.of(new Tutor()));
    }

    private void givenDetail() {
        lenient().when(queryRepository.findDetailById(REQUEST_ID))
                .thenReturn(Optional.of(ClassRequestDetailResponse.builder().id(REQUEST_ID).build()));
    }

    private static ClassSnapshot classWith(String status, LocalDate activeFrom) {
        return new ClassSnapshot(CLASS_ID, TUTOR_ID, STUDENT_ID, "Tiếng Anh lớp 8", status, activeFrom);
    }
}
