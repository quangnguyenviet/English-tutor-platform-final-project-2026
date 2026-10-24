package com.mycompany.englishtutor.module.payment.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Công thức phí nhận lớp: tỷ lệ × số ca mỗi tuần × 4 tuần × học phí mỗi buổi, làm tròn đến nghìn đồng. */
public final class FeeCalculator {
    private static final BigDecimal WEEKS_PER_MONTH = BigDecimal.valueOf(4);
    private static final BigDecimal ONE_HUNDRED = BigDecimal.valueOf(100);
    private static final BigDecimal THOUSAND = BigDecimal.valueOf(1000);

    private FeeCalculator() {}

    public static BigDecimal calculate(BigDecimal feePercentage, long slotsPerWeek, BigDecimal pricePerSession) {
        BigDecimal raw = pricePerSession
                .multiply(BigDecimal.valueOf(slotsPerWeek))
                .multiply(WEEKS_PER_MONTH)
                .multiply(feePercentage)
                .divide(ONE_HUNDRED);
        return raw.divide(THOUSAND, 0, RoundingMode.HALF_UP).multiply(THOUSAND);
    }
}
