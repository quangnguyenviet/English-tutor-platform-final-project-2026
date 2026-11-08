package com.mycompany.englishtutor.module.complaint.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.complaint.api.response.RefundResponse;
import com.mycompany.englishtutor.module.complaint.domain.Complaint;
import com.mycompany.englishtutor.module.complaint.domain.Refund;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintQueryRepository;
import com.mycompany.englishtutor.module.complaint.repository.ComplaintRepository;
import com.mycompany.englishtutor.module.complaint.repository.RefundRepository;
import com.mycompany.englishtutor.module.payment.config.PaymentProperties;
import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.repository.PaymentRepository;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Kế toán xử lý yêu cầu hoàn tiền (FR-43, UC-ACC-04, UC-ADM-18): chi tiền kèm biên lai hoặc từ chối kèm lý do.
 * Trạng thái khiếu nại đổi cùng transaction: hoàn xong {@code RESOLVED}, từ chối về {@code PENDING}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RefundService {

    static final String ENTITY_TYPE = "REFUND";
    static final String PROOF_FOLDER = "refunds/proofs";
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    RefundRepository refundRepository;
    ComplaintRepository complaintRepository;
    PaymentRepository paymentRepository;
    ComplaintQueryRepository queryRepository;
    StorageService storageService;
    PaymentProperties fileProperties;
    AuditLogService auditLogService;
    ActorProvider actorProvider;

    @Transactional(readOnly = true)
    public PageResponse<RefundResponse> search(RefundStatus tab, int page, int size) {
        return queryRepository.searchRefunds(tab, Math.max(0, page), Math.max(1, Math.min(size, 100)));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> counts() {
        return queryRepository.countRefundsByStatus();
    }

    @Transactional(readOnly = true)
    public RefundResponse getDetail(Long id) {
        RefundResponse response = queryRepository.findRefund(id)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));
        if (response.getProofUrl() != null) {
            try {
                response.setProofUrl(storageService.presignedUrl(
                        response.getProofUrl(), Duration.ofSeconds(fileProperties.getProofLinkTtlSeconds())));
            } catch (RuntimeException e) {
                log.warn("Không tạo được link biên lai hoàn tiền #{}: {}", id, e.getMessage());
            }
        }
        return response;
    }

    /** Kế toán đã chuyển khoản ngoài hệ thống, nộp biên lai và xác nhận: {@code PENDING → PAID}. */
    @Transactional
    public RefundResponse pay(Long id, BigDecimal approvedAmount, MultipartFile file) {
        ActorProvider.Actor actor = actorProvider.current();
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.REFUND_PROOF_REQUIRED);
        }
        if (file.getSize() > fileProperties.getProofMaxBytes()) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        if (file.getContentType() == null || !fileProperties.getProofAllowedTypes().contains(file.getContentType())) {
            throw new AppException(ErrorCode.FILE_INVALID_TYPE);
        }
        if (approvedAmount == null || approvedAmount.signum() <= 0) {
            throw new AppException(ErrorCode.REFUND_AMOUNT_EXCEEDED, "Số tiền hoàn phải lớn hơn 0.");
        }

        // Thứ tự khóa refund → complaint → payment, giống reject, để tránh deadlock.
        Refund refund = lockPending(id);
        requireDifferentActor(refund, actor);
        Complaint complaint = complaintRepository.findByIdForUpdate(refund.getComplaintId())
                .orElseThrow(() -> new AppException(ErrorCode.COMPLAINT_NOT_FOUND));
        Payment payment = paymentRepository.findByIdForUpdate(refund.getPaymentId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));

        BigDecimal remaining = remaining(payment, queryRepository.sumPaidRefunds(payment.getId(), refund.getId()));
        BigDecimal limit = remaining.min(refund.getRequestedAmount());
        if (approvedAmount.compareTo(limit) > 0) {
            String message = approvedAmount.compareTo(remaining) > 0
                    ? "Số tiền hoàn (" + formatVnd(approvedAmount)
                            + ") vượt quá giới hạn tiền trung tâm đã thu của lớp này (còn lại: "
                            + formatVnd(remaining) + ")."
                    : "Số tiền hoàn không được vượt số Lễ tân đề xuất (" + formatVnd(refund.getRequestedAmount()) + ").";
            throw new AppException(ErrorCode.REFUND_AMOUNT_EXCEEDED, message);
        }

        String proofUrl = storageService.uploadFile(PROOF_FOLDER, file);
        try {
            OffsetDateTime now = OffsetDateTime.now();
            refund.setStatus(RefundStatus.PAID);
            refund.setApprovedAmount(approvedAmount);
            refund.setProofUrl(proofUrl);
            refund.setProcessedBy(actor.id());
            refund.setProcessedAt(now);
            refundRepository.saveAndFlush(refund);

            complaint.setStatus(ComplaintStatus.RESOLVED);
            complaint.setResolution("Đã hoàn trả " + formatVnd(approvedAmount) + " qua ngân hàng " + refund.getBankName()
                    + " ngày " + now.atZoneSameInstant(VN_ZONE).format(DATE) + " bởi Kế toán " + actor.fullName() + ".");
            complaint.setResolvedBy(actor.id());
            complaint.setResolvedAt(now);
            complaintRepository.saveAndFlush(complaint);
        } catch (RuntimeException e) {
            try {
                storageService.deleteFile(proofUrl);
            } catch (RuntimeException deleteError) {
                log.warn("Không xóa được biên lai hoàn tiền {}: {}", proofUrl, deleteError.getMessage());
            }
            throw e;
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("complaintId", complaint.getId());
        details.put("paymentId", payment.getId());
        details.put("requestedAmount", refund.getRequestedAmount());
        details.put("approvedAmount", approvedAmount);
        audit(actor, "PAY_REFUND", id, details);

        String content = "Khiếu nại " + ComplaintQueryRepository.complaintCode(complaint.getId()) + " đã được hoàn "
                + formatVnd(approvedAmount) + " qua ngân hàng " + refund.getBankName() + ".";
        queryRepository.notifyUser(complaint.getReceivedBy(), "Đã hoàn tiền khiếu nại", content,
                "COMPLAINT", complaint.getId());
        if (!complaint.getReceivedBy().equals(refund.getRequestedBy())) {
            queryRepository.notifyUser(refund.getRequestedBy(), "Đã hoàn tiền khiếu nại", content,
                    "COMPLAINT", complaint.getId());
        }
        queryRepository.findClass(complaint.getClassId()).ifPresent(cl -> queryRepository.notifyUser(
                complaint.getComplainantRole() == ComplainantRole.TUTOR ? cl.tutorId() : cl.studentId(),
                "Trung tâm đã hoàn tiền",
                "Trung tâm đã hoàn " + formatVnd(approvedAmount) + " vào tài khoản " + refund.getBankName()
                        + " theo khiếu nại của bạn.",
                "COMPLAINT", complaint.getId()));
        return getDetail(id);
    }

    /** Kế toán từ chối kèm lý do: refund {@code REJECTED}, khiếu nại về {@code PENDING}. */
    @Transactional
    public RefundResponse reject(Long id, String reason) {
        ActorProvider.Actor actor = actorProvider.current();
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.REFUND_REJECT_REASON_REQUIRED);
        }
        Refund refund = lockPending(id);
        requireDifferentActor(refund, actor);
        Complaint complaint = complaintRepository.findByIdForUpdate(refund.getComplaintId())
                .orElseThrow(() -> new AppException(ErrorCode.COMPLAINT_NOT_FOUND));

        refund.setStatus(RefundStatus.REJECTED);
        refund.setRejectReason(reason.trim());
        refund.setProcessedBy(actor.id());
        refund.setProcessedAt(OffsetDateTime.now());
        refundRepository.saveAndFlush(refund);

        if (complaint.getStatus() == ComplaintStatus.PROCESSING) {
            complaint.setStatus(ComplaintStatus.PENDING);
            complaintRepository.saveAndFlush(complaint);
        }

        audit(actor, "REJECT_REFUND", id, Map.of("complaintId", complaint.getId(), "reason", reason.trim()));
        queryRepository.notifyUser(refund.getRequestedBy(), "Yêu cầu hoàn tiền bị từ chối",
                "Khiếu nại " + ComplaintQueryRepository.complaintCode(complaint.getId())
                        + " bị Kế toán từ chối hoàn tiền. Lý do: " + reason.trim(),
                "COMPLAINT", complaint.getId());
        return getDetail(id);
    }

    // ---------------------------------------------------------------- HELPER

    /** Số còn có thể hoàn từ một khoản phí: số thực nhận trừ tổng đã hoàn. */
    static BigDecimal remaining(Payment payment, BigDecimal paidRefunds) {
        BigDecimal received = payment.getReceivedAmount() != null
                ? payment.getReceivedAmount()
                : payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO;
        BigDecimal paid = paidRefunds == null ? BigDecimal.ZERO : paidRefunds;
        return received.subtract(paid).max(BigDecimal.ZERO);
    }

    static String formatVnd(BigDecimal amount) {
        if (amount == null) {
            return "0₫";
        }
        return String.format("%,d", amount.longValue()).replace(',', '.') + "₫";
    }

    private Refund lockPending(Long id) {
        Refund refund = refundRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new AppException(ErrorCode.REFUND_NOT_FOUND));
        if (refund.getStatus() != RefundStatus.PENDING) {
            throw new AppException(ErrorCode.REFUND_INVALID_STATE);
        }
        return refund;
    }

    private static void requireDifferentActor(Refund refund, ActorProvider.Actor actor) {
        if (actor.id().equals(refund.getRequestedBy())) {
            throw new AppException(ErrorCode.REFUND_SAME_ACTOR);
        }
    }

    private void audit(ActorProvider.Actor actor, String action, Long refundId, Object details) {
        auditLogService.log(actor.id(), action, ENTITY_TYPE, refundId, details, actorProvider.currentHttpRequest());
    }
}
