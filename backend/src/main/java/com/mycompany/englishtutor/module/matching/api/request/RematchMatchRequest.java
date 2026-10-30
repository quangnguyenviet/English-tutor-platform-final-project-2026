package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Ghép lại đơn khi dạy thử không thành công (UC-REC-06.1 nhánh 5.2, UC-PA-05). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RematchMatchRequest {

    @NotBlank(message = "Lý do ghép lại không được để trống")
    @Size(max = 1000, message = "Lý do ghép lại tối đa 1000 ký tự")
    @Schema(description = "Lý do dạy thử không thành công", example = "Học sinh chưa hợp phương pháp dạy, phụ huynh muốn tìm gia sư khác")
    String reason;
}
