package com.mycompany.englishtutor.module.complaint.repository;

import java.util.Collection;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mycompany.englishtutor.module.complaint.domain.Refund;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;

import jakarta.persistence.LockModeType;

public interface RefundRepository extends JpaRepository<Refund, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Refund r WHERE r.id = :id")
    Optional<Refund> findByIdForUpdate(@Param("id") Long id);

    boolean existsByComplaintIdAndStatusIn(Long complaintId, Collection<RefundStatus> statuses);
}
