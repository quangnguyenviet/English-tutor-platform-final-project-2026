package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.MessagePage;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.PiiEventItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.PostingStaffItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.StaffRoomItem;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.Transcript;
import com.mycompany.englishtutor.module.messaging.api.StaffDtos.TrialClassItem;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Lễ tân/Admin: duyệt tin đăng, xem transcript chỉ đọc, log kiểm duyệt, lớp dạy thử từ chat. */
@Service
@RequiredArgsConstructor
public class StaffMessagingService {

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final AuditLogService auditLogService;
    private final ChatMessageService messages;
    private final ProposalReader proposalReader;
    private final ChatOutboxService outbox;

    // ------------------------------------------------------------ tin đăng

    @Transactional(readOnly = true)
    public List<PostingStaffItem> listPostings(String status) {
        String filter = status == null || status.isBlank() ? "cr.status IN ('NEW', 'OPEN')" : "cr.status = ?";
        Object[] args = status == null || status.isBlank() ? new Object[0] : new Object[] {status};
        return jdbcTemplate.query(
                """
                SELECT cr.id, cr.status, p.full_name, p.phone, cr.purpose, cr.province, cr.ward, cr.class_requirement,
                       cr.created_at,
                       (SELECT COUNT(*) FROM class_applications ca WHERE ca.class_request_id = cr.id AND ca.status IN ('APPLIED', 'SELECTED')) AS cnt
                FROM class_requests cr JOIN parents p ON p.id = cr.parent_id
                WHERE cr.source = 'POSTING' AND """ + " " + filter + " ORDER BY cr.id DESC LIMIT 200",
                (rs, i) -> new PostingStaffItem(rs.getLong("id"), rs.getString("status"), rs.getString("full_name"),
                        rs.getString("phone"), rs.getString("purpose"), rs.getString("province"), rs.getString("ward"),
                        rs.getString("class_requirement"), rs.getInt("cnt"), rs.getTimestamp("created_at").toInstant().toString()),
                args);
    }

