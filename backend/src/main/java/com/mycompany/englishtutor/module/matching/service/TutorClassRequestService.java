package com.mycompany.englishtutor.module.matching.service;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.matching.api.request.ApplyClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.matching.repository.ClassApplicationRepository;
import com.mycompany.englishtutor.module.matching.repository.TutorClassRequestQueryRepository;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.ProfileStatus;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;
import com.mycompany.englishtutor.shared.util.PublicSearchSupport;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Nghiệp vụ gia sư xem lớp đang tuyển và ứng tuyển (API_DESIGN mục 3.4).
 *
 * <p>SQL đọc nằm ở {@link TutorClassRequestQueryRepository}, SQL ghi ở
 * {@link ClassApplicationRepository}; service chỉ xử lý quyền, trạng thái và luồng.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassRequestService {

    TutorClassRequestQueryRepository queryRepository;
    ClassApplicationRepository applicationRepository;
    UserRepository userRepository;
    TutorRepository tutorRepository;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public PageResponse<TutorOpenClassRequestResponse> getOpenRequests(
            String keyword, String teachingMode, String gradeGroup, String sort, Integer page, Integer size) {
        var filter = new TutorClassRequestQueryRepository.Filter(keyword, teachingMode, gradeGroup, sort);
        Long tutorId = getCurrentUserId();
        int pageIndex = PublicSearchSupport.clampPage(page);
        int pageSize = PublicSearchSupport.clampSize(size);
        // Gia sư tắt "Đang mở nhận lớp" không thấy lớp đang tuyển (UI đọc cờ từ hồ sơ để hiện banner).
        boolean open = tutorRepository.findById(tutorId).map(Tutor::isOpenToTeaching).orElse(true);
        if (!open) {
            return PageResponse.of(List.of(), pageIndex, pageSize, 0);
        }
        return queryRepository.findOpenRequests(tutorId, filter, pageIndex, pageSize);
    }

    @Transactional(readOnly = true)
    public TutorOpenClassRequestResponse getOpenRequest(Long classRequestId) {
        return queryRepository
                .findOpenRequest(getCurrentUserId(), classRequestId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));
    }

    @Transactional(readOnly = true)
    public List<TutorApplicationResponse> getMyApplications() {
        return queryRepository.findApplicationsByTutor(getCurrentUserId());
    }

    // ----------------------------------------------------------------- WRITE

    @Transactional
    public TutorApplicationResponse apply(Long classRequestId, ApplyClassRequest request) {
        User user = getCurrentUser();
        Tutor tutor = requireActiveTutor(user.getId());
        // Tắt "Đang mở nhận lớp" thì không nhận đơn mới, lớp đang dạy giữ nguyên (ERD tutors.is_open_to_teaching).
        if (!tutor.isOpenToTeaching()) {
            throw new AppException(ErrorCode.TUTOR_NOT_OPEN_TO_TEACHING);
        }

        // Khóa dòng đơn để không đua với Lễ tân đang publish/cancel/select (T7-A3).
        List<String> statuses = applicationRepository.lockRequestStatus(classRequestId);
        if (statuses.isEmpty()) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND);
        }
        String requestStatus = statuses.getFirst();
        if (!isRecruiting(requestStatus)) {
            throw new AppException(ErrorCode.CLASS_REQUEST_NOT_OPEN);
        }

        // Mỗi gia sư chỉ một lượt cho mỗi đơn: đã bị từ chối hoặc bị loại sau dạy thử thì
        // không ứng tuyển lại, kể cả khi đơn mở lại vòng ghép lại (REMATCH).
        applicationRepository.findByRequestAndTutor(classRequestId, user.getId()).ifPresent(existing -> {
            switch (existing.status()) {
                case "TERMINATED" -> throw new AppException(ErrorCode.APPLICATION_TERMINATED);
                case "REJECTED" -> throw new AppException(ErrorCode.APPLICATION_REJECTED);
                default -> throw new AppException(ErrorCode.CLASS_ALREADY_APPLIED);
            }
        });

        String message = (request.getMessage() == null) ? "" : request.getMessage().trim();
        Long applicationId;
        try {
            applicationId = applicationRepository.insert(classRequestId, user.getId(), message);
        } catch (DataIntegrityViolationException ex) {
            // UNIQUE(class_request_id, tutor_id) là chốt chặn race khi bấm ứng tuyển hai lần.
            throw new AppException(ErrorCode.CLASS_ALREADY_APPLIED);
        }

        applicationRepository.notifyReceptionists(classRequestId, user.getFullName());
        return TutorApplicationResponse.builder()
                .applicationId(applicationId)
                .status("APPLIED")
                .message(message)
                .appliedAt(OffsetDateTime.now())
                .build();
    }

    @Transactional
    public void withdrawApplication(Long applicationId) {
        Long tutorId = getCurrentUserId();

        ClassApplicationRepository.WithdrawState state = applicationRepository
                .findForWithdraw(applicationId)
                .orElseThrow(() -> new AppException(ErrorCode.APPLICATION_NOT_FOUND));

        // Không thuộc gia sư hiện tại: cùng một mã 404 để không lộ đơn của người khác.
        if (!tutorId.equals(state.tutorId())) {
            throw new AppException(ErrorCode.APPLICATION_NOT_FOUND);
        }
        if (!"APPLIED".equals(state.applicationStatus())
                || !isRecruiting(state.requestStatus())
                || state.hasSelected()) {
            throw new AppException(ErrorCode.APPLICATION_NOT_WITHDRAWABLE);
        }

        applicationRepository.delete(applicationId);
    }

    // ---------------------------------------------------------------- HELPER

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    private Tutor requireActiveTutor(Long tutorId) {
        Tutor tutor = tutorRepository.findById(tutorId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_NOT_ACTIVE));
        if (!ProfileStatus.ACTIVE.name().equals(tutor.getProfileStatus())) {
            throw new AppException(ErrorCode.TUTOR_NOT_ACTIVE);
        }
        return tutor;
    }

    /** Đơn đang nhận ứng tuyển: đăng tuyển lần đầu hoặc đang ghép lại. */
    private static boolean isRecruiting(String requestStatus) {
        return "OPEN".equals(requestStatus) || "REMATCH".equals(requestStatus);
    }
}
