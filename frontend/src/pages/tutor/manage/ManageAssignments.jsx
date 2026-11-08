import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  CalendarClock,
  CheckCircle2,
  FileQuestion,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { apiGetClassLessons } from "../../../lib/classroomApi";
import {
  QUIZ_STATUS_META,
  apiGetLessonQuizzes,
  formatDeadlineLabel,
} from "../../../lib/quizApi";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { ErrorBox, SkeletonRows } from "../../../components/student/AsyncBlock";

const TABS = [
  { id: "assigned", label: "Đã giao", icon: CalendarClock },
  { id: "draft", label: "Bản nháp", icon: Pencil },
  { id: "completed", label: "Đã hoàn thành", icon: CheckCircle2 },
];

function inTab(quiz, tab) {
  if (tab === "assigned") return quiz.status === "ASSIGNED" || quiz.status === "EXPIRED";
  if (tab === "draft") return quiz.status === "DRAFT";
  return quiz.status === "COMPLETED";
}

export default function ManageAssignments({ token, classId, basePath }) {
  const [tab, setTab] = useState("assigned");
  const [quizzes, setQuizzes] = useState([]);
  const [lessonCount, setLessonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [partialError, setPartialError] = useState("");

  const load = useCallback(async () => {
    if (!token || !classId) return;
    setLoading(true);
    setError("");
    setPartialError("");
    try {
      const lessonResult = await apiGetClassLessons(token, classId);
      const lessons = Array.isArray(lessonResult) ? lessonResult : [];
      setLessonCount(lessons.length);
      const results = await Promise.allSettled(
        lessons.map(async (lesson) => {
          const items = await apiGetLessonQuizzes(token, lesson.lessonId);
          return (Array.isArray(items) ? items : []).map((quiz) => ({
            ...quiz,
            lessonId: lesson.lessonId,
            lessonTitle: lesson.title || `Bài giảng ${lesson.lessonNumber || ""}`.trim(),
          }));
        }),
      );
      const failed = results.filter((result) => result.status === "rejected").length;
      const loaded = results
        .filter((result) => result.status === "fulfilled")
        .flatMap((result) => result.value)
        .sort((left, right) => Number(right.quizId) - Number(left.quizId));
      setQuizzes(loaded);
      if (failed) setPartialError(`Không tải được bài tập của ${failed} bài giảng.`);
    } catch (loadError) {
      setError(loadError.message || "Không thể tải danh sách bài tập.");
      setQuizzes([]);
      setLessonCount(0);
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => quizzes.filter((quiz) => inTab(quiz, tab)), [quizzes, tab]);
  const countFor = (tabId) => quizzes.filter((quiz) => inTab(quiz, tabId)).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bài tập</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Quiz được lưu theo bài giảng và giao trực tiếp cho học sinh của lớp.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Làm mới
          </Button>
          <Button as={Link} to={`${basePath}/exercises/add`} size="sm">
            <Plus size={14} /> Thêm bài tập
          </Button>
        </div>
      </div>

      {partialError && (
        <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400">
          {partialError}
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800" role="tablist">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === id
                ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            <Icon size={15} /> {label}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs dark:bg-slate-800">{countFor(id)}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <SkeletonRows rows={3} />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : lessonCount === 0 ? (
        <Card className="py-12 text-center">
          <BookOpen size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <h2 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Lớp chưa có bài giảng</h2>
          <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
            Mỗi bài tập cần thuộc một bài giảng. Chọn “Thêm bài tập” để tạo bài giảng đầu tiên và bắt đầu soạn quiz.
          </p>
          <Button as={Link} to={`${basePath}/exercises/add`} size="sm" className="mt-4"><Plus size={14} /> Thêm bài tập</Button>
        </Card>
      ) : visible.length === 0 ? (
        <Card className="py-12 text-center">
          <FileQuestion size={32} className="mx-auto text-slate-300 dark:text-slate-600" />
          <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Chưa có bài tập trong mục này</p>
        </Card>
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {visible.map((quiz) => {
              const status = QUIZ_STATUS_META[quiz.status] || { label: quiz.status, tone: "slate" };
              const href = `${basePath}/lessons/quiz/${quiz.lessonId}?quizId=${quiz.quizId}&from=exercises`;
              return (
                <div key={quiz.quizId} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={href} className="text-sm font-semibold text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400">{quiz.title}</Link>
                      <Badge tone={status.tone}>{status.label}</Badge>
                    </div>
                    <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><BookOpen size={13} />{quiz.lessonTitle}</p>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span>{quiz.totalQuestions ?? 0} câu hỏi</span>
                      <span>{quiz.deadline ? `Hạn ${formatDeadlineLabel(quiz.deadline)}` : "Chưa đặt hạn"}</span>
                    </div>
                  </div>
                  <Button as={Link} to={href} variant="outline" size="sm">{quiz.status === "DRAFT" ? "Tiếp tục soạn" : "Xem chi tiết"}</Button>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
