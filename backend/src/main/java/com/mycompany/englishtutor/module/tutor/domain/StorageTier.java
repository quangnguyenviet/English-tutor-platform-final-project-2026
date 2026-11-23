package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

/**
 * Catalog gói lưu trữ tài liệu buổi học (V30) — bảng {@code storage_tiers}.
 * Quota là DỮ LIỆU (quota_bytes) chứ không hardcode trong code: sửa gói/dung lượng
 * qua DB được, sẵn sàng thêm cột giá khi làm billing thật.
 * {@code is_paid} = gói trả phí (có thời hạn theo tháng); {@code is_default} = gói
 * mặc định (FREE) mà mọi gói trả phí tự hạ về khi hết hạn.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "storage_tiers")
public class StorageTier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    /** Mã gói (FREE/PRO/PREMIUM) — giá trị frontend truyền về, API contract giữ nguyên. */
    @Column(nullable = false, length = 10, unique = true)
    String code;

    /** Tên hiển thị ("Miễn phí", "Pro", "Premium"). */
    @Column(nullable = false, length = 50)
    String name;

    /** Dung lượng tối đa (bytes) của gói — quota thật. */
    @Column(name = "quota_bytes", nullable = false)
    Long quotaBytes;

    /** Gói mặc định của gia sư chưa mua (FREE). */
    @Column(name = "is_default", nullable = false)
    Boolean isDefault;

    /** Gói trả phí (có thời hạn theo tháng) hay không. */
    @Column(name = "is_paid", nullable = false)
    Boolean isPaid;
}
