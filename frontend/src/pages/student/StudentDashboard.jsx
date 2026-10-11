import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Brain,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  MessageSquare,
  NotebookPen,
  Radio,
  Route,
  Target,
  User,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import { getStudentById } from "../../data/mockData";
import { LESSON_DEMO_REFERENCE_TIME } from "../../lib/lessonSessionModel";
import PageHeader from "../../components/ui/PageHeader";
import Badge from "../../components/ui/Badge";
import ProgressBar from "../../components/ui/ProgressBar";
import StudentMetricCard from "../../components/student/StudentMetricCard";
import StudentSectionHeader from "../../components/student/StudentSectionHeader";

/* ------------------------------------------------------------------ *
 * Trang Tổng quan học tập — UC-S01 / UC-ST-02 (khối chỉ số, bài tập gấp,
 * ôn tập hôm nay, lộ trình học, mục tiêu học tập) + UC-ST-17 (thông báo)
 *
 * Lưu ý nghiệp vụ: học sinh học OFFLINE nên trang này KHÔNG có lối vào
 * phòng học trực tuyến; buổi đang diễn ra chỉ dẫn tới chi tiết buổi học.
 * ------------------------------------------------------------------ */

// Ngày "hôm nay" của dữ liệu mock (buổi LIVE rơi vào Thứ 3 · 04/08/2026)
const TODAY_DAY_INDEX = 2;
const TODAY_LABEL = "Hôm nay";

function formatDate(value) {
  if (!value) return "--";
  const [year, month, day] = String(value).split("-");
  return day && month && year ? `${day}/${month}/${year}` : value;
}

function GoalRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt className="text-xs text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="font-mono text-xs font-semibold tabular-nums text-slate-900 dark:text-white">
        {value}
      </dd>
    </div>
  );
}

