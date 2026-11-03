package com.mycompany.englishtutor.module.classroom.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Body sửa bài giảng (tab "Bài giảng", V16): đổi tiêu đề và/hoặc ẩn/hiện. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateLessonRequest {

    @Size(max = 200, message = "Tiêu đề bài giảng tối đa 200 ký tự")
    @Schema(description = "Tiêu đề mới (null = giữ nguyên)", example = "Bài 5: Listening")
    String title;

    @Schema(description = "Trạng thái hiển thị: PUBLISHED (hiện) hoặc HIDDEN (ẩn)", example = "HIDDEN")
    String status;
}
