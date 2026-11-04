-- =============================================================================
-- V18: Đổi mã nhân viên sang định dạng NV-xxxx (API_DESIGN 3.10), đánh số theo id.
-- Chỉ đổi dữ liệu, không đổi cấu trúc bảng; chưa có code nào phụ thuộc mã EMP-...
-- =============================================================================

UPDATE employees e
SET employee_code = 'NV-' || LPAD(r.rn::text, 4, '0')
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS rn
    FROM employees
) r
WHERE e.id = r.id;
