package com.mycompany.englishtutor.module.complaint.repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.complaint.api.response.ComplaintResponse;
import com.mycompany.englishtutor.module.complaint.api.response.RefundResponse;
import com.mycompany.englishtutor.module.complaint.api.response.RefundablePaymentResponse;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintStatus;
import com.mycompany.englishtutor.module.complaint.domain.enums.ComplaintType;
import com.mycompany.englishtutor.module.complaint.domain.enums.RefundStatus;
import com.mycompany.englishtutor.module.complaint.service.ComplaintTargetEvaluator.TargetState;
import com.mycompany.englishtutor.shared.api.PageResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/** Truy vấn đọc cho khiếu nại và hoàn tiền (JdbcTemplate, không khóa dòng). */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ComplaintQueryRepository {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter CODE_DATE = DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String COMPLAINT_SELECT = """
            SELECT c.id, c.complaint_type, c.status, c.complainant_name, c.complainant_phone,
                   c.complainant_role, c.complaint_content, c.resolution, c.request_outcome,
                   c.class_request_id, cr.created_at AS cr_created_at,
                   COALESCE(su.full_name, cr.student_name) AS student_name,
                   pa.full_name AS parent_name,
                   c.class_id, cl.class_name,
                   COALESCE(cl.teaching_mode, cr.teaching_mode) AS teaching_mode,
                   c.received_by, ru.full_name AS received_by_name,
                   rsu.full_name AS resolved_by_name, c.resolved_at, c.created_at, c.updated_at,
                   lr.status AS latest_refund_status, lr.reject_reason AS latest_refund_reject_reason
            FROM complaints c
            JOIN class_requests cr ON cr.id = c.class_request_id
            JOIN parents pa ON pa.id = cr.parent_id
            LEFT JOIN users su ON su.id = cr.student_id
            LEFT JOIN classes cl ON cl.id = c.class_id
            JOIN users ru ON ru.id = c.received_by
            LEFT JOIN users rsu ON rsu.id = c.resolved_by
            LEFT JOIN LATERAL (
                SELECT r.status, r.reject_reason FROM refunds r
                WHERE r.complaint_id = c.id ORDER BY r.id DESC LIMIT 1
            ) lr ON TRUE
            """;

    private static final String REFUND_SELECT = """
            SELECT r.id, r.status, r.complaint_id, c.complaint_content, c.complainant_name, c.complainant_phone,
                   c.class_id, cl.class_name, cr.id AS class_request_id, cr.created_at AS cr_created_at,
                   COALESCE(su.full_name, cr.student_name) AS student_name,
                   r.payment_id, COALESCE(p.received_amount, p.amount, 0) AS received_amount,
                   COALESCE((SELECT SUM(r2.approved_amount) FROM refunds r2
                             WHERE r2.payment_id = r.payment_id AND r2.status = 'PAID' AND r2.id <> r.id), 0)
                       AS refunded_amount,
                   r.requested_amount, r.approved_amount, r.recipient_name, r.bank_name, r.bank_account_number,
                   r.reject_reason, r.proof_url,
                   r.requested_by, qu.full_name AS requested_by_name,
                   r.processed_by, pu.full_name AS processed_by_name, r.processed_at, r.created_at
            FROM refunds r
            JOIN complaints c ON c.id = r.complaint_id
            JOIN class_requests cr ON cr.id = c.class_request_id
            LEFT JOIN users su ON su.id = cr.student_id
            LEFT JOIN classes cl ON cl.id = c.class_id
            JOIN payments p ON p.id = r.payment_id
            JOIN users qu ON qu.id = r.requested_by
            LEFT JOIN users pu ON pu.id = r.processed_by
            """;

    JdbcTemplate jdbcTemplate;

    // ------------------------------------------------------------- COMPLAINT

    public PageResponse<ComplaintResponse> search(
            ComplaintStatus status, ComplaintType type, String keyword, int page, int size) {
        StringBuilder where = new StringBuilder(" WHERE 1 = 1");
        List<Object> params = new ArrayList<>();
        if (status != null) {
            where.append(" AND c.status = ?");
            params.add(status.name());
        }
        if (type != null) {
            where.append(" AND c.complaint_type = ?");
            params.add(type.name());
        }
        if (keyword != null && !keyword.isBlank()) {
            String pattern = "%" + keyword.trim().toLowerCase() + "%";
            where.append("""
                     AND (LOWER(c.complainant_name) LIKE ?
                          OR c.complainant_phone LIKE ?
                          OR LOWER('KN-' || c.id) LIKE ?
                          OR LOWER(COALESCE(su.full_name, cr.student_name, '')) LIKE ?
                          OR LOWER(pa.full_name) LIKE ?
                          OR pa.phone LIKE ?
                          OR LOWER(COALESCE(cl.class_name, '')) LIKE ?
                          OR LOWER('REQ-' || TO_CHAR(cr.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh', 'YYYYMMDD')
                                   || '-' || cr.id) LIKE ?)
                    """);
            for (int i = 0; i < 8; i++) {
                params.add(pattern);
            }
        }

        Long total = jdbcTemplate.queryForObject(
                """
                SELECT COUNT(*) FROM complaints c
                JOIN class_requests cr ON cr.id = c.class_request_id
                JOIN parents pa ON pa.id = cr.parent_id
                LEFT JOIN users su ON su.id = cr.student_id
                LEFT JOIN classes cl ON cl.id = c.class_id
                """ + where,
                Long.class, params.toArray());

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((long) page * size);
        List<ComplaintResponse> items = jdbcTemplate.query(
                COMPLAINT_SELECT + where + " ORDER BY c.created_at DESC, c.id DESC LIMIT ? OFFSET ?",
                (rs, i) -> mapComplaint(rs),
                pageParams.toArray());
        return PageResponse.of(items, page, size, total == null ? 0 : total);
    }

    public Optional<ComplaintResponse> findComplaint(Long id) {
        return jdbcTemplate.query(COMPLAINT_SELECT + " WHERE c.id = ?", (rs, i) -> mapComplaint(rs), id)
                .stream().findFirst();
    }

    /** Số đơn theo trạng thái, kèm {@code TOTAL}. */
    public Map<String, Long> countByStatus() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (ComplaintStatus status : ComplaintStatus.values()) {
            counts.put(status.name(), 0L);
        }
        jdbcTemplate.query(
                "SELECT status, COUNT(*) AS total FROM complaints GROUP BY status",
                rs -> {
                    counts.put(rs.getString("status"), rs.getLong("total"));
                });
        counts.put("TOTAL", counts.values().stream().mapToLong(Long::longValue).sum());
        return counts;
    }

    /** Trạng thái thô của lớp cần gia sư, {@code null} nếu không tồn tại. */
    public Optional<String> findRequestStatus(Long classRequestId) {
        return jdbcTemplate.queryForList(
                        "SELECT status FROM class_requests WHERE id = ?", String.class, classRequestId)
                .stream().findFirst();
    }

    /** Lớp học mới nhất của lớp cần gia sư (không khóa dòng, dùng được trong transaction chỉ đọc). */
    public Optional<ClassInfo> findLatestClass(Long classRequestId) {
        return jdbcTemplate.query(
                        """
                        SELECT id, status, teaching_mode, active_from, tutor_id, student_id, class_name
                        FROM classes WHERE class_request_id = ?
                        ORDER BY id DESC LIMIT 1
                        """,
                        (rs, i) -> mapClass(rs),
                        classRequestId)
                .stream().findFirst();
    }

    public Optional<ClassInfo> findClass(Long classId) {
        if (classId == null) {
            return Optional.empty();
        }
        return jdbcTemplate.query(
                        """
                        SELECT id, status, teaching_mode, active_from, tutor_id, student_id, class_name
                        FROM classes WHERE id = ?
                        """,
                        (rs, i) -> mapClass(rs),
                        classId)
                .stream().findFirst();
    }

    /** Dữ liệu đầu vào cho {@code ComplaintTargetEvaluator}. */
    public TargetState loadTargetState(Long classRequestId, Long complaintClassId) {
        String requestStatus = findRequestStatus(classRequestId).orElse(null);
        Optional<ClassInfo> latest = findLatestClass(classRequestId);
        Optional<ClassInfo> complaintClass = findClass(complaintClassId);
        return new TargetState(
                requestStatus,
                latest.map(ClassInfo::status).orElse(null),
                latest.map(ClassInfo::activeFrom).orElse(null),
                complaintClassId,
                complaintClass.map(ClassInfo::status).orElse(null));
    }

    public List<RefundablePaymentResponse> findRefundablePayments(Long classId) {
        if (classId == null) {
            return List.of();
        }
        return jdbcTemplate.query(
                """
                SELECT p.id, p.payer_type, p.payment_method, p.reviewed_at,
                       COALESCE(p.received_amount, p.amount, 0) AS received_amount,
                       COALESCE((SELECT SUM(r.approved_amount) FROM refunds r
                                 WHERE r.payment_id = p.id AND r.status = 'PAID'), 0) AS refunded_amount
                FROM payments p
                WHERE p.class_id = ? AND p.status = 'APPROVED'
                ORDER BY p.id
                """,
                (rs, i) -> {
                    BigDecimal received = rs.getBigDecimal("received_amount");
                    BigDecimal refunded = rs.getBigDecimal("refunded_amount");
                    return RefundablePaymentResponse.builder()
                            .paymentId(rs.getLong("id"))
                            .payerType(rs.getString("payer_type"))
                            .paymentMethod(rs.getString("payment_method"))
                            .reviewedAt(rs.getObject("reviewed_at", OffsetDateTime.class))
                            .receivedAmount(received)
                            .refundedAmount(refunded)
                            .remainingAmount(received.subtract(refunded).max(BigDecimal.ZERO))
                            .build();
                },
                classId);
    }

    /** Tổng đã hoàn ({@code PAID}) từ một khoản phí, trừ yêu cầu {@code excludeRefundId}. */
    public BigDecimal sumPaidRefunds(Long paymentId, Long excludeRefundId) {
        BigDecimal sum = jdbcTemplate.queryForObject(
                """
                SELECT COALESCE(SUM(approved_amount), 0) FROM refunds
                WHERE payment_id = ? AND status = 'PAID' AND id <> ?
                """,
                BigDecimal.class, paymentId, excludeRefundId == null ? -1L : excludeRefundId);
        return sum == null ? BigDecimal.ZERO : sum;
    }

    // ---------------------------------------------------------------- REFUND

    public PageResponse<RefundResponse> searchRefunds(RefundStatus tab, int page, int size) {
        RefundStatus status = tab == null ? RefundStatus.PENDING : tab;
        Long total = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM refunds WHERE status = ?", Long.class, status.name());
        String order = status == RefundStatus.PENDING
                ? " ORDER BY r.created_at ASC, r.id ASC"
                : " ORDER BY r.processed_at DESC NULLS LAST, r.id DESC";
        List<RefundResponse> items = jdbcTemplate.query(
                REFUND_SELECT + " WHERE r.status = ?" + order + " LIMIT ? OFFSET ?",
                (rs, i) -> mapRefund(rs),
                status.name(), size, (long) page * size);
        return PageResponse.of(items, page, size, total == null ? 0 : total);
    }

    public Map<String, Long> countRefundsByStatus() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (RefundStatus status : RefundStatus.values()) {
            counts.put(status.name(), 0L);
        }
        jdbcTemplate.query(
                "SELECT status, COUNT(*) AS total FROM refunds GROUP BY status",
                rs -> {
                    counts.put(rs.getString("status"), rs.getLong("total"));
                });
        return counts;
    }

    public Optional<RefundResponse> findRefund(Long id) {
        return jdbcTemplate.query(REFUND_SELECT + " WHERE r.id = ?", (rs, i) -> mapRefund(rs), id)
                .stream().findFirst();
    }

    public List<RefundResponse> findRefundsOfComplaint(Long complaintId) {
        return jdbcTemplate.query(
                REFUND_SELECT + " WHERE r.complaint_id = ? ORDER BY r.id DESC", (rs, i) -> mapRefund(rs), complaintId);
    }

    // ---------------------------------------------------------- NOTIFICATION

    public void notifyUser(Long userId, String title, String content, String entityType, Long entityId) {
        if (userId == null) {
            return;
        }
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, ?, ?)
                """,
                userId, title, content, entityType, entityId);
    }

    public void notifyRole(String role, String title, String content, String entityType, Long entityId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, ?, ? FROM users WHERE role = ? AND status = 'ACTIVE'
                """,
                title, content, entityType, entityId, role);
    }

    // ---------------------------------------------------------------- MAPPER

    public static String requestCode(long classRequestId, OffsetDateTime createdAt) {
        if (createdAt == null) {
            return "REQ-" + classRequestId;
        }
        return "REQ-" + createdAt.atZoneSameInstant(VN_ZONE).format(CODE_DATE) + "-" + classRequestId;
    }

    public static String complaintCode(Long id) {
        return id == null ? null : "KN-" + id;
    }

    private static ComplaintResponse mapComplaint(ResultSet rs) throws SQLException {
        long id = rs.getLong("id");
        long classRequestId = rs.getLong("class_request_id");
        return ComplaintResponse.builder()
                .id(id)
                .complaintCode(complaintCode(id))
                .complaintType(rs.getString("complaint_type"))
                .status(rs.getString("status"))
                .complainantName(rs.getString("complainant_name"))
                .complainantPhone(rs.getString("complainant_phone"))
                .complainantRole(rs.getString("complainant_role"))
                .complaintContent(rs.getString("complaint_content"))
                .resolution(rs.getString("resolution"))
                .requestOutcome(rs.getString("request_outcome"))
                .classRequestId(classRequestId)
                .requestCode(requestCode(classRequestId, rs.getObject("cr_created_at", OffsetDateTime.class)))
                .studentName(rs.getString("student_name"))
                .parentName(rs.getString("parent_name"))
                .classId(nullableLong(rs, "class_id"))
                .className(rs.getString("class_name"))
                .teachingMode(rs.getString("teaching_mode"))
                .receivedById(rs.getLong("received_by"))
                .receivedByName(rs.getString("received_by_name"))
                .resolvedByName(rs.getString("resolved_by_name"))
                .resolvedAt(rs.getObject("resolved_at", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .updatedAt(rs.getObject("updated_at", OffsetDateTime.class))
                .latestRefundStatus(rs.getString("latest_refund_status"))
                .latestRefundRejectReason(rs.getString("latest_refund_reject_reason"))
                .build();
    }

    private static RefundResponse mapRefund(ResultSet rs) throws SQLException {
        BigDecimal received = rs.getBigDecimal("received_amount");
        BigDecimal refunded = rs.getBigDecimal("refunded_amount");
        Long complaintId = rs.getLong("complaint_id");
        return RefundResponse.builder()
                .id(rs.getLong("id"))
                .status(rs.getString("status"))
                .complaintId(complaintId)
                .complaintCode(complaintCode(complaintId))
                .complaintContent(rs.getString("complaint_content"))
                .complainantName(rs.getString("complainant_name"))
                .complainantPhone(rs.getString("complainant_phone"))
                .classId(nullableLong(rs, "class_id"))
                .className(rs.getString("class_name"))
                .requestCode(requestCode(rs.getLong("class_request_id"), rs.getObject("cr_created_at", OffsetDateTime.class)))
                .studentName(rs.getString("student_name"))
                .paymentId(rs.getLong("payment_id"))
                .receivedAmount(received)
                .refundedAmount(refunded)
                .remainingAmount(received.subtract(refunded).max(BigDecimal.ZERO))
                .requestedAmount(rs.getBigDecimal("requested_amount"))
                .approvedAmount(rs.getBigDecimal("approved_amount"))
                .recipientName(rs.getString("recipient_name"))
                .bankName(rs.getString("bank_name"))
                .bankAccountNumber(rs.getString("bank_account_number"))
                .rejectReason(rs.getString("reject_reason"))
                .proofUrl(rs.getString("proof_url"))
                .requestedById(rs.getLong("requested_by"))
                .requestedByName(rs.getString("requested_by_name"))
                .processedById(nullableLong(rs, "processed_by"))
                .processedByName(rs.getString("processed_by_name"))
                .processedAt(rs.getObject("processed_at", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .build();
    }

    private static ClassInfo mapClass(ResultSet rs) throws SQLException {
        return new ClassInfo(
                rs.getLong("id"),
                rs.getString("status"),
                rs.getString("teaching_mode"),
                rs.getObject("active_from", LocalDate.class),
                rs.getLong("tutor_id"),
                rs.getLong("student_id"),
                rs.getString("class_name"));
    }

    private static Long nullableLong(ResultSet rs, String column) throws SQLException {
        long value = rs.getLong(column);
        return rs.wasNull() ? null : value;
    }

    /** Ảnh chụp một lớp học. */
    public record ClassInfo(
            Long id, String status, String teachingMode, LocalDate activeFrom,
            Long tutorId, Long studentId, String className) {}
}
