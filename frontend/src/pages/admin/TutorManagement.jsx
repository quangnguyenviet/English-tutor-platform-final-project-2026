import { useState } from "react";
import {
  Pencil,
  Trash2,
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
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const statusOptions = [
  { value: "active", label: "Đang hoạt động", tone: "emerald" },
  { value: "pending", label: "Chờ duyệt", tone: "amber" },
  { value: "inactive", label: "Ngưng hoạt động", tone: "slate" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export function TutorManagement() {
  const { tutorList, updateTutor, removeTutor } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // View Detail Modal
  const [viewingTutor, setViewingTutor] = useState(null);

  // ConfirmModal state
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    title: "",
    message: "",
    confirmLabel: "Đồng ý",
    confirmTone: "blue",
    onConfirm: null,
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, open: false, onConfirm: null }));
  };

  const activeCount = tutorList.filter((t) => t.status === "active").length;
  const pendingCount = tutorList.filter((t) => t.status === "pending").length;
  const inactiveCount = tutorList.filter((t) => t.status === "inactive").length;

  const filtered = tutorList.filter(
    (t) =>
      (statusTab === "all" || t.status === statusTab) &&
      (
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.email.toLowerCase().includes(query.toLowerCase()) ||
        (t.phone && t.phone.toLowerCase().includes(query.toLowerCase())) ||
        (t.specialization && t.specialization.some((s) => s.toLowerCase().includes(query.toLowerCase())))
      )
  );

  function resetForm() {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone || "Chưa cập nhật",
      status: t.status,
      joinedDate: t.joinedDate,
      specialization: [...(t.specialization || [])],
      studentsCount: t.studentsCount ?? 0,
      ratePerHour: t.ratePerHour || "250.000đ",
      university: t.university || "Đại học Sư Phạm TP.HCM",
    });
    setShowForm(true);
  }

  // Admin only updates the status of the tutor
  function handleSubmit() {
    if (!form.status) return;

    const newStatusLabel = statusOptions.find((o) => o.value === form.status)?.label || form.status;

    setConfirmModal({
      open: true,
      title: "Xác nhận đổi trạng thái gia sư",
      message: `Bạn chắc chắn muốn đổi trạng thái hoạt động của gia sư ${form.name} thành "${newStatusLabel}"?`,
      confirmLabel: "Lưu thay đổi",
      confirmTone: "blue",
      onConfirm: () => {
        updateTutor(editingId, { status: form.status });
        showToast(`Đã cập nhật trạng thái hoạt động của gia sư ${form.name} thành "${newStatusLabel}"`);
        resetForm();
        closeConfirmModal();
      },
    });
  }

  // Approve tutor with ConfirmModal
  function handleApprove(t) {
    setConfirmModal({
      open: true,
      title: "Duyệt tài khoản gia sư",
      message: `Bạn chắc chắn duyệt tài khoản gia sư ${t.name}? Gia sư sẽ được chuyển sang trạng thái "Đang hoạt động".`,
      confirmLabel: "Duyệt",
      confirmTone: "emerald",
      onConfirm: () => {
        updateTutor(t.id, { status: "active" });
        showToast(`Đã duyệt tài khoản ${t.name}`);
        closeConfirmModal();
      },
    });
  }

  // Reject tutor with ConfirmModal
  function handleReject(t) {
    setConfirmModal({
      open: true,
      title: "Từ chối tài khoản gia sư",
      message: `Bạn chắc chắn từ chối tài khoản gia sư ${t.name}? Hồ sơ sẽ được chuyển sang trạng thái "Ngưng hoạt động".`,
      confirmLabel: "Từ chối",
      confirmTone: "rose",
      onConfirm: () => {
        updateTutor(t.id, { status: "inactive" });
        showToast(`Đã từ chối tài khoản ${t.name}`);
        closeConfirmModal();
      },
    });
  }

  // Delete tutor with ConfirmModal (only for inactive)
  function handleDelete(t) {
    setConfirmModal({
      open: true,
      title: "Xóa gia sư khỏi hệ thống",
      message: `Bạn chắc chắn xóa gia sư ${t.name} khỏi hệ thống? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      confirmTone: "rose",
      onConfirm: () => {
        removeTutor(t.id);
        showToast(`Đã xóa gia sư ${t.name}`);
        closeConfirmModal();
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-950 fade-slide-in">
          <Check size={18} className="text-emerald-400" />
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
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />

      {/* PageHeader — removed "Thêm gia sư" button */}
      <PageHeader
        title="Quản lý gia sư"
        description="Phê duyệt tài khoản và quản lý thông tin đội ngũ gia sư tiếng Anh."
      />

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng số gia sư"
          value={tutorList.length}
          hint="Đã đăng ký hệ thống"
          tone="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Đang hoạt động"
          value={activeCount}
          hint="Sẵn sàng nhận lớp"
          tone="emerald"
        />
        <StatCard
          icon={Clock}
          label="Chờ xét duyệt"
          value={pendingCount}
          hint="Hồ sơ mới gửi"
          tone="amber"
        />
        <StatCard
          icon={ShieldCheck}
          label="Tạm ngưng hoạt động"
          value={inactiveCount}
          hint="Đã tạm khóa"
          tone="slate"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Status Tabs */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả", count: tutorList.length },
              { key: "active", label: "Đang hoạt động", count: activeCount },
              { key: "pending", label: "Chờ duyệt", count: pendingCount },
              { key: "inactive", label: "Ngưng", count: inactiveCount },
            ].map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusTab(opt.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  statusTab === opt.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{opt.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                    statusTab === opt.key
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {opt.count}
                </span>
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
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên, email, chuyên môn..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
            />
          </div>
        </div>
      </Card>

      {/* Edit Tutor Form (Admin ONLY edits Status) - Modal Popup */}
      {showForm && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Pencil size={16} className="text-blue-600" />
                  Cập nhật trạng thái hoạt động của gia sư
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gia sư: <strong className="text-slate-800 dark:text-slate-200">{form.name}</strong> ({form.email})
                </p>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Important Permission Notice */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200 flex items-start gap-2.5">
                <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Quy định phân quyền quản trị:</p>
                  <p className="mt-0.5 text-amber-800 dark:text-amber-300">
                    Các thông tin lý lịch học vấn, chuyên môn, số điện thoại và bằng cấp do chính gia sư tự đăng ký và quản lý trên trang <strong>Hồ sơ cá nhân (Tutor Profile)</strong>. Quản trị viên chỉ được phép điều chỉnh <strong>Trạng thái hoạt động</strong> của tài khoản gia sư.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* The ONLY editable field: Status */}
                <div className="sm:col-span-2 rounded-xl border-2 border-blue-200 bg-blue-50/40 p-3.5 dark:border-blue-900/60 dark:bg-blue-950/20">
                  <label className="mb-1.5 block text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center justify-between">
                    <span>Trạng thái hoạt động của gia sư (Admin có thể sửa) *</span>
                    <span className="text-[10px] font-normal text-blue-600 dark:text-blue-400">Chọn trạng thái để cập nhật</span>
                  </label>
                  <select
                    value={form.status || "pending"}
                    onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                    className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:border-blue-700 dark:bg-slate-900 dark:text-slate-100"
                  >
                    {statusOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Read-only info fields provided by tutor */}
                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock size={12} className="text-slate-400" /> Họ và tên gia sư (Thông tin gia sư cung cấp)
                  </label>
                  <input
                    disabled
                    value={form.name || ""}
                    className={`${inputClass} bg-slate-50 text-slate-600 cursor-not-allowed dark:bg-slate-800/60 dark:text-slate-400`}
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock size={12} className="text-slate-400" /> Email liên hệ
                  </label>
                  <input
                    disabled
                    value={form.email || ""}
                    className={`${inputClass} bg-slate-50 text-slate-600 cursor-not-allowed dark:bg-slate-800/60 dark:text-slate-400`}
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock size={12} className="text-slate-400" /> Số điện thoại / Zalo
                  </label>
                  <input
                    disabled
                    value={form.phone || ""}
                    className={`${inputClass} bg-slate-50 text-slate-600 cursor-not-allowed dark:bg-slate-800/60 dark:text-slate-400`}
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock size={12} className="text-slate-400" /> Mức học phí / giờ
                  </label>
                  <input
                    disabled
                    value={form.ratePerHour || ""}
                    className={`${inputClass} bg-slate-50 text-slate-600 cursor-not-allowed dark:bg-slate-800/60 dark:text-slate-400`}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <Lock size={12} className="text-slate-400" /> Chuyên môn & Kỹ năng giảng dạy đã đăng ký
                  </label>
                  <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 dark:bg-slate-800/40 dark:border-slate-800">
                    {form.specialization && form.specialization.length > 0 ? (
                      form.specialization.map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-white border border-slate-200 px-2.5 py-0.5 text-xs text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-300"
                        >
                          {s}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">Chưa có chuyên môn</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={resetForm} type="button">
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Check size={14} /> Lưu trạng thái hoạt động
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tutor List Table */}
      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((t, idx) => {
            const statusConfig = statusOptions.find((o) => o.value === t.status) || {
              label: t.status,
              tone: "neutral",
            };

            return (
              <div
                key={t.id}
                style={{ animationDelay: `${idx * 40}ms` }}
                className="fade-slide-in flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <Avatar initials={t.initials} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                        {t.name}
                      </p>
                      <Badge tone={statusConfig.tone}>{statusConfig.label}</Badge>
                      {t.ratePerHour && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {t.ratePerHour}/buổi
                        </span>
                      )}
                    </div>

                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail size={12} /> {t.email}
                      </span>
                      {t.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={12} /> {t.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Tham gia: {t.joinedDate}
                      </span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {t.specialization && t.specialization.map((s) => (
                        <span
                          key={s}
                          className="inline-block rounded bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <div className="text-right text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {t.studentsCount ?? 0} học sinh
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {t.teachingHours || "0 giờ dạy"}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* View detail button — all statuses */}
                    <button
                      onClick={() => setViewingTutor(t)}
                      title="Xem chi tiết"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Pending: approve + reject */}
                    {t.status === "pending" && (
                      <>
                        <button
                          onClick={() => handleApprove(t)}
                          title="Duyệt tài khoản"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <UserCheck size={16} />
                        </button>
                        <button
                          onClick={() => handleReject(t)}
                          title="Từ chối"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <UserX size={16} />
                        </button>
                      </>
                    )}

                    {/* Active: edit only (NO delete) */}
                    {t.status === "active" && (
                      <button
                        onClick={() => handleEdit(t)}
                        title="Chỉnh sửa trạng thái"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {/* Inactive: delete only (NO edit) */}
                    {t.status === "inactive" && (
                      <button
                        onClick={() => handleDelete(t)}
                        title="Xóa"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              Không tìm thấy gia sư nào phù hợp với bộ lọc tìm kiếm.
            </div>
          )}
        </div>
      </Card>

      {/* Modal: View Tutor Detail with full data from TutorProfile.jsx */}
      {viewingTutor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <Avatar initials={viewingTutor.initials} size="lg" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {viewingTutor.name}
                    </h3>
                    <Badge tone={statusOptions.find((o) => o.value === viewingTutor.status)?.tone || "neutral"}>
                      {statusOptions.find((o) => o.value === viewingTutor.status)?.label || viewingTutor.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hồ sơ năng lực gia sư đã đăng tải trên hệ thống (Tutor Profile)
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
              {/* 1. Giới thiệu ngắn & Liên hệ */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <UserCheck size={14} className="text-blue-500" />
                  1. Thông tin liên hệ &amp; Giới thiệu bản thân
                </h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Mail size={13} /> Email:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.email}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><Phone size={13} /> Số điện thoại / Zalo:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{viewingTutor.phone || "0987 654 321"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5"><MapPin size={13} /> Khu vực dạy:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">{viewingTutor.location || viewingTutor.currentAddress || "TP. Hồ Chí Minh & Online"}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200/60 pb-1.5 dark:border-slate-700/60">
                    <span className="text-slate-500 dark:text-slate-400">Học phí / buổi:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">{viewingTutor.ratePerHour || "250.000đ"}</span>
                  </div>
                </div>

                {viewingTutor.bio && (
                  <div className="mt-2 rounded-lg bg-white p-3 border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Phong cách giảng dạy:</span>
                    <p className="text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      &ldquo;{viewingTutor.bio}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* 2. Lý lịch học vấn & Văn bằng (Từ TutorProfile.jsx) */}
              <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-4 dark:border-blue-950 dark:bg-blue-950/20 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-blue-900 dark:text-blue-300 flex items-center gap-2">
                  <GraduationCap size={15} className="text-blue-600 dark:text-blue-400" />
                  2. Lý lịch học vấn &amp; Thành tích học tập
                </h4>

                <div className="grid gap-2.5 sm:grid-cols-2">
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Trình độ phân loại:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-400">
                      {viewingTutor.gradeLevels ? viewingTutor.gradeLevels.join(", ") : "Giáo viên chính thức"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Kinh nghiệm giảng dạy:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {viewingTutor.teachingHours || "400+ giờ dạy (4 năm)"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Năm sinh / Tuổi:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingTutor.birthYear || "2001 (25 tuổi)"}</span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Quê quán:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{viewingTutor.hometown || "Nam Định"}</span>
                  </div>
                  <div className="sm:col-span-2 flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Trường Đại học &amp; Chuyên ngành:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {viewingTutor.university || "Đại học Sư Phạm TP.HCM - Sư phạm Tiếng Anh"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Trường THPT Cấp 3:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {viewingTutor.highSchool || "Cựu học sinh Chuyên Lê Hồng Phong"}
                    </span>
                  </div>
                  <div className="flex justify-between bg-white p-2.5 rounded-lg border border-blue-100 dark:bg-slate-900 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400">Điểm thi ĐH / Xếp loại:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                      {viewingTutor.graduationScore || "28.5đ khối D01"} ({viewingTutor.academicRank || "GPA 3.85"})
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Hồ sơ pháp lý & Giấy tờ minh chứng đính kèm */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-3">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <FileCheck size={15} className="text-emerald-500" />
                  3. Hồ sơ pháp lý &amp; Giấy tờ minh chứng đã nộp
                </h4>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Định danh cá nhân (CCCD):</p>
                      <p className="text-[11px] text-slate-400 font-mono">03620100****</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle size={11} /> Đã xác thực
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">Minh chứng Bằng ĐH / Bảng điểm:</p>
                      <p className="text-[11px] text-slate-400">bang_tot_nghiep_scan.pdf</p>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                      <CheckCircle size={11} /> Đã kiểm định
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Chứng chỉ & Kỹ năng chuyên môn */}
              <div className="space-y-2">
                <h4 className="font-bold uppercase tracking-wider text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
                  <Award size={15} className="text-amber-500" />
                  4. Chứng chỉ &amp; Lĩnh vực chuyên môn giảng dạy
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewingTutor.certificates && viewingTutor.certificates.map((c, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      🏆 {c.name} {c.issuer && `(${c.issuer})`}
                    </span>
                  ))}
                  {viewingTutor.specialization && viewingTutor.specialization.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {viewingTutor.availableSlots && viewingTutor.availableSlots.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-600 dark:text-slate-400 block mb-1.5">Khung giờ rảnh nhận lớp:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {viewingTutor.availableSlots.map((slot, i) => (
                        <span key={i} className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-mono text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          ⏰ {slot}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer — Chỉ xem, không chỉnh sửa */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setViewingTutor(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TutorManagement;