import { useState } from "react";
import { AlertCircle, Loader2, MapPin, Video } from "lucide-react";
import Button from "../ui/Button";
import clsx from "clsx";

function todayISO() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * Biểu mẫu thiết lập / chỉnh sửa lịch dạy thử (UC-T08).
 * Dùng chung cho modal tạo mới và chỉnh sửa trong workspace lớp học.
 */
export default function TrialSessionForm({ initial, submitting, serverError, onCancel, onSubmit }) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
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
