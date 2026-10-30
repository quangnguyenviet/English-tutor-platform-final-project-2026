package com.mycompany.englishtutor.module.staff.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Dữ liệu đổi trạng thái hoạt động của học sinh (UC-REC-11, UC-ADM-10): ACTIVE hoặc INACTIVE.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class StudentStatusUpdateRequest {

    @NotBlank(message = "Vui lòng chọn trạng thái")
    String status;

    @Size(max = 500, message = "Ghi chú tối đa 500 ký tự")
    String note;
}
