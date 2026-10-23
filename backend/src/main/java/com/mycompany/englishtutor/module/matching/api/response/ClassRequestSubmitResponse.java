package com.mycompany.englishtutor.module.matching.api.response;

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
public class ClassRequestSubmitResponse {
    /** Mã yêu cầu dạng {@code REQ-yyyyMMdd-id}, phụ huynh dùng khi liên hệ trung tâm. */
    String requestCode;

    String message;
}
