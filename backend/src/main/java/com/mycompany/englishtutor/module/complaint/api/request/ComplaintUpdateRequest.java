package com.mycompany.englishtutor.module.complaint.api.request;

import com.mycompany.englishtutor.module.complaint.domain.enums.ComplainantRole;

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

/** Sửa thông tin người khiếu nại và nội dung khi đơn còn Chờ xử lý. Không đổi loại và lớp. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ComplaintUpdateRequest {

    @NotBlank(message = "Vui lòng nhập họ tên người khiếu nại")
    @Size(max = 100, message = "Họ tên tối đa 100 ký tự")
    String complainantName;

    @NotBlank(message = "Vui lòng nhập số điện thoại người khiếu nại")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    String complainantPhone;

    @NotNull(message = "Vui lòng chọn vai trò người khiếu nại")
    ComplainantRole complainantRole;

    @NotBlank(message = "Vui lòng nhập nội dung khiếu nại")
    String complaintContent;
}
