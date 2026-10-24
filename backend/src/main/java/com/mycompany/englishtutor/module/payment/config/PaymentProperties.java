package com.mycompany.englishtutor.module.payment.config;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import lombok.Getter;
import lombok.Setter;

/** Cấu hình phí nhận lớp: tỷ lệ mặc định, khoảng cho phép chỉnh và giới hạn tệp biên lai. */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.payment")
public class PaymentProperties {
    private BigDecimal defaultFeePercentage = BigDecimal.valueOf(40);
    private BigDecimal minFeePercentage = BigDecimal.ZERO;
    private BigDecimal maxFeePercentage = BigDecimal.valueOf(50);

    /** Dung lượng tối đa của biên lai (byte), mặc định 5 MB. */
    private long proofMaxBytes = 5L * 1024 * 1024;

    private List<String> proofAllowedTypes = List.of("image/jpeg", "image/png", "application/pdf");

    /** Thời hạn link xem biên lai (giây). */
    private long proofLinkTtlSeconds = 900;
}
