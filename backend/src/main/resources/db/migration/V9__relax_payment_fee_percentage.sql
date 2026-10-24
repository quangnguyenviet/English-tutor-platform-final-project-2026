-- =============================================================================
-- V9: Mo rong khoang ty le phi nhan lop (T7-C2)
--
-- Mac dinh 40%, Le tan / Admin co the chinh trong khoang 0-50%. Khoan phi 0%
-- co so tien 0 nen chk_payments_amount doi tu "> 0" thanh ">= 0".
-- =============================================================================
ALTER TABLE payments DROP CONSTRAINT chk_payments_fee_percentage;
ALTER TABLE payments ADD CONSTRAINT chk_payments_fee_percentage CHECK (
    fee_percentage IS NULL OR fee_percentage BETWEEN 0 AND 50
);

ALTER TABLE payments DROP CONSTRAINT chk_payments_amount;
ALTER TABLE payments ADD CONSTRAINT chk_payments_amount CHECK (amount >= 0);
