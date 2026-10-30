package com.mycompany.englishtutor.module.classroom.api.request;

import java.time.LocalDate;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body ghi ngoại lệ (overlay) cho 1 ô ảo — lần diễn cụ thể của ca cố định
 * (kế hoạch class-sessions mục 4.2). Các trường {@code new_*} dùng theo loại:
 * RESCHEDULED bắt buộc {@code newDate} + giờ; MODIFIED tùy chọn; CANCELLED bỏ qua.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateExceptionRequest {

    @NotNull(message = "Ca lịch cố định không được để trống")
    @Schema(description = "id của ca (class_schedules) mà ô ảo thuộc về", example = "3")
    Long scheduleId;

    @NotNull(message = "Ngày của lần diễn không được để trống")
    @Schema(description = "Ngày cụ thể của lần diễn (phải nằm trong khoảng hiệu lực của ca)",
            example = "2026-11-08")
    LocalDate exceptionDate;

    @NotNull(message = "Loại ngoại lệ không được để trống")
    @Schema(description = "Loại ngoại lệ: CANCELLED | RESCHEDULED | MODIFIED", example = "RESCHEDULED")
    String exceptionType;

    @Schema(description = "Ngày mới (RESCHEDULED, bắt buộc)", example = "2026-11-09")
    LocalDate newDate;

    @Schema(description = "Giờ bắt đầu mới (RESCHEDULED)", example = "20:00")
    LocalTime newStartTime;

    @Schema(description = "Giờ kết thúc mới (RESCHEDULED)", example = "21:30")
    LocalTime newEndTime;

    @Schema(description = "Hình thức học override (ONLINE | AT_HOME)", example = "ONLINE")
    String newTeachingMode;

    @Size(max = 500, message = "Liên kết phòng học tối đa 500 ký tự")
    @Schema(description = "Liên kết phòng học (bắt buộc khi hình thức là ONLINE)")
    String newMeetingUrl;

    @Size(max = 500, message = "Địa chỉ học tối đa 500 ký tự")
    @Schema(description = "Địa chỉ (bắt buộc khi hình thức là AT_HOME)")
    String newLocation;

    @Schema(description = "Lý do (tuỳ chọn, hiện rõ nhất với CANCELLED)")
    String reason;
}
