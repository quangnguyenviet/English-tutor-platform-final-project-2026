-- =============================================================================
-- V5: Hoan thien PostgreSQL schema theo docs/project/ERD.md (version 2.2)
--
-- V1-V4 da tao users, tutors va cac bang ho so gia su. Migration nay tao 19
-- bang nghiep vu con thieu va view Student Knowledge Profile.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TAI KHOAN VA NGUOI DUNG
-- -----------------------------------------------------------------------------
CREATE TABLE employees (
    id             BIGINT      PRIMARY KEY
                               REFERENCES users(id) ON DELETE CASCADE,
    employee_code  VARCHAR(20) NOT NULL UNIQUE,
    hired_date     DATE
);

CREATE TABLE parents (
    id          BIGSERIAL    PRIMARY KEY,
    full_name   VARCHAR(100) NOT NULL,
    phone       VARCHAR(15)  NOT NULL,
    email       VARCHAR(100),
    address     VARCHAR(500),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_parents_phone ON parents(phone);

CREATE TABLE students (
    id             BIGINT       PRIMARY KEY
                                  REFERENCES users(id) ON DELETE CASCADE,
    parent_id      BIGINT       NOT NULL REFERENCES parents(id),
    school         VARCHAR(200),
    grade          VARCHAR(20),
    learning_goal  TEXT,
    elo            INTEGER      NOT NULL DEFAULT 1000,
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_students_elo CHECK (elo >= 0)
);

CREATE INDEX idx_students_parent_id ON students(parent_id);

-- -----------------------------------------------------------------------------
-- 2. YEU CAU LOP VA GHEP LOP
-- -----------------------------------------------------------------------------
CREATE TABLE class_requests (
    id                   BIGSERIAL      PRIMARY KEY,
    parent_id            BIGINT         NOT NULL REFERENCES parents(id),
    requested_tutor_id   BIGINT         REFERENCES tutors(id),
    student_id           BIGINT         REFERENCES students(id),
    class_requirement    TEXT,
    teaching_mode        VARCHAR(20),
    price_per_session    DECIMAL(12, 0),
    preferred_schedule   TEXT,
    tutor_requirement    TEXT,
    status               VARCHAR(20)    NOT NULL,
    cancel_reason        TEXT,
    created_by           BIGINT         REFERENCES users(id),
    handled_by           BIGINT         REFERENCES users(id),
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_class_requests_mode CHECK (
        teaching_mode IS NULL OR teaching_mode IN ('ONLINE', 'AT_HOME')
    ),
    CONSTRAINT chk_class_requests_price CHECK (
        price_per_session IS NULL OR price_per_session > 0
    ),
    CONSTRAINT chk_class_requests_status CHECK (
        status IN ('NEW', 'OPEN', 'MATCHED', 'CANCELLED')
    ),
    CONSTRAINT chk_class_requests_ready CHECK (
        status IN ('NEW', 'CANCELLED')
        OR (student_id IS NOT NULL AND class_requirement IS NOT NULL)
    )
);

CREATE INDEX idx_class_requests_parent_id          ON class_requests(parent_id);
CREATE INDEX idx_class_requests_requested_tutor_id ON class_requests(requested_tutor_id);
CREATE INDEX idx_class_requests_student_id         ON class_requests(student_id);
CREATE INDEX idx_class_requests_status             ON class_requests(status);
CREATE INDEX idx_class_requests_handled_by         ON class_requests(handled_by);

CREATE TABLE class_applications (
    id                BIGSERIAL    PRIMARY KEY,
    class_request_id  BIGINT       NOT NULL
                                   REFERENCES class_requests(id) ON DELETE CASCADE,
    tutor_id          BIGINT       NOT NULL REFERENCES tutors(id),
    message           TEXT,
    status            VARCHAR(20)  NOT NULL DEFAULT 'APPLIED',
    applied_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_class_applications UNIQUE (class_request_id, tutor_id),
    CONSTRAINT chk_class_applications_status CHECK (
        status IN ('APPLIED', 'SELECTED', 'REJECTED')
    )
);

CREATE INDEX idx_class_applications_request_id ON class_applications(class_request_id);
CREATE INDEX idx_class_applications_tutor_id   ON class_applications(tutor_id);
CREATE INDEX idx_class_applications_status     ON class_applications(status);

-- -----------------------------------------------------------------------------
-- 3. LOP HOC VA BUOI HOC
-- -----------------------------------------------------------------------------
CREATE TABLE classes (
    id                 BIGSERIAL      PRIMARY KEY,
    class_request_id   BIGINT         NOT NULL REFERENCES class_requests(id),
    tutor_id            BIGINT         NOT NULL REFERENCES tutors(id),
    student_id          BIGINT         NOT NULL REFERENCES students(id),
    class_name          VARCHAR(200),
    status              VARCHAR(20)    NOT NULL,
    teaching_mode       VARCHAR(20)    NOT NULL,
    active_from         DATE,
    price_per_session   DECIMAL(12, 0),
    tutor_note          TEXT,
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_classes_status CHECK (
        status IN ('TRIAL', 'ACTIVE', 'COMPLETED', 'CANCELLED')
    ),
    CONSTRAINT chk_classes_teaching_mode CHECK (
        teaching_mode IN ('ONLINE', 'AT_HOME')
    ),
    CONSTRAINT chk_classes_price CHECK (
        price_per_session IS NULL OR price_per_session > 0
    )
);

CREATE INDEX idx_classes_tutor_id   ON classes(tutor_id);
CREATE INDEX idx_classes_student_id ON classes(student_id);
CREATE INDEX idx_classes_status     ON classes(status);
CREATE UNIQUE INDEX uq_classes_one_current_per_request
    ON classes(class_request_id)
    WHERE status IN ('TRIAL', 'ACTIVE');

CREATE TABLE class_schedules (
    id           BIGSERIAL  PRIMARY KEY,
    class_id     BIGINT     NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week  SMALLINT   NOT NULL,
    start_time   TIME       NOT NULL,
    end_time     TIME       NOT NULL,

    CONSTRAINT chk_class_schedules_day CHECK (day_of_week BETWEEN 1 AND 7),
    CONSTRAINT chk_class_schedules_time CHECK (start_time < end_time),
    CONSTRAINT uq_class_schedules UNIQUE (class_id, day_of_week, start_time)
);

CREATE INDEX idx_class_schedules_class_id ON class_schedules(class_id);

CREATE TABLE sessions (
    id               BIGSERIAL    PRIMARY KEY,
    class_id         BIGINT       NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    title            VARCHAR(200),
    session_date     DATE         NOT NULL,
    start_time       TIME         NOT NULL,
    end_time         TIME         NOT NULL,
    is_trial         BOOLEAN      NOT NULL DEFAULT FALSE,
    teaching_mode    VARCHAR(20),
    meeting_url      VARCHAR(500),
    location         VARCHAR(500),
    status           VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    log_knowledge    TEXT,
    log_homework     TEXT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_sessions_time CHECK (start_time < end_time),
    CONSTRAINT chk_sessions_teaching_mode CHECK (
        teaching_mode IS NULL OR teaching_mode IN ('ONLINE', 'AT_HOME')
    ),
    CONSTRAINT chk_sessions_status CHECK (
        status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'ABSENT', 'CANCELLED')
    )
);

