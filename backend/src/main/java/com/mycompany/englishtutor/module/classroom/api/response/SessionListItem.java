package com.mycompany.englishtutor.module.classroom.api.response;

import java.time.LocalDate;
import java.time.LocalTime;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Một buổi học trong danh sách của lớp (mục 4.4). {@code sessionNumber} =
 * ROW_NUMBER trên TOÀN BỘ buổi của lớp (kể cả trial, kể cả khi filter) nên
 * số thứ tự không nhảy khi lọc trạng thái.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionListItem {

    @Schema(example = "12")
    Long sessionId;

    @Schema(description = "Số thứ tự buổi trong lớp (liên tục, không nhảy khi lọc)", example = "3")
    Integer sessionNumber;

    @Schema(example = "Buổi học chính thức")
    String title;

    @Schema(example = "2026-11-10")
    LocalDate sessionDate;

    @Schema(example = "19:30")
    LocalTime startTime;

    @Schema(example = "21:00")
    LocalTime endTime;

    @Schema(description = "ONLINE | AT_HOME")
    String teachingMode;

    @Schema(description = "Liên kết phòng học (ONLINE)")
    String meetingUrl;

    @Schema(description = "Địa chỉ (AT_HOME)")
    String location;

    @Schema(description = "Buổi dạy thử (hiển thị nhãn riêng, ẩn nút hành động)")
    Boolean isTrial;

    @Schema(description = "Đã có nhật ký (1 trong 2 nội dung không null)")
    Boolean hasLog;
}
