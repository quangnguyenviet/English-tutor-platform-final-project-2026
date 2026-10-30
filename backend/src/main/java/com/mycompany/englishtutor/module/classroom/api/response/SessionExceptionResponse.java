package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Ngoại lệ vừa ghi lên ô (mục 4.2 — response ghi đè / tạo mới). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionExceptionResponse {

    @Schema(example = "5")
    Long id;

    @Schema(example = "1")
    Long classId;

    @Schema(example = "3")
    Long scheduleId;

    @Schema(description = "Ngày của ô (lần diễn bị ảnh hưởng)", example = "2026-11-08")
    LocalDate exceptionDate;

    @Schema(description = "CANCELLED | RESCHEDULED | MODIFIED")
    String exceptionType;

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

    @Schema(description = "Lý do (tuỳ chọn)")
    String reason;

    @Schema(description = "Người ghi (id gia sư)")
    Long createdBy;

    @Schema(description = "Thời điểm tạo")
    OffsetDateTime createdAt;
}
