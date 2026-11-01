import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRightLeft,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eraser,
  Loader2,
  Pencil,
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
  apiGetClassSchedule,
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
 * Lưới tuần kiểu Google Calendar (thiết kế /tutor/schedule): cột giờ bên trái
 * (06:00–22:00), 7 cột ngày, mỗi sự kiện là 1 chip đặt đúng vị trí giờ trên trục.
 * Sự kiện render theo source SESSION / EXCEPTION / OCCURRENCE từ API thật.
 * Dưới lg: fallback danh sách dọc theo ngày (mobile không có trục giờ).
 */
export default function ClassScheduleLattice({
  classId,
  weekStart,
  onWeekStartChange,
  teachingMode = "ONLINE",
  onCreateSession,
  creatingSessionDate = null,
  createError = "",
  onSelectSession,
  selectedSessionId = null,
  onChanged,
  refreshKey = 0,
  sessionDates = [],
  createErrorDate = null,
}) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [detail, setDetail] = useState(null); // cell đang mở modal chi tiết + nút thao tác
  const [modal, setModal] = useState(null); // { slot, exceptionType }
  const [modalError, setModalError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [creatingFromModal, setCreatingFromModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null); // occurrence cần gỡ exception
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  // Tạo buổi học on-demand từ modal cell + tự chọn buổi mới để mở chi tiết.
  const handleCreateFromModal = async () => {
    if (!detail || creatingFromModal) return;
    setCreatingFromModal(true);
    try {
      const result = await onCreateSession?.(
        detail.date,
        formatSessionTime(detail.startTime),
        detail.dateLabel,
      );
      setDetail(null);
      if (result != null) onSelectSession?.(result);
    } finally {
      setCreatingFromModal(false);
    }
  };

  // Đóng modal cell / modal exception bằng ESC.
  useEffect(() => {
    if (!modal && !detail) return;
    const onKey = (event) => {
      if (event.key !== "Escape") return;
      closeExceptionModal();
      setDetail(null);
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

  /** Tone viền trái cho chip theo nguồn dữ liệu — giữ 1 thiết kế đồng nhất, chỉ đổi màu cạnh. */
  const chipToneFor = (occ) => {
    if (occ.source === "SESSION") return "emerald";
    if (occ.source === "TRIAL_SESSION") return "rose";
    if (occ.source === "EXCEPTION") {
      const exc = occ.exception || {};
      if (exc.type === "CANCELLED") return "rose";
      if (exc.type === "RESCHEDULED") return "amber";
      return "sky";
    }
    return "slate"; // OCCURRENCE — ca cố định chưa có buổi thật
  };

  /**
   * Chip sự kiện đồng nhất: chỉ hiện khung giờ, bấm → mở modal thao tác.
   * Không hover-mở rộng, không kebab — mọi hành động gom trong modal.
   */
  const renderDayChip = (occ) => {
    const session = occ.session || {};
    const isSelected =
      selectedSessionId != null && session.sessionId != null && session.sessionId === selectedSessionId;
    const tone = chipToneFor(occ);
    return (
      <button
        key={occ.occurrenceKey}
        type="button"
        onClick={() => openDetail(occ)}
        aria-current={isSelected || undefined}
        className={clsx(
          "block w-full cursor-pointer rounded-lg border border-l-4 px-2 py-1.5 text-left transition-all active:scale-[0.99]",
          TONE_SURFACE[tone],
          isSelected && "ring-2 ring-blue-500/60",
        )}
      >
        <p className="font-mono text-[11px] font-semibold">
          {formatSessionTime(occ.startTime)} - {formatSessionTime(occ.endTime)}
        </p>
      </button>
    );
  };

  /** Nhãn ngắn cho nguồn dữ liệu của 1 occurrence (dùng làm tiêu đề modal). */
  const sourceLabelFor = (occ) => {
    if (occ.source === "SESSION") return "Buổi học";
    if (occ.source === "TRIAL_SESSION") return "Buổi dạy thử";
    if (occ.source === "EXCEPTION") {
      const meta = EXCEPTION_TYPE_META[occ.exception?.type] || {};
      return meta.label || "Ca cố định";
    }
    return "Ca cố định";
  };

  // Ngày chứa buổi học đang được chọn (highlight ô khi chọn từ danh sách).
  const selectedDate = useMemo(() => {
    if (selectedSessionId == null) return null;
    for (const [date, occurrences] of occurrencesByDate.entries()) {
      if (occurrences.some((occ) => occ.session?.sessionId === selectedSessionId)) {
        return date;
      }
    }
    return null;
  }, [selectedSessionId, occurrencesByDate]);

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
          {/* ===== 7 ô ngày (1 ô/1 ngày), trong ô hiện chip giờ buổi học ===== */}
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
            const dayCreateError = createError && createErrorDate === day.iso;
            return (
              <div
                key={day.iso}
                className={clsx(
                  "flex flex-col rounded-xl border p-2",
                  day.isToday
                    ? "border-blue-300 bg-blue-50/50 dark:border-blue-800/60 dark:bg-blue-950/20"
                    : selectedDate === day.iso
                      ? "border-blue-400 bg-blue-50/30 dark:border-blue-700 dark:bg-blue-950/15"
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
                  ) : dayMovedTargets.length ? null : sessionDates.includes(day.iso) ? (
                    <p className="rounded-lg border border-blue-200 bg-blue-50/70 px-2 py-1.5 text-[10px] font-medium leading-tight text-blue-700 dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-300">
                      Có buổi học ngoài ca cố định — xem ở danh sách buổi học.
                    </p>
                  ) : (
                    <p className="px-1 text-[11px] text-slate-400 dark:text-slate-600">
                      Không có ca dạy
                    </p>
                  )}
                  {/* Chip "dời sang" (đích trong tuần): chip đồng nhất chỉ hiện giờ MỚI,
                      bấm mở cùng modal thao tác của ca gốc (payload gỡ/dời dùng ô gốc). */}
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
                        <p className="font-mono text-[11px] font-semibold">{newTime}</p>
                      </button>
                    );
                  })}
                  {dayCreateError && (
                    <div className="flex items-start gap-1.5 rounded-lg border border-rose-200 bg-rose-50 p-2 text-[10px] leading-snug text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
                      <AlertCircle size={11} className="mt-0.5 shrink-0 text-rose-500" />
                      <span>{createError}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createError && !createErrorDate && (
        <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-[11px] text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-300">
          <AlertCircle size={14} className="mt-0.5 shrink-0 text-rose-500" />
          <span>{createError}</span>
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

      {/* Modal thao tác cell: bấm chip → xem thông tin + danh sách nút thao tác. */}
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
                  <p className="text-[11px] text-slate-400">{formatSessionDate(detail.date)}</p>
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

            {/* Bối cảnh theo nguồn: ngoại lệ (lý do / đã dời), ca rỗng (chưa có buổi). */}
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
            {detail.source === "OCCURRENCE" && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/60 p-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800/40 dark:text-slate-300">
                Ca cố định chưa có buổi học. Tạo bài giảng để đính kèm tài liệu, giao bài tập và
                viết nhật ký sau buổi học.
              </div>
            )}

            {/* Danh sách nút thao tác theo nguồn dữ liệu. */}
            <div className="space-y-2">
              {detail.source === "OCCURRENCE" && (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={handleCreateFromModal}
                  disabled={creatingSessionDate !== null || creatingFromModal}
                  className="w-full cursor-pointer justify-center text-xs font-bold"
                >
                  {creatingFromModal ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <CalendarPlus size={14} />
                  )}
                  Tạo bài giảng
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
              {(detail.source === "SESSION" || detail.source === "TRIAL_SESSION") && (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    onSelectSession?.(detail.session?.sessionId);
                    closeDetail();
                  }}
                  className="w-full cursor-pointer justify-center text-xs font-bold"
                >
                  Mở chi tiết buổi học
                </Button>
              )}
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
