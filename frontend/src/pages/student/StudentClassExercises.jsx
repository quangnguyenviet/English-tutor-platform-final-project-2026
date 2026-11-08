import { Link, useOutletContext } from "react-router-dom";
import { useMemo, useState } from "react";
import { ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Clock3 } from "lucide-react";
import { apiGetMyQuizzes } from "../../lib/studentApi";
import { QUIZ_STATUS_META, deadlineInfo, quizProgressPercent, sortQuizzesByDeadline } from "../../lib/studentModel";
import { formatSessionDate } from "../../lib/classroomApi";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import ProgressBar from "../../components/ui/ProgressBar";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

const TABS = [
  { id: "ASSIGNED", label: "Cần làm", icon: Clock3 },
  { id: "COMPLETED", label: "Đã hoàn thành", icon: CheckCircle2 },
  { id: "EXPIRED", label: "Quá hạn", icon: ClipboardList },
];

export default function StudentClassExercises() {
  const { classId, detail } = useOutletContext();
  const [tab, setTab] = useState("ASSIGNED");
  const { data, loading, error, retry } = useStudentData((token) => apiGetMyQuizzes(token, null, classId), [classId]);
  const quizzes = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const visible = useMemo(() => sortQuizzesByDeadline(quizzes.filter((quiz) => quiz.status === tab)), [quizzes, tab]);

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{detail.className}</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bài tập</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Làm bài được giao và theo dõi tiến độ theo từng bài giảng.</p>
      </div>

      <div role="tablist" className="flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const count = quizzes.filter((quiz) => quiz.status === id).length;
          return <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.98] ${tab === id ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-800"}`}><Icon size={15} />{label}<span className="font-mono text-xs opacity-80">{count}</span></button>;
        })}
      </div>

      {loading ? <SkeletonRows rows={3} /> : error ? <ErrorBox message={error} onRetry={retry} /> : visible.length === 0 ? (
        <EmptyState icon={ClipboardList} title="Chưa có bài nào ở mục này" description="Bài tập gia sư giao cho lớp sẽ xuất hiện tại đây." />
      ) : (
        <div className="space-y-3">
          {visible.map((quiz) => {
            const status = QUIZ_STATUS_META[quiz.status] ?? { label: quiz.status, tone: "slate" };
            const deadline = deadlineInfo(quiz.deadline);
            const total = quiz.totalQuestions ?? 0;
            const answered = quiz.answeredCount ?? 0;
            return (
              <Card key={quiz.id} className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2"><Badge tone={status.tone}>{status.label}</Badge>{quiz.sessionTitle && <Badge tone="slate">{quiz.sessionTitle}</Badge>}</div>
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white">{quiz.title}</h2>
                    <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><CalendarClock size={14} />{quiz.deadline ? `Hạn ${formatSessionDate(String(quiz.deadline).slice(0, 10))} · ${deadline.label}` : "Không có hạn nộp"}</p>
                    {total > 0 && <div className="max-w-xs space-y-1"><ProgressBar value={quizProgressPercent(answered, total)} /><p className="font-mono text-[11px] text-slate-500 dark:text-slate-400">{answered}/{total} câu</p></div>}
                  </div>
                  {quiz.status === "ASSIGNED" ? <Button as={Link} to={`/student/exercises/${quiz.id}`} size="sm">{answered ? "Làm tiếp" : "Bắt đầu làm"}<ArrowRight size={15} /></Button> : quiz.status === "COMPLETED" ? <Button as={Link} to={`/student/exercises/${quiz.id}`} variant="outline" size="sm">Xem kết quả</Button> : null}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
