package com.mycompany.englishtutor.module.classroom.api.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.Accessors;

/** Chi tiết task dạy thử thất bại, gồm report, lớp, request và lịch sử thao tác. */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
public class TrialReportTaskDetailResponse {
    private TaskDetail task;
    @Builder.Default
    private List<HistoryItem> history = List.of();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @Accessors(chain = true)
    public static class TaskDetail {
        private Long taskId;
        private String status;
        private Long assignedToId;
        private String assignedToName;
        private Long resolvedById;
        private String resolvedByName;
        private OffsetDateTime resolvedAt;
        private String resolution;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;
        private ReportDetail report;
        private ClassInfo classInfo;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReportDetail {
        private Long reportId;
        private String outcome;
        private String note;
        private OffsetDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassInfo {
        private Long classId;
        private String className;
        private String status;
        private String teachingMode;
        private String classType;
        private BigDecimal pricePerSession;
        private LocalDate activeFrom;
        private LocalDate endDate;
        private TrialSessionInfo trialSession;
        private PersonInfo student;
        private PersonInfo tutor;
        private ClassRequestInfo classRequest;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TrialSessionInfo {
        private LocalDate trialDate;
        private LocalTime startTime;
        private LocalTime endTime;
        private String teachingMode;
        private String meetingUrl;
        private String location;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PersonInfo {
        private Long id;
        private String name;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassRequestInfo {
        private Long id;
        private String status;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoryItem {
        private Long id;
        private String action;
        private String actorName;
        private Object details;
        private OffsetDateTime createdAt;
    }
}
