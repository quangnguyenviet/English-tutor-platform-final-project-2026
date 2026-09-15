import { useState } from "react";
import {
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  GraduationCap,
  Users,
  UserCheck,
  UserX,
  TrendingUp,
  Phone,
  Calendar,
  Eye,
  KeyRound,
  Clock,
  ShieldCheck,
  MapPin,
  FileText,
  User,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";

const approvalStatusMeta = {
  pending_approval: { label: "Chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "emerald" },
  account_created: { label: "Đã tạo account", tone: "blue" },
};

// Non-purple level badge tones conforming to DESIGN.md
const levelTone = {
  A1: "slate",
  A2: "slate",
  B1: "blue",
  B2: "blue",
  C1: "indigo",
  C2: "indigo",
};

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export function StudentManagement() {
  const { studentList, updateStudent, removeStudent, tutorList } = useAuth();

  const [query, setQuery] = useState("");
  const [approvalTab, setApprovalTab] = useState("all");
  const [tutorFilter, setTutorFilter] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

  // View Detail Modal
  const [viewingStudent, setViewingStudent] = useState(null);

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

  const activeTutors = tutorList.filter((t) => t.status === "active");

  // Approval-based counts
  const pendingApprovalCount = studentList.filter(
    (s) => !s.approvalStatus || s.approvalStatus === "pending_approval"
  ).length;
  const approvedCount = studentList.filter(
    (s) => s.approvalStatus === "approved" || s.approvalStatus === "account_created"
  ).length;

  const filtered = studentList.filter((s) => {
    const matchQuery =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.goal && s.goal.toLowerCase().includes(query.toLowerCase())) ||
      (s.parentName && s.parentName.toLowerCase().includes(query.toLowerCase())) ||
      (s.level && s.level.toLowerCase().includes(query.toLowerCase()));

    const matchTutor =
      tutorFilter === "all" ||
      (tutorFilter === "unassigned" && !s.assignedTutorId) ||
      s.assignedTutorId === tutorFilter;

    // Approval tab filter
    let matchApproval = true;
    if (approvalTab === "pending_approval") {
      matchApproval = !s.approvalStatus || s.approvalStatus === "pending_approval";
    } else if (approvalTab === "approved") {
      matchApproval = s.approvalStatus === "approved" || s.approvalStatus === "account_created";
    }

    return matchQuery && matchTutor && matchApproval;
  });

  function resetForm() {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      level: s.level || "A1",
      grade: s.grade || "",
      goal: s.goal || "",
      note: s.note || "",
      schedule: s.schedule || "",
      parentName: s.parentName || "",
      parentTelegram: s.parentTelegram || "",
      parentPhone: s.parentPhone || "",
      province: s.province || "",
      district: s.district || "",
      joinedDate: s.joinedDate,
      assignedTutorId: s.assignedTutorId || "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name?.trim()) return;

    setConfirmModal({
      open: true,
      title: "Xác nhận lưu thay đổi",
      message: `Bạn chắc chắn muốn lưu thay đổi thông tin học sinh ${form.name}?`,
      confirmLabel: "Lưu thay đổi",
      confirmTone: "blue",
      onConfirm: () => {
        const payload = {
          name: form.name.trim(),
          level: form.level,
          grade: form.grade?.trim() || "",
          goal: form.goal?.trim() || "",
          note: form.note?.trim() || "",
          schedule: form.schedule?.trim() || "",
          parentName: form.parentName?.trim() || "",
          parentTelegram: form.parentTelegram?.trim() || "",
          parentPhone: form.parentPhone?.trim() || "",
          province: form.province?.trim() || "",
          district: form.district?.trim() || "",
          joinedDate: form.joinedDate,
          assignedTutorId: form.assignedTutorId || null,
        };

        updateStudent(editingId, payload);
        showToast(`Đã cập nhật thông tin học sinh ${payload.name}`);
        resetForm();
        closeConfirmModal();
      },
    });
  }

  // Create account for student (only in "approved" tab)
  function handleCreateAccount(s) {
    const username = s.parentPhone || "chưa có SĐT";
    setConfirmModal({
      open: true,
      title: "Tạo tài khoản học sinh",
      message: (
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>Tạo tài khoản cho học sinh <strong>{s.name}</strong>?</p>
          <div className="rounded-lg bg-slate-100 p-3 text-xs dark:bg-slate-800 space-y-1">
            <p>📱 Username: <strong className="font-mono">{username}</strong></p>
            <p>🔑 Mật khẩu mặc định: <strong className="font-mono">123456789</strong></p>
          </div>
          <p className="text-xs text-slate-400">Học sinh sẽ tự đổi mật khẩu khi đăng nhập lần đầu.</p>
        </div>
      ),
      confirmLabel: "Tạo account",
      confirmTone: "blue",
      onConfirm: () => {
        updateStudent(s.id, { approvalStatus: "account_created" });
        showToast(`Đã tạo tài khoản cho học sinh ${s.name} (SĐT: ${username}, MK: 123456789)`);
        closeConfirmModal();
      },
    });
  }

  // Delete student with ConfirmModal
  function handleDelete(s) {
    setConfirmModal({
      open: true,
      title: "Xóa học sinh khỏi hệ thống",
      message: `Bạn chắc chắn xóa học sinh ${s.name} khỏi hệ thống? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      confirmTone: "rose",
      onConfirm: () => {
        removeStudent(s.id);
        showToast(`Đã xóa học sinh ${s.name}`);
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

      <PageHeader
        title="Quản lý học sinh"
        description="Duyệt đăng ký, tạo tài khoản và quản lý thông tin học sinh trong hệ thống."
      />

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng số học sinh"
          value={studentList.length}
          hint="Tất cả đăng ký"
          tone="blue"
        />
        <StatCard
          icon={Clock}
          label="Chờ duyệt"
          value={pendingApprovalCount}
          hint="Phụ huynh mới đăng ký"
          tone="amber"
        />
        <StatCard
          icon={ShieldCheck}
          label="Đã duyệt"
          value={approvedCount}
          hint="Sẵn sàng tạo account"
          tone="emerald"
        />
        <StatCard
          icon={KeyRound}
          label="Đã tạo account"
          value={studentList.filter((s) => s.approvalStatus === "account_created").length}
          hint="Học sinh đã có tài khoản"
          tone="blue"
        />
      </div>

      {/* Filters Toolbar — replaced CEFR tabs with approval tabs */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Approval Tabs — replaces A1–C2 */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: "all", label: "Tất cả", count: studentList.length },
              { key: "pending_approval", label: "Chờ duyệt", count: pendingApprovalCount },
              { key: "approved", label: "Đã duyệt", count: approvedCount },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setApprovalTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  approvalTab === tab.key
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] tabular-nums ${
                    approvalTab === tab.key
                      ? "bg-blue-700 text-white"
                      : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Tutor Filter — kept as requested */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[240px] flex-1 sm:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm học sinh, mục tiêu, phụ huynh..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
              />
            </div>

            <select
              value={tutorFilter}
              onChange={(e) => setTutorFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-900"
            >
              <option value="all">Tất cả gia sư</option>
              <option value="unassigned">Chưa có gia sư</option>
              {activeTutors.map((t) => (
                <option key={t.id} value={t.id}>
                  Gia sư: {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Edit Student Form - Modal Popup */}
      {showForm && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Chỉnh sửa thông tin học sinh
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Cập nhật thông tin học tập và liên hệ của học sinh {form.name}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tên của bé (Học sinh) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={form.name || ""}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Trình độ / Khối lớp
                  </label>
                  <input
                    value={form.grade || ""}
                    onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                    placeholder="VD: Lớp 8"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Họ tên Phụ huynh
                  </label>
                  <input
                    value={form.parentName || ""}
                    onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                    placeholder="VD: Chị Nguyễn Hải Yến"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Số điện thoại / Zalo Phụ huynh
                  </label>
                  <input
                    value={form.parentPhone || ""}
                    onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                    placeholder="VD: 0966 223 344"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Tỉnh / Thành phố
                  </label>
                  <input
                    value={form.province || ""}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                    placeholder="VD: Hà Nội"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Quận / Huyện
                  </label>
                  <input
                    value={form.district || ""}
                    onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                    placeholder="VD: Cầu Giấy"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Mục tiêu học tập
                  </label>
                  <input
                    value={form.goal || ""}
                    onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                    placeholder="VD: Thi đạt IELTS 6.5 trong 6 tháng"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Lịch học mong muốn
                  </label>
                  <input
                    value={form.schedule || ""}
                    onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                    placeholder="VD: Thứ 2 - 4 - 6 (19:30 - 21:00)"
                    className={inputClass}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                    Ghi chú từ Phụ huynh / Yêu cầu đặc biệt
                  </label>
                  <textarea
                    rows={2}
                    value={form.note || ""}
                    onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="VD: Bé mất gốc phát âm, cần gia sư kiên nhẫn..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={resetForm} type="button">
                Hủy
              </Button>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!form.name?.trim()}
                type="button"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                <Check size={14} /> Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student List Table */}
      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((s, idx) => {
            const assignedTutor = tutorList.find((t) => t.id === s.assignedTutorId);
            const approvalStatus = s.approvalStatus || "pending_approval";
            const approvalMeta = approvalStatusMeta[approvalStatus] || approvalStatusMeta.pending_approval;
            const isPending = approvalStatus === "pending_approval";
            const isApproved = approvalStatus === "approved";
            const hasAccount = approvalStatus === "account_created";

            return (
              <div
                key={s.id}
                style={{ animationDelay: `${idx * 40}ms` }}
                className="fade-slide-in flex flex-wrap items-center justify-between gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex min-w-0 items-center gap-3.5">
                  <Avatar initials={s.initials} size="md" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                        {s.name}
                      </p>
                      <Badge tone={levelTone[s.level] ?? "neutral"}>
                        Trình độ {s.level}
                      </Badge>
                      <Badge tone={approvalMeta.tone}>{approvalMeta.label}</Badge>
                    </div>

                    <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
                      Mục tiêu: {s.goal || "Chưa thiết lập"}
                    </p>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-slate-400">
                      {s.parentName && (
                        <span>PH: {s.parentName} {s.parentPhone && `(${s.parentPhone})`}</span>
                      )}
                      {s.parentTelegram && <span>Telegram: {s.parentTelegram}</span>}
                      {s.schedule && <span>Lịch: {s.schedule}</span>}
                    </div>

                    <div className="mt-1.5 flex items-center gap-2 text-xs">
                      {assignedTutor ? (
                        <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                          <GraduationCap size={14} className="text-blue-500" />
                          Gia sư: <strong className="text-blue-600 dark:text-blue-400">{assignedTutor.name}</strong>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                          Chưa phân công gia sư
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {/* Progress — only show for approved students */}
                  {!isPending && (
                    <div className="text-right text-xs">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {s.overallProgress ?? 0}% tiến độ
                      </p>
                      <div className="mt-1 w-20 bg-slate-100 rounded-full h-1.5 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="bg-blue-600 h-1.5 rounded-full"
                          style={{ width: `${s.overallProgress || 0}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {/* View detail — all statuses */}
                    <button
                      onClick={() => setViewingStudent(s)}
                      title="Xem chi tiết"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Eye size={15} />
                    </button>

                    {/* Approved but no account yet: show prominent Create Account button */}
                    {isApproved && (
                      <Button
                        size="sm"
                        onClick={() => handleCreateAccount(s)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-sm flex items-center gap-1.5 px-3 py-1"
                      >
                        <KeyRound size={13} />
                        <span>Tạo account</span>
                      </Button>
                    )}

                    {/* Has account indicator */}
                    {hasAccount && (
                      <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800 dark:text-slate-300">
                        <KeyRound size={11} className="text-blue-500" />
                        {s.parentPhone || "Đã cấp"}
                      </span>
                    )}

                    {/* Edit — only for approved/account_created */}
                    {!isPending && (
                      <button
                        onClick={() => handleEdit(s)}
                        title="Chỉnh sửa thông tin"
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                      >
                        <Pencil size={15} />
                      </button>
                    )}

                    {/* Delete — only for approved/account_created */}
                    {!isPending && (
                      <button
                        onClick={() => handleDelete(s)}
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
              Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
            </div>
          )}
        </div>
      </Card>

      {/* Modal: View Student Detail (Đăng ký nhận tư vấn & Học thử - Ảnh 4) */}
      {viewingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="fade-slide-in relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Đăng ký nhận tư vấn & Học thử
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Phiếu thông tin đăng ký do phụ huynh gửi qua hệ thống
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingStudent(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Status Alert Banner */}
              {viewingStudent.approvalStatus === "approved" ? (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                        Đã duyệt thanh toán phí kết nối
                      </p>
                      <p className="mt-0.5 text-emerald-700 dark:text-emerald-300">
                        Học sinh đã hoàn thành thanh toán phí kết nối. Sẵn sàng tạo tài khoản đăng nhập.
                      </p>
                    </div>
                  </div>
                  <Badge tone="emerald">Đã duyệt</Badge>
                </div>
              ) : viewingStudent.approvalStatus === "account_created" ? (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/80 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/30">
                  <div className="flex items-start gap-2.5">
                    <KeyRound size={16} className="mt-0.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-blue-900 dark:text-blue-200">
                        Đã cấp tài khoản học sinh
                      </p>
                      <p className="mt-0.5 font-mono text-blue-700 dark:text-blue-300">
                        Username: <strong>{viewingStudent.parentPhone}</strong> | MK mặc định: <strong>123456789</strong>
                      </p>
                    </div>
                  </div>
                  <Badge tone="blue">Đã tạo account</Badge>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5 dark:border-amber-900/50 dark:bg-amber-950/30">
                  <div className="flex items-start gap-2.5">
                    <Clock size={16} className="mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-200">
                        Đang chờ duyệt thanh toán phí kết nối
                      </p>
                      <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                        Phụ huynh đã đăng ký. Đang đợi xác nhận minh chứng thanh toán VietQR.
                      </p>
                    </div>
                  </div>
                  <Badge tone="amber">Chờ duyệt</Badge>
                </div>
              )}

              {/* Card 1: Thông tin phụ huynh (Ảnh 4) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold">
                  <User size={15} className="text-blue-500" />
                  <span>Thông tin Phụ huynh (Đại diện liên hệ)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Họ và tên Phụ huynh</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {viewingStudent.parentName || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Số điện thoại / Zalo</span>
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400 text-sm">
                      {viewingStudent.parentPhone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tỉnh / Thành phố</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {viewingStudent.province || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Quận / Huyện</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {viewingStudent.district || "Chưa cập nhật"}
                    </span>
                  </div>
                  {viewingStudent.parentTelegram && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[11px]">Telegram liên hệ</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {viewingStudent.parentTelegram}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card 2: Thông tin của bé (Ảnh 4) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-semibold">
                  <GraduationCap size={15} className="text-emerald-500" />
                  <span>Thông tin của bé (Học sinh)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Tên của bé</span>
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {viewingStudent.name}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Trình độ / Khối lớp</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {viewingStudent.grade || "Chưa rõ"}
                      </span>
                      <Badge tone={levelTone[viewingStudent.level] ?? "neutral"}>
                        {viewingStudent.level}
                      </Badge>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Mục tiêu học tập</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {viewingStudent.goal || "Chưa thiết lập"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Lịch học mong muốn</span>
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {viewingStudent.schedule || "Chưa xếp lịch"}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Mục tiêu học tập / Ghi chú</span>
                    <p className="mt-1 rounded-lg bg-white p-2.5 text-slate-700 border border-slate-200/70 dark:bg-slate-900/60 dark:border-slate-800 dark:text-slate-300 leading-relaxed">
                      {viewingStudent.note || "Không có ghi chú thêm từ phụ huynh."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Phân công & Lớp */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Gia sư phụ trách</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-sm">
                      {tutorList.find((t) => t.id === viewingStudent.assignedTutorId)?.name || "Chưa phân công"}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 block text-[11px]">Tiến độ học tập</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {viewingStudent.overallProgress ?? 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setViewingStudent(null)}>
                Đóng
              </Button>
              {viewingStudent.approvalStatus === "approved" && (
                <Button
                  size="sm"
                  onClick={() => {
                    const target = viewingStudent;
                    setViewingStudent(null);
                    handleCreateAccount(target);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <KeyRound size={14} />
                  Tạo tài khoản ngay
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;
