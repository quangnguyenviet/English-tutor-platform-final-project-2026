package com.mycompany.englishtutor.module.payment.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentMethod;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "payments")
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "class_id", nullable = false)
    Long classId;

    @Enumerated(EnumType.STRING)
    @Column(name = "payer_type", nullable = false, length = 20)
    PayerType payerType;

    @Column(name = "fee_percentage", precision = 5, scale = 2)
    BigDecimal feePercentage;

    @Column(nullable = false, precision = 12, scale = 0)
    BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method", length = 20)
    PaymentMethod paymentMethod;

    @Column(name = "proof_url", length = 500)
    String proofUrl;

    @Column(name = "received_amount", precision = 12, scale = 0)
    BigDecimal receivedAmount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    PaymentStatus status;

    @Column(name = "reject_reason", columnDefinition = "TEXT")
    String rejectReason;

    @Column(name = "uploaded_by")
    Long uploadedBy;

    @Column(name = "uploaded_at")
    OffsetDateTime uploadedAt;

    @Column(name = "reviewed_by")
    Long reviewedBy;

    @Column(name = "reviewed_at")
    OffsetDateTime reviewedAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    OffsetDateTime updatedAt;
}
