import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  FileText,
  LayoutDashboard,
  NotebookPen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetMyClassDetail } from "../../lib/studentApi";
import { CLASS_STATUS_META, TEACHING_MODE_LABELS } from "../../lib/classroomApi";
import Badge from "../ui/Badge";

const NAV_ITEMS = [
  { to: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { to: "schedule", label: "Lịch dạy", icon: CalendarClock },
  { to: "lessons", label: "Bài giảng", icon: BookOpen },
  { to: "exercises", label: "Bài tập", icon: NotebookPen },
  { to: "materials", label: "Tài liệu & video", icon: FileText },
];

export default function StudentClassSidebar({ collapsed = false }) {
  const { token } = useAuth();
  const location = useLocation();
  const classId = location.pathname.match(/^\/student\/classes\/([^/]+)/)?.[1];
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let mounted = true;
    if (!token || !classId) return undefined;
    apiGetMyClassDetail(token, classId)
      .then((result) => mounted && setDetail(result))
      .catch(() => mounted && setDetail(null));
    return () => {
      mounted = false;
    };
  }, [token, classId]);

  const status = CLASS_STATUS_META[detail?.status] ?? { label: detail?.status, tone: "slate" };

  return (
    <nav className={clsx("flex flex-1 flex-col overflow-y-auto", collapsed ? "px-2.5" : "px-3")}>
      <NavLink
        to="/student/classes"
        title={collapsed ? "Về lớp học của tôi" : undefined}
        className={clsx(
          "group flex items-center rounded-lg py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
          collapsed ? "justify-center" : "gap-2.5 px-3",
        )}
      >
        <ArrowLeft size={16} className="shrink-0 transition group-hover:-translate-x-0.5" />
        {!collapsed && <span>Lớp học của tôi</span>}
      </NavLink>

      {!collapsed && (
        <div className="mx-1 mb-4 mt-3 rounded-xl bg-blue-50 p-4 ring-1 ring-blue-200/60 dark:bg-blue-950/30 dark:ring-blue-800/40">
          {detail ? (
            <div className="space-y-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                {detail.className}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                Gia sư: {detail.tutorName}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                {TEACHING_MODE_LABELS[detail.teachingMode] ?? detail.teachingMode}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-blue-100 dark:bg-blue-900/50" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-blue-100 dark:bg-blue-900/50" />
            </div>
          )}
        </div>
      )}

      {!collapsed && (
        <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Không gian lớp học
        </p>
      )}
      <div className="mt-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const href = `/student/classes/${classId}/${to}`;
          const active = location.pathname === href;
          return (
            <NavLink
              key={to}
              to={href}
              title={collapsed ? label : undefined}
              className={clsx(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all",
                collapsed ? "justify-center" : "gap-3 px-3",
                active
                  ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-800/50"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
            >
              <Icon size={17} className="shrink-0" />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
