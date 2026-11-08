import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import clsx from "clsx";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Video } from "lucide-react";
import { apiGetMySchedule } from "../../lib/studentApi";
import {
  SESSION_STATUS_META,
  TEACHING_MODE_LABELS,
  formatSessionDate,
  formatSessionTime,
  todayISO,
} from "../../lib/classroomApi";
import { addDays, buildWeekDays, weekRangeLabel, weekStartOf } from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import StudentSessionDetail from "../../components/student/StudentSessionDetail";
import { ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const SURFACE = {
  blue: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",
  emerald: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
  amber: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20",
  rose: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  slate: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
};

function meta(item) {
  return SESSION_STATUS_META[item.status] ?? { label: item.status || "Chưa ghi nhận", tone: "slate" };
}

function surface(item) {
  return SURFACE[meta(item).tone] ?? SURFACE.slate;
}

function keyOf(item, index) {
  return item.sessionId ?? item.id ?? `${item.date}-${item.startTime}-${index}`;
}

export default function StudentClassSchedule() {
  const { classId, detail } = useOutletContext();
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayISO()));
  const [open, setOpen] = useState(null);
  const { data, loading, error, retry } = useStudentData(
    (token) => apiGetMySchedule(token, weekStart, classId),
    [weekStart, classId],
  );
  const items = useMemo(() => (Array.isArray(data) ? data : (data?.items ?? [])), [data]);
  const days = useMemo(() => buildWeekDays(weekStart, items), [weekStart, items]);
  const today = todayISO();
  const currentWeek = weekStartOf(today);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{detail.className}</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {loading ? "Đang tải lịch..." : `${items.length} buổi học trong tuần được chọn.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-label="Chọn tuần">
          <Button variant="outline" size="sm" aria-label="Tuần trước" onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={16} />
          </Button>
          <span className="min-w-[11.5rem] text-center font-mono text-xs font-semibold text-slate-900 dark:text-white">{weekRangeLabel(weekStart)}</span>
          <Button variant="outline" size="sm" aria-label="Tuần sau" onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight size={16} />
          </Button>
          {weekStart !== currentWeek && <Button variant="ghost" size="sm" onClick={() => setWeekStart(currentWeek)}>Tuần này</Button>}
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={3} className="h-24" />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3" aria-label="Lịch học theo ngày">
            {days.map((day) => (
              <div key={day.date} className="min-w-0 space-y-2">
                <div className={clsx("rounded-xl border px-2 py-2 text-center", day.date === today ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30" : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900")}>
                  <p className={clsx("text-xs font-medium", day.date === today ? "text-blue-700 dark:text-blue-300" : "text-slate-500 dark:text-slate-400")}>{day.label}</p>
                  <p className="mt-0.5 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{day.date.slice(-2)}</p>
                </div>
                <div className="space-y-2">
                  {day.sessions.length ? day.sessions.map((item, index) => {
                    const status = meta(item);
                    const sessionId = item.sessionId ?? item.id;
                    const Body = sessionId ? "button" : "div";
                    return (
                      <Body key={keyOf(item, index)} type={sessionId ? "button" : undefined} onClick={sessionId ? () => setOpen(item) : undefined} className={clsx("block w-full rounded-xl border p-2.5 text-left", surface(item), sessionId && "cursor-pointer transition-all hover:border-blue-400 active:scale-[0.98] dark:hover:border-blue-700")}>
                        <p className="font-mono text-xs font-bold text-slate-900 dark:text-white">{formatSessionTime(item.startTime)}</p>
                        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{status.label}</p>
                      </Body>
                    );
                  }) : (
                    <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-center dark:border-slate-800">
                      <p className="text-xs text-slate-400 dark:text-slate-500">Không có lịch</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <section>
            <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Buổi học trong tuần</h2>
            {items.length ? (
              <div className="space-y-2.5">
                {items.map((item, index) => {
                  const status = meta(item);
                  const sessionId = item.sessionId ?? item.id;
                  return (
                    <article key={keyOf(item, index)} className={clsx("rounded-xl border p-4", surface(item))}>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title || detail.className}</p>
                            <Badge tone={status.tone}>{status.label}</Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                            <span className="inline-flex items-center gap-1.5 font-mono"><Clock3 size={13} />{formatSessionDate(item.date)} · {formatSessionTime(item.startTime)}–{formatSessionTime(item.endTime)}</span>
                            {item.teachingMode && <span className="inline-flex items-center gap-1.5">{item.teachingMode === "ONLINE" ? <Video size={13} /> : <MapPin size={13} />}{TEACHING_MODE_LABELS[item.teachingMode]}</span>}
                          </div>
                          {item.note && <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">{item.note}</p>}
                        </div>
                        {sessionId && <Button variant="outline" size="sm" onClick={() => setOpen(item)}>Xem chi tiết</Button>}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <Card className="py-10 text-center">
                <CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tuần này chưa có buổi học</p>
              </Card>
            )}
          </section>
        </>
      )}

      {open && <StudentSessionDetail sessionId={open.sessionId ?? open.id} sessionStatus={open.status} sessionItem={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
