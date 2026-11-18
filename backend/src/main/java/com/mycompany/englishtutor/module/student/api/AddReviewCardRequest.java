package com.mycompany.englishtutor.module.student.api;

import jakarta.validation.constraints.NotNull;

/**
 * Thêm thủ công một câu hỏi vào danh sách ôn tập. Học sinh bắt buộc phải đã
 * trả lời câu đó (để hệ thống có thể snapshot nội dung và bảo vệ quyền truy cập).
 * {@code deckId} trống = deck mặc định của học sinh.
 */
public record AddReviewCardRequest(
        @NotNull(message = "Vui lòng chọn câu hỏi muốn thêm")
        Long quizId,
        @NotNull(message = "Vui lòng chọn câu hỏi muốn thêm")
        Long questionId,
        Long deckId) {}
