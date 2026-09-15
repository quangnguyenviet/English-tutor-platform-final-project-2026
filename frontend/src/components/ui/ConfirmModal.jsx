import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import Button from "./Button";

const toneStyles = {
  blue: "bg-blue-600 hover:bg-blue-700 text-white",
  emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
  rose: "bg-rose-600 hover:bg-rose-700 text-white",
  amber: "bg-amber-600 hover:bg-amber-700 text-white",
};

/**
 * Reusable confirmation modal – replaces all window.confirm() across admin pages.
 *
 * @param {boolean}   open          Whether modal is visible
 * @param {string}    title         Modal heading
 * @param {string|ReactNode} message Body content / description
 * @param {string}    confirmLabel  Text for confirm button (default "Đồng ý")
 * @param {string}    cancelLabel   Text for cancel button (default "Hủy")
 * @param {"blue"|"emerald"|"rose"|"amber"} confirmTone Button color variant
 * @param {import("lucide-react").LucideIcon} icon Optional leading icon
 * @param {function}  onConfirm     Callback when user confirms
 * @param {function}  onCancel      Callback when user cancels / closes
 */
export default function ConfirmModal({
  open,
  title = "Xác nhận hành động",
  message,
  confirmLabel = "Đồng ý",
  cancelLabel = "Hủy",
  confirmTone = "blue",
  icon: Icon = AlertTriangle,
  onConfirm,
  onCancel,
}) {
  const overlayRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape") onCancel?.();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onCancel?.();
      }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
    >
      <div className="fade-slide-in relative flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-200 p-5 dark:border-slate-800">
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
              confirmTone === "rose"
                ? "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400"
                : confirmTone === "emerald"
                ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                : confirmTone === "amber"
                ? "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400"
                : "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400"
            }`}
          >
            <Icon size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {title}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {typeof message === "string" ? (
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {message}
            </p>
          ) : (
            message
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-3.5 dark:border-slate-800">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            size="sm"
            onClick={onConfirm}
            className={toneStyles[confirmTone] || toneStyles.blue}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
