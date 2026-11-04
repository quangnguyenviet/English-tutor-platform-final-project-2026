package com.mycompany.englishtutor.module.classroom.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.CreateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonListItem;
import com.mycompany.englishtutor.module.classroom.api.response.LessonMaterialItem;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;
import com.mycompany.englishtutor.module.classroom.service.TutorClassService;
import com.mycompany.englishtutor.shared.api.ApiResponse;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * API lớp học của gia sư (V16): lịch dạy thử (classes.trial_*), lịch cố định
 * (UC-T09), nhật ký dạy học (teaching_logs) trên lưới lịch, và bài giảng
 * (lessons — tab riêng, driver nhúng vào lớp).
 */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
@Tag(name = "Tutor Classroom", description = "Lớp học của gia sư: lịch dạy, nhật ký, bài giảng")
public class TutorClassController {

    private final TutorClassService tutorClassService;
    private final ClassOccurrenceService classOccurrenceService;

    // -------------------------------------------------- READ CLASSES

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
            summary = "Chi tiết lớp học của gia sư (kèm ca thử trial_*, lịch cố định, ngày có log)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<ClassDetailResponse>> getClassDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<ClassDetailResponse>builder()
                .result(tutorClassService.getClassDetail(id))
                .build());
    }

    // ------------------------------------------------- CA THỬ (classes.trial_*)

    @PutMapping("/classes/{id}/trial")
    @Operation(
            summary = "Thiết lập / cập nhật ca dạy thử cho lớp TRIAL (6 cột trial_* trên classes)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TrialSessionResponse>> upsertTrialSlot(
            @PathVariable Long id, @Valid @RequestBody UpsertTrialSessionRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<TrialSessionResponse>builder()
                .message("Đã lưu lịch dạy thử")
                .result(tutorClassService.upsertTrialSlot(id, request, httpRequest))
                .build());
    }

    // ------------------------------------------------- LỊCH CỐ ĐỊNH (UC-T09)

    @PostMapping("/classes/{id}/finalize-schedule")
    @Operation(
            summary = "Chốt lịch dạy cố định lần đầu cho lớp ACTIVE (UC-T09)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<FinalizeScheduleResponse>> finalizeSchedule(
            @PathVariable Long id,
            @Valid @RequestBody FinalizeScheduleRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<FinalizeScheduleResponse>builder()
                        .message("Chốt lịch học cố định thành công")
                        .result(tutorClassService.finalizeSchedule(id, request, httpRequest))
                        .build());
    }

    @PutMapping("/classes/{id}/schedules")
    @Operation(
            summary = "Cập nhật (ghi đè) lịch dạy cố định của lớp ACTIVE (UC-T09)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<FinalizeScheduleResponse>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody FinalizeScheduleRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<FinalizeScheduleResponse>builder()
                .message("Cập nhật lịch học cố định thành công")
                .result(tutorClassService.updateSchedule(id, request, httpRequest))
                .build());
    }

    // ------------------------------------------------- EXCEPTION (overlay)

    @PostMapping("/classes/{id}/exceptions")
    @Operation(
            summary = "Ghi ngoại lệ (CANCELLED/RESCHEDULED) cho 1 ô ca; ô có log chặn CANCELLED/RESCHEDULED",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SessionExceptionResponse>> createException(
            @PathVariable Long id,
            @Valid @RequestBody CreateExceptionRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<SessionExceptionResponse>builder()
                        .message("Đã ghi ngoại lệ lịch dạy")
                        .result(classOccurrenceService.createException(id, request, httpRequest))
                        .build());
    }

    @DeleteMapping("/classes/{id}/exceptions/{scheduleId}/{exceptionDate}")
    @Operation(
            summary = "Gỡ ngoại lệ của 1 ô (lần diễn cụ thể)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> deleteException(
            @PathVariable Long id,
            @PathVariable Long scheduleId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate exceptionDate,
            HttpServletRequest httpRequest) {
        classOccurrenceService.deleteException(id, scheduleId, exceptionDate, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã gỡ ngoại lệ lịch dạy")
                .build());
    }

    // ------------------------------------------------- TEACHING LOGS (trên lưới lịch)

    @PostMapping("/classes/{id}/logs")
    @Operation(
            summary = "Ghi / sửa nhật ký dạy học cho 1 ô ca (upsert theo class, log_date, start_time)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<TeachingLogResponse>> saveLog(
            @PathVariable Long id,
            @Valid @RequestBody SaveTeachingLogRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<TeachingLogResponse>builder()
                .message("Đã lưu nhật ký dạy học")
                .result(classOccurrenceService.saveLog(id, request, httpRequest))
                .build());
    }

    @DeleteMapping("/classes/{id}/logs/{logId}")
    @Operation(
            summary = "Xóa 1 nhật ký dạy học",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> deleteLog(
            @PathVariable Long id,
            @PathVariable Long logId,
            HttpServletRequest httpRequest) {
        classOccurrenceService.deleteLog(id, logId, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xóa nhật ký dạy học")
                .build());
    }

    // ------------------------------------------------- BÀI GIẢNG (lessons) — tab riêng

    @PostMapping("/classes/{id}/lessons")
    @Operation(
            summary = "Tạo bài giảng mới cho lớp (driver nhúng, không lên lịch)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<LessonDetailResponse>> createLesson(
            @PathVariable Long id,
            @Valid @RequestBody CreateLessonRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<LessonDetailResponse>builder()
                        .message("Đã tạo bài giảng")
                        .result(tutorClassService.createLesson(id, request, httpRequest))
                        .build());
    }

    @GetMapping("/classes/{id}/lessons")
    @Operation(
            summary = "Danh sách bài giảng của lớp (ROW_NUMBER theo thời gian tạo)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<LessonListItem>>> listLessons(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<List<LessonListItem>>builder()
                .result(tutorClassService.listLessons(id))
                .build());
    }

    @GetMapping("/lessons/{id}")
    @Operation(
            summary = "Chi tiết bài giảng (tiêu đề, trạng thái, tài liệu, số quiz)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<LessonDetailResponse>> getLessonDetail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<LessonDetailResponse>builder()
                .result(tutorClassService.getLessonDetail(id))
                .build());
    }

    @PutMapping("/lessons/{id}")
    @Operation(
            summary = "Sửa tiêu đề và/hoặc ẩn/hiện bài giảng (PUBLISHED | HIDDEN)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<LessonDetailResponse>> updateLesson(
            @PathVariable Long id,
            @Valid @RequestBody UpdateLessonRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<LessonDetailResponse>builder()
                .message("Đã cập nhật bài giảng")
                .result(tutorClassService.updateLesson(id, request, httpRequest))
                .build());
    }

    @DeleteMapping("/lessons/{id}")
    @Operation(
            summary = "Xóa bài giảng (CASCADE tự xóa tài liệu + quiz)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> deleteLesson(
            @PathVariable Long id, HttpServletRequest httpRequest) {
        tutorClassService.deleteLesson(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã xóa bài giảng")
                .build());
    }

    // ------------------------------------------------- TÀI LIỆU BÀI GIẢNG (FR-12)

    @PostMapping("/lessons/{id}/materials")
    @Operation(
            summary = "Đính kèm tài liệu bài giảng (PDF, DOCX, ảnh, âm thanh — tối đa 20 MB)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<LessonMaterialItem>> uploadLessonMaterial(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file,
            HttpServletRequest httpRequest) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.<LessonMaterialItem>builder()
                        .message("Đã đính kèm tài liệu bài giảng")
                        .result(classOccurrenceService.uploadMaterial(id, file, httpRequest))
                        .build());
    }

    @DeleteMapping("/lessons/{id}/materials/{materialId}")
    @Operation(
            summary = "Gỡ tài liệu bài giảng",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<Void>> deleteLessonMaterial(
            @PathVariable Long id,
            @PathVariable Long materialId,
            HttpServletRequest httpRequest) {
        classOccurrenceService.deleteMaterial(id, materialId, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder()
                .message("Đã gỡ tài liệu bài giảng")
                .build());
    }
}