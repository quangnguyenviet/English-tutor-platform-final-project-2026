import { useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FileText,
  GraduationCap,
  LogOut,
  MessageCircle,
  Target,
  TrendingUp,
} from "lucide-react";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import { getStudentById } from "../../data/mockData";
import { getParentVisibleReport, LESSON_DEMO_REFERENCE_TIME } from "../../lib/lessonSessionModel";
import { getProgressSummary } from "../../lib/studentLearningViewModel";

const STATUS = {
  upcoming: { label: "Sắp diễn ra", tone: "blue" },
  live: { label: "Đang học", tone: "blue" },
  completed: { label: "Đã hoàn thành", tone: "emerald" },
  reschedule_requested: { label: "Đang chờ đổi lịch", tone: "amber" },
  rescheduled: { label: "Đã dời lịch", tone: "amber" },
  student_absent: { label: "Học sinh vắng", tone: "amber" },
  tutor_absent: { label: "Gia sư vắng", tone: "rose" },
  cancelled: { label: "Đã hủy", tone: "rose" },
};

const EXCEPTION_STATUSES = new Set(["reschedule_requested", "rescheduled", "student_absent", "tutor_absent", "cancelled"]);

function sessionDateTime(item) {
  if (!item?.fullDate) return 0;
  const value = new Date(`${item.fullDate}T${item.startTime || "00:00"}:00`).getTime();
  return Number.isFinite(value) ? value : 0;
}

