import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock,
  ExternalLink,
  GraduationCap,
  Loader2,
  MapPin,
  Pencil,
  Target,
  Video,
  Wallet,
} from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import {
  apiCreateTrialSession,
  apiGetClassDetail,
  apiUpdateTrialSession,
  formatSessionDate,
  mapClassDetail,
} from "../../lib/classroomApi";

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

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

/** Biểu mẫu thiết lập / chỉnh sửa lịch dạy thử (UC-T08). */
function TrialSessionForm({ initial, submitting, serverError, onCancel, onSubmit }) {
  const [sessionDate, setSessionDate] = useState(initial?.sessionDate || "");
  const [startTime, setStartTime] = useState(initial?.startTime || "");
  const [endTime, setEndTime] = useState(initial?.endTime || "");
  const [teachingMode, setTeachingMode] = useState(initial?.teachingMode || "ONLINE");
  const [meetingUrl, setMeetingUrl] = useState(initial?.meetingUrl || "");
  const [location, setLocation] = useState(initial?.location || "");
  const [localError, setLocalError] = useState("");

  const error = localError || serverError;

  const handleSubmit = (event) => {
    event.preventDefault();
    setLocalError("");

    if (!sessionDate || !startTime || !endTime) {
      setLocalError("Vui lòng nhập đầy đủ ngày dạy thử và khung giờ.");
      return;
    }
    if (sessionDate < todayISO()) {
      setLocalError("Ngày dạy thử không được trong quá khứ.");
      return;
    }
    if (startTime >= endTime) {
      setLocalError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }
    if (teachingMode === "ONLINE" && !meetingUrl.trim()) {
      setLocalError("Vui lòng nhập liên kết phòng học cho buổi học online.");
      return;
    }
    if (teachingMode === "AT_HOME" && !location.trim()) {
      setLocalError("Vui lòng xác nhận địa chỉ cho buổi học tại nhà.");
      return;
    }

    onSubmit({
      sessionDate,
      startTime,
      endTime,
      teachingMode,
      meetingUrl: teachingMode === "ONLINE" ? meetingUrl.trim() : null,
      location: teachingMode === "AT_HOME" ? location.trim() : null,
    });
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-medium text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/20">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="trial-date" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Ngày dạy thử <span className="text-rose-500">*</span>
          </label>
          <input
            id="trial-date"
            type="date"
            min={todayISO()}
            value={sessionDate}
            onChange={(event) => setSessionDate(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trial-start" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Giờ bắt đầu <span className="text-rose-500">*</span>
          </label>
          <input
            id="trial-start"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="trial-end" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Giờ kết thúc <span className="text-rose-500">*</span>
          </label>
          <input
            id="trial-end"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-bold text-slate-800 dark:text-slate-200">
          Hình thức học <span className="text-rose-500">*</span>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTeachingMode("ONLINE")}
            className={clsx(
              "flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all",
              teachingMode === "ONLINE"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
            )}
          >
            <Video size={14} /> Online
          </button>
          <button
            type="button"
            onClick={() => setTeachingMode("AT_HOME")}
            className={clsx(
              "flex cursor-pointer items-center gap-1.5 rounded-xl border px-4 py-2 text-xs font-bold transition-all",
              teachingMode === "AT_HOME"
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
            )}
          >
            <MapPin size={14} /> Tại nhà
          </button>
        </div>
      </div>

      {teachingMode === "ONLINE" ? (
        <div>
          <label htmlFor="trial-meeting-url" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Liên kết phòng học (Zoom / Google Meet) <span className="text-rose-500">*</span>
          </label>
          <input
            id="trial-meeting-url"
            type="url"
            value={meetingUrl}
            onChange={(event) => setMeetingUrl(event.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className={inputClass}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="trial-location" className="mb-1 block text-xs font-bold text-slate-800 dark:text-slate-200">
            Địa chỉ nhà học sinh <span className="text-rose-500">*</span>
          </label>
          <input
            id="trial-location"
            type="text"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="Số nhà, đường, quận/huyện, tỉnh/thành phố"
            className={inputClass}
          />
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-[11px] italic text-slate-500 dark:text-slate-400">
        Hệ thống sẽ kiểm tra trùng ca dạy của bạn và đẩy ca [Học thử] lên thời khóa biểu.
      </p>

      <div className="flex items-center justify-end gap-2 border-t border-blue-100 pt-2 dark:border-blue-950/60">
        <Button
          variant="outline"
          size="sm"
          type="button"
          onClick={onCancel}
          className="cursor-pointer text-xs font-semibold"
        >
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={submitting}
          className="cursor-pointer bg-blue-600 px-5 text-xs font-bold text-white hover:bg-blue-700"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
          {submitting ? "Đang lưu..." : "Lưu lịch dạy thử"}
        </Button>
      </div>
    </form>
  );
}

export default function TutorClassDetail() {
  const { classId } = useParams();
  const { token } = useAuth();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const loadDetail = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetClassDetail(token, classId);
      setDetail(mapClassDetail(result));
    } catch (err) {
      setError(err.message || "Không thể tải chi tiết lớp học.");
    } finally {
      setLoading(false);
    }
  }, [token, classId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const canEditTrial =
    detail && detail.status === "TRIAL" && detail.trialSession?.status === "SCHEDULED";

  const openCreateForm = () => {
    setFormError("");
    setShowForm(true);
  };

  const openEditForm = () => {
    setFormError("");
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setFormError("");
  };

  const handleSubmitTrial = async (payload) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setFormError("");
    try {
      if (detail.trialSession) {
        await apiUpdateTrialSession(token, classId, payload);
        setToast({ type: "success", message: "Đã cập nhật lịch dạy thử thành công." });
      } else {
        await apiCreateTrialSession(token, classId, payload);
        setToast({
          type: "success",
          message: `Đã thiết lập lịch dạy thử thành công cho ngày ${formatSessionDate(payload.sessionDate)}.`,
        });
      }
      setShowForm(false);
      loadDetail();
    } catch (err) {
      setFormError(err.message || "Không thể lưu lịch dạy thử.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Lớp học của tôi" title="Chi tiết lớp học" />
        <Card className="space-y-4 border-slate-200/80 p-5 dark:border-slate-800">
          <div className="h-6 w-2/3 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
            <div className="h-16 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          </div>
          <div className="h-32 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Lớp học của tôi" title="Chi tiết lớp học" />
        <Card className="space-y-3 border-slate-200/80 py-12 text-center dark:border-slate-800">
          <AlertCircle size={32} className="mx-auto text-rose-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{error}</p>
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDetail}
              className="cursor-pointer text-xs font-semibold"
            >
              Thử lại
            </Button>
            <Link
              to="/tutor/classes"
              className="inline-flex items-center rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              Về danh sách lớp
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={clsx(
            "fixed right-5 top-5 z-50 flex max-w-md items-center gap-3 rounded-xl px-4 py-3.5 text-white shadow-2xl",
            toast.type === "error" ? "bg-rose-600" : "bg-blue-600",
          )}
        >
          {toast.type === "error" ? (
            <AlertCircle size={20} className="shrink-0" />
          ) : (
            <CheckCircle2 size={20} className="shrink-0" />
          )}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      <div>
        <Link
          to="/tutor/classes"
          className="group mb-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition-colors hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
        >
          <ArrowLeft size={14} className="transition group-hover:-translate-x-0.5" strokeWidth={1.75} />
          Lớp học của tôi
        </Link>
        <PageHeader
          eyebrow="Chi tiết lớp học"
          title={detail.className}
          description={`Học viên: ${detail.studentName || "Đang cập nhật"}`}
          actions={<Badge tone={detail.statusTone}>{detail.statusLabel}</Badge>}
        />
      </div>

      {/* Thông tin chung lớp học */}
      <Card className="border-slate-200/80 dark:border-slate-800">
        <div className="mb-3 flex items-center gap-2">
          <GraduationCap size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Thông tin lớp học</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {canEditTrial && !showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={openEditForm}
              className="cursor-pointer text-xs font-semibold"
            >
              <Pencil size={13} /> Chỉnh sửa lịch dạy thử
            </Button>
          )}
        </div>

        {showForm ? (
          <TrialSessionForm
            initial={
              detail.trialSession
                ? {
                    sessionDate: detail.trialSession.sessionDate,
                    startTime: detail.trialSession.startTime?.slice(0, 5) || "",
                    endTime: detail.trialSession.endTime?.slice(0, 5) || "",
                    teachingMode: detail.trialSession.teachingMode || detail.teachingMode || "ONLINE",
                    meetingUrl: detail.trialSession.meetingUrl || "",
                    location: detail.trialSession.location || "",
                  }
                : { teachingMode: detail.teachingMode || "ONLINE" }
            }
            submitting={submitting}
            serverError={formError}
            onCancel={closeForm}
            onSubmit={handleSubmitTrial}
          />
        ) : detail.trialSession ? (
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
              onClick={openCreateForm}
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
