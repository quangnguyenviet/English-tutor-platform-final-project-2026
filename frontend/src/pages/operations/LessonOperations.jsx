import { useState } from "react";
import {
  AlertCircle,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Phone,
} from "lucide-react";
import { useLessonSessions } from "../../context/LessonSessionContext";
import { getStudentById } from "../../data/mockData";
import { LESSON_DEMO_REFERENCE_TIME } from "../../lib/lessonSessionModel";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";

const EXCEPTION_STATUSES = new Set([
  "reschedule_requested",
  "rescheduled",
  "student_absent",
  "tutor_absent",
  "cancelled",
]);

const STATUS_LABELS = {
  reschedule_requested: "Chờ chốt lịch mới",
  rescheduled: "Đổi lịch chưa chốt",
  student_absent: "Học sinh vắng",
  tutor_absent: "Gia sư vắng",
  cancelled: "Đã hủy",
};

const DATE_INPUT_CLASS = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white";

const demoReferenceDate = new Date(LESSON_DEMO_REFERENCE_TIME).toLocaleDateString("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

function SummaryCard({ icon: Icon, label, value, tone }) {
  const color = {
    blue: "text-blue-600 dark:text-blue-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    rose: "text-rose-600 dark:text-rose-400",
  }[tone];

  return (
    <Card className="flex items-start justify-between gap-3 p-4">
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
        <p className="mt-1 font-mono text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
      </div>
      <Icon size={19} className={color} strokeWidth={1.75} />
    </Card>
  );
}

function RescheduleApproval({ item, onConfirm }) {
  const [fullDate, setFullDate] = useState("");
  const [startTime, setStartTime] = useState(item.startTime || "");
  const [endTime, setEndTime] = useState(item.endTime || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const success = onConfirm(item.id, { fullDate, startTime, endTime });
    if (!success) {
      setError("Không thể chốt lịch. Hãy chọn ngày và giờ hợp lệ, khác với lịch cũ.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-blue-100 bg-blue-50/60 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
      <div className="flex items-start gap-2">
        <CalendarClock size={17} className="mt-0.5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Chốt lịch thay thế</h4>
          <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">
            Trung tâm xác nhận sau khi thống nhất với gia sư và phụ huynh. Lịch mới sẽ hiện ở các màn học tập.
          </p>
        </div>
      </div>

      {item.proposedSlots?.length > 0 && (
        <div className="mt-3 rounded-xl bg-white/80 p-3 text-xs text-slate-600 dark:bg-slate-900/50 dark:text-slate-300">
          <p className="font-semibold text-slate-800 dark:text-slate-100">Khung giờ học sinh đề xuất</p>
          {item.proposedSlots.map((slot, index) => (
            <p key={`${item.id}-slot-${index}`} className="mt-1 whitespace-pre-wrap">{slot}</p>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Ngày học mới
          <input
            type="date"
            required
            value={fullDate}
            onChange={(event) => { setFullDate(event.target.value); setError(""); }}
            className={`mt-1.5 ${DATE_INPUT_CLASS}`}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Bắt đầu
          <input
            type="time"
            required
            value={startTime}
            onChange={(event) => { setStartTime(event.target.value); setError(""); }}
            className={`mt-1.5 ${DATE_INPUT_CLASS}`}
          />
        </label>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Kết thúc
          <input
            type="time"
            required
            value={endTime}
            onChange={(event) => { setEndTime(event.target.value); setError(""); }}
            className={`mt-1.5 ${DATE_INPUT_CLASS}`}
          />
        </label>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="mt-4 flex justify-end">
        <Button type="submit" size="sm" className="font-semibold">Xác nhận lịch mới</Button>
      </div>
    </form>
  );
}

export default function LessonOperations() {
  const { sessions, confirmReschedule } = useLessonSessions();
  const [notice, setNotice] = useState("");
  const completed = sessions.filter((item) => item.status === "completed");
  const reportPending = completed.filter((item) => !item.report?.publishedAt);
  const exceptions = sessions.filter((item) => EXCEPTION_STATUSES.has(item.status));
  const reschedulePending = exceptions.filter((item) => ["reschedule_requested", "rescheduled"].includes(item.status));
  const unanswered = sessions.filter((item) =>
    (item.questions || []).some((question) => !question.reply)
  );
  const attention = [
    ...reschedulePending.map((item) => ({ item, label: STATUS_LABELS[item.status], tone: "amber" })),
    ...reportPending.map((item) => ({ item, label: "Chưa có ghi nhận sau buổi", tone: "amber" })),
    ...exceptions.filter((item) => !reschedulePending.includes(item)).map((item) => ({ item, label: STATUS_LABELS[item.status], tone: "rose" })),
    ...unanswered.map((item) => ({ item, label: "Học sinh chờ trả lời", tone: "blue" })),
  ];

  const handleConfirmReschedule = (id, nextSlot) => {
    const success = confirmReschedule(id, nextSlot);
    if (success) {
      setNotice("Đã chốt lịch mới. Học sinh, gia sư và phụ huynh có thể xem thời gian cập nhật.");
    }
    return success;
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        className="mb-0"
        eyebrow="Vận hành lớp học"
        title="Theo dõi buổi học"
        description="Nắm các buổi đã diễn ra và những trường hợp trung tâm cần theo sát."
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Mốc dữ liệu mô phỏng: {demoReferenceDate}. Thay đổi trong bản demo được lưu trên trình duyệt này.
      </p>
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" /> {notice}
        </div>
      )}

      <section aria-label="Tổng quan vận hành" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard icon={BookOpenCheck} label="Buổi đã học" value={completed.length} tone="emerald" />
        <SummaryCard icon={Clock3} label="Chờ gia sư cập nhật" value={reportPending.length} tone="amber" />
        <SummaryCard icon={AlertCircle} label="Đổi lịch, vắng hoặc hủy" value={exceptions.length} tone="rose" />
        <SummaryCard icon={HelpCircle} label="Có câu hỏi chờ trả lời" value={unanswered.length} tone="blue" />
      </section>

      <section aria-labelledby="lesson-attention-heading" className="space-y-3">
        <div>
          <h2 id="lesson-attention-heading" className="text-base font-bold text-slate-900 dark:text-white">
            Cần theo dõi
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            Mỗi dòng gắn với một buổi học cụ thể, giúp trung tâm biết cần liên hệ ai và chốt lịch ở đâu.
          </p>
        </div>

        <Card padded={false} className="overflow-hidden">
          {attention.length ? (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {attention.map(({ item, label, tone }) => {
                const student = getStudentById(item.studentId);
                const needsReschedule = ["reschedule_requested", "rescheduled"].includes(item.status)
                  && label === STATUS_LABELS[item.status];
                return (
                  <article key={`${item.id}-${label}`} className="space-y-4 p-4 sm:p-5">
                    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={tone} size="xs">{label}</Badge>
                          <span className="font-mono text-[11px] text-slate-400">
                            {item.dayOfWeek} {item.dateStr} · {item.startTime}–{item.endTime}
                          </span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">{item.topic}</h3>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {student?.name || "Học sinh"} · Gia sư {item.tutorName}
                        </p>
                        {(item.exceptionReason || item.rescheduleRequest?.reason) && (
                          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                            Lý do: {item.exceptionReason || item.rescheduleRequest.reason}
                          </p>
                        )}
                      </div>
                      {student?.parentPhone && (
                        <a href={`tel:${student.parentPhone.replace(/\s+/g, "")}`} className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                          <Phone size={14} /> Liên hệ phụ huynh
                        </a>
                      )}
                    </div>
                    {needsReschedule && <RescheduleApproval item={item} onConfirm={handleConfirmReschedule} />}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center px-5 py-12 text-center">
              <CheckCircle2 size={27} className="text-emerald-500" />
              <h3 className="mt-3 text-sm font-semibold text-slate-800 dark:text-slate-200">Không có buổi cần xử lý</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Các buổi đã học đều được ghi nhận và không có câu hỏi đang chờ.</p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
