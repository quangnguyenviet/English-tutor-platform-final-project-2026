package com.mycompany.englishtutor.module.tutor.service;

import java.time.OffsetDateTime;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.tutor.api.response.TutorStorageResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.StorageTier;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Widget dashboard gia sư (V29): đọc gói lưu trữ + dung lượng đã dùng thật.
 * Không ghi gì vào DB — chỉ đọc {@code tutors.storage_tier} và
 * {@code SUM(lesson_materials.file_size)} để vẽ thanh tiến độ.
 */
@Service
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class TutorStorageService {

    UserRepository userRepository;
    TutorRepository tutorRepository;
    ClassroomQueryRepository classroomRepository;

    @Transactional(readOnly = true)
    public TutorStorageResponse getMyStorage() {
        Long userId = currentUserId();
        Tutor tutor = tutorRepository.findDetailById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        OffsetDateTime now = OffsetDateTime.now();
        String tier = tutor.getStorageTier();
        long used = classroomRepository.sumTutorMaterialBytes(userId);
        long effective = StorageTier.effective(tier, tutor.getStorageTierExpiresAt(), now).quotaBytes();
        return new TutorStorageResponse(
                tier, tutor.getStorageTierExpiresAt(),
                StorageTier.valueOf(tier).quotaBytes(), effective, used);
    }

    private Long currentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        User user = userRepository.findByUsername(authentication.getName())
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }
}
