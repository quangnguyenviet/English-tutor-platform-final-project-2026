package com.mycompany.englishtutor.module.quiz.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Câu hỏi do AI đề xuất, đã map về shape form quiz của giao diện (khớp
 * {@link QuizQuestionResponse} nhưng không có số thứ tự — do giao diện chèn
 * vào danh sách câu hiện có). {@code skillCode} = mã kỹ năng, null nếu câu
 * chưa gắn. {@code cefrLevel} = độ khó CEFR (A1..C2).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiDraftQuestionResponse {

    @Schema(example = "She ___ to school every day.")
    String questionText;

    @Schema(example = "go")
    String optionA;

    @Schema(example = "goes")
    String optionB;

    @Schema(example = "going")
    String optionC;

    @Schema(example = "gone")
    String optionD;

    @Schema(description = "Đáp án đúng (A | B | C | D)", example = "B")
    String correctAnswer;

    @Schema(description = "Giải thích đáp án (tiếng Việt)")
    String explanation;

    @Schema(description = "Mức CEFR (A1..C2)", example = "B1")
    String cefrLevel;

    @Schema(description = "Mã kỹ năng (null nếu chưa gắn)", example = "narrative_tense")
    String skillCode;
}
