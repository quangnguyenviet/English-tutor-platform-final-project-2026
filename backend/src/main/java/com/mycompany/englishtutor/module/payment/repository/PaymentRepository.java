package com.mycompany.englishtutor.module.payment.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findFirstByClassIdAndPayerType(Long classId, PayerType payerType);
}
