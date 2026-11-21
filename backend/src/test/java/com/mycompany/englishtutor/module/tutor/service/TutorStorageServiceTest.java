package com.mycompany.englishtutor.module.tutor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import com.mycompany.englishtutor.module.classroom.repository.ClassroomQueryRepository;
import com.mycompany.englishtutor.module.tutor.api.response.TutorStorageResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.enums.StorageTier;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;

/**
 * Widget gói lưu trữ (V29): đọc quota gói + dung lượng đã dùng thật.
 */
@ExtendWith(MockitoExtension.class)
class TutorStorageServiceTest {

    private static final Long TUTOR_ID = 10L;

    @Mock
    UserRepository userRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    ClassroomQueryRepository classroomRepository;
    @InjectMocks
    TutorStorageService tutorStorageService;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("giasu01", null, List.of()));
        when(userRepository.findByUsername(anyString()))
                .thenReturn(Optional.of(User.builder().id(TUTOR_ID).username("giasu01").build()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getMyStorage_freeTier_reportsUsedAndQuota() {
        when(tutorRepository.findDetailById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder().id(TUTOR_ID).build()));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(500_000L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        assertThat(response.tier()).isEqualTo("FREE");
        assertThat(response.quotaBytes()).isEqualTo(StorageTier.FREE.quotaBytes());
        assertThat(response.effectiveQuotaBytes()).isEqualTo(StorageTier.FREE.quotaBytes());
        assertThat(response.usedBytes()).isEqualTo(500_000L);
        assertThat(response.tierExpiresAt()).isNull();
        verify(classroomRepository).sumTutorMaterialBytes(TUTOR_ID);
    }

    @Test
    void getMyStorage_expiredProTier_effectiveQuotaDropsToFree() {
        when(tutorRepository.findDetailById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .id(TUTOR_ID)
                        .storageTier("PRO")
                        .storageTierExpiresAt(OffsetDateTime.now().minusDays(1))
                        .build()));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(0L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        // PRO hết hạn → quota hiệu lực hạ về FREE, quota gốc vẫn báo PRO.
        assertThat(response.tier()).isEqualTo("PRO");
        assertThat(response.quotaBytes()).isEqualTo(StorageTier.PRO.quotaBytes());
        assertThat(response.effectiveQuotaBytes()).isEqualTo(StorageTier.FREE.quotaBytes());
    }

    @Test
    void getMyStorage_activePremiumTier_keepsPremiumEffectiveQuota() {
        when(tutorRepository.findDetailById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .id(TUTOR_ID)
                        .storageTier("PREMIUM")
                        .storageTierExpiresAt(OffsetDateTime.now().plusMonths(2))
                        .build()));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(1L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        assertThat(response.tier()).isEqualTo("PREMIUM");
        assertThat(response.effectiveQuotaBytes()).isEqualTo(StorageTier.PREMIUM.quotaBytes());
    }
}
