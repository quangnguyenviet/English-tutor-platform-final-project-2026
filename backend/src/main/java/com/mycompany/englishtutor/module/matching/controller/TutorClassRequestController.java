package com.mycompany.englishtutor.module.matching.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.ApplyClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.matching.service.TutorClassRequestService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API gia sư xem lớp đang tuyển và ứng tuyển (API_DESIGN mục 3.4, FR-08). */
@RestController
@RequestMapping("/api/v1/tutors/me")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
@Tag(name = "Tutor Class Requests", description = "Lớp cần gia sư & đơn ứng tuyển của gia sư")
public class TutorClassRequestController {

    private final TutorClassRequestService tutorClassRequestService;

    @GetMapping("/open-requests")
    @Operation(
            summary = "Danh sách lớp đang tuyển kèm cờ đã ứng tuyển (phân trang, page bắt đầu từ 0)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<TutorOpenClassRequestResponse>>> getOpenRequests(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String teachingMode,
            @RequestParam(required = false) String gradeGroup,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<TutorOpenClassRequestResponse>>builder()
                .result(tutorClassRequestService.getOpenRequests(
                        keyword, teachingMode, gradeGroup, sort, page, size))
                .build());
    }

    @GetMapping("/open-requests/{classRequestId}")
    @Operation(
            summary = "Chi tiết lớp đang tuyển (ẩn thông tin liên hệ phụ huynh)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TutorOpenClassRequestResponse>> getOpenRequest(
            @PathVariable Long classRequestId) {
        return ResponseEntity.ok(ApiResponse.<TutorOpenClassRequestResponse>builder()
                .result(tutorClassRequestService.getOpenRequest(classRequestId))
                .build());
    }

    @PostMapping("/open-requests/{classRequestId}/apply")
    @Operation(
            summary = "Ứng tuyển lớp đang mở (lời nhắn kèm theo tùy chọn)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TutorApplicationResponse>> apply(
            @PathVariable Long classRequestId, @Valid @RequestBody ApplyClassRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<TutorApplicationResponse>builder()
                        .result(tutorClassRequestService.apply(classRequestId, request))
                        .build());
    }

    @DeleteMapping("/applications/{applicationId}")
    @Operation(
            summary = "Rút đơn ứng tuyển khi lớp còn mở và chưa chọn gia sư",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> withdrawApplication(@PathVariable Long applicationId) {
        tutorClassRequestService.withdrawApplication(applicationId);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã rút đơn ứng tuyển")
                .build());
    }

    @GetMapping("/applications")
    @Operation(
            summary = "Lịch sử ứng tuyển và kết quả của gia sư",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<TutorApplicationResponse>>> getMyApplications() {
        return ResponseEntity.ok(ApiResponse.<List<TutorApplicationResponse>>builder()
                .result(tutorClassRequestService.getMyApplications())
                .build());
    }
}
