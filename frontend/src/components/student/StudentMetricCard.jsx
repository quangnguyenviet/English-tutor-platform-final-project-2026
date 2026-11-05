import { Link } from "react-router-dom";
import clsx from "clsx";

/**
 * Thẻ chỉ số dùng chung cho phân hệ học sinh — UC-ST-02 §3.1.
 *
 * Một khuôn duy nhất: hộp icon trên cùng, con số (Geist Mono/tabular-nums),
 * rồi nhãn mô tả. Chỉ đổi `tone` khi con số thật sự mang nghĩa cảnh báo
 * (amber = cần chú ý, rose = quá hạn/LIVE, emerald = đã đạt).
 * Hỗ trợ `to` để điều hướng sang trang tương ứng khi click.
 */
const tones = {
  blue: {
    box: "bg-blue-50 dark:bg-blue-950/40",
    icon: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    box: "bg-amber-50 dark:bg-amber-950/40",
    icon: "text-amber-600 dark:text-amber-400",
  },
  emerald: {
    box: "bg-emerald-50 dark:bg-emerald-950/40",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  rose: {
    box: "bg-rose-50 dark:bg-rose-950/40",
    icon: "text-rose-600 dark:text-rose-400",
  },
};

export default function StudentMetricCard({ icon: Icon, value, label, tone = "blue", to, onClick }) {
  const palette = tones[tone] || tones.blue;
  const Wrapper = to ? Link : onClick ? "button" : "div";
  const isClickable = Boolean(to || onClick);

  const wrapperProps = to
    ? {
        to,
        className:
          "group block cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-blue-400 hover:shadow-sm active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700",
      }
    : onClick
      ? {
          type: "button",
          onClick,
          className:
            "group block w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-blue-400 hover:shadow-sm active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700",
        }
      : {
          className: "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900",
        };

  return (
    <Wrapper {...wrapperProps}>
      <div
        className={clsx(
          "mb-3 flex h-9 w-9 items-center justify-center rounded-xl transition-transform",
          isClickable && "group-hover:scale-105",
          palette.box
        )}
      >
        <Icon size={18} className={palette.icon} strokeWidth={1.75} />
      </div>
      <p
        className={clsx(
          "font-mono text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white transition-colors",
          isClickable && "group-hover:text-blue-600 dark:group-hover:text-blue-400"
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">
        {label}
      </p>
    </Wrapper>
  );
}