CREATE INDEX idx_sessions_class_date ON sessions(class_id, session_date, start_time);
CREATE INDEX idx_sessions_status     ON sessions(status);
CREATE UNIQUE INDEX uq_sessions_one_trial_per_class
    ON sessions(class_id)
    WHERE is_trial = TRUE;

CREATE TABLE session_materials (
    id           BIGSERIAL    PRIMARY KEY,
    session_id   BIGINT       NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    uploaded_by  BIGINT       NOT NULL REFERENCES users(id),
    file_name    VARCHAR(255) NOT NULL,
    file_url     VARCHAR(500) NOT NULL,
    file_type    VARCHAR(20),
    file_size    BIGINT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_session_materials_type CHECK (
        file_type IS NULL OR file_type IN ('PDF', 'DOCX', 'IMAGE', 'AUDIO')
    ),
    CONSTRAINT chk_session_materials_size CHECK (
        file_size IS NULL OR file_size >= 0
    )
);

CREATE INDEX idx_session_materials_session_id ON session_materials(session_id);

-- -----------------------------------------------------------------------------
-- 4. QUIZ, ELO VA STUDENT KNOWLEDGE PROFILE
-- -----------------------------------------------------------------------------
CREATE TABLE skills (
    id           BIGSERIAL    PRIMARY KEY,
    skill_code   VARCHAR(50)  NOT NULL UNIQUE,
    skill_name   VARCHAR(100) NOT NULL,
    category     VARCHAR(50),
    description  TEXT,

    CONSTRAINT chk_skills_category CHECK (
        category IS NULL OR category IN (
            'GRAMMAR', 'VOCABULARY', 'PRONUNCIATION', 'READING',
            'WRITING', 'LISTENING', 'SPEAKING'
        )
    )
);

