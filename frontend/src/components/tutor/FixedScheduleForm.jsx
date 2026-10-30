import { useState } from "react";
import { AlertCircle, Loader2, Plus, Trash2 } from "lucide-react";
import Button from "../ui/Button";
import { DAY_OF_WEEK_LABELS, formatSessionDate, todayISO } from "../../lib/classroomApi";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

function makeSlot(index, seed = {}) {
  return {
    key: seed.key ?? `slot-${index}-${Date.now()}`,
    dayOfWeek: seed.dayOfWeek ?? 1,
    startTime: seed.startTime || "19:30",
    endTime: seed.endTime || "21:00",
    validFrom: seed.validFrom || todayISO(),
    validTo: seed.validTo || "",
  };
}

/** Nhãn khoảng hiệu lực hiển thị cho một ca: "hiệu lực từ 03/11/2026" (kèm "đến ..." nếu có). */
function validityLabel(slot) {
  const from = slot.validFrom ? formatSessionDate(slot.validFrom) : "chưa chọn";
  if (!slot.validTo) return `hiệu lực từ ${from}`;
  return `hiệu lực từ ${from} đến ${formatSessionDate(slot.validTo)}`;
}

/**
 * Biểu mẫu chốt / cập nhật lịch dạy cố định (UC-T09).
 * Mỗi ca gồm: thứ trong tuần, giờ bắt đầu/kết thúc, ngày hiệu lực bắt đầu (bắt buộc)
 * và ngày kết thúc (tùy chọn, trống = không giới hạn). Validate phía client theo kế hoạch
 * mục Phase 3; lỗi nghiệp vụ (trùng ca với lớp khác, ...) do backend trả về qua serverError.
 */
export default function FixedScheduleForm({
  initialSlots = [],
  isUpdate = false,
  submitting = false,
  serverError = "",
  onCancel,
  onSubmit,
}) {
  const today = todayISO();
  const [slots, setSlots] = useState(() =>
    initialSlots.length
      ? initialSlots.map((slot, index) => makeSlot(index, slot))
      : [makeSlot(0)],
  );
  const [localError, setLocalError] = useState("");

  const error = localError || serverError;

  const updateSlot = (index, patch) => {
    setSlots((prev) => prev.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)));
  };

  const addSlot = () => {
    setSlots((prev) => [...prev, makeSlot(prev.length, {})]);
    setLocalError("");
  };

  const removeSlot = (index) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setLocalError("");
  };

  /** Lỗi riêng của một ca (rỗng = hợp lệ). */
  const slotError = (slot) => {
    if (!slot.startTime || !slot.endTime) return "Vui lòng nhập đủ giờ bắt đầu và giờ kết thúc.";
    if (slot.startTime >= slot.endTime) return "Giờ kết thúc phải sau giờ bắt đầu.";
    if (!slot.validFrom) return "Vui lòng chọn ngày bắt đầu hiệu lực.";
    if (slot.validFrom < today) return "Ngày bắt đầu hiệu lực không được trong quá khứ.";
    if (slot.validTo && slot.validTo < slot.validFrom) {
      return "Ngày kết thúc hiệu lực phải sau hoặc bằng ngày bắt đầu.";
    }
    return "";
  };

  const validateAll = () => {
    for (const slot of slots) {
      const message = slotError(slot);
      if (message) return message;
    }
    // Trùng/đè ca trong cùng một thứ (liền kề không tính trùng — end == start của ca kế tiếp).
    const byDay = {};
    for (const slot of slots) {
      byDay[slot.dayOfWeek] = (byDay[slot.dayOfWeek] || []).concat(slot);
    }
    for (const day of Object.keys(byDay)) {
      const daySlots = byDay[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 0; i < daySlots.length - 1; i += 1) {
        if (daySlots[i].endTime > daySlots[i + 1].startTime) {
          return `Các ca trong tuần bị trùng nhau (${DAY_OF_WEEK_LABELS[day]}).`;
        }
      }
    }
    return "";
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const message = slots.length ? validateAll() : "Vui lòng chọn ít nhất một ca dạy trong tuần.";
    if (message) {
      setLocalError(message);
      return;
    }
    setLocalError("");
    onSubmit({
      schedules: slots.map((slot) => ({
        dayOfWeek: Number(slot.dayOfWeek),
        startTime: slot.startTime,
        endTime: slot.endTime,
        validFrom: slot.validFrom,
        validTo: slot.validTo || null,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Chọn các ca dạy cố định trong tuần. Mỗi ca có khoảng hiệu lực riêng — hệ thống tự động
        kiểm tra trùng ca với các lớp khác của bạn.
      </p>

      <div className="space-y-3">
        {slots.map((slot, index) => {
          const message = slotError(slot);
          return (
            <div
              key={slot.key}
              className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40"
            >
              <div className="grid gap-2.5 sm:grid-cols-5">
                <div>
                  <label htmlFor={`schedule-day-${slot.key}`} className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Thứ trong tuần <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id={`schedule-day-${slot.key}`}
                    value={slot.dayOfWeek}
                    onChange={(event) => updateSlot(index, { dayOfWeek: Number(event.target.value) })}
                    className={inputClass}
                  >
                    {Object.entries(DAY_OF_WEEK_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`schedule-start-${slot.key}`} className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Giờ bắt đầu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`schedule-start-${slot.key}`}
                    type="time"
                    value={slot.startTime}
                    onChange={(event) => updateSlot(index, { startTime: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`schedule-end-${slot.key}`} className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Giờ kết thúc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`schedule-end-${slot.key}`}
                    type="time"
                    value={slot.endTime}
                    onChange={(event) => updateSlot(index, { endTime: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`schedule-valid-from-${slot.key}`} className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Hiệu lực từ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id={`schedule-valid-from-${slot.key}`}
                    type="date"
                    min={today}
                    value={slot.validFrom}
                    onChange={(event) => updateSlot(index, { validFrom: event.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor={`schedule-valid-to-${slot.key}`} className="mb-1 block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Hiệu lực đến (tùy chọn)
                  </label>
                  <input
                    id={`schedule-valid-to-${slot.key}`}
                    type="date"
                    min={slot.validFrom || today}
                    value={slot.validTo}
                    onChange={(event) => updateSlot(index, { validTo: event.target.value })}
                    className={inputClass}
                    placeholder="Trống = không giới hạn"
                  />
                </div>
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {DAY_OF_WEEK_LABELS[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime} (
                  {validityLabel(slot)})
                </p>
                {slots.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSlot(index)}
                    className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 size={12} /> Xóa ca
                  </button>
                )}
              </div>

              {message && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-600 dark:text-rose-400">{message}</p>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        type="button"
        onClick={addSlot}
        disabled={slots.length >= 7}
        className="cursor-pointer text-xs font-semibold"
      >
        <Plus size={14} /> Thêm ca
      </Button>

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs font-semibold"
        >
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={submitting}
          className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? "Đang lưu..." : isUpdate ? "Lưu lịch mới" : "Chốt lịch dạy cố định"}
        </Button>
      </div>
    </form>
  );
}
