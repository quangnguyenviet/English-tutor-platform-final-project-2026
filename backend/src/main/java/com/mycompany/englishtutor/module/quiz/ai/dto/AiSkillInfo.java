package com.mycompany.englishtutor.module.quiz.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Một dòng kỹ năng gửi cho AI Service (wire snake_case, AD-2: không PII).
 * Dùng chung cho {@code skill_profile} (thống kê SKP: có errorRate/lastPracticedAt)
 * và {@code skill_catalog} (chỉ code + name, các field thống kê để null).
 * {@code @JsonInclude(NON_NULL)} loại các trường trống khỏi JSON (khớp Pydantic phía AI).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record AiSkillInfo(
        @JsonProperty("skill_code") String skillCode,
        @JsonProperty("skill_name") String skillName,
        @JsonProperty("category") String category,
        @JsonProperty("error_rate") Double errorRate,
        @JsonProperty("last_practiced_at") String lastPracticedAt) {

    public static AiSkillInfo catalog(String skillCode, String skillName, String category) {
        return new AiSkillInfo(skillCode, skillName, category, null, null);
    }
}
