package com.mycompany.englishtutor.module.complaint.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.complaint.api.request.ComplaintCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.request.ComplaintUpdateRequest;
import com.mycompany.englishtutor.module.complaint.api.request.RefundCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintAttachmentResponse;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintDetailResponse;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintResponse;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintTargetResponse;
import com.mycompany.englishtutor.module.complaint.api.response.RefundResponse;
import com.mycompany.englishtutor.module.complaint.domain.Complaint;
import com.mycompany.englishtutor.module.complaint.domain.ComplaintAttachment;
import com.mycompany.englishtutor.module.complaint.domain.Refund;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintAttachmentRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository.ClassInfo;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintRepository;
import com.mycompany.englishtutor.module.complaint.repository.RefundRepository;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.Decision;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.Evaluation;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.TargetState;
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.repository.StaffClassRequestQueryRepository;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.payment.config.PaymentProperties;
import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.module.payment.repository.PaymentRepository;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ khiếu nại tại quầy (FR-35 đến FR-37, UC-REC-14/15/16, UC-ADM-13/14/15).
 *
 * <p>Khiếu nại luôn gắn một lớp cần gia sư. Loại không hoàn tiền được Lễ tân giải quyết bằng Hủy lớp hoặc
 * Ghép lại, theo {@link ComplaintTargetEvaluator}. Loại hoàn tiền chuyển sang Kế toán qua {@link Refund}.
 * Mọi thao tác ghi audit trong cùng transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComplaintService {

    static final String ENTITY_TYPE = "COMPLAINT";
    static final String EVIDENCE_FOLDER = "complaints/evidence";
    static final int MAX_EVIDENCE_FILES = 5;

    ComplaintRepository complaintRepository;
    ComplaintAttachmentRepository attachmentRepository;
    RefundRepository refundRepository;
    ComplaintQueryRepository queryRepository;
    StaffClassRequestQueryRepository classRequestQueryRepository;
    StaffClassRequestService classRequestService;
    PaymentRepository paymentRepository;
    StorageService storageService;
    PaymentProperties fileProperties;
    AuditLogService auditLogService;
    ActorProvider actorProvider;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public PageResponse<ComplaintResponse> search(
            ComplaintStatus status, ComplaintType type, String keyword, int page, int size) {
        return queryRepository.search(status, type, keyword, Math.max(0, page), Math.max(1, Math.min(size, 100)));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> counts() {
        return queryRepository.countByStatus();
    }

    @Transactional(readOnly = true)
    public ComplaintDetailResponse getDetail(Long id) {
        ComplaintResponse complaint = queryRepository.findComplaint(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPLAINT_NOT_FOUND));

        List<ComplaintAttachmentResponse> attachments = attachmentRepository.findByComplaintIdOrderByIdAsc(id)
                .stream()
                .map(a -> ComplaintAttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .fileUrl(presign(a.getFileUrl()))
                        .createdAt(a.getCreatedAt())
                        .build())
                .toList();

        List<RefundResponse> refunds = queryRepository.findRefundsOfComplaint(id);
        refunds.forEach(r -> r.setProofUrl(presign(r.getProofUrl())));

        boolean refund = ComplaintType.REFUND.name().equals(complaint.getComplaintType());
        return ComplaintDetailResponse.builder()
                .complaint(complaint)
                .target(buildTarget(complaint.getClassRequestId(), complaint.getClassId()))
                .attachments(attachments)
                .refunds(refunds)
                .refundablePayments(refund ? queryRepository.findRefundablePayments(complaint.getClassId()) : List.of())
                .build();
    }

    // ----------------------------------------------------------------- WRITE

    /** Tạo đơn ở {@code PENDING}. Chỉ lưu khiếu nại, lớp chưa đổi trạng thái (UC-REC-14). */
    @Transactional
    public ComplaintDetailResponse create(ComplaintCreateRequest request) {
        ActorProvider.Actor actor = actorProvider.current();
        Long classRequestId = request.getClassRequestId();
        String requestStatus = queryRepository.findRequestStatus(classRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
        ClassInfo latestClass = queryRepository.findLatestClass(classRequestId).orElse(null);

        Long classId;
        if (request.getComplaintType() == ComplaintType.REFUND) {
            // Hoàn tiền vẫn nhận lớp đã hủy: phụ huynh lớp Online thường khiếu nại hoàn tiền sau khi lớp dừng.
            if (latestClass == null || !"ONLINE".equalsIgnoreCase(latestClass.teachingMode())) {
                throw new AppException(ErrorCode.REFUND_CLASS_NOT_ONLINE);
            }
            classId = latestClass.id();
        } else {
            if ("CANCELLED".equalsIgnoreCase(requestStatus)) {
                throw new AppException(ErrorCode.COMPLAINT_TARGET_NOT_PROCESSABLE);
            }
            if (latestClass != null && ComplaintTargetEvaluator.isWindowExpired(
                    latestClass.status(), latestClass.activeFrom(), MatchingLifecycleSupport.today())) {
                throw new AppException(ErrorCode.COMPLAINT_WINDOW_EXPIRED);
            }
            classId = latestClass != null && !"CANCELLED".equalsIgnoreCase(latestClass.status())
                    ? latestClass.id()
                    : null;
        }

        Complaint complaint = complaintRepository.saveAndFlush(Complaint.builder()
                .classRequestId(classRequestId)
                .classId(classId)
                .complainantName(request.getComplainantName().trim())
                .complainantPhone(request.getComplainantPhone().trim())
                .complainantRole(request.getComplainantRole())
                .complaintType(request.getComplaintType())
                .complaintContent(request.getComplaintContent().trim())
                .status(ComplaintStatus.PENDING)
                .receivedBy(actor.id())
                .build());

        Map<String, Object> details = new HashMap<>();
        details.put("complaintType", complaint.getComplaintType());
        details.put("classRequestId", classRequestId);
        details.put("classId", classId);
        audit(actor, "CREATE_COMPLAINT", complaint.getId(), details);
        return getDetail(complaint.getId());
    }

    @Transactional
    public ComplaintDetailResponse update(Long id, ComplaintUpdateRequest request) {
        ActorProvider.Actor actor = actorProvider.current();
        Complaint complaint = lockPending(id);
        complaint.setComplainantName(request.getComplainantName().trim());
        complaint.setComplainantPhone(request.getComplainantPhone().trim());
        complaint.setComplainantRole(request.getComplainantRole());
        complaint.setComplaintContent(request.getComplaintContent().trim());
        complaintRepository.saveAndFlush(complaint);
        audit(actor, "UPDATE_COMPLAINT", id, null);
        return getDetail(id);
    }

    /** Hủy khiếu nại: chỉ đóng đơn, lớp giữ nguyên. */
    @Transactional
    public ComplaintDetailResponse cancel(Long id) {
        ActorProvider.Actor actor = actorProvider.current();
        Complaint complaint = lockPending(id);
        complaint.setStatus(ComplaintStatus.CANCELLED);
        complaintRepository.saveAndFlush(complaint);
        audit(actor, "CANCEL_COMPLAINT", id, null);
        return getDetail(id);
    }

    /**
     * Giải quyết khiếu nại không hoàn tiền (UC-REC-16). Lớp chưa được xử lý thì hệ thống tự Hủy lớp hoặc
     * Ghép lại; lớp đã được xử lý thủ công thì chỉ đóng khiếu nại và bắt buộc có minh chứng.
     */
    @Transactional
    public ComplaintDetailResponse resolve(
            Long id, RequestOutcome requestedOutcome, String resolution, List<MultipartFile> files) {
        ActorProvider.Actor actor = actorProvider.current();
        if (resolution == null || resolution.isBlank()) {
            throw new AppException(ErrorCode.COMPLAINT_RESOLUTION_REQUIRED);
        }
        List<MultipartFile> evidence = files == null
                ? List.of()
                : files.stream().filter(f -> f != null && !f.isEmpty()).toList();
        validateEvidence(evidence);

        Complaint complaint = lockPending(id);
        if (complaint.getComplaintType() != ComplaintType.NON_REFUND) {
            throw new AppException(ErrorCode.COMPLAINT_TYPE_MISMATCH);
        }

        TargetState state = queryRepository.loadTargetState(complaint.getClassRequestId(), complaint.getClassId());
        Evaluation evaluation = ComplaintTargetEvaluator.evaluate(state, MatchingLifecycleSupport.today());
        Decision decision = ComplaintTargetEvaluator.decide(requestedOutcome, evaluation, evidence.size());

        String note = resolution.trim();
        if (!decision.alreadyHandled()) {
            String reason = "Giải quyết khiếu nại " + ComplaintQueryRepository.complaintCode(id) + ": " + note;
            if (decision.outcome() == RequestOutcome.CANCELLED) {
                classRequestService.cancel(
                        complaint.getClassRequestId(), CancelClassRequest.builder().reason(reason).build(),
                        actorProvider.currentHttpRequest());
            } else {
                classRequestService.rematchClass(
                        complaint.getClassRequestId(), reason, true, actorProvider.currentHttpRequest());
            }
        }

        List<String> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : evidence) {
                String url = storageService.uploadFile(EVIDENCE_FOLDER, file);
                uploaded.add(url);
                attachmentRepository.save(ComplaintAttachment.builder()
                        .complaintId(id)
                        .fileUrl(url)
                        .fileName(file.getOriginalFilename())
                        .uploadedBy(actor.id())
                        .build());
            }

            complaint.setStatus(ComplaintStatus.RESOLVED);
            complaint.setRequestOutcome(decision.outcome());
            complaint.setResolution(note);
            complaint.setResolvedBy(actor.id());
            complaint.setResolvedAt(OffsetDateTime.now());
            complaintRepository.saveAndFlush(complaint);
        } catch (RuntimeException e) {
            deleteQuietly(uploaded);
            throw e;
        }

        Map<String, Object> details = new HashMap<>();
        details.put("requestOutcome", decision.outcome());
        details.put("alreadyHandled", decision.alreadyHandled());
        details.put("classRequestId", complaint.getClassRequestId());
        details.put("attachments", uploaded.size());
        audit(actor, "RESOLVE_COMPLAINT", id, details);
        return getDetail(id);
    }

    /** Lễ tân gửi yêu cầu hoàn tiền cho Kế toán: khiếu nại {@code PENDING → PROCESSING}. */
    @Transactional
    public ComplaintDetailResponse createRefundRequest(Long id, RefundCreateRequest request) {
        ActorProvider.Actor actor = actorProvider.current();
        Complaint complaint = lockPending(id);
        if (complaint.getComplaintType() != ComplaintType.REFUND) {
            throw new AppException(ErrorCode.COMPLAINT_TYPE_MISMATCH);
        }
        if (refundRepository.existsByComplaintIdAndStatusIn(id, EnumSet.of(RefundStatus.PENDING, RefundStatus.PAID))) {
            throw new AppException(ErrorCode.REFUND_ALREADY_EXISTS);
        }

        Payment payment = paymentRepository.findById(request.getPaymentId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        if (payment.getStatus() != PaymentStatus.APPROVED || !payment.getClassId().equals(complaint.getClassId())) {
            throw new AppException(ErrorCode.REFUND_PAYMENT_INVALID);
        }
        BigDecimal remaining = RefundService.remaining(payment, queryRepository.sumPaidRefunds(payment.getId(), null));
        if (request.getRequestedAmount().compareTo(remaining) > 0) {
            throw new AppException(ErrorCode.REFUND_AMOUNT_EXCEEDED,
                    "Số tiền hoàn (" + RefundService.formatVnd(request.getRequestedAmount())
                            + ") vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: "
                            + RefundService.formatVnd(remaining) + ").");
        }

        Refund refund = refundRepository.saveAndFlush(Refund.builder()
                .complaintId(id)
                .paymentId(payment.getId())
                .requestedAmount(request.getRequestedAmount())
                .recipientName(request.getRecipientName().trim())
                .bankName(request.getBankName().trim())
                .bankAccountNumber(request.getBankAccountNumber().trim())
                .status(RefundStatus.PENDING)
                .requestedBy(actor.id())
                .build());

        complaint.setStatus(ComplaintStatus.PROCESSING);
        complaintRepository.saveAndFlush(complaint);

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("refundId", refund.getId());
        details.put("paymentId", payment.getId());
        details.put("requestedAmount", request.getRequestedAmount());
        audit(actor, "REQUEST_REFUND", id, details);

        queryRepository.notifyRole(UserRole.ACCOUNTANT.name(), "Có yêu cầu hoàn tiền mới",
                "Khiếu nại " + ComplaintQueryRepository.complaintCode(id) + " đề xuất hoàn "
                        + RefundService.formatVnd(request.getRequestedAmount()) + ", cần Kế toán xử lý.",
                "REFUND", refund.getId());
        return getDetail(id);
    }

    // ---------------------------------------------------------------- HELPER

    private ComplaintTargetResponse buildTarget(Long classRequestId, Long complaintClassId) {
        TargetState state = queryRepository.loadTargetState(classRequestId, complaintClassId);
        Evaluation evaluation = ComplaintTargetEvaluator.evaluate(state, MatchingLifecycleSupport.today());
        ClassRequestDetailResponse detail = classRequestQueryRepository.findDetailById(classRequestId).orElse(null);

        Map<String, Boolean> handled = new LinkedHashMap<>();
        evaluation.alreadyHandled().forEach((k, v) -> handled.put(k.name(), v));

        ComplaintTargetResponse.ComplaintTargetResponseBuilder builder = ComplaintTargetResponse.builder()
                .classRequestId(classRequestId)
                .complaintClassId(complaintClassId)
                .complaintClassStatus(state.complaintClassStatus())
                .hasTutor(evaluation.hasTutor())
                .windowExpired(evaluation.windowExpired())
                .allowedOutcomes(evaluation.allowedOutcomes().stream().map(Enum::name).toList())
                .alreadyHandled(handled);
        if (detail != null) {
            builder.requestCode(detail.getRequestCode())
                    .status(detail.getStatus())
                    .studentName(detail.getStudentName())
                    .parentName(detail.getParentName())
                    .parentPhone(detail.getParentPhone())
                    .tutorName(detail.getLastTutorName() != null ? detail.getLastTutorName() : detail.getTutorName())
                    .teachingMode(detail.getTeachingMode())
                    .classId(detail.getClassId())
                    .classStatus(detail.getClassStatus())
                    .activeFrom(detail.getActiveFrom())
                    .cancelDeadline(detail.getCancelDeadline())
                    .cancelDaysLeft(detail.getCancelDaysLeft());
        }
        return builder.build();
    }

    private Complaint lockPending(Long id) {
        Complaint complaint = complaintRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.COMPLAINT_NOT_FOUND));
        if (complaint.getStatus() != ComplaintStatus.PENDING) {
            throw new AppException(ErrorCode.COMPLAINT_INVALID_STATE);
        }
        return complaint;
    }

    private void validateEvidence(List<MultipartFile> files) {
        if (files.size() > MAX_EVIDENCE_FILES) {
            throw new AppException(ErrorCode.COMPLAINT_TOO_MANY_FILES);
        }
        for (MultipartFile file : files) {
            if (file.getSize() > fileProperties.getProofMaxBytes()) {
                throw new AppException(ErrorCode.FILE_TOO_LARGE);
            }
            String contentType = file.getContentType();
            if (contentType == null || !fileProperties.getProofAllowedTypes().contains(contentType)) {
                throw new AppException(ErrorCode.FILE_INVALID_TYPE);
            }
        }
    }

    private String presign(String keyOrUrl) {
        if (keyOrUrl == null) {
            return null;
        }
        try {
            return storageService.presignedUrl(keyOrUrl, Duration.ofSeconds(fileProperties.getProofLinkTtlSeconds()));
        } catch (RuntimeException e) {
            log.warn("Không tạo được link xem tệp {}: {}", keyOrUrl, e.getMessage());
            return keyOrUrl;
        }
    }

    private void deleteQuietly(List<String> urls) {
        for (String url : urls) {
            try {
                storageService.deleteFile(url);
            } catch (RuntimeException e) {
                log.warn("Không xóa được tệp minh chứng {}: {}", url, e.getMessage());
            }
        }
    }

    private void audit(ActorProvider.Actor actor, String action, Long complaintId, Object details) {
        auditLogService.log(actor.id(), action, ENTITY_TYPE, complaintId, details, actorProvider.currentHttpRequest());
    }
}
