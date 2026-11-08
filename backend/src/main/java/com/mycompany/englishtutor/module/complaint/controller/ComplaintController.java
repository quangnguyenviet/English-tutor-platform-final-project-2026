package com.mycompany.englishtutor.module.complaint.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.complaint.api.request.ComplaintCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.request.ComplaintUpdateRequest;
import com.mycompany.englishtutor.module.complaint.api.request.RefundCreateRequest;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintDetailResponse;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintResponse;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.complaint.service.ComplaintService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API khiếu nại tại quầy (API_DESIGN mục 3.9). */
@RestController
@RequestMapping("/api/v1/complaints")
@RequiredArgsConstructor
@Tag(name = "Complaints - Khiếu nại", description = "Tạo, sửa, giải quyết khiếu nại và gửi yêu cầu hoàn tiền")
public class ComplaintController {

    private final ComplaintService complaintService;

    @GetMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Danh sách khiếu nại theo trạng thái, loại, từ khóa",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<ComplaintResponse>>> search(
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) ComplaintType type,
            @Parameter(description = "Mã KN, tên/SĐT người khiếu nại, tên học sinh, phụ huynh, mã lớp")
                    @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ok(complaintService.search(status, type, keyword, page, size));
    }

    @GetMapping("/counts")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Số khiếu nại theo trạng thái (badge, Dashboard)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> counts() {
        return ok(complaintService.counts());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT')")
    @Operation(summary = "Chi tiết khiếu nại, lớp bị khiếu nại và lựa chọn xử lý hợp lệ",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> getDetail(@PathVariable Long id) {
        return ok(complaintService.getDetail(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Tạo đơn khiếu nại (Chờ xử lý)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> create(
            @Valid @RequestBody ComplaintCreateRequest request) {
        return ok(complaintService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Sửa thông tin người khiếu nại và nội dung khi đơn còn Chờ xử lý",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ComplaintUpdateRequest request) {
        return ok(complaintService.update(id, request));
    }

    @PostMapping(value = "/{id}/resolve", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Giải quyết khiếu nại không hoàn tiền: Hủy lớp hoặc Ghép lại, kèm minh chứng",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> resolve(
            @PathVariable Long id,
            @RequestParam(required = false) RequestOutcome requestOutcome,
            @RequestParam(required = false) String resolution,
            @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ok(complaintService.resolve(id, requestOutcome, resolution, files));
    }

    @PostMapping("/{id}/refund-requests")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Gửi yêu cầu hoàn tiền cho Kế toán", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> createRefundRequest(
            @PathVariable Long id, @Valid @RequestBody RefundCreateRequest request) {
        return ok(complaintService.createRefundRequest(id, request));
    }

    @PostMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Operation(summary = "Hủy khiếu nại, lớp giữ nguyên", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ComplaintDetailResponse>> cancel(@PathVariable Long id) {
        return ok(complaintService.cancel(id));
    }

    private static <T> ResponseEntity<ApiResponse<T>> ok(T result) {
        return ResponseEntity.ok(ApiResponse.<T>builder().result(result).build());
    }
}
