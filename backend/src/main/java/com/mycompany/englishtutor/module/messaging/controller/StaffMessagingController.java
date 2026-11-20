package com.mycompany.englishtutor.module.messaging.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.CompleteMatchRequest;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.FeePolicyRequest;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.PiiEventItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.PostingStaffItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.ReasonRequest;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.ReviewRequest;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.StaffRoomItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.Transcript;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.TrialClassItem;
import com.mycompany.englishtutor.module.messaging.service.FeePolicyService;
import com.mycompany.englishtutor.module.messaging.service.FeePolicyService.FeePolicy;
import com.mycompany.englishtutor.module.messaging.service.StaffMessagingService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Lễ tân/Admin: duyệt tin đăng, transcript chỉ đọc, log kiểm duyệt, lớp dạy thử từ chat, bảng phí. */
@RestController
@RequestMapping("/api/v1/staff/chat")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
@Tag(name = "Staff Chat", description = "Quản lý nhắn tin và tin đăng dành cho Lễ tân/Admin")
public class StaffMessagingController {

    private static final String BEARER = "bearerAuth";

    private final StaffMessagingService service;
    private final StaffClassRequestService classRequestService;
    private final FeePolicyService feePolicyService;

    @GetMapping("/postings")
    @Operation(summary = "Tin đăng của phụ huynh (mặc định NEW/OPEN)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<PostingStaffItem>> postings(@RequestParam(required = false) String status) {
        return ApiResponse.<List<PostingStaffItem>>builder().result(service.listPostings(status)).build();
    }

    @PostMapping("/postings/{id}/approve")
    @Operation(summary = "Duyệt tin: NEW → OPEN", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> approve(@PathVariable Long id, HttpServletRequest http) {
        service.approvePosting(id, http);
        return ApiResponse.<Void>builder().message("Đã duyệt và đăng tin").build();
    }

    @PostMapping("/postings/{id}/reject")
    @Operation(summary = "Hủy tin kèm lý do", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> reject(@PathVariable Long id, @Valid @RequestBody ReasonRequest request, HttpServletRequest http) {
        service.rejectPosting(id, request.reason(), http);
        return ApiResponse.<Void>builder().message("Đã hủy tin đăng").build();
    }

    @GetMapping("/rooms")
    @Operation(summary = "Danh sách phòng chat (lọc loại phòng, có đề xuất chờ)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<StaffRoomItem>> rooms(
            @RequestParam(required = false) String roomType, @RequestParam(required = false) Boolean hasPending) {
        return ApiResponse.<List<StaffRoomItem>>builder().result(service.listRooms(roomType, hasPending)).build();
    }

    @GetMapping("/rooms/{roomId}/transcript")
    @Operation(summary = "Transcript chỉ đọc qua tài khoản dịch vụ của backend", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Transcript> transcript(
            @PathVariable Long roomId, @RequestParam(required = false) String before, @RequestParam(required = false) Integer limit) {
        return ApiResponse.<Transcript>builder().result(service.transcript(roomId, before, limit)).build();
    }

    @GetMapping("/pii-events")
    @Operation(summary = "Log kiểm duyệt PII và mở khóa SĐT", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<PiiEventItem>> piiEvents(
            @RequestParam(required = false) Long roomId, @RequestParam(required = false) String type) {
        return ApiResponse.<List<PiiEventItem>>builder().result(service.listPiiEvents(roomId, type)).build();
    }

    @PostMapping("/pii-events/{eventId}/review")
    @Operation(summary = "Đánh dấu đã xem xét tin bị chặn (không công khai lại)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> review(@PathVariable Long eventId, @RequestBody(required = false) ReviewRequest request, HttpServletRequest http) {
        service.reviewPiiEvent(eventId, request == null ? null : request.note(), http);
        return ApiResponse.<Void>builder().message("Đã ghi nhận xem xét").build();
    }

    @GetMapping("/trial-classes")
    @Operation(summary = "Lớp dạy thử tạo từ đề xuất, chờ xác nhận sau dạy thử", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<TrialClassItem>> trialClasses() {
        return ApiResponse.<List<TrialClassItem>>builder().result(service.listTrialClasses()).build();
    }

    @PostMapping("/classes/{classId}/complete")
    @Operation(summary = "Xác nhận lớp tạo từ nhắn tin trực tiếp chuyển chính thức sau dạy thử", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> complete(
            @PathVariable Long classId, @Valid @RequestBody(required = false) CompleteMatchRequest body, HttpServletRequest http) {
        classRequestService.completeDirectClass(classId, body, http);
        return ApiResponse.<Void>builder().message("Lớp học đã chuyển sang chính thức").build();
    }

    @PostMapping("/classes/{classId}/cancel-trial")
    @Operation(summary = "Hủy lớp dạy thử không thành công (lớp không có đơn)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<Void> cancelTrial(@PathVariable Long classId, @Valid @RequestBody ReasonRequest request, HttpServletRequest http) {
        classRequestService.cancelDirectTrialClass(classId, request.reason().strip(), http);
        return ApiResponse.<Void>builder().message("Đã hủy lớp dạy thử").build();
    }

    @GetMapping("/fee-policies")
    @Operation(summary = "Lịch sử cấu hình phí theo loại lớp", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<FeePolicy>> feePolicies() {
        return ApiResponse.<List<FeePolicy>>builder().result(feePolicyService.listHistory()).build();
    }

    @PostMapping("/fee-policies")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin thêm cấu hình phí mới (không sửa dòng cũ)", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<FeePolicy> addFeePolicy(@Valid @RequestBody FeePolicyRequest request, HttpServletRequest http) {
        return ApiResponse.<FeePolicy>builder()
                .message("Đã cập nhật cấu hình phí").result(feePolicyService.addPolicy(request.classType(), request.feePercentage(), http)).build();
    }
}
