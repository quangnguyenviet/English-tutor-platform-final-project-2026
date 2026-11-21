package com.mycompany.englishtutor.module.tutor.domain.enums;

import java.time.OffsetDateTime;

/**
 * Gói lưu trữ tài liệu buổi học theo thuê bao gia sư (V29). Quota là quy tắc sản phẩm cố định,
 * giữ trong enum (không phải application.yaml) để có 1 nguồn type-service dùng chung cho
 * validation admin, check upload và widget dashboard.
 */
public enum StorageTier {
    /** 1 GB — gói mặc định, vô thời hạn (expires_at = null). */
    FREE(1L * 1024 * 1024 * 1024),
    /** 10 GB. */
    PRO(10L * 1024 * 1024 * 1024),
    /** 50 GB. */
    PREMIUM(50L * 1024 * 1024 * 1024);

    private final long quotaBytes;

    StorageTier(long quotaBytes) {
        this.quotaBytes = quotaBytes;
    }

    public long quotaBytes() {
        return quotaBytes;
    }

    /**
     * Gói hiệu lực tại thời điểm {@code now}: gói trả phí (PRO/PREMIUM) mà
     * {@code expiresAt} đã qua (hoặc hiện tại không còn hạn) thì bị hạ về {@link #FREE}.
     * {@code expiresAt == null} coi là vô thời hạn (chỉ hợp lệ với FREE trong thực tế).
     */
    public static StorageTier effective(String tierName, OffsetDateTime expiresAt, OffsetDateTime now) {
        StorageTier tier = valueOf(tierName);
        if (tier == FREE) {
            return FREE;
        }
        if (expiresAt == null || now.isBefore(expiresAt)) {
            return tier;
        }
        return FREE;
    }
}
