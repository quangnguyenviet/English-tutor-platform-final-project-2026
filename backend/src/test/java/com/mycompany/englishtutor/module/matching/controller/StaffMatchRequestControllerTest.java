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
import com.mycompany.englishtutor.module.matching.api.request.CancelMatchRequest;
import com.mycompany.englishtutor.module.matching.api.request.CreateMatchRequest;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestDetailResponse;
import com.mycompany.englishtutor.module.matching.api.response.MatchRequestSummaryResponse;
import com.mycompany.englishtutor.module.matching.service.StaffMatchRequestService;
import com.mycompany.englishtutor.shared.api.PageResponse;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class StaffMatchRequestControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StaffMatchRequestService staffMatchRequestService;

    private MatchRequestSummaryResponse summaryItem() {
        return MatchRequestSummaryResponse.builder()
                .id(1L)
                .requestCode("REQ-20261024-0001")
                .parentName("Nguyễn Văn A")
                .parentPhone("0987654321")
                .studentName("Nguyễn Văn Con")
                .tutorName("Trần Gia Sư")
                .className("Tiếng Anh giao tiếp")
                .status("PENDING")
                .tab("pending")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    private MatchRequestDetailResponse detailItem() {
        return MatchRequestDetailResponse.builder()
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
                .status("PENDING")
                .tab("pending")
                .className("Tiếng Anh 1 kèm 1")
                .sessionsPerWeek(2)
                .durationMinutes(90)
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(250000))
                .preferredSchedule("Thứ 2 - 4 - 6")
                .createdAt(OffsetDateTime.now())
                .build();
    }

    @Test
    void getMatchRequests_asReceptionist_shouldReturn200() throws Exception {
        PageResponse<MatchRequestSummaryResponse> pageResponse = PageResponse.<MatchRequestSummaryResponse>builder()
                .page(0)
                .size(20)
                .totalItems(1L)
                .totalPages(1)
                .items(List.of(summaryItem()))
                .build();

        when(staffMatchRequestService.getMatchRequests(any(), any(), any(), any())).thenReturn(pageResponse);

        mockMvc.perform(get("/api/v1/match-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.items[0].requestCode").value("REQ-20261024-0001"))
                .andExpect(jsonPath("$.result.items[0].parentName").value("Nguyễn Văn A"));
    }

    @Test
    void getTabCounts_asAdmin_shouldReturn200() throws Exception {
        when(staffMatchRequestService.getTabCounts()).thenReturn(Map.of("pending", 5L, "trial", 2L, "matched", 10L, "cancelled", 1L, "total", 18L));

        mockMvc.perform(get("/api/v1/admin/match-requests/counts")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.pending").value(5))
                .andExpect(jsonPath("$.result.total").value(18));
    }

    @Test
    void createMatchRequest_validRequest_shouldReturn201() throws Exception {
        CreateMatchRequest request = CreateMatchRequest.builder()
                .parentName("Lê Văn B")
                .phone("0988776655")
                .studentName("Lê Bé")
                .grade("Lớp 8")
                .school("THCS Đoàn Thị Điểm")
                .tutorId(10L)
                .className("Luyện nói tiếng Anh lớp 8")
                .sessionsPerWeek(3)
                .durationMinutes(60)
                .teachingMode("ONLINE")
                .pricePerSession(BigDecimal.valueOf(200000))
                .preferredSchedule("Tối T3-T5-T7")
                .notes("Học sinh mất gốc phát âm")
                .build();

        when(staffMatchRequestService.createMatchRequest(any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/match-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.result.requestCode").value("REQ-20261024-0001"));
    }

    @Test
    void confirmMatchRequest_shouldReturn200() throws Exception {
        when(staffMatchRequestService.confirmMatchRequest(eq(1L), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/match-requests/1/confirm")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã xác nhận đơn ghép lớp và chuyển sang đang dạy thử"));
    }

    @Test
    void completeMatchRequest_shouldReturn200() throws Exception {
        when(staffMatchRequestService.completeMatchRequest(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/match-requests/1/complete-match")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã duyệt đơn ghép lớp thành công, lớp học chuyển sang chính thức"));
    }

    @Test
    void completeMatchRequest_withFeeBody_shouldReturn200() throws Exception {
        when(staffMatchRequestService.completeMatchRequest(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(post("/api/v1/match-requests/1/complete-match")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"sessionsPerWeek\":2,\"pricePerSession\":300000,\"feePercentage\":40}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã duyệt đơn ghép lớp thành công, lớp học chuyển sang chính thức"));
    }

    @Test
    void updateMatchRequest_newRequest_shouldReturn200() throws Exception {
        when(staffMatchRequestService.updateMatchRequest(eq(1L), any(), any())).thenReturn(detailItem());

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/match-requests/1")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"teachingMode\":\"ONLINE\",\"pricePerSession\":300000,\"feePercentage\":35}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Cập nhật đơn ghép lớp thành công"));
    }

    @Test
    void cancelMatchRequest_withoutReason_shouldReturn400() throws Exception {
        CancelMatchRequest emptyRequest = new CancelMatchRequest("");

        mockMvc.perform(post("/api/v1/match-requests/1/cancel")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(emptyRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void cancelMatchRequest_withReason_shouldReturn200() throws Exception {
        CancelMatchRequest validRequest = new CancelMatchRequest("Phụ huynh đổi ý không muốn học nữa");
        doNothing().when(staffMatchRequestService).cancelMatchRequest(eq(1L), any(), any());

        mockMvc.perform(post("/api/v1/match-requests/1/cancel")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đã hủy đơn ghép lớp thành công"));
    }

    @Test
    void unauthorized_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/api/v1/match-requests"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forbidden_asTutor_shouldReturn403() throws Exception {
        mockMvc.perform(get("/api/v1/match-requests")
                        .with(jwt().authorities(new SimpleGrantedAuthority("ROLE_TUTOR"))))
                .andExpect(status().isForbidden());
    }
}
