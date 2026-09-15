import { useState } from "react";
import {
  ClipboardList,
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Calculator,
  Send,
  Calendar,
  MapPin,
  Phone,
  MessageCircle,
  ArrowRight,
  AlertCircle,
  X,
  Zap,
  Trash2,
  Timer,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Avatar from "../../components/ui/Avatar";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const statusMeta = {
  pending: { label: "Chờ xử lý", tone: "amber" },
  offered: { label: "Đã gửi đề nghị", tone: "blue" },
  matched: { label: "Đã ghép thành công", tone: "emerald" },
  cancelled: { label: "Đã hủy", tone: "slate" },
};

const levelTone = {
  A1: "slate",
  A2: "slate",
  B1: "blue",
  B2: "blue",
  C1: "blue",
  C2: "blue",
};

const fmtVND = (n) => (n ? Number(n).toLocaleString("vi-VN") + "₫" : "0₫");

function formatTs(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

function getDaysRemaining(cancelledAt) {
  if (!cancelledAt) return null;
  const cancelDate = new Date(cancelledAt);
  const deleteDate = new Date(cancelDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = deleteDate - now;
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function MatchRequests() {
  const {
    matchRequestList,
    createMatchOffer,
    updateMatchRequest,
    cancelMatchOffer,
    tutorList,
  } = useAuth();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State for Creating Match Offer
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [customFeeRate, setCustomFeeRate] = useState(0.15); // 15%
  const [adminNote, setAdminNote] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  // ConfirmModal states
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "blue",
    onConfirm: null,
  });

  // Success popup after match offer confirmation
  const [successPopup, setSuccessPopup] = useState(null);

  const activeTutors = tutorList.filter((t) => t.status === "active");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  // Filtered requests (removed modeFilter)
  const filtered = matchRequestList.filter((r) => {
    const matchSearch =
      r.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.parentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.targetGoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.location && r.location.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchStatus = statusFilter === "all" || r.status === statusFilter;

    return matchSearch && matchStatus;
  });

  // Calculate stats
  const totalCount = matchRequestList.length;
  const pendingCount = matchRequestList.filter((r) => r.status === "pending").length;
  const offeredCount = matchRequestList.filter((r) => r.status === "offered").length;
  const matchedCount = matchRequestList.filter((r) => r.status === "matched").length;

  // Open Match Offer Modal
  const handleOpenOfferModal = (req) => {
    setSelectedRequest(req);
    // Pre-select top suggested tutor if available
    if (req.suggestedTutors && req.suggestedTutors.length > 0) {
      setSelectedTutorId(req.suggestedTutors[0].tutorId);
    } else if (activeTutors.length > 0) {
      setSelectedTutorId(activeTutors[0].id);
    } else {
      setSelectedTutorId("");
    }
    setCustomFeeRate(req.platformFeeRate || 0.15);
    setAdminNote(`Trung tâm xin gửi đề nghị nhận lớp học viên ${req.studentName} (${req.grade}) - Mục tiêu: ${req.targetGoal}`);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
    setSelectedTutorId("");
    setAdminNote("");
  };

  // Submit Match Offer — with intermediate confirmation step
  const handleConfirmOffer = () => {
    if (!selectedRequest || !selectedTutorId) return;

    const chosenTutor = tutorList.find((t) => t.id === selectedTutorId);
    if (!chosenTutor) return;

    const isChangingTutor = selectedRequest.status === "offered" && selectedRequest.matchedTutorName;
    const previousTutorName = selectedRequest.matchedTutorName;

    setConfirmModal({
      open: true,
      title: isChangingTutor ? "Xác nhận thay đổi gia sư" : "Xác nhận ghép lớp",
      message: isChangingTutor
        ? `Bạn chắc chắn xác nhận thay đổi gia sư ${previousTutorName} thành gia sư ${chosenTutor.name} chứ?`
        : `Bạn chắc chắn xác nhận match học sinh ${selectedRequest.studentName} với gia sư ${chosenTutor.name} chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: () => {
        // Tính phí tự động: (Số buổi/tuần * 4 tuần) * Đơn giá/buổi * Tỷ lệ phí
        const monthlySessions = (selectedRequest.sessionsPerWeek || 3) * 4;
        const totalTuition = monthlySessions * (selectedRequest.budgetPerSession || 250000);
        const calculatedFee = Math.round(totalTuition * customFeeRate);

        createMatchOffer(selectedRequest.id, chosenTutor.id, chosenTutor.name, calculatedFee);

        closeConfirmModal();
        handleCloseModal();

        // Show success popup
        setSuccessPopup(
          isChangingTutor
            ? `Hệ thống đã gửi thông báo hủy đề nghị tới gia sư ${previousTutorName} và lời đề nghị tới gia sư ${chosenTutor.name}.`
            : `Hệ thống sẽ gửi đề nghị tới gia sư ${chosenTutor.name}.`
        );
      },
    });
  };

  // Cancel request with ConfirmModal
  const handleCancelRequest = (reqId, studentName) => {
    setConfirmModal({
      open: true,
      title: "Hủy yêu cầu ghép lớp",
      message: `Bạn chắc chắn muốn hủy yêu cầu ghép lớp của học sinh ${studentName}?`,
      confirmLabel: "Đồng ý hủy",
      confirmTone: "rose",
      onConfirm: () => {
        updateMatchRequest(reqId, { status: "cancelled", cancelledAt: new Date().toISOString() });
        showToast(`Đã chuyển yêu cầu của ${studentName} sang trạng thái Hủy.`);
        closeConfirmModal();
      },
    });
  };

  // Cancel offer with ConfirmModal (new — for "offered" status)
  const handleCancelOffer = (req) => {
    setConfirmModal({
      open: true,
      title: "Hủy đề nghị ghép lớp",
      message: `Bạn chắc chắn muốn hủy đề nghị đã gửi tới gia sư ${req.matchedTutorName}? Thông tin thanh toán liên quan cũng sẽ bị xóa.`,
      confirmLabel: "Đồng ý hủy",
      confirmTone: "rose",
      onConfirm: () => {
        cancelMatchOffer(req.id);
        showToast(`Đã hủy đề nghị tới gia sư ${req.matchedTutorName}. Dữ liệu thanh toán liên quan đã được xóa.`);
        closeConfirmModal();
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl transition-all dark:border-blue-900 dark:bg-slate-900">
          <CheckCircle2 size={18} className="text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Success Popup Modal */}
      <ConfirmModal
        open={!!successPopup}
        title="Thao tác thành công"
        message={successPopup || ""}
        confirmLabel="Đã hiểu"
        cancelLabel=""
        confirmTone="emerald"
        icon={CheckCircle2}
        onConfirm={() => setSuccessPopup(null)}
        onCancel={() => setSuccessPopup(null)}
      />

      {/* ConfirmModal for all actions */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Page Header */}
      <PageHeader
        title="Quản lý yêu cầu ghép lớp"
        description="Tiếp nhận Match Request từ Phụ huynh, phân tích độ phù hợp với AI và tạo Match Offer cho Gia sư (FR-16)."
      />

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ClipboardList}
          label="Tổng yêu cầu tiếp nhận"
          value={totalCount}
          hint="Toàn bộ lịch sử"
          tone="blue"
        />
        <StatCard
          icon={Clock}
          label="Chờ xử lý ghép lớp"
          value={pendingCount}
          hint="Cần tạo đề nghị"
          tone="amber"
        />
        <StatCard
          icon={Send}
          label="Đang gửi đề nghị"
          value={offeredCount}
          hint="Chờ gia sư phản hồi"
          tone="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ghép lớp thành công"
          value={matchedCount}
          hint="Đã kết nối gia sư"
          tone="emerald"
        />
      </div>

      {/* Filters & Search Toolbar — removed mode filter */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả" },
              { key: "pending", label: "Chờ xử lý", count: pendingCount },
              { key: "offered", label: "Đã gửi đề nghị", count: offeredCount },
              { key: "matched", label: "Đã ghép thành công", count: matchedCount },
              { key: "cancelled", label: "Đã hủy" },
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

          {/* Search — removed mode filter dropdown */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm học sinh, phụ huynh..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Match Requests List */}
      <div className="space-y-4">
        {filtered.map((req, idx) => {
          const meta = statusMeta[req.status] || { label: req.status, tone: "neutral" };
          const monthlyEstimate = (req.sessionsPerWeek || 3) * 4 * (req.budgetPerSession || 250000);
          const platformFeeEstimate = req.matchOfferFee || Math.round(monthlyEstimate * (req.platformFeeRate || 0.15));
          const daysRemaining = req.status === "cancelled" ? getDaysRemaining(req.cancelledAt) : null;

          return (
            <div
              key={req.id}
              style={{ animationDelay: `${idx * 50}ms` }}
              className="fade-slide-in rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                {/* Left: Student & Parent Info */}
                <div className="space-y-3 lg:max-w-xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                      {req.studentName}
                    </h3>
                    <Badge tone={levelTone[req.currentLevel] || "blue"}>
                      Trình độ {req.currentLevel}
                    </Badge>
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                      {req.grade}
                    </span>
                    <Badge tone={meta.tone}>{meta.label}</Badge>
                  </div>

                  {/* Target Goal */}
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Mục tiêu: </span>
                    {req.targetGoal}
                  </p>

                  {/* Schedule & Location Details — removed learningModeLabel */}
                  <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-400 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500 shrink-0" />
                      <span>{req.preferredSchedule}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <span>{req.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <span>
                        PH: {req.parentName} &bull; {req.parentPhone}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MessageCircle size={14} className="text-sky-500 shrink-0" />
                      <span>Telegram: {req.parentTelegram}</span>
                    </div>
                  </div>

                  {/* Notes from parent */}
                  {req.notes && (
                    <div className="rounded-lg bg-slate-50 p-2.5 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                      <span className="font-medium text-slate-700 dark:text-slate-200">Ghi chú từ phụ huynh: </span>
                      {req.notes}
                    </div>
                  )}

                  {/* Matched Tutor Status if already offered or matched */}
                  {(req.status === "offered" || req.status === "matched") && req.matchedTutorName && (
                    <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50/70 p-2.5 text-xs text-blue-800 dark:border-blue-900/40 dark:bg-blue-950/40 dark:text-blue-200">
                      <UserCheck size={16} className="text-blue-600 dark:text-blue-400 shrink-0" />
                      <div>
                        Gia sư tiếp nhận: <span className="font-semibold">{req.matchedTutorName}</span>
                        {req.offeredAt && (
                          <span className="text-[11px] text-blue-600/80 dark:text-blue-300/80 ml-2">
                            (Gửi lúc: {formatTs(req.offeredAt)})
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Countdown for cancelled items */}
                  {req.status === "cancelled" && daysRemaining !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400">
                      <Timer size={14} className="text-slate-400 shrink-0" />
                      <span>
                        {daysRemaining > 0
                          ? `Tự động xóa sau ${daysRemaining} ngày`
                          : "Sẽ được xóa trong đợt dọn dẹp tiếp theo"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Fee Calculation & Action Box */}
                <div className="flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40 lg:w-72 shrink-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Ngân sách / buổi:</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {fmtVND(req.budgetPerSession)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-500 dark:text-slate-400">Số buổi dự kiến:</span>
                      <span className="text-slate-700 dark:text-slate-200">
                        {req.sessionsPerWeek} buổi/tuần (≈{req.sessionsPerWeek * 4}b/tháng)
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2 dark:border-slate-700">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Phí kết nối trung tâm:
                      </span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {fmtVND(platformFeeEstimate)}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Tự động tính: 15% học phí tháng đầu khi gia sư nhận lớp
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-2 border-t border-slate-200/80 dark:border-slate-700 flex flex-col gap-2">
                    {req.status === "pending" && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenOfferModal(req)}
                        className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Zap size={14} /> Tạo Match Offer
                      </Button>
                    )}

                    {req.status === "offered" && (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleOpenOfferModal(req)}
                          className="w-full justify-center text-blue-600 hover:text-blue-700"
                        >
                          <UserCheck size={14} /> Thay đổi gia sư
                        </Button>
                        <button
                          onClick={() => handleCancelOffer(req)}
                          className="text-center text-[11px] text-slate-400 hover:text-rose-500 transition"
                        >
                          Hủy đề nghị
                        </button>
                      </>
                    )}

                    {req.status === "pending" && (
                      <button
                        onClick={() => handleCancelRequest(req.id, req.studentName)}
                        className="text-center text-[11px] text-slate-400 hover:text-rose-500 transition"
                      >
                        Hủy yêu cầu
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Matching Recommendations (Bottom bar of card) */}
              {req.suggestedTutors && req.suggestedTutors.length > 0 && req.status === "pending" && (
                <div className="mt-4 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Sparkles size={14} />
                    <span>Gia sư AI gợi ý phù hợp nhất:</span>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {req.suggestedTutors.map((sug) => {
                      const tutorDetail = tutorList.find((t) => t.id === sug.tutorId);
                      return (
                        <div
                          key={sug.tutorId}
                          className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/30 dark:hover:bg-slate-800/60"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar initials={tutorDetail?.initials || "GS"} size="sm" />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {sug.tutorName}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{sug.reason}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 dark:bg-blue-950 dark:text-blue-300">
                              {sug.matchScore}%
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                handleOpenOfferModal(req);
                                setSelectedTutorId(sug.tutorId);
                              }}
                              className="h-7 text-xs px-2"
                            >
                              Chọn
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 p-12 text-center dark:border-slate-800">
            <ClipboardList size={36} className="text-slate-300 dark:text-slate-600" />
            <h4 className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
              Không tìm thấy yêu cầu ghép lớp
            </h4>
            <p className="mt-1 text-xs text-slate-400">
              Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </div>
        )}
      </div>

      {/* Modal: Create Match Offer (FR-16) */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Tạo đề nghị ghép lớp (Match Offer)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gửi lời mời nhận lớp kèm tính phí trung tâm tự động tới gia sư được chọn.
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Summary of Request */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-xs dark:border-blue-900/40 dark:bg-blue-950/30">
                <p className="font-semibold text-blue-900 dark:text-blue-200">
                  Học sinh: {selectedRequest.studentName} &bull; {selectedRequest.grade} (Trình độ {selectedRequest.currentLevel})
                </p>
                <p className="mt-1 text-blue-800 dark:text-blue-300">
                  Mục tiêu: {selectedRequest.targetGoal}
                </p>
                <p className="mt-1 text-slate-600 dark:text-slate-400">
                  Lịch học: {selectedRequest.preferredSchedule} &bull; Địa điểm: {selectedRequest.location}
                </p>
              </div>

              {/* Step 1: Choose Tutor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-2">
                  1. Chọn gia sư phù hợp
                </label>
                <div className="grid gap-2 max-h-52 overflow-y-auto pr-1">
                  {activeTutors.map((t) => {
                    const isSelected = selectedTutorId === t.id;
                    const suggestion = selectedRequest.suggestedTutors?.find(
                      (s) => s.tutorId === t.id
                    );

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTutorId(t.id)}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition ${
                          isSelected
                            ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-950/40"
                            : "border-slate-200 hover:border-blue-200 dark:border-slate-800 dark:hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar initials={t.initials} size="sm" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {t.name}
                              </p>
                              {suggestion && (
                                <Badge tone="blue">
                                  {suggestion.matchScore}% Match
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">
                              {t.specialization.slice(0, 2).join(", ")} &bull; Học phí: {t.ratePerHour}/buổi
                            </p>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="tutor_select"
                          checked={isSelected}
                          onChange={() => setSelectedTutorId(t.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Auto-calculate Platform Fee */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator size={16} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      2. Tính phí tự động (Platform Fee)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span>Tỷ lệ phí:</span>
                    <select
                      value={customFeeRate}
                      onChange={(e) => setCustomFeeRate(parseFloat(e.target.value))}
                      className="rounded border border-slate-300 bg-white px-2 py-0.5 text-xs dark:border-slate-700 dark:bg-slate-900"
                    >
                      <option value={0.1}>10%</option>
                      <option value={0.15}>15% (Mặc định)</option>
                      <option value={0.2}>20%</option>
                    </select>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                    <p className="text-slate-400">Đơn giá / buổi</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {fmtVND(selectedRequest.budgetPerSession)}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white p-2 dark:bg-slate-900">
                    <p className="text-slate-400">Tổng buổi tháng</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-100">
                      {(selectedRequest.sessionsPerWeek || 3) * 4} buổi
                    </p>
                  </div>
                  <div className="rounded-lg bg-blue-100/70 p-2 dark:bg-blue-900/40">
                    <p className="text-blue-700 dark:text-blue-300">Phí kết nối nộp</p>
                    <p className="font-bold text-blue-700 dark:text-blue-300">
                      {fmtVND(
                        Math.round(
                          (selectedRequest.sessionsPerWeek || 3) *
                            4 *
                            (selectedRequest.budgetPerSession || 250000) *
                            customFeeRate
                        )
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3: Message to Tutor */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-1.5">
                  3. Lời nhắn gửi Gia sư
                </label>
                <textarea
                  rows={2}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900"
                  placeholder="Nhập thông tin trao đổi bổ sung..."
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={handleCloseModal}>
                Hủy bỏ
              </Button>
              <Button
                size="sm"
                onClick={handleConfirmOffer}
                disabled={!selectedTutorId}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Send size={14} /> Xác nhận & Gửi Match Offer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchRequests;
