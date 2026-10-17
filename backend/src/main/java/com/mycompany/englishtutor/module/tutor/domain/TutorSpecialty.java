package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.OffsetDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor_specialties")
public class TutorSpecialty {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    @Column(nullable = false, length = 100)
    String specialty;

    @Column(name = "grade_level", length = 50)
    String gradeLevel;

    @Column(name = "credential_id")
    Long credentialId;

    @Column(name = "is_verified", nullable = false)
    Boolean isVerified;

    @Column(name = "verified_by")
    Long verifiedBy;

    @Column(name = "verified_at")
    OffsetDateTime verifiedAt;
}
