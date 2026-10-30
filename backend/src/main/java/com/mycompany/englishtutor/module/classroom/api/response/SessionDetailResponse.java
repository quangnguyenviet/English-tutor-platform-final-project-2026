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

/** Chi tiết buổi học (mục 4.5) — mọi vai trò được đọc thấy nhật ký khi không null. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SessionDetailResponse {

    @Schema(example = "12")
    Long sessionId;

    @Schema(example = "3")
    Integer sessionNumber;

    @Schema(example = "1")
    Long classId;

    @Schema(example = "Tiếng Anh lớp 8")
    String className;

    @Schema(example = "Nguyễn Văn A")
    String studentName;

    @Schema(example = "Trần Văn B")
    String tutorName;

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

    @Schema(description = "SCHEDULED | IN_PROGRESS | COMPLETED | ABSENT | CANCELLED")
    String status;

    @Schema(description = "Buổi dạy thử (quản lý ở tab Tổng quan)")
    Boolean isTrial;

    @Schema(description = "Nhật ký kiến thức (null nếu chưa ghi)")
    String logKnowledge;

    @Schema(description = "Nhật ký bài tập (null nếu chưa ghi)")
    String logHomework;

    @Schema(description = "Đã có nhật ký (1 trong 2 nội dung không null)")
    Boolean hasLog;
}
