package com.mycompany.englishtutor.module.complaint.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

/** Yêu cầu hoàn tiền sinh từ khiếu nại {@code REFUND}; Kế toán chi tiền hoặc từ chối. */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "refunds")
public class Refund {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "complaint_id", nullable = false)
    Long complaintId;

    @Column(name = "payment_id", nullable = false)
    Long paymentId;

    @Column(name = "requested_amount", nullable = false, precision = 12, scale = 0)
    BigDecimal requestedAmount;

    @Column(name = "approved_amount", precision = 12, scale = 0)
    BigDecimal approvedAmount;

    @Column(name = "recipient_name", nullable = false, length = 100)
    String recipientName;

    @Column(name = "bank_name", nullable = false, length = 100)
    String bankName;

    @Column(name = "bank_account_number", nullable = false, length = 30)
    String bankAccountNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    RefundStatus status;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    String rejectReason;

    @Column(name = "proof_url", length = 500)
    String proofUrl;

    @Column(name = "requested_by", nullable = false)
    Long requestedBy;

    @Column(name = "processed_by")
    Long processedBy;

    @Column(name = "processed_at")
    OffsetDateTime processedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
