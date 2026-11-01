import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileWarning,
  MapPin,
  Phone,
  Percent,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import PaymentStatusBadge from "../../components/payment/PaymentStatusBadge";
import ModalShell from "../../components/payment/ModalShell";
import ProofUploader from "../../components/payment/ProofUploader";
import ProofPreview from "../../components/payment/ProofPreview";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../hooks/useToast";
import { apiGetPayment, apiSubmitProof } from "../../lib/paymentApi";
import { apiGetClassDetail, mapClassDetail, TEACHING_MODE_LABELS, dayOfWeekLabel } from "../../lib/classroomApi";
import {
  METHOD_LABEL,
  PAYMENT_STATUS,
  STATUS_META,
  canSubmitProof,
  formatDateTime,
  formatVnd,
} from "../../lib/paymentModel";

function statusIcon(status) {
  switch (status) {
    case PAYMENT_STATUS.APPROVED:
      return CheckCircle2;
    case PAYMENT_STATUS.SUBMITTED:
      return Clock;
    case PAYMENT_STATUS.RESUBMIT_REQUIRED:
      return FileWarning;
    default:
      return Upload;
  }
}

function statusTone(status) {
  return STATUS_META[status]?.tone || "slate";
}

export default function TutorPaymentDetail() {
  const { id } = useParams();
  const { token } = useAuth();
  const toast = useToast();

  const [payment, setPayment] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [classDetail, setClassDetail] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // Khoản phí theo :id (SĐT phụ huynh, proof presigned, trạng thái).
  useEffect(() => {
    let cancelled = false;
    setLoadError("");
    apiGetPayment(id)
      .then((d) => !cancelled && setPayment(d))
      .catch((err) => !cancelled && setLoadError(err.message || "Không tải được khoản phí."));
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Ca dạy cố định của lớp (thông tin "Đọc chỉ"), không chặn trang khi lỗi.
  useEffect(() => {
    if (!payment || !token) return;
    let cancelled = false;
    apiGetClassDetail(token, payment.classId)
      .then((d) => !cancelled && setClassDetail(mapClassDetail(d)))
      .catch(() => !cancelled && setClassDetail(null));
    return () => {
      cancelled = true;
    };
  }, [payment?.classId, token]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpload(file, onProgress) {
    await apiSubmitProof(payment.id, file, onProgress);
    toast.success("Đã nộp biên lai. Kế toán sẽ đối chiếu trong thời gian sớm nhất.");
    setUploadOpen(false);
    const refreshed = await apiGetPayment(payment.id);
    setPayment(refreshed);
  }

  if (loadError) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <BackLink />
        <Card>
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <FileWarning size={20} className="text-rose-500" />
            <p className="text-sm text-slate-600 dark:text-slate-300">{loadError}</p>
            <Link to="/tutor/payments">
              <Button variant="outline" size="sm" className="cursor-pointer">Về danh sách</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <BackLink />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  const canUpload = canSubmitProof(payment);
  const percent =
    payment.feePercentage !== null && payment.feePercentage !== undefined
      ? `${Number(payment.feePercentage)}%`
      : "—";
  const scheduleText = classDetail?.hasSchedules
    ? classDetail.schedules
        .map((s) => `${dayOfWeekLabel(s.dayOfWeek)} ${s.startTime} – ${s.endTime}`)
        .join(" · ")
    : "Chưa có ca dạy cố định";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <BackLink />

      <PageHeader
        eyebrow="Tài chính"
        title={payment.className || `Lớp #${payment.classId}`}
        description={`Khoản phí nhận lớp · Mã lớp #${payment.classId} · Tạo ${formatDateTime(payment.createdAt)}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={Banknote} label="Số tiền phải nộp" value={formatVnd(payment.amount)} tone="blue" />
        <StatCard
          icon={Percent}
          label="Tỷ lệ phí"
          value={percent}
          hint={`${payment.slotsPerWeek ?? 0} buổi/tuần`}
          tone="slate"
        />
        <StatCard
          icon={Wallet}
          label="Số tiền thực nhận"
          value={formatVnd(payment.receivedAmount)}
          tone="emerald"
        />
        <StatCard
          icon={statusIcon(payment.status)}
          label="Trạng thái"
          value={<PaymentStatusBadge status={payment.status} />}
          tone={statusTone(payment.status)}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Thông tin lớp — col-span-3 */}
        <Card className="lg:col-span-3">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Thông tin lớp</h2>
          <div className="mt-4 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40">
                <Users size={18} className="text-blue-600 dark:text-blue-400" />
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Học viên</p>
                <p className="text-slate-900 dark:text-white">{payment.studentName || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <Phone size={18} className="text-emerald-600 dark:text-emerald-400" />
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Phụ huynh</p>
                <p className="text-slate-900 dark:text-white">
                  {payment.parentName || "—"}
                  {payment.parentPhone ? (
                    <span className="ml-2 font-mono text-slate-500 dark:text-slate-400">{payment.parentPhone}</span>
                  ) : null}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40">
                <MapPin size={18} className="text-violet-600 dark:text-violet-400" />
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Hình thức dạy</p>
                <p className="text-slate-900 dark:text-white">
                  {TEACHING_MODE_LABELS[payment.teachingMode] || payment.teachingMode || "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40">
                <CalendarDays size={18} className="text-amber-600 dark:text-amber-400" />
              </span>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">Ca dạy cố định</p>
                <p className="text-slate-900 dark:text-white">{scheduleText}</p>
                {classDetail?.pricePerSession ? (
                  <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                    Học phí {formatVnd(classDetail.pricePerSession)}/buổi · {percent} = {formatVnd(payment.amount)}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && payment.rejectReason && (
            <div className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
              <FileWarning size={16} className="mt-0.5 shrink-0" />
              <span>
                <span className="font-medium">Lý do cần gửi lại: </span>
                {payment.rejectReason}
              </span>
            </div>
          )}
        </Card>

        {/* Minh chứng — col-span-2 */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Minh chứng</h2>
            {payment.proofUrl && (
              <Button variant="outline" size="sm" onClick={() => setViewOpen(true)} className="cursor-pointer">
                Xem biên lai
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-3 text-sm">
            <InfoRow label="Phương thức">
              {METHOD_LABEL[payment.paymentMethod] || (payment.proofUrl ? "Chưa rõ" : "—")}
            </InfoRow>
            <InfoRow label="Thời điểm nộp">
              <span className="font-mono">{formatDateTime(payment.uploadedAt)}</span>
            </InfoRow>
            <InfoRow label="Thời điểm xác nhận">
              <span className="font-mono">{formatDateTime(payment.reviewedAt)}</span>
            </InfoRow>
            {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && (
              <InfoRow label="Lần xử lý">
                <span className="font-mono">{formatDateTime(payment.reviewedAt)}</span>
              </InfoRow>
            )}
          </div>

          {!payment.proofUrl ? (
            <div className="mt-4 flex h-32 items-center justify-center rounded-xl border border-dashed border-slate-300 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Chưa có biên lai
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
              Link xem biên lai có thời hạn, được cấp khi mở.
            </p>
          )}

          {canUpload && (
            <Button
              onClick={() => setUploadOpen(true)}
              className="mt-5 w-full cursor-pointer"
            >
              <Upload size={16} />
              {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED ? "Nộp lại biên lai" : "Nộp biên lai"}
            </Button>
          )}
        </Card>
      </div>

      <ModalShell
        open={uploadOpen}
        busy={busy}
        title={payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED ? "Nộp lại biên lai" : "Nộp biên lai phí nhận lớp"}
        subtitle={`${payment.className || `Lớp #${payment.classId}`} · ${formatVnd(payment.amount)}`}
        onClose={() => setUploadOpen(false)}
      >
        {payment.status === PAYMENT_STATUS.RESUBMIT_REQUIRED && payment.rejectReason && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-800/40 dark:bg-rose-950/40 dark:text-rose-400">
            <span className="font-medium">Lý do cần gửi lại: </span>
            {payment.rejectReason}
          </p>
        )}
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Chuyển khoản đúng số tiền{" "}
          <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatVnd(payment.amount)}</span>{" "}
          rồi tải ảnh biên lai lên.
        </p>
        <ProofUploader onSubmit={handleUpload} onBusyChange={setBusy} />
      </ModalShell>

      <ModalShell
        open={viewOpen}
        title="Biên lai đã nộp"
        subtitle={payment.className || `Lớp #${payment.classId}`}
        onClose={() => setViewOpen(false)}
      >
        <ProofPreview url={payment.proofUrl} />
      </ModalShell>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/tutor/payments"
      className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
    >
      <ArrowLeft size={16} />
      Về danh sách phí nhận lớp
    </Link>
  );
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0 dark:border-slate-800">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-right text-slate-900 dark:text-white">{children}</dd>
    </div>
  );
}
