import { useState, useEffect, useCallback } from "react";
import {
  ClipboardList,
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Megaphone,
  Eye,
  PlusCircle,
  RotateCcw,
  X,
  Loader2,
  GraduationCap,
  Phone,
  MapPin,
  UserCheck,
  Pencil,
  Calendar,
  MessageSquare,
  Info,
  RefreshCcw,
  UserX,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  apiGetClassRequests,
  apiGetClassRequestCounts,
  apiGetClassRequestDetail,
  apiGetClassApplications,
  apiCreateClassRequest,
  apiUpdateClassRequest,
  apiPublishClassRequest,
  apiSelectTutor,
  apiCancelClassRequest,
} from "../../lib/staffClassRequestApi";

const statusMeta = {
  NEW: { label: "Chờ xử lý", tone: "amber", icon: Clock },
  OPEN: { label: "Đã đăng", tone: "blue", icon: Megaphone },
  MATCHED: { label: "Đã xử lý", tone: "emerald", icon: CheckCircle2 },
  REMATCH: { label: "Đang ghép lại", tone: "violet", icon: RefreshCcw },
  CANCELLED: { label: "Đã hủy", tone: "slate", icon: XCircle },
};

const EMPTY_COUNTS = { new: 0, open: 0, matched: 0, rematch: 0, cancelled: 0, total: 0 };
const TAB_KEYS = ["all", "new", "open", "rematch", "matched", "cancelled"];

// Đơn đang nhận ứng tuyển: đăng tuyển lần đầu hoặc đang ghép lại sau dạy thử thất bại (ERD C-14).
const isRecruiting = (status) => status === "OPEN" || status === "REMATCH";

/** Badge trạng thái lượt ứng tuyển trong modal / chi tiết. */
function ApplicationStatusBadge({ status }) {
  if (status === "SELECTED") return <Badge tone="emerald">Đã chọn</Badge>;
  if (status === "REJECTED") return <Badge tone="slate">Không chọn</Badge>;
  if (status === "TERMINATED") return <Badge tone="rose">Đã loại sau dạy thử</Badge>;
  return <Badge tone="blue">Đã ứng tuyển</Badge>;
}

const GRADES = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học", "Người đi làm"];

const fmtVND = (n) => (n ? Number(n).toLocaleString("vi-VN") + "₫" : "0₫");
const teachingLabel = (m) => (m ? (m === "ONLINE" ? "Trực tuyến (Online)" : "Tại nhà (Offline)") : "Chưa xác định");

function formatTs(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return (
    d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " +
    d.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  );
}

const INITIAL_FORM = {
  parentName: "",
  phone: "",
  studentName: "",
  grade: "Lớp 10",
  school: "",
  classRequirement: "",
  teachingMode: "ONLINE",
  pricePerSession: 300000,
  feePercentage: 40,
  preferredSchedule: "",
  tutorRequirement: "",
};

