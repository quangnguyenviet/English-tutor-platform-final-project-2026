package com.mycompany.englishtutor.module.payment.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mycompany.englishtutor.module.payment.domain.Payment;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;

public interface PaymentRepository extends JpaRepository<Payment, Long> {
    Optional<Payment> findFirstByClassIdAndPayerType(Long classId, PayerType payerType);

    /** Bản nháp (V11): 1 payment NEW cho mỗi lớp, tạo khi ghép lớp TRIAL. */
    Optional<Payment> findFirstByClassIdAndPayerTypeAndStatus(Long classId, PayerType payerType, PaymentStatus status);
}
