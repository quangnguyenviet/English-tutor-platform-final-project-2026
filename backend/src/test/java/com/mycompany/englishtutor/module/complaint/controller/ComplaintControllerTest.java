package com.mycompany.englishtutor.module.complaint.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.mycompany.englishtutor.module.complaint.api.response.ComplaintDetailResponse;
import com.mycompany.englishtutor.module.complaint.api.response.ComplaintResponse;
import com.mycompany.englishtutor.module.complaint.domain.enums.RequestOutcome;
import com.mycompany.englishtutor.module.complaint.service.ComplaintService;
import com.mycompany.englishtutor.module.complaint.service.RefundService;
import com.mycompany.englishtutor.shared.api.PageResponse;

@SpringBootTest
@AutoConfigureMockMvc
@TestPropertySource("/test.properties")
class ComplaintControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ComplaintService complaintService;

    @MockBean
    private RefundService refundService;

    private static SimpleGrantedAuthority role(String name) {
        return new SimpleGrantedAuthority("ROLE_" + name);
    }

    @Test
    void list_asAccountant_isAllowed() throws Exception {
        when(complaintService.search(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(PageResponse.of(List.of(ComplaintResponse.builder().id(1L).complaintCode("KN-1").build()),
                        0, 20, 1));

        mockMvc.perform(get("/api/v1/complaints").with(jwt().authorities(role("ACCOUNTANT"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.items[0].complaintCode").value("KN-1"));
    }

    @Test
    void counts_asReceptionist_returnsMap() throws Exception {
        when(complaintService.counts()).thenReturn(Map.of("PENDING", 3L, "TOTAL", 5L));

        mockMvc.perform(get("/api/v1/complaints/counts").with(jwt().authorities(role("RECEPTIONIST"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.result.PENDING").value(3));
    }

    @Test
    void list_withoutToken_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/v1/complaints")).andExpect(status().isUnauthorized());
    }

    @Test
    void list_asTutor_isForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/complaints").with(jwt().authorities(role("TUTOR"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void create_asAccountant_isForbidden() throws Exception {
        mockMvc.perform(post("/api/v1/complaints")
                        .with(jwt().authorities(role("ACCOUNTANT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"complainantName":"Lê Hoàng Nam","complainantPhone":"0912345678",
                                 "complainantRole":"PARENT","complaintType":"NON_REFUND",
                                 "classRequestId":5,"complaintContent":"Gia sư đến muộn"}
                                """))
                .andExpect(status().isForbidden());
        verify(complaintService, never()).create(any());
    }

    @Test
    void create_missingFields_isBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/complaints")
                        .with(jwt().authorities(role("RECEPTIONIST")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"complainantName\":\"Lê Hoàng Nam\"}"))
                .andExpect(status().isBadRequest());
        verify(complaintService, never()).create(any());
    }

    @Test
    void resolve_multipartWithOutcome_passesToService() throws Exception {
        when(complaintService.resolve(eq(5L), eq(RequestOutcome.REMATCH), eq("Đã xác nhận"), isNull()))
                .thenReturn(ComplaintDetailResponse.builder().build());

        mockMvc.perform(multipart("/api/v1/complaints/5/resolve")
                        .param("requestOutcome", "REMATCH")
                        .param("resolution", "Đã xác nhận")
                        .with(jwt().authorities(role("RECEPTIONIST"))))
                .andExpect(status().isOk());
        verify(complaintService).resolve(eq(5L), eq(RequestOutcome.REMATCH), eq("Đã xác nhận"), isNull());
    }

    @Test
    void refunds_asReceptionist_isForbidden() throws Exception {
        mockMvc.perform(get("/api/v1/refunds").with(jwt().authorities(role("RECEPTIONIST"))))
                .andExpect(status().isForbidden());
    }

    @Test
    void refunds_asAdmin_isAllowed() throws Exception {
        when(refundService.search(any(), anyInt(), anyInt())).thenReturn(PageResponse.of(List.of(), 0, 20, 0));

        mockMvc.perform(get("/api/v1/refunds").with(jwt().authorities(role("ADMIN"))))
                .andExpect(status().isOk());
    }

    @Test
    void reject_withoutReason_isBadRequest() throws Exception {
        mockMvc.perform(post("/api/v1/refunds/4/reject")
                        .with(jwt().authorities(role("ACCOUNTANT")))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\" \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(1512));
    }
}
