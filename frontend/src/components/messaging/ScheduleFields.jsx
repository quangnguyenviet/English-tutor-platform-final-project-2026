import clsx from "clsx";
import { CalendarDays } from "lucide-react";
import { DAY_LABEL, formatSessionDate } from "../../lib/messagingApi";
import { DEFAULT_SLOT_TIME, firstSession, isSlotValid, startDateError, todayInVietnam } from "./proposalSchedule";

/** Chọn thứ học, giờ riêng cho từng thứ và ngày bắt đầu học của đề xuất. */
export default function ScheduleFields({ slots, startDate, inputClass, onSlotsChange, onStartDateChange }) {
  const error = startDateError(startDate);
  const trial = error ? null : firstSession(startDate, slots);

  const toggleDay = (day) => {
    if (slots.some((s) => s.dayOfWeek === day)) {
      onSlotsChange(slots.filter((s) => s.dayOfWeek !== day));
      return;
    }
    // Thứ mới lấy theo giờ vừa có để đỡ phải nhập lại.
    const { startTime, endTime } = slots.at(-1) ?? DEFAULT_SLOT_TIME;
    onSlotsChange([...slots, { dayOfWeek: day, startTime, endTime }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
  };

  const setTime = (day, field, value) =>
    onSlotsChange(slots.map((s) => (s.dayOfWeek === day ? { ...s, [field]: value } : s)));

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Lịch học hằng tuần</h3>
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(DAY_LABEL).map(([day, label]) => {
          const value = Number(day);
          const active = slots.some((s) => s.dayOfWeek === value);
          return (
            <button key={day} type="button" onClick={() => toggleDay(value)} aria-pressed={active}
              className={clsx("h-9 min-w-[44px] cursor-pointer rounded-lg border text-sm font-medium transition-all active:scale-[0.98]",
                active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 text-slate-700 hover:border-blue-300 dark:border-slate-700 dark:text-slate-200")}>
              {label}
            </button>
          );
        })}
      </div>

      {slots.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">Chọn thứ học để đặt giờ cho từng buổi.</p>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-[2.5rem_1fr_1fr] gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Thứ</span><span>Giờ bắt đầu</span><span>Giờ kết thúc</span>
          </div>
          {slots.map((slot) => (
            <div key={slot.dayOfWeek}>
              <div className="grid grid-cols-[2.5rem_1fr_1fr] items-center gap-2">
                <span className="text-sm font-medium text-slate-900 dark:text-white">{DAY_LABEL[slot.dayOfWeek]}</span>
                <input type="time" className={clsx(inputClass, "min-w-0 font-mono")} value={slot.startTime}
                  aria-label={`Giờ bắt đầu ${DAY_LABEL[slot.dayOfWeek]}`}
                  onChange={(e) => setTime(slot.dayOfWeek, "startTime", e.target.value)} />
                <input type="time" className={clsx(inputClass, "min-w-0 font-mono")} value={slot.endTime}
                  aria-label={`Giờ kết thúc ${DAY_LABEL[slot.dayOfWeek]}`}
                  onChange={(e) => setTime(slot.dayOfWeek, "endTime", e.target.value)} />
              </div>
              {!isSlotValid(slot) && (
                <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">Giờ kết thúc phải sau giờ bắt đầu.</p>
              )}
            </div>
          ))}
        </div>
      )}

      <label className="block space-y-1.5 text-sm font-medium text-slate-900 dark:text-white">
        Ngày bắt đầu học
        <input type="date" className={clsx(inputClass, "font-mono dark:[color-scheme:dark]")} min={todayInVietnam()} value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)} />
      </label>
      {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      {trial && (
        <p className="flex items-center gap-2 rounded-xl bg-blue-50 p-3 text-sm text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
          <CalendarDays size={16} className="shrink-0" />
          Buổi học thử: {formatSessionDate(trial.date)}, {trial.startTime} – {trial.endTime}
        </p>
      )}
    </section>
  );
}
