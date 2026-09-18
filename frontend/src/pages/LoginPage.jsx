import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { GraduationCap, Lock, User, ArrowLeft, LogIn, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/theme-toggle";

export default function LoginPage() {
  const [username, setUsername] = useState("minhanh");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const { loginAsStudent, loginAsTutor, loginAsAdmin, loginAsReceptionist } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    // Authenticate student session and navigate to student dashboard
    loginAsStudent("s1");
    navigate("/student");
  };

  const handleQuickStudentLogin = () => {
    loginAsStudent("s1");
    navigate("/student");
  };

  const handleQuickTutorLogin = () => {
    loginAsTutor();
    navigate("/tutor");
  };

  const handleQuickAdminLogin = () => {
    loginAsAdmin();
    navigate("/admin");
  };

  const handleQuickReceptionistLogin = () => {
    loginAsReceptionist();
    navigate("/receptionist");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ (Dành cho Phụ huynh)</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Login Card */}
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl space-y-6">
          {/* Logo & Title */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Đăng nhập Học sinh</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Nhập tài khoản học sinh để vào trang học tập cá nhân (Dashboard)
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Tên đăng nhập
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tên đăng nhập học sinh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Mật khẩu
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mật khẩu"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Đăng nhập</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">hoặc trải nghiệm nhanh</span>
            </div>
          </div>

          {/* Quick Demo Role Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleQuickStudentLogin}
              className="w-full py-2.5 px-3 rounded-xl border border-accent/40 bg-accent/10 text-accent font-semibold text-xs hover:bg-accent/20 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Vào nhanh: Học sinh (Demo Nguyễn Minh Anh)</span>
            </button>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={handleQuickTutorLogin}
                className="py-2 px-3 rounded-xl border border-border bg-muted/50 text-foreground font-medium text-xs hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Vào vai Gia sư</span>
              </button>
              <button
                type="button"
                onClick={handleQuickReceptionistLogin}
                className="py-2 px-3 rounded-xl border border-border bg-muted/50 text-foreground font-medium text-xs hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Vào vai Lễ tân</span>
              </button>
              <button
                type="button"
                onClick={handleQuickAdminLogin}
                className="py-2 px-3 rounded-xl border border-border bg-muted/50 text-foreground font-medium text-xs hover:bg-muted transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Vào vai Admin</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-muted-foreground pb-4">
        © 2026 EnglishPath. Phụ huynh tham quan trang chủ không cần đăng nhập.
      </footer>
    </div>
  );
}
