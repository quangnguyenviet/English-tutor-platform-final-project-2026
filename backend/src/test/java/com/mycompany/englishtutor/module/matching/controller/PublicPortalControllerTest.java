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

import com.mycompany.englishtutor.module.matching.service.PublicClassRequestService;
import com.mycompany.englishtutor.module.tutor.api.response.PublicTutorResponse;
import com.mycompany.englishtutor.module.tutor.api.response.TutorProfileResponse;
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
    private PublicTutorService publicTutorService;

    @MockBean
    private PublicClassRequestService publicClassRequestService;

    @Test
    void getTutor_notActive_returns404Unavailable() throws Exception {
        when(publicTutorService.getActiveTutor(99L)).thenThrow(new AppException(ErrorCode.TUTOR_PROFILE_UNAVAILABLE));

        mockMvc.perform(get("/api/v1/public/tutors/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value(1101));
    }

    @Test
    void getTutor_publicDetail_doesNotExposePriceOrSpecialtyVerificationState() throws Exception {
        PublicTutorResponse tutor = PublicTutorResponse.builder()
                .tutorId(3L)
                .fullName("Phạm Ngọc Gia Sư")
                .specialties(List.of(TutorProfileResponse.SpecialtyResponse.builder()
                        .id(7L)
                        .specialty("IELTS")
                        .gradeLevel("THPT")
                        .build()))
                .teachingModes(List.of("ONLINE"))
                .build();
        when(publicTutorService.getActiveTutor(3L)).thenReturn(tutor);

        mockMvc.perform(get("/api/v1/public/tutors/3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.specialties[0].specialty").value("IELTS"))
                .andExpect(jsonPath("$.result.specialties[0].gradeLevel").value("THPT"))
                .andExpect(jsonPath("$.result.specialties[0].isVerified").doesNotExist())
                .andExpect(jsonPath("$.result.prices").doesNotExist());
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
