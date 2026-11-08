import { useEffect, useState } from "react";
import clsx from "clsx";
import { Loader2, XCircle } from "lucide-react";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import ConfirmModal from "../ui/ConfirmModal";
import ModalShell from "../payment/ModalShell";
import ProofPreview from "../payment/ProofPreview";
import { useToast } from "../../hooks/useToast";
import { apiGetRefund, apiPayRefund, apiRejectRefund } from "../../lib/complaintApi";
import { validateProofFile } from "../../lib/paymentModel";
import {
  REFUND_STATUS,
  REFUND_STATUS_META,
  formatDateTime,
  formatVnd,
  isRefundRequester,
  metaOf,
  parseMoneyInput,
  validateRefundAmount,
} from "../../lib/complaintModel";
import { Field, InfoRow, Notice, Section, inputClass } from "./fields";

/** Ô so sánh [A], [B], [A-B] của UC-ACC-04. */
function Reconcile({ refund }) {
  const cells = [
    { tag: "A", label: "Trung tâm đã thu", value: refund.receivedAmount },
    { tag: "B", label: "Đã hoàn trước đó", value: refund.refundedAmount },
    { tag: "A-B", label: "Còn có thể hoàn", value: refund.remainingAmount, strong: true },
  ];
  return (
    <div className="grid grid-cols-3 gap-2">
      {cells.map((c) => (
        <div
          key={c.tag}
          className={clsx(
            "rounded-xl border p-3",
            c.strong
              ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/40 dark:bg-emerald-950/40"
              : "border-slate-200 dark:border-slate-800"
          )}
        >
          <p className="font-mono text-[11px] text-slate-400">[{c.tag}]</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{c.label}</p>
          <p
            className={clsx(
              "mt-1 font-mono text-sm font-semibold",
              c.strong ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"
            )}
          >
            {formatVnd(c.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Kế toán đối soát, chi tiền kèm biên lai hoặc từ chối kèm lý do (UC-ACC-04, UC-ADM-18). */
export default function RefundProcessModal({ refundId, currentUserId, onClose, onDone }) {
  const toast = useToast();
  const [refund, setRefund] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [amountText, setAmountText] = useState("");
  const [file, setFile] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let alive = true;
    apiGetRefund(refundId)
      .then((r) => {
        if (!alive) return;
        setRefund(r);
        const suggested = Math.min(Number(r.requestedAmount || 0), Number(r.remainingAmount || 0));
        setAmountText(suggested > 0 ? String(suggested) : "");
      })
      .catch((err) => alive && setLoadError(err.message));
    return () => {
      alive = false;
    };
  }, [refundId]);

  const pending = refund?.status === REFUND_STATUS.PENDING;
  const sameActor = refund && isRefundRequester(refund, currentUserId);
  const amount = parseMoneyInput(amountText);

  function pickFile(e) {
    const picked = e.target.files?.[0] || null;
    e.target.value = "";
    if (!picked) return;
    const problem = validateProofFile(picked);
    setError(problem || "");
    setFile(problem ? null : picked);
  }

  function submitPay() {
    let problem = validateRefundAmount(amount, { remaining: refund.remainingAmount, requested: refund.requestedAmount });
    if (!problem && !file) problem = "Vui lòng đính kèm ảnh biên lai chuyển khoản hoàn tiền trước khi xác nhận.";
    setError(problem || "");
    if (!problem) setConfirm("pay");
  }

  function submitReject() {
    if (!reason.trim()) {
      setError("Vui lòng nhập lý do từ chối hoàn tiền để Lễ tân nắm được thông tin.");
      return;
    }
    setError("");
    setConfirm("reject");
  }

  async function run(action) {
    setConfirm(null);
    setBusy(true);
    setProgress(0);
    try {
      if (action === "pay") {
        await apiPayRefund(refundId, amount, file, setProgress);
        toast.success("Đã xác nhận hoàn tiền, khiếu nại chuyển sang Đã xử lý.");
      } else {
        await apiRejectRefund(refundId, reason.trim());
        toast.success("Đã từ chối yêu cầu, khiếu nại quay về Chờ xử lý.");
      }
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const status = refund ? metaOf(REFUND_STATUS_META, refund.status) : null;

  const footer = pending && !sameActor ? (
    rejecting ? (
      <>
        <Button variant="secondary" onClick={() => setRejecting(false)} disabled={busy} className="cursor-pointer">
          Quay lại
        </Button>
        <Button variant="danger" onClick={submitReject} disabled={busy} className="cursor-pointer">
          {busy && <Loader2 size={16} className="animate-spin" />}
          Xác nhận từ chối
        </Button>
      </>
    ) : (
      <>
        <Button variant="outline" onClick={() => setRejecting(true)} disabled={busy} className="cursor-pointer">
          <XCircle size={16} />
          Từ chối
        </Button>
        <Button onClick={submitPay} disabled={busy} className="cursor-pointer">
          {busy && <Loader2 size={16} className="animate-spin" />}
          {busy ? `Đang tải lên ${progress}%` : "Xác nhận đã hoàn tiền"}
        </Button>
      </>
    )
  ) : null;

  return (
    <>
      <ModalShell
        open
        busy={busy}
        title={refund ? `Yêu cầu hoàn tiền ${refund.complaintCode}` : "Yêu cầu hoàn tiền"}
        subtitle={refund ? `Lễ tân ${refund.requestedByName} gửi lúc ${formatDateTime(refund.createdAt)}` : undefined}
        onClose={onClose}
        footer={footer}
      >
        {loadError ? (
          <Notice>{loadError}</Notice>
        ) : !refund ? (
          <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" aria-busy="true" />
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{refund.requestCode}</span>
            </div>

            <Section title="Khiếu nại">
              <InfoRow label="Người khiếu nại">{refund.complainantName}</InfoRow>
              <InfoRow label="Học sinh">{refund.studentName}</InfoRow>
              <InfoRow label="Lớp">{refund.className}</InfoRow>
              <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-950 dark:text-slate-300">
                {refund.complaintContent}
              </p>
            </Section>

            <Section title={`Đối soát khoản phí #${refund.paymentId}`}>
              <Reconcile refund={refund} />
              <div className="mt-3">
                <InfoRow label="Lễ tân đề xuất" mono>{formatVnd(refund.requestedAmount)}</InfoRow>
                <InfoRow label="Chủ tài khoản">{refund.recipientName}</InfoRow>
                <InfoRow label="Ngân hàng">{refund.bankName}</InfoRow>
                <InfoRow label="Số tài khoản" mono>{refund.bankAccountNumber}</InfoRow>
              </div>
            </Section>

            {refund.status === REFUND_STATUS.PAID && (
              <Section title="Đã hoàn tiền">
                <InfoRow label="Số đã hoàn" mono>{formatVnd(refund.approvedAmount)}</InfoRow>
                <InfoRow label="Kế toán">{refund.processedByName}</InfoRow>
                <InfoRow label="Thời điểm">{formatDateTime(refund.processedAt)}</InfoRow>
                <div className="mt-2">
                  <ProofPreview url={refund.proofUrl} alt="Biên lai hoàn tiền" />
                </div>
              </Section>
            )}
            {refund.status === REFUND_STATUS.REJECTED && (
              <Notice>
                Đã từ chối bởi {refund.processedByName} lúc {formatDateTime(refund.processedAt)}. Lý do: {refund.rejectReason}
              </Notice>
            )}

            {pending && sameActor && (
              <Notice tone="amber">Bạn là người tạo yêu cầu này nên không được tự xử lý. Vui lòng chuyển cho Kế toán khác.</Notice>
            )}

            {pending && !sameActor && !rejecting && (
              <>
                <Field label="Số tiền hoàn thực tế" required hint={`Tối đa ${formatVnd(Math.min(Number(refund.requestedAmount), Number(refund.remainingAmount)))}`}>
                  <input
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    inputMode="numeric"
                    disabled={busy}
                    className={clsx(inputClass, "font-mono")}
                  />
                </Field>
                <Field label="Biên lai chuyển khoản" required>
                  <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-600 transition hover:border-blue-400 dark:border-slate-700 dark:text-slate-300">
                    <span className="truncate">{file ? file.name : "Chọn ảnh JPG, PNG hoặc PDF, tối đa 5 MB"}</span>
                    <span className="shrink-0 font-medium text-blue-600 dark:text-blue-400">{file ? "Đổi tệp" : "Chọn tệp"}</span>
                    <input type="file" accept="image/jpeg,image/png,application/pdf" className="hidden" onChange={pickFile} disabled={busy} />
                  </label>
                </Field>
              </>
            )}

            {pending && !sameActor && rejecting && (
              <Field label="Lý do từ chối" required>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  disabled={busy}
                  className={inputClass}
                  placeholder="Ví dụ: Sai số tài khoản người nhận"
                />
              </Field>
            )}

            {error && <Notice>{error}</Notice>}
          </>
        )}
      </ModalShell>

      <ConfirmModal
        open={confirm === "pay"}
        title="Xác nhận đã hoàn tiền"
        message={refund ? `Xác nhận đã chuyển ${formatVnd(amount)} cho ${refund.recipientName} (${refund.bankName} ${refund.bankAccountNumber})? Khiếu nại sẽ chuyển sang Đã xử lý.` : ""}
        confirmTone="emerald"
        onConfirm={() => run("pay")}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmModal
        open={confirm === "reject"}
        title="Từ chối hoàn tiền"
        message="Yêu cầu sẽ bị từ chối và khiếu nại quay về Chờ xử lý để Lễ tân xử lý lại. Bạn có chắc không?"
        confirmTone="rose"
        onConfirm={() => run("reject")}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
}
