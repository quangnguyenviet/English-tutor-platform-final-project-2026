package com.mycompany.englishtutor.module.classroom.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Body tạo bài giảng mới cho 1 lớp (tab "Bài giảng", V16 — bài giảng không lên lịch). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateLessonRequest {

    @Size(max = 200, message = "Tiêu đề bài giảng tối đa 200 ký tự")
    @Schema(description = "Tiêu đề bài giảng (tùy chọn)", example = "Past Simple và Travel Vocabulary")
    String title;
}
