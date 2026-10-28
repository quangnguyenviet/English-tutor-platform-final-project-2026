import { useCallback, useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  X,
  Check,
  Mail,
  Phone,
  Calendar,
  Eye,
  ShieldCheck,
  Clock,
  Copy,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  KeyRound,
  BadgeCheck,
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
  apiGetEmployees,
  apiGetEmployeeCounts,
  apiGetEmployeeDetail,
  apiCreateEmployee,
  apiUpdateEmployeeStatus,
} from "../../lib/staffApi";

const PAGE_SIZE = 10;

const statusTabs = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Ngưng hoạt động" },
];

const roleFilters = [
  { value: "ALL", label: "Tất cả vai trò" },
  { value: "RECEPTIONIST", label: "Lễ tân" },
  { value: "ACCOUNTANT", label: "Kế toán" },
];

const roleOptions = [
  { value: "RECEPTIONIST", label: "Lễ tân" },
  { value: "ACCOUNTANT", label: "Kế toán" },
];

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950 dark:text-slate-100";

function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function roleTone(role) {
  return role === "ACCOUNTANT" ? "violet" : "blue";
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function StaffManagement() {
  const { token: authToken } = useAuth();
  const token = authToken || localStorage.getItem("gsa_token");

  // Bộ lọc & phân trang
  const [statusTab, setStatusTab] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(0);

  // Dữ liệu
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [counts, setCounts] = useState({ ALL: 0, ACTIVE: 0, INACTIVE: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Form thêm nhân sự
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ role: "RECEPTIONIST", fullName: "", email: "", phone: "", startDate: todayIso() });
  const [submitting, setSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState(null);
  const [copied, setCopied] = useState(false);

  // Chi tiết nhân sự
  const [viewing, setViewing] = useState(null);
  const [viewingStatus, setViewingStatus] = useState("ACTIVE");
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false });

  const showToast = (message, ok = true) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const closeConfirm = () => setConfirmModal((p) => ({ ...p, open: false, onConfirm: null }));

  // Debounce ô tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Đổi bộ lọc → về trang đầu
  useEffect(() => {
    setPage(0);
  }, [statusTab, roleFilter, debouncedQuery]);

  // Tải danh sách
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiGetEmployees({ role: roleFilter, status: statusTab, keyword: debouncedQuery, page, size: PAGE_SIZE }, token)
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalItems(data.totalItems ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Không thể tải danh sách nhân sự");
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, roleFilter, statusTab, debouncedQuery, page, refreshKey]);

  // Tải số đếm badge tab
  useEffect(() => {
    if (!token) return;
    let active = true;
    apiGetEmployeeCounts(roleFilter, token)
      .then((data) => active && setCounts({ ALL: data.ALL ?? 0, ACTIVE: data.ACTIVE ?? 0, INACTIVE: data.INACTIVE ?? 0 }))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, roleFilter, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ---- Thêm nhân sự ----
  function openAddForm() {
    setForm({ role: "RECEPTIONIST", fullName: "", email: "", phone: "", startDate: todayIso() });
    setShowForm(true);
  }

  function submitAddForm() {
    if (!form.fullName.trim() || !form.email.trim()) {
      showToast("Vui lòng điền đầy đủ họ tên và email.", false);
      return;
    }
    if (!form.phone.trim()) {
      showToast("Vui lòng nhập số điện thoại.", false);
      return;
    }
    setConfirmModal({
      open: true,
      title: "Xác nhận tạo tài khoản",
      message: `Bạn có chắc chắn muốn tạo tài khoản ${form.role === "ACCOUNTANT" ? "Kế toán" : "Lễ tân"} cho "${form.fullName.trim()}"?`,
      confirmLabel: "Tạo tài khoản",
      confirmTone: "blue",
      onConfirm: doCreate,
    });
  }

  async function doCreate() {
    closeConfirm();
    setSubmitting(true);
    try {
      const payload = {
        role: form.role,
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        startDate: form.startDate || todayIso(),
      };
      const result = await apiCreateEmployee(payload, token);
      setShowForm(false);
      setCreatedInfo(result);
      setCopied(false);
      showToast("Đã tạo tài khoản nhân sự thành công!");
      refresh();
    } catch (err) {
      showToast(err.message || "Tạo nhân sự thất bại.", false);
    } finally {
      setSubmitting(false);
    }
  }

  function copyCredentials() {
    if (!createdInfo) return;
    const text = `Mã NV: ${createdInfo.employee?.employeeCode}\nTên đăng nhập: ${createdInfo.username}\nMật khẩu mặc định: ${createdInfo.defaultPassword}`;
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      },
      () => showToast("Không thể sao chép, vui lòng ghi lại thủ công.", false),
    );
  }

  // ---- Xem chi tiết & đổi trạng thái ----
  async function openDetail(id) {
    setDetailLoading(true);
    setViewing({ id });
    try {
      const detail = await apiGetEmployeeDetail(id, token);
      setViewing(detail);
      setViewingStatus(detail.status);
    } catch (err) {
      showToast(err.message || "Không thể lấy chi tiết nhân sự.", false);
      setViewing(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function saveStatus() {
    if (!viewing || viewingStatus === viewing.status) {
      showToast("Trạng thái chưa thay đổi.", false);
      return;
    }
    setConfirmModal({
      open: true,
      title: "Xác nhận thay đổi trạng thái",
      message: `Bạn có chắc chắn muốn thay đổi trạng thái của nhân sự "${viewing.fullName}" sang "${viewingStatus === "ACTIVE" ? "Đang hoạt động" : "Ngưng hoạt động"}"?`,
      confirmLabel: "Lưu thay đổi",
      confirmTone: viewingStatus === "ACTIVE" ? "emerald" : "amber",
      onConfirm: doSaveStatus,
    });
  }

  async function doSaveStatus() {
    closeConfirm();
    setSavingStatus(true);
    try {
      const detail = await apiUpdateEmployeeStatus(viewing.id, viewingStatus, token);
      setViewing(detail);
      setViewingStatus(detail.status);
      showToast("Đã lưu thông tin nhân sự.");
      refresh();
    } catch (err) {
      showToast(err.message || "Cập nhật trạng thái thất bại.", false);
    } finally {
      setSavingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fade-slide-in fixed bottom-5 right-5 z-[70] flex items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          <CheckCircle size={18} className={toast.ok ? "shrink-0 text-emerald-400" : "shrink-0 text-rose-400"} />
          <span>{toast.message}</span>
        </div>
      )}

      <ConfirmModal
        open={confirmModal.open}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        confirmTone={confirmModal.confirmTone}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirm}
      />

      <PageHeader
        eyebrow="Quản trị vận hành"
        title="Quản lý nhân sự"
        description="Thêm mới, xem chi tiết và quản lý trạng thái hoạt động của nhân sự Lễ tân và Kế toán."
        actions={
          <Button size="sm" onClick={openAddForm}>
            <UserPlus size={15} /> Thêm nhân sự
          </Button>
        }
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Tổng nhân sự" value={counts.ALL} tone="blue" />
        <StatCard icon={ShieldCheck} label="Đang hoạt động" value={counts.ACTIVE} tone="emerald" />
        <StatCard icon={Clock} label="Ngưng hoạt động" value={counts.INACTIVE} tone="slate" />
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition cursor-pointer ${
                  statusTab === tab.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 text-[10px] ${
                    statusTab === tab.value ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  {tab.value === "ALL" ? counts.ALL : tab.value === "ACTIVE" ? counts.ACTIVE : counts.INACTIVE}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className={`${inputClass} w-auto`}
            >
              {roleFilters.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên, email, SĐT, mã NV..."
                className={`${inputClass} w-60 pl-8`}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Danh sách */}
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Nhân viên</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Liên hệ</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Vai trò</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Ngày vào làm</th>
                <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Trạng thái</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-3">
                      <div className="h-8 w-full animate-pulse rounded-lg bg-slate-200 dark:bg-slate-800" />
                    </td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-rose-500">
                    {error}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    Không tìm thấy nhân sự nào phù hợp.
                  </td>
                </tr>
              ) : (
                items.map((emp) => (
                  <tr key={emp.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={initialsOf(emp.fullName)} size="sm" />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{emp.fullName}</p>
                          <p className="font-mono text-[11px] text-slate-400">{emp.employeeCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Mail size={12} /> {emp.email || "—"}
                        </p>
                        <p className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                          <Phone size={12} /> {emp.phone || "—"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={roleTone(emp.role)}>{emp.roleLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Calendar size={12} /> {emp.hiredDate || "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={emp.status === "ACTIVE" ? "emerald" : "slate"}>{emp.statusLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end">
                        <button
                          onClick={() => openDetail(emp.id)}
                          className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                          title="Xem chi tiết"
                        >
                          <Eye size={14} /> Xem chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Phân trang */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Trang {page + 1}/{totalPages} · Tổng {totalItems} nhân sự
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <ChevronLeft size={14} /> Trước
              </button>
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Sau <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal Thêm nhân sự */}
      {showForm && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setShowForm(false)}
        >
          <div
            className="fade-slide-in relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Thêm nhân sự mới</h3>
                  <p className="text-[11px] text-slate-400">Cấp tài khoản làm việc cho Lễ tân hoặc Kế toán</p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setShowForm(false)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3.5 p-5 text-xs">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Vai trò <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {roleOptions.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r.value }))}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 font-medium transition cursor-pointer ${
                        form.role === r.value
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                          : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <BadgeCheck size={14} /> {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.fullName}
                    onChange={(e) => setForm((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="Nguyễn Minh Khôi"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Email làm việc <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="email@englishpath.vn"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    className={inputClass}
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700 dark:text-slate-300">Ngày vào làm</label>
                  <input
                    className={inputClass}
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-[11px] text-blue-700 dark:border-blue-900/40 dark:bg-blue-950/30 dark:text-blue-300">
                <KeyRound size={14} className="mt-0.5 shrink-0" />
                <span>
                  Hệ thống sẽ tự sinh Mã nhân viên, Tên đăng nhập và Mật khẩu mặc định. Nhân viên bắt buộc đổi mật khẩu ở
                  lần đăng nhập đầu tiên.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <Button variant="secondary" size="sm" onClick={() => setShowForm(false)} disabled={submitting}>
                Hủy bỏ
              </Button>
              <Button size="sm" onClick={submitAddForm} disabled={submitting}>
                {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Tạo tài khoản
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal bàn giao thông tin đăng nhập */}
      {createdInfo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setCreatedInfo(null)}
        >
          <div
            className="fade-slide-in relative w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 border-b border-slate-200 bg-emerald-50/50 p-5 dark:border-slate-800 dark:bg-emerald-950/20">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <CheckCircle size={18} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Tạo tài khoản thành công</h3>
                <p className="text-[11px] text-slate-400">Bàn giao thông tin đăng nhập ban đầu cho nhân viên mới</p>
              </div>
            </div>
            <div className="space-y-3 p-5 text-xs">
              <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Họ và tên</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{createdInfo.employee?.fullName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Vai trò</span>
                  <Badge tone={roleTone(createdInfo.employee?.role)}>{createdInfo.employee?.roleLabel}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mã nhân viên</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">
                    {createdInfo.employee?.employeeCode}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tên đăng nhập</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{createdInfo.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Mật khẩu mặc định</span>
                  <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                    {createdInfo.defaultPassword}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-amber-600 dark:text-amber-400">
                Lưu ý: Nhân viên phải đổi mật khẩu ngay trong lần đăng nhập đầu tiên.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <Button variant="outline" size="sm" onClick={copyCredentials}>
                {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Đã sao chép" : "Sao chép"}
              </Button>
              <Button size="sm" onClick={() => setCreatedInfo(null)}>
                Hoàn tất
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết nhân sự */}
      {viewing && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => setViewing(null)}
        >
          <div
            className="fade-slide-in relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <Avatar initials={initialsOf(viewing.fullName)} size="md" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                      {viewing.fullName || "Đang tải..."}
                    </h3>
                    {viewing.status && (
                      <Badge tone={viewing.status === "ACTIVE" ? "emerald" : "slate"}>{viewing.statusLabel}</Badge>
                    )}
                  </div>
                  <p className="font-mono text-xs text-slate-400">
                    {viewing.employeeCode ? `Mã NV: ${viewing.employeeCode}` : ""}
                    {viewing.roleLabel ? ` · ${viewing.roleLabel}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewing(null)}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4 p-5 text-xs">
              {detailLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-slate-400">
                  <Loader2 size={18} className="animate-spin" /> Đang tải chi tiết...
                </div>
              ) : (
                <>
                  <div className="space-y-2.5 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                      <ShieldCheck size={14} className="text-blue-500" /> Thông tin nhân sự
                    </h4>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <span className="mb-0.5 block text-[11px] text-slate-400">Email làm việc</span>
                        <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Mail size={12} className="shrink-0 text-slate-400" /> {viewing.email || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mb-0.5 block text-[11px] text-slate-400">Số điện thoại</span>
                        <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Phone size={12} className="shrink-0 text-slate-400" /> {viewing.phone || "—"}
                        </span>
                      </div>
                      <div>
                        <span className="mb-0.5 block text-[11px] text-slate-400">Vai trò</span>
                        <Badge tone={roleTone(viewing.role)}>{viewing.roleLabel}</Badge>
                      </div>
                      <div>
                        <span className="mb-0.5 block text-[11px] text-slate-400">Ngày vào làm</span>
                        <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                          <Calendar size={12} className="shrink-0 text-slate-400" /> {viewing.hiredDate || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                    <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200">Trạng thái hoạt động</h4>
                    <select
                      className={inputClass}
                      value={viewingStatus}
                      onChange={(e) => setViewingStatus(e.target.value)}
                    >
                      <option value="ACTIVE">Đang hoạt động</option>
                      <option value="INACTIVE">Ngưng hoạt động</option>
                    </select>
                    <p className="text-[11px] text-slate-400">
                      Tài khoản "Ngưng hoạt động" sẽ bị khóa quyền đăng nhập vào hệ thống.
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <Button variant="secondary" size="sm" onClick={() => setViewing(null)}>
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={saveStatus}
                disabled={detailLoading || savingStatus || viewingStatus === viewing.status}
              >
                {savingStatus ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Lưu thay đổi
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
