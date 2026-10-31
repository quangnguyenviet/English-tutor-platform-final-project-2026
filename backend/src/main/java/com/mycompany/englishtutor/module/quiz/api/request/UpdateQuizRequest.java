package com.mycompany.englishtutor.module.quiz.api.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body cập nhật quiz bản nháp (DRAFT): thay tiêu đề và ghi đè TOÀN BỘ danh
 * sách câu hỏi (không có cập nhật từng câu riêng).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateQuizRequest {

    @NotBlank(message = "Tiêu đề quiz không được để trống")
    @Size(max = 200, message = "Tiêu đề quiz tối đa 200 ký tự")
    @Schema(example = "Quiz ôn tập Past Simple (bản chỉnh sửa)")
    String title;

    @NotEmpty(message = "Quiz phải có ít nhất một câu hỏi")
    @Valid
    @Schema(description = "Toàn bộ câu hỏi mới thay thế danh sách hiện tại")
    List<QuizQuestionRequest> questions;
}
