import { useState, useEffect, useCallback } from "react";
import {
  Pencil,
  Search,
  X,
  Check,
  UserCheck,
  UserX,
  Users,
  Clock,
  ShieldCheck,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Eye,
  MapPin,
  Award,
  BookOpen,
  FileCheck,
  FileText,
  Lock,
  Info,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Video,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import {
  apiGetTutors,
  apiGetTutorCounts,
  apiGetTutorDetail,
  apiApproveTutor,
  apiRejectTutor,
  apiUpdateTutorStatus,
  apiUpdateTutorProfile,
} from "../../lib/tutorApi";

const statusTabs = [
  { value: "PENDING", label: "Chờ duyệt", tone: "amber", icon: Clock },
  { value: "ACTIVE", label: "Đang hoạt động", tone: "emerald", icon: UserCheck },
  { value: "INACTIVE", label: "Ngưng hoạt động", tone: "slate", icon: UserX },
  { value: "ALL", label: "Tất cả", tone: "blue", icon: Users },
];

const statusMeta = {
  PENDING: { label: "Chờ duyệt", tone: "amber" },
  ACTIVE: { label: "Đang hoạt động", tone: "emerald" },
  INACTIVE: { label: "Ngưng hoạt động", tone: "slate" },
  REJECTED: { label: "Bị từ chối", tone: "rose" },
  INCOMPLETE: { label: "Chưa hoàn thiện", tone: "zinc" },
};

export function TutorManagement() {
  const { token: authToken } = useAuth();
  const token = authToken || localStorage.getItem("gsa_token");

  // State danh sách & phân trang
  const [tutors, setTutors] = useState([]);
  const [counts, setCounts] = useState({ PENDING: 0, ACTIVE: 0, INACTIVE: 0, REJECTED: 0, ALL: 0 });
  const [loading, setLoading] = useState(false);
  const [statusTab, setStatusTab] = useState("PENDING");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);
  const [size] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modal xem chi tiết
  const [viewingTutor, setViewingTutor] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal xem trước ảnh chứng chỉ (Image Lightbox)
  const [previewImage, setPreviewImage] = useState(null);

  // Modal từ chối hồ sơ kèm lý do
  const [rejectModal, setRejectModal] = useState({
    open: false,
    tutor: null,
    reason: "",
    error: "",
  });

  // Modal chỉnh sửa thông tin hồ sơ
  const [editModal, setEditModal] = useState({
    open: false,
    tutor: null,
    form: {},
  });

  // ConfirmModal
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "blue",
    onConfirm: null,
  });

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Tải số lượng đếm trạng thái
  const fetchCounts = useCallback(async () => {
    try {
      const data = await apiGetTutorCounts(token);
      setCounts(data);
    } catch (err) {
      console.warn("Không thể tải số lượng trạng thái gia sư:", err.message);
    }
  }, [token]);

  // Tải danh sách gia sư
  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiGetTutors(
        {
          status: statusTab === "ALL" ? null : statusTab,
          keyword: debouncedQuery,
          page,
          size,
        },
        token
      );
      setTutors(response.items || []);
      setTotalPages(response.totalPages || 1);
      setTotalItems(response.totalItems || 0);
    } catch (err) {
      showToast(err.message || "Tải danh sách gia sư thất bại", true);
    } finally {
      setLoading(false);
    }
  }, [statusTab, debouncedQuery, page, size, token]);

  useEffect(() => {
    fetchCounts();
    fetchTutors();
  }, [fetchCounts, fetchTutors]);

  // Xem chi tiết hồ sơ đầy đủ
  const handleViewDetail = async (item) => {
    const tutorId = item.tutorId || item.id;
    setLoadingDetail(true);
    try {
      const detail = await apiGetTutorDetail(tutorId, token);
      setViewingTutor(detail);
    } catch (err) {
      showToast(err.message || "Không thể tải chi tiết hồ sơ", true);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Phê duyệt hồ sơ
  const handleApprove = (item) => {
    const tutorId = item.tutorId || item.id;
    const name = item.fullName || item.name || `ID #${tutorId}`;

    setConfirmModal({
      open: true,
      title: "Xác nhận duyệt hồ sơ gia sư",
      message: `Bạn chắc chắn muốn duyệt hồ sơ của gia sư ${name}? Hồ sơ sẽ chuyển sang trạng thái "Đang hoạt động" và được phép nhận lớp.`,
      confirmLabel: "Duyệt hồ sơ",
      confirmTone: "emerald",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await apiApproveTutor(tutorId, token);
          showToast(`Đã duyệt thành công hồ sơ của gia sư ${name}!`);
          if (viewingTutor && (viewingTutor.tutorId === tutorId || viewingTutor.userId === tutorId)) {
            setViewingTutor(null);
          }
          fetchCounts();
          fetchTutors();
        } catch (err) {
          showToast(err.message || "Duyệt hồ sơ thất bại", true);
        }
      },
    });
  };

  // Mở modal từ chối
  const openRejectModal = (item) => {
    setRejectModal({
      open: true,
      tutor: item,
      reason: "",
      error: "",
    });
  };

  // Xác nhận từ chối kèm lý do
  const handleConfirmReject = async () => {
    if (!rejectModal.reason || !rejectModal.reason.trim()) {
      setRejectModal((prev) => ({ ...prev, error: "Vui lòng nhập lý do từ chối cụ thể!" }));
      return;
    }

    const tutorId = rejectModal.tutor.tutorId || rejectModal.tutor.id;
    const name = rejectModal.tutor.fullName || rejectModal.tutor.name || `ID #${tutorId}`;

    try {
      await apiRejectTutor(tutorId, rejectModal.reason.trim(), token);
      showToast(`Đã từ chối hồ sơ gia sư ${name} kèm lý do phản hồi.`);
      setRejectModal({ open: false, tutor: null, reason: "", error: "" });
      if (viewingTutor && (viewingTutor.tutorId === tutorId || viewingTutor.userId === tutorId)) {
        setViewingTutor(null);
      }
      fetchCounts();
      fetchTutors();
    } catch (err) {
      setRejectModal((prev) => ({ ...prev, error: err.message || "Từ chối hồ sơ thất bại" }));
    }
  };

  // Đổi trạng thái hoạt động (ACTIVE <-> INACTIVE)
  const handleToggleStatus = (item) => {
    const tutorId = item.tutorId || item.id;
    const name = item.fullName || item.name || `ID #${tutorId}`;
    const currentStatus = item.profileStatus || item.status;
    const targetStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const targetLabel = targetStatus === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động";

    setConfirmModal({
      open: true,
      title: "Xác nhận đổi trạng thái hoạt động",
      message: `Bạn chắc chắn muốn chuyển trạng thái gia sư ${name} sang "${targetLabel}"?`,
      confirmLabel: "Lưu thay đổi",
      confirmTone: targetStatus === "ACTIVE" ? "emerald" : "slate",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await apiUpdateTutorStatus(tutorId, { status: targetStatus, note: "Điều chỉnh bởi Quản trị viên" }, token);
          showToast(`Đã cập nhật trạng thái gia sư ${name} thành "${targetLabel}".`);
          fetchCounts();
          fetchTutors();
        } catch (err) {
          showToast(err.message || "Cập nhật trạng thái thất bại", true);
        }
      },
    });
  };

  // Mở modal chỉnh sửa thông tin hồ sơ
  const handleOpenEdit = async (item) => {
    const tutorId = item.tutorId || item.id;
    try {
      const detail = await apiGetTutorDetail(tutorId, token);
      setEditModal({
        open: true,
        tutor: detail,
        form: {
          fullName: detail.fullName || "",
          phone: detail.phone || "",
          university: detail.university || "",
          educationStatus: detail.educationStatus || "STUDENT",
          experienceYears: detail.experienceYears ?? 0,
          hometown: detail.hometown || "",
          address: detail.address || "",
          bio: detail.bio || "",
          videoUrl: detail.videoUrl || "",
        },
      });
    } catch (err) {
      showToast(err.message || "Không thể tải dữ liệu để sửa", true);
    }
  };

  // Lưu chỉnh sửa thông tin
  const handleSaveEdit = () => {
    const tutorId = editModal.tutor.tutorId;
    setConfirmModal({
      open: true,
      title: "Xác nhận lưu thay đổi thông tin",
      message: `Bạn có chắc chắn muốn cập nhật thông tin hồ sơ gia sư ${editModal.form.fullName}?`,
      confirmLabel: "Xác nhận lưu",
      confirmTone: "blue",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await apiUpdateTutorProfile(tutorId, editModal.form, token);
          showToast("Cập nhật thông tin hồ sơ gia sư thành công!");
          setEditModal({ open: false, tutor: null, form: {} });
          fetchTutors();
        } catch (err) {
          showToast(err.message || "Cập nhật hồ sơ thất bại", true);
        }
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold shadow-2xl transition-all ${
            toastMessage.isError
              ? "bg-rose-600 text-white shadow-rose-900/30"
              : "bg-emerald-600 text-white shadow-emerald-900/30"
          }`}
        >
          {toastMessage.isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Quản lý & Thẩm định Gia sư"
        description="Thẩm định hồ sơ gia sư mới đăng ký, duyệt bằng cấp chứng chỉ và quản lý trạng thái hoạt động."
      />

      {/* 4 Thẻ Thống kê nhanh */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Chờ duyệt hồ sơ"
          value={counts.PENDING ?? 0}
          icon={Clock}
          tone="amber"
          hint="Cần lễ tân/admin thẩm định"
        />
        <StatCard
          label="Đang hoạt động"
          value={counts.ACTIVE ?? 0}
          icon={UserCheck}
          tone="emerald"
          hint="Sẵn sàng nhận lớp & hiển thị"
        />
        <StatCard
          label="Ngưng hoạt động"
          value={counts.INACTIVE ?? 0}
          icon={UserX}
          tone="slate"
          hint="Tạm khóa hoặc nghỉ dạy"
        />
        <StatCard
          label="Tổng số gia sư"
          value={counts.ALL ?? 0}
          icon={Users}
          tone="blue"
          hint="Toàn bộ gia sư trong hệ thống"
        />
      </div>

      {/* Bảng danh sách gia sư & Bộ lọc 3 Tab */}
      <Card>
        {/* Thanh công cụ: Tabs trạng thái & Tìm kiếm */}
        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
          {/* 3 Tabs chính */}
          <div className="flex flex-wrap items-center gap-1.5">
            {statusTabs.map((tab) => {
              const Icon = tab.icon;
              const count = counts[tab.value] ?? 0;
              const isActive = statusTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => {
                    setStatusTab(tab.value);
                    setPage(0);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/20 dark:bg-blue-500"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/25 text-white"
                        : "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Ô tìm kiếm & Refresh */}
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tìm tên, email, SĐT, trường..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-blue-950"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                fetchCounts();
                fetchTutors();
              }}
              title="Làm mới danh sách"
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </Button>
          </div>
        </div>

        {/* Danh sách dữ liệu */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-slate-400">
              <RefreshCw className="mr-2 animate-spin" size={18} />
              <span className="text-xs">Đang tải danh sách hồ sơ gia sư...</span>
            </div>
          ) : tutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
              <Users size={36} className="mb-2 opacity-40" />
              <p className="text-xs font-medium">Không có hồ sơ gia sư nào trong mục này.</p>
              {query && <p className="text-[11px] text-slate-500 mt-1">Thử thay đổi từ khóa tìm kiếm xem sao.</p>}
            </div>
          ) : (
            tutors.map((t) => {
              const tutorId = t.tutorId || t.id;
              const name = t.fullName || t.name || `Gia sư #${tutorId}`;
              const email = t.email || "Chưa có email";
              const phone = t.phone || "Chưa có SĐT";
              const university = t.university || "Chưa cập nhật trường";
              const status = t.profileStatus || t.status || "PENDING";
              const meta = statusMeta[status] || { label: status, tone: "slate" };

              return (
                <div
                  key={tutorId}
                  className="flex flex-col gap-4 p-4 transition-colors hover:bg-slate-50/80 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-slate-800/40"
                >
                  {/* Cột 1: Thông tin đại diện & liên hệ */}
                  <div className="flex items-start gap-3 sm:items-center">
                    <Avatar src={t.avatarUrl} initials={name.substring(0, 2).toUpperCase()} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 dark:text-white text-xs">{name}</span>
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <Mail size={12} /> {email}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {phone}
                        </span>
                        <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <GraduationCap size={12} /> {university}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cột 2: Nút thao tác theo trạng thái */}
                  <div className="flex items-center justify-end gap-1.5 self-end sm:self-center">
                    {/* Nút Xem chi tiết (Tất cả trạng thái) */}
                    <button
                      onClick={() => handleViewDetail(t)}
                      title="Xem chi tiết hồ sơ & chứng chỉ"
                      className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      <Eye size={14} />
                      <span className="hidden sm:inline">Chi tiết</span>
                    </button>

                    {/* Khi ở trạng thái PENDING: Có nút Duyệt & Không duyệt */}
                    {status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleApprove(t)}
                          title="Duyệt hồ sơ"
                          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600"
                        >
                          <UserCheck size={14} />
                          <span>Duyệt</span>
                        </button>
                        <button
                          onClick={() => openRejectModal(t)}
                          title="Từ chối hồ sơ kèm lý do"
                          className="flex items-center gap-1 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 dark:bg-rose-500 dark:hover:bg-rose-600"
                        >
                          <UserX size={14} />
                          <span>Từ chối</span>
                        </button>
                      </>
                    )}

                    {/* Khi ở trạng thái ACTIVE: Nút Ngưng hoạt động & Nút Sửa */}
                    {status === "ACTIVE" && (
                      <>
                        <button
                          onClick={() => handleToggleStatus(t)}
                          title="Chuyển sang Ngưng hoạt động"
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          <Lock size={13} />
                          <span>Ngưng HĐ</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit(t)}
                          title="Sửa thông tin hồ sơ"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                        >
                          <Pencil size={14} />
                        </button>
                      </>
                    )}

                    {/* Khi ở trạng thái INACTIVE: Nút Kích hoạt lại */}
                    {status === "INACTIVE" && (
                      <button
                        onClick={() => handleToggleStatus(t)}
                        title="Kích hoạt lại tài khoản"
                        className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700 dark:bg-blue-500"
                      >
                        <Check size={14} />
                        <span>Kích hoạt</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Thanh phân trang */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <div>
              Hiển thị <span className="font-semibold text-slate-800 dark:text-slate-200">{tutors.length}</span> /{" "}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> gia sư
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft size={14} /> Trước
              </Button>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Sau <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Chi Tiết Hồ Sơ Gia Sư & Chứng Chỉ */}
      {viewingTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar
                  src={viewingTutor.avatarUrl}
                  initials={(viewingTutor.fullName || "GS").substring(0, 2).toUpperCase()}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {viewingTutor.fullName}
                    </h3>
                    <Badge tone={statusMeta[viewingTutor.profileStatus]?.tone || "slate"}>
                      {statusMeta[viewingTutor.profileStatus]?.label || viewingTutor.profileStatus}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hồ sơ năng lực & chứng chỉ của gia sư (ID #{viewingTutor.tutorId})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingTutor(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
              {/* Lý do từ chối nếu có */}
              {viewingTutor.rejectionReason && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 dark:border-rose-950 dark:bg-rose-950/30">
                  <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold mb-1">
                    <AlertCircle size={15} />
                    Lý do từ chối trước đó:
                  </div>
                  <p className="text-rose-800 dark:text-rose-200">{viewingTutor.rejectionReason}</p>
                </div>
              )}

              {/* 1. Thông tin liên hệ & cá nhân */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <UserCheck size={14} className="text-blue-500" />
                  1. Thông tin liên hệ &amp; Cá nhân
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Mail size={13} /> Email:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone size={13} /> SĐT:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.phone || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Calendar size={13} /> Ngày sinh:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.dateOfBirth || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={13} /> Quê quán:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.hometown || "Chưa cập nhật"}</span>
                  </div>
                  <div className="sm:col-span-2 flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={13} /> Địa chỉ cư trú:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{viewingTutor.address || "Chưa cập nhật"}</span>
                  </div>
                </div>

                {viewingTutor.bio && (
                  <div className="mt-2 rounded-lg bg-white p-3 border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Giới thiệu bản thân:</span>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{viewingTutor.bio}</p>
                  </div>
                )}

                {viewingTutor.videoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Video size={13} className="text-rose-500" /> Video giới thiệu:
                    </span>
                    <a
                      href={viewingTutor.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400 font-medium"
                    >
                      {viewingTutor.videoUrl} <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>

              {/* 2. Lý lịch học vấn & Bằng cấp */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-950 dark:bg-blue-950/20 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <GraduationCap size={15} className="text-blue-600 dark:text-blue-400" />
                  2. Lý lịch học vấn &amp; Kinh nghiệm
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Trường Đại học:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{viewingTutor.university || "Chưa cập nhật"}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Tình trạng học vấn:</span>
                    <span className="font-semibold text-blue-700 dark:text-blue-400">
                      {viewingTutor.educationStatus === "STUDENT"
                        ? "Sinh viên"
                        : viewingTutor.educationStatus === "GRADUATED"
                        ? "Đã tốt nghiệp"
                        : viewingTutor.educationStatus === "LECTURER"
                        ? "Giảng viên"
                        : viewingTutor.educationStatus || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Kinh nghiệm giảng dạy:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {viewingTutor.experienceYears ? `${viewingTutor.experienceYears} năm kinh nghiệm` : "Mới bắt đầu"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Thời điểm gửi duyệt:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {viewingTutor.submittedAt ? new Date(viewingTutor.submittedAt).toLocaleString("vi-VN") : "Chưa có"}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Chứng chỉ & Bằng cấp kèm ảnh thẩm định (Theo Use Case UC-REC-08) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <FileCheck size={15} className="text-emerald-500" />
                    3. Bằng cấp &amp; Chứng chỉ tải lên (Thẩm định)
                  </span>
                  <span className="text-[10px] text-slate-400">Bắt buộc xem kỹ trước khi duyệt</span>
                </h4>

                {viewingTutor.credentials && viewingTutor.credentials.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {viewingTutor.credentials.map((cred, idx) => (
                      <div
                        key={cred.id || idx}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 dark:text-white text-xs">{cred.title}</span>
                            <Badge tone="blue">{cred.type || "Chứng chỉ"}</Badge>
                          </div>
                          {cred.score && (
                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                              Điểm/Xếp loại: {cred.score}
                            </p>
                          )}
                        </div>

                        {cred.fileUrl && (
                          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 dark:border-slate-800">
                            <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                              {cred.fileUrl.split("/").pop()}
                            </span>
                            <button
                              onClick={() => setPreviewImage(cred.fileUrl)}
                              className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300"
                            >
                              <Eye size={12} /> Xem ảnh scan
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Gia sư chưa tải lên tệp chứng chỉ nào.</p>
                )}
              </div>

              {/* 4. Chuyên môn & Bảng giá & Lịch rảnh */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Chuyên môn */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <BookOpen size={13} className="text-blue-500" /> Chuyên môn &amp; Khối lớp
                  </h5>
                  {viewingTutor.specialties && viewingTutor.specialties.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {viewingTutor.specialties.map((s, idx) => (
                        <span
                          key={idx}
                          className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {s.specialty} {s.gradeLevel ? `(${s.gradeLevel})` : ""}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa cập nhật</span>
                  )}
                </div>

                {/* Bảng giá */}
                <div className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900">
                  <h5 className="font-bold text-[11px] uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                    <Award size={13} className="text-amber-500" /> Bảng giá giảng dạy
                  </h5>
                  {viewingTutor.prices && viewingTutor.prices.length > 0 ? (
                    <div className="space-y-1.5">
                      {viewingTutor.prices.map((p, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] border-b border-slate-100 pb-1 dark:border-slate-800">
                          <span className="text-slate-600 dark:text-slate-300">{p.program || p.teachingMode}:</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                            {Number(p.pricePerSession).toLocaleString("vi-VN")} ₫/buổi
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">Chưa cập nhật bảng giá</span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer với nút Duyệt / Từ chối nếu PENDING */}
            <div className="flex items-center justify-between border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setViewingTutor(null)}>
                Đóng
              </Button>

              <div className="flex items-center gap-2">
                {viewingTutor.profileStatus === "PENDING" && (
                  <>
                    <button
                      onClick={() => openRejectModal(viewingTutor)}
                      className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-rose-700 dark:bg-rose-500"
                    >
                      <UserX size={14} /> Không duyệt
                    </button>
                    <button
                      onClick={() => handleApprove(viewingTutor)}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700 dark:bg-emerald-500"
                    >
                      <UserCheck size={14} /> Phê duyệt hồ sơ
                    </button>
                  </>
                )}

                {viewingTutor.profileStatus === "ACTIVE" && (
                  <button
                    onClick={() => handleToggleStatus(viewingTutor)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    <Lock size={14} /> Ngưng hoạt động
                  </button>
                )}

                {viewingTutor.profileStatus === "INACTIVE" && (
                  <button
                    onClick={() => handleToggleStatus(viewingTutor)}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
                  >
                    <Check size={14} /> Kích hoạt lại
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xem trước ảnh chứng chỉ (Image Lightbox) */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <FileCheck size={15} className="text-emerald-500" /> Minh chứng chứng chỉ gốc
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  title="Mở trong tab mới"
                >
                  <ExternalLink size={15} />
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-center p-4 bg-slate-950/10 dark:bg-slate-950/50">
              <img
                src={previewImage}
                alt="Scan chứng chỉ"
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-lg"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/600x400?text=File+kh%C3%B4ng+ph%E1%BA%A3i+%E1%BA%A3nh+ho%E1%BA%B7c+l%E1%BB%97i+t%E1%BA%A3i";
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modal Popup Nhập Lý Do Từ Chối (Bắt buộc theo UC-REC-08 & FlowWork Luồng 21) */}
      {rejectModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <UserX size={18} />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Từ chối hồ sơ gia sư</h3>
              </div>
              <button
                onClick={() => setRejectModal({ open: false, tutor: null, reason: "", error: "" })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Bạn đang từ chối hồ sơ của gia sư{" "}
                <span className="font-bold text-slate-900 dark:text-white">
                  {rejectModal.tutor?.fullName || rejectModal.tutor?.name}
                </span>
                . Vui lòng nhập lý do cụ thể để gia sư nắm được và chỉnh sửa nộp lại.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Lý do từ chối <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value, error: "" }))}
                  placeholder="Ví dụ: Ảnh chụp chứng chỉ IELTS bị mờ góc không thấy rõ mã ID; Video giới thiệu chưa đủ thời lượng..."
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 dark:border-slate-800 dark:bg-slate-800 dark:text-white dark:focus:ring-rose-950"
                />
                {rejectModal.error && (
                  <p className="mt-1 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {rejectModal.error}
                  </p>
                )}
              </div>

              {/* Gợi ý lý do nhanh */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-slate-400 font-medium">Gợi ý lý do nhanh:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    "Ảnh chứng chỉ scan bị mờ, mất góc",
                    "Video giới thiệu không đạt chuẩn chất lượng",
                    "Thông tin học vấn và trường đại học chưa khớp",
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectModal((prev) => ({ ...prev, reason: preset, error: "" }))}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRejectModal({ open: false, tutor: null, reason: "", error: "" })}
              >
                Hủy bỏ
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReject}>
                Xác nhận từ chối
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Hồ Sơ Gia Sư */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 p-4 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil size={15} className="text-blue-500" /> Chỉnh sửa hồ sơ gia sư
              </h3>
              <button
                onClick={() => setEditModal({ open: false, tutor: null, form: {} })}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3.5 text-xs">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Họ và tên:</label>
                  <input
                    type="text"
                    value={editModal.form.fullName || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, fullName: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Số điện thoại:</label>
                  <input
                    type="text"
                    value={editModal.form.phone || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, phone: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Trường Đại học:</label>
                  <input
                    type="text"
                    value={editModal.form.university || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, university: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Học vấn:</label>
                  <select
                    value={editModal.form.educationStatus || "STUDENT"}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, educationStatus: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="STUDENT">Sinh viên</option>
                    <option value="GRADUATED">Đã tốt nghiệp</option>
                    <option value="LECTURER">Giảng viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Kinh nghiệm (năm):</label>
                  <input
                    type="number"
                    min={0}
                    value={editModal.form.experienceYears ?? 0}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, experienceYears: Number(e.target.value) } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Quê quán:</label>
                  <input
                    type="text"
                    value={editModal.form.hometown || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, hometown: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Địa chỉ cư trú:</label>
                  <input
                    type="text"
                    value={editModal.form.address || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, address: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Link video giới thiệu:</label>
                  <input
                    type="text"
                    value={editModal.form.videoUrl || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, videoUrl: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Giới thiệu bản thân (Bio):</label>
                  <textarea
                    rows={3}
                    value={editModal.form.bio || ""}
                    onChange={(e) => setEditModal((prev) => ({ ...prev, form: { ...prev.form, bio: e.target.value } }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setEditModal({ open: false, tutor: null, form: {} })}>
                Hủy
              </Button>
              <Button variant="primary" size="sm" onClick={handleSaveEdit}>
                Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ConfirmModal tái sử dụng */}
      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
}

export default TutorManagement;