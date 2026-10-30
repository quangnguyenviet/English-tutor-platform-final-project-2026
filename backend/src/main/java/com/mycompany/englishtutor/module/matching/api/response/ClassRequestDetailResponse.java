package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Chi tiết một lớp cần gia sư kèm danh sách gia sư ứng tuyển (UC-REC-02, UC-REC-03).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassRequestDetailResponse {

    @Schema(description = "ID lớp cần gia sư")
    Long id;

    @Schema(description = "Mã lớp chuẩn (LOP-ENG-0001)")
    String requestCode;

    @Schema(description = "Trạng thái: NEW, OPEN, MATCHED, CANCELLED")
    String status;

    @Schema(description = "Tab giao diện: new, open, matched, cancelled")
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

    @Schema(description = "Yêu cầu lớp học / môn học")
    String classRequirement;

    @Schema(description = "Hình thức học (ONLINE / AT_HOME)")
    String teachingMode;

    @Schema(description = "Mức học phí mỗi buổi (VNĐ)")
    BigDecimal pricePerSession;

    @Schema(description = "Tỷ lệ phí nhận lớp (%) — default 40, khoảng 0–50 (V10)", example = "40")
    BigDecimal feePercentage;

    @Schema(description = "Số buổi mỗi tuần (do phụ huynh gợi ý khi gửi đơn; số buổi dùng tính phí nằm trên lớp)")
    Integer sessionsPerWeek;

    @Schema(description = "Lịch học mong muốn")
    String preferredSchedule;

    @Schema(description = "Yêu cầu đối với gia sư")
    String tutorRequirement;

    @Schema(description = "Lý do hủy (nếu đã hủy)")
    String cancelReason;

    @Schema(description = "Họ tên nhân sự xử lý")
    String handledByName;

    @Schema(description = "ID lớp học sau khi chọn gia sư (nếu có)")
    Long classId;

    @Schema(description = "Trạng thái lớp học sau khi chọn gia sư")
    String classStatus;

    @Schema(description = "Số lượng gia sư đã ứng tuyển")
    Long applicationCount;

    @Schema(description = "Số lượt ứng tuyển còn chờ chọn (APPLIED) — 0 thì không mở danh sách chọn gia sư")
    Long pendingApplicationCount;

    @Schema(description = "Danh sách gia sư đã ứng tuyển")
    List<ClassApplicationResponse> applications;

    @Schema(description = "Thời điểm tạo / đăng lớp")
    OffsetDateTime createdAt;

    @Schema(description = "Thời điểm cập nhật gần nhất")
    OffsetDateTime updatedAt;
}
