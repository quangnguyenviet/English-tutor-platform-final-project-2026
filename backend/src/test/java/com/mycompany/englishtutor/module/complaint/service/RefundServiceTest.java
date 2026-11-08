package com.mycompany.englishtutor.module.complaint.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.complaint.api.response.RefundResponse;
import com.mycompany.englishtutor.module.complaint.domain.Complaint;
import com.mycompany.englishtutor.module.complaint.domain.Refund;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintRepository;
import com.mycompany.englishtutor.module.complaint.repository.RefundRepository;
import com.mycompany.englishtutor.module.payment.config.PaymentProperties;
import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.module.payment.repository.PaymentRepository;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class RefundServiceTest {

    private static final Long REFUND_ID = 40L;
    private static final Long COMPLAINT_ID = 12L;
    private static final Long PAYMENT_ID = 30L;
    private static final Long RECEPTIONIST_ID = 7L;
    private static final Long ACCOUNTANT_ID = 9L;

    @Mock RefundRepository refundRepository;
    @Mock ComplaintRepository complaintRepository;
    @Mock PaymentRepository paymentRepository;
    @Mock ComplaintQueryRepository queryRepository;
    @Mock StorageService storageService;
    @Mock AuditLogService auditLogService;
    @Mock ActorProvider actorProvider;

    RefundService service;
    Refund refund;
    Complaint complaint;

    @BeforeEach
    void setUp() {
        service = new RefundService(refundRepository, complaintRepository, paymentRepository, queryRepository,
                storageService, new PaymentProperties(), auditLogService, actorProvider);
        lenient().when(actorProvider.current())
                .thenReturn(new ActorProvider.Actor(ACCOUNTANT_ID, "Phạm Minh Châu", "ACCOUNTANT"));
        refund = Refund.builder()
                .id(REFUND_ID)
                .complaintId(COMPLAINT_ID)
                .paymentId(PAYMENT_ID)
                .requestedAmount(BigDecimal.valueOf(1_000_000))
                .recipientName("Lê Hoàng Nam")
                .bankName("Vietcombank")
                .bankAccountNumber("0123456789")
                .status(RefundStatus.PENDING)
                .requestedBy(RECEPTIONIST_ID)
                .build();
        complaint = Complaint.builder()
                .id(COMPLAINT_ID)
                .classId(21L)
                .complaintType(ComplaintType.REFUND)
                .complainantRole(ComplainantRole.PARENT)
                .status(ComplaintStatus.PROCESSING)
                .receivedBy(RECEPTIONIST_ID)
                .build();
        lenient().when(refundRepository.findByIdForUpdate(REFUND_ID)).thenReturn(Optional.of(refund));
        lenient().when(complaintRepository.findByIdForUpdate(COMPLAINT_ID)).thenReturn(Optional.of(complaint));
        lenient().when(paymentRepository.findByIdForUpdate(PAYMENT_ID)).thenReturn(Optional.of(Payment.builder()
                .id(PAYMENT_ID).classId(21L).status(PaymentStatus.APPROVED)
                .receivedAmount(BigDecimal.valueOf(2_400_000)).build()));
        lenient().when(queryRepository.findRefund(REFUND_ID))
                .thenReturn(Optional.of(RefundResponse.builder().id(REFUND_ID).build()));
    }

    @Test
    void pay_resolvesComplaintWithGeneratedResolution() {
        when(queryRepository.sumPaidRefunds(PAYMENT_ID, REFUND_ID)).thenReturn(BigDecimal.ZERO);
        when(storageService.uploadFile(anyString(), any(MultipartFile.class))).thenReturn("refunds/proofs/a.png");

        service.pay(REFUND_ID, BigDecimal.valueOf(800_000), proof());

        assertEquals(RefundStatus.PAID, refund.getStatus());
        assertEquals(ACCOUNTANT_ID, refund.getProcessedBy());
        assertEquals(ComplaintStatus.RESOLVED, complaint.getStatus());
        assertTrue(complaint.getResolution().startsWith("Đã hoàn trả 800.000₫ qua ngân hàng Vietcombank ngày "));
        assertTrue(complaint.getResolution().endsWith("bởi Kế toán Phạm Minh Châu."));
        verify(auditLogService).log(eq(ACCOUNTANT_ID), eq("PAY_REFUND"), eq("REFUND"), eq(REFUND_ID), any(), any());
    }

    @Test
    void pay_aboveRequestedAmount_throwsExceeded() {
        when(queryRepository.sumPaidRefunds(PAYMENT_ID, REFUND_ID)).thenReturn(BigDecimal.ZERO);

        AppException ex = assertThrows(AppException.class,
                () -> service.pay(REFUND_ID, BigDecimal.valueOf(1_000_001), proof()));

        assertEquals(ErrorCode.REFUND_AMOUNT_EXCEEDED, ex.getErrorCode());
        verify(storageService, never()).uploadFile(anyString(), any(MultipartFile.class));
    }

    @Test
    void pay_aboveRemainingOfPayment_throwsExceededWithUcMessage() {
        when(queryRepository.sumPaidRefunds(PAYMENT_ID, REFUND_ID)).thenReturn(BigDecimal.valueOf(2_000_000));

        AppException ex = assertThrows(AppException.class,
                () -> service.pay(REFUND_ID, BigDecimal.valueOf(500_000), proof()));

        assertEquals(ErrorCode.REFUND_AMOUNT_EXCEEDED, ex.getErrorCode());
        assertTrue(ex.getMessage().contains("còn lại: 400.000₫"));
    }

    @Test
    void pay_withoutProof_throwsProofRequired() {
        AppException ex = assertThrows(AppException.class,
                () -> service.pay(REFUND_ID, BigDecimal.valueOf(100_000), null));

        assertEquals(ErrorCode.REFUND_PROOF_REQUIRED, ex.getErrorCode());
        verify(refundRepository, never()).findByIdForUpdate(anyLong());
    }

    @Test
    void pay_byRequester_throwsSameActor() {
        when(actorProvider.current()).thenReturn(new ActorProvider.Actor(RECEPTIONIST_ID, "Admin", "ADMIN"));

        AppException ex = assertThrows(AppException.class,
                () -> service.pay(REFUND_ID, BigDecimal.valueOf(100_000), proof()));

        assertEquals(ErrorCode.REFUND_SAME_ACTOR, ex.getErrorCode());
    }

    @Test
    void pay_alreadyPaid_throwsInvalidState() {
        refund.setStatus(RefundStatus.PAID);

        AppException ex = assertThrows(AppException.class,
                () -> service.pay(REFUND_ID, BigDecimal.valueOf(100_000), proof()));

        assertEquals(ErrorCode.REFUND_INVALID_STATE, ex.getErrorCode());
    }

    @Test
    void reject_returnsComplaintToPendingAndNotifiesRequester() {
        service.reject(REFUND_ID, "  Sai số tài khoản  ");

        assertEquals(RefundStatus.REJECTED, refund.getStatus());
        assertEquals("Sai số tài khoản", refund.getRejectReason());
        assertEquals(ComplaintStatus.PENDING, complaint.getStatus());
        verify(queryRepository).notifyUser(eq(RECEPTIONIST_ID), anyString(), anyString(), eq("COMPLAINT"),
                eq(COMPLAINT_ID));
    }

    @Test
    void reject_withoutReason_throwsReasonRequired() {
        AppException ex = assertThrows(AppException.class, () -> service.reject(REFUND_ID, " "));

        assertEquals(ErrorCode.REFUND_REJECT_REASON_REQUIRED, ex.getErrorCode());
    }

    private static MockMultipartFile proof() {
        return new MockMultipartFile("file", "bien-lai.png", "image/png", new byte[] {1, 2, 3});
    }
}
