package com.mycompany.englishtutor.module.classroom.api.request;

import java.time.LocalDate;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Body thiết lập / chỉnh sửa lịch dạy thử của một lớp đang ở trạng thái TRIAL (UC-T08). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpsertTrialSessionRequest {

    @NotNull(message = "Ngày dạy thử không được để trống")
    @Schema(description = "Ngày diễn ra buổi học thử", example = "2026-10-28")
    LocalDate sessionDate;

    @NotNull(message = "Giờ bắt đầu không được để trống")
    @Schema(description = "Giờ bắt đầu buổi học thử", example = "19:30")
    LocalTime startTime;

    @NotNull(message = "Giờ kết thúc không được để trống")
    @Schema(description = "Giờ kết thúc buổi học thử", example = "21:00")
    LocalTime endTime;

    @NotBlank(message = "Hình thức học không được để trống")
    @Schema(description = "Hình thức buổi học thử: ONLINE hoặc AT_HOME", example = "ONLINE")
    String teachingMode;

    @Size(max = 500, message = "Liên kết phòng học tối đa 500 ký tự")
    @Schema(description = "Liên kết phòng học Zoom/Meet (bắt buộc khi ONLINE)")
    String meetingUrl;

    @Size(max = 500, message = "Địa chỉ học tối đa 500 ký tự")
    @Schema(description = "Địa chỉ nhà học sinh (bắt buộc khi AT_HOME)")
    String location;
}
