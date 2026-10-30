package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MatchRequestDetailResponse {

    @Schema(description = "ID đơn yêu cầu ghép lớp")
    Long id;

    @Schema(description = "Mã yêu cầu chuẩn (REQ-yyyyMMdd-id)", example = "REQ-20261024-12")
    String requestCode;

    @Schema(description = "Trạng thái nghiệp vụ: PENDING, TRIAL, MATCHED, CANCELLED")
    String status;

    @Schema(description = "Tab phân loại giao diện: pending, trial, matched, cancelled")
    String tab;

    @Schema(description = "Họ tên phụ huynh")
    String parentName;

    @Schema(description = "Số điện thoại phụ huynh")
    String parentPhone;

    @Schema(description = "Email phụ huynh")
    String parentEmail;

    @Schema(description = "Địa chỉ liên hệ phụ huynh")
    String parentAddress;

    @Schema(description = "Họ tên học sinh")
    String studentName;

    @Schema(description = "Khối lớp của học sinh")
    String grade;

    @Schema(description = "Trường học của học sinh")
    String school;

    @Schema(description = "Mục tiêu học tập của học sinh")
    String learningGoal;

    @Schema(description = "ID gia sư được chỉ định")
    Long tutorId;

    @Schema(description = "Họ tên gia sư được chỉ định")
    String tutorName;

    @Schema(description = "Email gia sư")
    String tutorEmail;

    @Schema(description = "Số điện thoại gia sư")
    String tutorPhone;

    @Schema(description = "Ảnh đại diện gia sư")
    String tutorAvatarUrl;

    @Schema(description = "Tên lớp học / yêu cầu môn học")
    String className;

    @Schema(description = "Hình thức học (ONLINE / AT_HOME)")
    String teachingMode;

    @Schema(description = "Mức học phí mỗi buổi (VNĐ)")
    BigDecimal pricePerSession;

    @Schema(description = "Tỷ lệ phí nhận lớp (%) — default 40, khoảng 0–50 (V10)", example = "40")
    BigDecimal feePercentage;

    @Schema(description = "Số buổi mỗi tuần (do phụ huynh gợi ý khi gửi đơn; số buổi dùng tính phí nằm trên lớp)")
    Integer sessionsPerWeek;

    @Schema(description = "Số buổi mỗi tuần hiện có trên lớp (nguồn tính phí, V11; null = lễ tân bổ sung tại modal kích hoạt)")
    Integer classSessionsPerWeek;

    @Schema(description = "Học phí mỗi buổi snapshot trên lớp (nguồn tính phí, V11)")
    BigDecimal classPricePerSession;

    @Schema(description = "Thời lượng mỗi buổi (phút)")
    Integer durationMinutes;

    @Schema(description = "Lịch học mong muốn")
    String preferredSchedule;

    @Schema(description = "Ghi chú từ phụ huynh hoặc lễ tân")
    String notes;

    @Schema(description = "Lý do hủy (nếu đã hủy)")
    String cancelReason;

    @Schema(description = "Thời điểm gửi yêu cầu")
    OffsetDateTime createdAt;

    @Schema(description = "Thời điểm cập nhật gần nhất")
    OffsetDateTime updatedAt;

    @Schema(description = "Họ tên nhân sự tiếp nhận/xử lý")
    String handledByName;

    @Schema(description = "ID lớp học sau khi duyệt đơn (nếu có)")
    Long classId;

    @Schema(description = "Trạng thái lớp học sau khi duyệt đơn (TRIAL, ACTIVE, COMPLETED, CANCELLED)")
    String classStatus;

    @Schema(description = "ID gia sư của lớp gần nhất — với đơn REMATCH là gia sư đã bị loại sau dạy thử")
    Long lastTutorId;

    @Schema(description = "Tên gia sư của lớp gần nhất (gia sư đã bị loại khi đơn REMATCH)")
    String lastTutorName;
}
