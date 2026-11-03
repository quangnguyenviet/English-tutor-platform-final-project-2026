-- =============================================================================
-- V16: Refactor "sessions" thành 2 thực thể tách biệt (kế hoạch
-- plan-refactor-lessons-logs, ERD v2.7):
--
--   1. lessons   (thay sessions): bài giảng nhúng vào lớp, CHỈ quan hệ với
--      classes (class_id + title + status PUBLISHED/HIDDEN). Bỏ hết ngày/giờ,
--      cờ trial, teaching_mode/meeting_url/location và 2 cột log.
--   2. teaching_logs: bảng MỚI cho "nhật ký dạy học" — chỉ (class_id, log_date,
--      start_time) + nội dung knowledge/homework. Không lesson_id, không cờ
--      is_trial. UNIQUE (class_id, log_date, start_time) = C-15'.
--   3. classes: thêm 6 cột ca thử trial_* (thay dòng sessions cũ có is_trial).
--   4. Đổi tên bảng con: session_materials → lesson_materials,
--      quizzes.session_id → lesson_id, session_exceptions → schedule_exceptions.
--
-- Chiến lược data (đề án sinh viên): DB dev reset, giữ đúng 1 seed demo của V6
-- bằng 2 thao tác data dưới (bounce ca thử + copy log). Không backfill phức tạp.
-- Thứ tự quan trọng: trial_* thêm TRƯỚC bounce; copy log TRƯỚC khi drop cột log.
-- =============================================================================

-- 1. sessions → lessons (đổi tên trước, giữ nguyên id để FK con trỏ đúng)
ALTER TABLE sessions RENAME TO lessons;
ALTER TABLE lessons DROP CONSTRAINT chk_sessions_status;

-- 2. classes: các cột ca thử (thay dòng trial-session cũ, R-TRIAL)
ALTER TABLE classes ADD COLUMN trial_date           DATE;
ALTER TABLE classes ADD COLUMN trial_start_time     TIME;
ALTER TABLE classes ADD COLUMN trial_end_time       TIME;
ALTER TABLE classes ADD COLUMN trial_teaching_mode  VARCHAR(20);
ALTER TABLE classes ADD COLUMN trial_meeting_url    VARCHAR(500);
ALTER TABLE classes ADD COLUMN trial_location       VARCHAR(500);

ALTER TABLE classes ADD CONSTRAINT chk_classes_trial_time CHECK (
    trial_start_time IS NULL OR trial_start_time < trial_end_time
);
ALTER TABLE classes ADD CONSTRAINT chk_classes_trial_mode CHECK (
    trial_teaching_mode IS NULL OR trial_teaching_mode IN ('ONLINE', 'AT_HOME')
);
ALTER TABLE classes ADD CONSTRAINT chk_classes_trial_online CHECK (
    trial_start_time IS NULL
    OR (trial_date IS NOT NULL AND trial_end_time IS NOT NULL
        AND trial_meeting_url IS NOT NULL)
);

-- 3. Bounce ca thử (seed V6) từ dòng lessons cũ (is_trial = TRUE) lên classes
--    — làm TRƯỚC khi drop lessons.is_trial (bước 5).
UPDATE classes c
SET trial_date = s.session_date,
    trial_start_time = s.start_time,
    trial_end_time = s.end_time,
    trial_teaching_mode = s.teaching_mode,
    trial_meeting_url = s.meeting_url,
    trial_location = s.location
FROM lessons s
WHERE s.class_id = c.id AND s.is_trial = TRUE;

-- 4. Bảng mới teaching_logs + C-15', rồi copy log cũ (giữ seed V6).
--    (Bảng sessions/lessons không có cột created_by nên không copy audit.)
CREATE TABLE teaching_logs (
    id           BIGSERIAL    PRIMARY KEY,
    class_id     BIGINT       NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    log_date     DATE         NOT NULL,
    start_time   TIME         NOT NULL,
    end_time     TIME         NOT NULL,
    knowledge    TEXT,
    homework     TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_teaching_logs_time CHECK (start_time < end_time)
);
CREATE UNIQUE INDEX uq_teaching_logs_one_per_slot
    ON teaching_logs(class_id, log_date, start_time);
CREATE INDEX idx_teaching_logs_class_date ON teaching_logs(class_id, log_date);

INSERT INTO teaching_logs (class_id, log_date, start_time, end_time, knowledge, homework, created_at, updated_at)
SELECT class_id, session_date, start_time, end_time, log_knowledge, log_homework, created_at, updated_at
FROM lessons
WHERE log_knowledge IS NOT NULL OR log_homework IS NOT NULL;

-- 5. lessons: drop các cột đã tách đi + đổi status sang PUBLISHED/HIDDEN (mục 2.1).
ALTER TABLE lessons
    DROP COLUMN session_date,
    DROP COLUMN start_time,
    DROP COLUMN end_time,
    DROP COLUMN is_trial,
    DROP COLUMN teaching_mode,
    DROP COLUMN meeting_url,
    DROP COLUMN location,
    DROP COLUMN log_knowledge,
    DROP COLUMN log_homework;

UPDATE lessons SET status = 'PUBLISHED';
ALTER TABLE lessons ADD CONSTRAINT chk_lessons_status
    CHECK (status IN ('PUBLISHED', 'HIDDEN'));

CREATE INDEX idx_lessons_class_status ON lessons(class_id, status);

-- 6. Xóa indexes cũ của sessions (đã vô nghĩa / bị thay thế).
DROP INDEX IF EXISTS uq_sessions_one_trial_per_class;
DROP INDEX IF EXISTS uq_sessions_class_date_start;
DROP INDEX IF EXISTS idx_sessions_class_date;
DROP INDEX IF EXISTS idx_sessions_status;

-- 7. Đổi tên bảng con + cột FK (lesson_id).
ALTER TABLE session_materials RENAME TO lesson_materials;
ALTER TABLE lesson_materials RENAME COLUMN session_id TO lesson_id;
-- Index giữ tên cũ (vẫn trỏ đúng cột lesson_id sau rename) → đổi sang tên đồng bộ.
DROP INDEX IF EXISTS idx_session_materials_session_id;
CREATE INDEX idx_lesson_materials_lesson_id ON lesson_materials(lesson_id);

ALTER TABLE quizzes RENAME COLUMN session_id TO lesson_id;
DROP INDEX IF EXISTS idx_quizzes_session_id;
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);

ALTER TABLE session_exceptions RENAME TO schedule_exceptions;
-- Constraint/index giữ tên cũ sau RENAME (PostgreSQL), đổi lại cho đồng bộ:
ALTER TABLE schedule_exceptions
    DROP CONSTRAINT IF EXISTS uq_session_exceptions;
ALTER TABLE schedule_exceptions
    ADD CONSTRAINT uq_schedule_exceptions UNIQUE (schedule_id, exception_date);
ALTER TABLE schedule_exceptions
    DROP CONSTRAINT IF EXISTS chk_session_exception_type;
ALTER TABLE schedule_exceptions
    ADD CONSTRAINT chk_schedule_exception_type CHECK (
        exception_type IN ('CANCELLED', 'RESCHEDULED', 'MODIFIED')
    );
DROP INDEX IF EXISTS idx_session_exceptions_class_date;
CREATE INDEX idx_schedule_exceptions_class_date
    ON schedule_exceptions(class_id, exception_date);
