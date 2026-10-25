package com.mycompany.englishtutor.module.matching.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.SelectTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API Lễ tân/Admin quản lý Lớp cần gia sư (API_DESIGN mục 3.4, UC-REC-02/03/04, UC-ADM-01/02/03). */
@RestController
@RequestMapping({"/api/v1/class-requests", "/api/v1/admin/class-requests"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
@Tag(name = "Staff Class Requests", description = "Quản lý Lớp cần gia sư dành cho Lễ tân và Admin")
public class StaffClassRequestController {

    private final StaffClassRequestService classRequestService;

    @GetMapping
    @Operation(summary = "Danh sách lớp cần gia sư phân trang theo tab", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<ClassRequestSummaryResponse>>> getClassRequests(
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<ClassRequestSummaryResponse>>builder()
                .result(classRequestService.getClassRequests(tab, keyword, sort, page, size))
                .build());
    }

    @GetMapping("/counts")
    @Operation(summary = "Số lượng lớp theo từng tab thống kê", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTabCounts() {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .result(classRequestService.getTabCounts())
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết lớp cần gia sư kèm danh sách ứng tuyển", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> getClassRequest(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .result(classRequestService.getClassRequest(id))
                .build());
    }

    @GetMapping("/{id}/applications")
    @Operation(summary = "Danh sách gia sư ứng tuyển lớp (UC-REC-03)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<ClassApplicationResponse>>> getApplications(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<List<ClassApplicationResponse>>builder()
                .result(classRequestService.getApplications(id))
                .build());
    }

    @PostMapping
    @Operation(summary = "Tạo mới lớp cần gia sư (UC-REC-02, UC-ADM-01)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> create(
            @Valid @RequestBody CreateClassRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ClassRequestDetailResponse>builder()
                        .message("Tạo lớp cần gia sư thành công")
                        .result(classRequestService.create(request, httpRequest))
                        .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Bổ sung/sửa thông tin lớp cần gia sư (chỉ khi còn chờ xử lý)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UpdateClassRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Cập nhật lớp cần gia sư thành công")
                .result(classRequestService.update(id, request, httpRequest))
                .build());
    }

    @PostMapping("/{id}/publish")
    @Operation(summary = "Đăng tuyển lớp lên trang gia sư (NEW → OPEN)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> publish(
            @PathVariable Long id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã đăng lớp cần gia sư, gia sư có thể ứng tuyển")
                .result(classRequestService.publish(id, httpRequest))
                .build());
    }

    @PostMapping("/{id}/select-tutor")
    @Operation(summary = "Chọn gia sư từ danh sách ứng tuyển (UC-REC-03, UC-ADM-02)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> selectTutor(
            @PathVariable Long id, @Valid @RequestBody SelectTutorRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã chọn gia sư và tạo lớp dạy thử")
                .result(classRequestService.selectTutor(id, request, httpRequest))
                .build());
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy lớp cần gia sư kèm lý do (UC-REC-04, UC-ADM-03)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long id, @Valid @RequestBody CancelClassRequest request, HttpServletRequest httpRequest) {
        classRequestService.cancel(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã hủy lớp cần gia sư")
                .build());
    }
}
