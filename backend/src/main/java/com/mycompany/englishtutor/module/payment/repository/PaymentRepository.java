package com.mycompany.englishtutor.module.payment.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;

import jakarta.persistence.LockModeType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findFirstByClassIdAndPayerType(Long classId, PayerType payerType);

    /** Bản nháp (V11): 1 payment NEW cho mỗi lớp, tạo khi ghép lớp TRIAL. */
    Optional<Payment> findFirstByClassIdAndPayerTypeAndStatus(Long classId, PayerType payerType, PaymentStatus status);

    /** Khóa dòng khi chi hoàn tiền để tổng đã hoàn không vượt số đã thu (ERD C-10). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Payment p WHERE p.id = :id")
    Optional<Payment> findByIdForUpdate(@Param("id") Long id);
}
