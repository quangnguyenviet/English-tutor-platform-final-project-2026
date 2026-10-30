package com.mycompany.englishtutor.module.classroom.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.ConflictInfo;
import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository.WeeklyConflictInfo;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Kiểm tra trùng ca dạy cá nhân của gia sư (UC-T08, luồng ngoại lệ 5a) và
 * trùng ca trong lịch cố định (UC-T09).
 *
 * <p>Hai ca trùng nhau khi cùng ngày và giao nhau thực sự về thời gian;
 * ca liền kề (kết thúc đúng lúc ca kia bắt đầu) không tính là trùng.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ScheduleConflictChecker {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter TIME_FMT = DateTimeFormatter.ofPattern("HH:mm");

    /** Nhãn thứ trong tuần theo quy ước 1 = Thứ 2 ... 7 = Chủ nhật. */
    private static final String[] DAY_LABELS = {
        "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"
    };

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

    // ------------------------------------------------------------ UC-T09

    /**
     * Ca tuần của lớp ACTIVE khác, cùng gia sư, trùng với ca đang kiểm tra
     * (cùng thứ, giao giờ, giao khoảng hiệu lực). Trừ lớp {@code excludeClassId}
     * (ca của chính lớp khi sửa lại lịch).
     */
    @Transactional(readOnly = true)
    public List<WeeklyConflictInfo> findWeeklyConflicts(
            Long tutorId,
            int dayOfWeek,
            LocalTime startTime,
            LocalTime endTime,
            LocalDate validFrom,
            LocalDate validTo,
            Long excludeClassId) {
        return classroomRepository.findWeeklyConflicts(
                tutorId, dayOfWeek, startTime, endTime, validFrom, validTo, excludeClassId);
    }

    /** Thông điệp cảnh báo trùng ca tuần (kèm lớp / học sinh / thứ / giờ / khoảng hiệu lực). */
    public static String describeWeeklyConflict(WeeklyConflictInfo conflict) {
        String target = conflict.className() != null && !conflict.className().isBlank()
                ? conflict.className() + " - " + conflict.studentName()
                : conflict.studentName();
        String validity = "hiệu lực từ " + fmtDate(conflict.validFrom())
                + (conflict.validTo() != null ? " đến " + fmtDate(conflict.validTo()) : "");
        return "Ca dạy " + dayLabel(conflict.dayOfWeek()) + " ("
                + conflict.startTime().format(TIME_FMT) + " - " + conflict.endTime().format(TIME_FMT)
                + ") bị trùng với ca của lớp \"" + target + "\" (" + validity + "). Vui lòng chọn khung giờ khác.";
    }

    /** Nhãn thứ (1 = Thứ 2 ... 7 = Chủ nhật). */
    public static String dayLabel(int dayOfWeek) {
        if (dayOfWeek < 1 || dayOfWeek > 7) {
            return "Thứ " + dayOfWeek;
        }
        return DAY_LABELS[dayOfWeek - 1];
    }

    private static String fmtDate(LocalDate date) {
        return date != null ? date.format(DATE_FMT) : "?";
    }
}
