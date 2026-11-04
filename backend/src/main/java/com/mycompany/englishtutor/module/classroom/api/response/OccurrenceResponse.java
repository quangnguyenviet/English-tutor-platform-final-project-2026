package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một ô (lần diễn) trong lattice tuần (V16). Mỗi ca cố định (class_schedules)
 * x từng ngày trong khoảng hiệu lực = 1 ô; nhật ký dạy học (teaching_logs) và
 * ngoại lệ (schedule_exceptions) là hai overlay trên ô đó. Ca thử của lớp
 * (classes.trial_*) là ô độc lập có {@code source = TRIAL}, {@code scheduleId}
 * null và {@code trial = true}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OccurrenceResponse {

    @Schema(description = "scheduleId_date (hoặc trial_date cho ca thử) — key ổn định cho FE", example = "3_2026-11-06")
    String occurrenceKey;

    @Schema(example = "3")
    Long scheduleId;

    @Schema(description = "Ngày diễn ra ô", example = "2026-11-06")
    LocalDate date;

    @Schema(description = "1 = Thứ 2 ... 7 = Chủ nhật", example = "5")
    Integer dayOfWeek;

    @Schema(description = "Nguồn dữ liệu của ô: OCCURRENCE | EXCEPTION | TRIAL")
    String source;

    @Schema(description = "Giờ ca (đích khi exception RESCHEDULED) theo ca gốc", example = "19:30")
    LocalTime startTime;

    @Schema(example = "21:00")
    LocalTime endTime;

    @Schema(description = "Ô ca thử (lấy từ classes.trial_*), chỉ khi source = TRIAL")
    Boolean trial;

    @Schema(description = "Hình thức ca thử (ONLINE | AT_HOME), chỉ khi source = TRIAL")
    String teachingMode;

    @Schema(description = "Liên kết phòng học ca thử, chỉ khi source = TRIAL và ONLINE")
    String meetingUrl;

    @Schema(description = "Địa chỉ ca thử, chỉ khi source = TRIAL và AT_HOME")
    String location;

    @Schema(description = "Nhật ký dạy học khớp ô (teaching_logs); null nếu chưa ghi")
    TeachingLogMini log;

    @Schema(description = "Chỉ có khi source = EXCEPTION")
    ExceptionInfo exception;
}
