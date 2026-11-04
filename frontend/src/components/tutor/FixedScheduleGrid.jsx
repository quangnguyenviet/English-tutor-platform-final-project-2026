import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
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
 * Lưới lịch tuần của lớp ACTIVE (kế hoạch mục Phase 3, ràng buộc 15, V16).
 * Render ca theo khoảng hiệu lực từng ca (không dùng classes.activeFrom);
 * ngày có nhật ký dạy học (trong sessionDates) → đánh dấu "Đã có nhật ký".
 * Nhật ký dạy học (kiến thức + dặn dò) được ghi trên lưới "Lịch dạy" (V16) —
 * ở đây chỉ điều hướng sang tab đó, không còn tạo buổi học on-demand.
 */
export default function FixedScheduleGrid({
  classId,
  schedules,
  sessionDates,
  todaySlots = [],
  onEditSchedules,
}) {
  const [weekStart, setWeekStart] = useState(() => toISO(startOfWeek(todayISO())));
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
        hasLog: sessionDateSet.has(iso),
      };
    });
  }, [schedules, sessionDateSet, weekStart, today]);

  const weekActive = days.some((day) => day.slots.length > 0);

  const shiftWeek = (direction) => {
    const next = startOfWeek(weekStart);
    next.setDate(next.getDate() + direction * 7);
    setWeekStart(toISO(next));
  };

  // Link "Mở buổi học" trỏ tab "Lịch dạy" (lattice + nhật ký dạy học, API thật).
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

                <div className="flex-1 space-y-2">
                  {day.slots.length ? (
                    <div className="space-y-0.5">
                      {day.slots.map((slot) => (
                        <p key={slot.startTime} className="text-[11px] text-slate-600 dark:text-slate-300">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      ))}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {slotValidityLabel(day.slots[0])}
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 dark:text-slate-600">
                      Không có ca dạy
                    </p>
                  )}
                  {day.hasLog && (
                    <Link
                      to={sessionsPath}
                      className={clsx(
                        "inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-bold transition-all",
                        "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-[0.98] dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70",
                      )}
                    >
                      <Check size={12} /> Đã có nhật ký — xem trên Lịch dạy
                    </Link>
                  )}
                </div>
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
