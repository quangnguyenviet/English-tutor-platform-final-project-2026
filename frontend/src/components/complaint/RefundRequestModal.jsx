import { useState } from "react";
import clsx from "clsx";
import { Loader2 } from "lucide-react";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import ModalShell from "../payment/ModalShell";
import { useToast } from "../../hooks/useToast";
import { apiCreateRefundRequest } from "../../lib/complaintApi";
import { METHOD_LABEL } from "../../lib/paymentModel";
import { formatDateTime, formatVnd, parseMoneyInput, validateRefundAmount } from "../../lib/complaintModel";
import { Field, Notice, inputClass } from "./fields";

/** Lễ tân chọn khoản phí, số tiền đề xuất và tài khoản nhận, gửi Kế toán (UC-REC-16, Hoàn tiền). */
export default function RefundRequestModal({ open, detail, onClose, onSent }) {
  const toast = useToast();
  const { complaint } = detail;
  const payments = detail.refundablePayments || [];
  const [paymentId, setPaymentId] = useState(() => (payments.length === 1 ? payments[0].paymentId : null));
  const [amountText, setAmountText] = useState("");
  const [form, setForm] = useState({
    recipientName: complaint.complainantName || "",
    bankName: "",
    bankAccountNumber: "",
  });
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const payment = payments.find((p) => p.paymentId === paymentId);
  const amount = parseMoneyInput(amountText);
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  function submit() {
    let problem = null;
    if (!payment) problem = "Vui lòng chọn khoản phí cần hoàn.";
    else problem = validateRefundAmount(amount, { remaining: payment.remainingAmount });
    if (!problem && (!form.recipientName.trim() || !form.bankName.trim() || !form.bankAccountNumber.trim())) {
      problem = "Vui lòng nhập đủ tên chủ tài khoản, ngân hàng và số tài khoản.";
    }
    setError(problem || "");
    if (!problem) setConfirming(true);
  }

  async function send() {
    setConfirming(false);
    setBusy(true);
    try {
      const result = await apiCreateRefundRequest(complaint.id, {
        paymentId,
        requestedAmount: amount,
        recipientName: form.recipientName.trim(),
        bankName: form.bankName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
      });
      toast.success("Đã gửi yêu cầu hoàn tiền cho Kế toán.");
      onSent?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <ModalShell
        open={open}
        busy={busy}
        title={`Gửi yêu cầu hoàn tiền KN-${complaint.id}`}
        subtitle="Thống nhất số tiền và tài khoản nhận với người khiếu nại trước khi gửi."
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" onClick={onClose} disabled={busy} className="cursor-pointer">
              Hủy
            </Button>
            <Button onClick={submit} disabled={busy || payments.length === 0} className="cursor-pointer">
              {busy && <Loader2 size={16} className="animate-spin" />}
              Gửi
            </Button>
          </>
        }
      >
        {payments.length === 0 ? (
          <Notice tone="amber">Lớp chưa có khoản phí nào được Kế toán xác nhận, chưa thể gửi yêu cầu hoàn tiền.</Notice>
        ) : (
          <Field label="Khoản phí đã được xác nhận" required>
            <div className="space-y-2">
              {payments.map((p) => (
                <button
                  key={p.paymentId}
                  type="button"
                  onClick={() => setPaymentId(p.paymentId)}
                  className={clsx(
                    "w-full cursor-pointer rounded-xl border px-3 py-2.5 text-left transition active:scale-[0.99]",
                    paymentId === p.paymentId
                      ? "border-blue-500 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/40"
                      : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">#{p.paymentId}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {METHOD_LABEL[p.paymentMethod] || "—"} · {formatDateTime(p.reviewedAt)}
                    </span>
                  </div>
                  <div className="mt-1 grid grid-cols-3 gap-2 text-xs">
                    <span className="text-slate-500 dark:text-slate-400">
                      Đã thu <b className="block font-mono text-sm text-slate-900 dark:text-white">{formatVnd(p.receivedAmount)}</b>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Đã hoàn <b className="block font-mono text-sm text-slate-900 dark:text-white">{formatVnd(p.refundedAmount)}</b>
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      Còn có thể hoàn
                      <b className="block font-mono text-sm text-emerald-600 dark:text-emerald-400">{formatVnd(p.remainingAmount)}</b>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </Field>
        )}

        <Field label="Số tiền đề xuất hoàn" required hint={payment ? `Tối đa ${formatVnd(payment.remainingAmount)}` : undefined}>
          <input
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
            inputMode="numeric"
            placeholder="Ví dụ: 600.000"
            className={clsx(inputClass, "font-mono")}
          />
        </Field>
        <Field label="Tên chủ tài khoản" required>
          <input value={form.recipientName} onChange={set("recipientName")} maxLength={100} className={inputClass} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Ngân hàng" required>
            <input value={form.bankName} onChange={set("bankName")} maxLength={100} className={inputClass} placeholder="Vietcombank" />
          </Field>
          <Field label="Số tài khoản" required>
            <input
              value={form.bankAccountNumber}
              onChange={set("bankAccountNumber")}
              maxLength={30}
              inputMode="numeric"
              className={clsx(inputClass, "font-mono")}
            />
          </Field>
        </div>

        {error && <Notice>{error}</Notice>}
      </ModalShell>

      <ConfirmModal
        open={confirming}
        title="Gửi yêu cầu hoàn tiền"
        message={`Gửi yêu cầu hoàn ${formatVnd(amount)} vào tài khoản ${form.bankName} ${form.bankAccountNumber} cho Kế toán? Đơn sẽ chuyển sang Chờ hoàn tiền.`}
        onConfirm={send}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
