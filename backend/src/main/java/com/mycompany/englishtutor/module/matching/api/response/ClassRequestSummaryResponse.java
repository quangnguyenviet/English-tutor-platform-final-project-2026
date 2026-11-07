package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Schema(description = "Mã yêu cầu (REQ-yyyyMMdd-id)", example = "REQ-20261106-17")
    String requestCode;

    @Schema(description = "Trạng thái: NEW, OPEN, TRIAL, MATCHED, REMATCH, CANCELLED")
    String status;

    @Schema(description = "Tab giao diện: new, open, trial, matched, rematch, cancelled")
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

    @Schema(description = "ID gia sư chỉ định. Null khi lớp đăng tuyển")
    Long tutorId;

    @Schema(description = "Họ tên gia sư chỉ định")
    String tutorName;

    @Schema(description = "Ảnh đại diện gia sư chỉ định")
    String tutorAvatarUrl;

    @Schema(description = "ID gia sư của lớp học gần nhất. Khi đang ghép lại là gia sư đã bị loại")
    Long lastTutorId;

    @Schema(description = "Tên gia sư của lớp học gần nhất")
    String lastTutorName;

    @Schema(description = "Ngày lớp chuyển sang ghép thành công")
    LocalDate activeFrom;

    @Schema(description = "Ngày cuối cùng còn được hủy lớp đã ghép thành công (activeFrom + 7 ngày)")
    LocalDate cancelDeadline;

    @Schema(description = "Số ngày còn được hủy lớp đã ghép thành công, 0 là ngày cuối, âm là đã hết hạn")
    Long cancelDaysLeft;

    @Schema(description = "Lớp còn được hủy hay không")
    Boolean cancellable;
}
