CREATE TABLE role (
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    CONSTRAINT pk_role PRIMARY KEY (name)
);

CREATE TABLE users (
    id VARCHAR(255) NOT NULL,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255),
    first_name VARCHAR(255),
    dob DATE,
    last_name VARCHAR(255),
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uk_users_username UNIQUE (username)
);

CREATE TABLE invalidated_token (
    id VARCHAR(255) NOT NULL,
    expiry_time TIMESTAMP(6),
    CONSTRAINT pk_invalidated_token PRIMARY KEY (id)
);

CREATE TABLE users_roles (
    user_id VARCHAR(255) NOT NULL,
    roles_name VARCHAR(255) NOT NULL,
    CONSTRAINT pk_users_roles PRIMARY KEY (user_id, roles_name),
    CONSTRAINT fk_users_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
    CONSTRAINT fk_users_roles_role FOREIGN KEY (roles_name) REFERENCES role (name)
);
