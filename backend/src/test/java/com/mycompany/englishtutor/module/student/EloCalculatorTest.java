package com.mycompany.englishtutor.module.student;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.student.config.EloProperties;
import com.mycompany.englishtutor.module.student.service.EloCalculator;

class EloCalculatorTest {

    private final EloCalculator calc = new EloCalculator(new EloProperties());

    @Test
    void equalRatingCorrectGainsHalfK() {
        // Rs = Rq → E = 0.5, đúng: +16, sai: −16
        assertEquals(16, calc.apply(1000, "A2", true).change());
        assertEquals(-16, calc.apply(1000, "A2", false).change());
    }

    @Test
    void harderQuestionGivesMoreForCorrectAnswer() {
        int easy = calc.apply(1000, "A1", true).change();
        int hard = calc.apply(1000, "B2", true).change();
        assertTrue(hard > easy);
    }

    @Test
    void changeIsConsistentWithBeforeAndAfter() {
        var result = calc.apply(1000, "B1", false);
        assertEquals(1000, result.before());
        assertEquals(result.after() - result.before(), result.change());
        assertTrue(result.after() >= 0);
    }

    @Test
    void cefrMapping() {
        assertEquals(800, calc.questionRating("a1"));
        assertEquals(1800, calc.questionRating("C2"));
        assertEquals(1000, calc.questionRating(null));
    }
}
