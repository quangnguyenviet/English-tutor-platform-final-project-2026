import { X, CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";
import clsx from "clsx";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    iconClass: "text-emerald-200",
    bg: "bg-emerald-500/90 dark:bg-emerald-600",
    border: "border-emerald-400/30",
    text: "text-white",
  },
  error: {
    icon: AlertCircle,
    iconClass: "text-rose-200",
    bg: "bg-rose-500/90 dark:bg-rose-600",
    border: "border-rose-400/30",
    text: "text-white",
  },
  warning: {
    icon: AlertTriangle,
    iconClass: "text-amber-200",
    bg: "bg-amber-500/90 dark:bg-amber-600",
    border: "border-amber-400/30",
    text: "text-white",
  },
  info: {
    icon: Info,
    iconClass: "text-blue-200",
    bg: "bg-blue-500/90 dark:bg-blue-600",
    border: "border-blue-400/30",
    text: "text-white",
  },
};

export function Toast({ id, message, type = "info", duration = 5000, onDismiss }) {
  const { icon: Icon, iconClass, bg, border, text } = VARIANTS[type];

  return (
    <div
      id={`toast-${id}`}
      className={clsx(
        "flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-2xl transition-all duration-300",
        bg,
        border,
        text,
        "slide-in-right fade-in transition-all duration-300"
      )}
    >
      <Icon size={18} className={`shrink-0 ${iconClass}`} />
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="ml-auto shrink-0 opacity-70 hover:opacity-100 transition-colors"
        aria-label="Đóng thông báo"
      >
        <X size={14} />
      </button>
    </div>
  );
}
