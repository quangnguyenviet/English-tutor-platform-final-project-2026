package com.mycompany.englishtutor.module.payment.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentMethod;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;

import lombok.*;
import lombok.experimental.FieldDefaults;

/** Khoản phí nhận lớp, dùng cho cả danh sách và chi tiết ({@code proofUrl} chỉ có ở chi tiết). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaymentResponse {
    Long id;
    Long classId;
    String className;
    String teachingMode;
    LocalDate activeFrom;
    Long tutorId;
    String tutorName;
    String tutorPhone;
    String studentName;
    String parentName;

    /** Ẩn với gia sư cho tới khi phí được xác nhận. */
    String parentPhone;

    PayerType payerType;
    BigDecimal feePercentage;
    BigDecimal pricePerSession;
    Long slotsPerWeek;
    BigDecimal amount;
    PaymentMethod paymentMethod;
    String proofUrl;
    BigDecimal receivedAmount;
    PaymentStatus status;
    String rejectReason;
    Long uploadedBy;
    OffsetDateTime uploadedAt;
    Long reviewedBy;
    OffsetDateTime reviewedAt;
    OffsetDateTime createdAt;

    /** Phí đã {@code APPROVED} thì gia sư được xem thông tin liên hệ phụ huynh. */
    boolean contactUnlocked;
}
