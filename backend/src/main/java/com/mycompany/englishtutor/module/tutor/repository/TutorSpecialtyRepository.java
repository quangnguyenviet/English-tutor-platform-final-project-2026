package com.mycompany.englishtutor.module.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.TutorSpecialty;

import java.util.List;

@Repository
public interface TutorSpecialtyRepository extends JpaRepository<TutorSpecialty, Long> {
    List<TutorSpecialty> findByTutorId(Long tutorId);

    void deleteByTutorId(Long tutorId);
}