function formatSessionDate(item) {
  const time = sessionDateTime(item);
  if (time) {
    return new Intl.DateTimeFormat("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(time);
  }
  return item?.dateStr || "Chưa có ngày học";
}

function isOverdueSchedule(item) {
  return item?.status === "upcoming" && sessionDateTime(item) > 0 && sessionDateTime(item) < LESSON_DEMO_REFERENCE_TIME;
}

function SessionStatus({ item }) {
  if (isOverdueSchedule(item)) return <Badge tone="amber">Chưa cập nhật buổi học</Badge>;
  const status = STATUS[item.status] || { label: "Chưa rõ trạng thái", tone: "slate" };
  return <Badge tone={status.tone}>{status.label}</Badge>;
}

function MetricCard({ icon: Icon, label, value, hint, tone = "blue" }) {
  const iconTone = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
  };

  return (
    <Card className="p-4">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconTone[tone]}`}>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <p className="mt-3 font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">{value}</p>
      <p className="mt-1 text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</p>
    </Card>
  );
}

function ReportItem({ label, value, tone = "slate" }) {
  if (!value) return null;
  const border = tone === "blue" ? "border-blue-200 dark:border-blue-900" : "border-slate-200 dark:border-slate-800";
  return (
    <div className={`border-l-2 pl-3 ${border}`}>
      <dt className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-800 dark:text-slate-200">{value}</dd>
    </div>
  );
}

function SessionTimelineItem({ item, index }) {
  const report = getParentVisibleReport(item);
  const questions = report ? item.questions || [] : [];
  const answeredCount = questions.filter((question) => question.repliedAt || question.reply).length;
  const needsAttention = EXCEPTION_STATUSES.has(item.status) || isOverdueSchedule(item);

  return (
    <li className="relative pl-7 before:absolute before:left-1 before:top-2 before:h-3 before:w-3 before:rounded-full before:border-[3px] before:border-blue-500 before:bg-white dark:before:bg-slate-900">
      <details open={index === 0} className="group rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <summary className="flex cursor-pointer list-none items-start gap-3 p-4 marker:hidden [&::-webkit-details-marker]:hidden">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <SessionStatus item={item} />
              {report && <Badge tone="blue">Có nhận xét gia sư</Badge>}
              <span className="text-xs text-slate-500 dark:text-slate-400">{formatSessionDate(item)}{item.startTime ? ` · ${item.startTime}` : ""}</span>
            </div>
            <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.topic || item.subject || "Buổi học"}</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.tutorName || "Gia sư"}{item.subject ? ` · ${item.subject}` : ""}</p>
          </div>
          <ChevronDown size={17} className="mt-1 shrink-0 text-slate-400 transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>

        <div className="space-y-4 border-t border-slate-100 px-4 pb-4 pt-4 dark:border-slate-800">
          {item.rescheduledFrom && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Trung tâm đã đổi lịch từ {item.rescheduledFrom.dateStr} ({item.rescheduledFrom.startTime}–{item.rescheduledFrom.endTime}).</p>
          )}
          {item.status === "reschedule_requested" && (
            <p className="text-xs text-amber-700 dark:text-amber-300">Yêu cầu đổi lịch đang chờ trung tâm xác nhận. {item.exceptionReason ? `Lý do: ${item.exceptionReason}` : ""}</p>
          )}
          {report ? (
            <>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2"><ReportItem label="Gia sư ghi nhận" value={report.summary} tone="blue" /></div>
                <ReportItem label="Con đã làm tốt" value={report.achievement} />
                <ReportItem label="Điểm cần luyện thêm" value={report.difficulty} />
                <ReportItem label="Bài tập sau buổi" value={report.homework} />
                <ReportItem label="Bước tiếp theo" value={report.nextStep} />
              </dl>
              {questions.length > 0 && (
                <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">
                  <MessageCircle size={15} className="mt-0.5 shrink-0" />
                  <p>Học sinh đã hỏi {questions.length} câu sau buổi học; gia sư đã phản hồi {answeredCount} câu. Nội dung trao đổi chỉ hiển thị cho học sinh và gia sư.</p>
                </div>
              )}
            </>
          ) : item.status === "completed" ? (
            <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
              <Clock3 size={16} className="mt-0.5 shrink-0" /> Buổi học đã kết thúc; đang chờ gia sư chia sẻ báo cáo cho phụ huynh.
            </p>
          ) : needsAttention ? (
            <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> Trạng thái buổi học cần được xác nhận. Phụ huynh có thể liên hệ trung tâm để kiểm tra lịch.
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {item.status === "live" ? "Buổi học đang diễn ra. Nhận xét sẽ xuất hiện khi gia sư hoàn tất và chia sẻ báo cáo." : "Buổi học chưa diễn ra. Nhận xét sẽ xuất hiện sau khi gia sư chia sẻ báo cáo."}
            </p>
          )}
        </div>
      </details>
    </li>
  );
}

export default function ParentLearningProgress() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const { sessions = [] } = useLessonSessions();
  const student = getStudentById(session?.studentId);
  const progress = getProgressSummary(student);

  const studentSessions = useMemo(
    () => sessions.filter((item) => item.studentId === session?.studentId).sort((a, b) => sessionDateTime(b) - sessionDateTime(a)),
    [sessions, session?.studentId]
  );
  const completedSessions = studentSessions.filter((item) => item.status === "completed");
  const reportedSessions = completedSessions.filter(getParentVisibleReport);
  const latestEvent = studentSessions.find((item) => item.status === "live")
    || studentSessions.find((item) => item.status !== "upcoming" || isOverdueSchedule(item))
    || [...studentSessions].reverse()[0];
  const latestReportSession = reportedSessions[0];
  const nextSession = [...studentSessions]
    .filter((item) => item.status === "upcoming" && !isOverdueSchedule(item))
    .sort((a, b) => sessionDateTime(a) - sessionDateTime(b))[0];
  const attentionCount = studentSessions.filter((item) => EXCEPTION_STATUSES.has(item.status) || isOverdueSchedule(item)).length;
  const pendingReportCount = completedSessions.length - reportedSessions.length;
  const assignedExercises = (student?.exercises || []).filter((exercise) => exercise.status === "assigned");

  function handleLogout() {
    logout();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-[100dvh] bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Góc phụ huynh · Theo dõi học tập</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">Việc học của {student?.name || "con"}</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-500 dark:text-slate-400">Theo dõi từng buổi học, nhận xét gia sư đã chia sẻ và việc con cần làm tiếp. Lịch minh họa được chụp tại ngày 04/08/2026.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button as={Link} to="/" variant="outline" size="sm"><ArrowLeft size={15} /> Trang chủ</Button>
            <Button onClick={handleLogout} variant="ghost" size="sm"><LogOut size={15} /> Đăng xuất</Button>
          </div>
        </header>

        {!student ? (
          <Card className="flex flex-col items-center px-5 py-12 text-center">
            <GraduationCap size={38} className="text-slate-400" />
            <h2 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Chưa tìm thấy hồ sơ học sinh</h2>
            <p className="mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">Tài khoản phụ huynh này chưa được liên kết với hồ sơ học sinh. Vui lòng liên hệ trung tâm để kiểm tra.</p>
          </Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">{student.initials || student.name?.slice(0, 1)}</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{student.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{[student.grade, student.level, student.goal].filter(Boolean).join(" · ")}</p>
              </div>
              {nextSession && <Badge tone="blue"><CalendarDays size={13} /> Buổi tiếp theo: {formatSessionDate(nextSession)}</Badge>}
            </Card>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={CheckCircle2} label="Buổi đã hoàn thành" value={completedSessions.length} hint="Theo nhật ký buổi học" tone="emerald" />
              <MetricCard icon={FileText} label="Báo cáo đã chia sẻ" value={reportedSessions.length} hint={pendingReportCount ? `${pendingReportCount} buổi đang chờ báo cáo` : "Gia sư gửi sau mỗi buổi"} />
              <MetricCard icon={BookOpen} label="Bài đang cần làm" value={assignedExercises.length} hint="Theo danh sách bài tập hiện có" tone="amber" />
              <MetricCard icon={ClipboardCheck} label="Bài đã chấm" value={progress.gradedExercises.length} hint={progress.gradedExercises.length ? `Điểm trung bình ${progress.averageScore}%` : "Chưa có bài được chấm"} tone="emerald" />
            </div>

            {(attentionCount > 0 || pendingReportCount > 0) && (
              <Card className="flex items-start gap-3 border-amber-200 bg-amber-50/70 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-400" />
                <div>
                  <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Cần theo dõi</h2>
                  <p className="mt-1 text-xs leading-relaxed text-amber-800 dark:text-amber-300">
                    {[
                      attentionCount > 0 && `${attentionCount} buổi có lịch hoặc trạng thái cần xác nhận`,
                      pendingReportCount > 0 && `${pendingReportCount} buổi đã học nhưng chưa có báo cáo chia sẻ`,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-5">
              <section className="min-w-0 space-y-4 lg:col-span-3" aria-labelledby="parent-latest-title">
                <Card className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">Buổi học gần nhất</p>
                      <h2 id="parent-latest-title" className="mt-1 text-base font-bold text-slate-900 dark:text-white">{latestEvent?.topic || latestEvent?.subject || "Chưa có buổi học"}</h2>
                      {latestEvent && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatSessionDate(latestEvent)} · {latestEvent.tutorName || "Gia sư"}</p>}
                    </div>
                    {latestEvent && <SessionStatus item={latestEvent} />}
                  </div>
                  {latestEvent ? (
                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {getParentVisibleReport(latestEvent) ? (
                        <ReportItem label="Nhận xét gia sư đã chia sẻ" value={latestEvent.report.summary} tone="blue" />
                      ) : latestEvent.status === "completed" ? (
                        <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"><Clock3 size={16} className="mt-0.5 shrink-0" />Đang chờ gia sư chia sẻ báo cáo buổi học.</p>
                      ) : EXCEPTION_STATUSES.has(latestEvent.status) || isOverdueSchedule(latestEvent) ? (
                        <p className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-300"><AlertCircle size={16} className="mt-0.5 shrink-0" />Buổi học cần được xác nhận lại với trung tâm.</p>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Nhận xét gia sư sẽ xuất hiện khi buổi học hoàn tất và báo cáo được chia sẻ.</p>
                      )}
                    </div>
                  ) : <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Chưa có lịch học được ghi nhận cho con.</p>}
                </Card>

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-900 dark:text-white">Nhật ký từng buổi</h2>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Mở một buổi để xem nhận xét đã được gia sư chia sẻ.</p>
                    </div>
                    <Badge tone="slate">{studentSessions.length} buổi</Badge>
                  </div>
                  {studentSessions.length ? (
                    <ol className="space-y-4 border-l border-slate-200 pl-2 dark:border-slate-800">
                      {studentSessions.map((item, index) => <SessionTimelineItem key={item.id} item={item} index={index} />)}
                    </ol>
                  ) : (
                    <Card className="py-10 text-center">
                      <CalendarDays size={28} className="mx-auto text-slate-400" />
                      <p className="mt-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Chưa có buổi học nào</p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Lịch và báo cáo sẽ xuất hiện khi trung tâm kích hoạt lớp học.</p>
                    </Card>
                  )}
                </div>
              </section>

              <aside className="min-w-0 space-y-4 lg:col-span-2" aria-label="Việc cần theo dõi và tín hiệu học tập">
                <Card className="p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <Target size={18} className="text-blue-600 dark:text-blue-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Việc tiếp theo</h2>
                  </div>
                  {latestReportSession ? (
                    <>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Theo báo cáo ngày {formatSessionDate(latestReportSession)} · {latestReportSession.tutorName || "Gia sư"}</p>
                      <dl className="mt-4 space-y-4">
                        <ReportItem label="Bài tập được giao" value={latestReportSession.report.homework || "Gia sư chưa ghi bài tập cho buổi này."} tone="blue" />
                        <ReportItem label="Hướng học tiếp theo" value={latestReportSession.report.nextStep || "Gia sư chưa ghi bước tiếp theo."} />
                      </dl>
                    </>
                  ) : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Chưa có báo cáo đã chia sẻ. Việc cần làm sau buổi học sẽ xuất hiện ở đây.</p>}
                </Card>

                <Card className="p-4 sm:p-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Tín hiệu học tập</h2>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tổng hợp ngắn từ bài tập và hồ sơ học tập hiện có.</p>
                  {(progress.strongestSkill || progress.focusSkill || progress.gradedExercises.length) ? (
                    <dl className="mt-4 space-y-4">
                      {progress.strongestSkill && <ReportItem label="Đang làm tốt" value={progress.strongestSkill.name} />}
                      {progress.focusSkill && <ReportItem label="Đang cần tập trung" value={progress.focusSkill.name} />}
                      {progress.gradedExercises.length > 0 && <ReportItem label="Kết quả bài đã chấm" value={`${progress.averageScore}% trung bình từ ${progress.gradedExercises.length} bài`} />}
                    </dl>
                  ) : <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">Chưa đủ bài đã chấm hoặc đánh giá năng lực để tổng hợp.</p>}
                </Card>
              </aside>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
