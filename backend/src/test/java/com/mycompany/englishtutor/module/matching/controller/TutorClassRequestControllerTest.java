package com.mycompany.englishtutor.module.matching.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import com.mycompany.englishtutor.module.matching.api.response.TutorApplicationResponse;
import com.mycompany.englishtutor.module.matching.api.response.TutorOpenClassRequestResponse;
import com.mycompany.englishtutor.module.matching.service.TutorClassRequestService;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Test API gia sư xem lớp đang tuyển / ứng tuyển / rút đơn: phân quyền, validate và mã lỗi. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class TutorClassRequestControllerTest {

    private static final OffsetDateTime CREATED_AT = OffsetDateTime.parse("2026-10-23T10:00:00+07:00");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private TutorClassRequestService tutorClassRequestService;

    private TutorOpenClassRequestResponse openClass() {
        return TutorOpenClassRequestResponse.builder()
                .id(7L)
                .requestCode("LOP-ENG-0007")
                .classRequirement("Luyện IELTS 5.0 lên 6.5")
                .gradeLevel("Lớp 10")
                .studentGender("MALE")
                .teachingMode("ONLINE")
                .generalLocation("Thanh Xuân, Hà Nội")
                .pricePerSession(BigDecimal.valueOf(300_000))
                .preferredSchedule("Thứ 3 và thứ 6")
                .applied(true)
                .applicationId(42L)
                .myMessage("Em có kinh nghiệm luyện thi.")
                .appliedAt(CREATED_AT)
                .createdAt(CREATED_AT)
                .build();
    }

    @Test
    void getOpenRequests_tutor_returnsPagedItems() throws Exception {
        when(tutorClassRequestService.getOpenRequests(any(), any(), any(), any(), any(), any()))
                .thenReturn(PageResponse.of(List.of(openClass()), 0, 20, 1));

        mockMvc.perform(get("/api/v1/tutors/me/open-requests")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.items[0].requestCode").value("LOP-ENG-0007"))
                .andExpect(jsonPath("$.result.items[0].applied").value(true))
                .andExpect(jsonPath("$.result.items[0].applicationId").value(42))
                .andExpect(jsonPath("$.result.totalItems").value(1));
    }

    @Test
    void getOpenRequests_studentRole_forbidden() throws Exception {
        mockMvc.perform(get("/api/v1/tutors/me/open-requests")
                        .with(jwt().authorities(() -> "ROLE_STUDENT")))
                .andExpect(status().isForbidden());
    }

    @Test
    void getOpenRequests_unauthenticated_unauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/tutors/me/open-requests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void getOpenRequest_doesNotExposeParentContact() throws Exception {
        when(tutorClassRequestService.getOpenRequest(7L)).thenReturn(openClass());

        mockMvc.perform(get("/api/v1/tutors/me/open-requests/7")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.parentName").doesNotExist())
                .andExpect(jsonPath("$.result.parentPhone").doesNotExist())
                .andExpect(jsonPath("$.result.phone").doesNotExist())
                .andExpect(jsonPath("$.result.fullName").doesNotExist());
    }

    @Test
    void getOpenRequest_notFound_returns404() throws Exception {
        when(tutorClassRequestService.getOpenRequest(99L))
                .thenThrow(new AppException(ErrorCode.CLASS_REQUEST_NOT_FOUND));

        mockMvc.perform(get("/api/v1/tutors/me/open-requests/99")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(1100));
    }

    @Test
    void apply_valid_returns201() throws Exception {
        when(tutorClassRequestService.apply(anyLong(), any()))
                .thenReturn(TutorApplicationResponse.builder()
                        .applicationId(42L)
                        .status("APPLIED")
                        .message("Em nhận lớp")
                        .appliedAt(CREATED_AT)
                        .build());

        mockMvc.perform(post("/api/v1/tutors/me/open-requests/7/apply")
                        .with(jwt().authorities(() -> "ROLE_TUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Em nhận lớp\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.applicationId").value(42))
                .andExpect(jsonPath("$.result.status").value("APPLIED"));
    }

    @Test
    void apply_blankMessage_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/tutors/me/open-requests/7/apply")
                        .with(jwt().authorities(() -> "ROLE_TUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Lời nhắn giới thiệu không được để trống"));
    }

    @Test
    void apply_alreadyApplied_returns409() throws Exception {
        when(tutorClassRequestService.apply(anyLong(), any()))
                .thenThrow(new AppException(ErrorCode.CLASS_ALREADY_APPLIED));

        mockMvc.perform(post("/api/v1/tutors/me/open-requests/7/apply")
                        .with(jwt().authorities(() -> "ROLE_TUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Em nhận lớp\"}"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(1104));
    }

    @Test
    void apply_tutorNotActive_returns403() throws Exception {
        when(tutorClassRequestService.apply(anyLong(), any()))
                .thenThrow(new AppException(ErrorCode.TUTOR_NOT_ACTIVE));

        mockMvc.perform(post("/api/v1/tutors/me/open-requests/7/apply")
                        .with(jwt().authorities(() -> "ROLE_TUTOR"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"message\":\"Em nhận lớp\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value(1103));
    }

    @Test
    void withdraw_success_returns200() throws Exception {
        mockMvc.perform(delete("/api/v1/tutors/me/applications/9")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã rút đơn ứng tuyển"));
    }

    @Test
    void withdraw_notWithdrawable_returns409() throws Exception {
        org.mockito.Mockito.doThrow(new AppException(ErrorCode.APPLICATION_NOT_WITHDRAWABLE))
                .when(tutorClassRequestService).withdrawApplication(10L);

        mockMvc.perform(delete("/api/v1/tutors/me/applications/10")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value(1106));
    }

    @Test
    void getMyApplications_returnsHistory() throws Exception {
        when(tutorClassRequestService.getMyApplications())
                .thenReturn(List.of(TutorApplicationResponse.builder()
                        .applicationId(42L)
                        .status("SELECTED")
                        .message("Em nhận lớp")
                        .appliedAt(CREATED_AT)
                        .classRequest(TutorApplicationResponse.ClassSummary.builder()
                                .id(7L)
                                .requestCode("LOP-ENG-0007")
                                .status("MATCHED")
                                .build())
                        .build()));

        mockMvc.perform(get("/api/v1/tutors/me/applications")
                        .with(jwt().authorities(() -> "ROLE_TUTOR")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result[0].applicationId").value(42))
                .andExpect(jsonPath("$.result[0].status").value("SELECTED"))
                .andExpect(jsonPath("$.result[0].classRequest.status").value("MATCHED"));
    }
}
