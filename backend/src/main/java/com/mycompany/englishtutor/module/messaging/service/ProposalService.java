package com.mycompany.englishtutor.module.messaging.service;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.PiiViolationItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalItem;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ScheduleSlot;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.pii.PiiDetector;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Access;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;
import com.mycompany.englishtutor.module.messaging.service.TrialSessionPlanner.TrialSession;
import com.mycompany.englishtutor.module.messaging.service.TrialSessionPlanner.WeeklySlot;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;

/** Gia sư tạo/rút đề xuất, phụ huynh từ chối. Đồng ý đề xuất nằm ở {@link ProposalAcceptService}. */
@Service
@RequiredArgsConstructor
public class ProposalService {

    private final JdbcTemplate jdbcTemplate;
    private final MessagingActor actor;
    private final ChatRoomService rooms;
    private final ChatMessageService messages;
    private final RocketChatAccountService accounts;
    private final RocketChatClient client;
    private final FeePolicyService feePolicies;
    private final ProposalReader reader;
    private final ChatOutboxService outbox;
    private final PiiDetector piiDetector;
    private final AuditLogService auditLogService;
    private final MessagingProperties properties;
    private final ProposalConflictChecker conflicts;

    @Transactional(readOnly = true)
    public List<ProposalItem> listByRoom(Long roomId) {
        Access access = rooms.requireAccess(roomId, true);
        return reader.findByRoom(roomId, access.viewer());
    }

