package com.mycompany.englishtutor.module.payment.controller;

import java.time.YearMonth;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.payment.api.request.PaymentApproveRequest;
import com.mycompany.englishtutor.module.payment.api.request.PaymentFeeRateRequest;
import com.mycompany.englishtutor.module.payment.api.request.PaymentResubmitRequest;
import com.mycompany.englishtutor.module.payment.api.response.PaymentResponse;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentMethod;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.module.payment.service.PaymentService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API phí nhận lớp (API_DESIGN mục 3.8). ADMIN được phép gọi mọi endpoint. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Payments - Phí nhận lớp", description = "Nộp minh chứng, thu hộ, chỉnh tỷ lệ, đối chiếu phí nhận lớp")
public class PaymentController {

    private final PaymentService paymentService;

    @GetMapping("/tutors/me/payments")
    @PreAuthorize("hasRole('TUTOR')")
    @Operation(
            summary = "Gia sư xem các khoản phí nhận lớp của mình theo tab trạng thái",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> getMyPayments(
            @RequestParam(required = false) PaymentStatus tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(paymentService.getMyPayments(tab, page, size));
    }

    @GetMapping("/payments")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ACCOUNTANT', 'ADMIN')")
    @Operation(
            summary = "Tìm khoản phí theo mã lớp, tên gia sư, SĐT phụ huynh, trạng thái, tháng",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<PaymentResponse>>> search(
            @Parameter(description = "Mã lớp, tên gia sư hoặc SĐT phụ huynh") @RequestParam(required = false)
                    String keyword,
            @RequestParam(required = false) PaymentStatus status,
            @Parameter(description = "Tháng tạo khoản phí, định dạng yyyy-MM") @RequestParam(required = false)
                    YearMonth month,
            @RequestParam(required = false) Long tutorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(paymentService.search(keyword, status, month, tutorId, page, size));
    }

    @GetMapping("/payments/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ACCOUNTANT', 'ADMIN', 'TUTOR')")
    @Operation(
            summary = "Chi tiết khoản phí kèm cách tính (gia sư chỉ xem khoản của mình)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> getDetail(@PathVariable Long id) {
        return ok(paymentService.getDetail(id));
    }

    @PostMapping(value = "/payments/{id}/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('TUTOR', 'RECEPTIONIST', 'ADMIN')")
    @Operation(
            summary = "Nộp biên lai (gia sư tự nộp, Lễ tân / Admin nộp thay)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> submitProof(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) PaymentMethod paymentMethod) {
        return ok(paymentService.submitProof(id, file, paymentMethod));
    }

    @PostMapping(value = "/payments/{id}/collect-proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(
            summary = "Lễ tân / Admin thu hộ tại quầy (tiền mặt hoặc chuyển khoản)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> collectProof(
            @PathVariable Long id,
            @RequestPart("file") MultipartFile file,
            @RequestParam(required = false) PaymentMethod paymentMethod) {
        return ok(paymentService.collectProof(id, file, paymentMethod));
    }

    @PatchMapping("/payments/{id}/fee-percentage")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(
            summary = "Chỉnh tỷ lệ phí khi khoản phí chưa có minh chứng (mặc định 40%, khoảng 0-50%)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> updateFeePercentage(
            @PathVariable Long id, @Valid @RequestBody PaymentFeeRateRequest request) {
        return ok(paymentService.updateFeePercentage(id, request.getFeePercentage()));
    }

    @PostMapping("/payments/{id}/approve")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(
            summary = "Đối chiếu số tiền thực nhận: đủ thì APPROVED, thiếu thì RESUBMIT_REQUIRED",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> approve(
            @PathVariable Long id, @Valid @RequestBody PaymentApproveRequest request) {
        return ok(paymentService.approve(id, request.getReceivedAmount()));
    }

    @PostMapping("/payments/{id}/request-resubmit")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(
            summary = "Yêu cầu nộp lại biên lai kèm lý do",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PaymentResponse>> requestResubmit(
            @PathVariable Long id, @Valid @RequestBody PaymentResubmitRequest request) {
        return ok(paymentService.requestResubmit(id, request.getReason()));
    }

    private static <T> ResponseEntity<ApiResponse<T>> ok(T result) {
        return ResponseEntity.ok(ApiResponse.<T>builder().result(result).build());
    }
}
