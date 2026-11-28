package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.DayOfWeek;
import java.time.temporal.TemporalAdjusters;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import com.mycompany.englishtutor.module.audit.service.AuditLogService;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ProposalRequest;
import com.mycompany.englishtutor.module.messaging.api.ChatDtos.ScheduleSlot;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.pii.PiiDetector;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Access;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Room;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

class ProposalServiceTest {

    private static final String NEXT_MONDAY =
            TrialSessionPlanner.today().with(TemporalAdjusters.next(DayOfWeek.MONDAY)).toString();
    private static final List<ScheduleSlot> WEEKLY =
            List.of(new ScheduleSlot(2, "19:00", "20:30"), new ScheduleSlot(4, "18:00", "19:30"));

    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final MessagingActor actor = mock(MessagingActor.class);
    private final ChatRoomService rooms = mock(ChatRoomService.class);
    private final ChatMessageService messages = mock(ChatMessageService.class);
    private final FeePolicyService fees = mock(FeePolicyService.class);
    private final ChatOutboxService outbox = mock(ChatOutboxService.class);
    private final ProposalConflictChecker conflicts = mock(ProposalConflictChecker.class);
    private ProposalService service;
    private Access access;

    @BeforeEach
    void setUp() {
        service = new ProposalService(jdbc, actor, rooms, messages, mock(RocketChatAccountService.class),
                mock(RocketChatClient.class), fees, mock(ProposalReader.class), outbox, new PiiDetector(),
                mock(AuditLogService.class), new MessagingProperties(), conflicts);
        Room room = new Room(5L, "DIRECT", 2L, 6L, 4L, null, "rc5", "ACTIVE", null, "ACTIVE", null, null, null);
        access = new Access(room, Viewer.TUTOR, 4L);
        when(actor.requireTutorId()).thenReturn(4L);
        when(rooms.requireAccess(5L, false)).thenReturn(access);
        when(messages.hasTwoWayConversation(access)).thenReturn(true);
        when(fees.currentPercentage("SHORT_TERM")).thenReturn(new BigDecimal("25"));
    }

    private ProposalRequest request(String note) {
        return new ProposalRequest(null, "Lê Hoàng Nam", "Lớp 8", null, null, "SHORT_TERM", new BigDecimal("300000"),
                NEXT_MONDAY, WEEKLY, "ONLINE", note);
    }

    @Test
    void create_withoutTwoWayConversation_isRejected() {
        when(messages.hasTwoWayConversation(access)).thenReturn(false);

        AppException ex = assertThrows(AppException.class,
                () -> service.create(5L, request(null), null));

        assertEquals(ErrorCode.PROPOSAL_NEEDS_CONVERSATION, ex.getErrorCode());
    }

    @Test
    void create_overlapsTutorSchedule_isRejectedBeforeAnyWrite() {
        when(conflicts.tutorBusy(eq(4L), any())).thenReturn(true);

        AppException ex = assertThrows(AppException.class,
                () -> service.create(5L, request(null), null));

        assertEquals(ErrorCode.PROPOSAL_TUTOR_BUSY, ex.getErrorCode());
        verify(jdbc, never()).queryForObject(eq("SELECT id FROM chat_rooms WHERE id = ? FOR UPDATE"), eq(Long.class), any(Object.class));
    }

    @Test
    void create_overlapsExistingStudentSchedule_isRejected() {
        when(jdbc.queryForObject(eq("SELECT COUNT(*) FROM students WHERE id = ? AND parent_id = ?"), eq(Integer.class), eq(9L), eq(2L)))
                .thenReturn(1);
        when(conflicts.studentBusy(eq(9L), any())).thenReturn(true);
        ProposalRequest r = new ProposalRequest(9L, null, null, null, null, "SHORT_TERM", new BigDecimal("300000"),
                NEXT_MONDAY, WEEKLY, "ONLINE", null);

        AppException ex = assertThrows(AppException.class, () -> service.create(5L, r, null));

        assertEquals(ErrorCode.PROPOSAL_STUDENT_BUSY, ex.getErrorCode());
    }

    @Test
    void create_noteWithPhoneNumber_isBlockedAsContactInfo() {
        assertThrows(PiiBlockedException.class,
                () -> service.create(5L, request("Liên hệ 0981234567"), null));
    }

    @Test
    void create_endTimeBeforeStart_isRejected() {
        ProposalRequest bad = new ProposalRequest(null, "Lê Hoàng Nam", null, null, null, "SHORT_TERM",
                new BigDecimal("300000"), NEXT_MONDAY, List.of(new ScheduleSlot(2, "20:30", "19:00")), "ONLINE", null);

        AppException ex = assertThrows(AppException.class, () -> service.create(5L, bad, null));

        assertEquals(ErrorCode.PROPOSAL_INVALID_SCHEDULE, ex.getErrorCode());
    }

    @Test
    void create_startDateInThePast_isRejected() {
        String yesterday = TrialSessionPlanner.today().minusDays(1).toString();
        ProposalRequest bad = new ProposalRequest(null, "Lê Hoàng Nam", null, null, null, "SHORT_TERM",
                new BigDecimal("300000"), yesterday, WEEKLY, "ONLINE", null);

        AppException ex = assertThrows(AppException.class, () -> service.create(5L, bad, null));

        assertEquals(ErrorCode.PROPOSAL_INVALID_SCHEDULE, ex.getErrorCode());
    }
}
