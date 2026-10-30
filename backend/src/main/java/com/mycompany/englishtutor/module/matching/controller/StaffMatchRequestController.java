package com.mycompany.englishtutor.module.matching.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.CancelMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CompleteMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.RematchMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.UpdateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.service.StaffMatchRequestService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PutMapping;

@RestController
@RequestMapping({"/api/v1/match-requests", "/api/v1/admin/match-requests"})
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
@Tag(name = "Staff Match Requests", description = "Quản lý Đơn ghép lớp dành cho Lễ tân và Admin")
public class StaffMatchRequestController {

    private final StaffMatchRequestService matchRequestService;

    @GetMapping
    @Operation(summary = "Lấy danh sách Đơn ghép lớp phân trang theo Tab", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<PageResponse<MatchRequestSummaryResponse>>> getMatchRequests(
            @RequestParam(required = false) String tab,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<MatchRequestSummaryResponse>>builder()
                .result(matchRequestService.getMatchRequests(tab, keyword, page, size))
                .build());
    }

    @GetMapping("/counts")
    @Operation(summary = "Lấy số lượng đơn theo từng tab thống kê", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Map<String, Long>>> getTabCounts() {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder()
                .result(matchRequestService.getTabCounts())
                .build());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Xem chi tiết một đơn ghép lớp", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> getMatchRequest(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<MatchRequestDetailResponse>builder()
                .result(matchRequestService.getMatchRequest(id))
                .build());
    }

    @PostMapping
    @Operation(summary = "Tạo mới đơn ghép lớp tại quầy (UC-REC-05, UC-ADM-04)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> createMatchRequest(
            @Valid @RequestBody CreateMatchRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<MatchRequestDetailResponse>builder()
                        .message("Tạo đơn ghép lớp thành công")
                        .result(matchRequestService.createMatchRequest(request, httpRequest))
                        .build());
    }

    @PutMapping("/{id}")
    @Operation(summary = "Hoàn thiện đơn ghép lớp (chỉ khi còn NEW): bổ sung học phí, tỷ lệ phí nhận lớp (kế hoạch mục 4.1.1)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> updateMatchRequest(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMatchRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<MatchRequestDetailResponse>builder()
                .message("Cập nhật đơn ghép lớp thành công")
                .result(matchRequestService.updateMatchRequest(id, request, httpRequest))
                .build());
    }

    @PostMapping("/{id}/confirm")
    @Operation(summary = "Duyệt / Xác nhận đơn ghép lớp (UC-REC-06, UC-ADM-05)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> confirmMatchRequest(
            @PathVariable Long id, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<MatchRequestDetailResponse>builder()
                .message("Đã xác nhận đơn ghép lớp và chuyển sang đang dạy thử")
                .result(matchRequestService.confirmMatchRequest(id, httpRequest))
                .build());
    }

    @PostMapping("/{id}/complete-match")
    @Operation(summary = "Duyệt đơn ghép lớp từ dạy thử sang ghép thành công (UC-REC-06.1, UC-ADM-05.1) — body tùy chọn bổ sung dữ liệu tính phí", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> completeMatchRequest(
            @PathVariable Long id,
            @Valid @RequestBody(required = false) CompleteMatchRequest body,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<MatchRequestDetailResponse>builder()
                .message("Đã duyệt đơn ghép lớp thành công, lớp học chuyển sang chính thức")
                .result(matchRequestService.completeMatchRequest(id, body, httpRequest))
                .build());
    }

    @PostMapping("/{id}/rematch")
    @Operation(summary = "Ghép lại khi dạy thử không thành công: đơn → REMATCH, gia sư cũ TERMINATED (UC-REC-06.1 nhánh 5.2, UC-PA-05)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MatchRequestDetailResponse>> rematchMatchRequest(
            @PathVariable Long id, @Valid @RequestBody RematchMatchRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<MatchRequestDetailResponse>builder()
                .message("Đã chuyển đơn sang Đang ghép lại, lớp dạy thử đã được hủy")
                .result(matchRequestService.rematchMatchRequest(id, request, httpRequest))
                .build());
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy đơn ghép lớp kèm lý do (UC-REC-07, UC-ADM-06)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> cancelMatchRequest(
            @PathVariable Long id, @Valid @RequestBody CancelMatchRequest request, HttpServletRequest httpRequest) {
        matchRequestService.cancelMatchRequest(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã hủy đơn ghép lớp thành công")
                .build());
    }
}
