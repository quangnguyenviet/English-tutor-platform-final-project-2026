package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một tài liệu đính kèm buổi học (bảng {@code session_materials}). Dùng cả trong
 * chi tiết buổi học (mục 4.5 mở rộng) và phản hồi upload/gỡ.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionMaterialItem {

    @Schema(example = "40")
    Long materialId;

    @Schema(example = "bai-tap-buoi-3.pdf")
    String fileName;

    @Schema(description = "PDF | DOCX | IMAGE | AUDIO")
    String fileType;

    @Schema(description = "Dung lượng (bytes)")
    Long fileSize;

    @Schema(description = "Người tải lên")
    String uploadedByName;

    @Schema(example = "2026-11-06T19:00:00Z")
    OffsetDateTime createdAt;
}
