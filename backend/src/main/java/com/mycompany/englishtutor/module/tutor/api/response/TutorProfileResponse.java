package com.mycompany.englishtutor.module.tutor.api.response;

import java.time.OffsetDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

import lombok.AccessLevel;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorProfileResponse {
    // User info
    Long userId;
    String fullName;
    String email;
    String dateOfBirth;
    String gender;
    String phone;
    String avatarUrl;

    // Tutor info
    Long tutorId;
    String address;
    String hometown;
    String university;
    String educationStatus;
    Integer experienceYears;
    String bio;
    String videoUrl;
    String profileStatus;
    String rejectionReason;
    OffsetDateTime reviewedAt;
    OffsetDateTime updatedAt;

    // Related data
    List<ServiceAreaResponse> serviceAreas;
    List<SpecialtyResponse> specialties;
    List<PriceResponse> prices;
    List<AvailabilityResponse> availabilities;
    List<CredentialResponse> credentials;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAreaResponse {
        Long id;
        String province;
        String district;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecialtyResponse {
        Long id;
        String specialty;
        String gradeLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceResponse {
        Long id;
        String teachingMode;
        Integer pricePerSession;
        String program;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityResponse {
        Long id;
        Integer dayOfWeek;
        String timeSlot;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CredentialResponse {
        Long id;
        String title;
        String type;
        String score;
        String fileUrl;
    }
}
