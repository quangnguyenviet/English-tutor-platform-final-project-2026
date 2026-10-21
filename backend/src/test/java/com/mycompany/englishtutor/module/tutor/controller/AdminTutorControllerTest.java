package com.mycompany.englishtutor.module.tutor.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.mycompany.englishtutor.module.tutor.api.response.TutorPendingSummaryResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
import com.mycompany.englishtutor.module.tutor.service.AdminTutorService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.extern.slf4j.Slf4j;

/**
 * Test API admin duyệt / từ chối hồ sơ gia sư.
 *
 * <p>Kiểm tra cả phần phân quyền ({@code RECEPTIONIST} / {@code ADMIN}),
 * định dạng response và mã lỗi khi hồ sơ không ở trạng thái {@code PENDING}.
 */
@Slf4j
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class AdminTutorControllerTest {

    private static final Long TUTOR_ID = 1L;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AdminTutorService adminTutorService;

    private TutorPendingSummaryResponse summary;
    private TutorProfileResponse detail;

    @BeforeEach
    void initData() {
        summary = TutorPendingSummaryResponse.builder()
                .tutorId(TUTOR_ID)
                .userId(TUTOR_ID)
                .fullName("Nguyễn Văn An")
                .email("giasu01@example.com")
                .phone("0901234567")
                .profileStatus("PENDING")
                .build();

        detail = TutorProfileResponse.builder()
                .tutorId(TUTOR_ID)
                .userId(TUTOR_ID)
                .fullName("Nguyễn Văn An")
                .profileStatus("PENDING")
                .serviceAreas(List.of())
                .specialties(List.of())
                .prices(List.of())
                .availabilities(List.of())
                .credentials(List.of())
                .build();
    }

    // -------------------------------------------------------------- GET pending

    @Test
    void getPendingProfiles_receptionist_success() throws Exception {
        // GIVEN
        when(adminTutorService.getPendingProfiles()).thenReturn(List.of(summary));

        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/pending").with(jwt().authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result[0].tutorId").value(TUTOR_ID))
                .andExpect(jsonPath("$.result[0].fullName").value("Nguyễn Văn An"))
                .andExpect(jsonPath("$.result[0].profileStatus").value("PENDING"));
    }

    @Test
    void getPendingProfiles_admin_success() throws Exception {
        // GIVEN
        when(adminTutorService.getPendingProfiles()).thenReturn(List.of(summary));

        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/pending").with(jwt().authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].tutorId").value(TUTOR_ID));
    }

    @Test
    void getPendingProfiles_tutorRole_forbidden() throws Exception {
        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/pending").with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getPendingProfiles_unauthenticated_unauthorized() throws Exception {
        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/pending"))
                .andExpect(status().isUnauthorized());
    }

    // -------------------------------------------------------------- GET detail

    @Test
    void getProfileDetail_receptionist_success() throws Exception {
        // GIVEN
        when(adminTutorService.getProfileDetail(TUTOR_ID)).thenReturn(detail);

        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/{tutorId}", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.tutorId").value(TUTOR_ID))
                .andExpect(jsonPath("$.result.profileStatus").value("PENDING"));
    }

    @Test
    void getProfileDetail_tutorNotFound_returns404() throws Exception {
        // GIVEN
        when(adminTutorService.getProfileDetail(TUTOR_ID))
                .thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_NOT_FOUND));

        // WHEN, THEN
        mockMvc.perform(get("/api/v1/admin/tutors/{tutorId}", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_ADMIN")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(ErrorCode.TUTOR_PROFILE_NOT_FOUND.getCode()));
    }

    // ---------------------------------------------------------------- approve

    @Test
    void approve_pendingProfile_success() throws Exception {
        // GIVEN
        TutorProfileResponse approved = TutorProfileResponse.builder()
                .tutorId(TUTOR_ID)
                .profileStatus("ACTIVE")
                .build();
        when(adminTutorService.approve(TUTOR_ID)).thenReturn(approved);

        // WHEN, THEN
        mockMvc.perform(post("/api/v1/admin/tutors/{tutorId}/approve", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST"))
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.profileStatus").value("ACTIVE"));
    }

    @Test
    void approve_profileNotPending_returns409() throws Exception {
        // GIVEN
        when(adminTutorService.approve(TUTOR_ID))
                .thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_NOT_PENDING));

        // WHEN, THEN
        mockMvc.perform(post("/api/v1/admin/tutors/{tutorId}/approve", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .with(csrf()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.TUTOR_PROFILE_NOT_PENDING.getCode()));
    }

    // ----------------------------------------------------------------- reject

    @Test
    void reject_pendingProfile_success() throws Exception {
        // GIVEN
        TutorProfileResponse rejected = TutorProfileResponse.builder()
                .tutorId(TUTOR_ID)
                .profileStatus("REJECTED")
                .rejectionReason("Hồ sơ chưa đầy đủ")
                .build();
        when(adminTutorService.reject(eq(TUTOR_ID), any())).thenReturn(rejected);

        // WHEN, THEN
        mockMvc.perform(post("/api/v1/admin/tutors/{tutorId}/reject", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_RECEPTIONIST"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{\"rejectionReason\": \"Hồ sơ chưa đầy đủ\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.profileStatus").value("REJECTED"))
                .andExpect(jsonPath("$.result.rejectionReason").value("Hồ sơ chưa đầy đủ"));
    }

    @Test
    void reject_missingReason_returns400() throws Exception {
        // WHEN, THEN: @NotBlank trên rejectionReason
        mockMvc.perform(post("/api/v1/admin/tutors/{tutorId}/reject", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{\"rejectionReason\": \"   \"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void reject_profileNotPending_returns409() throws Exception {
        // GIVEN
        when(adminTutorService.reject(eq(TUTOR_ID), any()))
                .thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_NOT_PENDING));

        // WHEN, THEN
        mockMvc.perform(post("/api/v1/admin/tutors/{tutorId}/reject", TUTOR_ID)
                        .with(jwt().authorities(() -> "ROLE_ADMIN"))
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON_VALUE)
                        .content("{\"rejectionReason\": \"Hồ sơ chưa đầy đủ\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(ErrorCode.TUTOR_PROFILE_NOT_PENDING.getCode()));
    }
}
