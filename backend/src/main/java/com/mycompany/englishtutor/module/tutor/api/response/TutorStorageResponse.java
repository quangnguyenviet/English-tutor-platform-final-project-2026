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

    /**
     * Quota hiệu lực tại thời điểm NOW (gói trả phí hết hạn tự hạ về FREE) — dùng để
     * frontend vẽ thanh tiến độ đúng với điều mà upload thực sự bị chặn.
     */
    public static TutorStorageResponse of(
            String tier, OffsetDateTime expiresAt, long effectiveQuotaBytes, long usedBytes) {
        return new TutorStorageResponse(
                tier, expiresAt,
                com.mycompany.englishtutor.module.tutor.domain.enums.StorageTier.valueOf(tier).quotaBytes(),
                effectiveQuotaBytes, usedBytes);
    }
}
