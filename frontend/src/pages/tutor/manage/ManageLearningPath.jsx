import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2,
  Circle,
  PlayCircle,
  Library,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  FileText,
  PlayCircle as PlayCircleIcon,
  Save,
} from "lucide-react";
import { pathTemplates, skillList, computeActualUsage } from "../../../data/mockData";
import Card from "../../../components/ui/Card";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import { useAiAssistant } from "../../../context/AiAssistantContext";
import clsx from "clsx";
import {
  exerciseStatus,
  statusOptions,
  sessionStatusMeta,
  difficultyOptions,
  materialTypeOptions,
  findFocusSession,
} from "./manageHelpers";

function emptyForm(phase, session) {
  return {
    phase,
    session,
    date: "",
    topic: "",
    status: "upcoming",
    skillsSet: new Set(),
    exerciseIdsSet: new Set(),
    materialIdsSet: new Set(),
  };
}

const DETAIL_TABS = [
  { key: "overview", label: "Tổng quan" },
  { key: "exercises", label: "Bài tập" },
  { key: "materials", label: "Tài liệu" },
];

export default function ManageLearningPath({
  student,
  classId,
  pathItems,
  setPathItems,
  exercisesList,
  setExercisesList,
  materialsList,
  setMaterialsList,
  onSessionAdded,
}) {
  // UI state — editing session
  const [editingItemId, setEditingItemId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [selectedSessionId, setSelectedSessionId] = useState(
    () => findFocusSession(pathItems)?.id ?? null
  );
  const [detailTab, setDetailTab] = useState("overview");
  const [showPathPicker, setShowPathPicker] = useState(false);

  // Save-as-template modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveForm, setSaveForm] = useState({ name: "", level: student?.level || "B1", goal: student?.goal || "" });

  useEffect(() => {
    setDetailTab("overview");
  }, [selectedSessionId]);

  const groupedPath = useMemo(() => {
    const groups = [];
    for (const item of pathItems) {
      let g = groups.find((g) => g.phase === item.phase);
      if (!g) {
        g = { phase: item.phase, items: [] };
        groups.push(g);
      }
      g.items.push(item);
    }
    return groups;
  }, [pathItems]);

  const nextSession = useMemo(
    () => pathItems.reduce((max, it) => Math.max(max, it.session || 0), 0) + 1,
    [pathItems]
  );

  const focusSession = useMemo(() => findFocusSession(pathItems), [pathItems]);

  const exercisesBySession = useMemo(() => {
    const map = {};
    for (const ex of exercisesList) {
      if (!ex.sessionId) continue;
      (map[ex.sessionId] ??= []).push(ex);
    }
    return map;
  }, [exercisesList]);

  const materialsBySession = useMemo(() => {
    const map = {};
    for (const m of materialsList) {
      if (!m.sessionId) continue;
      (map[m.sessionId] ??= []).push(m);
    }
    return map;
  }, [materialsList]);

  const selectedSession = useMemo(
    () => pathItems.find((it) => it.id === selectedSessionId) ?? null,
    [pathItems, selectedSessionId]
  );

  function sessionLabel(sessionId) {
    const item = pathItems.find((it) => it.id === sessionId);
    return item ? `Buổi ${item.session}: ${item.topic}` : null;
  }

  function startEdit(item) {
    setEditingItemId(item.id);
    setEditForm({
      ...item,
      skillsSet: new Set(item.skills),
      exerciseIdsSet: new Set((exercisesBySession[item.id] || []).map((ex) => ex.id)),
      materialIdsSet: new Set((materialsBySession[item.id] || []).map((m) => m.id)),
    });
    setSelectedSessionId(item.id);
  }

  function startAddItem(phase) {
    const id = `lp-new-${Date.now()}`;
    setPathItems((prev) => [
      ...prev,
      { id, phase, session: nextSession, date: "", topic: "", skills: [], status: "upcoming", __isNew: true },
    ]);
    setEditingItemId(id);
    setEditForm(emptyForm(phase, nextSession));
    setSelectedSessionId(id);
  }

  function startAddPhase() {
    startAddItem("Giai đoạn mới");
  }

  function toggleEditSkill(sk) {
    setEditForm((f) => {
      const set = new Set(f.skillsSet);
      if (set.has(sk)) set.delete(sk);
      else set.add(sk);
      return { ...f, skillsSet: set };
    });
  }

  function toggleEditExercise(id) {
    setEditForm((f) => {
      const set = new Set(f.exerciseIdsSet);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, exerciseIdsSet: set };
    });
  }

  function toggleEditMaterial(id) {
    setEditForm((f) => {
      const set = new Set(f.materialIdsSet);
      if (set.has(id)) set.delete(id);
      else set.add(id);
      return { ...f, materialIdsSet: set };
    });
  }

  function saveEdit() {
    if (!editForm.topic.trim() || !editForm.phase.trim()) return;
    setPathItems((prev) =>
      prev.map((it) =>
        it.id === editingItemId
          ? {
              ...it,
              phase: editForm.phase.trim(),
              topic: editForm.topic.trim(),
              date: editForm.date.trim() || "Chưa xếp lịch",
              status: editForm.status,
              skills: Array.from(editForm.skillsSet),
              __isNew: undefined,
            }
          : it
      )
    );
    setExercisesList((prev) =>
      prev.map((ex) => {
        if (editForm.exerciseIdsSet.has(ex.id)) return { ...ex, sessionId: editingItemId };
        if (ex.sessionId === editingItemId) return { ...ex, sessionId: null };
        return ex;
      })
    );
    setMaterialsList((prev) =>
      prev.map((m) => {
        if (editForm.materialIdsSet.has(m.id)) return { ...m, sessionId: editingItemId };
        if (m.sessionId === editingItemId) return { ...m, sessionId: null };
        return m;
      })
    );
    setEditingItemId(null);
    setEditForm(null);
  }

  function cancelEdit() {
    const wasNew = pathItems.some((it) => it.id === editingItemId && it.__isNew);
    setPathItems((prev) => prev.filter((it) => !(it.id === editingItemId && it.__isNew)));
    if (wasNew) setSelectedSessionId(null);
    setEditingItemId(null);
    setEditForm(null);
  }

  function deleteItem(id) {
    setPathItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setEditForm(null);
    }
    if (selectedSessionId === id) setSelectedSessionId(null);
  }

  function setSessionStatus(id, status) {
    setPathItems((prev) => prev.map((it) => (it.id === id ? { ...it, status } : it)));
  }

  function applyPathTemplate(tpl) {
    const startSession = nextSession;
    const cloned = tpl.sessions.map((s, i) => ({
      id: `lp-tpl-${tpl.id}-${Date.now()}-${i}`,
      phase: s.phase,
      session: startSession + i,
      date: "Chưa xếp lịch",
      skills: s.skills,
      topic: s.topic,
      status: "upcoming",
      sourceTemplateName: tpl.name,
    }));
    setPathItems((prev) => [...prev, ...cloned]);

    // Cập nhật studentsUsing và templateSource cho học sinh
    const templateInStore = pathTemplates.find((t) => t.id === tpl.id);
    if (templateInStore) {
      if (!templateInStore.studentsUsing.includes(student?.id)) {
        templateInStore.studentsUsing.push(student?.id);
      }
      templateInStore.usageCount = computeActualUsage(tpl.id) || templateInStore.usageCount;
    }

    setShowPathPicker(false);
  }

  /* ---- Save as Template ---- */
  function handleSaveAsTemplate() {
    if (!saveForm.name.trim()) return;
    const newTemplate = {
      id: `tpl-saved-${Date.now()}`,
      name: saveForm.name.trim(),
      level: saveForm.level,
      goal: saveForm.goal.trim() || student?.goal || "Tùy chỉnh",
      usageCount: 0,
      studentsUsing: [student?.id],
      sessions: pathItems.map((it) => ({
        phase: it.phase,
        topic: it.topic,
        skills: [...it.skills],
      })),
    };
    pathTemplates.unshift(newTemplate);
    setShowSaveModal(false);
    setSaveForm({ name: "", level: student?.level || "B1", goal: student?.goal || "" });
    // Scroll to top after save
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const { registerTarget, clearTarget } = useAiAssistant();

  function handleApplyPathDraft(items) {
    setPathItems((prev) => [...prev, ...items]);
  }

  function handleApplyExerciseDraft(exercise) {
    setExercisesList((prev) => [
      {
        id: `ex-ai-${Date.now()}`,
        title: exercise.title,
        skill: exercise.skill,
        difficulty: exercise.difficulty,
        type: exercise.type,
        status: "assigned",
        assignedDate: "Hôm nay",
        sessionId: exercise.sessionId ?? null,
      },
      ...prev,
    ]);
  }

  useEffect(() => {
    if (!student) return undefined;
    registerTarget({
      student,
      nextSession,
      pathItems,
      focusSession,
      onApplyPath: handleApplyPathDraft,
      onApplyExercise: handleApplyExerciseDraft,
    });
    return () => clearTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, nextSession, pathItems]);

  return (
    <div className="flex items-start gap-6">
    <div className="min-w-0 flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Lộ trình học</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSaveModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-emerald-600 accent-border-light-hover hover:bg-emerald-50 dark:border-slate-700 dark:text-emerald-400 dark:hover:bg-emerald-950"
            >
              <Save size={14} /> Lưu thành mẫu
            </button>
            <button
              onClick={() => setShowPathPicker((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 accent-border-light-hover hover:accent-text dark:border-slate-700 dark:text-slate-300 dark:hover:accent-text-dark"
            >
              <Library size={14} /> Áp dụng lộ trình từ Kho
            </button>
          </div>
        </div>

        {showPathPicker && (
          <Card>
            <h3 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">Chọn mẫu lộ trình từ Kho</h3>
            <div className="space-y-2">
              {pathTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-50">{tpl.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {tpl.sessions.length} buổi học &middot; {tpl.goal}
                    </p>
                    {tpl.studentsUsing.length > 0 && (
                      <p className="mt-0.5 text-xs text-slate-400">
                        {tpl.studentsUsing.length} học sinh đang dùng
                      </p>
                    )}
                  </div>
                  <Button size="sm" onClick={() => applyPathTemplate(tpl)} type="button">
                    Áp dụng
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">
              Các buổi học sẽ được thêm vào lộ trình của {student?.name} dưới dạng bản sao độc lập — chỉnh sửa sau này sẽ không ảnh hưởng tới mẫu gốc trong Kho.
            </p>
          </Card>
        )}

        {groupedPath.map((g) => (
          <Card key={g.phase} padded={false}>
            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-800">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">{g.phase}</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {g.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedSessionId(item.id)}
                  className={clsx(
                    "group flex cursor-pointer items-start gap-3 p-4 transition",
                    selectedSessionId === item.id
                      ? "bg-blue-50 dark:bg-blue-950/40"
                      : "hover:bg-slate-50 dark:hover:bg-slate-900/60"
                  )}
                >
                  {item.status === "done" ? (
                    <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-500" />
                  ) : item.status === "in_progress" ? (
                    <PlayCircle size={20} className="mt-0.5 shrink-0 text-amber-500" />
                  ) : (
                    <Circle size={20} className="mt-0.5 shrink-0 text-slate-300 dark:text-slate-700" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                        Buổi {item.session}: {item.topic}
                      </p>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1">
                      {item.skills.map((sk) => (
                        <Badge key={sk} skill={sk}>{sk}</Badge>
                      ))}
                      {item.sourceTemplateName && (
                        <Badge tone="neutral">
                          <Library size={11} /> Từ kho: {item.sourceTemplateName}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 opacity-40 transition group-hover:opacity-100">
                    <button
                      onClick={(e) => { e.stopPropagation(); startEdit(item); }}
                      title="Chỉnh sửa"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }}
                      title="Xóa"
                      className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950 dark:hover:text-rose-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 p-3 dark:border-slate-800">
              <button
                onClick={() => startAddItem(g.phase)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium accent-text hover:accent-bg-light dark:accent-text-dark dark:hover:accent-bg-dark"
              >
                <Plus size={14} /> Thêm buổi học
              </button>
            </div>
          </Card>
        ))}

        <button
          onClick={startAddPhase}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-500 accent-border-light-hover hover:accent-text dark:border-slate-700 dark:text-slate-400 dark:hover:accent-text-dark"
        >
          <Plus size={16} /> Thêm giai đoạn mới
        </button>
      </div>

      {/* Session detail side panel */}
      {selectedSession && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 [animation:fade-in_0.2s_ease-out] dark:bg-black/60"
            onClick={() => (editingItemId === selectedSession.id ? cancelEdit() : setSelectedSessionId(null))}
          />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl [animation:slide-in-right_0.25s_ease-out] dark:border-slate-800 dark:bg-slate-900">
            <div className="shrink-0 border-b border-slate-200 px-6 py-5 dark:border-slate-800">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div
                    className={clsx(
                      "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-bold tabular-nums",
                      sessionStatusMeta[selectedSession.status].iconTone
                    )}
                  >
                    {selectedSession.session}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h2 className="truncate text-base font-semibold text-slate-900 dark:text-slate-50">
                        {editingItemId === selectedSession.id
                          ? "Chỉnh sửa buổi học"
                          : `Buổi ${selectedSession.session}: ${selectedSession.topic}`}
                      </h2>
                      {editingItemId !== selectedSession.id && (
                        <span className={clsx("inline-flex shrink-0 items-center gap-1 text-xs font-medium", sessionStatusMeta[selectedSession.status].dotTone)}>
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {sessionStatusMeta[selectedSession.status].label}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                      {selectedSession.phase}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => (editingItemId === selectedSession.id ? cancelEdit() : setSelectedSessionId(null))}
                  title="Đóng"
                  className="shrink-0 rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                  <X size={18} />
                </button>
              </div>

              {editingItemId !== selectedSession.id && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button size="sm" onClick={() => startEdit(selectedSession)}>
                    <Pencil size={14} /> Chỉnh sửa
                  </Button>
                  {selectedSession.status !== "done" && (
                    <Button variant="secondary" size="sm" onClick={() => setSessionStatus(selectedSession.id, "done")}>
                      <Check size={14} /> Đánh dấu hoàn thành
                    </Button>
                  )}
                  <button
                    onClick={() => deleteItem(selectedSession.id)}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950"
                  >
                    <Trash2 size={14} /> Xóa buổi học
                  </button>
                </div>
              )}
            </div>

            {editingItemId === selectedSession.id ? (
              <div className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Giai đoạn</label>
                    <input
                      value={editForm.phase}
                      onChange={(e) => setEditForm((f) => ({ ...f, phase: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Ngày học</label>
                    <input
                      value={editForm.date}
                      onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))}
                      placeholder="VD: 2026-03-11"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Nội dung buổi học</label>
                    <input
                      value={editForm.topic}
                      onChange={(e) => setEditForm((f) => ({ ...f, topic: e.target.value }))}
                      placeholder="VD: Task 2: Bài luận quan điểm"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Kỹ năng</label>
                    <div className="flex flex-wrap gap-2">
                      {skillList.map((sk) => (
                        <button
                          type="button"
                          key={sk}
                          onClick={() => toggleEditSkill(sk)}
                          className={clsx(
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                            editForm.skillsSet.has(sk)
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-200 text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:text-slate-300"
                          )}
                        >
                          {sk}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Trạng thái</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                    >
                      {statusOptions.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Bài tập gắn với buổi học</label>
                    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1.5 dark:border-slate-800">
                      {exercisesList.length === 0 && (
                        <p className="p-1.5 text-xs text-slate-400">Chưa có bài tập nào cho học sinh này.</p>
                      )}
                      {exercisesList.map((ex) => (
                        <label
                          key={ex.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={editForm.exerciseIdsSet.has(ex.id)}
                            onChange={() => toggleEditExercise(ex.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-400 dark:border-slate-600"
                          />
                          <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">
                            {ex.title || "(Chưa đặt tên)"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">Tài liệu & video gắn với buổi học</label>
                    <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border border-slate-200 p-1.5 dark:border-slate-800">
                      {materialsList.length === 0 && (
                        <p className="p-1.5 text-xs text-slate-400">Chưa có tài liệu / video nào cho học sinh này.</p>
                      )}
                      {materialsList.map((m) => (
                        <label
                          key={m.id}
                          className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <input
                            type="checkbox"
                            checked={editForm.materialIdsSet.has(m.id)}
                            onChange={() => toggleEditMaterial(m.id)}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-400 dark:border-slate-600"
                          />
                          <span className="min-w-0 flex-1 truncate text-slate-700 dark:text-slate-200">
                            {m.title || "(Chưa đặt tên)"}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 justify-end gap-2 border-t border-slate-200 px-6 py-4 dark:border-slate-800">
                  <Button variant="secondary" size="sm" onClick={cancelEdit} type="button">
                    <X size={14} /> Hủy
                  </Button>
                  <Button size="sm" onClick={saveEdit} type="button">
                    <Check size={14} /> Lưu
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex shrink-0 gap-5 border-b border-slate-200 px-6 dark:border-slate-800">
                  {DETAIL_TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setDetailTab(t.key)}
                      className={clsx(
                        "border-b-2 py-2.5 text-sm font-medium transition",
                        detailTab === t.key
                          ? "accent-border accent-text dark:accent-text-dark"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto p-6">
                  {detailTab === "overview" && (
                    <div className="space-y-6">
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Tổng quan nhanh</p>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                              {(exercisesBySession[selectedSession.id] || []).length}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Bài tập</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                              {(materialsBySession[selectedSession.id] || []).length}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Tài liệu</p>
                          </div>
                          <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                            <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                              {selectedSession.skills.length}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Kỹ năng</p>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Kỹ năng</p>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedSession.skills.map((sk) => (
                            <Badge key={sk} skill={sk}>{sk}</Badge>
                          ))}
                          {selectedSession.skills.length === 0 && (
                            <p className="text-xs text-slate-400">Chưa gắn kỹ năng nào.</p>
                          )}
                        </div>
                      </div>
                      {selectedSession.sourceTemplateName && (
                        <div>
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Nguồn</p>
                          <Badge tone="neutral">
                            <Library size={11} /> Từ kho: {selectedSession.sourceTemplateName}
                          </Badge>
                        </div>
                      )}
                    </div>
                  )}

                  {detailTab === "exercises" && (
                    (exercisesBySession[selectedSession.id] || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {exercisesBySession[selectedSession.id].map((ex) => (
                          <li key={ex.id}>
                            <Link
                              to={classId ? `/tutor/classes/${classId}/exercises/${ex.id}` : `/tutor/classes`}
                              state={{ exercise: ex, studentName: student?.name, sessionLabel: sessionLabel(ex.sessionId) }}
                              className="flex items-start gap-2 rounded-lg p-2.5 text-sm text-slate-600 hover:bg-slate-100 hover:accent-text dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:accent-text-dark"
                            >
                              <FileText size={15} className="mt-0.5 shrink-0" />
                              <span className="min-w-0">
                                {ex.title}
                                <span className="block text-xs text-slate-400">{ex.skill} &middot; {ex.difficulty}</span>
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">Chưa có bài tập nào gắn với buổi học này.</p>
                    )
                  )}

                  {detailTab === "materials" && (
                    (materialsBySession[selectedSession.id] || []).length > 0 ? (
                      <ul className="space-y-1.5">
                        {materialsBySession[selectedSession.id].map((m) => (
                          <li key={m.id}>
                            <div className="flex items-start gap-2 rounded-lg p-2.5 text-sm text-slate-600 dark:text-slate-300">
                              {m.type === "video" ? (
                                <PlayCircleIcon size={15} className="mt-0.5 shrink-0" />
                              ) : (
                                <FileText size={15} className="mt-0.5 shrink-0" />
                              )}
                              <span className="min-w-0">
                                {m.title}
                                {m.duration && <span className="block text-xs text-slate-400">{m.duration}</span>}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-slate-400">Chưa có tài liệu / video nào gắn với buổi học này.</p>
                    )
                  )}
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {/* ===== Save-as-Template Modal ===== */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-slate-900/50 dark:bg-black/60" onClick={() => setShowSaveModal(false)} />
          <Card className="relative z-10 mx-4 w-full max-w-lg">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Lưu lộ trình thành mẫu</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Lộ trình hiện tại của <strong>{student?.name}</strong> ({pathItems.length} buổi học) sẽ được lưu vào Kho lộ trình dưới dạng một mẫu mới. Các thay đổi sau này với lộ trình của học sinh sẽ không ảnh hưởng tới mẫu này.
              </p>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tên mẫu lộ trình <span className="text-rose-500">*</span>
                </label>
                <input
                  value={saveForm.name}
                  onChange={(e) => setSaveForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder={`VD: Lộ trình tùy chỉnh cho ${student?.name}`}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                  autoFocus
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Trình độ</label>
                  <select
                    value={saveForm.level}
                    onChange={(e) => setSaveForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                  >
                    <option value="A2">A2</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">Mục tiêu</label>
                  <input
                    value={saveForm.goal}
                    onChange={(e) => setSaveForm((f) => ({ ...f, goal: e.target.value }))}
                    placeholder="VD: Cải thiện kỹ năng giao tiếp"
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:focus:ring-blue-950"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800">
                <p className="mb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  Tóm tắt nội dung ({pathItems.length} buổi học)
                </p>
                <div className="max-h-28 space-y-1 overflow-y-auto">
                  {pathItems.map((it, i) => (
                    <div key={it.id} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <span className="shrink-0 font-medium text-slate-400">B{i + 1}:</span>
                      <span className="min-w-0 truncate">{it.topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button variant="secondary" size="sm" onClick={() => setShowSaveModal(false)} type="button">
                Hủy
              </Button>
              <Button size="sm" onClick={handleSaveAsTemplate} disabled={!saveForm.name.trim()} type="button">
                <Save size={14} /> Lưu vào Kho lộ trình
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}