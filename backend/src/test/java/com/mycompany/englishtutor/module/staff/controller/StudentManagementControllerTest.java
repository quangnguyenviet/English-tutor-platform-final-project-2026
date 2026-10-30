package com.mycompany.englishtutor.module.staff.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.mycompany.englishtutor.module.staff.api.response.StudentDetailResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentParentResponse;
import com.mycompany.englishtutor.module.staff.api.response.StudentSummaryResponse;
import com.mycompany.englishtutor.module.staff.service.StudentManagementService;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/**
 * Test API quản lý học sinh: phân quyền RECEPTIONIST/ADMIN, validate body và mã lỗi.
 */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class StudentManagementControllerTest {

    private static final Long STUDENT_ID = 5L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private StudentManagementService studentManagementService;

    private StudentDetailResponse detail(String status) {
        return StudentDetailResponse.builder()
                .id(STUDENT_ID)
                .fullName("Nguyễn Minh Khôi")
                .status(status)
                .parent(StudentParentResponse.builder().fullName("Nguyễn Văn Hùng").phone("0911000001").build())
                .currentClasses(List.of())
                .pastClasses(List.of())
                .build();
    }

    // -------------------------------------------------------------- GET list

    @Test
    void getStudents_receptionist_success() throws Exception {
        StudentSummaryResponse item = StudentSummaryResponse.builder()
                .id(STUDENT_ID).fullName("Nguyễn Minh Khôi").parentPhone("0911000001").status("ACTIVE")
                .currentTutorNames(List.of()).build();
        when(studentManagementService.getStudents("ACTIVE", "0911000001", null, 0, 20))
                .thenReturn(PageResponse.of(List.of(item), 0, 20, 1));

        mockMvc.perform(get("/api/v1/students")
                        .param("status", "ACTIVE")
                        .param("keyword", "0911000001")
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.items[0].fullName").value("Nguyễn Minh Khôi"));
    }

    @Test
    void getStudents_tutor_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/students").with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getStudents_student_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/students").with(jwt().authorities(() -> "ROLE_STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getStudents_accountant_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/students").with(jwt().authorities(() -> "ROLE_ACCOUNTANT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getStudents_unauthenticated_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/students")).andExpect(status().isUnauthorized());
    }

    @Test
    void getStudents_invalidFilter_badRequest() throws Exception {
        when(studentManagementService.getStudents(eq("ABC"), any(), any(), any(), any()))
                .thenThrow(new AppException(ErrorCode.INVALID_STUDENT_FILTER));

        mockMvc.perform(get("/api/v1/students").param("status", "ABC")
                        .with(jwt().authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1308));
    }

    // -------------------------------------------------------------- GET detail

    @Test
    void getStudent_admin_success() throws Exception {
        when(studentManagementService.getStudent(STUDENT_ID)).thenReturn(detail("ACTIVE"));

        mockMvc.perform(get("/api/v1/students/{id}", STUDENT_ID).with(jwt().authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.parent.phone").value("0911000001"));
    }

    @Test
    void getStudent_notFound_returns404() throws Exception {
        when(studentManagementService.getStudent(STUDENT_ID)).thenThrow(new AppException(ErrorCode.STUDENT_NOT_FOUND));

        mockMvc.perform(get("/api/v1/students/{id}", STUDENT_ID)
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(1305));
    }

    // -------------------------------------------------------------- PATCH status

    @Test
    void updateStatus_receptionist_success() throws Exception {
        when(studentManagementService.updateStatus(eq(STUDENT_ID), any())).thenReturn(detail("INACTIVE"));

        mockMvc.perform(patch("/api/v1/students/{id}/status", STUDENT_ID)
                        .with(csrf())
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\",\"note\":\"Tạm nghỉ\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã lưu thông tin HS"))
                .andExpect(jsonPath("$.result.status").value("INACTIVE"));
    }

    @Test
    void updateStatus_missingStatus_badRequest() throws Exception {
        mockMvc.perform(patch("/api/v1/students/{id}/status", STUDENT_ID)
                        .with(csrf())
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateStatus_sameStatus_conflict() throws Exception {
        when(studentManagementService.updateStatus(eq(STUDENT_ID), any()))
                .thenThrow(new AppException(ErrorCode.INVALID_STUDENT_STATUS));

        mockMvc.perform(patch("/api/v1/students/{id}/status", STUDENT_ID)
                        .with(csrf())
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(1306));
    }

    @Test
    void updateStatus_tutor_forbidden() throws Exception {
        mockMvc.perform(patch("/api/v1/students/{id}/status", STUDENT_ID)
                        .with(csrf())
                        .with(jwt().authorities(() -> "ROLE_TUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isForbidden());
    }
}
