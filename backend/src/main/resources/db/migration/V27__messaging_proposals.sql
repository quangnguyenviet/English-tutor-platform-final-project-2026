-- MSG-03..MSG-11: nhắn tin phụ huynh - gia sư, đề xuất lớp học, bảng phí theo loại lớp.
-- Bỏ class_requests.requested_tutor_id; lớp có thể tạo thẳng từ đề xuất (không qua đơn).

-- ---------------------------------------------------------------------------
-- 1. parents: thông tin wizard
-- ---------------------------------------------------------------------------
ALTER TABLE parents
    ADD COLUMN purpose  VARCHAR(20),
    ADD COLUMN province VARCHAR(100),
    ADD COLUMN district VARCHAR(100);
ALTER TABLE parents ADD CONSTRAINT chk_parents_purpose CHECK (
    purpose IS NULL OR purpose IN ('PHU_THONG', 'THI_CHUAN', 'GIAO_TIEP', 'THI_HOC_KY')
);

-- ---------------------------------------------------------------------------
-- 2. class_requests: bỏ gia sư chỉ định, thêm nguồn tin và thông tin đăng tin
-- ---------------------------------------------------------------------------
-- Đơn chỉ định gia sư đang chờ xử lý không còn luồng xử lý: hủy kèm lý do để phụ huynh nhắn tin lại.
UPDATE class_requests
SET status = 'CANCELLED',
    cancel_reason = 'Luồng chỉ định gia sư đã ngừng, vui lòng nhắn tin trực tiếp với gia sư trên hệ thống',
    updated_at = NOW()
WHERE requested_tutor_id IS NOT NULL AND status = 'NEW';

DROP INDEX IF EXISTS idx_class_requests_requested_tutor_id;
ALTER TABLE class_requests DROP COLUMN requested_tutor_id;

ALTER TABLE class_requests
    ADD COLUMN source   VARCHAR(20) NOT NULL DEFAULT 'STAFF',
    ADD COLUMN purpose  VARCHAR(20),
    ADD COLUMN province VARCHAR(100),
    ADD COLUMN district VARCHAR(100),
    ADD COLUMN no_applicant_reminded_at TIMESTAMPTZ;
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_source CHECK (source IN ('STAFF', 'POSTING'));
ALTER TABLE class_requests ADD CONSTRAINT chk_class_requests_purpose CHECK (
    purpose IS NULL OR purpose IN ('PHU_THONG', 'THI_CHUAN', 'GIAO_TIEP', 'THI_HOC_KY')
);

-- Mỗi phụ huynh tối đa một tin đăng đang sống.
CREATE UNIQUE INDEX uq_class_requests_one_live_posting
    ON class_requests(parent_id)
    WHERE source = 'POSTING' AND status IN ('NEW', 'OPEN');

-- ---------------------------------------------------------------------------
-- 3. platform_fee_policies: tỷ lệ phí nhận lớp theo loại lớp
-- ---------------------------------------------------------------------------
CREATE TABLE platform_fee_policies (
    id             BIGSERIAL     PRIMARY KEY,
    class_type     VARCHAR(20)   NOT NULL,
    fee_percentage DECIMAL(5, 2) NOT NULL,
    effective_from TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_by     BIGINT        REFERENCES users(id),
    created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_fee_policies_class_type CHECK (class_type IN ('SHORT_TERM', 'REGULAR')),
    CONSTRAINT chk_fee_policies_percentage CHECK (fee_percentage BETWEEN 0 AND 50)
);
CREATE INDEX idx_fee_policies_lookup ON platform_fee_policies(class_type, effective_from DESC);

INSERT INTO platform_fee_policies (class_type, fee_percentage, effective_from)
VALUES ('SHORT_TERM', 25, '2000-01-01'), ('REGULAR', 35, '2000-01-01');

