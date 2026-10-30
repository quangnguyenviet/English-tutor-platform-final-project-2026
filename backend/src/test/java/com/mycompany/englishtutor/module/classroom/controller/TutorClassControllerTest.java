package com.mycompany.englishtutor.module.classroom.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
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
import com.mycompany.englishtutor.module.classroom.api.request.CreateSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.request.FinalizeScheduleRequest;
import com.mycompany.englishtutor.module.classroom.api.request.UpsertTrialSessionRequest;
import com.mycompany.englishtutor.module.classroom.api.response.ClassDetailResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ClassSummaryResponse;
import com.mycompany.englishtutor.module.classroom.api.response.FinalizeScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.OnDemandSessionResponse;
import com.mycompany.englishtutor.module.classroom.api.response.ScheduleInfo;
import com.mycompany.englishtutor.module.classroom.api.response.TrialSessionResponse;
import com.mycompany.englishtutor.module.classroom.service.TutorClassService;

/** Kiểm tra contract HTTP của API lớp học & lịch dạy thử (API_DESIGN mục 3.5). */
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
                .sessionId(9L)
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
    void createTrialSession_asTutor_shouldReturn201() throws Exception {
        when(tutorClassService.createTrialSession(eq(1L), any())).thenReturn(trialResponse());

        UpsertTrialSessionRequest body = UpsertTrialSessionRequest.builder()
                .sessionDate(LocalDate.of(2026, 10, 28))
                .startTime(LocalTime.of(19, 0))
                .endTime(LocalTime.of(20, 30))
                .teachingMode("ONLINE")
                .meetingUrl("https://meet.google.com/abc-defg-hij")
                .build();

        mockMvc.perform(post("/api/v1/classes/1/trial-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.sessionId").value(9))
                .andExpect(jsonPath("$.result.status").value("SCHEDULED"));
    }

    @Test
    void updateTrialSession_asTutor_shouldReturn200() throws Exception {
        when(tutorClassService.updateTrialSession(eq(1L), any())).thenReturn(trialResponse());

        UpsertTrialSessionRequest body = UpsertTrialSessionRequest.builder()
                .sessionDate(LocalDate.of(2026, 10, 29))
                .startTime(LocalTime.of(19, 30))
                .endTime(LocalTime.of(21, 0))
                .teachingMode("AT_HOME")
                .location("Số 1, ngõ 2, đường X, Cầu Giấy, Hà Nội")
                .build();

        mockMvc.perform(put("/api/v1/classes/1/trial-session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.sessionId").value(9));
    }

    @Test
    void createTrialSession_missingDate_shouldReturn400() throws Exception {
        String body = """
                {
                  "startTime": "19:00",
                  "endTime": "20:30",
                  "teachingMode": "ONLINE",
                  "meetingUrl": "https://meet.google.com/abc-defg-hij"
                }
                """;

        mockMvc.perform(post("/api/v1/classes/1/trial-session")
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
    void createSession_asTutor_shouldReturn200() throws Exception {
        LocalDate date = LocalDate.now().plusDays(3);
        when(tutorClassService.createSessionOnDemand(eq(1L), any(), any()))
                .thenReturn(OnDemandSessionResponse.builder()
                        .sessionId(42L)
                        .sessionDate(date)
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .isTrial(Boolean.FALSE)
                        .createdNow(Boolean.TRUE)
                        .build());

        CreateSessionRequest body = CreateSessionRequest.builder().sessionDate(date).build();

        mockMvc.perform(post("/api/v1/classes/1/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body))
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.sessionId").value(42))
                .andExpect(jsonPath("$.result.createdNow").value(true));
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
}
