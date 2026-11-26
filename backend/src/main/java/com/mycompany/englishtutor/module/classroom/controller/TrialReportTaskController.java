package com.mycompany.englishtutor.module.classroom.controller;

import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mycompany.englishtutor.module.classroom.api.request.TrialReportTaskAssignRequest;
import com.mycompany.englishtutor.module.classroom.api.request.TrialReportTaskStatusRequest;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskListItemResponse;
import com.mycompany.englishtutor.module.classroom.service.TrialReportTaskService;
import com.mycompany.englishtutor.shared.api.ApiResponse;
import com.mycompany.englishtutor.shared.api.PageResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** API hàng đợi dạy thử thất bại dành cho admin/lễ tân (V32). */
@RestController
@RequestMapping("/api/v1/trial-report-tasks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
public class TrialReportTaskController {

    private final TrialReportTaskService taskService;

    @GetMapping
    public ResponseEntity<ApiResponse<PageResponse<TrialReportTaskListItemResponse>>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Long assignedTo,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size) {
        return ResponseEntity.ok(ApiResponse.<PageResponse<TrialReportTaskListItemResponse>>builder()
                .result(taskService.listTasks(status, assignedTo, page, size))
                .build());
    }

    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> counts() {
        return ResponseEntity.ok(ApiResponse.<Map<String, Long>>builder().result(taskService.getTaskCounts()).build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TrialReportTaskDetailResponse>> detail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.<TrialReportTaskDetailResponse>builder()
                .result(taskService.getTaskDetail(id)).build());
    }

    @PostMapping("/{id}/assign-self")
    public ResponseEntity<ApiResponse<Void>> assignSelf(@PathVariable Long id) {
        taskService.assignSelf(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã gán việc cho bạn").build());
    }

    @DeleteMapping("/{id}/assignment")
    public ResponseEntity<ApiResponse<Void>> unassign(@PathVariable Long id) {
        taskService.unassign(id);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã bỏ gán việc").build());
    }

    @PutMapping("/{id}/assignment")
    public ResponseEntity<ApiResponse<Void>> assign(
            @PathVariable Long id, @Valid @RequestBody TrialReportTaskAssignRequest request) {
        taskService.assign(id, request.getUserId());
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã gán việc").build());
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Void>> changeStatus(
            @PathVariable Long id, @Valid @RequestBody TrialReportTaskStatusRequest request) {
        taskService.changeStatus(id, request.getStatus());
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã cập nhật trạng thái xử lý").build());
    }

    @PostMapping("/{id}/rematch")
    public ResponseEntity<ApiResponse<Void>> rematch(@PathVariable Long id, HttpServletRequest httpRequest) {
        taskService.rematch(id, httpRequest);
        return ResponseEntity.ok(ApiResponse.<Void>builder().message("Đã mở lại yêu cầu ghép gia sư").build());
    }
}
