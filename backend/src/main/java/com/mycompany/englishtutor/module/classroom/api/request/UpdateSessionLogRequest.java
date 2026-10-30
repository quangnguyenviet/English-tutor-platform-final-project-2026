package com.mycompany.englishtutor.module.classroom.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body lưu nhật ký buổi học (kế hoạch mục 4.8). Ít nhất 1 nội dung không rỗng;
 * "xóa trắng" 1 phần = gửi chuỗi rỗng/null cho phần đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateSessionLogRequest {

    @Schema(description = "Nội dung kiến thức chính buổi học (null/empty = xóa trắng)")
    String logKnowledge;

    @Schema(description = "Bài tập về nhà / chuẩn bị (null/empty = xóa trắng)")
    String logHomework;
}
