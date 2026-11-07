package com.mycompany.englishtutor.module.matching.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class ParentCheckRequest {

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84|84)(3|5|7|8|9)\\d{8}$", message = "Vui lòng nhập đúng số điện thoại.")
    @Schema(description = "Số điện thoại phụ huynh", example = "0984453212")
    String phone;

    @NotBlank(message = "Họ tên phụ huynh không được để trống")
    @Schema(description = "Họ tên phụ huynh đang nhập", example = "Phạm Công Minh")
    String parentName;
}
