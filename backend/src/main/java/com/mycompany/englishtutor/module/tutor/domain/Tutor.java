package com.mycompany.englishtutor.module.tutor.domain;

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
@Table(name = "tutors")
public class Tutor {
    @Id
    Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "id")
    com.mycompany.englishtutor.module.user.domain.User user;

    @Column(length = 500)
    String address;

    @Column(length = 200)
    String university;

    @Column(name = "education_status", length = 30)
    String educationStatus;

    @Column(name = "experience_years")
    Short experienceYears;

    @Column(columnDefinition = "TEXT")
    String bio;

    @Column(name = "video_url", length = 500)
    String videoUrl;

    @Column(name = "profile_status", nullable = false, length = 20)
    String profileStatus;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    String rejectionReason;

    @Column(name = "reviewed_by")
    Long reviewedBy;

    @Column(name = "reviewed_at")
    java.time.OffsetDateTime reviewedAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    java.time.OffsetDateTime updatedAt;
}
