package com.mycompany.englishtutor.module.messaging.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

import com.mycompany.englishtutor.module.messaging.service.ChatRoomService.Room;

/** Quy tắc khóa phòng: gia sư INACTIVE, ứng viên bị loại hoặc tin đã hủy thì chỉ đọc. */
class ChatRoomWritableTest {

    private Room direct(String roomStatus, String tutorStatus) {
        return new Room(1L, "DIRECT", 2L, 3L, 4L, null, "rc1", roomStatus, null, tutorStatus, null, null, null);
    }

    private Room application(String appStatus, String requestStatus) {
        return new Room(1L, "APPLICATION", 2L, 3L, 4L, 9L, "rc1", "ACTIVE", null, "ACTIVE", appStatus, 7L, requestStatus);
    }

    @Test
    void directRoom_writableOnlyWhenRoomAndTutorActive() {
        assertTrue(direct("ACTIVE", "ACTIVE").writable());
        assertFalse(direct("CLOSED", "ACTIVE").writable());
        assertFalse(direct("ACTIVE", "INACTIVE").writable());
    }

    @Test
    void applicationRoom_followsApplicationAndRequestState() {
        assertTrue(application("APPLIED", "OPEN").writable());
        assertTrue(application("APPLIED", "REMATCH").writable());
        assertTrue(application("SELECTED", "MATCHED").writable());
        assertFalse(application("REJECTED", "MATCHED").writable());
        assertFalse(application("TERMINATED", "REMATCH").writable());
        assertFalse(application("APPLIED", "CANCELLED").writable());
    }

    @Test
    void applicationRoomWithDeletedApplication_isReadOnly() {
        Room orphan = new Room(1L, "APPLICATION", 2L, 3L, 4L, null, "rc1", "ACTIVE", null, "ACTIVE", null, null, null);

        assertFalse(orphan.writable());
    }
}