    /** Duyệt tin: NEW → OPEN để gia sư ứng tuyển. */
    @Transactional
    public void approvePosting(Long id, HttpServletRequest http) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT status, parent_id FROM class_requests WHERE id = ? AND source = 'POSTING' FOR UPDATE", id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.POSTING_NOT_FOUND);
        }
        if (!"NEW".equals(rows.get(0).get("status"))) {
            throw new AppException(ErrorCode.POSTING_INVALID_STATE);
        }
        Long userId = actor.currentUserId();
        jdbcTemplate.update("UPDATE class_requests SET status = 'OPEN', handled_by = ?, updated_at = NOW() WHERE id = ?", userId, id);
        Long parentUserId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM parents WHERE id = ?", Long.class, rows.get(0).get("parent_id"));
        outbox.notifyUser(parentUserId, "Tin đăng đã được duyệt",
                "Tin tìm gia sư của bạn đã được đăng. Gia sư có thể bắt đầu ứng tuyển.", "CLASS_REQUEST", id);
        auditLogService.log(userId, "APPROVE_POSTING", "CLASS_REQUEST", id, Map.of("status", "OPEN"), http);
    }

    /** Hủy tin kèm lý do: phụ huynh nhận thông báo và được tạo tin mới. */
    @Transactional
    public void rejectPosting(Long id, String reason, HttpServletRequest http) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT status, parent_id FROM class_requests WHERE id = ? AND source = 'POSTING' FOR UPDATE", id);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.POSTING_NOT_FOUND);
        }
        String status = (String) rows.get(0).get("status");
        if (!"NEW".equals(status) && !"OPEN".equals(status)) {
            throw new AppException(ErrorCode.POSTING_INVALID_STATE);
        }
        Long userId = actor.currentUserId();
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, handled_by = ?, updated_at = NOW() WHERE id = ?",
                reason.strip(), userId, id);
        jdbcTemplate.update("UPDATE class_applications SET status = 'REJECTED' WHERE class_request_id = ? AND status = 'APPLIED'", id);
        Long parentUserId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM parents WHERE id = ?", Long.class, rows.get(0).get("parent_id"));
        outbox.notifyUser(parentUserId, "Tin đăng bị hủy", "Tin tìm gia sư của bạn đã bị hủy. Lý do: " + reason.strip(),
                "CLASS_REQUEST", id);
        auditLogService.log(userId, "REJECT_POSTING", "CLASS_REQUEST", id, Map.of("reason", reason.strip()), http);
    }

    // ------------------------------------------------------------ phòng chat

    @Transactional(readOnly = true)
    public List<StaffRoomItem> listRooms(String roomType, Boolean hasPending) {
        StringBuilder where = new StringBuilder(" WHERE TRUE ");
        if (roomType != null && !roomType.isBlank()) {
            where.append(" AND r.room_type = '").append("APPLICATION".equals(roomType) ? "APPLICATION" : "DIRECT").append("' ");
        }
        if (Boolean.TRUE.equals(hasPending)) {
            where.append(" AND EXISTS (SELECT 1 FROM proposal_messages x WHERE x.room_id = r.id AND x.status = 'PENDING') ");
        }
        return jdbcTemplate.query(roomSelect() + where + " ORDER BY COALESCE(r.last_message_at, r.created_at) DESC LIMIT 200",
                (rs, i) -> mapRoom(rs));
    }

    @Transactional
    public Transcript transcript(Long roomId, String before, Integer limit) {
        StaffRoomItem room = jdbcTemplate
                .query(roomSelect() + " WHERE r.id = ?", (rs, i) -> mapRoom(rs), roomId)
                .stream().findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        MessagePage page = messages.history(roomId, before, limit);
        auditLogService.log(actor.currentUserId(), "VIEW_CHAT_TRANSCRIPT", "CHAT_ROOM", roomId, null, null);
        return new Transcript(room, page, proposalReader.findByRoom(roomId, ChatRoomService.Viewer.STAFF), listPiiEvents(roomId, null));
    }

    // ------------------------------------------------------------ log kiểm duyệt

    @Transactional(readOnly = true)
    public List<PiiEventItem> listPiiEvents(Long roomId, String type) {
        StringBuilder where = new StringBuilder(" WHERE TRUE ");
        java.util.ArrayList<Object> args = new java.util.ArrayList<>();
        if (roomId != null) {
            where.append(" AND e.room_id = ? ");
            args.add(roomId);
        }
        if (type != null && !type.isBlank()) {
            where.append(" AND e.type = ? ");
            args.add(type);
        }
        return jdbcTemplate.query(
                """
                SELECT e.id, e.room_id, e.type, su.full_name AS sender_name, e.detail::text AS detail, e.blocked_text,
                       ru.full_name AS reviewer_name, e.reviewed_at, e.review_note, e.created_at
                FROM chat_pii_events e
                LEFT JOIN users su ON su.id = e.user_id
                LEFT JOIN users ru ON ru.id = e.reviewed_by
                """ + where + " ORDER BY e.id DESC LIMIT 200",
                (rs, i) -> new PiiEventItem(rs.getLong("id"), rs.getLong("room_id"), rs.getString("type"),
                        rs.getString("sender_name"), rs.getString("detail"), rs.getString("blocked_text"),
                        rs.getString("reviewer_name"),
                        rs.getTimestamp("reviewed_at") == null ? null : rs.getTimestamp("reviewed_at").toInstant().toString(),
                        rs.getString("review_note"), rs.getTimestamp("created_at").toInstant().toString()),
                args.toArray());
    }

    /** Đánh dấu đã xem xét một tin bị chặn; tin không bao giờ tự động công khai lại. */
    @Transactional
    public void reviewPiiEvent(Long eventId, String note, HttpServletRequest http) {
        Long userId = actor.currentUserId();
        int updated = jdbcTemplate.update(
                "UPDATE chat_pii_events SET reviewed_by = ?, reviewed_at = NOW(), review_note = ? WHERE id = ? AND type = 'PII_BLOCKED'",
                userId, note, eventId);
        if (updated == 0) {
            throw new AppException(ErrorCode.PII_REVIEW_NOT_FOUND);
        }
        auditLogService.log(userId, "REVIEW_PII_EVENT", "CHAT_PII_EVENT", eventId, null, http);
    }

    // ------------------------------------------------------------ lớp dạy thử tạo từ chat

    /** Lớp {@code TRIAL} tạo từ đề xuất (cả hai luồng) để Lễ tân theo dõi và xác nhận sau dạy thử. */
    @Transactional(readOnly = true)
    public List<TrialClassItem> listTrialClasses() {
        return jdbcTemplate.query(
                """
                SELECT c.id, c.class_name, tu.full_name AS tutor_name, su.full_name AS student_name,
                       pa.full_name AS parent_name, c.class_type, c.trial_date, c.created_at, c.class_request_id
                FROM classes c
                JOIN users tu ON tu.id = c.tutor_id
                JOIN users su ON su.id = c.student_id
                JOIN students s ON s.id = c.student_id
                JOIN parents pa ON pa.id = s.parent_id
                WHERE c.proposal_id IS NOT NULL AND c.status = 'TRIAL'
                ORDER BY c.id DESC LIMIT 200
                """,
                (rs, i) -> new TrialClassItem(rs.getLong("id"), rs.getString("class_name"), rs.getString("tutor_name"),
                        rs.getString("student_name"), rs.getString("parent_name"), rs.getString("class_type"),
                        rs.getString("trial_date"), rs.getTimestamp("created_at").toInstant().toString(),
                        rs.getObject("class_request_id") == null ? null : rs.getLong("class_request_id")));
    }

    private static String roomSelect() {
        return """
                SELECT r.id, r.room_type, r.status, pu.full_name AS parent_name, tu.full_name AS tutor_name,
                       r.class_application_id, ca.class_request_id, r.last_message_at, r.created_at,
                       (SELECT COUNT(*) FROM proposal_messages x WHERE x.room_id = r.id AND x.status = 'PENDING') AS pending,
                       (SELECT COUNT(*) FROM proposal_messages x WHERE x.room_id = r.id AND x.status = 'ACCEPTED') AS accepted,
                       (SELECT COUNT(*) FROM chat_pii_events e WHERE e.room_id = r.id AND e.type = 'PII_BLOCKED') AS blocked
                FROM chat_rooms r
                JOIN parents p ON p.id = r.parent_id
                JOIN users pu ON pu.id = p.user_id
                JOIN users tu ON tu.id = r.tutor_id
                LEFT JOIN class_applications ca ON ca.id = r.class_application_id
                """;
    }

    private static StaffRoomItem mapRoom(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new StaffRoomItem(rs.getLong("id"), rs.getString("room_type"), rs.getString("status"),
                rs.getString("parent_name"), rs.getString("tutor_name"),
                rs.getObject("class_application_id") == null ? null : rs.getLong("class_application_id"),
                rs.getObject("class_request_id") == null ? null : rs.getLong("class_request_id"),
                rs.getInt("pending"), rs.getInt("accepted"), rs.getInt("blocked"),
                rs.getTimestamp("last_message_at") == null ? null : rs.getTimestamp("last_message_at").toInstant().toString(),
                rs.getTimestamp("created_at").toInstant().toString());
    }
}
