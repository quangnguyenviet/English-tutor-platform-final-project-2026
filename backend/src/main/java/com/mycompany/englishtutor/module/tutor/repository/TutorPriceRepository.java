package com.mycompany.englishtutor.module.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.TutorPrice;

import java.util.List;

@Repository
public interface TutorPriceRepository extends JpaRepository<TutorPrice, Long> {
    List<TutorPrice> findByTutorId(Long tutorId);

    List<TutorPrice> findByTutorIdIn(java.util.Collection<Long> tutorIds);

    void deleteByTutorId(Long tutorId);
}
