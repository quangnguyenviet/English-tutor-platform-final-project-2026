import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import clsx from "clsx";
import { todayISO } from "../../lib/classroomApi";

/** Nhãn nút lưu theo loại exception (overlay 1 lần diễn — kế hoạch mục 4.2). */
const SUBMIT_LABELS = {
  CANCELLED: "Hủy buổi học",
  RESCHEDULED: "Dời buổi học",
};

/**
 * Biểu mẫu ghi ngoại lệ (overlay) cho 1 ô lattice — không tạo buổi học thật.
 * Mỗi loại dùng 1 nhóm trường riêng (kế hoạch mục 3.4 "Quy ước trường theo loại"):
 * CANCELLED chỉ có lý do; RESCHEDULED có ngày mới + giờ (hình thức / link /
 * địa chỉ giữ theo ca gốc của lớp, không override qua exception).
 */
export default function ExceptionForm({
  slot,
  exceptionType,
  submitting,
  serverError,
  onCancel,
  onSubmit,
}) {
  const [reason, setReason] = useState("");
  const [newDate, setNewDate] = useState(slot?.date || "");
  const [newStartTime, setNewStartTime] = useState(
    slot?.startTime?.slice(0, 5) || "",
  );
  const [newEndTime, setNewEndTime] = useState(slot?.endTime?.slice(0, 5) || "");
  const [localError, setLocalError] = useState("");

  const error = localError || serverError;

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (exceptionType === "RESCHEDULED") {
      if (!newDate || !newStartTime || !newEndTime) {
        setLocalError("Vui lòng nhập đầy đủ ngày và khung giờ mới.");
        return;
      }
      if (newDate < todayISO()) {
        setLocalError("Không thể dời buổi học sang ngày trong quá khứ.");
        return;
      }
      if (newStartTime >= newEndTime) {
        setLocalError("Giờ kết thúc phải sau giờ bắt đầu.");
        return;
      }
    }

    onSubmit({
      scheduleId: slot?.scheduleId,
      exceptionDate: slot?.date,
      exceptionType,
      newDate: exceptionType === "RESCHEDULED" ? newDate : null,
      newStartTime:
        exceptionType === "RESCHEDULED" ? newStartTime : null,
      newEndTime: exceptionType === "RESCHEDULED" ? newEndTime : null,
      reason: reason.trim() || null,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900/50">
        <p className="font-bold text-slate-800 dark:text-slate-100">
          {slot?.dateLabel} — ca {slot?.timeLabel}
        </p>
        <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          Điều chỉnh áp dụng cho lần diễn này, không thay đổi ca cố định chung.
        </p>
      </div>

      {exceptionType === "RESCHEDULED" && (
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label
              htmlFor="exception-new-date"
              className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              Ngày mới <span className="text-rose-500">*</span>
            </label>
            <input
              id="exception-new-date"
              type="date"
              min={todayISO()}
              value={newDate}
              onChange={(event) => setNewDate(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="exception-new-start"
              className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              Giờ bắt đầu <span className="text-rose-500">*</span>
            </label>
            <input
              id="exception-new-start"
              type="time"
              value={newStartTime}
              onChange={(event) => setNewStartTime(event.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="exception-new-end"
              className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
            >
              Giờ kết thúc <span className="text-rose-500">*</span>
            </label>
            <input
              id="exception-new-end"
              type="time"
              value={newEndTime}
              onChange={(event) => setNewEndTime(event.target.value)}
              className={inputClass}
            />
          </div>
        </div>
      )}

      {exceptionType === "CANCELLED" && (
        <div>
          <label
            htmlFor="exception-reason"
            className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200"
          >
            Lý do (tuỳ chọn)
          </label>
          <input
            id="exception-reason"
            type="text"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="VD: Học sinh đi thi, gia sư xin nghỉ..."
            className={inputClass}
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
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
          variant={exceptionType === "CANCELLED" ? "danger" : "primary"}
          size="sm"
          type="submit"
          disabled={submitting}
          className={clsx(
            "cursor-pointer px-5 text-xs font-bold",
            exceptionType === "CANCELLED"
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-blue-600 text-white hover:bg-blue-700",
          )}
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? "Đang lưu..." : SUBMIT_LABELS[exceptionType]}
        </Button>
      </div>
    </form>
  );
}
