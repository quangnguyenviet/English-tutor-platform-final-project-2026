package com.mycompany.englishtutor.module.messaging.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem;
import com.mycompany.englishtutor.module.messaging.api.ParentProfileRequest;
import com.mycompany.englishtutor.module.messaging.api.ParentProfileResponse;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.ApplicantsResponse;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.CancelPostingRequest;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.CreatePostingRequest;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.PostingItem;
import com.mycompany.englishtutor.module.messaging.service.ParentPostingService;
import com.mycompany.englishtutor.module.messaging.service.ParentProfileService;
import com.mycompany.englishtutor.module.messaging.service.PiiBlockedException;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Hồ sơ phụ huynh (wizard) và tin đăng "Lớp cần gia sư". */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasRole('PARENT')")
@Tag(name = "Parent", description = "Hồ sơ phụ huynh và tin đăng tìm gia sư")
public class ParentController {

    private static final String BEARER = "bearerAuth";

    private final ParentProfileService profileService;
    private final ParentPostingService postingService;

    @GetMapping("/parents/me")
    @Operation(summary = "Hồ sơ phụ huynh đang đăng nhập", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<ParentProfileResponse> me() {
        return ApiResponse.<ParentProfileResponse>builder().result(profileService.getMyProfile()).build();
    }

    @PutMapping("/parents/me/profile")
    @Operation(summary = "Lưu wizard: SĐT, họ tên, mục đích, khu vực", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<ParentProfileResponse> saveProfile(@Valid @RequestBody ParentProfileRequest request, HttpServletRequest http) {
        return ApiResponse.<ParentProfileResponse>builder()
                .message("Đã lưu thông tin phụ huynh").result(profileService.saveProfile(request, http)).build();
    }

    @PostMapping("/parent/postings")
    @Operation(summary = "Đăng tin tìm gia sư (chờ Lễ tân duyệt)", security = @SecurityRequirement(name = BEARER))
    public ResponseEntity<ApiResponse<PostingItem>> createPosting(
            @Valid @RequestBody CreatePostingRequest request, HttpServletRequest http) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.<PostingItem>builder()
                .message("Đã gửi tin, trung tâm sẽ duyệt trong 24 giờ").result(postingService.create(request, http)).build());
    }

    @GetMapping("/parent/postings")
    @Operation(summary = "Các tin đăng của tôi", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<List<PostingItem>> postings() {
        return ApiResponse.<List<PostingItem>>builder().result(postingService.listMine()).build();
    }

    @GetMapping("/parent/postings/{postingId}/applicants")
    @Operation(summary = "Danh sách gia sư ứng tuyển của một tin", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<ApplicantsResponse> applicants(@PathVariable Long postingId) {
        return ApiResponse.<ApplicantsResponse>builder().result(postingService.applicants(postingId)).build();
    }

    @PostMapping("/parent/postings/{postingId}/cancel")
    @Operation(summary = "Đóng tin đăng", security = @SecurityRequirement(name = BEARER))
    public ApiResponse<PostingItem> cancel(
            @PathVariable Long postingId, @Valid @RequestBody(required = false) CancelPostingRequest request, HttpServletRequest http) {
        return ApiResponse.<PostingItem>builder()
                .result(postingService.cancel(postingId, request == null ? null : request.reason(), http)).build();
    }

    @ExceptionHandler(PiiBlockedException.class)
    public ResponseEntity<ApiResponse<List<PiiViolationItem>>> onPiiBlocked(PiiBlockedException e) {
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(ApiResponse.<List<PiiViolationItem>>builder()
                .code(ErrorCode.CHAT_PII_BLOCKED.getCode()).message("Ghi chú không được chứa thông tin liên hệ (số điện thoại, email, Zalo...)")
                .result(e.getViolations()).build());
    }
}
