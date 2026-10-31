package com.mycompany.englishtutor.module.student.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.student.repository.StudentPortalRepository;

import lombok.RequiredArgsConstructor;

/**
 * Đánh dấu quiz quá hạn trong transaction riêng: nếu để chung với request đang ném {@code QUIZ_EXPIRED},
 * việc chuyển trạng thái sẽ bị rollback theo.
 */
@Service
@RequiredArgsConstructor
public class QuizExpiryService {

    private final StudentPortalRepository repository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void markExpired(Long quizId) {
        repository.markQuizExpired(quizId);
    }
}
