import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import clsx from "clsx";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardCheck,
  MessageSquare,
  Play,
  Save,
  Send,
  UserRound,
} from "lucide-react";
import { useLessonSessions } from "../../context/LessonSessionContext";
import { useAuth } from "../../context/AuthContext";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

const STUDENT_ID = "s1";
const EXCEPTION_STATUSES = [
  { value: "rescheduled", label: "Dời lịch" },
  { value: "student_absent", label: "Học sinh vắng" },
  { value: "tutor_absent", label: "Gia sư vắng" },
  { value: "cancelled", label: "Hủy buổi" },
];

const STATUS_META = {
  upcoming: { label: "Sắp học", tone: "blue" },
  live: { label: "Đang học", tone: "amber" },
  completed: { label: "Đã chia sẻ báo cáo", tone: "emerald" },
  reschedule_requested: { label: "Yêu cầu đổi lịch", tone: "amber" },
  rescheduled: { label: "Đã dời lịch", tone: "amber" },
  student_absent: { label: "Học sinh vắng", tone: "rose" },
  tutor_absent: { label: "Gia sư vắng", tone: "rose" },
  cancelled: { label: "Đã hủy", tone: "rose" },
};

const FILTERS = [
  { value: "attention", label: "Cần xử lý" },
  { value: "all", label: "Tất cả" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "exception", label: "Ngoại lệ" },
];

const REPORT_FIELDS = [
  { key: "summary", label: "Nội dung đã học", placeholder: "Ví dụ: Luyện cách viết câu chủ đề trong Writing Task 2...", required: true },
  { key: "achievement", label: "Học sinh làm tốt", placeholder: "Ví dụ: Đã lập được dàn ý rõ ràng...", required: true },
  { key: "difficulty", label: "Điểm còn khó", placeholder: "Nếu không có, có thể để trống" },
  { key: "nextStep", label: "Bước tiếp theo", placeholder: "Ví dụ: Luyện thêm 2 đoạn thân bài trước buổi tới...", required: true },
  { key: "homework", label: "Bài tập sau buổi", placeholder: "Ví dụ: Viết một đoạn thân bài và nộp trước thứ Sáu" },
];

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/50 dark:text-white dark:placeholder:text-slate-500";

function canInteract(session) {
  return ["upcoming", "live", "completed"].includes(session.status);
}

function hasUnansweredQuestion(session) {
  return canInteract(session) && (session.questions ?? []).some((question) => !question.reply?.trim());
}

function isPendingReport(session) {
  return session.status === "completed" && !session.report?.publishedAt;
}

function statusMeta(session) {
  return isPendingReport(session)
    ? { label: "Chờ báo cáo", tone: "amber" }
    : STATUS_META[session.status] ?? { label: "Chưa xác định", tone: "neutral" };
}

function isException(status) {
  return status === "reschedule_requested" || EXCEPTION_STATUSES.some((item) => item.value === status);
}

function needsAttention(session) {
  return session.status === "upcoming" || session.status === "live" || session.status === "reschedule_requested" || isPendingReport(session) || hasUnansweredQuestion(session);
}

function sessionPriority(session) {
  if (session.status === "live") return 0;
  if (session.status === "reschedule_requested") return 1;
  if (isPendingReport(session)) return 2;
  if (session.status === "upcoming") return 3;
  if (hasUnansweredQuestion(session)) return 4;
  if (session.status === "completed") return 5;
  return 6;
}

function compareSessions(a, b) {
  const priority = sessionPriority(a) - sessionPriority(b);
  if (priority !== 0) return priority;
  const dateA = a.fullDate ?? "";
  const dateB = b.fullDate ?? "";
  return a.status === "completed"
    ? dateB.localeCompare(dateA)
    : dateA.localeCompare(dateB);
}

function SessionRow({ session, selected, onSelect }) {
  const status = statusMeta(session);
  const unanswered = canInteract(session)
    ? (session.questions ?? []).filter((question) => !question.reply?.trim()).length
    : 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={clsx(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition-colors sm:p-4",
        selected
          ? "border-blue-300 bg-blue-50/70 dark:border-blue-700 dark:bg-blue-950/30"
          : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-900 dark:hover:bg-slate-800/60"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
        <CalendarDays size={19} strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {session.dayOfWeek ? `${session.dayOfWeek}, ` : ""}{session.dateStr}
          </p>
          <Badge tone={status.tone} size="xs">{status.label}</Badge>
        </div>
        <p className="mt-1 truncate text-sm text-slate-700 dark:text-slate-200">{session.topic}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {session.startTime}–{session.endTime} · {session.tutorName}
        </p>
        {unanswered > 0 && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-300">
            <MessageSquare size={13} />
            {unanswered} câu hỏi chờ trả lời
          </p>
        )}
      </div>
      <ChevronRight size={17} className="mt-3 shrink-0 text-slate-400" />
    </button>
  );
}

