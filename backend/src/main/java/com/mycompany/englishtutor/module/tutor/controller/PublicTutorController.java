package com.mycompany.englishtutor.module.tutor.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.tutor.api.response.PublicTutorResponse;
import com.mycompany.englishtutor.module.tutor.service.PublicTutorService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/public/tutors")
@RequiredArgsConstructor
@Tag(name = "Public Tutors", description = "Public tutor discovery")
public class PublicTutorController {
    private final PublicTutorService publicTutorService;

    @GetMapping
    @Operation(summary = "Tìm gia sư đang hoạt động (phân trang, page bắt đầu từ 0)")
    public ResponseEntity<ApiResponse<PageResponse<PublicTutorResponse>>> getTutors(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String province,
            @RequestParam(required = false) String district,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String teachingMode,
            @RequestParam(required = false) List<String> specialty,
            @RequestParam(required = false) String gradeGroup) {
        PublicTutorService.Filter filter = new PublicTutorService.Filter(
                keyword, province, district, gender, teachingMode, specialty, gradeGroup);
        return ResponseEntity.ok(ApiResponse.<PageResponse<PublicTutorResponse>>builder()
                .result(publicTutorService.searchActiveTutors(filter, page, size))
                .build());
    }

    @GetMapping("/{tutorId}")
    @Operation(summary = "Lấy hồ sơ công khai của gia sư đang hoạt động")
    public ResponseEntity<ApiResponse<PublicTutorResponse>> getTutor(@PathVariable Long tutorId) {
        return ResponseEntity.ok(ApiResponse.<PublicTutorResponse>builder()
                .result(publicTutorService.getActiveTutor(tutorId))
                .build());
    }
}
