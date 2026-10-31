package com.mycompany.englishtutor.module.quiz.api.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body cho trợ lý AI soạn/sửa quiz (FR-13, UC-T06). {@code message} là yêu
 * cầu của gia sư; {@code quizId} (tuỳ chọn) = đang sửa quiz DRAFT nào;
 * {@code recentMessages} là các tin hội thoại gần nhất do frontend gửi kèm
 * (chat stateless — hệ thống chưa lưu lịch sử, T8-B3).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AiChatQuizRequest {

    @Size(min = 1, max = 1000, message = "Nội dung yêu cầu tối đa 1000 ký tự")
    @Schema(example = "Tạo 5 câu tập trung vào các thì quá khứ, độ khó B1")
    String message;

    @Schema(description = "ID quiz DRAFT đang sửa (null nếu soạn mới)", example = "42")
    Long quizId;

    @Size(max = 10, message = "Gửi tối đa 10 tin hội thoại gần nhất")
    @Schema(description = "Tin hội thoại gần nhất (mỗi tin: role user|assistant + content)")
    List<ChatMessage> recentMessages;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessage {
        @Schema(description = "Vai trò: user (gia sư) hoặc assistant (AI)", example = "user")
        String role;

        @Schema(example = "Nâng câu 3 lên B2")
        String content;
    }
}
