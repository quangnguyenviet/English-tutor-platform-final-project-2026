package com.mycompany.englishtutor.module.tutor.api.request;

import java.time.LocalDate;
import java.util.List;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

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
public class TutorProfileUpsertRequest {
    // User fields
    @NotBlank(message = "Full name is required")
    String fullName;

    @Past(message = "Date of birth must be in the past")
    LocalDate dateOfBirth;

    String gender; // MALE, FEMALE, OTHER

    @Size(min = 10, max = 15, message = "Invalid phone number")
    String phone;

    // Tutor fields
    @NotBlank(message = "Address is required")
    String address;

    @Size(max = 100, message = "Hometown must be at most 100 characters")
    String hometown;

    @Size(max = 500, message = "Current address must be at most 500 characters")
    String currentAddress;

    @NotBlank(message = "University is required")
    String university;

    @NotBlank(message = "Education status is required")
    String educationStatus;

    @NotNull(message = "Experience years is required")
    @jakarta.validation.constraints.Min(value = 0, message = "Experience years must be non-negative")
    Integer experienceYears;

    @NotBlank(message = "Bio is required")
    String bio;

    String videoUrl;

    // Nested DTOs
    List<ServiceAreaDto> serviceAreas;
    List<SpecialtyDto> specialties;
    List<PriceDto> prices;
    List<AvailabilityDto> availabilities;
    List<CredentialDto> credentials;

    // File
    Object avatar; // MultipartFile (handled separately in controller)

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAreaDto {
        @NotBlank(message = "Province is required")
        String province;
        String district;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SpecialtyDto {
        @NotBlank(message = "Specialty is required")
        String specialty;
        String gradeLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PriceDto {
        @NotBlank(message = "Teaching mode is required")
        String teachingMode;

        @NotNull(message = "Price per session is required")
        @jakarta.validation.constraints.Min(value = 0, message = "Price must be non-negative")
        Integer pricePerSession;

        String program;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AvailabilityDto {
        @NotNull(message = "Day of week is required")
        @jakarta.validation.constraints.Min(value = 1, message = "Day of week must be between 1 and 7")
        @jakarta.validation.constraints.Max(value = 7, message = "Day of week must be between 1 and 7")
        Integer dayOfWeek;

        @NotBlank(message = "Time slot is required")
        String timeSlot;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CredentialDto {
        @NotBlank(message = "Credential title is required")
        String title;

        @NotBlank(message = "Credential type is required")
        String type;

        String score;

        // File handled separately
    }
}
