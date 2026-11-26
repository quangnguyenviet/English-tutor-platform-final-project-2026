package com.mycompany.englishtutor.module.messaging.service;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ChildItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.Counterpart;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ParentInfo;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RoomDetail;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.RoomSummary;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.TutorInfo;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.service.MessagingActor.ParentRef;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/** Tạo, tra cứu và phân quyền phòng chat (DIRECT theo phụ huynh-gia sư, APPLICATION theo lượt ứng tuyển). */
@Slf4j
@Service
@RequiredArgsConstructor
public class ChatRoomService {

    /** Dòng phòng kèm trạng thái liên quan để quyết định quyền ghi. */
    public record Room(
            Long id,
            String roomType,
            Long parentId,
            Long parentUserId,
            Long tutorId,
            Long classApplicationId,
            String rocketRoomId,
            String status,
            String lastMessageAt,
            String tutorProfileStatus,
            String applicationStatus,
            Long classRequestId,
            String requestStatus) {

        public boolean writable() {
            if (!"ACTIVE".equals(status) || !"ACTIVE".equals(tutorProfileStatus)) {
                return false;
            }
            if ("DIRECT".equals(roomType)) {
                return true;
            }
            if (applicationStatus == null || requestStatus == null) {
                return false;
            }
            boolean applicationLive = "APPLIED".equals(applicationStatus) || "SELECTED".equals(applicationStatus);
            boolean requestLive = List.of("OPEN", "REMATCH", "MATCHED").contains(requestStatus);
            return applicationLive && requestLive;
        }

        public List<Long> participantUserIds() {
            return List.of(parentUserId, tutorId);
        }
    }

    /** Vai trò của người đang xem phòng. */
    public enum Viewer {
        PARENT,
        TUTOR,
        STAFF
    }

    public record Access(Room room, Viewer viewer, Long userId) {}

    private static final String ROOM_SELECT = """
            SELECT r.id, r.room_type, r.parent_id, p.user_id AS parent_user_id, r.tutor_id, r.class_application_id,
                   r.rocket_room_id, r.status, r.last_message_at, t.profile_status AS tutor_profile_status,
                   ca.status AS application_status, ca.class_request_id, cr.status AS request_status
            FROM chat_rooms r
            JOIN parents p ON p.id = r.parent_id
            JOIN tutors t ON t.id = r.tutor_id
            LEFT JOIN class_applications ca ON ca.id = r.class_application_id
            LEFT JOIN class_requests cr ON cr.id = ca.class_request_id
            """;

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final RocketChatAccountService accounts;
    private final RocketChatClient client;
    private final ProposalReader proposalReader;

    // ------------------------------------------------------------ tạo phòng

    @Transactional
    public Long openDirectRoom(Long tutorId) {
        ParentRef parent = actor.requireParent();
        requireProfileComplete(parent);
        requireActiveTutor(tutorId);

        lock("direct-" + parent.parentId() + "-" + tutorId);
        Optional<Long> existing = jdbcTemplate
                .queryForList(
                        "SELECT id FROM chat_rooms WHERE room_type = 'DIRECT' AND parent_id = ? AND tutor_id = ?",
                        Long.class, parent.parentId(), tutorId)
                .stream()
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        return createRoom("DIRECT", parent, tutorId, null, "ep-direct-" + parent.parentId() + "-" + tutorId);
    }

    @Transactional
    public Long openApplicationRoom(Long applicationId) {
        ParentRef parent = actor.requireParent();
        requireProfileComplete(parent);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                """
                SELECT ca.tutor_id, ca.status AS app_status, cr.parent_id, cr.status AS request_status, cr.source
                FROM class_applications ca JOIN class_requests cr ON cr.id = ca.class_request_id
                WHERE ca.id = ?
                """,
                applicationId);
        if (rows.isEmpty() || !parent.parentId().equals(((Number) rows.get(0).get("parent_id")).longValue())) {
            throw new AppException(ErrorCode.CHAT_APPLICATION_NOT_AVAILABLE);
        }
        Map<String, Object> row = rows.get(0);
        Long tutorId = ((Number) row.get("tutor_id")).longValue();

