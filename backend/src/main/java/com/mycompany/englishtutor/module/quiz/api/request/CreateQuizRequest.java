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
 * Body tạo mới quiz bản nháp (DRAFT) cho một buổi học: gia sư nhập thủ công
 * danh sách câu hỏi trắc nghiệm A–D (API_DESIGN §3.7, FR-13). Số thứ tự câu
 * do server gán theo thứ tự danh sách.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateQuizRequest {

    @NotBlank(message = "Tiêu đề quiz không được để trống")
    @Size(max = 200, message = "Tiêu đề quiz tối đa 200 ký tự")
    @Schema(example = "Quiz ôn tập Past Simple")
    String title;

    @NotEmpty(message = "Quiz phải có ít nhất một câu hỏi")
    @Valid
    @Schema(description = "Danh sách câu hỏi (thứ tự = số thứ tự câu)")
    List<QuizQuestionRequest> questions;
}
