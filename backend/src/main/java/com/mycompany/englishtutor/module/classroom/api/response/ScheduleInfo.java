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

/** Một ca dạy cố định trong tuần (class_schedules), kèm khoảng hiệu lực. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ScheduleInfo {

    @Schema(description = "Thứ trong tuần: 1 = Thứ 2 ... 7 = Chủ nhật", example = "3")
    Integer dayOfWeek;

    @Schema(example = "19:30")
    LocalTime startTime;

    @Schema(example = "21:00")
    LocalTime endTime;

    @Schema(description = "Ngày bắt đầu hiệu lực của ca", example = "2026-11-03")
    LocalDate validFrom;

    @Schema(description = "Ngày kết thúc hiệu lực của ca (null = không giới hạn)", example = "2026-12-15")
    LocalDate validTo;
}
