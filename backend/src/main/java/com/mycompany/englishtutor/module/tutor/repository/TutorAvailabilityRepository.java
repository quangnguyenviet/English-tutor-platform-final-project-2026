package com.mycompany.englishtutor.module.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.TutorAvailability;

import java.util.List;

@Repository
public interface TutorAvailabilityRepository extends JpaRepository<TutorAvailability, Long> {
    List<TutorAvailability> findByTutorId(Long tutorId);

    List<TutorAvailability> findByTutorIdIn(java.util.Collection<Long> tutorIds);

    void deleteByTutorId(Long tutorId);
}
