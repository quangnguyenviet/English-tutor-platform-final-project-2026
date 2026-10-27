package com.mycompany.englishtutor.module.classroom.controller;

import java.util.List;

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

import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.service.TutorClassService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API lớp học của gia sư và lịch dạy thử (API_DESIGN mục 3.5, UC-T08). */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
@Tag(name = "Tutor Classroom", description = "Lớp học của gia sư & lịch dạy thử")
public class TutorClassController {

    private final TutorClassService tutorClassService;

    @GetMapping("/tutors/me/classes")
    @Operation(
            summary = "Danh sách lớp học của gia sư, lọc theo trạng thái",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<ClassSummaryResponse>>> getMyClasses(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(ApiResponse.<List<ClassSummaryResponse>>builder()
                .result(tutorClassService.getMyClasses(status))
                .build());
    }

    @GetMapping("/classes/{id}")
    @Operation(
            summary = "Chi tiết lớp học của gia sư (kèm buổi dạy thử nếu có)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassDetailResponse>> getClassDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<ClassDetailResponse>builder()
                .result(tutorClassService.getClassDetail(id))
                .build());
    }

    @PostMapping("/classes/{id}/trial-session")
    @Operation(
            summary = "Thiết lập lịch dạy thử cho lớp đang ở trạng thái TRIAL (mỗi lớp tối đa 1 buổi)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TrialSessionResponse>> createTrialSession(
            @PathVariable Long id, @Valid @RequestBody UpsertTrialSessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<TrialSessionResponse>builder()
                        .result(tutorClassService.createTrialSession(id, request))
                        .build());
    }

    @PutMapping("/classes/{id}/trial-session")
    @Operation(
            summary = "Chỉnh sửa/dời lịch dạy thử khi buổi thử chưa diễn ra",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TrialSessionResponse>> updateTrialSession(
            @PathVariable Long id, @Valid @RequestBody UpsertTrialSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.<TrialSessionResponse>builder()
                .result(tutorClassService.updateTrialSession(id, request))
                .build());
    }
}
