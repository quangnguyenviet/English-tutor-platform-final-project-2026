package com.mycompany.englishtutor.module.messaging.service;

import java.math.BigDecimal;
import java.sql.Date;
import java.sql.Time;
import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.matching.service.StudentAccountService;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.AcceptResult;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Access;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;
import com.mycompany.englishtutor.module.payment.service.PaymentService;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/**
 * Phụ huynh đồng ý đề xuất: một transaction duy nhất tạo học sinh (nếu mới), lớp {@code TRIAL}, phí nháp, đóng tin
 * đăng liên quan và mở khóa SĐT. Khóa dòng đề xuất + idempotent nên double-click chỉ tạo một lớp.
 */
@Service
@RequiredArgsConstructor
public class ProposalAcceptService {

    private final JdbcTemplate jdbcTemplate;
    private final ChatRoomService rooms;
    private final StudentAccountService studentAccounts;
    private final PaymentService paymentService;
    private final ChatOutboxService outbox;
    private final AuditLogService auditLogService;

    /**
     * Điểm vào duy nhất. Khi đề xuất trùng lịch gia sư, trạng thái {@code EXPIRED} phải được commit nên
     * transaction không rollback với {@link ExpiredOnAccept}; mọi lỗi khác rollback toàn bộ.
     */
    @Transactional(noRollbackFor = ExpiredOnAccept.class)
    public AcceptResult accept(Long proposalId, HttpServletRequest http) {
        return doAccept(proposalId, http);
    }

