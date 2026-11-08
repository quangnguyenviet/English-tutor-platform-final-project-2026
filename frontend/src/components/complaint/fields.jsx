import clsx from "clsx";
import { AlertTriangle } from "lucide-react";

export const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-950";

/** Nhãn + ô nhập + lỗi. */
export function Field({ label, required, hint, error, children, className }) {
  return (
    <label className={clsx("block space-y-1.5", className)}>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </span>
      {children}
      {hint && !error && <span className="block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      {error && <span className="block text-xs text-rose-600 dark:text-rose-400">{error}</span>}
    </label>
  );
}

/** Một dòng thông tin dạng nhãn - giá trị. */
export function InfoRow({ label, children, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-slate-500 dark:text-slate-400">{label}</span>
      <span className={clsx("text-right text-slate-900 dark:text-white", mono && "font-mono")}>{children ?? "—"}</span>
    </div>
  );
}

/** Hộp cảnh báo / lỗi. */
export function Notice({ tone = "rose", children }) {
  const tones = {
    rose: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400",
    amber: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400",
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-400",
  };
  return (
    <p className={clsx("flex items-start gap-2 rounded-xl border px-3 py-2 text-sm", tones[tone])}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Khối có tiêu đề nhỏ bên trong modal. */
export function Section({ title, children, aside }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}
