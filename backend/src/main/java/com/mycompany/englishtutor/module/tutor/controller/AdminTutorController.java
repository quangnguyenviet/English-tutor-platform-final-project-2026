package com.mycompany.englishtutor.module.tutor.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileRejectRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.service.AdminTutorService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * API duyệt / từ chối hồ sơ gia sư — dành cho Lễ tân và Quản trị viên.
 *
 * <p>Không dùng chung với {@link TutorProfileController} (luồng tự phục vụ của gia sư)
 * để tách biệt quyền truy cập.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/tutors")
@RequiredArgsConstructor
@Tag(name = "Admin - Tutor Review", description = "Approve or reject tutor profiles")
public class AdminTutorController {

    private final AdminTutorService adminTutorService;

    @GetMapping("/pending")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy danh sách hồ sơ gia sư đang chờ duyệt",
            description = "Chỉ trả thông tin tóm tắt. Dùng GET /api/v1/admin/tutors/{tutorId} để lấy chi tiết khi cần duyệt.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Pending profiles retrieved successfully"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Requires RECEPTIONIST or ADMIN role")
    })
    public ResponseEntity<ApiResponse<List<TutorPendingSummaryResponse>>> getPendingProfiles() {
        List<TutorPendingSummaryResponse> pendingProfiles = adminTutorService.getPendingProfiles();

        return ResponseEntity.ok(ApiResponse.<List<TutorPendingSummaryResponse>>builder()
                .result(pendingProfiles)
                .build());
    }

    @GetMapping("/{tutorId}")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy chi tiết hồ sơ gia sư",
            description = "Trả về hồ sơ đầy đủ (kèm khu vực dạy, chuyên môn, học phí, lịch rảnh, chứng chỉ) để admin review trước khi duyệt/từ chối.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "200",
                    description = "Tutor profile detail retrieved successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "403",
                    description = "Requires RECEPTIONIST or ADMIN role"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(
                    responseCode = "404",
                    description = "Tutor profile not found")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> getProfileDetail(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId) {

        log.info("Received detail request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.getProfileDetail(tutorId))
                .build());
    }

    @PostMapping("/{tutorId}/approve")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Duyệt hồ sơ gia sư", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Profile approved, status changed to ACTIVE"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Requires RECEPTIONIST or ADMIN role"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Tutor profile not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "409",
                description = "Profile is not in PENDING status")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> approve(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId) {

        log.info("Received approve request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.approve(tutorId))
                .build());
    }

    @PostMapping("/{tutorId}/reject")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Từ chối hồ sơ gia sư", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "200",
                description = "Profile rejected, status changed to REJECTED"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "400",
                description = "Missing rejection reason"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Unauthorized"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "403",
                description = "Requires RECEPTIONIST or ADMIN role"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "404",
                description = "Tutor profile not found"),
        @io.swagger.v3.oas.annotations.responses.ApiResponse(
                responseCode = "409",
                description = "Profile is not in PENDING status")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> reject(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId,
            @RequestBody @Valid TutorProfileRejectRequest request) {

        log.info("Received reject request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.reject(tutorId, request))
                .build());
    }
}
