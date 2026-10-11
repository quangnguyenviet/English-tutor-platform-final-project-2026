import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import {
  Bell,
  Brain,
  CheckCheck,
  CheckCircle2,
  Clock,
  FolderOpen,
  NotebookPen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { LESSON_DEMO_REFERENCE_TIME } from "../../lib/lessonSessionModel";

/** UC-ST-17 — chuông thông báo kèm số chưa đọc và danh sách thông báo. */

const TYPE_META = {
  assignment: { icon: NotebookPen, box: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  deadline: { icon: Clock, box: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" },
  result: { icon: CheckCircle2, box: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  review: { icon: Brain, box: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  material: { icon: FolderOpen, box: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" },
};

const FALLBACK_META = { icon: Bell, box: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300" };

// Thời gian tương đối tính theo mốc dữ liệu mẫu của prototype, không theo giờ hệ thống.
function formatRelativeTime(iso) {
  const parsed = Date.parse(iso);
  if (Number.isNaN(parsed)) return "";

  const minutes = Math.round((LESSON_DEMO_REFERENCE_TIME - parsed) / 60000);
  if (minutes < 1) return "Vừa xong";
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days} ngày trước`;

  return `${Math.round(days / 30)} tháng trước`;
}

export default function StudentNotificationBell() {
  const {
    studentNotificationList = [],
    markStudentNotificationRead,
    markAllStudentNotificationsRead,
  } = useAuth();

  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  const unreadCount = studentNotificationList.filter((item) => !item.read).length;

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={
          unreadCount > 0 ? `Thông báo, ${unreadCount} chưa đọc` : "Thông báo"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        className={clsx(
          "relative rounded-md p-1.5 transition-colors",
          open
            ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100"
            : "text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        )}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 font-mono text-[10px] font-bold tabular-nums text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Danh sách thông báo"
          className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Thông báo
            </p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllStudentNotificationsRead}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                <CheckCheck size={13} strokeWidth={1.75} />
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {studentNotificationList.length > 0 ? (
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
              {studentNotificationList.map((item) => {
                const meta = TYPE_META[item.type] || FALLBACK_META;
                const Icon = meta.icon;

                return (
                  <li key={item.id}>
                    <Link
                      to={item.link || "/student"}
                      onClick={() => {
                        markStudentNotificationRead(item.id);
                        setOpen(false);
                      }}
                      className={clsx(
                        "flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
                        !item.read && "bg-blue-50/40 dark:bg-blue-950/20"
                      )}
                    >
                      <span
                        className={clsx(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          meta.box
                        )}
                      >
                        <Icon size={15} strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={clsx(
                            "block text-xs leading-snug",
                            item.read
                              ? "text-slate-600 dark:text-slate-300"
                              : "font-semibold text-slate-900 dark:text-white"
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-snug text-slate-500 dark:text-slate-400">
                          {item.body}
                        </span>
                        <span className="mt-1 block font-mono text-[10px] tabular-nums text-slate-400">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </span>
                      {!item.read && (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-8 text-center text-xs text-slate-400">
              Bạn chưa có thông báo nào.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
