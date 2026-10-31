package com.mycompany.englishtutor.module.student.service;

import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.student.config.EloProperties;

import lombok.RequiredArgsConstructor;

/**
 * Công thức Elo cho quiz (API_DESIGN §3.7):
 * {@code E = 1 / (1 + 10^((Rq − Rs) / 400))}, {@code Rs' = Rs + K × (S − E)}.
 * Độ khó câu hỏi {@code Rq} quy từ CEFR; Elo học sinh không xuống dưới 0. Hằng số lấy từ {@link EloProperties}.
 */
@Component
@RequiredArgsConstructor
public class EloCalculator {

    private final EloProperties properties;

    public int questionRating(String cefrLevel) {
        if (cefrLevel == null) return properties.getDefaultQuestionRating();
        return properties.getCefrRatings().getOrDefault(cefrLevel.trim().toUpperCase(), properties.getDefaultQuestionRating());
    }

    /** Elo mới của học sinh sau một câu; trả về (before, after, change). */
    public Result apply(int studentElo, String cefrLevel, boolean correct) {
        double expected = 1.0 / (1.0 + Math.pow(10, (questionRating(cefrLevel) - studentElo) / 400.0));
        int change = (int) Math.round(properties.getK() * ((correct ? 1.0 : 0.0) - expected));
        int after = Math.max(0, studentElo + change);
        return new Result(studentElo, after, after - studentElo);
    }

    public record Result(int before, int after, int change) {}
}
