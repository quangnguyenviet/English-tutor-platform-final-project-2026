package com.mycompany.englishtutor.module.classroom.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Trích yếu buổi học thật gắn với 1 ô lattice (mục 4.1 — source = SESSION). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionMini {

    @Schema(example = "8")
    Long sessionId;

    @Schema(description = "Đã có nhật ký (1 trong 2 nội dung không null)")
    Boolean hasLog;

    @Schema(description = "Tiêu đề buổi học")
    String title;
}
