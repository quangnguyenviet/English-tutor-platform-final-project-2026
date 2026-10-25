import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { pathTemplates } from "../../data/mockData";
import {
  ArrowLeft,
  Users,
  Pencil,
  Trash2,
  Plus,
  X,
  GraduationCap,
  AlertTriangle,
  Save,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronRight,
  Clock,
  Target,
  GripVertical,
} from "lucide-react";
import { getPathTemplateById, getStudentById, students, skillList } from "../../data/mockData";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import ProgressBar from "../../components/ui/ProgressBar";
import clsx from "clsx";

const inputClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950";

/* ---- Phase color mapping ---- */
const PHASE_COLORS = [
  { border: "border-l-blue-400", bg: "bg-blue-50 dark:bg-blue-950/20", dot: "bg-blue-400", label: "blue" },
  { border: "border-l-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/20", dot: "bg-emerald-400", label: "emerald" },
  { border: "border-l-amber-400", bg: "bg-amber-50 dark:bg-amber-950/20", dot: "bg-amber-400", label: "amber" },
  { border: "border-l-violet-400", bg: "bg-violet-50 dark:bg-violet-950/20", dot: "bg-violet-400", label: "violet" },
  { border: "border-l-rose-400", bg: "bg-rose-50 dark:bg-rose-950/20", dot: "bg-rose-400", label: "rose" },
];

function getPhaseColor(phase, index) {
  return PHASE_COLORS[index % PHASE_COLORS.length];
}

/* ---- Group sessions by phase ---- */
function groupByPhase(sessions) {
  const map = {};
  sessions.forEach((s) => {
    if (!map[s.phase]) map[s.phase] = [];
    map[s.phase].push(s);
  });
  return Object.entries(map);
}

