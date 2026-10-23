package com.mycompany.englishtutor.module.tutor.api.response;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Hồ sơ gia sư an toàn để công khai cho khách truy cập.
 *
 * <p>Không chứa email, số điện thoại, ngày sinh, địa chỉ chi tiết hoặc thông tin kiểm duyệt nội bộ.
 */
@Data
@JsonInclude(JsonInclude.Include.NON_EMPTY)
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublicTutorResponse {
    Long tutorId;
    String fullName;
    String gender;
    String avatarUrl;
    String university;
    String educationStatus;
    Integer experienceYears;
    String bio;
    String videoUrl;
    List<TutorProfileResponse.ServiceAreaResponse> serviceAreas;
    List<TutorProfileResponse.SpecialtyResponse> specialties;
    /** Hình thức dạy (ONLINE, AT_HOME). Học phí không được công khai. */
    List<String> teachingModes;
    List<TutorProfileResponse.AvailabilityResponse> availabilities;
    List<TutorProfileResponse.CredentialResponse> credentials;
}
