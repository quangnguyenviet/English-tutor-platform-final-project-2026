package com.mycompany.englishtutor.module.student.api;

import jakarta.validation.constraints.NotNull;

public record ReviewRateRequest(
        @NotNull(message = "Thiếu mã lượt ôn tập") Long reviewAttemptId,
        @NotNull(message = "Vui lòng chọn mức độ ghi nhớ") ReviewRating rating) {}
