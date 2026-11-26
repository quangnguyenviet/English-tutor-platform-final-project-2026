import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, XCircle } from "lucide-react";
import Button from "../ui/Button";
import clsx from "clsx";

/**
 * Biểu mẫu báo cáo kết quả dạy thử (trial_report, V31).
 *
 * <p>Gia sư chọn kết quả (Thành công / Không thành công). Khi chọn "Không
 * thành công" phải nhập lý do (tối thiểu 5 ký tự). Kết quả "Thành công" kích
 * hoạt lớp sang ACTIVE; "Không thành công" gửi lý do cho lễ tân (lớp giữ TRIAL,
 * được phép báo lại).</p>
 */
export default function TrialReportForm({
  className = "",
  submitting,
  serverError,
  onDone,
  onSubmit,
}) {
  const [outcome, setOutcome] = useState("");
  const [note, setNote] = useState("");
  const [localError, setLocalError] = useState("");

  const error = localError || serverError;
  const isFailed = outcome === "FAILED";

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!outcome) {
      setLocalError("Vui lòng chọn kết quả dạy thử trước khi gửi.");
      return;
    }
    const trimmedNote = note.trim();
    if (isFailed && trimmedNote.length < 5) {
      setLocalError("Vui lòng nhập lý do dạy thử không thành công (tối thiểu 5 ký tự).");
      return;
    }

    onSubmit({
      outcome,
      note: isFailed ? trimmedNote : null,
    });
  };

  const outcomeButton = (value, label, Icon, activeClass) => (
    <button
      type="button"
      aria-pressed={outcome === value}
      onClick={() => {
        setOutcome(value);
        setLocalError("");
      }}
      className={clsx(
        "flex flex-1 cursor-pointer items-center gap-2 rounded-xl border p-3.5 text-left text-xs font-bold transition-all active:scale-[0.98]",
        outcome === value
          ? activeClass
          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800",
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="leading-tight">{label}</span>
    </button>
  );

  return (
    <div className={clsx("space-y-4", className)}>
      <div>
        <p className="mb-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          Kết quả buổi dạy thử <span className="text-rose-500">*</span>
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          {outcomeButton("SUCCESS", "Thành công", CheckCircle2,
            "border-emerald-500 bg-emerald-50 text-emerald-700 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-400")}
          {outcomeButton("FAILED", "Không thành công", XCircle,
            "border-rose-500 bg-rose-50 text-rose-700 dark:border-rose-700/60 dark:bg-rose-950/40 dark:text-rose-400")}
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {outcome === "SUCCESS"
            ? "Lớp học sẽ được kích hoạt chính thức (ACTIVE) và hệ thống tạo khoản phí nhận lớp."
            : "Lý do của bạn sẽ được gửi cho lễ tân để quyết định ghép lại hoặc hủy lớp. Bạn vẫn có thể báo lại sau."}
        </p>
      </div>

      {isFailed && (
        <div>
          <label htmlFor="trial-report-note" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Lý do <span className="text-rose-500">*</span>
          </label>
          <textarea
            id="trial-report-note"
            rows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Mô tả ngắn gọn lý do buổi dạy thử không thành công (ví dụ: học sinh chưa phù hợp, cần thay đổi phương pháp)..."
            className="w-full resize-none rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
          />
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Tối thiểu 5 ký tự.</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onDone}
          className="cursor-pointer text-xs font-semibold"
        >
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={submitting}
          onClick={handleSubmit}
          className="cursor-pointer px-5 text-xs font-bold"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? "Đang gửi..." : "Gửi báo cáo"}
        </Button>
      </div>
    </div>
  );
}
