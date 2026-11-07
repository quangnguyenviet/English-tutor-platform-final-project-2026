package com.mycompany.englishtutor.module.matching.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

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
import com.mycompany.englishtutor.module.matching.api.request.CancelClassRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateClassRequest;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.ClassRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.service.StaffClassRequestService;
import com.mycompany.englishtutor.shared.api.PageResponse;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class StaffClassRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StaffClassRequestService service;

    private ClassRequestSummaryResponse summaryItem() {
        return ClassRequestSummaryResponse.builder()
                .id(1L)
                .requestCode("REQ-20261024-0001")
                .parentName("Nguyễn Văn A")
                .parentPhone("0987654321")
                .studentName("Nguyễn Văn Con")
                .tutorName("Trần Gia Sư")
                .classRequirement("Tiếng Anh giao tiếp")
                .status("NEW")
                .tab("new")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private ClassRequestDetailResponse detailItem() {
        return ClassRequestDetailResponse.builder()
                .id(1L)
                .requestCode("REQ-20261024-0001")
                .parentName("Nguyễn Văn A")
                .parentPhone("0987654321")
                .studentName("Nguyễn Văn Con")
                .grade("Lớp 10")
                .school("THPT Chu Văn An")
                .tutorId(10L)
                .tutorName("Trần Gia Sư")
                .tutorPhone("0912345678")
                .status("NEW")
                .tab("new")
                .classRequirement("Tiếng Anh 1 kèm 1")
                .sessionsPerWeek(2)
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(250000))
                .preferredSchedule("Thứ 2 - 4 - 6")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void getClassRequests_asReceptionist_shouldReturn200() throws Exception {
        PageResponse<ClassRequestSummaryResponse> pageResponse = PageResponse.<ClassRequestSummaryResponse>builder()
                .page(0)
                .size(20)
                .totalItems(1L)
                .totalPages(1)
                .items(List.of(summaryItem()))
                .build();

        when(service.getClassRequests(any(), any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/class-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.items[0].requestCode").value("REQ-20261024-0001"))
                .andExpect(jsonPath("$.result.items[0].parentName").value("Nguyễn Văn A"));
    }

    @Test
    void getTabCounts_asAdmin_shouldReturn200() throws Exception {
        when(service.getTabCounts()).thenReturn(Map.of("new", 5L, "trial", 2L, "matched", 10L, "cancelled", 1L, "total", 18L));

        mockMvc.perform(get("/api/v1/admin/class-requests/counts")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.new").value(5))
                .andExpect(jsonPath("$.result.total").value(18));
    }

    @Test
    void create_validRequest_shouldReturn201() throws Exception {
        CreateClassRequest request = CreateClassRequest.builder()
                .parentName("Lê Văn B")
                .phone("0988776655")
                .studentName("Lê Bé")
                .grade("Lớp 8")
                .school("THCS Đoàn Thị Điểm")
                .tutorId(10L)
                .classRequirement("Luyện nói tiếng Anh lớp 8")
                .sessionsPerWeek(3)
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(200000))
                .preferredSchedule("Tối T3-T5-T7")
                .tutorRequirement("Học sinh mất gốc phát âm")
                .build();

        when(service.create(any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/class-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.requestCode").value("REQ-20261024-0001"));
    }

    @Test
    void confirm_shouldReturn200() throws Exception {
        when(service.confirm(eq(1L), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/class-requests/1/confirm")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xác nhận và chuyển lớp sang đang dạy thử"));
    }

    @Test
    void complete_shouldReturn200() throws Exception {
        when(service.complete(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/class-requests/1/complete-match")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xác nhận ghép thành công, lớp học chuyển sang chính thức"));
    }

    @Test
    void complete_withFeeBody_shouldReturn200() throws Exception {
        when(service.complete(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/class-requests/1/complete-match")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionsPerWeek\":2,\"pricePerSession\":300000,\"feePercentage\":40}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xác nhận ghép thành công, lớp học chuyển sang chính thức"));
    }

    @Test
    void update_newRequest_shouldReturn200() throws Exception {
        when(service.update(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/class-requests/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teachingMode\":\"ONLINE\",\"pricePerSession\":300000,\"feePercentage\":35}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật lớp cần gia sư thành công"));
    }

    @Test
    void cancel_withoutReason_shouldReturn400() throws Exception {
        CancelClassRequest emptyRequest = new CancelClassRequest("");

        mockMvc.perform(post("/api/v1/class-requests/1/cancel")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancel_withReason_shouldReturn200() throws Exception {
        CancelClassRequest validRequest = new CancelClassRequest("Phụ huynh đổi ý không muốn học nữa");
        doNothing().when(service).cancel(eq(1L), any(), any());

        mockMvc.perform(post("/api/v1/class-requests/1/cancel")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã hủy lớp cần gia sư"));
    }

    @Test
    void changeDesignatedTutor_nullTutor_shouldReturn200() throws Exception {
        when(service.changeDesignatedTutor(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/v1/class-requests/1/designated-tutor")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tutorId\":null}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã cập nhật gia sư chỉ định"));
    }

    @Test
    void rematch_withoutReason_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/class-requests/1/rematch")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void checkParent_asReceptionist_shouldReturn200() throws Exception {
        when(service.checkParent(any())).thenReturn(
                com.mycompany.englishtutor.module.matching.api.response.ParentCheckResponse.builder()
                        .exists(true).nameMatches(false).parentName("Phạm Công Minh").build());

        mockMvc.perform(post("/api/v1/class-requests/parent-check")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"0984453212\",\"parentName\":\"Lê Thị Hoa\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.parentName").value("Phạm Công Minh"));
    }

    @Test
    void checkParent_invalidPhone_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/class-requests/parent-check")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"123\",\"parentName\":\"Lê Thị Hoa\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void checkParent_asTutor_shouldReturn403() throws Exception {
        mockMvc.perform(post("/api/v1/class-requests/parent-check")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"phone\":\"0984453212\",\"parentName\":\"Lê Thị Hoa\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthorized_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/class-requests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forbidden_asTutor_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/class-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isForbidden());
    }
}
