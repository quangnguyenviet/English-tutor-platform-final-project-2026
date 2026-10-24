package com.mycompany.englishtutor.module.tutor.service;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.tutor.api.request.TutorAdminUpdateRequest;
import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileRejectRequest;
import com.mycompany.englishtutor.module.tutor.api.request.TutorStatusUpdateRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
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
 * Nghiệp vụ duyệt hồ sơ gia sư, quản lý trạng thái và audit logs dành cho Lễ tân / Quản trị viên.
 * Tuân thủ máy trạng thái tại API_DESIGN.md Mục 2.5 và Use Case UC-REC-08, UC-REC-09, UC-ADM-07, UC-ADM-08.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AdminTutorService {

    UserRepository userRepository;
    TutorRepository tutorRepository;
    TutorProfileMapper tutorProfileMapper;
    AuditLogService auditLogService;

    /**
     * Lấy danh sách gia sư có phân trang, lọc theo status và tìm kiếm từ khóa.
     */
    @Transactional(readOnly = true)
    public PageResponse<TutorPendingSummaryResponse> getTutors(String status, String keyword, int page, int size) {
        String normalizedStatus = null;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status.trim())) {
            normalizedStatus = status.trim().toUpperCase();
        }

        String trimmedKeyword = (keyword != null && !keyword.isBlank()) ? keyword.trim() : null;
        int clampedSize = Math.max(1, Math.min(size, 100));
        int clampedPage = Math.max(0, page);

        Pageable pageable = PageRequest.of(clampedPage, clampedSize);
        Page<Tutor> tutorPage = tutorRepository.findTutorsWithFilter(normalizedStatus, trimmedKeyword, pageable);

        log.info("Fetched {} tutor(s) with filter [status={}, keyword={}, page={}, size={}]",
                tutorPage.getNumberOfElements(), normalizedStatus, trimmedKeyword, clampedPage, clampedSize);

        return PageResponse.from(tutorPage, tutor -> tutorProfileMapper.mapToSummary(tutor.getUser(), tutor));
    }

    /**
     * Lấy số lượng gia sư theo từng trạng thái để hiển thị badge trên các tab UI.
     */
    @Transactional(readOnly = true)
    public Map<String, Long> getStatusCounts() {
        Map<String, Long> counts = new HashMap<>();
        counts.put("PENDING", tutorRepository.countByProfileStatus(ProfileStatus.PENDING.name()));
        counts.put("ACTIVE", tutorRepository.countByProfileStatus(ProfileStatus.ACTIVE.name()));
        counts.put("INACTIVE", tutorRepository.countByProfileStatus(ProfileStatus.INACTIVE.name()));
        counts.put("REJECTED", tutorRepository.countByProfileStatus(ProfileStatus.REJECTED.name()));
        counts.put("ALL", tutorRepository.count());
        return counts;
    }

    /**
     * Lấy danh sách hồ sơ đang chờ duyệt (giữ cho tương thích ngược).
     */
    @Transactional(readOnly = true)
    public List<TutorPendingSummaryResponse> getPendingProfiles() {
        List<Tutor> pendingTutors =
                tutorRepository.findPendingByProfileStatus(ProfileStatus.PENDING.name());

        log.info("Fetched {} pending tutor profile(s)", pendingTutors.size());

        return pendingTutors.stream()
                .map(tutor -> tutorProfileMapper.mapToSummary(tutor.getUser(), tutor))
                .toList();
    }

    /**
     * Lấy hồ sơ chi tiết của một gia sư (kèm 5 nhóm dữ liệu con) để admin / lễ tân review.
     */
    @Transactional(readOnly = true)
    public TutorProfileResponse getProfileDetail(Long tutorId) {
        Tutor tutor = tutorRepository.findDetailById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        log.info("Fetched detail of tutor profile, tutorId: {}", tutorId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Duyệt hồ sơ gia sư: PENDING -> ACTIVE.
     * Ghi Audit Log hành động APPROVE_TUTOR.
     */
    @Transactional
    public TutorProfileResponse approve(Long tutorId) {
        Long reviewerId = getCurrentUserId();
        Tutor tutor = getPendingTutor(tutorId);

        String oldStatus = tutor.getProfileStatus();
        tutor.setProfileStatus(ProfileStatus.ACTIVE.name());
        tutor.setRejectionReason(null);
        tutor.setReviewedBy(reviewerId);
        tutor.setReviewedAt(OffsetDateTime.now());
        tutorRepository.save(tutor);

        // Ghi Audit Log
        if (auditLogService != null) {
            Map<String, Object> details = Map.of(
                    "oldStatus", oldStatus,
                    "newStatus", ProfileStatus.ACTIVE.name(),
                    "action", "Approve tutor registration"
            );
            auditLogService.log(reviewerId, "APPROVE_TUTOR", "TUTOR", tutorId, details, getCurrentHttpRequest());
        }

        log.info("Tutor profile approved, tutorId: {}, reviewedBy: {}", tutorId, reviewerId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Từ chối hồ sơ gia sư: PENDING -> REJECTED.
     * Bắt buộc phải có lý do từ chối.
     * Ghi Audit Log hành động REJECT_TUTOR.
     */
    @Transactional
    public TutorProfileResponse reject(Long tutorId, TutorProfileRejectRequest request) {
        Long reviewerId = getCurrentUserId();
        Tutor tutor = getPendingTutor(tutorId);

        if (request == null || request.getRejectionReason() == null || request.getRejectionReason().trim().isBlank()) {
            throw new AppException(ErrorCode.MISSING_REJECTION_REASON);
        }

        String rejectionReason = request.getRejectionReason().trim();
        String oldStatus = tutor.getProfileStatus();

        tutor.setProfileStatus(ProfileStatus.REJECTED.name());
        tutor.setRejectionReason(rejectionReason);
        tutor.setReviewedBy(reviewerId);
        tutor.setReviewedAt(OffsetDateTime.now());
        tutorRepository.save(tutor);

        // Ghi Audit Log
        if (auditLogService != null) {
            Map<String, Object> details = Map.of(
                    "oldStatus", oldStatus,
                    "newStatus", ProfileStatus.REJECTED.name(),
                    "reason", rejectionReason,
                    "action", "Reject tutor profile"
            );
            auditLogService.log(reviewerId, "REJECT_TUTOR", "TUTOR", tutorId, details, getCurrentHttpRequest());
        }

        log.info("Tutor profile rejected, tutorId: {}, reviewedBy: {}", tutorId, reviewerId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Cập nhật trạng thái hoạt động: ACTIVE <-> INACTIVE (theo máy trạng thái API_DESIGN Mục 2.5).
     * Sai trạng thái sẽ ném mã lỗi 409 INVALID_STATUS_TRANSITION.
     */
    @Transactional
    public TutorProfileResponse updateStatus(Long tutorId, TutorStatusUpdateRequest request) {
        Long actorId = getCurrentUserId();
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        String currentStatus = tutor.getProfileStatus();
        String targetStatus = request.getStatus().trim().toUpperCase();

        // Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái:
        // Chỉ cho phép ACTIVE -> INACTIVE hoặc INACTIVE -> ACTIVE
        boolean isValidTransition = (ProfileStatus.ACTIVE.name().equals(currentStatus) && ProfileStatus.INACTIVE.name().equals(targetStatus))
                || (ProfileStatus.INACTIVE.name().equals(currentStatus) && ProfileStatus.ACTIVE.name().equals(targetStatus));

        if (!isValidTransition) {
            log.warn("Invalid status transition attempt for tutorId {}: {} -> {}", tutorId, currentStatus, targetStatus);
            throw new AppException(ErrorCode.INVALID_STATUS_TRANSITION);
        }

        tutor.setProfileStatus(targetStatus);
        tutorRepository.save(tutor);

        // Ghi Audit Log
        if (auditLogService != null) {
            Map<String, Object> details = new HashMap<>();
            details.put("oldStatus", currentStatus);
            details.put("newStatus", targetStatus);
            if (request.getNote() != null && !request.getNote().isBlank()) {
                details.put("note", request.getNote().trim());
            }
            auditLogService.log(actorId, "UPDATE_TUTOR_STATUS", "TUTOR", tutorId, details, getCurrentHttpRequest());
        }

        log.info("Tutor status updated, tutorId: {}, {} -> {} by user: {}", tutorId, currentStatus, targetStatus, actorId);

        return tutorProfileMapper.mapToResponse(tutor.getUser(), tutor);
    }

    /**
     * Quản trị viên cập nhật thông tin hồ sơ gia sư (FR-32).
     */
    @Transactional
    public TutorProfileResponse updateProfile(Long tutorId, TutorAdminUpdateRequest request) {
        Long actorId = getCurrentUserId();
        Tutor tutor = tutorRepository.findDetailById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        User user = tutor.getUser();

        // Cập nhật thông tin User nếu có
        boolean userUpdated = false;
        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName().trim());
            userUpdated = true;
        }
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            user.setPhone(request.getPhone().trim());
            userUpdated = true;
        }
        if (userUpdated) {
            userRepository.save(user);
        }

        // Cập nhật thông tin Tutor
        if (request.getUniversity() != null) tutor.setUniversity(request.getUniversity().trim());
        if (request.getEducationStatus() != null) tutor.setEducationStatus(request.getEducationStatus().trim());
        if (request.getExperienceYears() != null) tutor.setExperienceYears(request.getExperienceYears());
        if (request.getHometown() != null) tutor.setHometown(request.getHometown().trim());
        if (request.getAddress() != null) tutor.setAddress(request.getAddress().trim());
        if (request.getBio() != null) tutor.setBio(request.getBio().trim());
        if (request.getVideoUrl() != null) tutor.setVideoUrl(request.getVideoUrl().trim());

        tutorRepository.save(tutor);

        // Ghi Audit Log
        if (auditLogService != null) {
            Map<String, Object> details = Map.of(
                    "action", "Admin update tutor profile",
                    "updatedBy", actorId
            );
            auditLogService.log(actorId, "UPDATE_TUTOR_PROFILE", "TUTOR", tutorId, details, getCurrentHttpRequest());
        }

        log.info("Tutor profile updated by admin, tutorId: {}, actorId: {}", tutorId, actorId);

        return tutorProfileMapper.mapToResponse(user, tutor);
    }

    private HttpServletRequest getCurrentHttpRequest() {
        RequestAttributes attribs = RequestContextHolder.getRequestAttributes();
        if (attribs instanceof ServletRequestAttributes servletRequestAttributes) {
            return servletRequestAttributes.getRequest();
        }
        return null;
    }

    /**
     * Lấy hồ sơ theo id và bắt buộc phải đang PENDING.
     */
    private Tutor getPendingTutor(Long tutorId) {
        Tutor tutor = tutorRepository
                .findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        if (!ProfileStatus.PENDING.name().equals(tutor.getProfileStatus())) {
            throw new AppException(ErrorCode.TUTOR_PROFILE_NOT_PENDING);
        }

        return tutor;
    }

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        return userRepository
                .findByUsername(username)
                .map(User::getId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
