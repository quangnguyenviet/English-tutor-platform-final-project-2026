import { useState } from "react";
import { X, CheckCircle2, Send, Loader2 } from "lucide-react";
import { apiSubmitClassRequest } from "../../lib/classRequestApi";

const INITIAL_FORM = { parentName: "", phone: "" };

const INPUT_CLASS =
  "w-full p-2.5 rounded-xl border border-border bg-background text-sm font-medium text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all";

/**
 * Kiểm tra định dạng số điện thoại di động Việt Nam hợp lệ:
 * - Gồm 10 chữ số bắt đầu bằng 0 (03, 05, 07, 08, 09) hoặc +84 / 84
 */
export const isValidVietnamesePhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s.\-()]/g, "");
  return /^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$/.test(cleaned);
};

export function ParentContactModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [requestCode, setRequestCode] = useState("");

  if (!isOpen) return null;

  const isPhoneValid = isValidVietnamesePhone(formData.phone);
  const isPhoneTouched = formData.phone.trim().length > 0;
  const isFormValid = Boolean(formData.parentName.trim()) && isPhoneValid;

  const updateField = (field) => (e) => setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError("");
    setRequestCode("");
    try {
      const result = await apiSubmitClassRequest({
        parentName: formData.parentName,
        phone: formData.phone,
      });
      setRequestCode(result.requestCode || "");
      setRequestSubmitted(true);
    } catch (error) {
      setSubmitError(error.message || "Không thể gửi yêu cầu. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setSubmitError("");
    setRequestCode("");
    setFormData(INITIAL_FORM);
    setRequestSubmitted(false);
    onClose();
  };

  const closeButton = (
    <button
      type="button"
      onClick={handleResetAndClose}
      className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
      aria-label="Đóng"
    >
      <X className="w-5 h-5" />
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      {requestSubmitted ? (
        <div className="relative w-full max-w-md rounded-3xl border border-emerald-500/30 bg-card/95 backdrop-blur-xl p-6 sm:p-8 shadow-2xl text-card-foreground text-center space-y-6">
          {closeButton}

          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl animate-pulse" />
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <CheckCircle2 size={36} className="stroke-[2.5]" />
            </div>
          </div>

          <div className="flex flex-col items-center space-y-3">
            <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-bold border border-emerald-500/20">
              <span>Tiếp nhận yêu cầu thành công</span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-sm leading-relaxed">
              Trung tâm EnglishPath đã ghi nhận thông tin và sẽ liên hệ đến quý phụ huynh trong vòng 12 giờ để tư vấn chọn gia sư phù hợp nhất cho con.
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
            className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md shadow-primary/25 cursor-pointer"
          >
            Xác nhận
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-5 sm:p-8 shadow-2xl space-y-5 text-card-foreground"
        >
          {closeButton}

          <div className="pr-10">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
              Nhận tư vấn tìm gia sư
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Để lại thông tin, trung tâm sẽ liên hệ tư vấn gia sư phù hợp cho con.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="consult-parent-name" className="text-xs font-semibold text-foreground block mb-1">
                Họ và tên phụ huynh <span className="text-rose-500">*</span>
              </label>
              <input
                id="consult-parent-name"
                type="text"
                required
                value={formData.parentName}
                onChange={updateField("parentName")}
                className={INPUT_CLASS}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="consult-phone" className="text-xs font-semibold text-foreground">
                  Số điện thoại <span className="text-rose-500">*</span>
                </label>
                {isPhoneTouched && (
                  <span
                    className={`text-[11px] font-semibold ${
                      isPhoneValid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-500"
                    }`}
                  >
                    {isPhoneValid ? "SĐT hợp lệ" : "Cần 10 số (03x, 05x, 07x, 08x, 09x)"}
                  </span>
                )}
              </div>
              <input
                id="consult-phone"
                type="tel"
                required
                maxLength={15}
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value.replace(/[^0-9+\s\-.]/g, "") })
                }
                className={`${INPUT_CLASS} ${
                  isPhoneTouched
                    ? isPhoneValid
                      ? "border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20"
                      : "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20"
                    : ""
                }`}
              />
            </div>
          </div>

          {submitError && (
            <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
              {submitError}
            </p>
          )}

          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="w-full py-3 px-6 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 active:scale-[0.98] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            <span>{isSubmitting ? "Đang gửi..." : "Gửi"}</span>
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      )}
    </div>
  );
}

export default ParentContactModal;
