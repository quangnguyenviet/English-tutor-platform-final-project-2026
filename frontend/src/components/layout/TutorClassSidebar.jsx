import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  ArrowLeft,
  GraduationCap,
  BookOpen,
  FileText,
  LayoutDashboard,
  CalendarDays,
  CalendarClock,
} from "lucide-react";
import Badge from "../ui/Badge";
import { useAuth } from "../../context/AuthContext";
import { apiGetClassDetail, mapClassDetail } from "../../lib/classroomApi";

const NAV_ITEMS = [
  { to: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { to: "schedule", label: "Lịch dạy", icon: CalendarClock },
  { to: "path", label: "Lộ trình học", icon: GraduationCap },
  { to: "sessions", label: "Nhật ký buổi học", icon: CalendarDays },
  { to: "exercises", label: "Bài tập", icon: BookOpen },
  { to: "materials", label: "Tài liệu & video", icon: FileText },
];

export default function TutorClassSidebar() {
  const { token } = useAuth();
  const location = useLocation();
  // Sidebar được render bởi AppShell (layout route) nên useParams() không thấy classId của route con.
  const classIdMatch = location.pathname.match(/^\/tutor\/classes\/([^/]+)/);
  const classId = classIdMatch ? classIdMatch[1] : null;

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (!token || !classId) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    apiGetClassDetail(token, classId)
      .then((result) => {
        if (isMounted) setDetail(mapClassDetail(result));
      })
      .catch(() => {
        // Lỗi chỉ làm mờ card thông tin lớp; các mục điều hướng vẫn dùng được.
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [token, classId]);

  return (
    <nav className="flex flex-1 flex-col overflow-y-auto px-3">
      {/* Back button */}
      <NavLink
        to="/tutor/classes"
        className="group flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 transition"
      >
        <ArrowLeft size={16} className="transition group-hover:-translate-x-0.5" strokeWidth={1.75} />
        <span>Lớp học của tôi</span>
      </NavLink>

      {/* Class profile card */}
      <div className="mx-1 mt-3 mb-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-4 dark:from-blue-950/40 dark:to-indigo-950/40 ring-1 ring-blue-200/50 dark:ring-blue-800/30">
        {loading ? (
          <div className="space-y-2.5">
            <div className="h-3.5 w-16 animate-pulse rounded bg-white/70 dark:bg-slate-800/70" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/70 dark:bg-slate-800/70" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-white/70 dark:bg-slate-800/70" />
          </div>
        ) : detail ? (
          <div className="space-y-2">
            <Badge tone={detail.statusTone}>{detail.statusLabel}</Badge>
            <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-50">
              {detail.className}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Học viên: {detail.studentName || "Đang cập nhật"}
            </p>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">
              Hình thức: {detail.modeLabel}
            </p>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">Đang tải thông tin lớp...</p>
        )}
      </div>

      {/* Section label */}
      <div className="mb-1 px-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Quản lý lớp học
        </p>
      </div>

      {/* Navigation items */}
      <div className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const to = `/tutor/classes/${classId}/${item.to}`;
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
