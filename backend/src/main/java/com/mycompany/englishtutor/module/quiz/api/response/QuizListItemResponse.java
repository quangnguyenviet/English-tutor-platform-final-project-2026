package com.mycompany.englishtutor.module.quiz.api.response;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Quiz trong danh sách "Quiz buổi học" của chi tiết buổi học. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizListItemResponse {

    @Schema(example = "42")
    Long quizId;

    @Schema(example = "Quiz ôn tập Past Simple")
    String title;

    @Schema(description = "DRAFT | ASSIGNED | COMPLETED | EXPIRED", example = "DRAFT")
    String status;

    @Schema(description = "Thời hạn làm quiz (null khi chưa giao)", example = "2026-11-02T23:59:00+07:00")
    OffsetDateTime deadline;

    @Schema(example = "5")
    Integer totalQuestions;
}
