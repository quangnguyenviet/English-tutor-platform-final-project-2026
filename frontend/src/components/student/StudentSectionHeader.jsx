import { Link } from "react-router-dom";

/** Khuôn tiêu đề khối dùng chung cho phân hệ học sinh. */
export default function StudentSectionHeader({ icon: Icon, title, to, linkLabel, className }) {
  return (
    <div className={`mb-3 flex items-center justify-between gap-3 ${className || ""}`}>
      <div className="flex min-w-0 items-center gap-2">
        {Icon && <Icon size={16} className="shrink-0 text-slate-400" strokeWidth={1.75} />}
        <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      </div>
      {to && linkLabel && (
        <Link
          to={to}
          className="shrink-0 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
