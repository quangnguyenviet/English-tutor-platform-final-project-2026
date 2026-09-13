import { useState } from "react";
import {
  Plus,
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
  BookOpen,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";

const statusOptions = [
  { value: "active", label: "Đang hoạt động", tone: "emerald" },
  { value: "pending", label: "Chờ duyệt", tone: "amber" },
  { value: "inactive", label: "Ngưng hoạt động", tone: "slate" },
];

const specializationOptions = [
  "IELTS",
  "IELTS Writing",
  "IELTS Reading",
  "IELTS Speaking",
  "Giao tiếp cơ bản",
  "Phát âm chuẩn",
  "Nghe hiểu phản xạ",
  "Ngữ pháp THPT",
  "Từ vựng nâng cao",
  "Tiếng Anh Thương mại",
];

function emptyForm() {
  return {
    name: "",
    email: "",
    phone: "",
    status: "pending",
    joinedDate: new Date().toISOString().slice(0, 10),
    specialization: [],
    studentsCount: 0,
    ratePerHour: "250.000đ",
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export function TutorManagement() {
  const { tutorList, addTutor, updateTutor, removeTutor } = useAuth();

  const [query, setQuery] = useState("");
  const [statusTab, setStatusTab] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
        t.specialization.some((s) => s.toLowerCase().includes(query.toLowerCase()))
      )
  );

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(t) {
    setEditingId(t.id);
    setForm({
      name: t.name,
      email: t.email,
      phone: t.phone || "",
      status: t.status,
      joinedDate: t.joinedDate,
      specialization: [...(t.specialization || [])],
      studentsCount: t.studentsCount ?? 0,
      ratePerHour: t.ratePerHour || "250.000đ",
    });
    setShowForm(true);
  }

  function toggleSpecialization(s) {
    setForm((f) => {
      const set = new Set(f.specialization);
      if (set.has(s)) set.delete(s);
      else set.add(s);
      return { ...f, specialization: Array.from(set) };
    });
  }

  function handleSubmit() {
    if (!form.name.trim() || !form.email.trim()) return;

    const initials = form.name
      .trim()
      .split(/\s+/)
      .slice(-2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      status: form.status,
      joinedDate: form.joinedDate,
      specialization: form.specialization,
      studentsCount: form.studentsCount ?? 0,
      ratePerHour: form.ratePerHour,
      initials,
    };

    if (editingId) {
      updateTutor(editingId, payload);
      showToast(`Đã cập nhật thông tin gia sư ${payload.name}`);
    } else {
      addTutor(payload);
      showToast(`Đã thêm mới gia sư ${payload.name}`);
    }
    resetForm();
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

      <PageHeader
        title="Quản lý gia sư"
        description="Thêm mới, phê duyệt tài khoản và quản lý thông tin đội ngũ gia sư tiếng Anh."
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={14} /> Thêm gia sư
          </Button>
        }
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

      {/* Add / Edit Tutor Form */}
      {showForm && (
        <Card className="fade-slide-in border-blue-200 shadow-md dark:border-blue-900/50">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? "Chỉnh sửa thông tin gia sư" : "Thêm gia sư mới vào hệ thống"}
            </h3>
            <button
              onClick={resetForm}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
            >
              <X size={16} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Họ và tên <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Nguyễn Lan Anh"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Email liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="lananh.tutor@example.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Số điện thoại
              </label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="VD: 0987 654 321"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Mức học phí / giờ
              </label>
              <input
                value={form.ratePerHour}
                onChange={(e) => setForm((f) => ({ ...f, ratePerHour: e.target.value }))}
                placeholder="VD: 250.000đ"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Trạng thái hoạt động
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={inputClass}
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Ngày tham gia
              </label>
              <input
                type="date"
                value={form.joinedDate}
                onChange={(e) => setForm((f) => ({ ...f, joinedDate: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Lĩnh vực chuyên môn & Kỹ năng giảng dạy
            </label>
            <div className="flex flex-wrap gap-2">
              {specializationOptions.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSpecialization(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition active:scale-[0.98] ${
                    form.specialization.includes(s)
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={resetForm} type="button">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.email.trim()}
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check size={14} /> {editingId ? "Lưu thay đổi" : "Tạo hồ sơ gia sư"}
            </Button>
          </div>
        </Card>
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
                      {t.specialization.map((s) => (
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
                    {t.status === "pending" && (
                      <>
                        <button
                          onClick={() => {
                            updateTutor(t.id, { status: "active" });
                            showToast(`Đã duyệt tài khoản ${t.name}`);
                          }}
                          title="Duyệt tài khoản"
                          className="rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          <UserCheck size={16} />
                        </button>
                        <button
                          onClick={() => {
                            updateTutor(t.id, { status: "inactive" });
                            showToast(`Đã từ chối tài khoản ${t.name}`);
                          }}
                          title="Từ chối"
                          className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <UserX size={16} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleEdit(t)}
                      title="Chỉnh sửa thông tin"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa gia sư ${t.name} khỏi hệ thống?`)) {
                          removeTutor(t.id);
                          showToast(`Đã xóa gia sư ${t.name}`);
                        }
                      }}
                      title="Xóa"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 size={15} />
                    </button>
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
    </div>
  );
}

export default TutorManagement;