package com.mycompany.englishtutor.module.student.api;

import jakarta.validation.constraints.NotNull;

/** Cấu hình ôn tập của học sinh: bật/tắt tự động thêm câu sai vào danh sách ôn. */
public record ReviewSettingsRequest(
        @NotNull(message = "Vui lòng chọn trạng thái tự động thêm câu sai vào ôn tập")
        Boolean autoReviewWrong) {}
