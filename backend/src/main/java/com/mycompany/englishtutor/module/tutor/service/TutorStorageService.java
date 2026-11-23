package com.mycompany.englishtutor.module.tutor.service;

import java.time.OffsetDateTime;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.tutor.api.response.TutorStorageResponse;
import com.mycompany.englishtutor.module.tutor.domain.StorageTier;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.StorageTierRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Widget dashboard gia sư (V30): đọc gói lưu trữ + dung lượng đã dùng thật.
 * Quota đọc từ catalog {@code storage_tiers}; gói trả phí (is_paid) hết hạn tự hạ về
 * gói mặc định (FREE) — không ghi gì vào DB.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class TutorStorageService {

    UserRepository userRepository;
    TutorRepository tutorRepository;
    StorageTierRepository storageTierRepository;
    ClassroomQueryRepository classroomRepository;

    @Transactional(readOnly = true)
    public TutorStorageResponse getMyStorage() {
        Long userId = currentUserId();
        Tutor tutor = tutorRepository.findDetailById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        StorageTier tier = storageTierRepository.findById(tutor.getStorageTierId())
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_STORAGE_TIER_NOT_FOUND));

        OffsetDateTime now = OffsetDateTime.now();
        boolean expired = Boolean.TRUE.equals(tier.getIsPaid())
                && tutor.getStorageTierExpiresAt() != null
                && !now.isBefore(tutor.getStorageTierExpiresAt());
        StorageTier effective = expired
                ? storageTierRepository.findByIsDefaultTrue()
                        .orElseThrow(() -> new AppException(ErrorCode.TUTOR_STORAGE_TIER_NOT_FOUND))
                : tier;

        long used = classroomRepository.sumTutorMaterialBytes(userId);
        return new TutorStorageResponse(
                tier.getCode(),
                tutor.getStorageTierExpiresAt(),
                tier.getQuotaBytes(),
                effective.getQuotaBytes(),
                used);
    }

    private Long currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}
