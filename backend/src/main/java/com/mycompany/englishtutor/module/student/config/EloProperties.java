package com.mycompany.englishtutor.module.student.config;

import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/** Hằng số Elo của quiz (API_DESIGN §3.7): hệ số K, Elo khởi điểm và độ khó câu hỏi theo CEFR. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.elo")
public class EloProperties {

    /** Hệ số K trong công thức cập nhật Elo. */
    private int k = 32;

    /** Elo khởi điểm của học sinh mới. */
    private int initialElo = 1000;

    /** Câu không gắn CEFR được coi như A2 (mức khởi điểm của học sinh). */
    private int defaultQuestionRating = 1000;

    private Map<String, Integer> cefrRatings =
            Map.of("A1", 800, "A2", 1000, "B1", 1200, "B2", 1400, "C1", 1600, "C2", 1800);
}
