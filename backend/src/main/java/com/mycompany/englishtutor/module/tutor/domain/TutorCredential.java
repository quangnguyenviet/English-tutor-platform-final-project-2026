package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor_credentials")
public class TutorCredential {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    @Column(name = "credential_type", nullable = false, length = 20)
    String type;

    @Column(nullable = false, length = 200)
    String title;

    @Column(name = "score", length = 20)
    String score;

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(name = "issued_at")
    LocalDate issuedAt;

    @Column(name = "file_url", nullable = false, length = 500)
    String fileUrl;

    @Column(name = "is_verified", nullable = false)
    Boolean isVerified;

    @Column(name = "verified_by")
    Long verifiedBy;

    @Column(name = "verified_at")
    OffsetDateTime verifiedAt;

    @Column(name = "created_at", nullable = false, insertable = false)
    OffsetDateTime createdAt;
}
