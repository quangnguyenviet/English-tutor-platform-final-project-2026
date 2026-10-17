package com.mycompany.englishtutor.module.tutor.domain;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

import com.mycompany.englishtutor.module.tutor.domain.enums.TeachingMode;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@Entity
@Table(name = "tutor_prices")
public class TutorPrice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tutor_id", nullable = false)
    Tutor tutor;

    @Enumerated(EnumType.STRING)
    @Column(name = "teaching_mode", nullable = false, length = 20)
    TeachingMode teachingMode;

    @Column(name = "price_per_session", nullable = false, columnDefinition = "numeric(12,2)")
    Integer pricePerSession;

    @Column(name = "program", length = 100)
    String program;
}
