import clsx from "clsx";
import { PAYMENT_TABS } from "../../lib/paymentModel";

export default function PaymentTabs({ active, onChange, counts, includeAll = false }) {
  const tabs = includeAll ? [{ key: "ALL", label: "Tất cả" }, ...PAYMENT_TABS] : PAYMENT_TABS;
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1" role="tablist">
      {tabs.map((tab) => {
        const selected = active === tab.key;
        const count = counts?.[tab.key];
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.key)}
            className={clsx(
              "flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition active:scale-[0.98]",
              selected
                ? "bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            {tab.label}
            {count !== undefined && (
              <span
                className={clsx(
                  "rounded-full px-1.5 font-mono text-xs",
                  selected ? "bg-white/20" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
