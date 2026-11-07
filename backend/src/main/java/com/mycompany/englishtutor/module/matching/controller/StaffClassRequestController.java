package com.mycompany.englishtutor.module.matching.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ChangeDesignatedTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.CompleteMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.ParentCheckRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.SelectTutorRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.api.response.ParentCheckResponse;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API Lễ tân/Admin quản lý Lớp cần gia sư, gồm cả lớp có gia sư chỉ định và lớp đăng tuyển. */
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

    @PostMapping("/parent-check")
    @Operation(summary = "Kiểm tra SĐT đã thuộc về phụ huynh nào và họ tên có khớp không", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ParentCheckResponse>> checkParent(@Valid @RequestBody ParentCheckRequest request) {
        return ResponseEntity.ok(ApiResponse.<ParentCheckResponse>builder()
                .result(classRequestService.checkParent(request))
                .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Sửa thông tin lớp: đủ trường khi chờ xử lý, chỉ học phí, mục tiêu, yêu cầu gia sư khi đang ghép lại", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> update(
            @PathVariable Long id, @Valid @RequestBody UpdateClassRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Cập nhật lớp cần gia sư thành công")
                .result(classRequestService.update(id, request, httpRequest))
                .build());
    }

    @PatchMapping("/{id}/designated-tutor")
    @Operation(summary = "Đổi gia sư chỉ định khi lớp chờ xử lý hoặc đang ghép lại, tutorId null là không chỉ định", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> changeDesignatedTutor(
            @PathVariable Long id, @RequestBody ChangeDesignatedTutorRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã cập nhật gia sư chỉ định")
                .result(classRequestService.changeDesignatedTutor(id, request, httpRequest))
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

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Xác nhận lớp có gia sư chỉ định và chuyển sang dạy thử", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> confirm(
            @PathVariable Long id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã xác nhận và chuyển lớp sang đang dạy thử")
                .result(classRequestService.confirm(id, httpRequest))
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

    @PostMapping("/{id}/complete-match")
    @Operation(summary = "Xác nhận ghép thành công sau dạy thử, body tùy chọn bổ sung dữ liệu tính phí", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> complete(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CompleteMatchRequest body,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã xác nhận ghép thành công, lớp học chuyển sang chính thức")
                .result(classRequestService.complete(id, body, httpRequest))
                .build());
    }

    @PostMapping("/{id}/rematch")
    @Operation(summary = "Ghép lại khi dạy thử không thành công, gia sư cũ bị loại khỏi lớp", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassRequestDetailResponse>> rematch(
            @PathVariable Long id, @Valid @RequestBody RematchMatchRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<ClassRequestDetailResponse>builder()
                .message("Đã chuyển lớp sang đang ghép lại")
                .result(classRequestService.rematch(id, request, httpRequest))
                .build());
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy lớp kèm lý do, lớp đã ghép thành công chỉ hủy trong 7 ngày", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> cancel(
            @PathVariable Long id, @Valid @RequestBody CancelClassRequest request, HttpServletRequest httpRequest) {
        classRequestService.cancel(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã hủy lớp cần gia sư")
                .build());
    }
}
