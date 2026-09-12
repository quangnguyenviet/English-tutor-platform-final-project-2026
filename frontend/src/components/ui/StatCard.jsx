import Card from "./Card";
import clsx from "clsx";

const toneText = {
  blue: "text-blue-600 dark:text-blue-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  sky: "text-sky-600 dark:text-sky-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  rose: "text-rose-600 dark:text-rose-400",
  slate: "text-slate-600 dark:text-slate-400",
  violet: "text-violet-600 dark:text-violet-400",
};

export default function StatCard({ icon: Icon, label, value, tone = "blue", hint }) {
  return (
    <Card className="flex items-start gap-4">
      <div className={clsx("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-50 dark:bg-slate-800", toneText[tone])}>
        {Icon && <Icon size={20} strokeWidth={1.75} />}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-0.5 text-2xl font-semibold text-slate-900 dark:text-slate-50">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
      </div>
    </Card>
  );
}
