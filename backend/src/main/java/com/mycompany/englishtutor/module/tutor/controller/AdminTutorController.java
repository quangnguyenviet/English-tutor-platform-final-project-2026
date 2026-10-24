package com.mycompany.englishtutor.module.tutor.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.mycompany.englishtutor.module.tutor.api.request.TutorAdminUpdateRequest;
import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileRejectRequest;
import com.mycompany.englishtutor.module.tutor.api.request.TutorStatusUpdateRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.service.AdminTutorService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * API quản lý và duyệt hồ sơ gia sư dành cho Lễ tân và Quản trị viên (FR-31, FR-32, UC-REC-08, UC-REC-09, UC-ADM-07, UC-ADM-08).
 * Chuẩn endpoint thống nhất: /api/v1/tutors (đồng thời hỗ trợ /api/v1/admin/tutors).
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/tutors", "/api/v1/admin/tutors"})
@RequiredArgsConstructor
@Tag(name = "Staff - Tutor Management & Review", description = "Duyệt, quản lý trạng thái và danh sách gia sư")
public class AdminTutorController {

    private final AdminTutorService adminTutorService;

    @GetMapping
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy danh sách gia sư có phân trang và bộ lọc",
            description = "Hỗ trợ lọc theo trạng thái (status) và tìm kiếm từ khóa (keyword theo tên, email, SĐT, trường đại học).",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<TutorPendingSummaryResponse>>> getTutors(
            @Parameter(description = "Trạng thái hồ sơ: PENDING, ACTIVE, INACTIVE, REJECTED, ALL")
            @RequestParam(required = false) String status,
            @Parameter(description = "Từ khóa tìm kiếm")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Số trang (bắt đầu từ 0)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Số bản ghi mỗi trang")
            @RequestParam(defaultValue = "20") int size) {

        log.info("GET /api/v1/tutors: status={}, keyword={}, page={}, size={}", status, keyword, page, size);
        PageResponse<TutorPendingSummaryResponse> result = adminTutorService.getTutors(status, keyword, page, size);

        return ResponseEntity.ok(ApiResponse.<PageResponse<TutorPendingSummaryResponse>>builder()
                .result(result)
                .build());
    }

    @GetMapping("/counts")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy số lượng gia sư theo từng trạng thái để làm badge đếm",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> getStatusCounts() {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .result(adminTutorService.getStatusCounts())
                .build());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy danh sách hồ sơ gia sư đang chờ duyệt (Rút gọn)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<TutorPendingSummaryResponse>>> getPendingProfiles() {
        List<TutorPendingSummaryResponse> pendingProfiles = adminTutorService.getPendingProfiles();

        return ResponseEntity.ok(ApiResponse.<List<TutorPendingSummaryResponse>>builder()
                .result(pendingProfiles)
                .build());
    }

    @GetMapping("/{tutorId:\\d+}")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(
            summary = "Lấy chi tiết hồ sơ gia sư",
            description = "Trả về hồ sơ đầy đủ (kèm khu vực dạy, chuyên môn, học phí, lịch rảnh, chứng chỉ kèm link ảnh) để review trước khi duyệt/từ chối.",
            security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lấy chi tiết thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền RECEPTIONIST hoặc ADMIN"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy hồ sơ gia sư")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> getProfileDetail(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId) {

        log.info("Received detail request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.getProfileDetail(tutorId))
                .build());
    }

    @PostMapping("/{tutorId:\\d+}/approve")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Duyệt hồ sơ gia sư (PENDING -> ACTIVE)", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Duyệt thành công, chuyển sang ACTIVE"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy hồ sơ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Hồ sơ không ở trạng thái PENDING")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> approve(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId) {

        log.info("Received approve request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.approve(tutorId))
                .build());
    }

    @PostMapping("/{tutorId:\\d+}/reject")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Từ chối hồ sơ gia sư (PENDING -> REJECTED)", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Từ chối thành công, chuyển sang REJECTED"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Thiếu lý do từ chối"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Chưa xác thực"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Không có quyền"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Không tìm thấy hồ sơ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Hồ sơ không ở trạng thái PENDING")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> reject(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId,
            @RequestBody @Valid TutorProfileRejectRequest request) {

        log.info("Received reject request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.reject(tutorId, request))
                .build());
    }

    @PatchMapping("/{tutorId:\\d+}/status")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Đổi trạng thái hoạt động (ACTIVE <-> INACTIVE)", security = @SecurityRequirement(name = "bearerAuth"))
    @ApiResponses(value = {
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Đổi trạng thái thành công"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Dữ liệu không hợp lệ"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Chuyển trạng thái vi phạm máy trạng thái")
    })
    public ResponseEntity<ApiResponse<TutorProfileResponse>> updateStatus(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId,
            @RequestBody @Valid TutorStatusUpdateRequest request) {

        log.info("Received update status request for tutorId: {}, status: {}", tutorId, request.getStatus());

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.updateStatus(tutorId, request))
                .build());
    }

    @PatchMapping("/{tutorId:\\d+}")
    @PreAuthorize("hasRole('RECEPTIONIST') or hasRole('ADMIN')")
    @Operation(summary = "Quản trị viên cập nhật thông tin hồ sơ gia sư", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TutorProfileResponse>> updateProfile(
            @Parameter(description = "ID hồ sơ gia sư") @PathVariable Long tutorId,
            @RequestBody @Valid TutorAdminUpdateRequest request) {

        log.info("Received update profile request for tutorId: {}", tutorId);

        return ResponseEntity.ok(ApiResponse.<TutorProfileResponse>builder()
                .result(adminTutorService.updateProfile(tutorId, request))
                .build());
    }
}
