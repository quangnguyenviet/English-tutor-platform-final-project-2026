import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  NotebookPen,
  RefreshCw,
  UserRound,
  Video,
  XCircle,
} from "lucide-react";
import { useTutorWeekSchedule } from "../../hooks/useTutorWeekSchedule";
import {
  TEACHING_MODE_LABELS,
  formatSessionDate,
  todayISO,
} from "../../lib/classroomApi";
import { addDays, buildWeekDays, weekRangeLabel, weekStartOf } from "../../lib/studentModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const STATUS_META = {
  UPCOMING: { label: "Sắp dạy", tone: "blue", icon: Clock3 },
  IN_PROGRESS: { label: "Đang diễn ra", tone: "amber", icon: AlertCircle },
  COMPLETED: { label: "Đã có nhật ký", tone: "emerald", icon: CheckCircle2 },
  MISSING_LOG: { label: "Chờ nhật ký", tone: "amber", icon: NotebookPen },
  RESCHEDULED: { label: "Đã dời lịch", tone: "amber", icon: RefreshCw },
  CANCELLED: { label: "Đã hủy", tone: "rose", icon: XCircle },
};

const SURFACE = {
  blue: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",
  amber: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20",
  emerald: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
  rose: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
};

function statusMeta(item) {
  return STATUS_META[item.status] ?? STATUS_META.UPCOMING;
}

function detailUrl(item, weekStart) {
  const params = new URLSearchParams({
    weekStart,
    classId: String(item.classId),
    occurrence: item.occurrenceKey,
  });
  return `/tutor/lessons?${params.toString()}`;
}

function SessionCard({ item, weekStart }) {
  const meta = statusMeta(item);
  const StatusIcon = meta.icon;
  const mode = item.teachingMode || item.classTeachingMode;
  return (
    <Card className={clsx("p-4", SURFACE[meta.tone])}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.className}</p>
            {item.trial && <Badge tone="violet">Dạy thử</Badge>}
            <Badge tone={meta.tone}><StatusIcon size={13} />{meta.label}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <UserRound size={13} />{item.studentName}
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono">{formatSessionDate(item.date)} · {item.startTime}–{item.endTime}</span>
            {mode && (
              <span className="inline-flex items-center gap-1.5">
                {mode === "ONLINE" ? <Video size={13} /> : <MapPin size={13} />}
                {TEACHING_MODE_LABELS[mode] || mode}
              </span>
            )}
          </div>
          {item.originalDate && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              Dời từ ngày {formatSessionDate(item.originalDate)}.
            </p>
          )}
        </div>
        <Button as={Link} to={detailUrl(item, weekStart)} variant="outline" size="sm">
          Xem chi tiết <ChevronRight size={15} />
        </Button>
      </div>
    </Card>
  );
}

export default function TutorSchedule() {
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayISO()));
  const { occurrences, loading, error, partialError, reload } = useTutorWeekSchedule(weekStart);
  const days = useMemo(() => buildWeekDays(weekStart, occurrences), [weekStart, occurrences]);
  const currentWeek = weekStartOf(todayISO());

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Dữ liệu lịch lớp thực tế</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Đang tải lịch..." : `${occurrences.length} ca dạy trong tuần được chọn.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-label="Chọn tuần">
          <Button variant="outline" size="sm" aria-label="Tuần trước" onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft size={16} /></Button>
          <span className="min-w-[11.5rem] text-center font-mono text-xs font-semibold text-slate-900 dark:text-white">{weekRangeLabel(weekStart)}</span>
          <Button variant="outline" size="sm" aria-label="Tuần sau" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight size={16} /></Button>
          {weekStart !== currentWeek && <Button variant="ghost" size="sm" onClick={() => setWeekStart(currentWeek)}>Tuần này</Button>}
        </div>
      </div>

      {partialError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">{partialError}</div>
      )}

      {loading ? (
        <SkeletonRows rows={3} className="h-24" />
      ) : error ? (
        <ErrorBox message={error} onRetry={reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3" aria-label="Lịch dạy theo ngày">
            {days.map((day) => (
              <div key={day.date} className="min-w-0 space-y-2">
                <div className={clsx("rounded-xl border px-2 py-2 text-center", day.date === todayISO() ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900")}>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.label}</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{day.date.slice(-2)}</p>
                </div>
                <div className="space-y-2">
                  {day.sessions.length ? day.sessions.map((item) => {
                    const meta = statusMeta(item);
                    return (
                      <Link key={`${item.classId}-${item.occurrenceKey}`} to={detailUrl(item, weekStart)} className={clsx("block rounded-xl border p-2.5 text-left transition-all hover:border-blue-400 active:scale-[0.98] dark:hover:border-blue-700", SURFACE[meta.tone])}>
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{item.studentName}</p>
                        <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">{item.startTime}</p>
                        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{meta.label}</p>
                      </Link>
                    );
                  }) : (
                    <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-center dark:border-slate-800"><p className="text-xs text-slate-400 dark:text-slate-500">Không có lịch</p></div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <section aria-label="Buổi dạy trong tuần">
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Buổi dạy trong tuần</h2>
            {occurrences.length ? (
              <div className="space-y-2.5">{occurrences.map((item) => <SessionCard key={`${item.classId}-${item.occurrenceKey}`} item={item} weekStart={weekStart} />)}</div>
            ) : (
              <Card className="py-10 text-center">
                <CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tuần này chưa có buổi dạy</p>
              </Card>
            )}
          </section>
        </>
      )}
    </div>
  );
}
