package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Lễ tân/Admin hủy lớp cần gia sư kèm lý do (UC-REC-04, UC-ADM-03).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CancelClassRequest {

    @NotBlank(message = "Lý do hủy không được để trống")
    @Schema(description = "Lý do hủy lớp cần gia sư", example = "Phụ huynh không còn nhu cầu tìm gia sư")
    String reason;
}
