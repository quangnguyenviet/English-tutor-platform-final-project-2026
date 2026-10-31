package com.mycompany.englishtutor.module.quiz.ai.dto;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Body POST /api/v1/ai/quiz/chat — wire format snake_case (khớp Pydantic
 * phía AI Service). AD-2: chỉ dữ liệu ẩn danh, không PII.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiChatPayload(
        @JsonProperty("student_code") String studentCode,
        @JsonProperty("grade") String grade,
        @JsonProperty("learning_goal") String learningGoal,
        @JsonProperty("skill_profile") List<AiSkillInfo> skillProfile,
        @JsonProperty("skill_catalog") List<AiSkillInfo> skillCatalog,
        @JsonProperty("current_draft") List<AiDraftQuestion> currentDraft,
        @JsonProperty("recent_messages") List<AiRecentMessage> recentMessages,
        @JsonProperty("message") String message,
        @JsonProperty("cefr_hint") String cefrHint) {

    public static AiChatPayload of(
            String studentCode,
            String grade,
            String learningGoal,
            List<AiSkillInfo> skillProfile,
            List<AiSkillInfo> skillCatalog,
            List<AiDraftQuestion> currentDraft,
            List<AiRecentMessage> recentMessages,
            String message,
            String cefrHint) {
        return new AiChatPayload(
                studentCode,
                grade,
                learningGoal,
                skillProfile == null ? List.of() : skillProfile,
                skillCatalog == null ? List.of() : skillCatalog,
                currentDraft,
                recentMessages == null ? List.of() : recentMessages,
                message,
                cefrHint);
    }
}
