package com.mycompany.englishtutor.module.classroom.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Body đổi trạng thái buổi học thật theo state machine (kế hoạch mục 4.7). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SetSessionStatusRequest {

    @NotBlank(message = "Trạng thái không được để trống")
    @Schema(description = "IN_PROGRESS | COMPLETED | ABSENT | CANCELLED", example = "IN_PROGRESS")
    String status;
}
