package com.mycompany.englishtutor.module.classroom.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.mycompany.englishtutor.module.classroom.api.response.ClassScheduleResponse;
import com.mycompany.englishtutor.module.classroom.api.response.MaterialAccessUrlResponse;
import com.mycompany.englishtutor.module.classroom.api.response.TeachingLogResponse;
import com.mycompany.englishtutor.module.classroom.service.ClassOccurrenceService;

/** Kiểm tra contract HTTP + vai trò của controller đọc (V16: lattice, log, link tài liệu). */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class ClassOccurrenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClassOccurrenceService classOccurrenceService;

    private ClassScheduleResponse scheduleResponse() {
        return ClassScheduleResponse.builder()
                .weekStart(LocalDate.of(2026, 11, 2))
                .occurrences(List.of())
                .build();
    }

    // ------------------------------------------------- GET đa vai trò

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

    // ------------------------------------------------- LOG (đọc ô ca)

    @Test
    void getLog_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.getLog(eq(1L), eq(LocalDate.of(2026, 11, 6)), eq(LocalTime.of(19, 30))))
                .thenReturn(TeachingLogResponse.builder()
                        .logId(7L)
                        .logDate(LocalDate.of(2026, 11, 6))
                        .startTime(LocalTime.of(19, 30))
                        .endTime(LocalTime.of(21, 0))
                        .knowledge("Past Simple")
                        .homework("Bài 12")
                        .hasContent(Boolean.TRUE)
                        .firstPublish(Boolean.FALSE)
                        .updatedAt(OffsetDateTime.now())
                        .build());

        mockMvc.perform(get("/api/v1/classes/1/logs")
                        .param("logDate", "2026-11-06")
                        .param("startTime", "19:30")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.logId").value(7))
                .andExpect(jsonPath("$.result.hasContent").value(true));
    }

    @Test
    void getLog_noLogYet_shouldReturn200WithEmptyResult() throws Exception {
        when(classOccurrenceService.getLog(eq(1L), eq(LocalDate.of(2026, 11, 6)), eq(LocalTime.of(19, 30))))
                .thenReturn(null);

        mockMvc.perform(get("/api/v1/classes/1/logs")
                        .param("logDate", "2026-11-06")
                        .param("startTime", "19:30")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk());
    }

    @Test
    void getLog_asAccountant_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/classes/1/logs")
                        .param("logDate", "2026-11-06")
                        .param("startTime", "19:30")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ACCOUNTANT"))))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------- MATERIALS (FR-21)

    @Test
    void getMaterialAccessUrl_asTutor_shouldReturn200() throws Exception {
        when(classOccurrenceService.getMaterialAccessUrl(40L))
                .thenReturn(MaterialAccessUrlResponse.builder()
                        .url("https://minio.local/englishpath/lesson-materials/12/a.pdf")
                        .previewable(Boolean.TRUE)
                        .build());

        mockMvc.perform(get("/api/v1/materials/40/access-url")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.previewable").value(true));
    }

    @Test
    void getMaterialAccessUrl_asStudent_shouldReturn200() throws Exception {
        when(classOccurrenceService.getMaterialAccessUrl(40L))
                .thenReturn(MaterialAccessUrlResponse.builder()
                        .url("https://minio.local/englishpath/lesson-materials/12/a.pdf")
                        .previewable(Boolean.FALSE)
                        .build());

        mockMvc.perform(get("/api/v1/materials/40/access-url")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_STUDENT"))))
                .andExpect(status().isOk());
    }

    @Test
    void getMaterialAccessUrl_asAccountant_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/materials/40/access-url")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ACCOUNTANT"))))
                .andExpect(status().isForbidden());
    }
}
