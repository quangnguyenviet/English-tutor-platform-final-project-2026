package com.mycompany.englishtutor.module.classroom.api.request;

import java.time.LocalDate;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body ghi / sửa nhật ký dạy học (teaching_logs, V16). Upsert theo
 * (class_id, log_date, start_time); R-LOG chặn khi ô đang có exception
 * CANCELLED/RESCHEDULED. Ít nhất 1 nội dung (knowledge/homework).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SaveTeachingLogRequest {

    @NotNull(message = "Ngày ca không được để trống")
    @Schema(description = "Ngày diễn ra ca (khớp ô trên lưới lịch)", example = "2026-11-08")
    LocalDate logDate;

    @NotNull(message = "Giờ bắt đầu ca không được để trống")
    @Schema(description = "Giờ bắt đầu ca (khớp ca cố định)", example = "19:00")
    LocalTime startTime;

    @NotNull(message = "Giờ kết thúc ca không được để trống")
    @Schema(description = "Giờ kết thúc ca (sau giờ bắt đầu)", example = "20:30")
    LocalTime endTime;

    @Schema(description = "Kiến thức chính buổi học (null/empty = xóa trắng)")
    String knowledge;

    @Schema(description = "Bài tập / dặn dò (null/empty = xóa trắng)")
    String homework;
}