    private AcceptResult doAccept(Long proposalId, HttpServletRequest http) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT p.*, p.expires_at < NOW() AS expired, COALESCE(array_length(p.schedule_days, 1), 0) AS sessions
                FROM proposal_messages p WHERE p.id = ? FOR UPDATE
                """,
                proposalId);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.PROPOSAL_NOT_FOUND);
        }
        Map<String, Object> p = rows.get(0);
        Long roomId = ((Number) p.get("room_id")).longValue();
        Access access = rooms.requireAccess(roomId, false);
        if (access.viewer() != Viewer.PARENT) {
            throw new AppException(ErrorCode.CHAT_PARENT_ONLY);
        }
        String status = (String) p.get("status");
        if ("ACCEPTED".equals(status)) {
            return existingResult(proposalId);
        }
        if (!"PENDING".equals(status) || Boolean.TRUE.equals(p.get("expired"))) {
            throw new AppException(ErrorCode.PROPOSAL_NOT_PENDING);
        }
        if (!"ACTIVE".equals(access.room().tutorProfileStatus())) {
            throw new AppException(ErrorCode.CHAT_TUTOR_NOT_ACTIVE);
        }
        Long tutorId = access.room().tutorId();
        Long parentId = access.room().parentId();

        // Tin đăng gốc (room APPLICATION): khóa dòng đơn, chỉ chốt khi tin còn nhận ứng tuyển.
        Long classRequestId = null;
        Long applicationId = access.room().classApplicationId();
        if (applicationId != null) {
            List<Map<String, Object>> req = jdbcTemplate.queryForList(
                    """
                    SELECT cr.id, cr.status, ca.status AS app_status FROM class_applications ca
                    JOIN class_requests cr ON cr.id = ca.class_request_id WHERE ca.id = ? FOR UPDATE OF cr
                    """,
                    applicationId);
            if (req.isEmpty() || !List.of("OPEN", "REMATCH").contains((String) req.get(0).get("status"))) {
                throw new AppException(ErrorCode.PROPOSAL_REQUEST_CLOSED);
            }
            if (!"APPLIED".equals(req.get(0).get("app_status"))) {
                throw new AppException(ErrorCode.CHAT_APPLICATION_NOT_AVAILABLE);
            }
            classRequestId = ((Number) req.get(0).get("id")).longValue();
        }

        planTrialSession(proposalId, p);
        if (tutorBusy(proposalId)) {
            jdbcTemplate.update("UPDATE proposal_messages SET status = 'EXPIRED', decided_at = NOW() WHERE id = ?", proposalId);
            outbox.enqueueSystemMessage(roomId, "PROPOSAL_EXPIRED",
                    "Khung giờ trong đề xuất #" + p.get("version") + " đã trùng lớp khác của gia sư. Gia sư vui lòng gửi đề xuất mới với khung giờ khác.");
            outbox.notifyUser(tutorId, "Đề xuất không còn hiệu lực",
                    "Đề xuất #" + p.get("version") + " trùng lịch lớp khác của bạn nên đã hết hiệu lực. Hãy gửi đề xuất mới.",
                    "CHAT_ROOM", roomId);
            throw new ExpiredOnAccept();
        }

        boolean created = false;
        String username = null;
        String initialPassword = null;
        Long studentId = p.get("student_id") == null ? null : ((Number) p.get("student_id")).longValue();
        if (studentId == null) {
            String phone = jdbcTemplate.queryForObject("SELECT phone FROM parents WHERE id = ?", String.class, parentId);
            StudentAccountService.StudentAccount account = studentAccounts.ensureStudent(
                    parentId, (String) p.get("student_name"), phone, (String) p.get("student_grade"),
                    (String) p.get("student_school"), (String) p.get("student_learning_goal"));
            studentId = account.id();
            created = account.created();
            if (created) {
                initialPassword = StudentAccountService.DEFAULT_STUDENT_PASSWORD;
            }
        }
        username = jdbcTemplate.queryForObject("SELECT username FROM users WHERE id = ?", String.class, studentId);

        Integer sameTutor = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM classes WHERE student_id = ? AND tutor_id = ? AND status IN ('TRIAL', 'ACTIVE')",
                Integer.class, studentId, tutorId);
        if (sameTutor != null && sameTutor > 0) {
            throw new AppException(ErrorCode.PROPOSAL_STUDENT_ALREADY_WITH_TUTOR);
        }

        String studentName = jdbcTemplate.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, studentId);
        BigDecimal price = (BigDecimal) p.get("price_per_session");
        BigDecimal fee = (BigDecimal) p.get("fee_percentage");
        Long classId = jdbcTemplate.queryForObject(
                """
                INSERT INTO classes (class_request_id, proposal_id, tutor_id, student_id, class_name, status, teaching_mode,
                                     price_per_session, sessions_per_week, trial_date, trial_start_time, trial_end_time,
                                     class_type, fee_percentage, trial_teaching_mode)
                VALUES (?, ?, ?, ?, ?, 'TRIAL', ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                """,
                Long.class, classRequestId, proposalId, tutorId, studentId, "Tiếng Anh 1 kèm 1 - " + studentName,
                p.get("class_mode"), price, p.get("sessions"), p.get("trial_date"), p.get("trial_time_from"),
                p.get("trial_time_to"), p.get("class_type"), fee,
                // Ca thử ONLINE bắt buộc có link nên để trống hình thức đến khi gia sư cập nhật lịch.
                "AT_HOME".equals(p.get("class_mode")) ? "AT_HOME" : null);

        paymentService.createDraftForClass(classId, fee, price);

        jdbcTemplate.update(
                "UPDATE proposal_messages SET status = 'ACCEPTED', decided_at = NOW(), rejection_reason = NULL WHERE id = ?", proposalId);

        if (classRequestId != null) {
            closeRequest(classRequestId, applicationId, studentId, tutorId, proposalId);
        }

        jdbcTemplate.update(
                "INSERT INTO chat_pii_events (room_id, user_id, type, detail) VALUES (?, ?, 'PHONE_UNLOCKED', ?::jsonb)",
                roomId, access.userId(), "{\"proposalId\":" + proposalId + "}");

        outbox.enqueueSystemMessage(roomId, "PROPOSAL_ACCEPTED",
                "Phụ huynh đã đồng ý đề xuất #" + p.get("version") + " cho học sinh " + studentName
                        + ". Lớp học thử đã được tạo và số điện thoại phụ huynh đã được chia sẻ với gia sư.");
        outbox.notifyUser(tutorId, "Đề xuất được đồng ý",
                "Phụ huynh đã đồng ý đề xuất cho học sinh " + studentName + ". Lớp dạy thử đã được tạo, số điện thoại phụ huynh đã được mở khóa.",
                "CLASS", classId);
        outbox.notifyUser(access.userId(), "Đã tạo lớp dạy thử",
                "Lớp dạy thử cho " + studentName + " đã được tạo. Gia sư sẽ liên hệ để thực hiện buổi dạy thử.", "CLASS", classId);
        auditLogService.log(access.userId(), "ACCEPT_PROPOSAL", "PROPOSAL", proposalId,
                Map.of("classId", classId, "classRequestId", String.valueOf(classRequestId), "studentId", studentId), http);
        outbox.publishAfterCommit(access.room().participantUserIds(), "proposal", Map.of("roomId", roomId, "proposalId", proposalId));
        return new AcceptResult(proposalId, classId, classRequestId, studentId, username, initialPassword, created);
    }

    /**
     * Buổi học thử là buổi đầu tiên trong lịch tính từ lúc phụ huynh đồng ý. Ghi vào đề xuất trước khi kiểm tra trùng
     * lịch, đồng thời cập nhật {@code p} để tạo lớp đúng ngày; gia sư đổi giờ sau ở trang lớp học.
     */
    private void planTrialSession(Long proposalId, Map<String, Object> p) {
        List<Integer> days = jdbcTemplate.queryForList(
                "SELECT unnest(schedule_days) FROM proposal_messages WHERE id = ?", Integer.class, proposalId);
        if (days.isEmpty()) {
            return;
        }
        Time from = (Time) p.get("schedule_time_from");
        Time to = (Time) p.get("schedule_time_to");
        Date date = Date.valueOf(TrialSessionPlanner.firstSessionDate(days, from.toLocalTime()));
        jdbcTemplate.update(
                "UPDATE proposal_messages SET trial_date = ?, trial_time_from = ?, trial_time_to = ? WHERE id = ?",
                date, from, to, proposalId);
        p.put("trial_date", date);
        p.put("trial_time_from", from);
        p.put("trial_time_to", to);
    }

    /** Báo lỗi trùng lịch cho phụ huynh nhưng vẫn commit trạng thái {@code EXPIRED} của đề xuất. */
    public static class ExpiredOnAccept extends AppException {
        public ExpiredOnAccept() {
            super(ErrorCode.PROPOSAL_TUTOR_BUSY);
        }
    }

    private void closeRequest(Long requestId, Long applicationId, Long studentId, Long tutorId, Long proposalId) {
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'MATCHED', student_id = ?, updated_at = NOW() WHERE id = ?", studentId, requestId);
        jdbcTemplate.update("UPDATE class_applications SET status = 'SELECTED' WHERE id = ?", applicationId);
        List<Long> rejectedTutors = jdbcTemplate.queryForList(
                """
                UPDATE class_applications SET status = 'REJECTED'
                WHERE class_request_id = ? AND id <> ? AND status = 'APPLIED' RETURNING tutor_id
                """,
                Long.class, requestId, applicationId);
        for (Long rejected : rejectedTutors) {
            outbox.notifyUser(rejected, "Kết quả ứng tuyển lớp",
                    "Lớp bạn ứng tuyển đã chọn được gia sư khác. Cảm ơn bạn đã quan tâm, hẹn gặp lại ở các lớp tiếp theo.",
                    "CLASS_REQUEST", requestId);
        }
        // Đề xuất đang chờ của các ứng viên còn lại hết hiệu lực vì tin đã đóng.
        List<Map<String, Object>> expired = jdbcTemplate.queryForList(
                """
                UPDATE proposal_messages SET status = 'EXPIRED', decided_at = NOW()
                WHERE status = 'PENDING' AND id <> ?
                  AND room_id IN (SELECT r.id FROM chat_rooms r JOIN class_applications ca ON ca.id = r.class_application_id
                                  WHERE ca.class_request_id = ?)
                RETURNING room_id, version
                """,
                proposalId, requestId);
        for (Map<String, Object> e : expired) {
            outbox.enqueueSystemMessage(((Number) e.get("room_id")).longValue(), "PROPOSAL_EXPIRED",
                    "Đề xuất #" + e.get("version") + " không còn hiệu lực vì tin đăng đã chọn được gia sư.");
        }
    }

    /** Trùng lịch của gia sư: lịch cố định, ca thử với lịch cố định, hoặc hai ca thử chồng nhau. */
    private boolean tutorBusy(Long proposalId) {
        Boolean busy = jdbcTemplate.queryForObject(
                """
                SELECT EXISTS (
                    SELECT 1 FROM proposal_messages p
                    JOIN classes c ON c.tutor_id = p.tutor_id AND c.status IN ('TRIAL', 'ACTIVE')
                    JOIN class_schedules cs ON cs.class_id = c.id
                    WHERE p.id = ? AND (cs.valid_to IS NULL OR cs.valid_to >= CURRENT_DATE)
                      AND cs.day_of_week = ANY (p.schedule_days)
                      AND cs.start_time < p.schedule_time_to AND cs.end_time > p.schedule_time_from
                ) OR EXISTS (
                    SELECT 1 FROM proposal_messages p
                    JOIN classes c ON c.tutor_id = p.tutor_id AND c.status IN ('TRIAL', 'ACTIVE')
                    JOIN class_schedules cs ON cs.class_id = c.id
                    WHERE p.id = ? AND (cs.valid_to IS NULL OR cs.valid_to >= CURRENT_DATE)
                      AND cs.day_of_week = EXTRACT(ISODOW FROM p.trial_date)::int
                      AND cs.start_time < p.trial_time_to AND cs.end_time > p.trial_time_from
                ) OR EXISTS (
                    SELECT 1 FROM proposal_messages p
                    JOIN classes c ON c.tutor_id = p.tutor_id AND c.status = 'TRIAL'
                    WHERE p.id = ? AND c.trial_date = p.trial_date
                      AND c.trial_start_time < p.trial_time_to AND c.trial_end_time > p.trial_time_from
                )
                """,
                Boolean.class, proposalId, proposalId, proposalId);
        return Boolean.TRUE.equals(busy);
    }

    private AcceptResult existingResult(Long proposalId) {
        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT c.id, c.class_request_id, c.student_id, u.username FROM classes c JOIN users u ON u.id = c.student_id WHERE c.proposal_id = ?",
                proposalId);
        return new AcceptResult(proposalId, ((Number) row.get("id")).longValue(),
                row.get("class_request_id") == null ? null : ((Number) row.get("class_request_id")).longValue(),
                ((Number) row.get("student_id")).longValue(), (String) row.get("username"), null, false);
    }
}
