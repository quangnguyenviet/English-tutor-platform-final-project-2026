import { NavLink, Outlet, useNavigate, useLocation, useParams } from "react-router-dom";
import clsx from "clsx";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  Map,
  ListChecks,
  Video,
  CalendarDays,
  LogOut,
  BookOpenCheck,
  Settings,
  IdCard,
  Sparkles,
  Menu,
  X,
  UserCog,
  BarChart2,
  Activity,
  Search,
  MessageCircle,
  NotebookPen,
  LineChart,
  FolderOpen,
  Lock,
  Banknote,
  Bell,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { AiAssistantProvider, useAiAssistant } from "../../context/AiAssistantContext";
import { StudentMatchingProvider, useStudentMatching } from "../../context/StudentMatchingContext";
import { classRequests, getStudentById } from "../../data/mockData";
import Avatar from "../ui/Avatar";
import AiAssistantPanel from "../tutor/AiAssistantPanel";
import TopBar from "./TopBar";
import TutorStudentSidebar from "./TutorStudentSidebar";

const tutorLibraryNav = [
  { to: "/tutor/library/paths", label: "Khung chương trình", icon: Map },
  { to: "/tutor/library/exercises", label: "Kho bài tập", icon: ListChecks },
  { to: "/tutor/library/materials", label: "Kho video & tài liệu", icon: Video },
];

const roleLabel = { admin: "Quản trị viên", tutor: "Gia sư", student: "Học sinh" };

export default function AppShell() {
  return (
    <StudentMatchingProvider>
      <AiAssistantProvider>
        <AppShellInner />
      </AiAssistantProvider>
    </StudentMatchingProvider>
  );
}

