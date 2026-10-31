package com.mycompany.englishtutor.module.quiz.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Một câu hỏi trắc nghiệm trong chi tiết quiz (gia sư view, có kèm đáp án đúng). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class QuizQuestionResponse {

    @Schema(example = "1")
    Integer questionNumber;

    @Schema(example = "She ___ to Da Nang last summer.")
    String questionText;

    @Schema(example = "go")
    String optionA;

    @Schema(example = "goes")
    String optionB;

    @Schema(example = "went")
    String optionC;

    @Schema(example = "gone")
    String optionD;

    @Schema(description = "Đáp án đúng", example = "C")
    String correctAnswer;

    @Schema(description = "Giải thích (tuỳ chọn)")
    String explanation;

    @Schema(description = "Mức CEFR (tuỳ chọn)", example = "A2")
    String cefrLevel;

    @Schema(description = "Mã kỹ năng (null nếu câu không gắn kỹ năng)", example = "past_simple")
    String skillCode;
}
