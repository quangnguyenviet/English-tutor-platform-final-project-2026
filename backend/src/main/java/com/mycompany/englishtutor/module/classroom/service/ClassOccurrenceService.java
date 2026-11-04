package com.mycompany.englishtutor.module.classroom.service;

import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ExceptionInfo;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonMaterialItem;
import com.mycompany.englishtutor.module.classroom.api.response.MaterialAccessUrlResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OccurrenceResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogMini;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ClassState;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonDetailRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LessonMaterialRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.LogUpsertResult;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleExceptionRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ScheduleSlotRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.TeachingLogRow;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.TrialSlotRow;
import com.mycompany.englishtutor.module.tutor.service.StorageService;
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
 * Đọc/ghi "Lịch dạy" theo lattice tuần (V16): ca cố định (class_schedules),
 * ngoại lệ (schedule_exceptions), nhật ký dạy học (teaching_logs) và ca thử
 * (classes.trial_*). Nhật ký là bảng độc lập khớp ô ca theo
 * (class_id, log_date, start_time) — không còn "buổi học thật" (session).
 * Tài liệu giờ gắn bài giảng (lesson_materials).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassOccurrenceService {

    private static final String STATUS_ACTIVE = "ACTIVE";
    private static final String STATUS_TRIAL = "TRIAL";

    private static final String EXCEPTION_CANCELLED = "CANCELLED";
    private static final String EXCEPTION_RESCHEDULED = "RESCHEDULED";

    /** Folder vật lý trong bucket cho tài liệu bài giảng. */
    private static final String MATERIALS_FOLDER_PREFIX = "lesson-materials";

    /** Dung lượng tối đa 1 tài liệu bài giảng (API_DESIGN §3.6: ≤ 20 MB). */
    private static final long MATERIAL_MAX_BYTES = 20L * 1024 * 1024;

    /** Hạn dùng link tải ký sẵn cho tài liệu (API_DESIGN §3.6: 10 phút). */
    private static final Duration MATERIAL_URL_TTL = Duration.ofMinutes(10);

    /** Định dạng cho phép upload — map về cột {@code file_type} (PDF|DOCX|IMAGE|AUDIO). */
    private static final Set<String> MATERIAL_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/gif", "image/webp");
    private static final Set<String> MATERIAL_AUDIO_TYPES =
            Set.of("audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg");

    private static final java.time.format.DateTimeFormatter DATE_FMT = java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final java.time.format.DateTimeFormatter TIME_FMT = java.time.format.DateTimeFormatter.ofPattern("HH:mm");

    ClassroomQueryRepository classroomRepository;
    UserRepository userRepository;
    AuditLogService auditLogService;
    StorageService storageService;

    // ------------------------------------------------------------- LATTICE (đọc)

    /**
     * Lattice tuần [weekStart, weekStart+6]: mỗi ca cố định x từng ngày trong
     * khoảng hiệu lực = 1 ô; overlay nhật ký (log chấm "đã có nội dung") và
     * ngoại lệ; ca thử của lớp là ô độc lập (source = TRIAL).
     */
    @Transactional(readOnly = true)
    public ClassScheduleResponse listOccurrences(Long classId, LocalDate weekStart) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);

        LocalDate monday = weekStart.with(DayOfWeek.MONDAY);

        // Ca cố định kèm id (để key ô ổn định).
        List<ScheduleSlotRow> slots = classroomRepository.findScheduleSlotsWithIds(classId);

        // Nhật ký trong tuần -> map (date, startTime) -> log.
        Map<String, TeachingLogRow> logsBySlot = new HashMap<>();
        for (TeachingLogRow log : classroomRepository.findWeekTeachingLogs(classId, monday)) {
            logsBySlot.put(logKey(log.logDate(), log.startTime()), log);
        }

        // Ngoại lệ trong tuần -> map (scheduleId, exceptionDate) -> exception.
        Map<String, ScheduleExceptionRow> exceptionsBySlot = new HashMap<>();
        for (ScheduleExceptionRow ex : classroomRepository.findWeekExceptions(classId, monday)) {
            exceptionsBySlot.put(ex.scheduleId() + "_" + ex.exceptionDate(), ex);
        }

        List<OccurrenceResponse> occurrences = new ArrayList<>();

        // Ca cố định x từng ngày.
        for (ScheduleSlotRow slot : slots) {
            for (int offset = 0; offset < 7; offset++) {
                LocalDate date = monday.plusDays(offset);
                if (date.getDayOfWeek().getValue() != slot.dayOfWeek() || !inValidity(slot, date)) {
                    continue;
                }
                String slotKey = slot.scheduleId() + "_" + date;
                TeachingLogRow log = logsBySlot.get(logKey(date, slot.startTime()));
                ScheduleExceptionRow ex = exceptionsBySlot.get(slotKey);

                OccurrenceResponse.OccurrenceResponseBuilder builder = OccurrenceResponse.builder()
                        .occurrenceKey(slotKey)
                        .scheduleId(slot.scheduleId())
                        .date(date)
                        .dayOfWeek(slot.dayOfWeek())
                        .source(ex != null ? "EXCEPTION" : "OCCURRENCE")
                        .startTime(slot.startTime())
                        .endTime(slot.endTime())
                        .log(log != null ? toLogMini(log) : null);

                if (ex != null) {
                    builder.exception(toExceptionInfo(ex));
                }
                occurrences.add(builder.build());
            }
        }

        // Ca thử (classes.trial_*) — ô độc lập khi chưa có ca cố định che cùng ca
        // và ngày ca thử nằm trong tuần đang xem.
        classroomRepository
                .findTrialSlot(classId)
                .filter(
                        trial ->
                                trial.trialDate() != null
                                        && !trial.trialDate().isBefore(weekStart)
                                        && trial.trialDate().isBefore(weekStart.plusDays(7)))
                .ifPresent(
                        trial -> {
                            if (!classroomRepository.isTrialCoveredBySlot(classId, trial.trialDate(), trial.startTime())) {
                                TeachingLogRow log = logsBySlot.get(logKey(trial.trialDate(), trial.startTime()));
                                occurrences.add(
                                        OccurrenceResponse.builder()
                                                .occurrenceKey("trial_" + trial.trialDate() + "_" + trial.startTime())
                                                .scheduleId(null)
                                                .date(trial.trialDate())
                                                .dayOfWeek(trial.trialDate().getDayOfWeek().getValue())
                                                .source("TRIAL")
                                                .startTime(trial.startTime())
                                                .endTime(trial.endTime())
                                                .trial(true)
                                                .teachingMode(trial.teachingMode())
                                                .meetingUrl(trial.meetingUrl())
                                                .location(trial.location())
                                                .log(log != null ? toLogMini(log) : null)
                                                .build());
                            }
                        });

        occurrences.sort(
                (a, b) ->
                        a.getDate().compareTo(b.getDate()) == 0
                                ? a.getStartTime().compareTo(b.getStartTime())
                                : a.getDate().compareTo(b.getDate()));

        return ClassScheduleResponse.builder().weekStart(monday).occurrences(occurrences).build();
    }

    private static boolean inValidity(ScheduleSlotRow slot, LocalDate date) {
        return (slot.validFrom() == null || !date.isBefore(slot.validFrom()))
                && (slot.validTo() == null || !date.isAfter(slot.validTo()));
    }

    private static String logKey(LocalDate date, LocalTime startTime) {
        return date + "_" + startTime;
    }

    private TeachingLogMini toLogMini(TeachingLogRow row) {
        return TeachingLogMini.builder()
                .logId(row.id())
                .hasContent(row.knowledge() != null || row.homework() != null)
                .knowledge(row.knowledge() != null ? truncate(row.knowledge(), 60) : null)
                .homework(row.homework() != null ? truncate(row.homework(), 60) : null)
                .build();
    }

    private static String truncate(String s, int max) {
        return s.length() > max ? s.substring(0, max) + "…" : s;
    }

    private ExceptionInfo toExceptionInfo(ScheduleExceptionRow ex) {
        return ExceptionInfo.builder()
                .type(ex.exceptionType())
                .newDate(ex.newDate())
                .newStartTime(ex.newStartTime())
                .newEndTime(ex.newEndTime())
                .newTeachingMode(ex.newTeachingMode())
                .newMeetingUrl(ex.newMeetingUrl())
                .newLocation(ex.newLocation())
                .build();
    }

    // ------------------------------------------------------------- EXCEPTION (ghi)

    @Transactional
    public SessionExceptionResponse createException(
            Long classId, CreateExceptionRequest request, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);

        ScheduleSlotRow slot =
                classroomRepository
                        .findScheduleSlot(classId, request.getScheduleId())
                        .orElseThrow(() -> new AppException(ErrorCode.OCCURRENCE_SCHEDULE_NOT_FOUND));

        if (request.getExceptionDate().isBefore(slot.validFrom())) {
            throw new AppException(ErrorCode.EXCEPTION_DATE_OUT_OF_RANGE);
        }
        if (slot.validTo() != null && request.getExceptionDate().isAfter(slot.validTo())) {
            throw new AppException(ErrorCode.EXCEPTION_DATE_OUT_OF_RANGE);
        }

        String type = request.getExceptionType();
        if (!EXCEPTION_CANCELLED.equals(type) && !EXCEPTION_RESCHEDULED.equals(type)) {
            throw new AppException(ErrorCode.EXCEPTION_TYPE_INVALID);
        }
        if (EXCEPTION_RESCHEDULED.equals(type)) {
            if (request.getNewDate() == null
                    || request.getNewStartTime() == null
                    || request.getNewEndTime() == null
                    || request.getNewEndTime().compareTo(request.getNewStartTime()) <= 0) {
                throw new AppException(ErrorCode.EXCEPTION_TYPE_INVALID);
            }
            if (request.getNewDate().isBefore(LocalDate.now())) {
                throw new AppException(ErrorCode.EXCEPTION_RESCHEDULE_IN_PAST);
            }
        }

        // R-LOG: ô đã có log (CANCELLED/RESCHEDULED) → buổi không diễn ra đúng ca → chặn.
        if ((EXCEPTION_CANCELLED.equals(type) || EXCEPTION_RESCHEDULED.equals(type))
                && classroomRepository.countTeachingLogAt(classId, request.getExceptionDate(), slot.startTime()) > 0) {
            throw new AppException(
                    ErrorCode.OCCURRENCE_HAS_SESSION,
                    "Ca này đã có nhật ký dạy học, không thể hủy/dời — xóa log trước.");
        }

        Long id =
                classroomRepository.upsertScheduleException(
                        classId,
                        request.getScheduleId(),
                        request.getExceptionDate(),
                        type,
                        request.getNewDate(),
                        request.getNewStartTime(),
                        request.getNewEndTime(),
                        request.getNewTeachingMode(),
                        request.getNewMeetingUrl(),
                        request.getNewLocation(),
                        request.getReason(),
                        userId);

        boolean wasUpdate =
                classroomRepository
                        .findScheduleException(request.getScheduleId(), request.getExceptionDate())
                        .isPresent();
        auditLogService.log(
                userId,
                wasUpdate ? "UPDATE_EXCEPTION" : "CREATE_EXCEPTION",
                "SCHEDULE_EXCEPTION",
                id,
                Map.of("classId", classId, "scheduleId", request.getScheduleId(), "type", type),
                httpRequest);

        return classroomRepository
                .findScheduleException(request.getScheduleId(), request.getExceptionDate())
                .map(this::toExceptionResponse)
                .orElseThrow();
    }

    @Transactional
    public void deleteException(
            Long classId, Long scheduleId, LocalDate exceptionDate, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);

        int deleted = classroomRepository.deleteScheduleException(scheduleId, exceptionDate);
        if (deleted == 0) {
            throw new AppException(ErrorCode.EXCEPTION_NOT_FOUND);
        }
        auditLogService.log(
                userId,
                "DELETE_EXCEPTION",
                "SCHEDULE_EXCEPTION",
                scheduleId,
                Map.of("classId", classId, "date", String.valueOf(exceptionDate)),
                httpRequest);
    }

    private SessionExceptionResponse toExceptionResponse(ScheduleExceptionRow row) {
        return SessionExceptionResponse.builder()
                .id(row.id())
                .classId(row.classId())
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

    // ------------------------------------------------------------- TEACHING LOG

    /**
     * Ghi / sửa nhật ký dạy học (upsert theo (class, log_date, start_time), C-15').
     * Lần đầu lưu nội dung (firstPublish) → thông báo học sinh (link CLASS).
     * R-LOG: chặn khi ô đang có exception CANCELLED/RESCHEDULED.
     */
    @Transactional
    public TeachingLogResponse saveLog(Long classId, SaveTeachingLogRequest request, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);

        if (request.getEndTime() == null || request.getStartTime() == null
                || request.getEndTime().compareTo(request.getStartTime()) <= 0) {
            throw new AppException(ErrorCode.SESSION_INVALID_TIME);
        }
        String knowledge = ClassroomQueryRepository.trimToNull(request.getKnowledge());
        String homework = ClassroomQueryRepository.trimToNull(request.getHomework());
        if (knowledge == null && homework == null) {
            throw new AppException(ErrorCode.SESSION_LOG_EMPTY);
        }

        requireLogSlotWritable(classId, request.getLogDate(), request.getStartTime());

        LogUpsertResult upserted =
                classroomRepository.upsertTeachingLog(
                        classId,
                        request.getLogDate(),
                        request.getStartTime(),
                        request.getEndTime(),
                        knowledge,
                        homework);

        if (upserted.firstPublish()) {
            classroomRepository.insertLogFirstPublishNotification(state.studentId(), state.className(), request.getLogDate(), classId);
        }

        auditLogService.log(
                userId,
                upserted.firstPublish() ? "CREATE_LOG" : "UPDATE_LOG",
                "TEACHING_LOG",
                upserted.logId(),
                Map.of("classId", classId, "date", String.valueOf(request.getLogDate())),
                httpRequest);

        TeachingLogRow saved =
                classroomRepository
                        .findTeachingLog(classId, request.getLogDate(), request.getStartTime())
                        .orElseThrow();
        return toLogResponse(saved, upserted.firstPublish());
    }

    /** R-LOG: không ghi log ở ô có exception CANCELLED/RESCHEDULED (buổi không diễn ra đúng ca). */
    private void requireLogSlotWritable(Long classId, LocalDate date, LocalTime startTime) {
        var ex =
                classroomRepository
                        .findScheduleExceptionAt(classId, date, startTime)
                        .orElse(null);
        if (ex != null
                && (EXCEPTION_CANCELLED.equals(ex.exceptionType())
                        || EXCEPTION_RESCHEDULED.equals(ex.exceptionType()))) {
            throw new AppException(
                    ErrorCode.OCCURRENCE_HAS_SESSION,
                    "Ca này đang bị hủy/dời, không thể ghi nhật ký tại ca gốc.");
        }
    }

    /** Xóa 1 log (FOR UPDATE, guard qua lớp). */
    @Transactional
    public void deleteLog(Long classId, Long logId, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);

        int deleted = classroomRepository.deleteTeachingLog(classId, logId);
        if (deleted == 0) {
            throw new AppException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        auditLogService.log(userId, "DELETE_LOG", "TEACHING_LOG", logId, Map.of("classId", classId), httpRequest);
    }

    /** Đọc log của 1 ô ca (trống nếu chưa ghi) — cho modal "nhật ký" trên lưới. */
    @Transactional(readOnly = true)
    public TeachingLogResponse getLog(Long classId, LocalDate logDate, LocalTime startTime) {
        Long userId = currentUserId();
        ClassState state =
                classroomRepository
                        .findClassState(classId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwner(state, userId);
        TeachingLogRow row =
                classroomRepository.findTeachingLog(classId, logDate, startTime).orElse(null);
        return row != null ? toLogResponse(row, false) : null;
    }

    private TeachingLogResponse toLogResponse(TeachingLogRow row, boolean firstPublish) {
        boolean hasContent = row.knowledge() != null || row.homework() != null;
        return TeachingLogResponse.builder()
                .logId(row.id())
                .logDate(row.logDate())
                .startTime(row.startTime())
                .endTime(row.endTime())
                .knowledge(row.knowledge())
                .homework(row.homework())
                .hasContent(hasContent)
                .firstPublish(firstPublish)
                .updatedAt(row.updatedAt())
                .build();
    }

    // ------------------------------------------------------------- BÀI GIẢNG / TÀI LIỆU

    @Transactional(readOnly = true)
    public LessonDetailResponse getLesson(Long lessonId) {
        Long userId = currentUserId();
        // quyền đọc qua chuỗi lesson → class (TUTOR/STUDENT sở hữu) — load & guard trong service lesson.
        var detail =
                classroomRepository
                        .findLessonDetail(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwnerForLesson(detail, userId);
        List<LessonMaterialItem> materials =
                classroomRepository.findLessonMaterials(lessonId).stream().map(this::toMaterialItem).toList();
        return LessonDetailResponse.builder()
                .lessonId(detail.lessonId())
                .classId(detail.classId())
                .className(detail.className())
                .studentName(detail.studentName())
                .tutorName(detail.tutorName())
                .title(detail.title())
                .status(detail.status())
                .materials(materials)
                .quizCount(detail.quizCount())
                .createdAt(detail.createdAt())
                .updatedAt(detail.updatedAt())
                .build();
    }

    @Transactional
    public LessonMaterialItem uploadMaterial(Long lessonId, MultipartFile file, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        LessonDetailRow lesson =
                classroomRepository
                        .lockLesson(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwnerForLesson(lesson, userId);

        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.MATERIAL_NOT_FOUND);
        }
        if (file.getSize() > MATERIAL_MAX_BYTES) {
            throw new AppException(ErrorCode.MATERIAL_FILE_TOO_LARGE);
        }
        String fileType = resolveMaterialType(file);

        String fileUrl =
                storageService.uploadFile(
                        MATERIALS_FOLDER_PREFIX + "/" + lessonId, file, MATERIAL_MAX_BYTES);
        Long materialId =
                classroomRepository.insertLessonMaterial(
                        lessonId,
                        userId,
                        file.getOriginalFilename() != null ? file.getOriginalFilename() : "file",
                        fileUrl,
                        fileType,
                        file.getSize());

        auditLogService.log(
                userId,
                "UPLOAD_LESSON_MATERIAL",
                "LESSON_MATERIAL",
                materialId,
                Map.of(
                        "lessonId", lessonId,
                        "classId", lesson.classId(),
                        "fileName", file.getOriginalFilename(),
                        "fileType", fileType,
                        "fileSize", file.getSize()),
                httpRequest);

        return classroomRepository
                .findLessonMaterial(lessonId, materialId)
                .map(this::toMaterialItem)
                .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));
    }

    /** Gỡ tài liệu bài giảng (FR-12): xóa S3 object + dòng DB, audit. Material không thuộc bài → 404. */
    @Transactional
    public void deleteMaterial(Long lessonId, Long materialId, HttpServletRequest httpRequest) {
        Long userId = currentUserId();
        LessonDetailRow lesson =
                classroomRepository
                        .lockLesson(lessonId)
                        .orElseThrow(() -> new AppException(ErrorCode.CLASS_NOT_FOUND));
        requireClassOwnerForLesson(lesson, userId);

        LessonMaterialRow material =
                classroomRepository
                        .findLessonMaterial(lessonId, materialId)
                        .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));

        try {
            storageService.deleteFile(material.fileUrl());
        } catch (Exception e) {
            log.warn(
                    "Không thể xóa object S3 cho material {} (tiếp tục xóa dòng DB): {}",
                    materialId,
                    e.getMessage());
        }
        classroomRepository.deleteLessonMaterial(lessonId, materialId);

        auditLogService.log(
                userId,
                "DELETE_LESSON_MATERIAL",
                "LESSON_MATERIAL",
                materialId,
                Map.of(
                        "lessonId", material.lessonId(),
                        "classId", material.classId(),
                        "fileName", material.fileName()),
                httpRequest);
    }

    /**
     * Link tải an toàn (ký sẵn 10 phút) cho tài liệu bài giảng (FR-21).
     * TUTOR: phải là gia sư của lớp; STUDENT: phải là học sinh của lớp —
     * người khác / đã gỡ → 404.
     */
    @Transactional(readOnly = true)
    public MaterialAccessUrlResponse getMaterialAccessUrl(Long materialId) {
        Long userId = currentUserId();
        LessonMaterialRow material =
                classroomRepository
                        .findMaterialForAccess(materialId)
                        .orElseThrow(() -> new AppException(ErrorCode.MATERIAL_NOT_FOUND));
        requireMaterialAccess(material, userId);

        String url = storageService.presignedUrl(material.fileUrl(), MATERIAL_URL_TTL);
        return MaterialAccessUrlResponse.builder()
                .url(url)
                .previewable(
                        "PDF".equals(material.fileType())
                                || "IMAGE".equals(material.fileType())
                                || "AUDIO".equals(material.fileType()))
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

    private void requireClassOwnerForLesson(
            ClassroomQueryRepository.LessonDetailRow lesson, Long userId) {
        if (!userId.equals(lesson.tutorId()) && !userId.equals(lesson.studentId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
    }

    private void requireMaterialAccess(LessonMaterialRow material, Long userId) {
        User user = getCurrentUser();
        if (UserRole.TUTOR.name().equals(user.getRole())) {
            if (!user.getId().equals(material.tutorId())) {
                throw new AppException(ErrorCode.SESSION_NOT_OWNED);
            }
        } else if (UserRole.STUDENT.name().equals(user.getRole())) {
            if (!user.getId().equals(material.studentId())) {
                throw new AppException(ErrorCode.SESSION_NOT_OWNED);
            }
        }
    }

    private String resolveMaterialType(MultipartFile file) {
        String contentType = file.getContentType() != null ? file.getContentType() : "";
        if (contentType.startsWith("application/pdf")) {
            return "PDF";
        }
        if (contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
                || contentType.equals("application/msword")) {
            return "DOCX";
        }
        if (MATERIAL_IMAGE_TYPES.contains(contentType)) {
            return "IMAGE";
        }
        if (MATERIAL_AUDIO_TYPES.contains(contentType)) {
            return "AUDIO";
        }
        throw new AppException(ErrorCode.MATERIAL_FILE_TYPE_INVALID);
    }

    // ------------------------------------------------------------- HELPERS

    private void requireClassOwner(ClassState state, Long userId) {
        if (!userId.equals(state.tutorId()) && !userId.equals(state.studentId())) {
            throw new AppException(ErrorCode.CLASS_NOT_OWNED);
        }
    }

    private Long currentUserId() {
        return getCurrentUser().getId();
    }

    private User getCurrentUser() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        return userRepository
                .findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
    }
}