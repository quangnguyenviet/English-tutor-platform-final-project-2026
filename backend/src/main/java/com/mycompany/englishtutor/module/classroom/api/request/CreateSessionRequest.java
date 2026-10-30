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
 * Body tạo buổi học chính thức on-demand cho một lớp ACTIVE (nút "Tạo buổi học").
 * {@code startTime} bắt buộc chỉ khi ngày có nhiều ca trong lịch cố định
 * (mỗi ca có giờ bắt đầu khác nhau — kế hoạch mục 4.6).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateSessionRequest {

    @NotNull(message = "Ngày buổi học không được để trống")
    @Schema(description = "Ngày diễn ra buổi học (phải rơi vào ca trong lịch cố định)", example = "2026-11-10")
    LocalDate sessionDate;

    @Schema(description = "Giờ bắt đầu ca dạy (bắt buộc khi ngày có nhiều ca)", example = "19:30")
    LocalTime startTime;
}
