package com.mycompany.englishtutor.module.classroom.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OnDemandSessionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;
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
 * Nghiệp vụ lớp học của gia sư: lịch dạy thử (UC-T08) và lịch dạy cố định (UC-T09).
 *
 * <p>SQL nằm ở {@link ClassroomQueryRepository}; service xử lý quyền sở hữu,
 * trạng thái lớp, validate khoảng hiệu lực, kiểm tra trùng ca, audit và thông báo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassService {

    private static final Set<String> CLASS_STATUSES = Set.of("TRIAL", "ACTIVE", "COMPLETED", "CANCELLED");

    ClassroomQueryRepository classroomRepository;
    ScheduleConflictChecker conflictChecker;
    UserRepository userRepository;
    AuditLogService auditLogService;
    JdbcTemplate jdbcTemplate;
    ClassOccurrenceService classOccurrenceService;

    // ------------------------------------------------------------------ READ

    @Transactional(readOnly = true)
    public List<ClassSummaryResponse> getMyClasses(String status) {
        return classroomRepository.findMyClasses(getCurrentUserId(), normalizeStatus(status));
    }

    @Transactional(readOnly = true)
    public ClassDetailResponse getClassDetail(Long classId) {
        requireOwnedClass(classId);
        ClassDetailResponse detail = classroomRepository
                .findClassDetail(classId, getCurrentUserId())
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        List<ScheduleInfo> schedules = classroomRepository.findSchedules(classId);
        detail.setSchedules(schedules);
        detail.setHasSchedules(!schedules.isEmpty());
        detail.setSessionDates(classroomRepository.findSessionDates(classId));

        int todayDayOfWeek = LocalDate.now().getDayOfWeek().getValue();
        detail.setTodaySlots(schedules.stream()
                .filter(s -> s.getDayOfWeek() == todayDayOfWeek)
                .map(s -> ClassDetailResponse.ScheduleSlot.builder()
                        .dayOfWeek(s.getDayOfWeek())
                        .startTime(s.getStartTime())
                        .endTime(s.getEndTime())
                        .build())
                .toList());
        return detail;
    }

    // ------------------------------------------------------- UC-T09: LỊCH CỐ ĐỊNH

    /** Chốt lịch dạy cố định lần đầu cho lớp ACTIVE chưa có lịch (kế hoạch mục 4.2). */
    @Transactional
    public FinalizeScheduleResponse finalizeSchedule(
            Long classId, FinalizeScheduleRequest request, HttpServletRequest httpRequest) {
        ClassState state = requireOwnedActiveClass(classId);
        if (classroomRepository.countSchedules(classId) > 0) {
            throw new AppException(ErrorCode.SCHEDULE_ALREADY_EXISTS);
        }
        List<FinalizeScheduleRequest.ScheduleSlot> slots = validateSlots(request);
        checkConflicts(state, slots, classId);

        classroomRepository.insertSchedules(classId, slots);
        auditLogService.log(
                getCurrentUserId(),
                "FINALIZE_SCHEDULE",
                "CLASS",
                classId,
                Map.of("schedules", describeSlots(slots)),
                httpRequest);
        notifyStudentOfSchedule(state, describeSlots(slots), classId);

        return FinalizeScheduleResponse.builder()
                .classId(classId)
                .schedules(classroomRepository.findSchedules(classId))
                .build();
    }

    /**
     * Cập nhật lịch dạy cố định — ghi đè toàn bộ {@code class_schedules}
     * (xóa ca cũ, lưu ca mới), không chạm bảng {@code sessions} (kế hoạch mục 4.3).
     */
    @Transactional
    public FinalizeScheduleResponse updateSchedule(
            Long classId, FinalizeScheduleRequest request, HttpServletRequest httpRequest) {
        ClassState state = requireOwnedActiveClass(classId);
        if (classroomRepository.countSchedules(classId) == 0) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }
        List<FinalizeScheduleRequest.ScheduleSlot> slots = validateSlots(request);
        checkConflicts(state, slots, classId);

        classroomRepository.deleteSchedules(classId);
        classroomRepository.insertSchedules(classId, slots);
        auditLogService.log(
                getCurrentUserId(),
                "UPDATE_CLASS_SCHEDULE",
                "CLASS",
                classId,
                Map.of("schedules", describeSlots(slots)),
                httpRequest);
        notifyStudentOfSchedule(state, describeSlots(slots), classId);

        return FinalizeScheduleResponse.builder()
                .classId(classId)
                .schedules(classroomRepository.findSchedules(classId))
                .build();
    }

    /**
     * Tạo buổi học chính thức on-demand (nút "Tạo buổi học", kế hoạch mục 4.6).
     * Idempotent: bấm lại cùng ca trả buổi đã tồn tại (createdNow = false),
     * không nhân đôi nhờ unique index {@code uq_sessions_class_date_start}.
     */
    @Transactional
    public OnDemandSessionResponse createSessionOnDemand(
            Long classId, CreateSessionRequest request, HttpServletRequest httpRequest) {
        ClassState state = requireOwnedActiveClass(classId);
        List<ScheduleInfo> schedules = classroomRepository.findSchedules(classId);
        if (schedules.isEmpty()) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }

        LocalDate date = request.getSessionDate();
        List<ScheduleInfo> matching = schedules.stream()
                .filter(s -> s.getDayOfWeek() == date.getDayOfWeek().getValue())
                .filter(s -> s.getValidFrom().compareTo(date) <= 0)
                .filter(s -> s.getValidTo() == null || s.getValidTo().compareTo(date) >= 0)
                .toList();
        if (matching.isEmpty()) {
            throw new AppException(ErrorCode.SESSION_DATE_NOT_IN_SCHEDULE);
        }

        ScheduleInfo slot;
        if (request.getStartTime() != null) {
            slot = matching.stream()
                    .filter(s -> s.getStartTime().equals(request.getStartTime()))
                    .findFirst()
                    .orElseThrow(() -> new AppException(ErrorCode.SESSION_DATE_NOT_IN_SCHEDULE));
        } else if (matching.size() > 1) {
            throw new AppException(ErrorCode.SESSION_AMBIGUOUS_TIME);
        } else {
            slot = matching.getFirst();
        }

        Optional<OnDemandSessionResponse> existing =
                classroomRepository.findOnDemandSessionAt(classId, date, slot.getStartTime());
        if (existing.isPresent()) {
            return existing.get();
        }

        Long sessionId;
        try {
            sessionId = classroomRepository.insertOnDemandSession(
                    classId, date, slot.getStartTime(), slot.getEndTime(), state.teachingMode());
        } catch (DataIntegrityViolationException ex) {
            // Race bấm hai lần gần như đồng thời — unique index là chốt chặn, đọc lại và trả buổi đó.
            return classroomRepository
                    .findOnDemandSessionAt(classId, date, slot.getStartTime())
                    .orElseThrow(() -> ex);
        }

        // Vật chất hóa (R9): nếu ô này đang có exception overlay thì xóa —
        // session thật kế thừa ngày/giờ, không giữ 2 nguồn ghi đè nhau (mục 1.8).
        classOccurrenceService.materializeOccurrenceException(
                classId, date, slot.getDayOfWeek(), slot.getStartTime(), getCurrentUserId(), httpRequest);

        auditLogService.log(
                getCurrentUserId(),
                "CREATE_SESSION",
                "CLASS",
                classId,
                Map.of("sessionId", sessionId, "sessionDate", date.toString()),
                httpRequest);

        return OnDemandSessionResponse.builder()
                .sessionId(sessionId)
                .sessionDate(date)
                .startTime(slot.getStartTime())
                .endTime(slot.getEndTime())
                .status("SCHEDULED")
                .isTrial(Boolean.FALSE)
                .createdNow(Boolean.TRUE)
                .build();
    }

    // --------------------------------------------------------------- HELPERS

    /** Lớp phải tồn tại, thuộc gia sư hiện tại (bất kỳ trạng thái — dùng cho đọc chi tiết). */
    private ClassState requireOwnedClass(Long classId) {
        ClassState state = classroomRepository
                .findClassState(classId)
                .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!getCurrentUserId().equals(state.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        return state;
    }

    /** Lớp phải tồn tại, thuộc gia sư hiện tại và đang ở trạng thái TRIAL. */
    private ClassState requireOwnedTrialClass(Long classId) {
        ClassState state = requireOwnedClass(classId);
        if (!"TRIAL".equals(state.status())) {
            throw new AppException(ErrorCode.CLASS_NOT_TRIAL);
        }
        return state;
    }

    /** Lớp phải tồn tại, thuộc gia sư hiện tại và đang ở trạng thái ACTIVE. */
    private ClassState requireOwnedActiveClass(Long classId) {
        ClassState state = requireOwnedClass(classId);
        if (!"ACTIVE".equals(state.status())) {
            throw new AppException(ErrorCode.CLASS_NOT_ACTIVE);
        }
        return state;
    }

    /**
     * Validate nội bộ từng ca: giờ hợp lệ, khoảng hiệu lực hợp lệ và
     * không có 2 ca cùng thứ giao nhau (ràng buộc 13 + mục 9 giả định).
     */
    private List<FinalizeScheduleRequest.ScheduleSlot> validateSlots(FinalizeScheduleRequest request) {
        List<FinalizeScheduleRequest.ScheduleSlot> slots = request.getSchedules();
        LocalDate today = LocalDate.now();
        for (FinalizeScheduleRequest.ScheduleSlot slot : slots) {
            if (!slot.getStartTime().isBefore(slot.getEndTime())) {
                throw new AppException(ErrorCode.SCHEDULE_INVALID_TIME);
            }
            if (slot.getValidFrom().isBefore(today)) {
                throw new AppException(ErrorCode.SCHEDULE_DATE_IN_PAST);
            }
            if (slot.getValidTo() != null && slot.getValidTo().isBefore(slot.getValidFrom())) {
                throw new AppException(ErrorCode.SCHEDULE_INVALID_RANGE);
            }
        }
        // Hai ca cùng thứ không được giao giờ (một thứ có thể có nhiều ca không trùng).
        for (int i = 0; i < slots.size(); i++) {
            for (int j = i + 1; j < slots.size(); j++) {
                FinalizeScheduleRequest.ScheduleSlot a = slots.get(i);
                FinalizeScheduleRequest.ScheduleSlot b = slots.get(j);
                if (a.getDayOfWeek().equals(b.getDayOfWeek())
                        && a.getStartTime().isBefore(b.getEndTime())
                        && a.getEndTime().isAfter(b.getStartTime())) {
                    throw new AppException(ErrorCode.SCHEDULE_DUPLICATE);
                }
            }
        }
        return slots;
    }

    /**
     * Kiểm tra trùng theo tuần (lớp ACTIVE khác, giao khoảng hiệu lực) và
     * trùng ngày cụ thể (session đã tồn tại trong khoảng hiệu lực của ca).
     */
    private void checkConflicts(
            ClassState state, List<FinalizeScheduleRequest.ScheduleSlot> slots, Long excludeClassId) {
        for (FinalizeScheduleRequest.ScheduleSlot slot : slots) {
            List<WeeklyConflictInfo> weeklyConflicts = conflictChecker.findWeeklyConflicts(
                    state.tutorId(),
                    slot.getDayOfWeek(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    slot.getValidFrom(),
                    slot.getValidTo(),
                    excludeClassId);
            if (!weeklyConflicts.isEmpty()) {
                throw new AppException(
                        ErrorCode.SCHEDULE_DUPLICATE,
                        ScheduleConflictChecker.describeWeeklyConflict(weeklyConflicts.getFirst()));
            }

            // Không sinh session trước, nên chỉ cần đối chiếu các session đã tồn tại
            // (bù đắp: session ngoài khoảng hiệu lực không tồn tại — mục 2.3).
            List<ConflictInfo> sessionConflicts = classroomRepository.findSessionConflicts(
                    state.tutorId(),
                    slot.getValidFrom(),
                    slot.getValidTo(),
                    slot.getStartTime(),
                    slot.getEndTime(),
                    excludeClassId);
            boolean sameWeekday = sessionConflicts.stream()
                    .anyMatch(c -> c.sessionDate().getDayOfWeek().getValue() == slot.getDayOfWeek());
            if (sameWeekday) {
                ConflictInfo first = sessionConflicts.stream()
                        .filter(c -> c.sessionDate().getDayOfWeek().getValue() == slot.getDayOfWeek())
                        .findFirst()
                        .orElseThrow();
                throw new AppException(
                        ErrorCode.SCHEDULE_CONFLICT,
                        ScheduleConflictChecker.describeConflict(first));
            }
        }
    }

    private static List<String> describeSlots(List<FinalizeScheduleRequest.ScheduleSlot> slots) {
        return slots.stream()
                .map(s -> ScheduleConflictChecker.dayLabel(s.getDayOfWeek())
                        + " " + s.getStartTime() + "-" + s.getEndTime()
                        + " (hiệu lực từ " + s.getValidFrom()
                        + (s.getValidTo() != null ? " đến " + s.getValidTo() : "") + ")")
                .toList();
    }

    /** Bản tạm: ghi thẳng bảng notifications cho học sinh, thay bằng NotificationService ở T8-A1. */
    private void notifyStudentOfSchedule(ClassState state, List<String> slotDescriptions, Long classId) {
        String title = "Lịch học chính thức của lớp " + state.className();
        String content = "Gia sư vừa cập nhật lịch học cố định: "
                + String.join(", ", slotDescriptions)
                + ". Học sinh có thể tạo buổi học cho từng ngày theo lịch này.";
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                state.studentId(),
                title,
                content,
                classId);
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

    // ----------------------------------------------------- UC-T08: LỊCH DẠY THỬ

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
}
