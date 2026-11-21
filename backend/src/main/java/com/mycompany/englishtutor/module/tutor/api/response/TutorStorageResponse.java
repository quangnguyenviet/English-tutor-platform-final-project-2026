package com.mycompany.englishtutor.module.tutor.api.response;

import java.time.OffsetDateTime;

/**
 * Widget dashboard gia sư (V29): trạng thái gói lưu trữ tài liệu buổi học.
 * {@code quotaBytes} / {@code effectiveQuotaBytes} / {@code usedBytes} là số liệu thật từ DB.
 */
public record TutorStorageResponse(
        String tier,
        OffsetDateTime tierExpiresAt,
        long quotaBytes,
        long effectiveQuotaBytes,
        long usedBytes) {
}
