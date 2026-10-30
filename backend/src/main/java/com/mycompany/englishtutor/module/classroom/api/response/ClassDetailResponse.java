package com.mycompany.englishtutor.module.classroom.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Chi tiết lớp học của gia sư, gồm buổi dạy thử (nếu đã thiết lập). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassDetailResponse {
    Long classId;
    String className;
    String status;
    String teachingMode;
    BigDecimal pricePerSession;
    LocalDate activeFrom;
    OffsetDateTime createdAt;
    String studentName;
    String school;
    String grade;
    String learningGoal;
    TrialSessionResponse trialSession;

    /** Ca dạy cố định trong tuần (rỗng nếu chưa chốt lịch). */
    List<ScheduleInfo> schedules;

    /** Lớp đã có lịch dạy cố định chưa (để FE quyết định banner "Thiết lập lịch"). */
    boolean hasSchedules;

    /** Các ngày đã có buổi học chính thức (is_trial = FALSE) — FE render nút "Mở buổi học". */
    List<LocalDate> sessionDates;

    /** Ca của hôm nay theo lịch cố định (FE dùng đánh dấu "hôm nay" trên lưới tuần). */
    List<ScheduleSlot> todaySlots;

    /** Ca của một thứ trong tuần (không kèm khoảng hiệu lực, chỉ khung giờ cho hôm nay). */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ScheduleSlot {
        Integer dayOfWeek;
        LocalTime startTime;
        LocalTime endTime;
    }
}
