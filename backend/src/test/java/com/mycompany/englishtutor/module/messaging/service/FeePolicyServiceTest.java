package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

class FeePolicyServiceTest {

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final FeePolicyService service =
            new FeePolicyService(jdbc, mock(MessagingActor.class), mock(AuditLogService.class));

    @Test
    void currentPercentage_returnsLatestEffectivePolicy() {
        when(jdbc.queryForList(contains("platform_fee_policies"), eq(BigDecimal.class), eq("SHORT_TERM")))
                .thenReturn(List.of(new BigDecimal("25.00")));

        assertEquals(new BigDecimal("25.00"), service.currentPercentage("SHORT_TERM"));
    }

    @Test
    void currentPercentage_missingPolicy_throws() {
        when(jdbc.queryForList(contains("platform_fee_policies"), eq(BigDecimal.class), any(Object.class)))
                .thenReturn(List.of());

        AppException ex = assertThrows(AppException.class, () -> service.currentPercentage("REGULAR"));

        assertEquals(ErrorCode.FEE_POLICY_NOT_FOUND, ex.getErrorCode());
    }

    @Test
    void addPolicy_unknownClassType_isRejected() {
        assertThrows(AppException.class, () -> service.addPolicy("LIFETIME", BigDecimal.TEN, null));
    }
}
