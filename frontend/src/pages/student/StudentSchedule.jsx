import { useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, History, MapPin, Video } from "lucide-react";
import { apiGetMySchedule, apiGetMySessions } from "../../lib/studentApi";
import {
  SESSION_STATUS_META,
  TEACHING_MODE_LABELS,
  formatSessionDate,
  formatSessionTime,
  todayISO,
} from "../../lib/classroomApi";
import {
  addDays,
  buildWeekDays,
  sortSessionsDesc,
  weekRangeLabel,
  weekStartOf,
} from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import StudentSessionDetail from "../../components/student/StudentSessionDetail";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const TABS = [
  { id: "week", label: "Lịch tuần", icon: CalendarDays },
  { id: "history", label: "Lịch sử buổi học", icon: History },
];

function SessionChip({ item, onOpen }) {
  const meta = SESSION_STATUS_META[item.status] ?? { label: item.status ?? "", tone: "slate" };
  const sessionId = item.sessionId ?? item.id;
  const Body = sessionId ? "button" : "div";
  return (
    <Body
      type={sessionId ? "button" : undefined}
      onClick={sessionId ? () => onOpen(sessionId) : undefined}
      className={`w-full rounded-xl border border-slate-200 bg-white p-2.5 text-left dark:border-slate-800 dark:bg-slate-900 ${
        sessionId ? "cursor-pointer transition-colors hover:border-blue-300 dark:hover:border-blue-800" : ""
      }`}
    >
      <p className="font-mono text-xs font-semibold text-slate-900 dark:text-white">
        {formatSessionTime(item.startTime)} – {formatSessionTime(item.endTime)}
      </p>
      <p className="mt-0.5 truncate text-xs text-slate-600 dark:text-slate-300">
        {item.title || item.className || "Buổi học"}
      </p>
      {item.tutorName && (
        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{item.tutorName}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
        {item.status && (
          <Badge tone={meta.tone} size="xs">
            {meta.label}
          </Badge>
        )}
        {item.teachingMode && (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
            {item.teachingMode === "ONLINE" ? <Video size={11} /> : <MapPin size={11} />}
            {TEACHING_MODE_LABELS[item.teachingMode]}
          </span>
        )}
      </div>
    </Body>
  );
}

function WeekView({ onOpen }) {
  const [weekStart, setWeekStart] = useState(() => weekStartOf(todayISO()));
  const { data, loading, error, retry } = useStudentData(
    (token) => apiGetMySchedule(token, weekStart),
    [weekStart],
  );
  const items = useMemo(
    () => (Array.isArray(data) ? data : (data?.items ?? data?.occurrences ?? [])),
    [data],
  );
  const days = useMemo(() => buildWeekDays(weekStart, items), [weekStart, items]);
  const today = todayISO();
  const isCurrentWeek = weekStart === weekStartOf(today);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần trước"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <p className="min-w-[10rem] text-center font-mono text-sm font-semibold text-slate-900 dark:text-white">
            {weekRangeLabel(weekStart)}
          </p>
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần sau"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
        {!isCurrentWeek && (
          <Button variant="ghost" size="sm" onClick={() => setWeekStart(weekStartOf(today))}>
            Về tuần này
          </Button>
        )}
      </div>

      {loading ? (
        <SkeletonRows rows={4} className="h-16" />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-7">
          {days.map((day) => (
            <div
              key={day.date}
              className={`min-w-0 rounded-2xl border p-2.5 ${
                day.date === today
                  ? "border-blue-300 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <p className="mb-2 flex items-baseline justify-between text-xs">
                <span className="font-semibold text-slate-900 dark:text-white">{day.label}</span>
                <span className="font-mono text-slate-500 dark:text-slate-400">
                  {formatSessionDate(day.date).slice(0, 5)}
                </span>
              </p>
              <div className="space-y-2">
                {day.sessions.length === 0 ? (
                  <p className="py-2 text-center text-[11px] text-slate-400 dark:text-slate-500">
                    Không có buổi
                  </p>
                ) : (
                  day.sessions.map((item, index) => (
                    <SessionChip
                      key={item.sessionId ?? item.id ?? `${day.date}-${index}`}
                      item={item}
                      onOpen={onOpen}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryView({ onOpen }) {
  const { data, loading, error, retry } = useStudentData((token) => apiGetMySessions(token), []);
  const sessions = useMemo(
    () => sortSessionsDesc(Array.isArray(data) ? data : (data?.content ?? [])),
    [data],
  );

  if (loading) return <SkeletonRows rows={4} className="h-20" />;
  if (error) return <ErrorBox message={error} onRetry={retry} />;
  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Chưa có buổi học nào"
        description="Các buổi học sẽ hiển thị tại đây, mới nhất trước."
      />
    );
  }
  return (
    <div className="space-y-3">
      {sessions.map((item) => {
        const meta = SESSION_STATUS_META[item.status] ?? { label: item.status ?? "", tone: "slate" };
        return (
          <Card key={item.id} className="p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
            <button
              type="button"
              onClick={() => onOpen(item.id)}
              className="flex w-full cursor-pointer items-center justify-between gap-3 text-left"
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                  {item.sessionNumber != null && <Badge tone="slate">Buổi {item.sessionNumber}</Badge>}
                </div>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {item.title || "Buổi học"}
                </p>
                <p className="flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <Clock size={12} />
                  {formatSessionDate(item.sessionDate)} · {formatSessionTime(item.startTime)} –{" "}
                  {formatSessionTime(item.endTime)}
                </p>
                {item.tutorName && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Gia sư {item.tutorName}</p>
                )}
              </div>
              <ChevronRight size={18} className="shrink-0 text-slate-400" />
            </button>
          </Card>
        );
      })}
    </div>
  );
}

/** Lịch học: lưới tuần T2–CN và lịch sử buổi học (giảm dần), API_DESIGN 3.6. */
export default function StudentSchedule() {
  const [tab, setTab] = useState("week");
  const [openId, setOpenId] = useState(null);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Lịch học"
        title="Thời khoá biểu"
        description="Xem lịch tuần, trạng thái từng buổi và nhật ký sau mỗi buổi học."
      />
      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              tab === id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-800"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      {tab === "week" ? <WeekView onOpen={setOpenId} /> : <HistoryView onOpen={setOpenId} />}
      {openId && <StudentSessionDetail sessionId={openId} onClose={() => setOpenId(null)} />}
    </div>
  );
}
