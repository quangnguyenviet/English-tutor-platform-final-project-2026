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
  ExternalLink,
  MapPin,
  RefreshCw,
  UserX,
  Video,
  XCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

const DEMO_WEEK_START = Date.UTC(2026, 7, 3);
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_DAYS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

const STATUS_META = {
  upcoming: {
    label: "Sắp học", tone: "blue", icon: Clock3,
    surface: "border-blue-200 bg-blue-50/70 dark:border-blue-900 dark:bg-blue-950/20",
  },
  live: {
    label: "Đang học", tone: "blue", icon: AlertCircle,
    surface: "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40",
  },
  completed: {
    label: "Đã chia sẻ báo cáo", tone: "emerald", icon: CheckCircle2,
    surface: "border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20",
  },
  reschedule_requested: {
    label: "Yêu cầu đổi lịch", tone: "amber", icon: RefreshCw,
    surface: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  },
  rescheduled: {
    label: "Đã dời lịch", tone: "amber", icon: RefreshCw,
    surface: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
  },
  student_absent: {
    label: "Học sinh vắng", tone: "rose", icon: UserX,
    surface: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  },
  tutor_absent: {
    label: "Gia sư vắng", tone: "rose", icon: UserX,
    surface: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  },
  cancelled: {
    label: "Đã hủy", tone: "rose", icon: XCircle,
    surface: "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20",
  },
};

const PENDING_REPORT_META = {
  label: "Chờ báo cáo", tone: "amber", icon: Clock3,
  surface: "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30",
};

const UNKNOWN_META = {
  label: "Chưa xác định", tone: "neutral", icon: AlertCircle,
  surface: "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900",
};

function getStatusMeta(session) {
  if (session.status === "completed" && !session.report?.publishedAt) return PENDING_REPORT_META;
  return STATUS_META[session.status] ?? UNKNOWN_META;
}

function getInitials(name) {
  if (!name?.trim()) return "HS";
  return name.trim().split(/\s+/).slice(-2).map((part) => part[0]).join("").toUpperCase();
}

function getWeekDays(weekOffset) {
  return WEEK_DAYS.map((dayOfWeek, index) => {
    const date = new Date(DEMO_WEEK_START + (weekOffset * 7 + index) * DAY_MS);
    const day = String(date.getUTCDate()).padStart(2, "0");
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    return {
      dayOfWeek,
      dateStr: `${day}/${month}`,
      fullDate: date.toISOString().slice(0, 10),
      year: date.getUTCFullYear(),
      dayNumber: date.getUTCDate(),
    };
  });
}

function SessionCard({ session }) {
  const meta = getStatusMeta(session);
  const StatusIcon = meta.icon;
  const lessonLink = `/tutor/lessons?session=${encodeURIComponent(session.id)}`;

  return (
    <div className={clsx("rounded-xl border p-3.5 sm:p-4", meta.surface)}>
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-blue-700 dark:bg-slate-800 dark:text-blue-300">
          {getInitials(session.studentName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{session.studentName}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{session.subject}</p>
            </div>
            <Badge tone={meta.tone} className="shrink-0">
              <StatusIcon size={13} />{meta.label}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{session.topic}</p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={13} />{session.startTime}–{session.endTime}
            </span>
            {session.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin size={13} />{session.location}
              </span>
            )}
          </div>

          {session.exceptionReason && (
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Lý do: {session.exceptionReason}</p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-slate-200/80 pt-3 dark:border-slate-700/70">
            <Link to={lessonLink} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
              Xem và cập nhật buổi học <ChevronRight size={14} />
            </Link>
            {session.meetingLink && ["upcoming", "live"].includes(session.status) && (
              <a href={session.meetingLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200">
                <Video size={13} />Tham gia lớp <ExternalLink size={12} />
              </a>
            )}
            {session.classCode && (
              <span className="text-xs text-slate-500 dark:text-slate-400">Mã phòng: <span className="font-mono">{session.classCode}</span></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TutorSchedule() {
  const { session: authSession } = useAuth();
  const { sessions } = useLessonSessions();
  const [weekOffset, setWeekOffset] = useState(0);
  // The tutor demo account is t1; older stored auth sessions predate tutorId.
  const tutorId = authSession?.role === "tutor" ? authSession.tutorId ?? "t1" : null;

  const daysOfWeek = useMemo(() => getWeekDays(weekOffset), [weekOffset]);
  const sessionsThisWeek = useMemo(
    () => sessions
      .filter((item) => item.tutorId === tutorId && item.weekOffset === weekOffset)
      .sort((a, b) => a.fullDate.localeCompare(b.fullDate) || a.startTime.localeCompare(b.startTime)),
    [sessions, tutorId, weekOffset]
  );
  const sessionsByDate = useMemo(() => {
    const grouped = new Map();
    sessionsThisWeek.forEach((item) => grouped.set(item.fullDate, [...(grouped.get(item.fullDate) ?? []), item]));
    return grouped;
  }, [sessionsThisWeek]);

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-5 px-4 py-6 lg:px-8 lg:py-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Lịch mẫu · Tuần bắt đầu 03/08/2026</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lịch dạy</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{sessionsThisWeek.length} buổi của bạn trong tuần được chọn.</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto" aria-label="Chọn tuần">
          <button
            type="button"
            onClick={() => setWeekOffset((previous) => previous - 1)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Tuần trước"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="min-w-[184px] text-center font-mono text-xs font-medium text-slate-900 dark:text-white">
            {daysOfWeek[0].dateStr}/{daysOfWeek[0].year} – {daysOfWeek[6].dateStr}/{daysOfWeek[6].year}
          </span>
          <button
            type="button"
            onClick={() => setWeekOffset((previous) => previous + 1)}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Tuần sau"
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3" aria-label="Lịch dạy theo ngày">
        {daysOfWeek.map((day) => {
          const daySessions = sessionsByDate.get(day.fullDate) ?? [];
          return (
            <div key={day.fullDate} className="min-w-0 space-y-2">
              <div className="rounded-xl border border-slate-200 bg-white px-2 py-2 text-center dark:border-slate-800 dark:bg-slate-900">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{day.dayOfWeek}</p>
                <p className="mt-0.5 font-mono text-sm font-bold text-slate-800 dark:text-slate-200">{day.dayNumber}</p>
              </div>
              <div className="space-y-2">
                {daySessions.length ? daySessions.map((item) => {
                  const meta = getStatusMeta(item);
                  return (
                    <Link
                      key={item.id}
                      to={`/tutor/lessons?session=${encodeURIComponent(item.id)}`}
                      className={clsx("block rounded-xl border p-2.5 transition-colors hover:border-blue-400 dark:hover:border-blue-700", meta.surface)}
                      aria-label={`${item.studentName}, ${item.startTime}, ${meta.label}. Xem buổi học`}
                    >
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{getInitials(item.studentName)}</p>
                      <p className="mt-1 font-mono text-xs text-slate-600 dark:text-slate-300">{item.startTime}</p>
                      <p className="mt-1 text-xs leading-tight text-slate-500 dark:text-slate-400">{meta.label}</p>
                    </Link>
                  );
                }) : (
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
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">Buổi học trong tuần</h2>
        {sessionsThisWeek.length ? (
          <div className="space-y-2.5">
            {sessionsThisWeek.map((item) => <SessionCard key={item.id} session={item} />)}
          </div>
        ) : (
          <Card className="py-10 text-center">
            <CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Tuần này chưa có buổi dạy</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chọn tuần trước hoặc tuần sau để xem lịch khác.</p>
          </Card>
        )}
      </section>

      <div className="h-20 lg:hidden" />
    </div>
  );
}
