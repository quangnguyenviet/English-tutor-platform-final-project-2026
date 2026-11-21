package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Lịch sử thuê bao gói lưu trữ tài liệu buổi học (V29). Mỗi dòng là 1 lần lễ tân gán/gia hạn
 * gói trả phí cho gia sư — ghi nhận sự kiện để truy vết (mua/gia hạn, ai cấp, thời hạn đến đâu).
 * Gói HIỆN HÀNH nằm ở {@link Tutor#getStorageTier()} + {@link Tutor#getStorageTierExpiresAt()};
 * bảng này là hồ sơ các lần cấp, không dùng để tính quota.
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

    /** Gói đã cấp (FREE/PRO/PREMIUM) tại thời điểm này. */
    @Column(nullable = false, length = 10)
    String tier;

    /** Chu kỳ đã mua (số tháng: 1/3/12). */
    @Column(name = "duration_months", nullable = false)
    Short durationMonths;

    /** Thời điểm được cấp. */
    @Column(name = "granted_at", nullable = false)
    java.time.OffsetDateTime grantedAt;

    /** Hạn của lần cấp này (granted_at + duration_months). */
    @Column(name = "expires_at", nullable = false)
    java.time.OffsetDateTime expiresAt;

    /** Người (lễ tân/quản trị) đã cấp; NULL nếu hệ thống cấp. */
    @Column(name = "granted_by")
    Long grantedBy;
}
