import { useState } from "react";
import {
  Pencil,
  Trash2,
  Search,
  X,
  Check,
  UserPlus,
  Users,
  Clock,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  ShieldCheck,
  AlertCircle,
  Eye,
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
  { value: "inactive", label: "Ngưng hoạt động", tone: "slate" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950 dark:text-slate-100";

export default function ReceptionistManagement() {
  const { receptionistList, addReceptionist, updateReceptionist, removeReceptionist, complaintList } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [viewingReceptionist, setViewingReceptionist] = useState(null);

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

  const activeCount = receptionistList.filter((r) => r.status === "active").length;
  const inactiveCount = receptionistList.filter((r) => r.status === "inactive").length;
  const totalComplaints = receptionistList.reduce((sum, r) => sum + (r.complaintsHandled || 0), 0);

  const filtered = receptionistList.filter(
    (r) =>
      (statusTab === "all" || r.status === statusTab) &&
      (r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.email.toLowerCase().includes(query.toLowerCase()) ||
        (r.phone && r.phone.toLowerCase().includes(query.toLowerCase())))
  );

  function resetForm() {
    setForm({});
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(r) {
    setEditingId(r.id);
    setForm({
      name: r.name,
      email: r.email,
      phone: r.phone || "",
      status: r.status,
      joinedDate: r.joinedDate || "",
    });
    setShowForm(true);
  }

  function handleSave() {
    if (!form.name?.trim() || !form.email?.trim()) {
      showToast("Vui lòng điền đầy đủ họ tên và email.");
      return;
    }
    if (editingId) {
      setConfirmModal({
        open: true,
        title: "Xác nhận lưu thay đổi",
        message: `Bạn có chắc chắn muốn cập nhật thông tin cho lễ tân "${form.name}"?`,
        confirmLabel: "Lưu thay đổi",
        confirmTone: "blue",
        onConfirm: () => {
          updateReceptionist(editingId, form);
          showToast(`Đã cập nhật thông tin lễ tân ${form.name} thành công!`);
          resetForm();
          closeConfirmModal();
        },
      });
    } else {
      setConfirmModal({
        open: true,
        title: "Xác nhận thêm lễ tân",
        message: `Bạn có chắc chắn muốn tạo tài khoản Lễ tân cho "${form.name}"?`,
        confirmLabel: "Tạo tài khoản",
        confirmTone: "blue",
        onConfirm: () => {
          addReceptionist({
            ...form,
            status: form.status || "active",
            joinedDate: form.joinedDate || new Date().toISOString().slice(0, 10),
          });
          showToast(`Đã thêm lễ tân ${form.name} thành công!`);
          resetForm();
          closeConfirmModal();
        },
      });
    }
  }

  function handleDelete(r) {
    setConfirmModal({
      open: true,
      title: "Xóa tài khoản lễ tân",
      message: `Bạn có chắc chắn muốn xóa lễ tân "${r.name}"? Hành động này không thể hoàn tác.`,
      confirmLabel: "Xóa",
      confirmTone: "rose",
      onConfirm: () => {
        removeReceptionist(r.id);
        showToast(`Đã xóa lễ tân ${r.name}.`);
        closeConfirmModal();
      },
    });
  }

  function handleToggleStatus(r) {
    const newStatus = r.status === "active" ? "inactive" : "active";
    const label = newStatus === "active" ? "kích hoạt" : "vô hiệu hóa";
    setConfirmModal({
      open: true,
      title: `Xác nhận ${label} tài khoản`,
      message: `Bạn có muốn ${label} tài khoản lễ tân "${r.name}"?`,
      confirmLabel: newStatus === "active" ? "Kích hoạt" : "Vô hiệu hóa",
      confirmTone: newStatus === "active" ? "emerald" : "amber",
      onConfirm: () => {
        updateReceptionist(r.id, { status: newStatus });
        showToast(`Đã ${label} tài khoản ${r.name}.`);
        closeConfirmModal();
      },
    });
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl fade-slide-in">
          <CheckCircle size={18} className="text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
        title="Quản lý lễ tân"
        description="Quản lý nhân sự lễ tân trung tâm: thêm, sửa, xóa, thay đổi trạng thái hoạt động."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Users} label="Tổng lễ tân" value={receptionistList.length} tone="blue" />
        <StatCard icon={ShieldCheck} label="Đang hoạt động" value={activeCount} tone="emerald" />
        <StatCard icon={Clock} label="Ngưng hoạt động" value={inactiveCount} tone="slate" />
        <StatCard icon={AlertCircle} label="Khiếu nại đã xử lý" value={totalComplaints} tone="amber" />
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {[{ value: "all", label: "Tất cả" }, ...statusOptions].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusTab(opt.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  statusTab === opt.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT..."
                className={`${inputClass} pl-8 w-56`}
              />
            </div>
            <Button
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              <UserPlus size={14} /> Thêm lễ tân
            </Button>
          </div>
        </div>
      </Card>

      {/* Add/Edit Modal Popup */}
      {showForm && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={resetForm}
        >
          <div
            className="fade-slide-in relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  {editingId ? <Pencil size={18} /> : <UserPlus size={18} />}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {editingId ? "Chỉnh sửa thông tin lễ tân" : "Thêm lễ tân mới"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {editingId
                      ? `Cập nhật hồ sơ cá nhân và trạng thái hoạt động`
                      : "Cấp tài khoản làm việc mới cho nhân sự lễ tân"}
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 text-xs">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.name || ""}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Email làm việc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@englishpath.vn"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    className={inputClass}
                    value={form.phone || ""}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0901 234 567"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ngày vào làm
                  </label>
                  <input
                    className={inputClass}
                    type="date"
                    value={form.joinedDate || ""}
                    onChange={(e) => setForm((p) => ({ ...p, joinedDate: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Trạng thái hoạt động
                </label>
                <select
                  className={inputClass}
                  value={form.status || "active"}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Tài khoản "Ngưng hoạt động" sẽ bị tạm khóa quyền đăng nhập vào cổng Lễ tân.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <Button variant="secondary" size="sm" onClick={resetForm}>
                Hủy bỏ
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Check size={14} /> {editingId ? "Lưu thay đổi" : "Thêm lễ tân"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Receptionist List */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-left">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Lễ tân</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Liên hệ</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Ngày vào làm</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Khiếu nại đã xử lý</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Trạng thái</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Không tìm thấy lễ tân nào phù hợp.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={r.initials} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{r.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">Mã: {r.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Mail size={12} /> {r.email}
                        </p>
                        <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Phone size={12} /> {r.phone || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Calendar size={12} /> {r.joinedDate}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-slate-900 dark:text-white">{r.complaintsHandled || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggleStatus(r)}>
                        <Badge tone={r.status === "active" ? "emerald" : "slate"}>
                          {r.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingReceptionist(r)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleEdit(r)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400 transition"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(r)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition"
                          title="Xóa"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Detail Modal */}
      {viewingReceptionist && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setViewingReceptionist(null)}
        >
          <div
            className="fade-slide-in relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <Avatar initials={viewingReceptionist.initials} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {viewingReceptionist.name}
                    </h3>
                    <Badge tone={viewingReceptionist.status === "active" ? "emerald" : "slate"}>
                      {viewingReceptionist.status === "active" ? "Đang hoạt động" : "Ngưng hoạt động"}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-mono">
                    Mã nhân viên: {viewingReceptionist.id} &bull; Vai trò: Lễ tân trung tâm
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceptionist(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Thông tin nhân sự & Liên hệ */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2.5">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-blue-500" />
                  Thông tin nhân sự & Liên hệ
                </h4>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Email làm việc:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Mail size={12} className="text-slate-400 shrink-0" />
                      {viewingReceptionist.email}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Số điện thoại:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Phone size={12} className="text-slate-400 shrink-0" />
                      {viewingReceptionist.phone || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Ngày vào làm:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                      <Calendar size={12} className="text-slate-400 shrink-0" />
                      {viewingReceptionist.joinedDate || "Chưa cập nhật"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">Khiếu nại đã tiếp nhận:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                      {viewingReceptionist.complaintsHandled || 0} vụ việc
                    </span>
                  </div>
                </div>
              </div>

              {/* Phân quyền & Quyền hạn hệ thống */}
              <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40 space-y-2">
                <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Quyền hạn trong hệ thống (RBAC):
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span>Tiếp nhận Yêu cầu ghép lớp</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span>Duyệt minh chứng thanh toán</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span>Tiếp nhận & lập đơn khiếu nại</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span>Xem hồ sơ gia sư & học sinh</span>
                  </div>
                </div>
              </div>

              {/* Khiếu nại gần đây do lễ tân này phụ trách (nếu có) */}
              {complaintList && complaintList.filter((c) => c.receptionistId === viewingReceptionist.id).length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">
                    Khiếu nại gần đây tiếp nhận:
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {complaintList
                      .filter((c) => c.receptionistId === viewingReceptionist.id)
                      .map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-[11px] dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-100 mr-2">{c.id}</span>
                            <span className="text-slate-500">{c.complainantName} ({c.typeLabel})</span>
                          </div>
                          <Badge tone={c.status === "resolved" ? "emerald" : "amber"}>
                            {c.statusLabel || (c.status === "resolved" ? "Đã xử lí" : "Chưa xử lí")}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const target = viewingReceptionist;
                  setViewingReceptionist(null);
                  handleEdit(target);
                }}
              >
                <Pencil size={13} /> Chỉnh sửa
              </Button>
              <Button size="sm" onClick={() => setViewingReceptionist(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
