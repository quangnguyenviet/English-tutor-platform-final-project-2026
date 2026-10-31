package com.mycompany.englishtutor.module.quiz.api.request;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body giao bài (DRAFT → ASSIGNED): đặt thời hạn làm quiz. Service kiểm tra
 * deadline phải ở hiện tại hoặc tương lai ({@code QUIZ_DEADLINE_INVALID}).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AssignQuizRequest {

    @NotNull(message = "Thời hạn làm quiz không được để trống")
    @Schema(example = "2026-11-02T23:59:00+07:00")
    OffsetDateTime deadline;
}
