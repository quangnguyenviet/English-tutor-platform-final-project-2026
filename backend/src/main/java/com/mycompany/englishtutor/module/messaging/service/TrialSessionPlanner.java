package com.mycompany.englishtutor.module.messaging.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Collection;

/** Buổi học thử mặc định là buổi đầu tiên trong lịch học hằng tuần, tính từ thời điểm hiện tại. */
public final class TrialSessionPlanner {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    private TrialSessionPlanner() {}

    public static LocalDate firstSessionDate(Collection<Integer> days, LocalTime start) {
        return firstSessionDate(days, start, LocalDateTime.now(VN_ZONE));
    }

    /** {@code days}: 1 = Thứ 2 … 7 = Chủ nhật, không rỗng. Hôm nay chỉ được chọn khi buổi học chưa bắt đầu. */
    static LocalDate firstSessionDate(Collection<Integer> days, LocalTime start, LocalDateTime now) {
        LocalDate date = now.toLocalDate();
        if (!start.isAfter(now.toLocalTime())) {
            date = date.plusDays(1);
        }
        while (!days.contains(date.getDayOfWeek().getValue())) {
            date = date.plusDays(1);
        }
        return date;
    }
}
