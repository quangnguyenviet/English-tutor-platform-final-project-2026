-- =============================================================================
-- EnglishPath — PostgreSQL DDL
-- Các bảng: users, tutors, tutor_credentials, tutor_service_areas,
--           tutor_prices, tutor_availabilities, tutor_specialties
-- Phiên bản: 2.0
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. BẢNG users — Tài khoản đăng nhập chung cho cả 5 vai trò
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id                   BIGSERIAL     PRIMARY KEY,
    username             VARCHAR(50)   NOT NULL UNIQUE,
    password_hash        VARCHAR(255)  NOT NULL,
    full_name            VARCHAR(100)  NOT NULL,
    email                VARCHAR(100)  UNIQUE,
    phone                VARCHAR(15)   UNIQUE,
    date_of_birth        DATE,
    gender               VARCHAR(10),
    avatar_url           VARCHAR(500),
    role                 VARCHAR(20)   NOT NULL,
    status               VARCHAR(20)   NOT NULL,
    must_change_password BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_users_role CHECK (
        role IN ('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'TUTOR', 'STUDENT')
    ),
    CONSTRAINT chk_users_status CHECK (
        status IN ('ACTIVE', 'INACTIVE')
    ),
    CONSTRAINT chk_users_gender CHECK (
        gender IS NULL OR gender IN ('MALE', 'FEMALE', 'OTHER')
    )
);

-- -----------------------------------------------------------------------------
-- 2. BẢNG invalidated_token — JWT đã bị thu hồi khi logout hoặc refresh
-- -----------------------------------------------------------------------------
CREATE TABLE invalidated_token (
    id           VARCHAR(255) NOT NULL,
    expiry_time  TIMESTAMP(6),
    CONSTRAINT pk_invalidated_token PRIMARY KEY (id)
);

-- -----------------------------------------------------------------------------
-- 3. BẢNG tutors — Hồ sơ gia sư (kế thừa users, dùng chung id)
-- -----------------------------------------------------------------------------
CREATE TABLE tutors (
    id                BIGINT       PRIMARY KEY
                                   REFERENCES users(id) ON DELETE CASCADE,
    address           VARCHAR(500),
    university        VARCHAR(200),
    education_status  VARCHAR(30),
    experience_years  SMALLINT,
    bio               TEXT,
    video_url         VARCHAR(500),
    profile_status    VARCHAR(20)  NOT NULL,
    rejection_reason  TEXT,
    reviewed_by       BIGINT       REFERENCES users(id),
    reviewed_at       TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tutors_profile_status CHECK (
        profile_status IN ('INCOMPLETE', 'PENDING', 'ACTIVE', 'INACTIVE', 'REJECTED')
    ),
    CONSTRAINT chk_tutors_education_status CHECK (
        education_status IS NULL
        OR education_status IN ('STUDENT', 'GRADUATED', 'LECTURER')
    ),
    CONSTRAINT chk_tutors_experience_years CHECK (
        experience_years IS NULL OR experience_years >= 0
    )
);

CREATE INDEX idx_tutors_profile_status ON tutors(profile_status);
CREATE INDEX idx_tutors_reviewed_by    ON tutors(reviewed_by);

-- -----------------------------------------------------------------------------
-- 4. BẢNG tutor_credentials — Chứng chỉ & thành tích của gia sư
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_credentials (
    id               BIGSERIAL     PRIMARY KEY,
    tutor_id         BIGINT        NOT NULL
                                   REFERENCES tutors(id) ON DELETE CASCADE,
    credential_type  VARCHAR(20)   NOT NULL,
    title            VARCHAR(200)  NOT NULL,
    score            VARCHAR(20),
    description      TEXT,
    issued_at        DATE,
    file_url         VARCHAR(500)  NOT NULL,
    is_verified      BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by      BIGINT        REFERENCES users(id),
    verified_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_tutor_credentials_type CHECK (
        credential_type IN ('CERTIFICATE', 'ACHIEVEMENT')
    )
);

