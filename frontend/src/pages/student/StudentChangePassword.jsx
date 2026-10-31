import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import ThemeToggle from "../../components/theme-toggle";
import { validateNewPassword } from "../../lib/studentModel";

const inputClass =
  "w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40";

/** Màn bắt buộc đổi mật khẩu ở lần đăng nhập đầu của học sinh (API_DESIGN 3.1). */
export default function StudentChangePassword() {
  const { session, changePassword } = useAuth();
  const navigate = useNavigate();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Đã đổi rồi (hoặc vào nhầm) thì không giữ ở màn này
  if (session && !session.mustChangePassword) return <Navigate to="/student" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const invalid = validateNewPassword({ oldPassword, newPassword, confirm });
    if (invalid) {
      setError(invalid);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await changePassword(oldPassword, newPassword);
      navigate("/student", { replace: true });
    } catch (err) {
      setError(err.message || "Đổi mật khẩu thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col p-4 sm:p-6">
      <header className="max-w-7xl w-full mx-auto flex justify-end">
        <ThemeToggle />
      </header>
      <main className="w-full max-w-md mx-auto my-auto py-8">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
              <ShieldCheck size={22} />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Đổi mật khẩu lần đầu</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Vì lý do bảo mật, bạn cần đặt mật khẩu mới trước khi bắt đầu học.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 text-xs font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Mật khẩu hiện tại</span>
              <input
                type="password"
                autoComplete="current-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Mật khẩu mới</span>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
              </span>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-slate-900 dark:text-white">Nhập lại mật khẩu mới</span>
              <input
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
              Đổi mật khẩu
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
