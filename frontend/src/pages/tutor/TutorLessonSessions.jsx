import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  MapPin,
  NotebookPen,
  RefreshCw,
  Save,
  Trash2,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { useTutorWeekSchedule } from "../../hooks/useTutorWeekSchedule";
import {
  TEACHING_MODE_LABELS,
  apiDeleteTeachingLog,
  apiGetTeachingLog,
  apiSaveTeachingLog,
  formatSessionDate,
  todayISO,
} from "../../lib/classroomApi";
import { addDays, weekRangeLabel, weekStartOf } from "../../lib/studentModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const STATUS_META = {
  UPCOMING: { label: "Sắp dạy", tone: "blue", icon: Clock3 },
  IN_PROGRESS: { label: "Đang diễn ra", tone: "amber", icon: AlertCircle },
  COMPLETED: { label: "Đã có nhật ký", tone: "emerald", icon: CheckCircle2 },
  MISSING_LOG: { label: "Chờ nhật ký", tone: "amber", icon: NotebookPen },
  RESCHEDULED: { label: "Đã dời lịch", tone: "amber", icon: RefreshCw },
  CANCELLED: { label: "Đã hủy", tone: "rose", icon: XCircle },
};

const FILTERS = [
  { value: "all", label: "Tất cả" },
  { value: "attention", label: "Cần ghi nhật ký" },
  { value: "completed", label: "Đã ghi nhận" },
  { value: "exception", label: "Ngoại lệ" },
];

const INPUT_CLASS = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500";

function validWeekStart(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value || "") ? weekStartOf(value) : weekStartOf(todayISO());
}

function itemKey(item) {
  return `${item.classId}:${item.occurrenceKey}`;
}

function statusMeta(item) {
  return STATUS_META[item?.status] ?? STATUS_META.UPCOMING;
}

function matchesFilter(item, filter) {
  if (filter === "attention") return item.status === "MISSING_LOG" || item.status === "IN_PROGRESS";
  if (filter === "completed") return item.status === "COMPLETED";
  if (filter === "exception") return item.status === "CANCELLED" || item.status === "RESCHEDULED";
  return true;
}

function SessionRow({ item, selected, onSelect }) {
  const meta = statusMeta(item);
  const StatusIcon = meta.icon;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={clsx(
        "w-full cursor-pointer rounded-xl border p-3.5 text-left transition-all",
        selected
          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10 dark:border-blue-700 dark:bg-blue-950/30"
          : "border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"><CalendarDays size={17} /></span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.studentName}</p>
            <Badge tone={meta.tone} size="xs"><StatusIcon size={12} />{meta.label}</Badge>
          </div>
          <p className="mt-1 truncate text-xs text-slate-600 dark:text-slate-300">{item.className}</p>
          <p className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">{formatSessionDate(item.date)} · {item.startTime}–{item.endTime}</p>
        </div>
      </div>
    </button>
  );
}

