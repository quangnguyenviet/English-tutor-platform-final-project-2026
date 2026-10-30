import { useState } from "react";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import ModalShell from "./ModalShell";
import { useToast } from "../../hooks/useToast";
import { apiUpdateFeePercentage } from "../../lib/paymentApi";
import { MAX_FEE_PERCENTAGE, MIN_FEE_PERCENTAGE, formatVnd } from "../../lib/paymentModel";

/** Lễ tân / Admin chỉnh tỷ lệ phí (0-50%) khi khoản phí chưa có minh chứng. */
export default function FeeRateModal({ payment, onClose, onSaved }) {
  const toast = useToast();
  const [text, setText] = useState(String(Number(payment.feePercentage ?? 40)));
  const [busy, setBusy] = useState(false);

  const value = text.trim() === "" ? null : Number(text.replace(",", "."));
  const valid = value !== null && Number.isFinite(value) && value >= MIN_FEE_PERCENTAGE && value <= MAX_FEE_PERCENTAGE;

  async function save() {
    setBusy(true);
    try {
      await apiUpdateFeePercentage(payment.id, value);
      toast.success("Đã cập nhật tỷ lệ phí. Số tiền cần nộp đã được tính lại.");
      onSaved();
    } catch (err) {
      toast.error(err.message || "Không cập nhật được tỷ lệ phí.");
      setBusy(false);
    }
  }

  return (
    <ModalShell
      open
      busy={busy}
      title="Chỉnh tỷ lệ phí nhận lớp"
      subtitle={`${payment.className || `Lớp #${payment.classId}`} · Số tiền hiện tại ${formatVnd(payment.amount)}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={busy} className="cursor-pointer">
            Huỷ
          </Button>
          <Button onClick={save} disabled={!valid || busy} className="cursor-pointer">
            {busy && <Loader2 size={16} className="animate-spin" />}
            Lưu tỷ lệ
          </Button>
        </>
      }
    >
      <div>
        <label htmlFor="fee-rate" className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
          Tỷ lệ phí (%)
        </label>
        <input
          id="fee-rate"
          inputMode="decimal"
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={busy}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
        />
        <p className={`mt-1 text-xs ${text && !valid ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"}`}>
          Nhập giá trị từ {MIN_FEE_PERCENTAGE} đến {MAX_FEE_PERCENTAGE}. Mặc định là 40%.
        </p>
      </div>
    </ModalShell>
  );
}
