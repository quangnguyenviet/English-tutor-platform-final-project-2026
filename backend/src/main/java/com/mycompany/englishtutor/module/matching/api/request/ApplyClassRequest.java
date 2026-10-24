package com.mycompany.englishtutor.module.matching.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Body gia sư gửi kèm khi ứng tuyển một lớp đang mở. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ApplyClassRequest {

    @NotBlank(message = "Lời nhắn giới thiệu không được để trống")
    @Size(max = 2000, message = "Lời nhắn giới thiệu tối đa 2000 ký tự")
    String message;
}
