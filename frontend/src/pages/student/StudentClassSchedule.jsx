import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import clsx from "clsx";
import { CheckCircle2, ChevronLeft, ChevronRight, Clock3 } from "lucide-react";
import { apiGetMySchedule } from "../../lib/studentApi";
import { formatSessionDate, formatSessionTime, todayISO } from "../../lib/classroomApi";
import { addDays, buildWeekDays, isStudentSessionLearned, weekStartOf } from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import Card from "../../components/ui/Card";
import StudentSessionDetail from "../../components/student/StudentSessionDetail";
import { ErrorBox } from "../../components/student/AsyncBlock";

/** Cùng bảng màu chip của lịch gia sư; buổi đã học (COMPLETED) dùng emerald. */
const TONE_SURFACE = {
  emerald: "border-emerald-300 border-l-emerald-600 bg-emerald-100 text-emerald-900 dark:border-emerald-800 dark:border-l-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-100",
  amber: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  rose: "border-l-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
  slate: "border-l-slate-400 bg-slate-50 text-slate-800 dark:bg-slate-800/40 dark:text-slate-200",
};

function toneFor(item) {
  if (isStudentSessionLearned(item)) return "emerald";
  if (["CANCELLED", "ABSENT", "STUDENT_ABSENT", "TUTOR_ABSENT"].includes(item.status)) return "rose";
  if (["IN_PROGRESS", "STARTED", "RESCHEDULED", "ADJUSTED"].includes(item.status)) return "amber";
  return "slate";
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
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {detail.className}
        </p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Theo dõi lịch học và các buổi đã hoàn thành của lớp.
        </p>
      </div>

      <Card className="border-slate-200/80 dark:border-slate-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Clock3 size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch dạy tuần</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              aria-label="Tuần trước"
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronLeft size={14} />
            </button>
            <p className="min-w-[120px] text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {formatSessionDate(days[0].date)} - {formatSessionDate(days[6].date)}
            </p>
            <button
              type="button"
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              aria-label="Tuần sau"
              className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <ChevronRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(currentWeek)}
              className={clsx(
                "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors active:scale-[0.98]",
                weekStart === currentWeek
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
              )}
            >
              Hôm nay
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {Array.from({ length: 7 }, (_, index) => (
              <div key={index} className="h-[110px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
            ))}
          </div>
        ) : error ? (
          <ErrorBox message={error} onRetry={retry} />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3">
            {days.map((day) => {
              const dayHasLearnedSession = day.sessions.some((item) => isStudentSessionLearned(item));
              return (
                <div
                  key={day.date}
                  className={clsx(
                    "flex flex-col rounded-xl border p-2",
                    dayHasLearnedSession
                      ? "border-emerald-300 bg-emerald-50/90 dark:border-emerald-800 dark:bg-emerald-950/35"
                      : day.date === today
                        ? "border-blue-300 bg-blue-50/50 dark:border-blue-800/60 dark:bg-blue-950/20"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
                  )}
                >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={clsx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                      dayHasLearnedSession
                        ? "bg-emerald-600 text-white"
                        : day.date === today
                          ? "bg-blue-600 text-white"
                          : "text-slate-800 dark:text-slate-200",
                    )}
                  >
                    {day.date.slice(-2)}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-[11px] font-medium leading-tight",
                        dayHasLearnedSession
                          ? "text-emerald-700 dark:text-emerald-300"
                          : day.date === today
                            ? "text-blue-700 dark:text-blue-300"
                            : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {day.label}
                    </p>
                    <p
                      className={clsx(
                        "font-mono text-[10px]",
                        dayHasLearnedSession
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-400 dark:text-slate-500",
                      )}
                    >
                      {formatSessionDate(day.date).slice(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 space-y-1.5">
                  {day.sessions.length ? (
                    day.sessions.map((item, index) => {
                      const sessionId = item.sessionId ?? item.id;
                      const learned = isStudentSessionLearned(item);
                      const Body = sessionId ? "button" : "div";
                      return (
                        <Body
                          key={keyOf(item, index)}
                          type={sessionId ? "button" : undefined}
                          onClick={sessionId ? () => setOpen(item) : undefined}
                          className={clsx(
                            "block w-full rounded-lg border border-l-4 px-2 py-1.5 text-left transition-all active:scale-[0.99]",
                            TONE_SURFACE[toneFor(item)],
                            sessionId && "cursor-pointer",
                          )}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <p className="font-mono text-[11px] font-semibold">
                              {formatSessionTime(item.startTime)} - {formatSessionTime(item.endTime)}
                            </p>
                          </div>
                          {learned && (
                            <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 size={11} /> Đã học
                            </span>
                          )}
                        </Body>
                      );
                    })
                  ) : (
                    <p className="px-1 text-[11px] text-slate-400 dark:text-slate-600">Không có ca dạy</p>
                  )}
                </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {open && (
        <StudentSessionDetail
          sessionId={open.sessionId ?? open.id}
          sessionStatus={open.status}
          sessionItem={open}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
