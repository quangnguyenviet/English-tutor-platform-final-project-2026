package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.function.Function;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.module.messaging.pii.PiiDetector;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient;
import com.mycompany.englishtutor.module.messaging.rocketchat.RocketChatClient.Auth;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Access;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Room;
import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Viewer;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

class ChatMessageServiceTest {

    private final ChatRoomService rooms = mock(ChatRoomService.class);
    private final RocketChatAccountService accounts = mock(RocketChatAccountService.class);
    private final RocketChatClient client = mock(RocketChatClient.class);
    private final ProposalReader proposalReader = mock(ProposalReader.class);
    private final ChatEventHub hub = mock(ChatEventHub.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final MessagingProperties properties = new MessagingProperties();
    private ChatMessageService service;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        service = new ChatMessageService(rooms, accounts, client, new PiiDetector(), proposalReader, hub, jdbc,
                properties, new ObjectMapper());
        Room room = new Room(5L, "DIRECT", 2L, 6L, 4L, null, "rc5", "ACTIVE", null, "ACTIVE", null, null, null);
        when(rooms.requireAccess(5L, false)).thenReturn(new Access(room, Viewer.PARENT, 6L));
        when(accounts.withUserAuth(anyLong(), any())).thenAnswer(inv -> {
            Function<Auth, Object> action = inv.getArgument(1);
            return action.apply(new Auth("u", "t"));
        });
        when(client.sendMessage(any(), eq("rc5"), any())).thenReturn("msg-1");
    }

    @Test
    void send_validText_postsToRocketChatAndPublishes() {
        var item = service.send(5L, "  Chào cô ạ  ");

        assertEquals("msg-1", item.id());
        assertEquals("Chào cô ạ", item.text());
        verify(client).sendMessage(any(), eq("rc5"), eq("Chào cô ạ"));
        verify(hub).publish(eq(List.of(6L, 4L)), eq("message"), any());
    }

    @Test
    void send_phoneNumber_isBlockedLoggedAndNeverReachesRocketChat() {
        PiiBlockedException ex = assertThrows(PiiBlockedException.class, () -> service.send(5L, "Gọi em số 0981 234 567"));

        assertEquals(ErrorCode.CHAT_PII_BLOCKED, ex.getErrorCode());
        assertEquals("PHONE", ex.getViolations().getFirst().type());
        verify(client, never()).sendMessage(any(), any(), any());
        verify(jdbc).update(contains("chat_pii_events"), any(Object[].class));
    }

    @Test
    void send_emptyOrTooLong_isRejected() {
        assertEquals(ErrorCode.CHAT_MESSAGE_EMPTY,
                assertThrows(AppException.class, () -> service.send(5L, "   ")).getErrorCode());
        assertEquals(ErrorCode.CHAT_MESSAGE_TOO_LONG,
                assertThrows(AppException.class, () -> service.send(5L, "a".repeat(2001))).getErrorCode());
    }

    @Test
    void send_overTenPerMinute_isRateLimited() {
        for (int i = 0; i < 10; i++) {
            service.send(5L, "tin " + i);
        }

        AppException ex = assertThrows(AppException.class, () -> service.send(5L, "tin 11"));

        assertEquals(ErrorCode.CHAT_RATE_LIMITED, ex.getErrorCode());
    }

    @Test
    void send_toLockedRoom_isRejected() {
        Room locked = new Room(5L, "DIRECT", 2L, 6L, 4L, null, "rc5", "ACTIVE", null, "INACTIVE", null, null, null);
        when(rooms.requireAccess(5L, false)).thenReturn(new Access(locked, Viewer.PARENT, 6L));

        AppException ex = assertThrows(AppException.class, () -> service.send(5L, "xin chào"));

        assertEquals(ErrorCode.CHAT_ROOM_CLOSED, ex.getErrorCode());
    }
}
