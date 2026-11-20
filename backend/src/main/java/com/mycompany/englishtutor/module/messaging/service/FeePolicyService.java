package com.mycompany.englishtutor.module.messaging.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Tra cứu và quản lý tỷ lệ phí nhận lớp theo loại lớp (bảng {@code platform_fee_policies}). */
@Service
@RequiredArgsConstructor
public class FeePolicyService {

    public static final List<String> CLASS_TYPES = List.of("SHORT_TERM", "REGULAR");

    public record FeePolicy(Long id, String classType, BigDecimal feePercentage, String effectiveFrom, boolean active) {}

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final AuditLogService auditLogService;

    /** Tỷ lệ đang hiệu lực: dòng mới nhất có {@code effective_from <= now} và {@code active}. */
    @Transactional(readOnly = true)
    public BigDecimal currentPercentage(String classType) {
        List<BigDecimal> rows = jdbcTemplate.queryForList(
                """
                SELECT fee_percentage FROM platform_fee_policies
                WHERE class_type = ? AND active AND effective_from <= NOW()
                ORDER BY effective_from DESC, id DESC LIMIT 1
                """,
                BigDecimal.class, classType);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.FEE_POLICY_NOT_FOUND);
        }
        return rows.get(0);
    }

    @Transactional(readOnly = true)
    public List<FeePolicy> listHistory() {
        return jdbcTemplate.query(
                """
                SELECT id, class_type, fee_percentage, effective_from, active FROM platform_fee_policies
                ORDER BY class_type, effective_from DESC, id DESC
                """,
                (rs, i) -> new FeePolicy(rs.getLong("id"), rs.getString("class_type"), rs.getBigDecimal("fee_percentage"),
                        rs.getTimestamp("effective_from").toInstant().toString(), rs.getBoolean("active")));
    }

    /** Thêm một dòng cấu hình mới (không sửa dòng cũ để giữ lịch sử). */
    @Transactional
    public FeePolicy addPolicy(String classType, BigDecimal percentage, HttpServletRequest http) {
        if (!CLASS_TYPES.contains(classType)) {
            throw new AppException(ErrorCode.PROPOSAL_INVALID_SCHEDULE, "Loại lớp không hợp lệ");
        }
        Long userId = actor.currentUserId();
        Long id = jdbcTemplate.queryForObject(
                "INSERT INTO platform_fee_policies (class_type, fee_percentage, created_by) VALUES (?, ?, ?) RETURNING id",
                Long.class, classType, percentage, userId);
        auditLogService.log(userId, "UPDATE_FEE_POLICY", "FEE_POLICY", id,
                Map.of("classType", classType, "feePercentage", percentage), http);
        return listHistory().stream().filter(p -> p.id().equals(id)).findFirst().orElseThrow();
    }
}
