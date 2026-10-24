import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  AlertCircle,
  X,
  PlusCircle,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Sparkles,
  Info,
  Loader2,
  Send,
  Eye,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  apiGetMatchRequests,
  apiGetMatchRequestCounts,
  apiCreateMatchRequest,
  apiConfirmMatchRequest,
  apiCompleteMatchRequest,
  apiCancelMatchRequest,
  apiGetMatchRequestDetail,
} from "../../lib/matchRequestApi";
import { apiGetPublicTutors } from "../../lib/tutorApi";

const statusMeta = {
  PENDING: { label: "Chờ xử lý", tone: "amber", icon: Clock },
  TRIAL: { label: "Đang dạy thử", tone: "blue", icon: BookOpen },
  MATCHED: { label: "Ghép thành công", tone: "emerald", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", tone: "slate", icon: XCircle },
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

const INITIAL_CREATE_FORM = {
  parentName: "",
  phone: "",
  studentName: "",
  grade: "Lớp 10",
  school: "",
  tutorId: "",
  className: "Tiếng Anh học thử 1 kèm 1",
  sessionsPerWeek: 2,
  durationMinutes: 90,
  teachingMode: "ONLINE",
  pricePerSession: 250000,
  preferredSchedule: "Thứ 2 - 4 - 6 (19:30 - 21:00)",
  notes: "",
};

export function MatchRequests() {
  const { token, session, tutorList: mockTutorList } = useAuth();
  const currentToken = token || session?.token;

  // Data states
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, trial: 0, matched: 0, cancelled: 0, total: 0 });
  const [activeTutors, setActiveTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Search states
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createFormData, setCreateFormData] = useState(INITIAL_CREATE_FORM);
  const [createFormError, setCreateFormError] = useState("");

  const [detailModalItem, setDetailModalItem] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "blue",
    onConfirm: null,
  });

  // Success Toast & Popup
  const [toastMessage, setToastMessage] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  // Load Active Tutors for Selection Dropdown
  useEffect(() => {
    async function loadTutors() {
      try {
        const res = await apiGetPublicTutors({ page: 0, size: 100 });
        if (res && res.items && res.items.length > 0) {
          setActiveTutors(res.items);
        } else if (mockTutorList && mockTutorList.length > 0) {
          setActiveTutors(mockTutorList.filter((t) => t.status === "active"));
        }
      } catch {
        if (mockTutorList && mockTutorList.length > 0) {
          setActiveTutors(mockTutorList.filter((t) => t.status === "active"));
        }
      }
    }
    loadTutors();
  }, [mockTutorList]);

  // Load Requests & Counts
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countsRes] = await Promise.all([
        apiGetMatchRequests({
          tab: statusFilter,
          keyword: searchQuery,
          page,
          size: 20,
          token: currentToken,
        }),
        apiGetMatchRequestCounts(currentToken).catch(() => ({
          pending: 0,
          trial: 0,
          matched: 0,
          cancelled: 0,
          total: 0,
        })),
      ]);

      setRequests(listRes.items || []);
      setTotalPages(listRes.totalPages || 1);
      if (countsRes) {
        setCounts(countsRes);
        window.dispatchEvent(new CustomEvent("match-requests-updated", { detail: countsRes }));
      }
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách đơn ghép lớp.");
    } finally {
      setIsLoading(false);
    }
  }, [currentToken, statusFilter, searchQuery, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Search Input (reset to page 0)
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  const handleOpenCreateModal = () => {
    const firstTutor = activeTutors[0];
    const defaultTutorId = firstTutor ? String(firstTutor.tutorId ?? firstTutor.id ?? "") : "";
    setCreateFormData({
      ...INITIAL_CREATE_FORM,
      tutorId: defaultTutorId,
    });
    setCreateFormError("");
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!createFormData.parentName.trim()) {
      setCreateFormError("Vui lòng nhập họ tên phụ huynh.");
      return;
    }
    const cleanPhone = createFormData.phone.replace(/[\s.\-()]/g, "");
    if (!/^(0|\+84|84)(3|5|7|8|9)\d{8}$/.test(cleanPhone)) {
      setCreateFormError("Vui lòng nhập đúng số điện thoại (10 chữ số nhà mạng Việt Nam).");
      return;
    }
    if (!createFormData.studentName.trim()) {
      setCreateFormError("Vui lòng nhập họ tên học sinh.");
      return;
    }
    if (!createFormData.tutorId) {
      setCreateFormError("Vui lòng chọn gia sư được chỉ định.");
      return;
    }
    if (!createFormData.className.trim()) {
      setCreateFormError("Vui lòng nhập tên lớp hoặc yêu cầu môn học.");
      return;
    }

    const chosenTutor = activeTutors.find((t) => String(t.tutorId ?? t.id) === String(createFormData.tutorId));
    const tutorDisplayName = chosenTutor ? (chosenTutor.fullName || chosenTutor.name || `Gia sư #${createFormData.tutorId}`) : "Gia sư";

    setConfirmModal({
      open: true,
      title: "Xác nhận tạo đơn ghép lớp",
      message: `Bạn xác nhận thao tác của mình chứ? Xác nhận tạo đơn ghép lớp cho học sinh ${createFormData.studentName} với gia sư ${tutorDisplayName}?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiCreateMatchRequest(
            {
              parentName: createFormData.parentName.trim(),
              phone: cleanPhone,
              studentName: createFormData.studentName.trim(),
              grade: createFormData.grade,
              school: createFormData.school.trim(),
              tutorId: Number(createFormData.tutorId),
              className: createFormData.className.trim(),
              sessionsPerWeek: Number(createFormData.sessionsPerWeek) || 2,
              durationMinutes: Number(createFormData.durationMinutes) || 90,
              teachingMode: createFormData.teachingMode,
              pricePerSession: Number(createFormData.pricePerSession) || 250000,
              preferredSchedule: createFormData.preferredSchedule,
              notes: createFormData.notes,
            },
            currentToken
          );
          setIsCreateModalOpen(false);
          setSuccessPopup(
            `Đã tạo thành công đơn ghép lớp cho học sinh ${createFormData.studentName} và gia sư ${tutorDisplayName}! Đơn đã được chuyển vào mục "Chờ xử lý".`
          );
          loadData();
        } catch (err) {
          setCreateFormError(err.message || "Tạo đơn ghép lớp thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // === UC-REC-06 / UC-ADM-05: Duyệt Đơn ghép lớp (Xác nhận đơn) ===
  const handleConfirmRequest = (req) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận ghép lớp",
      message: `Bạn xác nhận thao tác của mình chứ? Xác nhận ghép lớp cho gia sư ${req.tutorName || "chỉ định"} và phụ huynh ${req.parentName}?`,
      confirmLabel: "Đồng ý",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiConfirmMatchRequest(req.id, currentToken);
          setDetailModalItem(null);
          setSuccessPopup(
            `Thao tác thành công! Đơn của học sinh ${req.studentName || req.parentName} đã được chuyển sang trạng thái "Đang dạy thử". Lớp học thử (TRIAL) đã được khởi tạo và gửi thông báo tới gia sư ${req.tutorName}.`
          );
          loadData();
        } catch (err) {
          showToast(err.message || "Xác nhận đơn thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // === UC-REC-06.1 / UC-ADM-05.1: Duyệt Đơn ghép lớp từ dạy thử sang ghép thành công ===
  const handleCompleteMatch = (req) => {
    setConfirmModal({
      open: true,
      title: "Xác nhận ghép thành công",
      message: `Bạn xác nhận thao tác của mình chứ? Xác nhận hoàn tất dạy thử và chuyển đơn sang trạng thái Ghép thành công cho học sinh ${req.studentName || req.parentName} với gia sư ${req.tutorName || "chỉ định"}?`,
      confirmLabel: "Đồng ý",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiCompleteMatchRequest(req.id, currentToken);
          setDetailModalItem(null);
          setSuccessPopup(
            `Thao tác thành công! Đơn của học sinh ${req.studentName || req.parentName} đã hoàn tất dạy thử và chuyển sang trạng thái "Ghép thành công". Lớp học chính thức (ACTIVE) đã được kích hoạt và gửi thông báo tới gia sư ${req.tutorName}.`
          );
          loadData();
        } catch (err) {
          showToast(err.message || "Xác nhận ghép thành công thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // === UC-REC-07 / UC-ADM-06: Hủy Đơn ghép lớp ===
  const handleOpenCancelModal = (req) => {
    setCancelModalItem(req);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy đơn.");
      return;
    }

    setConfirmModal({
      open: true,
      title: "Hủy đơn ghép lớp",
      message: "Bạn chắc chắn hủy đơn ghép lớp này chứ? Lớp học liên quan (nếu có) sẽ bị hủy.",
      confirmLabel: "Đồng ý hủy",
      confirmTone: "rose",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiCancelMatchRequest(cancelModalItem.id, cancelReason.trim(), currentToken);
          setCancelModalItem(null);
          showToast("Đã hủy đơn ghép lớp thành công.");
          loadData();
        } catch (err) {
          setCancelError(err.message || "Hủy đơn thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // === Xem chi tiết đơn ===
  const handleViewDetail = async (req) => {
    setDetailModalItem(req);
    setIsDetailLoading(true);
    try {
      const detail = await apiGetMatchRequestDetail(req.id, currentToken);
      if (detail) {
        setDetailModalItem(detail);
      }
    } catch {
      // Dùng dữ liệu summary sẵn có
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl transition-all dark:border-blue-900 dark:bg-slate-900 animate-fade-in">
          <CheckCircle2 size={18} className="text-blue-400 shrink-0" />
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

      {/* ConfirmModal for Actions */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* Page Header & Action Button on the top-left */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <PageHeader
            title="Quản lý Đơn ghép lớp"
            description="Tiếp nhận, xử lý và ghép lớp chỉ định theo UC-REC-05..07 & UC-ADM-04..06."
            className="mb-3"
          />
          <Button
            onClick={handleOpenCreateModal}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Tạo mới đơn ghép lớp</span>
          </Button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={ClipboardList}
          label="Tổng đơn tiếp nhận"
          value={counts.total}
          hint="Toàn bộ lịch sử"
          tone="blue"
        />
        <StatCard
          icon={Clock}
          label="Chờ xử lý"
          value={counts.pending}
          hint="Cần gọi xác nhận gia sư"
          tone="amber"
        />
        <StatCard
          icon={BookOpen}
          label="Đang dạy thử"
          value={counts.trial}
          hint="Gia sư đang dạy thử"
          tone="blue"
        />
        <StatCard
          icon={CheckCircle2}
          label="Ghép thành công"
          value={counts.matched}
          hint="Đã chốt lịch chính thức"
          tone="emerald"
        />
        <StatCard
          icon={XCircle}
          label="Đã hủy"
          value={counts.cancelled}
          hint="Không ghép được / PH hủy"
          tone="slate"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Status Tabs per Use Case */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả", count: counts.total },
              { key: "pending", label: "Chờ xử lý", count: counts.pending },
              { key: "trial", label: "Đang dạy thử", count: counts.trial },
              { key: "matched", label: "Ghép thành công", count: counts.matched },
              { key: "cancelled", label: "Đã hủy", count: counts.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(0);
                }}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
                  statusFilter === tab.key
                    ? "border-primary bg-primary text-primary-foreground shadow-xs"
                    : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      statusFilter === tab.key
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative min-w-[240px] flex-1 sm:w-72">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo PH, SĐT, HS, Gia sư..."
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="cursor-pointer">
              Tìm kiếm
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setPage(0);
                loadData();
              }}
              title="Làm mới danh sách"
              className="cursor-pointer"
            >
              <RotateCcw size={14} />
            </Button>
          </form>
        </div>
      </Card>

      {/* Match Requests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4"
            >
              <div className="h-6 w-1/3 bg-muted rounded-md" />
              <div className="h-4 w-2/3 bg-muted rounded-md" />
              <div className="h-4 w-1/2 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <Card className="text-center py-16 space-y-3">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto stroke-1" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">Không tìm thấy đơn ghép lớp nào</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery
                ? "Không có đơn nào khớp với từ khóa tìm kiếm. Vui lòng thử lại với từ khóa khác."
                : "Chưa có đơn ghép lớp nào trong mục này."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const meta = statusMeta[req.status] || { label: req.status, tone: "neutral" };
            const StatusIcon = meta.icon || Info;
            const isPending = req.status === "PENDING";
            const isCancelled = req.status === "CANCELLED";

            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  {/* Left: Info Block */}
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Header line: Code, Date, Badges */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        {req.requestCode}
                      </span>
                      <h3 className="text-base font-bold text-foreground tracking-tight">
                        {req.className || "Lớp Tiếng Anh chỉ định"}
                      </h3>
                      {req.grade && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                          {req.grade}
                        </span>
                      )}
                      <Badge tone={meta.tone}>
                        <StatusIcon size={12} className="mr-1 inline" />
                        {meta.label}
                      </Badge>
                      {req.classId && (
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          Mã lớp: #{req.classId} ({req.classStatus})
                        </span>
                      )}
                    </div>

                    {/* Details Grid: Parent, Student, Tutor, Schedule */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs pt-1">
                      {/* Phụ huynh */}
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Phone size={13} className="text-primary shrink-0" />
                          <span>Phụ huynh:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{req.parentName}</div>
                        <div className="text-muted-foreground font-mono">{req.parentPhone}</div>
                      </div>

                      {/* Học sinh */}
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-primary shrink-0" />
                          <span>Học sinh:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{req.studentName || "Chưa tạo tài khoản"}</div>
                        <div className="text-muted-foreground">{req.grade || "Chưa chọn khối"}</div>
                      </div>

                      {/* Gia sư chỉ định */}
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1 sm:col-span-2 lg:col-span-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <UserCheck size={13} className="text-primary shrink-0" />
                          <span>Gia sư chỉ định:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{req.tutorName || `Gia sư #${req.tutorId}`}</div>
                        <div className="text-muted-foreground">ID: #{req.tutorId}</div>
                      </div>
                    </div>

                    {/* Additional meta: Teaching mode, Price, Time */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-emerald-500 shrink-0" />
                        <span>Hình thức: <strong className="text-foreground">{req.teachingMode ? (req.teachingMode === "ONLINE" ? "Trực tuyến (Online)" : "Tại nhà (Offline)") : "Chưa xác định"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span>Học phí: <strong className="text-primary font-bold">{req.pricePerSession ? fmtVND(req.pricePerSession) + "/buổi" : "Chưa chốt"}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} className="shrink-0" />
                        <span>Gửi lúc: {formatTs(req.createdAt)}</span>
                      </div>
                    </div>

                    {/* Cancel Reason Box if Cancelled */}
                    {isCancelled && req.cancelReason && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <XCircle size={14} className="text-rose-500 shrink-0" />
                          <span>Lý do hủy đơn:</span>
                        </div>
                        <p className="leading-relaxed">{req.cancelReason}</p>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions Column */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-48 justify-center pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                    {/* Xác nhận đơn (UC-REC-06 / UC-ADM-05) */}
                    {isPending && (
                      <Button
                        size="sm"
                        onClick={() => handleConfirmRequest(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <CheckCircle2 size={15} />
                        <span>Xác nhận đơn</span>
                      </Button>
                    )}

                    {/* Xác nhận ghép thành công (UC-REC-06.1 / UC-ADM-05.1) */}
                    {req.status === "TRIAL" && (
                      <Button
                        size="sm"
                        onClick={() => handleCompleteMatch(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]"
                      >
                        <CheckCircle2 size={15} />
                        <span>Xác nhận ghép thành công</span>
                      </Button>
                    )}

                    {/* Hủy đơn (UC-REC-07 / UC-ADM-06) */}
                    {!isCancelled && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCancelModal(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 cursor-pointer text-xs"
                      >
                        <XCircle size={15} />
                        <span>Hủy đơn</span>
                      </Button>
                    )}

                    {/* Xem chi tiết */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleViewDetail(req)}
                      className="w-full justify-center cursor-pointer text-xs"
                    >
                      <Eye size={15} />
                      <span>Xem chi tiết</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 text-xs">
              <span className="text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="cursor-pointer"
                >
                  Trang trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages - 1}
                  onClick={() => setPage((p) => p + 1)}
                  className="cursor-pointer"
                >
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL 1: TẠO MỚI ĐƠN GHÉP LỚP (UC-REC-05 / UC-ADM-04) ──────────────── */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                Tạo mới Đơn ghép lớp
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tiếp nhận yêu cầu ghép lớp chỉ đích danh gia sư tại quầy hoặc qua điện thoại (UC-REC-05).
              </p>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* Row 1: Phụ huynh */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.parentName}
                    onChange={(e) => setCreateFormData({ ...createFormData, parentName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Toàn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Số điện thoại phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={createFormData.phone}
                    onChange={(e) => setCreateFormData({ ...createFormData, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Row 2: Học sinh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.studentName}
                    onChange={(e) => setCreateFormData({ ...createFormData, studentName: e.target.value })}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Khối lớp</label>
                  <select
                    value={createFormData.grade}
                    onChange={(e) => setCreateFormData({ ...createFormData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học", "Người đi làm"].map(
                      (g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              {/* Row 3: Chọn Gia sư chỉ định */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Gia sư được chỉ định <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={createFormData.tutorId}
                  onChange={(e) => setCreateFormData({ ...createFormData, tutorId: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">-- Chọn gia sư đang hoạt động --</option>
                  {activeTutors.map((t) => {
                    const tid = t.tutorId ?? t.id;
                    const tname = t.fullName || t.name || `Gia sư #${tid}`;
                    return (
                      <option key={tid} value={tid}>
                        {tname} (ID: #{tid} - {t.university || "Gia sư EnglishPath"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Row 4: Tên lớp, Hình thức, Học phí */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-1">
                  <label className="text-xs font-semibold text-foreground">
                    Tên lớp / Môn học <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={createFormData.className}
                    onChange={(e) => setCreateFormData({ ...createFormData, className: e.target.value })}
                    placeholder="VD: Tiếng Anh IELTS 6.5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hình thức học</label>
                  <select
                    value={createFormData.teachingMode}
                    onChange={(e) => setCreateFormData({ ...createFormData, teachingMode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="ONLINE">Trực tuyến (Online)</option>
                    <option value="AT_HOME">Tại nhà (Offline)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Học phí / buổi (VNĐ) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step={10000}
                    min={10000}
                    required
                    value={createFormData.pricePerSession}
                    onChange={(e) => setCreateFormData({ ...createFormData, pricePerSession: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Row 5: Lịch học & Ghi chú */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Lịch học mong muốn</label>
                <input
                  type="text"
                  value={createFormData.preferredSchedule}
                  onChange={(e) => setCreateFormData({ ...createFormData, preferredSchedule: e.target.value })}
                  placeholder="VD: Thứ 2 - 4 - 6 từ 19:30 đến 21:00"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Ghi chú yêu cầu học tập</label>
                <textarea
                  rows={2}
                  value={createFormData.notes}
                  onChange={(e) => setCreateFormData({ ...createFormData, notes: e.target.value })}
                  placeholder="Ghi chú thêm về mục tiêu học sinh hoặc yêu cầu đặc biệt..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {createFormError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {createFormError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>Tạo đơn</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: HỦY ĐƠN GHÉP LỚP (UC-REC-07 / UC-ADM-06) ─────────────────── */}
      {cancelModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground">
            <button
              type="button"
              onClick={() => setCancelModalItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <XCircle className="text-rose-500 w-5 h-5" />
                <span>Hủy đơn ghép lớp</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Đơn mã <strong>{cancelModalItem.requestCode}</strong> của học sinh{" "}
                <strong>{cancelModalItem.studentName || cancelModalItem.parentName}</strong>.
              </p>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Lý do hủy đơn <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Nhập lý do hủy (VD: Phụ huynh thay đổi lịch, gia sư bận lịch học...)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {cancelError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {cancelError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCancelModalItem(null)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Hủy thao tác
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !cancelReason.trim()}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>Đồng ý hủy đơn</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 3: XEM CHI TIẾT ĐƠN GHÉP LỚP ─────────────────────────────────── */}
      {detailModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
            <button
              type="button"
              onClick={() => setDetailModalItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="pr-8">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {detailModalItem.requestCode}
                </span>
                <Badge tone={statusMeta[detailModalItem.status]?.tone || "neutral"}>
                  {statusMeta[detailModalItem.status]?.label || detailModalItem.status}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">
                {detailModalItem.className || "Lớp Tiếng Anh chỉ định"}
              </h2>
            </div>

            {isDetailLoading ? (
              <div className="py-10 text-center text-muted-foreground text-xs animate-pulse">
                Đang tải thông tin chi tiết...
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Thông tin Phụ huynh */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Phone size={13} className="text-primary" /> Thông tin Phụ huynh
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Họ tên: <strong className="text-foreground">{detailModalItem.parentName}</strong></div>
                    <div>SĐT: <strong className="text-foreground font-mono">{detailModalItem.parentPhone}</strong></div>
                    {detailModalItem.parentEmail && (
                      <div className="col-span-2">Email: <span className="text-foreground">{detailModalItem.parentEmail}</span></div>
                    )}
                    {detailModalItem.parentAddress && (
                      <div className="col-span-2">Địa chỉ: <span className="text-foreground">{detailModalItem.parentAddress}</span></div>
                    )}
                  </div>
                </div>

                {/* Thông tin Học sinh */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-primary" /> Thông tin Học sinh
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Họ tên: <strong className="text-foreground">{detailModalItem.studentName || "Chưa có"}</strong></div>
                    <div>Khối lớp: <strong className="text-foreground">{detailModalItem.grade || "Chưa cập nhật"}</strong></div>
                    {detailModalItem.school && (
                      <div className="col-span-2">Trường: <span className="text-foreground">{detailModalItem.school}</span></div>
                    )}
                    {detailModalItem.learningGoal && (
                      <div className="col-span-2">Mục tiêu: <span className="text-foreground">{detailModalItem.learningGoal}</span></div>
                    )}
                  </div>
                </div>

                {/* Thông tin Gia sư chỉ định */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck size={13} className="text-primary" /> Gia sư chỉ định
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Gia sư: <strong className="text-foreground">{detailModalItem.tutorName || `#${detailModalItem.tutorId}`}</strong></div>
                    <div>Mã gia sư: <strong className="text-foreground font-mono">#{detailModalItem.tutorId}</strong></div>
                    {detailModalItem.tutorEmail && (
                      <div>Email: <span className="text-foreground">{detailModalItem.tutorEmail}</span></div>
                    )}
                    {detailModalItem.tutorPhone && (
                      <div>SĐT: <span className="text-foreground font-mono">{detailModalItem.tutorPhone}</span></div>
                    )}
                  </div>
                </div>

                {/* Lịch học & Chi phí */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Lịch học & Chi phí
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Hình thức: <strong className="text-foreground">{detailModalItem.teachingMode === "ONLINE" ? "Trực tuyến" : "Tại nhà"}</strong></div>
                    <div>Học phí: <strong className="text-primary font-bold">{fmtVND(detailModalItem.pricePerSession)}</strong>/buổi</div>
                    {detailModalItem.preferredSchedule && (
                      <div className="col-span-2">Lịch mong muốn: <span className="text-foreground">{detailModalItem.preferredSchedule}</span></div>
                    )}
                    {detailModalItem.classId && (
                      <div className="col-span-2 text-blue-600 dark:text-blue-400 font-semibold">
                        Lớp học đã liên kết: Mã #{detailModalItem.classId} (Trạng thái: {detailModalItem.classStatus})
                      </div>
                    )}
                  </div>
                </div>

                {/* Lý do hủy nếu có */}
                {detailModalItem.status === "CANCELLED" && detailModalItem.cancelReason && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <XCircle size={14} className="text-rose-500" /> Lý do hủy đơn
                    </div>
                    <p className="leading-relaxed">{detailModalItem.cancelReason}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {detailModalItem.status === "PENDING" && (
                  <Button
                    size="sm"
                    onClick={() => handleConfirmRequest(detailModalItem)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    <span>Xác nhận đơn</span>
                  </Button>
                )}
                {detailModalItem.status === "TRIAL" && (
                  <Button
                    size="sm"
                    onClick={() => handleCompleteMatch(detailModalItem)}
                    disabled={isSubmitting}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    <CheckCircle2 size={15} />
                    <span>Xác nhận ghép thành công</span>
                  </Button>
                )}
                {detailModalItem.status !== "CANCELLED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      handleOpenCancelModal(item);
                    }}
                    disabled={isSubmitting}
                    className="text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer text-xs"
                  >
                    <XCircle size={15} />
                    <span>Hủy đơn</span>
                  </Button>
                )}
              </div>
              <Button onClick={() => setDetailModalItem(null)} variant="secondary" size="sm" className="cursor-pointer">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MatchRequests;