        lock("app-" + applicationId);
        Optional<Long> existing = jdbcTemplate
                .queryForList("SELECT id FROM chat_rooms WHERE class_application_id = ?", Long.class, applicationId)
                .stream()
                .findFirst();
        if (existing.isPresent()) {
            return existing.get();
        }
        boolean open = List.of("OPEN", "REMATCH").contains((String) row.get("request_status"))
                && "APPLIED".equals(row.get("app_status"));
        if (!open) {
            throw new AppException(ErrorCode.CHAT_APPLICATION_NOT_AVAILABLE);
        }
        requireActiveTutor(tutorId);
        return createRoom("APPLICATION", parent, tutorId, applicationId, "ep-app-" + applicationId);
    }

    private Long createRoom(String type, ParentRef parent, Long tutorId, Long applicationId, String roomName) {
        RocketChatAccountService.RocketAccount parentAccount = accounts.ensureAccount(parent.userId());
        RocketChatAccountService.RocketAccount tutorAccount = accounts.ensureAccount(tutorId);
        String rocketRoomId = client.createPrivateRoom(roomName, List.of(parentAccount.username(), tutorAccount.username()));
        return jdbcTemplate.queryForObject(
                """
                INSERT INTO chat_rooms (room_type, parent_id, tutor_id, class_application_id, rocket_room_id)
                VALUES (?, ?, ?, ?, ?) RETURNING id
                """,
                Long.class, type, parent.parentId(), tutorId, applicationId, rocketRoomId);
    }

    private void lock(String key) {
        jdbcTemplate.queryForObject("SELECT pg_advisory_xact_lock(hashtext(?))::text", String.class, "chat-room:" + key);
    }

    private void requireProfileComplete(ParentRef parent) {
        if (!parent.profileComplete()) {
            throw new AppException(ErrorCode.CHAT_PARENT_PROFILE_INCOMPLETE);
        }
    }

    private void requireActiveTutor(Long tutorId) {
        List<String> status = jdbcTemplate.queryForList("SELECT profile_status FROM tutors WHERE id = ?", String.class, tutorId);
        if (status.isEmpty() || !"ACTIVE".equals(status.get(0))) {
            throw new AppException(ErrorCode.CHAT_TUTOR_NOT_ACTIVE);
        }
    }

    // ------------------------------------------------------------ truy cập

    /** Người tham gia (phụ huynh/gia sư) hoặc nhân viên (chỉ đọc) mới truy cập được phòng. */
    @Transactional(readOnly = true)
    public Access requireAccess(Long roomId, boolean allowStaff) {
        Room room = find(roomId).orElseThrow(() -> new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND));
        Long userId = actor.currentUserId();
        if (userId.equals(room.parentUserId())) {
            return new Access(room, Viewer.PARENT, userId);
        }
        if (userId.equals(room.tutorId())) {
            return new Access(room, Viewer.TUTOR, userId);
        }
        if (allowStaff && actor.isStaff()) {
            return new Access(room, Viewer.STAFF, userId);
        }
        throw new AppException(ErrorCode.CHAT_ROOM_NOT_FOUND);
    }

    public Optional<Room> find(Long roomId) {
        return jdbcTemplate.query(ROOM_SELECT + " WHERE r.id = ?", this::mapRoom, roomId).stream().findFirst();
    }

    public Optional<Room> findByRocketRoomId(String rocketRoomId) {
        return jdbcTemplate.query(ROOM_SELECT + " WHERE r.rocket_room_id = ?", this::mapRoom, rocketRoomId).stream().findFirst();
    }

    private Room mapRoom(ResultSet rs, int i) throws SQLException {
        return new Room(
                rs.getLong("id"), rs.getString("room_type"), rs.getLong("parent_id"), rs.getLong("parent_user_id"),
                rs.getLong("tutor_id"), rs.getObject("class_application_id") == null ? null : rs.getLong("class_application_id"),
                rs.getString("rocket_room_id"), rs.getString("status"),
                rs.getTimestamp("last_message_at") == null ? null : rs.getTimestamp("last_message_at").toInstant().toString(),
                rs.getString("tutor_profile_status"), rs.getString("application_status"),
                rs.getObject("class_request_id") == null ? null : rs.getLong("class_request_id"),
                rs.getString("request_status"));
    }

    // ------------------------------------------------------------ danh sách / chi tiết

    @Transactional(readOnly = true)
    public List<RoomSummary> listMyRooms() {
        Long userId = actor.currentUserId();
        boolean parentSide = actor.hasRole("PARENT");
        String where = parentSide ? "p.user_id = ?" : "r.tutor_id = ?";
        List<Room> rooms = jdbcTemplate.query(
                ROOM_SELECT + " WHERE " + where + " ORDER BY COALESCE(r.last_message_at, r.created_at) DESC",
                this::mapRoom, userId);
        Map<String, Integer> unread = unreadSafe(userId);
        return rooms.stream().map(room -> toSummary(room, parentSide, unread)).toList();
    }

    @Transactional(readOnly = true)
    public RoomDetail getDetail(Long roomId) {
        Access access = requireAccess(roomId, true);
        Room room = access.room();
        boolean parentSide = access.viewer() == Viewer.PARENT;
        Map<String, Integer> unread = access.viewer() == Viewer.STAFF ? Map.of() : unreadSafe(access.userId());
        RoomSummary summary = toSummary(room, parentSide, unread);
        if (access.viewer() == Viewer.PARENT) {
            return new RoomDetail(summary, null, tutorInfo(room.tutorId()));
        }
        return new RoomDetail(summary, parentInfo(room), null);
    }

    private RoomSummary toSummary(Room room, boolean parentSide, Map<String, Integer> unread) {
        Counterpart counterpart = parentSide
                ? jdbcTemplate.queryForObject(
                        "SELECT id, full_name, avatar_url FROM users WHERE id = ?",
                        (rs, i) -> new Counterpart(rs.getLong("id"), rs.getString("full_name"), rs.getString("avatar_url"), "TUTOR"),
                        room.tutorId())
                : jdbcTemplate.queryForObject(
                        "SELECT id, full_name, avatar_url FROM users WHERE id = ?",
                        (rs, i) -> new Counterpart(rs.getLong("id"), rs.getString("full_name"), rs.getString("avatar_url"), "PARENT"),
                        room.parentUserId());
        Integer pending = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM proposal_messages WHERE room_id = ? AND status = 'PENDING'", Integer.class, room.id());
        return new RoomSummary(room.id(), room.roomType(), room.status(), room.writable(), counterpart,
                room.classApplicationId(), room.classRequestId(), unread.getOrDefault(room.rocketRoomId(), 0),
                room.lastMessageAt(), pending == null ? 0 : pending);
    }

    /** Unread lấy từ Rocket.Chat; Rocket.Chat lỗi thì danh sách vẫn hiển thị với unread = 0. */
    private Map<String, Integer> unreadSafe(Long userId) {
        try {
            return accounts.withUserAuth(userId, client::unreadByRoom);
        } catch (AppException e) {
            log.warn("Không lấy được unread từ Rocket.Chat: {}", e.getMessage());
            return Map.of();
        }
    }

    private TutorInfo tutorInfo(Long tutorId) {
        return jdbcTemplate.queryForObject(
                "SELECT university, experience_years, bio FROM tutors WHERE id = ?",
                (rs, i) -> new TutorInfo(rs.getString("university"),
                        rs.getObject("experience_years") == null ? null : rs.getInt("experience_years"), rs.getString("bio")),
                tutorId);
    }

    /** Phone Gate: SĐT chỉ có trong payload khi phòng đã có đề xuất ACCEPTED. */
    private ParentInfo parentInfo(Room room) {
        Map<String, Object> p = jdbcTemplate.queryForMap(
                "SELECT full_name, phone, purpose, province, ward FROM parents WHERE id = ?", room.parentId());
        List<java.sql.Timestamp> unlocked = jdbcTemplate.queryForList(
                "SELECT MIN(decided_at) FROM proposal_messages WHERE room_id = ? AND status = 'ACCEPTED'",
                java.sql.Timestamp.class, room.id());
        java.sql.Timestamp unlockedAt = unlocked.isEmpty() ? null : unlocked.get(0);
        boolean phoneUnlocked = unlockedAt != null;
        List<ChildItem> children = jdbcTemplate.query(
                "SELECT s.id, u.full_name, s.grade FROM students s JOIN users u ON u.id = s.id WHERE s.parent_id = ? ORDER BY u.full_name",
                (rs, i) -> new ChildItem(rs.getLong("id"), rs.getString("full_name"), rs.getString("grade")),
                room.parentId());
        return new ParentInfo((String) p.get("full_name"), (String) p.get("purpose"), (String) p.get("province"),
                (String) p.get("ward"), phoneUnlocked ? (String) p.get("phone") : null, phoneUnlocked,
                phoneUnlocked ? unlockedAt.toInstant().toString() : null, children);
    }
}
