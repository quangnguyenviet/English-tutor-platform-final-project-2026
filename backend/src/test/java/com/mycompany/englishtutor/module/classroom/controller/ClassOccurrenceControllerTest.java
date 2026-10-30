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

import java.time.LocalDate;
import java.time.LocalTime;
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
import com.mycompany.englishtutor.module.classroom.api.request.CreateExceptionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionLogRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpdateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionExceptionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.SessionListItem;
import com.mycompany.englishtutor.module.classroom.api.response.SessionLogResponse;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;

import jakarta.servlet.http.HttpServletRequest;

/** Kiểm tra contract HTTP + vai trò của tab "Lịch dạy" (kế hoạch mục 1.9). */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class ClassOccurrenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ClassOccurrenceService classOccurrenceService;

    private ClassScheduleResponse scheduleResponse() {
        return ClassScheduleResponse.builder()
                .weekStart(LocalDate.of(2026, 11, 2))
                .occurrences(List.of())
                .build();
    }

    private SessionListItem listItem() {
        return SessionListItem.builder()
                .sessionId(12L)
                .sessionNumber(3)
                .title("Buổi học chính thức")
                .sessionDate(LocalDate.of(2026, 11, 10))
                .startTime(LocalTime.of(19, 30))
                .endTime(LocalTime.of(21, 0))
                .teachingMode("ONLINE")
                .isTrial(Boolean.FALSE)
                .hasLog(Boolean.FALSE)
                .build();
    }

    private SessionDetailResponse detailResponse() {
        return SessionDetailResponse.builder()
                .sessionId(12L)
                .sessionNumber(3)
                .classId(1L)
                .className("Tiếng Anh lớp 8")
                .studentName("Nguyễn Văn A")
                .tutorName("Trần Văn B")
                .sessionDate(LocalDate.of(2026, 11, 10))
                .isTrial(Boolean.FALSE)
                .hasLog(Boolean.FALSE)
                .build();
    }

    // ------------------------------------------------- GET đa vai trò (mục 4.1/4.4/4.5)

    @Test
    void getClassSchedule_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.listOccurrences(eq(1L), any())).thenReturn(scheduleResponse());

        mockMvc.perform(get("/api/v1/classes/1/schedule")
                        .param("weekStart", "2026-11-02")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.weekStart").value("2026-11-02"));
    }

    @Test
    void getClassSchedule_asStudent_shouldReturn200() throws Exception {
        when(classOccurrenceService.listOccurrences(eq(1L), any())).thenReturn(scheduleResponse());

        mockMvc.perform(get("/api/v1/classes/1/schedule")
                        .param("weekStart", "2026-11-02")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk());
    }

    @Test
    void getClassSchedule_asReceptionist_shouldReturn200() throws Exception {
        when(classOccurrenceService.listOccurrences(eq(1L), any())).thenReturn(scheduleResponse());

        mockMvc.perform(get("/api/v1/classes/1/schedule")
                        .param("weekStart", "2026-11-02")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk());
    }

    @Test
    void getClassSchedule_asAdmin_shouldReturn200() throws Exception {
        when(classOccurrenceService.listOccurrences(eq(1L), any())).thenReturn(scheduleResponse());

        mockMvc.perform(get("/api/v1/classes/1/schedule")
                        .param("weekStart", "2026-11-02")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    void getClassSchedule_asUnauthenticatedRole_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/classes/1/schedule")
                        .param("weekStart", "2026-11-02")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ACCOUNTANT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void getClassSessions_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.listSessions(eq(1L), eq("asc")))
                .thenReturn(List.of(listItem()));

        mockMvc.perform(get("/api/v1/classes/1/sessions")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].sessionNumber").value(3));
    }

    @Test
    void getSessionDetail_asStudent_shouldReturn200() throws Exception {
        when(classOccurrenceService.getDetail(12L)).thenReturn(detailResponse());

        mockMvc.perform(get("/api/v1/sessions/12")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.className").value("Tiếng Anh lớp 8"))
                .andExpect(jsonPath("$.result.hasLog").value(false));
    }

    // ------------------------------------------------- WRITE chỉ TUTOR (mục 4.2–4.8)

    @Test
    void createException_asTutor_shouldReturn201() throws Exception {
        when(classOccurrenceService.createException(eq(1L), any(), any()))
                .thenReturn(SessionExceptionResponse.builder().id(5L).classId(1L).scheduleId(3L).build());

        CreateExceptionRequest body = CreateExceptionRequest.builder()
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
    void createException_asStudent_shouldReturn403() throws Exception {
        CreateExceptionRequest body = validExceptionBody();

        mockMvc.perform(post("/api/v1/classes/1/exceptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void createException_asReceptionist_shouldReturn403() throws Exception {
        CreateExceptionRequest body = validExceptionBody();

        mockMvc.perform(post("/api/v1/classes/1/exceptions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isForbidden());
    }

    private CreateExceptionRequest validExceptionBody() {
        return CreateExceptionRequest.builder()
                .scheduleId(3L)
                .exceptionDate(LocalDate.of(2026, 11, 6))
                .exceptionType("CANCELLED")
                .build();
    }

    @Test
    void deleteException_asTutor_shouldReturn200() throws Exception {
        mockMvc.perform(
                        delete("/api/v1/classes/1/exceptions/3/2026-11-06")
                                .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã gỡ ngoại lệ lịch dạy"));

        verify(classOccurrenceService)
                .deleteException(eq(1L), eq(3L), eq(LocalDate.of(2026, 11, 6)), any());
    }

    @Test
    void updateSession_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.updateSession(eq(12L), any(), any()))
                .thenReturn(detailResponse());
        UpdateSessionRequest body = UpdateSessionRequest.builder()
                .sessionDate(LocalDate.of(2026, 11, 14))
                .startTime(LocalTime.of(19, 30))
                .endTime(LocalTime.of(21, 0))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc")
                .build();

        mockMvc.perform(put("/api/v1/sessions/12")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.sessionId").value(12));
    }

    @Test
    void updateSessionLog_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.saveLog(eq(12L), any(), any()))
                .thenReturn(SessionLogResponse.builder().sessionId(12L).firstPublish(Boolean.TRUE).build());
        UpdateSessionLogRequest body =
                UpdateSessionLogRequest.builder().logKnowledge("Kiến thức").build();

        mockMvc.perform(put("/api/v1/sessions/12/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.firstPublish").value(true));
    }

    @Test
    void updateSessionLog_asReceptionist_shouldReturn403() throws Exception {
        UpdateSessionLogRequest body =
                UpdateSessionLogRequest.builder().logKnowledge("Kiến thức").build();

        mockMvc.perform(put("/api/v1/sessions/12/log")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isForbidden());
    }
}
