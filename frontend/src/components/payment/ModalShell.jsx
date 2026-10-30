import { useEffect } from "react";
import { X } from "lucide-react";

/** Khung modal dùng chung cho các thao tác phí nhận lớp (cuộn được trên mobile). */
export default function ModalShell({ open, title, subtitle, onClose, children, footer, busy = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Đóng"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-40 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 dark:border-slate-800 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
