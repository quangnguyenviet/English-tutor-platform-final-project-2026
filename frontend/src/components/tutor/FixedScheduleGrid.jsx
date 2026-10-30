import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ListOrdered,
  Loader2,
  Pencil,
  Play,
} from "lucide-react";
import Card from "../ui/Card";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import clsx from "clsx";
import {
  DAY_OF_WEEK_LABELS,
  formatSessionDate,
  todayISO,
} from "../../lib/classroomApi";

/** Thứ 2 làm mốc đầu tuần (ISO dayOfWeek 1). */
export function startOfWeek(dateISO) {
  const [year, month, day] = dateISO.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const isoDay = date.getDay() || 7; // 0 (Chủ nhật) → 7
  date.setDate(date.getDate() - isoDay + 1);
  return date;
}

export function toISO(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

/** Ca đang áp dụng cho một ngày cụ thể: thứ khớp + ngày nằm trong khoảng hiệu lực của ca. */
function slotsForDate(schedules, isoDate) {
  const day = new Date(isoDate + "T00:00:00").getDay() || 7;
  return schedules
    .filter((slot) => slot.dayOfWeek === day)
    .filter(
      (slot) =>
        (!slot.validFrom || slot.validFrom <= isoDate) &&
        (!slot.validTo || slot.validTo >= isoDate),
    )
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Nhãn khoảng hiệu lực của ca: "từ 03/11/2026" (kèm "đến ..." nếu có). */
function slotValidityLabel(slot) {
  if (!slot.validFrom) return "";
  const text = `từ ${formatSessionDate(slot.validFrom)}`;
  return slot.validTo ? `${text} đến ${formatSessionDate(slot.validTo)}` : text;
}

/**
 * Lưới lịch tuần của lớp ACTIVE (kế hoạch mục Phase 3, ràng buộc 15).
 * Render ca theo khoảng hiệu lực từng ca (không dùng classes.activeFrom);
 * ngày có buổi học (id trong sessionDates) → "Mở buổi học", ngày chưa có → "Tạo buổi học".
 * Ngày có nhiều ca: hiển thị danh sách ca để chọn trước khi gọi API (mục 4.6).
 */
export default function FixedScheduleGrid({
  classId,
  schedules,
  sessionDates,
  todaySlots = [],
  onCreateSession,
  onEditSchedules,
  creatingSessionDate = null,
  createError = "",
}) {
  const [weekStart, setWeekStart] = useState(() => toISO(startOfWeek(todayISO())));
  const [pendingDay, setPendingDay] = useState(null); // ngày đang chờ chọn ca (nhiều ca)
  const today = todayISO();
  const sessionDateSet = useMemo(() => new Set(sessionDates), [sessionDates]);

  const days = useMemo(() => {
    const first = startOfWeek(weekStart);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(first);
      date.setDate(first.getDate() + index);
      const iso = toISO(date);
      const isoDay = date.getDay() || 7;
      return {
        iso,
        label: DAY_OF_WEEK_LABELS[isoDay],
        isToday: iso === today,
        slots: slotsForDate(schedules, iso),
        hasSession: sessionDateSet.has(iso),
      };
    });
  }, [schedules, sessionDateSet, weekStart, today]);

  const weekActive = days.some((day) => day.slots.length > 0);

  const shiftWeek = (direction) => {
    const next = startOfWeek(weekStart);
    next.setDate(next.getDate() + direction * 7);
    setWeekStart(toISO(next));
    setPendingDay(null);
  };

  const handleCreateClick = (day) => {
    if (day.slots.length > 1) {
      setPendingDay(day.iso);
      return;
    }
    onCreateSession(day.iso, day.slots[0].startTime, day);
  };

  const handlePickSlot = (slot, day) => {
    setPendingDay(null);
    onCreateSession(day.iso, slot.startTime, day);
  };

  // Link "Mở buổi học" trỏ tab "Lịch dạy" (API thật), không phải tab mock "Nhật ký buổi học".
  const sessionsPath = `/tutor/classes/${classId}/schedule`;

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch dạy cố định</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => shiftWeek(-1)}
            aria-label="Tuần trước"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="min-w-[120px] text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {formatSessionDate(days[0].iso)} - {formatSessionDate(days[6].iso)}
          </p>
          <button
            type="button"
            onClick={() => shiftWeek(1)}
            aria-label="Tuần sau"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {weekActive ? (
        <div className="overflow-x-auto pb-1">
          <div className="grid min-w-[860px] grid-cols-7 gap-2">
            {days.map((day) => (
              <div
                key={day.iso}
                className={clsx(
                  "flex min-h-[150px] flex-col rounded-xl border p-2.5",
                  day.isToday
                    ? "border-blue-300 bg-blue-50/60 dark:border-blue-800/60 dark:bg-blue-950/30"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
                )}
              >
                <div className="mb-2 flex items-center justify-between gap-1">
                  <p
                    className={clsx(
                      "text-[11px] font-bold",
                      day.isToday
                        ? "text-blue-700 dark:text-blue-300"
                        : "text-slate-700 dark:text-slate-200",
                    )}
                  >
                    {day.label}
                  </p>
                  {day.isToday && (
                    <Badge tone="blue" size="xs">
                      Hôm nay
                    </Badge>
                  )}
                </div>

                {day.hasSession ? (
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      {day.slots.map((slot) => (
                        <p key={slot.startTime} className="text-[11px] text-slate-600 dark:text-slate-300">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Link
                        to={sessionsPath}
                        className={clsx(
                          "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
                          "bg-blue-50 text-blue-700 hover:bg-blue-100 active:scale-[0.98] dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70",
                        )}
                      >
                        <Play size={12} /> Mở buổi học
                      </Link>
                    </div>
                  </div>
                ) : day.slots.length ? (
                  <div className="space-y-2">
                    <div className="space-y-0.5">
                      <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 dark:text-slate-100">
                        <Clock size={11} className="shrink-0 text-blue-500 dark:text-blue-400" />
                        {day.slots.map((slot) => `${slot.startTime} - ${slot.endTime}`).join(", ")}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {slotValidityLabel(day.slots[0])}
                      </p>
                    </div>
                    {pendingDay === day.iso && day.slots.length > 1 ? (
                      <div className="space-y-1">
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                          <ListOrdered size={11} /> Ngày này có nhiều ca, chọn ca:
                        </p>
                        {day.slots.map((slot) => (
                          <button
                            key={slot.startTime}
                            type="button"
                            onClick={() => handlePickSlot(slot, day)}
                            disabled={creatingSessionDate !== null}
                            className={clsx(
                              "w-full cursor-pointer rounded-lg border border-amber-300 bg-amber-100/70 px-2 py-1.5 text-[11px] font-bold text-amber-800 transition-all hover:bg-amber-100 active:scale-[0.98] disabled:opacity-50 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/70",
                            )}
                          >
                            {slot.startTime} - {slot.endTime}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleCreateClick(day)}
                        disabled={creatingSessionDate !== null}
                        className={clsx(
                          "inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
                          "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] disabled:opacity-50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
                        )}
                      >
                        {creatingSessionDate === day.iso ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <CalendarDays size={12} />
                        )}
                        Tạo buổi học
                      </button>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-600">Không có ca dạy</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-5 text-center dark:border-slate-700 dark:bg-slate-900/40">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tuần này không có ca dạy — ca chỉ áp dụng trong khoảng hiệu lực đã chốt (không dùng
            ngày kích hoạt lớp làm mốc render).
          </p>
        </div>
      )}

      {createError && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <Clock size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <span>{createError}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {todaySlots.length
            ? `Hôm nay: ${todaySlots.map((slot) => `${slot.startTime} - ${slot.endTime}`).join(", ")}`
            : "Hôm nay không có ca dạy cố định."}
        </p>
        {onEditSchedules && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEditSchedules}
            className="cursor-pointer text-xs font-semibold"
          >
            <Pencil size={13} /> Chỉnh sửa lịch
          </Button>
        )}
      </div>
    </Card>
  );
}
