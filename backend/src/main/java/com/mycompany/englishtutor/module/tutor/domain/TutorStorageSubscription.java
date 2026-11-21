package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Lịch sử thuê bao gói lưu trữ tài liệu buổi học (V29). Mỗi dòng là 1 lần lễ tân cấp/gia hạn
 * gói cho gia sư — ghi nhận sự kiện để truy vết (mua/gia hạn, ai cấp, thời hạn đến đâu).
 * {@code tier_id} là FK trỏ bảng catalog {@code storage_tiers} (gói + quota); gói HIỆN HÀNH
 * của tutor nằm ở {@link Tutor#getStorageTierId()}, bảng này là hồ sơ các lần cấp.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor_storage_subscriptions")
public class TutorStorageSubscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    /** Gói đã cấp — FK trỏ catalog {@code storage_tiers} (id, code, quota_bytes). */
    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "tier_id", nullable = false)
    StorageTier tier;

    /** Chu kỳ đã mua (số tháng: 1/3/12); NULL nếu không rõ (ví dụ cấp FREE). */
    @Column(name = "duration_months")
    Short durationMonths;

    /** Thời điểm được cấp. */
    @Column(name = "granted_at", nullable = false)
    java.time.OffsetDateTime grantedAt;

    /** Hạn của lần cấp này (granted_at + duration_months); NULL = vô thời hạn (FREE). */
    @Column(name = "expires_at")
    java.time.OffsetDateTime expiresAt;

    /** Người (lễ tân/quản trị) đã cấp; NULL nếu hệ thống cấp. */
    @Column(name = "granted_by")
    Long grantedBy;
}
