import { useLocation, useParams, useNavigate } from "react-router-dom";
import { ChevronRight, Bot, SlidersHorizontal, Menu, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useAiAssistant } from "../../context/AiAssistantContext";
import { useStudentMatching } from "../../context/StudentMatchingContext";
import { getStudentById } from "../../data/mockData";
import ThemeSwitcher from "../ui/ThemeSwitcher";
import Avatar from "../ui/Avatar";
import Button from "../ui/Button";
import StudentNotificationBell from "../student/StudentNotificationBell";

const roleLabel = { admin: "Quản trị viên", tutor: "Gia sư", student: "Học sinh" };

const routeMeta = {
  admin: {
    "/admin": { label: "Tổng quan" },
    "/admin/tutors": { label: "Quản lý gia sư" },
    "/admin/settings": { label: "Cài đặt" },
  },
  tutor: {
    "/tutor": { label: "Tổng quan" },
    "/tutor/students": { label: "Học sinh" },
    "/tutor/students/:studentId": { label: "Chi tiết học sinh" },
    "/tutor/schedule": { label: "Lịch dạy" },
    "/tutor/requests": { label: "Yêu cầu lớp" },
    "/tutor/exercise-generator": { label: "Soạn bài tập AI" },
    "/tutor/library/paths": { label: "Khung chương trình" },
    "/tutor/library/exercises": { label: "Kho bài tập" },
    "/tutor/library/materials": { label: "Kho video & tài liệu" },
    "/tutor/profile": { label: "Hồ sơ năng lực" },
    "/tutor/settings": { label: "Cài đặt" },
  },
  student: {
    "/student": { label: "Tổng quan" },
    "/student/marketplace": { label: "Marketplace Gia sư" },
    "/student/onboarding": { label: "Khai báo Hồ sơ" },
    "/student/chat": { label: "Hộp thư & Bài Test" },
    "/student/schedule": { label: "Lịch học" },
    "/student/exercises": { label: "Bài tập & kiểm tra" },
    "/student/progress": { label: "Kết quả & tiến bộ" },
    "/student/materials": { label: "Tài liệu & video" },
    "/student/settings": { label: "Cài đặt" },
  },
};

const studentSubTabs = {
  overview: "Tổng quan",
  path: "Lộ trình học",
  exercises: "Bài tập",
  progress: "Kết quả & tiến bộ",
  materials: "Tài liệu & video",
};

function buildBreadcrumbs(pathname, studentId) {
  const crumbs = [];

  if (pathname.startsWith("/admin")) {
    crumbs.push({ label: "Quản trị", to: "/admin" });
  } else if (pathname.startsWith("/tutor")) {
    crumbs.push({ label: "Gia sư", to: "/tutor" });
  } else if (pathname.startsWith("/student")) {
    crumbs.push({ label: "Học sinh", to: "/student" });
  }

  if (studentId) {
    const student = getStudentById(studentId);
    const name = student?.name ?? "Học sinh";
    crumbs.push({ label: name, to: `/tutor/students/${studentId}` });

    const segments = pathname.split("/").filter(Boolean);
    const subTabKey = segments[segments.length - 1];
    if (subTabKey && studentSubTabs[subTabKey]) {
      crumbs.push({ label: studentSubTabs[subTabKey] });
    }
  } else {
    const role = pathname.startsWith("/admin") ? "admin" : pathname.startsWith("/tutor") ? "tutor" : "student";
    const meta = routeMeta[role];
    if (meta) {
      if (meta[pathname]) {
        crumbs.push({ label: meta[pathname].label });
      } else {
        const parent = pathname.substring(0, pathname.lastIndexOf("/")) || "/";
        if (meta[parent]) {
          crumbs.push({ label: meta[parent].label });
        }
      }
    }
  }

  return crumbs;
}

export default function TopBar({ onMenuToggle }) {
  const location = useLocation();
  const { studentId } = useParams();
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { open: chatOpen, setOpen: setChatOpen } = useAiAssistant();
  
  // Safe student matching context consumption
  let studentMatching = null;
  try {
    studentMatching = useStudentMatching();
  } catch {
    studentMatching = null;
  }

  const isTutor = session?.role === "tutor";
  const isStudent = session?.role === "student";
  const isAdmin = session?.role === "admin";

  const crumbs = buildBreadcrumbs(location.pathname, studentId);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  function handleDemoStatusChange(e) {
    const newStatus = e.target.value;
    if (studentMatching) {
      studentMatching.setStudentStatus(newStatus);
      if (newStatus === "SEARCHING") navigate("/student/marketplace");
      else if (newStatus === "ONBOARDING") navigate("/student/onboarding");
      else if (newStatus === "CHAT_&_QUIZ" || newStatus === "WAITING_APPROVAL") navigate("/student/chat");
      else if (newStatus === "MATCHED") navigate("/student");
    }
  }

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950 lg:px-6">
      {/* Mobile: hamburger button; Desktop: breadcrumb */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="shrink-0 rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Mở menu"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Breadcrumb — hidden on mobile, shown on lg+ */}
        <nav className="hidden min-w-0 items-center gap-1.5 text-sm lg:flex">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-slate-400" />}
              {crumb.to ? (
                <a
                  href={crumb.to}
                  className="truncate text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="truncate font-medium text-slate-900 dark:text-slate-50">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>

        {/* Mobile: show only current page label */}
        <span className="truncate text-sm font-medium text-slate-900 dark:text-slate-50 lg:hidden">
          {crumbs[crumbs.length - 1]?.label ?? ""}
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Demo Status Switcher for Student Prototype */}
        {isStudent && studentMatching && (
          <div className="hidden items-center gap-1.5 rounded-lg bg-indigo-50 px-2.5 py-1 text-xs border border-indigo-200 dark:bg-indigo-950/60 dark:border-indigo-900 lg:flex">
            <SlidersHorizontal size={13} className="text-indigo-600 dark:text-indigo-400" />
            <span className="font-medium text-indigo-900 dark:text-indigo-200">Trạng thái Demo:</span>
            <select
              value={studentMatching.studentStatus}
              onChange={handleDemoStatusChange}
              className="bg-transparent font-bold text-indigo-700 outline-none dark:text-indigo-300 cursor-pointer"
            >
              <option value="SEARCHING">1. SEARCHING</option>
              <option value="ONBOARDING">2. ONBOARDING</option>
              <option value="CHAT_&_QUIZ">3. CHAT_&_QUIZ</option>
              <option value="WAITING_APPROVAL">4. WAITING_APPROVAL</option>
              <option value="MATCHED">5. MATCHED</option>
            </select>
          </div>
        )}

        {/* AI Assistant toggle — only for tutor */}
        {isTutor && (
          <Button
            variant={chatOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
            className="hidden sm:flex"
          >
            <Bot size={16} /> <span className="hidden md:inline">Trợ lý AI</span>
          </Button>
        )}

        {/* Mobile AI button: icon only */}
        {isTutor && (
          <Button
            variant={chatOpen ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setChatOpen((v) => !v)}
            className="sm:hidden"
            aria-label="Trợ lý AI"
          >
            <Bot size={16} />
          </Button>
        )}

        {/* Notification bell — students only (UC-ST-17) */}
        {isStudent && <StudentNotificationBell />}

        {/* Theme switcher */}
        <ThemeSwitcher />

        {/* Avatar + logout — tutor only */}
        {isTutor && session && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-2 dark:border-slate-800 sm:pl-3">
            <Avatar initials={session.initials} size="sm" />
            <div className="hidden min-w-0 sm:block">
              <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-50">{session.name}</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">{roleLabel[session.role]}</p>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}