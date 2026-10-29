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

/** Buổi học chính thức tạo on-demand (kế hoạch mục 4.6). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OnDemandSessionResponse {

    @Schema(example = "42")
    Long sessionId;

    @Schema(example = "2026-11-10")
    LocalDate sessionDate;

    @Schema(example = "19:30")
    LocalTime startTime;

    @Schema(example = "21:00")
    LocalTime endTime;

    @Schema(description = "Trạng thái buổi học (mới tạo luôn là SCHEDULED)")
    String status;

    @Schema(description = "Luôn false với buổi chính thức")
    Boolean isTrial;

    @Schema(description = "true nếu vừa tạo mới, false nếu buổi học đã tồn tại (idempotent)")
    Boolean createdNow;
}
