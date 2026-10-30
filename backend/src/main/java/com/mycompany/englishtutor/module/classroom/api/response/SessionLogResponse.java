package com.mycompany.englishtutor.module.classroom.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Kết quả lưu nhật ký buổi học (mục 4.8). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionLogResponse {

    @Schema(example = "12")
    Long sessionId;

    @Schema(description = "true nếu đây là lần đầu lưu nhật ký (đã thông báo học sinh)")
    Boolean firstPublish;
}
