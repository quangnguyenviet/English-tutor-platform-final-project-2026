import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  MapPin,
  Target,
  AlertTriangle,
  Check,
  X,
  GraduationCap,
  Lock,
  Unlock,
  Phone,
  MessageSquare,
  Clock,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  UploadCloud,
  ExternalLink,
  ChevronRight,
  User,
  UserCheck,
  DollarSign,
  Send,
  FileText,
  ThumbsUp,
  XCircle,
} from "lucide-react";
import { classRequests as initialRequests } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import clsx from "clsx";

// Các bước trong tiến trình Post-paid 30 ngày
const trackSteps = [
  { key: "pending_offer", label: "Nhận Match Offer" },
  { key: "unlocked_schedule_setup", label: "Mở Khóa SĐT & Chốt Lịch Học" },
  { key: "in_trial", label: "Buổi 1 Học Thử" },
  { key: "active_pay_later", label: "Kích Hoạt Lớp (Hạn Phí 30d)" },
  { key: "completed_paid", label: "Admin Duyệt Phí & Hoàn Tất" },
];

const statusMeta = {
  pending_offer: { label: "Match Offer Mới", tone: "amber" },
  unlocked_schedule_setup: { label: "Đã Mở Khóa SĐT - Chờ Lên Lịch Học", tone: "blue" },
  unlocked_trial_setup: { label: "Đã Mở Khóa SĐT - Chờ Lên Lịch Học", tone: "blue" },
  in_trial: { label: "Đang Học (Buổi 1 Học Thử)", tone: "violet" },
  active_pay_later: { label: "Đang Dạy (Hạn Nộp Phí 30 Ngày)", tone: "emerald" },
  waiting_fee_approval: { label: "Đang Chờ Admin Duyệt Phí", tone: "amber" },
  completed_paid: { label: "Đã Hoàn Tất Nghĩa Vụ Phí", tone: "emerald" },
  trial_failed: { label: "Hủy Sau Buổi 1 (Miễn Phí 30%)", tone: "rose" },
  rejected: { label: "Đã Từ Chối", tone: "rose" },
};

