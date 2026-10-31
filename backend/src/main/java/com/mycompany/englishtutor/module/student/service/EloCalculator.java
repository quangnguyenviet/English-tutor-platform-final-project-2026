package com.mycompany.englishtutor.module.student.service;

import java.util.Map;

/**
 * Công thức Elo cho quiz (API_DESIGN §3.7):
 * {@code E = 1 / (1 + 10^((Rq − Rs) / 400))}, {@code Rs' = Rs + K × (S − E)}, K = 32.
 * Độ khó câu hỏi {@code Rq} quy từ CEFR; Elo học sinh không xuống dưới 0.
 */
public final class EloCalculator {

    public static final int K_FACTOR = 32;

    /** Câu không gắn CEFR được coi như A2 (mức khởi điểm 1000 của học sinh). */
    public static final int DEFAULT_QUESTION_RATING = 1000;

    private static final Map<String, Integer> CEFR_RATING =
            Map.of("A1", 800, "A2", 1000, "B1", 1200, "B2", 1400, "C1", 1600, "C2", 1800);

    private EloCalculator() {}

    public static int questionRating(String cefrLevel) {
        if (cefrLevel == null) return DEFAULT_QUESTION_RATING;
        return CEFR_RATING.getOrDefault(cefrLevel.trim().toUpperCase(), DEFAULT_QUESTION_RATING);
    }

    /** Elo mới của học sinh sau một câu; trả về (before, after, change). */
    public static Result apply(int studentElo, String cefrLevel, boolean correct) {
        double expected = 1.0 / (1.0 + Math.pow(10, (questionRating(cefrLevel) - studentElo) / 400.0));
        int change = (int) Math.round(K_FACTOR * ((correct ? 1.0 : 0.0) - expected));
        int after = Math.max(0, studentElo + change);
        return new Result(studentElo, after, after - studentElo);
    }

    public record Result(int before, int after, int change) {}
}
