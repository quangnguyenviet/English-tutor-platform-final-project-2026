-- MSG-02: tài khoản phụ huynh đăng nhập duy nhất bằng Google OAuth.
ALTER TABLE users DROP CONSTRAINT chk_users_role;
ALTER TABLE users
    ADD CONSTRAINT chk_users_role CHECK (
        role IN ('ADMIN', 'RECEPTIONIST', 'ACCOUNTANT', 'TUTOR', 'STUDENT', 'PARENT')
    );

ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email TYPE VARCHAR(255);

ALTER TABLE parents ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE parents
    ADD COLUMN user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE oauth_accounts (
    id               BIGSERIAL    PRIMARY KEY,
    user_id          BIGINT       NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    provider         VARCHAR(20)  NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    email            VARCHAR(255),
    avatar_url       VARCHAR(500),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_oauth_accounts_provider CHECK (provider IN ('GOOGLE')),
    CONSTRAINT uq_oauth_accounts_provider_user UNIQUE (provider, provider_user_id)
);

CREATE INDEX idx_oauth_accounts_email ON oauth_accounts(email);
