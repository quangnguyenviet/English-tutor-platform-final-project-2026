package com.mycompany.englishtutor.module.messaging.api;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Dữ liệu wizard 4 bước của phụ huynh: SĐT, họ tên, mục đích, khu vực. */
public record ParentProfileRequest(
        @NotBlank(message = "Số điện thoại không được để trống") String phone,
        @NotBlank(message = "Họ tên không được để trống") @Size(min = 2, max = 100, message = "Họ tên từ 2 đến 100 ký tự") String fullName,
        @NotBlank(message = "Vui lòng chọn mục đích học")
                @Pattern(regexp = "PHU_THONG|THI_CHUAN|GIAO_TIEP|THI_HOC_KY", message = "Mục đích học không hợp lệ")
                String purpose,
        @NotBlank(message = "Vui lòng chọn tỉnh/thành phố") @Size(max = 100) String province,
        @NotBlank(message = "Vui lòng nhập phường/xã") @Size(max = 100, message = "Phường/xã tối đa 100 ký tự") String ward,
        @NotBlank(message = "Vui lòng nhập địa chỉ") @Size(min = 5, max = 500, message = "Địa chỉ từ 5 đến 500 ký tự") String address) {}
