package com.mycompany.englishtutor.module.payment.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

class FeeCalculatorTest {

    private static BigDecimal pct(String value) {
        return new BigDecimal(value);
    }

    @Test
    void feeAt40PercentFor2SlotsAnd200kPerSession_is640k() {
        BigDecimal amount = FeeCalculator.calculate(pct("40"), 2, BigDecimal.valueOf(200_000));

        assertThat(amount).isEqualByComparingTo("640000");
    }

    @Test
    void feeAt35Percent_usesGivenRate() {
        // 0.35 × 2 × 4 × 200000 = 560000
        BigDecimal amount = FeeCalculator.calculate(pct("35"), 2, BigDecimal.valueOf(200_000));

        assertThat(amount).isEqualByComparingTo("560000");
    }

    @Test
    void feeIsRoundedToNearestThousand() {
        // 0.375 × 3 × 4 × 155000 = 697500 -> 698000
        BigDecimal amount = FeeCalculator.calculate(pct("37.5"), 3, BigDecimal.valueOf(155_000));

        assertThat(amount).isEqualByComparingTo("698000");
    }

    @Test
    void zeroPercentGivesZeroAmount() {
        BigDecimal amount = FeeCalculator.calculate(pct("0"), 2, BigDecimal.valueOf(200_000));

        assertThat(amount).isEqualByComparingTo("0");
    }
}
