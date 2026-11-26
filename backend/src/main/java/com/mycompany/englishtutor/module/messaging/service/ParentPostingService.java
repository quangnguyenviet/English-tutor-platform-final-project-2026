package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.Map;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.ApplicantItem;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.ApplicantsResponse;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.CreatePostingRequest;
import com.mycompany.englishtutor.module.messaging.api.PostingDtos.PostingItem;
import com.mycompany.englishtutor.module.messaging.pii.PiiDetector;
import com.mycompany.englishtutor.module.messaging.service.MessagingActor.ParentRef;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Luồng B phía phụ huynh: đăng tin "Lớp cần gia sư", xem ứng viên, đóng tin. */
@Service
@RequiredArgsConstructor
public class ParentPostingService {

    private static final String POSTING_SELECT = """
            SELECT cr.id, cr.status, cr.purpose, cr.province, cr.ward, cr.sessions_per_week, cr.price_per_session,
                   cr.teaching_mode, cr.class_requirement, cr.address, cr.gender_requirement, cr.tutor_requirement,
                   cr.duration_type, cr.preferred_schedule, cr.cancel_reason, cr.created_at,
                   (SELECT COUNT(*) FROM class_applications ca
                     WHERE ca.class_request_id = cr.id AND ca.status IN ('APPLIED', 'SELECTED')) AS applicant_count,
                   (SELECT c.id FROM classes c WHERE c.class_request_id = cr.id ORDER BY c.id DESC LIMIT 1) AS class_id
            FROM class_requests cr
            """;

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final AuditLogService auditLogService;
    private final PiiDetector piiDetector;
    private final ChatOutboxService outbox;

    @Transactional
    public PostingItem create(CreatePostingRequest request, HttpServletRequest http) {
        ParentRef parent = actor.requireParent();
        if (!parent.profileComplete()) {
            throw new AppException(ErrorCode.CHAT_PARENT_PROFILE_INCOMPLETE);
        }
        String note = request.note() == null || request.note().isBlank() ? null : request.note().strip();
        if (note != null && piiDetector.detect(note).blocked()) {
            throw new PiiBlockedException(piiDetector.detect(note).violations().stream()
                    .map(v -> new com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem(
                            v.type().name(), v.start(), v.end()))
                    .toList());
        }
        String purpose = request.purpose() != null ? request.purpose() : parent.purpose();
        String province = request.province() != null ? request.province() : parent.province();
        // Chỉ mượn phường/xã trong hồ sơ khi tin cùng tỉnh/thành, tránh ghép phường của nơi này với thành phố khác.
        String ward = blankToNull(request.ward()) != null ? blankToNull(request.ward())
                : province != null && province.equals(parent.province()) ? parent.ward() : null;
        // class_requirement bắt buộc khi tin được đăng (OPEN): dùng ghi chú hoặc mô tả theo mục đích.
        String requirement = note != null ? note : "Tìm gia sư tiếng Anh 1 kèm 1 - " + purposeLabel(purpose);
        Long id;
        try {
            id = jdbcTemplate.queryForObject(
                    """
                    INSERT INTO class_requests (parent_id, status, source, purpose, province, ward, class_requirement,
                                                teaching_mode, price_per_session, sessions_per_week, created_by,
                                                address, gender_requirement, tutor_requirement, duration_type, preferred_schedule)
                    VALUES (?, 'NEW', 'POSTING', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id
                    """,
                    Long.class, parent.parentId(), purpose, province, ward, requirement, request.teachingMode(),
                    request.referencePrice(), request.sessionsPerWeek(), parent.userId(),
                    blankToNull(request.address()), request.genderRequirement(), request.tutorRequirement(),
                    request.durationType(), blankToNull(request.availableTime()));
        } catch (DuplicateKeyException e) {
            throw new AppException(ErrorCode.POSTING_LIMIT_REACHED);
        }
        jdbcTemplate.update(
                """
                INSERT INTO notifications (user_id, title, content, link_entity_type, link_entity_id)
                SELECT id, 'Tin đăng tìm gia sư mới', ?, 'CLASS_REQUEST', ?
                FROM users WHERE role = 'RECEPTIONIST' AND status = 'ACTIVE'
                """,
                "Phụ huynh " + parent.fullName() + " vừa đăng tin tìm gia sư, cần duyệt.", id);
        auditLogService.log(parent.userId(), "CREATE_POSTING", "CLASS_REQUEST", id, Map.of("purpose", String.valueOf(purpose)), http);
        return find(id, parent.parentId());
    }

    @Transactional(readOnly = true)
    public List<PostingItem> listMine() {
        ParentRef parent = actor.requireParent();
        return jdbcTemplate.query(
                POSTING_SELECT + " WHERE cr.parent_id = ? AND cr.source = 'POSTING' ORDER BY cr.id DESC",
                (rs, i) -> map(rs), parent.parentId());
    }

