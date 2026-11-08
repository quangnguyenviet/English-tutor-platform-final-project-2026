import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  GraduationCap,
  History,
  MapPin,
  Video,
} from "lucide-react";
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
  isStudentSessionLearned,
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

const STATUS_SURFACES = {
  blue: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",
  emerald:
    "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
  amber: "border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20",
  rose: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  slate: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
};

function sessionMeta(item) {
  if (isStudentSessionLearned(item)) return { label: "Đã học", tone: "emerald" };
  if (!item?.status) return { label: "Chưa ghi nhận", tone: "slate" };
  return SESSION_STATUS_META[item.status] ?? { label: item.status, tone: "slate" };
}

function sessionSurface(item) {
  return STATUS_SURFACES[sessionMeta(item).tone] ?? STATUS_SURFACES.slate;
}

function getInitials(name) {
  if (!name?.trim()) return "GV";
  return name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function sessionKey(item, fallback) {
  return item.sessionId ?? item.id ?? `${item.date ?? item.sessionDate}-${item.startTime}-${fallback}`;
}

function CompactSession({ item, onOpen }) {
  const meta = sessionMeta(item);
  const sessionId = item.sessionId ?? item.id;
  const Body = sessionId ? "button" : "div";

  return (
    <Body
      type={sessionId ? "button" : undefined}
      onClick={sessionId ? () => onOpen(item) : undefined}
      aria-label={`${item.className || item.title || "Buổi học"}, ${formatSessionTime(item.startTime)}, ${meta.label}`}
      className={clsx(
        "block w-full rounded-xl border p-2.5 text-left",
        sessionSurface(item),
        sessionId &&
          "cursor-pointer transition-all hover:border-blue-400 active:scale-[0.98] dark:hover:border-blue-700",
      )}
    >
      <p className="line-clamp-2 text-xs font-bold text-slate-900 dark:text-white">
        {item.className || item.title || "Lớp học"}
      </p>
      <p className="mt-1 font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
        {formatSessionTime(item.startTime)}–{formatSessionTime(item.endTime)}
      </p>
      <p className="mt-1 truncate text-[11px] text-slate-500 dark:text-slate-400">
        {item.tutorName ? `GV ${item.tutorName}` : "Đang cập nhật gia sư"}
      </p>
      <p className="mt-1 line-clamp-2 text-xs leading-tight text-slate-500 dark:text-slate-400">
        {meta.label}
      </p>
    </Body>
  );
}

function SessionCard({ item, onOpen, showDate = true }) {
  const meta = sessionMeta(item);
  const sessionId = item.sessionId ?? item.id;
  const date = item.sessionDate ?? item.date;
  const canJoin =
    item.meetingUrl &&
    String(date ?? "") >= todayISO() &&
    !["CANCELLED", "COMPLETED", "ABSENT", "STUDENT_ABSENT", "TUTOR_ABSENT"].includes(
      item.status,
    );

  return (
    <article className={clsx("rounded-xl border p-3.5 sm:p-4", sessionSurface(item))}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-blue-700 shadow-sm dark:bg-slate-800 dark:text-blue-300">
          {getInitials(item.tutorName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                {item.title || item.className || "Buổi học"}
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {item.tutorName ? `Gia sư ${item.tutorName}` : "Thông tin gia sư đang cập nhật"}
              </p>
            </div>
            <Badge tone={meta.tone} className="shrink-0">
              {meta.label}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <span className="inline-flex items-center gap-1.5 font-mono">
              <Clock3 size={13} />
              {showDate && date ? `${formatSessionDate(date)} · ` : ""}
              {formatSessionTime(item.startTime)}–{formatSessionTime(item.endTime)}
            </span>
            {item.teachingMode && (
              <span className="inline-flex items-center gap-1.5">
                {item.teachingMode === "ONLINE" ? <Video size={13} /> : <MapPin size={13} />}
                {TEACHING_MODE_LABELS[item.teachingMode] ?? item.teachingMode}
              </span>
            )}
            {item.location && (
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <MapPin size={13} className="shrink-0" />
                <span className="truncate">{item.location}</span>
              </span>
            )}
          </div>

          {item.note && (
            <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400">
              {item.note}
            </p>
          )}

          {(sessionId || canJoin) && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-700/70">
              {sessionId && (
                <Button variant="outline" size="sm" onClick={() => onOpen(item)}>
                  Xem chi tiết
                  <ChevronRight size={14} />
                </Button>
              )}
              {canJoin && (
                <Button
                  as="a"
                  href={item.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  size="sm"
                  className={item.status === "IN_PROGRESS" ? "animate-pulse" : ""}
                >
                  <Video size={14} />
                  {item.status === "IN_PROGRESS" ? "Vào lớp ngay" : "Mở phòng học"}
                  <ExternalLink size={12} />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
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
  const classCount = useMemo(
    () => new Set(items.map((item) => item.classId).filter(Boolean)).size,
    [items],
  );
  const today = todayISO();
  const currentWeekStart = weekStartOf(today);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch học của tất cả lớp</h2>
            {!loading && <Badge tone="blue">{classCount} lớp</Badge>}
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {loading ? "Đang tải lịch học..." : `${items.length} buổi của tất cả lớp trong tuần được chọn.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2" aria-label="Chọn tuần">
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần trước"
            onClick={() => setWeekStart(addDays(weekStart, -7))}
          >
            <ChevronLeft size={16} />
          </Button>
          <span className="min-w-[11.5rem] text-center font-mono text-xs font-semibold text-slate-900 dark:text-white">
            {weekRangeLabel(weekStart)}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Tuần sau"
            onClick={() => setWeekStart(addDays(weekStart, 7))}
          >
            <ChevronRight size={16} />
          </Button>
          {weekStart !== currentWeekStart && (
            <Button variant="ghost" size="sm" onClick={() => setWeekStart(currentWeekStart)}>
              Tuần này
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-14 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
              </div>
            ))}
          </div>
          <SkeletonRows rows={2} className="h-24" />
        </>
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : (
        <>
          <div
            className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3"
            aria-label="Lịch học theo ngày"
          >
            {days.map((day) => {
              const isToday = day.date === today;
              const hasLearnedSession = day.sessions.some((item) => isStudentSessionLearned(item));
              return (
                <div key={day.date} className="min-w-0 space-y-2">
                  <div
                    className={clsx(
                      "rounded-xl border px-2 py-2 text-center",
                      hasLearnedSession
                        ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                        : isToday
                        ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                        : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
                    )}
                  >
                    <p
                      className={clsx(
                        "text-xs font-medium",
                        hasLearnedSession
                          ? "text-emerald-700 dark:text-emerald-300"
                          : isToday
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {day.label}
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                      {day.date.slice(-2)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {day.sessions.length ? (
                      day.sessions.map((item, index) => (
                        <CompactSession
                          key={sessionKey(item, index)}
                          item={item}
                          onOpen={onOpen}
                        />
                      ))
                    ) : (
                      <div className="flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-center dark:border-slate-800">
                        <p className="text-xs text-slate-400 dark:text-slate-500">Không có lịch</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <section aria-label="Chi tiết buổi học">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                Buổi học trong tuần
              </h2>
              <Badge tone="slate">{items.length} buổi</Badge>
            </div>
            {items.length ? (
              <div className="space-y-2.5">
                {items.map((item, index) => (
                  <SessionCard key={sessionKey(item, index)} item={item} onOpen={onOpen} />
                ))}
              </div>
            ) : (
              <Card className="py-10 text-center">
                <CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Tuần này chưa có buổi học
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Chọn tuần trước hoặc tuần sau để xem lịch khác.
                </p>
              </Card>
            )}
          </section>
        </>
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

  if (loading) return <SkeletonRows rows={4} className="h-24" />;
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
    <section className="space-y-3" aria-label="Lịch sử buổi học">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch sử học tập</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Xem lại nội dung, tài liệu và nhật ký từ gia sư.
          </p>
        </div>
        <Badge tone="slate">{sessions.length} buổi</Badge>
      </div>
      <div className="space-y-2.5">
        {sessions.map((item, index) => (
          <SessionCard key={sessionKey(item, index)} item={item} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

/** Lịch học của học viên: cùng cấu trúc lịch tuần với Tutor, dùng dữ liệu API thật. */
export default function StudentSchedule() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [tab, setTab] = useState(() => (tabFromUrl === "history" ? "history" : "week"));
  const [open, setOpen] = useState(null);

  useEffect(() => {
    if (tabFromUrl === "history" || tabFromUrl === "week") setTab(tabFromUrl);
  }, [tabFromUrl]);

  function handleTabChange(nextTab) {
    setTab(nextTab);
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (nextTab === "week") next.delete("tab");
        else next.set("tab", nextTab);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Học tập"
        title="Lịch học"
        description="Theo dõi lịch tuần, vào lớp trực tuyến và xem lại nội dung từng buổi học."
        actions={
          <span className="hidden h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 sm:flex">
            <GraduationCap size={19} />
          </span>
        }
      />

      <div role="tablist" aria-label="Chế độ xem lịch học" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => handleTabChange(id)}
            className={clsx(
              "inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98]",
              tab === id
                ? "border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-500/20"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800 dark:hover:bg-slate-800",
            )}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {tab === "week" ? (
        <WeekView onOpen={setOpen} />
      ) : (
        <HistoryView onOpen={setOpen} />
      )}

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
