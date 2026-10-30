package com.mycompany.englishtutor.module.classroom.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Kết quả đổi trạng thái buổi học (mục 4.7). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionStatusResponse {

    @Schema(example = "12")
    Long sessionId;

    @Schema(description = "Trạng thái mới", example = "CANCELLED")
    String status;
}
