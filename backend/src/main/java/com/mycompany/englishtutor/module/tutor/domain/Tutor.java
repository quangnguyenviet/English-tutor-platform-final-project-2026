package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import org.hibernate.annotations.ColumnDefault;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutors")
public class Tutor {
    @Id
    Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id")
    com.mycompany.englishtutor.module.user.domain.User user;

    @Column(length = 500)
    String address;

    @Column(length = 100)
    String hometown;

    @Column(length = 200)
    String university;

    @Column(name = "education_status", length = 30)
    String educationStatus; // 'STUDENT', 'GRADUATED', 'LECTURER'

    @Column(name = "experience_years")
    Short experienceYears;

    @Column(columnDefinition = "TEXT")
    String bio;

    @Column(name = "video_url", length = 500)
    String videoUrl;

    @Column(name = "profile_status", nullable = false, length = 20)
    String profileStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    @Column(name = "reviewed_by")
    Long reviewedBy;

    @Column(name = "reviewed_at")
    java.time.OffsetDateTime reviewedAt;

    /**
     * Thời điểm gia sư gửi hồ sơ để duyệt lần gần nhất.
     * Khác với {@code updatedAt} (không tự cập nhật do khai báo
     * {@code insertable=false, updatable=false}), cột này được set chủ động
     * mỗi lần chuyển trạng thái sang {@code PENDING}.
     */
    @Column(name = "submitted_at")
    java.time.OffsetDateTime submittedAt;

    /**
     * Cờ "Đang mở nhận lớp" (V10): gia sư tự bật/tắt. Tắt thì không thấy lớp đang tuyển và không
     * ứng tuyển được, lớp đang dạy không bị ảnh hưởng. Tách biệt với {@code profileStatus}.
     */
    @Builder.Default
    @Column(name = "is_open_to_teaching", nullable = false)
    Boolean openToTeaching = Boolean.TRUE;

    /**
     * Gói lưu trữ tài liệu buổi học hiện hành (V30) — FK {@code storage_tiers.id} (catalog,
     * FREE seed id=1, default cho mọi tutor mới). Quota thật nằm ở
     * {@code StorageTier.quotaBytes} (dữ liệu DB, không hardcode trong code).
     * Gói trả phí (is_paid) có thời hạn theo tháng qua {@link #storageTierExpiresAt};
     * hết hạn → tự hạ về gói mặc định (FREE) tại thời điểm upload/widget kế tiếp.
     */
    @Builder.Default
    @Column(name = "storage_tier_id", nullable = false)
    Long storageTierId = 1L;

    /**
     * Thời điểm gói trả phí hết hạn (V30); NULL = gói vô thời hạn (FREE).
     */
    @Column(name = "storage_tier_expires_at")
    java.time.OffsetDateTime storageTierExpiresAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    @ColumnDefault("NOW()")
    java.time.OffsetDateTime updatedAt;

    public boolean isOpenToTeaching() {
        return !Boolean.FALSE.equals(openToTeaching);
    }
}
