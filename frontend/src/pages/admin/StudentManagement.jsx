import { useState } from "react";
import {
  Plus,
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
  MessageCircle,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Avatar from "../../components/ui/Avatar";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import StatCard from "../../components/ui/StatCard";

const levelOptions = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Non-purple level badge tones conforming to DESIGN.md
const levelTone = {
  A1: "slate",
  A2: "slate",
  B1: "blue",
  B2: "blue",
  C1: "indigo",
  C2: "indigo",
};

function emptyForm() {
  return {
    name: "",
    level: "A1",
    goal: "",
    schedule: "",
    parentName: "",
    parentTelegram: "",
    parentPhone: "",
    joinedDate: new Date().toISOString().slice(0, 10),
    assignedTutorId: "",
  };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export function StudentManagement() {
  const { studentList, addStudent, updateStudent, removeStudent, tutorList } = useAuth();

  const [query, setQuery] = useState("");
  const [levelTab, setLevelTab] = useState("all");
  const [tutorFilter, setTutorFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const activeTutors = tutorList.filter((t) => t.status === "active");

  const assignedCount = studentList.filter((s) => s.assignedTutorId).length;
  const unassignedCount = studentList.length - assignedCount;
  const avgProgress = studentList.length
    ? Math.round(
        studentList.reduce((acc, s) => acc + (s.overallProgress || 0), 0) / studentList.length
      )
    : 0;

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

    const matchLevel = levelTab === "all" || s.level === levelTab;

    return matchQuery && matchTutor && matchLevel;
  });

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function handleEdit(s) {
    setEditingId(s.id);
    setForm({
      name: s.name,
      level: s.level || "A1",
      goal: s.goal || "",
      schedule: s.schedule || "",
      parentName: s.parentName || "",
      parentTelegram: s.parentTelegram || "",
      parentPhone: s.parentPhone || "",
      joinedDate: s.joinedDate,
      assignedTutorId: s.assignedTutorId || "",
    });
    setShowForm(true);
  }

  function handleSubmit() {
    if (!form.name.trim()) return;

    const payload = {
      name: form.name.trim(),
      level: form.level,
      goal: form.goal.trim(),
      schedule: form.schedule.trim(),
      parentName: form.parentName.trim(),
      parentTelegram: form.parentTelegram.trim(),
      parentPhone: form.parentPhone.trim(),
      joinedDate: form.joinedDate,
      assignedTutorId: form.assignedTutorId || null,
    };

    if (editingId) {
      updateStudent(editingId, payload);
      showToast(`Đã cập nhật thông tin học sinh ${payload.name}`);
    } else {
      addStudent(payload);
      showToast(`Đã thêm học sinh ${payload.name} thành công`);
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
        title="Quản lý học sinh"
        description="Thêm mới, theo dõi lộ trình và quản lý phân công gia sư trực tiếp cho từng học sinh."
        actions={
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus size={14} /> Thêm học sinh
          </Button>
        }
      />

      {/* KPI Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Tổng số học sinh"
          value={studentList.length}
          hint="Hồ sơ học tập kích hoạt"
          tone="blue"
        />
        <StatCard
          icon={UserCheck}
          label="Đã phân công gia sư"
          value={assignedCount}
          hint={`${studentList.length ? Math.round((assignedCount / studentList.length) * 100) : 0}% tỷ lệ ghép lớp`}
          tone="emerald"
        />
        <StatCard
          icon={UserX}
          label="Chưa có gia sư"
          value={unassignedCount}
          hint="Cần điều phối ghép lớp"
          tone="amber"
        />
        <StatCard
          icon={TrendingUp}
          label="Tiến độ học tập TB"
          value={`${avgProgress}%`}
          hint="Đánh giá qua bài tập"
          tone="indigo"
        />
      </div>

      {/* Filters Toolbar */}
      <Card padded={false} className="p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Level Tabs */}
          <div className="flex flex-wrap gap-2">
            {["all", "A1", "A2", "B1", "B2", "C1", "C2"].map((lv) => (
              <button
                key={lv}
                onClick={() => setLevelTab(lv)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition active:scale-[0.98] ${
                  levelTab === lv
                    ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                }`}
              >
                {lv === "all" ? "Tất cả trình độ" : `Cấp ${lv}`}
              </button>
            ))}
          </div>

          {/* Search & Tutor Filter */}
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

      {/* Add / Edit Student Form */}
      {showForm && (
        <Card className="fade-slide-in border-blue-200 shadow-md dark:border-blue-900/50">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? "Chỉnh sửa thông tin học sinh" : "Thêm học sinh mới vào hệ thống"}
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
                Họ và tên học sinh <span className="text-rose-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="VD: Nguyễn Minh Khôi"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Trình độ hiện tại (CEFR)
              </label>
              <select
                value={form.level}
                onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                className={inputClass}
              >
                {levelOptions.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Mục tiêu học tập
              </label>
              <input
                value={form.goal}
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
                value={form.schedule}
                onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                placeholder="VD: Thứ 2 - 4 - 6 (19:30 - 21:00)"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Họ tên Phụ huynh
              </label>
              <input
                value={form.parentName}
                onChange={(e) => setForm((f) => ({ ...f, parentName: e.target.value }))}
                placeholder="VD: Chị Nguyễn Hải Yến"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Số điện thoại Phụ huynh
              </label>
              <input
                value={form.parentPhone}
                onChange={(e) => setForm((f) => ({ ...f, parentPhone: e.target.value }))}
                placeholder="VD: 0966 223 344"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Telegram Phụ huynh
              </label>
              <input
                value={form.parentTelegram}
                onChange={(e) => setForm((f) => ({ ...f, parentTelegram: e.target.value }))}
                placeholder="VD: @haiyen_hanoi"
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Phân công Gia sư phụ trách
              </label>
              <select
                value={form.assignedTutorId}
                onChange={(e) => setForm((f) => ({ ...f, assignedTutorId: e.target.value }))}
                className={inputClass}
              >
                <option value="">— Chưa phân công —</option>
                {activeTutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.specialization.slice(0, 2).join(", ")})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <Button variant="secondary" size="sm" onClick={resetForm} type="button">
              Hủy
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!form.name.trim()}
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Check size={14} /> {editingId ? "Lưu thay đổi" : "Tạo học sinh mới"}
            </Button>
          </div>
        </Card>
      )}

      {/* Student List Table */}
      <Card padded={false}>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((s, idx) => {
            const assignedTutor = tutorList.find((t) => t.id === s.assignedTutorId);

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

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(s)}
                      title="Chỉnh sửa thông tin"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil size={15} />
                    </button>

                    <button
                      onClick={() => {
                        if (window.confirm(`Xóa học sinh ${s.name} khỏi hệ thống?`)) {
                          removeStudent(s.id);
                          showToast(`Đã xóa học sinh ${s.name}`);
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
              Không tìm thấy học sinh nào phù hợp với bộ lọc tìm kiếm.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

export default StudentManagement;
