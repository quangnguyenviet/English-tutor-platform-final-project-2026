import { useState } from "react";
import {
  Banknote,
  CheckCircle,
  Clock,
  Search,
  Eye,
  Lock,
  Unlock,
  ShieldCheck,
  Building2,
  Calendar,
  FileCheck,
  AlertTriangle,
  X,
  Receipt,
  RefreshCw,
  FileX,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const statusMeta = {
  pending: { label: "Chờ duyệt", tone: "amber" },
  no_proof: { label: "Chưa nộp minh chứng", tone: "slate" },
  approved: { label: "Đã duyệt", tone: "emerald" },
  resubmit_requested: { label: "Yêu cầu gửi lại", tone: "amber" },
};

const fmtVND = (n) => (n ? Number(n).toLocaleString("vi-VN") + "₫" : "0₫");

function formatTs(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

export function PaymentApproval() {
  const { paymentProofList, approvePaymentProof, requestResubmitProof } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal / Review State
  const [viewingPayment, setViewingPayment] = useState(null);
  const [resubmitModalPayment, setResubmitModalPayment] = useState(null);
  const [resubmitReason, setResubmitReason] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "emerald",
    onConfirm: null,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  // Filter payments — removed "rejected" status
  const filtered = paymentProofList.filter((p) => {
    const matchSearch =
      p.tutorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.transactionCode && p.transactionCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.bankName && p.bankName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Calculate stats — no more rejected
  const pendingItems = paymentProofList.filter((p) => p.status === "pending" || p.status === "resubmit_requested");
  const noProofItems = paymentProofList.filter((p) => p.status === "no_proof");
  const approvedItems = paymentProofList.filter((p) => p.status === "approved");
  const pendingAmount = pendingItems.reduce((s, p) => s + (p.amount || 0), 0);
  const approvedAmount = approvedItems.reduce((s, p) => s + (p.amount || 0), 0);

  // Approve with ConfirmModal
  const handleApprove = (payment) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận duyệt minh chứng",
      message: `Bạn chắc chắn muốn duyệt minh chứng thanh toán ${fmtVND(payment.amount)} của gia sư ${payment.tutorName}? Thông tin liên hệ phụ huynh sẽ được mở khóa.`,
      confirmLabel: "Duyệt & Mở khóa",
      confirmTone: "emerald",
      onConfirm: () => {
        approvePaymentProof(payment.id);
        showToast(
          `Đã duyệt thanh toán ${fmtVND(payment.amount)} cho Gia sư ${payment.tutorName}. Đã mở khóa liên hệ Phụ huynh!`
        );
        if (viewingPayment?.id === payment.id) {
          setViewingPayment(null);
        }
        closeConfirmModal();
      },
    });
  };

  const handleOpenResubmit = (payment) => {
    setResubmitModalPayment(payment);
    setResubmitReason("Ảnh biên lai mờ hoặc thông tin chuyển khoản không khớp.");
  };

  const handleConfirmResubmit = () => {
    if (!resubmitModalPayment) return;
    requestResubmitProof(resubmitModalPayment.id, resubmitReason);
    showToast(`Đã gửi yêu cầu nộp lại minh chứng tới Gia sư ${resubmitModalPayment.tutorName}.`);
    setResubmitModalPayment(null);
    setResubmitReason("");
    if (viewingPayment?.id === resubmitModalPayment.id) {
      setViewingPayment(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl transition-all dark:border-emerald-900 dark:bg-slate-900">
          <CheckCircle size={18} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ConfirmModal */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        icon={ShieldCheck}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Header */}
      <PageHeader
        title="Duyệt thanh toán & Minh chứng phí"
        description="Kiểm tra biên lai chuyển khoản (QR proof) từ gia sư, duyệt phí kết nối trung tâm & mở khóa liên hệ phụ huynh (FR-23)."
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Clock}
          label="Chờ duyệt thanh toán"
          value={pendingItems.length}
          hint={`Tổng tiền: ${fmtVND(pendingAmount)}`}
          tone="amber"
        />
        <StatCard
          icon={CheckCircle}
          label="Đã duyệt thành công"
          value={approvedItems.length}
          hint={`Tổng thu: ${fmtVND(approvedAmount)}`}
          tone="emerald"
        />
        <StatCard
          icon={Banknote}
          label="Tổng tiền chờ duyệt"
          value={fmtVND(pendingAmount)}
          hint="Cần xác thực VietQR"
          tone="blue"
        />
        <StatCard
          icon={ShieldCheck}
          label="Tỷ lệ duyệt hợp lệ"
          value={
            paymentProofList.length > 0
              ? Math.round((approvedItems.length / paymentProofList.length) * 100) + "%"
              : "100%"
          }
          hint="Độ chính xác giao dịch"
          tone="blue"
        />
      </div>

      {/* Filters Toolbar — removed "Đã từ chối" tab */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ duyệt", count: pendingItems.length },
              { key: "no_proof", label: "Chưa nộp MC", count: noProofItems.length },
              { key: "approved", label: "Đã duyệt", count: approvedItems.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  statusFilter === tab.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] ${
                      statusFilter === tab.key
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative min-w-[240px] sm:w-72">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo gia sư, mã giao dịch, ngân hàng..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
            />
          </div>
        </div>
      </Card>

      {/* Payment Proofs List */}
      <div className="space-y-3.5">
        {filtered.map((item, idx) => {
          const meta = statusMeta[item.status] || { label: item.status, tone: "neutral" };

          return (
            <div
              key={item.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="fade-slide-in rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm transition-all hover:border-blue-200 hover:shadow dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                {/* Tutor & Transaction Details */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                    <Receipt size={20} />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {item.tutorName}
                      </p>
                      <span className="text-xs text-slate-400">&rarr;</span>
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Lớp học sinh: <strong className="text-slate-900 dark:text-white">{item.studentName}</strong>
                      </span>
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </div>

                    {/* Show transaction details only if proof exists */}
                    {item.status !== "no_proof" ? (
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          Mã GD: <strong className="text-slate-700 dark:text-slate-200">{item.transactionCode}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 size={13} className="text-slate-400" />
                          {item.bankName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={13} className="text-slate-400" />
                          {formatTs(item.submittedAt)}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        Gia sư chưa nộp minh chứng thanh toán
                      </p>
                    )}

                    {item.note && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 line-clamp-1">
                        &ldquo;{item.note}&rdquo;
                      </p>
                    )}

                    {/* Resubmit reason if applicable */}
                    {item.status === "resubmit_requested" && item.resubmitReason && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-200">
                        <span className="font-semibold">Lý do yêu cầu gửi lại: </span>
                        {item.resubmitReason}
                      </div>
                    )}

                    {/* Contact Unlock Status */}
                    <div className="pt-1 flex items-center gap-2 text-xs">
                      {item.parentContactLocked ? (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 font-medium">
                          <Lock size={12} /> Thông tin liên hệ Phụ huynh đang bị khóa
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium">
                          <Unlock size={12} /> Đã mở khóa liên hệ: {item.parentPhone} ({item.parentTelegram})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex items-center justify-between lg:justify-end gap-4 shrink-0 border-t border-slate-100 pt-3 lg:border-t-0 lg:pt-0 dark:border-slate-800">
                  <div className="text-right">
                    <p className="text-xs text-slate-400">Số tiền nộp</p>
                    <p className="text-base font-bold tabular-nums text-slate-900 dark:text-white font-mono">
                      {fmtVND(item.amount)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View Proof Button — only if proof exists, styled prominently */}
                    {item.status !== "no_proof" ? (
                      <Button
                        size="sm"
                        onClick={() => setViewingPayment(item)}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium"
                        title="Xem ảnh chứng từ chuyển khoản"
                      >
                        <Eye size={14} /> Minh chứng
                      </Button>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500 italic px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 dark:text-slate-400">
                        Chưa nộp minh chứng
                      </span>
                    )}

                    {(item.status === "pending" || item.status === "resubmit_requested") && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenResubmit(item)}
                        className="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                      >
                        <RefreshCw size={14} /> Gửi lại MC
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <Receipt size={36} className="text-slate-300 dark:text-slate-600" />
            <h4 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Không tìm thấy biên lai thanh toán
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Chưa có giao dịch phù hợp với tiêu chí tìm kiếm hiện tại.
            </p>
          </div>
        )}
      </div>

      {/* Modal: View Proof Details & Large QR/Receipt Image */}
      {viewingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Chi tiết minh chứng chuyển khoản QR
                </h3>
                <p className="text-xs text-slate-400">
                  Mã giao dịch: {viewingPayment.transactionCode} &bull; {viewingPayment.bankName}
                </p>
              </div>
              <button
                onClick={() => setViewingPayment(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Receipt Preview Box */}
              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                <img
                  src={viewingPayment.proofImageUrl}
                  alt="Biên lai nộp phí chuyển khoản"
                  className="mx-auto max-h-64 rounded-lg object-contain shadow-sm"
                />
                <p className="mt-2 text-[11px] text-slate-400">
                  Ảnh hóa đơn ủy nhiệm chi nộp từ ứng dụng gia sư
                </p>
              </div>

              {/* Metadata details */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Gia sư nộp phí:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {viewingPayment.tutorName} ({viewingPayment.tutorPhone})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Học viên nhận lớp:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {viewingPayment.studentName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số tiền xác nhận:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400 font-mono text-sm">
                    {fmtVND(viewingPayment.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Số tài khoản chuyển:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {viewingPayment.accountNumber} ({viewingPayment.accountHolder})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Thời gian nộp:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-mono">
                    {formatTs(viewingPayment.submittedAt)}
                  </span>
                </div>
                {viewingPayment.reviewedAt && (
                  <div className="flex justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400">Người phê duyệt:</span>
                    <span className="text-slate-700 dark:text-slate-300">
                      {viewingPayment.reviewedBy} ({formatTs(viewingPayment.reviewedAt)})
                    </span>
                  </div>
                )}
              </div>

              {/* Note */}
              {viewingPayment.note && (
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Lời nhắn từ gia sư: </span>
                  {viewingPayment.note}
                </div>
              )}
            </div>

            {/* Modal Footer — replaced "Từ chối" with "Yêu cầu gửi lại minh chứng" */}
            <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setViewingPayment(null)}>
                Đóng
              </Button>

              {(viewingPayment.status === "pending" || viewingPayment.status === "resubmit_requested") && (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleOpenResubmit(viewingPayment)}
                    className="text-amber-600 hover:bg-amber-50"
                  >
                    <RefreshCw size={14} /> Yêu cầu gửi lại MC
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(viewingPayment)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle size={14} /> Duyệt & Mở khóa ngay
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request Resubmit Proof (replaces old Reject modal) */}
      {resubmitModalPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <RefreshCw size={16} className="text-amber-500" />
                Yêu cầu gửi lại minh chứng
              </h3>
              <button
                onClick={() => setResubmitModalPayment(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gia sư: <strong>{resubmitModalPayment.tutorName}</strong> &bull; Số tiền:{" "}
                <strong>{fmtVND(resubmitModalPayment.amount)}</strong>
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Lý do yêu cầu nộp lại minh chứng (Gửi thông báo tới gia sư):
                </label>
                <textarea
                  rows={3}
                  value={resubmitReason}
                  onChange={(e) => setResubmitReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-slate-800 dark:bg-slate-900"
                  placeholder="Nhập lý do cụ thể..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setResubmitModalPayment(null)}>
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmResubmit}
                disabled={!resubmitReason.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Send size={14} /> Gửi yêu cầu
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentApproval;