export default function StudentDashboard() {
  const { session, studentNotificationList = [] } = useAuth();
  const { sessions } = useLessonSessions();
  const student = getStudentById(session?.studentId || "s1");

  const schedule = sessions.filter((item) => item.studentId === (session?.studentId || "s1"));
  const exercises = student?.exercises || [];
  const deck = student?.spacedRepetitionDeck;

  /* ----------------------------- Dữ liệu ----------------------------- */

  const weekSessions = schedule.filter((s) => (s.weekOffset ?? 0) === 0);
  const upcomingSessions = weekSessions
    .filter((s) => s.status === "upcoming" || s.status === "live")
    .sort((a, b) => {
      // LIVE luôn lên đầu, sau đó theo thứ tự ngày
      if (a.status === "live" && b.status !== "live") return -1;
      if (b.status === "live" && a.status !== "live") return 1;
      return (a.dayIndex ?? 0) - (b.dayIndex ?? 0);
    });

  const completedThisWeek = weekSessions.filter((s) => s.status === "completed");
  const liveSession = weekSessions.find((s) => s.status === "live") || null;

  const todoExercises = exercises.filter(
    (e) => e.status === "assigned" || e.status === "submitted"
  );

  // Lịch và bài tập của prototype dùng cùng một mốc dữ liệu mẫu.
  const today = new Date(LESSON_DEMO_REFERENCE_TIME);
  const urgentExercises = todoExercises.filter((e) => {
    if (!e.dueDate) return false;
    const due = new Date(e.dueDate);
    if (Number.isNaN(due.getTime())) return false;
    const diffHours = (due - today) / (1000 * 60 * 60);
    return diffHours <= 24;
  });
  const exercisesDueToday = urgentExercises.length > 0 ? urgentExercises : todoExercises;

  const overdueExercises = todoExercises.filter((e) => {
    if (!e.dueDate) return false;
    const due = new Date(e.dueDate);
    return !Number.isNaN(due.getTime()) && due < today;
  });

  const dueTodayCount = deck?.dueTodayCount ?? 0;
  const streakDays = deck?.streakDays ?? 0;
  const unreadNotificationCount = studentNotificationList.filter((item) => !item.read).length;

  // Gia sư đang học cùng — suy ra từ lịch tuần này
  const tutorsMap = new Map();
  weekSessions.forEach((s) => {
    if (!s.tutorId) return;
    if (!tutorsMap.has(s.tutorId)) {
      tutorsMap.set(s.tutorId, { id: s.tutorId, name: s.tutorName, sessions: [] });
    }
    tutorsMap.get(s.tutorId).sessions.push(s);
  });

  const tutors = Array.from(tutorsMap.values()).map((t) => {
    const ordered = [...t.sessions].sort((a, b) => (a.dayIndex ?? 0) - (b.dayIndex ?? 0));
    const done = ordered.filter((s) => s.status === "completed").length;
    const next = ordered.find((s) => s.status === "upcoming" || s.status === "live") || null;
    return {
      ...t,
      subject: ordered[0]?.subject || "Gia sư tiếng Anh",
      completed: done,
      total: ordered.length,
      percent: ordered.length ? Math.round((done / ordered.length) * 100) : 0,
      next,
    };
  });

  const recentCompleted = [...completedThisWeek]
    .sort((a, b) => (b.dayIndex ?? 0) - (a.dayIndex ?? 0))
    .slice(0, 3);

  /* -------------------- Lộ trình & mục tiêu học tập -------------------- */

  const roadmap = student?.aiRoadmaps?.[0] || null;
  const completedPhases = roadmap?.completedPhasesCount ?? 0;
  const totalPhases = roadmap?.totalPhases ?? 3;
  const roadmapPercent = roadmap?.overallPercent ?? student?.overallProgress ?? 0;

  const learningPath = student?.learningPath || [];
  const nextLesson =
    learningPath.find((item) => item.status === "in_progress") ||
    learningPath.find((item) => item.status === "upcoming") ||
    null;

  const learningGoal = student?.learningGoal || null;
  const goalTitle = learningGoal?.title || student?.goal || "Chưa thiết lập mục tiêu";

  /* --------------------------- Khối 2: Hero --------------------------- */

  const hero = (() => {
    if (liveSession) {
      return {
        tone: "rose",
        icon: Radio,
        title: "Buổi học đang diễn ra",
        subtitle: `${liveSession.topic} · ${liveSession.tutorName}`,
        meta: `${liveSession.startTime} – ${liveSession.endTime} · ${liveSession.dayOfWeek} (${liveSession.dateStr})`,
        badge: "ĐANG DIỄN RA",
        cta: "Xem chi tiết buổi học",
        ctaHref: `/student/schedule?lesson=${liveSession.id}`,
      };
    }

    if (exercisesDueToday.length > 0) {
      const first = exercisesDueToday[0];
      return {
        tone: "amber",
        icon: NotebookPen,
        title:
          exercisesDueToday.length === 1
            ? "Bài tập đến hạn hôm nay"
            : `${exercisesDueToday.length} bài tập đến hạn hôm nay`,
        subtitle: `${first.title} · ${first.tutorName || "Gia sư"}`,
        meta: overdueExercises.length
          ? `${overdueExercises.length} bài đã quá hạn · ${first.skill || "Ngữ pháp"}`
          : `Hạn nộp: ${formatDate(first.dueDate)} · ${first.skill || "Ngữ pháp"}`,
        badge: overdueExercises.length ? "QUÁ HẠN" : "SẮP ĐẾN HẠN",
        cta: "Làm bài ngay",
        ctaHref: `/student/exercises/${first.id}`,
      };
    }

    return {
      tone: "blue",
      icon: Brain,
      title: dueTodayCount > 0 ? "Ôn tập ngắt quãng hôm nay" : "Không còn việc tồn đọng",
      subtitle:
        dueTodayCount > 0
          ? `${dueTodayCount} kiến thức đã đến lịch ôn theo thuật toán SM-2`
          : "Bạn đã hoàn thành hết bài tập và phiên ôn tập. Nghỉ ngơi nhé!",
      meta: streakDays > 0 ? `Chuỗi ${streakDays} ngày liên tục · khoảng 5 phút` : "Khoảng 5 phút",
      badge: streakDays > 0 ? `CHUỖI ${streakDays} NGÀY` : null,
      cta: dueTodayCount > 0 ? "Bắt đầu ôn tập" : "Xem tiến bộ của tôi",
      ctaHref: dueTodayCount > 0 ? "/student/spaced-repetition" : "/student/progress",
    };
  })();

  const heroTone = {
    rose: {
      box: "border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20",
      iconBox: "bg-rose-600 text-white",
      badge: "bg-rose-600 text-white",
      cta: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
    },
    amber: {
      box: "border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20",
      iconBox: "bg-amber-500 text-white",
      badge: "bg-amber-500 text-white",
      cta: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    blue: {
      box: "border-blue-200 bg-blue-50/50 dark:border-blue-900/60 dark:bg-blue-950/20",
      iconBox: "bg-blue-600 text-white",
      badge: "bg-blue-600 text-white",
      cta: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  }[hero.tone];

  const HeroIcon = hero.icon;
  const focusHref = exercisesDueToday.length > 0 ? "/student/exercises" : "/student/schedule";

  /* ------------------------------ Render ------------------------------ */

  return (
    <div className="space-y-6 pb-12">
      {/* ═══ 1. HEADER ═══ */}
      <PageHeader
        className="mb-0"
        eyebrow="Không gian học tập cá nhân"
        title={student?.name ? `Chào ${student.name.split(" ").pop()}` : "Tổng quan học tập"}
        description={
          <>
            Tuần này bạn có{" "}
            <strong className="font-semibold text-slate-900 dark:text-white">
              {upcomingSessions.length} buổi học
            </strong>
            {exercisesDueToday.length > 0 && (
              <>
                {" và "}
                <strong className="font-semibold text-slate-900 dark:text-white">
                  {exercisesDueToday.length} bài tập
                </strong>
              </>
            )}{" "}
            đang chờ.
          </>
        }
        actions={
          <Link
            to="/student/spaced-repetition"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98] sm:w-auto"
          >
            <Brain size={16} strokeWidth={1.75} />
            <span>Ôn tập 5 phút</span>
          </Link>
        }
      />

      {/* ═══ 2. VIỆC CẦN LÀM HÔM NAY ═══ */}
      <section aria-label="Việc cần làm hôm nay" className={`rounded-2xl border p-5 ${heroTone.box}`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${heroTone.iconBox}`}
            >
              {hero.tone === "rose" ? (
                <span className="relative flex h-4 w-4">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                  <HeroIcon className="relative h-4 w-4" strokeWidth={2} />
                </span>
              ) : (
                <HeroIcon size={20} strokeWidth={1.75} />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{hero.title}</h2>
                {hero.badge && (
                  <span
                    className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${heroTone.badge}`}
                  >
                    {hero.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{hero.subtitle}</p>
              <p className="mt-1 font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {hero.meta}
              </p>
            </div>
          </div>

          <Link
            to={hero.ctaHref}
            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-[0.98] ${heroTone.cta}`}
          >
            <span>{hero.cta}</span>
            <ArrowRight size={16} strokeWidth={1.75} />
          </Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {exercisesDueToday.length}
            </span>{" "}
            bài tập cần nộp{" · "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">{dueTodayCount}</span>{" "}
            thẻ ôn đến hạn{" · "}
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {upcomingSessions.length}
            </span>{" "}
            buổi học sắp tới
          </p>
          <Link
            to={focusHref}
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            <span>Xem chi tiết</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </section>

      {/* ═══ 3. THANH CHỈ SỐ — UC-ST-02 §3.1 ═══ */}
      <section aria-label="Chỉ số nhanh" className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <StudentMetricCard
          icon={NotebookPen}
          value={todoExercises.length}
          label="Bài tập chưa nộp"
          tone={todoExercises.length > 0 ? "amber" : "blue"}
        />
        <StudentMetricCard
          icon={CalendarClock}
          value={exercisesDueToday.length}
          label="Bài sắp đến hạn"
        />
        <StudentMetricCard
          icon={Brain}
          value={dueTodayCount}
          label="Kiến thức cần ôn hôm nay"
        />
        <StudentMetricCard
          icon={Bell}
          value={unreadNotificationCount}
          label="Thông báo chưa đọc"
        />
      </section>

      {/* ═══ 4 → 9. LƯỚI NỘI DUNG ═══
          Desktop xếp theo lưới 3:2 ở 2 hàng; mobile đảo thứ tự để việc gấp
          (bài tập) lên trước lịch học. Dùng `order-*` cho mobile và
          `lg:col-start`/`lg:row-start` cho desktop. */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Lộ trình học — UC-ST-02 §3.4 ── */}
        <section className="order-1 lg:col-span-3 lg:col-start-1 lg:row-start-1 lg:order-none">
          <StudentSectionHeader
            icon={Route}
            title="Lộ trình học của tôi"
            to="/student/progress"
            linkLabel="Xem toàn bộ lộ trình"
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            {roadmap ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {roadmap.subject || "Lộ trình học cá nhân"}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      Lộ trình {totalPhases} giai đoạn · Đang ở giai đoạn{" "}
                      {Math.min(completedPhases + 1, totalPhases)}
                    </p>
                  </div>
                  <p className="shrink-0 font-mono text-2xl font-bold leading-none tabular-nums text-slate-900 dark:text-white">
                    {roadmapPercent}%
                  </p>
                </div>

                <ProgressBar value={roadmapPercent} tone="blue" size="md" className="mt-3" />

                <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Bài học tiếp theo
                    </p>
                    {nextLesson ? (
                      <>
                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                          {nextLesson.topic}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {(nextLesson.phase || "").split(": ").pop()}
                          {nextLesson.skills?.length ? ` · ${nextLesson.skills.join(" · ")}` : ""}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Bạn đã hoàn thành toàn bộ bài học trong lộ trình hiện tại.
                      </p>
                    )}
                  </div>

                  <Link
                    to="/student/progress"
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 active:scale-[0.98]"
                  >
                    <span>Học tiếp</span>
                    <ArrowRight size={16} strokeWidth={1.75} />
                  </Link>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Route size={23} strokeWidth={1.75} />
                </span>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Gia sư chưa xây dựng lộ trình học cho bạn
                </p>
                <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                  Lộ trình cá nhân hóa sẽ xuất hiện tại đây ngay khi gia sư hoàn tất khung chương trình.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Bài tập đến hạn ── */}
        <section className="order-2 lg:col-span-2 lg:col-start-4 lg:row-start-2 lg:order-none">
          <StudentSectionHeader
            icon={ClipboardCheck}
            title="Bài tập đến hạn"
            to="/student/exercises"
            linkLabel="Xem tất cả"
          />

          {exercisesDueToday.length > 0 ? (
            <div className="space-y-2">
              {exercisesDueToday.slice(0, 3).map((ex) => {
                const isPractice = ex.mode === "practice";
                const isOverdue = overdueExercises.some((o) => o.id === ex.id);
                return (
                  <div
                    key={ex.id}
                    className="rounded-xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge tone={isPractice ? "blue" : "slate"} size="xs">
                          {isPractice ? "Luyện tập" : "Kiểm tra"}
                        </Badge>
                        {isOverdue ? (
                          <Badge tone="rose" size="xs">
                            <AlertTriangle size={10} /> Quá hạn
                          </Badge>
                        ) : (
                          <Badge tone="amber" size="xs">
                            Sắp đến hạn
                          </Badge>
                        )}
                      </div>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-slate-400">
                        {formatDate(ex.dueDate)}
                      </span>
                    </div>

                    <p className="mt-2 line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                      {ex.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      {ex.tutorName || "Gia sư"} · {ex.skill}
                    </p>

                    <Link
                      to={`/student/exercises/${ex.id}`}
                      className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-blue-700 active:scale-[0.98]"
                    >
                      Làm bài
                      <ArrowRight size={13} strokeWidth={1.75} />
                    </Link>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <CheckCircle2
                size={18}
                className="shrink-0 text-emerald-600 dark:text-emerald-400"
                strokeWidth={1.75}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Không còn bài tập tồn đọng. Bạn đang bám sát tiến độ.
              </p>
            </div>
          )}
        </section>

        {/* ── Buổi học sắp tới ── */}
        <section className="order-3 lg:col-span-3 lg:col-start-1 lg:row-start-2 lg:order-none">
          <StudentSectionHeader
            icon={CalendarDays}
            title="Buổi học sắp tới"
            to="/student/schedule"
            linkLabel="Xem tuần đầy đủ"
          />

          {upcomingSessions.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              {upcomingSessions.slice(0, 5).map((s, idx) => {
                const isLive = s.status === "live";
                const isRescheduled = s.status === "rescheduled";
                const isToday = s.dayIndex === TODAY_DAY_INDEX;
                const dayLabel = isToday ? TODAY_LABEL : s.dayOfWeek;

                return (
                  <div
                    key={s.id}
                    className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between ${
                      idx > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
                    } ${isLive ? "bg-rose-50/50 dark:bg-rose-950/20" : ""}`}
                  >
                    <div className="flex min-w-0 items-start gap-3.5">
                      {/* Ô ngày */}
                      <div
                        className={`flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border ${
                          isToday
                            ? "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40"
                            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50"
                        }`}
                      >
                        <span
                          className={`text-[10px] font-bold uppercase leading-none ${
                            isToday ? "text-blue-600 dark:text-blue-400" : "text-slate-400"
                          }`}
                        >
                          {isToday ? "Nay" : s.dayOfWeek?.replace("Thứ ", "T")}
                        </span>
                        <span className="mt-0.5 font-mono text-xs font-bold leading-none tabular-nums text-slate-900 dark:text-white">
                          {s.dateStr?.split("/")[0]}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-mono text-xs font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                            {s.startTime} – {s.endTime}
                          </p>
                          {isLive && (
                            <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              <span className="h-1.5 w-1.5 animate-ping rounded-full bg-white" />
                              Đang diễn ra
                            </span>
                          )}
                          {isRescheduled && (
                            <Badge tone="amber" size="xs">
                              Chờ dời lịch
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-slate-900 dark:text-white">
                          {s.topic}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {s.tutorName}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                      <span className="hidden text-[11px] text-slate-400 sm:inline">{dayLabel}</span>
                      <Link
                        to={`/student/schedule?lesson=${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
                      >
                        Xem buổi học <ArrowRight size={13} />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CalendarClock size={24} strokeWidth={1.75} />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Tuần này chưa có buổi học nào
              </p>
              <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                Lịch học sẽ xuất hiện tại đây ngay khi gia sư xác nhận thời khóa biểu.
              </p>
            </div>
          )}

          {completedThisWeek.length > 0 && (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2
                size={13}
                className="text-emerald-600 dark:text-emerald-400"
                strokeWidth={1.75}
              />
              Đã hoàn thành {completedThisWeek.length}/{weekSessions.length} buổi trong tuần này
            </p>
          )}
        </section>

        {/* ── Mục tiêu học tập — UC-ST-02 §3.5 / UC-ST-18 ── */}
        <section className="order-4 lg:col-span-2 lg:col-start-4 lg:row-start-1 lg:order-none">
          <StudentSectionHeader icon={Target} title="Mục tiêu học tập" />

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40">
                <Target size={18} className="text-emerald-600 dark:text-emerald-400" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {goalTitle}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Mục tiêu hiện tại</p>
              </div>
            </div>

            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 dark:divide-slate-800 dark:border-slate-800">
              <GoalRow label="Band mong muốn" value={learningGoal?.targetBand || "--"} />
              <GoalRow
                label="Thời hạn dự kiến"
                value={learningGoal?.deadline ? formatDate(learningGoal.deadline) : "--"}
              />
              <GoalRow
                label="Thời gian tự học"
                value={
                  learningGoal?.weeklySelfStudyHours
                    ? `${learningGoal.weeklySelfStudyHours} giờ/tuần`
                    : "--"
                }
              />
            </dl>

            <Link
              to="/student/settings"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Cập nhật mục tiêu
            </Link>
          </div>
        </section>

        {/* ── Gia sư đang học cùng ── */}
        <section className="order-5 lg:col-span-2 lg:col-start-4 lg:row-start-3 lg:order-none">
          <StudentSectionHeader
            icon={User}
            title="Gia sư đang học cùng"
            to="/student/chat"
            linkLabel="Hộp thư"
          />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {tutors.map((t, idx) => (
              <div
                key={t.id}
                className={`p-3.5 ${idx > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xs font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                    {t.name?.split(" ").pop()?.charAt(0) || "GS"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">
                      {t.name}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {t.subject}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-[11px] font-semibold tabular-nums text-slate-400">
                    {t.completed}/{t.total}
                  </span>
                </div>

                <ProgressBar value={t.percent} size="xs" className="mt-2.5" />

                <div className="mt-2.5 flex items-center justify-between gap-2">
                  <p className="min-w-0 truncate text-[11px] text-slate-500 dark:text-slate-400">
                    {t.next ? (
                      <>
                        <Clock size={10} className="mr-0.5 inline" />
                        {t.next.dayOfWeek} {t.next.startTime}
                      </>
                    ) : (
                      "Đã xong lịch tuần này"
                    )}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      to="/student/chat"
                      title="Nhắn tin"
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <MessageSquare size={13} strokeWidth={1.75} />
                    </Link>
                    <Link
                      to={`/student/exercises?tutor=${t.id}`}
                      title="Bài tập của gia sư"
                      className="rounded-lg bg-slate-100 p-1.5 text-slate-600 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      <NotebookPen size={13} strokeWidth={1.75} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {tutors.length === 0 && (
              <p className="p-5 text-center text-xs text-slate-400">
                Chưa có gia sư nào được ghép lớp.
              </p>
            )}
          </div>
        </section>

        {/* ── Hoạt động gần đây ── */}
        <section className="order-6 lg:col-span-3 lg:col-start-1 lg:row-start-3 lg:order-none">
          <StudentSectionHeader icon={CheckCircle2} title="Hoạt động gần đây" />

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            {recentCompleted.map((s, idx) => (
              <div
                key={s.id}
                className={`flex items-start gap-3 p-3.5 ${
                  idx > 0 ? "border-t border-slate-100 dark:border-slate-800" : ""
                }`}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40">
                  <CheckCircle2
                    size={15}
                    className="text-emerald-600 dark:text-emerald-400"
                    strokeWidth={1.75}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs leading-snug text-slate-700 dark:text-slate-300">
                    Hoàn thành buổi học{" "}
                    <strong className="font-semibold text-slate-900 dark:text-white">{s.topic}</strong>
                  </p>
                  <p className="mt-0.5 font-mono text-[11px] tabular-nums text-slate-400">
                    {s.dayOfWeek} {s.dateStr} · {s.tutorName}
                  </p>
                </div>
              </div>
            ))}

            {recentCompleted.length === 0 && (
              <p className="p-5 text-center text-xs text-slate-400">
                Chưa có buổi học nào hoàn thành trong tuần này.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
