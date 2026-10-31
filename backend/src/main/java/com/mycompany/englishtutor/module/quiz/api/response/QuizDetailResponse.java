package com.mycompany.englishtutor.module.quiz.api.response;

import java.time.OffsetDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Chi tiết quiz (gia sư, sở hữu buổi học): dùng để mở lại bản nháp và sửa. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizDetailResponse {

    @Schema(example = "42")
    Long quizId;

    @Schema(example = "Quiz ôn tập Past Simple")
    String title;

    @Schema(description = "DRAFT | ASSIGNED | COMPLETED | EXPIRED", example = "DRAFT")
    String status;

    @Schema(description = "Thời hạn (null khi chưa giao)", example = "2026-11-02T23:59:00+07:00")
    OffsetDateTime deadline;

    @Schema(description = "Chi tiết buổi học quiz gắn với")
    Long sessionId;

    @Schema(description = "Toàn bộ câu hỏi (chỉ có ý nghĩa với DRAFT/ASSIGNED của gia sư)")
    List<QuizQuestionResponse> questions;
}
