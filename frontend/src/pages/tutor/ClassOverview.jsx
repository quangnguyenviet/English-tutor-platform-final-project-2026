import { useOutletContext } from "react-router-dom";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Pencil,
  Target,
  Video,
  Wallet,
} from "lucide-react";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";

function formatFee(value) {
  return value ? `${Number(value).toLocaleString("vi-VN")} ₫/buổi` : "Thỏa thuận";
}

function InfoItem({ icon: Icon, label, value }) {
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

/** Tab Tổng quan của workspace lớp học (UC-T08) — nối API thật. */
export default function ClassOverview() {
  const { detail, openTrialForm } = useOutletContext();

  const canEditTrial = detail.status === "TRIAL" && detail.trialSession?.status === "SCHEDULED";

  const initialFromTrial = () =>
    detail.trialSession
      ? {
          sessionDate: detail.trialSession.sessionDate,
          startTime: detail.trialSession.startTime?.slice(0, 5) || "",
          endTime: detail.trialSession.endTime?.slice(0, 5) || "",
          teachingMode: detail.trialSession.teachingMode || detail.teachingMode || "ONLINE",
          meetingUrl: detail.trialSession.meetingUrl || "",
          location: detail.trialSession.location || "",
        }
      : null;

  return (
    <div className="space-y-6">
      {/* Thông tin chung lớp học */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Thông tin lớp học</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem icon={Wallet} label="Học phí mỗi buổi" value={formatFee(detail.pricePerSession)} />
          <InfoItem
            icon={detail.teachingMode === "ONLINE" ? Video : MapPin}
            label="Hình thức học"
            value={detail.modeLabel}
          />
          <InfoItem icon={Target} label="Mục tiêu học tập" value={detail.learningGoal} />
          <InfoItem
            icon={CalendarDays}
            label="Ngày bắt đầu chính thức"
            value={detail.activeFromLabel}
          />
          <InfoItem icon={GraduationCap} label="Trường" value={detail.school} />
          <InfoItem icon={Target} label="Cấp lớp" value={detail.grade} />
        </div>
      </Card>

      {/* Lịch dạy thử */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Lịch dạy thử</h2>
            {detail.trialSession && (
              <Badge tone={detail.trialSession.statusTone}>{detail.trialSession.statusLabel}</Badge>
            )}
          </div>
          {canEditTrial && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => openTrialForm(initialFromTrial())}
              className="cursor-pointer text-xs font-semibold"
            >
              <Pencil size={13} /> Chỉnh sửa lịch dạy thử
            </Button>
          )}
        </div>

        {detail.trialSession ? (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-violet-200 bg-violet-50/70 p-4 dark:border-violet-900/60 dark:bg-violet-950/30">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                  <CalendarDays size={17} />
                </span>
                <div>
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-300">
                    {detail.trialSession.dateLabel}
                  </p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400">Ngày dạy thử</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                  <Clock size={17} />
                </span>
                <div>
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-300">
                    {detail.trialSession.timeLabel}
                  </p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400">Khung giờ</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300">
                  {detail.trialSession.teachingMode === "ONLINE" ? <Video size={17} /> : <MapPin size={17} />}
                </span>
                <div>
                  <p className="text-xs font-bold text-violet-800 dark:text-violet-300">
                    {detail.trialSession.modeLabel}
                  </p>
                  <p className="text-[11px] text-violet-600 dark:text-violet-400">Hình thức</p>
                </div>
              </div>
            </div>

            {detail.trialSession.teachingMode === "ONLINE" && detail.trialSession.meetingUrl ? (
              <a
                href={detail.trialSession.meetingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300 dark:hover:bg-blue-950/70"
              >
                <Video size={14} /> Vào phòng học online <ExternalLink size={12} />
              </a>
            ) : (
              detail.trialSession.teachingMode === "AT_HOME" &&
              detail.trialSession.location && (
                <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-rose-500" />
                  <span className="text-slate-700 dark:text-slate-300">
                    Địa chỉ nhà học sinh: <strong>{detail.trialSession.location}</strong>
                  </span>
                </div>
              )
            )}
          </div>
        ) : detail.status === "TRIAL" ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 py-10 text-center dark:border-slate-700 dark:bg-slate-900/40">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <CalendarPlus size={22} />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Lớp học đang ở giai đoạn dạy thử
              </p>
              <p className="max-w-md text-xs text-slate-500 dark:text-slate-400">
                Hãy trao đổi với phụ huynh rồi thiết lập ngày, khung giờ và hình thức cho buổi học
                thử duy nhất của lớp.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => openTrialForm(null)}
              className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
            >
              <CalendarPlus size={14} /> Thiết lập lịch dạy thử
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Lớp học này không ở trạng thái dạy thử nên không thể thiết lập lịch dạy thử.
          </p>
        )}
      </Card>
    </div>
  );
}
