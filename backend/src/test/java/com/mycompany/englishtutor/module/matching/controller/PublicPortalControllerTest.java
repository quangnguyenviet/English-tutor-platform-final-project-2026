package com.mycompany.englishtutor.module.matching.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSubmitResponse;
import com.mycompany.englishtutor.module.matching.service.ClassRequestSubmitService;
import com.mycompany.englishtutor.module.matching.service.PublicClassRequestService;
import com.mycompany.englishtutor.module.tutor.api.response.PublicTutorResponse;
import com.mycompany.englishtutor.module.tutor.service.PublicTutorService;
import com.mycompany.englishtutor.shared.api.PageResponse;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

/** Test các API cổng công khai: truy cập không cần token, validate SĐT, mã lỗi 404/429, dạng phân trang. */
@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class PublicPortalControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ClassRequestSubmitService classRequestSubmitService;

    @MockBean
    private PublicTutorService publicTutorService;

    @MockBean
    private PublicClassRequestService publicClassRequestService;

    private static String body(String phone, String tutorId) {
        return """
                {"parentName":"Nguyễn Lan Anh","phone":"%s"%s}
                """
                .formatted(phone, tutorId == null ? "" : ",\"tutorId\":" + tutorId);
    }

    @Test
    void submit_validRequest_noToken_returnsRequestCode() throws Exception {
        when(classRequestSubmitService.submit(any()))
                .thenReturn(ClassRequestSubmitResponse.builder()
                        .requestCode("REQ-20261023-12")
                        .message("Trung tâm sẽ liên hệ trong vòng 12 giờ.")
                        .build());

        mockMvc.perform(post("/api/v1/public/class-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("0912345678", "3")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.code").value(1000))
                .andExpect(jsonPath("$.result.requestCode").value("REQ-20261023-12"));
    }

    @Test
    void submit_invalidPhone_returns400WithVietnameseMessage() throws Exception {
        mockMvc.perform(post("/api/v1/public/class-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("0212345678", null)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Số điện thoại không hợp lệ"));
    }

    @Test
    void submit_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/public/class-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"parentName\":\"  \",\"phone\":\"0912345678\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void submit_rateLimited_returns429() throws Exception {
        when(classRequestSubmitService.submit(any())).thenThrow(new AppException(ErrorCode.TOO_MANY_REQUESTS));

        mockMvc.perform(post("/api/v1/public/class-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("0912345678", null)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value(1102));
    }

    @Test
    void submit_tutorUnavailable_returns404() throws Exception {
        when(classRequestSubmitService.submit(any())).thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_UNAVAILABLE));

        mockMvc.perform(post("/api/v1/public/class-requests")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body("0912345678", "99")))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(1101));
    }

    @Test
    void getTutor_notActive_returns404Unavailable() throws Exception {
        when(publicTutorService.getActiveTutor(99L)).thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_UNAVAILABLE));

        mockMvc.perform(get("/api/v1/public/tutors/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(1101));
    }

    @Test
    void getTutors_noToken_returnsPagedItemsWithoutPriceOrEmptyFields() throws Exception {
        PublicTutorResponse tutor = PublicTutorResponse.builder()
                .tutorId(3L)
                .fullName("Phạm Ngọc Gia Sư")
                .specialties(List.of())
                .teachingModes(List.of("ONLINE"))
                .build();
        when(publicTutorService.searchActiveTutors(any(), any(), any()))
                .thenReturn(PageResponse.of(List.of(tutor), 0, 20, 1));

        mockMvc.perform(get("/api/v1/public/tutors").param("district", "Cầu Giấy"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.totalItems").value(1))
                .andExpect(jsonPath("$.result.totalPages").value(1))
                .andExpect(jsonPath("$.result.items[0].fullName").value("Phạm Ngọc Gia Sư"))
                .andExpect(jsonPath("$.result.items[0].prices").doesNotExist())
                .andExpect(jsonPath("$.result.items[0].specialties").doesNotExist())
                .andExpect(jsonPath("$.result.items[0].bio").doesNotExist());
    }
}
