package com.mycompany.englishtutor.module.tutor.api.response;

import java.time.OffsetDateTime;

/**
 * Sự kiện thuê bao gói lưu trữ (V29) — 1 dòng = 1 lần lễ tân cấp/gia hạn gói trả phí
 * (bảng {@code tutor_storage_subscriptions}). Dùng cho danh sách lịch sử phía admin.
 */
public record StorageSubscriptionItem(
        Long id,
        String tier,
        Integer durationMonths,
        OffsetDateTime grantedAt,
        OffsetDateTime expiresAt,
        Long grantedBy) {
}
