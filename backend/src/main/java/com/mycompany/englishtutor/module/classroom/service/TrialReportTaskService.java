package com.mycompany.englishtutor.module.classroom.service;

import java.util.List;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialReportTaskListItemResponse;
import com.mycompany.englishtutor.module.classroom.repository.TrialReportTaskRepository;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Nghiệp vụ hàng đợi xử lý report dạy thử thất bại cho admin/lễ tân (V32). */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TrialReportTaskService {

    private static final List<String> VALID_STATUSES = List.of("PENDING", "IN_PROGRESS", "RESOLVED");

    TrialReportTaskRepository taskRepository;
    StaffClassRequestService staffClassRequestService;
    UserRepository userRepository;
    ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PageResponse<TrialReportTaskListItemResponse> listTasks(String status, Long assignedTo, Integer page, Integer size) {
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size < 1 || size > 100 ? 20 : size;
        String normalized = normalizeStatus(status);
        validateStatus(normalized);
        return PageResponse.of(taskRepository.findQueue(normalized, assignedTo, p, s), p, s,
                taskRepository.countQueue(normalized, assignedTo));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTaskCounts() {
        return taskRepository.countByStatus();
    }

    @Transactional(readOnly = true)
    public TrialReportTaskDetailResponse getTaskDetail(Long taskId) {
        TrialReportTaskDetailResponse detail = taskRepository.findTaskDetail(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TRIAL_REPORT_TASK_NOT_FOUND));
        detail.setHistory(taskRepository.findHistory(taskId));
        return detail;
    }

    @Transactional
    public void assignSelf(Long taskId) {
        Long actorId = currentUserId();
        ensureTask(taskId);
        if (taskRepository.assignSelf(taskId, actorId) == 0) {
            throw new AppException(ErrorCode.TRIAL_REPORT_ALREADY_ASSIGNED);
        }
        history(taskId, actorId, "ASSIGN_SELF", null);
    }

    @Transactional
    public void unassign(Long taskId) {
        Long actorId = currentUserId();
        ensureTask(taskId);
        taskRepository.unassign(taskId);
        history(taskId, actorId, "UNASSIGN", null);
    }

    @Transactional
    public void assign(Long taskId, Long targetUserId) {
        Long actorId = currentUserId();
        ensureTask(taskId);
        if (taskRepository.findAssignableStaffName(targetUserId).isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_EXISTED);
        }
        taskRepository.assignTo(taskId, targetUserId);
        history(taskId, actorId, "ASSIGN_OTHER", Map.of("assignedTo", targetUserId));
    }

    /** Mở lại request liên quan, idempotent khi đã REMATCH/OPEN. */
    @Transactional
    public void rematch(Long taskId, HttpServletRequest httpRequest) {
        Long actorId = currentUserId();
        TrialReportTaskDetailResponse detail = lockTask(taskId);
        TrialReportTaskDetailResponse.ClassRequestInfo request = detail.getTask().getClassInfo().getClassRequest();
        if (request == null) {
            throw new AppException(ErrorCode.TRIAL_REPORT_REMATCH_NO_REQUEST);
        }
        String status = taskRepository.findRequestStatus(request.getId());
        if (!"REMATCH".equalsIgnoreCase(status) && !"OPEN".equalsIgnoreCase(status)) {
            String reason = detail.getTask().getReport().getNote();
            staffClassRequestService.rematchClass(request.getId(), reason, false, true, httpRequest);
        }
        history(taskId, actorId, "REMATCH", Map.of("classRequestId", request.getId()));
    }

    @Transactional
    public void changeStatus(Long taskId, String status) {
        String normalized = normalizeStatus(status);
        validateStatus(normalized);
        Long actorId = currentUserId();
        TrialReportTaskDetailResponse detail = lockTask(taskId);
        String from = detail.getTask().getStatus();
        taskRepository.changeStatus(taskId, normalized, actorId);
        history(taskId, actorId, "CHANGE_STATUS", Map.of("from", from, "to", normalized));
    }

    private TrialReportTaskDetailResponse lockTask(Long taskId) {
        return taskRepository.lockTask(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TRIAL_REPORT_TASK_NOT_FOUND));
    }

    private void ensureTask(Long taskId) {
        taskRepository.lockTask(taskId)
                .orElseThrow(() -> new AppException(ErrorCode.TRIAL_REPORT_TASK_NOT_FOUND));
    }

    private void history(Long taskId, Long actorId, String action, Object details) {
        try {
            taskRepository.insertHistory(taskId, actorId, action,
                    details == null ? null : objectMapper.writeValueAsString(details));
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Không thể ghi lịch sử task", ex);
        }
    }

    private Long currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository.findByUsername(authentication.getName())
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private static String normalizeStatus(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private static void validateStatus(String status) {
        if (status != null && !VALID_STATUSES.contains(status)) {
            throw new AppException(ErrorCode.TRIAL_REPORT_TASK_INVALID_STATUS);
        }
    }
}
