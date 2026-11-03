package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.OffsetDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Chi tiết 1 bài giảng (V16) — cùng chủ sở hữu với lớp. Không có ngày/giờ;
 * hiển thị tên lớp/học sinh, tiêu đề, trạng thái hiện/ẩn, danh sách tài liệu
 * đính kèm và số quiz.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LessonDetailResponse {

    @Schema(example = "12")
    Long lessonId;

    @Schema(example = "1")
    Long classId;

    @Schema(example = "Tiếng Anh lớp 8")
    String className;

    @Schema(example = "Nguyễn Văn A")
    String studentName;

    @Schema(example = "Trần Văn B")
    String tutorName;

    @Schema(example = "Past Simple và Travel Vocabulary")
    String title;

    @Schema(description = "PUBLISHED (hiện) | HIDDEN (ẩn)")
    String status;

    @Schema(description = "Tài liệu đính kèm (trống nếu chưa có)")
    List<LessonMaterialItem> materials;

    @Schema(description = "Số quiz gắn với bài giảng")
    Integer quizCount;

    @Schema(example = "2026-10-06T19:00:00Z")
    OffsetDateTime createdAt;

    @Schema(example = "2026-10-06T19:00:00Z")
    OffsetDateTime updatedAt;
}
