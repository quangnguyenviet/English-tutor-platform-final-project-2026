package com.mycompany.englishtutor.module.messaging.service;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import lombok.extern.slf4j.Slf4j;

/**
 * Kênh realtime một chiều (SSE) từ backend tới trình duyệt. Mọi tin nhắn/đề xuất đều đi qua backend nên backend
 * tự phát sự kiện cho hai thành viên của phòng; trình duyệt không kết nối trực tiếp Rocket.Chat.
 * Mất kết nối thì client gọi lại REST lịch sử để bắt kịp.
 */
@Slf4j
@Component
public class ChatEventHub {

    private static final long TIMEOUT_MS = 30 * 60 * 1000L;

    private final Map<Long, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(TIMEOUT_MS);
        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);
        Runnable cleanup = () -> remove(userId, emitter);
        emitter.onCompletion(cleanup);
        emitter.onTimeout(cleanup);
        emitter.onError(e -> cleanup.run());
        try {
            emitter.send(SseEmitter.event().name("ready").data("ok"));
        } catch (IOException e) {
            cleanup.run();
        }
        return emitter;
    }

    /** Gửi sự kiện (tên + payload JSON-able) tới các user. */
    public void publish(List<Long> userIds, String event, Object payload) {
        for (Long userId : userIds) {
            List<SseEmitter> list = emitters.get(userId);
            if (list == null) {
                continue;
            }
            for (SseEmitter emitter : list) {
                try {
                    emitter.send(SseEmitter.event().name(event).data(payload));
                } catch (IOException | IllegalStateException e) {
                    remove(userId, emitter);
                }
            }
        }
    }

    @Scheduled(fixedDelay = 25_000L)
    public void heartbeat() {
        emitters.forEach((userId, list) -> list.forEach(emitter -> {
            try {
                emitter.send(SseEmitter.event().comment("ping"));
            } catch (IOException | IllegalStateException e) {
                remove(userId, emitter);
            }
        }));
    }

    private void remove(Long userId, SseEmitter emitter) {
        List<SseEmitter> list = emitters.get(userId);
        if (list != null) {
            list.remove(emitter);
            if (list.isEmpty()) {
                emitters.remove(userId, list);
            }
        }
    }
}
