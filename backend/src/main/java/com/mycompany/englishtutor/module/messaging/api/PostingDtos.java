package com.mycompany.englishtutor.module.messaging.api;

import java.math.BigDecimal;
import java.util.List;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** DTO tin đăng "Lớp cần gia sư" của phụ huynh. */
public final class PostingDtos {

    private PostingDtos() {}

    /** Mục đích/khu vực để trống thì lấy từ hồ sơ phụ huynh (wizard). */
    public record CreatePostingRequest(
            @Pattern(regexp = "PHU_THONG|THI_CHUAN|GIAO_TIEP|THI_HOC_KY", message = "Mục đích học không hợp lệ") String purpose,
            @Size(max = 100) String province,
            @Size(max = 100) String district,
            @Min(value = 1, message = "Số buổi mỗi tuần từ 1 đến 5") @Max(value = 5, message = "Số buổi mỗi tuần từ 1 đến 5")
                    Integer sessionsPerWeek,
            BigDecimal referencePrice,
            @Pattern(regexp = "ONLINE|AT_HOME", message = "Hình thức học không hợp lệ") String teachingMode,
            @Size(max = 1000, message = "Ghi chú tối đa 1000 ký tự") String note,
            @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự") String address,
            @Pattern(regexp = "MALE|FEMALE|ANY", message = "Yêu cầu giới tính không hợp lệ") String genderRequirement,
            @Pattern(regexp = "STUDENT|TEACHER|ANY", message = "Yêu cầu gia sư không hợp lệ") String tutorRequirement,
            @Pattern(regexp = "SHORT_TERM|REGULAR", message = "Loại lớp không hợp lệ") String durationType,
            @Size(max = 255, message = "Thời gian có thể học tối đa 255 ký tự") String availableTime) {}

    public record CancelPostingRequest(@Size(max = 500) String reason) {}

    public record PostingItem(
            Long id,
            String status,
            String purpose,
            String province,
            String district,
            Integer sessionsPerWeek,
            BigDecimal referencePrice,
            String teachingMode,
            String note,
            String address,
            String genderRequirement,
            String tutorRequirement,
            String durationType,
            String availableTime,
            String cancelReason,
            int applicantCount,
            Long classId,
            String createdAt) {}

    public record ApplicantItem(
            Long applicationId,
            Long tutorId,
            String tutorName,
            String avatarUrl,
            String university,
            Integer experienceYears,
            String bio,
            String message,
            String status,
            Long roomId,
            String appliedAt) {}

    public record ApplicantsResponse(PostingItem posting, List<ApplicantItem> applicants) {}
}
