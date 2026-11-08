import { useOutletContext } from "react-router-dom";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  GraduationCap,
  MapPin,
  Target,
  UserRound,
  Video,
  Wallet,
} from "lucide-react";
import {
  CLASS_STATUS_META,
  TEACHING_MODE_LABELS,
  dayOfWeekLabel,
  formatSessionDate,
  formatSessionTime,
} from "../../lib/classroomApi";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";

function Info({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon size={14} />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function StudentClassOverview() {
  const { detail } = useOutletContext();
  const status = CLASS_STATUS_META[detail.status] ?? { label: detail.status, tone: "slate" };
  const fee = detail.pricePerSession
    ? `${Number(detail.pricePerSession).toLocaleString("vi-VN")} ₫/buổi`
    : "Thỏa thuận";

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <Badge tone="slate">{TEACHING_MODE_LABELS[detail.teachingMode] ?? detail.teachingMode}</Badge>
        </div>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{detail.className}</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Không gian học tập cùng gia sư {detail.tutorName}.
        </p>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Thống kê lớp học">
        {[
          { icon: CalendarDays, value: detail.completedSessions, label: "Buổi đã học" },
          { icon: BookOpen, value: detail.lessonCount, label: "Bài giảng" },
          { icon: ClipboardCheck, value: detail.quizCount, label: "Bài tập" },
          { icon: FileText, value: detail.materialCount, label: "Tài liệu" },
        ].map(({ icon: Icon, value, label }) => (
          <Card key={label} className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-mono text-2xl font-bold text-slate-900 dark:text-white">{value ?? 0}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <Icon size={18} />
              </span>
            </div>
          </Card>
        ))}
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Thông tin lớp học</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Info icon={UserRound} label="Gia sư" value={detail.tutorName} />
            <Info icon={detail.teachingMode === "ONLINE" ? Video : MapPin} label="Hình thức" value={TEACHING_MODE_LABELS[detail.teachingMode]} />
            <Info icon={Wallet} label="Học phí" value={fee} />
            <Info icon={CalendarDays} label="Ngày bắt đầu" value={detail.activeFrom ? formatSessionDate(detail.activeFrom) : "Chưa cập nhật"} />
            <Info icon={GraduationCap} label="Trường" value={detail.school} />
            <Info icon={Target} label="Mục tiêu học tập" value={detail.learningGoal} />
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-4 text-base font-semibold text-slate-900 dark:text-white">Lịch học cố định</h2>
          {detail.schedules?.length ? (
            <div className="space-y-2">
              {detail.schedules.map((slot, index) => (
                <div key={`${slot.dayOfWeek}-${slot.startTime}-${index}`} className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 dark:border-blue-900 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">{dayOfWeekLabel(slot.dayOfWeek)}</p>
                    <Badge tone="blue">{formatSessionTime(slot.startTime)}–{formatSessionTime(slot.endTime)}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : detail.trialSession ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Buổi học thử</p>
              <p className="mt-1 font-mono text-xs text-amber-700 dark:text-amber-400">
                {formatSessionDate(detail.trialSession.sessionDate)} · {formatSessionTime(detail.trialSession.startTime)}–{formatSessionTime(detail.trialSession.endTime)}
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Gia sư chưa thiết lập lịch cố định.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
