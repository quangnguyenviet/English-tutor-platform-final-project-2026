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
  Percent,
  RefreshCcw,
  UserX,
  ExternalLink,
  Pencil,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
  apiRematchMatchRequest,
  apiGetMatchRequestDetail,
  apiUpdateMatchRequest,
} from "../../lib/matchRequestApi";
import { apiGetPublicTutors } from "../../lib/tutorApi";

const statusMeta = {
  PENDING: { label: "Chờ xử lý", tone: "amber", icon: Clock },
  TRIAL: { label: "Đang dạy thử", tone: "blue", icon: BookOpen },
  MATCHED: { label: "Ghép thành công", tone: "emerald", icon: CheckCircle2 },
  REMATCH: { label: "Đang ghép lại", tone: "violet", icon: RefreshCcw },
  CANCELLED: { label: "Đã hủy", tone: "slate", icon: XCircle },
};

const EMPTY_COUNTS = { pending: 0, trial: 0, matched: 0, rematch: 0, cancelled: 0, total: 0 };

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
  feePercentage: 40,
  preferredSchedule: "Thứ 2 - 4 - 6 (19:30 - 21:00)",
  notes: "",
};

const EMPTY_INFO_FORM = {
  parentName: "",
  parentEmail: "",
  parentAddress: "",
  studentName: "",
  grade: "",
  school: "",
  learningGoal: "",
};

const GRADE_OPTIONS = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học", "Người đi làm"];

const infoInputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

