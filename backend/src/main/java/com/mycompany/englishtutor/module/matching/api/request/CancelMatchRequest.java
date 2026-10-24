package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CancelMatchRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Schema(description = "Lý do hủy đơn ghép lớp", example = "Gia sư bận lịch học buổi tối, phụ huynh muốn đổi gia sư khác")
    String reason;
}
