package com.mycompany.englishtutor.module.classroom.api.request;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body chốt / cập nhật lịch dạy cố định của một lớp ACTIVE (UC-T09).
 * Mỗi ca có khoảng hiệu lực riêng: {@code validFrom} bắt buộc (từ hôm nay),
 * {@code validTo} tùy chọn (NULL = ca áp dụng cho tới khi sửa lịch).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FinalizeScheduleRequest {

    @NotEmpty(message = "Vui lòng chọn ít nhất một ca dạy trong tuần")
    @Size(max = 7, message = "Tối đa 7 ca dạy trong một tuần")
    @Valid
    @Schema(description = "Danh sách ca dạy cố định trong tuần")
    List<ScheduleSlot> schedules;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class ScheduleSlot {

        @NotNull(message = "Thứ trong tuần không được để trống")
        @Min(value = 1, message = "Thứ trong tuần phải nằm trong khoảng 1 (Thứ 2) đến 7 (Chủ nhật)")
        @Max(value = 7, message = "Thứ trong tuần phải nằm trong khoảng 1 (Thứ 2) đến 7 (Chủ nhật)")
        @Schema(description = "Thứ trong tuần: 1 = Thứ 2 ... 7 = Chủ nhật", example = "3")
        Integer dayOfWeek;

        @NotNull(message = "Giờ bắt đầu không được để trống")
        @Schema(description = "Giờ bắt đầu ca dạy", example = "19:30")
        LocalTime startTime;

        @NotNull(message = "Giờ kết thúc không được để trống")
        @Schema(description = "Giờ kết thúc ca dạy", example = "21:00")
        LocalTime endTime;

        @NotNull(message = "Ngày bắt đầu hiệu lực không được để trống")
        @Schema(description = "Ngày bắt đầu hiệu lực của ca (từ hôm nay)", example = "2026-11-03")
        LocalDate validFrom;

        @Schema(description = "Ngày kết thúc hiệu lực của ca (trống = không giới hạn)", example = "2026-12-15")
        LocalDate validTo;
    }
}
