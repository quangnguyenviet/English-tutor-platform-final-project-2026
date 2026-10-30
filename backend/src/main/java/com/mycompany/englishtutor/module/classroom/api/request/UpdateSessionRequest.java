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
 * Body sửa / dời lịch buổi học thật (kế hoạch mục 4.6). Chỉ trạng thái
 * SCHEDULED được sửa; ngày/giờ có thể rơi ngoài ca cố định (ad-hoc).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSessionRequest {

    @Size(max = 200, message = "Tiêu đề buổi học tối đa 200 ký tự")
    @Schema(description = "Tiêu đề (null = giữ nguyên)")
    String title;

    @NotNull(message = "Ngày buổi học không được để trống")
    @Schema(description = "Ngày diễn ra (>= hôm nay)", example = "2026-11-14")
    LocalDate sessionDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    @Schema(description = "Giờ bắt đầu", example = "19:30")
    LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    @Schema(description = "Giờ kết thúc (sau giờ bắt đầu)", example = "21:00")
    LocalTime endTime;

    @NotNull(message = "Hình thức học không được để trống")
    @Schema(description = "Hình thức: ONLINE hoặc AT_HOME", example = "ONLINE")
    String teachingMode;

    @Size(max = 500, message = "Liên kết phòng học tối đa 500 ký tự")
    @Schema(description = "Liên kết phòng học (bắt buộc khi ONLINE)")
    String meetingUrl;

    @Size(max = 500, message = "Địa chỉ học tối đa 500 ký tự")
    @Schema(description = "Địa chỉ (bắt buộc khi AT_HOME)")
    String location;
}
