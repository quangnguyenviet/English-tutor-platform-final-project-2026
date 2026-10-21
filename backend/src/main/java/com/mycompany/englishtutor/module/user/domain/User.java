package com.mycompany.englishtutor.module.user.domain;

import jakarta.persistence.*;

import org.hibernate.annotations.ColumnDefault;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true, length = 50)
    String username;

    @Column(name = "password_hash", nullable = false, length = 255)
    String passwordHash;

    @Column(name = "full_name", nullable = false, length = 100)
    String fullName;

    @Column(length = 100, unique = true)
    String email;

    @Column(length = 15, unique = true)
    String phone;

    @Column(name = "date_of_birth")
    java.time.LocalDate dateOfBirth;

    @Column(length = 10)
    String gender;

    @Column(name = "avatar_url", length = 500)
    String avatarUrl;

    @Column(nullable = false, length = 20)
    String role;

    @Column(nullable = false, length = 20)
    String status;

    @Column(name = "must_change_password", nullable = false)
    boolean mustChangePassword;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    @ColumnDefault("NOW()")
    java.time.OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    @ColumnDefault("NOW()")
    java.time.OffsetDateTime updatedAt;
}
