package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một bài giảng trong tab "Bài giảng" (V16). Không có ngày/giờ — bài giảng là
 * "driver" nhúng vào lớp, chỉ quan hệ với classes. {@code lessonNumber} =
 * ROW_NUMBER theo created_at (liên tục, ổn định).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonListItem {

    @Schema(example = "12")
    Long lessonId;

    @Schema(description = "Số thứ tự bài giảng trong lớp (liên tục theo thời gian tạo)", example = "3")
    Integer lessonNumber;

    @Schema(example = "Past Simple và Travel Vocabulary")
    String title;

    @Schema(description = "PUBLISHED (hiện) | HIDDEN (ẩn)", example = "PUBLISHED")
    String status;

    @Schema(example = "2026-10-06T19:00:00Z")
    OffsetDateTime createdAt;

    @Schema(description = "Số tài liệu đính kèm bài giảng")
    Integer materialCount;

    @Schema(description = "Số quiz gắn với bài giảng")
    Integer quizCount;
}
