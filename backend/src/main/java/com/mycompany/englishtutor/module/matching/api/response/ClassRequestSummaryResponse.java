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

/**
 * Tóm tắt một lớp cần gia sư cho danh sách phân trang của Lễ tân/Admin (UC-REC-02).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassRequestSummaryResponse {

    @Schema(description = "ID lớp cần gia sư")
    Long id;

    @Schema(description = "Mã lớp chuẩn (LOP-ENG-0001)", example = "LOP-ENG-0001")
    String requestCode;

    @Schema(description = "Trạng thái: NEW, OPEN, MATCHED, CANCELLED")
    String status;

    @Schema(description = "Tab giao diện: new, open, matched, cancelled")
    String tab;

    @Schema(description = "Họ tên phụ huynh (chưa công khai với gia sư)")
    String parentName;

    @Schema(description = "Số điện thoại phụ huynh")
    String parentPhone;

    @Schema(description = "Họ tên học sinh")
    String studentName;

    @Schema(description = "Khối lớp của học sinh")
    String grade;

    @Schema(description = "Yêu cầu lớp học / môn học")
    String classRequirement;

    @Schema(description = "Hình thức học (ONLINE / AT_HOME)")
    String teachingMode;

    @Schema(description = "Mức học phí mỗi buổi (VNĐ)")
    BigDecimal pricePerSession;

    @Schema(description = "Lịch học mong muốn")
    String preferredSchedule;

    @Schema(description = "Số lượng gia sư đã ứng tuyển")
    Long applicationCount;

    @Schema(description = "Số lượt ứng tuyển còn chờ chọn (APPLIED) — 0 thì không mở danh sách chọn gia sư")
    Long pendingApplicationCount;

    @Schema(description = "Lý do hủy (nếu đã hủy)")
    String cancelReason;

    @Schema(description = "ID lớp học sau khi chọn gia sư (nếu có)")
    Long classId;

    @Schema(description = "Trạng thái lớp học sau khi chọn gia sư")
    String classStatus;

    @Schema(description = "Thời điểm tạo / đăng lớp")
    OffsetDateTime createdAt;

    @Schema(description = "Thời điểm cập nhật gần nhất")
    OffsetDateTime updatedAt;
}
