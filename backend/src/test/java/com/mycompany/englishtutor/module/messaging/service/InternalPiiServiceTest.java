package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Optional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mycompany.englishtutor.module.messaging.config.MessagingProperties;
import com.mycompany.englishtutor.shared.exception.AppException;
import com.mycompany.englishtutor.shared.exception.ErrorCode;

class InternalPiiServiceTest {

    private final MessagingProperties properties = new MessagingProperties();
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final ChatRoomService rooms = mock(ChatRoomService.class);
    private final InternalPiiService service = new InternalPiiService(properties, jdbc, new ObjectMapper(), rooms);

    private String sign(String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(properties.getInternalHmacSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void validSignature_isAccepted_andInvalidRejected() throws Exception {
        String body = "{\"rocketRoomId\":\"r1\"}";

        assertTrue(service.validSignature(body, sign(body)));
        assertFalse(service.validSignature(body, sign("{\"rocketRoomId\":\"r2\"}")));
        assertFalse(service.validSignature(body, null));
    }

    @Test
    void record_withBadSignature_throwsAndWritesNothing() {
        AppException ex = assertThrows(AppException.class, () -> service.record("{}", "deadbeef"));

        assertEquals(ErrorCode.INTERNAL_SIGNATURE_INVALID, ex.getErrorCode());
        verify(jdbc, never()).update(contains("INSERT"), any(Object[].class));
    }

    @Test
    void record_unknownRoom_isIgnored() throws Exception {
        String body = "{\"rocketRoomId\":\"missing\",\"rocketUsername\":\"ep_u6\",\"types\":[\"PHONE\"],\"textLength\":20}";
        when(rooms.findByRocketRoomId("missing")).thenReturn(Optional.empty());

        service.record(body, sign(body));

        verify(jdbc, never()).update(contains("INSERT"), anyLong(), anyLong(), any());
    }
}
