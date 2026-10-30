import { useCallback, useEffect, useState } from "react";
import {
  GraduationCap,
  UserCheck,
  UserX,
  Search,
  X,
  Check,
  CheckCircle,
  AlertCircle,
  Eye,
  Phone,
  Mail,
  MapPin,
  Calendar,
  School,
  Users,
  BookOpen,
  History,
  ShieldCheck,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { getPageWindow } from "../../lib/pagination";
import {
  apiGetStudents,
  apiGetStudentCounts,
  apiGetStudentDetail,
  apiUpdateStudentStatus,
} from "../../lib/studentApi";

const PAGE_SIZE = 10;

const statusTabs = [
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "INACTIVE", label: "Dừng hoạt động" },
  { value: "ALL", label: "Tất cả" },
];

const learningFilters = [
  { value: "ALL", label: "Tất cả tình trạng học" },
  { value: "STUDYING", label: "Đang có lớp" },
  { value: "NOT_STUDYING", label: "Chưa có lớp" },
];

const statusMeta = {
  ACTIVE: { label: "Đang hoạt động", tone: "emerald" },
  INACTIVE: { label: "Dừng hoạt động", tone: "rose" },
};

const classStatusMeta = {
  TRIAL: { label: "Đang dạy thử", tone: "amber" },
  ACTIVE: { label: "Đang học", tone: "emerald" },
  COMPLETED: { label: "Đã kết thúc", tone: "blue" },
  CANCELLED: { label: "Đã hủy", tone: "rose" },
};

const teachingModeLabel = { ONLINE: "Trực tuyến", AT_HOME: "Tại nhà" };
const genderLabel = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950 dark:text-slate-100";

