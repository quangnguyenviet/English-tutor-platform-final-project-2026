package com.mycompany.englishtutor.module.complaint.controller;

import java.math.BigDecimal;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.complaint.api.request.RefundRejectRequest;
import com.mycompany.englishtutor.module.complaint.api.response.RefundResponse;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;
import com.mycompany.englishtutor.module.complaint.service.RefundService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API Kế toán xử lý yêu cầu hoàn tiền (API_DESIGN mục 3.9, UC-ACC-04). */
@RestController
@RequestMapping("/api/v1/refunds")
@RequiredArgsConstructor
@Tag(name = "Refunds - Hoàn tiền", description = "Kế toán đối soát, chi tiền hoặc từ chối yêu cầu hoàn tiền")
public class RefundController {

    private final RefundService refundService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(summary = "Danh sách yêu cầu hoàn tiền theo tab", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<RefundResponse>>> search(
            @RequestParam(required = false) RefundStatus tab,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(refundService.search(tab, page, size));
    }

    @GetMapping("/counts")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(summary = "Số yêu cầu hoàn tiền theo trạng thái", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> counts() {
        return ok(refundService.counts());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(summary = "Chi tiết yêu cầu kèm số đã thu, đã hoàn, còn lại",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RefundResponse>> getDetail(@PathVariable Long id) {
        return ok(refundService.getDetail(id));
    }

    @PostMapping(value = "/{id}/pay", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(summary = "Xác nhận đã hoàn tiền kèm biên lai", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RefundResponse>> pay(
            @PathVariable Long id,
            @RequestParam(required = false) BigDecimal approvedAmount,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        return ok(refundService.pay(id, approvedAmount, file));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ACCOUNTANT', 'ADMIN')")
    @Operation(summary = "Từ chối hoàn tiền kèm lý do", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<RefundResponse>> reject(
            @PathVariable Long id, @Valid @RequestBody RefundRejectRequest request) {
        return ok(refundService.reject(id, request.getReason()));
    }

    private static <T> ResponseEntity<ApiResponse<T>> ok(T result) {
        return ResponseEntity.ok(ApiResponse.<T>builder().result(result).build());
    }
}