CREATE INDEX idx_skills_category ON skills(category);

CREATE TABLE quizzes (
    id               BIGSERIAL    PRIMARY KEY,
    session_id       BIGINT       NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    title            VARCHAR(200),
    status           VARCHAR(20)  NOT NULL,
    source           VARCHAR(20)  NOT NULL,
    deadline         TIMESTAMPTZ,
    total_questions  SMALLINT,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_quizzes_status CHECK (
        status IN ('DRAFT', 'ASSIGNED', 'COMPLETED', 'EXPIRED')
    ),
    CONSTRAINT chk_quizzes_source CHECK (source IN ('AI_DIRECT', 'IMPORTED')),
    CONSTRAINT chk_quizzes_total_questions CHECK (
        total_questions IS NULL OR total_questions >= 0
    )
);

CREATE INDEX idx_quizzes_session_id ON quizzes(session_id);
CREATE INDEX idx_quizzes_status     ON quizzes(status);

CREATE TABLE quiz_questions (
    id               BIGSERIAL    PRIMARY KEY,
    quiz_id          BIGINT       NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    question_number  SMALLINT     NOT NULL,
    question_text    TEXT         NOT NULL,
    option_a         VARCHAR(500) NOT NULL,
    option_b         VARCHAR(500) NOT NULL,
    option_c         VARCHAR(500) NOT NULL,
    option_d         VARCHAR(500) NOT NULL,
    correct_answer   CHAR(1)      NOT NULL,
    explanation      TEXT,
    cefr_level       VARCHAR(5),
    skill_id         BIGINT       REFERENCES skills(id) ON DELETE SET NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_quiz_questions_number UNIQUE (quiz_id, question_number),
    CONSTRAINT chk_quiz_questions_number CHECK (question_number > 0),
    CONSTRAINT chk_quiz_questions_correct_answer CHECK (
        correct_answer IN ('A', 'B', 'C', 'D')
    ),
    CONSTRAINT chk_quiz_questions_cefr CHECK (
        cefr_level IS NULL OR cefr_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')
    )
);

CREATE INDEX idx_quiz_questions_quiz_id  ON quiz_questions(quiz_id);
CREATE INDEX idx_quiz_questions_skill_id ON quiz_questions(skill_id);

CREATE TABLE quiz_answers (
    id               BIGSERIAL    PRIMARY KEY,
    question_id      BIGINT       NOT NULL
                                  REFERENCES quiz_questions(id) ON DELETE CASCADE,
    student_id       BIGINT       NOT NULL REFERENCES students(id),
    selected_answer  CHAR(1)      NOT NULL,
    is_correct       BOOLEAN      NOT NULL,
    elo_before       INTEGER,
    elo_after        INTEGER,
    elo_change       INTEGER,
    next_review      TIMESTAMPTZ,
    review_count     SMALLINT     DEFAULT 0,
    easiness_factor  DECIMAL(3,2) DEFAULT 2.50,
    answered_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT uq_quiz_answers_student_question UNIQUE (student_id, question_id),
    CONSTRAINT chk_quiz_answers_selected CHECK (
        selected_answer IN ('A', 'B', 'C', 'D')
    ),
    CONSTRAINT chk_quiz_answers_review_count CHECK (
        review_count IS NULL OR review_count >= 0
    ),
    CONSTRAINT chk_quiz_answers_easiness CHECK (
        easiness_factor IS NULL OR easiness_factor BETWEEN 1.30 AND 2.50
    ),
    CONSTRAINT chk_quiz_answers_elo_change CHECK (
        elo_before IS NULL OR elo_after IS NULL OR elo_change = elo_after - elo_before
    )
);

CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
CREATE INDEX idx_quiz_answers_student_id  ON quiz_answers(student_id);
CREATE INDEX idx_quiz_answers_next_review ON quiz_answers(student_id, next_review)
    WHERE next_review IS NOT NULL;

CREATE VIEW v_student_skill_stats AS
SELECT
    qa.student_id,
    qq.skill_id,
    COUNT(*) FILTER (WHERE qa.is_correct)     AS total_correct,
    COUNT(*) FILTER (WHERE NOT qa.is_correct) AS total_incorrect,
    COUNT(*)                                  AS total_attempts,
    ROUND(
        COUNT(*) FILTER (WHERE NOT qa.is_correct)::NUMERIC / NULLIF(COUNT(*), 0),
        4
    )                                         AS error_rate,
    MAX(qa.answered_at)                       AS last_practiced_at
FROM quiz_answers qa
JOIN quiz_questions qq ON qq.id = qa.question_id
WHERE qq.skill_id IS NOT NULL
GROUP BY qa.student_id, qq.skill_id;

COMMENT ON VIEW v_student_skill_stats IS
    'Raw SKP aggregates; mastery_score and confidence_score are calculated by the backend.';

-- -----------------------------------------------------------------------------
-- 5. TAI CHINH VA KHIEU NAI
-- -----------------------------------------------------------------------------
CREATE TABLE payments (
    id                 BIGSERIAL      PRIMARY KEY,
    class_id           BIGINT         NOT NULL REFERENCES classes(id),
    payer_type         VARCHAR(20)    NOT NULL,
    fee_percentage     DECIMAL(5,2),
    amount             DECIMAL(12, 0) NOT NULL,
    payment_method     VARCHAR(20),
    proof_url          VARCHAR(500),
    received_amount    DECIMAL(12, 0),
    status             VARCHAR(20)    NOT NULL,
    reject_reason      TEXT,
    uploaded_by        BIGINT         REFERENCES users(id),
    uploaded_at        TIMESTAMPTZ,
    reviewed_by        BIGINT         REFERENCES users(id),
    reviewed_at        TIMESTAMPTZ,
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_payments_payer_type CHECK (payer_type IN ('TUTOR', 'PARENT')),
    CONSTRAINT chk_payments_fee_percentage CHECK (
        fee_percentage IS NULL OR fee_percentage BETWEEN 35 AND 40
    ),
    CONSTRAINT chk_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_payments_received_amount CHECK (
        received_amount IS NULL OR received_amount >= 0
    ),
    CONSTRAINT chk_payments_method CHECK (
        payment_method IS NULL OR payment_method IN ('BANK_TRANSFER', 'CASH')
    ),
    CONSTRAINT chk_payments_status CHECK (
        status IN ('NOT_SUBMITTED', 'SUBMITTED', 'APPROVED', 'RESUBMIT_REQUIRED')
    ),
    CONSTRAINT chk_payments_separation_of_duties CHECK (
        reviewed_by IS NULL OR uploaded_by IS NULL OR reviewed_by <> uploaded_by
    ),
    CONSTRAINT chk_payments_approved CHECK (
        status <> 'APPROVED'
        OR (
            received_amount IS NOT NULL
            AND received_amount >= amount
            AND reviewed_by IS NOT NULL
            AND reviewed_at IS NOT NULL
        )
    )
);

CREATE INDEX idx_payments_class_id    ON payments(class_id);
CREATE INDEX idx_payments_status      ON payments(status);
CREATE INDEX idx_payments_reviewed_at ON payments(reviewed_at);

