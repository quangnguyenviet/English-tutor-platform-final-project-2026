import { useState } from "react";
import { AlertTriangle, CheckCircle, Clock, FileWarning, Lock, Unlock, Upload } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import { useToast } from "../../hooks/useToast";
import PaymentRow from "../../components/payment/PaymentRow";
import PaymentTabs from "../../components/payment/PaymentTabs";
import ModalShell from "../../components/payment/ModalShell";
import ProofUploader from "../../components/payment/ProofUploader";
import ProofPreview from "../../components/payment/ProofPreview";
import { PaymentListSkeleton, StatRowSkeleton } from "../../components/payment/PaymentSkeleton";
import { usePaymentList, useStatusCounts } from "../../components/payment/usePaymentData";
import { apiGetMyPayments, apiGetPayment, apiSubmitProof } from "../../lib/paymentApi";
import {
  METHOD_LABEL,
  PAYMENT_STATUS,
  canSubmitProof,
  formatDateTime,
  formatVnd,
} from "../../lib/paymentModel";

export default function TutorPayments() {
  const toast = useToast();
  const [tab, setTab] = useState(PAYMENT_STATUS.NOT_SUBMITTED);
  const [version, setVersion] = useState(0);
  const [uploading, setUploading] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [busy, setBusy] = useState(false);

  const list = usePaymentList(() => apiGetMyPayments({ tab }), [tab, version]);
  const counts = useStatusCounts((status) => apiGetMyPayments({ tab: status, size: 1 }), version);

  async function handleUpload(file, onProgress) {
    await apiSubmitProof(uploading.id, file, onProgress);
    toast.success("Đã nộp biên lai. Kế toán sẽ đối chiếu trong thời gian sớm nhất.");
    setUploading(null);
    setVersion((v) => v + 1);
  }

  async function openProof(payment) {
    setViewing({ payment, detail: null, loading: true });
    try {
      const detail = await apiGetPayment(payment.id);
      setViewing({ payment, detail, loading: false });
    } catch (err) {
      setViewing(null);
      toast.error(err.message || "Không mở được biên lai.");
    }
  }

  const emptyText = {
    [PAYMENT_STATUS.NOT_SUBMITTED]: "Bạn không có khoản phí nào đang chờ nộp minh chứng.",
    [PAYMENT_STATUS.RESUBMIT_REQUIRED]: "Không có khoản phí nào bị yêu cầu gửi lại.",
    [PAYMENT_STATUS.SUBMITTED]: "Không có khoản phí nào đang chờ xác nhận.",
    [PAYMENT_STATUS.APPROVED]: "Chưa có khoản phí nào được xác nhận.",
  }[tab];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tài chính"
        title="Phí nhận lớp"
        description="Nộp biên lai chuyển khoản phí nhận lớp để mở thông tin liên hệ phụ huynh sau khi được xác nhận."
      />

      {counts ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Upload} label="Chưa nộp minh chứng" value={counts.NOT_SUBMITTED} tone="slate" />
          <StatCard icon={FileWarning} label="Yêu cầu gửi lại" value={counts.RESUBMIT_REQUIRED} tone="rose" />
          <StatCard icon={Clock} label="Chờ xác nhận" value={counts.SUBMITTED} tone="amber" />
          <StatCard icon={CheckCircle} label="Đã xác nhận" value={counts.APPROVED} tone="emerald" />
        </div>
      ) : (
        <StatRowSkeleton />
      )}

      <PaymentTabs active={tab} onChange={setTab} counts={counts || undefined} />

      <Card padded={false}>
        {list.loading ? (
          <PaymentListSkeleton />
        ) : list.error ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle size={20} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{list.error}</p>
            <Button variant="outline" size="sm" onClick={list.reload} className="cursor-pointer">
              Thử lại
            </Button>
          </div>
        ) : list.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">{emptyText}</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.items.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                showTutor={false}
                actions={
                  canSubmitProof(payment) ? (
                    <Button size="sm" onClick={() => setUploading(payment)} className="cursor-pointer">
                      <Upload size={14} />
                      {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED ? "Nộp lại biên lai" : "Nộp biên lai"}
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => openProof(payment)} className="cursor-pointer">
                      Xem biên lai
                    </Button>
                  )
                }
                footer={
                  <>
                    {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && payment.rejectReason && (
                      <p className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
                        <FileWarning size={16} className="mt-0.5 shrink-0" />
                        <span>
                          <span className="font-medium">Lý do cần gửi lại: </span>
                          {payment.rejectReason}
                        </span>
                      </p>
                    )}
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      {payment.contactUnlocked ? (
                        <>
                          <Unlock size={14} className="text-emerald-600 dark:text-emerald-400" />
                          Đã mở thông tin liên hệ phụ huynh
                          {payment.parentName ? `: ${payment.parentName}` : ""}
                          {payment.parentPhone ? ` · ${payment.parentPhone}` : ""}
                        </>
                      ) : (
                        <>
                          <Lock size={14} />
                          Thông tin liên hệ phụ huynh sẽ mở sau khi phí được xác nhận
                        </>
                      )}
                    </p>
                  </>
                }
              />
            ))}
          </div>
        )}
      </Card>

      <ModalShell
        open={Boolean(uploading)}
        busy={busy}
        title={uploading?.status === PAYMENT_STATUS.RESUBMIT_REQUIRED ? "Nộp lại biên lai" : "Nộp biên lai phí nhận lớp"}
        subtitle={uploading ? `${uploading.className || `Lớp #${uploading.classId}`} · ${formatVnd(uploading.amount)}` : ""}
        onClose={() => setUploading(null)}
      >
        {uploading?.rejectReason && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
            <span className="font-medium">Lý do cần gửi lại: </span>
            {uploading.rejectReason}
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Chuyển khoản đúng số tiền{" "}
          <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatVnd(uploading?.amount)}</span>{" "}
          rồi tải ảnh biên lai lên.
        </p>
        <ProofUploader onSubmit={handleUpload} onBusyChange={setBusy} />
      </ModalShell>

      <ModalShell
        open={Boolean(viewing)}
        title="Biên lai đã nộp"
        subtitle={viewing ? viewing.payment.className || `Lớp #${viewing.payment.classId}` : ""}
        onClose={() => setViewing(null)}
      >
        {viewing?.loading ? (
          <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
        ) : (
          viewing && (
            <>
              <ProofPreview url={viewing.detail?.proofUrl} />
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Số tiền phải nộp</dt>
                  <dd className="font-mono font-medium text-slate-900 dark:text-white">{formatVnd(viewing.detail?.amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Số tiền thực nhận</dt>
                  <dd className="font-mono font-medium text-slate-900 dark:text-white">{formatVnd(viewing.detail?.receivedAmount)}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Hình thức</dt>
                  <dd className="text-slate-900 dark:text-white">{METHOD_LABEL[viewing.detail?.paymentMethod] || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-500 dark:text-slate-400">Thời điểm nộp</dt>
                  <dd className="font-mono text-slate-900 dark:text-white">{formatDateTime(viewing.detail?.uploadedAt)}</dd>
                </div>
              </dl>
            </>
          )
        )}
      </ModalShell>
    </div>
  );
}
