package com.mycompany.englishtutor.module.tutor.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mycompany.englishtutor.module.tutor.domain.StorageTier;

/**
 * Catalog gói lưu trữ (V30) — bảng {@code storage_tiers}. Quota (quota_bytes) là dữ liệu
 * DB, không hardcode: mọi caller (quota gate, widget, admin) đọc qua đây.
 */
public interface StorageTierRepository extends JpaRepository<StorageTier, Long> {

    /** Tra gói theo mã (FREE/PRO/PREMIUM) — API contract giữ nguyên string code. */
    Optional<StorageTier> findByCode(String code);

    /** Gói mặc định (FREE) — dùng khi gói trả phí hết hạn / tutor chưa mua. */
    Optional<StorageTier> findByIsDefaultTrue();
}
