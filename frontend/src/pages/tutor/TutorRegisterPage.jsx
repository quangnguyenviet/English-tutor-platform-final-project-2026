import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowLeft,
  UserPlus,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  Info,
} from "lucide-react";
import ThemeToggle from "../../components/theme-toggle";

import { useAuth } from "../../context/AuthContext";

export default function TutorRegisterPage() {
  const navigate = useNavigate();
  const { loginAsTutor } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError("");
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.fullName.trim()) {
      setError("Vui lòng nhập họ và tên của bạn");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Vui lòng nhập địa chỉ email hợp lệ");
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp. Vui lòng kiểm tra lại!");
      return;
    }

    setLoading(true);

    // Giả lập lưu tạm thông tin đăng ký tài khoản gia sư
    setTimeout(() => {
      const pendingTutor = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("gsa_pending_tutor_register", JSON.stringify(pendingTutor));
      setLoading(false);
      setIsSuccess(true);

      // Chuyển sang trang đăng nhập sau 1.5 giây
      setTimeout(() => {
        navigate("/login?role=tutor&registered=true&email=" + encodeURIComponent(formData.email));
      }, 1500);
    }, 600);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      const pendingTutor = {
        fullName: "Nguyễn Công Thành (Google)",
        email: "thanh.google.tutor@gmail.com",
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem("gsa_pending_tutor_register", JSON.stringify(pendingTutor));
      // Tự động đăng nhập với vai trò Gia sư
      loginAsTutor();
      setLoading(false);
      // Chuyển thẳng sang trang tạo hồ sơ gia sư không cần qua màn hình đăng nhập
      navigate("/tutor/create-profile");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Background Decorative Blur Gradients */}
      <div className="absolute top-10 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Top Header */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 font-semibold text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <div className="p-1.5 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          <span>Về trang chủ</span>
        </Link>
        <ThemeToggle />
      </header>

      {/* Main Card */}
      <main className="w-full max-w-lg mx-auto my-auto py-8">
        <div className="rounded-3xl border border-border bg-card/95 backdrop-blur-xl p-6 sm:p-10 shadow-2xl space-y-6 relative transition-all">
          {/* Top Badge */}
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Gia nhập đội ngũ gia sư tài năng
            </span>
          </div>

          {/* Form Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-accent text-primary-foreground flex items-center justify-center mx-auto shadow-lg shadow-primary/25">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Đăng ký làm gia sư
            </h1>
            {/* Cam kết thu phí sau khi nhận lương */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs sm:text-sm font-medium">
              <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>Trung tâm luôn thu phí sau khi gia sư nhận lương</span>
            </div>
          </div>

          {/* Success Banner */}
          {isSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-3 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold">Đăng ký tài khoản thành công!</p>
                <p className="text-xs opacity-90">Đang chuyển sang màn hình đăng nhập...</p>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleRegister} className="space-y-4">
            {/* Họ và tên */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-primary" />
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                placeholder="VD: Nguyễn Văn Nam"
                disabled={loading || isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-primary" />
                Email đăng ký <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="VD: nam.giasu@gmail.com"
                disabled={loading || isSuccess}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tối thiểu 6 ký tự"
                  disabled={loading || isSuccess}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nhập lại mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-primary" />
                Nhập lại mật khẩu <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Xác nhận lại mật khẩu vừa nhập"
                  disabled={loading || isSuccess}
                  className="w-full px-4 py-3 pr-11 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Nút Đăng ký làm gia sư */}
            <button
              type="submit"
              disabled={loading || isSuccess}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm sm:text-base hover:bg-primary/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 cursor-pointer disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? "Đang xử lý đăng ký..." : "Đăng ký làm gia sư"}</span>
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground font-medium">hoặc</span>
            </div>
          </div>

          {/* Nút Đăng nhập bằng Google */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || isSuccess}
            className="w-full py-3 px-4 rounded-xl border border-border bg-background hover:bg-muted text-foreground font-semibold text-sm transition-all flex items-center justify-center gap-3 cursor-pointer shadow-xs disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Đăng nhập bằng Google</span>
          </button>

          {/* Bottom Login Link */}
          <div className="pt-2 text-center text-xs sm:text-sm text-muted-foreground border-t border-border/60">
            <span>Email đã được sử dụng hoặc đã có tài khoản? </span>
            <Link
              to="/login?role=tutor"
              className="font-bold text-primary hover:underline transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-xs text-muted-foreground pb-4">
        © 2026 EnglishPath. Nền tảng kết nối gia sư chuyên nghiệp &amp; chất lượng cao.
      </footer>
    </div>
  );
}
