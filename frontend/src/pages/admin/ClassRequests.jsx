import { useState, useEffect, useCallback } from "react";
import {
  BookOpen,
  ClipboardList,
  Search,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Megaphone,
  Eye,
  PlusCircle,
  RotateCcw,
  X,
  Loader2,
  GraduationCap,
  Phone,
  MapPin,
  Percent,
  UserCheck,
  UserCog,
  Pencil,
  Calendar,
  MessageSquare,
  Info,
  RefreshCcw,
  UserX,
  Hourglass,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import Avatar from "../../components/ui/Avatar";
import {
  CredentialImagePreview,
  TutorDetailSections,
} from "../../components/tutor/TutorDetailSections";
import { apiGetPublicTutors, apiGetTutorDetail } from "../../lib/tutorApi";
import {
  apiGetClassRequests,
  apiGetClassRequestCounts,
  apiGetClassRequestDetail,
  apiGetClassApplications,
  apiCreateClassRequest,
  apiUpdateClassRequest,
  apiPublishClassRequest,
  apiChangeDesignatedTutor,
  apiConfirmClassRequest,
  apiSelectTutor,
  apiCompleteClassRequest,
  apiRematchClassRequest,
  apiCancelClassRequest,
  apiCheckParent,
} from "../../lib/staffClassRequestApi";

const statusMeta = {
  NEW: { label: "Chờ xử lý", tone: "amber", icon: Clock },
  OPEN: { label: "Đã đăng", tone: "blue", icon: Megaphone },
  TRIAL: { label: "Đang dạy thử", tone: "blue", icon: BookOpen },
  MATCHED: { label: "Ghép thành công", tone: "emerald", icon: CheckCircle2 },
  REMATCH: { label: "Đang ghép lại", tone: "violet", icon: RefreshCcw },
  CANCELLED: { label: "Đã hủy", tone: "slate", icon: XCircle },
};

const EMPTY_COUNTS = { new: 0, open: 0, trial: 0, matched: 0, rematch: 0, cancelled: 0, total: 0 };
const TAB_KEYS = ["all", "new", "open", "trial", "matched", "rematch", "cancelled"];

// Lớp đang nhận ứng tuyển: đã đăng, hoặc đang ghép lại mà chưa có gia sư chỉ định.
const isRecruiting = (req) => req.status === "OPEN" || (req.status === "REMATCH" && !req.tutorId);
// Lớp xác nhận được theo gia sư chỉ định để chuyển dạy thử.
const canConfirm = (req) => (req.status === "NEW" || req.status === "REMATCH") && !!req.tutorId;
const canChangeTutor = (req) => req.status === "NEW" || req.status === "REMATCH";

/** Badge trạng thái lượt ứng tuyển trong modal / chi tiết. */
function ApplicationStatusBadge({ status }) {
  if (status === "SELECTED") return <Badge tone="emerald">Đã chọn</Badge>;
  if (status === "REJECTED") return <Badge tone="slate">Không chọn</Badge>;
  if (status === "TERMINATED") return <Badge tone="rose">Đã loại sau dạy thử</Badge>;
  return <Badge tone="blue">Đã ứng tuyển</Badge>;
}

/** Đếm ngược thời hạn hủy lớp đã ghép thành công (7 ngày kể từ ngày chính thức). */
function CancelCountdown({ req }) {
  if (req.status !== "MATCHED" || req.cancelDaysLeft == null) return null;
  const deadline = formatDate(req.cancelDeadline);
  if (req.cancelDaysLeft < 0) {
    return (
      <div className="flex items-center gap-1.5 rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Hourglass size={13} className="shrink-0" />
        <span>Đã hết hạn hủy lớp từ sau ngày {deadline}.</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/40 dark:bg-amber-950/40 dark:text-amber-400">
      <Hourglass size={13} className="shrink-0" />
      <span>
        {req.cancelDaysLeft === 0 ? (
          <strong>Hôm nay là ngày cuối được hủy lớp.</strong>
        ) : (
          <>
            Còn <strong className="font-mono">{req.cancelDaysLeft}</strong> ngày để hủy lớp, đến hết ngày {deadline}.
          </>
        )}
      </span>
    </div>
  );
}

const GRADES = ["Lớp 6", "Lớp 7", "Lớp 8", "Lớp 9", "Lớp 10", "Lớp 11", "Lớp 12", "Đại học", "Người đi làm"];

const fmtVND = (n) => (n ? Number(n).toLocaleString("vi-VN") + "₫" : "0₫");
const teachingLabel = (m) => (m ? (m === "ONLINE" ? "Trực tuyến (Online)" : "Tại nhà (Offline)") : "Chưa xác định");

function formatDate(value) {
  if (!value) return "";
  const [year, month, day] = String(value).split("-");
  return `${day}/${month}/${year}`;
}

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
  parentEmail: "",
  parentAddress: "",
  studentName: "",
  grade: "Lớp 10",
  school: "",
  learningGoal: "",
  tutorId: "",
  classRequirement: "",
  sessionsPerWeek: 2,
  teachingMode: "ONLINE",
  pricePerSession: 300000,
  feePercentage: 40,
  preferredSchedule: "",
  tutorRequirement: "",
};

const inputClass =
  "w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const PHONE_PATTERN = /^(0|\+84|84)(3|5|7|8|9)\d{8}$/;
const cleanPhone = (phone) => phone.replace(/[\s.\-()]/g, "");

const tutorKey = (t) => t.tutorId ?? t.id;
const tutorLabel = (t) => t.fullName || t.name || `Gia sư #${tutorKey(t)}`;

export function ClassRequestManagement() {
  const { token, session } = useAuth();
  const currentToken = token || session?.token;
  const [searchParams] = useSearchParams();
  const initialTab = TAB_KEYS.includes(searchParams.get("tab")) ? searchParams.get("tab") : "all";

  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [activeTutors, setActiveTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [statusFilter, setStatusFilter] = useState(initialTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modal tạo/sửa lớp: mode "create" | "edit" (chờ xử lý) | "rematch" (đang ghép lại)
  const [formModal, setFormModal] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formError, setFormError] = useState("");
  // Tên phụ huynh đang giữ SĐT vừa nhập, khi khác họ tên trong form
  const [phoneOwner, setPhoneOwner] = useState(null);

  // Modal gia sư chỉ định
  const [tutorModal, setTutorModal] = useState(null); // { item, tutorId }
  const [tutorError, setTutorError] = useState("");

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

  // Modal kết quả dạy thử không thành công
  const [rematchModalItem, setRematchModalItem] = useState(null);
  const [rematchChoice, setRematchChoice] = useState("rematch");
  const [rematchReason, setRematchReason] = useState("");
  const [rematchError, setRematchError] = useState("");

  // Modal xác nhận ghép thành công + bổ sung dữ liệu tính phí
  const [activateReq, setActivateReq] = useState(null);
  const [activateDetail, setActivateDetail] = useState(null);
  const [activateForm, setActivateForm] = useState({ sessionsPerWeek: "", pricePerSession: "", feePercentage: 40 });
  const [activateError, setActivateError] = useState("");

  const [confirmModal, setConfirmModal] = useState({ open: false });
  const [toastMessage, setToastMessage] = useState(null);
  const [successPopup, setSuccessPopup] = useState(null);
  const [previewTutor, setPreviewTutor] = useState(null);
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 3500);
  };
  const closeConfirmModal = () => setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));

  useEffect(() => {
    apiGetPublicTutors({ page: 0, size: 100 })
      .then((res) => setActiveTutors(res?.items || []))
      .catch(() => setActiveTutors([]));
  }, []);

  // Chờ ngừng gõ rồi mới kiểm tra, kết quả cũ bị bỏ khi người dùng đã nhập tiếp.
  useEffect(() => {
    const phone = cleanPhone(formData.phone);
    const parentName = formData.parentName.trim();
    if (formModal?.mode !== "create" || !parentName || !PHONE_PATTERN.test(phone)) {
      setPhoneOwner(null);
      return undefined;
    }
    let active = true;
    const timer = setTimeout(async () => {
      try {
        const result = await apiCheckParent(phone, parentName, currentToken);
        if (active) setPhoneOwner(result.exists && !result.nameMatches ? result.parentName : null);
      } catch {
        // Không kiểm tra được thì không chặn, backend vẫn kiểm tra khi lưu.
        if (active) setPhoneOwner(null);
      }
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formModal?.mode, formData.phone, formData.parentName, currentToken]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [listRes, countsRes] = await Promise.all([
        apiGetClassRequests({ tab: statusFilter, keyword: searchQuery, sort, page, size: 20, token: currentToken }),
        apiGetClassRequestCounts(currentToken).catch(() => EMPTY_COUNTS),
      ]);
      setRequests(listRes.items || []);
      setTotalPages(listRes.totalPages || 1);
      if (countsRes) {
        setCounts(countsRes);
        window.dispatchEvent(new CustomEvent("class-requests-updated", { detail: countsRes }));
      }
    } catch (err) {
      showToast(err.message || "Không thể tải danh sách lớp cần gia sư.", true);
    } finally {
      setIsLoading(false);
    }
  }, [currentToken, statusFilter, searchQuery, sort, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadData();
  };

  // ── Tạo mới / sửa thông tin lớp ───────────────────────────────────────────
  const handleOpenCreate = () => {
    setFormData(INITIAL_FORM);
    setFormError("");
    setFormModal({ mode: "create" });
  };

  const handleOpenEdit = async (req) => {
    setFormError("");
    let item = req;
    try {
      item = (await apiGetClassRequestDetail(req.id, currentToken)) || req;
    } catch {
      // Không tải được chi tiết vẫn cho nhập với dữ liệu sẵn có trên hàng.
    }
    setFormData({
      ...INITIAL_FORM,
      parentName: item.parentName || "",
      phone: item.parentPhone || "",
      parentEmail: item.parentEmail || "",
      parentAddress: item.parentAddress || "",
      studentName: item.studentName || "",
      grade: item.grade || "",
      school: item.school || "",
      learningGoal: item.learningGoal || "",
      tutorId: item.tutorId ? String(item.tutorId) : "",
      classRequirement: item.classRequirement || "",
      sessionsPerWeek: item.sessionsPerWeek || "",
      teachingMode: item.teachingMode || "",
      pricePerSession: item.pricePerSession || "",
      feePercentage: item.feePercentage ?? 40,
      preferredSchedule: item.preferredSchedule || "",
      tutorRequirement: item.tutorRequirement || "",
    });
    setFormModal({ mode: req.status === "REMATCH" ? "rematch" : "edit", item });
  };

  const validateForm = (mode) => {
    const price = Number(formData.pricePerSession);
    if (formData.pricePerSession !== "" && price < 10000) return "Học phí mỗi buổi phải lớn hơn 10.000₫.";
    if (mode === "rematch") return "";
    if (!formData.parentName.trim()) return "Vui lòng nhập họ tên phụ huynh.";
    if (!formData.studentName.trim()) return "Vui lòng nhập họ tên học sinh.";
    if (formData.parentEmail.trim() && !/^\S+@\S+\.\S+$/.test(formData.parentEmail.trim()))
      return "Email phụ huynh không hợp lệ.";
    if (mode === "create") {
      if (!PHONE_PATTERN.test(cleanPhone(formData.phone)))
        return "Vui lòng nhập đúng số điện thoại (10 chữ số nhà mạng Việt Nam).";
      if (!formData.classRequirement.trim()) return "Vui lòng nhập yêu cầu lớp học.";
      if (!formData.pricePerSession) return "Vui lòng nhập học phí mỗi buổi.";
    }
    return "";
  };

  /** Chỉ gửi các trường có giá trị để không ghi đè dữ liệu cũ bằng chuỗi rỗng. */
  const buildPayload = (keys) => {
    const payload = {};
    keys.forEach((key) => {
      const value = formData[key];
      const text = typeof value === "string" ? value.trim() : value;
      if (text !== "" && text !== null && text !== undefined) payload[key] = text;
    });
    return payload;
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    const mode = formModal?.mode;
    const err = validateForm(mode);
    if (err) {
      setFormError(err);
      return;
    }
    setFormError("");

    const isCreate = mode === "create";
    setConfirmModal({
      open: true,
      title: isCreate ? "Xác nhận tạo lớp" : "Xác nhận cập nhật lớp",
      message: isCreate
        ? "Bạn xác nhận tạo lớp này chứ? Lớp sẽ ở trạng thái Chờ xử lý để Lễ tân tiếp tục trao đổi."
        : `Bạn xác nhận cập nhật thông tin lớp ${formModal.item.requestCode} chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          if (isCreate) {
            await apiCreateClassRequest(
              {
                ...buildPayload([
                  "parentName", "studentName", "grade", "school", "learningGoal", "classRequirement",
                  "teachingMode", "preferredSchedule", "tutorRequirement",
                ]),
                phone: cleanPhone(formData.phone),
                tutorId: formData.tutorId ? Number(formData.tutorId) : null,
                sessionsPerWeek: Number(formData.sessionsPerWeek) || null,
                pricePerSession: Number(formData.pricePerSession),
                feePercentage: Number(formData.feePercentage) || 40,
              },
              currentToken
            );
            setSuccessPopup(`Đã tạo lớp cho học sinh ${formData.studentName}. Lớp đang ở mục "Chờ xử lý".`);
          } else if (mode === "rematch") {
            const payload = buildPayload(["classRequirement", "learningGoal", "tutorRequirement"]);
            if (formData.pricePerSession) payload.pricePerSession = Number(formData.pricePerSession);
            await apiUpdateClassRequest(formModal.item.id, payload, currentToken);
            showToast("Đã cập nhật thông tin lớp, gia sư đang ứng tuyển sẽ nhận được thông báo.");
          } else {
            const payload = buildPayload([
              "parentName", "parentEmail", "parentAddress", "studentName", "grade", "school", "learningGoal",
              "classRequirement", "teachingMode", "preferredSchedule", "tutorRequirement",
            ]);
            if (formData.pricePerSession) payload.pricePerSession = Number(formData.pricePerSession);
            if (formData.sessionsPerWeek) payload.sessionsPerWeek = Number(formData.sessionsPerWeek);
            if (formData.feePercentage !== "") payload.feePercentage = Number(formData.feePercentage);
            await apiUpdateClassRequest(formModal.item.id, payload, currentToken);
            if (formData.tutorId !== String(formModal.item.tutorId ?? "")) {
              await apiChangeDesignatedTutor(
                formModal.item.id,
                formData.tutorId ? Number(formData.tutorId) : null,
                currentToken
              );
            }
            showToast("Đã lưu thông tin lớp.");
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

  // ── Gia sư chỉ định ───────────────────────────────────────────────────────
  const handleOpenTutorModal = (req) => {
    setTutorError("");
    setTutorModal({ item: req, tutorId: req.tutorId ? String(req.tutorId) : "" });
  };

  const handleTutorSubmit = async (e) => {
    e.preventDefault();
    setTutorError("");
    setIsSubmitting(true);
    try {
      await apiChangeDesignatedTutor(
        tutorModal.item.id,
        tutorModal.tutorId ? Number(tutorModal.tutorId) : null,
        currentToken
      );
      setTutorModal(null);
      showToast(tutorModal.tutorId ? "Đã cập nhật gia sư chỉ định." : "Đã bỏ gia sư chỉ định.");
      loadData();
    } catch (err) {
      setTutorError(err.message || "Không thể đổi gia sư chỉ định.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Đăng lớp (Chờ xử lý → Đã đăng) ───────────────────────────────────────
  const handlePublish = (req) => {
    setConfirmModal({
      open: true,
      title: "Đăng lớp",
      message: `Bạn xác nhận đăng lớp "${req.classRequirement || req.requestCode}" lên trang gia sư chứ?`,
      confirmLabel: "Đăng lớp",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiPublishClassRequest(req.id, currentToken);
          showToast("Đã đăng lớp lên trang gia sư.");
          loadData();
        } catch (err) {
          showToast(err.message || "Đăng lớp thất bại.", true);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const accountNote = (result) =>
    result?.initialPassword
      ? ` Tài khoản học sinh: tên đăng nhập "${result.studentUsername}", mật khẩu mặc định "${result.initialPassword}". Vui lòng bàn giao cho gia đình, học sinh sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.`
      : result?.studentUsername
        ? ` Học sinh đăng nhập bằng tài khoản hiện có: "${result.studentUsername}".`
        : "";

  // ── Xác nhận lớp có gia sư chỉ định → Đang dạy thử ────────────────────────
  const handleConfirmRequest = (req) => {
    if (!req.studentName) {
      showToast("Vui lòng bổ sung thông tin học sinh trước khi chuyển sang dạy thử.", true);
      handleOpenEdit(req);
      return;
    }
    setConfirmModal({
      open: true,
      title: "Xác nhận chuyển dạy thử",
      message: `Bạn xác nhận gia sư ${req.tutorName || "chỉ định"} và phụ huynh ${req.parentName} đã đồng ý, chuyển lớp sang "Đang dạy thử" chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          const confirmed = await apiConfirmClassRequest(req.id, currentToken);
          setSuccessPopup(
            `Lớp của học sinh ${req.studentName} đã chuyển sang "Đang dạy thử" và đã gửi thông báo tới gia sư ${req.tutorName}.${accountNote(confirmed)}`
          );
          loadData();
        } catch (err) {
          showToast(err.message || "Xác nhận thất bại.", true);
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
      showToast(err.message || "Không thể tải danh sách gia sư ứng tuyển.", true);
      setApplicationsModal(null);
    } finally {
      setIsApplicationsLoading(false);
    }
  };

  const handlePreviewTutor = async (application) => {
    setPreviewLoadingId(application.applicationId);
    try {
      setPreviewTutor(await apiGetTutorDetail(application.tutorId, currentToken));
    } catch (err) {
      showToast(err.message || "Không thể tải hồ sơ gia sư.", true);
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const handleSelectTutor = (application) => {
    const req = applicationsModal.request;
    setConfirmModal({
      open: true,
      title: "Chọn gia sư",
      message: `Bạn xác nhận chọn gia sư ${application.tutorName} cho lớp này chứ? Lớp sẽ chuyển sang "Đang dạy thử".`,
      confirmLabel: "Đồng ý",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          const selected = await apiSelectTutor(req.id, application.applicationId, currentToken);
          setApplicationsModal(null);
          setSuccessPopup(
            `Đã chọn gia sư ${application.tutorName}! Lớp đã chuyển sang "Đang dạy thử" và đã gửi thông báo tới gia sư.${accountNote(selected)}`
          );
          loadData();
        } catch (err) {
          showToast(err.message || "Chọn gia sư thất bại.", true);
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const openActivateModal = async (req) => {
    setActivateReq(req);
    setActivateDetail(null);
    setActivateError("");
    setActivateForm({ sessionsPerWeek: "", pricePerSession: "", feePercentage: req.feePercentage ?? 40 });
    try {
      const detail = await apiGetClassRequestDetail(req.id, currentToken);
      setActivateDetail(detail);
      if (detail.classSessionsPerWeek || detail.sessionsPerWeek) {
        setActivateForm((f) => ({ ...f, sessionsPerWeek: String(detail.classSessionsPerWeek || detail.sessionsPerWeek) }));
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
      await apiCompleteClassRequest(activateReq.id, currentToken, Object.keys(body).length ? body : undefined);
      setActivateReq(null);
      setSuccessPopup(
        `Lớp của học sinh ${activateReq.studentName || activateReq.parentName} đã hoàn tất dạy thử và chuyển sang trạng thái "Ghép thành công". Lớp học chính thức (ACTIVE) đã được kích hoạt, khoản phí nhận lớp đã được tạo và thông báo đã gửi tới gia sư ${activateReq.tutorName} cùng học sinh.`
      );
      loadData();
    } catch (err) {
      setActivateError(err.message || "Xác nhận ghép thành công thất bại.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

    // "Không tìm nữa" chuyển sang luồng hủy lớp, điền sẵn lý do.
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
      message: `Lớp sẽ chuyển sang "Đang ghép lại". Buổi dạy thử của gia sư ${item.tutorName || "hiện tại"} kết thúc và gia sư này không thể ứng tuyển lại lớp. Bạn xác nhận chứ?`,
      confirmLabel: "Đồng ý",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        setIsSubmitting(true);
        try {
          await apiRematchClassRequest(item.id, reason, currentToken);
          setRematchModalItem(null);
          setStatusFilter("rematch");
          setPage(0);
          setSuccessPopup(
            `Lớp của học sinh ${item.studentName || item.parentName} đã chuyển sang "Đang ghép lại" và mở lại cho gia sư khác ứng tuyển.`
          );
          loadData();
        } catch (err) {
          setRematchError(err.message || "Ghép lại thất bại.");
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  // ── Hủy lớp ───────────────────────────────────────────────────────────────
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
      title: "Hủy lớp",
      message: "Bạn chắc chắn muốn hủy lớp này chứ? Lớp học liên quan (nếu có) sẽ bị hủy và hệ thống thông báo tới các bên.",
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
    { key: "trial", label: "Đang dạy thử", count: counts.trial },
    { key: "matched", label: "Ghép thành công", count: counts.matched },
    { key: "rematch", label: "Đang ghép lại", count: counts.rematch ?? 0 },
    { key: "cancelled", label: "Đã hủy", count: counts.cancelled },
  ];

  /** Nút thao tác theo trạng thái lớp, dùng chung cho thẻ lớp và modal chi tiết. */
  const renderActions = (req, widthClass = "") => {
    const run = (handler) => () => {
      setDetailModalItem(null);
      handler(req);
    };
    const pendingCount =
      req.pendingApplicationCount ?? req.applications?.filter((a) => a.status === "APPLIED").length ?? 0;
    const cancelExpired = req.status === "MATCHED" && req.cancellable === false;
    return (
      <>
        {(req.status === "NEW" || req.status === "REMATCH") && (
          <Button
            size="sm"
            variant="outline"
            onClick={run(handleOpenEdit)}
            disabled={isSubmitting}
            className={`${widthClass} justify-center cursor-pointer text-xs active:scale-[0.98]`}
          >
            <Pencil size={15} />
            <span>{req.status === "NEW" ? "Bổ sung thông tin" : "Sửa thông tin"}</span>
          </Button>
        )}
        {canChangeTutor(req) && (
          <Button
            size="sm"
            variant="outline"
            onClick={run(handleOpenTutorModal)}
            disabled={isSubmitting}
            className={`${widthClass} justify-center cursor-pointer text-xs active:scale-[0.98]`}
          >
            <UserCog size={15} />
            <span>Gia sư chỉ định</span>
          </Button>
        )}
        {canConfirm(req) && (
          <Button
            size="sm"
            onClick={run(handleConfirmRequest)}
            disabled={isSubmitting}
            className={`${widthClass} justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]`}
          >
            <CheckCircle2 size={15} />
            <span>Xác nhận đơn</span>
          </Button>
        )}
        {req.status === "NEW" && !req.tutorId && (
          <Button
            size="sm"
            onClick={run(handlePublish)}
            disabled={isSubmitting}
            className={`${widthClass} justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]`}
          >
            <Megaphone size={15} />
            <span>Đăng lớp</span>
          </Button>
        )}
        {isRecruiting(req) && (
          <Button
            size="sm"
            onClick={run(handleOpenApplications)}
            disabled={isSubmitting || pendingCount === 0}
            title={pendingCount === 0 ? "Chưa có gia sư ứng tuyển" : "Xem danh sách gia sư ứng tuyển"}
            className={`${widthClass} justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Users size={15} />
            <span>Danh sách ứng tuyển</span>
          </Button>
        )}
        {req.status === "TRIAL" && (
          <>
            <Button
              size="sm"
              onClick={run(openActivateModal)}
              disabled={isSubmitting}
              className={`${widthClass} justify-center bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-xs active:scale-[0.98]`}
            >
              <CheckCircle2 size={15} />
              <span>Xác nhận ghép thành công</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={run(handleOpenRematchModal)}
              disabled={isSubmitting}
              className={`${widthClass} justify-center text-violet-700 hover:bg-violet-50 dark:text-violet-300 dark:hover:bg-violet-950/40 border-violet-200 dark:border-violet-800/60 cursor-pointer text-xs active:scale-[0.98]`}
            >
              <RefreshCcw size={15} />
              <span>Ghép lại</span>
            </Button>
          </>
        )}
        {req.status !== "CANCELLED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={run(handleOpenCancel)}
            disabled={isSubmitting || cancelExpired}
            title={cancelExpired ? "Đã quá 7 ngày kể từ khi ghép thành công" : undefined}
            className={`${widthClass} justify-center text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 cursor-pointer text-xs active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent`}
          >
            <XCircle size={15} />
            <span>Hủy lớp</span>
          </Button>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm text-white shadow-xl animate-fade-in ${
            toastMessage.isError
              ? "bg-rose-600"
              : "border border-blue-200 bg-slate-900 dark:border-blue-900"
          }`}
        >
          {toastMessage.isError ? (
            <AlertCircle size={18} className="shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-blue-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          {toastMessage.isError && (
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="ml-1 cursor-pointer opacity-70 transition-opacity hover:opacity-100"
              aria-label="Đóng thông báo"
            >
              <X size={14} />
            </button>
          )}
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
            description="Tiếp nhận yêu cầu của phụ huynh, chỉ định hoặc đăng tuyển gia sư, theo dõi dạy thử và ghép lớp."
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

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={ClipboardList} label="Tổng số lớp" value={counts.total} hint="Toàn bộ lịch sử" tone="blue" />
        <StatCard icon={Clock} label="Chờ xử lý" value={counts.new} hint="Cần gọi lại phụ huynh" tone="amber" />
        <StatCard icon={Megaphone} label="Đã đăng" value={counts.open} hint="Gia sư đang ứng tuyển" tone="blue" />
        <StatCard icon={BookOpen} label="Đang dạy thử" value={counts.trial} hint="Gia sư đang dạy thử" tone="blue" />
        <StatCard icon={CheckCircle2} label="Ghép thành công" value={counts.matched} hint="Đã chính thức" tone="emerald" />
        <StatCard icon={RefreshCcw} label="Đang ghép lại" value={counts.rematch ?? 0} hint="Dạy thử chưa thành công" tone="violet" />
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

          <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-2">
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
            <div className="relative min-w-0 w-full flex-1 basis-full sm:basis-64 sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo PH, SĐT, HS, gia sư, mã lớp..."
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
            const isRematch = req.status === "REMATCH";
            const hasClass = req.status === "TRIAL" || req.status === "MATCHED";
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
                      <Badge tone={meta.tone}>
                        <StatusIcon size={12} className="mr-1 inline" />
                        {meta.label}
                      </Badge>
                      {(isRecruiting(req) || appCount > 0) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                          <Users size={12} /> {appCount} gia sư ứng tuyển
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs pt-1">
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
                          <UserCheck size={13} className="text-primary shrink-0" />
                          <span>{hasClass ? "Gia sư phụ trách:" : "Gia sư chỉ định:"}</span>
                        </div>
                        <div className="font-bold text-foreground truncate">
                          {req.tutorName || (hasClass && req.lastTutorName) || "Không"}
                        </div>
                        <div className="text-muted-foreground">
                          {req.tutorId || (hasClass && req.lastTutorId)
                            ? `ID: #${req.tutorId || req.lastTutorId}`
                            : "Đăng tuyển gia sư"}
                        </div>
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
                        <span>Gửi lúc: {formatTs(req.createdAt)}</span>
                      </div>
                    </div>

                    <CancelCountdown req={req} />

                    {isRematch && (
                      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800/40 text-xs text-violet-800 dark:text-violet-200 flex items-start gap-1.5">
                        <UserX size={14} className="shrink-0 mt-0.5" />
                        <p className="leading-relaxed">
                          Gia sư <strong>{req.lastTutorName || "cũ"}</strong> đã bị loại sau dạy thử.{" "}
                          {req.tutorId
                            ? "Lớp đang tạm ẩn khỏi trang gia sư vì đã có gia sư chỉ định."
                            : "Lớp đang hiển thị để gia sư khác ứng tuyển."}
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

                  <div className="flex flex-col sm:flex-row sm:flex-wrap lg:flex-col gap-2 shrink-0 lg:w-52 justify-center pt-2 lg:pt-0 border-t lg:border-t-0 border-border">
                    {renderActions(req, "w-full")}
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


      {/* ── MODAL: TẠO / SỬA LỚP ─────────────────────────────────────────────── */}
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
            <div className="pr-8">
              <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                {formModal.mode === "create"
                  ? "Tạo mới Lớp cần gia sư"
                  : formModal.mode === "edit"
                    ? "Bổ sung thông tin lớp"
                    : "Sửa thông tin lớp đang ghép lại"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {formModal.mode === "rematch"
                  ? "Khi đang ghép lại chỉ sửa được học phí, mục tiêu và yêu cầu gia sư. Gia sư đang ứng tuyển sẽ nhận được thông báo."
                  : "Thông tin phụ huynh và học sinh không công khai với gia sư. Tài khoản học sinh được tạo khi lớp chuyển sang Đang dạy thử."}
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {formModal.mode !== "rematch" && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Họ tên phụ huynh <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                        placeholder="VD: Nguyễn Văn Toàn"
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">
                        Số điện thoại <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        disabled={formModal.mode !== "create"}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="VD: 0987654321"
                        className={inputClass}
                      />
                    </div>
                    {formModal.mode === "edit" && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Email phụ huynh</label>
                          <input
                            type="email"
                            value={formData.parentEmail}
                            onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                            placeholder="VD: lan.tran@gmail.com"
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-foreground">Địa chỉ liên hệ</label>
                          <input
                            type="text"
                            value={formData.parentAddress}
                            onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                            placeholder="VD: 12 Nguyễn Trãi, Thanh Xuân, Hà Nội"
                            className={inputClass}
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {formModal.mode === "edit" && (
                    <p className="text-[11px] text-muted-foreground">
                      Đổi họ tên hoặc liên hệ của phụ huynh sẽ áp dụng cho mọi lớp của phụ huynh này.
                    </p>
                  )}

                  {phoneOwner && (
                    <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-700 dark:text-amber-400 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                        <span>
                          Số điện thoại này thuộc về phụ huynh <strong>{phoneOwner}</strong>. Hãy xác nhận lại với phụ
                          huynh: nhầm số thì đổi số điện thoại, cùng gia đình thì dùng phụ huynh này.
                        </span>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({ ...formData, parentName: phoneOwner });
                          setPhoneOwner(null);
                        }}
                        className="cursor-pointer active:scale-[0.98]"
                      >
                        <UserCheck size={15} />
                        <span>Dùng phụ huynh {phoneOwner}</span>
                      </Button>
                    </div>
                  )}

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
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-foreground">Khối lớp</label>
                      <select
                        value={formData.grade}
                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Chưa chọn</option>
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
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Gia sư chỉ định</label>
                    <select
                      value={formData.tutorId}
                      onChange={(e) => setFormData({ ...formData, tutorId: e.target.value })}
                      className={inputClass}
                    >
                      <option value="">Không chỉ định, trung tâm đăng tuyển</option>
                      {/* Gia sư đã chọn nhưng không còn trong danh sách đang hoạt động vẫn phải hiện đúng */}
                      {formData.tutorId && !activeTutors.some((t) => String(tutorKey(t)) === formData.tutorId) && (
                        <option value={formData.tutorId}>
                          {formModal.item?.tutorName || "Gia sư"} (ID: #{formData.tutorId})
                        </option>
                      )}
                      {activeTutors.map((t) => (
                        <option key={tutorKey(t)} value={tutorKey(t)}>
                          {tutorLabel(t)} (ID: #{tutorKey(t)})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Yêu cầu lớp học {formModal.mode === "create" && <span className="text-rose-500">*</span>}
                </label>
                <textarea
                  rows={2}
                  value={formData.classRequirement}
                  onChange={(e) => setFormData({ ...formData, classRequirement: e.target.value })}
                  placeholder="VD: Luyện IELTS từ 5.0 lên 6.5, tập trung Speaking và Grammar"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Mục tiêu học tập</label>
                <textarea
                  rows={2}
                  value={formData.learningGoal}
                  onChange={(e) => setFormData({ ...formData, learningGoal: e.target.value })}
                  placeholder="VD: Đạt IELTS 6.5 trong 6 tháng"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {formModal.mode !== "rematch" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Hình thức học</label>
                    <select
                      value={formData.teachingMode}
                      onChange={(e) => setFormData({ ...formData, teachingMode: e.target.value })}
                      className={inputClass}
                    >
                      {formModal.mode === "edit" && <option value="">Chưa xác định</option>}
                      <option value="ONLINE">Trực tuyến (Online)</option>
                      <option value="AT_HOME">Tại nhà (Offline)</option>
                    </select>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Học phí / buổi (VNĐ) {formModal.mode === "create" && <span className="text-rose-500">*</span>}
                  </label>
                  <input
                    type="number"
                    step={10000}
                    min={10000}
                    value={formData.pricePerSession}
                    onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                    className={inputClass}
                  />
                </div>
                {formModal.mode !== "rematch" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Số buổi / tuần</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.sessionsPerWeek}
                      onChange={(e) => setFormData({ ...formData, sessionsPerWeek: e.target.value })}
                      className={inputClass}
                    />
                  </div>
                )}
                {formModal.mode !== "rematch" && (
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
                      value={formData.feePercentage}
                      onChange={(e) => setFormData({ ...formData, feePercentage: e.target.value })}
                      className={inputClass}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dải 0–50, mặc định 40. Phí = tỷ lệ × số buổi/tuần × 4 × học phí/buổi.
                    </p>
                  </div>
                )}
              </div>

              {formModal.mode !== "rematch" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Lịch học mong muốn</label>
                  <input
                    type="text"
                    value={formData.preferredSchedule}
                    onChange={(e) => setFormData({ ...formData, preferredSchedule: e.target.value })}
                    placeholder="VD: 2 buổi/tuần, tối Thứ 3 và Thứ 6 (19:30 - 21:00)"
                    className={inputClass}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Yêu cầu đối với gia sư</label>
                <textarea
                  rows={2}
                  value={formData.tutorRequirement}
                  onChange={(e) => setFormData({ ...formData, tutorRequirement: e.target.value })}
                  placeholder="VD: Gia sư IELTS 7.5 trở lên, có kinh nghiệm dạy THPT"
                  className={inputClass}
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
                <Button type="submit" disabled={isSubmitting || !!phoneOwner} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                  <span>{formModal.mode === "create" ? "Tạo lớp" : "Lưu thay đổi"}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GIA SƯ CHỈ ĐỊNH ─────────────────────────────────────────── */}
      {tutorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <form
            onSubmit={handleTutorSubmit}
            className="relative w-full max-w-md rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-2xl space-y-5 text-card-foreground"
          >
            <button
              type="button"
              onClick={() => setTutorModal(null)}
              className="absolute top-4 right-4 p-2 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>
            <div className="pr-8">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <UserCog className="text-primary w-5 h-5" />
                <span>Gia sư chỉ định</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Lớp <strong>{tutorModal.item.requestCode}</strong> — {tutorModal.item.classRequirement || "Lớp cần gia sư"}
              </p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Chọn gia sư</label>
              <select
                value={tutorModal.tutorId}
                onChange={(e) => setTutorModal({ ...tutorModal, tutorId: e.target.value })}
                className={inputClass}
              >
                <option value="">Không</option>
                {activeTutors
                  .filter((t) => String(tutorKey(t)) !== String(tutorModal.item.lastTutorId) || tutorModal.item.status !== "REMATCH")
                  .map((t) => (
                    <option key={tutorKey(t)} value={tutorKey(t)}>
                      {tutorLabel(t)} (ID: #{tutorKey(t)})
                    </option>
                  ))}
              </select>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
              <Info size={14} className="mt-0.5 shrink-0" />
              <span>
                {tutorModal.item.status === "REMATCH"
                  ? "Chọn gia sư thì lớp tạm ẩn khỏi trang gia sư. Chọn Không thì lớp hiển thị lại để gia sư ứng tuyển."
                  : "Chọn gia sư để xác nhận chuyển dạy thử. Chọn Không để đăng lớp cho gia sư ứng tuyển."}
              </span>
            </div>
            {tutorError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
                {tutorError}
              </p>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setTutorModal(null)} disabled={isSubmitting} className="cursor-pointer">
                Hủy thao tác
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold cursor-pointer">
                {isSubmitting ? <Loader2 size={15} className="animate-spin mr-1.5" /> : null}
                <span>Lưu</span>
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* ── MODAL: DANH SÁCH GIA SƯ ỨNG TUYỂN ──────────────────── */}
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
                      <div className="flex shrink-0 flex-col items-stretch gap-2">
                        {app.status !== "APPLIED" ? (
                          <div className="self-end">
                            <ApplicationStatusBadge status={app.status} />
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleSelectTutor(app)}
                            disabled={isSubmitting}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                          >
                            <CheckCircle2 size={15} />
                            <span>Chọn gia sư</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePreviewTutor(app)}
                          disabled={previewLoadingId === app.applicationId}
                          className="cursor-pointer"
                        >
                          {previewLoadingId === app.applicationId ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Eye size={15} />
                          )}
                          <span>Xem chi tiết</span>
                        </Button>
                      </div>
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

      {/* ── MODAL: XEM TRƯỚC HỒ SƠ GIA SƯ ỨNG TUYỂN ───────────────────────── */}
      {previewTutor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setPreviewTutor(null)}
        >
          <div
            className="fade-slide-in relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border p-5">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar
                  src={previewTutor.avatarUrl}
                  initials={(previewTutor.fullName || "GS").substring(0, 2).toUpperCase()}
                  size="lg"
                />
                <div className="min-w-0">
                  <h3 className="truncate text-base font-bold text-slate-900 dark:text-white">{previewTutor.fullName}</h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Hồ sơ gia sư ứng tuyển</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewTutor(null)}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 space-y-5 overflow-y-auto p-5 text-xs">
              <TutorDetailSections tutor={previewTutor} onPreviewImage={setPreviewImage} />
            </div>
            <div className="flex justify-end border-t border-border p-4">
              <Button variant="secondary" size="sm" onClick={() => setPreviewTutor(null)} className="cursor-pointer">
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
      {previewImage && (
        <CredentialImagePreview url={previewImage} onClose={() => setPreviewImage(null)} />
      )}

      {/* ── MODAL: HỦY LỚP ─────────────────────────────────────── */}
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
                <span>Hủy lớp</span>
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
                  placeholder="Nhập lý do hủy lớp"
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

      {/* ── MODAL: KẾT QUẢ DẠY THỬ KHÔNG THÀNH CÔNG ── */}
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
                Lớp <strong>{rematchModalItem.requestCode}</strong> — học sinh{" "}
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
                    desc: "Lớp chuyển \"Đang ghép lại\", gia sư hiện tại bị loại khỏi lớp, các gia sư từng ứng tuyển được quay lại.",
                    active: "border-violet-500 bg-violet-50 dark:bg-violet-950/40 ring-2 ring-violet-500/20",
                    iconTone: "text-violet-600 dark:text-violet-400",
                  },
                  {
                    key: "cancel",
                    icon: XCircle,
                    title: "Không tìm nữa",
                    desc: "Chuyển sang hủy lớp.",
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
                  <span>{rematchChoice === "cancel" ? "Tiếp tục hủy lớp" : "Chuyển sang ghép lại"}</span>
                </Button>
              </div>
            </form>
          </div>
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
                  Chỉ sửa khi cần ghi đè tỷ lệ đang lưu trên lớp (mặc định 40%, dải 0–50).
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
                    <div className="col-span-2">
                      Tài khoản học sinh:{" "}
                      <strong className="text-foreground font-mono">
                        {detailModalItem.studentUsername || "Sẽ được tạo khi chuyển sang dạy thử"}
                      </strong>
                    </div>
                    {detailModalItem.initialPassword && (
                      <div className="col-span-2">
                        Mật khẩu mặc định: <strong className="text-foreground font-mono">{detailModalItem.initialPassword}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 border border-border space-y-2">
                  <div className="font-bold text-foreground uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck size={13} className="text-primary" />{" "}
                    {detailModalItem.status === "TRIAL" || detailModalItem.status === "MATCHED" ? "Gia sư phụ trách" : "Gia sư chỉ định"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                    <div>
                      Gia sư:{" "}
                      <strong className="text-foreground">
                        {detailModalItem.tutorName ||
                          ((detailModalItem.status === "TRIAL" || detailModalItem.status === "MATCHED") && detailModalItem.lastTutorName) ||
                          "Không"}
                      </strong>
                    </div>
                    {detailModalItem.tutorId && <div>Mã gia sư: <strong className="text-foreground font-mono">#{detailModalItem.tutorId}</strong></div>}
                    {detailModalItem.tutorEmail && <div>Email: <span className="text-foreground">{detailModalItem.tutorEmail}</span></div>}
                    {detailModalItem.tutorPhone && <div>SĐT: <span className="text-foreground font-mono">{detailModalItem.tutorPhone}</span></div>}
                    {detailModalItem.status === "REMATCH" && detailModalItem.lastTutorName && (
                      <div className="col-span-2">Gia sư cũ (đã loại): <span className="text-foreground">{detailModalItem.lastTutorName}</span></div>
                    )}
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

                <CancelCountdown req={detailModalItem} />

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
              <div className="flex flex-wrap items-center gap-2">{renderActions(detailModalItem)}</div>
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