export default function LibraryPathDetail() {
  const { templateId } = useParams();
  const navigate = useNavigate();

  const template = getPathTemplateById(templateId);
  const [tpl, setTpl] = useState(template);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showStudents, setShowStudents] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [expandedPhases, setExpandedPhases] = useState(() => {
    const groups = template ? groupByPhase(template.sessions) : [];
    return groups.map((_, i) => i);
  });

  const availableStudents = students.filter(
    (s) => !tpl?.studentsUsing?.includes(s.id)
  );

  const phaseGroups = tpl ? groupByPhase(tpl.sessions) : [];
  const studentList = tpl?.studentsUsing.map((sid) => getStudentById(sid)).filter(Boolean) || [];

  if (!tpl) {
    return (
      <div>
        <Link
          to="/tutor/library/paths"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={16} /> Quay lại Kho lộ trình
        </Link>
        <Card className="flex flex-col items-center gap-2 py-16 text-center text-sm text-slate-400">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
            <AlertTriangle size={20} className="text-slate-300 dark:text-slate-600" />
          </div>
          <p className="text-base font-medium text-slate-500 dark:text-slate-300">Không tìm thấy lộ trình</p>
          <p className="text-xs text-slate-400">Lộ trình này có thể đã bị xóa hoặc ID không đúng</p>
          <Button variant="secondary" size="sm" onClick={() => navigate("/tutor/library/paths")}>
            Quay lại Kho lộ trình
          </Button>
        </Card>
      </div>
    );
  }

  /* ---- Edit mode ---- */
  function startEdit() {
    setEditing(true);
    setEditForm({
      name: tpl.name,
      level: tpl.level,
      goal: tpl.goal,
      sessions: tpl.sessions.map((s) => ({
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phase: s.phase,
        topic: s.topic,
        skills: [...s.skills],
      })),
    });
  }

  function cancelEdit() {
    setEditing(false);
    setEditForm(null);
  }

  function saveEdit() {
    if (!editForm.name.trim()) return;
    const updated = {
      name: editForm.name.trim(),
      level: editForm.level,
      goal: editForm.goal.trim() || tpl.goal,
      sessions: editForm.sessions.map((s) => ({
        phase: s.phase.trim() || "Giai đoạn",
        topic: s.topic.trim() || "Chưa đặt tên",
        skills: [...s.skills],
      })),
    };
    setTpl((prev) => ({ ...prev, ...updated }));
    const target = getPathTemplateById(templateId);
    if (target) {
      Object.assign(target, updated);
    }
    setEditing(false);
    setEditForm(null);
  }

  /* ---- Edit session helpers ---- */
  function addSession() {
    setEditForm((f) => ({
      ...f,
      sessions: [...f.sessions, {
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phase: "Giai đoạn mới",
        topic: "",
        skills: [],
      }],
    }));
  }

  function addSessionToPhase(phaseName) {
    setEditForm((f) => ({
      ...f,
      sessions: [...f.sessions, {
        id: `edit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        phase: phaseName,
        topic: "",
        skills: [],
      }],
    }));
  }

  function removeSession(uid) {
    if (editForm.sessions.length <= 1) return;
    setEditForm((f) => ({
      ...f,
      sessions: f.sessions.filter((s) => s.id !== uid),
    }));
  }

  function updateSession(uid, patch) {
    setEditForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) => (s.id === uid ? { ...s, ...patch } : s)),
    }));
  }

  function toggleSkill(uid, sk) {
    setEditForm((f) => ({
      ...f,
      sessions: f.sessions.map((s) => {
        if (s.id !== uid) return s;
        const skills = s.skills.includes(sk)
          ? s.skills.filter((x) => x !== sk)
          : [...s.skills, sk];
        return { ...s, skills };
      }),
    }));
  }

  /* ---- Delete ---- */
  function confirmDelete() {
    const idx = pathTemplates.findIndex((t) => t.id === templateId);
    if (idx !== -1) pathTemplates.splice(idx, 1);
    navigate("/tutor/library/paths");
  }

  /* ---- Add student ---- */
  function addStudentToTemplate(studentId) {
    if (!tpl.studentsUsing.includes(studentId)) {
      tpl.studentsUsing.push(studentId);
      tpl.usageCount = tpl.studentsUsing.length;
      setTpl({ ...tpl });
    }
    setShowAddStudent(false);
  }

  /* ---- Phase collapse toggle ---- */
  function togglePhase(idx) {
    setExpandedPhases((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  }

  /* ---- Stats ---- */
  const totalSkills = new Set(tpl.sessions.flatMap((s) => s.skills)).size;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-slate-400">
        <Link to="/tutor/library/paths" className="hover:text-slate-600 dark:hover:text-slate-200">
          Kho lộ trình
        </Link>
        <span>/</span>
        <span className="truncate text-slate-700 dark:text-slate-300">{tpl.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{tpl.name}</h1>
              <Badge tone="blue">{tpl.level}</Badge>
              {tpl.sessions.length > 0 && (
                <Badge tone="neutral">{tpl.sessions.length} buổi</Badge>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{tpl.goal}</p>
          </div>

          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Button variant="secondary" size="sm" onClick={cancelEdit}>
                  <X size={14} /> Hủy
                </Button>
                <Button size="sm" onClick={saveEdit}>
                  <Save size={14} /> Lưu
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={startEdit}>
                  <Pencil size={14} /> Chỉnh sửa
                </Button>
                <Button
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  onClick={() => setDeleting(true)}
                >
                  <Trash2 size={14} /> Xóa
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      {!editing && (
        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Target size={14} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Trình độ</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-50">{tpl.level}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <BookOpen size={14} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Buổi học</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-50">{tpl.sessions.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Đã dùng cho</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-50">{tpl.usageCount} học sinh</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-slate-400" />
              <p className="text-xs font-medium text-slate-400">Kỹ năng</p>
            </div>
            <p className="mt-1.5 text-lg font-semibold text-slate-900 dark:text-slate-50">{totalSkills}</p>
          </div>
        </div>
      )}

      {/* ===== SESSION TIMELINE BY PHASE ===== */}
      {/* Always show the timeline — in view mode it's the main content, in edit mode it sits alongside the panel */}
      <div className="flex items-start gap-6">
        <div className={clsx("min-w-0 flex-1 space-y-6 transition-all", editing && "opacity-40 pointer-events-none")}>
          <Card padded={false}>
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Các buổi học theo giai đoạn
              </h3>
            </div>

            {tpl.sessions.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Lộ trình này chưa có buổi học nào.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {phaseGroups.map(([phase, sessions], groupIdx) => {
                  const pc = getPhaseColor(phase, groupIdx);
                  const isExpanded = expandedPhases.includes(groupIdx);

                  return (
                    <div key={phase} className={clsx("border-l-4", pc.border)}>
                      {/* Phase header */}
                      <button
                        onClick={() => togglePhase(groupIdx)}
                        className="flex w-full items-center justify-between px-5 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-900/40"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className={clsx("h-2 w-2 rounded-full", pc.dot)} />
                          <span className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                            {phase}
                          </span>
                          <Badge tone="neutral">{sessions.length} buổi</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">
                            {sessions.reduce((sum, s) => sum + s.skills.length, 0)} kỹ năng
                          </span>
                          {isExpanded ? (
                            <ChevronDown size={15} className="text-slate-400" />
                          ) : (
                            <ChevronRight size={15} className="text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Session items */}
                      {isExpanded && (
                        <div className={clsx("px-5 pb-3", pc.bg)}>
                          {sessions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition hover:bg-white/60 dark:hover:bg-white/5">
                              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-bold text-slate-500 shadow-sm dark:bg-slate-800 dark:text-slate-300">
                                {phaseGroups.slice(0, groupIdx).reduce((sum, [, s]) => sum + s.length, 0) + i + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                  {s.topic}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {s.skills.map((sk) => (
                                    <Badge key={sk} skill={sk}>{sk}</Badge>
                                  ))}
                                  {s.skills.length === 0 && (
                                    <span className="text-xs text-slate-400">Chưa gắn kỹ năng</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Students section */}
          {!editing && (
            <>
              <Card padded={false}>
                <div
                  className="flex cursor-pointer items-center justify-between border-b border-slate-200 px-5 py-3 dark:border-slate-800"
                  onClick={() => setShowStudents((v) => !v)}
                >
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-slate-400" />
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      Học sinh đang dùng ({studentList.length})
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowAddStudent(true); }}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                    >
                      <Plus size={13} /> Thêm học sinh
                    </button>
                    <ChevronDown
                      size={16}
                      className={clsx(
                        "text-slate-400 transition-transform",
                        showStudents && "rotate-180"
                      )}
                    />
                  </div>
                </div>

                {showStudents && studentList.length > 0 && (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {studentList.map((s) => (
                      <div
                        key={s.id}
                        className="flex items-center gap-4 p-4"
                      >
                        <GraduationCap size={18} className="shrink-0 text-slate-400" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{s.name}</p>
                            <Badge tone="blue">{s.level}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{s.goal}</p>
                          {s.overallProgress !== undefined && (
                            <div className="mt-2 flex items-center gap-2">
                              <ProgressBar value={s.overallProgress} className="flex-1" />
                              <span className="text-xs tabular-nums text-slate-400">{s.overallProgress}%</span>
                            </div>
                          )}
                        </div>
                        <div className="shrink-0 text-xs text-slate-400">
                          <Clock size={13} className="mr-1 inline" />
                          {s.schedule?.split(",")[0] || "Linh hoạt"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showStudents && studentList.length === 0 && (
                  <div className="flex flex-col items-center gap-2 p-8 text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <Users size={16} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-300">Chưa có học sinh nào</p>
                    <p className="text-xs text-slate-400">Thêm học sinh để bắt đầu áp dụng lộ trình này</p>
                    <Button size="sm" variant="secondary" onClick={() => setShowAddStudent(true)} className="mt-1">
                      <Plus size={14} /> Thêm học sinh
                    </Button>
                  </div>
                )}
              </Card>

            </>
          )}
        </div>

        {/* ===== EDIT DRAWER — slides in from the right ===== */}
        {editing && (
          <div className="w-full max-w-lg shrink-0 animate-[slide-in-right_0.25s_ease-out]">
            <Card>
              {/* Edit form header */}
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Chỉnh sửa lộ trình</h3>
                  <p className="text-xs text-slate-400">Thay đổi sẽ được lưu khi bấm "Lưu"</p>
                </div>
                <button
                  onClick={cancelEdit}
                  className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                    Tên lộ trình <span className="text-rose-500">*</span>
                  </label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                    className={inputClass}
                    autoFocus
                    placeholder="VD: Lộ trình luyện thi IELTS 6.0"
                  />
                </div>

                {/* Level + Goal */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Trình độ</label>
                    <select
                      value={editForm.level}
                      onChange={(e) => setEditForm((f) => ({ ...f, level: e.target.value }))}
                      className={inputClass}
                    >
                      <option value="A2">A2</option>
                      <option value="B1">B1</option>
                      <option value="B2">B2</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Mục tiêu</label>
                    <input
                      value={editForm.goal}
                      onChange={(e) => setEditForm((f) => ({ ...f, goal: e.target.value }))}
                      className={inputClass}
                      placeholder="VD: Thi chứng chỉ IELTS 6.0"
                    />
                  </div>
                </div>

                {/* Sessions divider */}
                <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      Các buổi học ({editForm.sessions.length})
                    </label>
                    <button
                      onClick={addSession}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950"
                    >
                      <Plus size={13} /> Thêm buổi học
                    </button>
                  </div>

                  {/* Sessions grouped by phase in edit mode */}
                  {editForm.sessions.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-400 dark:border-slate-700">
                      Chưa có buổi học nào. Bấm "Thêm buổi học" để bắt đầu.
                    </p>
                  ) : (
                    <div className="max-h-[400px] space-y-3 overflow-y-auto pr-1">
                      {/* Group edit sessions by phase for display */}
                      {(() => {
                        const editGroups = {};
                        editForm.sessions.forEach((s) => {
                          if (!editGroups[s.phase]) editGroups[s.phase] = [];
                          editGroups[s.phase].push(s);
                        });
                        return Object.entries(editGroups).map(([phase, sessions], gi) => {
                          const pc = getPhaseColor(phase, gi);
                          return (
                            <div key={phase} className={clsx("rounded-lg border-l-4 p-3", pc.border, pc.bg)}>
                              {/* Phase label */}
                              <div className="mb-2 flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <span className={clsx("h-1.5 w-1.5 rounded-full", pc.dot)} />
                                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                    {phase}
                                  </span>
                                  <Badge tone="neutral">{sessions.length}</Badge>
                                </div>
                                <button
                                  onClick={() => addSessionToPhase(phase)}
                                  className="rounded p-0.5 text-slate-400 hover:text-blue-500"
                                  title="Thêm buổi vào giai đoạn này"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>

                              {/* Session cards */}
                              <div className="space-y-2">
                                {sessions.map((s) => (
                                  <div
                                    key={s.id}
                                    className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
                                  >
                                    <div className="mb-2 flex items-center justify-between">
                                      <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                                        <GripVertical size={12} className="text-slate-300" />
                                        {editForm.sessions.findIndex((x) => x.id === s.id) + 1}
                                      </span>
                                      <button
                                        onClick={() => removeSession(s.id)}
                                        className="rounded p-0.5 text-slate-400 hover:text-rose-500"
                                        title="Xóa buổi học"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="grid gap-1.5 sm:grid-cols-1">
                                        <input
                                          value={s.topic}
                                          onChange={(e) => updateSession(s.id, { topic: e.target.value })}
                                          placeholder="Chủ đề buổi học"
                                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-950"
                                        />
                                        <input
                                          value={s.phase}
                                          onChange={(e) => updateSession(s.id, { phase: e.target.value })}
                                          placeholder="Giai đoạn"
                                          className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-950"
                                        />
                                      </div>
                                      <div>
                                        <div className="flex flex-wrap gap-1">
                                          {skillList.map((sk) => (
                                            <button
                                              type="button"
                                              key={sk}
                                              onClick={() => toggleSkill(s.id, sk)}
                                              className={clsx(
                                                "rounded-full border px-2 py-0.5 text-[10px] font-medium transition",
                                                s.skills.includes(sk)
                                                  ? "border-blue-600 bg-blue-600 text-white"
                                                  : "border-slate-200 text-slate-500 hover:border-blue-300 dark:border-slate-600 dark:text-slate-400"
                                              )}
                                            >
                                              {sk}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                <Button variant="secondary" size="sm" onClick={cancelEdit} type="button">
                  <X size={14} /> Hủy
                </Button>
                <Button size="sm" onClick={saveEdit} disabled={!editForm.name.trim()} type="button">
                  <Save size={14} /> Lưu thay đổi
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ===== Delete confirmation ===== */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setDeleting(false)} />
          <Card className="relative z-10 mx-4 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                <Trash2 size={18} className="text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Xóa lộ trình?</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">"{tpl.name}" sẽ bị xóa khỏi Kho</p>
              </div>
            </div>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
              Hành động này không thể hoàn tác. Các học sinh đã áp dụng lộ trình này vẫn giữ nguyên lộ trình đã clone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setDeleting(false)} type="button">Hủy</Button>
              <Button size="sm" className="bg-rose-600 hover:bg-rose-700" onClick={confirmDelete} type="button">
                <Trash2 size={14} /> Xóa
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ===== Add student modal ===== */}
      {showAddStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setShowAddStudent(false)} />
          <Card className="relative z-10 mx-4 w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Thêm học sinh dùng lộ trình này</h3>
              <button onClick={() => setShowAddStudent(false)} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200">
                <X size={16} />
              </button>
            </div>

            <div className="min-h-0 flex-1">
              {availableStudents.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                    <Users size={16} className="text-slate-300 dark:text-slate-600" />
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-300">Tất cả học sinh đã được thêm</p>
                </div>
              ) : (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {availableStudents.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => addStudentToTemplate(s.id)}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left transition hover:bg-slate-50 hover:border-blue-200 dark:border-slate-800 dark:hover:bg-slate-800/50 dark:hover:border-blue-800"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {s.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{s.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{s.level} &middot; {s.goal}</p>
                      </div>
                      <Badge tone="blue">{s.level}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowAddStudent(false)} type="button">Đóng</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}