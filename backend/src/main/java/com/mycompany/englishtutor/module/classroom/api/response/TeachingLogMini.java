package com.mycompany.englishtutor.module.classroom.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Trích yếu nhật ký dạy học trên ô lattice (V16) — chấm "đã có log". */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TeachingLogMini {

    @Schema(example = "40")
    Long logId;

    @Schema(description = "Đã có nội dung (1 trong 2 không null)")
    Boolean hasContent;

    @Schema(description = "Nội dung kiến thức (trích 1 dòng trên chip, null nếu chưa ghi)")
    String knowledge;

    @Schema(description = "Bài tập / dặn dò (trích 1 dòng trên chip, null nếu chưa ghi)")
    String homework;
}
