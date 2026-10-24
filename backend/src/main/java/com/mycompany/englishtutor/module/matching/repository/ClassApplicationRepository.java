package com.mycompany.englishtutor.module.matching.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

/**
 * Truy vấn ghi cho đơn ứng tuyển lớp (FR-08).
 *
 * <p>Bản tạm ghi thẳng bảng {@code notifications} cho Lễ tân; sẽ thay bằng NotificationService ở T8-A1.
 */
@Repository
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ClassApplicationRepository {

    JdbcTemplate jdbcTemplate;

    /** Trạng thái đơn lớp sau khi khóa dòng, dùng để quyết định apply có hợp lệ không. */
    public List<String> lockRequestStatus(Long classRequestId) {
        return jdbcTemplate.queryForList(
                "SELECT status FROM class_requests WHERE id = ? FOR UPDATE", String.class, classRequestId);
    }

    /** @return id của đơn ứng tuyển vừa tạo */
    public Long insert(Long classRequestId, Long tutorId, String message) {
        return jdbcTemplate.queryForObject(
                "INSERT INTO class_applications (class_request_id, tutor_id, message) "
                        + "VALUES (?, ?, ?) RETURNING id",
                Long.class,
                classRequestId,
                tutorId,
                message);
    }

    /** Khóa đơn lớp rồi đọc trạng thái đơn ứng tuyển để kiểm tra quyền rút. */
    public Optional<WithdrawState> findForWithdraw(Long applicationId) {
        return jdbcTemplate.query(
                        """
                        SELECT ca.id, ca.tutor_id, ca.status AS app_status, cr.status AS request_status,
                               EXISTS (SELECT 1 FROM class_applications sel
                                       WHERE sel.class_request_id = ca.class_request_id
                                         AND sel.status = 'SELECTED') AS has_selected
                        FROM class_applications ca
                        JOIN class_requests cr ON cr.id = ca.class_request_id
                        WHERE ca.id = ?
                        FOR UPDATE OF cr
                        """,
                        (rs, rowNum) -> new WithdrawState(
                                rs.getLong("tutor_id"),
                                rs.getString("app_status"),
                                rs.getString("request_status"),
                                rs.getBoolean("has_selected")),
                        applicationId)
                .stream()
                .findFirst();
    }

    public void delete(Long applicationId) {
        jdbcTemplate.update("DELETE FROM class_applications WHERE id = ?", applicationId);
    }

    /** Bản tạm: ghi thông báo cho mọi Lễ tân đang hoạt động (T8-A1 sẽ thay). */
    public void notifyReceptionists(Long classRequestId, String tutorName) {
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, ?, ?, 'CLASS_REQUEST', ? FROM users
                WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                "Gia sư ứng tuyển lớp mới",
                "Gia sư " + tutorName + " vừa ứng tuyển lớp " + requestCode(classRequestId)
                        + ". Vào danh sách ứng tuyển để ghép lớp.",
                classRequestId);
    }

    private static String requestCode(long id) {
        return "LOP-ENG-" + String.format("%04d", id);
    }

    public record WithdrawState(
            Long tutorId, String applicationStatus, String requestStatus, boolean hasSelected) {}
}
