package com.mycompany.englishtutor.module.tutor.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.tutor.domain.TutorCredential;

import java.util.List;

@Repository
public interface TutorCredentialRepository extends JpaRepository<TutorCredential, Long> {
    List<TutorCredential> findByTutorId(Long tutorId);

    void deleteByTutorId(Long tutorId);
}
