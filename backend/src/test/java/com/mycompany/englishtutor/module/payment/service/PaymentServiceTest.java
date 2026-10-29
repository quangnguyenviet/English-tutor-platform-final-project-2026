package com.mycompany.englishtutor.module.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.payment.api.response.PaymentResponse;
import com.mycompany.englishtutor.module.payment.config.PaymentProperties;
import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentMethod;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.module.payment.repository.PaymentQueryRepository;
import com.mycompany.englishtutor.module.payment.repository.PaymentQueryRepository.ClassFeeInfo;
import com.mycompany.englishtutor.module.payment.repository.PaymentRepository;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {
    private static final Long PAYMENT_ID = 7L;
    private static final Long CLASS_ID = 3L;
    private static final Long TUTOR_ID = 10L;
    private static final Long RECEPTIONIST_ID = 20L;
    private static final Long ACCOUNTANT_ID = 30L;
    private static final Long ADMIN_ID = 40L;

    @Mock PaymentRepository paymentRepository;
    @Mock PaymentQueryRepository queryRepository;
    @Mock UserRepository userRepository;
    @Mock StorageService storageService;
    @Mock AuditLogService auditLogService;

    PaymentProperties properties = new PaymentProperties();
    PaymentService service;
    Payment payment;

    @BeforeEach
    void setUp() {
        service = new PaymentService(
                paymentRepository, queryRepository, userRepository, storageService, auditLogService, properties);

        payment = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .amount(BigDecimal.valueOf(640_000))
                .status(PaymentStatus.NOT_SUBMITTED)
                .build();

        lenient().when(paymentRepository.findById(PAYMENT_ID)).thenReturn(Optional.of(payment));
        lenient().when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient()
                .when(queryRepository.findClassFeeInfo(CLASS_ID))
                .thenReturn(Optional.of(new ClassFeeInfo(CLASS_ID, TUTOR_ID, BigDecimal.valueOf(200_000), 2)));
        lenient().when(queryRepository.findDetail(PAYMENT_ID)).thenAnswer(inv -> Optional.of(PaymentResponse.builder()
                .id(PAYMENT_ID)
                .tutorId(TUTOR_ID)
                .status(payment.getStatus())
                .build()));
        lenient().when(storageService.uploadFile(any(), any())).thenReturn("http://minio/bucket/payments/proofs/a.png");

        user("tutor", TUTOR_ID, "TUTOR");
        user("letan", RECEPTIONIST_ID, "RECEPTIONIST");
        user("ketoan", ACCOUNTANT_ID, "ACCOUNTANT");
        user("admin", ADMIN_ID, "ADMIN");
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void user(String username, Long id, String role) {
        lenient()
                .when(userRepository.findByUsername(username))
                .thenReturn(Optional.of(User.builder().id(id).username(username).role(role).build()));
    }

    private void loginAs(String username) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(username, null));
    }

    private static MockMultipartFile file(String type, int bytes) {
        return new MockMultipartFile("file", "bienlai", type, new byte[bytes]);
    }

    private void assertError(ErrorCode expected, Runnable action) {
        AppException ex = assertThrows(AppException.class, action::run);
        assertEquals(expected, ex.getErrorCode());
    }

    // ---- createForClass ----

    @Test
    void createForClass_creates40PercentNotSubmittedPayment() {
        when(paymentRepository.findFirstByClassIdAndPayerType(CLASS_ID, PayerType.TUTOR))
                .thenReturn(Optional.empty());
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(PAYMENT_ID);
            return p;
        });
        loginAs("tutor");

        service.createForClass(CLASS_ID);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.NOT_SUBMITTED);
        assertThat(saved.getPayerType()).isEqualTo(PayerType.TUTOR);
        assertThat(saved.getFeePercentage()).isEqualByComparingTo("40");
        assertThat(saved.getAmount()).isEqualByComparingTo("640000");
        verify(auditLogService).log(eq(TUTOR_ID), eq("CREATE_PAYMENT"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void createForClass_isIdempotent() {
        when(paymentRepository.findFirstByClassIdAndPayerType(CLASS_ID, PayerType.TUTOR))
                .thenReturn(Optional.of(payment));

        service.createForClass(CLASS_ID);

        verify(paymentRepository, never()).saveAndFlush(any());
    }

    @Test
    void createForClass_classWithoutScheduleIsRejected() {
        when(paymentRepository.findFirstByClassIdAndPayerType(CLASS_ID, PayerType.TUTOR))
                .thenReturn(Optional.empty());
        when(queryRepository.findClassFeeInfo(CLASS_ID))
                .thenReturn(Optional.of(new ClassFeeInfo(CLASS_ID, TUTOR_ID, BigDecimal.valueOf(200_000), 0)));

        assertError(ErrorCode.PAYMENT_CLASS_INCOMPLETE, () -> service.createForClass(CLASS_ID));
    }

    // ---- draft payment lifecycle (kế hoạch Phase 1, mục 4.1.2 / 4.5) ----

    @Test
    void createDraftForClass_createsNewPaymentWithNullAmountAndSnapshot() {
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.empty());
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(PAYMENT_ID);
            return p;
        });
        loginAs("letan");

        service.createDraftForClass(CLASS_ID, BigDecimal.valueOf(40), BigDecimal.valueOf(300_000));

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.NEW);
        assertThat(saved.getAmount()).isNull();
        assertThat(saved.getFeePercentage()).isEqualByComparingTo("40");
        verify(auditLogService)
                .log(eq(RECEPTIONIST_ID), eq("CREATE_PAYMENT_DRAFT"), eq("PAYMENT"), any(), any(), any());
    }

    @Test
    void createDraftForClass_nullFeeFallsBackToDefaultPercentage() {
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.empty());
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(PAYMENT_ID);
            return p;
        });

        service.createDraftForClass(CLASS_ID, null, BigDecimal.valueOf(300_000));

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getFeePercentage())
                .isEqualByComparingTo(String.valueOf(properties.getDefaultFeePercentage()));
    }

    @Test
    void createDraftForClass_isIdempotentPerClass() {
        Payment draft = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .status(PaymentStatus.NEW)
                .build();
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.of(draft));
        lenient().when(queryRepository.findDetail(PAYMENT_ID))
                .thenReturn(Optional.of(PaymentResponse.builder()
                        .id(PAYMENT_ID)
                        .tutorId(TUTOR_ID)
                        .status(PaymentStatus.NEW)
                        .build()));

        service.createDraftForClass(CLASS_ID, BigDecimal.valueOf(40), BigDecimal.valueOf(300_000));

        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void createForClassWithFeeInfo_activatesDraftAndComputesAmount() {
        Payment draft = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .status(PaymentStatus.NEW)
                .build();
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.of(draft));
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NOT_SUBMITTED))
                .thenReturn(Optional.empty());
        lenient().when(queryRepository.findDetail(PAYMENT_ID))
                .thenReturn(Optional.of(PaymentResponse.builder()
                        .id(PAYMENT_ID)
                        .tutorId(TUTOR_ID)
                        .status(PaymentStatus.NOT_SUBMITTED)
                        .build()));
        loginAs("letan");

        service.createForClassWithFeeInfo(
                CLASS_ID, BigDecimal.valueOf(40), 2, BigDecimal.valueOf(300_000));

        assertThat(draft.getStatus()).isEqualTo(PaymentStatus.NOT_SUBMITTED);
        // 40% x 2 buoi/tuan x 4 tuan x 300.000dong = 960.000dong (FeeCalculator).
        assertThat(draft.getAmount()).isEqualByComparingTo("960000");
        verify(auditLogService)
                .log(eq(RECEPTIONIST_ID), eq("ACTIVATE_PAYMENT"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void createForClassWithFeeInfo_noDraftForLegacyDataCreatesNotSubmitted() {
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NOT_SUBMITTED))
                .thenReturn(Optional.empty());
        when(paymentRepository.saveAndFlush(any(Payment.class))).thenAnswer(inv -> {
            Payment p = inv.getArgument(0);
            p.setId(PAYMENT_ID);
            return p;
        });
        lenient().when(queryRepository.findDetail(PAYMENT_ID))
                .thenReturn(Optional.of(PaymentResponse.builder()
                        .id(PAYMENT_ID)
                        .tutorId(TUTOR_ID)
                        .status(PaymentStatus.NOT_SUBMITTED)
                        .build()));
        loginAs("admin");

        service.createForClassWithFeeInfo(
                CLASS_ID, BigDecimal.valueOf(40), 2, BigDecimal.valueOf(300_000));

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).saveAndFlush(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.NOT_SUBMITTED);
        assertThat(saved.getAmount()).isEqualByComparingTo("960000");
        verify(auditLogService)
                .log(eq(ADMIN_ID), eq("CREATE_PAYMENT"), eq("PAYMENT"), any(), any(), any());
    }

    @Test
    void createForClassWithFeeInfo_feeOverrideReplacesSnapshot() {
        Payment draft = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .status(PaymentStatus.NEW)
                .build();
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.of(draft));
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NOT_SUBMITTED))
                .thenReturn(Optional.empty());
        loginAs("letan");

        service.createForClassWithFeeInfo(
                CLASS_ID, BigDecimal.valueOf(30), 2, BigDecimal.valueOf(300_000));

        assertThat(draft.getFeePercentage()).isEqualByComparingTo("30");
        // 30% x 2 x 4 x 300.000 = 720.000dong.
        assertThat(draft.getAmount()).isEqualByComparingTo("720000");
    }

    @Test
    void createForClassWithFeeInfo_incompleteDataIsRejected() {
        assertError(ErrorCode.CLASS_FEE_INCOMPLETE,
                () -> service.createForClassWithFeeInfo(CLASS_ID, BigDecimal.valueOf(40), 0, BigDecimal.valueOf(300_000)));
        assertError(ErrorCode.CLASS_FEE_INCOMPLETE,
                () -> service.createForClassWithFeeInfo(CLASS_ID, BigDecimal.valueOf(40), 2, null));
        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void createForClassWithFeeInfo_alreadyActivatedKeepsPayment() {
        Payment activated = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .amount(BigDecimal.valueOf(960_000))
                .status(PaymentStatus.NOT_SUBMITTED)
                .build();
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NOT_SUBMITTED))
                .thenReturn(Optional.of(activated));
        lenient().when(queryRepository.findDetail(PAYMENT_ID))
                .thenReturn(Optional.of(PaymentResponse.builder()
                        .id(PAYMENT_ID)
                        .tutorId(TUTOR_ID)
                        .status(PaymentStatus.NOT_SUBMITTED)
                        .build()));

        service.createForClassWithFeeInfo(
                CLASS_ID, BigDecimal.valueOf(40), 2, BigDecimal.valueOf(300_000));

        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    @Test
    void cancelDraftPayment_cancelsNewDraftWithAudit() {
        Payment draft = Payment.builder()
                .id(PAYMENT_ID)
                .classId(CLASS_ID)
                .payerType(PayerType.TUTOR)
                .feePercentage(BigDecimal.valueOf(40))
                .status(PaymentStatus.NEW)
                .build();
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.of(draft));
        loginAs("letan");

        service.cancelDraftPayment(CLASS_ID);

        assertThat(draft.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        verify(auditLogService)
                .log(eq(RECEPTIONIST_ID), eq("CANCEL_PAYMENT_DRAFT"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void cancelDraftPayment_withoutDraftDoesNothing() {
        when(paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(CLASS_ID, PayerType.TUTOR, PaymentStatus.NEW))
                .thenReturn(Optional.empty());

        service.cancelDraftPayment(CLASS_ID);

        verify(paymentRepository, never()).saveAndFlush(any(Payment.class));
    }

    // ---- fee percentage ----

    @Test
    void updateFeePercentage_recalculatesAmountForReceptionist() {
        loginAs("letan");

        service.updateFeePercentage(PAYMENT_ID, BigDecimal.valueOf(35));

        assertThat(payment.getFeePercentage()).isEqualByComparingTo("35");
        assertThat(payment.getAmount()).isEqualByComparingTo("560000");
        verify(auditLogService)
                .log(eq(RECEPTIONIST_ID), eq("UPDATE_FEE_RATE"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void updateFeePercentage_acceptsBoundaries0And50() {
        loginAs("admin");

        service.updateFeePercentage(PAYMENT_ID, BigDecimal.ZERO);
        assertThat(payment.getAmount()).isEqualByComparingTo("0");

        service.updateFeePercentage(PAYMENT_ID, BigDecimal.valueOf(50));
        assertThat(payment.getAmount()).isEqualByComparingTo("800000");
    }

    @Test
    void updateFeePercentage_outOfRangeIsRejected() {
        loginAs("letan");

        assertError(ErrorCode.FEE_PERCENTAGE_OUT_OF_RANGE,
                () -> service.updateFeePercentage(PAYMENT_ID, BigDecimal.valueOf(51)));
        assertError(ErrorCode.FEE_PERCENTAGE_OUT_OF_RANGE,
                () -> service.updateFeePercentage(PAYMENT_ID, BigDecimal.valueOf(-1)));
    }

    @Test
    void updateFeePercentage_afterProofSubmittedIsConflict() {
        payment.setStatus(PaymentStatus.SUBMITTED);
        loginAs("letan");

        assertError(ErrorCode.PAYMENT_INVALID_STATE,
                () -> service.updateFeePercentage(PAYMENT_ID, BigDecimal.valueOf(40)));
    }

    // ---- proof ----

    @Test
    void submitProof_byOwnerTutorMovesToSubmitted() {
        loginAs("tutor");

        service.submitProof(PAYMENT_ID, file("image/png", 1024), null);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUBMITTED);
        assertThat(payment.getUploadedBy()).isEqualTo(TUTOR_ID);
        assertThat(payment.getPaymentMethod()).isEqualTo(PaymentMethod.BANK_TRANSFER);
        assertThat(payment.getProofUrl()).isNotNull();
    }

    @Test
    void submitProof_byOtherTutorIsDenied() {
        user("tutor2", 11L, "TUTOR");
        loginAs("tutor2");

        assertError(ErrorCode.PAYMENT_ACCESS_DENIED,
                () -> service.submitProof(PAYMENT_ID, file("image/png", 1024), null));
    }

    @Test
    void submitProof_tutorCannotUseCash() {
        loginAs("tutor");

        assertError(ErrorCode.PAYMENT_METHOD_NOT_ALLOWED,
                () -> service.submitProof(PAYMENT_ID, file("image/png", 1024), PaymentMethod.CASH));
    }

    @Test
    void submitProof_receptionistAndAdminCanSubmitOnBehalf() {
        loginAs("letan");
        service.submitProof(PAYMENT_ID, file("application/pdf", 1024), PaymentMethod.BANK_TRANSFER);
        assertThat(payment.getUploadedBy()).isEqualTo(RECEPTIONIST_ID);

        payment.setStatus(PaymentStatus.RESUBMIT_REQUIRED);
        loginAs("admin");
        service.submitProof(PAYMENT_ID, file("image/jpeg", 1024), null);
        assertThat(payment.getUploadedBy()).isEqualTo(ADMIN_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> details = ArgumentCaptor.forClass(Map.class);
        verify(auditLogService).log(eq(ADMIN_ID), eq("SUBMIT_PAYMENT_PROOF"), any(), eq(PAYMENT_ID), details.capture(), any());
        assertThat(details.getValue()).containsEntry("onBehalfOf", PayerType.TUTOR);
    }

    @Test
    void collectProof_recordsReceptionistAsUploaderWithCashByDefault() {
        loginAs("letan");

        service.collectProof(PAYMENT_ID, file("image/png", 1024), null);

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUBMITTED);
        assertThat(payment.getPaymentMethod()).isEqualTo(PaymentMethod.CASH);
        assertThat(payment.getUploadedBy()).isEqualTo(RECEPTIONIST_ID);
        verify(auditLogService)
                .log(eq(RECEPTIONIST_ID), eq("COLLECT_PAYMENT_PROOF"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void submitProof_invalidTypeOrTooLargeIsRejected() {
        loginAs("tutor");

        assertError(ErrorCode.FILE_INVALID_TYPE,
                () -> service.submitProof(PAYMENT_ID, file("application/zip", 1024), null));
        assertError(ErrorCode.FILE_TOO_LARGE,
                () -> service.submitProof(PAYMENT_ID, file("image/png", 5 * 1024 * 1024 + 1), null));
        assertError(ErrorCode.PAYMENT_PROOF_REQUIRED, () -> service.submitProof(PAYMENT_ID, null, null));
        verify(storageService, never()).uploadFile(any(), any());
    }

    @Test
    void submitProof_whenAlreadySubmittedIsConflict() {
        payment.setStatus(PaymentStatus.SUBMITTED);
        loginAs("tutor");

        assertError(ErrorCode.PAYMENT_INVALID_STATE,
                () -> service.submitProof(PAYMENT_ID, file("image/png", 1024), null));
    }

    @Test
    void resubmit_clearsPreviousReviewResult() {
        payment.setStatus(PaymentStatus.RESUBMIT_REQUIRED);
        payment.setReviewedBy(ACCOUNTANT_ID);
        payment.setReceivedAmount(BigDecimal.valueOf(100_000));
        payment.setRejectReason("thiếu");
        loginAs("tutor");

        service.submitProof(PAYMENT_ID, file("image/png", 1024), null);

        assertThat(payment.getReviewedBy()).isNull();
        assertThat(payment.getReceivedAmount()).isNull();
        assertThat(payment.getRejectReason()).isNull();
    }

    // ---- approve / resubmit ----

    private void submittedBy(Long uploaderId) {
        payment.setStatus(PaymentStatus.SUBMITTED);
        payment.setUploadedBy(uploaderId);
    }

    @Test
    void approve_enoughMoneyBecomesApprovedWithReviewer() {
        submittedBy(TUTOR_ID);
        loginAs("ketoan");

        service.approve(PAYMENT_ID, BigDecimal.valueOf(640_000));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(payment.getReviewedBy()).isEqualTo(ACCOUNTANT_ID);
        assertThat(payment.getReviewedAt()).isNotNull();
        verify(auditLogService)
                .log(eq(ACCOUNTANT_ID), eq("APPROVE_PAYMENT"), eq("PAYMENT"), eq(PAYMENT_ID), any(), any());
    }

    @Test
    void approve_shortMoneyRequiresResubmitWithReason() {
        submittedBy(TUTOR_ID);
        loginAs("ketoan");

        service.approve(PAYMENT_ID, BigDecimal.valueOf(500_000));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.RESUBMIT_REQUIRED);
        assertThat(payment.getReceivedAmount()).isEqualByComparingTo("500000");
        assertThat(payment.getRejectReason()).contains("500.000đ").contains("640.000đ");
    }

    @Test
    void approve_sameUserWhoCollectedIsRejected() {
        submittedBy(RECEPTIONIST_ID);
        user("letan-ketoan", RECEPTIONIST_ID, "ADMIN");
        loginAs("letan-ketoan");

        assertError(ErrorCode.PAYMENT_SAME_ACTOR, () -> service.approve(PAYMENT_ID, BigDecimal.valueOf(640_000)));
        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.SUBMITTED);
    }

    @Test
    void approve_adminCanApproveSomeoneElsesProof() {
        submittedBy(RECEPTIONIST_ID);
        loginAs("admin");

        service.approve(PAYMENT_ID, BigDecimal.valueOf(700_000));

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(payment.getReviewedBy()).isEqualTo(ADMIN_ID);
    }

    @Test
    void approve_onlyWhenSubmitted() {
        loginAs("ketoan");

        assertError(ErrorCode.PAYMENT_INVALID_STATE, () -> service.approve(PAYMENT_ID, BigDecimal.valueOf(640_000)));
    }

    @Test
    void requestResubmit_setsReasonAndStatus() {
        submittedBy(TUTOR_ID);
        loginAs("ketoan");

        service.requestResubmit(PAYMENT_ID, " Ảnh mờ ");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.RESUBMIT_REQUIRED);
        assertThat(payment.getRejectReason()).isEqualTo("Ảnh mờ");
        assertThat(payment.getReviewedBy()).isEqualTo(ACCOUNTANT_ID);
    }

    @Test
    void requestResubmit_requiresReason() {
        submittedBy(TUTOR_ID);
        loginAs("ketoan");

        assertError(ErrorCode.RESUBMIT_REASON_REQUIRED, () -> service.requestResubmit(PAYMENT_ID, "  "));
    }

    // ---- detail ----

    @Test
    void getDetail_tutorCannotSeeOtherTutorsPayment() {
        user("tutor2", 11L, "TUTOR");
        loginAs("tutor2");

        assertError(ErrorCode.PAYMENT_ACCESS_DENIED, () -> service.getDetail(PAYMENT_ID));
    }

    @Test
    void getDetail_unknownPaymentIsNotFound() {
        loginAs("admin");
        when(queryRepository.findDetail(anyLong())).thenReturn(Optional.empty());

        assertError(ErrorCode.PAYMENT_NOT_FOUND, () -> service.getDetail(999L));
    }
}
