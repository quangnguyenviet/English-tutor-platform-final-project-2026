package com.mycompany.englishtutor.module.matching.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Schema(description = "Mã yêu cầu (REQ-yyyyMMdd-id)", example = "REQ-20261106-17")
    String requestCode;

    @Schema(description = "Trạng thái: NEW, OPEN, TRIAL, MATCHED, REMATCH, CANCELLED")
    String status;

    @Schema(description = "Tab giao diện: new, open, trial, matched, rematch, cancelled")
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

    @Schema(description = "Email gia sư chỉ định")
    String tutorEmail;

    @Schema(description = "Số điện thoại gia sư chỉ định")
    String tutorPhone;

    @Schema(description = "Tên đăng nhập học sinh. Null khi chưa vào dạy thử nên chưa có tài khoản")
    String studentUsername;

    @Schema(description = "Học sinh đã có tài khoản hay chưa")
    Boolean studentAccountCreated;

    @Schema(description = "Mật khẩu mặc định của học sinh, chỉ có khi học sinh chưa đổi mật khẩu")
    String initialPassword;

    @Schema(description = "Số buổi mỗi tuần hiện có trên lớp học (nguồn tính phí, V11)")
    Integer classSessionsPerWeek;

    @Schema(description = "Học phí mỗi buổi trên lớp học (nguồn tính phí, V11)")
    BigDecimal classPricePerSession;
}
