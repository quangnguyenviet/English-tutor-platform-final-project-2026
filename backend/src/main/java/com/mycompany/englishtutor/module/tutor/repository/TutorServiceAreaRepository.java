package com.mycompany.englishtutor.module.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.TutorServiceArea;

import java.util.List;

@Repository
public interface TutorServiceAreaRepository extends JpaRepository<TutorServiceArea, Long> {
    List<TutorServiceArea> findByTutorId(Long tutorId);

    void deleteByTutorId(Long tutorId);
}
