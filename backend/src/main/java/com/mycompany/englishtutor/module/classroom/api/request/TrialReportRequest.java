package com.mycompany.englishtutor.module.classroom.api.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body báo cáo kết quả dạy thử của gia sư (trial_report, V31).
 *
 * <p>{@code outcome} = SUCCESS (kích hoạt lớp ACTIVE) hoặc FAILED (lưu lý do +
 * thông báo lễ tân, lớp giữ TRIAL). {@code note} bắt buộc khi FAILED.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TrialReportRequest {

    @NotBlank(message = "Kết quả báo cáo không được để trống")
    @Schema(description = "Kết quả dạy thử: SUCCESS hoặc FAILED", example = "SUCCESS")
    String outcome;

    @Size(max = 1000, message = "Lý do báo cáo tối đa 1000 ký tự")
    @Schema(description = "Lý do (bắt buộc khi kết quả FAILED, tối thiểu 5 ký tự)")
    String note;
}
