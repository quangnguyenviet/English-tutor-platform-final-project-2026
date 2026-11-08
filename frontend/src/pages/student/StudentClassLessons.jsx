import { Link, useOutletContext } from "react-router-dom";
import { BookOpen, CalendarDays, FileText, NotebookPen } from "lucide-react";
import { apiGetMyClassLessons } from "../../lib/studentApi";
import { formatSessionDate } from "../../lib/classroomApi";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

export default function StudentClassLessons() {
  const { classId, detail, basePath } = useOutletContext();
  const { data, loading, error, retry } = useStudentData((token) => apiGetMyClassLessons(token, classId), [classId]);
  const lessons = Array.isArray(data) ? data : [];

  return (
    <div className="space-y-5">
      <div>
        <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">{detail.className}</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Bài giảng</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Các bài giảng gia sư đã công bố cho lớp.</p>
      </div>

      {loading ? <SkeletonRows rows={3} /> : error ? <ErrorBox message={error} onRetry={retry} /> : lessons.length === 0 ? (
        <EmptyState icon={BookOpen} title="Chưa có bài giảng" description="Bài giảng sẽ xuất hiện sau khi gia sư công bố." />
      ) : (
        <div className="space-y-3">
          {lessons.map((lesson) => (
            <Card key={lesson.lessonId} className="p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">{lesson.lessonNumber}</span>
                  <div className="min-w-0">
                    <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title}</h2>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400"><CalendarDays size={13} />Công bố {formatSessionDate(String(lesson.createdAt).slice(0, 10))}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone="slate"><FileText size={12} />{lesson.materialCount} tài liệu</Badge>
                      <Badge tone="blue"><NotebookPen size={12} />{lesson.quizCount} bài tập</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {lesson.materialCount > 0 && <Button as={Link} to={`${basePath}/materials`} variant="outline" size="sm">Tài liệu</Button>}
                  {lesson.quizCount > 0 && <Button as={Link} to={`${basePath}/exercises`} size="sm">Bài tập</Button>}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
