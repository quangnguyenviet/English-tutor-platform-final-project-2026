package com.mycompany.englishtutor.module.classroom.service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SetSessionStatusRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionLogRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ExceptionInfo;
import com.mycompany.englishtutor.module.classroom.api.response.OccurrenceResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionListItem;
import com.mycompany.englishtutor.module.classroom.api.response.SessionLogResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionMini;
import com.mycompany.englishtutor.module.classroom.api.response.SessionStatusResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LockedSessionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.OccurrenceSessionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleSlotRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.SessionDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.SessionExceptionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.SessionInfoUpdate;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.domain.UserRole;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

/**
 * Nghiệp vụ tab "Lịch dạy" (kế hoạch class-sessions, UC-T05/UC-T07, API_DESIGN 3.6):
 * lattice tuần (occurrences), overlay exception cho ô ảo, quản lý buổi học thật
 * (danh sách, chi tiết, sửa/dời, đổi trạng thái, nhật ký).
 *
 * <p>Hai nguồn dữ liệu rạch ròi (mục 0): ô ảo tác động bằng
 * {@code session_exceptions}; ô có session thật quản lý bằng {@code sessions}.
 * Notification học sinh (bản tạm INSERT thẳng, T8-A1 thay bằng NotificationService)
 * chỉ cho 3 sự kiện trên session thật: hủy, dời, lưu nhật ký lần đầu —
 * exception không bao giờ gửi thông báo.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassOccurrenceService {

    private static final Set<String> SESSION_STATUSES =
            Set.of("SCHEDULED", "IN_PROGRESS", "COMPLETED", "ABSENT", "CANCELLED");

    /**
     * State machine đổi trạng thái buổi (mục 4.7). Key = "FROM->TO";
     * không có trong tập = không hợp lệ (kể cả same-state và về SCHEDULED).
     */
    private static final Set<String> VALID_TRANSITIONS = Set.of(
            "SCHEDULED->IN_PROGRESS",
            "SCHEDULED->ABSENT",
            "SCHEDULED->CANCELLED",
            "IN_PROGRESS->COMPLETED",
            "IN_PROGRESS->ABSENT",
            "IN_PROGRESS->CANCELLED");

    /** Exception type hợp lệ (CHK bảng V13). */
    private static final Set<String> EXCEPTION_TYPES = Set.of("CANCELLED", "RESCHEDULED", "MODIFIED");

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    ClassroomQueryRepository classroomRepository;
    ScheduleConflictChecker conflictChecker;
    UserRepository userRepository;
    AuditLogService auditLogService;
    JdbcTemplate jdbcTemplate;

    // ======================================================== LATTICE & DANH SÁCH

    /**
     * Lattice tuần (mục 4.1): 7 ngày {@code [weekStart, weekStart+6)} (tuần chuẩn
     * mở thứ 2), mỗi (ca, ngày trong khoảng hiệu lực) = 1 ô; ưu tiên
     * SESSION &gt; EXCEPTION &gt; OCCURRENCE (mục 0).
     */
    @Transactional(readOnly = true)
    public ClassScheduleResponse listOccurrences(Long classId, LocalDate weekStart) {
        requireReadAccess(classId);
        LocalDate start = weekStart.with(DayOfWeek.MONDAY);

        List<ScheduleSlotRow> slots = classroomRepository.findScheduleSlotsWithIds(classId);

        // Buổi thật trong tuần, gán vào ca khớp (đúng thứ + đúng giờ bắt đầu + hiệu lực).
        Map<Long, OccurrenceSessionRow> sessionBySchedule = new HashMap<>();
        for (OccurrenceSessionRow session : classroomRepository.findWeekSessions(classId, start)) {
            slots.stream()
                    .filter(s -> s.startTime().equals(session.startTime()))
                    .filter(s -> s.dayOfWeek() == session.sessionDate().getDayOfWeek().getValue())
                    .filter(s -> inValidity(s, session.sessionDate()))
                    .findFirst()
                    .ifPresent(s -> sessionBySchedule.put(s.scheduleId(), session));
        }

        // Ngoại lệ trong tuần, mỗi ca tối đa 1 (UNIQUE schedule_id, exception_date).
        Map<Long, SessionExceptionRow> exceptionBySchedule = new HashMap<>();
        for (SessionExceptionRow exception : classroomRepository.findWeekExceptions(classId, start)) {
            exceptionBySchedule.put(exception.scheduleId(), exception);
        }

        List<OccurrenceResponse> occurrences = new ArrayList<>();
        for (ScheduleSlotRow slot : slots) {
            for (int offset = 0; offset < 7; offset++) {
                LocalDate date = start.plusDays(offset);
                if (date.getDayOfWeek().getValue() != slot.dayOfWeek() || !inValidity(slot, date)) {
                    continue;
                }
                OccurrenceSessionRow session = sessionBySchedule.get(slot.scheduleId());
                SessionExceptionRow exception = exceptionBySchedule.get(slot.scheduleId());

                OccurrenceResponse.OccurrenceResponseBuilder builder = OccurrenceResponse.builder()
                        .occurrenceKey(slot.scheduleId() + "_" + date)
                        .scheduleId(slot.scheduleId())
                        .date(date)
                        .dayOfWeek(slot.dayOfWeek())
                        .startTime(slot.startTime())
                        .endTime(slot.endTime());

                if (session != null) {
                    builder.source("SESSION")
                            .session(SessionMini.builder()
                                    .sessionId(session.sessionId())
                                    .status(session.status())
                                    .title(session.title())
                                    .hasLog(session.hasLog())
                                    .build());
                } else if (exception != null) {
                    builder.source("EXCEPTION")
                            .exception(ExceptionInfo.builder()
                                    .type(exception.exceptionType())
                                    .newDate(exception.newDate())
                                    .newStartTime(exception.newStartTime())
                                    .newEndTime(exception.newEndTime())
                                    .newTeachingMode(exception.newTeachingMode())
                                    .newMeetingUrl(exception.newMeetingUrl())
                                    .newLocation(exception.newLocation())
                                    .build());
                } else {
                    builder.source("OCCURRENCE");
                }
                occurrences.add(builder.build());
            }
        }
        return ClassScheduleResponse.builder()
                .weekStart(start)
                .occurrences(occurrences)
                .build();
    }

    /** Danh sách buổi học thật của lớp (mục 4.4) — số thứ tự ROW_NUMBER toàn bộ buổi. */
    @Transactional(readOnly = true)
    public List<SessionListItem> listSessions(Long classId, String status, String order) {
        requireReadAccess(classId);
        boolean descending = order != null && "desc".equalsIgnoreCase(order.trim());
        return classroomRepository.findSessionList(classId, normalizeSessionStatus(status), descending);
    }

    /**
     * Chi tiết buổi học (mục 4.5). Mọi vai trò READ thấy nhật ký nguyên văn khi
     * không null (không gating công bố — mục 1 dòng 7).
     */
    @Transactional(readOnly = true)
    public SessionDetailResponse getDetail(Long sessionId) {
        SessionDetailRow row =
                classroomRepository.findSessionDetail(sessionId)
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        requireReadAccess(row.classId());
        return toDetailResponse(row);
    }

    // ========================================================= EXCEPTION (TUTOR)

    /**
     * Ghi (create/ghi đè) exception cho ô (mục 4.2, 1 transaction):
     * ca thuộc lớp + trong khoảng hiệu lực → ô chưa có session thật (R3) →
     * validate theo loại → RESCHEDULED kiểm trùng ca gia sư (không notification)
     * → upsert idempotent (R4) → audit.
     */
    @Transactional
    public SessionExceptionResponse createException(
            Long classId, CreateExceptionRequest request, HttpServletRequest httpRequest) {
        ClassState state = requireOwnedClassForWrite(classId);
        ScheduleSlotRow slot =
                classroomRepository.findScheduleSlot(classId, request.getScheduleId())
                        .orElseThrow(() -> new AppException(ErrorCode.OCCURRENCE_SCHEDULE_NOT_FOUND));

        LocalDate date = request.getExceptionDate();
        if (!inValidity(slot, date)) {
            throw new AppException(ErrorCode.EXCEPTION_DATE_OUT_OF_RANGE);
        }
        String type = request.getExceptionType().trim().toUpperCase(Locale.ROOT);
        if (!EXCEPTION_TYPES.contains(type)) {
            throw new AppException(ErrorCode.EXCEPTION_TYPE_INVALID);
        }

        // R3: ô đã "vật chất hóa" (có session thật) thì không ghi được exception.
        if (classroomRepository.findOccurrenceSession(classId, date, slot.startTime()).isPresent()) {
            throw new AppException(ErrorCode.OCCURRENCE_HAS_SESSION);
        }

        LocalDate newDate = null;
        LocalTime newStart = null;
        LocalTime newEnd = null;
        String mode = null;
        String meetingUrl = null;
        String location = null;

        switch (type) {
            case "RESCHEDULED" -> {
                newDate = request.getNewDate();
                newStart = request.getNewStartTime();
                newEnd = request.getNewEndTime();
                if (newDate == null || newStart == null || newEnd == null) {
                    throw new AppException(
                            ErrorCode.EXCEPTION_TYPE_INVALID,
                            "Ngoại lệ RESCHEDULED cần newDate, newStartTime và newEndTime");
                }
                if (!newStart.isBefore(newEnd)) {
                    throw new AppException(ErrorCode.SCHEDULE_INVALID_TIME);
                }
                if (newDate.isBefore(LocalDate.now())) {
                    throw new AppException(ErrorCode.EXCEPTION_RESCHEDULE_IN_PAST);
                }
                mode = normalizeOptionalMode(request.getNewTeachingMode());
                meetingUrl = ClassroomQueryRepository.trimToNull(request.getNewMeetingUrl());
                location = ClassroomQueryRepository.trimToNull(request.getNewLocation());
                validateModeFields(mode, meetingUrl, location);
                checkRescheduleConflicts(state, newDate, newStart, newEnd, classId);
            }
            case "MODIFIED" -> {
                // Giờ giữ nguyên ca gốc; chỉ override chi tiết (mục 1 dòng 13).
                mode = normalizeOptionalMode(request.getNewTeachingMode());
                meetingUrl = ClassroomQueryRepository.trimToNull(request.getNewMeetingUrl());
                location = ClassroomQueryRepository.trimToNull(request.getNewLocation());
                validateModeFields(mode, meetingUrl, location);
            }
            case "CANCELLED" ->
                    // chỉ reason (tùy chọn), không conflict check (mục 1 dòng 3)
                    {
            }
            default ->
                    throw new AppException(ErrorCode.EXCEPTION_TYPE_INVALID);
        }

        boolean isUpdate = classroomRepository.findSessionException(slot.scheduleId(), date).isPresent();
        Long id =
                classroomRepository.upsertSessionException(
                        classId,
                        slot.scheduleId(),
                        date,
                        type,
                        newDate,
                        newStart,
                        newEnd,
                        mode,
                        meetingUrl,
                        location,
                        ClassroomQueryRepository.trimToNull(request.getReason()),
                        getCurrentUserId());

        auditLogService.log(
                getCurrentUserId(),
                isUpdate ? "UPDATE_OCCURRENCE_EXCEPTION" : "CREATE_OCCURRENCE_EXCEPTION",
                "SESSION_EXCEPTION",
                id,
                Map.of(
                        "classId", classId,
                        "scheduleId", slot.scheduleId(),
                        "exceptionDate", date.toString(),
                        "type", type),
                httpRequest);

        return classroomRepository
                .findSessionException(slot.scheduleId(), date)
                .map(row -> toExceptionResponse(row, classId))
                .orElseThrow();
    }

    /** Gỡ exception của ô (mục 4.3) — không tồn tại → 404, audit REMOVE. */
    @Transactional
    public void deleteException(
            Long classId, Long scheduleId, LocalDate date, HttpServletRequest httpRequest) {
        requireOwnedClassForWrite(classId);
        classroomRepository
                .findSessionException(scheduleId, date)
                .orElseThrow(() -> new AppException(ErrorCode.EXCEPTION_NOT_FOUND));
        classroomRepository.deleteSessionException(scheduleId, date);
        auditLogService.log(
                getCurrentUserId(),
                "REMOVE_OCCURRENCE_EXCEPTION",
                "SESSION_EXCEPTION",
                scheduleId,
                Map.of(
                        "classId", classId,
                        "scheduleId", scheduleId,
                        "exceptionDate", date.toString()),
                httpRequest);
    }

    // ========================================================= SESSION THẬT (TUTOR)

    /**
     * Sửa / dời buổi (mục 4.6): chỉ SCHEDULED (1144), date >= hôm nay (1146),
     * start &lt; end (1147), trùng slot cùng lớp (1148), trùng ca khác lớp (1126).
     * Đổi ngày/giờ → notification học sinh (sự kiện 2/3).
     */
    @Transactional
    public SessionDetailResponse updateSession(
            Long sessionId, UpdateSessionRequest request, HttpServletRequest httpRequest) {
        LockedSessionRow session = requireOwnedSessionForWrite(sessionId);
        if (!"SCHEDULED".equals(session.status())) {
            throw new AppException(ErrorCode.SESSION_NOT_EDITABLE);
        }

        String mode = ClassroomQueryRepository.normalizeMode(request.getTeachingMode());
        String meetingUrl = ClassroomQueryRepository.trimToNull(request.getMeetingUrl());
        String location = ClassroomQueryRepository.trimToNull(request.getLocation());
        if (!request.getStartTime().isBefore(request.getEndTime())) {
            throw new AppException(ErrorCode.SESSION_INVALID_TIME);
        }
        if (request.getSessionDate().isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.SESSION_RESCHEDULE_IN_PAST);
        }
        validateModeFields(mode, meetingUrl, location);

        // 4a: trùng slot (cùng ngày + cùng giờ bắt đầu) của buổi CHÍNH THỨC khác trong cùng lớp.
        if (classroomRepository.countDuplicateSlotInClass(
                        session.classId(), request.getSessionDate(), request.getStartTime(), sessionId)
                > 0) {
            throw new AppException(ErrorCode.SESSION_DUPLICATE_SLOT);
        }
        // 4b: trùng khung giờ với bất kỳ ca SCHEDULED/IN_PROGRESS khác của gia sư
        // (loại trừ chính buổi đang sửa) — cùng lớp (giao giờ, giờ khác) lẫn khác lớp.
        List<ConflictInfo> conflicts =
                conflictChecker.findConflicts(
                        session.tutorId(),
                        request.getSessionDate(),
                        request.getStartTime(),
                        request.getEndTime(),
                        sessionId);
        if (!conflicts.isEmpty()) {
            throw new AppException(
                    ErrorCode.SCHEDULE_CONFLICT,
                    ScheduleConflictChecker.describeConflict(conflicts.getFirst()));
        }

        boolean moved =
                !request.getSessionDate().equals(session.sessionDate())
                        || !request.getStartTime().equals(session.startTime())
                        || !request.getEndTime().equals(session.endTime());

        try {
            classroomRepository.updateSessionInfo(
                    sessionId,
                    new SessionInfoUpdate(
                            ClassroomQueryRepository.trimToNull(request.getTitle()),
                            request.getSessionDate(),
                            request.getStartTime(),
                            request.getEndTime(),
                            mode,
                            meetingUrl,
                            location));
        } catch (DataIntegrityViolationException ex) {
            // Race 2 request cùng slot — unique index V11 là chốt chặn (mục 4.6 bước 7).
            throw new AppException(ErrorCode.SESSION_DUPLICATE_SLOT);
        }

        auditLogService.log(
                getCurrentUserId(),
                "UPDATE_SESSION",
                "SESSION",
                sessionId,
                Map.of(
                        "before",
                        Map.of(
                                "date", session.sessionDate().toString(),
                                "start", session.startTime().toString(),
                                "end", session.endTime().toString()),
                        "after",
                        Map.of(
                                "date", request.getSessionDate().toString(),
                                "start", request.getStartTime().toString(),
                                "end", request.getEndTime().toString())),
                httpRequest);

        if (moved) {
            notifySessionRescheduled(
                    session, request.getSessionDate(), request.getStartTime(), request.getEndTime());
        }

        return classroomRepository
                .findSessionDetail(sessionId)
                .map(ClassOccurrenceService::toDetailResponse)
                .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
    }

    /**
     * Đổi trạng thái buổi (mục 4.7) theo state machine; đích = CANCELLED thì
     * notification học sinh (sự kiện 1/3).
     */
    @Transactional
    public SessionStatusResponse changeStatus(
            Long sessionId, SetSessionStatusRequest request, HttpServletRequest httpRequest) {
        LockedSessionRow session = requireOwnedSessionForWrite(sessionId);
        String to = request.getStatus().trim().toUpperCase(Locale.ROOT);
        if (!SESSION_STATUSES.contains(to)
                || "SCHEDULED".equals(to)
                || !VALID_TRANSITIONS.contains(session.status() + "->" + to)) {
            throw new AppException(ErrorCode.SESSION_INVALID_TRANSITION);
        }

        classroomRepository.updateSessionStatus(sessionId, to);
        auditLogService.log(
                getCurrentUserId(),
                "SESSION_STATUS_CHANGED",
                "SESSION",
                sessionId,
                Map.of("from", session.status(), "to", to),
                httpRequest);

        if ("CANCELLED".equals(to)) {
            notifySessionCancelled(session);
        }
        return SessionStatusResponse.builder().sessionId(sessionId).status(to).build();
    }

    /**
     * Lưu nhật ký buổi (mục 4.8): ít nhất 1 nội dung (1149); lần đầu (cả 2 log
     * đang NULL) mới notification học sinh (sự kiện 3/3) — xóa trắng rồi lưu lại
     * được chấp nhận báo thêm (mục 1 dòng 7).
     */
    @Transactional
    public SessionLogResponse saveLog(
            Long sessionId, UpdateSessionLogRequest request, HttpServletRequest httpRequest) {
        LockedSessionRow session = requireOwnedSessionForWrite(sessionId);

        String knowledge = ClassroomQueryRepository.trimToNull(request.getLogKnowledge());
        String homework = ClassroomQueryRepository.trimToNull(request.getLogHomework());
        if (knowledge == null && homework == null) {
            throw new AppException(ErrorCode.SESSION_LOG_EMPTY);
        }
        boolean firstPublish =
                session.logKnowledge() == null && session.logHomework() == null;

        classroomRepository.updateSessionLog(sessionId, knowledge, homework);
        auditLogService.log(
                getCurrentUserId(),
                "UPDATE_SESSION_LOG",
                "SESSION",
                sessionId,
                Map.of("firstPublish", firstPublish),
                httpRequest);

        if (firstPublish) {
            notifySessionLogPublished(session);
        }
        return SessionLogResponse.builder().sessionId(sessionId).firstPublish(firstPublish).build();
    }

    // ---------------------------------------------------------------- MATERIALIZE

    /**
     * Vật chất hóa (R9, mục 1.8): "Tạo buổi học" (on-demand) vào ô đang có
     * exception → xóa exception, session thật kế thừa ngày/giờ. Gọi từ
     * {@code TutorClassService.createSessionOnDemand} sau khi insert thành công,
     * cùng transaction. Không notification (giữ nguyên hành vi create on-demand).
     *
     * @return true nếu có exception bị xóa, false nếu ô không có overlay.
     */
    @Transactional
    public boolean materializeOccurrenceException(
            Long classId,
            LocalDate date,
            int dayOfWeek,
            LocalTime startTime,
            Long actorId,
            HttpServletRequest httpRequest) {
        var exception =
                classroomRepository.findExceptionForOccurrence(classId, date, dayOfWeek, startTime);
        if (exception.isEmpty()) {
            return false;
        }
        classroomRepository.deleteSessionException(exception.get().scheduleId(), exception.get().exceptionDate());
        auditLogService.log(
                actorId,
                "MATERIALIZE_OCCURRENCE",
                "SESSION_EXCEPTION",
                exception.get().scheduleId(),
                Map.of("classId", classId, "exceptionDate", date.toString()),
                httpRequest);
        return true;
    }

    // ------------------------------------------------------------------- QUYỀN

    /**
     * Quyền đọc (mục 4.1/4.4/4.5, dòng 6): TUTOR sở hữu lớp, STUDENT sở hữu lớp,
     * RECEPTIONIST/ADMIN không check sở hữu. Lớp không tồn tại → 404; TUTOR/STUDENT
     * không sở hữu → 403 SESSION_NOT_OWNED.
     */
    private ClassState requireReadAccess(Long classId) {
        ClassState state =
                classroomRepository.findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        User user = getCurrentUser();
        if (UserRole.TUTOR.name().equals(user.getRole())) {
            if (!user.getId().equals(state.tutorId())) {
                throw new AppException(ErrorCode.SESSION_NOT_OWNED);
            }
        } else if (UserRole.STUDENT.name().equals(user.getRole())) {
            if (!user.getId().equals(state.studentId())) {
                throw new AppException(ErrorCode.SESSION_NOT_OWNED);
            }
        }
        return state;
    }

    /** Quyền ghi exception (TUTOR sở hữu lớp — mục 4.2/4.3). */
    private ClassState requireOwnedClassForWrite(Long classId) {
        ClassState state =
                classroomRepository.findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!getCurrentUserId().equals(state.tutorId())) {
            throw new AppException(ErrorCode.SESSION_NOT_OWNED);
        }
        return state;
    }

    /** Buổi tồn tại + TUTOR sở hữu lớp chủ (khóa row FOR UPDATE — mục 4.6–4.8). */
    private LockedSessionRow requireOwnedSessionForWrite(Long sessionId) {
        LockedSessionRow session =
                classroomRepository.lockSession(sessionId)
                        .orElseThrow(() -> new AppException(ErrorCode.SESSION_NOT_FOUND));
        if (!getCurrentUserId().equals(session.tutorId())) {
            throw new AppException(ErrorCode.SESSION_NOT_OWNED);
        }
        return session;
    }

    // ----------------------------------------------------------------- HELPERS

    /**
     * Kiểm trùng khi DỜI ô ảo (RESCHEDULED, mục 1 dòng 3): (a) ca cố định của lớp
     * KHÁC cùng thứ với new_date + giao giờ + giao hiệu lực, (b) session
     * SCHEDULED/IN_PROGRESS khác của gia sư cùng new_date. Ô ảo chưa có session
     * thật nên không loại trừ chính lớp — session thật trùng ngày đó thật sự là
     * double-booking. Không gửi notification (điều chỉnh lịch tuần).
     */
    private void checkRescheduleConflicts(
            ClassState state, LocalDate newDate, LocalTime newStart, LocalTime newEnd, Long classId) {
        List<WeeklyConflictInfo> weeklyConflicts =
                conflictChecker.findWeeklyConflicts(
                        state.tutorId(),
                        newDate.getDayOfWeek().getValue(),
                        newStart,
                        newEnd,
                        newDate,
                        newDate,
                        classId);
        if (!weeklyConflicts.isEmpty()) {
            throw new AppException(
                    ErrorCode.SCHEDULE_CONFLICT,
                    ScheduleConflictChecker.describeWeeklyConflict(weeklyConflicts.getFirst()));
        }
        List<ConflictInfo> perDateConflicts =
                conflictChecker.findConflicts(state.tutorId(), newDate, newStart, newEnd, null);
        if (!perDateConflicts.isEmpty()) {
            throw new AppException(
                    ErrorCode.SCHEDULE_CONFLICT,
                    ScheduleConflictChecker.describeConflict(perDateConflicts.getFirst()));
        }
    }

    /** Ngày nằm trong khoảng hiệu lực của ca ({@code valid_from <= date <= valid_to/open}). */
    private static boolean inValidity(ScheduleSlotRow slot, LocalDate date) {
        return slot.validFrom().compareTo(date) <= 0
                && (slot.validTo() == null || slot.validTo().compareTo(date) >= 0);
    }

    /** null/blank = kế thừa (trường không bắt buộc), ngược lại normalize về UPPER. */
    private static String normalizeOptionalMode(String mode) {
        if (mode == null || mode.isBlank()) {
            return null;
        }
        return mode.trim().toUpperCase(Locale.ROOT);
    }

    /** Validate link/địa chỉ theo hình thức khi override (reused 1129/1130/1131). */
    private void validateModeFields(String mode, String meetingUrl, String location) {
        if (mode == null) {
            return; // kế thừa ca gốc — không validate
        }
        if (!"ONLINE".equals(mode) && !"AT_HOME".equals(mode)) {
            throw new AppException(ErrorCode.TRIAL_SESSION_INVALID_MODE);
        }
        if ("ONLINE".equals(mode) && meetingUrl == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
        }
        if ("AT_HOME".equals(mode) && location == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
        }
    }

    private static String normalizeSessionStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        String upper = status.trim().toUpperCase(Locale.ROOT);
        if (!SESSION_STATUSES.contains(upper)) {
            throw new AppException(ErrorCode.INVALID_CLASS_STATUS);
        }
        return upper;
    }

    private static SessionDetailResponse toDetailResponse(SessionDetailRow row) {
        boolean hasLog = row.logKnowledge() != null || row.logHomework() != null;
        return SessionDetailResponse.builder()
                .sessionId(row.sessionId())
                .sessionNumber(row.sessionNumber())
                .classId(row.classId())
                .className(row.className())
                .studentName(row.studentName())
                .tutorName(row.tutorName())
                .title(row.title())
                .sessionDate(row.sessionDate())
                .startTime(row.startTime())
                .endTime(row.endTime())
                .teachingMode(row.teachingMode())
                .meetingUrl(row.meetingUrl())
                .location(row.location())
                .status(row.status())
                .isTrial(row.isTrial())
                .logKnowledge(row.logKnowledge())
                .logHomework(row.logHomework())
                .hasLog(hasLog)
                .build();
    }

    private static SessionExceptionResponse toExceptionResponse(SessionExceptionRow row, Long classId) {
        return SessionExceptionResponse.builder()
                .id(row.id())
                .classId(classId)
                .scheduleId(row.scheduleId())
                .exceptionDate(row.exceptionDate())
                .exceptionType(row.exceptionType())
                .newDate(row.newDate())
                .newStartTime(row.newStartTime())
                .newEndTime(row.newEndTime())
                .newTeachingMode(row.newTeachingMode())
                .newMeetingUrl(row.newMeetingUrl())
                .newLocation(row.newLocation())
                .reason(row.reason())
                .createdBy(row.createdBy())
                .createdAt(row.createdAt())
                .build();
    }

    // ------------------------------------------------- NOTIFICATION (bản tạm, T8-A1 thay)

    /** Sự kiện 1/3: hủy buổi học thật → báo học sinh. */
    private void notifySessionCancelled(LockedSessionRow session) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                session.studentId(),
                "Buổi học đã bị hủy",
                "Buổi học ngày " + session.sessionDate().format(DATE_FMT) + " đã bị hủy",
                session.classId());
    }

    /** Sự kiện 2/3: dời buổi học thật (đổi ngày/giờ) → báo học sinh. */
    private void notifySessionRescheduled(
            LockedSessionRow session, LocalDate newDate, LocalTime newStart, LocalTime newEnd) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                session.studentId(),
                "Buổi học đã đổi lịch",
                "Buổi học " + session.sessionDate().format(DATE_FMT) + " đã được dời sang "
                        + newDate.format(DATE_FMT) + " " + newStart.format(TIME_FMT) + "-"
                        + newEnd.format(TIME_FMT),
                session.classId());
    }

    /** Sự kiện 3/3: gia sư lưu nhật ký lần đầu → báo học sinh. */
    private void notifySessionLogPublished(LockedSessionRow session) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'CLASS', ?)
                """,
                session.studentId(),
                "Gia sư đã ghi nhật ký",
                "Gia sư đã ghi nhật ký buổi học ngày " + session.sessionDate().format(DATE_FMT),
                session.classId());
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
