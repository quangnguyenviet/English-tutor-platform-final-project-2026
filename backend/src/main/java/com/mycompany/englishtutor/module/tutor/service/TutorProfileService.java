package com.mycompany.englishtutor.module.tutor.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mycompany.englishtutor.module.tutor.api.request.TutorProfileUpsertRequest;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.domain.*;
import com.mycompany.englishtutor.module.tutor.domain.enums.TeachingMode;
import com.mycompany.englishtutor.module.tutor.domain.enums.TimeSlot;
import com.mycompany.englishtutor.module.tutor.repository.*;
import com.mycompany.englishtutor.module.user.domain.User;
import com.mycompany.englishtutor.module.user.repository.UserRepository;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TutorProfileService {

    UserRepository userRepository;
    TutorRepository tutorRepository;
    TutorCredentialRepository tutorCredentialRepository;
    TutorSpecialtyRepository tutorSpecialtyRepository;
    TutorPriceRepository tutorPriceRepository;
    TutorAvailabilityRepository tutorAvailabilityRepository;
    TutorServiceAreaRepository tutorServiceAreaRepository;
    StorageService storageService;

    private Long getCurrentUserId() {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));
        return user.getId();
    }

    @Transactional(readOnly = true)
    public TutorProfileResponse getProfile() {
        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        Tutor tutor = tutorRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        return mapToResponse(user, tutor);
    }

    @Transactional
    public TutorProfileResponse upsertProfile(
            TutorProfileUpsertRequest request,
            MultipartFile avatarFile,
            List<MultipartFile> credentialFiles) {

        Long userId = getCurrentUserId();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        // Update user fields
        if (request.getFullName() != null) {
            user.setFullName(request.getFullName());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(request.getGender());
        }
        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        // Handle avatar upload
        if (avatarFile != null && !avatarFile.isEmpty()) {
            String avatarUrl = storageService.uploadFile("avatars", avatarFile);
            user.setAvatarUrl(avatarUrl);
        }

        userRepository.save(user);

        // Get or create tutor
        Tutor tutor = tutorRepository.findById(userId)
                .orElseGet(() -> {
                    Tutor newTutor = Tutor.builder()
                            .user(user)
                            .profileStatus("INCOMPLETE")
                            .build();
                    return tutorRepository.save(newTutor);
                });

        // Update tutor fields
        if (request.getAddress() != null) {
            tutor.setAddress(request.getAddress());
        }
        if (request.getHometown() != null) {
            tutor.setHometown(request.getHometown());
        }
        if (request.getUniversity() != null) {
            tutor.setUniversity(request.getUniversity());
        }
        if (request.getEducationStatus() != null) {
            tutor.setEducationStatus(request.getEducationStatus());
        }
        if (request.getExperienceYears() != null) {
            tutor.setExperienceYears(request.getExperienceYears().shortValue());
        }
        if (request.getBio() != null) {
            tutor.setBio(request.getBio());
        }
        if (request.getVideoUrl() != null) {
            tutor.setVideoUrl(request.getVideoUrl());
        }

        tutorRepository.save(tutor);

        // Update related entities (delete old, insert new)
        updateServiceAreas(tutor, request.getServiceAreas());
        updateSpecialties(tutor, request.getSpecialties());
        updatePrices(tutor, request.getPrices());
        updateAvailabilities(tutor, request.getAvailabilities());
        updateCredentials(tutor, request.getCredentials(), credentialFiles);

        log.info("Tutor profile upserted for userId: {}", userId);

        return mapToResponse(user, tutor);
    }

    @Transactional
    public TutorProfileResponse submitForReview() {
        Long userId = getCurrentUserId();

        Tutor tutor = tutorRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        if ("PENDING".equals(tutor.getProfileStatus()) || "ACTIVE".equals(tutor.getProfileStatus())) {
            throw new AppException(ErrorCode.TUTOR_PROFILE_ALREADY_SUBMITTED);
        }

        tutor.setProfileStatus("PENDING");
        tutorRepository.save(tutor);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_EXISTED));

        log.info("Tutor profile submitted for review, userId: {}", userId);

        return mapToResponse(user, tutor);
    }

    private void updateServiceAreas(Tutor tutor, List<TutorProfileUpsertRequest.ServiceAreaDto> dtos) {
        tutorServiceAreaRepository.deleteByTutorId(tutor.getId());

        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        List<TutorServiceArea> entities = new ArrayList<>();
        for (var dto : dtos) {
            entities.add(TutorServiceArea.builder()
                    .tutor(tutor)
                    .province(dto.getProvince())
                    .district(dto.getDistrict())
                    .build());
        }
        tutorServiceAreaRepository.saveAll(entities);
    }

    private void updateSpecialties(Tutor tutor, List<TutorProfileUpsertRequest.SpecialtyDto> dtos) {
        tutorSpecialtyRepository.deleteByTutorId(tutor.getId());

        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        List<TutorSpecialty> entities = new ArrayList<>();
        for (var dto : dtos) {
            entities.add(TutorSpecialty.builder()
                    .tutor(tutor)
                    .specialty(dto.getSpecialty())
                    .gradeLevel(dto.getGradeLevel())
                    .build());
        }
        tutorSpecialtyRepository.saveAll(entities);
    }

    private void updatePrices(Tutor tutor, List<TutorProfileUpsertRequest.PriceDto> dtos) {
        tutorPriceRepository.deleteByTutorId(tutor.getId());

        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        List<TutorPrice> entities = new ArrayList<>();
        for (var dto : dtos) {
            entities.add(TutorPrice.builder()
                    .tutor(tutor)
                    .teachingMode(TeachingMode.valueOf(dto.getTeachingMode().toUpperCase()))
                    .pricePerSession(dto.getPricePerSession())
                    .program(dto.getProgram())
                    .build());
        }
        tutorPriceRepository.saveAll(entities);
    }

    private void updateAvailabilities(Tutor tutor, List<TutorProfileUpsertRequest.AvailabilityDto> dtos) {
        tutorAvailabilityRepository.deleteByTutorId(tutor.getId());

        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        List<TutorAvailability> entities = new ArrayList<>();
        for (var dto : dtos) {
            entities.add(TutorAvailability.builder()
                    .tutor(tutor)
                    .dayOfWeek(dto.getDayOfWeek().shortValue())
                    .timeSlot(TimeSlot.valueOf(dto.getTimeSlot().toUpperCase()))
                    .build());
        }
        tutorAvailabilityRepository.saveAll(entities);
    }

    private void updateCredentials(
            Tutor tutor,
            List<TutorProfileUpsertRequest.CredentialDto> dtos,
            List<MultipartFile> files) {

        tutorCredentialRepository.deleteByTutorId(tutor.getId());

        if (dtos == null || dtos.isEmpty()) {
            return;
        }

        List<TutorCredential> entities = new ArrayList<>();
        for (int i = 0; i < dtos.size(); i++) {
            var dto = dtos.get(i);
            String fileUrl = null;

            if (files != null && i < files.size() && files.get(i) != null && !files.get(i).isEmpty()) {
                fileUrl = storageService.uploadFile("credentials", files.get(i));
            }

            entities.add(TutorCredential.builder()
                    .tutor(tutor)
                    .title(dto.getTitle())
                    .type(dto.getType())
                    .score(dto.getScore())
                    .fileUrl(fileUrl)
                    .build());
        }
        tutorCredentialRepository.saveAll(entities);
    }

    private TutorProfileResponse mapToResponse(User user, Tutor tutor) {
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
                .experienceYears(tutor.getExperienceYears() != null ? tutor.getExperienceYears().intValue() : null)
                .bio(tutor.getBio())
                .videoUrl(tutor.getVideoUrl())
                .profileStatus(tutor.getProfileStatus())
                .rejectionReason(tutor.getRejectionReason())
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
                                .dayOfWeek(a.getDayOfWeek() != null ? a.getDayOfWeek().intValue() : null)
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
