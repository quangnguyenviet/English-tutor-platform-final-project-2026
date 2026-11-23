package com.mycompany.englishtutor.module.classroom.service;

import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.TrialReportRequest;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.matching.service.MatchingLifecycleSupport;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ báo cáo kết quả dạy thử của gia sư (trial_report, V31).
 *
 * <p>Gia sư báo cáo ngay trong card "Lịch dạy thử" tab Tổng quan của workspace lớp.
 * Kết quả {@code SUCCESS} kích hoạt lớp sang {@code ACTIVE} (tái dụng
 * {@link StaffClassRequestService#tutorActivateTrial}), {@code FAILED} lưu lý do
 * và fan-out thông báo lễ tân (lớp giữ TRIAL). Cho phép nộp lại nhiều lần —
 * "báo cáo mới nhất" = {@code ORDER BY created_at DESC, id DESC}.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TrialReportService {

    private static final String OUTCOME_SUCCESS = "SUCCESS";
    private static final String OUTCOME_FAILED = "FAILED";
    private static final int MIN_FAILED_NOTE_LENGTH = 5;

    private static final String STATUS_TRIAL = "TRIAL";

    ClassroomQueryRepository classroomRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    StaffClassRequestService staffClassRequestService;
    MatchingLifecycleSupport lifecycle;

    /**
     * Gia sư gửi báo cáo kết quả dạy thử cho lớp TRIAL.
     *
     * @return true nếu kết quả SUCCESS (lớp đã kích hoạt ACTIVE)
     */
    @Transactional
    public boolean submit(Long classId, TrialReportRequest request, HttpServletRequest httpRequest) {
        Long tutorId = requireCurrentTutor();

        // Guard sở hữu + khóa dòng FOR UPDATE (chống 2 tutor bấm chồng)
        ClassState state =
                classroomRepository
                        .lockClassForUpdate(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(state.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }

        // Lớp phải đang TRIAL
        if (!STATUS_TRIAL.equalsIgnoreCase(state.status())) {
            throw new AppException(ErrorCode.CLASS_NOT_TRIAL);
        }

        // Ca thử phải đã được thiết lập (trial_start_time IS NOT NULL)
        TrialSessionResponse trialSession =
                classroomRepository.findTrialSession(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.TRIAL_SESSION_NOT_FOUND));

        // Validate outcome
        String outcome = normalize(request.getOutcome());
        if (!OUTCOME_SUCCESS.equals(outcome) && !OUTCOME_FAILED.equals(outcome)) {
            throw new AppException(ErrorCode.TRIAL_REPORT_INVALID_OUTCOME);
        }
        String note = trimToNull(request.getNote());
        if (OUTCOME_FAILED.equals(outcome) && (note == null || note.length() < MIN_FAILED_NOTE_LENGTH)) {
            throw new AppException(ErrorCode.TRIAL_REPORT_REASON_REQUIRED);
        }

        // Chèn báo cáo (NULL note cho SUCCESS)
        Long reportId = classroomRepository.insertTrialReport(
                classId, tutorId, outcome, OUTCOME_FAILED.equals(outcome) ? note : null);

        // SUCCESS: kích hoạt lớp ACTIVE + payment NOT_SUBMITTED (cùng transaction)
        boolean activated = OUTCOME_SUCCESS.equals(outcome);
        if (activated) {
            staffClassRequestService.tutorActivateTrial(classId, httpRequest);
        }

        auditLogService.log(
                tutorId,
                "SUBMIT_TRIAL_REPORT",
                "CLASS",
                classId,
                Map.of("reportId", reportId, "outcome", outcome, "activated", activated),
                httpRequest);

        // Fan-out thông báo lễ tân (cả 2 outcome; FAILED kèm lý do)
        String className = state.className();
        if (activated) {
            lifecycle.notifyReceptionists(
                    "Gia sư báo dạy thử thành công",
                    "Gia sư đã báo kết quả dạy thử THÀNH CÔNG cho lớp " + className + ". "
                            + "Lớp đã được kích hoạt chính thức, vui lòng kiểm tra học phí.",
                    "CLASS",
                    classId);
        } else {
            lifecycle.notifyReceptionists(
                    "Gia sư báo dạy thử không thành công",
                    "Gia sư đã báo kết quả dạy thử KHÔNG THÀNH CÔNG cho lớp " + className
                            + ". Lý do: " + note + ". Vui lòng xem xét ghép lại hoặc hủy lớp.",
                    "CLASS",
                    classId);
        }

        return activated;
    }

    // ------------------------------------------------------------- HELPERS

    private Long requireCurrentTutor() {
        return getCurrentUser().getId();
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private static String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
