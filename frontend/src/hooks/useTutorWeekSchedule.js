import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  apiGetClassSchedule,
  apiGetMyClasses,
  formatSessionTime,
  mapClassSummary,
  todayISO,
} from "../lib/classroomApi";

function normalizedTime(value) {
  return formatSessionTime(value || "00:00");
}

/** Ngày/giờ thực tế của ca; ca RESCHEDULED dùng mốc mới thay vì ô gốc. */
export function tutorOccurrenceTarget(occurrence) {
  const exception = occurrence?.source === "EXCEPTION" ? occurrence.exception : null;
  if (
    exception?.type === "RESCHEDULED"
    && exception.newDate
    && exception.newStartTime
    && exception.newEndTime
  ) {
    return {
      date: exception.newDate,
      startTime: normalizedTime(exception.newStartTime),
      endTime: normalizedTime(exception.newEndTime),
      originalDate: occurrence.date,
    };
  }
  return {
    date: occurrence?.date,
    startTime: normalizedTime(occurrence?.startTime),
    endTime: normalizedTime(occurrence?.endTime),
    originalDate: null,
  };
}

export function tutorOccurrenceStatus(item) {
  if (item?.exception?.type === "CANCELLED") return "CANCELLED";
  if (item?.exception?.type === "RESCHEDULED") return "RESCHEDULED";
  if (item?.log?.hasContent) return "COMPLETED";

  const today = todayISO();
  if (!item?.date || item.date > today) return "UPCOMING";
  if (item.date < today) return "MISSING_LOG";

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  if (currentTime < item.startTime) return "UPCOMING";
  if (currentTime <= item.endTime) return "IN_PROGRESS";
  return "MISSING_LOG";
}

function mapOccurrence(occurrence, classItem) {
  const target = tutorOccurrenceTarget(occurrence);
  const item = {
    ...occurrence,
    ...target,
    classId: classItem.classId,
    className: classItem.className,
    studentName: classItem.studentName,
    classStatus: classItem.status,
    classTeachingMode: classItem.teachingMode,
    occurrenceKey: occurrence.occurrenceKey,
  };
  return { ...item, status: tutorOccurrenceStatus(item) };
}

/**
 * Tổng hợp lịch thật của tất cả lớp thuộc gia sư trong một tuần. Mỗi lớp dùng
 * endpoint lattice hiện có; lỗi một lớp không làm mất dữ liệu của các lớp khác.
 */
export function useTutorWeekSchedule(weekStart) {
  const { token } = useAuth();
  const [state, setState] = useState({
    classes: [],
    occurrences: [],
    loading: true,
    error: "",
    partialError: "",
  });

  const load = useCallback(async () => {
    if (!token || !weekStart) return;
    setState((previous) => ({ ...previous, loading: true, error: "", partialError: "" }));
    try {
      const rawClasses = await apiGetMyClasses(token);
      const classes = (Array.isArray(rawClasses) ? rawClasses : [])
        .map(mapClassSummary)
        .filter((item) => item.classId && item.status !== "CANCELLED");
      const results = await Promise.allSettled(
        classes.map(async (classItem) => {
          const schedule = await apiGetClassSchedule(token, classItem.classId, weekStart);
          return (schedule?.occurrences || []).map((occurrence) => mapOccurrence(occurrence, classItem));
        }),
      );
      const occurrences = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));
      const failedCount = results.filter((result) => result.status === "rejected").length;
      setState({
        classes,
        occurrences,
        loading: false,
        error: "",
        partialError: failedCount ? `Không tải được lịch của ${failedCount} lớp.` : "",
      });
    } catch (error) {
      setState({
        classes: [],
        occurrences: [],
        loading: false,
        error: error.message || "Không thể tải lịch dạy.",
        partialError: "",
      });
    }
  }, [token, weekStart]);

  useEffect(() => {
    load();
  }, [load]);

  return useMemo(() => ({ ...state, token, reload: load }), [state, token, load]);
}