    /** Phụ huynh xem tài khoản đăng nhập của con tạo từ đề xuất đã đồng ý. */
    @Transactional(readOnly = true)
    public com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentAccountInfo studentAccount(Long proposalId) {
        com.mycompany.englishtutor.module.messaging.service.MessagingActor.ParentRef parent = actor.requireParent();
        var rows = jdbcTemplate.queryForList(
                """
                SELECT u.full_name, u.username, u.must_change_password
                FROM proposal_messages p
                JOIN chat_rooms r ON r.id = p.room_id
                JOIN classes c ON c.proposal_id = p.id
                JOIN users u ON u.id = c.student_id
                WHERE p.id = ? AND r.parent_id = ? AND p.status = 'ACCEPTED'
                """,
                proposalId, parent.parentId());
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.PROPOSAL_NOT_FOUND);
        }
        var row = rows.get(0);
        boolean mustChange = Boolean.TRUE.equals(row.get("must_change_password"));
        return new com.mycompany.englishtutor.module.messaging.api.ChatDtos.StudentAccountInfo(
                (String) row.get("full_name"), (String) row.get("username"),
                mustChange ? com.mycompany.englishtutor.module.matching.service.StudentAccountService.DEFAULT_STUDENT_PASSWORD : null,
                !mustChange);
    }

    @Transactional
    public ProposalItem create(Long roomId, ProposalRequest request, HttpServletRequest http) {
        Long tutorId = actor.requireTutorId();
        Access access = rooms.requireAccess(roomId, false);
        if (access.viewer() != Viewer.TUTOR) {
            throw new AppException(ErrorCode.CHAT_TUTOR_ONLY);
        }
        if (!access.room().writable()) {
            throw new AppException(ErrorCode.CHAT_ROOM_CLOSED);
        }
        if (!messages.hasTwoWayConversation(access)) {
            throw new AppException(ErrorCode.PROPOSAL_NEEDS_CONVERSATION);
        }

        Parsed parsed = validate(request, access.room().parentId());
        String learningAddress = "AT_HOME".equals(request.classMode()) ? homeAddress(access.room().parentId()) : null;
        scanForContactInfo(request);
        TrialSession trial = parsed.trial();
        ProposalConflictChecker.Slot slot = new ProposalConflictChecker.Slot(parsed.slots(), trial.date(),
                trial.start(), trial.end());
        if (conflicts.tutorBusy(tutorId, slot)) {
            throw new AppException(ErrorCode.PROPOSAL_TUTOR_BUSY,
                    "Khung giờ học hoặc dạy thử trùng lịch hiện có của bạn, vui lòng chọn khung giờ khác");
        }
        if (request.studentId() != null && conflicts.studentBusy(request.studentId(), slot)) {
            throw new AppException(ErrorCode.PROPOSAL_STUDENT_BUSY,
                    "Khung giờ học hoặc dạy thử trùng lịch học hiện có của học sinh, vui lòng chọn khung giờ khác");
        }
        BigDecimal fee = feePolicies.currentPercentage(request.classType());

        jdbcTemplate.queryForObject("SELECT id FROM chat_rooms WHERE id = ? FOR UPDATE", Long.class, roomId);
        Integer version = jdbcTemplate.queryForObject(
                "SELECT COALESCE(MAX(version), 0) + 1 FROM proposal_messages WHERE room_id = ?", Integer.class, roomId);
        Long proposalId;
        try {
            proposalId = jdbcTemplate.queryForObject(
                    """
                    INSERT INTO proposal_messages (
                        room_id, tutor_id, version, student_id, student_name, student_grade, student_school,
                        student_learning_goal, class_type, fee_percentage, price_per_session, start_date,
                        trial_date, trial_time_from, trial_time_to, class_mode, learning_address, note, expires_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                              NOW() + (? || ' days')::interval) RETURNING id
                    """,
                    Long.class, roomId, tutorId, version, request.studentId(),
                    request.studentId() == null ? trim(request.studentName()) : null,
                    request.studentId() == null ? trim(request.studentGrade()) : null,
                    request.studentId() == null ? trim(request.studentSchool()) : null,
                    request.studentId() == null ? trim(request.studentLearningGoal()) : null,
                    request.classType(), fee, request.pricePerSession(), parsed.startDate(),
                    trial.date(), trial.start(), trial.end(),
                    request.classMode(), learningAddress, trim(request.note()), String.valueOf(properties.getProposalExpireDays()));
        } catch (DuplicateKeyException e) {
            throw new AppException(ErrorCode.PROPOSAL_DUPLICATE_PENDING);
        }

        for (WeeklySlot weekly : parsed.slots()) {
            jdbcTemplate.update(
                    "INSERT INTO proposal_schedule_slots (proposal_id, day_of_week, start_time, end_time) VALUES (?, ?, ?, ?)",
                    proposalId, weekly.dayOfWeek(), weekly.start(), weekly.end());
        }

        String cardText = cardText(version, request, parsed);
        String messageId = accounts.withUserAuth(
                tutorId, auth -> client.sendMessage(auth, access.room().rocketRoomId(), cardText));
        jdbcTemplate.update("UPDATE proposal_messages SET rocket_message_id = ? WHERE id = ?", messageId, proposalId);
        jdbcTemplate.update("UPDATE chat_rooms SET last_message_at = NOW(), updated_at = NOW() WHERE id = ?", roomId);

        auditLogService.log(tutorId, "CREATE_PROPOSAL", "PROPOSAL", proposalId,
                Map.of("roomId", roomId, "version", version, "classType", request.classType()), http);
        outbox.notifyUser(access.room().parentUserId(), "Đề xuất lớp học mới",
                "Gia sư vừa gửi đề xuất lớp học #" + version + ". Vui lòng xem và phản hồi.", "CHAT_ROOM", roomId);
        outbox.publishAfterCommit(access.room().participantUserIds(), "proposal", Map.of("roomId", roomId, "proposalId", proposalId));
        return reader.findById(proposalId, access.viewer()).orElseThrow();
    }

    @Transactional
    public ProposalItem reject(Long proposalId, String reason, HttpServletRequest http) {
        Locked locked = lockPending(proposalId);
        Access access = rooms.requireAccess(locked.roomId(), false);
        if (access.viewer() != Viewer.PARENT) {
            throw new AppException(ErrorCode.CHAT_PARENT_ONLY);
        }
        jdbcTemplate.update(
                "UPDATE proposal_messages SET status = 'REJECTED', rejection_reason = ?, decided_at = NOW() WHERE id = ?",
                trim(reason), proposalId);
        outbox.enqueueSystemMessage(locked.roomId(), "PROPOSAL_REJECTED",
                "Phụ huynh đã từ chối đề xuất #" + locked.version() + (trim(reason) == null ? "." : ": " + trim(reason)));
        outbox.notifyUser(access.room().tutorId(), "Đề xuất bị từ chối",
                "Phụ huynh đã từ chối đề xuất #" + locked.version() + ". Bạn có thể trao đổi thêm và gửi đề xuất mới.",
                "CHAT_ROOM", locked.roomId());
        auditLogService.log(access.userId(), "REJECT_PROPOSAL", "PROPOSAL", proposalId, null, http);
        outbox.publishAfterCommit(access.room().participantUserIds(), "proposal", Map.of("roomId", locked.roomId(), "proposalId", proposalId));
        return reader.findById(proposalId, access.viewer()).orElseThrow();
    }

    @Transactional
    public ProposalItem withdraw(Long proposalId, String reason, HttpServletRequest http) {
        String clean = trim(reason);
        if (clean == null || clean.length() < 5) {
            throw new AppException(ErrorCode.PROPOSAL_WITHDRAW_REASON_REQUIRED);
        }
        Locked locked = lockPending(proposalId);
        Access access = rooms.requireAccess(locked.roomId(), false);
        if (access.viewer() != Viewer.TUTOR) {
            throw new AppException(ErrorCode.CHAT_TUTOR_ONLY);
        }
        jdbcTemplate.update(
                "UPDATE proposal_messages SET status = 'CANCELLED', rejection_reason = ?, decided_at = NOW() WHERE id = ?",
                clean, proposalId);
        outbox.enqueueSystemMessage(locked.roomId(), "PROPOSAL_WITHDRAWN",
                "Gia sư đã rút đề xuất #" + locked.version() + ": " + clean);
        auditLogService.log(access.userId(), "WITHDRAW_PROPOSAL", "PROPOSAL", proposalId, null, http);
        outbox.publishAfterCommit(access.room().participantUserIds(), "proposal", Map.of("roomId", locked.roomId(), "proposalId", proposalId));
        return reader.findById(proposalId, access.viewer()).orElseThrow();
    }

    // ------------------------------------------------------------ nội bộ

    record Locked(Long roomId, int version) {}

    private Locked lockPending(Long proposalId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT room_id, version, status, expires_at < NOW() AS expired FROM proposal_messages WHERE id = ? FOR UPDATE",
                proposalId);
        if (rows.isEmpty()) {
            throw new AppException(ErrorCode.PROPOSAL_NOT_FOUND);
        }
        Map<String, Object> row = rows.get(0);
        if (!"PENDING".equals(row.get("status")) || Boolean.TRUE.equals(row.get("expired"))) {
            throw new AppException(ErrorCode.PROPOSAL_NOT_PENDING);
        }
        return new Locked(((Number) row.get("room_id")).longValue(), ((Number) row.get("version")).intValue());
    }

    /** {@code slots} đã sắp theo thứ trong tuần. */
    record Parsed(List<WeeklySlot> slots, LocalDate startDate, TrialSession trial) {}

    private Parsed validate(ProposalRequest r, Long parentId) {
        if (!List.of("SHORT_TERM", "REGULAR").contains(r.classType())
                || !List.of("AT_HOME", "ONLINE").contains(r.classMode())) {
            throw new AppException(ErrorCode.PROPOSAL_INVALID_SCHEDULE, "Loại lớp hoặc hình thức dạy không hợp lệ");
        }
        if (r.pricePerSession().compareTo(BigDecimal.valueOf(10_000)) < 0) {
            throw new AppException(ErrorCode.PROPOSAL_INVALID_SCHEDULE, "Học phí mỗi buổi tối thiểu 10.000 VNĐ");
        }
        if (r.studentId() != null) {
            Integer owns = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM students WHERE id = ? AND parent_id = ?", Integer.class, r.studentId(), parentId);
            if (owns == null || owns == 0) {
                throw new AppException(ErrorCode.PROPOSAL_STUDENT_NOT_OF_PARENT);
            }
        } else if (trim(r.studentName()) == null || trim(r.studentName()).length() < 2) {
            throw new AppException(ErrorCode.PROPOSAL_STUDENT_REQUIRED);
        }
        List<WeeklySlot> slots = parseSlots(r.scheduleSlots());
        LocalDate startDate = parseStartDate(r.startDate());
        return new Parsed(slots, startDate, TrialSessionPlanner.firstSession(slots, startDate));
    }

    /** Mỗi thứ đúng một khung giờ; kết quả sắp theo thứ trong tuần. */
    private static List<WeeklySlot> parseSlots(List<ScheduleSlot> requested) {
        TreeMap<Integer, WeeklySlot> byDay = new TreeMap<>();
        for (ScheduleSlot slot : requested) {
            int day = slot.dayOfWeek();
            if (day < 1 || day > 7) {
                throw invalidSchedule("Thứ trong tuần không hợp lệ");
            }
            LocalTime from;
            LocalTime to;
            try {
                from = LocalTime.parse(slot.startTime());
                to = LocalTime.parse(slot.endTime());
            } catch (DateTimeParseException e) {
                throw invalidSchedule("Định dạng giờ không hợp lệ");
            }
            if (!from.isBefore(to)) {
                throw invalidSchedule(dayLabel(day) + ": giờ kết thúc phải sau giờ bắt đầu");
            }
            if (byDay.put(day, new WeeklySlot(day, from, to)) != null) {
                throw invalidSchedule(dayLabel(day) + " bị chọn nhiều lần");
            }
        }
        if (byDay.isEmpty()) {
            throw invalidSchedule("Vui lòng chọn thứ trong tuần");
        }
        return List.copyOf(byDay.values());
    }

    private static LocalDate parseStartDate(String value) {
        LocalDate startDate;
        try {
            startDate = LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            throw invalidSchedule("Ngày bắt đầu học không hợp lệ");
        }
        if (startDate.isBefore(TrialSessionPlanner.today())) {
            throw invalidSchedule("Ngày bắt đầu học không được ở trong quá khứ");
        }
        return startDate;
    }

    private static AppException invalidSchedule(String message) {
        return new AppException(ErrorCode.PROPOSAL_INVALID_SCHEDULE, message);
    }

    private static String dayLabel(int day) {
        return day == 7 ? "CN" : "T" + (day + 1);
    }

    /** Các trường văn bản tự do của đề xuất cũng không được chứa thông tin liên hệ. */
    private void scanForContactInfo(ProposalRequest r) {
        for (String field : new String[] {r.note(), r.studentName(), r.studentSchool(), r.studentLearningGoal()}) {
            PiiDetector.Detection detection = piiDetector.detect(field);
            if (detection.blocked()) {
                throw new PiiBlockedException(detection.violations().stream()
                        .map(v -> new PiiViolationItem(v.type().name(), v.start(), v.end()))
                        .toList());
            }
        }
    }

    private String cardText(int version, ProposalRequest r, Parsed p) {
        String student = r.studentId() == null
                ? trim(r.studentName())
                : jdbcTemplate.queryForObject("SELECT full_name FROM users WHERE id = ?", String.class, r.studentId());
        String type = "SHORT_TERM".equals(r.classType()) ? "Lớp ngắn hạn (1 tháng)" : "Lớp thông thường";
        String schedule = p.slots().stream()
                .map(s -> dayLabel(s.dayOfWeek()) + " (" + s.start() + "–" + s.end() + ")")
                .collect(Collectors.joining(", "));
        DateTimeFormatter dateFormat = DateTimeFormatter.ofPattern("dd/MM/yyyy");
        String price = NumberFormat.getInstance(Locale.of("vi", "VN")).format(r.pricePerSession());
        return "Đề xuất lớp học #" + version + " cho học sinh " + student + " — " + type + ", " + price
                + " đ/buổi, học " + schedule + ", bắt đầu từ " + p.startDate().format(dateFormat)
                + ". Buổi học thử dự kiến: " + p.trial().date().format(dateFormat) + ".";
    }

    /** Địa chỉ học tại nhà luôn là địa chỉ mặc định trong hồ sơ phụ huynh, gia sư không nhập và không xem được. */
    private String homeAddress(Long parentId) {
        String address = jdbcTemplate.queryForObject("SELECT address FROM parents WHERE id = ?", String.class, parentId);
        if (address == null || address.isBlank()) {
            throw new AppException(ErrorCode.PROPOSAL_INVALID_SCHEDULE,
                    "Phụ huynh chưa cập nhật địa chỉ nhà nên chưa thể đề xuất dạy tại nhà");
        }
        return address.strip();
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.strip();
    }
}
