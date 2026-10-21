package com.mycompany.englishtutor.module.tutor.service;

import java.util.List;

import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.Tutor;
import com.mycompany.englishtutor.module.tutor.domain.TutorAvailability;
import com.mycompany.englishtutor.module.tutor.domain.TutorCredential;
import com.mycompany.englishtutor.module.tutor.domain.TutorPrice;
import com.mycompany.englishtutor.module.tutor.domain.TutorServiceArea;
import com.mycompany.englishtutor.module.tutor.domain.TutorSpecialty;
import com.mycompany.englishtutor.module.tutor.repository.TutorAvailabilityRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorCredentialRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorPriceRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorServiceAreaRepository;
import com.mycompany.englishtutor.module.tutor.repository.TutorSpecialtyRepository;
import com.mycompany.englishtutor.module.user.domain.User;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Chuyển {@link Tutor} + {@link User} sang {@link TutorProfileResponse}.
 *
 * <p>Tách khỏi service để dùng chung cho cả luồng tự phục vụ của gia sư
 * ({@link TutorProfileService}) và luồng duyệt/từ chối của lễ tân/admin
 * ({@link AdminTutorService}) — đảm bảo hai luồng luôn trả về cùng một cấu trúc.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorProfileMapper {

    TutorServiceAreaRepository tutorServiceAreaRepository;
    TutorSpecialtyRepository tutorSpecialtyRepository;
    TutorPriceRepository tutorPriceRepository;
    TutorAvailabilityRepository tutorAvailabilityRepository;
    TutorCredentialRepository tutorCredentialRepository;

    /**
     * Chuyển {@link Tutor} + {@link User} sang {@link TutorPendingSummaryResponse}
     * — bản rút gọn cho danh sách hồ sơ chờ duyệt.
     *
     * <p>Không đọc 5 bảng con (khu vực dạy, chuyên môn, học phí, lịch rảnh,
     * chứng chỉ) nên payload nhẹ và không sinh N+1 query.
     */
    public TutorPendingSummaryResponse mapToSummary(User user, Tutor tutor) {
        return TutorPendingSummaryResponse.builder()
                .tutorId(tutor.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .university(tutor.getUniversity())
                .educationStatus(tutor.getEducationStatus())
                .experienceYears(
                        tutor.getExperienceYears() != null ? tutor.getExperienceYears().intValue() : null)
                .profileStatus(tutor.getProfileStatus())
                .submittedAt(tutor.getSubmittedAt())
                .updatedAt(tutor.getUpdatedAt())
                .build();
    }

    public TutorProfileResponse mapToResponse(User user, Tutor tutor) {
        List<TutorServiceArea> serviceAreas = tutorServiceAreaRepository.findByTutorId(tutor.getId());
        List<TutorSpecialty> specialties = tutorSpecialtyRepository.findByTutorId(tutor.getId());
        List<TutorPrice> prices = tutorPriceRepository.findByTutorId(tutor.getId());
        List<TutorAvailability> availabilities = tutorAvailabilityRepository.findByTutorId(tutor.getId());
        List<TutorCredential> credentials = tutorCredentialRepository.findByTutorId(tutor.getId());

        return TutorProfileResponse.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .dateOfBirth(user.getDateOfBirth() != null ? user.getDateOfBirth().toString() : null)
                .gender(user.getGender())
                .phone(user.getPhone())
                .avatarUrl(user.getAvatarUrl())
                .tutorId(tutor.getId())
                .address(tutor.getAddress())
                .hometown(tutor.getHometown())
                .university(tutor.getUniversity())
                .educationStatus(tutor.getEducationStatus())
                .experienceYears(
                        tutor.getExperienceYears() != null ? tutor.getExperienceYears().intValue() : null)
                .bio(tutor.getBio())
                .videoUrl(tutor.getVideoUrl())
                .profileStatus(tutor.getProfileStatus())
                .rejectionReason(tutor.getRejectionReason())
                .submittedAt(tutor.getSubmittedAt())
                .reviewedAt(tutor.getReviewedAt())
                .updatedAt(tutor.getUpdatedAt())
                .serviceAreas(serviceAreas.stream()
                        .map(s -> TutorProfileResponse.ServiceAreaResponse.builder()
                                .id(s.getId())
                                .province(s.getProvince())
                                .district(s.getDistrict())
                                .build())
                        .toList())
                .specialties(specialties.stream()
                        .map(s -> TutorProfileResponse.SpecialtyResponse.builder()
                                .id(s.getId())
                                .specialty(s.getSpecialty())
                                .gradeLevel(s.getGradeLevel())
                                .build())
                        .toList())
                .prices(prices.stream()
                        .map(p -> TutorProfileResponse.PriceResponse.builder()
                                .id(p.getId())
                                .teachingMode(p.getTeachingMode().name())
                                .pricePerSession(p.getPricePerSession())
                                .program(p.getProgram())
                                .build())
                        .toList())
                .availabilities(availabilities.stream()
                        .map(a -> TutorProfileResponse.AvailabilityResponse.builder()
                                .id(a.getId())
                                .dayOfWeek(
                                        a.getDayOfWeek() != null ? a.getDayOfWeek().intValue() : null)
                                .timeSlot(a.getTimeSlot().name())
                                .build())
                        .toList())
                .credentials(credentials.stream()
                        .map(c -> TutorProfileResponse.CredentialResponse.builder()
                                .id(c.getId())
                                .title(c.getTitle())
                                .type(c.getType())
                                .score(c.getScore())
                                .fileUrl(c.getFileUrl())
                                .build())
                        .toList())
                .build();
    }
}