CREATE INDEX idx_tutor_credentials_tutor_id    ON tutor_credentials(tutor_id);
CREATE INDEX idx_tutor_credentials_is_verified ON tutor_credentials(is_verified);
CREATE INDEX idx_tutor_credentials_verified_by ON tutor_credentials(verified_by);

-- -----------------------------------------------------------------------------
-- 5. BẢNG tutor_service_areas — Khu vực địa lý gia sư nhận dạy tại nhà
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_service_areas (
    id         BIGSERIAL     PRIMARY KEY,
    tutor_id   BIGINT        NOT NULL
                             REFERENCES tutors(id) ON DELETE CASCADE,
    province   VARCHAR(100)  NOT NULL,
    district   VARCHAR(100)
);

CREATE INDEX idx_tutor_service_areas_tutor_id ON tutor_service_areas(tutor_id);
CREATE INDEX idx_tutor_service_areas_location ON tutor_service_areas(province, district);

-- -----------------------------------------------------------------------------
-- 6. BẢNG tutor_prices — Bảng giá học phí của gia sư theo hình thức dạy
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_prices (
    id                 BIGSERIAL      PRIMARY KEY,
    tutor_id           BIGINT         NOT NULL
                                      REFERENCES tutors(id) ON DELETE CASCADE,
    teaching_mode      VARCHAR(20)    NOT NULL,
    price_per_session  DECIMAL(12, 0) NOT NULL,
    program            VARCHAR(100),

    CONSTRAINT chk_tutor_prices_teaching_mode CHECK (
        teaching_mode IN ('ONLINE', 'AT_HOME')
    ),
    CONSTRAINT chk_tutor_prices_price_positive CHECK (
        price_per_session > 0
    )
);

CREATE INDEX idx_tutor_prices_tutor_id      ON tutor_prices(tutor_id);
CREATE INDEX idx_tutor_prices_teaching_mode ON tutor_prices(teaching_mode);

-- -----------------------------------------------------------------------------
-- 7. BẢNG tutor_availabilities — Lịch rảnh tham khảo (thứ, ca)
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_availabilities (
    id           BIGSERIAL    PRIMARY KEY,
    tutor_id     BIGINT       NOT NULL
                              REFERENCES tutors(id) ON DELETE CASCADE,
    day_of_week  SMALLINT     NOT NULL,
    time_slot    VARCHAR(20)  NOT NULL,

    CONSTRAINT chk_tutor_availabilities_day CHECK (
        day_of_week BETWEEN 1 AND 7
    ),
    CONSTRAINT chk_tutor_availabilities_slot CHECK (
        time_slot IN ('MORNING', 'AFTERNOON', 'EVENING')
    ),
    CONSTRAINT uq_tutor_availabilities UNIQUE (tutor_id, day_of_week, time_slot)
);

CREATE INDEX idx_tutor_availabilities_tutor_id ON tutor_availabilities(tutor_id);

-- -----------------------------------------------------------------------------
-- 8. BẢNG tutor_specialties — Chuyên môn giảng dạy theo cấp lớp/chương trình
-- -----------------------------------------------------------------------------
CREATE TABLE tutor_specialties (
    id             BIGSERIAL     PRIMARY KEY,
    tutor_id       BIGINT        NOT NULL
                                 REFERENCES tutors(id) ON DELETE CASCADE,
    specialty      VARCHAR(100)  NOT NULL,
    grade_level    VARCHAR(50),
    credential_id  BIGINT        REFERENCES tutor_credentials(id) ON DELETE SET NULL,
    is_verified    BOOLEAN       NOT NULL DEFAULT FALSE,
    verified_by    BIGINT        REFERENCES users(id),
    verified_at    TIMESTAMPTZ
);

CREATE INDEX idx_tutor_specialties_tutor_id      ON tutor_specialties(tutor_id);
CREATE INDEX idx_tutor_specialties_credential_id ON tutor_specialties(credential_id);
CREATE INDEX idx_tutor_specialties_is_verified   ON tutor_specialties(is_verified);
CREATE INDEX idx_tutor_specialties_verified_by   ON tutor_specialties(verified_by);
CREATE INDEX idx_tutor_specialties_search        ON tutor_specialties(specialty, grade_level);