export function MatchRequests() {
  const { token, session, tutorList: mockTutorList } = useAuth();
  const currentToken = token || session?.token;
  const navigate = useNavigate();
  const location = useLocation();

  // Data states
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
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

  // Modal "Kết quả dạy thử không thành công" (UC-REC-06.1 nhánh 5.2, UC-PA-05)
  const [rematchModalItem, setRematchModalItem] = useState(null);
  const [rematchChoice, setRematchChoice] = useState("rematch");
  const [rematchReason, setRematchReason] = useState("");
  const [rematchError, setRematchError] = useState("");

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "blue",
    onConfirm: null,
  });

  // Modal kích hoạt lớp (Xác nhận ghép thành công + bổ sung dữ liệu tính phí)
  const [activateReq, setActivateReq] = useState(null);
  const [activateDetail, setActivateDetail] = useState(null);
  const [activateForm, setActivateForm] = useState({ sessionsPerWeek: "", pricePerSession: "", feePercentage: 40 });
  const [activateError, setActivateError] = useState("");

  // Modal bổ sung thông tin phụ huynh / học sinh (đơn còn "Chờ xử lý", phụ huynh chưa có tài khoản)
  const [infoReq, setInfoReq] = useState(null);
  const [infoDetail, setInfoDetail] = useState(null);
  const [infoForm, setInfoForm] = useState(EMPTY_INFO_FORM);
  const [infoError, setInfoError] = useState("");
  const [isInfoLoading, setIsInfoLoading] = useState(false);

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
        apiGetMatchRequestCounts(currentToken).catch(() => EMPTY_COUNTS),
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
              feePercentage: Number(createFormData.feePercentage) || 40,
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

  // === Bổ sung thông tin phụ huynh / học sinh trước khi chuyển sang dạy thử ===
  const openInfoModal = async (req) => {
    setInfoReq(req);
    setInfoDetail(null);
    setInfoError("");
    setInfoForm({
      ...EMPTY_INFO_FORM,
      parentName: req.parentName || "",
      studentName: req.studentName || "",
      grade: req.grade || "",
      school: req.school || "",
    });
    setIsInfoLoading(true);
    try {
      const detail = await apiGetMatchRequestDetail(req.id, currentToken);
      setInfoDetail(detail);
      setInfoForm({
        parentName: detail.parentName || "",
        parentEmail: detail.parentEmail || "",
        parentAddress: detail.parentAddress || "",
        studentName: detail.studentName || "",
        grade: detail.grade || "",
        school: detail.school || "",
        learningGoal: detail.learningGoal || "",
      });
    } catch {
      // Không tải được chi tiết vẫn cho nhập với dữ liệu sẵn có trên hàng.
    } finally {
      setIsInfoLoading(false);
    }
  };

  const handleInfoSubmit = async (e) => {
    e.preventDefault();
    if (!infoReq) return;
    if (!infoForm.parentName.trim()) {
      setInfoError("Vui lòng nhập họ tên phụ huynh.");
      return;
    }
    if (!infoForm.studentName.trim()) {
      setInfoError("Vui lòng nhập họ tên học sinh — cần để tạo tài khoản khi chuyển sang dạy thử.");
      return;
    }
    if (infoForm.parentEmail.trim() && !/^\S+@\S+\.\S+$/.test(infoForm.parentEmail.trim())) {
      setInfoError("Email phụ huynh không hợp lệ.");
      return;
    }
    setInfoError("");
    setIsSubmitting(true);
    try {
      const payload = {};
      Object.entries(infoForm).forEach(([key, value]) => {
        const text = value.trim();
        if (text) payload[key] = text;
      });
      await apiUpdateMatchRequest(infoReq.id, payload, currentToken);
      setInfoReq(null);
      showToast("Đã lưu thông tin phụ huynh và học sinh.");
      loadData();
    } catch (err) {
      setInfoError(err.message || "Lưu thông tin thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // === UC-REC-06 / UC-ADM-05: Duyệt Đơn ghép lớp (Xác nhận đơn) ===
  const handleConfirmRequest = (req) => {
    // Phụ huynh chưa có tài khoản: cần họ tên học sinh để hệ thống tạo tài khoản khi chuyển dạy thử
    if (!req.studentName) {
      showToast("Vui lòng bổ sung thông tin học sinh trước khi chuyển sang dạy thử.");
      openInfoModal(req);
      return;
    }
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
          const confirmed = await apiConfirmMatchRequest(req.id, currentToken);
          setDetailModalItem(null);
          const accountNote = confirmed?.initialPassword
            ? ` Hệ thống đã tạo tài khoản học sinh: tên đăng nhập "${confirmed.studentUsername}", mật khẩu mặc định "${confirmed.initialPassword}". Vui lòng bàn giao cho gia đình — học sinh sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.`
            : confirmed?.studentUsername
              ? ` Học sinh đăng nhập bằng tài khoản hiện có: "${confirmed.studentUsername}".`
              : "";
          setSuccessPopup(
            `Thao tác thành công! Đơn của học sinh ${req.studentName || req.parentName} đã được chuyển sang trạng thái "Đang dạy thử". Lớp học thử (TRIAL) đã được khởi tạo và gửi thông báo tới gia sư ${req.tutorName}.${accountNote}`
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
  // === UC-REC-06.1 / UC-ADM-05.1: Kích hoạt lớp TRIAL → ACTIVE (modal bổ sung dữ liệu tính phí) ===
  const openActivateModal = async (req) => {
    setActivateReq(req);
    setActivateDetail(null);
    setActivateError("");
    setActivateForm({ sessionsPerWeek: "", pricePerSession: "", feePercentage: req.feePercentage ?? 40 });
    try {
      const detail = await apiGetMatchRequestDetail(req.id, currentToken);
      setActivateDetail(detail);
      if (detail.classSessionsPerWeek) {
        setActivateForm((f) => ({ ...f, sessionsPerWeek: String(detail.classSessionsPerWeek) }));
      }
      if (detail.classPricePerSession) {
        setActivateForm((f) => ({ ...f, pricePerSession: String(detail.classPricePerSession) }));
      }
      if (detail.feePercentage != null) {
        setActivateForm((f) => ({ ...f, feePercentage: detail.feePercentage }));
      }
    } catch {
      // Không tải được chi tiết vẫn mở modal với dữ liệu sẵn có trên hàng.
    }
  };

  const handleCompleteMatch = (req) => {
    openActivateModal(req);
  };

  const activateFee = (() => {
    if (!activateDetail) return null;
    const sessions = Number(activateForm.sessionsPerWeek || activateDetail.classSessionsPerWeek) || 0;
    const price = Number(activateForm.pricePerSession || activateDetail.classPricePerSession || activateDetail.pricePerSession) || 0;
    const fee = Number(activateForm.feePercentage) || 0;
    if (!sessions || !price) return null;
    const raw = price * sessions * 4 * (fee / 100);
    return Math.round(raw / 1000) * 1000;
  })();

  const handleActivateSubmit = async (e) => {
    e.preventDefault();
    if (!activateReq) return;
    setActivateError("");
    setIsSubmitting(true);
    try {
      const body = {};
      if (activateForm.sessionsPerWeek.trim()) body.sessionsPerWeek = Number(activateForm.sessionsPerWeek);
      if (activateForm.pricePerSession.trim()) body.pricePerSession = Number(activateForm.pricePerSession);
      if (activateForm.feePercentage != null && activateForm.feePercentage !== "") {
        body.feePercentage = Number(activateForm.feePercentage);
      }
      await apiCompleteMatchRequest(activateReq.id, currentToken, Object.keys(body).length ? body : undefined);
      setActivateReq(null);
      setDetailModalItem(null);
      setSuccessPopup(
        `Thao tác thành công! Đơn của học sinh ${activateReq.studentName || activateReq.parentName} đã hoàn tất dạy thử và chuyển sang trạng thái "Ghép thành công". Lớp học chính thức (ACTIVE) đã được kích hoạt, khoản phí nhận lớp đã được tạo và thông báo đã gửi tới gia sư ${activateReq.tutorName} cùng học sinh.`
      );
      loadData();
    } catch (err) {
      setActivateError(err.message || "Xác nhận ghép thành công thất bại.");
    } finally {
      setIsSubmitting(false);
    }
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

  // === UC-REC-06.1 nhánh 5.2 / UC-PA-05: Dạy thử không thành công → Ghép lại hoặc Hủy ===
  const handleOpenRematchModal = (req) => {
    setRematchModalItem(req);
    setRematchChoice("rematch");
    setRematchReason("");
    setRematchError("");
  };

  const handleRematchSubmit = (e) => {
    e.preventDefault();
    const item = rematchModalItem;
    const reason = rematchReason.trim();
    if (!reason) {
      setRematchError("Vui lòng nhập lý do dạy thử không thành công.");
      return;
    }

    // "Không tìm nữa" → luồng Hủy đơn (UC-REC-07 kịch bản 5a), điền sẵn lý do.
    if (rematchChoice === "cancel") {
      setRematchModalItem(null);
      setCancelModalItem(item);
      setCancelReason(reason);
      setCancelError("");
      return;
    }

    setConfirmModal({
      open: true,
      title: "Xác nhận ghép lại",
      message: `Đơn sẽ chuyển sang "Đang ghép lại". Lớp dạy thử của gia sư ${item.tutorName || "hiện tại"} sẽ bị hủy và gia sư này không thể ứng tuyển lại đơn. Bạn xác nhận chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiRematchMatchRequest(item.id, reason, currentToken);
          setRematchModalItem(null);
          setDetailModalItem(null);
          setStatusFilter("rematch");
          setPage(0);
          setSuccessPopup(
            `Đơn của học sinh ${item.studentName || item.parentName} đã chuyển sang "Đang ghép lại". Lớp đã mở lại cho gia sư khác ứng tuyển tại trang Lớp cần gia sư.`
          );
          loadData();
        } catch (err) {
          setRematchError(err.message || "Ghép lại đơn thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // Đơn REMATCH chọn gia sư mới ở trang Lớp cần gia sư (cùng prefix /admin hoặc /receptionist).
  const goToClassRequests = (req) => {
    const base = location.pathname.replace(/match-requests.*$/, "class-requests");
    navigate(`${base}?tab=rematch&id=${req.id}`);
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
          icon={RefreshCcw}
          label="Đang ghép lại"
          value={counts.rematch ?? 0}
          hint="Dạy thử chưa thành công"
          tone="violet"
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
              { key: "rematch", label: "Đang ghép lại", count: counts.rematch ?? 0 },
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
            const isRematch = req.status === "REMATCH";

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

                      {/* Gia sư chỉ định — đơn REMATCH hiện gia sư cũ đã bị loại */}
                      {isRematch ? (
                        <div className="p-2.5 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 space-y-1 sm:col-span-2 lg:col-span-1">
                          <div className="text-violet-700 dark:text-violet-300 font-semibold flex items-center gap-1.5">
                            <UserX size={13} className="shrink-0" />
                            <span>Gia sư cũ (đã loại):</span>
                          </div>
                          <div className="font-bold text-foreground truncate">{req.lastTutorName || "Không rõ"}</div>
                          <div className="text-muted-foreground">Đang chờ chọn gia sư mới</div>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-muted/40 border border-border/70 space-y-1 sm:col-span-2 lg:col-span-1">
                          <div className="text-muted-foreground font-semibold flex items-center gap-1.5">
                            <UserCheck size={13} className="text-primary shrink-0" />
                            <span>Gia sư chỉ định:</span>
                          </div>
                          <div className="font-bold text-foreground truncate">{req.tutorName || `Gia sư #${req.tutorId}`}</div>
                          <div className="text-muted-foreground">ID: #{req.tutorId}</div>
                        </div>
                      )}
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
                    {/* Bổ sung thông tin phụ huynh / học sinh trước khi chuyển dạy thử */}
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openInfoModal(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center cursor-pointer active:scale-[0.98]"
                      >
                        <Pencil size={15} />
                        <span>Bổ sung thông tin</span>
                      </Button>
                    )}

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

                    {/* Ghép lại khi dạy thử thất bại (UC-REC-06.1 nhánh 5.2) */}
                    {req.status === "TRIAL" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenRematchModal(req)}
                        disabled={isSubmitting}
                        className="w-full justify-center text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40 border-violet-200 dark:border-violet-800/60 cursor-pointer text-xs"
                      >
                        <RefreshCcw size={15} />
                        <span>Ghép lại</span>
                      </Button>
                    )}

                    {/* Đơn đang ghép lại: chọn gia sư mới ở trang Lớp cần gia sư */}
                    {isRematch && (
                      <Button
                        size="sm"
                        onClick={() => goToClassRequests(req)}
                        className="w-full justify-center bg-violet-600 hover:bg-violet-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98] text-xs"
                      >
                        <ExternalLink size={15} />
                        <span>Xem ứng tuyển</span>
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

              {/* Row 4b: Tỷ lệ phí nhận lớp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Percent size={13} className="text-primary" />
                    Tỷ lệ phí nhận lớp (%)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    step={0.5}
                    value={createFormData.feePercentage}
                    onChange={(e) => setCreateFormData({ ...createFormData, feePercentage: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Dải 0–50, mặc định 40. Phí = tỷ lệ × số buổi/tuần × 4 × học phí/buổi.
                  </p>
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

      {/* ── MODAL: KẾT QUẢ DẠY THỬ KHÔNG THÀNH CÔNG (UC-REC-06.1 nhánh 5.2, UC-PA-05) ── */}
      {rematchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground">
            <button
              type="button"
              onClick={() => setRematchModalItem(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="pr-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <RefreshCcw className="text-violet-500 w-5 h-5" />
                <span>Kết quả dạy thử không thành công</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Đơn <strong>{rematchModalItem.requestCode}</strong> — học sinh{" "}
                <strong>{rematchModalItem.studentName || rematchModalItem.parentName}</strong>, gia sư{" "}
                <strong>{rematchModalItem.tutorName || "chỉ định"}</strong>. Hãy hỏi ý kiến phụ huynh và chọn hướng xử lý.
              </p>
            </div>

            <form onSubmit={handleRematchSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    key: "rematch",
                    icon: RefreshCcw,
                    title: "Tìm gia sư khác",
                    desc: "Đơn chuyển \"Đang ghép lại\", lớp dạy thử bị hủy, gia sư hiện tại bị loại khỏi đơn.",
                    active: "border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-500/20",
                    iconTone: "text-violet-600 dark:text-violet-400",
                  },
                  {
                    key: "cancel",
                    icon: XCircle,
                    title: "Không tìm nữa",
                    desc: "Chuyển sang hủy đơn ghép lớp. Đơn và lớp dạy thử đều bị hủy.",
                    active: "border-rose-500 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500/20",
                    iconTone: "text-rose-600 dark:text-rose-400",
                  },
                ].map((opt) => {
                  const OptIcon = opt.icon;
                  const selected = rematchChoice === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setRematchChoice(opt.key)}
                      aria-pressed={selected}
                      className={`text-left rounded-2xl border p-4 space-y-1.5 transition-all active:scale-[0.98] cursor-pointer ${
                        selected ? opt.active : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                        <OptIcon size={16} className={opt.iconTone} />
                        <span>{opt.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Lý do dạy thử không thành công <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rematchReason}
                  onChange={(e) => setRematchReason(e.target.value)}
                  maxLength={1000}
                  placeholder="VD: Học sinh chưa hợp phương pháp dạy, phụ huynh muốn đổi gia sư có kinh nghiệm luyện thi..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Lý do sẽ được gửi kèm thông báo tới gia sư và học sinh.
                </p>
              </div>

              {rematchError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {rematchError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRematchModalItem(null)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Hủy thao tác
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !rematchReason.trim()}
                  className={`text-white font-bold cursor-pointer active:scale-[0.98] ${
                    rematchChoice === "cancel" ? "bg-rose-600 hover:bg-rose-700" : "bg-violet-600 hover:bg-violet-700"
                  }`}
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>{rematchChoice === "cancel" ? "Tiếp tục hủy đơn" : "Chuyển sang ghép lại"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL KÍCH HOẠT LỚP (Xác nhận ghép thành công + dữ liệu tính phí) ── */}
      {infoReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleInfoSubmit}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground"
          >
            <button
              type="button"
              onClick={() => setInfoReq(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="pr-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Pencil className="text-primary w-5 h-5" />
                <span>Bổ sung thông tin phụ huynh và học sinh</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Nhập sau cuộc gọi tư vấn với phụ huynh. Khi chuyển đơn sang "Đang dạy thử", hệ thống tự tạo tài
                khoản cho học sinh từ thông tin này.
              </p>
            </div>

            {isInfoLoading && (
              <div className="text-center text-muted-foreground text-xs animate-pulse">Đang tải thông tin...</div>
            )}

            {infoError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start gap-2">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>{infoError}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Phụ huynh</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên phụ huynh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.parentName}
                    onChange={(e) => setInfoForm({ ...infoForm, parentName: e.target.value })}
                    className={infoInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Số điện thoại</label>
                  <input
                    type="text"
                    value={infoDetail?.parentPhone || infoReq.parentPhone || ""}
                    readOnly
                    className={`${infoInputClass} opacity-70 cursor-not-allowed`}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <input
                    type="email"
                    value={infoForm.parentEmail}
                    onChange={(e) => setInfoForm({ ...infoForm, parentEmail: e.target.value })}
                    placeholder="VD: lan.tran@gmail.com"
                    className={infoInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={infoForm.parentAddress}
                    onChange={(e) => setInfoForm({ ...infoForm, parentAddress: e.target.value })}
                    placeholder="VD: 12 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                    className={infoInputClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Học sinh</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">
                    Họ tên học sinh <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={infoForm.studentName}
                    onChange={(e) => setInfoForm({ ...infoForm, studentName: e.target.value })}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className={infoInputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Khối lớp</label>
                  <select
                    value={infoForm.grade}
                    onChange={(e) => setInfoForm({ ...infoForm, grade: e.target.value })}
                    className={infoInputClass}
                  >
                    <option value="">Chưa chọn</option>
                    {GRADE_OPTIONS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Trường đang học</label>
                  <input
                    type="text"
                    value={infoForm.school}
                    onChange={(e) => setInfoForm({ ...infoForm, school: e.target.value })}
                    placeholder="VD: THPT Chuyên Chu Văn An"
                    className={infoInputClass}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Mục tiêu học tập</label>
                  <textarea
                    rows={2}
                    value={infoForm.learningGoal}
                    onChange={(e) => setInfoForm({ ...infoForm, learningGoal: e.target.value })}
                    placeholder="VD: Đạt IELTS 6.5 trong 6 tháng"
                    className={`${infoInputClass} resize-none`}
                  />
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                <Info size={14} className="mt-0.5 shrink-0" />
                <span>
                  {infoDetail?.studentAccountCreated
                    ? `Học sinh đã có tài khoản "${infoDetail.studentUsername}", thông tin hồ sơ sẽ được cập nhật.`
                    : "Tài khoản học sinh chưa được tạo. Hệ thống tạo tự động khi bạn chuyển đơn sang trạng thái dạy thử, kèm mật khẩu mặc định và yêu cầu đổi mật khẩu ở lần đăng nhập đầu."}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={() => setInfoReq(null)} className="cursor-pointer">
                Hủy
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting || isInfoLoading} className="cursor-pointer">
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Lưu thông tin</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {activateReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground">
            <button
              type="button"
              onClick={() => setActivateReq(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500 w-5 h-5" />
                <span>Xác nhận ghép thành công</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Lớp của học sinh <strong>{activateReq.studentName || activateReq.parentName}</strong> với gia sư{" "}
                <strong>{activateReq.tutorName || "chỉ định"}</strong> sẽ chuyển sang chính thức. Khoản phí
                nhận lớp được tính theo công thức, không nhập tay.
              </p>
            </div>

            {activateDetail ? (
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs space-y-1.5">
                <div className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Khoản phí nhận lớp sẽ được tạo</span>
                </div>
                <div className="text-blue-700/90 dark:text-blue-300/90 space-y-0.5">
                  <div>
                    Công thức: tỷ lệ phí × số buổi/tuần × 4 × học phí/buổi (làm tròn nghìn đồng)
                  </div>
                  <div>
                    Tỷ lệ phí: <strong>{Number(activateForm.feePercentage) || 0}%</strong>
                    {" · "}Số buổi/tuần: <strong>{activateForm.sessionsPerWeek || activateDetail.classSessionsPerWeek || "chưa có"}</strong>
                    {" · "}Học phí:{" "}
                    <strong>{fmtVND(activateForm.pricePerSession || activateDetail.classPricePerSession || activateDetail.pricePerSession)}</strong>
                  </div>
                  <div>
                    {activateFee != null ? (
                      <>Số phí tính được: <strong className="text-emerald-600 dark:text-emerald-400">{fmtVND(activateFee)}</strong></>
                    ) : (
                      <>Chưa đủ thông tin tính phí — vui lòng bổ sung số buổi/tuần và học phí bên dưới.</>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <form onSubmit={handleActivateSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Số buổi / tuần</label>
                  <input
                    type="number"
                    min={1}
                    value={activateForm.sessionsPerWeek}
                    onChange={(e) => setActivateForm({ ...activateForm, sessionsPerWeek: e.target.value })}
                    placeholder={activateDetail?.classSessionsPerWeek || "VD: 2"}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Học phí / buổi (VNĐ)</label>
                  <input
                    type="number"
                    min={10000}
                    step={10000}
                    value={activateForm.pricePerSession}
                    onChange={(e) => setActivateForm({ ...activateForm, pricePerSession: e.target.value })}
                    placeholder={fmtVND(activateDetail?.classPricePerSession || activateDetail?.pricePerSession)}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Percent size={13} className="text-primary" />
                  Tỷ lệ phí nhận lớp (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  step={0.5}
                  value={activateForm.feePercentage}
                  onChange={(e) => setActivateForm({ ...activateForm, feePercentage: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <p className="text-[11px] text-muted-foreground">
                  Chỉ sửa khi cần ghi đè tỷ lệ đang lưu trên đơn (mặc định 40%, dải 0–50).
                </p>
              </div>

              {activateError && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                  {activateError}
                </p>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActivateReq(null)}
                  disabled={isSubmitting}
                  className="cursor-pointer"
                >
                  Hủy thao tác
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>Xác nhận ghép thành công</span>
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
                    <div className="col-span-2">
                      Tài khoản học sinh:{" "}
                      <strong className="text-foreground">
                        {detailModalItem.studentUsername || "Sẽ được tạo khi chuyển sang dạy thử"}
                      </strong>
                    </div>
                    {detailModalItem.school && (
                      <div className="col-span-2">Trường: <span className="text-foreground">{detailModalItem.school}</span></div>
                    )}
                    {detailModalItem.learningGoal && (
                      <div className="col-span-2">Mục tiêu: <span className="text-foreground">{detailModalItem.learningGoal}</span></div>
                    )}
                  </div>
                </div>

                {/* Đơn đang ghép lại: gia sư cũ đã bị loại */}
                {detailModalItem.status === "REMATCH" && (
                  <div className="p-3.5 rounded-2xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 space-y-1 text-violet-800 dark:text-violet-200">
                    <div className="font-bold flex items-center gap-1.5">
                      <UserX size={14} /> Đang ghép lại
                    </div>
                    <p className="leading-relaxed">
                      Gia sư <strong>{detailModalItem.lastTutorName || "cũ"}</strong> đã bị loại sau buổi dạy thử không thành công.
                      Chọn gia sư mới tại trang Lớp cần gia sư.
                    </p>
                  </div>
                )}

                {/* Thông tin Gia sư chỉ định */}
                {detailModalItem.status !== "REMATCH" && (
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
                )}

                {/* Lịch học & Chi phí */}
                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Calendar size={13} className="text-primary" /> Lịch học & Chi phí
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>Hình thức: <strong className="text-foreground">{detailModalItem.teachingMode === "ONLINE" ? "Trực tuyến" : "Tại nhà"}</strong></div>
                    <div>Học phí: <strong className="text-primary font-bold">{fmtVND(detailModalItem.pricePerSession)}</strong>/buổi</div>
                    <div>Tỷ lệ phí: <strong className="text-foreground">{detailModalItem.feePercentage != null ? detailModalItem.feePercentage + "%" : "40% (mặc định)"}</strong></div>
                    <div>
                      Buổi/tuần (lớp):{" "}
                      <strong className="text-foreground">
                        {detailModalItem.classSessionsPerWeek || "chưa có"}
                      </strong>
                    </div>
                    {detailModalItem.status === "TRIAL" && (() => {
                      const sessions = Number(detailModalItem.classSessionsPerWeek) || 0;
                      const price = Number(detailModalItem.classPricePerSession || detailModalItem.pricePerSession) || 0;
                      const fee = Number(detailModalItem.feePercentage ?? 40) || 0;
                      if (!sessions || !price) {
                        return (
                          <div className="col-span-2 text-amber-600 dark:text-amber-400 font-semibold">
                            Chưa đủ thông tin tính phí nhận lớp — lễ tân bổ sung tại bước kích hoạt.
                          </div>
                        );
                      }
                      const raw = price * sessions * 4 * (fee / 100);
                      const amount = Math.round(raw / 1000) * 1000;
                      return (
                        <div className="col-span-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                          Phí nhận lớp dự kiến: {fmtVND(amount)} = {fee}% × {sessions} buổi/tuần × 4 × {fmtVND(price)}
                        </div>
                      );
                    })()}
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
                    variant="outline"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      openInfoModal(item);
                    }}
                    disabled={isSubmitting}
                    className="cursor-pointer"
                  >
                    <Pencil size={15} />
                    <span>Bổ sung thông tin</span>
                  </Button>
                )}
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
                {detailModalItem.status === "TRIAL" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const item = detailModalItem;
                      setDetailModalItem(null);
                      handleOpenRematchModal(item);
                    }}
                    disabled={isSubmitting}
                    className="text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40 border-violet-200 dark:border-violet-800/60 cursor-pointer text-xs"
                  >
                    <RefreshCcw size={15} />
                    <span>Ghép lại</span>
                  </Button>
                )}
                {detailModalItem.status === "REMATCH" && (
                  <Button
                    size="sm"
                    onClick={() => goToClassRequests(detailModalItem)}
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold cursor-pointer text-xs"
                  >
                    <ExternalLink size={15} />
                    <span>Xem ứng tuyển</span>
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
