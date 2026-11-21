package com.mycompany.englishtutor.module.tutor.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mycompany.englishtutor.module.tutor.domain.TutorStorageSubscription;

/**
 * Lịch sử thuê bao gói lưu trữ (V29). Đọc theo gia sư (mới nhất trước) + ghi sự kiện
 * mỗi lần lễ tân cấp/gia hạn gói.
 */
public interface TutorStorageSubscriptionRepository extends JpaRepository<TutorStorageSubscription, Long> {

    List<TutorStorageSubscription> findByTutorIdOrderByGrantedAtDesc(Long tutorId);
}
