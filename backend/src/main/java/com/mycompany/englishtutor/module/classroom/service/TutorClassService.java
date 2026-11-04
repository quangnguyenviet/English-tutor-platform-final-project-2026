package com.mycompany.englishtutor.module.classroom.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonListItem;
import com.mycompany.englishtutor.module.classroom.api.response.LessonMaterialItem;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictSlotInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonMaterialRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.TrialSlotRow;
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
 * Nghiệp vụ lớp học của gia sư (API_DESIGN mục 3.5, UC-T08 + UC-T09, V16):
 * đọc lớp, ca thử (classes.trial_*), chốt/cập nhật lịch cố định và CRUD bài
 * giảng (lessons — driver nhúng vào lớp, không lên lịch).
 *
 * <p>V16: ca dạy thử là 6 cột trial_* trên chính dòng {@code classes} (chỉ khi
 * status = TRIAL); tạo/sửa bài giảng ở tab riêng, không còn "materialize buổi
 * học on-demand" (R9 bỏ); trùng ca dò trên {@code class_schedules} + ca thử,
 * không còn dòng session.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorClassService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_TRIAL = "TRIAL";

    private static final String MODE_ONLINE = "ONLINE";
    private static final String MODE_AT_HOME = "AT_HOME";
    private static final String LOG_STATUS_PUBLISHED = "PUBLISHED";
    private static final String LOG_STATUS_HIDDEN = "HIDDEN";

    ClassroomQueryRepository classroomRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    ScheduleConflictChecker conflictChecker;

    // ---------------------------------------------------------- READ

    @Transactional(readOnly = true)
    public List<ClassSummaryResponse> getMyClasses(String status) {
        Long tutorId = requireCurrentTutor();
        String normalized = (status == null || status.isBlank()) ? null : status.trim().toUpperCase();
        return classroomRepository.findMyClasses(tutorId, normalized);
    }

    /**
     * Chi tiết lớp học (đọc, có khóa — dùng cả khi cần sửa). Chứa ca thử
     * (trial_*), danh sách ca cố định, các ngày có log dạy học và ca của
     * hôm nay.
     */
    @Transactional(readOnly = true)
    public ClassDetailResponse getClassDetail(Long classId) {
        Long tutorId = requireCurrentTutor();
        ClassDetailResponse detail =
                classroomRepository
                        .findClassDetail(classId, tutorId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));

        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(state.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }

        var schedules = classroomRepository.findSchedules(classId);
        detail.setSchedules(schedules);
        detail.setHasSchedules(!schedules.isEmpty());
        detail.setSessionDates(classroomRepository.findLogDates(classId));

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

    // ------------------------------------------------- CA THỬ (classes.trial_*)

    @Transactional
    public TrialSessionResponse upsertTrialSlot(
            Long classId, UpsertTrialSessionRequest request, HttpServletRequest httpRequest) {
        Long tutorId = requireCurrentTutor();
        ClassState state = requireOwnedClass(classId, tutorId, STATUS_TRIAL);

        if (request.getEndTime() != null && request.getStartTime() != null
                && request.getEndTime().compareTo(request.getStartTime()) <= 0) {
            throw new AppException(ErrorCode.TRIAL_SESSION_INVALID_TIME);
        }
        if (request.getSessionDate() != null && request.getSessionDate().isBefore(LocalDate.now())) {
            throw new AppException(ErrorCode.TRIAL_SESSION_DATE_IN_PAST);
        }

        String mode = ClassroomQueryRepository.normalizeMode(request.getTeachingMode());
        if (!MODE_ONLINE.equals(mode) && !MODE_AT_HOME.equals(mode)) {
            throw new AppException(ErrorCode.TRIAL_SESSION_INVALID_MODE);
        }
        String meetingUrl = ClassroomQueryRepository.trimToNull(request.getMeetingUrl());
        String location = ClassroomQueryRepository.trimToNull(request.getLocation());
        if (MODE_ONLINE.equals(mode) && meetingUrl == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_MEETING_URL);
        }
        if (MODE_AT_HOME.equals(mode) && location == null) {
            throw new AppException(ErrorCode.TRIAL_SESSION_MISSING_LOCATION);
        }

        requireNoTrialConflict(tutorId, classId, request.getSessionDate(), request.getStartTime(), request.getEndTime());

        classroomRepository.upsertTrialSlot(classId, request, mode, meetingUrl, location);

        auditLogService.log(
                tutorId,
                "UPSERT_TRIAL_SLOT",
                "CLASS",
                classId,
                Map.of("date", String.valueOf(request.getSessionDate()), "mode", mode),
                httpRequest);

        return classroomRepository
                .findTrialSession(classId)
                .orElseThrow(() -> new AppException(ErrorCode.TRIAL_SESSION_NOT_FOUND));
    }

    /**
     * Ca thử mới không được trùng ca cố định hay ca thử của lớp khác cùng tutor.
     * (Mục 4: đọc class_schedules + ca thử của các lớp khác.)
     */
    private void requireNoTrialConflict(
            Long tutorId, Long classId, LocalDate date, LocalTime start, LocalTime end) {
        List<ConflictSlotInfo> slotConflicts =
                classroomRepository.findSlotConflicts(tutorId, date, date, date.getDayOfWeek().getValue(), start, end, classId);
        List<TrialSlotRow> trialConflicts =
                classroomRepository.findTrialConflicts(tutorId, classId, date, start, end);
        if (!slotConflicts.isEmpty() || !trialConflicts.isEmpty()) {
            String first =
                    !slotConflicts.isEmpty()
                            ? ScheduleConflictChecker.describeConflict(slotConflicts.get(0))
                            : "Ca thử trùng với ca thử của lớp khác của bạn. Vui lòng chọn khung giờ khác.";
            throw new AppException(ErrorCode.SCHEDULE_CONFLICT, first);
        }
    }

    // ------------------------------------------------- LỊCH CỐ ĐỊNH (UC-T09)

    @Transactional
    public FinalizeScheduleResponse finalizeSchedule(
            Long classId, FinalizeScheduleRequest request, HttpServletRequest httpRequest) {
        if (classroomRepository.countSchedules(classId) > 0) {
            throw new AppException(ErrorCode.SCHEDULE_ALREADY_EXISTS);
        }
        return writeSchedule(classId, request, "FINALIZE_SCHEDULE", httpRequest, false);
    }

    @Transactional
    public FinalizeScheduleResponse updateSchedule(
            Long classId, FinalizeScheduleRequest request, HttpServletRequest httpRequest) {
        if (classroomRepository.countSchedules(classId) == 0) {
            throw new AppException(ErrorCode.SCHEDULE_NOT_FOUND);
        }
        return writeSchedule(classId, request, "UPDATE_SCHEDULE", httpRequest, true);
    }

    private FinalizeScheduleResponse writeSchedule(
            Long classId,
            FinalizeScheduleRequest request,
            String action,
            HttpServletRequest httpRequest,
            boolean overwrite) {
        Long tutorId = requireCurrentTutor();
        ClassState state = requireOwnedClass(classId, tutorId, STATUS_ACTIVE);

        validateSlots(request.getSchedules());

        if (overwrite) {
            classroomRepository.deleteSchedules(classId);
        }
        classroomRepository.insertSchedules(classId, request.getSchedules());

        auditLogService.log(
                tutorId,
                action,
                "CLASS",
                classId,
                Map.of("slotCount", request.getSchedules().size()),
                httpRequest);

        return FinalizeScheduleResponse.builder()
                .classId(classId)
                .schedules(classroomRepository.findSchedules(classId))
                .build();
    }

    private void validateSlots(List<FinalizeScheduleRequest.ScheduleSlot> slots) {
        List<WeeklyConflictInfo> weeklyConflicts =
                slots.stream()
                        .flatMap(
                                s ->
                                        conflictChecker
                                                .findWeeklyConflicts(
                                                        requireCurrentTutor(),
                                                        s.getDayOfWeek(),
                                                        s.getStartTime(),
                                                        s.getEndTime(),
                                                        s.getValidFrom(),
                                                        s.getValidTo(),
                                                        null)
                                                .stream())
                        .toList();
        if (!weeklyConflicts.isEmpty()) {
            throw new AppException(
                    ErrorCode.SCHEDULE_CONFLICT,
                    "Trùng ca dạy của bạn: "
                            + String.join(" ", weeklyConflicts.stream()
                                    .map(ScheduleConflictChecker::describeWeeklyConflict)
                                    .toList()));
        }

        for (int i = 0; i < slots.size(); i++) {
            FinalizeScheduleRequest.ScheduleSlot a = slots.get(i);
            if (a.getStartTime() == null || a.getEndTime() == null
                    || a.getEndTime().compareTo(a.getStartTime()) <= 0) {
                throw new AppException(
                        ErrorCode.SCHEDULE_INVALID_TIME,
                        "Ca thứ " + a.getDayOfWeek() + ": giờ kết thúc phải sau giờ bắt đầu");
            }
            if (a.getValidFrom() != null && a.getValidFrom().isBefore(LocalDate.now())) {
                throw new AppException(ErrorCode.SCHEDULE_DATE_IN_PAST);
            }
            if (a.getValidTo() != null && a.getValidTo().isBefore(a.getValidFrom())) {
                throw new AppException(ErrorCode.SCHEDULE_INVALID_RANGE);
            }
            for (int j = i + 1; j < slots.size(); j++) {
                FinalizeScheduleRequest.ScheduleSlot b = slots.get(j);
                boolean sameWeek = a.getDayOfWeek().equals(b.getDayOfWeek());
                boolean timeOverlap =
                        a.getStartTime().isBefore(b.getEndTime())
                                && a.getEndTime().isAfter(b.getStartTime());
                if (sameWeek
                        && timeOverlap
                        && validRangesOverlap(
                                a.getValidFrom(), a.getValidTo(), b.getValidFrom(), b.getValidTo())) {
                    throw new AppException(ErrorCode.SCHEDULE_DUPLICATE);
                }
            }
        }
    }

    private static boolean validRangesOverlap(
            LocalDate aFrom, LocalDate aTo, LocalDate bFrom, LocalDate bTo) {
        LocalDate aEnd = aTo != null ? aTo : LocalDate.MAX;
        LocalDate bEnd = bTo != null ? bTo : LocalDate.MAX;
        return !aEnd.isBefore(bFrom) && !bEnd.isBefore(aFrom);
    }

    // ------------------------------------------------------- BÀI GIẢNG (lessons)

    @Transactional
    public LessonDetailResponse createLesson(
            Long classId, CreateLessonRequest request, HttpServletRequest httpRequest) {
        Long tutorId = requireCurrentTutor();
        requireOwnedClass(classId, tutorId, STATUS_ACTIVE, STATUS_TRIAL);

        String title =
                ClassroomQueryRepository.trimToNull(request.getTitle()) != null
                        ? request.getTitle().trim()
                        : "Bài giảng";
        Long lessonId = classroomRepository.insertLesson(classId, title);
        auditLogService.log(tutorId, "CREATE_LESSON", "LESSON", lessonId, Map.of("classId", classId), httpRequest);
        return buildLessonDetail(
                classroomRepository.findLessonDetail(lessonId).orElseThrow(), lessonId);
    }

    @Transactional
    public LessonDetailResponse updateLesson(
            Long lessonId, UpdateLessonRequest request, HttpServletRequest httpRequest) {
        Long tutorId = requireCurrentTutor();
        LessonDetailRow lesson =
                classroomRepository
                        .lockLesson(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(lesson.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }

        String newTitle = ClassroomQueryRepository.trimToNull(request.getTitle());
        if (newTitle != null) {
            classroomRepository.updateLessonTitle(lessonId, newTitle);
        }
        String newStatus = ClassroomQueryRepository.normalizeMode(request.getStatus());
        if (newStatus != null) {
            if (!LOG_STATUS_PUBLISHED.equals(newStatus) && !LOG_STATUS_HIDDEN.equals(newStatus)) {
                throw new AppException(ErrorCode.INVALID_CLASS_STATUS);
            }
            classroomRepository.updateLessonStatus(lessonId, newStatus);
        }

        auditLogService.log(
                tutorId,
                "UPDATE_LESSON",
                "LESSON",
                lessonId,
                Map.of("classId", lesson.classId()),
                httpRequest);
        return buildLessonDetail(lesson, lessonId);
    }

    @Transactional
    public void deleteLesson(Long lessonId, HttpServletRequest httpRequest) {
        Long tutorId = requireCurrentTutor();
        LessonDetailRow lesson =
                classroomRepository
                        .lockLesson(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(lesson.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        int deleted = classroomRepository.deleteLesson(lesson.classId(), lessonId);
        if (deleted == 0) {
            throw new AppException(ErrorCode.CLASS_NOT_FOUND);
        }
        auditLogService.log(tutorId, "DELETE_LESSON", "LESSON", lessonId, Map.of("classId", lesson.classId()), httpRequest);
    }

    @Transactional(readOnly = true)
    public List<LessonListItem> listLessons(Long classId) {
        Long tutorId = requireCurrentTutor();
        requireOwnedClass(classId, tutorId, STATUS_ACTIVE, STATUS_TRIAL);
        return classroomRepository.findLessonList(classId, false);
    }

    @Transactional(readOnly = true)
    public LessonDetailResponse getLessonDetail(Long lessonId) {
        Long tutorId = requireCurrentTutor();
        LessonDetailRow lesson =
                classroomRepository
                        .findLessonDetail(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(lesson.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        return buildLessonDetail(lesson, lessonId);
    }

    private LessonDetailResponse buildLessonDetail(LessonDetailRow lesson, Long lessonId) {
        List<LessonMaterialItem> materials =
                classroomRepository.findLessonMaterials(lessonId).stream().map(this::toMaterialItem).toList();
        return LessonDetailResponse.builder()
                .lessonId(lesson.lessonId())
                .classId(lesson.classId())
                .className(lesson.className())
                .studentName(lesson.studentName())
                .tutorName(lesson.tutorName())
                .title(lesson.title())
                .status(lesson.status())
                .materials(materials)
                .quizCount(lesson.quizCount())
                .createdAt(lesson.createdAt())
                .updatedAt(lesson.updatedAt())
                .build();
    }

    private LessonMaterialItem toMaterialItem(LessonMaterialRow row) {
        return LessonMaterialItem.builder()
                .materialId(row.materialId())
                .fileName(row.fileName())
                .fileType(row.fileType())
                .fileSize(row.fileSize())
                .uploadedByName(row.uploadedByName())
                .createdAt(row.createdAt())
                .build();
    }

    // ------------------------------------------------------------- HELPERS

    private Long requireCurrentTutor() {
        return getCurrentUser().getId();
    }

    private ClassState requireOwnedClass(Long classId, Long tutorId, String... allowedStatuses) {
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        if (!tutorId.equals(state.tutorId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
        for (String s : allowedStatuses) {
            if (s.equalsIgnoreCase(state.status())) {
                return state;
            }
        }
        throw new AppException(ErrorCode.INVALID_CLASS_STATUS);
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}
