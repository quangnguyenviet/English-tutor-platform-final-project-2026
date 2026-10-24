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
public class MatchRequestSummaryResponse {

    @Schema(description = "ID đơn yêu cầu ghép lớp")
    Long id;

    @Schema(description = "Mã yêu cầu chuẩn (REQ-yyyyMMdd-id)", example = "REQ-20261024-12")
    String requestCode;

    @Schema(description = "Trạng thái nghiệp vụ: PENDING (Chờ xử lý), TRIAL (Đang dạy thử), MATCHED (Ghép thành công), CANCELLED (Đã hủy)", example = "PENDING")
    String status;

    @Schema(description = "Tab phân loại giao diện: pending, trial, matched, cancelled", example = "pending")
    String tab;

    @Schema(description = "Họ tên phụ huynh", example = "Nguyễn Văn Toàn")
    String parentName;

    @Schema(description = "Số điện thoại phụ huynh", example = "0912345678")
    String parentPhone;

    @Schema(description = "Họ tên học sinh", example = "Nguyễn Minh Khôi")
    String studentName;

    @Schema(description = "Khối lớp của học sinh", example = "Lớp 11")
    String grade;

    @Schema(description = "ID gia sư được chỉ định", example = "5")
    Long tutorId;

    @Schema(description = "Họ tên gia sư được chỉ định", example = "Trần Minh Quân")
    String tutorName;

    @Schema(description = "Ảnh đại diện gia sư")
    String tutorAvatarUrl;

    @Schema(description = "Tên lớp học / yêu cầu môn học", example = "Tiếng Anh IELTS 6.5")
    String className;

    @Schema(description = "Hình thức học (ONLINE / AT_HOME)", example = "ONLINE")
    String teachingMode;

    @Schema(description = "Mức học phí mỗi buổi (VNĐ)", example = "300000")
    BigDecimal pricePerSession;

    @Schema(description = "Thời điểm gửi yêu cầu")
    OffsetDateTime createdAt;

    @Schema(description = "Lý do hủy (nếu đã hủy)")
    String cancelReason;

    @Schema(description = "ID lớp học sau khi duyệt đơn (nếu có)")
    Long classId;

    @Schema(description = "Trạng thái lớp học sau khi duyệt đơn (TRIAL, ACTIVE, COMPLETED, CANCELLED)")
    String classStatus;
}
