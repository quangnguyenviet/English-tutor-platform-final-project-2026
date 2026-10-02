import { NavLink, useParams, useLocation } from "react-router-dom";
import clsx from "clsx";
import { ArrowLeft, GraduationCap, BookOpen, FileText, LayoutDashboard, CalendarDays } from "lucide-react";
import Avatar from "../ui/Avatar";

const NAV_ITEMS = [
  { to: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { to: "path", label: "Lộ trình học", icon: GraduationCap },
  { to: "sessions", label: "Buổi học thực tế", icon: CalendarDays },
  { to: "exercises", label: "Bài tập", icon: BookOpen },
  { to: "materials", label: "Tài liệu & video", icon: FileText },
];

export default function TutorStudentSidebar({ student }) {
  const { studentId } = useParams();
  const location = useLocation();

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-3">
      {/* Back button */}
      <NavLink
        to="/tutor/students"
        className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 transition"
      >
        <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" strokeWidth={1.75} />
        <span>Danh sách học sinh</span>
      </NavLink>

      {/* Student profile card */}
      {student && (
        <div className="mx-1 mt-3 mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-950/40 dark:to-indigo-950/40 ring-1 ring-blue-200/50 dark:ring-blue-800/30">
          <div className="flex items-center gap-3.5">
            <Avatar initials={student.initials} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
                {student.name}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {student.level} &middot; {student.goal}
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 flex items-center gap-2.5">
            <div className="flex-1 h-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-500"
                style={{ width: `${student.overallProgress}%` }}
              />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {student.overallProgress}%
            </span>
          </div>
        </div>
      )}

      {/* Section label */}
      <div className="mb-1 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Quản lý học sinh
        </p>
      </div>

      {/* Navigation items */}
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const to = `/tutor/students/${studentId}/${item.to}`;
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={item.to}
              to={to}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-white text-blue-700 shadow-sm ring-1 ring-blue-200 dark:bg-slate-800 dark:text-blue-300 dark:ring-blue-800/50"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900/60"
              )}
            >
              <item.icon
                size={18}
                strokeWidth={isActive ? 2 : 1.75}
                className={clsx(
                  "shrink-0 transition",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500"
                )}
              />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}