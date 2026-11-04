package com.mycompany.englishtutor.module.quiz.api.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Kết quả 1 lượt hội thoại với trợ lý AI: nhận xét của AI ({@code reply}) +
 * bộ câu hỏi mới / đã sửa ({@code draftQuestions}), sẵn để gia sư gộp vào
 * form (FR-13, UC-T06 bước 4-5). {@code draftQuestions} rỗng khi lượt chỉ
 * trao đổi, chưa sinh câu mới.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiChatQuizResponse {

    @Schema(example = "Đã soạn 5 câu về thì quá khứ đơn, cấp độ B1.")
    String reply;

    @Schema(description = "Câu hỏi do AI đề xuất (mappable trực tiếp vào form quiz)")
    List<AiDraftQuestionResponse> draftQuestions;
}
