import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  Plus,
  Trash2,
  Check,
  X,
  Search,
  GraduationCap,
  ExternalLink,
  Copy,
  BarChart3,
  Layers,
} from "lucide-react";
import { pathTemplates as initialTemplates, getStudentById } from "../../data/mockData";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import clsx from "clsx";

const levels = ["Tất cả", "A2", "B1", "B2"];

function blankTemplate() {
  return { name: "", level: "B1", goal: "" };
}

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

export default function LibraryPaths() {
  const [templates, setTemplates] = useState(initialTemplates);
  const [levelFilter, setLevelFilter] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(blankTemplate);

  // Delete confirmation
  const [deleteId, setDeleteId] = useState(null);

  const navigate = useNavigate();

  /* ---- Filtering ---- */
  const filtered = templates.filter((tpl) => {
    if (levelFilter !== "Tất cả" && tpl.level !== levelFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tpl.name.toLowerCase().includes(q) || tpl.goal.toLowerCase().includes(q);
    }
    return true;
  });

  /* ---- Stats ---- */
  const totalStudents = templates.reduce((sum, t) => sum + t.studentsUsing.length, 0);
  const totalSessions = templates.reduce((sum, t) => sum + t.sessions.length, 0);

  /* ---- CRUD ---- */
  function handleCreate() {
    if (!createForm.name.trim()) return;
    const newTpl = {
      id: `tpl-new-${Date.now()}`,
      name: createForm.name.trim(),
      level: createForm.level,
      goal: createForm.goal.trim() || "Chưa có mục tiêu",
      usageCount: 0,
      studentsUsing: [],
      sessions: [],
    };
    setTemplates((prev) => [newTpl, ...prev]);
    setShowCreateModal(false);
    setCreateForm(blankTemplate());
  }

  function confirmDelete(id) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    setDeleteId(null);
  }

  function duplicateTemplate(tpl) {
    const clone = {
      ...tpl,
      id: `tpl-clone-${Date.now()}`,
      name: `${tpl.name} (Sao chép)`,
      usageCount: 0,
      studentsUsing: [],
    };
    setTemplates((prev) => [clone, ...prev]);
  }

  return (
    <div>
      <PageHeader
        title="Kho lộ trình"
        description="Quản lý các mẫu lộ trình dùng chung. Tạo lộ trình mới, chỉnh sửa, hoặc áp dụng cho học sinh."
        actions={
          <Button size="sm" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Tạo lộ trình mới
          </Button>
        }
      />

      {/* Quick stats */}
      <div className="mb-5 grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{templates.length}</p>
          <p className="text-[11px] font-medium text-slate-400">Mẫu lộ trình</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalSessions}</p>
          <p className="text-[11px] font-medium text-slate-400">Tổng buổi học</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">{totalStudents}</p>
          <p className="text-[11px] font-medium text-slate-400">Học sinh đang dùng</p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {levels.map((lvl) => (
            <button
              key={lvl}
              onClick={() => setLevelFilter(lvl)}
              className={clsx(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                levelFilter === lvl
                  ? "accent-pill"
                  : "border-slate-200 text-slate-600 accent-pill-outline dark:border-slate-700 dark:text-slate-300"
              )}
            >
              {lvl}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm lộ trình theo tên hoặc mục tiêu..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
          />
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {filtered.map((tpl) => {
          // Group sessions by phase for mini visualization
          const phaseMap = {};
          tpl.sessions.forEach((s) => {
            if (!phaseMap[s.phase]) phaseMap[s.phase] = [];
            phaseMap[s.phase].push(s);
          });
          const phaseEntries = Object.entries(phaseMap);

          return (
            <Card key={tpl.id} padded={false} className="group/card transition-shadow hover:shadow-md">
              {/* Clickable area */}
              <div
                className="flex cursor-pointer flex-wrap items-start justify-between gap-3 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                onClick={() => navigate(`/tutor/library/paths/${tpl.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-slate-900 dark:text-slate-50">{tpl.name}</h3>
                    <Badge tone="blue">{tpl.level}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tpl.goal}</p>

                  {/* Phase mini visualization */}
                  {phaseEntries.length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      {phaseEntries.map(([phase, sessions]) => (
                        <div
                          key={phase}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 dark:border-slate-700 dark:bg-slate-800"
                          title={phase}
                        >
                          <Layers size={12} className="text-slate-400" />
                          <span className="max-w-[100px] truncate text-[11px] text-slate-500 dark:text-slate-400">
                            {phase}
                          </span>
                          <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                            {sessions.length}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone="neutral">{tpl.sessions.length} buổi học</Badge>
                    <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                      <Users size={12} /> Đã dùng cho {tpl.usageCount} học sinh
                    </span>
                  </div>
                </div>

                {/* Hover-reveal actions + avatars */}
                <div className="flex shrink-0 flex-col items-end gap-2">
                  {/* Avatars — always visible */}
                  {tpl.studentsUsing.length > 0 && (
                    <div className="flex -space-x-1.5">
                      {tpl.studentsUsing.slice(0, 4).map((sid) => {
                        const s = getStudentById(sid);
                        return s ? (
                          <div
                            key={sid}
                            title={s.name}
                            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-[10px] font-bold text-blue-700 dark:border-slate-900 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {s.name.charAt(0).toUpperCase()}
                          </div>
                        ) : null;
                      })}
                      {tpl.studentsUsing.length > 4 && (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-100 text-[10px] font-medium text-slate-500 dark:border-slate-900 dark:bg-slate-800 dark:text-slate-400">
                          +{tpl.studentsUsing.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions — visible on hover */}
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover/card:opacity-100">
                    <Link
                      to={`/tutor/library/paths/${tpl.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                    >
                      <ExternalLink size={13} /> Chi tiết
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        duplicateTemplate(tpl);
                      }}
                      title="Sao chép"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(tpl.id);
                      }}
                      title="Xóa"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Students avatars row — compact */}
              {tpl.studentsUsing.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-2.5 dark:border-slate-800">
                  <div className="flex flex-wrap items-center gap-3">
                    {tpl.studentsUsing.slice(0, 6).map((sid) => {
                      const s = getStudentById(sid);
                      return s ? (
                        <span
                          key={sid}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"
                        >
                          <GraduationCap size={12} />
                          {s.name}
                        </span>
                      ) : null;
                    })}
                    {tpl.studentsUsing.length > 6 && (
                      <span className="text-xs text-slate-400">+{tpl.studentsUsing.length - 6} học sinh khác</span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-slate-400">
            <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <BarChart3 size={22} className="text-slate-300 dark:text-slate-600" />
            </div>
            <p className="text-base font-medium text-slate-500 dark:text-slate-300">Không tìm thấy lộ trình nào</p>
            <p className="text-xs text-slate-400">Thử thay đổi bộ lọc hoặc tạo lộ trình mới</p>
            <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(true)} className="mt-1">
              <Plus size={14} /> Tạo lộ trình mới
            </Button>
          </div>
        )}
      </div>

      {/* ===== Create Modal ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto pt-10 pb-10">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setShowCreateModal(false)} />
          <Card className="relative z-10 mx-4 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Tạo lộ trình mới</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tên lộ trình <span className="text-rose-500">*</span>
                </label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Lộ trình luyện thi IELTS 6.0"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Trình độ</label>
                  <select
                    value={createForm.level}
                    onChange={(e) => setCreateForm((f) => ({ ...f, level: e.target.value }))}
                    className={inputClass}
                  >
                    {levels.filter((l) => l !== "Tất cả").map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Mục tiêu</label>
                  <input
                    value={createForm.goal}
                    onChange={(e) => setCreateForm((f) => ({ ...f, goal: e.target.value }))}
                    placeholder="VD: Thi chứng chỉ IELTS 6.0"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowCreateModal(false)} type="button">
                Hủy
              </Button>
              <Button size="sm" onClick={handleCreate} disabled={!createForm.name.trim()} type="button">
                <Check size={14} /> Tạo lộ trình
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ===== Delete Confirmation ===== */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setDeleteId(null)} />
          <Card className="relative z-10 mx-4 w-full max-w-sm">
            <h3 className="mb-2 text-sm font-semibold text-slate-900 dark:text-slate-50">Xóa lộ trình?</h3>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
              Bạn có chắc chắn muốn xóa lộ trình này khỏi Kho? Hành động này không thể hoàn tác.
            </p>
            <p className="mb-4 text-xs text-amber-600 dark:text-amber-400">
              Lưu ý: Các học sinh đã áp dụng lộ trình này vẫn giữ nguyên lộ trình đã clone — chỉ mẫu gốc trong Kho bị xóa.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)} type="button">
                Hủy
              </Button>
              <Button size="sm" onClick={() => confirmDelete(deleteId)} type="button" className="bg-rose-600 hover:bg-rose-700">
                <Trash2 size={14} /> Xóa
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}