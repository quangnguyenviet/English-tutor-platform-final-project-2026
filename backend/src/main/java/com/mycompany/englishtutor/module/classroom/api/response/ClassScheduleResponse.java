package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Lattice tuần: danh sách lần diễn (ô) của lớp trong [weekStart, weekStart+6] (mục 4.1). */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ClassScheduleResponse {

    @Schema(description = "Ngày mở tuần (Mùng 2 trong quy ước thứ 1 = T2)", example = "2026-11-02")
    LocalDate weekStart;

    @Schema(description = "Các ô theo thứ tự ngày × ca")
    List<OccurrenceResponse> occurrences;
}
