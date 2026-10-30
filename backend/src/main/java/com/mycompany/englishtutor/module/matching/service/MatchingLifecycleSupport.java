package com.mycompany.englishtutor.module.matching.service;

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

    JdbcTemplate jdbcTemplate;
    PaymentService paymentService;

    /** Lớp mới nhất (bất kể trạng thái) của đơn, dùng để kiểm tra "đang dạy thử". */
    public Optional<ClassSnapshot> findLatestClass(Long classRequestId) {
        List<ClassSnapshot> rows = jdbcTemplate.query(
                """
                SELECT c.id, c.tutor_id, c.student_id, c.class_name, c.status
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
                        rs.getString("status")),
                classRequestId);
        return rows.stream().findFirst();
    }

    /**
     * Hủy payment nháp {@code NEW} của các lớp {@code TRIAL}, hủy buổi học chưa diễn ra
     * và chuyển mọi lớp chưa kết thúc của đơn sang {@code CANCELLED}.
     */
    public void closeOpenClasses(Long classRequestId) {
        List<Long> trialClassIds = jdbcTemplate.queryForList(
                "SELECT id FROM classes WHERE class_request_id = ? AND status = 'TRIAL'",
                Long.class, classRequestId);
        for (Long classId : trialClassIds) {
            paymentService.cancelDraftPayment(classId);
        }

        jdbcTemplate.update(
                """
                UPDATE sessions SET status = 'CANCELLED', updated_at = NOW()
                WHERE status = 'SCHEDULED'
                  AND class_id IN (SELECT id FROM classes
                                   WHERE class_request_id = ? AND status IN ('TRIAL', 'ACTIVE'))
                """,
                classRequestId);
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
    public record ClassSnapshot(Long id, Long tutorId, Long studentId, String className, String status) {

        public boolean isTrial() {
            return "TRIAL".equalsIgnoreCase(status);
        }

        public boolean isOpen() {
            return "TRIAL".equalsIgnoreCase(status) || "ACTIVE".equalsIgnoreCase(status);
        }
    }
}
