package com.mycompany.englishtutor.module.audit.domain;

import java.time.OffsetDateTime;

import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "audit_logs")
public class AuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "user_id", nullable = false)
    Long userId;

    @Column(nullable = false, length = 50)
    String action;

    @Column(name = "entity_type", nullable = false, length = 30)
    String entityType;

    @Column(name = "entity_id", nullable = false)
    Long entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    String details;

    @Column(name = "ip_address", length = 45)
    String ipAddress;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    @ColumnDefault("NOW()")
    OffsetDateTime createdAt;
}
