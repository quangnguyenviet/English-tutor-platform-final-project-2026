import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Loader2,
  NotebookText,
  Pencil,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import Button from "../ui/Button";
import Card from "../ui/Card";
import ConfirmModal from "../ui/ConfirmModal";
import ExceptionForm from "./ExceptionForm";
import clsx from "clsx";
import { useAuth } from "../../context/AuthContext";
import {
  EXCEPTION_TYPE_META,
  apiCreateException,
  apiDeleteException,
  apiDeleteTeachingLog,
  apiGetClassSchedule,
  apiGetTeachingLog,
  apiSaveTeachingLog,
  dayOfWeekLabel,
  formatSessionDate,
  formatSessionTime,
  todayISO,
} from "../../lib/classroomApi";
import { startOfWeek, toISO } from "./FixedScheduleGrid";

const MODAL_TITLES = {
  CANCELLED: "Hủy buổi học này",
  RESCHEDULED: "Dời buổi học này",
  MODIFIED: "Sửa chi tiết buổi học",
};

/** 7 ngày (Thứ 2 → Chủ nhật) của tuần có mốc weekStart. */
function weekDays(weekStartISO) {
  const first = startOfWeek(weekStartISO);
  const today = todayISO();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(first);
    date.setDate(first.getDate() + index);
    const iso = toISO(date);
    const isoDay = date.getDay() || 7;
    return {
      iso,
      label: dayOfWeekLabel(isoDay),
      shortDate: formatSessionDate(iso).slice(0, 5),
      dayNumber: String(iso.slice(8, 10)),
      isToday: iso === today,
    };
  });
}

/** Nền chip sự kiện theo tone trạng thái (kiểu Google Calendar: nền nhạt + viền trái đậm). */
const TONE_SURFACE = {
  blue: "border-l-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-100",
  amber: "border-l-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  emerald: "border-l-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100",
  rose: "border-l-rose-500 bg-rose-50 text-rose-900 dark:bg-rose-950/40 dark:text-rose-100",
  sky: "border-l-sky-500 bg-sky-50 text-sky-900 dark:bg-sky-950/40 dark:text-sky-100",
  slate: "border-l-slate-400 bg-slate-50 text-slate-800 dark:bg-slate-800/40 dark:text-slate-200",
};

/**
 * Lưới tuần kiểu Google Calendar (thiết kế /tutor/schedule): 7 cột ngày,
 * mỗi sự kiện là 1 chip đặt theo giờ. V16: chip render theo source
 * OCCURRENCE / EXCEPTION / TRIAL từ API thật, kèm overlay nhật ký dạy học
 * (TeachingLogMini trên ô — chấm "Đã có nhật ký"). Nhật ký dạy học ghi / sửa /
 * xóa trong modal riêng ("ghi nhật ký"), không còn tạo buổi học on-demand.
 * Dưới lg: fallback danh sách dọc theo ngày (mobile không có trục giờ).
 */