function Field({ label, value, onChange, placeholder, rows = 2, required = false }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        {label}{required && <span className="ml-1 text-rose-600 dark:text-rose-400">*</span>}
      </span>
      <textarea
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={clsx(INPUT_CLASS, "resize-y")}
      />
    </label>
  );
}

function DetailLine({ label, value }) {
  return (
    <div className="border-t border-slate-100 py-3 first:border-t-0 first:pt-0 last:pb-0 dark:border-slate-800">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-800 dark:text-slate-200">{value?.trim() || "Chưa ghi nhận"}</p>
    </div>
  );
}

export default function TutorLessonSessions() {
  const [searchParams] = useSearchParams();
  const { session: authSession } = useAuth();
  const { sessions, savePlan, startSession, endSession, completeSession, markException, addTutorReply } = useLessonSessions();
  const [filter, setFilter] = useState(() => searchParams.has("session") ? "all" : "attention");
  const [selectedId, setSelectedId] = useState(() => searchParams.get("session"));
  const [planDrafts, setPlanDrafts] = useState({});
  const [reportDrafts, setReportDrafts] = useState({});
  const [exceptionDrafts, setExceptionDrafts] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [editorModes, setEditorModes] = useState({});
  const [feedback, setFeedback] = useState(null);

  // Older tutor sessions in localStorage have no tutorId; the demo tutor is t1.
  const tutorId = authSession?.role === "tutor" ? authSession.tutorId ?? "t1" : null;
  const studentSessions = useMemo(
    () => sessions.filter((session) => session.studentId === STUDENT_ID && session.tutorId === tutorId).sort(compareSessions),
    [sessions, tutorId]
  );
  const visibleSessions = studentSessions.filter((session) => {
    if (filter === "attention") return needsAttention(session);
    if (filter === "completed") return session.status === "completed";
    if (filter === "exception") return isException(session.status);
    return true;
  });
  const selected = visibleSessions.find((session) => session.id === selectedId) ?? visibleSessions[0];
  const studentName = studentSessions[0]?.studentName ?? "học sinh";
  const totalUnanswered = studentSessions.reduce(
    (count, session) => count + (canInteract(session) ? (session.questions ?? []).filter((question) => !question.reply?.trim()).length : 0),
    0
  );

  function showFeedback(text, error = false) {
    setFeedback({ text, error });
  }

  function updatePlan(key, value) {
    setPlanDrafts((previous) => ({
      ...previous,
      [selected.id]: { ...(previous[selected.id] ?? selected.plan ?? {}), [key]: value },
    }));
  }

  function updateReport(key, value) {
    setReportDrafts((previous) => ({
      ...previous,
      [selected.id]: { ...(previous[selected.id] ?? selected.report ?? {}), [key]: value },
    }));
  }

  function updateException(key, value) {
    setExceptionDrafts((previous) => ({
      ...previous,
      [selected.id]: { ...(previous[selected.id] ?? { status: "rescheduled", reason: "" }), [key]: value },
    }));
  }

  function handleSavePlan(event) {
    event.preventDefault();
    const plan = planDrafts[selected.id] ?? selected.plan ?? {};
    const objective = plan.objective?.trim() ?? "";
    const preparation = plan.preparation?.trim() ?? "";
    if (!objective) {
      showFeedback("Hãy ghi mục tiêu của buổi học trước khi lưu.", true);
      return;
    }
    if (objective === selected.plan?.objective && preparation === selected.plan?.preparation) {
      showFeedback("Nội dung chuẩn bị đã được lưu.");
      return;
    }
    const success = savePlan(selected.id, { objective, preparation });
    showFeedback(
      success
        ? "Đã lưu phần chuẩn bị. Học sinh có thể xem trước buổi học."
        : "Không thể lưu phần chuẩn bị ở trạng thái hiện tại.",
      !success
    );
  }

  function handleStart() {
    const success = startSession(selected.id);
    if (success) setSelectedId(selected.id);
    showFeedback(
      success ? "Đã ghi nhận buổi học bắt đầu." : "Không thể bắt đầu buổi học này.",
      !success
    );
  }

  function handleEnd() {
    const success = endSession(selected.id);
    if (success) setSelectedId(selected.id);
    showFeedback(
      success
        ? "Đã kết thúc buổi học. Báo cáo vẫn cần được cập nhật để học sinh và phụ huynh theo dõi."
        : "Không thể kết thúc buổi học này.",
      !success
    );
  }

  function handleComplete(event) {
    event.preventDefault();
    const draft = reportDrafts[selected.id] ?? selected.report ?? {};
    const report = Object.fromEntries(REPORT_FIELDS.map(({ key }) => [key, draft[key]?.trim() ?? ""]));
    const missing = REPORT_FIELDS.find(({ key, required }) => required && !report[key]);
    if (missing) {
      showFeedback(`Hãy điền mục “${missing.label.toLowerCase()}” trước khi chia sẻ báo cáo.`, true);
      return;
    }
    const success = completeSession(selected.id, report);
    if (success) {
      setSelectedId(selected.id);
      setFilter("all");
    }
    showFeedback(
      success
        ? "Đã chia sẻ báo cáo buổi học cho học sinh và phụ huynh."
        : "Không thể hoàn thành buổi học này. Vui lòng kiểm tra lại thông tin.",
      !success
    );
  }

  function handleException(event) {
    event.preventDefault();
    const draft = exceptionDrafts[selected.id] ?? { status: "rescheduled", reason: "" };
    const reason = draft.reason?.trim() ?? "";
    if (!reason) {
      showFeedback("Hãy ghi lý do để trung tâm và phụ huynh nắm được tình trạng buổi học.", true);
      return;
    }
    const success = markException(selected.id, draft.status, reason);
    if (success) {
      setSelectedId(selected.id);
      setFilter("all");
    }
    showFeedback(
      success ? "Đã ghi nhận trạng thái buổi học và lý do." : "Không thể cập nhật trạng thái buổi học này.",
      !success
    );
  }

  function handleReply(event, questionId) {
    event.preventDefault();
    const draftKey = `${selected.id}:${questionId}`;
    const text = replyDrafts[draftKey]?.trim() ?? "";
    if (!text) {
      showFeedback("Hãy nhập câu trả lời trước khi gửi.", true);
      return;
    }
    const success = addTutorReply(selected.id, questionId, text);
    if (success) {
      setSelectedId(selected.id);
      setReplyDrafts((previous) => ({ ...previous, [draftKey]: "" }));
      setFilter("all");
    }
    showFeedback(success ? "Đã gửi câu trả lời cho học sinh." : "Không thể gửi câu trả lời này.", !success);
  }

  const plan = selected ? planDrafts[selected.id] ?? selected.plan ?? {} : {};
  const report = selected ? reportDrafts[selected.id] ?? selected.report ?? {} : {};
  const exception = selected ? exceptionDrafts[selected.id] ?? { status: "rescheduled", reason: "" } : {};
  const canRecord = selected?.status === "upcoming" || selected?.status === "live";
  const pendingReport = selected ? isPendingReport(selected) : false;
  const canPublish = canRecord || pendingReport;
  const editorMode = pendingReport ? "report" : selected ? editorModes[selected.id] ?? (selected.status === "live" ? "report" : "plan") : "plan";

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 lg:px-8 lg:py-8">
      <PageHeader
        eyebrow="Quản lý học tập"
        title="Buổi học và trao đổi"
        description={`Theo dõi việc học của ${studentName} qua từng buổi, từ chuẩn bị đến phản hồi sau buổi học.`}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Buổi sắp học", count: studentSessions.filter((session) => session.status === "upcoming").length, icon: CalendarDays, color: "blue" },
          { label: "Đang học", count: studentSessions.filter((session) => session.status === "live").length, icon: Play, color: "amber" },
          { label: "Đã kết thúc", count: studentSessions.filter((session) => session.status === "completed").length, icon: CheckCircle2, color: "emerald" },
          { label: "Câu hỏi chờ trả lời", count: totalUnanswered, icon: MessageSquare, color: "blue" },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label} className="p-4">
            <div className={clsx(
              "mb-3 flex h-9 w-9 items-center justify-center rounded-xl",
              color === "amber" ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400" :
                color === "emerald" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" :
                  "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"
            )}>
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <p className="font-mono text-2xl font-bold leading-none text-slate-900 dark:text-white">{count}</p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <section className="min-w-0 space-y-4 lg:col-span-2" aria-label="Danh sách buổi học">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Danh sách buổi học</h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Chọn một buổi để cập nhật và trao đổi.</p>
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Lọc trạng thái buổi học">
            {FILTERS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => { setFilter(item.value); setFeedback(null); }}
                aria-pressed={filter === item.value}
                className={clsx(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === item.value
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
          {visibleSessions.length ? (
            <div className="space-y-2.5">
              {visibleSessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  selected={session.id === selected?.id}
                  onSelect={() => { setSelectedId(session.id); setFeedback(null); }}
                />
              ))}
            </div>
          ) : (
            <Card className="py-10 text-center">
              <BookOpen size={29} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Không có buổi học trong mục này</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Thử chọn trạng thái khác.</p>
            </Card>
          )}
        </section>

        <section className="min-w-0 lg:col-span-3" aria-label="Chi tiết buổi học">
          {!selected ? (
            <Card className="py-12 text-center">
              <CalendarDays size={30} className="mx-auto text-slate-300 dark:text-slate-600" />
              <p className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Chọn một buổi học để xem chi tiết</p>
            </Card>
          ) : (
            <div className="space-y-4">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500">Chi tiết buổi học</p>
                    <h2 className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{selected.topic}</h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selected.subject}</p>
                  </div>
                  <Badge tone={statusMeta(selected).tone}>
                    {statusMeta(selected).label}
                  </Badge>
                </div>
                <div className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-xs text-slate-600 sm:grid-cols-2 dark:border-slate-800 dark:text-slate-300">
                  <span className="inline-flex items-center gap-2"><CalendarDays size={15} className="text-blue-600 dark:text-blue-400" />{selected.dayOfWeek ? `${selected.dayOfWeek}, ` : ""}{selected.dateStr}</span>
                  <span className="inline-flex items-center gap-2"><Clock3 size={15} className="text-blue-600 dark:text-blue-400" />{selected.startTime}–{selected.endTime}</span>
                  <span className="inline-flex items-center gap-2 sm:col-span-2"><UserRound size={15} className="text-blue-600 dark:text-blue-400" />Gia sư {selected.tutorName} · Học sinh {selected.studentName}</span>
                </div>
              </Card>

              {feedback && (
                <div
                  role={feedback.error ? "alert" : "status"}
                  className={clsx(
                    "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
                    feedback.error
                      ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
                  )}
                >
                  {feedback.error ? <AlertCircle size={17} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={17} className="mt-0.5 shrink-0" />}
                  {feedback.text}
                </div>
              )}

              {canRecord && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Thao tác với buổi học">
                  {[
                    { value: "plan", label: "Chuẩn bị", icon: BookOpen },
                    { value: "report", label: "Chốt buổi", icon: ClipboardCheck },
                    { value: "exception", label: "Báo ngoại lệ", icon: AlertCircle },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={editorMode === value}
                      onClick={() => { setEditorModes((previous) => ({ ...previous, [selected.id]: value })); setFeedback(null); }}
                      className={clsx(
                        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
                        editorMode === value
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-700"
                      )}
                    >
                      <Icon size={15} />{label}
                    </button>
                  ))}
                </div>
              )}

              {canRecord && editorMode === "plan" && (
                <Card>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><BookOpen size={18} /></div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Chuẩn bị trước buổi học</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Học sinh xem được mục tiêu và phần cần chuẩn bị.</p>
                    </div>
                  </div>
                  <form onSubmit={handleSavePlan} className="space-y-3">
                    <Field label="Mục tiêu buổi học" value={plan.objective} onChange={(value) => updatePlan("objective", value)} placeholder="Ví dụ: Viết được câu chủ đề rõ ý cho đoạn thân bài" required />
                    <Field label="Tài liệu / phần cần chuẩn bị" value={plan.preparation} onChange={(value) => updatePlan("preparation", value)} placeholder="Ví dụ: Đọc trang 12–14, chuẩn bị 2 câu hỏi" />
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit" variant="outline"><Save size={16} />Lưu chuẩn bị</Button>
                      {selected.status === "upcoming" && <Button type="button" onClick={handleStart}><Play size={16} />Bắt đầu buổi học</Button>}
                    </div>
                  </form>
                </Card>
              )}

              {canPublish && editorMode === "report" && (
                <Card>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><ClipboardCheck size={18} /></div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Ghi nhận sau buổi học</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                        {pendingReport
                          ? "Buổi học đã kết thúc. Hãy chia sẻ kết quả để học sinh và phụ huynh theo dõi."
                          : "Báo cáo ngắn sẽ được chia sẻ cho học sinh và phụ huynh."}
                      </p>
                    </div>
                  </div>
                  <form onSubmit={handleComplete} className="space-y-3">
                    {REPORT_FIELDS.map((field) => (
                      <Field
                        key={field.key}
                        {...field}
                        value={report[field.key]}
                        onChange={(value) => updateReport(field.key, value)}
                      />
                    ))}
                    <div className="flex flex-wrap gap-2">
                      <Button type="submit"><CheckCircle2 size={16} />{pendingReport ? "Chia sẻ báo cáo" : "Hoàn thành và chia sẻ"}</Button>
                      {canRecord && (
                        <Button type="button" variant="outline" onClick={handleEnd}>
                          <Clock3 size={16} />Kết thúc buổi, cập nhật báo cáo sau
                        </Button>
                      )}
                    </div>
                  </form>
                </Card>
              )}

              {selected.status === "completed" && !pendingReport && (
                <Card>
                  <div className="mb-4 flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"><CheckCircle2 size={18} /></div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">Báo cáo sau buổi học</h3>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Học sinh và phụ huynh cùng theo dõi nội dung này.</p>
                    </div>
                  </div>
                  <div>
                    {REPORT_FIELDS.map((field) => <DetailLine key={field.key} label={field.label} value={selected.report[field.key]} />)}
                  </div>
                </Card>
              )}

              {isException(selected.status) && (
                <Card>
                  <div className="flex items-start gap-3">
                    <AlertCircle size={19} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {selected.status === "reschedule_requested" ? "Học sinh yêu cầu đổi lịch" : "Trạng thái buổi học"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{selected.exceptionReason || "Chưa có lý do được ghi nhận."}</p>
                      {selected.status === "reschedule_requested" && (selected.proposedSlots ?? []).length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Khung giờ học sinh đề xuất</p>
                          <ul className="mt-1.5 list-inside list-disc space-y-1 text-sm text-slate-700 dark:text-slate-200">
                            {selected.proposedSlots.map((slot, index) => <li key={`${slot}-${index}`}>{slot}</li>)}
                          </ul>
                        </div>
                      )}
                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        {selected.status === "reschedule_requested"
                          ? "Trung tâm sẽ xác nhận lịch mới. Buổi học chưa được chuyển sang lịch khác."
                          : "Trung tâm có thể theo dõi và hỗ trợ xử lý buổi học này."}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              {canRecord && editorMode === "exception" && (
                <Card>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Buổi học không diễn ra như dự kiến?</h3>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Ghi rõ trạng thái và lý do để trung tâm, phụ huynh cùng nắm được.</p>
                  <form onSubmit={handleException} className="mt-4 space-y-3">
                    <label className="block">
                      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Trạng thái</span>
                      <select value={exception.status} onChange={(event) => updateException("status", event.target.value)} className={INPUT_CLASS}>
                        {EXCEPTION_STATUSES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                      </select>
                    </label>
                    <Field label="Lý do" value={exception.reason} onChange={(value) => updateException("reason", value)} placeholder="Ví dụ: Phụ huynh báo học sinh ốm, cần hẹn lịch khác" required />
                    <Button type="submit" variant="outline"><AlertCircle size={16} />Ghi nhận trạng thái</Button>
                  </form>
                </Card>
              )}

              <Card>
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400"><MessageSquare size={18} /></div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Trao đổi với học sinh</h3>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Câu hỏi và lời giải thích được lưu ngay tại buổi học.</p>
                  </div>
                </div>
                {(selected.questions ?? []).length ? (
                  <div className="space-y-3">
                    {selected.questions.map((question) => {
                      const draftKey = `${selected.id}:${question.id}`;
                      return (
                        <div key={question.id} className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                          <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">Học sinh hỏi</p>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{question.text}</p>
                          {question.reply?.trim() ? (
                            <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
                              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Gia sư trả lời</p>
                              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{question.reply}</p>
                            </div>
                          ) : canInteract(selected) ? (
                            <form onSubmit={(event) => handleReply(event, question.id)} className="mt-3 space-y-2">
                              <label htmlFor={`reply-${question.id}`} className="block text-xs font-semibold text-slate-600 dark:text-slate-300">Trả lời câu hỏi</label>
                              <textarea
                                id={`reply-${question.id}`}
                                rows={2}
                                value={replyDrafts[draftKey] ?? ""}
                                onChange={(event) => setReplyDrafts((previous) => ({ ...previous, [draftKey]: event.target.value }))}
                                placeholder="Giải thích ngắn gọn hoặc hướng dẫn bước tiếp theo..."
                                className={clsx(INPUT_CLASS, "resize-y")}
                              />
                              <Button type="submit" size="sm"><Send size={15} />Gửi trả lời</Button>
                            </form>
                          ) : (
                            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">Trao đổi tạm dừng khi buổi học đang ở trạng thái này.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">Học sinh chưa đặt câu hỏi cho buổi này.</p>
                )}
              </Card>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
