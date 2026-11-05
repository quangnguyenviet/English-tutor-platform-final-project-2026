import clsx from "clsx";

export default function Card({ children, className, padded = true, ...props }) {
  return (
    <div
      {...props}
      className={clsx(
        "rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
        padded && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
