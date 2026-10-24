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

import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileRejectRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.repository.TutorRepository;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Unit test cho luồng duyệt / từ chối hồ sơ gia sư của lễ tân & quản trị viên.
 */
@ExtendWith(MockitoExtension.class)
class AdminTutorServiceTest {

    private static final String REVIEWER_USERNAME = "letan01";
    private static final Long REVIEWER_ID = 99L;
    private static final Long TUTOR_ID = 1L;

    @Mock
    UserRepository userRepository;

    @Mock
    TutorRepository tutorRepository;

    @Mock
    TutorProfileMapper tutorProfileMapper;

    @Mock
    com.mycompany.englishtutor.module.audit.service.AuditLogService auditLogService;

    @InjectMocks
    AdminTutorService adminTutorService;

    User reviewer;
    User tutorUser;
    Tutor tutor;

    @BeforeEach
    void setUp() {
        reviewer = User.builder()
                .id(REVIEWER_ID)
                .username(REVIEWER_USERNAME)
                .fullName("Lê Thị Lễ Tân")
                .role("RECEPTIONIST")
                .status("ACTIVE")
                .build();

        tutorUser = User.builder()
                .id(TUTOR_ID)
                .username("giasu01")
                .fullName("Nguyễn Văn An")
                .email("giasu01@example.com")
                .role("TUTOR")
                .status("ACTIVE")
                .build();

        tutor = Tutor.builder()
                .id(TUTOR_ID)
                .user(tutorUser)
                .profileStatus("PENDING")
                .build();

        SecurityContextHolder.getContext()
                .setAuthentication(new UsernamePasswordAuthenticationToken(REVIEWER_USERNAME, null, List.of()));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    // ------------------------------------------------------------------ approve

    @Test
    void approve_pendingProfile_activatesProfileAndRecordsReviewer() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorRepository.save(any(Tutor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tutorProfileMapper.mapToResponse(any(User.class), any(Tutor.class)))
                .thenReturn(TutorProfileResponse.builder()
                        .tutorId(TUTOR_ID)
                        .profileStatus("ACTIVE")
                        .build());

        // WHEN
        var response = adminTutorService.approve(TUTOR_ID);

        // THEN
        assertThat(tutor.getProfileStatus()).isEqualTo("ACTIVE");
        assertThat(tutor.getRejectionReason()).isNull();
        assertThat(tutor.getReviewedBy()).isEqualTo(REVIEWER_ID);
        assertThat(tutor.getReviewedAt()).isNotNull();
        assertThat(response.getProfileStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void approve_activeProfile_throwsNotFoundPending() {
        // GIVEN
        tutor.setProfileStatus("ACTIVE");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));

        // WHEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.approve(TUTOR_ID));

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_NOT_PENDING);
        assertThat(tutor.getProfileStatus()).isEqualTo("ACTIVE");
    }

