package com.mycompany.englishtutor.module.matching.api.response;

import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Đơn ứng tuyển của một gia sư cho lớp cần gia sư (UC-REC-03) — dùng ở modal "Danh sách gia sư".
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassApplicationResponse {

    @Schema(description = "ID đơn ứng tuyển")
    Long applicationId;

    @Schema(description = "ID gia sư ứng tuyển")
    Long tutorId;

    @Schema(description = "Họ tên gia sư")
    String tutorName;

    @Schema(description = "Email gia sư")
    String tutorEmail;

    @Schema(description = "Số điện thoại gia sư")
    String tutorPhone;

    @Schema(description = "Ảnh đại diện gia sư")
    String tutorAvatarUrl;

    @Schema(description = "Lời nhắn của gia sư khi ứng tuyển")
    String message;

    @Schema(description = "Trạng thái đơn: APPLIED, SELECTED, REJECTED")
    String status;

    @Schema(description = "Thời điểm ứng tuyển")
    OffsetDateTime appliedAt;
}
