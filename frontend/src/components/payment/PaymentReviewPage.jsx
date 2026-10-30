import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, FileWarning, Loader2, Search, Upload } from "lucide-react";
import PageHeader from "../ui/PageHeader";
import Card from "../ui/Card";
import Button from "../ui/Button";
import StatCard from "../ui/StatCard";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import PaymentRow from "./PaymentRow";
import PaymentTabs from "./PaymentTabs";
import ModalShell from "./ModalShell";
import FeeRateModal from "./FeeRateModal";
import ProofPreview from "./ProofPreview";
import { PaymentListSkeleton, StatRowSkeleton } from "./PaymentSkeleton";
import { usePaymentList, useStatusCounts } from "./usePaymentData";
import { apiApprovePayment, apiGetPayment, apiRequestResubmit, apiSearchPayments } from "../../lib/paymentApi";
import {
  METHOD_LABEL,
  PAYMENT_STATUS,
  canConfirmPayment,
  canEditFeeRate,
  formatDateTime,
  formatVnd,
  isSameActor,
  parseMoneyInput,
} from "../../lib/paymentModel";

function useDebounced(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Màn hình đối chiếu phí nhận lớp, dùng chung cho Kế toán và Admin. */
export default function PaymentReviewPage() {
  const { session } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState(PAYMENT_STATUS.SUBMITTED);
  const [keyword, setKeyword] = useState("");
  const debouncedKeyword = useDebounced(keyword);
  const [version, setVersion] = useState(0);
  const [reviewing, setReviewing] = useState(null);
  const [editingRate, setEditingRate] = useState(null);
  // Backend chỉ cho Lễ tân / Admin chỉnh tỷ lệ phí; Kế toán chỉ đối chiếu.
  const canEditRate = session?.role === "admin";

  const list = usePaymentList(
    () => apiSearchPayments({ status: tab, keyword: debouncedKeyword }),
    [tab, debouncedKeyword, version]
  );
  const counts = useStatusCounts((status) => apiSearchPayments({ status, size: 1 }), version);

  function done(message) {
    toast.success(message);
    setReviewing(null);
    setVersion((v) => v + 1);
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Tài chính"
        title="Đối chiếu phí nhận lớp"
        description="Kiểm tra biên lai, nhập số tiền thực nhận và xác nhận hoặc yêu cầu gia sư gửi lại."
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

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <PaymentTabs active={tab} onChange={setTab} counts={counts || undefined} />
        <div className="relative w-full lg:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Mã lớp, tên gia sư, SĐT phụ huynh"
            className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          />
        </div>
      </div>

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
          <p className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            Không có khoản phí nào trong mục này.
          </p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {list.items.map((payment) => (
              <PaymentRow
                key={payment.id}
                payment={payment}
                actions={
                  payment.status === PAYMENT_STATUS.SUBMITTED ? (
                    <Button size="sm" onClick={() => setReviewing(payment)} className="cursor-pointer">
                      Đối chiếu
                    </Button>
                  ) : canEditFeeRate(payment) ? (
                    canEditRate && (
                      <Button variant="outline" size="sm" onClick={() => setEditingRate(payment)} className="cursor-pointer">
                        Chỉnh tỷ lệ
                      </Button>
                    )
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setReviewing(payment)} className="cursor-pointer">
                      Xem chi tiết
                    </Button>
                  )
                }
                footer={
                  payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && payment.rejectReason ? (
                    <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
                      <span className="font-medium">Lý do: </span>
                      {payment.rejectReason}
                    </p>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </Card>

      {editingRate && (
        <FeeRateModal
          payment={editingRate}
          onClose={() => setEditingRate(null)}
          onSaved={() => {
            setEditingRate(null);
            setVersion((v) => v + 1);
          }}
        />
      )}

      {reviewing && (
        <ReviewModal
          payment={reviewing}
          currentUserId={session?.userId}
          onClose={() => setReviewing(null)}
          onDone={done}
        />
      )}
    </div>
  );
}

function ReviewModal({ payment, currentUserId, onClose, onDone }) {
  const toast = useToast();
  const [detail, setDetail] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [amountText, setAmountText] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState("approve");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiGetPayment(payment.id)
      .then((d) => !cancelled && setDetail(d))
      .catch((err) => !cancelled && setLoadError(err.message || "Không tải được chi tiết khoản phí."));
    return () => {
      cancelled = true;
    };
  }, [payment.id]);

  const current = detail || payment;
  const pending = current.status === PAYMENT_STATUS.SUBMITTED;
  const received = parseMoneyInput(amountText);
  const sameActor = isSameActor(current, currentUserId);
  const canConfirm = canConfirmPayment(current, received, currentUserId);
  const shortfall = received !== null && received < Number(current.amount);

  async function run(action, message) {
    setBusy(true);
    try {
      const result = await action();
      onDone(typeof message === "function" ? message(result) : message);
    } catch (err) {
      toast.error(err.message || "Thao tác thất bại. Vui lòng thử lại.");
      setBusy(false);
    }
  }

  const confirm = () =>
    run(
      () => apiApprovePayment(payment.id, received),
      (r) =>
        r?.status === PAYMENT_STATUS.APPROVED
          ? "Đã xác nhận phí nhận lớp. Gia sư đã được mở thông tin liên hệ phụ huynh."
          : "Số tiền thực nhận chưa đủ, đã yêu cầu gia sư nộp lại."
    );
  const resubmit = () =>
    run(() => apiRequestResubmit(payment.id, reason.trim()), "Đã yêu cầu gia sư gửi lại biên lai.");

  return (
    <ModalShell
      open
      busy={busy}
      title={pending ? "Đối chiếu biên lai" : "Chi tiết khoản phí"}
      subtitle={`${current.className || `Lớp #${current.classId}`} · Gia sư ${current.tutorName || "—"}`}
      onClose={onClose}
      footer={
        pending ? (
          mode === "approve" ? (
            <>
              <Button variant="outline" onClick={() => setMode("resubmit")} disabled={busy} className="cursor-pointer">
                Yêu cầu gửi lại
              </Button>
              <Button onClick={confirm} disabled={!canConfirm || busy} className="cursor-pointer">
                {busy && <Loader2 size={16} className="animate-spin" />}
                Xác nhận
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setMode("approve")} disabled={busy} className="cursor-pointer">
                Quay lại
              </Button>
              <Button variant="danger" onClick={resubmit} disabled={!reason.trim() || sameActor || busy} className="cursor-pointer">
                {busy && <Loader2 size={16} className="animate-spin" />}
                Gửi yêu cầu
              </Button>
            </>
          )
        ) : (
          <Button variant="outline" onClick={onClose} className="cursor-pointer">
            Đóng
          </Button>
        )
      }
    >
      {loadError ? (
        <p className="text-sm text-rose-600 dark:text-rose-400">{loadError}</p>
      ) : !detail ? (
        <div className="h-48 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      ) : (
        <>
          <ProofPreview url={detail.proofUrl} />
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Số tiền phải nộp</dt>
              <dd className="font-mono font-semibold text-slate-900 dark:text-white">{formatVnd(detail.amount)}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Tỷ lệ phí</dt>
              <dd className="font-mono text-slate-900 dark:text-white">{Number(detail.feePercentage)}%</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Hình thức</dt>
              <dd className="text-slate-900 dark:text-white">{METHOD_LABEL[detail.paymentMethod] || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-500 dark:text-slate-400">Thời điểm nộp</dt>
              <dd className="font-mono text-slate-900 dark:text-white">{formatDateTime(detail.uploadedAt)}</dd>
            </div>
            {detail.receivedAmount !== undefined && (
              <div>
                <dt className="text-xs text-slate-500 dark:text-slate-400">Số tiền thực nhận</dt>
                <dd className="font-mono text-slate-900 dark:text-white">{formatVnd(detail.receivedAmount)}</dd>
              </div>
            )}
            {detail.rejectReason && (
              <div className="col-span-2">
                <dt className="text-xs text-slate-500 dark:text-slate-400">Lý do gửi lại</dt>
                <dd className="text-slate-900 dark:text-white">{detail.rejectReason}</dd>
              </div>
            )}
          </dl>

          {pending && sameActor && (
            <p className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              Bạn là người đã nộp hoặc thu hộ biên lai này nên không thể tự xác nhận. Hãy nhờ người khác đối chiếu.
            </p>
          )}

          {pending && mode === "approve" && (
            <div>
              <label htmlFor="received-amount" className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                Số tiền thực nhận (₫)
              </label>
              <input
                id="received-amount"
                inputMode="numeric"
                value={amountText}
                onChange={(e) => setAmountText(e.target.value)}
                disabled={sameActor || busy}
                placeholder={`Ví dụ: ${Number(detail.amount).toLocaleString("vi-VN")}`}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              {amountText && received === null && (
                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">Vui lòng nhập số tiền hợp lệ.</p>
              )}
              {shortfall && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                  Số tiền thực nhận nhỏ hơn số phải nộp, hệ thống sẽ yêu cầu gia sư nộp lại.
                </p>
              )}
            </div>
          )}

          {pending && mode === "resubmit" && (
            <div>
              <label htmlFor="resubmit-reason" className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                Lý do yêu cầu gửi lại
              </label>
              <textarea
                id="resubmit-reason"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={busy}
                placeholder="Ví dụ: Ảnh biên lai bị mờ, không đọc được nội dung chuyển khoản."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          )}
        </>
      )}
    </ModalShell>
  );
}
