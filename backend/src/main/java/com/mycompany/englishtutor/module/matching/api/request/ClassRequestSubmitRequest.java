package com.mycompany.englishtutor.module.matching.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body phụ huynh (khách) gửi từ trang công khai: để lại họ tên + SĐT, tuỳ chọn chỉ định một gia sư.
 *
 * <p>{@code tutorId} có giá trị: luồng chỉ đích danh. {@code tutorId} null: form nhận tư vấn chung.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassRequestSubmitRequest {

    @NotBlank(message = "Họ và tên phụ huynh là bắt buộc")
    @Size(max = 100, message = "Họ và tên phụ huynh tối đa 100 ký tự")
    String parentName;

    @NotBlank(message = "Số điện thoại là bắt buộc")
    @Pattern(regexp = "^(0|\\+84|84)(3|5|7|8|9)[0-9]{8}$", message = "Số điện thoại không hợp lệ")
    String phone;

    Long tutorId;
}
