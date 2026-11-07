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
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { apiGetClassDetail, mapClassDetail } from "../../lib/classroomApi";

const NAV_ITEMS = [
  { to: "overview", label: "Tổng quan", icon: LayoutDashboard },
  { to: "schedule", label: "Lịch dạy", icon: CalendarClock },
  { to: "path", label: "Lộ trình học", icon: GraduationCap },
  { to: "lessons", label: "Bài giảng", icon: CalendarDays },
  { to: "exercises", label: "Bài tập", icon: BookOpen },
  { to: "materials", label: "Tài liệu & video", icon: FileText },
];

/**
 * Sidebar quản lý 1 lớp học cụ thể. Nhận prop `collapsed` từ AppShell
 * (khi workspace thu gọn): chỉ giữ lại nút quay về + icon các mục điều hướng.
 */
export default function TutorClassSidebar({ collapsed = false }) {
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
    <nav className={clsx("flex flex-1 flex-col overflow-y-auto", collapsed ? "px-2.5" : "px-3")}>
      {/* Back button */}
      <NavLink
        to="/tutor/classes"
        title={collapsed ? "Về lớp học của tôi" : undefined}
        className={clsx(
          "group flex items-center rounded-lg py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-900/80 transition",
          collapsed ? "justify-center" : "gap-2.5 px-3"
        )}
      >
        <ArrowLeft size={16} className="shrink-0 transition group-hover:-translate-x-0.5" strokeWidth={1.75} />
        {!collapsed && <span>Lớp học của tôi</span>}
      </NavLink>

      {/* Card thông tin lớp học — chỉ hiện ở chế độ mở rộng */}
      {!collapsed && (
        <div className="mx-1 mt-3 mb-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-colors hover:border-blue-200 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-blue-800/50">
          {loading ? (
            <div className="flex items-center gap-2.5 px-4 py-4">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ) : detail ? (
            <div className="flex items-center gap-2.5 px-4 py-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <User size={17} strokeWidth={1.75} />
              </span>
              <h2 className="min-w-0 text-sm font-bold leading-snug text-slate-900 dark:text-white">
                {detail.studentName || detail.className}
              </h2>
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">Chưa tải được thông tin lớp học.</p>
            </div>
          )}
        </div>
      )}

      {/* Section label */}
      {!collapsed && (
        <div className="mb-1 px-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Quản lý lớp học
          </p>
        </div>
      )}

      {/* Navigation items */}
      <div className="mt-2 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const to = `/tutor/classes/${classId}/${item.to}`;
          const isActive = location.pathname === to;
          return (
            <NavLink
              key={item.to}
              to={to}
              title={collapsed ? item.label : undefined}
              className={clsx(
                "flex items-center rounded-lg py-2.5 text-sm font-medium transition-all duration-150",
                collapsed ? "justify-center" : "gap-3 px-3",
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
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
