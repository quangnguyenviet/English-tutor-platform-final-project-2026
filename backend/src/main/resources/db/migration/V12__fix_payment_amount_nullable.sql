-- =============================================================================
-- V12: Sửa lỗi V11 quên bỏ NOT NULL trên cột payments.amount
-- V11 chỉ đổi CHECK constraint (amount IS NULL OR amount >= 0) nhưng quên
-- chạy ALTER COLUMN ... DROP NOT NULL, nên cột amount vẫn NOT NULL ở CSDL.
-- Khi chọn gia sư (tạo lớp TRIAL), createDraftForClass chèn amount = NULL
-- với status = NEW -> PostgreSQL ném "null value in column amount ... violates
-- not-null constraint".
-- =============================================================================
ALTER TABLE payments ALTER COLUMN amount DROP NOT NULL;