    @Test
    void approve_unknownTutor_throwsProfileNotFound() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.empty());

        // WHEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.approve(TUTOR_ID));

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_NOT_FOUND);
    }

    // ------------------------------------------------------------------- reject

    @Test
    void reject_pendingProfile_storesTrimmedReasonAndReviewer() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorRepository.save(any(Tutor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tutorProfileMapper.mapToResponse(any(User.class), any(Tutor.class)))
                .thenReturn(TutorProfileResponse.builder()
                        .tutorId(TUTOR_ID)
                        .profileStatus("REJECTED")
                        .rejectionReason("Thiếu ảnh bằng cấp")
                        .build());

        var request = TutorProfileRejectRequest.builder()
                .rejectionReason("  Thiếu ảnh bằng cấp  ")
                .build();

        // WHEN
        var response = adminTutorService.reject(TUTOR_ID, request);

        // THEN
        assertThat(tutor.getProfileStatus()).isEqualTo("REJECTED");
        assertThat(tutor.getRejectionReason()).isEqualTo("Thiếu ảnh bằng cấp");
        assertThat(tutor.getReviewedBy()).isEqualTo(REVIEWER_ID);
        assertThat(tutor.getReviewedAt()).isNotNull();
        assertThat(response.getProfileStatus()).isEqualTo("REJECTED");
    }

    @Test
    void reject_incompleteProfile_throwsNotFoundPending() {
        // GIVEN
        tutor.setProfileStatus("INCOMPLETE");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));

        var request = TutorProfileRejectRequest.builder()
                .rejectionReason("Hồ sơ chưa đầy đủ")
                .build();

        // WHEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.reject(TUTOR_ID, request));

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_NOT_PENDING);
        assertThat(tutor.getProfileStatus()).isEqualTo("INCOMPLETE");
        assertThat(tutor.getRejectionReason()).isNull();
    }

    // ------------------------------------------------------------------- pending

    @Test
    void getPendingProfiles_returnsMappedSummaries() {
        // GIVEN
        TutorPendingSummaryResponse mapped = TutorPendingSummaryResponse.builder()
                .tutorId(TUTOR_ID)
                .fullName("Nguyễn Văn An")
                .profileStatus("PENDING")
                .build();

        when(tutorRepository.findPendingByProfileStatus("PENDING"))
                .thenReturn(List.of(tutor));
        when(tutorProfileMapper.mapToSummary(tutorUser, tutor)).thenReturn(mapped);

        // WHEN
        var result = adminTutorService.getPendingProfiles();

        // THEN
        assertThat(result).containsExactly(mapped);
    }

    @Test
    void getPendingProfiles_noPending_returnsEmptyList() {
        // GIVEN
        when(tutorRepository.findPendingByProfileStatus("PENDING"))
                .thenReturn(List.of());

        // WHEN
        var result = adminTutorService.getPendingProfiles();

        // THEN
        assertThat(result).isEmpty();
    }

    // ------------------------------------------------------------------ detail

    @Test
    void getProfileDetail_existingProfile_returnsFullDetail() {
        // GIVEN
        TutorProfileResponse mapped = TutorProfileResponse.builder()
                .tutorId(TUTOR_ID)
                .profileStatus("PENDING")
                .build();

        when(tutorRepository.findDetailById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorProfileMapper.mapToResponse(tutorUser, tutor)).thenReturn(mapped);

        // WHEN
        var result = adminTutorService.getProfileDetail(TUTOR_ID);

        // THEN
        assertThat(result).isSameAs(mapped);
    }

    @Test
    void getProfileDetail_unknownTutor_throwsProfileNotFound() {
        // GIVEN
        when(tutorRepository.findDetailById(TUTOR_ID)).thenReturn(Optional.empty());

        // WHEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.getProfileDetail(TUTOR_ID));

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.TUTOR_PROFILE_NOT_FOUND);
    }

    // ------------------------------------------------------------------ reviewer

    @Test
    void approve_reviewerNotInDatabase_throwsUserNotExisted() {
        // GIVEN
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.empty());

        // WHEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.approve(TUTOR_ID));

        // THEN
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.USER_NOT_EXISTED);
    }

    @Test
    void updateStatus_activeToInactive_success() {
        // GIVEN
        tutor.setProfileStatus("ACTIVE");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));
        when(tutorProfileMapper.mapToResponse(any(), any())).thenReturn(TutorProfileResponse.builder().profileStatus("INACTIVE").build());

        var req = com.mycompany.englishtutor.module.tutor.api.request.TutorStatusUpdateRequest.builder()
                .status("INACTIVE")
                .note("Gia sư bận việc cá nhân")
                .build();

        // WHEN
        var response = adminTutorService.updateStatus(TUTOR_ID, req);

        // THEN
        assertThat(response.getProfileStatus()).isEqualTo("INACTIVE");
        assertThat(tutor.getProfileStatus()).isEqualTo("INACTIVE");
    }

    @Test
    void updateStatus_invalidTransition_throwsConflict() {
        // GIVEN: đang ở PENDING mà cố tình gọi updateStatus sang INACTIVE
        tutor.setProfileStatus("PENDING");
        when(userRepository.findByUsername(anyString())).thenReturn(Optional.of(reviewer));
        when(tutorRepository.findById(TUTOR_ID)).thenReturn(Optional.of(tutor));

        var req = com.mycompany.englishtutor.module.tutor.api.request.TutorStatusUpdateRequest.builder()
                .status("INACTIVE")
                .build();

        // WHEN & THEN
        var exception = assertThrows(AppException.class, () -> adminTutorService.updateStatus(TUTOR_ID, req));
        assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.INVALID_STATUS_TRANSITION);
    }
}

