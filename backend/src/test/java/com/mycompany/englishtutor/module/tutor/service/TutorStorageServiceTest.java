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
import com.mycompany.englishtutor.module.tutor.domain.StorageTier;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.StorageTierRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;

/**
 * Widget gói lưu trữ (V30): đọc quota từ catalog {@code storage_tiers} + dung lượng đã dùng thật.
 * Quota là dữ liệu DB (entity catalog), không hardcode — test mock repo catalog.
 */
@ExtendWith(MockitoExtension.class)
class TutorStorageServiceTest {

    private static final Long TUTOR_ID = 10L;
    private static final long GB = 1024L * 1024 * 1024;

    @Mock
    UserRepository userRepository;
    @Mock
    TutorRepository tutorRepository;
    @Mock
    StorageTierRepository storageTierRepository;
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
                .thenReturn(Optional.of(Tutor.builder().id(TUTOR_ID).build())); // storageTierId default = 1 (FREE)
        when(storageTierRepository.findById(1L)).thenReturn(Optional.of(tier(1L, "FREE", 1L * GB, true, false)));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(500_000L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        assertThat(response.tier()).isEqualTo("FREE");
        assertThat(response.quotaBytes()).isEqualTo(1L * GB);
        assertThat(response.effectiveQuotaBytes()).isEqualTo(1L * GB);
        assertThat(response.usedBytes()).isEqualTo(500_000L);
        assertThat(response.tierExpiresAt()).isNull();
        verify(classroomRepository).sumTutorMaterialBytes(TUTOR_ID);
    }

    @Test
    void getMyStorage_expiredProTier_effectiveQuotaDropsToFree() {
        when(tutorRepository.findDetailById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .id(TUTOR_ID)
                        .storageTierId(2L)
                        .storageTierExpiresAt(OffsetDateTime.now().minusDays(1))
                        .build()));
        when(storageTierRepository.findById(2L)).thenReturn(Optional.of(tier(2L, "PRO", 10L * GB, false, true)));
        when(storageTierRepository.findByIsDefaultTrue())
                .thenReturn(Optional.of(tier(1L, "FREE", 1L * GB, true, false)));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(0L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        // PRO hết hạn → quota hiệu lực hạ về FREE, quota gốc vẫn báo PRO (10 GB).
        assertThat(response.tier()).isEqualTo("PRO");
        assertThat(response.quotaBytes()).isEqualTo(10L * GB);
        assertThat(response.effectiveQuotaBytes()).isEqualTo(1L * GB);
    }

    @Test
    void getMyStorage_activePremiumTier_keepsPremiumEffectiveQuota() {
        when(tutorRepository.findDetailById(TUTOR_ID))
                .thenReturn(Optional.of(Tutor.builder()
                        .id(TUTOR_ID)
                        .storageTierId(3L)
                        .storageTierExpiresAt(OffsetDateTime.now().plusMonths(2))
                        .build()));
        when(storageTierRepository.findById(3L))
                .thenReturn(Optional.of(tier(3L, "PREMIUM", 50L * GB, false, true)));
        when(classroomRepository.sumTutorMaterialBytes(TUTOR_ID)).thenReturn(1L);

        TutorStorageResponse response = tutorStorageService.getMyStorage();

        assertThat(response.tier()).isEqualTo("PREMIUM");
        assertThat(response.effectiveQuotaBytes()).isEqualTo(50L * GB);
    }

    /** Entity catalog giả lập (quota là dữ liệu DB trong test). */
    private static StorageTier tier(Long id, String code, long quotaBytes, boolean isDefault, boolean isPaid) {
        return StorageTier.builder()
                .id(id)
                .code(code)
                .name(code)
                .quotaBytes(quotaBytes)
                .isDefault(isDefault)
                .isPaid(isPaid)
                .build();
    }
}
