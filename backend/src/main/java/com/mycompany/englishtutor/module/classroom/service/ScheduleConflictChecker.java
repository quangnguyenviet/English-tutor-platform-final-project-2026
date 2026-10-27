package com.mycompany.englishtutor.module.classroom.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Kiểm tra trùng ca dạy cá nhân của gia sư (UC-T08, luồng ngoại lệ 5a).
 *
 * <p>Hai ca trùng nhau khi cùng ngày và giao nhau thực sự về thời gian;
 * ca liền kề (kết thúc đúng lúc ca kia bắt đầu) không tính là trùng.
 * UC-T09 (chốt lịch cố định) sẽ tái sử dụng component này để kiểm tra
 * thêm bảng {@code class_schedules}.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScheduleConflictChecker {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    ClassroomQueryRepository classroomRepository;

    /** Các ca của gia sư trùng với khung giờ đang chọn; rỗng nếu không trùng. */
    @Transactional(readOnly = true)
    public List<ConflictInfo> findConflicts(
            Long tutorId,
            LocalDate sessionDate,
            LocalTime startTime,
            LocalTime endTime,
            Long excludeSessionId) {
        if (excludeSessionId == null) {
            return classroomRepository.findConflicts(tutorId, sessionDate, startTime, endTime);
        }
        return classroomRepository.findConflictsExcluding(
                tutorId, sessionDate, startTime, endTime, excludeSessionId);
    }

    /** Hai ca có trùng nhau không (cùng ngày và giao khoảng thời gian). */
    public static boolean overlaps(LocalDate sessionDate, LocalTime startTime, LocalTime endTime, ConflictInfo other) {
        return sessionDate.equals(other.sessionDate())
                && startTime.isBefore(other.endTime())
                && endTime.isAfter(other.startTime());
    }

    /** Thông điệp cảnh báo trùng ca gửi về frontend. */
    public static String describeConflict(ConflictInfo conflict) {
        String label = conflict.trial() ? " [Học thử]" : "";
        String target = conflict.className() != null && !conflict.className().isBlank()
                ? conflict.className() + " - " + conflict.studentName()
                : conflict.studentName();
        return "Khung giờ bạn chọn bị trùng với ca dạy" + label + " của lớp \"" + target + "\" vào ngày "
                + conflict.sessionDate().format(DATE_FMT) + " ("
                + conflict.startTime().format(TIME_FMT) + " - " + conflict.endTime().format(TIME_FMT)
                + "). Vui lòng chọn khung giờ khác.";
    }
}
