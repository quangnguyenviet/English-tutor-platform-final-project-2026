package com.mycompany.englishtutor.module.quiz.ai.dto;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Câu hỏi theo QuizDraftSchema (AD-4) — wire object dùng chung giữa Backend
 * và AI Service cho cả input (draft hiện tại) lẫn output (câu AI đề xuất).
 *
 * <p>Serialisation: JSON snake_case (khớp Pydantic phía AI) qua @JsonProperty;
 * các trường có thể vắng (skill, explanation) để null — @JsonInclude NON_NULL.
 *
 * <p>{@code index} (chỉ có nghĩa ở output): số thứ tự 1-based của câu trong
 * "bản nháp hiện tại" mà câu trả về này THAY thế — cho phép giao diện thay
 * in-place khi gia sư yêu cầu "sửa câu số k". {@code null} = câu mới (cộng
 * thêm). Ở input (current_draft) backend luôn để null (vị trí do thứ tự mảng).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiDraftQuestion(
        @JsonProperty("content") String content,
        @JsonProperty("options") Map<String, String> options,
        @JsonProperty("correct") String correct,
        @JsonProperty("explanation") String explanation,
        @JsonProperty("cefr") String cefr,
        @JsonProperty("skill") String skill,
        @JsonProperty("index") Integer index) {}
