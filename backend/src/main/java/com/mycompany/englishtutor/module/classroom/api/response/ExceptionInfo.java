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

/** Thông tin override của ngoại lệ (mục 4.1 — source = EXCEPTION). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ExceptionInfo {

    @Schema(description = "CANCELLED | RESCHEDULED | MODIFIED")
    String type;

    @Schema(description = "Ngày mới (RESCHEDULED)")
    LocalDate newDate;

    @Schema(description = "Giờ bắt đầu mới (RESCHEDULED)")
    LocalTime newStartTime;

    @Schema(description = "Giờ kết thúc mới (RESCHEDULED)")
    LocalTime newEndTime;

    @Schema(description = "Hình thức override (RESCHEDULED / MODIFIED)")
    String newTeachingMode;

    @Schema(description = "Liên kết phòng học (hình thức ONLINE)")
    String newMeetingUrl;

    @Schema(description = "Địa chỉ (hình thức AT_HOME)")
    String newLocation;
}
