package com.mycompany.englishtutor.module.complaint.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.complaint.api.request.ComplaintCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.request.RefundCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintResponse;
import com.mycompany.englishtutor.module.complaint.domain.Complaint;
import com.mycompany.englishtutor.module.complaint.domain.ComplaintAttachment;
import com.mycompany.englishtutor.module.complaint.domain.Refund;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintAttachmentRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository.ClassInfo;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintRepository;
import com.mycompany.englishtutor.module.complaint.repository.RefundRepository;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.TargetState;
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.repository.StaffClassRequestQueryRepository;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.payment.config.PaymentProperties;
import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.module.payment.repository.PaymentRepository;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    private static final Long COMPLAINT_ID = 12L;
    private static final Long REQUEST_ID = 5L;
    private static final Long CLASS_ID = 21L;
    private static final Long RECEPTIONIST_ID = 7L;

    @Mock ComplaintRepository complaintRepository;
    @Mock ComplaintAttachmentRepository attachmentRepository;
    @Mock RefundRepository refundRepository;
    @Mock ComplaintQueryRepository queryRepository;
    @Mock StaffClassRequestQueryRepository classRequestQueryRepository;
    @Mock StaffClassRequestService classRequestService;
    @Mock PaymentRepository paymentRepository;
    @Mock StorageService storageService;
    @Mock AuditLogService auditLogService;
    @Mock ActorProvider actorProvider;

    PaymentProperties fileProperties = new PaymentProperties();
    ComplaintService service;

    @BeforeEach
    void setUp() {
        service = new ComplaintService(complaintRepository, attachmentRepository, refundRepository, queryRepository,
                classRequestQueryRepository, classRequestService, paymentRepository, storageService, fileProperties,
                auditLogService, actorProvider);
        lenient().when(actorProvider.current())
                .thenReturn(new ActorProvider.Actor(RECEPTIONIST_ID, "Nguyễn Thu Hà", "RECEPTIONIST"));
        lenient().when(queryRepository.findComplaint(anyLong()))
                .thenReturn(Optional.of(ComplaintResponse.builder().id(COMPLAINT_ID)
                        .classRequestId(REQUEST_ID).complaintType("NON_REFUND").build()));
        lenient().when(queryRepository.loadTargetState(anyLong(), any()))
                .thenReturn(new TargetState("OPEN", null, null, null, null));
        lenient().when(complaintRepository.saveAndFlush(any(Complaint.class))).thenAnswer(inv -> {
            Complaint c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(COMPLAINT_ID);
            }
            return c;
        });
    }

    // ----------------------------------------------------------------- create

    @Test
    void create_nonRefundOnOpenRequest_savesPendingWithoutClass() {
        when(queryRepository.findRequestStatus(REQUEST_ID)).thenReturn(Optional.of("OPEN"));
        when(queryRepository.findLatestClass(REQUEST_ID)).thenReturn(Optional.empty());

        service.create(createRequest(ComplaintType.NON_REFUND));

        ArgumentCaptor<Complaint> saved = ArgumentCaptor.forClass(Complaint.class);
        verify(complaintRepository).saveAndFlush(saved.capture());
        assertEquals(ComplaintStatus.PENDING, saved.getValue().getStatus());
        assertEquals(null, saved.getValue().getClassId());
        assertEquals(RECEPTIONIST_ID, saved.getValue().getReceivedBy());
        verify(classRequestService, never()).cancel(anyLong(), any(), any());
        verify(auditLogService).log(eq(RECEPTIONIST_ID), eq("CREATE_COMPLAINT"), eq("COMPLAINT"), eq(COMPLAINT_ID),
                any(), any());
    }

    @Test
    void create_nonRefundOnActiveClassAfterSevenDays_throwsWindowExpired() {
        when(queryRepository.findRequestStatus(REQUEST_ID)).thenReturn(Optional.of("MATCHED"));
        when(queryRepository.findLatestClass(REQUEST_ID)).thenReturn(Optional.of(
                classInfo("ACTIVE", "AT_HOME", MatchingLifecycleSupport.today().minusDays(8))));

        AppException ex = assertThrows(AppException.class,
                () -> service.create(createRequest(ComplaintType.NON_REFUND)));

        assertEquals(ErrorCode.COMPLAINT_WINDOW_EXPIRED, ex.getErrorCode());
        verify(complaintRepository, never()).saveAndFlush(any());
    }

    @Test
    void create_nonRefundOnCancelledRequest_throwsNotProcessable() {
        when(queryRepository.findRequestStatus(REQUEST_ID)).thenReturn(Optional.of("CANCELLED"));

        AppException ex = assertThrows(AppException.class,
                () -> service.create(createRequest(ComplaintType.NON_REFUND)));

        assertEquals(ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE, ex.getErrorCode());
    }

    @Test
    void create_refundOnAtHomeClass_throwsNotOnline() {
        when(queryRepository.findRequestStatus(REQUEST_ID)).thenReturn(Optional.of("MATCHED"));
        when(queryRepository.findLatestClass(REQUEST_ID))
                .thenReturn(Optional.of(classInfo("ACTIVE", "AT_HOME", LocalDate.now())));

        AppException ex = assertThrows(AppException.class, () -> service.create(createRequest(ComplaintType.REFUND)));

        assertEquals(ErrorCode.REFUND_CLASS_NOT_ONLINE, ex.getErrorCode());
    }

    @Test
    void create_refundOnOnlineClass_recordsClass() {
        when(queryRepository.findRequestStatus(REQUEST_ID)).thenReturn(Optional.of("MATCHED"));
        when(queryRepository.findLatestClass(REQUEST_ID))
                .thenReturn(Optional.of(classInfo("ACTIVE", "ONLINE", LocalDate.now().minusDays(20))));

        service.create(createRequest(ComplaintType.REFUND));

        ArgumentCaptor<Complaint> saved = ArgumentCaptor.forClass(Complaint.class);
        verify(complaintRepository).saveAndFlush(saved.capture());
        assertEquals(CLASS_ID, saved.getValue().getClassId());
    }

    // ---------------------------------------------------------------- resolve

    @Test
    void resolve_openRequest_cancelsClassAndResolves() {
        Complaint complaint = givenPending(ComplaintType.NON_REFUND, null);

        service.resolve(COMPLAINT_ID, null, "Đã xác nhận với gia sư", null);

        ArgumentCaptor<CancelClassRequest> reason = ArgumentCaptor.forClass(CancelClassRequest.class);
        verify(classRequestService).cancel(eq(REQUEST_ID), reason.capture(), any());
        assertEquals("Giải quyết khiếu nại KN-12: Đã xác nhận với gia sư", reason.getValue().getReason());
        assertEquals(ComplaintStatus.RESOLVED, complaint.getStatus());
        assertEquals(RequestOutcome.CANCELLED, complaint.getRequestOutcome());
        assertEquals(RECEPTIONIST_ID, complaint.getResolvedBy());
        verify(auditLogService).log(eq(RECEPTIONIST_ID), eq("RESOLVE_COMPLAINT"), eq("COMPLAINT"), eq(COMPLAINT_ID),
                any(), any());
    }

    @Test
    void resolve_trialRematch_callsRematchAllowingActive() {
        Complaint complaint = givenPending(ComplaintType.NON_REFUND, CLASS_ID);
        when(queryRepository.loadTargetState(REQUEST_ID, CLASS_ID))
                .thenReturn(new TargetState("MATCHED", "TRIAL", null, CLASS_ID, "TRIAL"));

        service.resolve(COMPLAINT_ID, RequestOutcome.REMATCH, "Phụ huynh muốn đổi gia sư", null);

        verify(classRequestService).rematchClass(eq(REQUEST_ID), anyString(), eq(true), any());
        verify(classRequestService, never()).cancel(anyLong(), any(), any());
        assertEquals(RequestOutcome.REMATCH, complaint.getRequestOutcome());
    }

    @Test
    void resolve_manuallyCancelledWithoutEvidence_throwsAndChangesNothing() {
        Complaint complaint = givenPending(ComplaintType.NON_REFUND, null);
        when(queryRepository.loadTargetState(REQUEST_ID, null))
                .thenReturn(new TargetState("CANCELLED", null, null, null, null));

        AppException ex = assertThrows(AppException.class,
                () -> service.resolve(COMPLAINT_ID, RequestOutcome.CANCELLED, "Đã hủy ở trang lớp", null));

        assertEquals(ErrorCode.COMPLAINT_EVIDENCE_REQUIRED, ex.getErrorCode());
        assertEquals(ComplaintStatus.PENDING, complaint.getStatus());
        verify(classRequestService, never()).cancel(anyLong(), any(), any());
    }

    @Test
    void resolve_manuallyCancelledWithEvidence_onlyClosesComplaint() {
        Complaint complaint = givenPending(ComplaintType.NON_REFUND, null);
        when(queryRepository.loadTargetState(REQUEST_ID, null))
                .thenReturn(new TargetState("CANCELLED", null, null, null, null));
        when(storageService.uploadFile(anyString(), any(MultipartFile.class))).thenReturn("complaints/evidence/a.png");

        service.resolve(COMPLAINT_ID, null, "Đã hủy ở trang lớp", List.of(image()));

        verify(classRequestService, never()).cancel(anyLong(), any(), any());
        verify(classRequestService, never()).rematchClass(anyLong(), anyString(), eq(true), any());
        verify(attachmentRepository).save(any(ComplaintAttachment.class));
        assertEquals(ComplaintStatus.RESOLVED, complaint.getStatus());
        assertEquals(RequestOutcome.CANCELLED, complaint.getRequestOutcome());
    }

    @Test
    void resolve_withoutResolution_throwsBeforeLocking() {
        AppException ex = assertThrows(AppException.class,
                () -> service.resolve(COMPLAINT_ID, null, "  ", null));

        assertEquals(ErrorCode.COMPLAINT_RESOLUTION_REQUIRED, ex.getErrorCode());
        verify(complaintRepository, never()).findByIdForUpdate(anyLong());
    }

    @Test
    void resolve_refundComplaint_throwsTypeMismatch() {
        givenPending(ComplaintType.REFUND, CLASS_ID);

        AppException ex = assertThrows(AppException.class,
                () -> service.resolve(COMPLAINT_ID, null, "Kết quả", null));

        assertEquals(ErrorCode.COMPLAINT_TYPE_MISMATCH, ex.getErrorCode());
    }

    @Test
    void resolve_alreadyResolved_throwsInvalidState() {
        Complaint complaint = givenPending(ComplaintType.NON_REFUND, null);
        complaint.setStatus(ComplaintStatus.RESOLVED);

        AppException ex = assertThrows(AppException.class,
                () -> service.resolve(COMPLAINT_ID, null, "Kết quả", null));

        assertEquals(ErrorCode.COMPLAINT_INVALID_STATE, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- refund

    @Test
    void createRefundRequest_movesComplaintToProcessing() {
        Complaint complaint = givenPending(ComplaintType.REFUND, CLASS_ID);
        when(paymentRepository.findById(30L)).thenReturn(Optional.of(approvedPayment()));
        when(queryRepository.sumPaidRefunds(30L, null)).thenReturn(BigDecimal.valueOf(500_000));
        when(refundRepository.saveAndFlush(any(Refund.class))).thenAnswer(inv -> {
            Refund r = inv.getArgument(0);
            r.setId(40L);
            return r;
        });

        service.createRefundRequest(COMPLAINT_ID, refundRequest(1_900_000));

        assertEquals(ComplaintStatus.PROCESSING, complaint.getStatus());
        verify(queryRepository).notifyRole(eq("ACCOUNTANT"), anyString(), anyString(), eq("REFUND"), eq(40L));
    }

    @Test
    void createRefundRequest_overRemaining_throwsAmountExceeded() {
        givenPending(ComplaintType.REFUND, CLASS_ID);
        when(paymentRepository.findById(30L)).thenReturn(Optional.of(approvedPayment()));
        when(queryRepository.sumPaidRefunds(30L, null)).thenReturn(BigDecimal.valueOf(500_000));

        AppException ex = assertThrows(AppException.class,
                () -> service.createRefundRequest(COMPLAINT_ID, refundRequest(1_900_001)));

        assertEquals(ErrorCode.REFUND_AMOUNT_EXCEEDED, ex.getErrorCode());
        verify(refundRepository, never()).saveAndFlush(any());
    }

    @Test
    void createRefundRequest_paymentOfOtherClass_throwsPaymentInvalid() {
        givenPending(ComplaintType.REFUND, 99L);
        when(paymentRepository.findById(30L)).thenReturn(Optional.of(approvedPayment()));

        AppException ex = assertThrows(AppException.class,
                () -> service.createRefundRequest(COMPLAINT_ID, refundRequest(100_000)));

        assertEquals(ErrorCode.REFUND_PAYMENT_INVALID, ex.getErrorCode());
    }

    @Test
    void createRefundRequest_whenOpenRefundExists_throwsAlreadyExists() {
        givenPending(ComplaintType.REFUND, CLASS_ID);
        when(refundRepository.existsByComplaintIdAndStatusIn(eq(COMPLAINT_ID), any())).thenReturn(true);

        AppException ex = assertThrows(AppException.class,
                () -> service.createRefundRequest(COMPLAINT_ID, refundRequest(100_000)));

        assertEquals(ErrorCode.REFUND_ALREADY_EXISTS, ex.getErrorCode());
    }

    // ----------------------------------------------------------------- helper

    private Complaint givenPending(ComplaintType type, Long classId) {
        Complaint complaint = Complaint.builder()
                .id(COMPLAINT_ID)
                .classRequestId(REQUEST_ID)
                .classId(classId)
                .complaintType(type)
                .status(ComplaintStatus.PENDING)
                .receivedBy(RECEPTIONIST_ID)
                .build();
        when(complaintRepository.findByIdForUpdate(COMPLAINT_ID)).thenReturn(Optional.of(complaint));
        return complaint;
    }

    private static ComplaintCreateRequest createRequest(ComplaintType type) {
        return ComplaintCreateRequest.builder()
                .complainantName("Lê Hoàng Nam")
                .complainantPhone("0912345678")
                .complainantRole(ComplainantRole.PARENT)
                .complaintType(type)
                .classRequestId(REQUEST_ID)
                .complaintContent("Gia sư thường xuyên đến muộn")
                .build();
    }

    private static ClassInfo classInfo(String status, String mode, LocalDate activeFrom) {
        return new ClassInfo(CLASS_ID, status, mode, activeFrom, 3L, 8L, "Tiếng Anh lớp 8");
    }

    private static Payment approvedPayment() {
        return Payment.builder()
                .id(30L)
                .classId(CLASS_ID)
                .status(PaymentStatus.APPROVED)
                .amount(BigDecimal.valueOf(2_400_000))
                .receivedAmount(BigDecimal.valueOf(2_400_000))
                .build();
    }

    private static RefundCreateRequest refundRequest(long amount) {
        return RefundCreateRequest.builder()
                .paymentId(30L)
                .requestedAmount(BigDecimal.valueOf(amount))
                .recipientName("Lê Hoàng Nam")
                .bankName("Vietcombank")
                .bankAccountNumber("0123456789")
                .build();
    }

    private static MockMultipartFile image() {
        return new MockMultipartFile("files", "bien-ban.png", "image/png", new byte[] {1, 2, 3});
    }
}
