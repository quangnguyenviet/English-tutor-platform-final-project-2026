package com.mycompany.englishtutor.module.tutor.api.response;

import java.time.OffsetDateTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Thông tin tóm tắt của hồ sơ gia sư đang chờ duyệt.
 *
 * <p>Dùng cho API danh sách hồ sơ chờ duyệt ({@code GET /api/v1/admin/tutors/pending})
 * để trả payload nhẹ — không kèm 5 nhóm dữ liệu con (khu vực dạy, chuyên môn,
 * học phí, lịch rảnh, chứng chỉ).
 *
 * <p>Khi admin cần xem chi tiết thì gọi {@code GET /api/v1/admin/tutors/{tutorId}}
 * để lấy đầy đủ {@link TutorProfileResponse}.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorPendingSummaryResponse {
    Long tutorId;
    Long userId;
    String fullName;
    String email;
    String phone;
    String avatarUrl;
    String university;
    String educationStatus;
    Integer experienceYears;
    String profileStatus;
    /** Thời điểm gia sư gửi duyệt hồ sơ lần gần nhất. */
    OffsetDateTime submittedAt;
    OffsetDateTime updatedAt;
}
