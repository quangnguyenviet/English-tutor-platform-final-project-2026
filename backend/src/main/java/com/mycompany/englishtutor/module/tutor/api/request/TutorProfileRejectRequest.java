package com.mycompany.englishtutor.module.tutor.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Body của API admin từ chối hồ sơ gia sư.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TutorProfileRejectRequest {

    @NotBlank(message = "Lý do từ chối là bắt buộc")
    @Size(max = 1000, message = "Lý do từ chối tối đa 1000 ký tự")
    String rejectionReason;
}
