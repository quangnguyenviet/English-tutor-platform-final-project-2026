package com.mycompany.englishtutor.module.tutor.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

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

import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorAvailabilityRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorCredentialRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorPriceRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorServiceAreaRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorSpecialtyRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Unit test cho luồng gia sư tự gửi duyệt hồ sơ.
 */
@ExtendWith(MockitoExtension.class)
class TutorProfileServiceTest {

    private static final String TUTOR_USERNAME = "giasu01";
    private static final Long TUTOR_ID = 1L;

    @Mock
    UserRepository userRepository;

    @Mock
    TutorRepository tutorRepository;

    @Mock
    TutorCredentialRepository tutorCredentialRepository;

    @Mock
    TutorSpecialtyRepository tutorSpecialtyRepository;

    @Mock
    TutorPriceRepository tutorPriceRepository;

    @Mock
    TutorAvailabilityRepository tutorAvailabilityRepository;

    @Mock
    TutorServiceAreaRepository tutorServiceAreaRepository;

    @Mock
    StorageService storageService;

    @Mock
    TutorProfileMapper tutorProfileMapper;

    @InjectMocks
    TutorProfileService tutorProfileService;

    User tutorUser;
    Tutor tutor;

    @BeforeEach
    void setUp() {
        tutorUser = User.builder()
                .id(TUTOR_ID)
                .username(TUTOR_USERNAME)
                .fullName("Nguyễn Văn An")
                .email("giasu01@example.com")
                .role("TUTOR")
                .status("ACTIVE")
                .build();

        tutor = Tutor.builder()
                .id(TUTOR_ID)
                .user(tutorUser)
                .profileStatus("REJECTED")
                .rejectionReason("Thiếu ảnh bằng cấp")
                .reviewedBy(99L)
                .reviewedAt(java.time.OffsetDateTime.now().minusDays(3))
                .build();

        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(TUTOR_USERNAME, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ---------------------------------------------------------- submitForReview

    @Test
    void submitForReview_rejectedProfile_movesToPendingAndClearsRejectionReason() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(tutorUser));
        when(userRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorRepository.save(any(Tutor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tutorProfileMapper.mapToResponse(any(User.class), any(Tutor.class)))
                .thenReturn(TutorProfileResponse.builder()
                        .tutorId(TUTOR_ID)
                        .profileStatus("PENDING")
                        .build());

        // WHEN
        var response = tutorProfileService.submitForReview();

        // THEN
        assertThat(tutor.getProfileStatus()).isEqualTo("PENDING");
        assertThat(tutor.getRejectionReason()).isNull();
        assertThat(tutor.getReviewedBy()).isNull();
        assertThat(tutor.getReviewedAt()).isNull();
        assertThat(tutor.getSubmittedAt()).isNotNull();
        assertThat(response.getProfileStatus()).isEqualTo("PENDING");
    }

    @Test
    void submitForReview_incompleteProfile_setsSubmittedAt() {
        // GIVEN
        tutor.setProfileStatus("INCOMPLETE");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(tutorUser));
        when(userRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorRepository.save(any(Tutor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tutorProfileMapper.mapToResponse(any(User.class), any(Tutor.class)))
                .thenReturn(TutorProfileResponse.builder()
                        .tutorId(TUTOR_ID)
                        .profileStatus("PENDING")
                        .build());

        // WHEN
        tutorProfileService.submitForReview();

        // THEN
        assertThat(tutor.getProfileStatus()).isEqualTo("PENDING");
        assertThat(tutor.getSubmittedAt()).isNotNull();
    }

    @Test
    void submitForReview_pendingProfile_throwsAlreadySubmitted() {
        // GIVEN
        tutor.setProfileStatus("PENDING");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));

        // WHEN
        var exception = assertThrows(AppException.class, () -> tutorProfileService.submitForReview());

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_ALREADY_SUBMITTED);
        assertThat(tutor.getProfileStatus()).isEqualTo("PENDING");
    }

    @Test
    void submitForReview_activeProfile_throwsAlreadySubmitted() {
        // GIVEN
        tutor.setProfileStatus("ACTIVE");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));

        // WHEN
        var exception = assertThrows(AppException.class, () -> tutorProfileService.submitForReview());

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_ALREADY_SUBMITTED);
        assertThat(tutor.getProfileStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void submitForReview_unknownProfile_throwsProfileNotFound() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(tutorUser));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.empty());

        // WHEN
        var exception = assertThrows(AppException.class, () -> tutorProfileService.submitForReview());

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_NOT_FOUND);
    }
}
