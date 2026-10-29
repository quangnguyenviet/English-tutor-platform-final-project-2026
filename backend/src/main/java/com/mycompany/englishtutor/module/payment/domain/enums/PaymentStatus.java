package com.mycompany.englishtutor.module.payment.domain.enums;

/**
 * Máy trạng thái phí nhận lớp (kế hoạch fixed_schedule mục 10):
 * NEW (bản nháp khi ghép lớp TRIAL, amount = NULL) → NOT_SUBMITTED (kích hoạt lớp) →
 * SUBMITTED → APPROVED / RESUBMIT_REQUIRED; NEW → CANCELLED (hủy TRIAL).
 */
public enum PaymentStatus {
    NEW,
    NOT_SUBMITTED,
    SUBMITTED,
    APPROVED,
    RESUBMIT_REQUIRED,
    CANCELLED
}
