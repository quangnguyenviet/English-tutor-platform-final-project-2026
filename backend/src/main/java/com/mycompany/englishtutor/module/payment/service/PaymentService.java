package com.mycompany.englishtutor.module.payment.service;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.web.multipart.MultipartFile;

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
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ phí nhận lớp (FR-15, FR-33, FR-41, FR-42): tạo khoản phí khi chốt lịch, nộp hoặc thu hộ minh chứng,
 * chỉnh tỷ lệ, kế toán đối chiếu. Máy trạng thái theo API_DESIGN mục 2.5, mọi thao tác ghi audit cùng transaction.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentService {
    private static final String ENTITY_TYPE = "PAYMENT";
    private static final String PROOF_FOLDER = "payments/proofs";

    PaymentRepository paymentRepository;
    PaymentQueryRepository paymentQueryRepository;
    UserRepository userRepository;
    StorageService storageService;
    AuditLogService auditLogService;
    PaymentProperties properties;

    private record Actor(Long id, String role) {
        boolean isTutor() {
            return UserRole.TUTOR.name().equals(role);
        }
    }

    /**
     * Tạo khoản phí khi lớp chốt lịch cố định; gọi trong cùng transaction với việc chốt lịch (T7-B3).
     * Gọi lại với cùng lớp thì trả khoản phí đã có.
     */
    @Transactional
    public PaymentResponse createForClass(Long classId) {
        Optional<Payment> existing = paymentRepository.findFirstByClassIdAndPayerType(classId, PayerType.TUTOR);
        if (existing.isPresent()) {
            return getDetail(existing.get().getId(), null);
        }

        ClassFeeInfo info = paymentQueryRepository
                .findClassFeeInfo(classId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_CLASS_NOT_FOUND));
        if (info.pricePerSession() == null || info.slotsPerWeek() <= 0) {
            throw new AppException(ErrorCode.PAYMENT_CLASS_INCOMPLETE);
        }

        BigDecimal feePercentage = paymentQueryRepository.findRequestFeePercentageForClass(classId);
        if (feePercentage == null) {
            feePercentage = properties.getDefaultFeePercentage();
        }
        Payment payment = paymentRepository.saveAndFlush(Payment.builder()
                .classId(classId)
                .payerType(PayerType.TUTOR)
                .feePercentage(feePercentage)
                .amount(FeeCalculator.calculate(feePercentage, info.slotsPerWeek(), info.pricePerSession()))
                .status(PaymentStatus.NOT_SUBMITTED)
                .build());

        Actor actor = currentActorOrNull();
        if (actor != null) {
            audit(actor, "CREATE_PAYMENT", payment.getId(), Map.of(
                    "classId", classId,
                    "feePercentage", feePercentage,
                    "amount", payment.getAmount()));
        }
        paymentQueryRepository.notifyUser(
                info.tutorId(),
                "Khoản phí nhận lớp mới",
                "Bạn cần nộp phí nhận lớp " + formatVnd(payment.getAmount()) + " để mở thông tin liên hệ phụ huynh.",
                payment.getId());

        log.info("Created payment {} for class {}, amount {}", payment.getId(), classId, payment.getAmount());
        return getDetail(payment.getId(), null);
    }

    /**
     * Tạo bản nháp {@code NEW} khi ghép lớp {@code TRIAL} (kế hoạch mục 4.1.2): snapshot
     * {@code fee_percentage} + {@code price_per_session}, {@code amount = NULL} cho tới khi kích hoạt.
     * Idempotent theo {@code (class_id, payer_type = TUTOR, status = NEW)} — gọi lại trả bản đã có.
     * Không gửi thông báo khoản phí (chưa có số tiền cụ thể).
     */
    @Transactional
    public PaymentResponse createDraftForClass(Long classId, BigDecimal feePercentage, BigDecimal pricePerSession) {
        Optional<Payment> existing = paymentRepository
                .findFirstByClassIdAndPayerTypeAndStatus(classId, PayerType.TUTOR, PaymentStatus.NEW);
        if (existing.isPresent()) {
            return getDetail(existing.get().getId(), null);
        }

        BigDecimal fee = feePercentage != null ? feePercentage : properties.getDefaultFeePercentage();
        Payment payment = paymentRepository.saveAndFlush(Payment.builder()
                .classId(classId)
                .payerType(PayerType.TUTOR)
                .feePercentage(fee)
                .amount(null)
                .status(PaymentStatus.NEW)
                .build());

        Actor actor = currentActorOrNull();
        if (actor != null) {
            audit(actor, "CREATE_PAYMENT_DRAFT", payment.getId(), Map.of(
                    "classId", classId,
                    "feePercentage", fee,
                    "pricePerSession", String.valueOf(pricePerSession)));
        }
        log.info("Created draft payment {} for class {} (fee {}, price {})",
                payment.getId(), classId, fee, pricePerSession);
        return getDetail(payment.getId(), null);
    }

    /**
     * Kích hoạt bản nháp {@code NEW} (kế hoạch mục 4.5): tính {@code amount} bằng {@link FeeCalculator}
     * rồi chuyển {@code NEW -> NOT_SUBMITTED}. Nếu lớp chưa có bản nháp (dữ liệu cũ) thì tạo thẳng
     * {@code NOT_SUBMITTED}. {@code feePercentage} (nếu khác null) ghi đè lên snapshot. Idempotent:
     * khoản đã {@code NOT_SUBMITTED} thì giữ nguyên, không nhân đôi payment.
     */
    @Transactional
    public PaymentResponse createForClassWithFeeInfo(
            Long classId, BigDecimal feePercentage, int sessionsPerWeek, BigDecimal pricePerSession) {
        if (pricePerSession == null || sessionsPerWeek <= 0) {
            throw new AppException(ErrorCode.CLASS_FEE_INCOMPLETE);
        }
        // Idempotent (kế hoạch mục 4.5): kích hoạt lại lớp đã kích hoạt không nhân đôi payment.
        Optional<Payment> alreadyActivated =
                paymentRepository.findFirstByClassIdAndPayerTypeAndStatus(
                        classId, PayerType.TUTOR, PaymentStatus.NOT_SUBMITTED);
        if (alreadyActivated.isPresent()) {
            return getDetail(alreadyActivated.get().getId(), null);
        }

        Optional<Payment> existing = paymentRepository
                .findFirstByClassIdAndPayerTypeAndStatus(classId, PayerType.TUTOR, PaymentStatus.NEW);
        BigDecimal fee = feePercentage != null ? feePercentage : properties.getDefaultFeePercentage();
        BigDecimal amount = FeeCalculator.calculate(fee, sessionsPerWeek, pricePerSession);

        Payment payment;
        String action;
        if (existing.isPresent()) {
            payment = existing.get();
            payment.setFeePercentage(fee);
            payment.setAmount(amount);
            payment.setStatus(PaymentStatus.NOT_SUBMITTED);
            paymentRepository.saveAndFlush(payment);
            action = "ACTIVATE_PAYMENT";
        } else {
            payment = paymentRepository.saveAndFlush(Payment.builder()
                    .classId(classId)
                    .payerType(PayerType.TUTOR)
                    .feePercentage(fee)
                    .amount(amount)
                    .status(PaymentStatus.NOT_SUBMITTED)
                    .build());
            action = "CREATE_PAYMENT";
        }

        Actor actor = currentActorOrNull();
        if (actor != null) {
            audit(actor, action, payment.getId(), Map.of(
                    "classId", classId,
                    "feePercentage", fee,
                    "sessionsPerWeek", sessionsPerWeek,
                    "pricePerSession", String.valueOf(pricePerSession),
                    "amount", amount));
        }
        paymentQueryRepository.findClassFeeInfo(classId)
                .ifPresent(info -> paymentQueryRepository.notifyUser(
                        info.tutorId(),
                        "Khoản phí nhận lớp mới",
                        "Bạn cần nộp phí nhận lớp " + formatVnd(amount) + " để mở thông tin liên hệ phụ huynh.",
                        payment.getId()));
        return getDetail(payment.getId(), null);
    }

    /** Hủy bản nháp {@code NEW} khi lớp {@code TRIAL} bị hủy / ghép lại (kế hoạch mục 4.1.2). Không có → không làm gì. */
    @Transactional
    public void cancelDraftPayment(Long classId) {
        paymentRepository
                .findFirstByClassIdAndPayerTypeAndStatus(classId, PayerType.TUTOR, PaymentStatus.NEW)
                .ifPresent(payment -> {
                    payment.setStatus(PaymentStatus.CANCELLED);
                    paymentRepository.saveAndFlush(payment);
                    Actor actor = currentActorOrNull();
                    if (actor != null) {
                        audit(actor, "CANCEL_PAYMENT_DRAFT", payment.getId(), Map.of("classId", classId));
                    }
                    log.info("Cancelled draft payment {} for class {}", payment.getId(), classId);
                });
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> getMyPayments(PaymentStatus tab, int page, int size) {
        Actor actor = currentActor();
        PageResponse<PaymentResponse> result =
                paymentQueryRepository.search(null, tab, null, actor.id(), clampPage(page), clampSize(size));
        result.getItems().forEach(item -> maskForTutor(item, actor));
        return result;
    }

    @Transactional(readOnly = true)
    public PageResponse<PaymentResponse> search(
            String keyword, PaymentStatus status, YearMonth month, Long tutorId, int page, int size) {
        return paymentQueryRepository.search(keyword, status, month, tutorId, clampPage(page), clampSize(size));
    }

    @Transactional(readOnly = true)
    public PaymentResponse getDetail(Long paymentId) {
        return getDetail(paymentId, currentActor());
    }

    /** Gia sư (hoặc Lễ tân / Admin nộp thay) đính kèm biên lai: {@code NOT_SUBMITTED/RESUBMIT_REQUIRED -> SUBMITTED}. */
    @Transactional
    public PaymentResponse submitProof(Long paymentId, MultipartFile file, PaymentMethod method) {
        Actor actor = currentActor();
        PaymentMethod effectiveMethod = method == null ? PaymentMethod.BANK_TRANSFER : method;
        if (actor.isTutor() && effectiveMethod != PaymentMethod.BANK_TRANSFER) {
            throw new AppException(ErrorCode.PAYMENT_METHOD_NOT_ALLOWED);
        }
        return attachProof(paymentId, file, effectiveMethod, actor, "SUBMIT_PAYMENT_PROOF");
    }

    /** Lễ tân / Admin thu hộ tại quầy (tiền mặt hoặc chuyển khoản), {@code uploaded_by} là người thu. */
    @Transactional
    public PaymentResponse collectProof(Long paymentId, MultipartFile file, PaymentMethod method) {
        PaymentMethod effectiveMethod = method == null ? PaymentMethod.CASH : method;
        return attachProof(paymentId, file, effectiveMethod, currentActor(), "COLLECT_PAYMENT_PROOF");
    }

    /** Lễ tân / Admin chỉnh tỷ lệ phí khi chưa có minh chứng, số tiền được tính lại. */
    @Transactional
    public PaymentResponse updateFeePercentage(Long paymentId, BigDecimal feePercentage) {
        Actor actor = currentActor();
        if (feePercentage == null
                || feePercentage.compareTo(properties.getMinFeePercentage()) < 0
                || feePercentage.compareTo(properties.getMaxFeePercentage()) > 0) {
            throw new AppException(ErrorCode.FEE_PERCENTAGE_OUT_OF_RANGE);
        }

        Payment payment = getPayment(paymentId);
        requireStatus(payment, PaymentStatus.NOT_SUBMITTED);

        ClassFeeInfo info = paymentQueryRepository
                .findClassFeeInfo(payment.getClassId())
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_CLASS_NOT_FOUND));
        if (info.pricePerSession() == null || info.slotsPerWeek() <= 0) {
            throw new AppException(ErrorCode.PAYMENT_CLASS_INCOMPLETE);
        }

        BigDecimal oldPercentage = payment.getFeePercentage();
        BigDecimal oldAmount = payment.getAmount();
        payment.setFeePercentage(feePercentage);
        payment.setAmount(FeeCalculator.calculate(feePercentage, info.slotsPerWeek(), info.pricePerSession()));
        paymentRepository.saveAndFlush(payment);

        audit(actor, "UPDATE_FEE_RATE", paymentId, Map.of(
                "oldFeePercentage", String.valueOf(oldPercentage),
                "newFeePercentage", feePercentage,
                "oldAmount", String.valueOf(oldAmount),
                "newAmount", payment.getAmount()));
        paymentQueryRepository.notifyUser(
                info.tutorId(),
                "Phí nhận lớp được điều chỉnh",
                "Tỷ lệ phí mới " + feePercentage.stripTrailingZeros().toPlainString() + "%, số tiền cần nộp "
                        + formatVnd(payment.getAmount()) + ".",
                paymentId);
        return getDetail(paymentId, actor);
    }

    /** Kế toán / Admin đối chiếu: đủ tiền thì {@code APPROVED}, thiếu thì {@code RESUBMIT_REQUIRED}. */
    @Transactional
    public PaymentResponse approve(Long paymentId, BigDecimal receivedAmount) {
        Actor actor = currentActor();
        if (receivedAmount == null || receivedAmount.signum() < 0) {
            throw new AppException(ErrorCode.RECEIVED_AMOUNT_INVALID);
        }

        Payment payment = getPayment(paymentId);
        requireStatus(payment, PaymentStatus.SUBMITTED);
        if (actor.id().equals(payment.getUploadedBy())) {
            throw new AppException(ErrorCode.PAYMENT_SAME_ACTOR);
        }

        PaymentStatus oldStatus = payment.getStatus();
        boolean enough = receivedAmount.compareTo(payment.getAmount()) >= 0;
        payment.setReceivedAmount(receivedAmount);
        payment.setReviewedBy(actor.id());
        payment.setReviewedAt(OffsetDateTime.now());
        if (enough) {
            payment.setStatus(PaymentStatus.APPROVED);
            payment.setRejectReason(null);
        } else {
            payment.setStatus(PaymentStatus.RESUBMIT_REQUIRED);
            payment.setRejectReason("Số tiền thực nhận " + formatVnd(receivedAmount)
                    + " nhỏ hơn số tiền phải nộp " + formatVnd(payment.getAmount()));
        }
        paymentRepository.saveAndFlush(payment);

        Map<String, Object> details = new HashMap<>();
        details.put("oldStatus", oldStatus);
        details.put("newStatus", payment.getStatus());
        details.put("receivedAmount", receivedAmount);
        details.put("amount", payment.getAmount());
        audit(actor, enough ? "APPROVE_PAYMENT" : "REQUEST_PAYMENT_RESUBMIT", paymentId, details);

        notifyTutor(
                payment,
                enough ? "Phí nhận lớp đã được xác nhận" : "Yêu cầu nộp lại biên lai phí nhận lớp",
                enough ? "Bạn đã có thể xem thông tin liên hệ phụ huynh của lớp." : payment.getRejectReason());
        return getDetail(paymentId, actor);
    }

    /** Kế toán / Admin yêu cầu nộp lại khi biên lai sai: {@code SUBMITTED -> RESUBMIT_REQUIRED}. */
    @Transactional
    public PaymentResponse requestResubmit(Long paymentId, String reason) {
        Actor actor = currentActor();
        if (reason == null || reason.isBlank()) {
            throw new AppException(ErrorCode.RESUBMIT_REASON_REQUIRED);
        }

        Payment payment = getPayment(paymentId);
        requireStatus(payment, PaymentStatus.SUBMITTED);
        if (actor.id().equals(payment.getUploadedBy())) {
            throw new AppException(ErrorCode.PAYMENT_SAME_ACTOR);
        }

        PaymentStatus oldStatus = payment.getStatus();
        payment.setStatus(PaymentStatus.RESUBMIT_REQUIRED);
        payment.setRejectReason(reason.trim());
        payment.setReviewedBy(actor.id());
        payment.setReviewedAt(OffsetDateTime.now());
        paymentRepository.saveAndFlush(payment);

        audit(actor, "REQUEST_PAYMENT_RESUBMIT", paymentId, Map.of(
                "oldStatus", oldStatus,
                "newStatus", payment.getStatus(),
                "reason", reason.trim()));
        notifyTutor(payment, "Yêu cầu nộp lại biên lai phí nhận lớp", reason.trim());
        return getDetail(paymentId, actor);
    }

    private PaymentResponse attachProof(
            Long paymentId, MultipartFile file, PaymentMethod method, Actor actor, String auditAction) {
        Payment payment = getPayment(paymentId);
        if (actor.isTutor()) {
            assertOwnedByTutor(payment, actor);
        }
        if (payment.getStatus() != PaymentStatus.NOT_SUBMITTED
                && payment.getStatus() != PaymentStatus.RESUBMIT_REQUIRED) {
            throw new AppException(ErrorCode.PAYMENT_INVALID_STATE);
        }
        validateProofFile(file);

        PaymentStatus oldStatus = payment.getStatus();
        String proofUrl = storageService.uploadFile(PROOF_FOLDER, file);

        payment.setProofUrl(proofUrl);
        payment.setPaymentMethod(method);
        payment.setStatus(PaymentStatus.SUBMITTED);
        payment.setUploadedBy(actor.id());
        payment.setUploadedAt(OffsetDateTime.now());
        // Xoá kết quả đối chiếu lần trước để lần duyệt mới không vướng ràng buộc reviewed_by <> uploaded_by.
        payment.setReceivedAmount(null);
        payment.setRejectReason(null);
        payment.setReviewedBy(null);
        payment.setReviewedAt(null);
        paymentRepository.saveAndFlush(payment);

        Map<String, Object> details = new HashMap<>();
        details.put("oldStatus", oldStatus);
        details.put("newStatus", payment.getStatus());
        details.put("paymentMethod", method);
        if (!actor.isTutor()) {
            details.put("onBehalfOf", payment.getPayerType());
        }
        audit(actor, auditAction, paymentId, details);

        paymentQueryRepository.notifyRole(
                UserRole.ACCOUNTANT.name(),
                "Có minh chứng phí nhận lớp chờ xác nhận",
                "Khoản phí #" + paymentId + " vừa được nộp minh chứng, cần đối chiếu.",
                paymentId);
        return getDetail(paymentId, actor);
    }

    private void validateProofFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.PAYMENT_PROOF_REQUIRED);
        }
        if (file.getSize() > properties.getProofMaxBytes()) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }
        String contentType = file.getContentType();
        if (contentType == null || !properties.getProofAllowedTypes().contains(contentType)) {
            throw new AppException(ErrorCode.FILE_INVALID_TYPE);
        }
    }

    private PaymentResponse getDetail(Long paymentId, Actor actor) {
        PaymentResponse response = paymentQueryRepository
                .findDetail(paymentId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
        if (actor != null && actor.isTutor() && !actor.id().equals(response.getTutorId())) {
            throw new AppException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
        if (response.getProofUrl() != null) {
            response.setProofUrl(storageService.presignedUrl(
                    response.getProofUrl(), Duration.ofSeconds(properties.getProofLinkTtlSeconds())));
        }
        if (actor != null) {
            maskForTutor(response, actor);
        }
        return response;
    }

    private void maskForTutor(PaymentResponse response, Actor actor) {
        if (actor.isTutor() && !response.isContactUnlocked()) {
            response.setParentPhone(null);
        }
    }

    private Payment getPayment(Long paymentId) {
        return paymentRepository.findById(paymentId).orElseThrow(() -> new AppException(ErrorCode.PAYMENT_NOT_FOUND));
    }

    private void assertOwnedByTutor(Payment payment, Actor actor) {
        Long tutorId = paymentQueryRepository
                .findClassFeeInfo(payment.getClassId())
                .map(ClassFeeInfo::tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.PAYMENT_CLASS_NOT_FOUND));
        if (!tutorId.equals(actor.id())) {
            throw new AppException(ErrorCode.PAYMENT_ACCESS_DENIED);
        }
    }

    private void requireStatus(Payment payment, PaymentStatus expected) {
        if (payment.getStatus() != expected) {
            throw new AppException(ErrorCode.PAYMENT_INVALID_STATE);
        }
    }

    private void notifyTutor(Payment payment, String title, String content) {
        paymentQueryRepository
                .findClassFeeInfo(payment.getClassId())
                .ifPresent(info ->
                        paymentQueryRepository.notifyUser(info.tutorId(), title, content, payment.getId()));
    }

    private void audit(Actor actor, String action, Long paymentId, Object details) {
        auditLogService.log(actor.id(), action, ENTITY_TYPE, paymentId, details, currentHttpRequest());
    }

    private Actor currentActor() {
        Actor actor = currentActorOrNull();
        if (actor == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        return actor;
    }

    private Actor currentActorOrNull() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            return null;
        }
        return userRepository
                .findByUsername(authentication.getName())
                .map((User user) -> new Actor(user.getId(), user.getRole()))
                .orElse(null);
    }

    private HttpServletRequest currentHttpRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        return attributes instanceof ServletRequestAttributes servletAttributes ? servletAttributes.getRequest() : null;
    }

    private static int clampPage(int page) {
        return Math.max(0, page);
    }

    private static int clampSize(int size) {
        return Math.max(1, Math.min(size, 100));
    }

    private static String formatVnd(BigDecimal amount) {
        return String.format("%,d", amount.longValue()).replace(',', '.') + "đ";
    }
}
