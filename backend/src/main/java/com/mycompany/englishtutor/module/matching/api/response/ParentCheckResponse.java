package com.mycompany.englishtutor.module.matching.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
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
public class ParentCheckResponse {

    @Schema(description = "SĐT đã thuộc về một phụ huynh trong hệ thống")
    boolean exists;

    @Schema(description = "Họ tên đang nhập khớp với phụ huynh đã có. True khi SĐT chưa tồn tại")
    boolean nameMatches;

    @Schema(description = "Họ tên phụ huynh đã lưu, null khi SĐT chưa tồn tại")
    String parentName;
}
