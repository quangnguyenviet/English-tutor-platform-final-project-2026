package com.mycompany.englishtutor.module.quiz.ai.dto;

import java.util.List;

/**
 * Response POST /api/v1/ai/quiz/chat — nhận xét của AI + bộ câu hỏi mới
 * (QuizDraftSchema, AD-4). Wire snake_case.
 */
public record AiChatResult(String reply, List<AiDraftQuestion> questions) {

    public List<AiDraftQuestion> safeQuestions() {
        return questions == null ? List.of() : questions;
    }
}
