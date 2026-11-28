package com.mycompany.englishtutor.module.messaging.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

/** Buổi học thử là buổi đầu tiên trong lịch học hằng tuần, tính từ ngày bắt đầu học (không sớm hơn hiện tại). */
public final class TrialSessionPlanner {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TrialSessionPlanner() {}

    /** Khung giờ của một thứ trong tuần: {@code dayOfWeek} 1 = Thứ 2 … 7 = Chủ nhật. */
    public record WeeklySlot(int dayOfWeek, LocalTime start, LocalTime end) {}

    public record TrialSession(LocalDate date, LocalTime start, LocalTime end) {}

    public static LocalDate today() {
        return LocalDate.now(VN_ZONE);
    }

    public static TrialSession firstSession(Collection<WeeklySlot> slots, LocalDate startDate) {
        return firstSession(slots, startDate, LocalDateTime.now(VN_ZONE));
    }

    /** {@code slots} không rỗng, mỗi thứ một khung giờ. Hôm nay chỉ được chọn khi buổi học chưa bắt đầu. */
    static TrialSession firstSession(Collection<WeeklySlot> slots, LocalDate startDate, LocalDateTime now) {
        Map<Integer, WeeklySlot> byDay = slots.stream()
                .collect(Collectors.toMap(WeeklySlot::dayOfWeek, Function.identity()));
        LocalDate date = startDate.isAfter(now.toLocalDate()) ? startDate : now.toLocalDate();
        while (true) {
            WeeklySlot slot = byDay.get(date.getDayOfWeek().getValue());
            if (slot != null && (date.isAfter(now.toLocalDate()) || slot.start().isAfter(now.toLocalTime()))) {
                return new TrialSession(date, slot.start(), slot.end());
            }
            date = date.plusDays(1);
        }
    }
}
