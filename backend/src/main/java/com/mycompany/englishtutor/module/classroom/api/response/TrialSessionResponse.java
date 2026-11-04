package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.time.LocalTime;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Ca dạy thử của lớp (các cột trial_* trên classes, V16). Chỉ hiện khi
 * classes.status = TRIAL; "buổi thử đã diễn ra" hiển thị dạng lịch sử.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TrialSessionResponse {
    LocalDate sessionDate;
    LocalTime startTime;
    LocalTime endTime;
    String teachingMode;
    String meetingUrl;
    String location;
    String status;
}
