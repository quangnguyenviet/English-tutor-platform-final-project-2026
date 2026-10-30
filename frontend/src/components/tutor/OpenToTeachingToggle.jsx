import { CheckCircle2, Loader2, PauseCircle } from "lucide-react";
import clsx from "clsx";

/**
 * Thẻ bật/tắt "Đang mở nhận lớp" (tutors.is_open_to_teaching).
 * Tắt: gia sư không thấy lớp đang tuyển và không ứng tuyển được; lớp đang dạy giữ nguyên.
 *
 * @param {boolean}  open      Trạng thái hiện tại
 * @param {boolean}  busy      Đang gọi API
 * @param {function} onToggle  Bấm công tắc
 */
export default function OpenToTeachingToggle({ open, busy = false, onToggle }) {
  return (
    <div
      className={clsx(
        "rounded-xl border p-4 shadow-xs",
        open
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/40"
          : "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/40",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          {open ? (
            <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <PauseCircle size={20} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <div>
            <p className="text-xs font-bold text-slate-900 dark:text-white">
              {open ? "Đang mở nhận lớp" : "Đang tạm ngưng nhận lớp mới"}
            </p>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
              {open
                ? "Bạn đang thấy các lớp đang tuyển và có thể gửi đơn ứng tuyển."
                : "Bạn sẽ không thấy lớp đang tuyển và không ứng tuyển được. Các lớp đang dạy vẫn giữ nguyên."}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          aria-label="Đang mở nhận lớp"
          onClick={onToggle}
          disabled={busy}
          className={clsx(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
            open ? "bg-emerald-600" : "bg-slate-300 dark:bg-slate-700",
          )}
        >
          <span
            className={clsx(
              "inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform",
              open ? "translate-x-5" : "translate-x-0.5",
            )}
          >
            {busy && <Loader2 size={12} className="animate-spin text-slate-500" />}
          </span>
        </button>
      </div>
    </div>
  );
}
