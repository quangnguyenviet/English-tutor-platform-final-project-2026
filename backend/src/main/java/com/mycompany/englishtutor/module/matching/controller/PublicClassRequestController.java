package com.mycompany.englishtutor.module.matching.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.response.PublicClassRequestResponse;
import com.mycompany.englishtutor.module.matching.service.PublicClassRequestService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/public/classes")
@RequiredArgsConstructor
@Tag(name = "Public Classes", description = "Public class requests that are open for tutors")
public class PublicClassRequestController {
    private final PublicClassRequestService publicClassRequestService;

    @GetMapping
    @Operation(summary = "Lấy danh sách lớp đang cần gia sư (phân trang, page bắt đầu từ 0)")
    public ResponseEntity<ApiResponse<PageResponse<PublicClassRequestResponse>>> getClasses(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String teachingMode,
            @RequestParam(required = false) String gradeGroup,
            @RequestParam(required = false) String sort) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<PublicClassRequestResponse>>builder()
                .result(publicClassRequestService.getOpenClassRequests(teachingMode, gradeGroup, sort, page, size))
                .build());
    }

    @GetMapping("/{classRequestId}")
    @Operation(summary = "Lấy chi tiết lớp đang cần gia sư")
    public ResponseEntity<ApiResponse<PublicClassRequestResponse>> getClassRequest(
            @PathVariable Long classRequestId) {
        return ResponseEntity.ok(ApiResponse.<PublicClassRequestResponse>builder()
                .result(publicClassRequestService.getOpenClassRequest(classRequestId))
                .build());
    }
}
