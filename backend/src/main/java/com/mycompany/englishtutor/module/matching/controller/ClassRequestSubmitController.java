package com.mycompany.englishtutor.module.matching.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.matching.api.request.ClassRequestSubmitRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSubmitResponse;
import com.mycompany.englishtutor.module.matching.service.ClassRequestSubmitService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/public/class-requests")
@RequiredArgsConstructor
@Tag(name = "Public Class Requests", description = "Phụ huynh để lại họ tên + SĐT để được tư vấn / liên hệ gia sư")
public class ClassRequestSubmitController {
    private final ClassRequestSubmitService classRequestSubmitService;

    @PostMapping
    @Operation(summary = "Gửi yêu cầu tư vấn tìm gia sư (tutorId trống) hoặc liên hệ một gia sư cụ thể")
    public ResponseEntity<ApiResponse<ClassRequestSubmitResponse>> submit(
            @Valid @RequestBody ClassRequestSubmitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<ClassRequestSubmitResponse>builder()
                        .result(classRequestSubmitService.submit(request))
                        .build());
    }
}
