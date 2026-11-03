package com.mycompany.englishtutor.module.classroom.controller;

import java.time.LocalDate;
import java.time.LocalTime;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.MaterialAccessUrlResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Đọc "Lịch dạy" + "Bài giảng" (V16, đa vai trò): lattice tuần (ca cố định +
 * ngoại lệ + nhật ký + ca thử), nhật ký dạy học, danh sách/chi tiết bài giảng,
 * và link tải tài liệu bài giảng. Mở cho TUTOR (sở hữu lớp), STUDENT (sở hữu
 * lớp), RECEPTIONIST, ADMIN — tách riêng khỏi {@link TutorClassController}
 * (viết, chỉ TUTOR) để không override {@code @PreAuthorize}.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'RECEPTIONIST', 'ADMIN')")
@Tag(name = "Class Occurrence (read)", description = "Lịch dạy, nhật ký & bài giảng (đọc đa vai trò)")
public class ClassOccurrenceController {

    private final ClassOccurrenceService classOccurrenceService;

    @GetMapping("/classes/{id}/schedule")
    @Operation(
            summary = "Lattice tuần của lớp: ô ca cố định + ngoại lệ + nhật ký + ca thử",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> getClassSchedule(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(ApiResponse.<ClassScheduleResponse>builder()
                .result(classOccurrenceService.listOccurrences(id, weekStart))
                .build());
    }

    @GetMapping("/classes/{id}/logs")
    @Operation(
            summary = "Đọc nhật ký dạy học của 1 ô ca (cho modal trên lưới lịch)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TeachingLogResponse>> getLog(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate logDate,
            @RequestParam String startTime) {
        return ResponseEntity.ok(ApiResponse.<TeachingLogResponse>builder()
                .result(classOccurrenceService.getLog(id, logDate, LocalTime.parse(startTime)))
                .build());
    }

    @GetMapping("/materials/{id}/access-url")
    @Operation(
            summary = "Link tải an toàn (ký sẵn 10 phút) cho tài liệu bài giảng (FR-21)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<MaterialAccessUrlResponse>> getMaterialAccessUrl(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<MaterialAccessUrlResponse>builder()
                .result(classOccurrenceService.getMaterialAccessUrl(id))
                .build());
    }
}