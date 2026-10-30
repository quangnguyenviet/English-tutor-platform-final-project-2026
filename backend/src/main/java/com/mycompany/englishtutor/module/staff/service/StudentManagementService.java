package com.mycompany.englishtutor.module.staff.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.staff.api.request.StudentStatusUpdateRequest;
import com.mycompany.englishtutor.module.staff.api.response.StudentClassResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentSummaryResponse;
import com.mycompany.englishtutor.module.staff.repository.StudentQueryRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ quản lý học sinh cho Lễ tân / Admin (UC-REC-11, UC-ADM-10, FR-34).
 * Khóa/mở tài khoản = đổi {@code users.status} ACTIVE ↔ INACTIVE; đăng nhập đã chặn tài khoản INACTIVE.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class StudentManagementService {

    static final List<String> STATUSES = List.of("ACTIVE", "INACTIVE");
    static final List<String> CURRENT_CLASS_STATUSES = List.of("TRIAL", "ACTIVE");

    StudentQueryRepository studentQueryRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;

    /**
     * Danh sách học sinh có phân trang + bộ lọc trạng thái / từ khóa / tình trạng học.
     */
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Transactional(readOnly = true)
    public PageResponse<StudentSummaryResponse> getStudents(
            String status, String keyword, String learning, Integer page, Integer size) {
        return studentQueryRepository.search(
                normalizeStatusFilter(status), keyword, normalizeLearningFilter(learning), page, size);
    }

    /**
     * Đếm học sinh theo trạng thái (ALL / ACTIVE / INACTIVE) cho badge tab, tôn trọng từ khóa và tình trạng học.
     */
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Transactional(readOnly = true)
    public Map<String, Long> getCounts(String keyword, String learning) {
        String normalizedLearning = normalizeLearningFilter(learning);
        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ALL", studentQueryRepository.count(null, keyword, normalizedLearning));
        for (String status : STATUSES) {
            counts.put(status, studentQueryRepository.count(status, keyword, normalizedLearning));
        }
        return counts;
    }

    /**
     * Chi tiết học sinh: cá nhân, phụ huynh, lớp đang học (TRIAL/ACTIVE) và đã học (COMPLETED/CANCELLED).
     */
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Transactional(readOnly = true)
    public StudentDetailResponse getStudent(Long id) {
        StudentDetailResponse detail = studentQueryRepository.findDetail(id)
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));

        List<StudentClassResponse> classes = studentQueryRepository.findClasses(id);
        return detail.toBuilder()
                .currentClasses(classes.stream()
                        .filter(c -> CURRENT_CLASS_STATUSES.contains(c.getStatus()))
                        .toList())
                .pastClasses(classes.stream()
                        .filter(c -> !CURRENT_CLASS_STATUSES.contains(c.getStatus()))
                        .toList())
                .build();
    }

    /**
     * Đổi trạng thái hoạt động của học sinh: ACTIVE ↔ INACTIVE.
     * Đặt lại đúng trạng thái hiện tại → 409 (INVALID_STUDENT_STATUS). Ghi audit UPDATE_STUDENT_STATUS.
     */
    @PreAuthorize("hasAnyRole('RECEPTIONIST', 'ADMIN')")
    @Transactional
    public StudentDetailResponse updateStatus(Long id, StudentStatusUpdateRequest request) {
        User student = userRepository.findById(id)
                .filter(user -> UserRole.STUDENT.name().equals(user.getRole()))
                .orElseThrow(() -> new AppException(ErrorCode.STUDENT_NOT_FOUND));

        String targetStatus = request.getStatus() == null ? "" : request.getStatus().trim().toUpperCase();
        if (!STATUSES.contains(targetStatus)) {
            throw new AppException(ErrorCode.INVALID_STUDENT_STATUS_VALUE);
        }

        String currentStatus = student.getStatus();
        if (targetStatus.equals(currentStatus)) {
            throw new AppException(ErrorCode.INVALID_STUDENT_STATUS);
        }

        student.setStatus(targetStatus);
        // Flush để truy vấn JdbcTemplate ở getStudent() đọc được trạng thái mới trong cùng transaction.
        userRepository.saveAndFlush(student);

        String note = request.getNote() == null || request.getNote().isBlank() ? null : request.getNote().trim();
        Map<String, Object> details = new LinkedHashMap<>();
        details.put("oldStatus", currentStatus);
        details.put("newStatus", targetStatus);
        if (note != null) {
            details.put("note", note);
        }

        Long actorId = getCurrentUserId();
        auditLogService.log(actorId, "UPDATE_STUDENT_STATUS", "STUDENT", id, details, getCurrentHttpRequest());

        log.info("Cập nhật trạng thái học sinh id={}: {} -> {} bởi user={}", id, currentStatus, targetStatus, actorId);

        return getStudent(id);
    }

    // ----------------------------------------------------------------------------
    // Helpers
    // ----------------------------------------------------------------------------

    private String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        String normalized = status.trim().toUpperCase();
        if (!STATUSES.contains(normalized)) {
            throw new AppException(ErrorCode.INVALID_STUDENT_FILTER);
        }
        return normalized;
    }

    private String normalizeLearningFilter(String learning) {
        if (learning == null || learning.isBlank() || "ALL".equalsIgnoreCase(learning)) {
            return null;
        }
        String normalized = learning.trim().toUpperCase();
        if (!StudentQueryRepository.LEARNING_STUDYING.equals(normalized)
                && !StudentQueryRepository.LEARNING_NOT_STUDYING.equals(normalized)) {
            throw new AppException(ErrorCode.INVALID_STUDENT_FILTER);
        }
        return normalized;
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        return userRepository.findByUsername(authentication.getName())
                .map(User::getId)
                .orElse(null);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
        if (attribs instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes.getRequest();
        }
        return null;
    }
}
