package com.mycompany.englishtutor.module.matching.api.request;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Pattern;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Bổ sung/sửa thông tin lớp cần gia sư sau cuộc gọi lại (UC-REC-02) — chỉ áp dụng khi lớp còn {@code NEW}.
 *
 * <p>Mọi trường đều tùy chọn (partial update); trường nào gửi lên thì cập nhật trường đó.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateClassRequest {

    @Schema(description = "Họ tên học sinh (tạo tài khoản học sinh nếu chưa có)", example = "Lê Hoàng Nam")
    String studentName;

    @Schema(description = "Khối lớp của học sinh", example = "Lớp 10")
    String grade;

    @Schema(description = "Trường học hiện tại", example = "THPT Chuyên Chu Văn An")
    String school;

    @Schema(description = "Yêu cầu lớp học / môn học", example = "Luyện IELTS từ 5.0 lên 6.5")
    String classRequirement;

    @Pattern(regexp = "^(ONLINE|AT_HOME)$", message = "Hình thức học phải là ONLINE hoặc AT_HOME")
    @Schema(description = "Hình thức học (ONLINE / AT_HOME)", example = "ONLINE")
    String teachingMode;

    @DecimalMin(value = "10000", message = "Học phí mỗi buổi phải lớn hơn 10.000 VNĐ")
    @Schema(description = "Mức học phí mỗi buổi (VNĐ)", example = "300000")
    BigDecimal pricePerSession;

    @Schema(description = "Lịch học mong muốn", example = "2 buổi/tuần, tối Thứ 3 và Thứ 6")
    String preferredSchedule;

    @Schema(description = "Yêu cầu đối với gia sư", example = "Gia sư IELTS 7.5 trở lên")
    String tutorRequirement;
}
