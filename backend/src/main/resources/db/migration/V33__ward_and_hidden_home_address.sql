-- Khu vực chuyển sang 2 cấp: Tỉnh/Thành phố + Phường/Xã. Cột district cũ giữ lại nhưng không còn ghi mới.
ALTER TABLE parents        ADD COLUMN ward VARCHAR(100);
ALTER TABLE class_requests ADD COLUMN ward VARCHAR(100);

-- Gia sư không được xem địa chỉ nhà phụ huynh: ca thử tại nhà dùng địa chỉ mặc định được lưu là NULL,
-- phía phụ huynh/học sinh/nhân viên tự suy ra từ hồ sơ. Gỡ các bản sao địa chỉ đã lưu trước đây.
UPDATE classes c
SET trial_location = NULL
FROM students s
JOIN parents p ON p.id = s.parent_id
WHERE s.id = c.student_id
  AND c.trial_location IS NOT NULL
  AND TRIM(c.trial_location) = TRIM(p.address);
