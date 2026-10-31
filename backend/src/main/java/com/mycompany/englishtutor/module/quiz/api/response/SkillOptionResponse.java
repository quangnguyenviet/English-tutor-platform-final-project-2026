package com.mycompany.englishtutor.module.quiz.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Một mục kỹ năng trong catalog chung (đổ vào ô chọn kỹ năng khi soạn quiz). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillOptionResponse {

    @Schema(example = "past_simple")
    String skillCode;

    @Schema(example = "Thì quá khứ đơn / Past Simple")
    String skillName;

    @Schema(description = "GRAMMAR | VOCABULARY | ...", example = "GRAMMAR")
    String category;
}
