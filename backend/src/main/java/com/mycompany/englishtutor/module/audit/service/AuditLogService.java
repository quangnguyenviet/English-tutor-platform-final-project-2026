package com.mycompany.englishtutor.module.audit.service;

import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.audit.domain.AuditLog;
import com.mycompany.englishtutor.module.audit.repository.AuditLogRepository;

import jakarta.servlet.http.HttpServletRequest;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuditLogService {

    AuditLogRepository auditLogRepository;
    ObjectMapper objectMapper;

    /**
     * Ghi nhận một hành động quản trị / vận hành vào bảng audit_logs.
     */
    @Transactional(propagation = Propagation.REQUIRED)
    public void log(Long userId, String action, String entityType, Long entityId, Object details, HttpServletRequest request) {
        String detailsJson = null;
        if (details != null) {
            if (details instanceof String str) {
                detailsJson = str;
            } else {
                try {
                    detailsJson = objectMapper.writeValueAsString(details);
                } catch (JsonProcessingException e) {
                    log.warn("Không thể serialize details audit log: {}", e.getMessage());
                    detailsJson = "{}";
                }
            }
        }

        String clientIp = extractClientIp(request);

        AuditLog auditLog = AuditLog.builder()
                .userId(userId)
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(detailsJson)
                .ipAddress(clientIp)
                .createdAt(OffsetDateTime.now())
                .build();

        auditLogRepository.save(auditLog);
        log.info("Audit logged: user={}, action={}, entity={}:{}", userId, action, entityType, entityId);
    }

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
