import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2, LogIn, X } from "lucide-react";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { apiGetParentProfile } from "../../lib/messagingApi";
import ParentWizard from "./ParentWizard";

/**
 * Cổng vào các tính năng cần đăng nhập Google của phụ huynh (Nhắn tin, Đăng tin):
 * chưa đăng nhập → mời đăng nhập; đã đăng nhập nhưng chưa có hồ sơ → wizard 4 bước; đủ hồ sơ → gọi onReady.
 */
export default function ParentAccessModal({ isOpen, onClose, title, description, onReady }) {
  const { session, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isParent = session?.role === "parent";
  const [state, setState] = useState("checking"); // checking | wizard | error
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !isParent) return undefined;
    let active = true;
    setState("checking");
    apiGetParentProfile(token)
      .then((result) => {
        if (!active) return;
        setProfile(result);
        if (result.profileComplete) onReady(result);
        else setState("wizard");
      })
      .catch((e) => {
        if (!active) return;
        setError(e.message);
        setState("error");
      });
    return () => {
      active = false;
    };
    // onReady được tạo lại ở mỗi lần render của cha; chỉ phụ thuộc vào việc mở modal và phiên đăng nhập.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, isParent, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <button type="button" onClick={onClose} aria-label="Đóng"
          className="absolute right-4 top-4 cursor-pointer rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
          <X size={18} />
        </button>
        <h2 className="pr-8 text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}

        <div className="mt-5">
          {!isParent && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Phụ huynh đăng nhập bằng tài khoản Google để trao đổi với gia sư và đăng tin tìm gia sư.
              </p>
              <Button className="w-full cursor-pointer"
                onClick={() => navigate(`/login?returnTo=${encodeURIComponent(location.pathname + location.search)}`)}>
                <LogIn size={16} /> Đăng nhập bằng Google
              </Button>
            </div>
          )}
          {isParent && state === "checking" && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" /> Đang kiểm tra hồ sơ...</div>
          )}
          {isParent && state === "wizard" && (
            <ParentWizard initial={profile} token={token} onCancel={onClose} onDone={(result) => onReady(result)} />
          )}
          {isParent && state === "error" && <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p>}
        </div>
      </div>
    </div>
  );
}
