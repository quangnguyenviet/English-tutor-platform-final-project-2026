package com.mycompany.englishtutor.module.classroom.api.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Body gán task cho một nhân sự khác (V32). */
@Data
public class TrialReportTaskAssignRequest {
    @NotNull(message = "Cần chọn nhân sự nhận việc")
    private Long userId;
}
