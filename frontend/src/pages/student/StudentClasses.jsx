import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  UserRound,
} from "lucide-react";
import { apiGetMyClasses } from "../../lib/studentApi";
import {
  CLASS_STATUS_META,
  TEACHING_MODE_LABELS,
  dayOfWeekLabel,
  formatSessionDate,
} from "../../lib/classroomApi";
import { useStudentData } from "../../hooks/useStudentData";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import PageHeader from "../../components/ui/PageHeader";
import { EmptyState, ErrorBox, SkeletonRows } from "../../components/student/AsyncBlock";

function weeklySlotLabel(raw) {
  const [day, start, end] = String(raw).split("|");
  return `${dayOfWeekLabel(Number(day))}, ${start}–${end}`;
}

function ClassCard({ item }) {
  const status = CLASS_STATUS_META[item.status] ?? { label: item.status, tone: "slate" };
  return (
    <Card className="group p-0 transition-colors hover:border-blue-300 dark:hover:border-blue-800">
      <Link to={`/student/classes/${item.classId}/overview`} className="block p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
            <GraduationCap size={21} />
          </span>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
          {item.className || "Lớp học tiếng Anh"}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <UserRound size={13} /> Gia sư {item.tutorName}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-y border-slate-100 py-3 dark:border-slate-800">
          {[
            { icon: BookOpen, value: item.lessonCount ?? 0, label: "Bài giảng" },
            { icon: ClipboardCheck, value: item.quizCount ?? 0, label: "Bài tập" },
            { icon: FileText, value: item.materialCount ?? 0, label: "Tài liệu" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="text-center">
              <Icon size={14} className="mx-auto text-slate-400" />
              <p className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">{value}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
          <p>{TEACHING_MODE_LABELS[item.teachingMode] ?? item.teachingMode}</p>
          {item.activeFrom && <p>Bắt đầu từ {formatSessionDate(item.activeFrom)}</p>}
          {item.weeklySlots?.slice(0, 2).map((slot) => (
            <p key={slot} className="flex items-center gap-1.5">
              <CalendarDays size={12} /> {weeklySlotLabel(slot)}
            </p>
          ))}
        </div>

        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition group-hover:gap-2 dark:text-blue-400">
          Vào lớp học <ArrowRight size={14} />
        </span>
      </Link>
    </Card>
  );
}

export default function StudentClasses() {
  const { data, loading, error, retry } = useStudentData((token) => apiGetMyClasses(token), []);
  const classes = Array.isArray(data) ? data : [];

  return (
    <div className="mx-auto min-h-[100dvh] max-w-6xl space-y-6 px-4 py-6 pb-12 lg:px-8 lg:py-8">
      <PageHeader
        className="mb-0"
        eyebrow="Không gian học tập"
        title="Lớp học của tôi"
        description="Mở từng lớp để xem lịch học, bài giảng, bài tập và tài liệu từ gia sư."
      />

      {loading ? (
        <SkeletonRows rows={3} className="h-56" />
      ) : error ? (
        <ErrorBox message={error} onRetry={retry} />
      ) : classes.length === 0 ? (
        <EmptyState
          icon={GraduationCap}
          title="Bạn chưa có lớp học nào"
          description="Lớp sẽ xuất hiện tại đây sau khi quá trình ghép gia sư hoàn tất."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {classes.map((item) => <ClassCard key={item.classId} item={item} />)}
        </div>
      )}
    </div>
  );
}