CREATE TABLE complaints (
    id                  BIGSERIAL    PRIMARY KEY,
    class_id            BIGINT       NOT NULL REFERENCES classes(id),
    complainant_name    VARCHAR(100) NOT NULL,
    complainant_phone   VARCHAR(15)  NOT NULL,
    complainant_role    VARCHAR(20)  NOT NULL,
    complaint_type      VARCHAR(30)  NOT NULL,
    complaint_content   TEXT         NOT NULL,
    status              VARCHAR(20)  NOT NULL,
    resolution          TEXT,
    received_by         BIGINT       NOT NULL REFERENCES users(id),
    resolved_by         BIGINT       REFERENCES users(id),
    resolved_at         TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_complaints_role CHECK (
        complainant_role IN ('PARENT', 'TUTOR', 'STUDENT')
    ),
    CONSTRAINT chk_complaints_type CHECK (complaint_type IN ('REFUND', 'REMATCH')),
    CONSTRAINT chk_complaints_status CHECK (
        status IN ('PENDING', 'PROCESSING', 'RESOLVED', 'CANCELLED')
    ),
    CONSTRAINT chk_complaints_resolved CHECK (
        status <> 'RESOLVED' OR (resolved_by IS NOT NULL AND resolved_at IS NOT NULL)
    )
);

CREATE INDEX idx_complaints_class_id ON complaints(class_id);
CREATE INDEX idx_complaints_status   ON complaints(status);

CREATE TABLE complaint_attachments (
    id            BIGSERIAL    PRIMARY KEY,
    complaint_id  BIGINT       NOT NULL
                                REFERENCES complaints(id) ON DELETE CASCADE,
    file_url      VARCHAR(500) NOT NULL,
    file_name     VARCHAR(255),
    uploaded_by   BIGINT       NOT NULL REFERENCES users(id),
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_complaint_attachments_complaint_id
    ON complaint_attachments(complaint_id);

CREATE TABLE refunds (
    id                   BIGSERIAL      PRIMARY KEY,
    complaint_id         BIGINT         NOT NULL REFERENCES complaints(id),
    payment_id           BIGINT         NOT NULL REFERENCES payments(id),
    requested_amount     DECIMAL(12, 0) NOT NULL,
    approved_amount      DECIMAL(12, 0),
    recipient_name       VARCHAR(100)   NOT NULL,
    bank_name            VARCHAR(100)   NOT NULL,
    bank_account_number  VARCHAR(30)    NOT NULL,
    status               VARCHAR(20)    NOT NULL DEFAULT 'PENDING',
    reject_reason        TEXT,
    proof_url            VARCHAR(500),
    requested_by         BIGINT         NOT NULL REFERENCES users(id),
    processed_by         BIGINT         REFERENCES users(id),
    processed_at         TIMESTAMPTZ,
    created_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_refunds_requested_amount CHECK (requested_amount > 0),
    CONSTRAINT chk_refunds_approved_amount CHECK (
        approved_amount IS NULL
        OR (approved_amount > 0 AND approved_amount <= requested_amount)
    ),
    CONSTRAINT chk_refunds_status CHECK (status IN ('PENDING', 'PAID', 'REJECTED')),
    CONSTRAINT chk_refunds_separation_of_duties CHECK (
        processed_by IS NULL OR processed_by <> requested_by
    ),
    CONSTRAINT chk_refunds_paid CHECK (
        status <> 'PAID'
        OR (
            approved_amount IS NOT NULL
            AND proof_url IS NOT NULL
            AND processed_by IS NOT NULL
            AND processed_at IS NOT NULL
        )
    ),
    CONSTRAINT chk_refunds_rejected CHECK (
        status <> 'REJECTED' OR reject_reason IS NOT NULL
    )
);

CREATE INDEX idx_refunds_complaint_id ON refunds(complaint_id);
CREATE INDEX idx_refunds_payment_id   ON refunds(payment_id);
CREATE INDEX idx_refunds_status       ON refunds(status);
CREATE UNIQUE INDEX uq_refunds_one_open_or_paid_per_complaint
    ON refunds(complaint_id)
    WHERE status IN ('PENDING', 'PAID');

-- -----------------------------------------------------------------------------
-- 6. HE THONG
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id                BIGSERIAL    PRIMARY KEY,
    user_id           BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title             VARCHAR(200) NOT NULL,
    content           TEXT,
    link_url          VARCHAR(500),
    link_entity_type  VARCHAR(30),
    link_entity_id    BIGINT,
    is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, is_read, created_at DESC);

CREATE TABLE audit_logs (
    id           BIGSERIAL    PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id),
    action       VARCHAR(50)  NOT NULL,
    entity_type  VARCHAR(30)  NOT NULL,
    entity_id    BIGINT       NOT NULL,
    details      JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity  ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
