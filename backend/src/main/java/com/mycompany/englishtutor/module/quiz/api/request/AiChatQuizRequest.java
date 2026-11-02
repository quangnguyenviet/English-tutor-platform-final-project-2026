package com.mycompany.englishtutor.module.quiz.api.request;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
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
 * (chat stateless — hệ thống chưa lưu lịch sử, T8-B3);
 * {@code pendingQuestions} là trọn bộ câu hỏi đang hiển thị trên form gia sư
 * (câu form trước, câu AI đề xuất chưa gộp sau) — không có ở DB khi quiz chưa
 * lưu nên giao diện phải gửi kèm, LLM mới hiểu "câu số N". Không giới hạn số
 * câu (bỏ trần sản phẩm); chỉ guardrail độ dài mỗi trường để chặn input rác
 * phình prompt LLM.
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

    @Valid
    @Schema(
            description =
            "Trọn bộ câu hỏi hiện thấy trên form (form trước, câu AI đề xuất chưa gộp sau), "
            + "đánh số 1..N theo đúng thứ tự hiển thị. Không giới hạn số câu; mỗi trường có trần ký tự.")
    List<PendingQuestion> pendingQuestions;

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

    /**
     * Một câu đang hiển thị trên form — shape khớp {@link QuizQuestionRequest}
     * nhưng các trường không bắt buộc (gia sư đang nhập dở). Số thứ tự do
     * thứ tự trong danh sách đảm nhận, không nhận trường index.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @FieldDefaults(level = AccessLevel.PRIVATE)
    public static class PendingQuestion {

        @Size(max = 2000, message = "Nội dung câu hỏi tối đa 2000 ký tự")
        String questionText;

        @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
        String optionA;

        @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
        String optionB;

        @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
        String optionC;

        @Size(max = 500, message = "Lựa chọn tối đa 500 ký tự")
        String optionD;

        @Pattern(regexp = "^[ABCD]$", message = "Đáp án đúng phải là A, B, C hoặc D")
        String correctAnswer;

        @Size(max = 2000, message = "Giải thích tối đa 2000 ký tự")
        String explanation;

        @Pattern(regexp = "^(A1|A2|B1|B2|C1|C2)$", message = "Mức CEFR phải là A1, A2, B1, B2, C1 hoặc C2")
        String cefrLevel;

        @Size(max = 50, message = "Mã kỹ năng tối đa 50 ký tự")
        String skillCode;
    }
}