export function ClassRequestManagement() {
  const { token, session } = useAuth();
  const currentToken = token || session?.token;
  // Trang Đơn ghép lớp chuyển sang với ?tab=rematch&id=… để chọn gia sư mới cho đơn đang ghép lại.
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = TAB_KEYS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "all";
  const [focusRequestId, setFocusRequestId] = useState(searchParams.get("id"));

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal tạo/sửa lớp
  const [formModal, setFormModal] = useState(null); // { mode: "create" | "edit", item? }
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");

  // Modal chi tiết
  const [detailModalItem, setDetailModalItem] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // Modal danh sách gia sư ứng tuyển
  const [applicationsModal, setApplicationsModal] = useState(null); // { request, items }
  const [isApplicationsLoading, setIsApplicationsLoading] = useState(false);

  // Modal hủy lớp
  const [cancelModalItem, setCancelModalItem] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelError, setCancelError] = useState("");

  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [toastMessage, setToastMessage] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };
  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countsRes] = await Promise.all([
        apiGetClassRequests({ tab: statusFilter, keyword: searchQuery, sort, page, size: 20, token: currentToken }),
        apiGetClassRequestCounts(currentToken).catch(() => EMPTY_COUNTS),
      ]);
      setRequests(listRes.items || []);
      setTotalPages(listRes.totalPages || 1);
      if (countsRes) setCounts(countsRes);
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách lớp cần gia sư.");
    } finally {
      setIsLoading(false);
    }
  }, [currentToken, statusFilter, searchQuery, sort, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Mở sẵn danh sách ứng tuyển của đơn được chuyển sang từ trang Đơn ghép lớp (chỉ một lần).
  useEffect(() => {
    if (!focusRequestId || isLoading) return;
    const target = requests.find((r) => String(r.id) === String(focusRequestId));
    setFocusRequestId(null);
    setSearchParams({}, { replace: true });
    if (target) handleOpenApplications(target);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRequestId, isLoading, requests]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  // ── Tạo mới lớp (UC-REC-02) ──────────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM);
    setFormError("");
    setFormModal({ mode: "create" });
  };

  const handleOpenEdit = (item) => {
    setFormData({
      parentName: item.parentName || "",
      phone: item.parentPhone || "",
      studentName: item.studentName || "",
      grade: item.grade || "Lớp 10",
      school: item.school || "",
      classRequirement: item.classRequirement || "",
      teachingMode: item.teachingMode || "ONLINE",
      pricePerSession: item.pricePerSession || 300000,
      feePercentage: item.feePercentage ?? 40,
      preferredSchedule: item.preferredSchedule || "",
      tutorRequirement: item.tutorRequirement || "",
    });
    setFormError("");
    setFormModal({ mode: "edit", item });
  };

  const validateForm = (isCreate) => {
    if (isCreate) {
      if (!formData.parentName.trim()) return "Vui lòng nhập họ tên phụ huynh.";
      const cleanPhone = formData.phone.replace(/[\s.\-()]/g, "");
      if (!/^(0|\+84|84)(3|5|7|8|9)\d{8}$/.test(cleanPhone))
        return "Vui lòng nhập đúng số điện thoại (10 chữ số nhà mạng Việt Nam).";
    }
    if (!formData.studentName.trim()) return "Vui lòng nhập họ tên học sinh.";
    if (!formData.classRequirement.trim()) return "Vui lòng nhập yêu cầu lớp học.";
    if (!formData.pricePerSession || Number(formData.pricePerSession) < 10000)
      return "Học phí mỗi buổi phải lớn hơn 10.000₫.";
    return "";
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const isCreate = formModal?.mode === "create";
    const err = validateForm(isCreate);
    if (err) {
      setFormError(err);
      return;
    }

    setConfirmModal({
      open: true,
      title: isCreate ? "Xác nhận tạo lớp" : "Xác nhận cập nhật lớp",
      message: isCreate
        ? `Bạn xác nhận tạo lớp học này chứ? Lớp sẽ được đăng lên trang gia sư để các gia sư ứng tuyển.`
        : `Bạn xác nhận cập nhật thông tin lớp của học sinh ${formData.studentName} chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          if (isCreate) {
            const created = await apiCreateClassRequest(
              {
                parentName: formData.parentName.trim(),
                phone: formData.phone.replace(/[\s.\-()]/g, ""),
                studentName: formData.studentName.trim(),
                grade: formData.grade,
                school: formData.school.trim(),
                classRequirement: formData.classRequirement.trim(),
                teachingMode: formData.teachingMode,
                pricePerSession: Number(formData.pricePerSession),
                feePercentage: Number(formData.feePercentage) || 40,
                preferredSchedule: formData.preferredSchedule.trim(),
                tutorRequirement: formData.tutorRequirement.trim(),
              },
              currentToken
            );
            // Đăng tuyển ngay để lớp xuất hiện trên trang gia sư (FlowWork Luồng 2).
            await apiPublishClassRequest(created.id, currentToken);
            setSuccessPopup(
              `Đã tạo và đăng lớp "${formData.classRequirement.trim()}" cho học sinh ${formData.studentName}. Lớp đã hiển thị ở mục "Đã đăng" để gia sư ứng tuyển.`
            );
          } else {
            await apiUpdateClassRequest(
              formModal.item.id,
              {
                studentName: formData.studentName.trim(),
                grade: formData.grade,
                school: formData.school.trim(),
                classRequirement: formData.classRequirement.trim(),
                teachingMode: formData.teachingMode,
                pricePerSession: Number(formData.pricePerSession),
                feePercentage: Number(formData.feePercentage) || 40,
                preferredSchedule: formData.preferredSchedule.trim(),
                tutorRequirement: formData.tutorRequirement.trim(),
              },
              currentToken
            );
            showToast("Đã cập nhật thông tin lớp cần gia sư.");
          }
          setFormModal(null);
          loadData();
        } catch (err2) {
          setFormError(err2.message || "Thao tác thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ── Đăng tuyển lớp NEW → OPEN ─────────────────────────────────────────────
  const handlePublish = (req) => {
    setConfirmModal({
      open: true,
      title: "Đăng tuyển lớp",
      message: `Bạn xác nhận đăng lớp "${req.classRequirement || req.requestCode}" lên trang gia sư chứ?`,
      confirmLabel: "Đăng tuyển",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiPublishClassRequest(req.id, currentToken);
          showToast("Đã đăng lớp cần gia sư lên trang gia sư.");
          loadData();
        } catch (err) {
          showToast(err.message || "Đăng tuyển thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ── Danh sách gia sư ứng tuyển + Chọn gia sư (UC-REC-03) ──────────────────
  const handleOpenApplications = async (req) => {
    setApplicationsModal({ request: req, items: [] });
    setIsApplicationsLoading(true);
    try {
      const items = await apiGetClassApplications(req.id, currentToken);
      setApplicationsModal({ request: req, items: items || [] });
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách gia sư ứng tuyển.");
      setApplicationsModal(null);
    } finally {
      setIsApplicationsLoading(false);
    }
  };

  const handleSelectTutor = (application) => {
    const req = applicationsModal.request;
    setConfirmModal({
      open: true,
      title: "Chọn gia sư",
      message: `Bạn xác nhận chọn gia sư ${application.tutorName} cho lớp này chứ? Hệ thống sẽ tạo đơn ghép lớp ở trạng thái "Đang dạy thử".`,
      confirmLabel: "Đồng ý",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiSelectTutor(req.id, application.applicationId, currentToken);
          setApplicationsModal(null);
          setSuccessPopup(
            `Đã chọn gia sư ${application.tutorName}${req.status === "REMATCH" ? " cho vòng ghép lại" : ""}! Lớp đã chuyển sang "Đã xử lý", đơn ghép lớp dạy thử được tạo và đã gửi thông báo tới gia sư.`
          );
          loadData();
        } catch (err) {
          showToast(err.message || "Chọn gia sư thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ── Hủy lớp (UC-REC-04) ───────────────────────────────────────────────────
  const handleOpenCancel = (req) => {
    setCancelModalItem(req);
    setCancelReason("");
    setCancelError("");
  };

  const handleCancelSubmit = (e) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setCancelError("Vui lòng nhập lý do hủy lớp.");
      return;
    }
    setConfirmModal({
      open: true,
      title: "Hủy lớp cần gia sư",
      message: "Bạn chắc chắn muốn hủy lớp này chứ? Hệ thống sẽ gỡ lớp khỏi trang gia sư và thông báo tới các gia sư đã ứng tuyển.",
      confirmLabel: "Đồng ý hủy",
      confirmTone: "rose",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiCancelClassRequest(cancelModalItem.id, cancelReason.trim(), currentToken);
          setCancelModalItem(null);
          showToast("Đã hủy lớp cần gia sư.");
          loadData();
        } catch (err) {
          setCancelError(err.message || "Hủy lớp thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ── Xem chi tiết ──────────────────────────────────────────────────────────
  const handleViewDetail = async (req) => {
    setDetailModalItem(req);
    setIsDetailLoading(true);
    try {
      const detail = await apiGetClassRequestDetail(req.id, currentToken);
      if (detail) setDetailModalItem(detail);
    } catch {
      // Dùng dữ liệu summary sẵn có
    } finally {
      setIsDetailLoading(false);
    }
  };

  const tabs = [
    { key: "all", label: "Tất cả", count: counts.total },
    { key: "new", label: "Chờ xử lý", count: counts.new },
    { key: "open", label: "Đã đăng", count: counts.open },
    { key: "rematch", label: "Đang ghép lại", count: counts.rematch ?? 0 },
    { key: "matched", label: "Đã xử lý", count: counts.matched },
    { key: "cancelled", label: "Đã hủy", count: counts.cancelled },
  ];

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-blue-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl dark:border-blue-900 animate-fade-in">
          <CheckCircle2 size={18} className="text-blue-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <PageHeader
            title="Quản lý Lớp cần gia sư"
            description="Tạo lớp, đăng tuyển, xét duyệt gia sư ứng tuyển theo UC-REC-02..04 & UC-ADM-01..03."
            className="mb-3"
          />
          <Button
            onClick={handleOpenCreate}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-xl inline-flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <PlusCircle size={18} />
            <span>Tạo mới lớp</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard icon={ClipboardList} label="Tổng số lớp" value={counts.total} hint="Toàn bộ lịch sử" tone="blue" />
        <StatCard icon={Clock} label="Chờ xử lý" value={counts.new} hint="Cần bổ sung & đăng tuyển" tone="amber" />
        <StatCard icon={Megaphone} label="Đã đăng" value={counts.open} hint="Gia sư đang ứng tuyển" tone="blue" />
        <StatCard icon={RefreshCcw} label="Đang ghép lại" value={counts.rematch ?? 0} hint="Dạy thử chưa thành công" tone="violet" />
        <StatCard icon={CheckCircle2} label="Đã xử lý" value={counts.matched} hint="Đã chọn được gia sư" tone="emerald" />
        <StatCard icon={XCircle} label="Đã hủy" value={counts.cancelled} hint="Phụ huynh hủy / không ghép" tone="slate" />
      </div>

      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
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
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    statusFilter === tab.key
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(0);
              }}
              className="rounded-xl border border-border bg-background py-2 px-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              title="Sắp xếp"
            >
              <option value="newest">Mới nhất</option>
              <option value="oldest">Đăng sớm nhất</option>
              <option value="applications">Nhiều gia sư ứng tuyển</option>
            </select>
            <div className="relative min-w-[200px] flex-1 sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo PH, SĐT, HS, mã lớp..."
                className="w-full rounded-xl border border-border bg-background py-2 pl-9 pr-3 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="cursor-pointer">
              Tìm
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
              title="Làm mới"
              className="cursor-pointer"
            >
              <RotateCcw size={14} />
            </Button>
          </form>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-2xl border border-border bg-card p-6 animate-pulse space-y-4">
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
            <h3 className="text-base font-bold text-foreground">Không có lớp cần gia sư nào</h3>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "Không có lớp khớp từ khóa tìm kiếm." : "Chưa có lớp cần gia sư nào trong mục này."}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => {
            const meta = statusMeta[req.status] || { label: req.status, tone: "slate", icon: Info };
            const StatusIcon = meta.icon || Info;
            const appCount = req.applicationCount || 0;
            const pendingCount = req.pendingApplicationCount ?? appCount;
            return (
              <div
                key={req.id}
                className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-xs font-extrabold px-2.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
                        {req.requestCode}
                      </span>
                      <h3 className="text-base font-bold text-foreground tracking-tight">
                        {req.classRequirement || "Lớp cần gia sư"}
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
                      {(isRecruiting(req.status) || appCount > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Users size={12} /> {appCount} gia sư ứng tuyển
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <Phone size={13} className="text-primary shrink-0" />
                          <span>Phụ huynh:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{req.parentName}</div>
                        <div className="text-muted-foreground font-mono">{req.parentPhone}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <GraduationCap size={13} className="text-primary shrink-0" />
                          <span>Học sinh:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{req.studentName || "Chưa cập nhật"}</div>
                        <div className="text-muted-foreground">{req.grade || "Chưa chọn khối"}</div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1">
                        <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                          <MapPin size={13} className="text-emerald-500 shrink-0" />
                          <span>Hình thức & phí:</span>
                        </div>
                        <div className="font-bold text-foreground truncate">{teachingLabel(req.teachingMode)}</div>
                        <div className="text-primary font-bold">
                          {req.pricePerSession ? fmtVND(req.pricePerSession) + "/buổi" : "Chưa chốt"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
                      {req.preferredSchedule && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="shrink-0" />
                          <span>{req.preferredSchedule}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={13} className="shrink-0" />
                        <span>{formatTs(req.createdAt)}</span>
                      </div>
                    </div>

                    {req.status === "REMATCH" && (
                      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 text-xs text-violet-800 dark:text-violet-200 flex items-start gap-1.5">
                        <UserX size={14} className="shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Dạy thử không thành công, phụ huynh muốn tìm gia sư khác. Lớp đã mở lại trên trang gia sư — gia sư cũ không thể ứng tuyển lại.
                        </p>
                      </div>
                    )}

                    {req.status === "CANCELLED" && req.cancelReason && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <XCircle size={14} className="text-rose-500 shrink-0" />
                          <span>Lý do hủy:</span>
                        </div>
                        <p className="leading-relaxed">{req.cancelReason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 lg:w-52 justify-center pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                    {req.status === "NEW" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handlePublish(req)}
                          disabled={isSubmitting}
                          className="w-full justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          <Megaphone size={15} />
                          <span>Đăng tuyển</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(req)}
                          disabled={isSubmitting}
                          className="w-full justify-center cursor-pointer text-xs"
                        >
                          <Pencil size={15} />
                          <span>Sửa thông tin</span>
                        </Button>
                      </>
                    )}

                    {isRecruiting(req.status) && (
                      <Button
                        size="sm"
                        onClick={() => handleOpenApplications(req)}
                        disabled={isSubmitting || pendingCount === 0}
                        title={pendingCount === 0 ? "Chưa có gia sư ứng tuyển" : "Xem danh sách gia sư ứng tuyển"}
                        className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Users size={15} />
                        <span>Danh sách gia sư</span>
                      </Button>
                    )}

                    {req.status !== "CANCELLED" && req.status !== "MATCHED" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCancel(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 cursor-pointer text-xs"
                      >
                        <XCircle size={15} />
                        <span>Hủy lớp</span>
                      </Button>
                    )}

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

          {totalPages > 1 && (
            <div className="flex items-center justify-between py-4 text-xs">
              <span className="text-muted-foreground">
                Trang {page + 1} / {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="cursor-pointer">
                  Trang trước
                </Button>
                <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)} className="cursor-pointer">
                  Trang sau
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: TẠO / SỬA LỚP (UC-REC-02) ───────────────────────────────── */}
      {formModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-6 text-card-foreground">
            <button
              type="button"
              onClick={() => setFormModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {formModal.mode === "create" ? "Tạo mới Lớp cần gia sư" : "Cập nhật Lớp cần gia sư"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tiếp nhận yêu cầu tìm gia sư của phụ huynh chưa chọn được gia sư (UC-REC-02). Thông tin phụ huynh/học sinh không công khai với gia sư.
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    disabled={formModal.mode === "edit"}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    placeholder="VD: Nguyễn Văn Toàn"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    disabled={formModal.mode === "edit"}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="VD: 0987654321"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Khối lớp</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Trường học</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                  placeholder="VD: THPT Chuyên Chu Văn An"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Yêu cầu lớp học <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.classRequirement}
                  onChange={(e) => setFormData({ ...formData, classRequirement: e.target.value })}
                  placeholder="VD: Luyện IELTS từ 5.0 lên 6.5, tập trung Speaking và Grammar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Hình thức học</label>
                  <select
                    value={formData.teachingMode}
                    onChange={(e) => setFormData({ ...formData, teachingMode: e.target.value })}
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
                    value={formData.pricePerSession}
                    onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Tỷ lệ phí nhận lớp (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={formData.feePercentage}
                    onChange={(e) => setFormData({ ...formData, feePercentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dải 0–50, mặc định 40. Phí = tỷ lệ × số buổi/tuần × 4 × học phí/buổi.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Lịch học mong muốn (số buổi/tuần, thời gian)</label>
                <input
                  type="text"
                  value={formData.preferredSchedule}
                  onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                  placeholder="VD: 2 buổi/tuần, tối Thứ 3 và Thứ 6 (19:30 - 21:00)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Yêu cầu đối với gia sư</label>
                <textarea
                  rows={2}
                  value={formData.tutorRequirement}
                  onChange={(e) => setFormData({ ...formData, tutorRequirement: e.target.value })}
                  placeholder="VD: Gia sư IELTS 7.5 trở lên, có kinh nghiệm dạy THPT"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {formError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setFormModal(null)} disabled={isSubmitting} className="cursor-pointer">
                  Hủy
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>{formModal.mode === "create" ? "Tạo & đăng lớp" : "Lưu thay đổi"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DANH SÁCH GIA SƯ ỨNG TUYỂN (UC-REC-03) ──────────────────── */}
      {applicationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground">
            <button
              type="button"
              onClick={() => setApplicationsModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
            <div className="pr-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Users size={20} className="text-primary" />
                <span>Gia sư đã ứng tuyển</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Lớp <strong>{applicationsModal.request.requestCode}</strong> — {applicationsModal.request.classRequirement}
              </p>
            </div>

            {isApplicationsLoading ? (
              <div className="py-10 text-center text-muted-foreground text-xs animate-pulse">Đang tải danh sách...</div>
            ) : applicationsModal.items.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground text-xs">Chưa có gia sư nào ứng tuyển lớp này.</div>
            ) : (
              <div className="space-y-3">
                {applicationsModal.items.map((app) => (
                  <div
                    key={app.applicationId}
                    className={`p-4 rounded-2xl border border-border bg-muted/30 space-y-2.5 ${app.status === "TERMINATED" ? "opacity-60" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center shrink-0 overflow-hidden">
                          {app.tutorAvatarUrl ? (
                            <img src={app.tutorAvatarUrl} alt={app.tutorName} className="w-full h-full object-cover" />
                          ) : (
                            <UserCheck size={18} className="text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-foreground truncate">{app.tutorName}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Clock size={11} /> {formatTs(app.appliedAt)}
                          </div>
                        </div>
                      </div>
                      {app.status !== "APPLIED" ? (
                        <ApplicationStatusBadge status={app.status} />
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelectTutor(app)}
                          disabled={isSubmitting}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shrink-0"
                        >
                          <CheckCircle2 size={15} />
                          <span>Chọn gia sư</span>
                        </Button>
                      )}
                    </div>
                    {app.message && (
                      <div className="text-xs text-muted-foreground flex items-start gap-1.5 pl-1">
                        <MessageSquare size={13} className="shrink-0 mt-0.5 text-primary" />
                        <span className="italic">“{app.message}”</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-border">
              <Button variant="secondary" size="sm" onClick={() => setApplicationsModal(null)} className="cursor-pointer">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HỦY LỚP (UC-REC-04) ─────────────────────────────────────── */}
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
                <span>Hủy lớp cần gia sư</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Lớp <strong>{cancelModalItem.requestCode}</strong> — {cancelModalItem.classRequirement || "Lớp cần gia sư"}.
              </p>
            </div>
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Lý do hủy lớp <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="VD: Phụ huynh không còn nhu cầu tìm gia sư..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
              {cancelError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {cancelError}
                </p>
              )}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setCancelModalItem(null)} disabled={isSubmitting} className="cursor-pointer">
                  Hủy thao tác
                </Button>
                <Button type="submit" disabled={isSubmitting || !cancelReason.trim()} className="bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>Đồng ý hủy</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CHI TIẾT LỚP ────────────────────────────────────────────── */}
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
                <Badge tone={statusMeta[detailModalItem.status]?.tone || "slate"}>
                  {statusMeta[detailModalItem.status]?.label || detailModalItem.status}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-foreground">{detailModalItem.classRequirement || "Lớp cần gia sư"}</h2>
            </div>

            {isDetailLoading ? (
              <div className="py-10 text-center text-muted-foreground text-xs animate-pulse">Đang tải thông tin chi tiết...</div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Phone size={13} className="text-primary" /> Phụ huynh (không công khai)
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Họ tên: <strong className="text-foreground">{detailModalItem.parentName}</strong></div>
                    <div>SĐT: <strong className="text-foreground font-mono">{detailModalItem.parentPhone}</strong></div>
                    {detailModalItem.parentEmail && <div className="col-span-2">Email: <span className="text-foreground">{detailModalItem.parentEmail}</span></div>}
                    {detailModalItem.parentAddress && <div className="col-span-2">Địa chỉ: <span className="text-foreground">{detailModalItem.parentAddress}</span></div>}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <GraduationCap size={13} className="text-primary" /> Học sinh
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Họ tên: <strong className="text-foreground">{detailModalItem.studentName || "Chưa có"}</strong></div>
                    <div>Khối lớp: <strong className="text-foreground">{detailModalItem.grade || "Chưa cập nhật"}</strong></div>
                    {detailModalItem.school && <div className="col-span-2">Trường: <span className="text-foreground">{detailModalItem.school}</span></div>}
                    {detailModalItem.learningGoal && <div className="col-span-2">Mục tiêu: <span className="text-foreground">{detailModalItem.learningGoal}</span></div>}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Yêu cầu & Chi phí
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Hình thức: <strong className="text-foreground">{teachingLabel(detailModalItem.teachingMode)}</strong></div>
                    <div>Học phí: <strong className="text-primary font-bold">{fmtVND(detailModalItem.pricePerSession)}</strong>/buổi</div>
                    <div>Tỷ lệ phí: <strong className="text-foreground">{detailModalItem.feePercentage != null ? detailModalItem.feePercentage + "%" : "40% (mặc định)"}</strong></div>
                    {detailModalItem.preferredSchedule && <div className="col-span-2">Lịch mong muốn: <span className="text-foreground">{detailModalItem.preferredSchedule}</span></div>}
                    {detailModalItem.tutorRequirement && <div className="col-span-2">Yêu cầu gia sư: <span className="text-foreground">{detailModalItem.tutorRequirement}</span></div>}
                    {detailModalItem.classId && (
                      <div className="col-span-2 text-blue-600 dark:text-blue-400 font-semibold">
                        Lớp học đã tạo: Mã #{detailModalItem.classId} (Trạng thái: {detailModalItem.classStatus})
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Users size={13} className="text-primary" /> Gia sư ứng tuyển ({detailModalItem.applications?.length || 0})
                  </div>
                  {detailModalItem.applications && detailModalItem.applications.length > 0 ? (
                    <ul className="space-y-1.5">
                      {detailModalItem.applications.map((app) => (
                        <li key={app.applicationId} className="flex items-center justify-between gap-2">
                          <span className="text-foreground font-medium truncate">{app.tutorName}</span>
                          <ApplicationStatusBadge status={app.status} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">Chưa có gia sư ứng tuyển.</p>
                  )}
                </div>

                {detailModalItem.status === "CANCELLED" && detailModalItem.cancelReason && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <XCircle size={14} className="text-rose-500" /> Lý do hủy lớp
                    </div>
                    <p className="leading-relaxed">{detailModalItem.cancelReason}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
              <div className="flex items-center gap-2">
                {isRecruiting(detailModalItem.status) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      handleOpenApplications(item);
                    }}
                    disabled={
                      isSubmitting ||
                      !(detailModalItem.pendingApplicationCount ??
                        detailModalItem.applications?.filter((a) => a.status === "APPLIED").length)
                    }
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer disabled:opacity-50"
                  >
                    <Users size={15} />
                    <span>Danh sách gia sư</span>
                  </Button>
                )}
                {detailModalItem.status !== "CANCELLED" && detailModalItem.status !== "MATCHED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      handleOpenCancel(item);
                    }}
                    disabled={isSubmitting}
                    className="text-rose-600 hover:bg-rose-50 border-rose-200 cursor-pointer text-xs"
                  >
                    <XCircle size={15} />
                    <span>Hủy lớp</span>
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

export default ClassRequestManagement;
