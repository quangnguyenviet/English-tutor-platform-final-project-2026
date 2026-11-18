package com.mycompany.englishtutor.module.student.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Tạo mới một bộ thẻ ôn tập (deck) của học sinh; tối đa 50 bộ, không trùng tên. */
public record CreateReviewDeckRequest(
        @NotBlank(message = "Vui lòng đặt tên cho bộ thẻ ôn tập")
        @Size(max = 60, message = "Tên bộ thẻ ôn tập tối đa 60 ký tự")
        String name) {}
