import { useEffect, useRef, useState } from "react";
import { AlertCircle, GraduationCap, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

import ThemeToggle from "../components/theme-toggle";
import { useAuth } from "../context/AuthContext";

export default function GoogleOAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const started = useRef(false);
  const navigate = useNavigate();
  const { completeParentGoogleLogin } = useAuth();

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const providerError = searchParams.get("error");
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    if (providerError || !code || !state) {
      setError("Bạn đã hủy hoặc Google không thể hoàn tất đăng nhập.");
      return;
    }

    completeParentGoogleLogin(code, state)
      .then(({ returnTo }) => navigate(returnTo, { replace: true }))
      .catch((exception) => setError(exception.message || "Đăng nhập Google thất bại."));
  }, [completeParentGoogleLogin, navigate, searchParams]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <header className="max-w-7xl mx-auto flex justify-end">
        <ThemeToggle />
      </header>
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-xl text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center mx-auto">
            <GraduationCap className="w-6 h-6" />
          </div>
          {error ? (
            <>
              <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
              <h1 className="text-xl font-bold">Không thể đăng nhập</h1>
              <p className="text-sm text-muted-foreground">{error}</p>
              <Link
                to="/login"
                className="inline-flex px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all"
              >
                Quay lại đăng nhập
              </Link>
            </>
          ) : (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
              <h1 className="text-xl font-bold">Đang xác thực tài khoản Google</h1>
              <p className="text-sm text-muted-foreground">Vui lòng chờ trong giây lát.</p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