function StatusTrack({ status }) {
  let activeIndex = 0;
  if (status === "pending_offer") activeIndex = 0;
  else if (status === "unlocked_schedule_setup" || status === "unlocked_trial_setup") activeIndex = 1;
  else if (status === "in_trial") activeIndex = 2;
  else if (status === "active_pay_later") activeIndex = 3;
  else if (status === "waiting_fee_approval" || status === "completed_paid") activeIndex = 4;

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex min-w-[580px] items-center justify-between">
        {trackSteps.map((step, i) => {
          const done = activeIndex >= i;
          const current = activeIndex === i;

          return (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={clsx(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                    done
                      ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 dark:bg-emerald-500"
                      : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
                    current && "ring-4 ring-emerald-100 dark:ring-emerald-950/60 scale-105"
                  )}
                >
                  {done ? <Check size={16} /> : i + 1}
                </div>
                <span
                  className={clsx(
                    "text-center text-[11px] font-medium max-w-[100px] leading-tight",
                    current
                      ? "font-semibold text-emerald-600 dark:text-emerald-400"
                      : done
                      ? "text-slate-700 dark:text-slate-300"
                      : "text-slate-400 dark:text-slate-500"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {i < trackSteps.length - 1 && (
                <div
                  className={clsx(
                    "mx-2 mb-4 h-1 flex-1 rounded-full transition-colors",
                    activeIndex > i ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-800"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, highlight }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-slate-50/80 p-2.5 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/80">
      <Icon size={18} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</p>
        <p className={clsx("text-sm font-medium", highlight ? "text-emerald-600 dark:text-emerald-400" : "text-slate-800 dark:text-slate-200")}>
          {value}
        </p>
      </div>
    </div>
  );
}

export default function ClassRequests() {
  const [requests, setRequests] = useState(initialRequests);
  const [selectedId, setSelectedId] = useState(
    initialRequests.find((r) => r.status === "pending_offer")?.id ?? initialRequests[0]?.id
  );
  const [filterTab, setFilterTab] = useState("all");
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Modal Cam kết 1-Click ở Bước 1
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentAgreed, setConsentAgreed] = useState(false);

  // States cho Lịch học & Ngày khai giảng
  const [startDate, setStartDate] = useState("2026-09-22");
  const [fixedSchedule, setFixedSchedule] = useState("Thứ 3 - Thứ 5 (19:00 - 20:30)");

  // State cho Thất bại Buổi 1 ở Bước 3
  const [showTrialFailForm, setShowTrialFailForm] = useState(false);
  const [trialFailReason, setTrialFailReason] = useState("ph_change_mind");
  const [trialFailNote, setTrialFailNote] = useState("");

  // State cho VietQR Modal
  const [showQrModal, setShowQrModal] = useState(false);
  const [receiptUploaded, setReceiptUploaded] = useState(false);

  const selected = requests.find((r) => r.id === selectedId);

  function selectRequest(id) {
    setSelectedId(id);
    setRejecting(false);
    setRejectReason("");
    setReceiptUploaded(false);
    setShowConsentModal(false);
    setShowTrialFailForm(false);
  }

  function updateSelected(patch) {
    setRequests((prev) => prev.map((r) => (r.id === selectedId ? { ...r, ...patch } : r)));
  }

  // 1. Chấp nhận Offer -> Mở khóa liên hệ ngay lập tức (Sau khi đồng ý Cam kết 1-Click)
  function acceptOffer() {
    updateSelected({ status: "unlocked_schedule_setup" });
    setShowConsentModal(false);
    setConsentAgreed(false);
    if (filterTab === "pending") {
      setFilterTab("all");
    }
  }

  // Từ chối Offer
  function confirmReject() {
    if (!rejectReason.trim()) return;
    updateSelected({ status: "rejected", rejectReason: rejectReason.trim() });
    setRejecting(false);
    setRejectReason("");
  }

  // 2. Chốt Lịch học chính thức (Buổi 1 tự động là học thử) -> In Trial
  function confirmScheduleSetup() {
    updateSelected({
      status: "in_trial",
      fixedSchedule,
      startDate,
    });
  }

  // 3a. Buổi 1 học thử thành công -> Kích hoạt Lớp chính thức (Pay-Later 30 ngày)
  function activateOfficialClass() {
    updateSelected({
      status: "active_pay_later",
      fixedSchedule,
      activatedAt: new Date().toISOString().split("T")[0],
      feeDueDate: "2026-10-15",
      daysRemaining: 30,
    });
  }

  // 3b. Buổi 1 học thử thất bại / PH Hủy -> Miễn phí 30%, lưu vết
  function confirmTrialFail() {
    updateSelected({
      status: "trial_failed",
      trialFailReason,
      trialFailNote,
    });
    setShowTrialFailForm(false);
  }

  // 4. Gửi minh chứng VietQR -> Waiting Approval
  function submitFeeProof() {
    updateSelected({
      status: "waiting_fee_approval",
      receiptSubmittedAt: new Date().toISOString().split("T")[0],
    });
    setShowQrModal(false);
  }

  // 5. Giả lập Admin xác nhận phí (Demo)
  function demoApproveFee() {
    updateSelected({
      status: "completed_paid",
      feePaidAt: new Date().toISOString().split("T")[0],
    });
  }

  // Filtering
  const filteredRequests = requests.filter((r) => {
    if (filterTab === "pending") return r.status === "pending_offer";
    if (filterTab === "in_trial") return r.status === "unlocked_schedule_setup" || r.status === "unlocked_trial_setup" || r.status === "in_trial";
    if (filterTab === "active") return r.status === "active_pay_later" || r.status === "waiting_fee_approval";
    if (filterTab === "completed") return r.status === "completed_paid" || r.status === "rejected" || r.status === "trial_failed";
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yêu cầu nhận lớp"
        description="Quản lý Match Offer từ Admin. Mở khóa thông tin liên hệ ngay khi nhận lớp và trải nghiệm chính sách thu phí sau 30 ngày dạy."
      />

      {/* Banner giới thiệu chính sách Thu phí sau 1 tháng (PRD Feature Highlight) */}
      <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 p-4 text-emerald-950 shadow-sm dark:border-emerald-900/60 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-slate-900 dark:text-emerald-100">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-sm dark:bg-emerald-500">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                Chính sách Thu Phí Nhận Lớp Sau 30 Ngày (Pay-Later)
              </p>
              <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                Gia sư được <strong>MỞ KHÓA SĐT & Địa chỉ phụ huynh NGAY LẬP TỨC</strong> khi chấp nhận lớp. Phí nhận lớp (30% học phí tháng) được gia hạn nộp trong 30 ngày kể từ ngày kích hoạt lớp chính thức.
              </p>
            </div>
          </div>
          <Badge tone="emerald" className="self-start whitespace-nowrap sm:self-center">
            🔒 Bảo vệ Gia sư 100%
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* CỘT BÊN TRÁI: DANH SÁCH YÊU CẦU LỚP */}
        <div className="lg:col-span-4 space-y-3">
          {/* Tabs Lọc */}
          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: "all", label: "Tất cả", count: requests.length },
              { id: "pending", label: "Offer mới", count: requests.filter((r) => r.status === "pending_offer").length },
              { id: "in_trial", label: "Dạy thử", count: requests.filter((r) => r.status === "unlocked_trial_setup" || r.status === "in_trial").length },
              { id: "active", label: "Đang dạy", count: requests.filter((r) => r.status === "active_pay_later" || r.status === "waiting_fee_approval").length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={clsx(
                  "flex-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition",
                  filterTab === tab.id
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-slate-50"
                    : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                )}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          <Card padded={false} className="divide-y divide-slate-100 overflow-hidden dark:divide-slate-800">
            {filteredRequests.map((r) => {
              const isSelected = selectedId === r.id;
              const meta = statusMeta[r.status] || { label: r.status, tone: "slate" };

              return (
                <button
                  key={r.id}
                  onClick={() => selectRequest(r.id)}
                  className={clsx(
                    "flex w-full items-start gap-3 p-3.5 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    isSelected && "bg-emerald-50/70 border-l-4 border-emerald-500 dark:bg-emerald-950/30"
                  )}
                >
                  <Avatar initials={r.studentName.split(" ").slice(-2).map((w) => w[0]).join("")} size="sm" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">{r.studentName}</p>
                      <Badge tone={meta.tone} className="text-[10px] px-1.5 py-0.5">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-300">{r.subject}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{r.area}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Phí: {r.classFee?.toLocaleString()}đ
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">Không có yêu cầu nhận lớp nào trong mục này 🎉</div>
            )}
          </Card>
        </div>

        {/* CỘT BÊN PHẢI: CHI TIẾT VÀ THAO TÁC XỬ LÝ LỚP */}
        <div className="lg:col-span-8">
          {selected ? (
            <Card className="space-y-6">
              {/* Header Thông tin lớp */}
              <div className="flex flex-col gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">{selected.subject}</h3>
                    <Badge tone={statusMeta[selected.status].tone}>{statusMeta[selected.status].label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Học sinh: <span className="font-semibold text-slate-700 dark:text-slate-200">{selected.studentName}</span> ({selected.studentAge} tuổi) &middot; Phụ huynh: <span className="font-semibold text-slate-700 dark:text-slate-200">{selected.parentName}</span>
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2 text-right dark:bg-emerald-950/40">
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">Phí nhận lớp (30% tháng)</p>
                  <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                    {selected.classFee?.toLocaleString()} VNĐ
                  </p>
                </div>
              </div>

              {/* Progress Stepper 5 bước */}
              {selected.status !== "rejected" && selected.status !== "trial_failed" && (
                <div className="rounded-xl bg-slate-50 p-4 border border-slate-200/60 dark:bg-slate-900/60 dark:border-slate-800">
                  <StatusTrack status={selected.status} />
                </div>
              )}

              {/* Thông số lớp học */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <InfoRow icon={BookOpen} label="Học phí / buổi" value={`${selected.tuitionPerSession?.toLocaleString()} VNĐ`} />
                <InfoRow icon={Calendar} label="Lịch mong muốn" value={selected.desiredSchedule} />
                <InfoRow icon={DollarSign} label="Học phí / tháng" value={`${selected.monthlyTuition?.toLocaleString()} VNĐ`} highlight />
                <InfoRow icon={MapPin} label="Khu vực dạy" value={selected.area} />
                <InfoRow icon={Target} label="Mục tiêu học tập" value={selected.goal} />
                <InfoRow icon={AlertTriangle} label="Yêu cầu đặc biệt" value={selected.specialRequirements || "Không có"} />
              </div>

              {/* THẺ BẢO MẬT & MỞ KHÓA THÔNG TIN LIÊN HỆ PHỤ HUYNH */}
              <div className="rounded-xl border p-4 transition-all">
                {selected.status === "pending_offer" ? (
                  <div className="rounded-lg bg-amber-50/80 p-4 border border-amber-200/70 dark:bg-amber-950/30 dark:border-amber-900/60 space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold text-sm">
                      <Lock size={18} className="text-amber-600 dark:text-amber-400" />
                      Thông tin liên hệ chi tiết đang được Bảo Mật
                    </div>
                    <div className="grid gap-2 text-xs text-amber-900/80 dark:text-amber-200/80 sm:grid-cols-2">
                      <p>SĐT Phụ huynh: <span className="font-mono font-bold tracking-wider">{selected.maskedPhone}</span></p>
                      <p>Địa chỉ cụ thể: <span>{selected.maskedAddress}</span></p>
                    </div>
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 italic">
                      ✨ Nhấn nút <strong>"Chấp nhận Offer & Mở khóa SĐT"</strong> bên dưới để hiển thị SĐT & số nhà đầy đủ ngay lập tức mà không phải thanh toán trước!
                    </p>
                  </div>
                ) : selected.status !== "rejected" && selected.status !== "trial_failed" ? (
                  <div className="rounded-lg bg-emerald-50/90 p-4 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                        <Unlock size={18} className="text-emerald-600 dark:text-emerald-400" />
                        Thông Tin Liên Hệ Phụ Huynh (ĐÃ MỞ KHÓA 🔓)
                      </div>
                      <Badge tone="emerald">Miễn Phí Mở Khóa Trước</Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 text-sm">
                      <div className="flex items-center justify-between rounded-lg bg-white p-3 dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-950">
                        <div>
                          <p className="text-[11px] text-slate-400">Số điện thoại Phụ huynh</p>
                          <p className="font-bold text-emerald-700 dark:text-emerald-300 font-mono text-base">{selected.unmaskedPhone}</p>
                        </div>
                        <div className="flex gap-1">
                          <a
                            href={`tel:${selected.unmaskedPhone}`}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                            title="Gọi ngay"
                          >
                            <Phone size={14} />
                          </a>
                          <a
                            href={`https://zalo.me/${selected.unmaskedPhone?.replace(/\s/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-bold"
                            title="Zalo"
                          >
                            Zalo
                          </a>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white p-3 dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-950">
                        <p className="text-[11px] text-slate-400">Địa chỉ cụ thể dạy học</p>
                        <p className="font-medium text-slate-800 dark:text-slate-200 text-xs mt-0.5">{selected.unmaskedAddress}</p>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* ACTION PANELS THEO TRẠNG THÁI CỦA YÊU CẦU */}

              {/* 1. Trạng thái: PENDING_OFFER */}
              {selected.status === "pending_offer" && !rejecting && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-600/25 border-none px-6 py-3 rounded-xl transition-all transform active:scale-95"
                    onClick={() => setShowConsentModal(true)}
                  >
                    <Check size={20} className="stroke-[3]" /> Chấp Nhận Offer & Mở Khóa SĐT Ngay
                  </Button>
                  <Button variant="danger" size="md" className="rounded-xl px-4 py-3 font-semibold" onClick={() => setRejecting(true)}>
                    <X size={16} /> Từ Chối Offer
                  </Button>
                </div>
              )}

              {/* Modal Từ chối Offer */}
              {selected.status === "pending_offer" && rejecting && (
                <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-4 dark:border-rose-900/60 dark:bg-rose-950/30 space-y-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                    Lý do từ chối nhận lớp
                  </label>
                  <textarea
                    rows={3}
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Lịch mong muốn trùng lịch dạy hiện tại của tôi..."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-900"
                  />
                  <div className="flex items-center gap-2">
                    <Button variant="danger" size="sm" disabled={!rejectReason.trim()} onClick={confirmReject}>
                      <X size={14} /> Xác Nhận Từ Chối
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              {/* 2. Trạng thái: UNLOCKED_SCHEDULE_SETUP (Đã mở khóa SĐT, chọn Lịch học chính thức) */}
              {(selected.status === "unlocked_schedule_setup" || selected.status === "unlocked_trial_setup") && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/30 space-y-4">
                  {/* Banner Tự động Thêm Học Sinh */}
                  <div className="rounded-lg bg-emerald-100/80 p-3 border border-emerald-200/80 dark:bg-emerald-950/60 dark:border-emerald-900 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <UserCheck size={18} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>
                        Học sinh <strong>{selected.studentName}</strong> đã được tự động thêm vào <strong>Danh sách học sinh của tôi</strong>.
                      </span>
                    </div>
                    <Link
                      to="/tutor/students"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 whitespace-nowrap"
                    >
                      Xem danh sách <ChevronRight size={14} />
                    </Link>
                  </div>

                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200 font-bold text-sm">
                    <Calendar size={18} className="text-blue-600 dark:text-blue-400" />
                    Bước 2: Gọi Điện Phụ Huynh &amp; Chốt Lịch Học Chính Thức
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Lịch học cố định hàng tuần
                      </label>
                      <input
                        type="text"
                        value={fixedSchedule}
                        onChange={(e) => setFixedSchedule(e.target.value)}
                        placeholder="Ví dụ: Thứ 3 &amp; Thứ 5 (19:00 - 20:30)"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
                        Ngày bắt đầu học (Buổi 1 học thử)
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  <Button variant="primary" size="md" onClick={confirmScheduleSetup}>
                    <Check size={16} /> Chốt Lịch Học
                  </Button>
                </div>
              )}

              {/* 3. Trạng thái: IN_TRIAL (Đang học - Buổi 1 học thử & Telegram Notification Mockup) */}
              {selected.status === "in_trial" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-violet-200 bg-violet-50/60 p-4 dark:border-violet-900/60 dark:bg-violet-950/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-violet-900 dark:text-violet-200 font-bold text-sm">
                        <Clock size={18} className="text-violet-600 dark:text-violet-400" />
                        Bước 3: Lớp Đang Học (Buổi 1 Học Thử)
                      </div>
                      <Badge tone="violet">Lịch học: {selected.fixedSchedule || fixedSchedule}</Badge>
                    </div>

                    <div className="rounded-lg bg-white p-3 dark:bg-slate-900 border border-violet-100 dark:border-violet-900/50 space-y-1 text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        📅 Ngày dạy buổi 1: <span className="text-violet-600 dark:text-violet-400 font-bold">{selected.startDate || selected.trialDate || startDate}</span>
                      </p>
                      <p className="text-slate-600 dark:text-slate-400">
                        Buổi 1 là buổi học thử chính thức. Sau khi hoàn thành buổi học, gia sư có thể bấm nút xác nhận bên dưới hoặc tương tác 1 chạm qua thông báo Telegram Bot tự động.
                      </p>
                    </div>

                    {/* TELEGRAM BOT PUSH NOTIFICATION SIMULATION CARD */}
                    <div className="rounded-xl border border-sky-300 bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 p-4 shadow-sm dark:border-sky-900/80 dark:from-slate-900 dark:via-sky-950/40 dark:to-slate-900 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-500 text-white shadow-sm">
                            <Send size={14} className="-ml-0.5" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1.5">
                              Telegram Push Bot Notification <Badge tone="blue" className="text-[9px]">Demo Interactive Push</Badge>
                            </p>
                            <p className="text-[10px] text-sky-700 dark:text-sky-300">Tự động kích hoạt lúc 21:00 tối ngày dạy Buổi 1</p>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg bg-white/90 p-3 text-xs text-slate-700 dark:bg-slate-900/90 dark:text-slate-200 border border-sky-100 dark:border-sky-900/50 space-y-1">
                        <p className="font-bold text-sky-900 dark:text-sky-300">
                          🔔 [TUTOR BOT] Hôm nay bạn vừa dạy xong Buổi 1 lớp {selected.subject}!
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          Hãy chọn phản hồi nhanh bên dưới để cập nhật trạng thái lớp:
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 pt-1">
                        <Button
                          variant="primary"
                          size="md"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md shadow-emerald-600/20 border-none"
                          onClick={activateOfficialClass}
                        >
                          <ThumbsUp size={16} /> 👍 Buổi 1 Thành Công ➔ Kích Hoạt Hạn Phí 30 Ngày
                        </Button>
                        <Button
                          variant="outline"
                          size="md"
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40 font-semibold"
                          onClick={() => setShowTrialFailForm(true)}
                        >
                          <XCircle size={16} /> ⚠️ Buổi 1 Thất Bại / PH Hủy Lớp
                        </Button>
                      </div>
                    </div>

                    {/* Modal/Form Khai báo Buổi 1 Thất bại */}
                    {showTrialFailForm && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50/80 p-4 dark:border-rose-900/70 dark:bg-rose-950/40 space-y-3">
                        <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
                          <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />
                          Khai báo Buổi 1 Không Thành Công (Miễn 100% Phí 30%)
                        </div>
                        <p className="text-xs text-rose-800/90 dark:text-rose-300/90">
                          Hệ thống sẽ ghi nhận lý do và hủy nghĩa vụ đóng phí nhận lớp này cho bạn. Admin sẽ hỗ trợ ưu tiên ghép lớp mới phù hợp hơn.
                        </p>

                        <div className="space-y-2">
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Vui lòng chọn lý do chính:
                          </label>
                          <select
                            value={trialFailReason}
                            onChange={(e) => setTrialFailReason(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-900"
                          >
                            <option value="ph_change_mind">Phụ huynh đổi ý / Thay đổi kế hoạch học tập</option>
                            <option value="not_matching_style">Học sinh không phù hợp phương pháp giảng dạy</option>
                            <option value="schedule_conflict">Lịch dạy thực tế phát sinh trùng khớp lịch khác</option>
                            <option value="tuition_issue">Vấn đề thỏa thuận học phí với phụ huynh</option>
                            <option value="other">Lý do khác</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Ghi chú bổ sung cho Admin (nếu có):
                          </label>
                          <textarea
                            rows={2}
                            value={trialFailNote}
                            onChange={(e) => setTrialFailNote(e.target.value)}
                            placeholder="Mô tả chi tiết để Admin hỗ trợ ghép lớp mới..."
                            className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-rose-400 dark:border-slate-800 dark:bg-slate-900"
                          />
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="danger" size="sm" onClick={confirmTrialFail}>
                            <Check size={14} /> Xác Nhận Khai Báo Hủy Lớp
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => setShowTrialFailForm(false)}>
                            Đóng
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Trạng thái: ACTIVE_PAY_LATER (Lớp chính thức active, hạn nộp phí 30 ngày) */}
              {selected.status === "active_pay_later" && (
                <div className="space-y-4">
                  {/* Alert lớp hoạt động */}
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/80 dark:bg-emerald-950/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                        <CheckCircle2 size={20} className="text-emerald-600 dark:text-emerald-400" />
                        Lớp Học Đang Hoạt Động Chính Thức (ACTIVE)
                      </div>
                      <Badge tone="emerald">Lịch dạy: {selected.fixedSchedule}</Badge>
                    </div>

                    {/* Widget Đếm ngược Hạn nộp phí nhận lớp 30 ngày */}
                    <div className="rounded-lg bg-white p-3.5 dark:bg-slate-900 shadow-sm border border-emerald-100 dark:border-emerald-900/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nghĩa vụ phí nhận lớp (30%)</span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            ⏳ Còn {selected.daysRemaining || 18} ngày hạn nộp
                          </span>
                        </div>
                        <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {selected.classFee?.toLocaleString()} VNĐ
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Hạn nộp phí: <span className="font-semibold text-slate-700 dark:text-slate-300">{selected.feeDueDate || "15/10/2026"}</span> (Được trải nghiệm 30 ngày trước khi thanh toán).
                        </p>
                      </div>

                      <Button variant="primary" onClick={() => setShowQrModal(true)}>
                        <QrCode size={16} /> Thanh Toán VietQR Ngay
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Trạng thái: WAITING_FEE_APPROVAL (Đã nộp biên lai, chờ Admin duyệt) */}
              {selected.status === "waiting_fee_approval" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900/60 dark:bg-amber-950/30 space-y-4">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-bold text-sm">
                    <Clock size={18} className="text-amber-600 dark:text-amber-400" />
                    Đã Nộp Biên Lai VietQR - Đang Chờ Admin Xác Nhận
                  </div>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/80">
                    Cảm ơn bạn đã nộp minh chứng chuyển khoản số tiền <strong>{selected.classFee?.toLocaleString()} VNĐ</strong>. Ban quản trị trung tâm sẽ đối soát sao kê và cập nhật trạng thái trong thời gian sớm nhất.
                  </p>

                  {/* Demo Fast-forward Button */}
                  <div className="rounded-lg bg-white p-3 border border-amber-200 dark:bg-slate-900 dark:border-amber-900/40 flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-800 dark:text-amber-300">
                      ⚡ [Kiểm thử Demo] Giả lập Admin xác nhận tiền về ngay:
                    </span>
                    <Button variant="primary" size="sm" onClick={demoApproveFee}>
                      <CheckCircle2 size={14} /> Admin Xác Nhận Duyệt Phí
                    </Button>
                  </div>
                </div>
              )}

              {/* 6. Trạng thái: COMPLETED_PAID (Đã hoàn tất nghĩa vụ tài chính) */}
              {selected.status === "completed_paid" && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-bold text-sm">
                    <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                    Lớp Học Đã Hoàn Tất Nghĩa Vụ Tài Chính Phí Nhận Lớp
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300">
                    Bạn đã hoàn thành thanh toán khoản phí nhận lớp <strong>{selected.classFee?.toLocaleString()} VNĐ</strong>. Chúc bạn và học sinh có lộ trình học tập hiệu quả!
                  </p>
                </div>
              )}

              {/* Trạng thái: TRIAL_FAILED (Buổi 1 không thành công) */}
              {selected.status === "trial_failed" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-4 dark:border-rose-900/60 dark:bg-rose-950/30 space-y-2">
                  <div className="flex items-center gap-2 text-rose-900 dark:text-rose-200 font-bold text-sm">
                    <XCircle size={18} className="text-rose-600 dark:text-rose-400" />
                    Lớp Học Đã Hủy Sau Buổi 1 (Miễn 100% Phí Giới Thiệu)
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    <strong>Lý do khai báo:</strong> {selected.trialFailReason === "ph_change_mind" ? "Phụ huynh đổi ý / Thay đổi kế hoạch" : selected.trialFailReason || "Phụ huynh hủy sau buổi học thử."}
                  </p>
                  {selected.trialFailNote && (
                    <p className="text-xs text-slate-500 italic">Ghi chú: "{selected.trialFailNote}"</p>
                  )}
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold pt-1">
                    💚 Hệ thống đã tự động miễn phí 30% cho lớp này. Ban quản trị sẽ sớm liên hệ gợi ý danh sách lớp mới cho bạn!
                  </p>
                </div>
              )}

              {/* Trạng thái: REJECTED */}
              {selected.status === "rejected" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-4 dark:border-rose-900/60 dark:bg-rose-950/30 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">Lý do đã từ chối nhận lớp</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{selected.rejectReason || "Không phù hợp với lịch dạy."}</p>
                </div>
              )}
            </Card>
          ) : (
            <Card className="flex items-center justify-center py-16 text-sm text-slate-400">Chọn một yêu cầu nhận lớp bên trái</Card>
          )}
        </div>
      </div>

      {/* MODAL CAM KẾT 1-CLICK Ở BƯỚC 1 (SMART CONSENT MODAL) */}
      {showConsentModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-base">Cam Kết Điều Khoản Nhận Lớp (Post-Paid)</h4>
              </div>
              <button onClick={() => setShowConsentModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Bằng việc chấp nhận nhận lớp <span className="text-emerald-600 dark:text-emerald-400 font-bold">{selected.subject}</span> ({selected.studentName}), bạn đồng ý với các cam kết sau:
              </p>

              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-slate-800/60 space-y-2 border border-slate-100 dark:border-slate-800 text-[11px]">
                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <span><strong>Mở khóa 100% SĐT & Địa chỉ:</strong> Được hiển thị thông tin liên hệ phụ huynh ngay lập tức mà chưa cần đóng phí.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <span><strong>Hạn nộp phí 30 ngày:</strong> Phí nhận lớp (30% học phí tháng đầu) sẽ được tính từ ngày kích hoạt lớp chính thức.</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check size={14} className="mt-0.5 text-emerald-600 shrink-0" />
                  <span><strong>Miễn phí khi buổi 1 thất bại:</strong> Nếu Phụ huynh hủy sau buổi 1, bạn được miễn 100% phí khi khai báo trên hệ thống.</span>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentAgreed}
                  onChange={(e) => setConsentAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">
                  Tôi đã đọc, hiểu rõ và cam kết thực hiện đúng nghĩa vụ phí giới thiệu theo chính sách Post-paid.
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button variant="ghost" size="sm" onClick={() => setShowConsentModal(false)}>
                Hủy
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!consentAgreed}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                onClick={acceptOffer}
              >
                <Unlock size={16} /> Đồng Ý &amp; Mở Khóa SĐT Ngay
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THANH TOÁN VIETQR PENDING FEE */}
      {showQrModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 space-y-5 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <QrCode className="text-emerald-600 dark:text-emerald-400" size={20} />
                <h4 className="font-bold text-slate-900 dark:text-slate-50 text-base">Mã VietQR Thanh Toán Phí Nhận Lớp</h4>
              </div>
              <button onClick={() => setShowQrModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 items-center">
              {/* QR Image Simulation */}
              <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <img
                  src={`https://img.vietqr.io/image/MB-99998888666-compact2.png?amount=${selected.classFee}&addInfo=PHINHANLOP%20${selected.id}&accountName=TRUNG%20TAM%20GIA%20SU%20ENGLISH%20TUTOR`}
                  alt="Mã VietQR Nộp Phí Nhận Lớp"
                  className="h-44 w-44 rounded-lg object-contain bg-white p-2 shadow-sm"
                  onError={(e) => {
                    // Fallback placeholder nếu không có mạng
                    e.target.onerror = null;
                    e.target.src = "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=VIETQR_PAYMENT_ENGLISH_TUTOR";
                  }}
                />
                <span className="mt-2 text-[11px] font-semibold text-slate-500">Mở app Ngân hàng để Quét QR</span>
              </div>

              {/* Thông tin Chuyển khoản */}
              <div className="space-y-2.5 text-xs">
                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Ngân hàng</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">MBBank (Quân Đội)</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Số tài khoản</p>
                  <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">9999 8888 666</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Chủ tài khoản</p>
                  <p className="font-bold text-slate-800 dark:text-slate-100">TRUNG TAM GIA SU ENGLISH TUTOR</p>
                </div>

                <div className="rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-950/40">
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Số tiền phí 30%</p>
                  <p className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base">{selected.classFee?.toLocaleString()} VNĐ</p>
                </div>

                <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Nội dung chuyển khoản</p>
                  <p className="font-mono font-bold text-blue-600 dark:text-blue-400">PHINHANLOP {selected.id?.toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Upload Minh Chứng Biên Lai */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Tải ảnh biên lai chuyển khoản thành công (QR proof)
              </label>
              <div
                onClick={() => setReceiptUploaded(true)}
                className={clsx(
                  "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition",
                  receiptUploaded
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30"
                    : "border-slate-300 hover:border-emerald-400 dark:border-slate-700"
                )}
              >
                {receiptUploaded ? (
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                    <CheckCircle2 size={18} /> Đã tải lên ảnh biên lai minh chứng (File: bien_lai_vietqr.png)
                  </div>
                ) : (
                  <>
                    <UploadCloud size={24} className="text-slate-400" />
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 font-medium">Bấm để chọn hoặc kéo thả ảnh biên lai vào đây</p>
                    <p className="text-[10px] text-slate-400">Định dạng JPG, PNG, tối đa 5MB</p>
                  </>
                )}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" size="sm" onClick={() => setShowQrModal(false)}>
                Đóng
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={submitFeeProof}>
                  <FileCheck size={14} /> Gửi Minh Chứng Chuyển Khoản
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

