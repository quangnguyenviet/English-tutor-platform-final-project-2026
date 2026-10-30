package com.mycompany.englishtutor.module.classroom.api.response;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Link tải an toàn (ký sẵn, có hạn) cho một tài liệu buổi học (FR-21). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MaterialAccessUrlResponse {

    @Schema(description = "URL ký sẵn (hạn dùng ~10 phút)")
    String url;

    @Schema(description = "true = xem trực tiếp được (PDF, ảnh, âm thanh); false = chỉ tải về (DOCX)")
    Boolean previewable;
}
