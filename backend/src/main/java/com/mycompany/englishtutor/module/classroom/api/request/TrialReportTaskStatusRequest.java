package com.mycompany.englishtutor.module.classroom.api.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Body chuyển trạng thái task bằng dropdown (V32). */
@Data
public class TrialReportTaskStatusRequest {
    @NotBlank(message = "Trạng thái không được để trống")
    private String status;
}
