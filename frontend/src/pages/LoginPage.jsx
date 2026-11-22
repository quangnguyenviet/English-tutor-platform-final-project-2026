import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { GraduationCap, Lock, User, Users, ArrowLeft, LogIn, Loader2, ShieldCheck, BookOpen, Briefcase } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/theme-toggle";
import { FORCE_PASSWORD_PATHS, ROLE_ROUTES } from "../lib/authRoutes";

const ACCOUNT_TYPES = [
  { key: "parent", label: "Phụ huynh", icon: Users, roles: ["parent"] },
  { key: "student", label: "Học sinh", icon: BookOpen, roles: ["student"] },
  { key: "tutor", label: "Gia sư", icon: GraduationCap, roles: ["tutor"] },
  { key: "staff", label: "Nhân viên", icon: Briefcase, roles: ["admin", "receptionist", "accountant"] },
];

const TUTOR_PROFILE_ACTIONABLE = ["INCOMPLETE", "REJECTED"];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState("parent");
  const { login, logout, loginWithGoogle } = useAuth();
  const selectedType = ACCOUNT_TYPES.find((t) => t.key === accountType);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle(searchParams.get("returnTo") || "/", accountType === "tutor" ? "TUTOR" : "PARENT");
    } catch (exception) {
      setError(exception.message || "Không thể bắt đầu đăng nhập Google.");
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tên đăng nhập và mật khẩu");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { role, profileStatus, mustChangePassword } = await login(username.trim(), password);
      if (!selectedType.roles.includes(role)) {
        await logout?.();
        setError(`Tài khoản này không phải tài khoản ${selectedType.label.toLowerCase()}. Hãy chọn đúng loại tài khoản ở trên.`);
        return;
      }
      if (FORCE_PASSWORD_PATHS[role] && mustChangePassword) {
        navigate(FORCE_PASSWORD_PATHS[role], { replace: true });
        return;
      }
      // Gia sư chưa có hồ sơ hoàn chỉnh (hoặc bị từ chối) phải tạo/sửa hồ sơ trước
      const needsProfile = role === "tutor" && TUTOR_PROFILE_ACTIONABLE.includes(profileStatus);
      navigate(needsProfile ? "/tutor/profile" : (ROLE_ROUTES[role] ?? "/"), { replace: true });
    } catch (err) {
      setError(err.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Về trang chủ</span>
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Đăng nhập EnglishPath</h1>
            <p className="text-sm text-muted-foreground">Chọn bạn đăng nhập với tư cách nào</p>
          </div>

          <div role="tablist" aria-label="Loại tài khoản" className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
            {ACCOUNT_TYPES.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={accountType === key}
                disabled={loading}
                onClick={() => { setAccountType(key); setError(""); }}
                className={"flex cursor-pointer flex-col items-center gap-1 rounded-lg px-1 py-2 text-[11px] font-semibold transition-colors " + (accountType === key
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground")}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Form */}
          {accountType !== "parent" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Tên đăng nhập
              </label>
              <input
                id="login-username"
                type="text"
                required
                disabled={loading}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Nhập tên đăng nhập"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Mật khẩu
              </label>
              <input
                id="login-password"
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
              />
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Đăng nhập</span>
                </>
              )}
            </button>
          </form>
          )}

          {(accountType === "parent" || accountType === "tutor") && (
            <>
              {accountType === "tutor" && (
                <div className="flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  hoặc
                  <span className="h-px flex-1 bg-border" />
                </div>
              )}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-white font-semibold text-sm hover:border-blue-300 dark:hover:border-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4 text-blue-600" />}
                <span>Đăng nhập bằng Google</span>
              </button>
              <p className="text-xs text-center text-muted-foreground">
                {accountType === "parent"
                  ? "Phụ huynh chỉ đăng nhập qua Google, không cần tạo mật khẩu riêng."
                  : "Dùng email Google trùng với email đăng ký gia sư để liên kết tài khoản. Chưa có tài khoản thì hệ thống tạo hồ sơ gia sư mới."}
              </p>
            </>
          )}

          {accountType === "tutor" && (
            <div className="mt-4 text-center text-sm text-muted-foreground">
              Chưa có tài khoản gia sư?{" "}
              <Link to="/tutor/register" className="text-primary font-semibold hover:underline">
                Đăng ký làm gia sư
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-muted-foreground pb-4">
        © 2026 EnglishPath. Hệ thống quản lý gia sư tiếng Anh.
      </footer>
    </div>
  );
}
