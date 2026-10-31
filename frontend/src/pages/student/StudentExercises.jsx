import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  RotateCcw,
} from "lucide-react";
import { apiGetMyQuizzes } from "../../lib/studentApi";
import {
  QUIZ_STATUS_META,
  deadlineInfo,
  quizProgressPercent,
  sortQuizzesByDeadline,
} from "../../lib/studentModel";
import { formatSessionDate } from "../../lib/classroomApi";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import ProgressBar from "../../components/ui/ProgressBar";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const TABS = [
  { id: "ASSIGNED", label: "Cần làm" },
  { id: "COMPLETED", label: "Đã hoàn thành" },
  { id: "EXPIRED", label: "Quá hạn" },
];

function QuizCard({ quiz }) {
  const meta = QUIZ_STATUS_META[quiz.status] ?? { label: quiz.status, tone: "slate" };
  const total = quiz.totalQuestions ?? 0;
  const answered = quiz.answeredCount ?? 0;
  const deadline = deadlineInfo(quiz.deadline);
  const canTake = quiz.status === "ASSIGNED";
  const started = answered > 0 && canTake;

  return (
    <Card className="p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={meta.tone}>{meta.label}</Badge>
            {quiz.skillName && <Badge skill={quiz.skillName}>{quiz.skillName}</Badge>}
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">{quiz.title}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {[quiz.tutorName, quiz.sessionTitle].filter(Boolean).join(" · ")}
          </p>
          <p
            className={`flex items-center gap-1.5 text-xs ${
              canTake && deadline.overdue
                ? "text-rose-600 dark:text-rose-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <CalendarClock size={14} />
            {quiz.deadline
              ? `Hạn nộp ${formatSessionDate(String(quiz.deadline).slice(0, 10))}`
              : "Không có hạn nộp"}
            {canTake && <span className="font-medium">· {deadline.label}</span>}
          </p>
          {total > 0 && (
            <div className="max-w-xs space-y-1">
              <ProgressBar value={quizProgressPercent(answered, total)} />
              <p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                {answered}/{total} câu
              </p>
            </div>
          )}
        </div>
        <div className="shrink-0">
          {canTake ? (
            <Button as={Link} to={`/student/exercises/${quiz.id}`} size="sm">
              {started ? "Làm tiếp" : "Bắt đầu làm"}
              <ArrowRight size={16} />
            </Button>
          ) : (
            quiz.status === "COMPLETED" && (
              <Button as={Link} to={`/student/exercises/${quiz.id}`} variant="outline" size="sm">
                Xem kết quả
              </Button>
            )
          )}
        </div>
      </div>
    </Card>
  );
}

export default function StudentExercises() {
  const [tab, setTab] = useState("ASSIGNED");
  const { data, loading, error, retry } = useStudentData((token) => apiGetMyQuizzes(token), []);

  const quizzes = useMemo(() => (Array.isArray(data) ? data : (data?.content ?? [])), [data]);
  const counts = useMemo(
    () =>
      quizzes.reduce((acc, quiz) => ({ ...acc, [quiz.status]: (acc[quiz.status] || 0) + 1 }), {}),
    [quizzes],
  );
  const visible = useMemo(
    () => sortQuizzesByDeadline(quizzes.filter((quiz) => quiz.status === tab)),
    [quizzes, tab],
  );

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Nhiệm vụ học tập"
        title="Bài tập & Kiểm tra"
        description="Làm quiz từng câu, xem đúng/sai ngay và theo dõi Elo của bạn."
        actions={
          <Button as={Link} to="/student/spaced-repetition" variant="outline" size="sm">
            <RotateCcw size={16} />
            Ôn câu sai
          </Button>
        }
      />

      <section aria-label="Tóm tắt bài tập" className="grid grid-cols-3 gap-3">
        {[
          { id: "ASSIGNED", label: "Cần làm", icon: Clock3 },
          { id: "COMPLETED", label: "Đã hoàn thành", icon: CheckCircle2 },
          { id: "EXPIRED", label: "Quá hạn", icon: ClipboardList },
        ].map(({ id, label, icon: Icon }) => (
          <Card key={id} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
                <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">
                  {loading ? "–" : (counts[id] ?? 0)}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Icon size={18} strokeWidth={1.75} />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <div role="tablist" className="flex gap-2 overflow-x-auto">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`shrink-0 cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${
              tab === item.id
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-blue-800"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="Chưa có bài nào ở mục này"
          description="Khi gia sư giao bài mới, bài sẽ xuất hiện tại đây."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((quiz) => (
            <QuizCard key={quiz.id} quiz={quiz} />
          ))}
        </div>
      )}
    </div>
  );
}
