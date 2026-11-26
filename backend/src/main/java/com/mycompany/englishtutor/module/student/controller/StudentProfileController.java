package com.mycompany.englishtutor.module.student.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.student.api.StudentProfileDtos.StudentProfileRequest;
import com.mycompany.englishtutor.module.student.api.StudentProfileDtos.StudentProfileResponse;
import com.mycompany.englishtutor.module.student.service.StudentProfileService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/students/me/profile")
@RequiredArgsConstructor
@Tag(name = "Cổng học sinh", description = "Trang cá nhân của học sinh")
public class StudentProfileController {

    private final StudentProfileService service;

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Hồ sơ học sinh đang đăng nhập", security = @SecurityRequirement(name = "bearerAuth"))
    public ApiResponse<StudentProfileResponse> get() {
        return ApiResponse.<StudentProfileResponse>builder().result(service.getMyProfile()).build();
    }

    @PutMapping
    @PreAuthorize("hasRole('STUDENT')")
    @Operation(summary = "Học sinh sửa hồ sơ của mình", security = @SecurityRequirement(name = "bearerAuth"))
    public ApiResponse<StudentProfileResponse> update(
            @Valid @RequestBody StudentProfileRequest request, HttpServletRequest http) {
        return ApiResponse.<StudentProfileResponse>builder().result(service.updateMyProfile(request, http)).build();
    }
}
