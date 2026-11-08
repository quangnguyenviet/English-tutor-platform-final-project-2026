package com.mycompany.englishtutor.module.complaint.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mycompany.englishtutor.module.complaint.domain.Complaint;

import jakarta.persistence.LockModeType;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Complaint c WHERE c.id = :id")
    Optional<Complaint> findByIdForUpdate(@Param("id") Long id);
}
