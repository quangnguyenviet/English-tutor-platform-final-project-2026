import { useState } from "react";
import { X, CheckCircle2, User, PhoneCall, Send, Loader2 } from "lucide-react";
import { apiSubmitClassRequest } from "../../lib/classRequestApi";

const INITIAL_FORM = { parentName: "", phone: "" };

export const isValidVietnamesePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  return /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
};

export function HireTutorModal({ isOpen, onClose, tutor }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestCode, setRequestCode] = useState("");

  if (!isOpen || !tutor) return null;

  const isPhoneValid = isValidVietnamesePhone(formData.phone);
  const isPhoneTouched = formData.phone.trim().length > 0;
  const isFormValid = Boolean(formData.parentName.trim()) && isPhoneValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    setRequestCode("");
    try {
      const result = await apiSubmitClassRequest({
        tutorId: tutor.id,
        parentName: formData.parentName,
        phone: formData.phone,
      });
      setRequestCode(result.requestCode || "");
      setIsSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSubmitted(false);
    setSubmitError("");
    setRequestCode("");
    setFormData(INITIAL_FORM);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
        <button
          type="button"
          onClick={handleResetAndClose}
          className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Đóng"
        >
          <X className="w-5 h-5" />
        </button>

        {!isSubmitted ? (
          <>
            <div className="pr-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Đăng ký học với gia sư {tutor.name}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Để lại thông tin, trung tâm sẽ liên hệ lại với phụ huynh trong vòng 12 giờ.
              </p>
            </div>

            <div className="p-4 rounded-2xl border border-primary/25 bg-primary/5 flex items-center gap-3 min-w-0">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base text-white shrink-0 shadow-xs overflow-hidden"
                style={{ background: "linear-gradient(135deg, #3b82f6, #1d4ed8)" }}
              >
                {tutor.avatarUrl ? (
                  <img src={tutor.avatarUrl} alt={`Ảnh đại diện ${tutor.name}`} className="w-full h-full object-cover" />
                ) : (
                  tutor.initials
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-foreground text-sm truncate">{tutor.name}</div>
                <div className="text-xs text-muted-foreground truncate">{tutor.university}</div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="hire-parent-name" className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-primary" />
                  Họ và tên phụ huynh <span className="text-rose-500">*</span>
                </label>
                <input
                  id="hire-parent-name"
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="hire-phone" className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <PhoneCall className="w-3.5 h-3.5 text-primary" />
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  {isPhoneTouched && (
                    <span
                      className={`text-[11px] font-semibold ${
                        isPhoneValid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                      }`}
                    >
                      {isPhoneValid ? "SĐT hợp lệ" : "Vui lòng nhập đúng số điện thoại."}
                    </span>
                  )}
                </div>
                <input
                  id="hire-phone"
                  type="tel"
                  required
                  maxLength={15}
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\s\-.]/g, "") })
                  }
                  className={`w-full px-3.5 py-2.5 rounded-xl border bg-background text-sm text-foreground outline-none transition-all focus:ring-2 ${
                    isPhoneTouched
                      ? isPhoneValid
                        ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                        : "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-border focus:border-primary focus:ring-primary/20"
                  }`}
                />
              </div>

              {submitError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                <span>{isSubmitting ? "Đang gửi đăng ký..." : "Đăng ký"}</span>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </>
        ) : (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-foreground">Gửi yêu cầu liên hệ thành công!</h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                Trung tâm sẽ liên hệ với phụ huynh về gia sư{" "}
                <strong className="text-primary">{tutor.name}</strong> trong vòng 12 giờ.
              </p>
              {requestCode && (
                <p className="text-xs text-muted-foreground">
                  Mã yêu cầu của bạn:{" "}
                  <strong className="font-mono text-sm text-foreground">{requestCode}</strong>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HireTutorModal;
