package com.mycompany.englishtutor.module.matching.service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import com.mycompany.englishtutor.module.payment.service.PaymentService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Các bước dùng chung khi đóng một vòng ghép lớp (hủy đơn hoặc ghép lại — ERD C-14):
 * đóng lớp dạy thử, loại gia sư đã chọn ({@code TERMINATED}) và thông báo các bên.
 *
 * <p>Gọi bên trong transaction của service, sau khi đã khóa {@code class_requests FOR UPDATE}.
 */
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MatchingLifecycleSupport {

    /** Phụ huynh, gia sư được hủy lớp trong 7 ngày kể từ khi ghép thành công (Quy định website I.3). */
    public static final int CANCEL_WINDOW_DAYS = 7;

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    JdbcTemplate jdbcTemplate;
    PaymentService paymentService;

    /** Ngày cuối cùng còn được hủy, null khi lớp chưa có ngày bắt đầu chính thức. */
    public static LocalDate cancelDeadline(LocalDate activeFrom) {
        return activeFrom == null ? null : activeFrom.plusDays(CANCEL_WINDOW_DAYS);
    }

    public static LocalDate today() {
        return LocalDate.now(VN_ZONE);
    }

    /** Lớp mới nhất (bất kể trạng thái) của đơn, dùng để kiểm tra "đang dạy thử". */
    public Optional<ClassSnapshot> findLatestClass(Long classRequestId) {
        List<ClassSnapshot> rows = jdbcTemplate.query(
                """
                SELECT c.id, c.tutor_id, c.student_id, c.class_name, c.status, c.active_from
                FROM classes c
                WHERE c.class_request_id = ?
                ORDER BY c.id DESC LIMIT 1
                FOR UPDATE
                """,
                (rs, i) -> new ClassSnapshot(
                        rs.getLong("id"),
                        rs.getLong("tutor_id"),
                        rs.getLong("student_id"),
                        rs.getString("class_name"),
                        rs.getString("status"),
                        rs.getObject("active_from", LocalDate.class)),
                classRequestId);
        return rows.stream().findFirst();
    }

    /**
     * Hủy payment nháp {@code NEW} của các lớp {@code TRIAL}, ẩn bài giảng của
     * lớp TRIAL (lớp chết không treo bài giảng) và chuyển mọi lớp chưa kết thúc
     * của đơn sang {@code CANCELLED}. V16: không còn bảng sessions — bài giảng
     * (lessons, driver nhúng lớp) chỉ cần ẩn khi lớp TRIAL; lớp ACTIVE giữ nguyên.
     */
    public void closeOpenClasses(Long classRequestId) {
        List<Long> trialClassIds = jdbcTemplate.queryForList(
                "SELECT id FROM classes WHERE class_request_id = ? AND status = 'TRIAL'",
                Long.class, classRequestId);
        for (Long classId : trialClassIds) {
            paymentService.cancelDraftPayment(classId);
            jdbcTemplate.update(
                    "UPDATE lessons SET status = 'HIDDEN', updated_at = NOW() WHERE class_id = ? AND status = 'PUBLISHED'",
                    classId);
        }

        jdbcTemplate.update(
                """
                UPDATE classes SET status = 'CANCELLED', updated_at = NOW()
                WHERE class_request_id = ? AND status IN ('TRIAL', 'ACTIVE')
                """,
                classRequestId);
    }

    /**
     * Loại gia sư khỏi đơn: lượt {@code SELECTED} → {@code TERMINATED}. Đơn chỉ định không có
     * lượt ứng tuyển nên chèn một dòng {@code TERMINATED} — UNIQUE (class_request_id, tutor_id)
     * chặn gia sư này ứng tuyển lại đơn (ERD C-01).
     */
    public void terminateTutor(Long classRequestId, Long tutorId) {
        jdbcTemplate.update(
                """
                INSERT INTO class_applications (class_request_id, tutor_id, status)
                VALUES (?, ?, 'TERMINATED')
                ON CONFLICT (class_request_id, tutor_id) DO UPDATE SET status = 'TERMINATED'
                """,
                classRequestId, tutorId);
    }

    /** Các lượt còn {@code APPLIED} chuyển {@code REJECTED} khi đơn bị hủy. */
    public void rejectPendingApplications(Long classRequestId) {
        jdbcTemplate.update(
                "UPDATE class_applications SET status = 'REJECTED' WHERE class_request_id = ? AND status = 'APPLIED'",
                classRequestId);
    }

    /**
     * Khi ghép lại, gia sư trước đó bị {@code REJECTED} vì người khác được chọn quay về {@code APPLIED}.
     * Gia sư bị loại sau dạy thử giữ {@code TERMINATED}.
     *
     * @return danh sách gia sư vừa được khôi phục
     */
    public List<Long> reopenRejectedApplications(Long classRequestId) {
        return jdbcTemplate.queryForList(
                """
                UPDATE class_applications SET status = 'APPLIED'
                WHERE class_request_id = ? AND status = 'REJECTED'
                RETURNING tutor_id
                """,
                Long.class, classRequestId);
    }

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

    /** Ảnh chụp lớp mới nhất của đơn. */
    public record ClassSnapshot(
            Long id, Long tutorId, Long studentId, String className, String status, LocalDate activeFrom) {

        public boolean isTrial() {
            return "TRIAL".equalsIgnoreCase(status);
        }

        public boolean isOpen() {
            return "TRIAL".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status);
        }

        /** Lớp đã ghép thành công và đã quá hạn hủy tính đến ngày {@code today}. */
        public boolean isCancelExpired(LocalDate today) {
            boolean matched = "ACTIVE".equalsIgnoreCase(status) || "COMPLETED".equalsIgnoreCase(status);
            LocalDate deadline = cancelDeadline(activeFrom);
            return matched && deadline != null && today.isAfter(deadline);
        }
    }
}
