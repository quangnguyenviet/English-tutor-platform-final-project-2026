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

/** 1 dòng nhật ký dạy học (teaching_logs, V16) — khớp ô ca trên lưới lịch. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeachingLogResponse {

    @Schema(example = "40")
    Long logId;

    @Schema(example = "2026-11-08")
    LocalDate logDate;

    @Schema(example = "19:00")
    LocalTime startTime;

    @Schema(example = "20:30")
    LocalTime endTime;

    @Schema(description = "Nội dung kiến thức chính (null nếu chưa ghi)")
    String knowledge;

    @Schema(description = "Bài tập về nhà / dặn dò (null nếu chưa ghi)")
    String homework;

    @Schema(description = "Đã có nội dung (1 trong 2 không null)")
    Boolean hasContent;

    @Schema(description = "true nếu đây là lần đầu lưu nội dung (đã thông báo học sinh)")
    Boolean firstPublish;

    @Schema(example = "2026-11-08T20:45:00Z")
    OffsetDateTime updatedAt;
}
