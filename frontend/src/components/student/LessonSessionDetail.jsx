import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  HelpCircle,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLessonSessions } from "../../context/LessonSessionContext";
import Badge from "../ui/Badge";
import Button from "../ui/Button";
import Card from "../ui/Card";

const STATUS = {
  upcoming: { label: "Sắp diễn ra", tone: "blue" },
  confirmed: { label: "Đã xác nhận", tone: "blue" },
  live: { label: "Đang diễn ra", tone: "amber" },
  completed: { label: "Đã hoàn thành", tone: "emerald" },
  reschedule_requested: { label: "Chờ trung tâm xác nhận lịch mới", tone: "amber" },
  rescheduled: { label: "Đã đổi lịch", tone: "amber" },
  student_absent: { label: "Học sinh vắng", tone: "rose" },
  tutor_absent: { label: "Gia sư vắng", tone: "rose" },
  cancelled: { label: "Đã hủy", tone: "rose" },
};

export default function LessonSessionDetail({ sessionId, onClose }) {
  const { session } = useAuth();
  const { sessions, addStudentQuestion } = useLessonSessions();
  const lesson = sessions.find((item) => item.id === sessionId && item.studentId === session?.studentId);
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!lesson) return null;

  const report = lesson.report;
  const hasReport = lesson.status === "completed" && Boolean(report?.publishedAt);
  const status = STATUS[lesson.status] || STATUS.upcoming;
  const questions = lesson.questions || [];
  const canAsk = ["upcoming", "live", "completed"].includes(lesson.status);

  function handleAsk(event) {
    event.preventDefault();
    const content = question.trim();
    if (!content) return;
    try {
      const success = addStudentQuestion(lesson.id, content);
      if (!success) {
        setError("Buổi học này không nhận câu hỏi mới. Hãy tải lại trang và kiểm tra trạng thái.");
        return;
      }
      setQuestion("");
      setError("");
    } catch (caught) {
      setError(caught.message || "Chưa gửi được câu hỏi. Vui lòng thử lại.");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-detail-title"
        className="flex max-h-[90dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 p-5 dark:border-slate-800">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge tone={status.tone}>{status.label}</Badge>
              <span className="text-xs text-slate-500 dark:text-slate-400">{lesson.tutorName}</span>
            </div>
            <h2 id="lesson-detail-title" className="text-lg font-bold text-slate-900 dark:text-white">
              {lesson.topic}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {lesson.dayOfWeek} {lesson.dateStr}</span>
              <span className="inline-flex items-center gap-1"><Clock3 size={13} /> {lesson.startTime}–{lesson.endTime}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng chi tiết buổi học" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-white">
            <X size={19} />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto p-5">
          {lesson.status === "reschedule_requested" && (
            <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">Đang chờ trung tâm xác nhận lịch mới</h3>
              <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Lý do: {lesson.exceptionReason || "Chưa ghi lý do"}</p>
              {(lesson.proposedSlots || []).length > 0 && <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">Giờ đề xuất: {lesson.proposedSlots.join(" · ")}</p>}
            </Card>
          )}
          {lesson.rescheduledFrom && lesson.status === "upcoming" && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Buổi này đã được trung tâm đổi từ {lesson.rescheduledFrom.dateStr} ({lesson.rescheduledFrom.startTime}–{lesson.rescheduledFrom.endTime}).</p>
          )}
          {(lesson.plan?.objective || lesson.plan?.preparation) && (
            <Card className="bg-slate-50 p-4 dark:bg-slate-800/50">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                <BookOpen size={16} className="text-blue-500" /> Chuẩn bị trước buổi học
              </h3>
              {lesson.plan.objective && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300"><strong>Mục tiêu:</strong> {lesson.plan.objective}</p>}
              {lesson.plan.preparation && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300"><strong>Cần chuẩn bị:</strong> {lesson.plan.preparation}</p>}
            </Card>
          )}

          {hasReport ? (
            <section aria-labelledby="lesson-report-title" className="space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                <h3 id="lesson-report-title" className="text-sm font-bold text-slate-900 dark:text-white">Ghi nhận từ gia sư</h3>
              </div>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["Đã học", report.summary],
                  ["Làm tốt", report.achievement],
                  ["Cần cải thiện", report.difficulty],
                  ["Bước tiếp theo", report.nextStep],
                ].filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</dt>
                    <dd className="mt-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">{value}</dd>
                  </div>
                ))}
              </dl>
              {report.homework && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Bài cần làm</p>
                  <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{report.homework}</p>
                  <Link to={`/student/exercises?tutor=${lesson.tutorId}`} onClick={onClose} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400">
                    Xem bài tập <ArrowRight size={12} />
                  </Link>
                </div>
              )}
            </section>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {lesson.status === "completed" ? "Đang chờ gia sư cập nhật tóm tắt" : "Tóm tắt sẽ có sau buổi học"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Bạn vẫn có thể gửi câu hỏi cho gia sư ngay tại đây.</p>
            </div>
          )}

          {lesson.endOfSessionQuiz?.id && (
            <Link to={`/student/exercises/${lesson.endOfSessionQuiz.id}`} onClick={onClose} className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs font-semibold text-slate-800 hover:border-blue-300 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-800">
              <span>Quiz cuối buổi: {lesson.endOfSessionQuiz.title}</span>
              <ArrowRight size={15} className="shrink-0 text-blue-600 dark:text-blue-400" />
            </Link>
          )}

          <section aria-labelledby="lesson-questions-title" className="space-y-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <h3 id="lesson-questions-title" className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <MessageCircle size={17} className="text-blue-500" /> Trao đổi với gia sư
            </h3>
            {questions.length ? (
              <div className="space-y-2">
                {questions.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Bạn hỏi: {item.text}</p>
                    {item.reply ? (
                      <p className="mt-2 rounded-lg bg-blue-50 p-2 text-xs text-blue-800 dark:bg-blue-950/40 dark:text-blue-200">Gia sư trả lời: {item.reply}</p>
                    ) : (
                      <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400"><HelpCircle size={12} /> Đang chờ gia sư trả lời</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Chưa có câu hỏi nào cho buổi học này.</p>
            )}
            {canAsk ? (
              <form onSubmit={handleAsk} className="space-y-2">
                <label htmlFor="lesson-question" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">Bạn còn chỗ nào chưa hiểu?</label>
                <textarea id="lesson-question" value={question} onChange={(event) => setQuestion(event.target.value)} rows={2} maxLength={500} placeholder="Viết câu hỏi để gia sư giải thích thêm..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
                {error && <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
                <Button type="submit" size="sm" disabled={!question.trim()}><Send size={14} /> Gửi câu hỏi</Button>
              </form>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">Buổi học đã đổi lịch, hủy hoặc ghi nhận vắng; không thể gửi câu hỏi mới tại đây.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
