package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Lễ tân/Admin chọn gia sư từ danh sách ứng tuyển (UC-REC-03, UC-ADM-02).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SelectTutorRequest {

    @NotNull(message = "Vui lòng chọn đơn ứng tuyển của gia sư")
    @Schema(description = "ID đơn ứng tuyển được chọn", example = "5")
    Long applicationId;
}
