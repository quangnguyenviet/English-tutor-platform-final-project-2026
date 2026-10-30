package com.mycompany.englishtutor.module.classroom.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionListItem;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Đọc "Lịch dạy" (kế hoạch class-sessions mục 4.1/4.4/4.5, [READ] — dòng 6):
 * lattice tuần, danh sách buổi học thật, chi tiết buổi học. Mở cho
 * TUTOR (sở hữu lớp), STUDENT (sở hữu lớp), RECEPTIONIST, ADMIN — khác
 * {@link TutorClassController} (viết, chỉ TUTOR) nên tách riêng để không
 * override class-level {@code @PreAuthorize}.
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TUTOR', 'STUDENT', 'RECEPTIONIST', 'ADMIN')")
@Tag(name = "Class Occurrence (read)", description = "Lịch dạy & buổi học của lớp (đọc đa vai trò)")
public class ClassOccurrenceController {

    private final ClassOccurrenceService classOccurrenceService;

    @GetMapping("/classes/{id}/schedule")
    @Operation(
            summary = "Lattice tuần (occurrences) của lớp: ô SESSION / EXCEPTION / OCCURRENCE",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> getClassSchedule(
            @PathVariable Long id,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate weekStart) {
        return ResponseEntity.ok(
                ApiResponse.<ClassScheduleResponse>builder()
                        .result(classOccurrenceService.listOccurrences(id, weekStart))
                        .build());
    }

    @GetMapping("/classes/{id}/sessions")
    @Operation(
            summary = "Danh sách buổi học thật của lớp (ROW_NUMBER ổn định)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<SessionListItem>>> getClassSessions(
            @PathVariable Long id,
            @RequestParam(required = false, defaultValue = "asc") String order) {
        return ResponseEntity.ok(
                ApiResponse.<List<SessionListItem>>builder()
                        .result(classOccurrenceService.listSessions(id, order))
                        .build());
    }

    @GetMapping("/sessions/{id}")
    @Operation(
            summary = "Chi tiết buổi học (học sinh thấy nhật ký nguyên văn khi không null)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SessionDetailResponse>> getSessionDetail(@PathVariable Long id) {
        return ResponseEntity.ok(
                ApiResponse.<SessionDetailResponse>builder()
                        .result(classOccurrenceService.getDetail(id))
                        .build());
    }
}