    @Transactional(readOnly = true)
    public ApplicantsResponse applicants(Long postingId) {
        ParentRef parent = actor.requireParent();
        PostingItem posting = find(postingId, parent.parentId());
        List<ApplicantItem> items = jdbcTemplate.query(
                """
                SELECT ca.id, ca.tutor_id, u.full_name, u.avatar_url, t.university, t.experience_years, t.bio,
                       ca.message, ca.status, ca.applied_at,
                       (SELECT r.id FROM chat_rooms r WHERE r.class_application_id = ca.id) AS room_id
                FROM class_applications ca
                JOIN users u ON u.id = ca.tutor_id
                JOIN tutors t ON t.id = ca.tutor_id
                WHERE ca.class_request_id = ? AND ca.status IN ('APPLIED', 'SELECTED')
                ORDER BY ca.applied_at, ca.id
                """,
                (rs, i) -> new ApplicantItem(rs.getLong("id"), rs.getLong("tutor_id"), rs.getString("full_name"),
                        rs.getString("avatar_url"), rs.getString("university"),
                        rs.getObject("experience_years") == null ? null : rs.getInt("experience_years"),
                        rs.getString("bio"), rs.getString("message"), rs.getString("status"),
                        rs.getObject("room_id") == null ? null : rs.getLong("room_id"),
                        rs.getTimestamp("applied_at").toInstant().toString()),
                postingId);
        return new ApplicantsResponse(posting, items);
    }

    /** Phụ huynh đóng tin (NEW/OPEN): các lượt ứng tuyển còn chờ chuyển REJECTED, phòng chat tự khóa. */
    @Transactional
    public PostingItem cancel(Long postingId, String reason, HttpServletRequest http) {
        ParentRef parent = actor.requireParent();
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT status FROM class_requests WHERE id = ? AND parent_id = ? AND source = 'POSTING' FOR UPDATE",
                postingId, parent.parentId());
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.POSTING_NOT_FOUND);
        }
        String status = (String) rows.get(0).get("status");
        if (!"NEW".equals(status) && !"OPEN".equals(status)) {
            throw new AppException(ErrorCode.POSTING_INVALID_STATE);
        }
        String cleanReason = reason == null || reason.isBlank() ? "Phụ huynh đóng tin" : reason.strip();
        jdbcTemplate.update(
                "UPDATE class_requests SET status = 'CANCELLED', cancel_reason = ?, updated_at = NOW() WHERE id = ?",
                cleanReason, postingId);
        List<Long> tutors = jdbcTemplate.queryForList(
                "UPDATE class_applications SET status = 'REJECTED' WHERE class_request_id = ? AND status = 'APPLIED' RETURNING tutor_id",
                Long.class, postingId);
        for (Long tutorId : tutors) {
            outbox.notifyUser(tutorId, "Tin đăng đã đóng", "Phụ huynh đã đóng tin bạn ứng tuyển.", "CLASS_REQUEST", postingId);
        }
        auditLogService.log(parent.userId(), "CANCEL_POSTING", "CLASS_REQUEST", postingId, Map.of("reason", cleanReason), http);
        return find(postingId, parent.parentId());
    }

    private PostingItem find(Long id, Long parentId) {
        return jdbcTemplate
                .query(POSTING_SELECT + " WHERE cr.id = ? AND cr.parent_id = ? AND cr.source = 'POSTING'",
                        (rs, i) -> map(rs), id, parentId)
                .stream()
                .findFirst()
                .orElseThrow(() -> new AppException(ErrorCode.POSTING_NOT_FOUND));
    }

    private static PostingItem map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new PostingItem(rs.getLong("id"), rs.getString("status"), rs.getString("purpose"), rs.getString("province"),
                rs.getString("ward"), rs.getObject("sessions_per_week") == null ? null : rs.getInt("sessions_per_week"),
                rs.getBigDecimal("price_per_session"), rs.getString("teaching_mode"), rs.getString("class_requirement"),
                rs.getString("address"), rs.getString("gender_requirement"), rs.getString("tutor_requirement"),
                rs.getString("duration_type"), rs.getString("preferred_schedule"), rs.getString("cancel_reason"), rs.getInt("applicant_count"),
                rs.getObject("class_id") == null ? null : rs.getLong("class_id"),
                rs.getTimestamp("created_at").toInstant().toString());
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.strip();
    }

    static String purposeLabel(String purpose) {
        return switch (purpose == null ? "" : purpose) {
            case "PHU_THONG" -> "củng cố học phổ thông";
            case "THI_CHUAN" -> "luyện thi chứng chỉ";
            case "GIAO_TIEP" -> "giao tiếp";
            case "THI_HOC_KY" -> "luyện thi học kỳ";
            default -> "tiếng Anh";
        };
    }

}
