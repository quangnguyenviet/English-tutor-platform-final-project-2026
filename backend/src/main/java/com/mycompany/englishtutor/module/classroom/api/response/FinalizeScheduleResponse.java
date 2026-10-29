package com.mycompany.englishtutor.module.classroom.api.response;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Kết quả chốt / cập nhật lịch dạy cố định (UC-T09). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class FinalizeScheduleResponse {

    @Schema(example = "1")
    Long classId;

    @Schema(description = "Danh sách ca dạy cố định sau khi lưu")
    List<ScheduleInfo> schedules;
}
