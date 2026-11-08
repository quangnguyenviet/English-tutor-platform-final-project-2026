package com.mycompany.englishtutor.module.student.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ReviewAnswerRequest(
        @NotBlank(message = "Vui lòng chọn đáp án")
        @Pattern(regexp = "^[A-Da-d]$", message = "Đáp án phải là A, B, C hoặc D")
        String selectedAnswer) {}

