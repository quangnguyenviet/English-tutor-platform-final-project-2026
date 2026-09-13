import clsx from "clsx";
import { skillToneClass } from "../../lib/skillColors";

const tones = {
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  sky: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  violet: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
};

// Pass `skill` (e.g. "Viết") instead of `tone` to color-code by skill rather
// than by status — keeps the two kinds of badge visually distinct.
export default function Badge({ tone = "neutral", skill, children, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
        skill ? skillToneClass(skill) : tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
