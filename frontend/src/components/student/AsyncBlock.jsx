import { AlertCircle, RotateCcw } from "lucide-react";
import Button from "../ui/Button";

/** Khối skeleton chung cho các trang học sinh đang tải dữ liệu. */
export function SkeletonRows({ rows = 3, className = "h-20" }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Đang tải">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800 ${className}`} />
      ))}
    </div>
  );
}

/** Hộp lỗi cục bộ — một khu vực lỗi không làm hỏng cả trang. */
export function ErrorBox({ message, onRetry }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400 sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        {message || "Không tải được dữ liệu. Vui lòng thử lại."}
      </span>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCcw size={14} />
          Thử lại
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-slate-200 p-10 text-center dark:border-slate-800">
      {Icon && (
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
          <Icon size={18} />
        </span>
      )}
      <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      {description && <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>}
    </div>
  );
}