-- ---------------------------------------------------------------------------
-- 4. Rocket.Chat: ánh xạ tài khoản
-- ---------------------------------------------------------------------------
CREATE TABLE rocket_chat_accounts (
    user_id         BIGINT       PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    rocket_user_id  VARCHAR(64)  NOT NULL UNIQUE,
    rocket_username VARCHAR(100) NOT NULL UNIQUE,
    provisioned_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 5. chat_rooms
-- ---------------------------------------------------------------------------
CREATE TABLE chat_rooms (
    id                   BIGSERIAL    PRIMARY KEY,
    room_type            VARCHAR(20)  NOT NULL,
    parent_id            BIGINT       NOT NULL REFERENCES parents(id),
    tutor_id             BIGINT       NOT NULL REFERENCES tutors(id),
    class_application_id BIGINT       REFERENCES class_applications(id) ON DELETE SET NULL,
    rocket_room_id       VARCHAR(64)  NOT NULL UNIQUE,
    status               VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',
    last_message_at      TIMESTAMPTZ,
    created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_chat_rooms_type CHECK (room_type IN ('DIRECT', 'APPLICATION')),
    CONSTRAINT chk_chat_rooms_status CHECK (status IN ('ACTIVE', 'CLOSED')),
    CONSTRAINT uq_chat_rooms_application UNIQUE (class_application_id)
);
-- Room APPLICATION bị SET NULL khi application bị xóa nên không ép CHECK ở chiều đó.
CREATE UNIQUE INDEX uq_chat_rooms_direct_pair
    ON chat_rooms(parent_id, tutor_id)
    WHERE room_type = 'DIRECT';
CREATE INDEX idx_chat_rooms_parent ON chat_rooms(parent_id);
CREATE INDEX idx_chat_rooms_tutor  ON chat_rooms(tutor_id);

-- ---------------------------------------------------------------------------
-- 6. proposal_messages
-- ---------------------------------------------------------------------------
CREATE TABLE proposal_messages (
    id                    BIGSERIAL      PRIMARY KEY,
    room_id               BIGINT         NOT NULL REFERENCES chat_rooms(id),
    tutor_id              BIGINT         NOT NULL REFERENCES tutors(id),
    version               SMALLINT       NOT NULL,
    student_id            BIGINT         REFERENCES students(id),
    student_name          VARCHAR(50),
    student_grade         VARCHAR(20),
    student_school        VARCHAR(200),
    student_learning_goal TEXT,
    class_type            VARCHAR(20)    NOT NULL,
    fee_percentage        DECIMAL(5, 2)  NOT NULL,
    price_per_session     DECIMAL(12, 0) NOT NULL,
    schedule_days         INT[]          NOT NULL,
    schedule_time_from    TIME           NOT NULL,
    schedule_time_to      TIME           NOT NULL,
    trial_date            DATE           NOT NULL,
    trial_time_from       TIME           NOT NULL,
    trial_time_to         TIME           NOT NULL,
    class_mode            VARCHAR(20)    NOT NULL,
    note                  TEXT,
    status                VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    rejection_reason      TEXT,
    decided_at            TIMESTAMPTZ,
    rocket_message_id     VARCHAR(64),
    created_at            TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    expires_at            TIMESTAMPTZ    NOT NULL,

    CONSTRAINT uq_proposal_room_version UNIQUE (room_id, version),
    CONSTRAINT chk_proposal_student CHECK (student_id IS NOT NULL OR student_name IS NOT NULL),
    CONSTRAINT chk_proposal_class_type CHECK (class_type IN ('SHORT_TERM', 'REGULAR')),
    CONSTRAINT chk_proposal_status CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT chk_proposal_mode CHECK (class_mode IN ('AT_HOME', 'ONLINE')),
    CONSTRAINT chk_proposal_price CHECK (price_per_session > 0),
    CONSTRAINT chk_proposal_schedule_time CHECK (schedule_time_from < schedule_time_to),
    CONSTRAINT chk_proposal_trial_time CHECK (trial_time_from < trial_time_to),
    CONSTRAINT chk_proposal_days CHECK (cardinality(schedule_days) BETWEEN 1 AND 7)
);
-- Mỗi học sinh tối đa một đề xuất PENDING trong một room.
CREATE UNIQUE INDEX uq_proposal_pending_student
    ON proposal_messages(room_id, student_id)
    WHERE status = 'PENDING' AND student_id IS NOT NULL;
CREATE UNIQUE INDEX uq_proposal_pending_student_name
    ON proposal_messages(room_id, LOWER(student_name))
    WHERE status = 'PENDING' AND student_id IS NULL;
CREATE INDEX idx_proposal_room ON proposal_messages(room_id);
CREATE INDEX idx_proposal_status_expires ON proposal_messages(status, expires_at);
CREATE UNIQUE INDEX uq_proposal_rocket_message ON proposal_messages(rocket_message_id) WHERE rocket_message_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 7. classes: lớp tạo từ đề xuất
-- ---------------------------------------------------------------------------
ALTER TABLE classes ALTER COLUMN class_request_id DROP NOT NULL;
ALTER TABLE classes
    ADD COLUMN proposal_id    BIGINT        UNIQUE REFERENCES proposal_messages(id),
    ADD COLUMN class_type     VARCHAR(20),
    ADD COLUMN fee_percentage DECIMAL(5, 2),
    ADD COLUMN end_date       DATE;
ALTER TABLE classes ADD CONSTRAINT chk_classes_origin CHECK (class_request_id IS NOT NULL OR proposal_id IS NOT NULL);
ALTER TABLE classes ADD CONSTRAINT chk_classes_class_type CHECK (class_type IS NULL OR class_type IN ('SHORT_TERM', 'REGULAR'));

-- Ca thử tạo từ đề xuất chưa có link phòng học: chỉ bắt buộc link khi ca thử ONLINE đã chốt hình thức.
ALTER TABLE classes DROP CONSTRAINT chk_classes_trial_online;
ALTER TABLE classes ADD CONSTRAINT chk_classes_trial_online CHECK (
    trial_start_time IS NULL
    OR (trial_date IS NOT NULL AND trial_end_time IS NOT NULL
        AND (trial_teaching_mode IS NULL OR trial_teaching_mode <> 'ONLINE' OR trial_meeting_url IS NOT NULL))
);

-- ---------------------------------------------------------------------------
-- 8. chat_pii_events: log kiểm duyệt và mở khóa SĐT
-- ---------------------------------------------------------------------------
CREATE TABLE chat_pii_events (
    id           BIGSERIAL    PRIMARY KEY,
    room_id      BIGINT       NOT NULL REFERENCES chat_rooms(id),
    user_id      BIGINT       REFERENCES users(id),
    type         VARCHAR(20)  NOT NULL,
    detail       JSONB,
    blocked_text TEXT,
    reviewed_by  BIGINT       REFERENCES users(id),
    reviewed_at  TIMESTAMPTZ,
    review_note  TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_chat_pii_events_type CHECK (type IN ('PII_BLOCKED', 'PHONE_UNLOCKED', 'REVIEW_REINSTATED'))
);
CREATE INDEX idx_chat_pii_events_room ON chat_pii_events(room_id, created_at DESC);
CREATE INDEX idx_chat_pii_events_type ON chat_pii_events(type, created_at DESC);

-- ---------------------------------------------------------------------------
-- 9. chat_outbox: đồng bộ tin hệ thống sang Rocket.Chat (transactional outbox)
-- ---------------------------------------------------------------------------
CREATE TABLE chat_outbox (
    id              BIGSERIAL    PRIMARY KEY,
    event_type      VARCHAR(40)  NOT NULL,
    room_id         BIGINT       NOT NULL REFERENCES chat_rooms(id),
    payload         JSONB        NOT NULL,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    attempts        INT          NOT NULL DEFAULT 0,
    next_attempt_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    last_error      TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    sent_at         TIMESTAMPTZ,

    CONSTRAINT chk_chat_outbox_status CHECK (status IN ('PENDING', 'SENT', 'FAILED'))
);
CREATE INDEX idx_chat_outbox_due ON chat_outbox(status, next_attempt_at);
