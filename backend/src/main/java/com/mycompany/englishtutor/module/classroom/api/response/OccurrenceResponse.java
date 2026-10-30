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
 * Một ô (lần diễn) trong lattice tuần (mục 4.1). Ưu tiên render:
 * SESSION &gt; EXCEPTION &gt; OCCURRENCE — đúng 1 trong {@code session} /
 * {@code exception} khác null tùy {@code source}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OccurrenceResponse {

    @Schema(description = "scheduleId_date — key ổn định cho FE (vd 3_2026-11-06)", example = "3_2026-11-06")
    String occurrenceKey;

    @Schema(example = "3")
    Long scheduleId;

    @Schema(description = "Ngày diễn ra ô", example = "2026-11-06")
    LocalDate date;

    @Schema(description = "1 = Thứ 2 ... 7 = Chủ nhật", example = "5")
    Integer dayOfWeek;

    @Schema(description = "Nguồn dữ liệu của ô: SESSION | EXCEPTION | OCCURRENCE")
    String source;

    @Schema(description = "Giờ ca (đích khi exception RESCHEDULED) theo ca gốc", example = "19:30")
    LocalTime startTime;

    @Schema(example = "21:00")
    LocalTime endTime;

    @Schema(description = "Chỉ có khi source = SESSION")
    SessionMini session;

    @Schema(description = "Chỉ có khi source = EXCEPTION")
    ExceptionInfo exception;
}
