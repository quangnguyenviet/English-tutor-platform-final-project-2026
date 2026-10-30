package com.mycompany.englishtutor.module.staff.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.mycompany.englishtutor.module.staff.api.request.StudentStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.StudentDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentSummaryResponse;
import com.mycompany.englishtutor.module.staff.service.StudentManagementService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * API quản lý học sinh cho Lễ tân / Admin (API_DESIGN mục 3.10, UC-REC-11, UC-ADM-10, FR-34).
 * Path id giới hạn chữ số để không trùng các route {@code /api/v1/students/me/...} của học sinh.
 */
@RestController
@RequestMapping("/api/v1/students")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
@Tag(name = "Lễ tân/Admin - Quản lý học sinh", description = "Danh sách, chi tiết và khóa/mở tài khoản học sinh")
public class StudentManagementController {

    StudentManagementService studentManagementService;

    @GetMapping
    @Operation(
            summary = "Danh sách học sinh có phân trang và bộ lọc",
            description = "Lọc theo trạng thái (ACTIVE/INACTIVE/ALL), tình trạng học (STUDYING/NOT_STUDYING/ALL) "
                    + "và từ khóa (tên học sinh, tên/SĐT phụ huynh, username, email).",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<StudentSummaryResponse>>> getStudents(
            @Parameter(description = "Trạng thái: ACTIVE, INACTIVE, ALL")
            @RequestParam(required = false) String status,
            @Parameter(description = "Từ khóa tìm theo tên học sinh / tên phụ huynh / SĐT / username / email")
            @RequestParam(required = false) String keyword,
            @Parameter(description = "Tình trạng học: STUDYING (đang có lớp), NOT_STUDYING, ALL")
            @RequestParam(required = false) String learning,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<StudentSummaryResponse>>builder()
                .result(studentManagementService.getStudents(status, keyword, learning, page, size))
                .build());
    }

    @GetMapping("/counts")
    @Operation(
            summary = "Số lượng học sinh theo trạng thái (badge tab)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCounts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String learning) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .result(studentManagementService.getCounts(keyword, learning))
                .build());
    }

    @GetMapping("/{id:\\d+}")
    @Operation(
            summary = "Chi tiết học sinh: cá nhân, phụ huynh, lớp đang và đã học",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StudentDetailResponse>> getStudent(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<StudentDetailResponse>builder()
                .result(studentManagementService.getStudent(id))
                .build());
    }

    @PatchMapping("/{id:\\d+}/status")
    @Operation(
            summary = "Khóa/mở tài khoản học sinh (ACTIVE ↔ INACTIVE)",
            description = "Học sinh INACTIVE bị từ chối đăng nhập. Ghi audit UPDATE_STUDENT_STATUS.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StudentDetailResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid StudentStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<StudentDetailResponse>builder()
                .message("Đã lưu thông tin HS")
                .result(studentManagementService.updateStatus(id, request))
                .build());
    }
}
