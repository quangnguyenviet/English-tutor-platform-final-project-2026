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
  const { receptionistList, addReceptionist, updateReceptionist, removeReceptionist } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [toastMessage, setToastMessage] = useState(null);

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
      updateReceptionist(editingId, form);
      showToast(`Đã cập nhật lễ tân ${form.name} thành công!`);
    } else {
      addReceptionist({ ...form, status: form.status || "active", joinedDate: form.joinedDate || new Date().toISOString().slice(0, 10) });
      showToast(`Đã thêm lễ tân ${form.name} thành công!`);
    }
    resetForm();
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

      {/* Add/Edit Form */}
      {showForm && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {editingId ? "Chỉnh sửa lễ tân" : "Thêm lễ tân mới"}
            </h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Họ tên *</label>
              <input
                className={inputClass}
                value={form.name || ""}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Email *</label>
              <input
                className={inputClass}
                type="email"
                value={form.email || ""}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@englishpath.vn"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Số điện thoại</label>
              <input
                className={inputClass}
                value={form.phone || ""}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="0901 234 567"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Ngày vào làm</label>
              <input
                className={inputClass}
                type="date"
                value={form.joinedDate || ""}
                onChange={(e) => setForm((p) => ({ ...p, joinedDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Trạng thái</label>
              <select
                className={inputClass}
                value={form.status || "active"}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 justify-end">
            <Button variant="secondary" size="sm" onClick={resetForm}>Hủy</Button>
            <Button size="sm" onClick={handleSave}>
              <Check size={14} /> {editingId ? "Lưu thay đổi" : "Thêm lễ tân"}
            </Button>
          </div>
        </Card>
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
    </div>
  );
}
