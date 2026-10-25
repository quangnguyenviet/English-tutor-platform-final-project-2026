package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Buổi dạy thử của một lớp TRIAL (UC-T08), hiển thị kèm nhãn [Học thử] trên thời khóa biểu. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TrialSessionResponse {
    Long sessionId;
    LocalDate sessionDate;
    LocalTime startTime;
    LocalTime endTime;
    String teachingMode;
    String meetingUrl;
    String location;
    String status;
}
