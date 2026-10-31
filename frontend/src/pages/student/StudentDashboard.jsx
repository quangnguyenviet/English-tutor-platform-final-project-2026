import { Link } from "react-router-dom";
import { ArrowRight, CalendarClock, ClipboardList, NotebookPen, TrendingUp } from "lucide-react";
import { apiGetMyDashboard } from "../../lib/studentApi";
import { formatSessionDate, formatSessionTime, relativeDayLabel } from "../../lib/classroomApi";
import {
  dashboardArea,
  deadlineInfo,
  formatEloChange,
  sessionLogState,
  sortQuizzesByDeadline,
} from "../../lib/studentModel";
import { useStudentData } from "../../hooks/useStudentData";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import PageHeader from "../../components/ui/PageHeader";
import StudentMetricCard from "../../components/student/StudentMetricCard";
import StudentSectionHeader from "../../components/student/StudentSectionHeader";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const panel = "rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900";

/** Một khu vực của dashboard: đang tải / lỗi riêng / dữ liệu — lỗi không lan sang khu khác. */
function Area({ loading, state, children, empty }) {
  if (loading) return <SkeletonRows rows={2} className="h-14" />;
  if (state.error) return <ErrorBox message={state.error} />;
  if (state.empty) return empty;
  return children(state.value);
}

export default function StudentDashboard() {
  const { session } = useAuth();
  const { data, loading, error, retry } = useStudentData((token) => apiGetMyDashboard(token), []);

  const elo = dashboardArea(data, "elo");
  const nextSession = dashboardArea(data, "nextSession");
  const lastSession = dashboardArea(data, "lastSession");
  const quizzes = dashboardArea(data, "pendingQuizzes");
  const pending = sortQuizzesByDeadline(Array.isArray(quizzes.value) ? quizzes.value : []);
  const eloValue = elo.value?.current ?? elo.value?.elo ?? elo.value;
  const eloChange = elo.value?.lastChange ?? elo.value?.change;

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Tổng quan"
        title={`Xin chào, ${data?.student?.fullName ?? session?.name ?? "bạn"}`}
        description="Lịch học sắp tới, bài cần làm và Elo hiện tại của bạn."
      />

      {error && <ErrorBox message={error} onRetry={retry} />}

      <section aria-label="Chỉ số" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StudentMetricCard
          icon={TrendingUp}
          tone="blue"
          value={loading ? "–" : elo.error || eloValue == null ? "–" : Math.round(eloValue)}
          label={
            eloChange != null && !elo.error ? `Elo (gần nhất ${formatEloChange(eloChange)})` : "Elo hiện tại"
          }
        />
        <StudentMetricCard
          icon={ClipboardList}
          tone={pending.some((q) => deadlineInfo(q.deadline).overdue) ? "rose" : "amber"}
          value={loading ? "–" : quizzes.error ? "–" : pending.length}
          label="Bài cần làm"
        />
        <StudentMetricCard
          icon={CalendarClock}
          tone="emerald"
          value={loading ? "–" : nextSession.value ? relativeDayLabel(nextSession.value.sessionDate) : "–"}
          label="Buổi học tiếp theo"
        />
        <StudentMetricCard
          icon={NotebookPen}
          tone="blue"
          value={loading ? "–" : lastSession.value ? formatSessionDate(lastSession.value.sessionDate).slice(0, 5) : "–"}
          label="Buổi học gần nhất"
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className={`${panel} lg:col-span-3`}>
          <StudentSectionHeader
            icon={ClipboardList}
            title="Bài cần làm"
            to="/student/exercises"
            linkLabel="Xem tất cả"
          />
          <Area
            loading={loading}
            state={quizzes}
            empty={null}
          >
            {() =>
              pending.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Bạn đã hoàn thành hết bài" description="Bài mới sẽ hiện ở đây khi gia sư giao." />
              ) : (
                <ul className="space-y-2.5">
                  {pending.slice(0, 5).map((quiz) => {
                    const due = deadlineInfo(quiz.deadline);
                    return (
                      <li
                        key={quiz.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                      >
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">{quiz.title}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone={due.overdue ? "rose" : "amber"} size="xs">
                              {due.label}
                            </Badge>
                            {quiz.deadline && (
                              <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                                Hạn {formatSessionDate(String(quiz.deadline).slice(0, 10))}
                              </span>
                            )}
                          </div>
                        </div>
                        {!due.overdue && (
                          <Button as={Link} to={`/student/exercises/${quiz.id}`} size="sm">
                            Làm bài
                            <ArrowRight size={14} />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )
            }
          </Area>
        </section>

        <div className="space-y-6 lg:col-span-2">
          <section className={panel}>
            <StudentSectionHeader icon={CalendarClock} title="Buổi học tiếp theo" to="/student/schedule" linkLabel="Xem lịch" />
            <Area
              loading={loading}
              state={nextSession}
              empty={<EmptyState icon={CalendarClock} title="Chưa có buổi sắp tới" />}
            >
              {(item) => (
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title || "Buổi học"}</p>
                  <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                    {formatSessionDate(item.sessionDate)} · {formatSessionTime(item.startTime)} – {formatSessionTime(item.endTime)}
                  </p>
                  {item.tutorName && <p className="text-xs text-slate-500 dark:text-slate-400">Gia sư {item.tutorName}</p>}
                </div>
              )}
            </Area>
          </section>

          <section className={panel}>
            <StudentSectionHeader icon={NotebookPen} title="Buổi học gần nhất" to="/student/schedule" linkLabel="Lịch sử" />
            <Area
              loading={loading}
              state={lastSession}
              empty={<EmptyState icon={NotebookPen} title="Chưa có buổi nào hoàn thành" />}
            >
              {(item) => {
                const log = sessionLogState(item);
                return (
                  <div className="space-y-1.5">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{item.title || "Buổi học"}</p>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {formatSessionDate(item.sessionDate)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {log.kind === "ready" ? item.logKnowledge : log.label}
                    </p>
                  </div>
                );
              }}
            </Area>
          </section>
        </div>
      </div>
    </div>
  );
}
