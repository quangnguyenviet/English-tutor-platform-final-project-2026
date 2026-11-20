package com.mycompany.englishtutor.module.auth.domain;

import java.time.OffsetDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import org.hibernate.annotations.ColumnDefault;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(
        name = "oauth_accounts",
        uniqueConstraints = {
            @UniqueConstraint(name = "uq_oauth_accounts_user", columnNames = "user_id"),
            @UniqueConstraint(name = "uq_oauth_accounts_provider_user", columnNames = {"provider", "provider_user_id"})
        })
public class OAuthAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    Long userId;

    @Column(nullable = false, length = 20)
    String provider;

    @Column(name = "provider_user_id", nullable = false, length = 255)
    String providerUserId;

    @Column(length = 255)
    String email;

    @Column(name = "avatar_url", length = 500)
    String avatarUrl;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    @ColumnDefault("NOW()")
    OffsetDateTime createdAt;
}
