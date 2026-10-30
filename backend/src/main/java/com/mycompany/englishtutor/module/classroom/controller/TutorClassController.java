package com.mycompany.englishtutor.module.classroom.controller;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
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

import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.CreateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SetSessionStatusRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionLogRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OnDemandSessionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionLogResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionStatusResponse;
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
import org.springframework.web.bind.annotation.DeleteMapping;

/** API lớp học của gia sư, lịch dạy thử (UC-T08), lịch cố định (UC-T09) và viết "Lịch dạy". */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TUTOR')")
@Tag(name = "Tutor Classroom", description = "Lớp học của gia sư & lịch dạy thử")
public class TutorClassController {

    private final TutorClassService tutorClassService;
    private final ClassOccurrenceService classOccurrenceService;

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

    // ------------------------------------------------------------ UC-T09

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

    @PostMapping("/classes/{id}/sessions")
    @Operation(
            summary = "Tạo buổi học chính thức on-demand theo lịch cố định (idempotent)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<OnDemandSessionResponse>> createSessionOnDemand(
            @PathVariable Long id,
            @Valid @RequestBody CreateSessionRequest request,
            HttpServletRequest httpRequest) {
        OnDemandSessionResponse result =
                tutorClassService.createSessionOnDemand(id, request, httpRequest);
        return ResponseEntity.ok(ApiResponse.<OnDemandSessionResponse>builder()
                .message(result.getCreatedNow()
                        ? "Đã tạo buổi học chính thức"
                        : "Buổi học đã tồn tại")
                .result(result)
                .build());
    }

    // ------------------------------------------------- "LỊCH DẠY" (viết, TUTOR)

    @PostMapping("/classes/{id}/exceptions")
    @Operation(
            summary = "Ghi ngoại lệ (hủy/dời/sửa chi tiết) cho ô ảo; ô có buổi thật trả 409",
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

    @PutMapping("/sessions/{id}")
    @Operation(
            summary = "Sửa/dời buổi học thật (chỉ trạng thái SCHEDULED)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SessionDetailResponse>> updateSession(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSessionRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<SessionDetailResponse>builder()
                .message("Đã cập nhật buổi học")
                .result(classOccurrenceService.updateSession(id, request, httpRequest))
                .build());
    }

    @PostMapping("/sessions/{id}/status")
    @Operation(
            summary = "Đổi trạng thái buổi học thật (state machine; hủy sẽ thông báo học sinh)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SessionStatusResponse>> setSessionStatus(
            @PathVariable Long id,
            @Valid @RequestBody SetSessionStatusRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<SessionStatusResponse>builder()
                .result(classOccurrenceService.changeStatus(id, request, httpRequest))
                .build());
    }

    @PutMapping("/sessions/{id}/log")
    @Operation(
            summary = "Lưu nhật ký buổi học (lần đầu lưu sẽ thông báo học sinh)",
            security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<SessionLogResponse>> updateSessionLog(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSessionLogRequest request,
            HttpServletRequest httpRequest) {
        return ResponseEntity.ok(ApiResponse.<SessionLogResponse>builder()
                .result(classOccurrenceService.saveLog(id, request, httpRequest))
                .build());
    }
}
