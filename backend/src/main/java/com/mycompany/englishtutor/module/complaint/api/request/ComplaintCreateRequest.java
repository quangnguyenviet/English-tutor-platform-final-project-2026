package com.mycompany.englishtutor.module.complaint.api.request;

import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Lễ tân/Admin tạo đơn khiếu nại tại quầy (UC-REC-14, UC-ADM-13). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintCreateRequest {

    @NotBlank(message = "Vui lòng nhập họ tên người khiếu nại")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    String complainantName;

    @NotBlank(message = "Vui lòng nhập số điện thoại người khiếu nại")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    String complainantPhone;

    @NotNull(message = "Vui lòng chọn vai trò người khiếu nại")
    ComplainantRole complainantRole;

    @NotNull(message = "Vui lòng chọn loại khiếu nại")
    ComplaintType complaintType;

    @NotNull(message = "Vui lòng chọn lớp bị khiếu nại")
    @Schema(description = "Mã lớp cần gia sư bị khiếu nại")
    Long classRequestId;

    @NotBlank(message = "Vui lòng nhập nội dung khiếu nại")
    String complaintContent;
}
