package com.mycompany.englishtutor.module.quiz.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một câu hỏi trắc nghiệm (A–D) do gia sư nhập thủ công. Số thứ tự câu
 * ({@code question_number}) do server gán theo thứ tự trong danh sách, nên
 * không nhận trường này từ client. {@code skillCode} null = câu không gắn kỹ
 * năng (FK {@code quiz_questions.skill_id} SET NULL).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizQuestionRequest {

    @NotBlank(message = "Nội dung câu hỏi không được để trống")
    @Schema(example = "She ___ to Da Nang last summer.")
    String questionText;

    @NotBlank(message = "Lựa chọn A không được để trống")
    @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
    @Schema(example = "go")
    String optionA;

    @NotBlank(message = "Lựa chọn B không được để trống")
    @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
    @Schema(example = "goes")
    String optionB;

    @NotBlank(message = "Lựa chọn C không được để trống")
    @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
    @Schema(example = "went")
    String optionC;

    @NotBlank(message = "Lựa chọn D không được để trống")
    @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
    @Schema(example = "gone")
    String optionD;

    @NotBlank(message = "Đáp án đúng phải là một trong A, B, C, D")
    @Pattern(regexp = "^[ABCD]$", message = "Đáp án đúng phải là A, B, C hoặc D")
    @Schema(description = "Đáp án đúng (A | B | C | D)", example = "C")
    String correctAnswer;

    @Schema(description = "Giải thích đáp án (tuỳ chọn)", example = "Last summer là dấu hiệu quá khứ đơn")
    String explanation;

    @Pattern(regexp = "^(A1|A2|B1|B2|C1|C2)$", message = "Mức CEFR phải là A1, A2, B1, B2, C1 hoặc C2")
    @Schema(description = "Mức CEFR (A1..C2), tuỳ chọn", example = "A2")
    String cefrLevel;

    @Size(max = 50, message = "Mã kỹ năng tối đa 50 ký tự")
    @Schema(description = "Mã kỹ năng gắn cho câu (tuỳ chọn, phải tồn tại trong hệ thống)", example = "past_simple")
    String skillCode;
}