export default function ClassScheduleLattice({
  classId,
  weekStart,
  onWeekStartChange,
  teachingMode = "ONLINE",
  onChanged,
  refreshKey = 0,
  sessionDates = [],
}) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState(null); // cell đang mở modal chi tiết + nút thao tác
  const [modal, setModal] = useState(null); // { slot, exceptionType }
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null); // occurrence cần gỡ exception
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // ---------------- Nhật ký dạy học (overlay trên ô ca, V16)
  const [logCell, setLogCell] = useState(null); // { date, startTime, endTime, occurrenceKey }
  const [logForm, setLogForm] = useState({ knowledge: "", homework: "" });
  const [logLoading, setLogLoading] = useState(false);
  const [logSaving, setLogSaving] = useState(false);
  const [logDeleting, setLogDeleting] = useState(false);
  const [logError, setLogError] = useState("");

  const load = useCallback(async () => {
    if (!token || !classId || !weekStart) return;
    setLoading(true);
    setError("");
    try {
      const result = await apiGetClassSchedule(token, classId, weekStart);
      setData(result);
    } catch (err) {
      setError(err.message || "Không thể tải lịch dạy tuần.");
    } finally {
      setLoading(false);
    }
  }, [token, classId, weekStart]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const inWeekDates = useMemo(() => new Set(days.map((day) => day.iso)), [days]);
  const occurrencesByDate = useMemo(() => {
    const map = new Map();
    for (const occ of data?.occurrences || []) {
      if (!map.has(occ.date)) map.set(occ.date, []);
      map.get(occ.date).push(occ);
    }
    return map;
  }, [data]);

  /**
   * Chip "dời sang" (RESCHEDULED) có ngày đích nằm trong tuần đang xem: gom theo
   * ngày đích để render chip nét đứt trên cột ngày mới; ô gốc hạ xuống dòng ghost
   * (gỡ exception đặt ở chip ngày mới, dùng cùng payload scheduleId + date gốc).
   */
  const movedOccurrencesByDate = useMemo(() => {
    const map = new Map();
    for (const occ of data?.occurrences || []) {
      const exc = occ.source === "EXCEPTION" ? occ.exception : null;
      if (!exc || exc.type !== "RESCHEDULED" || !exc.newDate) continue;
      if (!inWeekDates.has(exc.newDate)) continue;
      if (!map.has(exc.newDate)) map.set(exc.newDate, []);
      map.get(exc.newDate).push(occ);
    }
    return map;
  }, [data, inWeekDates]);

  const handleShiftWeek = (direction) => {
    const next = startOfWeek(weekStart);
    next.setDate(next.getDate() + direction * 7);
    onWeekStartChange(toISO(next));
  };

  const handleGoToday = () => {
    onWeekStartChange(toISO(startOfWeek(todayISO())));
  };

  // Mở modal chi tiết cell (nút thao tác) cho 1 occurrence bất kỳ.
  const openDetail = (occ) => {
    setDetail(occ);
  };

  const closeDetail = () => {
    setDetail(null);
  };

  // Mở form ngoại lệ (Hủy / Dời / Sửa chi tiết) — gọi từ nút trong modal cell.
  const openExceptionModal = (occ, exceptionType) => {
    setDetail(null);
    setModalError("");
    setModal({ slot: occ, exceptionType });
  };

  const closeExceptionModal = () => {
    setModal(null);
    setModalError("");
  };

  // ---------- Modal "ghi nhật ký" (kiến thức + dặn dò) cho 1 ô ca ----------

  /**
   * Vạch ô "thực tế diễn ra" để khóa log (log_date, start_time, end_time):
   * - OCCURRENCE / TRIAL: theo ô gốc (occ.date, occ.startTime, occ.endTime).
   * - EXCEPTION RESCHEDULED: theo ngày/giờ MỚI (ca đã dời sang đó; backend chặn
   *   ghi log tại ca gốc nên phải key ở ca mới).
   * - EXCEPTION MODIFIED: ca vẫn ở ca gốc (đổi hình thức, không đổi giờ) → key ca gốc.
   * - EXCEPTION CANCELLED: ca không diễn ra → không ghi được log (trả null).
   */
  const logTargetFor = (occ) => {
    if (occ.source === "EXCEPTION" && occ.exception) {
      const exc = occ.exception;
      if (exc.type === "RESCHEDULED") {
        if (!exc.newDate || !exc.newStartTime || !exc.newEndTime) return null;
        return {
          date: exc.newDate,
          startTime: formatSessionTime(exc.newStartTime),
          endTime: formatSessionTime(exc.newEndTime),
        };
      }
      if (exc.type === "MODIFIED") {
        return {
          date: occ.date,
          startTime: formatSessionTime(occ.startTime),
          endTime: formatSessionTime(occ.endTime),
        };
      }
      return null; // CANCELLED — ca không diễn ra, không ghi nhật ký
    }
    // OCCURRENCE / TRIAL
    return {
      date: occ.date,
      startTime: formatSessionTime(occ.startTime),
      endTime: formatSessionTime(occ.endTime),
    };
  };

  /** Ô nào được phép ghi nhật ký (có đủ chìa khóa log). */
  const canLogCell = (occ) => logTargetFor(occ) != null;

  const openLogModal = async (occ) => {
    const target = logTargetFor(occ);
    if (!target) return;
    setDetail(null);
    setLogCell({
      date: target.date,
      startTime: target.startTime,
      endTime: target.endTime,
      occurrenceKey: occ.occurrenceKey,
      trial: Boolean(occ.trial),
    });
    setLogForm({ knowledge: "", homework: "" });
    setLogError("");
    setLogLoading(true);
    try {
      const raw = await apiGetTeachingLog(token, classId, target.date, target.startTime);
      if (raw) {
        setLogForm({
          knowledge: raw.knowledge || "",
          homework: raw.homework || "",
        });
      }
    } catch {
      // Chưa có log thì để trống; lỗi API hiện khi lưu.
    } finally {
      setLogLoading(false);
    }
  };

  const closeLogModal = () => {
    setLogCell(null);
    setLogError("");
  };

  const handleSaveLog = async () => {
    if (!token || !logCell || logSaving) return;
    const knowledge = logForm.knowledge.trim();
    const homework = logForm.homework.trim();
    if (!knowledge && !homework) {
      setLogError("Vui lòng nhập ít nhất một nội dung (kiến thức hoặc dặn dò).");
      return;
    }
    setLogSaving(true);
    setLogError("");
    try {
      await apiSaveTeachingLog(token, classId, {
        logDate: logCell.date,
        startTime: logCell.startTime,
        endTime: logCell.endTime,
        knowledge: knowledge || null,
        homework: homework || null,
      });
      closeLogModal();
      onChanged?.();
    } catch (err) {
      setLogError(err.message || "Không thể lưu nhật ký dạy học.");
    } finally {
      setLogSaving(false);
    }
  };

  const askDeleteLog = async () => {
    if (!token || !logCell || logDeleting) return;
    setLogDeleting(true);
    setLogError("");
    try {
      const raw = await apiGetTeachingLog(
        token,
        classId,
        logCell.date,
        logCell.startTime,
      );
      if (raw?.logId) {
        await apiDeleteTeachingLog(token, classId, raw.logId);
        closeLogModal();
        onChanged?.();
      }
    } catch (err) {
      setLogError(err.message || "Không thể xóa nhật ký dạy học.");
    } finally {
      setLogDeleting(false);
    }
  };

  // Đóng modal cell / modal exception bằng ESC.
  useEffect(() => {
    if (!modal && !detail) return;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      closeExceptionModal();
      closeDetail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, detail]);

  const handleCreateException = async (payload) => {
    if (!token || submitting) return;
    setSubmitting(true);
    setModalError("");
    try {
      await apiCreateException(token, classId, payload);
      closeExceptionModal();
      onChanged?.();
    } catch (err) {
      setModalError(err.message || "Không thể lưu thay đổi.");
    } finally {
      setSubmitting(false);
    }
  };

  const askDeleteException = (occ) => {
    setDeleteError("");
    setDeleteTarget(occ);
  };

  const handleDeleteException = async () => {
    if (!token || !deleteTarget || deleting) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await apiDeleteException(
        token,
        classId,
        deleteTarget.scheduleId,
        deleteTarget.date,
      );
      setDeleteTarget(null);
      onChanged?.();
    } catch (err) {
      setDeleteError(err.message || "Không thể đặt lại ca.");
    } finally {
      setDeleting(false);
    }
  };

  /** Tone viền trái cho chip theo nguồn dữ liệu V16 (OCCURRENCE | EXCEPTION | TRIAL). */
  const chipToneFor = (occ) => {
    if (occ.source === "TRIAL") return "rose";
    if (occ.source === "EXCEPTION") {
      const exc = occ.exception || {};
      if (exc.type === "CANCELLED") return "rose";
      if (exc.type === "RESCHEDULED") return "amber";
      return "sky";
    }
    // OCCURRENCE — ca cố định; chấm xanh lục nếu đã có nhật ký.
    return occ.log ? "emerald" : "slate";
  };

  /** Bấm chip bất kỳ → mở modal thao tác ô: ô có thể ghi nhật ký hiện nút
   *  "ghi nhật ký"; ô bị hủy/dời/sửa chi tiết hiện thao tác ngoại lệ. */
  const goOpenCell = (occ) => {
    closeDetail();
    openDetail(occ);
  };

  /**
   * Chip sự kiện đồng nhất: khung giờ + chấm nhật ký nếu ô đã có log
   * (TeachingLogMini từ API). Nhật ký dạy học = overlay trên ô ca.
   */
  const renderDayChip = (occ) => {
    const tone = chipToneFor(occ);
    return (
      <button
        key={occ.occurrenceKey}
        type="button"
        onClick={() => goOpenCell(occ)}
        className={clsx(
          "block w-full cursor-pointer rounded-lg border border-l-4 px-2 py-1.5 text-left transition-all active:scale-[0.99]",
          TONE_SURFACE[tone],
        )}
      >
        <div className="flex items-center justify-between gap-1">
          <p className="font-mono text-[11px] font-semibold">
            {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
          </p>
          {occ.log ? (
            <NotebookText
              size={11}
              className="shrink-0 text-emerald-600 dark:text-emerald-400"
              aria-label="Đã có nhật ký"
              title="Đã có nhật ký"
            />
          ) : occ.trial ? (
            <span className="text-[10px] font-medium">Buổi dạy thử</span>
          ) : null}
        </div>
      </button>
    );
  };

  /** Nhãn ngắn cho nguồn dữ liệu của 1 occurrence (dùng làm tiêu đề modal). */
  const sourceLabelFor = (occ) => {
    if (occ.source === "TRIAL") return "Ca dạy thử";
    if (occ.source === "EXCEPTION") {
      const meta = EXCEPTION_TYPE_META[occ.exception?.type] || {};
      return meta.label || "Ca cố định";
    }
    return "Ca cố định";
  };

  const hasLogContent = Boolean(logForm.knowledge.trim() || logForm.homework.trim());

  return (
    <Card className="border-slate-200/80 dark:border-slate-800">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-blue-600 dark:text-blue-400" />
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Lịch dạy tuần
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleShiftWeek(-1)}
            aria-label="Tuần trước"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronLeft size={14} />
          </button>
          <p className="min-w-[120px] text-center font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
            {formatSessionDate(days[0].iso)} - {formatSessionDate(days[6].iso)}
          </p>
          <button
            type="button"
            onClick={() => handleShiftWeek(1)}
            aria-label="Tuần sau"
            className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 active:scale-[0.98] dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <ChevronRight size={14} />
          </button>
          <button
            type="button"
            onClick={handleGoToday}
            className={clsx(
              "cursor-pointer rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors active:scale-[0.98]",
              weekStart === toISO(startOfWeek(todayISO()))
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800",
            )}
          >
            Hôm nay
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className="h-[110px] animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <div>
            <p>{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-1.5 cursor-pointer font-bold underline underline-offset-2"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-4 lg:grid-cols-7 lg:gap-3">
          {/* ===== 7 ô ngày (1 ô/1 ngày), trong ô hiện chip giờ ca ===== */}
          {days.map((day) => {
            // "Dời sang" có đích nằm trong tuần đang xem: ẩn chip trên cột ngày gốc
            // (đã dời thật), chỉ hiện chip amber trên cột ngày đích.
            const hiddenInWeek = (occ) =>
              occ.source === "EXCEPTION" &&
              occ.exception?.type === "RESCHEDULED" &&
              inWeekDates.has(occ.exception?.newDate);
            const dayOccurrences = (occurrencesByDate.get(day.iso) || []).filter(
              (occ) => !hiddenInWeek(occ),
            );
            const dayMovedTargets = movedOccurrencesByDate.get(day.iso) || [];
            const dayLogDates = sessionDates.includes(day.iso);
            return (
              <div
                key={day.iso}
                className={clsx(
                  "flex flex-col rounded-xl border p-2",
                  day.isToday
                    ? "border-blue-300 bg-blue-50/50 dark:border-blue-800/60 dark:bg-blue-950/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40",
                )}
              >
                {/* Header ngày: vòng tròn số kiểu Google Calendar */}
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className={clsx(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-xs font-bold",
                      day.isToday
                        ? "bg-blue-600 text-white"
                        : "text-slate-800 dark:text-slate-200",
                    )}
                  >
                    {day.dayNumber}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={clsx(
                        "text-[11px] font-medium leading-tight",
                        day.isToday
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {day.label}
                    </p>
                    <p className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                      {day.shortDate}
                    </p>
                  </div>
                </div>

                {/* Chip sự kiện trong ô */}
                <div className="flex-1 space-y-1.5">
                  {dayOccurrences.length ? (
                    dayOccurrences.map(renderDayChip)
                  ) : dayMovedTargets.length ? null : dayLogDates ? (
                    <p className="rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1.5 text-[10px] font-medium leading-tight text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                      Đã dạy — có nhật ký hôm nay.
                    </p>
                  ) : (
                    <p className="px-1 text-[11px] text-slate-400 dark:text-slate-600">
                      Không có ca dạy
                    </p>
                  )}
                  {/* Chip "dời sang" (đích trong tuần): chip đồng nhất chỉ hiện giờ MỚI,
                      bấm mở modal thao tác của ca gốc (payload gỡ/dời dùng ô gốc). */}
                  {dayMovedTargets.map((occ) => {
                    const exc = occ.exception || {};
                    const newTime =
                      exc.newStartTime && exc.newEndTime
                        ? `${formatSessionTime(exc.newStartTime)} - ${formatSessionTime(exc.newEndTime)}`
                        : `${formatSessionTime(occ.startTime)} - ${formatSessionTime(occ.endTime)}`;
                    return (
                      <button
                        key={`moved-${occ.occurrenceKey}`}
                        type="button"
                        onClick={() => openDetail(occ)}
                        className={clsx(
                          "block w-full cursor-pointer rounded-lg border border-l-4 px-2 py-1.5 text-left transition-all active:scale-[0.99]",
                          TONE_SURFACE.amber,
                        )}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-mono text-[11px] font-semibold">{newTime}</p>
                          {occ.log ? (
                            <NotebookText size={11} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal form exception (overlay 1 ô) — đóng bằng ESC hoặc click backdrop */}
      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeExceptionModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    "flex h-9 w-9 items-center justify-center rounded-full",
                    "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
                    modal.exceptionType === "CANCELLED" &&
                      "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400",
                    modal.exceptionType === "RESCHEDULED" &&
                      "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400",
                  )}
                >
                  {modal.exceptionType === "CANCELLED" ? (
                    <XCircle size={18} />
                  ) : modal.exceptionType === "RESCHEDULED" ? (
                    <ArrowRightLeft size={18} />
                  ) : (
                    <Pencil size={18} />
                  )}
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {MODAL_TITLES[modal.exceptionType] || "Chỉnh sửa lần diễn"}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {formatSessionDate(modal.slot.date)} · ca {formatSessionTime(modal.slot.startTime)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeExceptionModal}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            <ExceptionForm
              key={modal.slot.occurrenceKey}
              slot={modal.slot}
              exceptionType={modal.exceptionType}
              classTeachingMode={teachingMode}
              submitting={submitting}
              serverError={modalError}
              onCancel={closeExceptionModal}
              onSubmit={handleCreateException}
            />
          </div>
        </div>
      )}

      {/* Modal thao tác cell: bấm chip → xem thông tin + nút "ghi nhật ký" / ngoại lệ. */}
      {detail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeDetail}
        >
          <div
            className="w-full max-w-md space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <Clock size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {sourceLabelFor(detail)} · {formatSessionTime(detail.startTime)} -{" "}
                    {formatSessionTime(detail.endTime)}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {formatSessionDate(detail.date)} · {dayOfWeekLabel(detail.dayOfWeek)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeDetail}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bối cảnh theo nguồn: ngoại lệ (lý do / đã dời) hoặc ca có nhật ký. */}
            {detail.source === "EXCEPTION" && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                {(() => {
                  const exc = detail.exception || {};
                  if (exc.type === "CANCELLED") {
                    return exc.reason ? (
                      <p>Đã hủy ca này. Lý do: {exc.reason}</p>
                    ) : (
                      <p>Đã hủy ca này.</p>
                    );
                  }
                  if (exc.type === "RESCHEDULED") {
                    const nt =
                      exc.newStartTime && exc.newEndTime
                        ? `${formatSessionTime(exc.newStartTime)} - ${formatSessionTime(exc.newEndTime)}`
                        : "";
                    return (
                      <p>
                        Đã dời sang {exc.newDate ? formatSessionDate(exc.newDate) : "ngày mới"}
                        {nt ? ` · ${nt}` : ""}.
                      </p>
                    );
                  }
                  return <p>Ca này đã được điều chỉnh chi tiết.</p>;
                })()}
              </div>
            )}
            {detail.log ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-3 text-xs text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                <div className="flex items-center gap-1.5 font-bold">
                  <NotebookText size={13} /> Đã có nhật ký dạy học
                </div>
                {detail.log.knowledge ? <p className="mt-1 line-clamp-2">{detail.log.knowledge}</p> : null}
                {detail.log.homework ? (
                  <p className="mt-1 line-clamp-2 text-emerald-700/80 dark:text-emerald-400/80">
                    Dặn dò: {detail.log.homework}
                  </p>
                ) : null}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                {detail.trial
                  ? "Ca dạy thử của lớp. Sau khi kết thúc, ghi nhật ký dạy học để học sinh và phụ huynh xem được."
                  : "Ca dạy cố định. Sau buổi học, ghi nhật ký (kiến thức + dặn dò) để học sinh và phụ huynh xem được."}
              </div>
            )}

            {/* Danh sách nút thao tác theo nguồn dữ liệu. */}
            <div className="space-y-2">
              {canLogCell(detail) && (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => openLogModal(detail)}
                  className="w-full cursor-pointer justify-center text-xs font-bold"
                >
                  <NotebookText size={14} />
                  {detail.log ? "Xem / sửa nhật ký" : "Ghi nhật ký"}
                </Button>
              )}
              {(detail.source === "OCCURRENCE" || detail.source === "EXCEPTION") && (
                <div className="grid grid-cols-3 gap-2">
                  {detail.source === "EXCEPTION" && (
                    <Button
                      variant="danger"
                      size="sm"
                      type="button"
                      onClick={() => askDeleteException(detail)}
                      className="cursor-pointer text-xs font-bold"
                    >
                      <Eraser size={14} /> Đặt lại ca
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => openExceptionModal(detail, "RESCHEDULED")}
                    className="cursor-pointer text-xs font-bold"
                  >
                    <ArrowRightLeft size={14} /> Dời ca
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    type="button"
                    onClick={() => openExceptionModal(detail, "MODIFIED")}
                    className="cursor-pointer text-xs font-bold"
                  >
                    <Pencil size={14} /> Sửa chi tiết
                  </Button>
                  {detail.source === "OCCURRENCE" && (
                    <Button
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => openExceptionModal(detail, "CANCELLED")}
                      className="col-span-3 cursor-pointer text-xs font-bold"
                    >
                      <XCircle size={14} /> Hủy ca này
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal "ghi nhật ký" (kiến thức + dặn dò) cho 1 ô ca. */}
      {logCell && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={closeLogModal}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                  <BookOpen size={18} />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                    {logCell.trial ? "Nhật ký ca dạy thử" : "Nhật ký dạy học"}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {formatSessionDate(logCell.date)} · {logCell.startTime} - {logCell.endTime}
                  </p>
                </div>
              </div>
              <button
                onClick={closeLogModal}
                className="cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                aria-label="Đóng"
              >
                <X size={18} />
              </button>
            </div>

            {logError && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
                <div className="flex-1">{logError}</div>
                <button
                  type="button"
                  onClick={() => setLogError("")}
                  className="cursor-pointer text-rose-400 hover:text-rose-600"
                  aria-label="Đóng thông báo lỗi"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {logLoading ? (
              <div className="flex items-center justify-center gap-2 py-6 text-xs font-medium text-slate-500 dark:text-slate-400">
                <Loader2 size={14} className="animate-spin" /> Đang tải nhật ký...
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="log-knowledge"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Kiến thức đã hoàn thành trong buổi học
                  </label>
                  <textarea
                    id="log-knowledge"
                    rows={3}
                    value={logForm.knowledge}
                    onChange={(e) => setLogForm((f) => ({ ...f, knowledge: e.target.value }))}
                    placeholder="Nhập chi tiết ngữ pháp, từ vựng và bài tập đã giảng trong buổi..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="log-homework"
                    className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Dặn dò về nhà &amp; bài tập cần nộp
                  </label>
                  <textarea
                    id="log-homework"
                    rows={3}
                    value={logForm.homework}
                    onChange={(e) => setLogForm((f) => ({ ...f, homework: e.target.value }))}
                    placeholder="Ghi rõ bài tập cần làm, thời hạn nộp và yêu cầu luyện tập..."
                    className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {hasLogContent ? (
                <Button
                  variant="danger"
                  size="sm"
                  type="button"
                  onClick={askDeleteLog}
                  disabled={logDeleting}
                  className="cursor-pointer text-xs font-bold"
                >
                  {logDeleting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Xóa nhật ký
                </Button>
              ) : (
                <span />
              )}
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={closeLogModal} type="button">
                  Hủy
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveLog}
                  disabled={logSaving || logLoading}
                  className="cursor-pointer"
                >
                  {logSaving ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )}
                  {logSaving ? "Đang lưu..." : "Lưu nhật ký"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Xác nhận đặt lại ca về lịch cố định */}
      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Đặt lại ca về lịch cố định?"
        message={
          deleteTarget
            ? `Ca ${formatSessionTime(deleteTarget.startTime)} - ${formatSessionTime(
                deleteTarget.endTime,
              )} ngày ${formatSessionDate(deleteTarget.date)} sẽ quay về lịch cố định như ban đầu. Bạn có chắc không?`
            : ""
        }
        confirmLabel="Đặt lại ca"
        confirmTone="rose"
        icon={Eraser}
        onConfirm={handleDeleteException}
        onCancel={() => setDeleteTarget(null)}
      />
      {deleteError && deleteTarget && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xl">
          <AlertCircle size={14} />
          <span>{deleteError}</span>
        </div>
      )}
      {deleting && (
        <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-2xl">
          <Loader2 size={14} className="animate-spin" /> Đang đặt lại ca...
        </div>
      )}
    </Card>
  );
}
