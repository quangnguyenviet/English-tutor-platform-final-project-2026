package com.mycompany.englishtutor.module.auth.api.request;

import jakarta.validation.constraints.NotBlank;
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
public class ChangePasswordRequest {

    @NotBlank(message = "Vui lòng nhập mật khẩu hiện tại")
    String oldPassword;

    @NotBlank(message = "Vui lòng nhập mật khẩu mới")
    String newPassword;
}