function AppShellInner() {
  const { session, logout, matchRequestList, paymentProofList, notificationList } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { studentId } = useParams();
  const { open: chatOpen } = useAiAssistant();
  const [mobileOpen, setMobileOpen] = useState(false);
  let studentMatching = null;
  try {
    studentMatching = useStudentMatching();
  } catch {
    studentMatching = null;
  }

  const isTutor = session?.role === "tutor";
  const isStudent = session?.role === "student";
  const isAdmin = session?.role === "admin";
  const showAssistant = isTutor;

  // Build dynamic nav items
  let items = [];
  if (isAdmin) {
    const pendingMatchCount = matchRequestList?.filter((r) => r.status === "pending").length || 0;
    const pendingPaymentCount = paymentProofList?.filter((p) => p.status === "pending").length || 0;
    const unreadNotifCount = notificationList?.filter((n) => !n.read).length || 0;

    items = [
      { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, end: true },
      {
        to: "/admin/match-requests",
        label: "Yêu cầu ghép lớp",
        icon: ClipboardList,
        badge: () => (pendingMatchCount > 0 ? pendingMatchCount : null),
      },
      {
        to: "/admin/payments",
        label: "Duyệt thanh toán",
        icon: Banknote,
        badge: () => (pendingPaymentCount > 0 ? pendingPaymentCount : null),
      },
      { to: "/admin/tutors", label: "Quản lý gia sư", icon: UserCog },
      { to: "/admin/students", label: "Quản lý học sinh", icon: Users },
      { to: "/admin/analytics", label: "Báo cáo & Phân tích", icon: BarChart2 },
      {
        to: "/admin/notifications",
        label: "Thông báo",
        icon: Bell,
        badge: () => (unreadNotifCount > 0 ? unreadNotifCount : null),
      },
      { to: "/admin/logs", label: "Nhật ký hoạt động", icon: Activity },
      { to: "/admin/settings", label: "Cài đặt", icon: Settings },
    ];
  } else if (isTutor) {
    items = [
      { to: "/tutor", label: "Tổng quan", icon: LayoutDashboard, end: true },
      { to: "/tutor/students", label: "Học sinh", icon: Users },
      { to: "/tutor/requests", label: "Yêu cầu lớp", icon: ClipboardList, badge: () => classRequests.filter((r) => r.status === "pending_response").length },
      { to: "/tutor/schedule", label: "Lịch dạy", icon: CalendarDays },
      { to: "/tutor/exercise-generator", label: "Soạn bài (AI)", icon: Sparkles },
      { to: "/tutor/profile", label: "Hồ sơ", icon: IdCard },
      { to: "/tutor/settings", label: "Cài đặt", icon: Settings },
    ];
  } else if (isStudent) {
    const isMatched = studentMatching?.studentStatus === "MATCHED";

    items = [
      { to: "/student/marketplace", label: "Khám phá Gia sư", icon: Search },
      {
        to: "/student/chat",
        label: "Hộp thư",
        icon: MessageCircle,
        badge: () => (studentMatching?.studentStatus === "WAITING_APPROVAL" ? "1" : null),
      },
      { to: "/student", label: "Tổng quan LMS", icon: LayoutDashboard, end: true, locked: !isMatched },
      { to: "/student/schedule", label: "Lịch học", icon: CalendarDays, locked: !isMatched },
      { to: "/student/exercises", label: "Bài tập & kiểm tra", icon: NotebookPen, locked: !isMatched },
      { to: "/student/progress", label: "Kết quả & tiến bộ", icon: LineChart, locked: !isMatched },
      { to: "/student/materials", label: "Tài liệu & video", icon: FolderOpen, locked: !isMatched },
      { to: "/student/settings", label: "Cài đặt", icon: Settings },
    ];
  }

  // Detect if we're on a student detail page
  const isStudentDetail = isTutor && studentId && location.pathname.includes(`/tutor/students/${studentId}`);
  const student = isStudentDetail ? getStudentById(studentId) : null;

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible; mobile: drawer from left */}
      <aside
        className={clsx(
          "flex h-full w-64 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
          "fixed inset-y-0 left-0 z-50 lg:static",
          "transform transition-transform duration-200 ease-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Mobile header: logo + close button */}
        <div className="flex items-center justify-between px-5 py-5 lg:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-bg text-white">
              <BookOpenCheck size={18} strokeWidth={1.75} />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-50">EnglishPath</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={20} />
          </button>
        </div>

        {/* Desktop logo */}
        <div className="hidden items-center gap-2 px-5 py-5 lg:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg accent-bg text-white">
            <BookOpenCheck size={18} strokeWidth={1.75} />
          </div>
          <span className="font-semibold text-slate-900 dark:text-slate-50">EnglishPath</span>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3">
          {isStudentDetail ? (
            <TutorStudentSidebar student={student} />
          ) : (
            <>
              {/* Section Header for Student */}
              {isStudent && (
                <p className="mb-1 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Adaptive Matching
                </p>
              )}

              {/* Main nav */}
              {items.map((item, idx) => {
                // Divider before LMS items for student
                const isLmsStart = isStudent && item.to === "/student";
                return (
                  <div key={item.to}>
                    {isLmsStart && (
                      <p className="mb-1 mt-4 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400 flex items-center justify-between">
                        <span>LMS Cá nhân hóa</span>
                        {item.locked && <Lock size={12} className="text-amber-500" />}
                      </p>
                    )}
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                          isActive
                            ? "accent-bg-light accent-text-dark dark:accent-bg-dark dark:accent-text-dark"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
                          item.locked && "opacity-60"
                        )
                      }
                    >
                      <item.icon size={18} strokeWidth={1.75} />
                      <span className="flex-1">{item.label}</span>
                      {item.locked ? (
                        <Lock size={13} className="text-amber-500" />
                      ) : (
                        item.badge?.() && (
                          <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                            {item.badge()}
                          </span>
                        )
                      )}
                    </NavLink>
                  </div>
                );
              })}

              {/* Library section (tutor only) */}
              {isTutor && (
                <>
                  <p className="mb-1 mt-4 px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Thư viện
                  </p>
                  {tutorLibraryNav.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                          isActive
                            ? "accent-bg-light accent-text-dark dark:accent-bg-dark dark:accent-text-dark"
                            : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                        )
                      }
                    >
                      <item.icon size={18} strokeWidth={1.75} />
                      {item.label}
                    </NavLink>
                  ))}
                </>
              )}
            </>
          )}
        </nav>

        {/* User footer */}
        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          <div className="flex items-center gap-3 rounded-lg px-2 py-2">
            <Avatar initials={session?.initials} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{session?.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel[session?.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile hamburger button — visible only on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed bottom-4 left-4 z-30 flex h-11 w-11 items-center justify-center rounded-full accent-bg text-white shadow-lg lg:hidden"
        aria-label="Mở menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenuToggle={() => setMobileOpen(true)} />

        <div className="flex min-h-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-6 lg:py-8">
              <Outlet />
            </div>
          </main>

          {showAssistant && chatOpen && (
            <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <AiAssistantPanel />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}