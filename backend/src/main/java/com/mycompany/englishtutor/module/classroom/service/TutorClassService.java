package com.mycompany.englishtutor.module.classroom.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Nghiệp vụ lớp học của gia sư và lịch dạy thử (API_DESIGN mục 3.5, UC-T08).
 *
 * <p>SQL nằm ở {@link ClassroomQueryRepository}; service chỉ xử lý quyền sở hữu,
 * trạng thái lớp và kiểm tra trùng ca.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassService {

    private static final Set<String> CLASS_STATUSES = Set.of("TRIAL", "ACTIVE", "COMPLETED", "CANCELLED");

    ClassroomQueryRepository classroomRepository;
    ScheduleConflictChecker conflictChecker;
    UserRepository userRepository;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public List<ClassSummaryResponse> getMyClasses(String status) {
        return classroomRepository.findMyClasses(getCurrentUserId(), normalizeStatus(status));
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse getClassDetail(Long classId) {
        return classroomRepository
                .findClassDetail(classId, getCurrentUserId())
                .orElseThrow(() -> new AppException(classroomRepository.classExists(classId)
                        ? ErrorCode.CLASS_NOT_OWNED
                        : ErrorCode.CLASS_NOT_FOUND));
    }

    // ----------------------------------------------------------------- WRITE

    /** Thiết lập lịch dạy thử (luồng chính UC-T08). Lớp vẫn giữ nguyên trạng thái TRIAL. */
    @Transactional
    public TrialSessionResponse createTrialSession(Long classId, UpsertTrialSessionRequest request) {
        ClassState state = requireOwnedTrialClass(classId);
        validateRequest(request);
        if (classroomRepository.findTrialSession(classId).isPresent()) {
            throw new AppException(ErrorCode.TRIAL_SESSION_ALREADY_EXISTS);
        }
        requireNoConflict(state, request, null);

        Long sessionId;
        try {
            sessionId = classroomRepository.insertTrialSession(classId, request);
        } catch (DataIntegrityViolationException ex) {
            // Unique index uq_sessions_one_trial_per_class là chốt chặn race khi gọi hai lần liên tiếp.
            throw new AppException(ErrorCode.TRIAL_SESSION_ALREADY_EXISTS);
        }
        return TrialSessionResponse.builder()
                .sessionId(sessionId)
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .teachingMode(ClassroomQueryRepository.normalizeMode(request.getTeachingMode()))
                .meetingUrl(ClassroomQueryRepository.trimToNull(request.getMeetingUrl()))
                .location(ClassroomQueryRepository.trimToNull(request.getLocation()))
                .status("SCHEDULED")
                .build();
    }

    /** Điều chỉnh/dời lịch dạy thử khi buổi thử chưa diễn ra (luồng thay thế 4a). */
    @Transactional
    public TrialSessionResponse updateTrialSession(Long classId, UpsertTrialSessionRequest request) {
        ClassState state = requireOwnedTrialClass(classId);
        TrialSessionResponse existing = classroomRepository
                .findTrialSession(classId)
                .orElseThrow(() -> new AppException(ErrorCode.TRIAL_SESSION_NOT_FOUND));
        if (!"SCHEDULED".equals(existing.getStatus())) {
            throw new AppException(ErrorCode.TRIAL_SESSION_NOT_EDITABLE);
        }
        validateRequest(request);
        requireNoConflict(state, request, existing.getSessionId());

        classroomRepository.updateTrialSession(existing.getSessionId(), request);
        return TrialSessionResponse.builder()
                .sessionId(existing.getSessionId())
                .sessionDate(request.getSessionDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .teachingMode(ClassroomQueryRepository.normalizeMode(request.getTeachingMode()))
                .meetingUrl(ClassroomQueryRepository.trimToNull(request.getMeetingUrl()))
                .location(ClassroomQueryRepository.trimToNull(request.getLocation()))
                .status("SCHEDULED")
                .build();
    }

    // --------------------------------------------------------------- HELPERS

    /** Lớp phải tồn tại, thuộc gia sư hiện tại và đang ở trạng thái TRIAL. */
    private ClassState requireOwnedTrialClass(Long classId) {
        Long tutorId = getCurrentUserId();
        ClassState state = classroomRepository
                .findClassState(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(state.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        if (!"TRIAL".equals(state.status())) {
            throw new AppException(ErrorCode.CLASS_NOT_TRIAL);
        }
        return state;
    }

    private void validateRequest(UpsertTrialSessionRequest request) {
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new AppException(ErrorCode.TRIAL_SESSION_INVALID_TIME);
        }
        if (request.getSessionDate().isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.TRIAL_SESSION_DATE_IN_PAST);
        }
        String mode = ClassroomQueryRepository.normalizeMode(request.getTeachingMode());
        if (!"ONLINE".equals(mode) && !"AT_HOME".equals(mode)) {
            throw new AppException(ErrorCode.TRIAL_SESSION_INVALID_MODE);
        }
        if ("ONLINE".equals(mode) && ClassroomQueryRepository.trimToNull(request.getMeetingUrl()) == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
        }
        if ("AT_HOME".equals(mode) && ClassroomQueryRepository.trimToNull(request.getLocation()) == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
        }
    }

    private void requireNoConflict(
            ClassState state, UpsertTrialSessionRequest request, Long excludeSessionId) {
        List<ConflictInfo> conflicts = conflictChecker.findConflicts(
                state.tutorId(),
                request.getSessionDate(),
                request.getStartTime(),
                request.getEndTime(),
                excludeSessionId);
        if (!conflicts.isEmpty()) {
            throw new AppException(
                    ErrorCode.SCHEDULE_CONFLICT,
                    ScheduleConflictChecker.describeConflict(conflicts.getFirst()));
        }
    }

    private static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String upper = status.trim().toUpperCase(Locale.ROOT);
        if (!CLASS_STATUSES.contains(upper)) {
            throw new AppException(ErrorCode.INVALID_CLASS_STATUS);
        }
        return upper;
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }

    private Long getCurrentUserId() {
        return getCurrentUser().getId();
    }
}
