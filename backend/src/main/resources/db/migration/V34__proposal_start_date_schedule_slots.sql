-- Đề xuất lớp học: thêm ngày bắt đầu học và cho phép mỗi thứ trong tuần có khung giờ riêng.

CREATE TABLE proposal_schedule_slots (
    proposal_id BIGINT   NOT NULL REFERENCES proposal_messages(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL, -- 1 = Thứ 2 … 7 = Chủ nhật
    start_time  TIME     NOT NULL,
    end_time    TIME     NOT NULL,

    PRIMARY KEY (proposal_id, day_of_week),
    CONSTRAINT chk_proposal_slot_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_proposal_slot_time CHECK (start_time < end_time)
);

-- Đề xuất cũ dùng chung một khung giờ cho mọi thứ.
INSERT INTO proposal_schedule_slots (proposal_id, day_of_week, start_time, end_time)
SELECT DISTINCT p.id, d.day, p.schedule_time_from, p.schedule_time_to
FROM proposal_messages p CROSS JOIN LATERAL unnest(p.schedule_days) AS d(day);

ALTER TABLE proposal_messages ADD COLUMN start_date DATE;
UPDATE proposal_messages SET start_date = trial_date;
ALTER TABLE proposal_messages ALTER COLUMN start_date SET NOT NULL;

-- Xóa cột cũ để lịch chỉ còn một nguồn (ràng buộc CHECK gắn với cột được xóa theo).
ALTER TABLE proposal_messages
    DROP COLUMN schedule_days,
    DROP COLUMN schedule_time_from,
    DROP COLUMN schedule_time_to;
