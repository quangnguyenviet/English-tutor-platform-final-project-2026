import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { GraduationCap, LineChart, LogOut, MessageCircle, Megaphone } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../theme-toggle";
import { ROLE_LABELS, ROLE_ROUTES } from "../../lib/authRoutes";

const PUBLIC_LINKS = [
  { to: "/tutors", label: "Gia sư" },
  { to: "/classes", label: "Lớp cần gia sư" },
  { to: "/faq", label: "Hỏi đáp" },
];

const PARENT_LINKS = [
  { to: "/parent/messages", label: "Phòng chat", icon: MessageCircle },
  { to: "/parent/postings", label: "Tin của tôi", icon: Megaphone },
  { to: "/parent/progress", label: "Tiến độ của con", icon: LineChart },
];

const parentLinkClass = ({ isActive }) =>
  "inline-flex items-center gap-1.5 whitespace-nowrap transition-colors " +
  (isActive ? "font-semibold text-primary" : "text-muted-foreground hover:text-foreground");

export function SiteHeader() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  // Đăng nhập xong quay lại đúng trang đang xem (trang chủ, danh sách hay hồ sơ gia sư).
  const loginHref = `/login?returnTo=${encodeURIComponent(pathname + search)}`;
  const isParent = session?.role === "parent";
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground group-hover:bg-primary/90 transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">
            English<span className="text-primary">Path</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          {PUBLIC_LINKS.map(({ to, label }) => (
            <NavLink key={to} to={to} className={parentLinkClass}>{label}</NavLink>
          ))}
          {isParent && PARENT_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={parentLinkClass}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
          {/* UC-P05 & UC-P06: Tạm ẩn tab Phụ huynh theo dõi, triển khai sau
          <Link to="/parent-view" className="hover:text-foreground transition-colors text-emerald-600 dark:text-emerald-400 font-semibold">
            Phụ huynh theo dõi
          </Link>
          */}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <>
              <Link
                to={isParent ? "/parent/messages" : (ROLE_ROUTES[session.role] ?? "/")}
                className="hidden sm:block max-w-[12rem] text-right leading-tight"
                title="Vào khu vực của tôi"
              >
                <span className="block truncate text-sm font-medium text-foreground">{session.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{ROLE_LABELS[session.role] ?? session.role}</span>
              </Link>
              <button
                type="button"
                onClick={() => { logout(); navigate("/"); }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                to={loginHref}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/tutor/register"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm cursor-pointer"
              >
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>
      {isParent && (
        <nav className="md:hidden flex items-center gap-5 overflow-x-auto border-t border-border px-4 py-2 text-sm font-medium text-muted-foreground">
          <NavLink to="/tutors" className={parentLinkClass}>Gia sư</NavLink>
          {PARENT_LINKS.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} className={parentLinkClass}>
              <Icon className="w-4 h-4" /> {label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}
export default SiteHeader;
