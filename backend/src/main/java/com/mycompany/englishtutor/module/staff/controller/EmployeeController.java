package com.mycompany.englishtutor.module.staff.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.mycompany.englishtutor.module.staff.api.request.EmployeeCreationRequest;
import com.mycompany.englishtutor.module.staff.api.request.EmployeeStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeCreatedResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.EmployeeSummaryResponse;
import com.mycompany.englishtutor.module.staff.service.EmployeeService;
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
import lombok.extern.slf4j.Slf4j;

/**
 * API quản lý nhân sự Lễ tân / Kế toán cho Quản trị viên (API_DESIGN mục 3.10, UC-ADM-11, UC-ADM-12).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/employees")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Admin - Quản lý nhân sự", description = "Thêm mới, xem và đổi trạng thái nhân sự Lễ tân / Kế toán")
public class EmployeeController {

    EmployeeService employeeService;

    @GetMapping
    @Operation(
            summary = "Danh sách nhân sự có phân trang và bộ lọc",
            description = "Lọc theo vai trò (RECEPTIONIST/ACCOUNTANT/ALL), trạng thái (ACTIVE/INACTIVE/ALL) và từ khóa.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<EmployeeSummaryResponse>>> getEmployees(
            @Parameter(description = "Vai trò: RECEPTIONIST, ACCOUNTANT, ALL")
            @RequestParam(required = false) String role,
            @Parameter(description = "Trạng thái: ACTIVE, INACTIVE, ALL")
            @RequestParam(required = false) String status,
            @Parameter(description = "Từ khóa tìm theo tên / email / SĐT / mã NV")
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<EmployeeSummaryResponse>>builder()
                .result(employeeService.getEmployees(role, status, keyword, page, size))
                .build());
    }

    @GetMapping("/counts")
    @Operation(
            summary = "Số lượng nhân sự theo trạng thái (badge tab)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> getCounts(
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .result(employeeService.getCounts(role))
                .build());
    }

    @GetMapping("/{id:\\d+}")
    @Operation(summary = "Chi tiết một nhân sự", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> getEmployee(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<EmployeeDetailResponse>builder()
                .result(employeeService.getEmployee(id))
                .build());
    }

    @PostMapping
    @Operation(
            summary = "Tạo mới tài khoản nhân sự (Lễ tân / Kế toán)",
            description = "Tự sinh mã NV, username và mật khẩu mặc định; trả về thông tin đăng nhập để bàn giao.",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<EmployeeCreatedResponse>> createEmployee(
            @RequestBody @Valid EmployeeCreationRequest request) {
        return ResponseEntity.ok(ApiResponse.<EmployeeCreatedResponse>builder()
                .message("Tạo tài khoản nhân sự thành công")
                .result(employeeService.createEmployee(request))
                .build());
    }

    @PatchMapping("/{id:\\d+}/status")
    @Operation(
            summary = "Đổi trạng thái hoạt động của nhân sự (ACTIVE ↔ INACTIVE)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<EmployeeDetailResponse>> updateStatus(
            @PathVariable Long id,
            @RequestBody @Valid EmployeeStatusUpdateRequest request) {
        return ResponseEntity.ok(ApiResponse.<EmployeeDetailResponse>builder()
                .message("Cập nhật trạng thái nhân sự thành công")
                .result(employeeService.updateStatus(id, request))
                .build());
    }
}
