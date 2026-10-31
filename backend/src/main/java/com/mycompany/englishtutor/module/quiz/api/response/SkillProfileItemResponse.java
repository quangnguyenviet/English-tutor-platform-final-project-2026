package com.mycompany.englishtutor.module.quiz.api.response;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một dòng "Bảng thống kê hồ sơ học sinh" (FR-13, UC-T06 bước 2) — thống
 * kê theo kỹ năng, default sắp theo tỷ lệ sai giảm rồi thời gian chưa ôn
 * (xử lý phía client để cho đổi tiêu chí). Không có dữ liệu trả lời quiz
 * thì danh sách rỗng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SkillProfileItemResponse {

    @Schema(example = "narrative_tense")
    String skillCode;

    @Schema(example = "Kể chuyện quá khứ / Narrative Tense")
    String skillName;

    @Schema(description = "Nhóm: GRAMMAR | VOCABULARY | ...", example = "SPEAKING")
    String category;

    @Schema(description = "Số lần trả lời đúng")
    Integer totalCorrect;

    @Schema(description = "Số lần trả lời sai")
    Integer totalIncorrect;

    @Schema(description = "Tổng số lần thử")
    Integer totalAttempts;

    @Schema(description = "Tỷ lệ sai (0..1), null nếu chưa có dữ liệu", example = "0.42")
    Double errorRate;

    @Schema(description = "Lần ôn tập gần nhất (null nếu chưa ôn)", example = "2026-09-10T00:00:00Z")
    OffsetDateTime lastPracticedAt;
}
