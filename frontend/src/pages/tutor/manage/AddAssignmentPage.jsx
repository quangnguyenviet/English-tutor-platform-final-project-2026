import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import { ArrowLeft, BookOpen, CheckCircle2, Plus } from "lucide-react";
import {
  LESSON_STATUS_META,
  apiCreateLesson,
  apiGetClassLessons,
  formatSessionDate,
} from "../../../lib/classroomApi";
import Badge from "../../../components/ui/Badge";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import PageHeader from "../../../components/ui/PageHeader";
import { ErrorBox, SkeletonRows } from "../../../components/student/AsyncBlock";

const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

export default function AddAssignmentPage() {
  const navigate = useNavigate();
  const { token, classId, basePath, detail } = useOutletContext();
  const [lessons, setLessons] = useState([]);
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token || !classId) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetClassLessons(token, classId);
      const items = Array.isArray(result) ? result : [];
      setLessons(items);
      setSelectedLessonId((current) => current || String(items[0]?.lessonId || ""));
    } catch (loadError) {
      setError(loadError.message || "Không thể tải danh sách bài giảng.");
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    load();
  }, [load]);

  function continueWithLesson() {
    if (!selectedLessonId) {
      setError("Vui lòng chọn một bài giảng để gắn bài tập.");
      return;
    }
    navigate(`${basePath}/lessons/quiz/${selectedLessonId}?from=exercises`);
  }

  async function createLessonAndContinue(event) {
    event.preventDefault();
    const title = newLessonTitle.trim();
    if (!title) {
      setError("Vui lòng nhập tên bài giảng mới.");
      return;
    }
    setCreating(true);
    setError("");
    try {
      const created = await apiCreateLesson(token, classId, { title });
      navigate(`${basePath}/lessons/quiz/${created.lessonId}?from=exercises`);
    } catch (createError) {
      setError(createError.message || "Không thể tạo bài giảng.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <Link to={`${basePath}/exercises`} className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
        <ArrowLeft size={16} /> Quay lại bài tập
      </Link>

      <PageHeader
        eyebrow={detail?.className || "Lớp học"}
        title="Thêm bài tập mới"
        description="Chọn bài giảng chứa bài tập. Sau đó bạn sẽ soạn câu hỏi và giao quiz cho học sinh."
      />

      {error && <ErrorBox message={error} onRetry={loading ? undefined : load} />}

      {loading ? (
        <SkeletonRows rows={3} />
      ) : (
        <div className="grid items-start gap-5 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><BookOpen size={19} /></span>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white">Chọn bài giảng có sẵn</h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Quiz sẽ xuất hiện trong bài giảng này và tab Bài tập của lớp.</p>
              </div>
            </div>

            {lessons.length ? (
              <div className="space-y-2">
                {lessons.map((lesson) => {
                  const selected = String(lesson.lessonId) === selectedLessonId;
                  const status = LESSON_STATUS_META[lesson.status] || { label: lesson.status, tone: "slate" };
                  return (
                    <button
                      key={lesson.lessonId}
                      type="button"
                      onClick={() => setSelectedLessonId(String(lesson.lessonId))}
                      className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-3.5 text-left transition ${selected ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/10 dark:border-blue-700 dark:bg-blue-950/30" : "border-slate-200 hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-800"}`}
                    >
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300 dark:border-slate-700"}`}>{selected && <CheckCircle2 size={13} />}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2"><p className="text-sm font-semibold text-slate-900 dark:text-white">{lesson.title || "Bài giảng chưa đặt tên"}</p><Badge tone={status.tone}>{status.label}</Badge></div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bài giảng {lesson.lessonNumber || "—"}{lesson.createdAt ? ` · ${formatSessionDate(String(lesson.createdAt).slice(0, 10))}` : ""}</p>
                      </div>
                    </button>
                  );
                })}
                <div className="flex justify-end pt-3"><Button type="button" onClick={continueWithLesson}>Tiếp tục soạn bài tập</Button></div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <BookOpen size={28} className="mx-auto text-slate-300 dark:text-slate-600" />
                <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Lớp chưa có bài giảng</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Tạo một bài giảng ở khung bên cạnh để tiếp tục.</p>
              </div>
            )}
          </Card>

          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><Plus size={19} /></span>
              <div><h2 className="text-base font-semibold text-slate-900 dark:text-white">Tạo bài giảng mới</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Dùng khi bài tập chưa thuộc bài giảng nào.</p></div>
            </div>
            <form onSubmit={createLessonAndContinue} className="space-y-3">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300">Tên bài giảng</span><input value={newLessonTitle} onChange={(event) => setNewLessonTitle(event.target.value)} placeholder="Ví dụ: Ôn tập thì hiện tại đơn" maxLength={200} className={inputClass} /></label>
              <Button type="submit" variant="outline" disabled={creating || !newLessonTitle.trim()} className="w-full justify-center">{creating ? "Đang tạo..." : <><Plus size={14} /> Tạo và tiếp tục</>}</Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
