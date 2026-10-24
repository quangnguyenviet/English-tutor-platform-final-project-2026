package com.mycompany.englishtutor.module.payment.repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import com.mycompany.englishtutor.module.payment.api.response.PaymentResponse;
import com.mycompany.englishtutor.module.payment.domain.enums.PayerType;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentMethod;
import com.mycompany.englishtutor.module.payment.domain.enums.PaymentStatus;
import com.mycompany.englishtutor.shared.api.PageResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn đọc cho phí nhận lớp: ghép {@code payments} với lớp, gia sư, học sinh, phụ huynh bằng SQL
 * để module này không phụ thuộc entity của module lớp học.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PaymentQueryRepository {
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private static final String SELECT_COLUMNS =
            """
            SELECT p.id, p.class_id, p.payer_type, p.fee_percentage, p.amount, p.payment_method, p.proof_url,
                   p.received_amount, p.status, p.reject_reason, p.uploaded_by, p.uploaded_at,
                   p.reviewed_by, p.reviewed_at, p.created_at,
                   c.class_name, c.teaching_mode, c.price_per_session, c.active_from, c.tutor_id,
                   tu.full_name AS tutor_name, tu.phone AS tutor_phone,
                   su.full_name AS student_name, pa.full_name AS parent_name, pa.phone AS parent_phone,
                   (SELECT COUNT(*) FROM class_schedules cs WHERE cs.class_id = c.id) AS slots_per_week
            """;

    private static final String FROM_JOINS =
            """
            FROM payments p
            JOIN classes c ON c.id = p.class_id
            JOIN users tu ON tu.id = c.tutor_id
            JOIN students s ON s.id = c.student_id
            JOIN users su ON su.id = s.id
            JOIN parents pa ON pa.id = s.parent_id
            """;

    JdbcTemplate jdbcTemplate;

    /** Thông tin lớp dùng để tính phí. */
    public record ClassFeeInfo(Long classId, Long tutorId, BigDecimal pricePerSession, long slotsPerWeek) {}

    public Optional<ClassFeeInfo> findClassFeeInfo(Long classId) {
        return jdbcTemplate
                .query(
                        """
                        SELECT c.id, c.tutor_id, c.price_per_session,
                               (SELECT COUNT(*) FROM class_schedules cs WHERE cs.class_id = c.id) AS slots
                        FROM classes c WHERE c.id = ?
                        """,
                        (rs, i) -> new ClassFeeInfo(
                                rs.getLong("id"),
                                rs.getLong("tutor_id"),
                                rs.getBigDecimal("price_per_session"),
                                rs.getLong("slots")),
                        classId)
                .stream()
                .findFirst();
    }

    public Optional<PaymentResponse> findDetail(Long paymentId) {
        return jdbcTemplate
                .query(SELECT_COLUMNS + FROM_JOINS + " WHERE p.id = ?", (rs, i) -> mapRow(rs), paymentId)
                .stream()
                .findFirst();
    }

    public PageResponse<PaymentResponse> search(
            String keyword, PaymentStatus status, YearMonth month, Long tutorId, int page, int size) {
        List<String> conditions = new ArrayList<>();
        List<Object> params = new ArrayList<>();

        if (keyword != null && !keyword.isBlank()) {
            String trimmed = keyword.trim();
            String like = "%" + trimmed.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_") + "%";
            conditions.add(
                    """
                    (CAST(c.id AS TEXT) = ? OR unaccent(tu.full_name) ILIKE unaccent(?) ESCAPE '\\'
                     OR pa.phone LIKE ? ESCAPE '\\')
                    """);
            params.add(trimmed);
            params.add(like);
            params.add(like);
        }
        if (status != null) {
            conditions.add("p.status = ?");
            params.add(status.name());
        }
        if (month != null) {
            conditions.add("p.created_at >= ? AND p.created_at < ?");
            params.add(month.atDay(1).atStartOfDay(VN_ZONE).toOffsetDateTime());
            params.add(month.plusMonths(1).atDay(1).atStartOfDay(VN_ZONE).toOffsetDateTime());
        }
        if (tutorId != null) {
            conditions.add("c.tutor_id = ?");
            params.add(tutorId);
        }

        String where = conditions.isEmpty() ? "" : " WHERE " + String.join(" AND ", conditions);

        Long total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + FROM_JOINS + where, Long.class, params.toArray());

        List<Object> pageParams = new ArrayList<>(params);
        pageParams.add(size);
        pageParams.add((long) page * size);
        List<PaymentResponse> items = jdbcTemplate.query(
                SELECT_COLUMNS + FROM_JOINS + where + " ORDER BY p.created_at DESC, p.id DESC LIMIT ? OFFSET ?",
                (rs, i) -> mapRow(rs),
                pageParams.toArray());

        return PageResponse.of(items, page, size, total == null ? 0 : total);
    }

    /** Bản tạm: ghi thẳng bảng notifications, sẽ thay bằng NotificationService (T8-A1). */
    public void notifyUser(Long userId, String title, String content, Long paymentId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                VALUES (?, ?, ?, 'PAYMENT', ?)
                """,
                userId,
                title,
                content,
                paymentId);
    }

    public void notifyRole(String role, String title, String content, Long paymentId) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'PAYMENT', ? FROM users WHERE role = ? AND status = 'ACTIVE'
                """,
                title,
                content,
                paymentId,
                role);
    }

    private static PaymentResponse mapRow(ResultSet rs) throws SQLException {
        PaymentStatus status = PaymentStatus.valueOf(rs.getString("status"));
        String method = rs.getString("payment_method");
        return PaymentResponse.builder()
                .id(rs.getLong("id"))
                .classId(rs.getLong("class_id"))
                .className(rs.getString("class_name"))
                .teachingMode(rs.getString("teaching_mode"))
                .activeFrom(rs.getObject("active_from", LocalDate.class))
                .tutorId(rs.getLong("tutor_id"))
                .tutorName(rs.getString("tutor_name"))
                .tutorPhone(rs.getString("tutor_phone"))
                .studentName(rs.getString("student_name"))
                .parentName(rs.getString("parent_name"))
                .parentPhone(rs.getString("parent_phone"))
                .payerType(PayerType.valueOf(rs.getString("payer_type")))
                .feePercentage(rs.getBigDecimal("fee_percentage"))
                .pricePerSession(rs.getBigDecimal("price_per_session"))
                .slotsPerWeek(rs.getLong("slots_per_week"))
                .amount(rs.getBigDecimal("amount"))
                .paymentMethod(method == null ? null : PaymentMethod.valueOf(method))
                .proofUrl(rs.getString("proof_url"))
                .receivedAmount(rs.getBigDecimal("received_amount"))
                .status(status)
                .rejectReason(rs.getString("reject_reason"))
                .uploadedBy(rs.getObject("uploaded_by", Long.class))
                .uploadedAt(rs.getObject("uploaded_at", OffsetDateTime.class))
                .reviewedBy(rs.getObject("reviewed_by", Long.class))
                .reviewedAt(rs.getObject("reviewed_at", OffsetDateTime.class))
                .createdAt(rs.getObject("created_at", OffsetDateTime.class))
                .contactUnlocked(status == PaymentStatus.APPROVED)
                .build();
    }
}
