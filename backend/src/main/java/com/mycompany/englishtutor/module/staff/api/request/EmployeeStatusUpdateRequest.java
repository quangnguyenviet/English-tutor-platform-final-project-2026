package com.mycompany.englishtutor.module.staff.api.request;

import jakarta.validation.constraints.NotBlank;

import lombok.AccessLevel;
import lombok.Data;
import lombok.experimental.FieldDefaults;

/**
 * Dữ liệu đổi trạng thái hoạt động của nhân sự (UC-ADM-11): ACTIVE hoặc INACTIVE.
 */
@Data
@FieldDefaults(level = AccessLevel.PRIVATE)
public class EmployeeStatusUpdateRequest {

    @NotBlank(message = "Vui lòng chọn trạng thái")
    String status;
}