export default function TutorLessonSessions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [weekStart, setWeekStart] = useState(() => validWeekStart(searchParams.get("weekStart")));
  const [filter, setFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState("");
  const [log, setLog] = useState(null);
  const [form, setForm] = useState({ knowledge: "", homework: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const { token, occurrences, loading, error, partialError, reload } = useTutorWeekSchedule(weekStart);

  const visible = useMemo(
    () => occurrences.filter((item) => matchesFilter(item, filter)),
    [occurrences, filter],
  );
  const requested = useMemo(() => {
    const classId = searchParams.get("classId");
    const occurrenceKey = searchParams.get("occurrence");
    return occurrences.find((item) => String(item.classId) === classId && item.occurrenceKey === occurrenceKey);
  }, [occurrences, searchParams]);
  const selected = occurrences.find((item) => itemKey(item) === selectedKey) || requested || visible[0] || null;
  const writable = selected && selected.status !== "CANCELLED";

  useEffect(() => {
    let cancelled = false;
    setLog(null);
    setForm({ knowledge: "", homework: "" });
    if (!token || !selected || !writable) return undefined;
    setLogLoading(true);
    apiGetTeachingLog(token, selected.classId, selected.date, selected.startTime)
      .then((result) => {
        if (cancelled) return;
        setLog(result || null);
        setForm({ knowledge: result?.knowledge || "", homework: result?.homework || "" });
      })
      .catch((loadError) => {
        if (!cancelled) setFeedback({ error: true, text: loadError.message || "Không thể tải nhật ký buổi học." });
      })
      .finally(() => !cancelled && setLogLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, selected, writable]);

  function selectItem(item) {
    setSelectedKey(itemKey(item));
    setFeedback(null);
    setSearchParams({
      weekStart,
      classId: String(item.classId),
      occurrence: item.occurrenceKey,
    });
  }

  function shiftWeek(days) {
    const next = addDays(weekStart, days);
    setWeekStart(next);
    setSelectedKey("");
    setSearchParams({ weekStart: next });
  }

  async function saveLog(event) {
    event.preventDefault();
    if (!selected || !writable || saving) return;
    const knowledge = form.knowledge.trim();
    const homework = form.homework.trim();
    if (!knowledge && !homework) {
      setFeedback({ error: true, text: "Vui lòng nhập kiến thức đã học hoặc bài tập về nhà." });
      return;
    }
    setSaving(true);
    setFeedback(null);
    try {
      const result = await apiSaveTeachingLog(token, selected.classId, {
        logDate: selected.date,
        startTime: selected.startTime,
        endTime: selected.endTime,
        knowledge: knowledge || null,
        homework: homework || null,
      });
      setLog(result);
      setForm({ knowledge: result.knowledge || "", homework: result.homework || "" });
      setFeedback({ error: false, text: result.firstPublish ? "Đã lưu và thông báo cho học sinh." : "Đã cập nhật nhật ký buổi học." });
      await reload();
    } catch (saveError) {
      setFeedback({ error: true, text: saveError.message || "Không thể lưu nhật ký buổi học." });
    } finally {
      setSaving(false);
    }
  }

  async function deleteLog() {
    if (!selected || !log?.logId || deleting) return;
    setDeleting(true);
    setFeedback(null);
    try {
      await apiDeleteTeachingLog(token, selected.classId, log.logId);
      setLog(null);
      setForm({ knowledge: "", homework: "" });
      setFeedback({ error: false, text: "Đã xóa nhật ký buổi học." });
      await reload();
    } catch (deleteError) {
      setFeedback({ error: true, text: deleteError.message || "Không thể xóa nhật ký buổi học." });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader eyebrow="Quản lý học tập" title="Chi tiết buổi dạy" description="Dữ liệu được tổng hợp trực tiếp từ lịch lớp và nhật ký dạy học." />
        <div className="flex items-center gap-2 pb-1" aria-label="Chọn tuần">
          <Button variant="outline" size="sm" aria-label="Tuần trước" onClick={() => shiftWeek(-7)}><ChevronLeft size={16} /></Button>
          <span className="min-w-[11rem] text-center font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{weekRangeLabel(weekStart)}</span>
          <Button variant="outline" size="sm" aria-label="Tuần sau" onClick={() => shiftWeek(7)}><ChevronRight size={16} /></Button>
        </div>
      </div>

      {partialError && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">{partialError}</div>}

      {loading ? <SkeletonRows rows={4} /> : error ? <ErrorBox message={error} onRetry={reload} /> : (
        <div className="grid items-start gap-6 lg:grid-cols-5">
          <section className="min-w-0 space-y-4 lg:col-span-2" aria-label="Danh sách buổi dạy">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc buổi dạy">
              {FILTERS.map((item) => (
                <button key={item.value} type="button" onClick={() => setFilter(item.value)} aria-pressed={filter === item.value} className={clsx("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", filter === item.value ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700")}>{item.label}</button>
              ))}
            </div>
            {visible.length ? <div className="space-y-2.5">{visible.map((item) => <SessionRow key={itemKey(item)} item={item} selected={itemKey(item) === itemKey(selected)} onSelect={() => selectItem(item)} />)}</div> : (
              <Card className="py-10 text-center"><BookOpen size={29} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Không có buổi dạy trong mục này</p></Card>
            )}
          </section>

          <section className="min-w-0 lg:col-span-3" aria-label="Chi tiết buổi dạy">
            {!selected ? (
              <Card className="py-12 text-center"><CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" /><p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tuần này chưa có buổi dạy</p></Card>
            ) : (
              <div className="space-y-4">
                <Card>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Chi tiết buổi dạy</p>
                      <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selected.className}</h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Học sinh {selected.studentName}</p>
                    </div>
                    <Badge tone={statusMeta(selected).tone}>{statusMeta(selected).label}</Badge>
                  </div>
                  <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-2 dark:border-slate-800 dark:text-slate-300">
                    <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-blue-600 dark:text-blue-400" />{formatSessionDate(selected.date)}</span>
                    <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-blue-600 dark:text-blue-400" />{selected.startTime}–{selected.endTime}</span>
                    <span className="inline-flex items-center gap-2"><UserRound size={15} className="text-blue-600 dark:text-blue-400" />{selected.studentName}</span>
                    <span className="inline-flex items-center gap-2">{(selected.teachingMode || selected.classTeachingMode) === "ONLINE" ? <Video size={15} /> : <MapPin size={15} />}{TEACHING_MODE_LABELS[selected.teachingMode || selected.classTeachingMode] || "Chưa cập nhật"}</span>
                  </div>
                  {selected.originalDate && <p className="mt-3 text-xs text-amber-700 dark:text-amber-400">Ca này được dời từ ngày {formatSessionDate(selected.originalDate)}.</p>}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {selected.meetingUrl && <Button as="a" href={selected.meetingUrl} target="_blank" rel="noopener noreferrer" size="sm"><Video size={14} />Mở phòng học <ExternalLink size={12} /></Button>}
                    <Button as={Link} to={`/tutor/classes/${selected.classId}/schedule`} variant="outline" size="sm">Mở lịch của lớp</Button>
                    <Button as={Link} to={`/tutor/classes/${selected.classId}/lessons`} variant="outline" size="sm">Bài giảng của lớp</Button>
                  </div>
                </Card>

                {feedback && <div role={feedback.error ? "alert" : "status"} className={clsx("flex items-start gap-2 rounded-xl border px-4 py-3 text-sm", feedback.error ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300" : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300")}>
                  {feedback.error ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}{feedback.text}
                </div>}

                {selected.status === "CANCELLED" ? (
                  <Card className="border-rose-200 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/20"><div className="flex items-start gap-3"><XCircle size={19} className="mt-0.5 text-rose-500" /><div><h3 className="text-sm font-semibold text-rose-800 dark:text-rose-300">Buổi học đã bị hủy</h3><p className="mt-1 text-xs text-rose-700 dark:text-rose-400">Không thể ghi nhật ký cho ca không diễn ra.</p></div></div></Card>
                ) : (
                  <Card>
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><NotebookPen size={18} /></span><div><h3 className="text-sm font-bold text-slate-900 dark:text-white">Nhật ký buổi học</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Nội dung này được lưu trên hệ thống và hiển thị cho học sinh.</p></div></div>
                      {log?.updatedAt && <Badge tone="slate">Đã lưu</Badge>}
                    </div>
                    {logLoading ? <SkeletonRows rows={2} /> : (
                      <form onSubmit={saveLog} className="space-y-4">
                        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Kiến thức đã học</span><textarea value={form.knowledge} onChange={(event) => setForm((previous) => ({ ...previous, knowledge: event.target.value }))} rows={4} placeholder="Nhập nội dung chính của buổi học..." className={clsx(INPUT_CLASS, "resize-y")} /></label>
                        <label className="block"><span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Bài tập về nhà / dặn dò</span><textarea value={form.homework} onChange={(event) => setForm((previous) => ({ ...previous, homework: event.target.value }))} rows={3} placeholder="Nhập bài tập hoặc phần cần chuẩn bị..." className={clsx(INPUT_CLASS, "resize-y")} /></label>
                        <div className="flex flex-wrap gap-2"><Button type="submit" disabled={saving}>{saving ? "Đang lưu..." : <><Save size={15} />Lưu nhật ký</>}</Button>{log?.logId && <Button type="button" variant="outline" disabled={deleting} onClick={deleteLog} className="text-rose-600 dark:text-rose-400"><Trash2 size={15} />{deleting ? "Đang xóa..." : "Xóa nhật ký"}</Button>}</div>
                      </form>
                    )}
                  </Card>
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