function initialsOf(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || { label: status || "—", tone: "slate" };
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

function InfoItem({ icon: Icon, label, children }) {
  return (
    <div className="min-w-0">
      <span className="mb-0.5 block text-[11px] text-slate-400 dark:text-slate-500">{label}</span>
      <span className="flex items-start gap-1 break-words font-medium text-slate-800 dark:text-slate-200">
        {Icon && <Icon size={12} className="mt-0.5 shrink-0 text-slate-400" />}
        <span className="min-w-0">{children || "—"}</span>
      </span>
    </div>
  );
}

function DetailSection({ icon: Icon, title, children, aside }) {
  return (
    <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
          <Icon size={14} className="text-blue-500" /> {title}
        </h4>
        {aside}
      </div>
      {children}
    </div>
  );
}

function ClassList({ classes, emptyText }) {
  if (!classes || classes.length === 0) {
    return <p className="py-1 text-[11px] text-slate-400 dark:text-slate-500">{emptyText}</p>;
  }
  return (
    <ul className="space-y-2">
      {classes.map((c) => {
        const meta = classStatusMeta[c.status] || { label: c.status, tone: "slate" };
        return (
          <li
            key={c.id}
            className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-white">{c.className || `Lớp #${c.id}`}</p>
                <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                  Gia sư: <span className="font-medium text-slate-700 dark:text-slate-300">{c.tutorName || "—"}</span>
                </p>
              </div>
              <Badge tone={meta.tone}>{meta.label}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>{teachingModeLabel[c.teachingMode] || c.teachingMode || "—"}</span>
              <span>Bắt đầu: {formatDate(c.activeFrom || c.createdAt)}</span>
              <span>
                Đã học: <span className="font-mono">{c.completedSessions ?? 0}</span> buổi
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Quản lý học sinh cho Lễ tân / Admin (UC-REC-11, UC-ADM-10, FR-34).
 * Dữ liệu thật từ API /api/v1/students; Lễ tân dùng lại trang này qua ReceptionistStudentList.
 */
export function StudentManagement() {
  const { token: authToken, session } = useAuth();
  const token = authToken || localStorage.getItem("gsa_token");
  const isReceptionist = session?.role === "receptionist";

  // Bộ lọc & phân trang
  const [statusTab, setStatusTab] = useState("ACTIVE");
  const [learningFilter, setLearningFilter] = useState("ALL");
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

  // Chi tiết học sinh
  const [viewing, setViewing] = useState(null);
  const [viewingStatus, setViewingStatus] = useState("ACTIVE");
  const [statusNote, setStatusNote] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const [toast, setToast] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showToast = (message, ok = true) => {
    setToast({ message, ok });
    setTimeout(() => setToast(null), 3500);
  };

  // Debounce ô tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Đổi bộ lọc → về trang đầu
  useEffect(() => {
    setPage(0);
  }, [statusTab, learningFilter, debouncedQuery]);

  // Tải danh sách
  useEffect(() => {
    if (!token) return;
    let active = true;
    setLoading(true);
    setError(null);
    apiGetStudents(
      { status: statusTab, keyword: debouncedQuery, learning: learningFilter, page, size: PAGE_SIZE },
      token,
    )
      .then((data) => {
        if (!active) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setTotalItems(data.totalItems ?? 0);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message || "Không thể tải danh sách học sinh");
        setItems([]);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token, statusTab, learningFilter, debouncedQuery, page, refreshKey]);

  // Tải số đếm badge tab
  useEffect(() => {
    if (!token) return;
    let active = true;
    apiGetStudentCounts({ keyword: debouncedQuery, learning: learningFilter }, token)
      .then(
        (data) =>
          active && setCounts({ ALL: data.ALL ?? 0, ACTIVE: data.ACTIVE ?? 0, INACTIVE: data.INACTIVE ?? 0 }),
      )
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [token, learningFilter, debouncedQuery, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  // ---- Xem chi tiết & đổi trạng thái ----
  async function openDetail(student) {
    setDetailLoading(true);
    setViewing({ id: student.id, fullName: student.fullName, status: student.status });
    setStatusNote("");
    try {
      const detail = await apiGetStudentDetail(student.id, token);
      setViewing(detail);
      setViewingStatus(detail.status);
    } catch (err) {
      showToast(err.message || "Không thể lấy chi tiết học sinh.", false);
      setViewing(null);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    if (savingStatus) return;
    setViewing(null);
    setConfirmOpen(false);
  }

  async function doSaveStatus() {
    setConfirmOpen(false);
    setSavingStatus(true);
    try {
      await apiUpdateStudentStatus(viewing.id, { status: viewingStatus, note: statusNote }, token);
      showToast("Đã lưu thông tin HS");
      setViewing(null);
      refresh();
    } catch (err) {
      showToast(err.message || "Cập nhật trạng thái học sinh thất bại.", false);
    } finally {
      setSavingStatus(false);
    }
  }

  const statusChanged = viewing && viewing.status && viewingStatus !== viewing.status;
  const pageNumbers = totalPages > 1 ? getPageWindow(page + 1, totalPages) : [];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fade-slide-in fixed bottom-5 right-5 z-[80] flex max-w-[calc(100vw-2.5rem)] items-center gap-2.5 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-2xl">
          {toast.ok ? (
            <CheckCircle size={18} className="shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle size={18} className="shrink-0 text-rose-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      <PageHeader
        eyebrow={isReceptionist ? "Lễ tân" : "Quản trị vận hành"}
        title="Quản lý học sinh"
        description="Tra cứu hồ sơ học sinh, thông tin phụ huynh, các lớp đang và đã học; khóa hoặc mở lại tài khoản học sinh."
      />

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={GraduationCap} label="Tổng học sinh" value={counts.ALL} tone="blue" />
        <StatCard icon={UserCheck} label="Đang hoạt động" value={counts.ACTIVE} tone="emerald" />
        <StatCard icon={UserX} label="Dừng hoạt động" value={counts.INACTIVE} tone="rose" />
      </div>

      {/* Toolbar */}
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusTab(tab.value)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  statusTab === tab.value
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 font-mono text-[10px] ${
                    statusTab === tab.value ? "bg-white/20" : "bg-slate-200 dark:bg-slate-700"
                  }`}
                >
                  {counts[tab.value] ?? 0}
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={learningFilter}
              onChange={(e) => setLearningFilter(e.target.value)}
              className={`${inputClass} sm:w-auto`}
              aria-label="Lọc theo tình trạng học"
            >
              {learningFilters.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tên học sinh, tên hoặc SĐT phụ huynh..."
                className={`${inputClass} pl-8 sm:w-72`}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label="Xóa từ khóa"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Danh sách */}
      <Card padded={false}>
        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400">
              <AlertCircle size={18} />
            </div>
            <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              <RotateCcw size={14} /> Thử lại
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <GraduationCap size={18} />
            </div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Không tìm thấy học sinh nào phù hợp</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Thử đổi từ khóa, tab trạng thái hoặc bộ lọc.</p>
          </div>
        ) : (
          <>
            {/* Bảng trên màn hình rộng */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-left dark:border-slate-800">
                    <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Học sinh</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Trường / Lớp</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Phụ huynh</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Gia sư phụ trách</th>
                    <th className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-500 dark:text-slate-400">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((s) => (
                    <tr key={s.id} className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar initials={initialsOf(s.fullName)} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white">{s.fullName}</p>
                            <p className="font-mono text-[11px] text-slate-400">
                              {s.username} · Tạo {formatDate(s.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <p>{s.school || "—"}</p>
                        <p className="text-[11px] text-slate-400">{s.grade || ""}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-700 dark:text-slate-200">{s.parentName || "—"}</p>
                        <p className="flex items-center gap-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <Phone size={11} /> {s.parentPhone || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {s.currentTutorNames?.length ? (
                          s.currentTutorNames.join(", ")
                        ) : (
                          <span className="text-slate-400">Chưa có lớp</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end">
                          <button
                            onClick={() => openDetail(s)}
                            className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2 py-1.5 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600 active:scale-[0.98] dark:hover:bg-blue-950/30 dark:hover:text-blue-400"
                          >
                            <Eye size={14} /> Xem chi tiết
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Thẻ trên mobile / tablet */}
            <ul className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
              {items.map((s) => (
                <li key={s.id} className="space-y-2.5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar initials={initialsOf(s.fullName)} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{s.fullName}</p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                          {[s.school, s.grade].filter(Boolean).join(" · ") || "—"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                    <p className="flex items-center gap-1.5">
                      <Users size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {s.parentName || "—"} · <span className="font-mono">{s.parentPhone || "—"}</span>
                      </span>
                    </p>
                    <p className="flex items-center gap-1.5">
                      <BookOpen size={12} className="shrink-0 text-slate-400" />
                      <span className="truncate">
                        {s.currentTutorNames?.length ? s.currentTutorNames.join(", ") : "Chưa có lớp"}
                      </span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" onClick={() => openDetail(s)}>
                    <Eye size={14} /> Xem chi tiết
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Phân trang */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex flex-col gap-2 border-t border-slate-200 px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <span className="text-slate-500 dark:text-slate-400">
              Trang {page + 1}/{totalPages} · Tổng <span className="font-mono">{totalItems}</span> học sinh
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Trang trước"
              >
                <ChevronLeft size={14} />
              </button>
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  onClick={() => setPage(n - 1)}
                  className={`min-w-[2rem] cursor-pointer rounded-lg px-2 py-1.5 font-mono transition ${
                    n === page + 1
                      ? "bg-blue-600 text-white"
                      : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-label="Trang sau"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal chi tiết học sinh */}
      {viewing && (
        <div
          className="fixed inset-0 z-[50] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeDetail}
        >
          <div
            className="fade-slide-in relative flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/40">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar initials={initialsOf(viewing.fullName)} size="md" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-base font-semibold text-slate-900 dark:text-white">
                      {viewing.fullName || "Đang tải..."}
                    </h3>
                    {viewing.status && <StatusBadge status={viewing.status} />}
                  </div>
                  <p className="font-mono text-xs text-slate-400">{viewing.username || ""}</p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5 text-xs">
              {detailLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                  ))}
                </div>
              ) : (
                <>
                  <DetailSection icon={GraduationCap} title="Thông tin học sinh">
                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                      <InfoItem icon={Calendar} label="Ngày sinh">
                        {formatDate(viewing.dateOfBirth)}
                      </InfoItem>
                      <InfoItem label="Giới tính">{genderLabel[viewing.gender]}</InfoItem>
                      <InfoItem icon={School} label="Trường đang học">
                        {[viewing.school, viewing.grade].filter(Boolean).join(" · ")}
                      </InfoItem>
                      <InfoItem icon={MapPin} label="Địa chỉ">
                        {viewing.address}
                      </InfoItem>
                      <InfoItem icon={Phone} label="SĐT học sinh">
                        {viewing.phone}
                      </InfoItem>
                      <InfoItem icon={Mail} label="Email học sinh">
                        {viewing.email}
                      </InfoItem>
                      <div className="sm:col-span-2">
                        <InfoItem label="Mục tiêu học tập">{viewing.learningGoal}</InfoItem>
                      </div>
                    </div>
                  </DetailSection>

                  <DetailSection icon={Users} title="Phụ huynh">
                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-3">
                      <InfoItem label="Họ tên phụ huynh">{viewing.parent?.fullName}</InfoItem>
                      <InfoItem icon={Phone} label="Số điện thoại">
                        {viewing.parent?.phone && <span className="font-mono">{viewing.parent.phone}</span>}
                      </InfoItem>
                      <InfoItem icon={Mail} label="Email">
                        {viewing.parent?.email}
                      </InfoItem>
                    </div>
                  </DetailSection>

                  <DetailSection
                    icon={BookOpen}
                    title="Lớp đang tham gia"
                    aside={
                      <span className="font-mono text-[11px] text-slate-400">{viewing.currentClasses?.length ?? 0}</span>
                    }
                  >
                    <ClassList classes={viewing.currentClasses} emptyText="Học sinh hiện chưa có lớp đang học." />
                  </DetailSection>

                  <DetailSection
                    icon={History}
                    title="Lớp đã tham gia"
                    aside={<span className="font-mono text-[11px] text-slate-400">{viewing.pastClasses?.length ?? 0}</span>}
                  >
                    <ClassList classes={viewing.pastClasses} emptyText="Chưa có lớp đã kết thúc hoặc đã hủy." />
                  </DetailSection>

                  <DetailSection icon={ShieldCheck} title="Tài khoản">
                    <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                      <InfoItem label="Tên đăng nhập">
                        <span className="font-mono">{viewing.username}</span>
                      </InfoItem>
                      <InfoItem icon={Calendar} label="Thời gian tạo tài khoản">
                        {formatDateTime(viewing.createdAt)}
                      </InfoItem>
                      <div>
                        <label
                          htmlFor="student-status"
                          className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500"
                        >
                          Trạng thái hoạt động
                        </label>
                        <select
                          id="student-status"
                          className={inputClass}
                          value={viewingStatus}
                          onChange={(e) => setViewingStatus(e.target.value)}
                          disabled={savingStatus}
                        >
                          <option value="ACTIVE">Đang hoạt động</option>
                          <option value="INACTIVE">Dừng hoạt động</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="student-note" className="mb-1 block text-[11px] text-slate-400 dark:text-slate-500">
                          Ghi chú (không bắt buộc)
                        </label>
                        <input
                          id="student-note"
                          className={inputClass}
                          value={statusNote}
                          maxLength={500}
                          onChange={(e) => setStatusNote(e.target.value)}
                          placeholder="Lý do khóa / mở tài khoản"
                          disabled={savingStatus}
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      Học sinh ở trạng thái "Dừng hoạt động" sẽ không đăng nhập được vào hệ thống.
                    </p>
                  </DetailSection>
                </>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <Button variant="secondary" size="sm" onClick={closeDetail} disabled={savingStatus}>
                Đóng
              </Button>
              <Button
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={detailLoading || savingStatus || !statusChanged}
              >
                {savingStatus ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Lưu
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Popup xác nhận (UC bước 6) — đặt sau modal chi tiết để nổi lên trên */}
      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận thay đổi"
        message="Bạn có xác nhận thay đổi thông tin của HS không?"
        confirmLabel="Đồng ý"
        cancelLabel="Hủy"
        confirmTone={viewingStatus === "ACTIVE" ? "emerald" : "rose"}
        onConfirm={doSaveStatus}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default StudentManagement;
