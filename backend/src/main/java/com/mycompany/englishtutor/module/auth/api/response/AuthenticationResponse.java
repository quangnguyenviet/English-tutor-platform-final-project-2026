package com.mycompany.englishtutor.module.auth.api.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class AuthenticationResponse {
    String token;
    boolean authenticated;

    /** Học sinh/nhân sự đăng nhập lần đầu bằng mật khẩu mặc định phải đổi mật khẩu (API_DESIGN 3.1). */
    boolean mustChangePassword;
}
