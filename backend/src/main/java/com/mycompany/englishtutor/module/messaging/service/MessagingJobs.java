package com.mycompany.englishtutor.module.messaging.service;

import java.util.List;
import java.util.Map;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Job nền của MSG: hết hạn đề xuất, kết thúc lớp ngắn hạn, nhắc tin đăng, đối soát Rocket.Chat. */
@Slf4j
@Component
@RequiredArgsConstructor
public class MessagingJobs {

    private final JdbcTemplate jdbcTemplate;
    private final ChatOutboxService outbox;
    private final RocketChatClient client;
    private final MessagingProperties properties;

    /** Đề xuất PENDING quá hạn, hoặc phòng đã khóa (gia sư INACTIVE, ứng viên bị loại, tin đã hủy) → EXPIRED. */
    @Scheduled(fixedDelay = 60_000L, initialDelay = 30_000L)
    public void expireProposalsScheduled() {
        if (properties.isJobsEnabled()) {
            expireProposals();
        }
    }

    @Transactional
    public int expireProposals() {
        List<Map<String, Object>> expired = jdbcTemplate.queryForList(
                """
                UPDATE proposal_messages p SET status = 'EXPIRED', decided_at = NOW()
                FROM chat_rooms r
                JOIN tutors t ON t.id = r.tutor_id
                LEFT JOIN class_applications ca ON ca.id = r.class_application_id
                LEFT JOIN class_requests cr ON cr.id = ca.class_request_id
                WHERE p.room_id = r.id AND p.status = 'PENDING'
                  AND (p.expires_at < NOW()
                       OR t.profile_status <> 'ACTIVE'
                       OR (r.room_type = 'APPLICATION'
                           AND (ca.id IS NULL OR ca.status NOT IN ('APPLIED', 'SELECTED')
                                OR cr.status NOT IN ('OPEN', 'REMATCH', 'MATCHED'))))
                RETURNING p.id, p.room_id, p.version, p.tutor_id
                """);
        for (Map<String, Object> e : expired) {
            Long roomId = ((Number) e.get("room_id")).longValue();
            outbox.enqueueSystemMessage(roomId, "PROPOSAL_EXPIRED",
                    "Đề xuất #" + e.get("version") + " đã hết hiệu lực. Gia sư có thể gửi đề xuất mới nếu hai bên vẫn muốn học.");
            outbox.notifyUser(((Number) e.get("tutor_id")).longValue(), "Đề xuất hết hiệu lực",
                    "Đề xuất #" + e.get("version") + " của bạn đã hết hiệu lực.", "CHAT_ROOM", roomId);
        }
        return expired.size();
    }

    /** Lớp SHORT_TERM quá {@code end_date} tự chuyển COMPLETED; nhắc trước 3 ngày. */
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Ho_Chi_Minh")
    public void closeShortTermClassesScheduled() {
        if (properties.isJobsEnabled()) {
            closeShortTermClasses();
        }
    }

    @Transactional
    public int closeShortTermClasses() {
        List<Map<String, Object>> reminders = jdbcTemplate.queryForList(
                """
                SELECT c.id, c.tutor_id, pa.user_id AS parent_user_id FROM classes c
                JOIN students s ON s.id = c.student_id JOIN parents pa ON pa.id = s.parent_id
                WHERE c.class_type = 'SHORT_TERM' AND c.status = 'ACTIVE' AND c.end_date = CURRENT_DATE + 3
                """);
        for (Map<String, Object> r : reminders) {
            Long classId = ((Number) r.get("id")).longValue();
            outbox.notifyUser(((Number) r.get("tutor_id")).longValue(), "Lớp ngắn hạn sắp kết thúc",
                    "Lớp ngắn hạn sẽ kết thúc sau 3 ngày.", "CLASS", classId);
            if (r.get("parent_user_id") != null) {
                outbox.notifyUser(((Number) r.get("parent_user_id")).longValue(), "Lớp ngắn hạn sắp kết thúc",
                        "Lớp ngắn hạn của con sẽ kết thúc sau 3 ngày.", "CLASS", classId);
            }
        }
        List<Map<String, Object>> done = jdbcTemplate.queryForList(
                """
                UPDATE classes SET status = 'COMPLETED', updated_at = NOW()
                WHERE class_type = 'SHORT_TERM' AND status = 'ACTIVE' AND end_date < CURRENT_DATE
                RETURNING id, tutor_id
                """);
        for (Map<String, Object> d : done) {
            outbox.notifyUser(((Number) d.get("tutor_id")).longValue(), "Lớp ngắn hạn đã kết thúc",
                    "Lớp ngắn hạn đã hoàn thành sau 1 tháng.", "CLASS", ((Number) d.get("id")).longValue());
        }
        return done.size();
    }

    /** Tin đăng OPEN sau 14 ngày chưa có ứng viên: nhắc phụ huynh một lần, không tự đóng. */
    @Scheduled(cron = "0 30 8 * * *", zone = "Asia/Ho_Chi_Minh")
    public void remindPostingsScheduled() {
        if (properties.isJobsEnabled()) {
            remindPostingsWithoutApplicants();
        }
    }

    @Transactional
    public int remindPostingsWithoutApplicants() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                UPDATE class_requests cr SET no_applicant_reminded_at = NOW()
                WHERE cr.source = 'POSTING' AND cr.status = 'OPEN' AND cr.no_applicant_reminded_at IS NULL
                  AND cr.updated_at < NOW() - INTERVAL '14 days'
                  AND NOT EXISTS (SELECT 1 FROM class_applications ca WHERE ca.class_request_id = cr.id)
                RETURNING cr.id, (SELECT user_id FROM parents WHERE id = cr.parent_id) AS parent_user_id
                """);
        for (Map<String, Object> r : rows) {
            if (r.get("parent_user_id") != null) {
                outbox.notifyUser(((Number) r.get("parent_user_id")).longValue(), "Tin đăng chưa có gia sư ứng tuyển",
                        "Tin của bạn chưa có gia sư ứng tuyển. Bạn có thể điều chỉnh mức phí, khu vực hoặc tạo tin mới.",
                        "CLASS_REQUEST", ((Number) r.get("id")).longValue());
            }
        }
        return rows.size();
    }

    /** Đối soát: thử lại outbox lỗi và cảnh báo phòng có trong PostgreSQL nhưng mất trên Rocket.Chat. */
    @Scheduled(cron = "0 15 * * * *", zone = "Asia/Ho_Chi_Minh")
    public void reconcileScheduled() {
        if (properties.isJobsEnabled()) {
            reconcile();
        }
    }

    public int reconcile() {
        int retried = outbox.retryFailed();
        int missing = 0;
        try {
            List<Map<String, Object>> rooms = jdbcTemplate.queryForList(
                    "SELECT id, rocket_room_id FROM chat_rooms WHERE status = 'ACTIVE' AND updated_at > NOW() - INTERVAL '7 days'");
            for (Map<String, Object> room : rooms) {
                if (!client.roomExists((String) room.get("rocket_room_id"))) {
                    missing++;
                    log.error("Phòng chat {} không còn trên Rocket.Chat (rocket_room_id={})", room.get("id"), room.get("rocket_room_id"));
                }
            }
        } catch (RuntimeException e) {
            log.warn("Bỏ qua đối soát phòng vì Rocket.Chat không khả dụng: {}", e.getMessage());
        }
        if (retried > 0 || missing > 0) {
            log.warn("Đối soát MSG: thử lại {} dòng outbox, {} phòng thiếu trên Rocket.Chat", retried, missing);
        }
        return missing;
    }
}
