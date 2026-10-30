package com.mycompany.englishtutor.module.tutor.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Gia sư bật/tắt cờ "Đang mở nhận lớp" ({@code tutors.is_open_to_teaching}). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class OpenToTeachingRequest {

    @NotNull(message = "Vui lòng chọn bật hoặc tắt chế độ nhận lớp")
    @Schema(description = "true = đang mở nhận lớp mới, false = tạm ngưng nhận lớp mới", example = "true")
    Boolean open;
}
