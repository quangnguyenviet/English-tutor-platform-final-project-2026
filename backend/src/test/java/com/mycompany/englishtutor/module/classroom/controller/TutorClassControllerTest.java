package com.mycompany.englishtutor.module.classroom.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.classroom.api.request.CreateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateLessonRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.LessonDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.service.TutorClassService;

/** Kiểm tra contract HTTP của API lớp học (V16: ca thử trial_*, lịch cố định, bài giảng, nhật ký). */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class TutorClassControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private TutorClassService tutorClassService;

    @MockBean
    private com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService classOccurrenceService;

    private ClassSummaryResponse summaryItem() {
        return ClassSummaryResponse.builder()
                .classId(1L)
                .className("Tiếng Anh giao tiếp")
                .studentName("Nguyễn Minh Khôi")
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(200000))
                .status("TRIAL")
                .createdAt(OffsetDateTime.now())
                .trialSession(null)
                .build();
    }

    private TrialSessionResponse trialResponse() {
        return TrialSessionResponse.builder()
                .sessionDate(LocalDate.of(2026, 10, 28))
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 30))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc-defg-hij")
                .status("SCHEDULED")
                .build();
    }

    @Test
    void getMyClasses_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.getMyClasses(eq("TRIAL"))).thenReturn(List.of(summaryItem()));

        mockMvc.perform(get("/api/v1/tutors/me/classes")
                        .param("status", "TRIAL")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].classId").value(1))
                .andExpect(jsonPath("$.result[0].status").value("TRIAL"));
    }

    @Test
    void getClassDetail_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.getClassDetail(1L))
                .thenReturn(ClassDetailResponse.builder()
                        .classId(1L)
                        .className("Tiếng Anh giao tiếp")
                        .status("TRIAL")
                        .teachingMode("ONLINE")
                        .studentName("Nguyễn Minh Khôi")
                        .trialSession(trialResponse())
                        .build());

        mockMvc.perform(get("/api/v1/classes/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.trialSession.sessionDate").value("2026-10-28"))
                .andExpect(jsonPath("$.result.trialSession.status").value("SCHEDULED"));
    }

    @Test
    void upsertTrialSlot_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.upsertTrialSlot(eq(1L), any(), any())).thenReturn(trialResponse());

        UpsertTrialSessionRequest body = UpsertTrialSessionRequest.builder()
                .sessionDate(LocalDate.of(2026, 10, 28))
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 30))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc-defg-hij")
                .build();

        mockMvc.perform(put("/api/v1/classes/1/trial")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.status").value("SCHEDULED"))
                .andExpect(jsonPath("$.result.sessionDate").value("2026-10-28"));
    }

    @Test
    void upsertTrialSlot_missingDate_shouldReturn400() throws Exception {
        String body = """
                {
                  "startTime": "19:00",
                  "endTime": "20:30",
                  "teachingMode": "ONLINE",
                  "meetingUrl": "https://meet.google.com/abc-defg-hij"
                }
                """;

        mockMvc.perform(put("/api/v1/classes/1/trial")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getMyClasses_asStudent_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/tutors/me/classes")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------ UC-T09

    private FinalizeScheduleRequest scheduleBody() {
        return FinalizeScheduleRequest.builder()
                .schedules(List.of(FinalizeScheduleRequest.ScheduleSlot.builder()
                        .dayOfWeek(3)
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .validFrom(LocalDate.now().plusDays(3))
                        .validTo(null)
                        .build()))
                .build();
    }

    @Test
    void finalizeSchedule_asTutor_shouldReturn201() throws Exception {
        when(tutorClassService.finalizeSchedule(eq(1L), any(), any()))
                .thenReturn(FinalizeScheduleResponse.builder()
                        .classId(1L)
                        .schedules(List.of(ScheduleInfo.builder()
                                .dayOfWeek(3)
                                .startTime(LocalTime.of(19, 30))
                                .endTime(LocalTime.of(21, 0))
                                .validFrom(LocalDate.now().plusDays(3))
                                .build()))
                        .build());

        mockMvc.perform(post("/api/v1/classes/1/finalize-schedule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scheduleBody()))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.classId").value(1))
                .andExpect(jsonPath("$.result.schedules[0].dayOfWeek").value(3));
    }

    @Test
    void updateSchedules_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.updateSchedule(eq(1L), any(), any()))
                .thenReturn(FinalizeScheduleResponse.builder()
                        .classId(1L)
                        .schedules(List.of())
                        .build());

        mockMvc.perform(put("/api/v1/classes/1/schedules")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(scheduleBody()))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.classId").value(1));
    }

    @Test
    void finalizeSchedule_missingValidFrom_shouldReturn400() throws Exception {
        String body = """
                {
                  "schedules": [
                    { "dayOfWeek": 3, "startTime": "19:30", "endTime": "21:00" }
                  ]
                }
                """;

        mockMvc.perform(post("/api/v1/classes/1/finalize-schedule")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------- BÀI GIẢNG (V16)

    @Test
    void createLesson_asTutor_shouldReturn201() throws Exception {
        when(tutorClassService.createLesson(eq(1L), any(), any()))
                .thenReturn(LessonDetailResponse.builder()
                        .lessonId(70L)
                        .classId(1L)
                        .title("Bài 1: Past Simple")
                        .status("PUBLISHED")
                        .build());

        CreateLessonRequest body = CreateLessonRequest.builder()
                .title("Bài 1: Past Simple")
                .build();

        mockMvc.perform(post("/api/v1/classes/1/lessons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.lessonId").value(70))
                .andExpect(jsonPath("$.result.status").value("PUBLISHED"));
    }

    @Test
    void createLesson_asStudent_shouldReturn403() throws Exception {
        CreateLessonRequest body = CreateLessonRequest.builder().title("Bài 1").build();

        mockMvc.perform(post("/api/v1/classes/1/lessons")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void updateLesson_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.updateLesson(eq(70L), any(), any()))
                .thenReturn(LessonDetailResponse.builder()
                        .lessonId(70L)
                        .classId(1L)
                        .title("Bài 1 (sửa)")
                        .status("HIDDEN")
                        .build());

        mockMvc.perform(put("/api/v1/lessons/70")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                UpdateLessonRequest.builder()
                                        .title("Bài 1 (sửa)")
                                        .status("HIDDEN")
                                        .build()))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.lessonId").value(70))
                .andExpect(jsonPath("$.result.status").value("HIDDEN"));
    }

    @Test
    void updateLesson_asStudent_shouldReturn403() throws Exception {
        mockMvc.perform(put("/api/v1/lessons/70")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                UpdateLessonRequest.builder()
                                        .title("Bài 1 (sửa)")
                                        .build()))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------- EXTERNALS (overlay)

    @Test
    void createException_asTutor_shouldReturn201() throws Exception {
        when(classOccurrenceService.createException(eq(1L), any(), any()))
                .thenReturn(com.mycompany.englishtutor.module.classroom.api.response
                        .SessionExceptionResponse.builder().id(5L).classId(1L).scheduleId(3L).build());

        com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest body =
                com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest.builder()
                        .scheduleId(3L)
                        .exceptionDate(LocalDate.of(2026, 11, 6))
                        .exceptionType("RESCHEDULED")
                        .newDate(LocalDate.of(2026, 11, 7))
                        .newStartTime(LocalTime.of(20, 0))
                        .newEndTime(LocalTime.of(21, 30))
                        .build();

        mockMvc.perform(post("/api/v1/classes/1/exceptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.scheduleId").value(3));
    }

    @Test
    void createException_asReceptionist_shouldReturn403() throws Exception {
        com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest body =
                com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest.builder()
                        .scheduleId(3L)
                        .exceptionDate(LocalDate.of(2026, 11, 6))
                        .exceptionType("CANCELLED")
                        .build();

        mockMvc.perform(post("/api/v1/classes/1/exceptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteException_asTutor_shouldReturn200() throws Exception {
        mockMvc.perform(delete("/api/v1/classes/1/exceptions/3/2026-11-06")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã gỡ ngoại lệ lịch dạy"));

        verify(classOccurrenceService)
                .deleteException(eq(1L), eq(3L), eq(LocalDate.of(2026, 11, 6)), any());
    }

    // ------------------------------------------------- TEACHING LOGS (V16)

    @Test
    void saveLog_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.saveLog(eq(1L), any(), any()))
                .thenReturn(TeachingLogResponse.builder()
                        .logId(7L)
                        .logDate(LocalDate.of(2026, 11, 6))
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .knowledge("Past Simple")
                        .hasContent(Boolean.TRUE)
                        .firstPublish(Boolean.TRUE)
                        .build());

        com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest body =
                com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest.builder()
                        .logDate(LocalDate.of(2026, 11, 6))
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .knowledge("Past Simple")
                        .homework("Bài 12")
                        .build();

        mockMvc.perform(post("/api/v1/classes/1/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.logId").value(7))
                .andExpect(jsonPath("$.result.firstPublish").value(true));
    }

    @Test
    void saveLog_asReceptionist_shouldReturn403() throws Exception {
        com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest body =
                com.mycompany.englishtutor.module.classroom.api.request.SaveTeachingLogRequest.builder()
                        .logDate(LocalDate.of(2026, 11, 6))
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .knowledge("Past Simple")
                        .build();

        mockMvc.perform(post("/api/v1/classes/1/logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void deleteLog_asTutor_shouldReturn200() throws Exception {
        mockMvc.perform(delete("/api/v1/classes/1/logs/7")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xóa nhật ký dạy học"));

        verify(classOccurrenceService).deleteLog(eq(1L), eq(7L), any());
    }

    // ------------------------------------------------- BÀI GIẢNG (V16)

    @Test
    void deleteLesson_asTutor_shouldReturn200() throws Exception {
        mockMvc.perform(delete("/api/v1/lessons/70")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xóa bài giảng"));

        verify(tutorClassService).deleteLesson(eq(70L), any());
    }

    @Test
    void deleteLesson_asStudent_shouldReturn403() throws Exception {
        mockMvc.perform(delete("/api/v1/lessons/70")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void uploadLessonMaterial_asTutor_shouldReturn201() throws Exception {
        when(classOccurrenceService.uploadMaterial(eq(70L), any(), any()))
                .thenReturn(com.mycompany.englishtutor.module.classroom.api.response
                        .LessonMaterialItem.builder()
                                .materialId(40L)
                                .fileName("bai-hoc.pdf")
                                .fileType("PDF")
                                .build());

        org.springframework.mock.web.MockMultipartFile file =
                new org.springframework.mock.web.MockMultipartFile(
                        "file", "bai-hoc.pdf", "application/pdf", "pdf".getBytes());

        mockMvc.perform(org.springframework.test.web.servlet.request
                        .MockMvcRequestBuilders.multipart("/api/v1/lessons/70/materials")
                        .file(file)
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.materialId").value(40));
    }

    @Test
    void deleteLessonMaterial_asTutor_shouldReturn200() throws Exception {
        mockMvc.perform(delete("/api/v1/lessons/70/materials/40")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã gỡ tài liệu bài giảng"));

        verify(classOccurrenceService).deleteMaterial(eq(70L), eq(40L), any());
    }

}
